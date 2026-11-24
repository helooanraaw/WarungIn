"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/erp/AppShell";
import ReceiptModal, {
  type ReceiptStoreInfo,
  type ReceiptTransactionData,
} from "@/components/erp/ReceiptModal";
import { fmtDateTime, fmtRp, sanitizeWaNumber } from "@/lib/format";
import {
  Check,
  MessageCircle,
  Search,
  ShoppingCart,
  FileText,
} from "lucide-react";

export default function DebtBookPage() {
  const [transactions, setTransactions] = useState<ReceiptTransactionData[]>(
    []
  );
  const [storeInfo, setStoreInfo] = useState<ReceiptStoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"UNPAID" | "PAID" | "ALL">(
    "UNPAID"
  );
  const [search, setSearch] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [selectedTrx, setSelectedTrx] =
    useState<ReceiptTransactionData | null>(null);

  function loadDebts() {
    setLoading(true);
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.transactions)) {
          const kasbonOnly = data.transactions.filter(
            (t: ReceiptTransactionData) =>
              t.payment_method === "KASBON" && t.status === "COMPLETED"
          );
          setTransactions(kasbonOnly);
        }
        if (data.store) {
          setStoreInfo({
            store_name: data.store.store_name,
            category: data.store.category,
            address: data.store.address,
            logo_url: data.store.logo_url,
            whatsapp_number: data.store.whatsapp_number,
            receipt_footer: data.config?.receipt_footer,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDebts();
  }, []);

  async function markDebtPaid(id: string) {
    setMarkingId(id);
    setNotice("");
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_DEBT_PAID" }),
      });
      if (res.ok) {
        setNotice("Catatan kasbon berhasil ditandai sudah lunas.");
        loadDebts();
      }
    } finally {
      setMarkingId(null);
    }
  }

  function buildReminderLink(trx: ReceiptTransactionData): string | null {
    if (!trx.customer_wa || !trx.customer_wa.trim()) return null;
    const phone = sanitizeWaNumber(trx.customer_wa);
    if (!phone) return null;
    const storeName = storeInfo?.store_name || "toko kami";
    const lines = [
      `Halo ${trx.customer_name || "Pelanggan"},`,
      `Izin mengingatkan catatan bon belanja di *${storeName}*:`,
      `No. Nota: ${trx.invoice_code}`,
      `Tanggal: ${fmtDateTime(trx.created_at)}`,
      `Total: *${fmtRp(trx.total_amount)}*`,
      ...(trx.customer_note ? [`Catatan: ${trx.customer_note}`] : []),
      ``,
      `Terima kasih banyak, semoga sehat selalu.`,
    ];
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const unpaidList = transactions.filter((t) => !t.is_debt_paid);
  const paidList = transactions.filter((t) => t.is_debt_paid);
  const unpaidTotal = unpaidList.reduce((s, t) => s + t.total_amount, 0);
  const paidTotal = paidList.reduce((s, t) => s + t.total_amount, 0);

  const filtered = transactions.filter((t) => {
    if (statusFilter === "UNPAID" && t.is_debt_paid) return false;
    if (statusFilter === "PAID" && !t.is_debt_paid) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.customer_name || "").toLowerCase().includes(q) ||
      (t.customer_wa || "").toLowerCase().includes(q) ||
      t.invoice_code.toLowerCase().includes(q) ||
      (t.customer_note || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Buku Kasbon Pelanggan"
        subtitle="Pantau pelanggan yang bayar belakangan, kirim pengingat sopan lewat WhatsApp, dan tandai lunas dalam sekali klik."
        breadcrumb="Buku Kasbon"
        actions={
          <Link
            href="/dashboard/pos"
            className="op-btn op-btn-primary w-full sm:w-auto"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Catat Kasbon di Kasir</span>
          </Link>
        }
      />

      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-[5px] border border-[#b7e4de] bg-[#eefaf8] px-4 py-2.5 text-xs text-[#167a6f]">
          <Check className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* RINGKASAN KASBON */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="op-card col-span-2 p-3.5 sm:col-span-1 sm:p-4">
          <div className="text-xs text-[#5f6f82]">Belum Dilunasi</div>
          <div className="mt-1 text-lg text-[#c0392b] tabular-nums">
            {fmtRp(unpaidTotal)}
          </div>
          <div className="mt-0.5 text-[11px] text-[#5f6f82]">
            {unpaidList.length} nota menunggu pelunasan
          </div>
        </div>

        <div className="op-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Sudah Lunas
          </div>
          <div className="mt-1 text-base text-[#167a6f] tabular-nums sm:text-lg">
            {fmtRp(paidTotal)}
          </div>
          <div className="mt-0.5 text-[11px] text-[#5f6f82]">
            {paidList.length} nota selesai
          </div>
        </div>

        <div className="op-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Total Catatan Bon
          </div>
          <div className="mt-1 text-base text-[#22303c] tabular-nums sm:text-lg">
            {transactions.length} nota
          </div>
          <div className="mt-0.5 text-[11px] text-[#5f6f82]">
            Tercatat dari meja kasir
          </div>
        </div>
      </div>

      {/* FILTER & CARI */}
      <div className="op-card mb-4 p-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: "UNPAID", label: `Belum Lunas (${unpaidList.length})` },
                { key: "PAID", label: `Sudah Lunas (${paidList.length})` },
                { key: "ALL", label: `Semua (${transactions.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-[6px] border px-3 py-1.5 text-xs transition-colors ${
                  statusFilter === tab.key
                    ? "border-[#1976d2] bg-[#1976d2] text-white"
                    : "border-[#d8e1ea] bg-white text-[#5f6f82] hover:bg-[#f8fafc]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5f6f82]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pelanggan atau nota..."
              className="op-input pl-9"
            />
          </div>
        </div>
      </div>

      {/* DAFTAR KASBON */}
      <div className="op-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-xs text-[#5f6f82]">
            Memuat buku kasbon pelanggan...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5f6f82]">
            {statusFilter === "UNPAID"
              ? "Bagus! Tidak ada kasbon pelanggan yang belum lunas saat ini."
              : "Belum ada catatan kasbon yang cocok dengan pencarian Anda."}
          </div>
        ) : (
          <>
            {/* MOBILE CARDS */}
            <div className="divide-y divide-[#edf2f7] md:hidden">
              {filtered.map((trx) => {
                const waLink = buildReminderLink(trx);
                return (
                  <div key={trx.id} className="space-y-2.5 p-4 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm text-[#22303c]">
                          {trx.customer_name || "Pelanggan Tanpa Nama"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                          {trx.invoice_code} - {fmtDateTime(trx.created_at)}
                        </div>
                        {trx.customer_wa && (
                          <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                            WA: {trx.customer_wa}
                          </div>
                        )}
                      </div>
                      <span
                        className={
                          trx.is_debt_paid
                            ? "op-tag op-tag-success shrink-0"
                            : "op-tag op-tag-danger shrink-0"
                        }
                      >
                        {trx.is_debt_paid ? "Lunas" : "Belum Lunas"}
                      </span>
                    </div>

                    {trx.customer_note && (
                      <div className="rounded-[5px] bg-[#f8fafc] px-2.5 py-1.5 text-[11px] text-[#5f6f82]">
                        Catatan: {trx.customer_note}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#edf2f7] pt-2">
                      <span className="text-[#5f6f82]">Total Bon</span>
                      <span className="text-sm text-[#22303c] tabular-nums">
                        {fmtRp(trx.total_amount)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!trx.is_debt_paid && (
                        <button
                          type="button"
                          disabled={markingId === trx.id}
                          onClick={() => markDebtPaid(trx.id)}
                          className="op-btn op-btn-primary op-btn-sm flex-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>
                            {markingId === trx.id
                              ? "Memproses..."
                              : "Tandai Lunas"}
                          </span>
                        </button>
                      )}
                      {!trx.is_debt_paid && waLink && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="op-btn op-btn-sm flex-1"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#167a6f]" />
                          <span>Ingatkan WA</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedTrx(trx)}
                        className="op-btn op-btn-sm"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Struk</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th>No. Nota &amp; Tanggal</th>
                    <th>Catatan Tempo</th>
                    <th className="text-right">Total Bon</th>
                    <th>Status</th>
                    <th className="text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((trx) => {
                    const waLink = buildReminderLink(trx);
                    return (
                      <tr key={trx.id}>
                        <td>
                          <div className="text-xs text-[#22303c]">
                            {trx.customer_name || "Pelanggan Tanpa Nama"}
                          </div>
                          {trx.customer_wa && (
                            <div className="text-[11px] text-[#5f6f82]">
                              WA: {trx.customer_wa}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="text-xs text-[#22303c]">
                            {trx.invoice_code}
                          </div>
                          <div className="text-[11px] text-[#5f6f82]">
                            {fmtDateTime(trx.created_at)}
                          </div>
                        </td>
                        <td className="max-w-[220px] text-xs text-[#5f6f82]">
                          {trx.customer_note || "-"}
                        </td>
                        <td className="text-right text-xs whitespace-nowrap text-[#22303c] tabular-nums">
                          {fmtRp(trx.total_amount)}
                        </td>
                        <td>
                          <span
                            className={
                              trx.is_debt_paid
                                ? "op-tag op-tag-success"
                                : "op-tag op-tag-danger"
                            }
                          >
                            {trx.is_debt_paid ? "Lunas" : "Belum Lunas"}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {!trx.is_debt_paid && (
                              <button
                                type="button"
                                disabled={markingId === trx.id}
                                onClick={() => markDebtPaid(trx.id)}
                                className="op-btn op-btn-primary op-btn-sm"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>
                                  {markingId === trx.id
                                    ? "Memproses..."
                                    : "Tandai Lunas"}
                                </span>
                              </button>
                            )}
                            {!trx.is_debt_paid && waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="op-btn op-btn-sm"
                              >
                                <MessageCircle className="h-3.5 w-3.5 text-[#167a6f]" />
                                <span>Ingatkan WA</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedTrx(trx)}
                              className="op-btn op-btn-sm"
                            >
                              Struk
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedTrx && storeInfo && (
        <ReceiptModal
          transaction={selectedTrx}
          store={storeInfo}
          onClose={() => setSelectedTrx(null)}
        />
      )}
    </div>
  );
}
