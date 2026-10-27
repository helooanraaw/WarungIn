# DESKRIPSI SINGKAT PRODUK (EXECUTIVE PRODUCT BRIEF)
## Warungin — Adaptive Micro-ERP & WhatsApp Commerce Platform

| Identitas Karya | Keterangan |
| --- | --- |
| **Nama Website / Produk** | **Warungin** |
| **Tagline Produk** | *Sistem Kasir, Inventori, & Katalog WhatsApp Adaptif Berbasis AI untuk Toko Retail Kecil Indonesia* |
| **Kategori Kompetisi** | Website — National AI Summit & Competition (NAISC) 2026 |
| **Tema Kompetisi** | *"Akselerasi Inovasi Kecerdasan Buatan: Mengukir Solusi Digital Menuju Kemandirian Teknologi Bangsa"* |
| **Target Pengguna (DUDI)** | Pelaku UMKM Sektor Retail Skala Mikro & Kecil (Toko Kelontong/Sembako, Butik Pakaian Kecil, Toko Bahan Kue, Apotek Mini, Kios Harian) |

---

## 1. Ringkasan Eksekutif

**Warungin** adalah platform web **Micro-ERP & WhatsApp Commerce** yang memanfaatkan kecerdasan buatan (*Generative AI*) untuk merakit sistem manajemen operasional toko retail kecil secara otomatis dan ringan hanya melalui wawancara formulir singkat **5 langkah (*Dynamic AI Onboarding*)**.

Alih-alih memaksa pemilik warung atau toko kecil menggunakan aplikasi ERP konvensional yang rumit, berat dimuat, dan seragam untuk semua jenis usaha, Warungin menganalisis profil toko pengguna dan mengaktifkan modul yang tepat di atas **Satu Template Antarmuka Baku (*Standardized Clean UI Template*)**. Lebih jauh lagi, Warungin menyatukan pencatatan kasir fisik (*Offline POS*) dengan katalog belanja online berbasis WhatsApp (`/toko/[slug]`) pada satu basis data stok tunggal, lengkap dengan mekanisme **Konfirmasi Manual Pesanan WhatsApp** guna mencegah pesanan fiktif (*fake order*) mengunci stok barang di toko fisik.

---

## 2. Permasalahan Nyata DUDI Retail UMKM

Berdasarkan pengamatan langsung pada operasional Dunia Usaha dan Dunia Industri (DUDI) sektor retail mikro dan kecil di Indonesia, terdapat tiga permasalahan mendasar yang menghambat efisiensi usaha:

1. **Pencatatan Manual yang Rawan Selisih & Kebocoran Stok**:
   Mayoritas pemilik toko kecil masih merekap omzet harian, barang terlaris, stok menipis, dan kasbon pelanggan di buku tulis atau lembar kerja terpisah. Saat toko sedang ramai, kasir sering lupa mencatat barang keluar atau salah menghitung uang kembalian.
2. **Aplikasi ERP/POS di Pasaran Terlalu Kompleks & Berat Dimuat**:
   Aplikasi kasir yang ada saat ini sering kali terlalu berat (*bloated*) untuk perangkat pemilik warung, atau sebaliknya terlalu kaku karena tidak menyediakan modul spesifik yang dibutuhkan jenis usaha tertentu (misalnya: toko sembako dan bahan kue membutuhkan pengingat tanggal kedaluwarsa dan harga grosir sederhana, sedangkan toko baju membutuhkan pencatatan label ukuran/warna).
3. **Bentrok Stok Antara Pembeli Toko Fisik dan Pesanan Chat WhatsApp**:
   Ketika UMKM mulai berjualan lewat WhatsApp, katalog mereka tidak terhubung dengan sisa stok di meja kasir. Akibatnya, barang yang sudah habis dibeli pelanggan di toko fisik masih dipesan oleh pembeli online, atau sebaliknya pesanan *spam* di chat membuat stok barang menjadi kacau.

---

## 3. Tujuan Pengembangan Produk

1. **Merakit Micro-ERP yang Terpersonalisasi Tanpa Kerumitan Teknis**: Memampukan pemilik toko kecil yang awam teknologi untuk memiliki sistem manajemen toko yang sesuai dengan kategori usahanya dalam waktu kurang dari 2 menit melalui wawancara AI 5 langkah.
2. **Menyediakan Sistem yang Ringan, Cepat, dan Bebas Beban Server (*Micro-Retail Scoped*)**: Membatasi kuota operasional secara cerdas (1 toko per akun, fokus pada 50 SKU utama, dan pemanggilan AI hanya pada tahap *setup* awal) agar sistem berjalan sangat cepat di ponsel maupun laptop berspesifikasi rendah.
3. **Menghubungkan Kasir Offline dan Katalog WhatsApp dalam Satu Pintu Stok**: Menyediakan halaman katalog publik instan (`/toko/[slug]`) dan *Etalase Produk Komunitas* yang terhubung langsung dengan inventori toko.

---

## 4. Inovasi & Fitur Utama Warungin

