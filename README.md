# Warungin — Adaptive Micro-ERP & WhatsApp Commerce Platform

> **Karya Kompetisi Kategori Website — National AI Summit & Competition (NAISC) 2026**  
> *"Akselerasi Inovasi Kecerdasan Buatan: Mengukir Solusi Digital Menuju Kemandirian Teknologi Bangsa"*

**Warungin** adalah platform berbasis web berskala **Micro-ERP** yang mengintegrasikan kecerdasan buatan (**Google Gemini 2.5 Flash**) untuk merakit sistem operasional toko retail kecil (warung sembako, toko bahan kue, butik pakaian, apotek mini, dan kios harian) beserta katalog penjualan online berbasis WhatsApp secara adaptif, ringan, dan bebas *over-engineering*.

---

## Dokumentasi Lengkap Proyek (Syarat Penjurian NAISC 2026)

Seluruh dokumen perancangan dan spesifikasi produk tersimpan di dalam folder [`docs/`](./docs):

1. **[Product Requirement Document (PRD v1.1)](./docs/PRD_Warungin_AI.md)** — Spesifikasi kebutuhan fungsional, non-fungsional, wireframe UI/UX, dan batasan kuota toko kecil.
2. **[Dokumen Perancangan Arsitektur Website (Siap Ekspor PDF)](./docs/DOKUMEN_ARSITEKTUR_WEBSITE.md)** — Diagram arsitektur tingkat tinggi, *sequence diagram* onboarding & sinkronisasi stok, skema 6 tabel ERD, kontrak JSON AI, dan mekanisme *fallback*.
3. **[Deskripsi Singkat Produk (Executive Product Brief)](./docs/DESKRIPSI_SINGKAT_PRODUK.md)** — Latar belakang permasalahan DUDI retail UMKM, tujuan, inovasi utama, dan dampak efisiensi bisnis.

---

## Inovasi & Fitur Utama

1. **Dynamic AI Onboarding (Formulir Adaptif 5 Langkah)**
   * Menganalisis profil usaha dari Langkah 1 & 2, lalu menghasilkan 3 pertanyaan diagnostik kontekstual (Langkah 3–5) dalam **1 kali pemanggilan batch API** (< 3,5 detik).
   * Menerjemahkan jawaban pemilik toko menjadi skema konfigurasi `ModulesConfig` yang mengaktifkan modul relevan di atas **Satu Template Antarmuka Baku (*Standardized Clean UI Template*)**.
   * Dilengkapi **Rule-Based Fallback Engine** otomatis sehingga proses pendaftaran dijamin 100% bebas *error* meskipun tanpa koneksi ke API eksternal.

2. **Standardized Micro-ERP Dashboard (4 Kartu Inti + 5 Kartu Modul Adaptif)**
   * **Kartu Inti (*Always-On*)**: *Omzet Hari Ini*, *5 Produk Terlaris*, *Peringatan Stok Menipis*, dan *Tabel 20 Transaksi Terbaru*.
   * **Kartu Modul Adaptif (*Conditional*)**:
     * `ExpiryTracker` — Peringatan barang kedaluwarsa (<= 14 hari).
     * `VariantMatrix` — Pengelompokan stok berdasarkan label ukuran/warna.
     * `WholesaleTier` — Diskon harga grosir 1-lapis otomatis di layar kasir.
     * `ShiftHandover` — Rekap perbandingan omzet Shift Pagi vs Shift Sore.
     * `DebtLedger` — Buku catatan kasbon pelanggan dengan tombol 1-klik *"Tandai Lunas"*.

3. **Hybrid Offline POS & Katalog WhatsApp (`/toko/[slug]`)**
   * **Etalase Produk Komunitas**: Menampilkan 8–12 produk acak di halaman utama yang langsung mengarahkan pembeli ke profil lengkap toko (`/toko/[slug]`).
   * **Toggle Katalog Online Real-Time**: Pemilik toko cukup menggeser sakelar `ON/OFF` di menu Inventori untuk menayangkan atau menyembunyikan barang di katalog publik.
   * **Sinkronisasi Stok Satu Pintu & Proteksi *Fake Order***: Transaksi di Kasir POS memotong stok fisik secara otomatis, sedangkan pesanan dari katalog WhatsApp dicatat sebagai `PENDING_CONFIRMATION` (stok belum terpotong) hingga pemilik toko menekan tombol **"Konfirmasi Pesanan"** secara manual setelah pembeli membayar.

---

## Pembatasan Beban Sistem & Kuota Toko Kecil (*Micro-Retail Guardrails*)

Agar aplikasi tetap sangat ringan, cepat dimuat (< 1,5 detik), dan sesuai dengan kebutuhan nyata toko retail kecil, sistem menerapkan batasan terukur:

| Parameter Sistem | Batas Kuota | Manfaat Optimasi Beban (*Load Control*) |
| --- | --- | --- |
| **Kepemilikan Toko** | **1 Akun = 1 Toko** | Konteks sesi ringan tanpa beban *multi-branch query*. |
| **Kapasitas Produk (SKU)** | **Maks. 50 Produk / Toko** | Memungkinkan *client-side instant search* di memori browser tanpa *query* database berulang. |
| **Foto Produk** | **Maks. 1 Foto (<= 500 KB)** | Menjaga ukuran halaman katalog `/toko/[slug]` tetap hemat kuota dan cepat di jaringan seluler. |
| **Item per Transaksi** | **Maks. 15 Jenis Barang** | Memastikan transaksi database atomik (`ACID`) selesai dalam hitungan milidetik. |
| **Antrean Pesanan WA** | **Maks. 20 Pesanan Pending** | Mencegah penumpukan *spam order* di tabel konfirmasi kasir. |
| **Riwayat Transaksi** | **20 Transaksi Terbaru** | Menghindari pembacaan ribuan baris historis saat memuat dashboard harian. |
| **Pemanggilan AI** | **Hanya 2x saat Onboarding** | Operasional harian berjalan **0% memanggil LLM**, menghasilkan *zero AI latency* setiap hari. |

