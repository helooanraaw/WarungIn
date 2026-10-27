"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import { fmtDateTime, fmtRp } from "@/lib/format";
import { Search, Plus, Minus, Trash2, Check } from "lucide-react";

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  unit: string;
  sell_price: number;
  wholesale_price: number | null;
  wholesale_min_qty: number | null;
  stock_qty: number;
  variant_label: string | null;
}

interface ModulesConfig {
  enable_variant_matrix: boolean;
  enable_wholesale_tier: boolean;
  enable_shift_log: boolean;
  enable_debt_book: boolean;
}

interface CompletedReceipt {
  id: string;
  invoice_code: string;
  payment_method: string;
  customer_name: string | null;
  shift_name: string | null;
  total_amount: number;
  created_at: string;
  cash_received?: number;
  change_amount?: number;
  items: {
    id: string;
    product_name: string;
    unit_price: number;
    qty: number;
    subtotal: number;
  }[];
}

export default function PosCashierPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [config, setConfig] = useState<ModulesConfig | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [shiftName, setShiftName] = useState("Pagi");
  const [loading, setLoading] = useState(true);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerWa, setCustomerWa] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [receipt, setReceipt] = useState<CompletedReceipt | null>(null);

  function loadProducts() {
    setLoading(true);
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
        if (data.config) setConfig(data.config);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function addToCart(product: ProductItem) {
    if (product.stock_qty <= 0) return;
    setCart((prev) => {
      const current = prev[product.id] || 0;
      if (current >= product.stock_qty) return prev;
      return { ...prev, [product.id]: current + 1 };
    });
  }

  function updateCartQty(product: ProductItem, nextQty: number) {
    setCart((prev) => {
      const clone = { ...prev };
      if (nextQty <= 0) {
        delete clone[product.id];
      } else {
        clone[product.id] = Math.min(product.stock_qty, nextQty);
      }
      return clone;
    });
  }

  function getUnitPrice(product: ProductItem, qty: number) {
    if (
      config?.enable_wholesale_tier &&
      product.wholesale_price &&
      product.wholesale_min_qty &&
      qty >= product.wholesale_min_qty
    ) {
      return product.wholesale_price;
    }
    return product.sell_price;
  }

  const cartLines = Object.entries(cart)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      if (!product || qty <= 0) return null;
      const unitPrice = getUnitPrice(product, qty);
      const isWholesale = unitPrice !== product.sell_price;
      return {
        product,
        qty,
        unitPrice,
        isWholesale,
        subtotal: unitPrice * qty,
      };
    })
    .filter(Boolean) as {
    product: ProductItem;
    qty: number;
    unitPrice: number;
    isWholesale: boolean;
    subtotal: number;
  }[];

  const totalAmount = cartLines.reduce((acc, item) => acc + item.subtotal, 0);
  const cashNum = Number(cashReceived || 0);
  const changeAmount =
    paymentMethod === "TUNAI" ? Math.max(0, cashNum - totalAmount) : 0;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCompleteSale(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (paymentMethod === "TUNAI" && cashNum < totalAmount) {
      setError("Uang tunai yang diterima kurang dari total tagihan.");
      return;
    }

    if (paymentMethod === "KASBON" && !customerName.trim()) {
      setError("Nama pelanggan wajib diisi untuk pencatatan kasbon.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartLines.map((l) => ({
            product_id: l.product.id,
            qty: l.qty,
          })),
          payment_method: paymentMethod,
          customer_name: customerName.trim() || "Pembeli Umum",
          customer_wa: customerWa.trim() || null,
          customer_note: customerNote.trim() || null,
          shift_name: config?.enable_shift_log ? shiftName : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan transaksi.");
      } else {
        setPayModalOpen(false);
        setReceipt({
          ...data.transaction,
          cash_received: paymentMethod === "TUNAI" ? cashNum : totalAmount,
          change_amount: changeAmount,
        });
        setCart({});
        setCustomerName("");
        setCustomerWa("");
        setCustomerNote("");
        setCashReceived("");
        loadProducts();
      }
    } catch {
      setError("Terjadi kesalahan koneksi saat menyimpan transaksi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kasir (POS)"
        subtitle="Pilih barang untuk transaksi pembeli di toko fisik. Stok otomatis berkurang saat pembayaran selesai."
        breadcrumb="Kasir (POS)"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* KIRI: PENCARIAN & TABEL PILIH BARANG (7 KOLOM) */}
        <div className="op-card overflow-hidden lg:col-span-7">
          <div className="border-b border-[#d8e1ea] p-3.5">
            <div className="relative">
              <Search className=" absolute top-2.5 left-3 h-4 w-4 text-[#5f6f82]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau kode barang..."
                className="op-input pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Barang</th>
                  <th className="text-right">Harga Jual</th>
                  <th className="text-right">Sisa Stok</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-xs text-[#5f6f82]"
                    >
                      Memuat daftar barang...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-xs text-[#5f6f82]"
                    >
                      Barang tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const outOfStock = p.stock_qty <= 0;
                    const inCartQty = cart[p.id] || 0;

                    return (
                      <tr key={p.id}>
                        <td className="text-xs text-[#5f6f82]">{p.sku}</td>
                        <td>
                          <div className="text-xs text-[#22303c]">{p.name}</div>
                          {config?.enable_variant_matrix && p.variant_label && (
                            <div className="text-[11px] text-[#5f6f82]">
                              Varian: {p.variant_label}
                            </div>
                          )}
                          {config?.enable_wholesale_tier &&
                            p.wholesale_price &&
                            p.wholesale_min_qty && (
                              <div className="text-[11px] text-[#1976d2]">
                                Grosir min. {p.wholesale_min_qty} {p.unit}:{" "}
                                {fmtRp(p.wholesale_price)}
                              </div>
                            )}
                        </td>
                        <td className="text-right text-xs text-[#22303c] tabular-nums">
                          {fmtRp(p.sell_price)}
                        </td>
                        <td className="text-right text-xs tabular-nums">
                          {outOfStock ? (
                            <span className="op-tag op-tag-danger">Habis</span>
                          ) : (
                            <span>
                              {p.stock_qty} {p.unit}
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            disabled={outOfStock || inCartQty >= p.stock_qty}
                            onClick={() => addToCart(p)}
                            className="op-btn op-btn-primary op-btn-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* KANAN: KERANJANG BELANJA KASIR (5 KOLOM) */}
        <div className="op-card flex flex-col justify-between lg:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
              <div>
                <h2 className="text-sm text-[#22303c]">Keranjang Belanja</h2>
                <p className="text-xs text-[#5f6f82]">
                  {cartLines.length} jenis barang dipilih
                </p>
              </div>
              {cartLines.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart({})}
                  className="op-btn op-btn-danger op-btn-sm"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {config?.enable_shift_log && (
              <div className="flex items-center justify-between border-b border-[#d8e1ea] bg-[#f8fafc] px-4 py-2.5 text-xs">
                <span className="text-[#5f6f82]">Shift Kasir Aktif:</span>
                <select
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="op-select w-36 py-1"
                >
                  <option value="Pagi">Shift Pagi</option>
                  <option value="Sore">Shift Sore</option>
                  <option value="Malam">Shift Malam</option>
                </select>
              </div>
            )}

            <div className="divide-y divide-[#edf2f7]">
              {cartLines.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#5f6f82]">
                  Belum ada barang dipilih. Klik tombol Tambah pada daftar
                  barang di sebelah kiri.
                </div>
              ) : (
                cartLines.map((line) => (
                  <div
                    key={line.product.id}
                    className="flex items-center justify-between gap-2 px-4 py-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[#22303c]">
                        {line.product.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#5f6f82] tabular-nums">
                        {fmtRp(line.unitPrice)} / {line.product.unit}
                        {line.isWholesale && (
                          <span className="ml-1.5 text-[#167a6f]">
                            (Harga Grosir)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQty(line.product, line.qty - 1)
                        }
                        className="op-btn op-btn-sm px-2"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-xs tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        disabled={line.qty >= line.product.stock_qty}
                        onClick={() =>
                          updateCartQty(line.product, line.qty + 1)
                        }
                        className="op-btn op-btn-sm px-2"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCartQty(line.product, 0)}
                        className="op-btn op-btn-danger op-btn-sm px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="w-24 text-right text-xs text-[#22303c] tabular-nums">
                      {fmtRp(line.subtotal)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-[#d8e1ea] bg-[#f8fafc] p-4">
            <div className="flex items-center justify-between text-sm text-[#22303c]">
              <span>Total Tagihan</span>
              <span className="text-lg tabular-nums">{fmtRp(totalAmount)}</span>
            </div>

            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={() => {
                setError("");
                setCashReceived(String(totalAmount));
                setPayModalOpen(true);
              }}
              className="op-btn op-btn-primary mt-3 w-full"
            >
              Proses Pembayaran
            </button>
          </div>
        </div>
      </div>

      {/* MODAL PEMBAYARAN KASIR */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="op-card w-full max-w-md p-6">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] pb-3">
              <h3 className="text-base text-[#22303c]">
                Selesaikan Pembayaran Kasir
              </h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="text-xs text-[#5f6f82] hover:text-[#22303c]"
              >
                Tutup
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]">
                {error}
              </div>
            )}

            <form onSubmit={handleCompleteSale} className="mt-4 space-y-4">
              <div className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
                <div className="text-xs text-[#5f6f82]">Total Tagihan</div>
                <div className="mt-0.5 text-xl text-[#22303c] tabular-nums">
                  {fmtRp(totalAmount)}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-[#22303c]">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {["TUNAI", "QRIS", "TRANSFER"]
                    .concat(config?.enable_debt_book ? ["KASBON"] : [])
                    .map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`rounded-[5px] border py-2 text-xs ${
                          paymentMethod === m
                            ? "border-[#1976d2] bg-[#eff6ff] text-[#1976d2]"
                            : "border-[#d8e1ea] bg-white text-[#22303c]"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                </div>
              </div>

              {paymentMethod === "TUNAI" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-[#22303c]">
                      Uang Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min={totalAmount}
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="op-input tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#5f6f82]">
                      Uang Kembalian
                    </label>
                    <div className="op-input bg-[#f8fafc] tabular-nums">
                      {fmtRp(changeAmount)}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Nama Pelanggan{" "}
                  {paymentMethod === "KASBON" ? "(Wajib untuk Kasbon)" : "(Opsional)"}
                </label>
                <input
                  type="text"
                  required={paymentMethod === "KASBON"}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Bu Rahma / Pembeli Umum"
                  className="op-input"
                />
              </div>

              {paymentMethod === "KASBON" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#22303c]">
                      No. WhatsApp Pelanggan
                    </label>
                    <input
                      type="text"
                      value={customerWa}
                      onChange={(e) => setCustomerWa(e.target.value)}
                      placeholder="0812xxxx"
                      className="op-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#22303c]">
                      Catatan Jatuh Tempo
                    </label>
                    <input
                      type="text"
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="Bayar akhir pekan"
                      className="op-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="op-btn"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="op-btn op-btn-primary"
                >
                  {submitting ? "Menyimpan..." : "Selesaikan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL STRUK DIGITAL TRANSAKSI */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="op-card w-full max-w-sm p-6">
            <div className="flex items-center gap-2 text-sm text-[#167a6f]">
              <Check className="h-4 w-4" />
              <span>Transaksi Berhasil Disimpan</span>
            </div>

            <div className="mt-3 border-y border-dashed border-[#d8e1ea] py-3 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-[#5f6f82]">Kode Nota:</span>
                <span>{receipt.invoice_code}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#5f6f82]">Waktu:</span>
                <span>{fmtDateTime(receipt.created_at)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#5f6f82]">Pelanggan:</span>
                <span>{receipt.customer_name || "Pembeli Umum"}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#5f6f82]">Pembayaran:</span>
                <span>{receipt.payment_method}</span>
              </div>
              {receipt.shift_name && (
                <div className="flex justify-between py-0.5">
                  <span className="text-[#5f6f82]">Shift Kasir:</span>
                  <span>{receipt.shift_name}</span>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1.5 text-xs">
              {receipt.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.qty}x {item.product_name}
                  </span>
                  <span className="tabular-nums">{fmtRp(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 border-t border-[#d8e1ea] pt-3 text-xs">
              <div className="flex justify-between text-sm text-[#22303c]">
                <span>Total Bayar</span>
                <span className="tabular-nums">
                  {fmtRp(receipt.total_amount)}
                </span>
              </div>
              {receipt.payment_method === "TUNAI" && (
                <>
                  <div className="mt-1 flex justify-between text-[#5f6f82]">
                    <span>Tunai Diterima</span>
                    <span className="tabular-nums">
                      {fmtRp(receipt.cash_received)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-[#22303c]">
                    <span>Kembalian</span>
                    <span className="tabular-nums">
                      {fmtRp(receipt.change_amount)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="op-btn"
              >
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={() => setReceipt(null)}
                className="op-btn op-btn-primary"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
