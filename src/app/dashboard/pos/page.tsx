"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/erp/AppShell";
import ReceiptModal, {
  type ReceiptStoreInfo,
  type ReceiptTransactionData,
} from "@/components/erp/ReceiptModal";
import { fmtRp, getExpiryStatus } from "@/lib/format";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Image as ImageIcon,
  ShoppingCart,
  X,
} from "lucide-react";

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  product_category: string | null;
  image_url: string | null;
  unit: string;
  sell_price: number;
  wholesale_price: number | null;
  wholesale_min_qty: number | null;
  stock_qty: number;
  variant_label: string | null;
  expiry_date: string | null;
}

interface ModulesConfig {
  custom_attribute_label: string;
  enable_expiry_tracking: boolean;
  enable_variant_matrix: boolean;
  enable_wholesale_tier: boolean;
  enable_manual_discount: boolean;
  enable_shift_log: boolean;
  enable_debt_book: boolean;
  receipt_footer: string;
}

export default function PosCashierPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [config, setConfig] = useState<ModulesConfig | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [shiftName, setShiftName] = useState("Pagi");
  const [manualDiscountInput, setManualDiscountInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerWa, setCustomerWa] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [receipt, setReceipt] = useState<ReceiptTransactionData | null>(null);
  const [receiptStore, setReceiptStore] = useState<ReceiptStoreInfo | null>(
    null
  );

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
    if (config?.enable_expiry_tracking) {
      const exp = getExpiryStatus(product.expiry_date);
      if (exp.status === "EXPIRED") return;
    }
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
      const savedAmount = isWholesale
        ? (product.sell_price - unitPrice) * qty
        : 0;
      return {
        product,
        qty,
        unitPrice,
        isWholesale,
        savedAmount,
        subtotal: unitPrice * qty,
      };
    })
    .filter(Boolean) as {
    product: ProductItem;
    qty: number;
    unitPrice: number;
    isWholesale: boolean;
    savedAmount: number;
    subtotal: number;
  }[];

  const itemsSubtotal = cartLines.reduce((acc, item) => acc + item.subtotal, 0);
  const totalCartQty = cartLines.reduce((acc, item) => acc + item.qty, 0);
  const wholesaleSaved = cartLines.reduce(
    (acc, item) => acc + item.savedAmount,
    0
  );
  const manualDiscount = config?.enable_manual_discount
    ? Math.min(itemsSubtotal, Math.max(0, Number(manualDiscountInput || 0)))
    : 0;
  const totalAmount = Math.max(0, itemsSubtotal - manualDiscount);

  const cashNum = Number(cashReceived || 0);
  const changeAmount =
    paymentMethod === "TUNAI" ? Math.max(0, cashNum - totalAmount) : 0;

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.variant_label || "").toLowerCase().includes(q) ||
      (p.product_category || "").toLowerCase().includes(q)
    );
  });

  async function handleCompleteSale(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (paymentMethod === "TUNAI" && cashNum < totalAmount) {
      setError("Uang tunai yang diterima kurang dari total belanja.");
      return;
    }

    if (paymentMethod === "KASBON" && !customerName.trim()) {
      setError("Nama pelanggan wajib diisi untuk catatan bon / kasbon.");
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
          cash_received: paymentMethod === "TUNAI" ? cashNum : totalAmount,
          manual_discount: manualDiscount,
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
        setReceipt(data.transaction);
        setReceiptStore(data.store || null);
        setCart({});
        setManualDiscountInput("");
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

  const attrLabel = config?.custom_attribute_label || "Pilihan";

  return (
    <div className={cartLines.length > 0 ? "pb-20 lg:pb-0" : ""}>
      <PageHeader
        title="Kasir Toko"
        subtitle="Pilih barang yang dibeli pelanggan, atur jumlahnya di keranjang, lalu selesaikan pembayaran."
        breadcrumb="Kasir Toko"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* KIRI: PENCARIAN & DAFTAR BARANG (7 KOLOM) */}
        <div className="op-card overflow-hidden lg:col-span-7">
          <div className="border-b border-[#d8e1ea] p-3.5">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5f6f82]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  config?.enable_variant_matrix
                    ? `Cari nama barang, kode, atau ${attrLabel.toLowerCase()}...`
                    : "Cari nama barang atau kode..."
                }
                className="op-input pl-9"
              />
            </div>
          </div>

          {/* DAFTAR KARTU BARANG KHUSUS MOBILE & TABLET (< 1024px) */}
          <div className="divide-y divide-[#edf2f7] lg:hidden">
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
                Memuat daftar barang...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#5f6f82]">
                Barang belum tersedia. Silakan tambahkan dulu di menu Barang &
                Stok.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const outOfStock = p.stock_qty <= 0;
                const inCartQty = cart[p.id] || 0;
                const expInfo = config?.enable_expiry_tracking
                  ? getExpiryStatus(p.expiry_date)
                  : { status: "NONE", daysLeft: null, label: "-" };
                const isExpired = expInfo.status === "EXPIRED";

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 p-3.5 ${
                      inCartQty > 0 ? "bg-[#f4f9ff]" : "bg-white"
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-12 w-12 shrink-0 rounded-lg border border-[#d8e1ea] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#d8e1ea] bg-[#f8fafc] text-[#8fa3b5]">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-sm leading-snug text-[#22303c]">
                          {p.name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                          <span className="text-[#1976d2] tabular-nums">
                            {fmtRp(p.sell_price)}
                          </span>
                          <span className="text-[#5f6f82] tabular-nums">
                            {outOfStock
                              ? "Habis"
                              : isExpired
                              ? "Lewat Kadaluarsa"
                              : `Stok ${p.stock_qty} ${p.unit}`}
                          </span>
                        </div>
                        {config?.enable_variant_matrix && p.variant_label && (
                          <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                            {attrLabel}: {p.variant_label}
                          </div>
                        )}
                        {config?.enable_wholesale_tier &&
                          p.wholesale_price &&
                          p.wholesale_min_qty && (
                            <div className="mt-0.5 text-[11px] text-[#167a6f] tabular-nums">
                              Grosir {p.wholesale_min_qty}+:{" "}
                              {fmtRp(p.wholesale_price)}
                            </div>
                          )}
                        {config?.enable_expiry_tracking &&
                          expInfo.status !== "NONE" && (
                            <div
                              className={`mt-0.5 text-[11px] ${
                                expInfo.status === "EXPIRED"
                                  ? "text-[#c0392b]"
                                  : expInfo.status === "EXPIRING_SOON"
                                  ? "text-[#b56c09]"
                                  : "text-[#5f6f82]"
                              }`}
                            >
                              Kadaluarsa: {expInfo.label}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {outOfStock || isExpired ? (
                        <span className="op-tag op-tag-danger">
                          {outOfStock ? "Habis" : "Expired"}
                        </span>
                      ) : inCartQty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          className="op-btn op-btn-primary op-btn-sm"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Tambah</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 rounded-lg border border-[#1976d2] bg-white p-1">
                          <button
                            type="button"
                            onClick={() => updateCartQty(p, inCartQty - 1)}
                            aria-label={`Kurangi ${p.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f4f7fa] text-[#22303c]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs text-[#22303c] tabular-nums">
                            {inCartQty}
                          </span>
                          <button
                            type="button"
                            disabled={inCartQty >= p.stock_qty}
                            onClick={() => updateCartQty(p, inCartQty + 1)}
                            aria-label={`Tambah ${p.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1976d2] text-white disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TABEL BARANG KHUSUS DESKTOP (>= 1024px) */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Barang</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Sisa Stok</th>
                  <th className="text-right">Pilih</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-xs text-[#5f6f82]"
                    >
                      Memuat daftar barang...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-xs text-[#5f6f82]"
                    >
                      Barang belum tersedia. Silakan tambahkan dulu di menu
                      Barang & Stok.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const outOfStock = p.stock_qty <= 0;
                    const inCartQty = cart[p.id] || 0;
                    const expInfo = config?.enable_expiry_tracking
                      ? getExpiryStatus(p.expiry_date)
                      : { status: "NONE", daysLeft: null, label: "-" };
                    const isExpired = expInfo.status === "EXPIRED";

                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="h-9 w-9 shrink-0 rounded-[4px] border border-[#d8e1ea] object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#d8e1ea] bg-[#f8fafc] text-[#8fa3b5]">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-[#22303c]">
                                {p.name}
                              </div>
                              {config?.enable_variant_matrix &&
                                p.variant_label && (
                                  <div className="text-[11px] text-[#5f6f82]">
                                    {attrLabel}: {p.variant_label}
                                  </div>
                                )}
                              {config?.enable_wholesale_tier &&
                                p.wholesale_price &&
                                p.wholesale_min_qty && (
                                  <div className="text-[11px] text-[#1976d2]">
                                    Beli {p.wholesale_min_qty}+:{" "}
                                    {fmtRp(p.wholesale_price)}
                                  </div>
                                )}
                              {config?.enable_expiry_tracking &&
                                expInfo.status !== "NONE" && (
                                  <div
                                    className={`text-[11px] ${
                                      expInfo.status === "EXPIRED"
                                        ? "text-[#c0392b]"
                                        : expInfo.status === "EXPIRING_SOON"
                                        ? "text-[#b56c09]"
                                        : "text-[#5f6f82]"
                                    }`}
                                  >
                                    Kadaluarsa: {expInfo.label}
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="text-right text-xs text-[#22303c] tabular-nums">
                          {fmtRp(p.sell_price)}
                        </td>
                        <td className="text-right text-xs tabular-nums">
                          {outOfStock ? (
                            <span className="op-tag op-tag-danger">Habis</span>
                          ) : isExpired ? (
                            <span className="op-tag op-tag-danger">
                              Lewat Kadaluarsa
                            </span>
                          ) : (
                            <span>
                              {p.stock_qty} {p.unit}
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            disabled={
                              outOfStock ||
                              isExpired ||
                              inCartQty >= p.stock_qty
                            }
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

        {/* KANAN: KERANJANG BELANJA KASIR DESKTOP (5 KOLOM) */}
        <div className="op-card hidden flex-col justify-between lg:col-span-5 lg:flex">
          <div>
            <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
              <div>
                <h2 className="text-sm text-[#22303c]">Keranjang Belanja</h2>
                <p className="text-xs text-[#5f6f82]">
                  {cartLines.length} macam barang dipilih
                </p>
              </div>
              {cartLines.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCart({});
                    setManualDiscountInput("");
                  }}
                  className="op-btn op-btn-danger op-btn-sm"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {config?.enable_shift_log && (
              <div className="flex items-center justify-between border-b border-[#d8e1ea] bg-[#f8fafc] px-4 py-2.5 text-xs">
                <span className="text-[#5f6f82]">Jadwal Jaga Kasir:</span>
                <select
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="op-select w-36 py-1"
                >
                  <option value="Pagi">Jaga Pagi</option>
                  <option value="Sore">Jaga Sore</option>
                  <option value="Malam">Jaga Malam</option>
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
                      {config?.enable_variant_matrix &&
                        line.product.variant_label && (
                          <div className="text-[11px] text-[#5f6f82]">
                            {line.product.variant_label}
                          </div>
                        )}
                      <div className="mt-0.5 text-[11px] text-[#5f6f82] tabular-nums">
                        {fmtRp(line.unitPrice)} / {line.product.unit}
                        {line.isWholesale && (
                          <span className="ml-1.5 text-[#167a6f]">
                            (Grosir - Hemat {fmtRp(line.savedAmount)})
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
            {config?.enable_manual_discount && cartLines.length > 0 && (
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <label className="text-xs text-[#5f6f82]">
                  Potongan Diskon (Rp):
                </label>
                <input
                  type="number"
                  min={0}
                  max={itemsSubtotal}
                  value={manualDiscountInput}
                  onChange={(e) => setManualDiscountInput(e.target.value)}
                  placeholder="0"
                  className="op-input w-36 py-1 text-right text-xs tabular-nums"
                />
              </div>
            )}

            {wholesaleSaved > 0 && (
              <div className="mb-1 flex items-center justify-between text-xs text-[#167a6f]">
                <span>Hemat Harga Grosir</span>
                <span className="tabular-nums">-{fmtRp(wholesaleSaved)}</span>
              </div>
            )}

            {manualDiscount > 0 && (
              <div className="mb-1 flex items-center justify-between text-xs text-[#167a6f]">
                <span>Potongan Diskon Kasir</span>
                <span className="tabular-nums">-{fmtRp(manualDiscount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-[#22303c]">
              <span>Total Bayar</span>
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
              Bayar ({fmtRp(totalAmount)})
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING CART BAR KHUSUS MOBILE & TABLET (< 1024px) */}
      {cartLines.length > 0 && (
        <div className="fixed inset-x-3 bottom-[calc(4.15rem+env(safe-area-inset-bottom))] z-20 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="flex min-h-[54px] w-full items-center justify-between gap-3 rounded-xl bg-[#1976d2] px-4 py-3 text-left text-white shadow-lg transition-colors active:bg-[#1565c0]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <ShoppingCart className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[11px] text-white/85 tabular-nums">
                  {totalCartQty} item ({cartLines.length} macam barang)
                </div>
                <div className="truncate text-sm text-white tabular-nums">
                  {fmtRp(totalAmount)}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs text-[#1976d2]">
              Keranjang & Bayar
            </span>
          </button>
        </div>
      )}

      {/* BOTTOM SHEET KERANJANG BELANJA MOBILE (< 1024px) */}
      {mobileCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:hidden">
          <div className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white pb-safe">
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[#d8e1ea]" />
            <div className="flex items-center justify-between border-b border-[#d8e1ea] px-4 py-3">
              <div>
                <h2 className="text-base text-[#22303c]">Keranjang Belanja</h2>
                <p className="text-xs text-[#5f6f82]">
                  {cartLines.length} macam barang ({totalCartQty} item)
                </p>
              </div>
              <div className="flex items-center gap-2">
                {cartLines.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCart({});
                      setManualDiscountInput("");
                      setMobileCartOpen(false);
                    }}
                    className="op-btn op-btn-danger op-btn-sm"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileCartOpen(false)}
                  aria-label="Tutup keranjang"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e1ea] text-[#5f6f82]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {config?.enable_shift_log && (
                <div className="flex items-center justify-between border-b border-[#d8e1ea] bg-[#f8fafc] px-4 py-3 text-xs">
                  <span className="text-[#5f6f82]">Jadwal Jaga Kasir:</span>
                  <select
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    className="op-select w-40"
                  >
                    <option value="Pagi">Jaga Pagi</option>
                    <option value="Sore">Jaga Sore</option>
                    <option value="Malam">Jaga Malam</option>
                  </select>
                </div>
              )}

              <div className="divide-y divide-[#edf2f7]">
                {cartLines.map((line) => (
                  <div
                    key={line.product.id}
                    className="space-y-2.5 px-4 py-3.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm text-[#22303c]">
                          {line.product.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#5f6f82] tabular-nums">
                          {fmtRp(line.unitPrice)} / {line.product.unit}
                          {line.isWholesale && (
                            <span className="ml-1.5 text-[#167a6f]">
                              (Grosir - Hemat {fmtRp(line.savedAmount)})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm text-[#22303c] tabular-nums">
                        {fmtRp(line.subtotal)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQty(line.product, line.qty - 1)
                          }
                          aria-label={`Kurangi ${line.product.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e1ea] bg-white text-[#22303c]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          disabled={line.qty >= line.product.stock_qty}
                          onClick={() =>
                            updateCartQty(line.product, line.qty + 1)
                          }
                          aria-label={`Tambah ${line.product.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8e1ea] bg-white text-[#22303c] disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCartQty(line.product, 0)}
                        className="op-btn op-btn-danger op-btn-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#d8e1ea] bg-[#f8fafc] p-4">
              {config?.enable_manual_discount && cartLines.length > 0 && (
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="text-xs text-[#5f6f82]">
                    Potongan Diskon (Rp):
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={itemsSubtotal}
                    value={manualDiscountInput}
                    onChange={(e) => setManualDiscountInput(e.target.value)}
                    placeholder="0"
                    className="op-input w-40 text-right tabular-nums"
                  />
                </div>
              )}

              {wholesaleSaved > 0 && (
                <div className="mb-1 flex items-center justify-between text-xs text-[#167a6f]">
                  <span>Hemat Harga Grosir</span>
                  <span className="tabular-nums">-{fmtRp(wholesaleSaved)}</span>
                </div>
              )}

              {manualDiscount > 0 && (
                <div className="mb-1 flex items-center justify-between text-xs text-[#167a6f]">
                  <span>Potongan Diskon Kasir</span>
                  <span className="tabular-nums">-{fmtRp(manualDiscount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-[#22303c]">
                <span>Total Bayar</span>
                <span className="text-lg tabular-nums">
                  {fmtRp(totalAmount)}
                </span>
              </div>

              <button
                type="button"
                disabled={cartLines.length === 0}
                onClick={() => {
                  setMobileCartOpen(false);
                  setError("");
                  setCashReceived(String(totalAmount));
                  setPayModalOpen(true);
                }}
                className="op-btn op-btn-primary mt-3 w-full"
              >
                Lanjut Bayar ({fmtRp(totalAmount)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMBAYARAN KASIR (BOTTOM SHEET DI MOBILE) */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="op-card max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-[6px] sm:p-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8e1ea] sm:hidden" />
            <div className="flex items-center justify-between border-b border-[#d8e1ea] pb-3">
              <h3 className="text-base text-[#22303c]">
                Selesaikan Pembayaran
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
                <div className="flex items-center justify-between text-xs text-[#5f6f82]">
                  <span>Total yang Harus Dibayar</span>
                  {wholesaleSaved + manualDiscount > 0 && (
                    <span className="text-[#167a6f]">
                      Total Hemat: {fmtRp(wholesaleSaved + manualDiscount)}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xl text-[#22303c] tabular-nums">
                  {fmtRp(totalAmount)}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-[#22303c]">
                  Cara Pembayaran
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
                        {m === "KASBON" ? "BON / KASBON" : m}
                      </button>
                    ))}
                </div>
              </div>

              {paymentMethod === "TUNAI" && (
                <div className="space-y-2.5">
                  <div>
                    <label className="mb-1 block text-xs text-[#5f6f82]">
                      Klik Cepat Uang Tunai:
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCashReceived(String(totalAmount))}
                        className="op-btn op-btn-sm"
                      >
                        Uang Pas
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCashReceived(
                            String(Math.ceil(totalAmount / 20000) * 20000)
                          )
                        }
                        className="op-btn op-btn-sm tabular-nums"
                      >
                        20rb / Pas
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCashReceived(
                            String(
                              Math.max(
                                50000,
                                Math.ceil(totalAmount / 50000) * 50000
                              )
                            )
                          )
                        }
                        className="op-btn op-btn-sm tabular-nums"
                      >
                        Rp 50.000
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCashReceived(
                            String(
                              Math.max(
                                100000,
                                Math.ceil(totalAmount / 100000) * 100000
                              )
                            )
                          )
                        }
                        className="op-btn op-btn-sm tabular-nums"
                      >
                        Rp 100.000
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-[#22303c]">
                        Uang Diterima (Rp)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
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
                      <div className="op-input flex items-center bg-[#f8fafc] tabular-nums">
                        {fmtRp(changeAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-[#22303c]">
                    Nama Pembeli{" "}
                    {paymentMethod === "KASBON" ? "(Wajib)" : "(Opsional)"}
                  </label>
                  <input
                    type="text"
                    required={paymentMethod === "KASBON"}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Bu Rahma"
                    className="op-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#22303c]">
                    No. WhatsApp (Untuk Kirim Struk)
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={customerWa}
                    onChange={(e) => setCustomerWa(e.target.value)}
                    placeholder="Contoh: 0812xxxx"
                    className="op-input"
                  />
                </div>
              </div>

              {paymentMethod === "KASBON" && (
                <div>
                  <label className="mb-1 block text-xs text-[#22303c]">
                    Catatan Janji Bayar Bon
                  </label>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Contoh: Janji bayar hari Sabtu pagi"
                    className="op-input"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="op-btn flex-1 sm:flex-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="op-btn op-btn-primary flex-1 sm:flex-none"
                >
                  {submitting ? "Menyimpan..." : "Simpan & Buka Struk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL STRUK DIGITAL LENGKAP */}
      {receipt && (
        <ReceiptModal
          transaction={receipt}
          store={receiptStore}
          title="Penjualan Tersimpan & Stok Berkurang Otomatis"
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  );
}
