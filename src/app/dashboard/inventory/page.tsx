"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Pager } from "@/components/erp/AppShell";
import { fmtRp } from "@/lib/format";
import { Plus, Search } from "lucide-react";

interface ProductRow {
  id: string;
  sku: string;
  name: string;
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

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [wholesaleMinQty, setWholesaleMinQty] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [variantLabel, setVariantLabel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

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

  function openCreateModal() {
    setEditingProduct(null);
    setSku(`SKU-${String(products.length + 1).padStart(3, "0")}`);
    setName("");
    setUnit("pcs");
    setCostPrice("");
    setSellPrice("");
    setWholesalePrice("");
    setWholesaleMinQty("");
    setStockQty("10");
    setVariantLabel("");
    setExpiryDate("");
    setIsOnline(true);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(p: ProductRow) {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setUnit(p.unit);
    setCostPrice(String(p.cost_price));
    setSellPrice(String(p.sell_price));
    setWholesalePrice(p.wholesale_price ? String(p.wholesale_price) : "");
    setWholesaleMinQty(p.wholesale_min_qty ? String(p.wholesale_min_qty) : "");
    setStockQty(String(p.stock_qty));
    setVariantLabel(p.variant_label || "");
    setExpiryDate(p.expiry_date || "");
    setIsOnline(p.is_online);
    setFormError("");
    setModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    const payload = {
      sku,
      name,
      unit,
      cost_price: Number(costPrice || 0),
      sell_price: Number(sellPrice || 0),
      wholesale_price: wholesalePrice ? Number(wholesalePrice) : null,
      wholesale_min_qty: wholesaleMinQty ? Number(wholesaleMinQty) : null,
      stock_qty: Number(stockQty || 0),
      variant_label: variantLabel || null,
      expiry_date: expiryDate || null,
      is_online: isOnline,
    };

    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Gagal menyimpan produk.");
      } else {
        setModalOpen(false);
        loadData();
      }
    } catch {
      setFormError("Terjadi gangguan koneksi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleOnlineStatus(p: ProductRow) {
    const nextVal = !p.is_online;
    setProducts((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, is_online: nextVal } : item
      )
    );
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_online: nextVal }),
    });
  }

  async function adjustStock(p: ProductRow, delta: number) {
    const nextStock = Math.max(0, p.stock_qty + delta);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === p.id ? { ...item, stock_qty: nextStock } : item
      )
    );
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock_delta: delta }),
    });
  }

  async function deleteProduct(p: ProductRow) {
    if (!window.confirm(`Hapus produk "${p.name}" dari daftar inventori?`)) {
      return;
    }
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (res.ok) {
      loadData();
    }
  }

  const threshold = config?.low_stock_threshold ?? 10;

  const filtered = products.filter((p) => {
    const matchText =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchText) return false;

    if (stockFilter === "LOW" && !(p.stock_qty > 0 && p.stock_qty <= threshold))
      return false;
    if (stockFilter === "OUT" && p.stock_qty > 0) return false;
    if (stockFilter === "SAFE" && p.stock_qty <= threshold) return false;

    if (onlineFilter === "ONLINE" && !p.is_online) return false;
    if (onlineFilter === "OFFLINE" && p.is_online) return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="Produk & Stok"
        subtitle="Daftar barang dagangan, sisa stok fisik, dan pengaturan tayang di katalog online."
        breadcrumb="Produk & Stok"
        actions={
          <>
            <span className="op-tag">
              Kuota: {products.length} / {quotaMax} SKU
            </span>
            <button
              type="button"
              onClick={openCreateModal}
              className="op-btn op-btn-primary"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Produk</span>
            </button>
          </>
        }
      />

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
              placeholder="Cari nama barang atau kode SKU..."
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
              <option value="ALL">Semua Status Stok</option>
              <option value="SAFE">Stok Aman (&gt; {threshold})</option>
              <option value="LOW">Stok Menipis (&le; {threshold})</option>
              <option value="OUT">Stok Habis (0)</option>
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
              <option value="ALL">Semua Visibilitas Katalog</option>
              <option value="ONLINE">Tayang di Katalog Online</option>
              <option value="OFFLINE">Khusus Kasir Toko (Offline)</option>
            </select>
          </div>
        </div>
      </div>

      {/* INDEX TABLE PRODUK & STOK */}
      <div className="op-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="op-table">
            <thead>
              <tr>
                <th>Kode SKU</th>
                <th>Nama Produk</th>
                {config?.enable_variant_matrix && <th>Varian</th>}
                <th className="text-right">Harga Modal</th>
                <th className="text-right">Harga Jual</th>
                {config?.enable_wholesale_tier && (
                  <th className="text-right">Harga Grosir</th>
                )}
                <th className="text-right">Stok Fisik</th>
                {config?.enable_expiry_tracking && <th>Kedaluwarsa</th>}
                <th>Katalog Online</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-8 text-center text-xs text-[#5f6f82]"
                  >
                    Memuat tabel produk...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-8 text-center text-xs text-[#5f6f82]"
                  >
                    Belum ada barang yang sesuai filter. Klik tombol Tambah
                    Produk di kanan atas untuk memasukkan barang baru.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const isLow = p.stock_qty > 0 && p.stock_qty <= threshold;
                  const isOut = p.stock_qty <= 0;

                  return (
                    <tr key={p.id}>
                      <td className="text-xs text-[#5f6f82]">{p.sku}</td>
                      <td>
                        <div className="text-xs text-[#22303c]">{p.name}</div>
                        <div className="text-[11px] text-[#5f6f82]">
                          Satuan: {p.unit}
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
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => adjustStock(p, -1)}
                            className="op-btn op-btn-sm px-2"
                          >
                            -
                          </button>
                          <span
                            className={`min-w-[54px] text-center text-xs tabular-nums ${
                              isOut
                                ? "text-[#c0392b]"
                                : isLow
                                ? "text-[#b56c09]"
                                : "text-[#22303c]"
                            }`}
                          >
                            {p.stock_qty} {p.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustStock(p, 1)}
                            className="op-btn op-btn-sm px-2"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      {config?.enable_expiry_tracking && (
                        <td className="text-xs text-[#5f6f82] tabular-nums">
                          {p.expiry_date || "-"}
                        </td>
                      )}
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleOnlineStatus(p)}
                          className={`op-btn op-btn-sm ${
                            p.is_online
                              ? "border-[#b7e4de] bg-[#eefaf8] text-[#167a6f]"
                              : "border-[#d8e1ea] bg-[#f8fafc] text-[#5f6f82]"
                          }`}
                        >
                          {p.is_online ? "Tayang" : "Nonaktif"}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="op-btn op-btn-sm"
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(p)}
                            className="op-btn op-btn-danger op-btn-sm"
                          >
                            Hapus
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

      {/* MODAL TAMBAH / UBAH PRODUK */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="op-card max-h-[92vh] w-full max-w-lg overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] pb-3">
              <h3 className="text-base text-[#22303c]">
                {editingProduct ? "Ubah Data Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs text-[#5f6f82] hover:text-[#22303c]"
              >
                Tutup
              </button>
            </div>

            {formError && (
              <div className="mt-3 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-[#22303c]">
                    Kode SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="op-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs text-[#22303c]">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Beras Ramos 5 Kg"
                    className="op-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-[#22303c]">
                    Satuan
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs / kg / bungkus"
                    className="op-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#22303c]">
                    Harga Modal (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="op-input tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#22303c]">
                    Harga Jual Ecer (Rp)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="op-input tabular-nums"
                  />
                </div>
              </div>

              {config?.enable_wholesale_tier && (
                <div className="grid grid-cols-1 gap-3 rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#22303c]">
                      Harga Jual Grosir (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="Opsional"
                      className="op-input tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#22303c]">
                      Minimal Beli Grosir
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={wholesaleMinQty}
                      onChange={(e) => setWholesaleMinQty(e.target.value)}
                      placeholder="Contoh: 5"
                      className="op-input tabular-nums"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-[#22303c]">
                    Jumlah Stok Fisik
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    className="op-input tabular-nums"
                  />
                </div>

                {config?.enable_variant_matrix && (
                  <div>
                    <label className="mb-1 block text-xs text-[#22303c]">
                      Label Varian (Ukuran/Warna)
                    </label>
                    <input
                      type="text"
                      value={variantLabel}
                      onChange={(e) => setVariantLabel(e.target.value)}
                      placeholder="Contoh: Ukuran L - Biru"
                      className="op-input"
                    />
                  </div>
                )}

                {config?.enable_expiry_tracking && (
                  <div>
                    <label className="mb-1 block text-xs text-[#22303c]">
                      Tanggal Kedaluwarsa
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="op-input"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] px-3.5 py-2.5">
                <div>
                  <div className="text-xs text-[#22303c]">
                    Tampilkan di Katalog Online
                  </div>
                  <div className="text-[11px] text-[#5f6f82]">
                    Jika aktif, pembeli dapat melihat dan memesan barang ini via
                    WhatsApp
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="h-4 w-4 accent-[#1976d2]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="op-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="op-btn op-btn-primary"
                >
                  {saving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
