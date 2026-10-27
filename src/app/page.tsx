"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Store, Check } from "lucide-react";
import { fmtRp } from "@/lib/format";

interface CommunityProduct {
  id: string;
  sku: string;
  name: string;
  unit: string;
  sell_price: number;
  stock_qty: number;
  variant_label: string | null;
  store: {
    id: string;
    store_name: string;
    slug: string;
    category: string;
  };
}

interface CommunityStore {
  id: string;
  store_name: string;
  slug: string;
  category: string;
  description: string;
}

export default function LandingPage() {
  const [products, setProducts] = useState<CommunityProduct[]>([]);
  const [stores, setStores] = useState<CommunityStore[]>([]);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string>("ALL");
  const [previewTab, setPreviewTab] = useState<"ringkasan" | "pos" | "wa">(
    "ringkasan"
  );
  const [loadingCommunity, setLoadingCommunity] = useState(true);

  useEffect(() => {
    fetch("/api/public/community")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
        if (data.stores) setStores(data.stores);
      })
      .catch(() => {})
      .finally(() => setLoadingCommunity(false));
  }, []);

  const filteredProducts =
    selectedStoreSlug === "ALL"
      ? products
      : products.filter((p) => p.store.slug === selectedStoreSlug);

  return (
    <div className="min-h-screen bg-[#fffdf9] text-[#0a0a0a]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-30 border-b border-[#ddd3c2] bg-[#fffdf9]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-lg text-[#0a0a0a]">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a76d1] text-sm text-white">
              W
            </span>
            <span>Warungin</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-[#57534a] md:flex">
            <a href="#fitur" className="hover:text-[#0a0a0a]">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-[#0a0a0a]">
              Cara Kerja
            </a>
            <a href="#etalase" className="hover:text-[#0a0a0a]">
              Etalase Toko
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
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
              Daftar Toko
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION - TANPA BADGE DI ATAS JUDUL, MURNI JUDUL + DESKRIPSI + TOMBOL CAPSULE */}
      <section className="border-b border-[#ddd3c2] py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h1 className="text-3xl leading-snug tracking-tight text-[#0a0a0a] sm:text-4xl lg:text-[40px] lg:leading-[1.22]">
              Kelola kasir, stok barang, dan pesanan WhatsApp dari satu tempat.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#57534a] sm:text-[17px]">
              Warungin membantu pemilik warung dan toko ritel kecil mencatat
              penjualan harian, memantau sisa barang di rak, serta membuat
              halaman katalog online yang langsung terhubung ke WhatsApp.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#1a76d1] px-6 py-3 text-sm text-white transition-colors hover:bg-[#1565c0]"
              >
                <span>Buka Toko Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[#ddd3c2] bg-[#faf6ef] px-6 py-3 text-sm text-[#0a0a0a] transition-colors hover:bg-[#f3ede2]"
              >
                <span>Coba Akun Contoh</span>
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#ddd3c2] pt-6 text-xs text-[#57534a] sm:text-sm">
              <div>
                <div className="text-[#0a0a0a]">Tampilan Sesuai Usaha</div>
                <div className="mt-0.5 text-xs text-[#57534a]">
                  Sembako, butik, bahan kue, apotek
                </div>
              </div>
              <div>
                <div className="text-[#0a0a0a]">Stok Terjaga</div>
                <div className="mt-0.5 text-xs text-[#57534a]">
                  Stok potong saat pesanan dikonfirmasi
                </div>
              </div>
              <div>
                <div className="text-[#0a0a0a]">Katalog WhatsApp</div>
                <div className="mt-0.5 text-xs text-[#57534a]">
                  Pembeli pesan tanpa instal aplikasi
                </div>
              </div>
            </div>
          </div>

          {/* PREVIEW LAYAR KERJA BACKOFFICE */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-xl border border-[#ddd3c2] bg-[#ffffff] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#d8e1ea] bg-[#1b2733] px-4 py-3 text-xs text-white">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#26a69a]" />
                  <span>Toko Sembako Berkah Jaya - Ruang Kerja Kasir</span>
                </div>
                <span className="text-[#d9e2ea]">/toko/berkah-jaya</span>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-[#d8e1ea] bg-[#f4f7fa] px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab("ringkasan")}
                  className={`rounded-full px-3.5 py-1 text-xs transition-colors ${
                    previewTab === "ringkasan"
                      ? "bg-[#1a76d1] text-white"
                      : "border border-[#d8e1ea] bg-white text-[#22303c]"
                  }`}
                >
                  Ringkasan Harian
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("pos")}
                  className={`rounded-full px-3.5 py-1 text-xs transition-colors ${
                    previewTab === "pos"
                      ? "bg-[#1a76d1] text-white"
                      : "border border-[#d8e1ea] bg-white text-[#22303c]"
                  }`}
                >
                  Tabel Produk & Stok
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("wa")}
                  className={`rounded-full px-3.5 py-1 text-xs transition-colors ${
                    previewTab === "wa"
                      ? "bg-[#1a76d1] text-white"
                      : "border border-[#d8e1ea] bg-white text-[#22303c]"
                  }`}
                >
                  Pesanan WhatsApp (2)
                </button>
              </div>

              <div className="p-4 sm:p-5">
                {previewTab === "ringkasan" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
                        <div className="text-[11px] text-[#5f6f82]">
                          Omzet Hari Ini
                        </div>
                        <div className="mt-1 text-sm text-[#22303c] tabular-nums">
                          Rp 205.500
                        </div>
                      </div>
                      <div className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
                        <div className="text-[11px] text-[#5f6f82]">
                          Transaksi Selesai
                        </div>
                        <div className="mt-1 text-sm text-[#22303c] tabular-nums">
                          2 nota
                        </div>
                      </div>
                      <div className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
                        <div className="text-[11px] text-[#5f6f82]">
                          Stok Menipis
                        </div>
                        <div className="mt-1 text-sm text-[#b56c09] tabular-nums">
                          3 produk
                        </div>
                      </div>
                      <div className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
                        <div className="text-[11px] text-[#5f6f82]">
                          Pesanan WA
                        </div>
                        <div className="mt-1 text-sm text-[#1976d2] tabular-nums">
                          2 menunggu
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[5px] border border-[#d8e1ea]">
                      <div className="border-b border-[#d8e1ea] bg-[#f8fafc] px-3 py-2 text-xs text-[#5f6f82]">
                        Transaksi Terakhir Hari Ini
                      </div>
                      <div className="divide-y divide-[#edf2f7] text-xs">
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <div>
                            <div className="text-[#22303c]">INV-BJ-261027-001</div>
                            <div className="text-[11px] text-[#5f6f82]">
                              Kasir Toko - Tunai
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#22303c] tabular-nums">
                              Rp 142.000
                            </div>
                            <span className="text-[11px] text-[#167a6f]">
                              Selesai
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2.5">
                          <div>
                            <div className="text-[#22303c]">WA-BJ-261027-003</div>
                            <div className="text-[11px] text-[#5f6f82]">
                              Ibu Siti Aminah - Pesanan WhatsApp
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[#22303c] tabular-nums">
                              Rp 173.000
                            </div>
                            <span className="text-[11px] text-[#b56c09]">
                              Menunggu Konfirmasi
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {previewTab === "pos" && (
                  <div className="overflow-x-auto rounded-[5px] border border-[#d8e1ea]">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#d8e1ea] bg-[#f8fafc] text-[#5f6f82]">
                          <th className="px-3 py-2">Produk</th>
                          <th className="px-3 py-2 text-right">Harga Ecer</th>
                          <th className="px-3 py-2 text-right">Stok</th>
                          <th className="px-3 py-2 text-center">Online</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf2f7]">
                        <tr>
                          <td className="px-3 py-2 text-[#22303c]">
                            Beras Ramos Premium 5 Kg
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            Rp 72.000
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            28 karung
                          </td>
                          <td className="px-3 py-2 text-center text-[#167a6f]">
                            Tayang
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-[#22303c]">
                            Minyak Goreng Sawit 2 Liter
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            Rp 35.000
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            42 pouch
                          </td>
                          <td className="px-3 py-2 text-center text-[#167a6f]">
                            Tayang
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-[#22303c]">
                            Gas LPG 3 Kg (Ambil di Warung)
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            Rp 21.000
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            12 tabung
                          </td>
                          <td className="px-3 py-2 text-center text-[#5f6f82]">
                            Nonaktif
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {previewTab === "wa" && (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#22303c]">
                          WA-BJ-261027-003 - Ibu Siti Aminah (081288990011)
                        </span>
                        <span className="rounded bg-[#fef8ec] px-2 py-0.5 text-[11px] text-[#b56c09]">
                          Menunggu Konfirmasi
                        </span>
                      </div>
                      <div className="mt-1.5 text-[#5f6f82]">
                        2x Beras Ramos 5 Kg, 2x Kopi Bubuk Hitam 165g - Total Rp
                        173.000
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-[#d8e1ea] pt-2 text-[11px] text-[#5f6f82]">
                        <span>Stok fisik belum berkurang sebelum dikonfirmasi</span>
                        <Link
                          href="/login"
                          className="rounded-full bg-[#1a76d1] px-3 py-1 text-white"
                        >
                          Buka di Dashboard
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ETALASE PRODUK TOKO */}
      <section id="etalase" className="border-b border-[#ddd3c2] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl text-[#0a0a0a] sm:text-3xl">
                Lihat contoh katalog online dari toko pengguna Warungin
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#57534a] sm:text-base">
                Klik salah satu barang di bawah ini untuk membuka halaman penuh
                toko penjualnya dan mencoba simulasi belanja via WhatsApp.
              </p>
            </div>

            {/* Filter Toko menggunakan tombol Capsule */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedStoreSlug("ALL")}
                className={`rounded-full px-4 py-1.5 text-xs transition-colors sm:text-sm ${
                  selectedStoreSlug === "ALL"
                    ? "bg-[#1a76d1] text-white"
                    : "border border-[#ddd3c2] bg-[#faf6ef] text-[#0a0a0a] hover:bg-[#f3ede2]"
                }`}
              >
                Semua Toko
              </button>
              {stores.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStoreSlug(s.slug)}
                  className={`rounded-full px-4 py-1.5 text-xs transition-colors sm:text-sm ${
                    selectedStoreSlug === s.slug
                      ? "bg-[#1a76d1] text-white"
                      : "border border-[#ddd3c2] bg-[#faf6ef] text-[#0a0a0a] hover:bg-[#f3ede2]"
                  }`}
                >
                  {s.store_name}
                </button>
              ))}
            </div>
          </div>

          {loadingCommunity ? (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-44 rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-5"
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/toko/${item.store.slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-5 transition-colors hover:border-[#1a76d1] hover:bg-[#ffffff]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#57534a]">
                      <span className="inline-flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-[#1a76d1]" />
                        <span>{item.store.store_name}</span>
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#57534a]">
                      {item.store.category}
                    </div>

                    <h3 className="mt-3 text-base leading-snug text-[#0a0a0a]">
                      {item.name}
                    </h3>
                    {item.variant_label && (
                      <div className="mt-1 text-xs text-[#57534a]">
                        Varian: {item.variant_label}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-[#ddd3c2] pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base text-[#0a0a0a] tabular-nums">
                        {fmtRp(item.sell_price)}
                      </span>
                      <span className="text-xs text-[#57534a] tabular-nums">
                        Stok: {item.stock_qty} {item.unit}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-full border border-[#ddd3c2] bg-[#fffdf9] px-3.5 py-1.5 text-xs text-[#1a76d1] group-hover:border-[#1a76d1] group-hover:bg-[#1a76d1] group-hover:text-white">
                      <span>Buka Katalog Toko</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FITUR UTAMA */}
      <section id="fitur" className="border-b border-[#ddd3c2] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-2xl text-[#0a0a0a] sm:text-3xl">
              Dirancang khusus untuk kebutuhan toko kecil sehari-hari
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#57534a] sm:text-base">
              Tidak perlu mengatur banyak menu yang membingungkan. Anda cukup
              memakai fitur yang memang dibutuhkan oleh jenis toko Anda.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-6">
              <h3 className="text-lg text-[#0a0a0a]">
                Menu menyesuaikan jenis usaha
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a]">
                Saat pertama mendaftar, sistem menanyakan jenis usaha Anda. Toko
                kue dan sembako mendapatkan kolom tanggal kedaluwarsa, sedangkan
                butik pakaian mendapatkan kolom ukuran dan warna.
              </p>
            </div>

            <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-6">
              <h3 className="text-lg text-[#0a0a0a]">
                Kasir cepat dan mudah dipakai
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a]">
                Cari barang, masukkan ke keranjang, hitung uang kembalian, dan
                catat pembayaran tunai, QRIS, transfer, atau kasbon pelanggan
                dengan cepat.
              </p>
            </div>

            <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-6">
              <h3 className="text-lg text-[#0a0a0a]">
                Katalog online terhubung ke WhatsApp
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a]">
                Pilih barang mana saja yang ingin ditampilkan di internet.
                Pembeli bisa memilih barang dari katalog toko Anda dan mengirim
                format pesanan langsung ke WhatsApp.
              </p>
            </div>

            <div className="rounded-xl border border-[#ddd3c2] bg-[#faf6ef] p-6">
              <h3 className="text-lg text-[#0a0a0a]">
                Stok aman dari pesanan ganda
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a]">
                Pesanan dari WhatsApp masuk ke daftar tunggu terlebih dahulu.
                Stok barang di rak baru dipotong setelah Anda memastikan uang
                pembayaran sudah masuk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CARA KERJA */}
      <section
        id="cara-kerja"
        className="border-b border-[#ddd3c2] py-14 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl text-[#0a0a0a] sm:text-3xl">
            Mulai gunakan dalam 3 langkah sederhana
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-[#ddd3c2] bg-[#ffffff] p-6">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#faf6ef] text-sm text-[#1a76d1]">
                01
              </div>
              <h3 className="mt-4 text-lg text-[#0a0a0a]">Isi profil toko</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a]">
                Masukkan nama toko, jenis usaha, nomor WhatsApp, dan jawab 3
                pertanyaan singkat tentang cara kerja toko Anda.
              </p>
            </div>

            <div className="rounded-xl border border-[#ddd3c2] bg-[#ffffff] p-6">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#faf6ef] text-sm text-[#1a76d1]">
                02
              </div>
              <h3 className="mt-4 text-lg text-[#0a0a0a]">
                Masukkan daftar barang
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a]">
                Tambahkan barang dagangan, harga jual, jumlah stok fisik, dan
                pilih barang yang ingin ditampilkan di katalog online.
              </p>
            </div>

            <div className="rounded-xl border border-[#ddd3c2] bg-[#ffffff] p-6">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#faf6ef] text-sm text-[#1a76d1]">
                03
              </div>
              <h3 className="mt-4 text-lg text-[#0a0a0a]">
                Layani pembeli di kasir dan WhatsApp
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a]">
                Catat pembeli yang datang langsung ke toko dan konfirmasi
                pesanan yang masuk dari WhatsApp tanpa takut salah hitung stok.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BAWAH */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#ddd3c2] bg-[#faf6ef] p-8 sm:p-10">
            <div className="max-w-2xl">
              <h2 className="text-2xl text-[#0a0a0a] sm:text-3xl">
                Siap merapikan catatan kasir dan stok toko Anda?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#57534a] sm:text-base">
                Daftar akun baru gratis atau masuk menggunakan 3 akun toko
                contoh yang sudah kami sediakan untuk mencoba seluruh menu.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#57534a]">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#1a76d1]" />
                  Toko Sembako Berkah Jaya
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#1a76d1]" />
                  Butik Nusantara Wear
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-[#1a76d1]" />
                  Toko Bahan Kue Manis
                </span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-[#1a76d1] px-6 py-3 text-sm text-white transition-colors hover:bg-[#1565c0]"
                >
                  Daftar Toko Baru
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-[#ddd3c2] bg-[#fffdf9] px-6 py-3 text-sm text-[#0a0a0a] transition-colors hover:bg-[#f3ede2]"
                >
                  Masuk ke Akun Contoh
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#ddd3c2] bg-[#faf6ef] py-8 text-xs text-[#57534a]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <span className="text-[#0a0a0a]">Warungin</span> - Aplikasi kasir,
            stok barang, dan katalog pesanan WhatsApp untuk UMKM ritel
            Indonesia.
          </div>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-[#0a0a0a]">
              Masuk
            </Link>
            <Link href="/register" className="hover:text-[#0a0a0a]">
              Daftar Toko
            </Link>
            <Link href="/toko/berkah-jaya" className="hover:text-[#0a0a0a]">
              Contoh Katalog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
