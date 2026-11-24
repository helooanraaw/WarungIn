"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ExternalLink,
  FileDown,
  MessageSquare,
  PackagePlus,
  RotateCw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/erp/AppShell";
import { fmtDateTime, fmtRp } from "@/lib/format";

interface DashboardData {
  ownerName: string;
  store: {
    id: string;
    store_name: string;
    slug: string;
    category: string;
    is_online_enabled: boolean;
  };
  config: {
    dashboard_template: string;
    dashboard_focus: string;
    template_label: string;
    item_term: string;
    custom_attribute_label: string;
    default_unit: string;
    enable_expiry_tracking: boolean;
    enable_variant_matrix: boolean;
    enable_wholesale_tier: boolean;
    enable_manual_discount: boolean;
    enable_shift_log: boolean;
    enable_debt_book: boolean;
    enable_finance_report: boolean;
    enable_expense_tracker: boolean;
    low_stock_threshold: number;
    receipt_footer: string;
    ai_summary_reason: string;
  } | null;
  kpis: {
    omzetHariIni: number;
    transaksiHariIni: number;
    stokMenipisCount: number;
    pesananWaMenungguCount: number;
    totalProductsCount: number;
    expiringCount: number;
    unpaidDebtTotal: number;
    unpaidDebtCount: number;
    pengeluaranHariIni: number;
    labaBersihHariIni: number;
    omzetBulanIni: number;
    pengeluaranBulanIni: number;
    labaBersihBulanIni: number;
    nilaiStokModal: number;
  };
  recentTransactions: {
    id: string;
    invoice_code: string;
    channel: string;
    status: string;
    payment_method: string;
    customer_name: string | null;
    shift_name: string | null;
    total_amount: number;
    created_at: string;
  }[];
  recentExpenses?: {
    id: string;
    title: string;
    category: string;
    amount: number;
    spent_at: string;
  }[];
  topProducts: {
    id: string;
    name: string;
    qtySold: number;
    revenue: number;
  }[];
  lowStockProducts: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    stock_qty: number;
    expiry_date: string | null;
  }[];
  expiringProducts: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    stock_qty: number;
    expiry_date: string | null;
    expStatus: "EXPIRED" | "EXPIRING_SOON";
    daysLeft: number | null;
    expLabel: string;
  }[];
  shiftSummary: {
    shift: string;
    count: number;
    revenue: number;
  }[];
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat ringkasan.");
        return res.json();
      })
      .then((resData) => {
        if (!active) return;
        if (!resData.error) setData(resData);
        else setData(null);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  if (loading) {
    return (
      <div className="op-card p-6 text-xs text-[#5f6f82]">
        Memuat ringkasan toko...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="op-card flex flex-col items-start gap-3 p-6 text-xs text-[#5f6f82]">
        <p role="alert" className="text-[#c0392b]">
          Gagal memuat data ringkasan. Coba muat ulang halaman toko.
        </p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="op-btn op-btn-primary"
        >
          <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
          Coba lagi
        </button>
      </div>
    );
  }

  const {
    ownerName,
    store,
    kpis,
    config,
    recentTransactions,
    recentExpenses = [],
    topProducts,
    lowStockProducts,
    expiringProducts,
    shiftSummary,
  } = data;

  const itemTerm = config?.item_term || "Barang";
  const itemLower = itemTerm.toLowerCase();
  const focus = config?.dashboard_focus || "UMUM";
  const hasFinance = Boolean(
    config?.enable_finance_report || config?.enable_expense_tracker
  );
  const hasExpiry = Boolean(config?.enable_expiry_tracking);
  const hasDebts = Boolean(config?.enable_debt_book);
  const hasOnline = Boolean(store.is_online_enabled);

  // Daftar menu khusus yang dibuatkan untuk usaha ini (bisa langsung diklik!)
  const quickPages: { href: string; label: string }[] = [];
  if (hasFinance)
    quickPages.push({
      href: "/dashboard/finance",
      label: "Rekap Keuangan & PDF",
    });
  if (hasDebts)
    quickPages.push({ href: "/dashboard/debts", label: "Buku Kasbon" });
  if (hasExpiry)
    quickPages.push({
      href: "/dashboard/expiry",
      label: "Pantau Kedaluwarsa",
    });
  if (hasOnline)
    quickPages.push({
      href: "/dashboard/whatsapp-orders",
      label: "Pesanan WhatsApp",
    });
  if (config?.enable_wholesale_tier)
    quickPages.push({ href: "/dashboard/inventory", label: "Harga Grosir" });
  if (config?.enable_manual_discount)
    quickPages.push({ href: "/dashboard/pos", label: "Diskon Kasir" });
  if (config?.enable_shift_log)
    quickPages.push({ href: "/dashboard/pos", label: "Jadwal Jaga Kasir" });

  // Susun 4 kartu KPI paling relevan sesuai kebutuhan usaha (tidak memaksakan kartu yang tidak dipakai)
  interface KpiCardItem {
    key: string;
    label: string;
    value: string;
    sub: string;
    href?: string;
    tone?: string;
  }

  const kpiCards: KpiCardItem[] = [
    {
      key: "revenue",
      label: "Uang Masuk Hari Ini",
      value: fmtRp(kpis.omzetHariIni),
      sub: `${kpis.transaksiHariIni} kali pembelian hari ini`,
      href: "/dashboard/transactions",
    },
  ];

  if (hasFinance) {
    kpiCards.push({
      key: "profit",
      label: "Untung Bersih Hari Ini",
      value: fmtRp(kpis.labaBersihHariIni),
      sub:
        kpis.pengeluaranHariIni > 0
          ? `Pengeluaran: ${fmtRp(kpis.pengeluaranHariIni)}`
          : "Setelah dikurangi harga beli",
      href: "/dashboard/finance",
      tone: kpis.labaBersihHariIni < 0 ? "text-[#c0392b]" : "text-[#167a6f]",
    });
  } else {
    kpiCards.push({
      key: "buyers",
      label: "Pembeli Hari Ini",
      value: `${kpis.transaksiHariIni} kali beli`,
      sub: hasOnline ? "Kasir toko & WhatsApp" : "Penjualan di meja kasir",
      href: "/dashboard/transactions",
    });
  }

  if (hasExpiry) {
    kpiCards.push({
      key: "expiry",
      label: "Dekat Kedaluwarsa",
      value: `${kpis.expiringCount} ${itemLower}`,
      sub: "Batas simpan <= 14 hari",
      href: "/dashboard/expiry",
      tone: kpis.expiringCount > 0 ? "text-[#c0392b]" : "text-[#22303c]",
    });
  } else if (hasDebts) {
    kpiCards.push({
      key: "debts",
      label: "Kasbon Belum Lunas",
      value: fmtRp(kpis.unpaidDebtTotal),
      sub: `${kpis.unpaidDebtCount} pelanggan belum lunas`,
      href: "/dashboard/debts",
      tone: kpis.unpaidDebtTotal > 0 ? "text-[#c0392b]" : "text-[#22303c]",
    });
  } else {
    kpiCards.push({
      key: "lowstock",
      label: "Stok Hampir Habis",
      value: `${kpis.stokMenipisCount} ${itemLower}`,
      sub: `Sisa <= ${config?.low_stock_threshold ?? 10} ${config?.default_unit || "unit"}`,
      href: "/dashboard/inventory",
      tone: kpis.stokMenipisCount > 0 ? "text-[#b56c09]" : "text-[#22303c]",
    });
  }

  if (hasOnline && focus !== "KEUANGAN_LABA") {
    kpiCards.push({
      key: "wa",
      label: "Pesanan WA Baru",
      value: `${kpis.pesananWaMenungguCount} pesanan`,
      sub: "Menunggu dicek & disetujui",
      href: "/dashboard/whatsapp-orders",
      tone: "text-[#1976d2]",
    });
  } else if (hasDebts && !kpiCards.some((c) => c.key === "debts")) {
    kpiCards.push({
      key: "debts",
      label: "Kasbon Belum Lunas",
      value: fmtRp(kpis.unpaidDebtTotal),
      sub: `${kpis.unpaidDebtCount} pelanggan belum lunas`,
      href: "/dashboard/debts",
      tone: kpis.unpaidDebtTotal > 0 ? "text-[#c0392b]" : "text-[#22303c]",
    });
  } else if (!kpiCards.some((c) => c.key === "lowstock")) {
    kpiCards.push({
      key: "lowstock",
      label: "Stok Hampir Habis",
      value: `${kpis.stokMenipisCount} ${itemLower}`,
      sub: `Sisa <= ${config?.low_stock_threshold ?? 10} ${config?.default_unit || "unit"}`,
      href: "/dashboard/inventory",
      tone: kpis.stokMenipisCount > 0 ? "text-[#b56c09]" : "text-[#22303c]",
    });
  } else {
    kpiCards.push({
      key: "stockvalue",
      label: `Nilai Modal ${itemTerm}`,
      value: fmtRp(kpis.nilaiStokModal),
      sub: `${kpis.totalProductsCount} jenis ${itemLower} di rak`,
      href: "/dashboard/inventory",
    });
  }

  const FinanceSpotlight = hasFinance ? (
    <div className="op-card overflow-hidden">
      <div className="flex flex-col justify-between gap-2 border-b border-[#d8e1ea] bg-[#f8fafc] px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[#1976d2]" />
          <div>
            <h2 className="text-sm text-[#22303c]">
              Rekap Keuangan Bulan Ini
            </h2>
            <p className="text-xs text-[#5f6f82]">
              Ringkasan uang masuk, pengeluaran, dan untung bersih siap simpan
              PDF
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/finance"
          className="op-btn op-btn-primary op-btn-sm self-start sm:self-auto"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span>Buka Rekap & PDF</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 divide-y divide-[#edf2f7] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <div className="text-xs text-[#5f6f82]">Uang Masuk Bulan Ini</div>
          <div className="mt-1 text-base text-[#22303c] tabular-nums">
            {fmtRp(kpis.omzetBulanIni)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-[#5f6f82]">Pengeluaran Tercatat</div>
          <div className="mt-1 text-base text-[#b56c09] tabular-nums">
            {fmtRp(kpis.pengeluaranBulanIni)}
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-[#5f6f82]">Perkiraan Untung Bersih</div>
          <div
            className={`mt-1 text-base tabular-nums ${
              kpis.labaBersihBulanIni < 0
                ? "text-[#c0392b]"
                : "text-[#167a6f]"
            }`}
          >
            {fmtRp(kpis.labaBersihBulanIni)}
          </div>
        </div>
      </div>
      {config?.enable_expense_tracker && recentExpenses.length > 0 && (
        <div className="border-t border-[#edf2f7] px-4 py-2.5 text-xs text-[#5f6f82]">
          Pengeluaran terakhir:{" "}
          <span className="text-[#22303c]">{recentExpenses[0].title}</span> (
          <span className="tabular-nums">
            {fmtRp(recentExpenses[0].amount)}
          </span>
          )
        </div>
      )}
    </div>
  ) : null;

  const OnlineStoreSpotlight = hasOnline ? (
    <div className="op-card flex flex-col justify-between gap-3 bg-[#f4f9ff] p-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#1976d2] ring-1 ring-[#d8e1ea]">
          <MessageSquare className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm text-[#22303c]">
            Toko Online & Antrean WhatsApp
          </h2>
          <p className="mt-0.5 text-xs text-[#5f6f82]">
            {kpis.pesananWaMenungguCount > 0
              ? `Ada ${kpis.pesananWaMenungguCount} pesanan baru dari pembeli yang menunggu disetujui.`
              : `Halaman toko online Anda aktif di /toko/${store.slug} dan siap dibagikan ke pembeli.`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/whatsapp-orders"
          className="op-btn op-btn-primary op-btn-sm flex-1 sm:flex-none"
        >
          Cek Pesanan WA
        </Link>
        <Link
          href={`/toko/${store.slug}`}
          target="_blank"
          rel="noreferrer"
          className="op-btn op-btn-sm flex-1 sm:flex-none"
        >
          <span>Buka Toko</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  ) : null;

  const ExpiryCard = hasExpiry ? (
    <div className="op-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#b56c09]" />
          <div>
            <h2 className="text-sm text-[#22303c]">
              {itemTerm} Dekat Kedaluwarsa
            </h2>
            <p className="text-xs text-[#5f6f82]">
              Batas simpan &le; 14 hari ke depan
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/expiry"
          className="text-xs text-[#1976d2] hover:underline"
        >
          Pantau Semua
        </Link>
      </div>
      <div className="divide-y divide-[#edf2f7]">
        {expiringProducts.length === 0 ? (
          <div className="p-4 text-xs text-[#5f6f82]">
            Semua tanggal kedaluwarsa {itemLower} masih aman.
          </div>
        ) : (
          expiringProducts.slice(0, 5).map((ep) => (
            <div
              key={ep.id}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs"
            >
              <div className="min-w-0">
                <div className="truncate text-[#22303c]">{ep.name}</div>
                <div className="text-[11px] text-[#5f6f82] tabular-nums">
                  Batas: {ep.expiry_date} | Sisa {ep.stock_qty} {ep.unit}
                </div>
              </div>
              <span
                className={`op-tag shrink-0 ${
                  ep.expStatus === "EXPIRED" ? "op-tag-danger" : "op-tag-warn"
                }`}
              >
                {ep.expLabel}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  ) : null;

  const DebtCard = hasDebts ? (
    <div className="op-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-[#5f6f82]">
          <BookOpen className="h-4 w-4 text-[#c0392b]" />
          <span>Buku Kasbon Belum Lunas</span>
        </div>
        <Link
          href="/dashboard/debts"
          className="text-xs text-[#1976d2] hover:underline"
        >
          Buka Buku Kasbon
        </Link>
      </div>
      <div className="mt-1.5 text-lg text-[#c0392b] tabular-nums">
        {fmtRp(kpis.unpaidDebtTotal)}
      </div>
      <div className="mt-0.5 text-[11px] text-[#5f6f82]">
        Dari {kpis.unpaidDebtCount} pelanggan yang belum melunasi bon
      </div>
    </div>
  ) : null;

  const LowStockCard = (
    <div className="op-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
        <div>
          <h2 className="text-sm text-[#22303c]">
            Pengingat Belanja {itemTerm}
          </h2>
          <p className="text-xs text-[#5f6f82]">
            Sisa &le; {config?.low_stock_threshold ?? 10}{" "}
            {config?.default_unit || "unit"}
          </p>
        </div>
        <Link
          href="/dashboard/inventory"
          className="text-xs text-[#1976d2] hover:underline"
        >
          Isi Stok
        </Link>
      </div>
      <div className="divide-y divide-[#edf2f7]">
        {lowStockProducts.length === 0 ? (
          <div className="p-4 text-xs text-[#5f6f82]">
            Belum ada {itemLower} yang stoknya menipis.
          </div>
        ) : (
          lowStockProducts.slice(0, 6).map((lp) => (
            <div
              key={lp.id}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs"
            >
              <div className="min-w-0">
                <div className="truncate text-[#22303c]">{lp.name}</div>
                <div className="text-[11px] text-[#5f6f82]">Kode: {lp.sku}</div>
              </div>
              <span className="op-tag op-tag-warn shrink-0 tabular-nums">
                Sisa {lp.stock_qty} {lp.unit}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const TopProductsCard = (
    <div className="op-card overflow-hidden">
      <div className="border-b border-[#d8e1ea] px-4 py-3">
        <h2 className="text-sm text-[#22303c]">{itemTerm} Paling Laris</h2>
        <p className="text-xs text-[#5f6f82]">
          {itemTerm} yang paling sering dibeli pelanggan
        </p>
      </div>
      <div className="divide-y divide-[#edf2f7]">
        {topProducts.length === 0 ? (
          <div className="p-4 text-xs text-[#5f6f82]">
            Daftar {itemLower} terlaris muncul setelah ada penjualan.
          </div>
        ) : (
          topProducts.map((tp) => (
            <div
              key={tp.id}
              className="flex items-center justify-between px-4 py-2.5 text-xs"
            >
              <div className="min-w-0 pr-2">
                <div className="truncate text-[#22303c]">{tp.name}</div>
                <div className="text-[11px] text-[#5f6f82] tabular-nums">
                  Terjual {tp.qtySold}
                </div>
              </div>
              <div className="shrink-0 text-right text-[#22303c] tabular-nums">
                {fmtRp(tp.revenue)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const RecentTransactionsCard = (
    <div className="op-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
        <div>
          <h2 className="text-sm text-[#22303c]">Catatan Jualan Terbaru</h2>
          <p className="text-xs text-[#5f6f82]">
            Pembelian terakhir di kasir toko
            {hasOnline ? " maupun lewat WhatsApp" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/transactions"
          aria-label="Lihat semua penjualan"
          title="Lihat semua penjualan"
          className="op-btn op-btn-sm"
        >
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* TAMPILAN KARTU MOBILE (< 768px) */}
      <div className="divide-y divide-[#edf2f7] md:hidden">
        {recentTransactions.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
            <p>
              {kpis.totalProductsCount === 0
                ? `Tambahkan ${itemLower} terlebih dahulu agar kasir siap digunakan.`
                : "Belum ada penjualan tercatat hari ini."}
            </p>
            <Link
              href={
                kpis.totalProductsCount === 0
                  ? "/dashboard/inventory/new"
                  : "/dashboard/pos"
              }
              className="mt-2 inline-flex min-h-[40px] items-center gap-1 text-[#1976d2] hover:underline"
            >
              {kpis.totalProductsCount === 0
                ? `Tambah ${itemTerm}`
                : "Buka Kasir"}
              <ArrowRight aria-hidden="true" className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          recentTransactions.map((trx) => (
            <div key={trx.id} className="space-y-2 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs text-[#22303c]">
                    {trx.invoice_code}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-[#5f6f82]">
                    {trx.customer_name || "Pembeli Umum"} ·{" "}
                    {fmtDateTime(trx.created_at)}
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm text-[#22303c] tabular-nums">
                  {fmtRp(trx.total_amount)}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {trx.channel === "WHATSAPP_ONLINE" ? (
                    <span className="op-tag op-tag-info">WhatsApp</span>
                  ) : (
                    <span className="op-tag">Di Toko</span>
                  )}
                  <span className="op-tag">{trx.payment_method}</span>
                </div>
                <div>
                  {trx.status === "COMPLETED" && (
                    <span className="op-tag op-tag-success">Selesai</span>
                  )}
                  {trx.status === "PENDING_CONFIRMATION" && (
                    <Link
                      href="/dashboard/whatsapp-orders"
                      className="op-tag op-tag-warn"
                    >
                      Menunggu Disetujui
                    </Link>
                  )}
                  {trx.status === "CANCELLED" && (
                    <span className="op-tag op-tag-danger">Dibatalkan</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TAMPILAN TABEL DESKTOP (>= 768px) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="op-table">
          <thead>
            <tr>
              <th>Nota</th>
              <th>Waktu</th>
              <th>Asal</th>
              <th>Bayar</th>
              <th className="text-right">Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-xs text-[#5f6f82]"
                >
                  <p>
                    {kpis.totalProductsCount === 0
                      ? `Tambahkan ${itemLower} terlebih dahulu agar kasir siap digunakan.`
                      : "Belum ada penjualan tercatat hari ini."}
                  </p>
                  <Link
                    href={
                      kpis.totalProductsCount === 0
                        ? "/dashboard/inventory/new"
                        : "/dashboard/pos"
                    }
                    className="mt-2 inline-flex items-center gap-1 text-[#1976d2] hover:underline"
                  >
                    {kpis.totalProductsCount === 0
                      ? `Tambah ${itemTerm}`
                      : "Buka Kasir"}
                    <ArrowRight aria-hidden="true" className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ) : (
              recentTransactions.map((trx) => (
                <tr key={trx.id}>
                  <td>
                    <div className="text-xs text-[#22303c]">
                      {trx.invoice_code}
                    </div>
                    <div className="text-[11px] text-[#5f6f82]">
                      {trx.customer_name || "Pembeli Umum"}
                      {config?.enable_shift_log && trx.shift_name
                        ? ` | Jaga ${trx.shift_name}`
                        : ""}
                    </div>
                  </td>
                  <td className="text-xs text-[#5f6f82]">
                    {fmtDateTime(trx.created_at)}
                  </td>
                  <td>
                    {trx.channel === "WHATSAPP_ONLINE" ? (
                      <span className="op-tag op-tag-info">WhatsApp</span>
                    ) : (
                      <span className="op-tag">Di Toko</span>
                    )}
                  </td>
                  <td className="text-xs text-[#22303c]">
                    {trx.payment_method}
                  </td>
                  <td className="text-right text-xs text-[#22303c] tabular-nums">
                    {fmtRp(trx.total_amount)}
                  </td>
                  <td>
                    {trx.status === "COMPLETED" && (
                      <span className="op-tag op-tag-success">Selesai</span>
                    )}
                    {trx.status === "PENDING_CONFIRMATION" && (
                      <Link
                        href="/dashboard/whatsapp-orders"
                        className="op-tag op-tag-warn hover:underline"
                      >
                        Menunggu Disetujui
                      </Link>
                    )}
                    {trx.status === "CANCELLED" && (
                      <span className="op-tag op-tag-danger">Dibatalkan</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={`Halo, ${ownerName || "Pemilik Toko"}`}
        subtitle={`${config?.template_label || `Ringkasan ${store.store_name}`} - Catatan harian dan sisa ${itemLower} Anda.`}
        breadcrumb="Ringkasan Toko"
        actions={
          <>
            <Link
              href={
                kpis.totalProductsCount === 0
                  ? "/dashboard/inventory/new"
                  : "/dashboard/pos"
              }
              className="op-btn op-btn-primary flex-1 sm:flex-none"
            >
              {kpis.totalProductsCount === 0 ? (
                <PackagePlus aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {kpis.totalProductsCount === 0
                ? `Tambah ${itemTerm}`
                : "Buka Kasir"}
            </Link>
            {hasFinance ? (
              <Link
                href="/dashboard/finance"
                className="op-btn flex-1 sm:flex-none"
              >
                <FileDown aria-hidden="true" className="h-3.5 w-3.5" />
                <span>Rekap & PDF</span>
              </Link>
            ) : (
              <Link
                href="/dashboard/inventory"
                className="op-btn flex-1 sm:flex-none"
              >
                {itemTerm} & Stok
              </Link>
            )}
          </>
        }
      />

      {kpis.totalProductsCount === 0 && (
        <section
          aria-labelledby="first-product-heading"
          className="op-card mb-5 flex flex-col gap-4 bg-[#eef5fb] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-white text-[#1976d2]">
              <PackagePlus aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <h2 id="first-product-heading" className="text-sm text-[#22303c]">
                Langkah pertama: masukkan {itemLower} dagangan Anda
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#5f6f82]">
                Isi nama, harga beli, harga jual, dan jumlah stok supaya siap
                dicatat di kasir{hasOnline ? " dan tampil di toko online" : ""}.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/inventory/new"
            className="op-btn op-btn-primary shrink-0 self-start sm:self-center"
          >
            <PackagePlus aria-hidden="true" className="h-3.5 w-3.5" />
            Tambah {itemTerm}
          </Link>
        </section>
      )}

      {/* 4 KOTAK ANGKA PENTING (DINAMIS SESUAI KEBUTUHAN USAHA) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const inner = (
            <>
              <div className="text-[11px] text-[#5f6f82] sm:text-xs">
                {card.label}
              </div>
              <div
                className={`mt-1.5 truncate text-base tabular-nums sm:text-xl ${
                  card.tone || "text-[#22303c]"
                }`}
              >
                {card.value}
              </div>
              <div className="mt-1 text-[11px] text-[#5f6f82]">{card.sub}</div>
            </>
          );

          return card.href ? (
            <Link
              key={card.key}
              href={card.href}
              className="op-card block p-3.5 transition-colors hover:border-[#1976d2] sm:p-4"
            >
              {inner}
            </Link>
          ) : (
            <div key={card.key} className="op-card p-3.5 sm:p-4">
              {inner}
            </div>
          );
        })}
      </div>

      {/* PANEL RINGKASAN MENU KHUSUS TOKO INI */}
      <div className="op-card mt-4 flex flex-col justify-between gap-3 bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#22303c]">
            <span className="mr-1">
              {config?.template_label || "Menu di Toko Ini"}:
            </span>
            {quickPages.length === 0 ? (
              <span className="op-tag">Kasir & Stok Ringkas</span>
            ) : (
              quickPages.map((qp) => (
                <Link
                  key={qp.label}
                  href={qp.href}
                  className="op-tag op-tag-info hover:underline"
                >
                  {qp.label}
                </Link>
              ))
            )}
          </div>
          {config?.ai_summary_reason && (
            <p className="mt-1.5 text-xs leading-relaxed text-[#5f6f82]">
              {config.ai_summary_reason}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/settings"
          className="op-btn op-btn-sm shrink-0 self-start sm:self-center"
        >
          Atur Menu Toko
        </Link>
      </div>

      {/* GRID UTAMA ADAPTIF BERDASARKAN FOKUS USAHA */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          {focus === "KEUANGAN_LABA" && FinanceSpotlight}
          {focus === "KATALOG_ONLINE" && OnlineStoreSpotlight}
          {focus === "KASIR_CEPAT" && ExpiryCard}
          {focus === "STOK_GROSIR" && LowStockCard}

          {config?.enable_shift_log && shiftSummary.length > 0 && (
            <div className="op-card overflow-hidden">
              <div className="border-b border-[#d8e1ea] px-4 py-2.5">
                <h2 className="text-xs text-[#22303c]">
                  Hasil Penjualan per Jadwal Jaga Kasir Hari Ini
                </h2>
              </div>
              <div className="grid grid-cols-1 divide-y divide-[#edf2f7] text-xs sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {shiftSummary.map((s) => (
                  <div key={s.shift} className="p-3">
                    <div className="text-[#5f6f82]">Jaga {s.shift}</div>
                    <div className="mt-1 text-sm text-[#22303c] tabular-nums">
                      {fmtRp(s.revenue)}
                    </div>
                    <div className="text-[11px] text-[#5f6f82]">
                      {s.count} kali beli
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {RecentTransactionsCard}

          {focus !== "KEUANGAN_LABA" && FinanceSpotlight}
        </div>

        <div className="space-y-5 lg:col-span-4">
          {focus !== "KATALOG_ONLINE" && OnlineStoreSpotlight}
          {focus !== "KASIR_CEPAT" && ExpiryCard}
          {DebtCard}
          {focus !== "STOK_GROSIR" && LowStockCard}
          {TopProductsCard}
        </div>
      </div>
    </div>
  );
}
