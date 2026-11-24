"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Pager } from "@/components/erp/AppShell";
import { fmtRp, getExpiryStatus } from "@/lib/format";
import {
  Plus,
  Search,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
  product_category: string | null;
  image_url: string | null;
  unit: string;
  cost_price: number;
  sell_price: number;
  wholesale_price: number | null;
  wholesale_min_qty: number | null;
  stock_qty: number;
  is_online: boolean;
  variant_label: string | null;
  expiry_date: string | null;
}

interface ModulesConfig {
  custom_attribute_label: string;
  default_unit: string;
  enable_expiry_tracking: boolean;
  enable_variant_matrix: boolean;
  enable_wholesale_tier: boolean;
  low_stock_threshold: number;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [config, setConfig] = useState<ModulesConfig | null>(null);
  const [quotaMax, setQuotaMax] = useState(50);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [onlineFilter, setOnlineFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function loadData() {
    setLoading(true);
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
        if (data.config) setConfig(data.config);
        if (data.quota?.max) setQuotaMax(data.quota.max);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const attrLabel = config?.custom_attribute_label || "Ukuran / Pilihan";

  async function deleteProduct(p: ProductRow) {
    if (!window.confirm(`Hapus barang "${p.name}" dari daftar stok?`)) {
      return;
    }
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      loadData();
    }
  }

  const threshold = config?.low_stock_threshold ?? 10;

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchText =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.variant_label || "").toLowerCase().includes(q) ||
      (p.product_category || "").toLowerCase().includes(q);
    if (!matchText) return false;

    const expInfo = getExpiryStatus(p.expiry_date);

    if (stockFilter === "LOW" && !(p.stock_qty > 0 && p.stock_qty <= threshold))
      return false;
    if (stockFilter === "OUT" && p.stock_qty > 0) return false;
    if (stockFilter === "SAFE" && p.stock_qty <= threshold) return false;
    if (
      stockFilter === "EXPIRING_SOON" &&
      expInfo.status !== "EXPIRING_SOON"
    )
      return false;
    if (stockFilter === "EXPIRED" && expInfo.status !== "EXPIRED") return false;

    if (onlineFilter === "ONLINE" && !p.is_online) return false;
    if (onlineFilter === "OFFLINE" && p.is_online) return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const tableColumnCount =
    6 +
    Number(Boolean(config?.enable_variant_matrix)) +
    Number(Boolean(config?.enable_wholesale_tier)) +
    Number(Boolean(config?.enable_expiry_tracking));