---

## Akun Demo Instan & 3 Toko Sampel (Untuk Pengujian Dewan Juri)

Setelah menjalankan perintah *seed* database, tersedia **3 Toko Sampel** yang langsung aktif di Etalase Komunitas dan dapat dimasuki dengan **1-Klik Demo Login**:

| Nama Toko Sampel | Kategori Retail | URL Katalog Publik | Email Login Demo | Kata Sandi | Modul Adaptif Aktif |
| --- | --- | --- | --- | --- | --- |
| **Toko Sembako Berkah Jaya** | Toko Kelontong / Sembako | `/toko/berkah-jaya` | `budi@berkahjaya.id` | `demo1234` | Kedaluwarsa, Harga Grosir, Buku Kasbon |
| **Butik Nusantara Wear** | Fesyen & Pakaian | `/toko/nusantara-wear` | `siti@nusantarawear.id` | `demo1234` | Label Varian Ukuran/Warna, Harga Grosir |
| **Toko Bahan Kue Manis** | Bahan Kue & Roti | `/toko/kue-manis` | `rina@kuemanis.id` | `demo1234` | Kedaluwarsa, Rekap Shift Kasir |

---

## Tech Stack

* **Framework Full-Stack**: Next.js (App Router) + TypeScript
* **Styling & UI**: Tailwind CSS + Lucide React Icons (Design System `#1E40AF` Deep Trust Blue & `#16A34A` Emerald Green)
* **Database & ORM**: Prisma ORM + SQLite (Pengembangan Lokal & Demo Instan) / PostgreSQL (Cloud Production)
* **AI Engine**: Google Gemini API (`@google/genai` — Model `gemini-2.5-flash` dengan *Structured JSON Schema* + *Rule-Based Fallback*)

---

## Struktur Direktori Proyek

```text
Tokoku/
├── docs/
│   ├── PRD_Warungin_AI.md            # Product Requirement Document v1.1
│   ├── DOKUMEN_ARSITEKTUR_WEBSITE.md    # Dokumen Perancangan Arsitektur (Siap PDF)
│   └── DESKRIPSI_SINGKAT_PRODUK.md      # Deskripsi Singkat Produk NAISC 2026
├── prisma/
│   ├── schema.prisma                    # Skema 6 Tabel Relasional Ramping
│   └── seed.ts                          # Seeder 3 Toko Sampel & Produk Komunitas
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Landing Page & Etalase Produk Komunitas
│   │   ├── login/page.tsx               # Login & Tombol 1-Klik Akun Demo Juri
│   │   ├── register/page.tsx            # Registrasi Akun UMKM Baru
│   │   ├── onboarding/page.tsx          # 5-Step Dynamic AI Onboarding Form
│   │   ├── toko/[slug]/page.tsx         # Katalog Online Publik & WA Order Dispatcher
│   │   ├── dashboard/                   # Standardized Clean ERP Pages
│   │   │   ├── page.tsx                 # Dashboard Utama (4 Core + 5 Adaptive Cards)
│   │   │   ├── pos/page.tsx             # Kasir / POS Offline Instan
│   │   │   ├── inventory/page.tsx       # Master Produk (Maks 50 SKU) & Toggle Online
│   │   │   ├── whatsapp-orders/page.tsx # Validasi & Konfirmasi Manual Pesanan WA
│   │   │   └── settings/page.tsx        # Pengaturan Toko & Re-Onboarding (Maks 2x)
│   │   └── api/                         # Backend API Route Handlers
│   ├── components/                      # Komponen UI Standar & Kartu Modul
│   └── lib/
│       ├── db.ts                        # Prisma Client Singleton
│       ├── auth.ts                      # Session & Multi-Tenant Store Guard
│       ├── ai-onboarding.ts             # Integrasi Gemini 2.5 Flash + Fallback Engine
│       ├── quotas.ts                    # Konstanta Batas Kuota Toko Kecil
│       └── whatsapp.ts                  # Generator Deep-Link wa.me Terformat
├── .env.example                         # Contoh Konfigurasi Environment Variables
├── package.json
└── README.md
```

---

## Panduan Instalasi & Menjalankan Secara Lokal

### 1. Prasyarat
* **Node.js** versi 18.18+ atau 20+
* **npm** (bawaan Node.js)

### 2. Salin Variabel Lingkungan
Salin berkas `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi konfigurasi di dalam `.env`:
```env
# Database SQLite lokal (langsung berjalan tanpa instalasi server DB tambahan)
DATABASE_URL="file:./dev.db"

# Rahasia enkripsi sesi autentikasi
SESSION_SECRET="Warungin-naisc-2026-secret-key"

# Opsional: Kunci Google Gemini API (Jika dikosongkan, sistem otomatis memakai Rule-Based Fallback Engine)
GEMINI_API_KEY="AIzaSy..."
```

### 3. Instalasi Dependensi & Inisialisasi Database
```bash
npm install
npx prisma db push
npx prisma db seed
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban dan akses `http://localhost:3000`.

