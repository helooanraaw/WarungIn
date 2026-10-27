# RANCANGAN COPYWRITING & TEKS ANTARMUKA: WARUNGIN

Dokumen ini menjadi acuan wajib untuk seluruh teks yang tampil di layar pengguna selama pengerjaan kode **Warungin**. Seluruh kalimat disusun menggunakan bahasa Indonesia sehari-hari yang akrab bagi pemilik warung atau toko kecil, langsung menjelaskan guna aplikasi, dan bebas dari gaya bahasa mesin (AI slop).

---

## 1. Aturan Penulisan Teks (Wajib Dipatuhi Saat Koding)

1. **Pahami Pembaca Utama**:
   Pengguna yang baru masuk adalah pemilik warung sembako, toko bahan kue, toko pakaian, atau kios harian. Mereka ingin langsung tahu: *"Website ini buat apa, dan bagaimana cara pakainya di toko saya?"*
2. **Larangan Kata & Simbol (Standar Anti-Slop R-02, R-15, R-16)**:
   * **DILARANG** memakai tanda pisah panjang (*em dash*) di seluruh teks antarmuka. Gunakan titik (`.`), koma (`,`), titik dua (`:`), atau tanda kurung `()`.
   * **DILARANG** memakai istilah promosi berlebihan atau bahasa robot seperti: *Solusi Cerdas, Berbasis Kecerdasan Buatan Terdepan, Revolusioner, Transformasi Digital, Ekosistem Terpadu, Otomatisasi Pintar, Mengoptimalkan, Seamless, Next-Gen, AI-Powered*.
   * **DILARANG** menyisipkan emoji pada judul, tombol, tabel, maupun penjelasan fitur.
   * **DILARANG** membuat angka statistik karangan (seperti *"Dipercaya 10.000+ UMKM"*) atau testimoni fiktif jika datanya bukan berasal dari pengguna nyata.
3. **Gunakan Kalimat Aktif dan Konkret**:
   * Hindari: *"Platform yang mengintegrasikan manajemen inventori mutakhir dengan kanal penjualan omnichannel."*
   * Gunakan: *"Catat penjualan di kasir, pantau sisa barang di rak, dan terima pesanan dari WhatsApp dalam satu tempat."*

---

## 2. Teks Halaman Utama / Landing Page (`/`)

### 2.1 Navigasi Atas (Navbar)
* **Nama Brand**: `Warungin`
* **Tautan Menu**:
  * `Etalase Toko` (mengarah ke `#etalase`)
  * `Fitur` (mengarah ke `#fitur`)
  * `Cara Kerja` (mengarah ke `#cara-kerja`)
* **Tombol Kanan (Capsule)**:
  * Sekunder: `Masuk` (mengarah ke `/login`)
  * Utama: `Buat toko pertama` (mengarah ke `/register`)

### 2.2 Bagian Pembuka (Hero Section)
*(Catatan: Tanpa badge kapsul atau label apa pun di atas judul)*

* **Judul Utama (`h1`, `font-normal`)**:
  > Sistem kasir dan katalog online untuk warung Anda.
* **Deskripsi di Bawah Judul (`p`, `font-normal`)**:
  > Catat penjualan harian di meja kasir, pantau sisa stok barang, dan bagikan katalog produk yang bisa dipesan pembeli lewat WhatsApp. Tampilan menu otomatis menyesuaikan jenis toko Anda sejak pertama mendaftar.
* **Tombol Aksi (Capsule `rounded-full`)**:
  * Tombol Utama: `Buat toko pertama`
  * Tombol Kedua: `Masuk ke akun`
  * Tautan Bawah / Coba Langsung: `Lihat contoh toko yang sudah berjalan` (menggulir ke `#etalase` atau membuka pilihan akun contoh)

### 2.3 Bagian Etalase Produk Toko (`#etalase`)
* **Label Kecil Atas**: `ETALASE TOKO`
* **Judul Bagian (`h2`, `font-normal`)**:
  > Barang dagangan dari toko yang menggunakan Warungin.
* **Deskripsi Bagian (`p`)**:
  > Setiap toko dapat memilih barang mana saja yang ingin ditampilkan secara online. Klik salah satu barang di bawah untuk melihat halaman katalog lengkap milik tokonya.
