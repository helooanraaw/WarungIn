"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Pager } from "@/components/erp/AppShell";
import { fmtDateTime, fmtRp, sanitizeWaNumber } from "@/lib/format";
import { Search, Check, X, ExternalLink } from "lucide-react";

interface WaOrder {
  id: string;
  invoice_code: string;
  channel: string;
  status: string;
  payment_method: string;
  customer_name: string | null;
  customer_wa: string | null;
  customer_note: string | null;
  total_amount: number;
  created_at: string;
  confirmed_at: string | null;
  items: {
    id: string;
    product_name: string;
    unit_price: number;
    qty: number;
    subtotal: number;
  }[];
}

export default function WhatsAppOrdersPage() {
  const [orders, setOrders] = useState<WaOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pageSize = 10;

  function loadOrders() {
    setLoading(true);
    fetch("/api/transactions?channel=WHATSAPP_ONLINE")
      .then((res) => res.json())
      .then((data) => {
        if (data.transactions) setOrders(data.transactions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleOrderAction(
    orderId: string,
    action: "CONFIRM_WA" | "CANCEL_WA"
  ) {
    setActionError("");
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/transactions/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Gagal memproses pesanan WhatsApp.");
      } else {
        loadOrders();
      }
    } catch {
      setActionError("Terjadi gangguan koneksi.");
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = orders.filter((o) => {
    const matchText =
      o.invoice_code.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_wa || "").toLowerCase().includes(search.toLowerCase());
    if (!matchText) return false;
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const pendingCount = orders.filter(
    (o) => o.status === "PENDING_CONFIRMATION"
  ).length;

  return (
    <div>
      <PageHeader
        title="Pesanan WhatsApp"
        subtitle="Daftar pesanan dari katalog online. Stok fisik baru berkurang saat Anda menekan tombol Konfirmasi."
        breadcrumb="Pesanan WhatsApp"
        actions={
          <span className="op-tag op-tag-warn">
            Menunggu Konfirmasi: {pendingCount} pesanan
          </span>
        }
      />

      {actionError && (
        <div className="mb-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-4 py-2.5 text-xs text-[#c0392b]">
          {actionError}
        </div>
      )}

      {/* BAR PENCARIAN & FILTER */}
      <div className="op-card mb-4 p-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-8">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-[#5f6f82]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kode pesanan, nama pembeli, atau nomor WhatsApp..."
              className="op-input pl-9"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="op-select"
            >
              <option value="ALL">Semua Status Pesanan</option>
              <option value="PENDING_CONFIRMATION">Menunggu Konfirmasi</option>
              <option value="COMPLETED">Selesai (Stok Terpotong)</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABEL PESANAN WHATSAPP */}
      <div className="op-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Kode Pesanan</th>
                <th>Waktu Masuk</th>
                <th>Pembeli</th>
                <th>Rincian Barang</th>
                <th className="text-right">Total</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-xs text-[#5f6f82]"
                  >
                    Memuat antrean pesanan WhatsApp...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-xs text-[#5f6f82]"
                  >
                    Belum ada pesanan masuk dari katalog online. Bagikan tautan
                    katalog toko Anda agar pembeli bisa memesan barang lewat
                    WhatsApp.
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const waChatUrl = order.customer_wa
                    ? `https://wa.me/${sanitizeWaNumber(
                        order.customer_wa
                      )}?text=${encodeURIComponent(
                        `Halo ${order.customer_name || ""}, mengenai pesanan *${
                          order.invoice_code
                        }* senilai ${fmtRp(order.total_amount)}:`
                      )}`
                    : null;

                  return (
                    <tr key={order.id}>
                      <td className="text-xs text-[#22303c]">
                        {order.invoice_code}
                      </td>
                      <td className="text-xs text-[#5f6f82]">
                        {fmtDateTime(order.created_at)}
                      </td>
                      <td>
                        <div className="text-xs text-[#22303c]">
                          {order.customer_name || "Pembeli Online"}
                        </div>
                        <div className="text-[11px] text-[#5f6f82]">
                          WA: {order.customer_wa || "-"}
                        </div>
                        {order.customer_note && (
                          <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                            Catatan: {order.customer_note}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="space-y-0.5 text-xs">
                          {order.items.map((item) => (
                            <div key={item.id}>
                              {item.qty}x {item.product_name}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="text-right text-xs text-[#22303c] tabular-nums">
                        {fmtRp(order.total_amount)}
                      </td>
                      <td>
                        {order.status === "PENDING_CONFIRMATION" && (
                          <span className="op-tag op-tag-warn">
                            Menunggu Konfirmasi
                          </span>
                        )}
                        {order.status === "COMPLETED" && (
                          <span className="op-tag op-tag-success">Selesai</span>
                        )}
                        {order.status === "CANCELLED" && (
                          <span className="op-tag op-tag-danger">
                            Dibatalkan
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {order.status === "PENDING_CONFIRMATION" && (
                            <>
                              <button
                                type="button"
                                disabled={processingId === order.id}
                                onClick={() =>
                                  handleOrderAction(order.id, "CONFIRM_WA")
                                }
                                className="op-btn op-btn-success op-btn-sm"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Konfirmasi</span>
                              </button>
                              <button
                                type="button"
                                disabled={processingId === order.id}
                                onClick={() =>
                                  handleOrderAction(order.id, "CANCEL_WA")
                                }
                                className="op-btn op-btn-danger op-btn-sm"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Batalkan</span>
                              </button>
                            </>
                          )}
                          {waChatUrl && (
                            <a
                              href={waChatUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="op-btn op-btn-sm"
                            >
                              <span>Chat WA</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
    </div>
  );
}
