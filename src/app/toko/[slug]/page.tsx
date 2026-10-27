"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Check,
} from "lucide-react";
import { fmtRp } from "@/lib/format";

interface PublicProduct {
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

interface PublicStore {
  id: string;
  store_name: string;
  slug: string;
  category: string;
  description: string;
  whatsapp_number: string | null;
  account_holder_name: string | null;
  modules_config: {
    enable_variant_matrix: boolean;
    enable_wholesale_tier: boolean;
  } | null;
}

export default function PublicStoreCatalogPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const [store, setStore] = useState<PublicStore | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerWa, setCustomerWa] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    invoice_code: string;
    wa_url: string;
  } | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/public/toko/${slug}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.store) {
          setStore(data.store);
          setProducts(data.products || []);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  function updateQty(product: PublicProduct, delta: number) {
    setCart((prev) => {
      const current = prev[product.id] || 0;
      const next = Math.max(0, Math.min(product.stock_qty, current + delta));
      const clone = { ...prev };
      if (next === 0) {
        delete clone[product.id];
      } else {
        clone[product.id] = next;
      }
      return clone;
    });
  }

  function getUnitPrice(p: PublicProduct, qty: number) {
    if (
      store?.modules_config?.enable_wholesale_tier &&
      p.wholesale_price &&
      p.wholesale_min_qty &&
      qty >= p.wholesale_min_qty
    ) {
      return p.wholesale_price;
    }
    return p.sell_price;
  }

  const cartItems = Object.entries(cart)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      if (!product || qty <= 0) return null;
      const unitPrice = getUnitPrice(product, qty);
      return {
        product,
        qty,
        unitPrice,
        subtotal: unitPrice * qty,
      };
    })
    .filter(Boolean) as {
    product: PublicProduct;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }[];

  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);
  const totalAmount = cartItems.reduce((s, i) => s + i.subtotal, 0);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSendWaOrder(e: React.FormEvent) {
    e.preventDefault();
    setOrderError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/public/toko/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_wa: customerWa,
          customer_note: customerNote,
          items: cartItems.map((i) => ({
            product_id: i.product.id,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderError(data.error || "Gagal membuat pesanan.");
      } else {
        setOrderSuccess({
          invoice_code: data.transaction.invoice_code,
          wa_url: data.wa_url,
        });
        setCart({});
        window.open(data.wa_url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setOrderError("Terjadi gangguan koneksi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf9] px-4 py-12 text-center text-sm text-[#57534a]">
        Memuat katalog toko...
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-[#fffdf9] px-4 py-16 text-center">
        <div className="mx-auto max-w-md rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-6">
          <h1 className="text-lg text-[#0a0a0a]">Katalog Toko Tidak Ditemukan</h1>
          <p className="mt-2 text-xs text-[#57534a]">
            Halaman toko ini mungkin sedang dinonaktifkan oleh pemiliknya atau
            tautan yang Anda buka kurang tepat.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1a76d1] px-5 py-2.5 text-xs text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda Warungin</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf9] pb-28 text-[#0a0a0a]">
      {/* TOP BAR */}
      <header className="border-b border-[#ddd3c2] bg-[#faf6ef]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-[#57534a] hover:text-[#0a0a0a]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Etalase Warungin</span>
          </Link>
          <span className="text-xs text-[#57534a]">
            Katalog Online Resmi: /toko/{store.slug}
          </span>
        </div>
      </header>

      {/* PROFIL TOKO */}
      <section className="border-b border-[#ddd3c2] bg-[#fffdf9] py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#1a76d1]">
                <Store className="h-4 w-4" />
                <span>{store.category}</span>
              </div>
              <h1 className="mt-1 text-2xl text-[#0a0a0a] sm:text-3xl">
                {store.store_name}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#57534a]">
                {store.description}
              </p>
            </div>
            <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] px-4 py-3 text-xs text-[#57534a]">
              <div>Penanggung Jawab Toko:</div>
              <div className="mt-0.5 text-sm text-[#0a0a0a]">
                {store.account_holder_name || "Admin Toko"}
              </div>
              <div className="mt-1 text-[11px]">
                Pemesanan diteruskan langsung ke WhatsApp toko
              </div>
            </div>
          </div>

          {/* PENCARIAN BARANG */}
          <div className="mt-6 flex items-center gap-2 rounded-full border border-[#ddd3c2] bg-white px-4 py-2.5">
            <Search className="h-4 w-4 text-[#57534a]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama barang di toko ini..."
              className="w-full bg-transparent text-sm text-[#0a0a0a] outline-none"
            />
          </div>
        </div>
      </section>

      {/* DAFTAR BARANG */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-8 text-center text-sm text-[#57534a]">
            Tidak ada barang yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p) => {
              const qtyInCart = cart[p.id] || 0;
              const outOfStock = p.stock_qty <= 0;

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-5"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#57534a]">
                      <span>Kode: {p.sku}</span>
                      <span className="tabular-nums">
                        {outOfStock
                          ? "Stok Habis"
                          : `Stok Tersedia: ${p.stock_qty} ${p.unit}`}
                      </span>
                    </div>
                    <h2 className="mt-2 text-base text-[#0a0a0a]">{p.name}</h2>
                    {p.variant_label && (
                      <div className="mt-1 text-xs text-[#57534a]">
                        Varian: {p.variant_label}
                      </div>
                    )}
                    {store.modules_config?.enable_wholesale_tier &&
                      p.wholesale_price &&
                      p.wholesale_min_qty && (
                        <div className="mt-2 rounded-lg border border-[#ddd3c2] bg-[#fffdf9] px-2.5 py-1 text-[11px] text-[#57534a]">
                          Grosir min. {p.wholesale_min_qty} {p.unit}:{" "}
                          <span className="text-[#0a0a0a] tabular-nums">
                            {fmtRp(p.wholesale_price)}
                          </span>{" "}
                          / {p.unit}
                        </div>
                      )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#ddd3c2] pt-3.5">
                    <div>
                      <div className="text-base text-[#0a0a0a] tabular-nums">
                        {fmtRp(p.sell_price)}
                      </div>
                      <div className="text-[11px] text-[#57534a]">
                        per {p.unit}
                      </div>
                    </div>

                    {outOfStock ? (
                      <span className="rounded-full border border-[#ddd3c2] px-3.5 py-1.5 text-xs text-[#57534a]">
                        Stok Habis
                      </span>
                    ) : qtyInCart === 0 ? (
                      <button
                        type="button"
                        onClick={() => updateQty(p, 1)}
                        className="rounded-full bg-[#1a76d1] px-4 py-2 text-xs text-white transition-colors hover:bg-[#1565c0]"
                      >
                        Tambah Pesanan
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full border border-[#1a76d1] bg-white px-2 py-1">
                        <button
                          type="button"
                          onClick={() => updateQty(p, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#faf6ef] text-[#0a0a0a]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[24px] text-center text-xs tabular-nums">
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(p, 1)}
                          disabled={qtyInCart >= p.stock_qty}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a76d1] text-white disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING CART BAR */}
      {cartItems.length > 0 && (
        <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-[#ddd3c2] bg-[#fffdf9] px-4 py-3.5 shadow-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a76d1] text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs text-[#57534a]">
                  {cartItems.length} jenis barang ({totalQty} item)
                </div>
                <div className="text-base text-[#0a0a0a] tabular-nums">
                  Total: {fmtRp(totalAmount)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setOrderSuccess(null);
                setOrderError("");
                setCheckoutOpen(true);
              }}
              className="rounded-full bg-[#1a76d1] px-6 py-2.5 text-sm text-white transition-colors hover:bg-[#1565c0]"
            >
              Pesan via WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* MODAL FORM PEMESANAN WHATSAPP */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#ddd3c2] bg-[#fffdf9] p-6">
            {orderSuccess ? (
              <div className="space-y-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eefaf8] text-[#167a6f]">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-lg text-[#0a0a0a]">
                  Pesanan Tercatat ({orderSuccess.invoice_code})
                </h3>
                <p className="text-xs leading-relaxed text-[#57534a]">
                  Pesanan Anda telah masuk ke daftar tunggu toko{" "}
                  {store.store_name}. Silakan lanjutkan pengiriman pesan di
                  WhatsApp agar pemilik toko segera menyiapkan barang Anda.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href={orderSuccess.wa_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-[#1a76d1] px-5 py-2.5 text-center text-xs text-white"
                  >
                    Buka Chat WhatsApp Sekarang
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutOpen(false);
                      setOrderSuccess(null);
                    }}
                    className="rounded-full border border-[#ddd3c2] px-5 py-2 text-xs text-[#57534a]"
                  >
                    Tutup Jendela
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendWaOrder} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg text-[#0a0a0a]">
                    Kirim Pesanan ke WhatsApp Toko
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCheckoutOpen(false)}
                    className="text-xs text-[#57534a] hover:text-[#0a0a0a]"
                  >
                    Batal
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-3 text-xs">
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span>
                        {item.qty}x {item.product.name}
                      </span>
                      <span className="tabular-nums">
                        {fmtRp(item.subtotal)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 flex items-center justify-between border-t border-[#ddd3c2] pt-2 text-sm text-[#0a0a0a]">
                    <span>Total Estimasi</span>
                    <span className="tabular-nums">{fmtRp(totalAmount)}</span>
                  </div>
                </div>

                {orderError && (
                  <div className="rounded-lg border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]">
                    {orderError}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs text-[#0a0a0a]">
                    Nama Lengkap Anda
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Ibu Rina"
                    className="op-input"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[#0a0a0a]">
                    Nomor WhatsApp Anda
                  </label>
                  <input
                    type="text"
                    required
                    value={customerWa}
                    onChange={(e) => setCustomerWa(e.target.value)}
                    placeholder="Contoh: 081298765432"
                    className="op-input"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-[#0a0a0a]">
                    Catatan Pesanan (Alamat / Jam Ambil)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Contoh: Diantar ke Jl. Mawar No. 8 atau diambil sore jam 4"
                    className="op-textarea"
                  />
                </div>

                <p className="text-[11px] leading-relaxed text-[#57534a]">
                  Stok toko baru akan dikurangi setelah pemilik toko
                  mengonfirmasi pesanan dan pembayaran Anda di WhatsApp.
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#1a76d1] py-2.5 text-sm text-white transition-colors hover:bg-[#1565c0]"
                >
                  {submitting
                    ? "Menyusun Format Chat..."
                    : "Pesan via WhatsApp"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
