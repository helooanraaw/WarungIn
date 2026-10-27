"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Pager } from "@/components/erp/AppShell";
import { fmtDateTime, fmtRp } from "@/lib/format";
import { Search, Check } from "lucide-react";

interface TransactionRow {
  id: string;
  invoice_code: string;
  channel: string;
  status: string;
  payment_method: string;
  customer_name: string | null;
  customer_wa: string | null;
  customer_note: string | null;
  shift_name: string | null;
  is_debt_paid: boolean;
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

interface ModulesConfig {
  enable_shift_log: boolean;
  enable_debt_book: boolean;
}

export default function TransactionsHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [config, setConfig] = useState<ModulesConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedTrx, setSelectedTrx] = useState<TransactionRow | null>(null);

  function loadTransactions() {
    setLoading(true);
    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (data.transactions) setTransactions(data.transactions);
        if (data.config) setConfig(data.config);
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

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="Riwayat Transaksi"
        subtitle="Rekap seluruh transaksi dari kasir toko fisik maupun pesanan WhatsApp."
        breadcrumb="Riwayat Transaksi"
      />

      {/* RINGKASAN METRIK TRANSAKSI */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="op-card p-4">
          <div className="text-xs text-[#5f6f82]">Total Penjualan Selesai</div>
          <div className="mt-1 text-lg text-[#22303c] tabular-nums">
            {fmtRp(totalRevenue)}
          </div>
        </div>
        <div className="op-card p-4">
          <div className="text-xs text-[#5f6f82]">Jumlah Nota Selesai</div>
          <div className="mt-1 text-lg text-[#22303c] tabular-nums">
            {completedList.length} transaksi
          </div>
        </div>
        <div className="op-card p-4">
          <div className="text-xs text-[#5f6f82]">Kasbon Belum Lunas</div>
          <div className="mt-1 text-lg text-[#c0392b] tabular-nums">
            {fmtRp(unpaidDebtTotal)} ({unpaidDebts.length} nota)
          </div>
        </div>
      </div>

      {/* BAR PENCARIAN & FILTER */}
      <div className="op-card mb-4 p-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-6">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-[#5f6f82]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kode nota atau nama pelanggan..."
              className="op-input pl-9"
            />
          </div>

          <div className="sm:col-span-3">
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

          <div className="sm:col-span-3">
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
        </div>
      </div>

      {/* INDEX TABLE RIWAYAT TRANSAKSI */}
      <div className="op-card overflow-hidden">
        <div className="overflow-x-auto">
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
                            trx.is_debt_paid ? "op-tag-success" : "op-tag-danger"
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

      {/* MODAL DETAIL STRUK */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="op-card w-full max-w-sm p-6">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] pb-3">
              <h3 className="text-sm text-[#22303c]">
                Rincian Nota {selectedTrx.invoice_code}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="text-xs text-[#5f6f82] hover:text-[#22303c]"
              >
                Tutup
              </button>
            </div>

            <div className="mt-3 space-y-1 text-xs text-[#5f6f82]">
              <div className="flex justify-between">
                <span>Waktu Transaksi:</span>
                <span className="text-[#22303c]">
                  {fmtDateTime(selectedTrx.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="text-[#22303c]">
                  {selectedTrx.customer_name || "Pembeli Umum"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Jalur:</span>
                <span className="text-[#22303c]">
                  {selectedTrx.channel === "WHATSAPP_ONLINE"
                    ? "Pesanan WhatsApp"
                    : "Kasir Toko"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pembayaran:</span>
                <span className="text-[#22303c]">
                  {selectedTrx.payment_method}
                </span>
              </div>
            </div>

            <div className="my-3 border-y border-dashed border-[#d8e1ea] py-3 text-xs">
              {selectedTrx.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1">
                  <span>
                    {item.qty}x {item.product_name}
                  </span>
                  <span className="tabular-nums">{fmtRp(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-[#22303c]">
              <span>Total</span>
              <span className="tabular-nums">
                {fmtRp(selectedTrx.total_amount)}
              </span>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="op-btn"
              >
                Cetak Nota
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="op-btn op-btn-primary"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
