# DESIGN.md — Spesifikasi Tampilan & Sistem Desain Warungin

Dokumen ini menetapkan aturan tampilan antarmuka (**UI/UX Design Plan**) untuk **Warungin** dengan mengacu pada referensi tata letak bersih [OpenPOS](https://github.com/0xMinomus/OpenPOS) serta aturan ketat bebas *AI slop*. Tidak ada elemen dekoratif, badge tanpa fungsi, atau opini visual tambahan di luar spesifikasi ini.

---

## 1. Aturan Tipografi (Font & Ketebalan)

1. **Keluarga Font Utama**:
   * Seluruh antarmuka (Landing Page, Katalog Publik, Onboarding, dan Backoffice ERP) menggunakan font **`Poppins`** (`--font-sans: 'Poppins', ui-sans-serif, system-ui, sans-serif`).
   * Kode SKU, nomor nota/invoice, dan nominal harga menggunakan proporsi angka sejajar (`tabular-nums` / `--font-mono`).
2. **Batas Ketebalan Huruf (Maksimal `font-normal` / `400`)**:
   * **DILARANG** menggunakan `font-bold` (`700`), `font-extrabold` (`800`), maupun `font-semibold` (`600`) di seluruh halaman.
   * Seluruh elemen teks — mulai dari judul utama (`h1`), subjudul (`h2`, `h3`), isi tabel, tombol, label form, hingga navigasi sidebar — menggunakan ketebalan **maksimal `font-normal` (`font-weight: 400`)**.
   * Hierarki informasi dibedakan menggunakan **ukuran huruf (`font-size`)**, **warna teks** (utama `#111827` vs sekunder `#5f6f82`), dan **jarak antar elemen**, bukan ketebalan huruf.

---

## 2. Aturan Geometri Komponen (Perbedaan Landing vs Backoffice ERP)

| Area Aplikasi | Bentuk Tombol & Komponen | Detail Radius & Border |
| --- | --- | --- |
| **Landing Page (`/`) & Katalog Publik (`/toko/[slug]`)** | **Capsule (`rounded-full`)** untuk tombol aksi utama dan sekunder. | Tombol: `border-radius: 9999px` (`rounded-full`), `px-6 py-3`, `font-normal`. Wadah kartu produk: `rounded-xl` (`12px`) dengan border tipis `#ddd3c2`. |
| **Dashboard & Sistem ERP (`/dashboard/*` & `/onboarding`)** | **Kotak dengan lengkungan tipis (`rounded-[5px]` s.d. `rounded-[6px]`)**. **DILARANG memakai capsule**. | Tombol, input, select, filter, kartu KPI, modal, dan tabel semuanya berbentuk kotak berlengkungan tipis (`5px–6px`), border `1px solid #d8e1ea`, tinggi tombol kompak `36px–38px` (`padding: 8px 14px`). |

---

## 3. Palet Warna (Mengacu pada Referensi OpenPOS)

### 3.1 Permukaan Publik (Landing Page & Katalog Toko)
* **Background Utama (`--t-bg`)**: `#fffdf9` (Putih hangat bersih)
* **Permukaan Kartu / Panel (`--t-surface` / `--t-cream`)**: `#faf6ef` / `#ffffff`
* **Teks Utama (`--t-fg`)**: `#0a0a0a`
* **Teks Sekunder (`--t-muted`)**: `#57534a`
* **Garis Batas (`--t-border` / `--t-dove`)**: `#ddd3c2`
* **Aksen Utama (`--t-jet`)**: `#1a76d1` (Biru bersih untuk tombol utama)

### 3.2 Permukaan Backoffice ERP (`.op-classic` Style)
* **Background Kerja (`--background`)**: `#f4f7fa` (Abu-biru muda khas backoffice ERP)
* **Permukaan Kartu & Tabel (`--card`)**: `#ffffff` dengan border `#d8e1ea`
* **Topbar Header (`54px`)**: `#1976d2` (Biru utama) dengan area nama toko `#1b2733` (`240px`)
* **Sidebar Navigasi (`240px`)**: `#1f2d3a` (Gelap tenang), teks menu `#d9e2ea`, menu aktif `#1976d2`
* **Teks Utama Backoffice**: `#111827`
* **Teks Sekunder / Header Tabel**: `#5f6f82`
* **Indikator Status Fungsional**:
  * Selesai / Aktif / Online: teks `#2e9d63` di atas latar `#e4f4ea`
  * Peringatan / Pending / Menipis: teks `#b45309` di atas latar `#fff4d6`
  * Bahaya / Habis / Batal: teks `#d64545` di atas latar `#fde8e8`

---

## 4. Rencana Tampilan per Halaman

### 4.1 Landing Page (`/`) — Bersih & Tanpa *AI Slop*
1. **Navbar**: Logo/nama **Warungin** di kiri, tautan navigasi fungsional (`Etalase Toko`, `Fitur`, `Cara Kerja`), dan tombol capsule (`Masuk`, `Buat Toko`) di kanan.
2. **Hero Section (Tanpa Badge di Atas Judul)**:
   * **TIDAK ADA** badge kapsul, label *"AI Powered"*, titik menyala, atau ornamen apa pun di atas judul.
   * Langsung menampilkan **Judul (`h1`, `font-normal`)**: *"Sistem kasir dan katalog online untuk warung Anda."*
   * Diikuti **Deskripsi (`p`, `font-normal`, `#57534a`)**: penjelasan ringkas pengelolaan produk, stok, kasir harian, dan pesanan WhatsApp.
   * Diikuti **Tombol Capsule (`rounded-full`)**: `"Buat toko pertama"` (solid `#1a76d1`) dan `"Masuk"` (outline `#ddd3c2`).
3. **Etalase Produk Komunitas**:
   * Menampilkan deretan produk aktif (maks. 8–12 produk) dari toko-toko terdaftar.
   * Klik pada kartu produk langsung mengarahkan pengunjung ke halaman katalog toko terkait (`/toko/[slug]`).
4. **Fitur & Cara Kerja**:
   * Tata letak 3 kolom bersih mengikuti struktur `OpenPOS/Landing.tsx` (judul `font-normal` + deskripsi singkat), tanpa bento grid, tanpa statistik karangan, dan tanpa testimoni palsu.

### 4.2 Halaman Onboarding 5 Langkah (`/onboarding`)
* Tampilan formulir satu kolom terpusat di atas latar `#f4f7fa` dengan kartu putih kotak (`rounded-[6px]`, border `#d8e1ea`).
* Indikator progres sederhana `Langkah X dari 5`.
* Seluruh input, pilihan radio/opsi pertanyaan AI (Langkah 3–5), dan tombol navigasi (`Kembali`, `Lanjut`) berbentuk kotak berlengkungan tipis (`rounded-[5px]`) dengan font `Poppins` `font-normal`.

### 4.3 Sistem Backoffice ERP (`/dashboard/*`) — Gaya ERP Standar (Index Table & Filter)
Seluruh halaman di dalam ERP menggunakan cangkang **AppShell** (`Topbar 54px` + `Sidebar Kiri 240px` + `Area Konten #f4f7fa`) dan pola halaman standar:

```
+-----------------------------------------------------------------------------------+
| [Warungin · Nama Toko]   [Toggle Sidebar]              [Lihat Katalog] [Keluar]   |
+----------------------+------------------------------------------------------------+
| UTAMA                | Judul Halaman (font-normal 26px)      Beranda / Nama Menu  |
| - Dashboard          | Subjudul singkat penjelasan halaman   [Tombol Aksi Kotak]  |
| - POS Kasir          | ---------------------------------------------------------- |
|                      | [Ringkasan Angka Seperlunya - Kotak radius 6px]            |
| MANAJEMEN            | ---------------------------------------------------------- |
| - Produk & Stok      | [Input Cari (Kotak 5px)...] [Filter Kategori] [Filter Lain]|
| - Pesanan WhatsApp   | ---------------------------------------------------------- |
| - Transaksi          | +--------------------------------------------------------+ |
|                      | | HEADER TABEL (12px, font-normal, #5f6f82)              | |
| PENGATURAN           | |--------------------------------------------------------| |
| - Pengaturan Toko    | | Baris Data 1 (44px, hover halus, aksi di kanan)        | |
|                      | | Baris Data 2                                           | |
|                      | +--------------------------------------------------------+ |
|                      |                                    [<] [1] [2] [>] (Pager) |
+----------------------+------------------------------------------------------------+
```

#### Rincian Tiap Menu Backoffice ERP:
1. **Dashboard (`/dashboard`)**:
   * Baris 4 kartu KPI kotak (`rounded-[6px]`): *Omzet Hari Ini*, *Transaksi Hari Ini*, *Produk Terjual*, dan *Stok Menipis*.
   * Tabel ringkas **Transaksi Terbaru Hari Ini** dan daftar **Produk Terlaris / Peringatan Stok** (termasuk ringkasan modul aktif seperti item hampir kedaluwarsa atau kasbon aktif jika diaktifkan oleh hasil onboarding).
2. **POS Kasir (`/dashboard/pos`)**:
   * Layout 2 kolom seperti `OpenPOS/Pos.tsx`:
     * **Kiri**: Input pencarian produk kotak (`rounded-[5px]`), filter kategori kotak, dan grid daftar produk toko (maks. 50 SKU; harga grosir otomatis teraplikasi jika modul grosir aktif).
     * **Kanan (`320px`)**: Panel keranjang belanja, pilihan shift (jika modul shift aktif), subtotal, dan tombol kotak `"Bayar"` yang membuka modal pembayaran (`Tunai`, `QRIS`, `Transfer`, atau `Kasbon` jika modul kasbon aktif).
3. **Produk & Inventori (`/dashboard/inventory`)**:
   * Mengikuti pola **Index Table + Filter** (`OpenPOS/Produk.tsx` & `Stok.tsx`):
     * Baris atas: Input pencarian (`Cari nama atau SKU...`), dropdown filter kategori, filter status stok (`Semua`, `Stok Aman`, `Stok Menipis`, `Stok Habis`, serta `Hampir Kedaluwarsa` jika modul kedaluwarsa aktif), dan tombol kotak `+ Tambah Produk` (dibatasi maks. 50 SKU).
     * **Index Table**: Kolom `Nama`, `SKU`, `Kategori` (atau `Varian` jika modul varian aktif), `Harga Beli`, `Harga Jual` (beserta info grosir jika aktif), `Stok` (dan `Kedaluwarsa` jika aktif), `Katalog Online` (sakelar/toggle langsung `ON/OFF`), serta tombol aksi (`Ubah`, `Sesuaikan Stok`, `Hapus`).
4. **Pesanan WhatsApp (`/dashboard/whatsapp-orders`)**:
   * Mengikuti pola **Index Table + Filter**:
     * Filter status: `Menunggu Konfirmasi (Pending)`, `Selesai`, `Dibatalkan` + input pencarian nama pembeli/kode pesanan.
     * **Index Table**: Kolom `Kode Invoice`, `Waktu`, `Nama Pembeli`, `Rincian Barang`, `Total`, `Status`, dan tombol aksi kotak `Konfirmasi Pesanan` (memotong stok fisik secara atomik) atau `Batalkan`.
5. **Transaksi (`/dashboard/transactions`)**:
   * Mengikuti pola **Index Table + Filter** (`OpenPOS/Transaksi.tsx`):
     * Baris 4 kartu ringkasan transaksi + input pencarian invoice/pelanggan + filter kanal (`Semua`, `POS Kasir`, `WhatsApp Online`), filter metode bayar (`Tunai`, `QRIS`, `Transfer`, `Kasbon`), dan pemilih tanggal.
     * **Index Table**: Kolom `Invoice`, `Waktu`, `Kanal`, `Pelanggan / Shift`, `Metode Bayar`, `Total`, `Status`, dan aksi (`Detail Struk`, serta tombol `Tandai Lunas` khusus transaksi kasbon).
6. **Pengaturan Toko (`/dashboard/settings`)**:
   * Form kotak bersih untuk mengubah profil toko, nomor WhatsApp penerima pesanan, sakelar aktif/nonaktif modul toko secara manual, serta tombol ulangi onboarding AI (maks. 2x).

### 4.4 Katalog Online Publik (`/toko/[slug]`)
* Header bersih menampilkan nama toko, deskripsi singkat, dan informasi penerima pesanan WhatsApp.
* Bar pencarian instan (*client-side search*) dan filter kategori.
* Grid produk yang memiliki status `is_online = true` beserta sisa stok tersedia dan tombol tambah ke daftar pesanan.
* Panel/bar bawah ringkas untuk mengisi nama pembeli dan menekan tombol **"Pesan via WhatsApp"** yang menyusun draf pesanan `PENDING_CONFIRMATION` serta membuka tautan `wa.me`.
