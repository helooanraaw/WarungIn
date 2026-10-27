# PANDUAN INSTALASI, KONFIGURASI, DAN PENGGUNAAN WARUNGIN

Dokumen ini berisi panduan lengkap mengenai kebutuhan perangkat lunak, cara pemasangan (instalasi), konfigurasi variabel lingkungan (`.env`), akun toko contoh, serta cara menjalankan aplikasi **Warungin** di komputer lokal Anda.

---

## 1. Perangkat yang Perlu Dipasang (Prasyarat)

Sebelum menjalankan proyek ini, pastikan komputer Anda sudah terpasang:

1. **Node.js (Versi 20 LTS atau Versi 22+)**
   - Sudah termasuk `npm` dan `npx`.
   - Cek di terminal/PowerShell dengan perintah: `node -v` dan `npm -v`.
2. **Git** (Opsional, untuk pengelolaan repositori kode).
3. **Browser Modern** (Google Chrome, Microsoft Edge, atau Mozilla Firefox).
4. **Database Tambahan: TIDAK PERLU**
   - Warungin menggunakan **SQLite (`prisma/dev.db`)** melalui **Prisma ORM**. Anda tidak perlu memasang XAMPP, MySQL, atau PostgreSQL secara terpisah.

---

## 2. Langkah Instalasi & Menjalankan Aplikasi

Apabila Anda baru mengunduh atau membuka folder proyek `Tokoku` ini di komputer baru, jalankan 3 perintah berikut secara berurutan di terminal:

### Langkah 1: Pasang Seluruh Paket Dependensi
```bash
npm install
```

### Langkah 2: Buat Database SQLite & Isi Data 3 Toko Contoh (Seed)
```bash
npm run db:setup
```
*(Perintah ini otomatis menjalankan `prisma db push` untuk membuat tabel di `prisma/dev.db` dan menjalankan `tsx prisma/seed.ts` untuk mengisi 3 toko contoh beserta produk dan transaksi).*

### Langkah 3: Jalankan Server Pengembangan
```bash
npm run dev
```
Setelah server berjalan, buka browser dan akses alamat:
- **Halaman Utama**: `http://localhost:3000`

---

## 3. Konfigurasi File `.env` (Opsional: Google Gemini API)

Di folder utama proyek sudah tersedia file `.env` dengan konfigurasi siap pakai:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="warungin-naisc-2026-secret-key"
GEMINI_API_KEY=""
```

### Apakah `GEMINI_API_KEY` Wajib Diisi?
- **Tidak Wajib untuk Berjalan**: Jika `GEMINI_API_KEY` dibiarkan kosong (`""`), sistem **Rule-Based Fallback Engine** di [`src/lib/ai-onboarding.ts`](../src/lib/ai-onboarding.ts) akan otomatis menyusun pertanyaan Langkah 3-5 dan mengaktifkan modul ERP sesuai jenis usaha tanpa hambatan.
- **Jika Ingin Mengaktifkan AI Dinamis Penuh**:
  1. Dapatkan API Key gratis dari Google AI Studio (`https://aistudio.google.com/app/apikey`).
  2. Tempelkan ke dalam file `.env`, contohnya:
     ```env
     GEMINI_API_KEY="AIzaSyYourApiKeyHere"
     ```
  3. Muat ulang (`restart`) `npm run dev`. Sistem akan memanggil model `gemini-3.8-flash` dengan batas waktu aman `3.5 detik`.

---

## 4. Daftar Akun Toko Contoh (Siap Coba 1-Klik)

Di halaman Masuk (`http://localhost:3000/login`) maupun pada bilah atas (Topbar) Dashboard ERP, Anda dapat berpindah antar **3 Toko Contoh** hanya dengan 1 klik untuk menguji perbedaan modul adaptif:

| Nama Toko | Email Login | Kata Sandi | URL Katalog Online | Modul Adaptif yang Aktif |
| :--- | :--- | :--- | :--- | :--- |
| **Toko Sembako Berkah Jaya** | `berkah@demo.warungin.id` | `demo123` | `/toko/berkah-jaya` | Tanggal Kedaluwarsa, Harga Grosir, Buku Kasbon |
| **Butik Nusantara Wear** | `nusantara@demo.warungin.id` | `demo123` | `/toko/nusantara-wear` | Varian Ukuran/Warna, Pencatatan Shift Kasir |
| **Toko Bahan Kue Manis** | `kuemanis@demo.warungin.id` | `demo123` | `/toko/kue-manis` | Tanggal Kedaluwarsa, Harga Grosir, Shift Kasir |

---

## 5. Skenario Pengujian End-to-End (Untuk Demo / Penilaian Juri)

1. **Etalase Komunitas & Katalog Online (`/`)**:
   - Buka `http://localhost:3000`, gulir ke bagian **Etalase Produk Toko**, lalu klik salah satu produk untuk masuk ke halaman katalog penuh (`/toko/berkah-jaya`).
2. **Simulasi Pesanan WhatsApp (`/toko/berkah-jaya`)**:
   - Pilih beberapa barang, klik **Pesan via WhatsApp**, isi nama dan nomor WhatsApp pembeli, lalu kirim.
   - Pesanan tercatat dengan status **Menunggu Konfirmasi** dan stok fisik di rak **belum berkurang**.
3. **Konfirmasi Pesanan WhatsApp di Backoffice (`/dashboard/whatsapp-orders`)**:
   - Masuk ke Dashboard `Toko Sembako Berkah Jaya` melalui `/login`.
   - Buka menu **Pesanan WhatsApp**, lalu klik tombol **Konfirmasi** pada pesanan yang baru masuk.
   - Stok fisik produk otomatis terpotong secara atomik dan omzet harian di Dashboard langsung bertambah.
4. **Transaksi Kasir Fisik (`/dashboard/pos`)**:
   - Pilih barang di layar Kasir (coba beli minimal 5-6 unit untuk melihat **Harga Grosir** aktif otomatis).
   - Klik **Proses Pembayaran**, pilih metode **Tunai** (otomatis menghitung kembalian) atau **Kasbon**, lalu cetak struk digital.
5. **Pengaturan Visibilitas Katalog Online (`/dashboard/inventory`)**:
   - Pada tabel **Produk & Stok**, klik tombol **Tayang / Nonaktif** pada kolom `Katalog Online`. Barang yang dinonaktifkan otomatis disembunyikan dari halaman `/toko/[slug]` tetapi tetap bisa dijual di Kasir POS fisik.
