"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/erp/AppShell";
import { fmtDate, fmtRp, getExpiryStatus } from "@/lib/format";
import { CalendarClock, Package, Plus, Search } from "lucide-react";

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  product_category: string | null;
  image_url: string | null;
  unit: string;
  sell_price: number;
  stock_qty: number;
  expiry_date: string | null;
}

type FilterKey = "ALL" | "EXPIRED" | "EXPIRING_SOON" | "SAFE" | "NONE";

export default function ExpiryWatchPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [itemTerm, setItemTerm] = useState("Barang");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.products)) {
          setProducts(data.products);
        }
        if (data.config?.item_term) {
          setItemTerm(data.config.item_term);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const enriched = products
    .map((p) => ({
      product: p,
      expiry: getExpiryStatus(p.expiry_date),
    }))
    .sort((a, b) => {
      const rank = { EXPIRED: 0, EXPIRING_SOON: 1, SAFE: 2, NONE: 3 };
      const diff = rank[a.expiry.status] - rank[b.expiry.status];
      if (diff !== 0) return diff;
      const dA = a.expiry.daysLeft ?? 99999;
      const dB = b.expiry.daysLeft ?? 99999;
      return dA - dB;
    });

  const counts = {
    EXPIRED: enriched.filter((x) => x.expiry.status === "EXPIRED").length,
    EXPIRING_SOON: enriched.filter((x) => x.expiry.status === "EXPIRING_SOON")
      .length,
    SAFE: enriched.filter((x) => x.expiry.status === "SAFE").length,
    NONE: enriched.filter((x) => x.expiry.status === "NONE").length,
  };

  const filtered = enriched.filter(({ product, expiry }) => {
    if (filter !== "ALL" && expiry.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      product.name.toLowerCase().includes(q) ||
      (product.product_category || "").toLowerCase().includes(q)
    );
  });

  function renderStatusBadge(status: "EXPIRED" | "EXPIRING_SOON" | "SAFE" | "NONE", daysLeft: number | null) {
    if (status === "EXPIRED") {
      return (
        <span className="op-tag op-tag-danger">
          {daysLeft === 0
            ? "Berakhir Hari Ini"
            : `Lewat ${Math.abs(daysLeft || 0)} hari`}
        </span>
      );
    }
    if (status === "EXPIRING_SOON") {
      return (
        <span className="op-tag op-tag-warning">
          Sisa {daysLeft} hari lagi
        </span>
      );
    }
    if (status === "SAFE") {
      return (
        <span className="op-tag op-tag-success">
          Aman ({daysLeft} hari lagi)
        </span>
      );
    }
    return <span className="op-tag">Belum Diisi</span>;
  }

  return (
    <div>
      <PageHeader
        title="Pantau Kedaluwarsa"
        subtitle={`Cek ${itemTerm.toLowerCase()} yang sudah lewat tanggal atau hampir habis masa berlakunya agar selalu segar dan tidak merugi.`}
        breadcrumb="Pantau Kedaluwarsa"
        actions={
          <Link
            href="/dashboard/inventory/new"
            className="op-btn op-btn-primary w-full sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah {itemTerm}</span>
          </Link>
        }
      />

      {/* RINGKASAN STATUS KEDALUWARSA */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <button
          type="button"
          onClick={() => setFilter(filter === "EXPIRED" ? "ALL" : "EXPIRED")}
          className={`op-card p-3.5 text-left transition-colors sm:p-4 ${
            filter === "EXPIRED" ? "border-[#c0392b] bg-[#fdf2f2]" : ""
          }`}
        >
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Sudah Lewat Batas
          </div>
          <div className="mt-1 text-lg text-[#c0392b] tabular-nums">
            {counts.EXPIRED} {itemTerm.toLowerCase()}
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setFilter(filter === "EXPIRING_SOON" ? "ALL" : "EXPIRING_SOON")
          }
          className={`op-card p-3.5 text-left transition-colors sm:p-4 ${
            filter === "EXPIRING_SOON" ? "border-[#d97706] bg-[#fff8eb]" : ""
          }`}
        >
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Segera Berakhir (&le; 14 Hari)
          </div>
          <div className="mt-1 text-lg text-[#b45309] tabular-nums">
            {counts.EXPIRING_SOON} {itemTerm.toLowerCase()}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === "SAFE" ? "ALL" : "SAFE")}
          className={`op-card p-3.5 text-left transition-colors sm:p-4 ${
            filter === "SAFE" ? "border-[#167a6f] bg-[#eefaf8]" : ""
          }`}
        >
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Masih Aman (&gt; 14 Hari)
          </div>
          <div className="mt-1 text-lg text-[#167a6f] tabular-nums">
            {counts.SAFE} {itemTerm.toLowerCase()}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === "NONE" ? "ALL" : "NONE")}
          className={`op-card p-3.5 text-left transition-colors sm:p-4 ${
            filter === "NONE" ? "border-[#1976d2] bg-[#eff6ff]" : ""
          }`}
        >
          <div className="text-[11px] text-[#5f6f82] sm:text-xs">
            Belum Diisi Tanggal
          </div>
          <div className="mt-1 text-lg text-[#22303c] tabular-nums">
            {counts.NONE} {itemTerm.toLowerCase()}
          </div>
        </button>
      </div>

      {/* FILTER & CARI */}
      <div className="op-card mb-4 p-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { key: "ALL", label: `Semua (${enriched.length})` },
                { key: "EXPIRED", label: `Lewat (${counts.EXPIRED})` },
                {
                  key: "EXPIRING_SOON",
                  label: `<= 14 Hari (${counts.EXPIRING_SOON})`,
                },
                { key: "SAFE", label: `Aman (${counts.SAFE})` },
                { key: "NONE", label: `Belum Diisi (${counts.NONE})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`shrink-0 rounded-[6px] border px-3 py-1.5 text-xs transition-colors ${
                  filter === tab.key
                    ? "border-[#1976d2] bg-[#1976d2] text-white"
                    : "border-[#d8e1ea] bg-white text-[#5f6f82] hover:bg-[#f8fafc]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5f6f82]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Cari nama ${itemTerm.toLowerCase()}...`}
              className="op-input pl-9"
            />
          </div>
        </div>
      </div>

      {/* DAFTAR BARANG */}
      <div className="op-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-xs text-[#5f6f82]">
            Memuat daftar tanggal kedaluwarsa...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5f6f82]">
            <CalendarClock className="mx-auto mb-2 h-6 w-6 text-[#9fb1c1]" />
            <div>
              Tidak ada {itemTerm.toLowerCase()} pada kelompok ini.
            </div>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS */}
            <div className="divide-y divide-[#edf2f7] md:hidden">
              {filtered.map(({ product, expiry }) => (
                <div key={product.id} className="space-y-2.5 p-4 text-xs">
                  <div className="flex items-start gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-12 w-12 shrink-0 rounded-[6px] border border-[#d8e1ea] object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[6px] border border-[#d8e1ea] bg-[#f8fafc] text-[#9fb1c1]">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-[#22303c]">
                        {product.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                        Sisa stok: {product.stock_qty} {product.unit} -{" "}
                        {fmtRp(product.sell_price)}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {renderStatusBadge(expiry.status, expiry.daysLeft)}
                        {product.expiry_date && (
                          <span className="text-[11px] text-[#5f6f82]">
                            Tgl: {fmtDate(product.expiry_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={`/dashboard/inventory/${product.id}`}
                      className="op-btn op-btn-sm w-full justify-center"
                    >
                      Ubah Tanggal / Stok
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Nama {itemTerm}</th>
                    <th>Kategori</th>
                    <th className="text-right">Sisa Stok</th>
                    <th>Tanggal Kedaluwarsa</th>
                    <th>Status</th>
                    <th className="text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ product, expiry }) => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-9 w-9 shrink-0 rounded-[4px] border border-[#d8e1ea] object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#d8e1ea] bg-[#f8fafc] text-[#9fb1c1]">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-[#22303c]">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-[#5f6f82]">
                              {fmtRp(product.sell_price)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-[#5f6f82]">
                        {product.product_category || "-"}
                      </td>
                      <td className="text-right text-xs whitespace-nowrap text-[#22303c] tabular-nums">
                        {product.stock_qty} {product.unit}
                      </td>
                      <td className="whitespace-nowrap text-xs text-[#22303c]">
                        {product.expiry_date ? fmtDate(product.expiry_date) : "-"}
                      </td>
                      <td>{renderStatusBadge(expiry.status, expiry.daysLeft)}</td>
                      <td className="text-right whitespace-nowrap">
                        <Link
                          href={`/dashboard/inventory/${product.id}`}
                          className="op-btn op-btn-sm"
                        >
                          Ubah Tanggal / Stok
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
