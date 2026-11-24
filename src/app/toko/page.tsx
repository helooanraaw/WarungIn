"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

interface DirectoryStore {
  id: string;
  store_name: string;
  slug: string;
  category: string;
  description: string;
  address: string | null;
  logo_url: string | null;
  banner_url: string | null;
  product_count: number;
  total_sold: number;
  has_whatsapp: boolean;
}

export default function StoreDirectoryPage() {
  const [stores, setStores] = useState<DirectoryStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    fetch("/api/public/community")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat daftar toko.");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setStores(Array.isArray(data.stores) ? data.stores : []);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(stores.map((store) => store.category).filter(Boolean))
    );
  }, [stores]);

  const filteredStores = useMemo(() => {
    const query = search.trim().toLowerCase();
    return stores.filter((store) => {
      const matchCategory =
        activeCategory === "ALL" || store.category === activeCategory;
      if (!matchCategory) return false;
      if (!query) return true;

      return (
        store.store_name.toLowerCase().includes(query) ||
        store.category.toLowerCase().includes(query) ||
        (store.address && store.address.toLowerCase().includes(query)) ||
        store.description.toLowerCase().includes(query)
      );
    });
  }, [stores, activeCategory, search]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#fffdf9] text-[#0a0a0a]">
      <header className="sticky top-0 z-30 border-b border-[#ddd3c2] bg-[#fffdf9]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#0a0a0a]"
            aria-label="Warungin Beranda"
          >
            <BrandLogo size={26} variant="color" />
            <span className="text-base tracking-tight">Warungin</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-2.5 text-xs text-[#57534a] transition-colors hover:text-[#0a0a0a] sm:min-h-0 sm:px-0 sm:text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Beranda</span>
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-[40px] items-center rounded-full bg-[#1a76d1] px-4 py-2 text-xs text-white transition-colors hover:bg-[#1565c0] sm:min-h-0 sm:text-sm"
            >
              Buka Toko
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[#ddd3c2] bg-[#faf6ef] py-7 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-xs tracking-wider text-[#57534a]">
            LIST TOKO
          </div>
          <h1 className="mt-1 text-2xl text-[#0a0a0a] sm:text-3xl">
            Semua toko di Warungin
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#57534a] sm:text-sm">
            Lihat profil usaha, alamat, dan jumlah barang yang dijual sebelum
            membuka halaman tokonya.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:mt-6">
            <div className="flex max-w-xl items-center gap-2.5 rounded-full border border-[#ddd3c2] bg-white px-4 py-2.5">
              <Search className="h-4 w-4 shrink-0 text-[#57534a]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama toko, kategori, atau lokasi..."
                className="w-full bg-transparent text-base text-[#0a0a0a] outline-none placeholder:text-[#57534a]/70 sm:text-sm"
              />
            </div>

            {categories.length > 0 && (
              <div className="no-scrollbar -mx-4 flex flex-nowrap gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                <button
                  type="button"
                  onClick={() => setActiveCategory("ALL")}
                  className={`min-h-[40px] shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors sm:min-h-0 ${
                    activeCategory === "ALL"
                      ? "bg-[#1a76d1] text-white"
                      : "border border-[#ddd3c2] bg-white text-[#57534a] hover:border-[#1a76d1] hover:text-[#0a0a0a]"
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`min-h-[40px] shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors sm:min-h-0 ${
                      activeCategory === cat
                        ? "bg-[#1a76d1] text-white"
                        : "border border-[#ddd3c2] bg-white text-[#57534a] hover:border-[#1a76d1] hover:text-[#0a0a0a]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                aria-hidden="true"
                className="h-72 animate-pulse rounded-2xl border border-[#ddd3c2] bg-[#faf6ef]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-6 text-sm">
            <p className="text-[#0a0a0a]">Daftar toko belum bisa dimuat.</p>
            <p className="mt-1 text-xs text-[#57534a]">
              Periksa koneksi lalu coba lagi.
            </p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-4 rounded-full bg-[#1a76d1] px-4 py-2 text-xs text-white transition-colors hover:bg-[#1565c0]"
            >
              Coba lagi
            </button>
          </div>
        ) : stores.length === 0 ? (
          <div className="rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1a76d1]">
              <Store className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base text-[#0a0a0a]">
              Belum ada toko aktif dengan stok tersedia
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#57534a]">
              Toko akan tampil di halaman ini setelah katalog diaktifkan dan
              memiliki minimal satu barang dengan stok tersedia.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1a76d1] px-5 py-2.5 text-xs text-white"
            >
              <span>Buka Toko Pertama Anda</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-10 text-center">
            <p className="text-sm text-[#0a0a0a]">
              Tidak ada toko yang cocok dengan pencarian Anda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("ALL");
              }}
              className="mt-4 rounded-full border border-[#ddd3c2] bg-white px-4 py-2 text-xs text-[#0a0a0a] transition-colors hover:border-[#1a76d1]"
            >
              Tampilkan semua toko
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 text-xs text-[#57534a] tabular-nums">
              Menampilkan {filteredStores.length} dari {stores.length} toko
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {filteredStores.map((store) => (
                <article
                  key={store.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ddd3c2] bg-white transition-colors hover:border-[#1a76d1]"
                >
                  <div>
                    <div className="h-32 w-full overflow-hidden border-b border-[#eee7da] bg-[#faf6ef]">
                      {store.banner_url ? (
                        <img
                          src={store.banner_url}
                          alt={`Spanduk ${store.store_name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#faf6ef] to-[#edf4fc]" />
                      )}
                    </div>

                    <div className="px-6">
                      <div className="-mt-7 flex items-end justify-between gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-[#faf6ef] ring-1 ring-[#ddd3c2]">
                          {store.logo_url ? (
                            <img
                              src={store.logo_url}
                              alt={store.store_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-[#1a76d1] text-lg text-white">
                              {store.store_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="rounded-full border border-[#eee7da] bg-[#faf6ef] px-3 py-1 text-xs text-[#0a0a0a]">
                          {store.category}
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg text-[#0a0a0a]">
                        <Link
                          href={`/toko/${store.slug}`}
                          className="transition-colors hover:text-[#1a76d1]"
                        >
                          {store.store_name}
                        </Link>
                      </h2>

                      {store.address && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#57534a]">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#1a76d1]" />
                          <span>{store.address}</span>
                        </div>
                      )}

                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[#57534a] sm:text-sm">
                        {store.description ||
                          `Toko ${store.category.toLowerCase()} dengan barang siap dipesan online.`}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#57534a]">
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Package className="h-3.5 w-3.5 text-[#1a76d1]" />
                          {store.product_count} barang
                        </span>
                        {store.total_sold > 0 && (
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <ShoppingBag className="h-3.5 w-3.5 text-[#1a76d1]" />
                            {store.total_sold} terjual
                          </span>
                        )}
                        {store.has_whatsapp && (
                          <span className="rounded-full bg-[#e4f4ea] px-2.5 py-0.5 text-[11px] text-[#27764c]">
                            Pesan lewat WhatsApp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#eee7da] bg-[#fffdf9] px-5 py-3.5 sm:px-6 sm:py-4">
                    <span className="hidden truncate text-xs text-[#57534a] sm:inline">
                      Kunjungi halaman toko
                    </span>
                    <Link
                      href={`/toko/${store.slug}`}
                      className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#1a76d1] px-4 py-2 text-xs text-white transition-colors hover:bg-[#1565c0] sm:min-h-0 sm:w-auto"
                    >
                      <span>Lihat Toko</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-[#ddd3c2] bg-[#fffdf9] py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-[#57534a] sm:flex-row sm:px-6">
          <span>Etalase Toko Online Warungin</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#0a0a0a]">
              Beranda
            </Link>
            <Link href="/register" className="text-[#1a76d1] hover:underline">
              Daftarkan Toko Anda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