* **Teks pada Kartu Barang**:
  * Nama barang, harga jual (`Rp ...`), nama toko penjual, sisa stok (`Tersedia X`), dan teks petunjuk `Buka katalog toko`.
* **Kondisi Kosong (Jika belum ada barang online)**:
  * Judul: `Belum ada barang yang ditampilkan`
  * Keterangan: `Barang dari toko yang mengaktifkan katalog online akan muncul di bagian ini.`

### 2.4 Bagian Fitur Utama (`#fitur`)
* **Label Kecil Atas**: `FITUR`
* **Judul Bagian (`h2`, `font-normal`)**:
  > Fitur yang dibutuhkan toko kecil, tanpa menu yang membingungkan.
* **Daftar 3 Kolom Fitur**:
  1. **Judul**: `Menu mengikuti jenis toko`
     **Isi**: `Toko sembako butuh pengingat tanggal kedaluwarsa dan harga grosir, sedangkan toko baju butuh catatan ukuran. Jawab lima pertanyaan singkat saat mendaftar, lalu sistem menyiapkan menu yang pas untuk warung Anda.`
  2. **Judul**: `Kasir dan stok terhubung`
     **Isi**: `Setiap kali Anda menyelesaikan pembayaran di menu kasir, sisa stok barang langsung berkurang dan omzet hari ini langsung bertambah. Tidak perlu lagi merekap ulang dari buku tulis setiap malam.`
  3. **Judul**: `Katalog pesanan ke WhatsApp`
     **Isi**: `Pembeli bisa melihat barang yang masih tersedia lewat tautan toko Anda dan mengirim daftar pesanan langsung ke WhatsApp. Stok barang baru berkurang setelah pesanan tersebut Anda konfirmasi di kasir.`

### 2.5 Bagian Cara Kerja (`#cara-kerja`)
* **Label Kecil Atas**: `CARA KERJA`
* **Judul Bagian (`h2`, `font-normal`)**:
  > Tiga langkah dari mendaftar sampai siap melayani pembeli.
* **Daftar 3 Langkah**:
  * `01` / **Judul**: `Isi profil singkat toko`
    **Isi**: `Tulis nama toko, jenis barang yang dijual, dan nomor WhatsApp jika ingin menerima pesanan online. Jawab tiga pertanyaan tambahan agar menu toko sesuai dengan cara kerja Anda.`
  * `02` / **Judul**: `Masukkan daftar barang`
    **Isi**: `Tambahkan barang dagangan beserta harga beli, harga jual, dan jumlah stok awal (maksimal 50 barang utama). Nyalakan pilihan katalog online pada barang yang boleh dipesan lewat WhatsApp.`
  * `03` / **Judul**: `Catat jualan di kasir dan WhatsApp`
    **Isi**: `Gunakan menu kasir untuk melayani pembeli yang datang langsung ke toko, dan buka menu pesanan WhatsApp untuk menyetujui pesanan dari pembeli online.`

### 2.6 Bagian Penutup (CTA Bawah) & Footer
* **Judul Penutup (`h2`, `font-normal`)**:
  > Rapikan catatan jualan dan stok warung Anda mulai hari ini.
* **Deskripsi Penutup**:
  > Pendaftaran hanya butuh waktu dua menit. Anda juga bisa mencoba akun toko contoh terlebih dahulu untuk melihat cara kerjanya.
* **Tombol Aksi (Capsule)**: `Buat toko Anda sekarang`
* **Teks Footer**:
  * Deskripsi kiri: `Aplikasi pencatatan kasir, stok barang, dan katalog pesanan WhatsApp untuk toko retail kecil di Indonesia.`
  * Kanan: `© 2026 Warungin · Karya Kompetisi NAISC 2026`

---

## 3. Teks Halaman Masuk (`/login`) & Daftar (`/register`)

### 3.1 Halaman Masuk (`/login`)
* **Judul (`h1`, `font-normal`)**: `Masuk ke toko Anda`
* **Subjudul**: `Masukkan email dan kata sandi untuk membuka halaman kasir dan pengelolaan stok.`
* **Label & Placeholder Input**:
  * Label: `Alamat email` | Placeholder: `nama@email.com`
  * Label: `Kata sandi` | Placeholder: `Masukkan kata sandi`
