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
  MapPin,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { fmtRp } from "@/lib/format";

interface PublicProduct {
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
}

interface PublicStore {
  id: string;
  store_name: string;
  slug: string;
  category: string;
  description: string;
  address: string | null;
  logo_url: string | null;
  banner_url: string | null;
  whatsapp_number: string | null;
  account_holder_name: string | null;
  modules_config: {
    custom_attribute_label: string;
    enable_variant_matrix: boolean;
    enable_wholesale_tier: boolean;
    enable_delivery_note: boolean;
  } | null;
}

export default function PublicStoreCatalogPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const [store, setStore] = useState<PublicStore | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerWa, setCustomerWa] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "AMBIL_SENDIRI" | "DIANTAR"
  >("AMBIL_SENDIRI");
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

  const uniqueCategories = Array.from(
    new Set(
      products
        .map((p) => p.product_category?.trim())
        .filter((c): c is string => Boolean(c))
    )
  );

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchText =
      p.name.toLowerCase().includes(q) ||
      (p.variant_label || "").toLowerCase().includes(q) ||
      (p.product_category || "").toLowerCase().includes(q);
    if (!matchText) return false;
    if (activeCategory !== "ALL" && p.product_category !== activeCategory) {
      return false;
    }
    return true;
  });

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
          delivery_method: store?.modules_config?.enable_delivery_note
            ? deliveryMethod
            : "",
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
        Memuat halaman toko...
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-[#fffdf9] px-4 py-16 text-center">
        <div className="mx-auto max-w-md rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-6">
          <h1 className="text-lg text-[#0a0a0a]">Halaman Toko Tidak Aktif</h1>
          <p className="mt-2 text-xs text-[#57534a]">
            Toko ini mungkin sedang menutup katalog online atau alamat tautannya
            kurang tepat.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1a76d1] px-5 py-2.5 text-xs text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    );
  }

  const attrLabel =
    store.modules_config?.custom_attribute_label || "Pilihan";

  return (
    <div className="min-h-[100dvh] bg-[#fffdf9] pb-[calc(7.5rem+env(safe-area-inset-bottom))] text-[#0a0a0a]">
      {/* TOP BAR */}
      <header className="sticky top-0 z-20 border-b border-[#ddd3c2] bg-[#fffdf9]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/toko"
            className="inline-flex min-h-[44px] items-center gap-2 text-xs text-[#57534a] hover:text-[#0a0a0a]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>List Toko</span>
          </Link>
          <span className="text-xs text-[#57534a] tabular-nums">
            {products.length} barang
          </span>
        </div>
      </header>

      {/* HEADER TOKO BERGAYA E-COMMERCE (BANNER SAMPUL + KARTU LOGO PROFIL TOKO) */}
      <section className="border-b border-[#ddd3c2] bg-[#faf6ef]">
        <div className="mx-auto max-w-6xl px-0 sm:px-6 sm:pt-5">
          <div className="overflow-hidden border-b border-[#ddd3c2] bg-[#e9e2d4] sm:rounded-2xl sm:border">
            {store.banner_url ? (
              <img
                src={store.banner_url}
                alt={`Banner ${store.store_name}`}
                className="h-40 w-full object-cover sm:h-56"
              />
            ) : (
              <div className="flex h-32 w-full items-center justify-between bg-[#1a76d1] px-6 text-white sm:h-44 sm:px-10">
                <div>
                  <div className="text-xs opacity-80">{store.category}</div>
                  <div className="mt-1 text-xl sm:text-2xl">
                    {store.store_name}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PROFIL RETAIL & LOGO */}
          <div className="px-4 py-5 sm:px-2">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.store_name}
                    className="-mt-10 h-18 w-18 shrink-0 rounded-2xl border-2 border-[#fffdf9] bg-white object-cover shadow-sm sm:-mt-12 sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="-mt-10 flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl border-2 border-[#fffdf9] bg-[#1a76d1] text-2xl text-white shadow-sm sm:-mt-12 sm:h-20 sm:w-20">
                    {store.store_name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="text-xs text-[#1a76d1]">{store.category}</div>
                  <h1 className="text-xl text-[#0a0a0a] sm:text-2xl">
                    {store.store_name}
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#57534a] sm:text-sm">
                    {store.description}
                  </p>
                  {store.address && (
                    <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#57534a]">
                      <MapPin className="h-3.5 w-3.5 text-[#1a76d1]" />
                      <span>{store.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#ddd3c2] bg-[#fffdf9] px-4 py-3 text-xs text-[#57534a]">
                <div>Dilayani oleh:</div>
                <div className="mt-0.5 text-sm text-[#0a0a0a]">
                  {store.account_holder_name || "Admin Toko"}
                </div>
                <div className="mt-0.5 text-[11px]">
                  Pesanan diteruskan langsung ke WhatsApp
                </div>
              </div>
            </div>

            {/* BAR PENCARIAN & FILTER KATEGORI BARANG */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-[#ddd3c2] bg-white px-4 py-2.5 sm:py-2">
                <Search className="h-4 w-4 shrink-0 text-[#57534a]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari barang di toko ini..."
                  className="w-full bg-transparent text-base text-[#0a0a0a] outline-none sm:text-sm"
                />
              </div>

              {uniqueCategories.length > 0 && (
                <div className="no-scrollbar -mx-4 flex flex-nowrap gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                  <button
                    type="button"
                    onClick={() => setActiveCategory("ALL")}
                    className={`min-h-[40px] shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors sm:min-h-0 ${
                      activeCategory === "ALL"
                        ? "bg-[#1a76d1] text-white"
                        : "border border-[#ddd3c2] bg-white text-[#0a0a0a]"
                    }`}
                  >
                    Semua
                  </button>
                  {uniqueCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`min-h-[40px] shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors sm:min-h-0 ${
                        activeCategory === cat
                          ? "bg-[#1a76d1] text-white"
                          : "border border-[#ddd3c2] bg-white text-[#0a0a0a]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* GRID PRODUK E-COMMERCE */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-8 text-center text-sm text-[#57534a]">
            Belum ada barang yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const qtyInCart = cart[p.id] || 0;
              const outOfStock = p.stock_qty <= 0;

              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#ddd3c2] bg-white"
                >
                  <div>
                    {/* FOTO BARANG */}
                    <div className="relative aspect-square w-full overflow-hidden border-b border-[#ddd3c2] bg-[#faf6ef]">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#57534a]">
                          <ImageIcon className="h-7 w-7 opacity-40" />
                          <span className="text-[11px] opacity-60">
                            {p.product_category || "Barang"}
                          </span>
                        </div>
                      )}
                      {p.product_category && (
                        <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] text-[#0a0a0a]">
                          {p.product_category}
                        </span>
                      )}
                    </div>

                    <div className="p-3.5">
                      <h2 className="line-clamp-2 text-sm leading-snug text-[#0a0a0a] sm:text-base">
                        {p.name}
                      </h2>

                      {store.modules_config?.enable_variant_matrix &&
                        p.variant_label && (
                          <div className="mt-1 text-xs text-[#57534a]">
                            {attrLabel}: {p.variant_label}
                          </div>
                        )}

                      {store.modules_config?.enable_wholesale_tier &&
                        p.wholesale_price &&
                        p.wholesale_min_qty && (
                          <div className="mt-1.5 rounded-lg border border-[#ddd3c2] bg-[#faf6ef] px-2 py-1 text-[11px] text-[#57534a]">
                            Beli min. {p.wholesale_min_qty} {p.unit}:{" "}
                            <span className="text-[#0a0a0a] tabular-nums">
                              {fmtRp(p.wholesale_price)}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="border-t border-[#eee7da] p-3 pt-2.5 sm:p-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <div className="text-sm text-[#1a76d1] tabular-nums sm:text-base">
                        {fmtRp(p.sell_price)}
                      </div>
                      <div className="text-[11px] text-[#57534a] tabular-nums">
                        {outOfStock
                          ? "Habis"
                          : `Stok ${p.stock_qty} ${p.unit}`}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      {outOfStock ? (
                        <div className="w-full rounded-full border border-[#ddd3c2] py-2 text-center text-xs text-[#57534a]">
                          Stok Habis
                        </div>
                      ) : qtyInCart === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateQty(p, 1)}
                          className="min-h-[40px] w-full rounded-full bg-[#1a76d1] py-2 text-xs text-white transition-colors hover:bg-[#1565c0] sm:min-h-0"
                        >
                          + Keranjang
                        </button>
                      ) : (
                        <div className="flex items-center justify-between rounded-full border border-[#1a76d1] bg-[#faf6ef] px-1.5 py-1 sm:px-2">
                          <button
                            type="button"
                            onClick={() => updateQty(p, -1)}
                            aria-label={`Kurangi ${p.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0a0a0a] sm:h-6 sm:w-6"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs tabular-nums">
                            {qtyInCart} {p.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQty(p, 1)}
                            disabled={qtyInCart >= p.stock_qty}
                            aria-label={`Tambah ${p.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a76d1] text-white disabled:opacity-40 sm:h-6 sm:w-6"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING CART BAR */}
      {cartItems.length > 0 && (
        <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-[#ddd3c2] bg-[#fffdf9] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg sm:py-3.5">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a76d1] text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[11px] text-[#57534a] sm:text-xs">
                  {cartItems.length} barang ({totalQty} item)
                </div>
                <div className="truncate text-sm text-[#0a0a0a] tabular-nums sm:text-base">
                  {fmtRp(totalAmount)}
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
              className="min-h-[44px] shrink-0 rounded-full bg-[#1a76d1] px-4 py-2.5 text-xs text-white transition-colors hover:bg-[#1565c0] sm:px-6 sm:text-sm"
            >
              <span className="sm:hidden">Pesan WA</span>
              <span className="hidden sm:inline">Pesan lewat WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL FORM PEMESANAN WHATSAPP (BOTTOM SHEET DI MOBILE) */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-[#ddd3c2] bg-[#fffdf9] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-2xl sm:p-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#ddd3c2] sm:hidden" />
            {orderSuccess ? (
              <div className="space-y-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eefaf8] text-[#167a6f]">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-lg text-[#0a0a0a]">
                  Pesanan Siap Dikirim ({orderSuccess.invoice_code})
                </h3>
                <p className="text-xs leading-relaxed text-[#57534a]">
                  Daftar belanja Anda sudah tercatat di toko {store.store_name}.
                  Silakan lanjutkan kirim chat di WhatsApp agar pemilik toko
                  menyiapkan barang Anda.
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
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendWaOrder} className="space-y-3.5">
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
                    <span>Total Belanja</span>
                    <span className="tabular-nums">{fmtRp(totalAmount)}</span>
                  </div>
                </div>

                {orderError && (
                  <div className="rounded-lg border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]">
                    {orderError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#0a0a0a]">
                      Nama Anda
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
                      type="tel"
                      inputMode="tel"
                      required
                      value={customerWa}
                      onChange={(e) => setCustomerWa(e.target.value)}
                      placeholder="Contoh: 081298765432"
                      className="op-input"
                    />
                  </div>
                </div>

                {store.modules_config?.enable_delivery_note && (
                  <div>
                    <label className="mb-1 block text-xs text-[#0a0a0a]">
                      Cara Terima Barang
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("AMBIL_SENDIRI")}
                        className={`rounded-lg border py-2 text-xs ${
                          deliveryMethod === "AMBIL_SENDIRI"
                            ? "border-[#1a76d1] bg-[#eff6ff] text-[#1a76d1]"
                            : "border-[#ddd3c2] bg-white text-[#57534a]"
                        }`}
                      >
                        Ambil di Toko
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod("DIANTAR")}
                        className={`rounded-lg border py-2 text-xs ${
                          deliveryMethod === "DIANTAR"
                            ? "border-[#1a76d1] bg-[#eff6ff] text-[#1a76d1]"
                            : "border-[#ddd3c2] bg-white text-[#57534a]"
                        }`}
                      >
                        Minta Diantar
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs text-[#0a0a0a]">
                    {deliveryMethod === "DIANTAR"
                      ? "Alamat Lengkap Pengantaran & Catatan"
                      : "Catatan Pesanan (Jam Ambil / Keterangan)"}
                  </label>
                  <textarea
                    rows={2}
                    required={deliveryMethod === "DIANTAR"}
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder={
                      deliveryMethod === "DIANTAR"
                        ? "Tulis alamat lengkap rumah / patokan pengantaran..."
                        : "Contoh: Saya ambil sore jam 4 pulang kerja"
                    }
                    className="op-textarea"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#1a76d1] py-2.5 text-sm text-white transition-colors hover:bg-[#1565c0]"
                >
                  {submitting
                    ? "Menyusun Pesanan..."
                    : `Pesan lewat WhatsApp (${fmtRp(totalAmount)})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
