"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { fmtDate, fmtDateTime, fmtRp } from "@/lib/format";
import {
  Printer,
  Plus,
  Trash2,
  Check,
  Wallet,
  TrendingUp,
  ArrowDownCircle,
  ShoppingBag,
} from "lucide-react";

interface FinanceSummary {
  totalRevenue: number;
  totalCostOfGoods: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalDiscounts: number;
  unpaidDebtTotal: number;
  transactionCount: number;
  expenseCount: number;
  totalInventoryCostValue: number;
}

interface FinanceTransactionRow {
  id: string;
  invoice_code: string;
  channel: string;
  payment_method: string;
  is_debt_paid: boolean;
  customer_name: string | null;
  total_amount: number;
  created_at: string;
  item_count: number;
}

interface ExpenseRow {
  id: string;
  title: string;
  category: string;
  amount: number;
  note: string | null;
  spent_at: string;
}

interface FinanceResponse {
  period: string;
  generatedAt: string;
  store: {
    store_name: string;
    category: string;
    address: string | null;
    logo_url: string | null;
    whatsapp_number: string | null;
    account_holder_name: string | null;
  };
  config: {
    item_term?: string;
    enable_expense_tracker?: boolean;
    enable_debt_book?: boolean;
  } | null;
  summary: FinanceSummary;
  byPaymentMethod: Record<string, { count: number; total: number }>;
  byChannel: Record<string, { count: number; total: number }>;
  transactions: FinanceTransactionRow[];
  expenses: ExpenseRow[];
}

const PERIOD_OPTIONS = [
  { key: "today", label: "Hari Ini" },
  { key: "7d", label: "7 Hari Terakhir" },
  { key: "30d", label: "30 Hari Terakhir" },
  { key: "month", label: "Bulan Ini" },
  { key: "all", label: "Semua Waktu" },
] as const;

const EXPENSE_CATEGORIES = [
  "Belanja Stok",
  "Listrik & Air",
  "Kemasan & Plastik",
  "Ongkos Kirim",
  "Gaji & Upah",
  "Sewa Tempat",
  "Lainnya",
];

function getTodayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function FinanceReportPage() {
  const [period, setPeriod] = useState<string>("month");
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form catat pengeluaran
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(getTodayDateString);
  const [expNote, setExpNote] = useState("");
  const [savingExp, setSavingExp] = useState(false);
  const [expMessage, setExpMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFinance = useCallback(async (selectedPeriod: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/finance?period=${encodeURIComponent(selectedPeriod)}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Gagal memuat rekap keuangan.");
      } else {
        setData(json);
      }
    } catch {
      setError("Gagal terhubung ke server saat memuat rekap keuangan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinance(period);
  }, [period, loadFinance]);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setExpMessage("");

    const numericAmount = Number(expAmount.replace(/\D/g, ""));
    if (!expTitle.trim() || numericAmount <= 0) {
      setError("Tulis nama pengeluaran dan nominal lebih dari Rp 0.");
      return;
    }

    setSavingExp(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expTitle.trim(),
          category: expCategory,
          amount: numericAmount,
          spent_at: expDate ? `${expDate}T12:00:00` : undefined,
          note: expNote.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Gagal menyimpan pengeluaran.");
      } else {
        setExpTitle("");
        setExpAmount("");
        setExpNote("");
        setExpDate(getTodayDateString());
        setExpMessage("Catatan pengeluaran berhasil ditambahkan.");
        await loadFinance(period);
      }
    } catch {
      setError("Terjadi gangguan koneksi saat menyimpan pengeluaran.");
    } finally {
      setSavingExp(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/finance?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadFinance(period);
      } else {
        const json = await res.json();
        setError(json.error || "Gagal menghapus catatan pengeluaran.");
      }
    } catch {
      setError("Gagal menghapus catatan pengeluaran.");
    } finally {
      setDeletingId(null);
    }
  }

  function handlePrintPdf() {
    window.print();
  }

  const periodLabel =
    PERIOD_OPTIONS.find((p) => p.key === period)?.label || "Bulan Ini";

  const paymentRows = [
    { key: "TUNAI", label: "Tunai" },
    { key: "QRIS", label: "QRIS" },
    { key: "TRANSFER", label: "Transfer Bank" },
    { key: "KASBON", label: "Kasbon / Bayar Nanti" },
  ];

  const expenseFormVisible =
    showExpenseForm || Boolean(data?.config?.enable_expense_tracker);

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Rekap Keuangan"
          subtitle="Pantau uang masuk, catat pengeluaran belanja atau biaya toko, lihat perkiraan untung bersih, dan simpan laporan sebagai PDF."
          breadcrumb="Rekap Keuangan"
          actions={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {!data?.config?.enable_expense_tracker && (
                <button
                  type="button"
                  onClick={() => setShowExpenseForm((v) => !v)}
                  className="op-btn flex-1 sm:flex-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {showExpenseForm ? "Tutup Form" : "Catat Pengeluaran"}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={handlePrintPdf}
                disabled={loading || !data}
                className="op-btn op-btn-primary flex-1 sm:flex-none"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Simpan / Cetak PDF</span>
              </button>
            </div>
          }
        />

        {/* FILTER PERIODE */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPeriod(opt.key)}
                  className={`shrink-0 rounded-[6px] border px-3.5 py-2 text-xs transition-colors sm:py-1.5 ${
                    active
                      ? "border-[#1976d2] bg-[#1976d2] text-white"
                      : "border-[#d8e1ea] bg-white text-[#5f6f82] hover:bg-[#f8fafc] hover:text-[#22303c]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-[#5f6f82]">
            Klik Simpan / Cetak PDF lalu pilih Simpan sebagai PDF di jendela cetak
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-4 py-2.5 text-xs text-[#c0392b]">
            {error}
          </div>
        )}

        {expMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-[5px] border border-[#b7e4de] bg-[#eefaf8] px-4 py-2.5 text-xs text-[#167a6f]">
            <Check className="h-4 w-4 shrink-0" />
            <span>{expMessage}</span>
          </div>
        )}

        {/* FORM CATAT PENGELUARAN */}
        {expenseFormVisible && (
          <form
            onSubmit={handleAddExpense}
            className="op-card mb-5 p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#edf2f7] pb-2.5">
              <div>
                <h2 className="text-sm text-[#22303c]">
                  Catat Pengeluaran Usaha
                </h2>
                <p className="text-[11px] text-[#5f6f82]">
                  Catat belanja kulakan, listrik, plastik kemasan, atau biaya
                  harian agar hitungan untung bersih akurat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label className="mb-1 block text-xs text-[#22303c]">
                  Nama Pengeluaran
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="Misal: Belanja kulakan, bayar listrik"
                  className="op-input"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs text-[#22303c]">
                  Kategori
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="op-select"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs text-[#22303c]">
                  Nominal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={expAmount}
                  onChange={(e) =>
                    setExpAmount(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="Contoh: 150000"
                  className="op-input tabular-nums"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-[#22303c]">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="op-input"
                />
              </div>

              <div className="sm:col-span-9">
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="Catatan tambahan (opsional, misal: nota agen atau keterangan barang)"
                  className="op-input"
                />
              </div>

              <div className="flex items-end sm:col-span-3">
                <button
                  type="submit"
                  disabled={savingExp}
                  className="op-btn op-btn-primary w-full"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    {savingExp ? "Menyimpan..." : "Simpan Pengeluaran"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {loading && !data ? (
        <div className="op-card p-6 text-xs text-[#5f6f82]">
          Menghitung rekap keuangan toko Anda...
        </div>
      ) : data ? (
        <div id="printable-finance-report" className="space-y-4 sm:space-y-5">
          {/* KOP LAPORAN KHUSUS SAAT CETAK / SIMPAN PDF */}
          <div className="print-only border-b border-[#22303c] pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {data.store.logo_url && (
                  <img
                    src={data.store.logo_url}
                    alt={data.store.store_name}
                    className="h-12 w-12 rounded-[6px] border border-[#d8e1ea] object-cover"
                  />
                )}
                <div>
                  <div className="text-lg text-[#22303c]">
                    {data.store.store_name}
                  </div>
                  <div className="text-xs text-[#5f6f82]">
                    {data.store.category}
                    {data.store.address ? ` | ${data.store.address}` : ""}
                  </div>
                  {data.store.whatsapp_number && (
                    <div className="text-[11px] text-[#5f6f82]">
                      WhatsApp: {data.store.whatsapp_number}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#22303c]">
                  REKAP KEUANGAN &amp; LABA RUGI
                </div>
                <div className="mt-0.5 text-xs text-[#5f6f82]">
                  Periode: {periodLabel}
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Dicetak: {fmtDateTime(data.generatedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* 4 RINGKASAN UTAMA */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <div className="op-card p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[11px] text-[#5f6f82] sm:text-xs">
                <span>Total Uang Masuk</span>
                <ShoppingBag className="no-print h-4 w-4 text-[#1976d2]" />
              </div>
              <div className="mt-1.5 text-base text-[#22303c] tabular-nums sm:text-xl">
                {fmtRp(data.summary.totalRevenue)}
              </div>
              <div className="mt-1 text-[11px] text-[#5f6f82]">
                {data.summary.transactionCount} pembelian selesai ({periodLabel})
              </div>
            </div>

            <div className="op-card p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[11px] text-[#5f6f82] sm:text-xs">
                <span>Modal Barang Terjual</span>
                <Wallet className="no-print h-4 w-4 text-[#5f6f82]" />
              </div>
              <div className="mt-1.5 text-base text-[#22303c] tabular-nums sm:text-xl">
                {fmtRp(data.summary.totalCostOfGoods)}
              </div>
              <div className="mt-1 text-[11px] text-[#5f6f82] tabular-nums">
                Untung kotor: {fmtRp(data.summary.grossProfit)}
              </div>
            </div>

            <div className="op-card p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[11px] text-[#5f6f82] sm:text-xs">
                <span>Pengeluaran Usaha</span>
                <ArrowDownCircle className="no-print h-4 w-4 text-[#c0392b]" />
              </div>
              <div className="mt-1.5 text-base text-[#c0392b] tabular-nums sm:text-xl">
                {fmtRp(data.summary.totalExpenses)}
              </div>
              <div className="mt-1 text-[11px] text-[#5f6f82]">
                {data.summary.expenseCount} catatan pengeluaran
              </div>
            </div>

            <div className="op-card p-3.5 sm:p-4">
              <div className="flex items-center justify-between text-[11px] text-[#5f6f82] sm:text-xs">
                <span>Perkiraan Untung Bersih</span>
                <TrendingUp className="no-print h-4 w-4 text-[#167a6f]" />
              </div>
              <div
                className={`mt-1.5 text-base tabular-nums sm:text-xl ${
                  data.summary.netProfit >= 0
                    ? "text-[#167a6f]"
                    : "text-[#c0392b]"
                }`}
              >
                {fmtRp(data.summary.netProfit)}
              </div>
              <div className="mt-1 text-[11px] text-[#5f6f82] tabular-nums">
                Nilai stok di toko: {fmtRp(data.summary.totalInventoryCostValue)}
              </div>
            </div>
          </div>

          {/* RINCIAN CARA BAYAR & SUMBER PENJUALAN */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="op-card p-4 sm:p-5 lg:col-span-7">
              <div className="mb-3 border-b border-[#edf2f7] pb-2">
                <h2 className="text-sm text-[#22303c]">
                  Rincian Cara Pembayaran
                </h2>
                <p className="text-[11px] text-[#5f6f82]">
                  Total uang masuk berdasarkan cara bayar pembeli pada periode{" "}
                  {periodLabel.toLowerCase()}.
                </p>
              </div>
              <div className="space-y-2.5">
                {paymentRows.map((row) => {
                  const stat = data.byPaymentMethod[row.key] || {
                    count: 0,
                    total: 0,
                  };
                  return (
                    <div
                      key={row.key}
                      className="flex items-center justify-between gap-2 rounded-[5px] border border-[#edf2f7] bg-[#f8fafc] px-3 py-2 text-xs"
                    >
                      <div>
                        <span className="text-[#22303c]">{row.label}</span>
                        <span className="ml-2 text-[11px] text-[#5f6f82]">
                          ({stat.count} kali)
                        </span>
                      </div>
                      <span className="text-[#22303c] tabular-nums">
                        {fmtRp(stat.total)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {data.summary.unpaidDebtTotal > 0 && (
                <div className="mt-3 rounded-[5px] border border-[#f5d0a9] bg-[#fff8eb] px-3 py-2 text-xs text-[#9a5b13] tabular-nums">
                  Catatan: Terdapat kasbon belum lunas sebesar{" "}
                  {fmtRp(data.summary.unpaidDebtTotal)} pada periode ini.
                </div>
              )}
            </div>

            <div className="op-card p-4 sm:p-5 lg:col-span-5">
              <div className="mb-3 border-b border-[#edf2f7] pb-2">
                <h2 className="text-sm text-[#22303c]">
                  Sumber Penjualan &amp; Potongan
                </h2>
                <p className="text-[11px] text-[#5f6f82]">
                  Perbandingan penjualan di kasir toko dan pesanan dari
                  WhatsApp.
                </p>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between rounded-[5px] border border-[#edf2f7] bg-[#f8fafc] px-3 py-2">
                  <div>
                    <div className="text-[#22303c]">Kasir di Toko</div>
                    <div className="text-[11px] text-[#5f6f82]">
                      {data.byChannel.OFFLINE_POS?.count || 0} pembelian
                    </div>
                  </div>
                  <span className="text-[#22303c] tabular-nums">
                    {fmtRp(data.byChannel.OFFLINE_POS?.total || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[5px] border border-[#edf2f7] bg-[#f8fafc] px-3 py-2">
                  <div>
                    <div className="text-[#22303c]">Pesanan WhatsApp</div>
                    <div className="text-[11px] text-[#5f6f82]">
                      {data.byChannel.WHATSAPP_ONLINE?.count || 0} pesanan
                    </div>
                  </div>
                  <span className="text-[#22303c] tabular-nums">
                    {fmtRp(data.byChannel.WHATSAPP_ONLINE?.total || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[5px] border border-[#edf2f7] bg-white px-3 py-2">
                  <span className="text-[#5f6f82]">
                    Total Potongan &amp; Diskon
                  </span>
                  <span className="text-[#22303c] tabular-nums">
                    {fmtRp(data.summary.totalDiscounts)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-[5px] border border-[#d8e1ea] bg-[#eff6ff] px-3 py-2">
                  <span className="text-[#1d4ed8]">
                    Modal Sisa Stok Saat Ini
                  </span>
                  <span className="text-[#1d4ed8] tabular-nums">
                    {fmtRp(data.summary.totalInventoryCostValue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DAFTAR PENGELUARAN */}
          <div className="op-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-sm text-[#22303c]">
                  Rincian Pengeluaran Usaha ({data.expenses.length})
                </h2>
                <p className="text-[11px] text-[#5f6f82]">
                  Semua biaya keluar yang dicatat pada periode{" "}
                  {periodLabel.toLowerCase()}.
                </p>
              </div>
              <div className="text-xs text-[#c0392b] tabular-nums">
                Total: {fmtRp(data.summary.totalExpenses)}
              </div>
            </div>

            {data.expenses.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
                Belum ada catatan pengeluaran untuk periode {periodLabel.toLowerCase()}.
              </div>
            ) : (
              <>
                {/* MOBILE CARDS (disembunyikan saat cetak) */}
                <div className="no-print divide-y divide-[#edf2f7] md:hidden">
                  {data.expenses.map((exp) => (
                    <div key={exp.id} className="space-y-1.5 p-3.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[#22303c]">{exp.title}</div>
                          <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                            {exp.category} - {fmtDate(exp.spent_at)}
                          </div>
                        </div>
                        <div className="shrink-0 text-right text-[#c0392b] tabular-nums">
                          {fmtRp(exp.amount)}
                        </div>
                      </div>
                      {exp.note && (
                        <div className="text-[11px] text-[#5f6f82]">
                          Catatan: {exp.note}
                        </div>
                      )}
                      <div className="pt-1 text-right">
                        <button
                          type="button"
                          disabled={deletingId === exp.id}
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="op-btn op-btn-sm text-[#c0392b]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>
                            {deletingId === exp.id ? "Menghapus..." : "Hapus"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DESKTOP & PRINT TABLE */}
                <div className="hidden overflow-x-auto md:block print:block">
                  <table className="op-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Keterangan Pengeluaran</th>
                        <th>Kategori</th>
                        <th className="text-right">Nominal</th>
                        <th className="no-print text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.expenses.map((exp) => (
                        <tr key={exp.id}>
                          <td className="whitespace-nowrap text-xs text-[#5f6f82]">
                            {fmtDate(exp.spent_at)}
                          </td>
                          <td>
                            <div className="text-xs text-[#22303c]">
                              {exp.title}
                            </div>
                            {exp.note && (
                              <div className="text-[11px] text-[#5f6f82]">
                                {exp.note}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="op-tag">{exp.category}</span>
                          </td>
                          <td className="text-right text-xs whitespace-nowrap text-[#c0392b] tabular-nums">
                            {fmtRp(exp.amount)}
                          </td>
                          <td className="no-print text-right">
                            <button
                              type="button"
                              disabled={deletingId === exp.id}
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="op-btn op-btn-sm text-[#c0392b]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* RINGKASAN PENJUALAN PERIODE INI */}
          <div className="op-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3 sm:px-5">
              <div>
                <h2 className="text-sm text-[#22303c]">
                  Rincian Penjualan Masuk ({data.transactions.length})
                </h2>
                <p className="text-[11px] text-[#5f6f82]">
                  Daftar nota penjualan selesai pada periode{" "}
                  {periodLabel.toLowerCase()}.
                </p>
              </div>
              <div className="text-xs text-[#167a6f] tabular-nums">
                Total: {fmtRp(data.summary.totalRevenue)}
              </div>
            </div>

            {data.transactions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
                Belum ada penjualan selesai pada periode {periodLabel.toLowerCase()}.
              </div>
            ) : (
              <>
                <div className="no-print divide-y divide-[#edf2f7] md:hidden">
                  {data.transactions.slice(0, 40).map((trx) => (
                    <div
                      key={trx.id}
                      className="flex items-center justify-between gap-3 p-3.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[#22303c]">
                          {trx.customer_name || "Pembeli Umum"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                          {trx.invoice_code} - {fmtDateTime(trx.created_at)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="op-tag">{trx.payment_method}</span>
                          <span className="op-tag">
                            {trx.item_count} item
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-[#22303c] tabular-nums">
                        {fmtRp(trx.total_amount)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block print:block">
                  <table className="op-table">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>No. Nota</th>
                        <th>Pelanggan</th>
                        <th>Cara Bayar</th>
                        <th className="text-right">Jumlah</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.slice(0, 60).map((trx) => (
                        <tr key={trx.id}>
                          <td className="whitespace-nowrap text-xs text-[#5f6f82]">
                            {fmtDateTime(trx.created_at)}
                          </td>
                          <td className="whitespace-nowrap text-xs text-[#22303c]">
                            {trx.invoice_code}
                          </td>
                          <td className="text-xs text-[#22303c]">
                            {trx.customer_name || "Pembeli Umum"}
                          </td>
                          <td className="whitespace-nowrap text-xs">
                            <span className="op-tag">
                              {trx.payment_method}
                              {trx.payment_method === "KASBON"
                                ? trx.is_debt_paid
                                  ? " (Lunas)"
                                  : " (Belum Lunas)"
                                : ""}
                            </span>
                          </td>
                          <td className="text-right text-xs text-[#5f6f82] tabular-nums">
                            {trx.item_count}
                          </td>
                          <td className="text-right text-xs whitespace-nowrap text-[#22303c] tabular-nums">
                            {fmtRp(trx.total_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* PENUTUP KHUSUS SAAT CETAK / SIMPAN PDF */}
          <div className="print-only mt-6 flex items-end justify-between border-t border-[#d8e1ea] pt-4 text-[11px] text-[#5f6f82]">
            <div>
              Laporan keuangan ini dicetak langsung dari Warungin sesuai catatan
              penjualan dan pengeluaran toko Anda.
            </div>
            <div className="text-right">
              <div>Mengetahui,</div>
              <div className="mt-8 border-t border-[#5f6f82] pt-1 text-[#22303c]">
                {data.store.account_holder_name || "Pemilik Toko"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