* **Tombol Utama**: `Masuk`
* **Tautan Bawah**: `Belum punya akun toko? Daftar sekarang`
* **Kotak Akun Contoh (Khusus Penguji / Dewan Juri)**:
  * Judul Kotak: `Coba masuk dengan akun toko contoh`
  * Keterangan: `Klik salah satu toko di bawah untuk langsung melihat tampilan dashboard dan kasir sesuai jenis usahanya:`
  * Pilihan 1: `Toko Sembako Berkah Jaya (Sembako, Kedaluwarsa, Grosir, Kasbon)`
  * Pilihan 2: `Butik Nusantara Wear (Pakaian, Ukuran & Warna, Grosir)`
  * Pilihan 3: `Toko Bahan Kue Manis (Bahan Kue, Kedaluwarsa, Shift Kasir)`

### 3.2 Halaman Daftar (`/register`)
* **Judul (`h1`, `font-normal`)**: `Buat akun pemilik toko`
* **Subjudul**: `Satu akun digunakan untuk mengelola satu toko. Setelah ini Anda akan mengatur menu yang sesuai dengan usaha Anda.`
* **Label & Placeholder Input**:
  * Label: `Nama lengkap pemilik` | Placeholder: `Contoh: Budi Santoso`
  * Label: `Alamat email` | Placeholder: `nama@email.com`
  * Label: `Kata sandi` | Placeholder: `Minimal 6 karakter`
* **Tombol Utama**: `Lanjut atur toko`
* **Tautan Bawah**: `Sudah punya akun? Masuk di sini`

---

## 4. Teks Halaman Pengaturan Awal 5 Langkah (`/onboarding`)

* **Header Kecil**: `Pengaturan Awal Toko · Langkah X dari 5`
* **Langkah 1: Identitas Toko**
  * **Judul**: `Ceritakan sedikit tentang toko Anda`
  * **Subjudul**: `Informasi ini membantu kami menyiapkan kolom stok dan menu kasir yang cocok untuk barang dagangan Anda.`
  * **Input 1**: `Nama toko` | Placeholder: `Contoh: Toko Berkah Jaya`
  * **Input 2**: `Jenis usaha retail` | Pilihan: `Toko Kelontong / Sembako`, `Toko Pakaian / Butik`, `Toko Bahan Kue / Makanan`, `Apotek Mini / Kesehatan`, `Kios Perlengkapan Harian / Lainnya`
  * **Input 3**: `Keterangan singkat barang yang dijual` | Placeholder: `Contoh: Menjual beras, minyak goreng, telur, dan kebutuhan dapur harian`
  * **Tombol**: `Lanjut ke Langkah 2`
* **Langkah 2: Katalog Online & WhatsApp**
  * **Judul**: `Apakah Anda ingin menerima pesanan dari WhatsApp?`
  * **Subjudul**: `Jika diaktifkan, toko Anda akan memiliki halaman katalog online sendiri. Pembeli bisa memilih barang dan mengirim daftar pesanan langsung ke nomor WhatsApp Anda.`
  * **Pilihan**:
    * `Ya, buatkan katalog online yang terhubung ke WhatsApp saya`
    * `Tidak, saya hanya ingin memakai kasir dan catatan stok di toko fisik`
  * **Input Tambahan (Muncul jika memilih Ya)**:
    * Label: `Nomor WhatsApp toko (awali dengan 628)` | Placeholder: `Contoh: 6281234567890`
    * Label: `Nama penerima pesanan di WhatsApp` | Placeholder: `Contoh: Pak Budi`
  * **Tombol**: `Lanjut ke Langkah 3`
* **Langkah 3, 4, dan 5: Pertanyaan Kebutuhan Operasional**
  * **Teks Saat Memuat Pertanyaan**: `Menyiapkan tiga pertanyaan singkat sesuai jenis toko Anda...`
  * **Subjudul Petunjuk**: `Pilih satu jawaban yang paling mendekati kebiasaan jualan di toko Anda sehari-hari.`
  * **Tombol Langkah 3 & 4**: `Pertanyaan berikutnya`
  * **Tombol Langkah 5 (Terakhir)**: `Selesai dan buka dashboard toko`

---

## 5. Teks Halaman Backoffice ERP (`/dashboard/*`)

*(Seluruh komponen menggunakan bentuk kotak `rounded-[5px]` dan pola Index Table + Filter seperti OpenPOS)*

