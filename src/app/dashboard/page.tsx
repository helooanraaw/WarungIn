"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  PackagePlus,
  RotateCw,
  ShoppingCart,
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
    template_label: string;
    custom_attribute_label: string;
    default_unit: string;
    enable_expiry_tracking: boolean;
    enable_variant_matrix: boolean;
    enable_wholesale_tier: boolean;
    enable_manual_discount: boolean;
    enable_shift_log: boolean;
    enable_debt_book: boolean;
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
        Memuat ringkasan harian toko...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="op-card flex flex-col items-start gap-3 p-6 text-xs text-[#5f6f82]">
        <p role="alert" className="text-[#c0392b]">
          Gagal memuat data ringkasan. Coba muat ulang data toko.
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
    topProducts,
    lowStockProducts,
    expiringProducts,
    shiftSummary,
  } = data;

  const activeFeatures: string[] = [];
  if (config?.enable_expiry_tracking)
    activeFeatures.push("Pengingat Kadaluarsa");
  if (config?.enable_variant_matrix)
    activeFeatures.push(config.custom_attribute_label || "Pilihan Barang");
  if (config?.enable_wholesale_tier) activeFeatures.push("Harga Grosir");
  if (config?.enable_manual_discount) activeFeatures.push("Diskon Kasir");
  if (config?.enable_shift_log) activeFeatures.push("Jadwal Jaga Kasir");
  if (config?.enable_debt_book) activeFeatures.push("Catatan Bon");

  return (
    <div>
      <PageHeader
        title={`Halo, ${ownerName || "Pemilik Toko"}`}
        subtitle={`Catatan jualan dan sisa stok di ${store.store_name} hari ini.`}
        breadcrumb="Ringkasan Toko"
        actions={
          <>
            <Link
              href={
                kpis.totalProductsCount === 0
                  ? "/dashboard/inventory"
                  : "/dashboard/pos"
              }
              className="op-btn op-btn-primary flex-1 sm:flex-none"
            >
              {kpis.totalProductsCount === 0 ? (
                <PackagePlus aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {kpis.totalProductsCount === 0 ? "Tambah Barang" : "Buka Kasir"}
            </Link>
            <Link href="/dashboard/inventory" className="op-btn flex-1 sm:flex-none">
              Barang & Stok
            </Link>
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
                Langkah pertama: masukkan barang dagangan
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#5f6f82]">
                Isi nama, harga, dan stok. Setelah itu, barang bisa dicatat di
                kasir dan ditampilkan di katalog toko.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/inventory"
            className="op-btn op-btn-primary shrink-0 self-start sm:self-center"
          >
            <PackagePlus aria-hidden="true" className="h-3.5 w-3.5" />
            Tambahkan barang
          </Link>
        </section>
      )}

      {/* 4 KOTAK ANGKA PENTING HARI INI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="op-card p-3.5 sm:p-4">
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Uang Masuk Hari Ini
          </div>
          <div className="mt-1.5 truncate text-base text-[#22303c] tabular-nums sm:text-xl">
            {fmtRp(kpis.omzetHariIni)}
          </div>
          <div className="mt-1 text-[11px] text-[#5f6f82]">
            Dari penjualan selesai hari ini
          </div>
        </div>

        <Link
          href="/dashboard/transactions"
          className="op-card block p-3.5 transition-colors hover:border-[#1976d2] sm:p-4"
        >
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Jumlah Pembeli
          </div>
          <div className="mt-1.5 text-base text-[#22303c] tabular-nums sm:text-xl">
            {kpis.transaksiHariIni} kali beli
          </div>
          <div className="mt-1 text-[11px] text-[#5f6f82]">
            Kasir toko & WhatsApp
          </div>
        </Link>

        <Link
          href="/dashboard/inventory"
          className="op-card block p-3.5 transition-colors hover:border-[#1976d2] sm:p-4"
        >
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Stok Hampir Habis
          </div>
          <div className="mt-1.5 text-base text-[#b56c09] tabular-nums sm:text-xl">
            {kpis.stokMenipisCount} barang
          </div>
          <div className="mt-1 text-[11px] text-[#5f6f82]">
            Sisa &le; {config?.low_stock_threshold ?? 10}{" "}
            {config?.default_unit || "unit"}
          </div>
        </Link>

        <Link
          href="/dashboard/whatsapp-orders"
          className="op-card block p-3.5 transition-colors hover:border-[#1976d2] sm:p-4"
        >
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Pesanan WA Baru
          </div>
          <div className="mt-1.5 text-base text-[#1976d2] tabular-nums sm:text-xl">
            {kpis.pesananWaMenungguCount} pesanan
          </div>
          <div className="mt-1 text-[11px] text-[#5f6f82]">
            Menunggu disetujui
          </div>
        </Link>
      </div>

      {/* PANEL INFORMASI PENGATURAN TOKO */}
      <div className="op-card mt-4 flex flex-col justify-between gap-3 bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#22303c]">
            <span>{config?.template_label || "Menu di Toko Ini"}:</span>
            {activeFeatures.length === 0 ? (
              <span className="op-tag">Kasir & Stok Standar</span>
            ) : (
              activeFeatures.map((m) => (
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
          Atur Menu Toko
        </Link>
      </div>

      {/* GRID UTAMA */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
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
                      {s.count} nota
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="op-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
              <div>
                <h2 className="text-sm text-[#22303c]">Catatan Jualan Terbaru</h2>
                <p className="text-xs text-[#5f6f82]">
                  Pembelian terakhir di kasir toko maupun lewat WhatsApp
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
                      ? "Tambahkan barang terlebih dahulu agar kasir siap digunakan."
                      : "Belum ada penjualan tercatat hari ini."}
                  </p>
                  <Link
                    href={
                      kpis.totalProductsCount === 0
                        ? "/dashboard/inventory"
                        : "/dashboard/pos"
                    }
                    className="mt-2 inline-flex min-h-[40px] items-center gap-1 text-[#1976d2] hover:underline"
                  >
                    {kpis.totalProductsCount === 0
                      ? "Buka Barang & Stok"
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
                          <span className="op-tag">Kasir Toko</span>
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
                          <span className="op-tag op-tag-danger">
                            Dibatalkan
                          </span>
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
                    <th>No. Nota</th>
                    <th>Waktu</th>
                    <th>Asal</th>
                    <th>Cara Bayar</th>
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
                            ? "Tambahkan barang terlebih dahulu agar kasir siap digunakan."
                            : "Belum ada penjualan tercatat hari ini."}
                        </p>
                        <Link
                          href={
                            kpis.totalProductsCount === 0
                              ? "/dashboard/inventory"
                              : "/dashboard/pos"
                          }
                          className="mt-2 inline-flex items-center gap-1 text-[#1976d2] hover:underline"
                        >
                          {kpis.totalProductsCount === 0
                            ? "Buka Barang & Stok"
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
                            <span className="op-tag op-tag-success">
                              Selesai
                            </span>
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
        </div>

        <div className="space-y-5 lg:col-span-4">
          {config?.enable_expiry_tracking && (
            <div className="op-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
                <div>
                  <h2 className="text-sm text-[#22303c]">
                    Barang Dekat Kadaluarsa
                  </h2>
                  <p className="text-xs text-[#5f6f82]">
                    Batas pakai &le; 14 hari ke depan
                  </p>
                </div>
                <Link
                  href="/dashboard/inventory"
                  className="text-xs text-[#1976d2] hover:underline"
                >
                  Cek Barang
                </Link>
              </div>
              <div className="divide-y divide-[#edf2f7]">
                {expiringProducts.length === 0 ? (
                  <div className="p-4 text-xs text-[#5f6f82]">
                    Semua tanggal kadaluarsa barang masih aman.
                  </div>
                ) : (
                  expiringProducts.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center justify-between px-4 py-2.5 text-xs"
                    >
                      <div>
                        <div className="text-[#22303c]">{ep.name}</div>
                        <div className="text-[11px] text-[#5f6f82] tabular-nums">
                          Batas: {ep.expiry_date} | Sisa {ep.stock_qty} {ep.unit}
                        </div>
                      </div>
                      <span
                        className={`op-tag ${
                          ep.expStatus === "EXPIRED"
                            ? "op-tag-danger"
                            : "op-tag-warn"
                        }`}
                      >
                        {ep.expLabel}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="op-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
              <div>
                <h2 className="text-sm text-[#22303c]">
                  Pengingat Belanja Stok
                </h2>
                <p className="text-xs text-[#5f6f82]">
                  Barang sisa &le; {config?.low_stock_threshold ?? 10}{" "}
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
                  Belum ada barang yang stoknya menipis.
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

          <div className="op-card overflow-hidden">
            <div className="border-b border-[#d8e1ea] px-4 py-3">
              <h2 className="text-sm text-[#22303c]">Barang Paling Laris</h2>
              <p className="text-xs text-[#5f6f82]">
                Barang yang paling sering dibeli pelanggan
              </p>
            </div>
            <div className="divide-y divide-[#edf2f7]">
              {topProducts.length === 0 ? (
                <div className="p-4 text-xs text-[#5f6f82]">
                  Daftar barang terlaris akan muncul setelah ada penjualan.
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
                        Terjual {tp.qtySold}
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

          {config?.enable_debt_book && (
            <div className="op-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#5f6f82]">
                  Catatan Bon Belum Dibayar
                </span>
                <Link
                  href="/dashboard/transactions"
                  className="text-xs text-[#1976d2] hover:underline"
                >
                  Lihat Daftar
                </Link>
              </div>
              <div className="mt-1.5 text-lg text-[#c0392b] tabular-nums">
                {fmtRp(kpis.unpaidDebtTotal)}
              </div>
              <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                Dari {kpis.unpaidDebtCount} catatan bon pelanggan
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