### 4.1 Dynamic AI Onboarding (Wawancara Adaptif 5 Langkah)
* **Langkah 1 & 2 (Profil & Integrasi WhatsApp)**: Mengumpulkan nama toko, kategori retail, deskripsi singkat, serta opsi integrasi katalog online (beserta Nomor WhatsApp Bisnis dan nama pemilik/penerima pesanan).
* **Langkah 3, 4, & 5 (Pertanyaan Diagnostik AI Kontekstual)**: Menggunakan model **Google Gemini (`gemini-2.5-flash`)** dengan *Structured JSON Output* untuk menghasilkan 3 pertanyaan spesifik sesuai jenis usaha pengguna dalam satu kali pemanggilan cepat (< 3,5 detik), dilengkapi *Rule-Based Fallback Engine* jika terjadi kendala jaringan.
* **AI Module Provisioning Engine**: Menerjemahkan jawaban pengguna menjadi konfigurasi boolean yang mengaktifkan kartu modul yang relevan di dashboard ERP.

### 4.2 Standardized Clean ERP Dashboard & 5 Modul Adaptif Ringan
Seluruh toko menikmati tata letak navigasi yang konsisten dan mudah dipahami, terdiri atas:
* **4 Kartu Metrik Inti (*Always-On*)**: *Omzet Hari Ini*, *5 Produk Terlaris*, *Peringatan Stok Menipis*, dan *Tabel 20 Transaksi Terbaru*.
* **5 Kartu Modul Adaptif (*Conditional Micro-Modules*)**:
  1. **Pelacak Kedaluwarsa (`ExpiryTracker`)**: Memantau produk yang akan kedaluwarsa dalam <= 14 hari.
  2. **Matriks Label Varian (`VariantMatrix`)**: Mengelompokkan stok berdasarkan label ukuran/warna.
  3. **Harga Grosir 1-Lapis (`WholesaleTier`)**: Menerapkan harga grosir otomatis di kasir saat jumlah beli mencapai batas minimum.
  4. **Rekap Shift Kasir (`ShiftHandover`)**: Memisahkan rekap omzet Shift Pagi dan Shift Sore.
  5. **Buku Kasbon Pelanggan (`DebtLedger`)**: Mencatat transaksi kasbon pelanggan tetap lengkap dengan tombol 1-klik *"Tandai Lunas"*.

### 4.3 Inventori Fokus Toko Kecil (Maks. 50 SKU) & Toggle Katalog Online
Pemilik toko dapat mengelola hingga **50 produk utama (SKU)** secara rapi dan ringan. Setiap produk memiliki tombol *toggle switch* **"Tampilkan di Katalog Online [ON/OFF]"** yang secara *real-time* mengatur apakah barang tersebut tampil di halaman `/toko/[slug]`.

### 4.4 Hybrid Offline POS & WhatsApp Order Dispatcher (Validasi Stok Cerdas)
* **Jalur Kasir POS Offline**: Saat kasir menekan tombol bayar di toko fisik, stok barang langsung dipotong secara atomik dan omzet harian bertambah seketika.
* **Jalur Katalog Publik & WhatsApp (`/toko/[slug]`)**: Pembeli memilih barang dan menekan **"Pesan via WhatsApp"**. Sistem mencatat pesanan berstatus `PENDING_CONFIRMATION` **tanpa memotong stok fisik terlebih dahulu**, lalu membuka chat WhatsApp penjual dengan format rincian pesanan otomatis.
* **Konfirmasi Manual di ERP**: Setelah pembeli menyelesaikan pembayaran via WhatsApp, pemilik toko cukup menekan tombol **"Konfirmasi Pesanan"** di menu Pesanan WA. Pada saat itulah stok fisik resmi dipotong dan omzet tercatat.

---

## 5. Manfaat & Dampak Efisiensi bagi UMKM Indonesia

| Aspek Operasional | Sebelum Menggunakan Warungin | Setelah Menggunakan Warungin |
| --- | --- | --- |
| **Waktu Setup Sistem Toko** | Bingung memilih menu atau harus mengatur puluhan pengaturan teknis sendiri. | **< 2 Menit** melalui wawancara 5 langkah berbahasa Indonesia yang ramah UMKM. |
| **Rekapitulasi Omzet & Stok** | Rekap manual 30–60 menit setiap tutup toko; rawan salah hitung. | **Real-Time (0 Detik)** — Omzet harian, barang terlaris, dan stok kritis langsung terlihat di layar. |
| **Kecepatan & Beban Aplikasi** | Aplikasi ERP umum terasa berat, lambat dimuat, dan boros kuota data. | **Sangat Ringan (< 1,5 Detik)** berkat kuota toko kecil (50 SKU, pencarian instan di browser, dan 0% beban AI harian). |
| **Penjualan Online via WhatsApp** | Pembeli harus mengetik chat manual; stok sering bentrok dengan pembeli di toko fisik. | **Format Chat WA Otomatis + Stok Aman** berkat pemisahan status draf WA dan konfirmasi manual kasir. |