### 5.1 Navigasi Sidebar & Topbar
* **Topbar Kanan**: `Lihat Katalog Toko` (membuka `/toko/[slug]` di tab baru) | `Keluar`
* **Kelompok Menu `UTAMA`**:
  * `Dashboard`
  * `POS Kasir`
* **Kelompok Menu `MANAJEMEN`**:
  * `Produk & Stok`
  * `Pesanan WhatsApp`
  * `Transaksi`
* **Kelompok Menu `PENGATURAN`**:
  * `Pengaturan Toko`

### 5.2 Halaman Dashboard (`/dashboard`)
* **Judul (`PageHeader`)**: `Halo, [Nama Pemilik]`
* **Subjudul**: `Ringkasan penjualan dan kondisi stok barang di [Nama Toko] hari ini.`
* **4 Kotak Ringkasan Atas**:
  1. `Omzet Hari Ini`
  2. `Transaksi Hari Ini`
  3. `Barang Terjual Hari Ini`
  4. `Stok Menipis`
* **Tabel Kiri**: `Transaksi Terbaru Hari Ini` (`Lihat semua`)
  * Kondisi Kosong: `Belum ada transaksi hari ini. Buka menu POS Kasir untuk mencatat penjualan pertama.`
* **Panel Kanan**: `Barang Terlaris & Peringatan Stok`
  * Jika ada fitur tambahan yang aktif dari pengaturan awal (seperti *Pengingat Kedaluwarsa*, *Rekap Shift*, atau *Catatan Kasbon*), tampilkan daftar ringkasnya secara rapi tanpa hiasan berlebihan.

### 5.3 Halaman POS Kasir (`/dashboard/pos`)
* **Judul (`PageHeader`)**: `POS Kasir`
* **Subjudul**: `Pilih barang yang dibeli pelanggan, atur jumlahnya di keranjang, lalu selesaikan pembayaran.`
* **Placeholder Pencarian**: `Cari nama barang atau kode SKU...`
* **Panel Keranjang Kanan**:
  * Judul: `KERANJANG BELANJA`
  * Kondisi Kosong: `Belum ada barang dipilih. Klik barang di sebelah kiri untuk memasukkan ke keranjang.`
  * Pilihan Shift (Jika fitur shift aktif): `Shift Jaga: Shift Pagi / Shift Sore`
  * Tombol Bawah: `Bayar · Rp [Total]`
* **Modal Pembayaran**:
  * Judul: `Selesaikan Pembayaran`
  * Pilihan Metode Bayar: `Tunai`, `QRIS`, `Transfer`, dan `Kasbon` (jika fitur kasbon aktif)
  * Pilihan Tunai Cepat: `Uang Pas`, atau ketik `Jumlah uang diterima`
  * Input Kasbon (Jika memilih Kasbon): `Nama pelanggan yang kasbon` (Wajib diisi)
  * Tombol: `Batal` | `Simpan & Cetak Struk`

### 5.4 Halaman Produk & Stok (`/dashboard/inventory`)
* **Judul (`PageHeader`)**: `Produk & Stok`
* **Subjudul**: `[Jumlah] dari maksimal 50 barang terdaftar di toko Anda.`
* **Tombol Aksi Kanan**: `+ Tambah Produk`
* **Baris Pencarian & Filter**:
  * Placeholder Cari: `Cari nama barang atau kode SKU...`
  * Filter Kondisi Stok: `Semua Barang`, `Stok Aman`, `Stok Menipis`, `Stok Habis`, `Tampil di Katalog Online`, serta `Hampir Kedaluwarsa` (jika fitur kedaluwarsa aktif).
* **Kolom Index Table**:
  `Nama Barang` | `SKU` | `Varian` *(jika aktif)* | `Harga Beli` | `Harga Jual` *(+ info grosir jika aktif)* | `Stok` | `Kedaluwarsa` *(jika aktif)* | `Katalog Online` | `Aksi`
* **Kondisi Kosong**:
  * Judul: `Belum ada barang terdaftar`
  * Keterangan: `Tambahkan barang dagangan pertama Anda untuk mulai mencatat penjualan di kasir dan katalog online.`