  return (
    <div>
      <PageHeader
        title="Barang & Stok"
        subtitle={`${products.length} dari maksimal ${quotaMax} barang terdaftar di toko Anda.`}
        breadcrumb="Barang & Stok"
        actions={
          <>
            <span className="op-tag">
              {products.length} / {quotaMax} Barang
            </span>
            <Link
              href="/dashboard/inventory/new"
              className="op-btn op-btn-primary flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Barang</span>
            </Link>
          </>
        }
      />

      {/* BAR PENCARIAN & FILTER */}
      <div className="op-card mb-4 p-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="relative sm:col-span-6">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5f6f82]" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={
                config?.enable_variant_matrix
                  ? `Cari nama barang, kategori, atau ${attrLabel.toLowerCase()}...`
                  : "Cari nama barang, kategori, atau kode..."
              }
              className="op-input pl-9"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              className="op-select"
            >
              <option value="ALL">Semua Kondisi Stok</option>
              <option value="SAFE">Stok Aman (&gt; {threshold})</option>
              <option value="LOW">Stok Hampir Habis (&le; {threshold})</option>
              <option value="OUT">Stok Habis (0)</option>
              {config?.enable_expiry_tracking && (
                <>
                  <option value="EXPIRING_SOON">
                    Dekat Kadaluarsa (&le; 14 Hari)
                  </option>
                  <option value="EXPIRED">Sudah Lewat Kadaluarsa</option>
                </>
              )}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={onlineFilter}
              onChange={(e) => {
                setOnlineFilter(e.target.value);
                setPage(1);
              }}
              className="op-select"
            >
              <option value="ALL">Semua Tampilan Katalog</option>
              <option value="ONLINE">Tampil di Toko Online</option>
              <option value="OFFLINE">Hanya di Kasir Toko</option>
            </select>
          </div>
        </div>
      </div>

      {/* DAFTAR BARANG & STOK */}
      <div className="op-card overflow-hidden">
        {/* KARTU STOK MOBILE (< 768px) */}
        <div className="divide-y divide-[#edf2f7] md:hidden">
          {loading ? (
            <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
              Memuat daftar barang...
            </div>
          ) : paginated.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
              Belum ada barang terdaftar. Klik tombol Tambah Barang untuk
              memasukkan foto dan harga barang dagangan Anda.
            </div>
          ) : (
            paginated.map((p) => {
              const isLow = p.stock_qty > 0 && p.stock_qty <= threshold;
              const isOut = p.stock_qty <= 0;
              const expInfo = getExpiryStatus(p.expiry_date);

              return (
                <div key={p.id} className="space-y-3 p-3.5">
                  <div className="flex items-start gap-3">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-14 w-14 shrink-0 rounded-lg border border-[#d8e1ea] object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[#d8e1ea] bg-[#f8fafc] text-[#8fa3b5]">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm text-[#22303c]">
                            {p.name}
                          </div>
                          <div className="mt-0.5 truncate text-[11px] text-[#5f6f82]">
                            {p.sku}
                            {p.product_category
                              ? ` · ${p.product_category}`
                              : ""}
                          </div>
                        </div>
                        <span
                          className={`op-tag shrink-0 ${
                            p.is_online ? "op-tag-success" : "text-[#5f6f82]"
                          }`}
                        >
                          {p.is_online ? "Tayang" : "Offline"}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="tabular-nums">
                          <span className="text-[#1976d2]">
                            {fmtRp(p.sell_price)}
                          </span>
                          <span className="ml-1.5 text-[11px] text-[#5f6f82]">
                            (Beli {fmtRp(p.cost_price)})
                          </span>
                        </div>
                        <span
                          className={`op-tag tabular-nums ${
                            isOut
                              ? "op-tag-danger"
                              : isLow
                              ? "op-tag-warn"
                              : ""
                          }`}
                        >
                          Stok: {p.stock_qty} {p.unit}
                        </span>
                      </div>

                      {(config?.enable_variant_matrix && p.variant_label) ||
                      (config?.enable_wholesale_tier &&
                        p.wholesale_price &&
                        p.wholesale_min_qty) ||
                      (config?.enable_expiry_tracking && p.expiry_date) ? (
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#5f6f82]">
                          {config?.enable_variant_matrix && p.variant_label && (
                            <span>
                              {attrLabel}: {p.variant_label}
                            </span>
                          )}
                          {config?.enable_wholesale_tier &&
                            p.wholesale_price &&
                            p.wholesale_min_qty && (
                              <span className="tabular-nums">
                                Grosir {p.wholesale_min_qty}+:{" "}
                                {fmtRp(p.wholesale_price)}
                              </span>
                            )}
                          {config?.enable_expiry_tracking && p.expiry_date && (
                            <span
                              className={
                                expInfo.status === "EXPIRED"
                                  ? "text-[#c0392b]"
                                  : expInfo.status === "EXPIRING_SOON"
                                  ? "text-[#b56c09]"
                                  : ""
                              }
                            >
                              Exp: {p.expiry_date}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <Link
                      href={`/dashboard/inventory/${p.id}`}
                      className="op-btn op-btn-sm w-full"
                    >
                      <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                      <span>Edit Barang</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteProduct(p)}
                      className="op-btn op-btn-danger op-btn-sm w-full"
                    >
                      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* INDEX TABLE DESKTOP (>= 768px) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="op-table">
            <thead>
              <tr>
                <th>Barang</th>
                {config?.enable_variant_matrix && <th>{attrLabel}</th>}
                <th className="text-right">Harga Beli</th>
                <th className="text-right">Harga Jual</th>
                {config?.enable_wholesale_tier && (
                  <th className="text-right">Harga Grosir</th>
                )}
                <th className="text-right">Sisa Stok</th>
                {config?.enable_expiry_tracking && <th>Kadaluarsa</th>}
                <th>Toko Online</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="py-8 text-center text-xs text-[#5f6f82]"
                  >
                    Memuat daftar barang...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="py-8 text-center text-xs text-[#5f6f82]"
                  >
                    Belum ada barang terdaftar. Klik tombol Tambah Barang di
                    kanan atas untuk memasukkan foto dan harga barang dagangan
                    Anda.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const isLow = p.stock_qty > 0 && p.stock_qty <= threshold;
                  const isOut = p.stock_qty <= 0;
                  const expInfo = getExpiryStatus(p.expiry_date);

                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="h-10 w-10 shrink-0 rounded-[5px] border border-[#d8e1ea] object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] text-[#8fa3b5]">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-[#22303c]">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-[#5f6f82]">
                              {p.sku}
                              {p.product_category
                                ? ` · ${p.product_category}`
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      {config?.enable_variant_matrix && (
                        <td className="text-xs text-[#5f6f82]">
                          {p.variant_label || "-"}
                        </td>
                      )}
                      <td className="text-right text-xs text-[#5f6f82] tabular-nums">
                        {fmtRp(p.cost_price)}
                      </td>
                      <td className="text-right text-xs text-[#22303c] tabular-nums">
                        {fmtRp(p.sell_price)}
                      </td>
                      {config?.enable_wholesale_tier && (
                        <td className="text-right text-xs text-[#5f6f82] tabular-nums">
                          {p.wholesale_price && p.wholesale_min_qty
                            ? `${fmtRp(p.wholesale_price)} (min. ${p.wholesale_min_qty})`
                            : "-"}
                        </td>
                      )}
                      <td className="text-right">
                        <span
                          className={`text-xs tabular-nums ${
                            isOut
                              ? "text-[#c0392b]"
                              : isLow
                              ? "text-[#b56c09]"
                              : "text-[#22303c]"
                          }`}
                        >
                          {p.stock_qty} {p.unit}
                        </span>
                      </td>
                      {config?.enable_expiry_tracking && (
                        <td className="text-xs tabular-nums">
                          {expInfo.status === "EXPIRED" ? (
                            <div>
                              <span className="op-tag op-tag-danger">
                                {expInfo.label}
                              </span>
                              <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                                {p.expiry_date}
                              </div>
                            </div>
                          ) : expInfo.status === "EXPIRING_SOON" ? (
                            <div>
                              <span className="op-tag op-tag-warn">
                                {expInfo.label}
                              </span>
                              <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                                {p.expiry_date}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#5f6f82]">
                              {p.expiry_date || "-"}
                            </span>
                          )}
                        </td>
                      )}
                      <td>
                        <span
                          className={`op-tag ${
                            p.is_online
                              ? "op-tag-success"
                              : "text-[#5f6f82]"
                          }`}
                        >
                          {p.is_online ? "Tayang" : "Disembunyikan"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/dashboard/inventory/${p.id}`}
                            aria-label={`Edit ${p.name}`}
                            title={`Edit ${p.name}`}
                            className="op-btn op-btn-sm px-2.5"
                          >
                            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => deleteProduct(p)}
                            aria-label={`Hapus ${p.name}`}
                            title={`Hapus ${p.name}`}
                            className="op-btn op-btn-danger op-btn-sm px-2.5"
                          >
                            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                          </button>
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
