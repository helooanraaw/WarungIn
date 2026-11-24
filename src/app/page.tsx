"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Store,
  Check,
  Image as ImageIcon,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { fmtRp } from "@/lib/format";
import BrandLogo from "@/components/BrandLogo";
import RevealOnScroll from "@/components/RevealOnScroll";

interface CommunityProduct {
  id: string;
  sku: string;
  name: string;
  product_category: string | null;
  image_url: string | null;
  unit: string;
  sell_price: number;
  stock_qty: number;
  variant_label: string | null;
  total_sold: number;
  store: {
    id: string;
    store_name: string;
    slug: string;
    category: string;
    logo_url: string | null;
  };
}

interface CommunityStore {
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
}

export default function LandingPage() {
  const [products, setProducts] = useState<CommunityProduct[]>([]);
  const [stores, setStores] = useState<CommunityStore[]>([]);
  const [totalStores, setTotalStores] = useState(0);
  const [activeMockup, setActiveMockup] = useState<"kasir" | "katalog">(
    "kasir"
  );
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [communityError, setCommunityError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingCommunity(true);
    setCommunityError(false);

    fetch("/api/public/community?stores_limit=3")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat etalase toko.");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        const fetchedStores = Array.isArray(data.stores) ? data.stores : [];
        setProducts(Array.isArray(data.products) ? data.products : []);
        setStores(fetchedStores);
        setTotalStores(
          typeof data.total_stores === "number"
            ? data.total_stores
            : fetchedStores.length
        );
      })
      .catch(() => {
        if (active) setCommunityError(true);
      })
      .finally(() => {
        if (active) setLoadingCommunity(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  return (
    <div className="bg-[#fffdf9] text-[#0a0a0a]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-[#ddd3c2] bg-[#fffdf9]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 md:h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-base text-[#0a0a0a] sm:gap-2.5 sm:text-lg"
          >
            <BrandLogo size={28} variant="color" />
            <span>Warungin</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-[#57534a] md:flex">
            <a href="#preview" className="hover:text-[#0a0a0a]">
              Tampilan Aplikasi
            </a>
            <a href="#etalase" className="hover:text-[#0a0a0a]">
              List Toko
            </a>
            <a href="#cara-kerja" className="hover:text-[#0a0a0a]">
              Cara Mulai
            </a>
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <Link
              href="/login"
              className="rounded-full border border-[#ddd3c2] bg-transparent px-4 py-2 text-sm text-[#0a0a0a] transition-colors hover:bg-[#faf6ef]"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[#1a76d1] px-4 py-2 text-sm text-white transition-colors hover:bg-[#1565c0]"
            >
              Buat Toko
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/login"
              className="inline-flex min-h-[40px] items-center rounded-full border border-[#ddd3c2] bg-white px-3.5 text-xs text-[#0a0a0a]"
            >
              Masuk
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-expanded={mobileNavOpen}
              aria-controls="landing-mobile-menu"
              aria-label={mobileNavOpen ? "Tutup menu" : "Buka menu"}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#ddd3c2] bg-[#faf6ef] px-3.5 text-xs text-[#0a0a0a]"
            >
              {mobileNavOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              <span>Menu</span>
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div
            id="landing-mobile-menu"
            className="border-t border-[#ddd3c2] bg-[#fffdf9] px-4 py-4 shadow-sm md:hidden"
          >
            <nav className="flex flex-col gap-1 text-sm text-[#0a0a0a]">
              <a
                href="#preview"
                onClick={() => setMobileNavOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 hover:bg-[#faf6ef]"
              >
                Tampilan Aplikasi
              </a>
              <a
                href="#etalase"
                onClick={() => setMobileNavOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 hover:bg-[#faf6ef]"
              >
                List Toko
              </a>
              <Link
                href="/toko"
                onClick={() => setMobileNavOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 hover:bg-[#faf6ef]"
              >
                Semua Toko
              </Link>
              <a
                href="#cara-kerja"
                onClick={() => setMobileNavOpen(false)}
                className="flex min-h-[44px] items-center rounded-xl px-3 hover:bg-[#faf6ef]"
              >
                Cara Mulai
              </a>
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#eee7da] pt-3">
              <Link
                href="/login"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#ddd3c2] bg-white px-4 text-xs text-[#0a0a0a]"
              >
                Masuk Akun
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#1a76d1] px-4 text-xs text-white"
              >
                Buat Toko
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* SECTION 1 (FULL SCREEN): HERO + MOCKUP UTAMA */}
      <section className="border-b border-[#ddd3c2] py-10 lg:flex lg:min-h-[calc(100vh-4rem)] lg:flex-col lg:justify-center lg:py-14">
        <RevealOnScroll
          stagger
          className="mx-auto w-full max-w-6xl px-4 sm:px-6"
        >
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <h1 data-motion-item className="text-[28px] leading-snug tracking-tight text-[#0a0a0a] sm:text-4xl lg:text-[42px] lg:leading-[1.22]">
              Catat jualan harian, pantau stok barang, dan punya toko online
              sendiri dari satu tempat.
            </h1>
            <p data-motion-item className="mt-3.5 text-sm leading-relaxed text-[#57534a] sm:mt-4 sm:text-[17px]">
              Cocok untuk warung sembako, toko kue, toko baju, konter HP, hingga
              petshop. Ceritakan saja barang dagangan Anda saat mendaftar, lalu
              tampilan kasir dan catatan stoknya langsung mengikuti kebutuhan
              toko.
            </p>

            <div data-motion-item className="mt-6 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-[#1a76d1] px-6 py-3 text-sm text-white transition-colors hover:bg-[#1565c0] sm:w-auto"
              >
                <span>Buat Toko Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#etalase"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[#ddd3c2] bg-[#faf6ef] px-6 py-3 text-sm text-[#0a0a0a] transition-colors hover:bg-[#f3ede2] sm:w-auto"
              >
                <span>Lihat List Toko</span>
              </a>
            </div>

            <div data-motion-item className="mt-7 grid grid-cols-1 gap-3 border-t border-[#ddd3c2] pt-5 text-xs text-[#57534a] sm:mt-8 sm:grid-cols-3 sm:gap-4 sm:pt-6 sm:text-sm">
              <div>
                <div className="text-[#0a0a0a]">Bebas Jenis Jualan</div>
                <div className="mt-0.5 text-xs text-[#57534a]">
                  Menu mengikuti barang yang Anda jual
                </div>
              </div>
              <div>
                <div className="text-[#0a0a0a]">Toko Online Sendiri</div>
                <div className="mt-0.5 text-xs text-[#57534a]">
                  Sudah ada foto barang, logo, dan sampul toko
                </div>
              </div>
              <div>
                <div className="text-[#0a0a0a]">Stok Selalu Rapi</div>
                <div className="mt-0.5 text-xs text-[#57534a]">
                  Penjualan kasir dan WhatsApp tercatat rapi
                </div>
              </div>
            </div>
          </div>

          {/* SLOT FOTO MOCKUP UTAMA (/public/images/mockups/hero-dashboard.png) */}
          <div data-motion-item className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-2 shadow-sm sm:p-2.5">
              <div className="mb-2 flex items-center justify-between px-2 py-1 text-[11px] text-[#57534a] sm:text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ddd3c2]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ddd3c2]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ddd3c2]" />
                </div>
                <span className="truncate pl-2">Contoh Tampilan Awal Toko</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#ddd3c2] bg-white">
                <img
                  src="/images/mockups/hero-dashboard.png"
                  alt="Tampilan Awal Warungin"
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        </RevealOnScroll>
      </section>

      {/* SECTION 2 (FULL SCREEN): TAMPILAN SISTEM & MOCKUP FITUR */}
      <section
        id="preview"
        className="border-b border-[#ddd3c2] py-12 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:py-16"
      >
        <RevealOnScroll className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-5">
            <div className="max-w-2xl">
              <div className="text-xs tracking-wider text-[#57534a]">
                TAMPILAN APLIKASI
              </div>
              <h2 className="mt-1 text-2xl text-[#0a0a0a] sm:text-3xl">
                Satu tempat untuk melayani pembeli di toko maupun lewat HP.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a] sm:text-base">
                Tombolnya dibuat sederhana dan tidak membingungkan. Hanya kolom
                yang memang dipakai usaha Anda sehari-hari yang dimunculkan.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => setActiveMockup("kasir")}
                className={`min-h-[44px] rounded-full px-3.5 py-2 text-center text-xs transition-colors sm:min-h-0 sm:px-5 sm:text-sm ${
                  activeMockup === "kasir"
                    ? "bg-[#1a76d1] text-white"
                    : "border border-[#ddd3c2] bg-[#faf6ef] text-[#0a0a0a] hover:bg-[#f3ede2]"
                }`}
              >
                1. Kasir & Catatan Stok
              </button>
              <button
                type="button"
                onClick={() => setActiveMockup("katalog")}
                className={`min-h-[44px] rounded-full px-3.5 py-2 text-center text-xs transition-colors sm:min-h-0 sm:px-5 sm:text-sm ${
                  activeMockup === "katalog"
                    ? "bg-[#1a76d1] text-white"
                    : "border border-[#ddd3c2] bg-[#faf6ef] text-[#0a0a0a] hover:bg-[#f3ede2]"
                }`}
              >
                2. Toko Online Pembeli
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* BINGKAI FOTO MOCKUP FITUR */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-2.5">
                <div className="overflow-hidden rounded-xl border border-[#ddd3c2] bg-white">
                  {activeMockup === "kasir" ? (
                    <img
                      src="/images/mockups/mockup-kasir-pos.png"
                      alt="Tampilan Kasir dan Stok Warungin"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  ) : (
                    <img
                      src="/images/mockups/mockup-katalog-wa.png"
                      alt="Tampilan Toko Online Pembeli Warungin"
                      className="aspect-[16/10] w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* PENJELASAN BAHASA SEDERHANA */}
            <div className="space-y-4 lg:col-span-5">
              {activeMockup === "kasir" ? (
                <>
                  <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-5">
                    <h3 className="text-base text-[#0a0a0a]">
                      Hitung belanjaan & kembalian tanpa salah hitung
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#57534a]">
                      Pilih barang yang dibeli pelanggan, atur jumlahnya, lalu
                      total belanja, harga beli banyak, dan uang kembalian
                      langsung dihitung. Struk juga bisa dicetak atau dikirim
                      ke WhatsApp pembeli.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-5">
                    <h3 className="text-base text-[#0a0a0a]">
                      Catatan stok mengikuti jenis dagangan Anda
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#57534a]">
                      Jual makanan ada pengingat tanggal kedaluwarsa, jual baju
                      ada ukuran dan warna, jual elektronik ada catatan garansi,
                      dan kalau ada pelanggan langganan tersedia catatan kasbon.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-5">
                    <h3 className="text-base text-[#0a0a0a]">
                      Halaman toko online yang rapi dan mudah dilihat pembeli
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#57534a]">
                      Toko Anda punya tautan sendiri lengkap dengan sampul toko,
                      logo profil, kelompok barang, serta foto dan sisa stok
                      setiap barang dagangan.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-5">
                    <h3 className="text-base text-[#0a0a0a]">
                      Pesanan masuk ke WhatsApp, stok tetap terjaga
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#57534a]">
                      Pembeli tinggal memilih barang lalu mengirim daftar
                      belanja ke WhatsApp Anda. Stok di catatan toko baru
                      berkurang setelah Anda menyetujui pesanannya.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </RevealOnScroll>
      </section>

      {/* SECTION 3 (FULL SCREEN): ETALASE E-COMMERCE TOKO & PRODUK */}
      <section
        id="etalase"
        className="border-b border-[#ddd3c2] py-12 lg:flex lg:min-h-screen lg:flex-col lg:justify-center lg:py-16"
      >
        <RevealOnScroll className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="text-xs tracking-wider text-[#57534a]">
                LIST TOKO
              </div>
              <h2 className="mt-1 text-2xl text-[#0a0a0a] sm:text-3xl">
                Jelajahi toko yang ada di Warungin
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#57534a] sm:text-base">
                Pilih toko di bawah ini untuk melihat profil usaha dan daftar
                barang yang dijual.
              </p>
            </div>
            {!loadingCommunity && !communityError && stores.length > 0 && (
              <Link
                href="/toko"
                className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-full border border-[#ddd3c2] bg-white px-4 py-2 text-xs text-[#0a0a0a] transition-colors hover:border-[#1a76d1] hover:text-[#1a76d1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a76d1] sm:min-h-0 sm:w-auto sm:self-auto"
              >
                <span>
                  {totalStores > 3
                    ? `Lihat semua ${totalStores} toko`
                    : "Lihat semua toko"}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {loadingCommunity ? (
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  aria-hidden="true"
                  className="h-64 animate-pulse rounded-2xl border border-[#ddd3c2] bg-[#faf6ef]"
                />
              ))}
            </div>
          ) : communityError ? (
            <div className="mt-8 rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-6 text-sm">
              <p className="text-[#0a0a0a]">Daftar toko belum bisa dimuat.</p>
              <p className="mt-1 text-xs text-[#57534a]">
                Periksa sambungan internet lalu coba lagi.
              </p>
              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className="mt-4 rounded-full bg-[#1a76d1] px-4 py-2 text-xs text-white transition-colors hover:bg-[#1565c0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a76d1]"
              >
                Coba lagi
              </button>
            </div>
          ) : stores.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#1a76d1]">
                <Store className="h-5 w-5" />
              </div>
              <div className="mt-3 text-base text-[#0a0a0a]">
                Belum ada toko di daftar ini
              </div>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#57534a]">
                Toko akan tampil di sini setelah pemilik usaha mendaftar,
                menyalakan toko online, dan mengisi barang jualannya.
              </p>
              <Link
                href="/register"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1a76d1] px-5 py-2.5 text-xs text-white"
              >
                <span>Buka Toko Pertama Anda</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
              {stores.slice(0, 3).map((store) => (
                <Link
                  key={store.id}
                  href={`/toko/${store.slug}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#ddd3c2] bg-white transition-colors hover:border-[#1a76d1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a76d1]"
                >
                  <div>
                    <div className="h-24 w-full overflow-hidden border-b border-[#eee7da] bg-[#faf6ef]">
                      {store.banner_url ? (
                        <img
                          src={store.banner_url}
                          alt={`Sampul ${store.store_name}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#faf6ef] to-[#edf4fc]" />
                      )}
                    </div>

                    <div className="px-5">
                      <div className="-mt-6 flex items-end justify-between gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-[#faf6ef] ring-1 ring-[#ddd3c2]">
                          {store.logo_url ? (
                            <img
                              src={store.logo_url}
                              alt={store.store_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center bg-[#1a76d1] text-base text-white">
                              {store.store_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#57534a]">
                          {store.category}
                        </span>
                      </div>

                      <h3 className="mt-3 truncate text-base text-[#0a0a0a] transition-colors group-hover:text-[#1a76d1]">
                        {store.store_name}
                      </h3>

                      {store.address && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-[#57534a]">
                          <MapPin className="h-3 w-3 shrink-0 text-[#1a76d1]" />
                          <span className="truncate">{store.address}</span>
                        </div>
                      )}

                      <p className="mt-2.5 line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-[#57534a]">
                        {store.description ||
                          `Menjual kebutuhan ${store.category.toLowerCase()} langsung dari ${store.store_name}.`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#eee7da] px-5 py-3.5 text-xs">
                    <span className="text-[#57534a] tabular-nums">
                      {store.product_count} barang
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#1a76d1]">
                      Kunjungi toko
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loadingCommunity && !communityError && products.length > 0 && (
            <div className="mt-12 border-t border-[#ddd3c2] pt-8">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <div className="text-xs tracking-wider text-[#57534a]">
                    PILIHAN BARANG
                  </div>
                  <h3 className="mt-1 text-xl text-[#0a0a0a] sm:text-2xl">
                    Barang yang sering dibeli
                  </h3>
                </div>
                <span className="text-xs text-[#57534a]">
                  Pilih barang untuk memesan langsung di tokonya
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {products.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/toko/${item.store.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#ddd3c2] bg-white transition-colors hover:border-[#1a76d1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a76d1]"
                  >
                    <div className="relative aspect-square w-full overflow-hidden border-b border-[#eee7da] bg-[#faf6ef]">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[#57534a]">
                          <ImageIcon className="h-7 w-7 opacity-40" />
                          <span className="text-[11px] opacity-60">
                            {item.product_category || item.store.category}
                          </span>
                        </div>
                      )}
                      {item.total_sold > 0 && (
                        <span className="absolute right-2 top-2 rounded-full border border-[#ddd3c2]/80 bg-white/95 px-2 py-0.5 text-[10px] text-[#0a0a0a] tabular-nums sm:right-2.5 sm:top-2.5 sm:px-2.5 sm:text-[11px]">
                          Terjual {item.total_sold}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                      <div>
                        <h4 className="line-clamp-2 text-xs leading-snug text-[#0a0a0a] sm:text-base">
                          {item.name}
                        </h4>
                        <div className="mt-1.5 text-sm text-[#1a76d1] tabular-nums sm:text-base">
                          {fmtRp(item.sell_price)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#57534a] tabular-nums sm:text-xs">
                          Stok {item.stock_qty} {item.unit}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 border-t border-[#eee7da] pt-2.5 text-[11px] text-[#57534a] sm:mt-3.5 sm:gap-2 sm:text-xs">
                        {item.store.logo_url ? (
                          <img
                            src={item.store.logo_url}
                            alt=""
                            className="h-5 w-5 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1a76d1] text-[10px] text-white">
                            {item.store.store_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="truncate">{item.store.store_name}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
        </RevealOnScroll>
      </section>

      {/* SECTION 4 (FULL SCREEN): CARA PAKAI & MULAI SEKARANG */}
      <section
        id="cara-kerja"
        className="py-12 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:py-16"
      >
        <RevealOnScroll
          stagger
          className="mx-auto my-auto w-full max-w-6xl px-4 sm:px-6"
        >
          <div>
            <div className="max-w-2xl">
              <div className="text-xs tracking-wider text-[#57534a]">
                CARA MULAI
              </div>
              <h2 className="mt-1 text-2xl text-[#0a0a0a] sm:text-3xl">
                Tiga langkah mudah dari daftar sampai siap berjualan.
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-5 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "Ceritakan usaha toko Anda",
                  text: "Pilih atau tulis jenis usaha, pasang logo dan sampul toko, lalu jawab pertanyaan singkat agar menu kasir dan catatan barangnya langsung cocok.",
                },
                {
                  n: "02",
                  title: "Masukkan foto & harga barang",
                  text: "Tambahkan foto barang dagangan, isi harga beli, harga jual, dan jumlah stok. Nyalakan toko online untuk barang yang boleh dipesan pembeli.",
                },
                {
                  n: "03",
                  title: "Mulai layani pembeli",
                  text: "Catat pembeli di meja kasir, cetak atau kirim struk, dan terima pesanan WhatsApp dari toko online dengan stok yang selalu terjaga.",
                },
              ].map((step) => (
                <div key={step.n} data-motion-item className="rounded-xl border border-[#ddd3c2] bg-[#ffffff] p-5 sm:p-6">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#faf6ef] text-sm text-[#1a76d1]">
                    {step.n}
                  </div>
                  <h3 className="mt-4 text-base text-[#0a0a0a] sm:text-lg">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#57534a] sm:text-sm">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-5 sm:mt-10 sm:p-9">
              <div className="flex flex-col items-start justify-between gap-5 sm:gap-6 lg:flex-row lg:items-center">
                <div className="max-w-xl">
                  <h3 className="text-lg text-[#0a0a0a] sm:text-2xl">
                    Siap merapikan catatan jualan dan buka toko online sendiri?
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#57534a] sm:gap-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-[#1a76d1]" />
                      Cocok untuk berbagai jenis dagangan
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-[#1a76d1]" />
                      Ada foto barang, logo, dan sampul toko
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-[#1a76d1]" />
                      Struk bisa dicetak atau dikirim lewat WhatsApp
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
                  <Link
                    href="/register"
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#1a76d1] px-6 py-3 text-sm text-white transition-colors hover:bg-[#1565c0] sm:w-auto"
                  >
                    Buat Toko Sekarang
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-[#ddd3c2] bg-[#fffdf9] px-6 py-3 text-sm text-[#0a0a0a] transition-colors hover:bg-[#f3ede2] sm:w-auto"
                  >
                    Masuk ke Akun
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <footer className="mt-10 border-t border-[#ddd3c2] pt-6 text-xs text-[#57534a] sm:mt-12 sm:pt-8">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              Warungin - Catatan kasir, stok barang, dan toko online WhatsApp
              untuk usaha ritel di Indonesia.
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <span>&copy; 2026 Warungin</span>
              <Link href="/toko" className="py-1 hover:text-[#0a0a0a]">
                List Toko
              </Link>
              <Link href="/login" className="py-1 hover:text-[#0a0a0a]">
                Masuk
              </Link>
              <Link href="/register" className="py-1 hover:text-[#0a0a0a]">
                Buat Toko
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