### 5.5 Halaman Pesanan WhatsApp (`/dashboard/whatsapp-orders`)
* **Judul (`PageHeader`)**: `Pesanan WhatsApp`
* **Subjudul**: `Daftar pesanan dari katalog online. Stok barang baru berkurang setelah Anda menekan tombol Konfirmasi.`
* **Baris Pencarian & Filter**:
  * Placeholder Cari: `Cari kode pesanan atau nama pembeli...`
  * Filter Status: `Menunggu Konfirmasi`, `Sudah Dikonfirmasi`, `Dibatalkan`, `Semua`
* **Kolom Index Table**:
  `Kode Pesanan` | `Waktu Masuk` | `Nama Pembeli` | `Daftar Barang` | `Total Tagihan` | `Status` | `Aksi`
* **Tombol Aksi pada Baris Menunggu Konfirmasi**:
  * `Konfirmasi` (memotong stok barang dan memasukkan nilai ke omzet hari ini)
  * `Batalkan` (membatalkan pesanan tanpa mengubah stok)
* **Kondisi Kosong**:
  * Judul: `Belum ada pesanan dari WhatsApp`
  * Keterangan: `Pesanan yang dikirim pembeli melalui halaman katalog toko Anda akan tercatat di tabel ini.`

### 5.6 Halaman Transaksi (`/dashboard/transactions`)
* **Judul (`PageHeader`)**: `Riwayat Transaksi`
* **Subjudul**: `Catatan seluruh penjualan dari meja kasir maupun pesanan WhatsApp yang sudah selesai.`
* **Baris Pencarian & Filter**:
  * Placeholder Cari: `Cari nomor nota atau nama pelanggan...`
  * Filter Kanal: `Semua Kanal`, `Kasir Toko`, `WhatsApp Online`
  * Filter Metode Bayar: `Semua Metode`, `Tunai`, `QRIS`, `Transfer`, `Kasbon Belum Lunas` *(jika fitur kasbon aktif)*
* **Kolom Index Table**:
  `No. Nota` | `Waktu` | `Asal Transaksi` | `Pelanggan / Shift` | `Barang` | `Metode Bayar` | `Total` | `Status` | `Aksi`
* **Tombol Aksi**: `Lihat Struk`, serta tombol `Tandai Lunas` untuk baris transaksi kasbon yang belum dibayar.

### 5.7 Halaman Pengaturan Toko (`/dashboard/settings`)
* **Judul (`PageHeader`)**: `Pengaturan Toko`
* **Subjudul**: `Ubah informasi profil toko, nomor WhatsApp penerima pesanan, dan fitur tambahan yang aktif.`
* **Bagian 1**: `Profil Toko & Katalog Online` (Nama toko, tautan `/toko/[slug]`, deskripsi, status katalog online, nomor WhatsApp, nama penerima).
* **Bagian 2**: `Fitur Tambahan Toko` (Daftar sakelar aktif/nonaktif untuk *Pengingat Tanggal Kedaluwarsa*, *Catatan Ukuran & Warna*, *Harga Grosir*, *Catatan Shift Kasir*, dan *Buku Kasbon Pelanggan*, sehingga pemilik toko tetap bisa menyalakan atau mematikan fitur kapan saja).

---

## 6. Teks Halaman Katalog Publik (`/toko/[slug]`)

* **Tautan Atas**: `Kembali ke halaman utama Warungin`
* **Header Toko**:
  * Nama Toko (`h1`, `font-normal`)
  * Deskripsi singkat toko
  * Keterangan Penerima: `Penerima pesanan: [Nama Penerima] · WhatsApp: [Nomor WA]`
* **Placeholder Pencarian Barang**: `Cari barang di toko ini...`
* **Teks Kartu Barang**:
  * Nama barang, label varian (jika ada), info harga grosir (jika ada, misal: `Beli min. 10: Rp ...`), harga satuan, sisa stok (`Stok tersedia: X`), dan tombol `+ Tambah`.
* **Panel Keranjang Pesanan di Bawah**:
  * Input: `Nama Anda (Pembeli)` | Placeholder: `Tulis nama Anda untuk pesanan ini`
  * Input Opsional: `Catatan tambahan` | Placeholder: `Contoh: Diambil jam 4 sore / minta kantong terpisah`
  * Tombol Utama: `Pesan lewat WhatsApp · Rp [Total]`
  * Keterangan Kecil di Bawah Tombol: `Anda akan diarahkan ke chat WhatsApp pemilik toko dengan daftar pesanan yang sudah tersusun rapi.`
