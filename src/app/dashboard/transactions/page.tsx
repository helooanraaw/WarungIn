"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Pager } from "@/components/erp/AppShell";
import ReceiptModal, {
  type ReceiptStoreInfo,
  type ReceiptTransactionData,
} from "@/components/erp/ReceiptModal";
import { fmtDateTime, fmtRp } from "@/lib/format";
import { Search, Check } from "lucide-react";

interface ModulesConfig {
  enable_shift_log: boolean;
  enable_debt_book: boolean;
  receipt_footer: string;
}

export default function TransactionsHistoryPage() {
  const [transactions, setTransactions] = useState<ReceiptTransactionData[]>(
    []
  );
  const [storeInfo, setStoreInfo] = useState<ReceiptStoreInfo | null>(null);
  const [config, setConfig] = useState<ModulesConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [shiftFilter, setShiftFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedTrx, setSelectedTrx] =
    useState<ReceiptTransactionData | null>(null);

  function loadTransactions() {
    setLoading(true);
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (data.transactions) setTransactions(data.transactions);
        if (data.config) setConfig(data.config);
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
    loadTransactions();
  }, []);

  async function markDebtPaid(id: string) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "MARK_DEBT_PAID" }),
    });
    if (res.ok) {
      loadTransactions();
    }
  }

  const completedList = transactions.filter((t) => t.status === "COMPLETED");
  const totalRevenue = completedList.reduce((s, t) => s + t.total_amount, 0);
  const unpaidDebts = completedList.filter(
    (t) => t.payment_method === "KASBON" && !t.is_debt_paid
  );
  const unpaidDebtTotal = unpaidDebts.reduce((s, t) => s + t.total_amount, 0);

  const filtered = transactions.filter((t) => {
    const matchText =
      t.invoice_code.toLowerCase().includes(search.toLowerCase()) ||
      (t.customer_name || "").toLowerCase().includes(search.toLowerCase());
    if (!matchText) return false;

    if (channelFilter !== "ALL" && t.channel !== channelFilter) return false;

    if (paymentFilter === "UNPAID_DEBT") {
      if (!(t.payment_method === "KASBON" && !t.is_debt_paid)) return false;
    } else if (paymentFilter !== "ALL" && t.payment_method !== paymentFilter) {
      return false;
    }

    if (
      config?.enable_shift_log &&
      shiftFilter !== "ALL" &&
      (t.shift_name || "") !== shiftFilter
    ) {
      return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="Riwayat Transaksi"
        subtitle="Catatan seluruh penjualan dari meja kasir maupun pesanan WhatsApp."
        breadcrumb="Riwayat Transaksi"
      />

      {/* RINGKASAN METRIK TRANSAKSI */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="op-card col-span-2 p-3.5 sm:col-span-1 sm:p-4">
          <div className="text-xs text-[#5f6f82]">Total Penjualan Selesai</div>
          <div className="mt-1 text-lg text-[#22303c] tabular-nums">
            {fmtRp(totalRevenue)}
          </div>
        </div>
        <div className="op-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Nota Selesai
          </div>
          <div className="mt-1 text-base text-[#22303c] tabular-nums sm:text-lg">
            {completedList.length} transaksi
          </div>
        </div>
        <div className="op-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Kasbon Belum Lunas
          </div>
          <div className="mt-1 truncate text-base text-[#c0392b] tabular-nums sm:text-lg">
            {fmtRp(unpaidDebtTotal)} ({unpaidDebts.length})
          </div>
        </div>
      </div>

      {/* BAR PENCARIAN & FILTER */}
      <div className="op-card mb-4 p-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div
            className={`relative ${
              config?.enable_shift_log ? "sm:col-span-4" : "sm:col-span-6"
            }`}
          >
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5f6f82]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nomor nota atau nama pelanggan..."
              className="op-input pl-9"
            />
          </div>

          <div
            className={
              config?.enable_shift_log ? "sm:col-span-3" : "sm:col-span-3"
            }
          >
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="op-select"
            >
              <option value="ALL">Semua Jalur Penjualan</option>
              <option value="OFFLINE_POS">Kasir Toko (Offline)</option>
              <option value="WHATSAPP_ONLINE">Pesanan WhatsApp</option>
            </select>
          </div>

          <div
            className={
              config?.enable_shift_log ? "sm:col-span-3" : "sm:col-span-3"
            }
          >
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="op-select"
            >
              <option value="ALL">Semua Metode Pembayaran</option>
              <option value="TUNAI">Tunai</option>
              <option value="QRIS">QRIS</option>
              <option value="TRANSFER">Transfer</option>
              <option value="KASBON">Semua Kasbon</option>
              <option value="UNPAID_DEBT">Kasbon Belum Lunas</option>
            </select>
          </div>

          {config?.enable_shift_log && (
            <div className="sm:col-span-2">
              <select
                value={shiftFilter}
                onChange={(e) => {
                  setShiftFilter(e.target.value);
                  setPage(1);
                }}
                className="op-select"
              >
                <option value="ALL">Semua Shift</option>
                <option value="Pagi">Shift Pagi</option>
                <option value="Sore">Shift Sore</option>
                <option value="Malam">Shift Malam</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* DAFTAR RIWAYAT TRANSAKSI */}
      <div className="op-card overflow-hidden">
        {/* KARTU RIWAYAT MOBILE & TABLET (< 1024px) */}
        <div className="divide-y divide-[#edf2f7] lg:hidden">
          {loading ? (
            <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
              Memuat riwayat transaksi...
            </div>
          ) : paginated.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
              Tidak ada transaksi yang sesuai filter pencarian.
            </div>
          ) : (
            paginated.map((trx) => (
              <div key={trx.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs text-[#22303c]">
                      {trx.invoice_code}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                      {fmtDateTime(trx.created_at)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm text-[#22303c] tabular-nums">
                    {fmtRp(trx.total_amount)}
                  </div>
                </div>

                <div className="text-xs text-[#22303c]">
                  <span>{trx.customer_name || "Pembeli Umum"}</span>
                  {config?.enable_shift_log && trx.shift_name && (
                    <span className="ml-1.5 text-[11px] text-[#5f6f82]">
                      · Shift {trx.shift_name}
                    </span>
                  )}
                  {trx.customer_note && (
                    <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                      {trx.customer_note}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {trx.channel === "WHATSAPP_ONLINE" ? (
                    <span className="op-tag op-tag-info">WhatsApp</span>
                  ) : (
                    <span className="op-tag">Kasir Toko</span>
                  )}
                  <span className="op-tag">{trx.payment_method}</span>
                  {trx.payment_method === "KASBON" && (
                    <span
                      className={`op-tag ${
                        trx.is_debt_paid ? "op-tag-success" : "op-tag-danger"
                      }`}
                    >
                      {trx.is_debt_paid ? "Lunas" : "Belum Lunas"}
                    </span>
                  )}
                  {trx.status === "COMPLETED" && (
                    <span className="op-tag op-tag-success">Selesai</span>
                  )}
                  {trx.status === "PENDING_CONFIRMATION" && (
                    <span className="op-tag op-tag-warn">
                      Menunggu Konfirmasi
                    </span>
                  )}
                  {trx.status === "CANCELLED" && (
                    <span className="op-tag op-tag-danger">Dibatalkan</span>
                  )}
                </div>

                <div className="flex gap-2 pt-0.5">
                  {trx.payment_method === "KASBON" && !trx.is_debt_paid && (
                    <button
                      type="button"
                      onClick={() => markDebtPaid(trx.id)}
                      className="op-btn op-btn-success op-btn-sm flex-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Tandai Lunas</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedTrx(trx)}
                    className="op-btn op-btn-sm flex-1"
                  >
                    Lihat Struk
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* INDEX TABLE DESKTOP (>= 1024px) */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="op-table">
            <thead>
              <tr>
                <th>Kode Nota</th>
                <th>Tanggal & Jam</th>
                <th>Pelanggan</th>
                <th>Jalur</th>
                <th>Pembayaran</th>
                {config?.enable_shift_log && <th>Shift</th>}
                <th className="text-right">Total</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-xs text-[#5f6f82]"
                  >
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-xs text-[#5f6f82]"
                  >
                    Tidak ada transaksi yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((trx) => (
                  <tr key={trx.id}>
                    <td className="text-xs text-[#22303c]">
                      {trx.invoice_code}
                    </td>
                    <td className="text-xs text-[#5f6f82]">
                      {fmtDateTime(trx.created_at)}
                    </td>
                    <td>
                      <div className="text-xs text-[#22303c]">
                        {trx.customer_name || "Pembeli Umum"}
                      </div>
                      {trx.customer_note && (
                        <div className="text-[11px] text-[#5f6f82]">
                          {trx.customer_note}
                        </div>
                      )}
                    </td>
                    <td>
                      {trx.channel === "WHATSAPP_ONLINE" ? (
                        <span className="op-tag op-tag-info">
                          Pesanan WhatsApp
                        </span>
                      ) : (
                        <span className="op-tag">Kasir Toko</span>
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-[#22303c]">
                        {trx.payment_method}
                      </span>
                      {trx.payment_method === "KASBON" && (
                        <span
                          className={`ml-1.5 op-tag ${
                            trx.is_debt_paid
                              ? "op-tag-success"
                              : "op-tag-danger"
                          }`}
                        >
                          {trx.is_debt_paid ? "Lunas" : "Belum Lunas"}
                        </span>
                      )}
                    </td>
                    {config?.enable_shift_log && (
                      <td className="text-xs text-[#5f6f82]">
                        {trx.shift_name || "-"}
                      </td>
                    )}
                    <td className="text-right text-xs text-[#22303c] tabular-nums">
                      {fmtRp(trx.total_amount)}
                    </td>
                    <td>
                      {trx.status === "COMPLETED" && (
                        <span className="op-tag op-tag-success">Selesai</span>
                      )}
                      {trx.status === "PENDING_CONFIRMATION" && (
                        <span className="op-tag op-tag-warn">
                          Menunggu Konfirmasi
                        </span>
                      )}
                      {trx.status === "CANCELLED" && (
                        <span className="op-tag op-tag-danger">Dibatalkan</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {trx.payment_method === "KASBON" &&
                          !trx.is_debt_paid && (
                            <button
                              type="button"
                              onClick={() => markDebtPaid(trx.id)}
                              className="op-btn op-btn-success op-btn-sm"
                            >
                              <Check className="h-3 w-3" />
                              <span>Tandai Lunas</span>
                            </button>
                          )}
                        <button
                          type="button"
                          onClick={() => setSelectedTrx(trx)}
                          className="op-btn op-btn-sm"
                        >
                          Lihat Struk
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pager
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={setPage}
        />
      </div>

      {/* MODAL DETAIL STRUK LENGKAP */}
      {selectedTrx && (
        <ReceiptModal
          transaction={selectedTrx}
          store={storeInfo}
          title={`Rincian Struk Nota (${selectedTrx.invoice_code})`}
          onClose={() => setSelectedTrx(null)}
        />
      )}
    </div>
  );
}
