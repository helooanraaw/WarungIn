"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/erp/AppShell";
import { fmtDateTime, fmtRp } from "@/lib/format";

interface DashboardData {
  store: {
    id: string;
    store_name: string;
    slug: string;
    category: string;
    is_online_enabled: boolean;
  };
  config: {
    enable_expiry_tracking: boolean;
    enable_variant_matrix: boolean;
    enable_wholesale_tier: boolean;
    enable_shift_log: boolean;
    enable_debt_book: boolean;
    low_stock_threshold: number;
    ai_summary_reason: string;
  } | null;
  kpis: {
    omzetHariIni: number;
    transaksiHariIni: number;
    stokMenipisCount: number;
    pesananWaMenungguCount: number;
    totalProductsCount: number;
    unpaidDebtTotal: number;
    unpaidDebtCount: number;
  };
  recentTransactions: {
    id: string;
    invoice_code: string;
    channel: string;
    status: string;
    payment_method: string;
    customer_name: string | null;
    total_amount: number;
    created_at: string;
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
}

export default function DashboardOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.error) setData(resData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="op-card p-6 text-xs text-[#5f6f82]">
        Memuat ringkasan harian toko...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="op-card p-6 text-xs text-[#c0392b]">
        Gagal memuat data dashboard. Silakan muat ulang halaman.
      </div>
    );
  }

  const { kpis, config, recentTransactions, topProducts, lowStockProducts } =
    data;

  const activeModules: string[] = [];
  if (config?.enable_expiry_tracking)
    activeModules.push("Tanggal Kedaluwarsa");
  if (config?.enable_variant_matrix) activeModules.push("Ukuran & Warna");
  if (config?.enable_wholesale_tier) activeModules.push("Harga Grosir");
  if (config?.enable_shift_log) activeModules.push("Shift Kasir");
  if (config?.enable_debt_book) activeModules.push("Buku Kasbon");

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan penjualan, sisa stok, dan aktivitas kasir hari ini."
        breadcrumb="Dashboard"
        actions={
          <>
            <Link href="/dashboard/pos" className="op-btn op-btn-primary">
              Buka Kasir (POS)
            </Link>
            <Link href="/dashboard/inventory" className="op-btn">
              Kelola Stok
            </Link>
          </>
        }
      />

      {/* 4 KARTU METRIK UTAMA */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="op-card p-4">
          <div className="text-xs text-[#5f6f82]">Omzet Hari Ini</div>
          <div className="mt-1.5 text-xl text-[#22303c] tabular-nums">
            {fmtRp(kpis.omzetHariIni)}
          </div>
          <div className="mt-1 text-[11px] text-[#5f6f82]">
            Total uang masuk dari transaksi selesai
          </div>
        </div>

        <div className="op-card p-4">
          <div className="text-xs text-[#5f6f82]">Transaksi Hari Ini</div>
          <div className="mt-1.5 text-xl text-[#22303c] tabular-nums">
            {kpis.transaksiHariIni} nota
          </div>
          <div className="mt-1 text-[11px] text-[#5f6f82]">
            Gabungan kasir toko dan WhatsApp
          </div>
        </div>

        <div className="op-card p-4">
          <div className="text-xs text-[#5f6f82]">Stok Menipis</div>
          <div className="mt-1.5 text-xl text-[#b56c09] tabular-nums">
            {kpis.stokMenipisCount} produk
          </div>
          <div className="mt-1 text-[11px] text-[#5f6f82]">
            Sisa stok di bawah {config?.low_stock_threshold ?? 10} unit
          </div>
        </div>

        <div className="op-card p-4">
          <div className="text-xs text-[#5f6f82]">Pesanan WA Menunggu</div>
          <div className="mt-1.5 text-xl text-[#1976d2] tabular-nums">
            {kpis.pesananWaMenungguCount} pesanan
          </div>
          <div className="mt-1 text-[11px] text-[#5f6f82]">
            Perlu dikonfirmasi agar stok terpotong
          </div>
        </div>
      </div>

      {/* PANEL INFORMASI MODUL ADAPTIF TOKO */}
      <div className="op-card mt-4 flex flex-col justify-between gap-3 bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#22303c]">
            <span>Modul Aktif Sesuai Profil Usaha:</span>
            {activeModules.length === 0 ? (
              <span className="op-tag">Kasir & Stok Standar</span>
            ) : (
              activeModules.map((m) => (
                <span key={m} className="op-tag op-tag-info">
                  {m}
                </span>
              ))
            )}
          </div>
          {config?.ai_summary_reason && (
            <p className="mt-1 text-xs text-[#5f6f82]">
              {config.ai_summary_reason}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/settings"
          className="op-btn op-btn-sm shrink-0 self-start sm:self-center"
        >
          Atur Modul
        </Link>
      </div>

      {/* GRID UTAMA: TABEL TRANSAKSI TERAKHIR (8 KOLOM) & PANEL SAMPING (4 KOLOM) */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* TABEL TRANSAKSI TERAKHIR */}
        <div className="op-card overflow-hidden lg:col-span-8">
          <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
            <div>
              <h2 className="text-sm text-[#22303c]">Transaksi Terakhir</h2>
              <p className="text-xs text-[#5f6f82]">
                Daftar aktivitas penjualan terbaru di kasir dan WhatsApp
              </p>
            </div>
            <Link
              href="/dashboard/transactions"
              className="op-btn op-btn-sm"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Kode Nota</th>
                  <th>Waktu</th>
                  <th>Jalur</th>
                  <th>Pembayaran</th>
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
                      Belum ada transaksi tercatat hari ini. Buka menu Kasir
                      (POS) untuk mencatat penjualan pertama.
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
                        </div>
                      </td>
                      <td className="text-xs text-[#5f6f82]">
                        {fmtDateTime(trx.created_at)}
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
                            Menunggu Konfirmasi
                          </Link>
                        )}
                        {trx.status === "CANCELLED" && (
                          <span className="op-tag op-tag-danger">
                            Dibatalkan
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* KOLOM SAMPING: PRODUK TERLARIS + PERINGATAN STOK MENIPIS */}
        <div className="space-y-5 lg:col-span-4">
          {/* PRODUK TERLARIS */}
          <div className="op-card overflow-hidden">
            <div className="border-b border-[#d8e1ea] px-4 py-3">
              <h2 className="text-sm text-[#22303c]">Produk Terlaris</h2>
              <p className="text-xs text-[#5f6f82]">
                Urutan barang dengan jumlah terjual tertinggi
              </p>
            </div>
            <div className="divide-y divide-[#edf2f7]">
              {topProducts.length === 0 ? (
                <div className="p-4 text-xs text-[#5f6f82]">
                  Data produk terlaris akan muncul setelah ada transaksi selesai.
                </div>
              ) : (
                topProducts.map((tp) => (
                  <div
                    key={tp.id}
                    className="flex items-center justify-between px-4 py-2.5 text-xs"
                  >
                    <div className="pr-2">
                      <div className="text-[#22303c]">{tp.name}</div>
                      <div className="text-[11px] text-[#5f6f82] tabular-nums">
                        Terjual: {tp.qtySold} unit
                      </div>
                    </div>
                    <div className="text-right text-[#22303c] tabular-nums">
                      {fmtRp(tp.revenue)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PERINGATAN STOK MENIPIS */}
          <div className="op-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
              <div>
                <h2 className="text-sm text-[#22303c]">
                  Peringatan Stok Menipis
                </h2>
                <p className="text-xs text-[#5f6f82]">
                  Barang dengan sisa stok &le; {config?.low_stock_threshold ?? 10}
                </p>
              </div>
              <Link
                href="/dashboard/inventory"
                className="text-xs text-[#1976d2] hover:underline"
              >
                Tambah Stok
              </Link>
            </div>
            <div className="divide-y divide-[#edf2f7]">
              {lowStockProducts.length === 0 ? (
                <div className="p-4 text-xs text-[#5f6f82]">
                  Semua stok barang berada di atas batas aman.
                </div>
              ) : (
                lowStockProducts.map((lp) => (
                  <div
                    key={lp.id}
                    className="flex items-center justify-between px-4 py-2.5 text-xs"
                  >
                    <div>
                      <div className="text-[#22303c]">{lp.name}</div>
                      <div className="text-[11px] text-[#5f6f82]">
                        Kode: {lp.sku}
                        {config?.enable_expiry_tracking && lp.expiry_date
                          ? ` | Exp: ${lp.expiry_date}`
                          : ""}
                      </div>
                    </div>
                    <span className="op-tag op-tag-warn tabular-nums">
                      Sisa {lp.stock_qty} {lp.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RINGKASAN KASBON JIKA MODUL AKTIF */}
          {config?.enable_debt_book && (
            <div className="op-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#5f6f82]">
                  Catatan Kasbon Belum Lunas
                </span>
                <Link
                  href="/dashboard/transactions"
                  className="text-xs text-[#1976d2] hover:underline"
                >
                  Kelola Kasbon
                </Link>
              </div>
              <div className="mt-1.5 text-lg text-[#c0392b] tabular-nums">
                {fmtRp(kpis.unpaidDebtTotal)}
              </div>
              <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                Dari {kpis.unpaidDebtCount} transaksi kasbon pelanggan
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
