# PRODUCT REQUIREMENT DOCUMENT (PRD): WARUNGIN

| Informasi Dokumen | Detail Spesifikasi |
| --- | --- |
| **Nama Produk** | Warungin — Adaptive Micro-ERP & WhatsApp Commerce Platform |
| **Kategori Kompetisi** | Website — National AI Summit & Competition (NAISC) 2026 |
| **Target Pengguna Utama** | Pelaku Usaha Mikro dan Kecil (Toko Retail Kecil / Warung / Kios) di Indonesia |
| **Skala & Batasan Sistem** | **Micro-Retail Scoped (Lightweight & Quota-Bounded)** — Dioptimalkan agar ringan, cepat dimuat, dan bebas *over-engineering* |
| **Tech Stack Utama** | Next.js Full-Stack (TypeScript + Tailwind CSS) + Prisma ORM (SQLite / PostgreSQL) + Google Gemini API |
| **Status Dokumen** | Final Baseline v1.1 (Disetujui — Siap Eksekusi) |

---

## 1. Executive Summary & Problem Framing

### 1.1 Konteks Permasalahan DUDI Retail Skala Kecil

Pada operasional toko retail skala kecil di Indonesia (seperti toko kelontong, butik pakaian kecil, toko bahan kue rumahan, apotek mini, dan kios perlengkapan harian), pemilik usaha wajib memantau empat indikator kritis setiap hari: **omzet harian, produk terlaris, stok menipis, dan aktivitas kasir**. Saat ini, pencatatan di lapangan masih didominasi oleh rekapitulasi manual di buku fisik atau lembar kerja yang terpisah-pisah. Kondisi ini memperlambat pengambilan keputusan bisnis, meningkatkan risiko salah hitung, serta membuka celah kebocoran stok.

Ketika pelaku UMKM mencoba merambah penjualan daring (online), mereka menghadapi hambatan baru:

1. **Rigiditas & Beban Berat Sistem ERP/POS Konvensional**: Aplikasi kasir di pasaran menerapkan antarmuka seragam yang terlalu kompleks dan berat dimuat (*heavy loading*) bagi toko kecil, atau sebaliknya terlalu sederhana sehingga tidak mengakomodasi kebutuhan spesifik toko (seperti pelacakan kedaluwarsa sederhana untuk toko makanan atau pencatatan label varian ukuran untuk toko baju).
2. **Disparitas Stok Offline dan Online**: Penjualan melalui pesan instan (WhatsApp) tidak terhubung dengan pencatatan stok fisik di meja kasir, sehingga sering terjadi pesanan ganda pada barang yang sudah habis terjual di toko fisik.

### 1.2 Solusi Warungin & Keselarasan Visi NAISC 2026

**Warungin** adalah platform berbasis web berskala **Micro-ERP** yang mengintegrasikan kecerdasan buatan untuk merakit sistem operasional manajemen toko kecil dan katalog penjualan online secara adaptif dan ringan. Melalui mekanisme *Dynamic AI Onboarding* berupa formulir bertahap 5 langkah, AI menganalisis profil usaha pengguna dan mengaktifkan modul manajemen operasional yang relevan di atas satu template antarmuka standar yang konsisten.

Pengembangan platform ini selaras secara langsung dengan tema NAISC 2026, yaitu *"Akselerasi Inovasi Kecerdasan Buatan: Mengukir Solusi Digital Menuju Kemandirian Teknologi Bangsa"*, serta menjawab kebutuhan nyata Dunia Usaha dan Dunia Industri (DUDI) dalam mendukung efektivitas, efisiensi, produktivitas, kualitas layanan, dan proses bisnis toko retail kecil di Indonesia.

### 1.3 Pembatasan Skala Sistem & Kuota Pengguna (Micro-Retail Guardrails)

Karena produk ini ditujukan khusus untuk **retail toko kecil** dan harus berjalan sangat ringan tanpa membebani server maupun peramban pengguna, sistem menetapkan **batasan kuota pengguna (User Quotas)** dan **penyederhanaan modul (Lightweight Micro-Modules)** secara ketat:

| Aspek Pembatasan | Batas Kuota / Aturan Sistem | Tujuan Optimasi (Agar Tidak Banyak *Load*) |
| --- | --- | --- |
| **Kepemilikan Toko** | Maksimal **1 Toko per Akun Pengguna** (1 Pemilik = 1 Toko, tanpa sistem multi-cabang). | Menjaga kueri autentikasi dan sesi tetap ringan (*single-store context*). |
| **Kapasitas Produk (SKU)** | Maksimal **50 Produk Aktif per Toko**. | Sangat cukup untuk barang *fast-moving* toko kecil; memastikan halaman Inventori, POS Kasir, dan Katalog Publik dimuat instan tanpa *lag*. |
| **Media & Foto Produk** | Maksimal **1 Foto per Produk** (ukuran maks. **500 KB** WebP/JPG atau memakai *icon/placeholder* kategori ringan). | Mencegah *bottleneck* pemuatan gambar (*heavy image payload*) di Landing Page dan katalog `/toko/[slug]`. |
| **Batas Item Keranjang** | Maksimal **15 Jenis Barang per Transaksi** (baik di POS Kasir maupun Pesanan WhatsApp). | Memastikan transaksi database atomik berjalan dalam hitungan milidetik. |
| **Antrean Pesanan WA** | Maksimal **20 Pesanan Berstatus `PENDING_CONFIRMATION`** per toko pada satu waktu. | Mencegah penumpukan *spam order* di memori dan menjaga tabel konfirmasi tetap ringkas. |
| **Batas Muat Riwayat Data** | Menampilkan maksimal **20 Transaksi Terbaru** per halaman & agregasi metrik fokus pada **Hari Ini**. | Menghindari *full-table scan* pada data historis sehingga dashboard terbuka seketika. |
| **Frekuensi Panggilan AI** | AI **hanya dipanggil 2 kali** saat *Onboarding* awal (maks. 2x kesempatan *re-onboarding* per akun). | Operasional harian (Dashboard, POS, Inventori, WA) **0% memanggil LLM**, sehingga *zero AI latency* saat toko beroperasi. |

---

## 2. User Personas & Core Value Proposition

| Persona | Karakteristik & Peran | Masalah Utama (Pain Points) | Core Value Proposition (Solusi Warungin) |
| --- | --- | --- | --- |
| **Pemilik Toko Kecil (Owner)** | Pengambil keputusan utama usaha retail mikro/kecil, mengelola stok kulakan (maks. 50 SKU utama), mengecek laporan harian, dan memegang nomor WhatsApp toko. | Sulit merekap omzet harian dengan cepat, sering kehabisan barang laris tanpa sadar, dan enggan memakai aplikasi ERP yang berat/rumit. | Mendapatkan dashboard Micro-ERP ringan hasil wawancara AI, kendali penuh atas visibilitas produk online/offline, dan sinkronisasi stok satu pintu. |
| **Staf Kasir (Operator)** | Penjaga toko harian yang melayani pembeli langsung di tempat (offline) dan memproses pesanan yang masuk dari WhatsApp. | Salah hitung uang kembalian, lupa mencatat barang keluar saat toko ramai, serta tumpang tindih antara stok laku di kasir dengan pesanan chat. | Layar POS kasir satu halaman yang cepat dan seragam, pemotongan stok offline otomatis, serta menu konfirmasi manual pesanan WhatsApp yang menjaga akurasi stok fisik. |
| **Pelanggan Online (Buyer)** | Pembeli ritel sekitar yang mencari barang secara daring dan menginginkan proses pemesanan praktis tanpa perlu mengunduh aplikasi tambahan. | Katalog toko di media sosial tidak mencantumkan ketersediaan stok terbaru dan proses mengetik daftar pesanan di WhatsApp memakan waktu. | Akses ke halaman profil katalog lengkap toko (`/toko/[slug]`) dari etalase komunitas yang ringan di ponsel, lengkap dengan tombol pemesanan instan yang menyusun format chat WhatsApp otomatis. |

---

## 3. End-to-End User Journey & Interaction Flow

```
[1. LANDING PAGE UTAMA]
 ├── Pengunjung melihat Hero, Value Prop, Testimoni, & "Etalase Produk Komunitas" (Maks. 8-12 Produk Acak)
 ├── Klik Produk Acak ──> Redirect ke Halaman Profil Katalog Toko (/toko/[slug])
 └── Klik Daftar Akun ──> Masuk ke Alur Dynamic AI Onboarding (1 Akun = 1 Toko)

[2. DYNAMIC AI ONBOARDING (5-STEP FORM - HANYA SAAT SETUP AWAL)]
 ├── Langkah 1 (Statis) : Input Nama Toko, Kategori Retail, Deskripsi Usaha
 ├── Langkah 2 (Statis) : Opsi Integrasi Toko Online (Ya/Tidak)
 │                        └── Jika YA: Input Nomor WhatsApp Bisnis & Nama Pemilik (Atas Nama Siapa)
 ├── [AI Call #1]       : Generate 3 Pertanyaan Sekaligus (Satu Request Batch Ringan)
 ├── Langkah 3 (AI)     : Pertanyaan Dinamis 1 (Karakteristik Inventori & Stok)
 ├── Langkah 4 (AI)     : Pertanyaan Dinamis 2 (Alur Transaksi & Kasir Harian)
 ├── Langkah 5 (AI)     : Pertanyaan Dinamis 3 (Prioritas Metrik & Laporan Operasional)
 └── [AI Call #2]       : Generate JSON Schema Konfigurasi Modul ──> Simpan Permanen & Render ERP Dashboard

[3. OPERASIONAL ERP & DUAL-CHANNEL COMMERCE (TANPA BEBAN AI HARIAN)]
 ├── Jalur A (Kasir POS Offline)
 │    └── Pilih Produk (Maks. 15 Item) ──> Bayar ──> Stok Fisik Otomatis Terpotong & Omzet Harian Bertambah
 └── Jalur B (Katalog Online & WhatsApp)
      └── Pembeli Klik "Pesan via WhatsApp" di /toko/[slug] ──> Buka Chat WA Terformat (Stok BELUM Berkurang)
           └── Pembeli Transfer ──> Pemilik/Kasir Klik "Konfirmasi Pesanan" Manual di ERP ──> Stok Terpotong & Omzet Tercatat
```

---

## 4. Detailed Functional Requirements

| ID | Modul Sistem | Nama Fitur | Input Pengguna / Sistem | Proses Logika, AI & Batasan Kuota | Output Sistem | Acceptance Criteria (Kriteria Penerimaan) |
| --- | --- | --- | --- | --- | --- | --- |
| **FR-01** | Landing Page | Etalase Produk Komunitas Acak | Request halaman utama oleh pengunjung publik. | Query mengambil **maksimal 8–12 produk** dengan atribut `is_online = true` dan `stock_quantity > 0` dari toko yang `is_online_active = true` secara acak (`LIMIT 12`). | Grid kartu produk ringan di landing page lengkap dengan nama barang, harga, dan nama toko. | Mengklik kartu produk wajib mengarahkan URL ke `/toko/[slug]` milik toko terkait, bukan halaman produk tunggal. |
| **FR-02** | Autentikasi | Registrasi & Login Akun UMKM (1 Akun = 1 Toko) | Email, Nama Lengkap, Kata Sandi. | Validasi format email, hashing kata sandi (bcrypt), pembuatan sesi token (JWT/Session). Satu pengguna dibatasi hanya memiliki **1 toko**. | Redirect ke formulir Onboarding (jika pengguna baru) atau ke ERP Dashboard (jika sudah onboarding). | Pengguna yang belum menyelesaikan 5 langkah onboarding tidak dapat mengakses halaman ERP Dashboard. |
| **FR-03** | AI Onboarding | Step 1 & 2 Static Form Capture | Step 1: Nama Toko, Kategori, Deskripsi (maks. 200 karakter). Step 2: Toggle Online, No WA, Atas Nama. | Validasi input; jika Toggle Online = `Ya`, kolom Nomor WhatsApp (format `628...`) dan Atas Nama wajib terisi. | Data dasar tersimpan di state sementara dan dikirim ke AI Question Generator API. | Tombol "Lanjut ke Langkah 3" tidak aktif apabila opsi online dipilih tetapi Nomor WA atau Atas Nama kosong. |
| **FR-04** | AI Onboarding | Step 3–5 Dynamic AI Questioning (Single Batch) | Data JSON dari Step 1 & Step 2. | **1x panggilan LLM API** menganalisis jenis toko dan menghasilkan 3 pertanyaan kontekstual beserta opsi jawabannya dalam format JSON baku (atau menggunakan *Fallback Template* jika timeout > 3,5 detik). | Render formulir Langkah 3, 4, dan 5 secara bertahap di layar pengguna tanpa *loading* berulang antar langkah. | Pertanyaan yang muncul harus relevan dengan kategori usaha dan berpindah dari Langkah 3 ke 4 ke 5 secara instan di sisi klien. |
| **FR-05** | AI Onboarding | AI Module Provisioning Engine | Seluruh jawaban dari Langkah 1 s.d. 5. | **1x panggilan LLM API** mengevaluasi jawaban dan memetakan status boolean untuk 5 modul ringan ke dalam tabel `ModulesConfig`. (Kuota *re-onboarding* dibatasi maks. 2x per toko). | Pembentukan halaman ERP Dashboard sesuai konfigurasi modul toko. | Konfigurasi tersimpan permanen di database dan langsung mengatur visibilitas kartu modul di dashboard tanpa perlu panggil AI lagi. |
| **FR-06** | ERP Dashboard | Standardized Analytics Dashboard | Data transaksi hari ini, log kasir, dan status stok dari database. | Agregasi query ringan khusus transaksi **Hari Ini** untuk menghitung omzet harian, 5 produk terlaris, stok di bawah batas minimum, modul aktif, dan **maksimal 20 transaksi terbaru**. | Tampilan dashboard baku dengan 4 kartu metrik utama dan kartu modul tambahan hasil AI. | Tata letak navigasi kiri dan struktur grid utama tetap seragam untuk seluruh pengguna dan cepat dimuat. |
| **FR-07** | Inventori ERP | Master Produk (Kuota Maks. 50 SKU) & Toggle Online | Nama produk, SKU, harga beli, harga jual, stok, kolom modul opsional, foto (maks. 500KB), dan toggle `is_online`. | Validasi jumlah produk toko **<= 50 SKU**. Penyimpanan data ke tabel `Products`. Perubahan pada toggle switch langsung memperbarui kolom boolean `is_online`. | Daftar inventori di ERP terbarui; produk dengan `is_online = true` langsung tampil di `/toko/[slug]`. | Jika produk sudah mencapai 50 item, tombol tambah produk menampilkan batas kuota toko kecil. Perubahan toggle `ON/OFF` langsung tercermin di katalog publik. |
| **FR-08** | Kasir / POS | Pencatatan Transaksi Offline Instan | Pilihan produk di keranjang kasir (maks. 15 jenis item), kuantitas, metode bayar (`CASH`/`QRIS`/`KASBON`), shift kasir, nominal bayar. | Pembuatan record `Transactions` (`type = OFFLINE_POS`, `status = COMPLETED`) dan pengurangan `stock_quantity` secara atomik. | Struk digital ringkas di layar, pemotongan stok fisik otomatis, dan penambahan omzet hari ini. | Stok produk langsung berkurang seketika setelah tombol "Selesaikan Pembayaran" ditekan di layar POS. |
| **FR-09** | Katalog Publik | Halaman Profil Katalog Toko (`/toko/[slug]`) | Parameter URL `slug` nama toko, kata kunci pencarian barang di sisi klien (*client-side filter*). | Mengambil informasi profil toko dan daftar produk (`is_online = true`, maks. 50 produk) dalam satu kali muat. Pencarian barang dilakukan langsung di memori browser (*instant search*) agar tidak membebani database. | Halaman katalog toko berdesain seragam dengan banner profil, kolom cari instan, dan daftar produk. | Hanya produk dengan toggle `is_online = ON` yang tampil; pencarian nama barang berjalan instan tanpa *reload* server. |
| **FR-10** | Katalog Publik | WhatsApp Order Dispatcher | Daftar barang pilihan pembeli (maks. 15 item), jumlah beli, nama pembeli, catatan opsional. | Memastikan jumlah pesanan `PENDING_CONFIRMATION` toko < 20, menyimpan draf pesanan ke tabel `Transactions` (`type = WA_ONLINE`, `status = PENDING_CONFIRMATION`), dan menyusun URL `wa.me`. | Redirect ke aplikasi WhatsApp menuju Nomor WA toko dengan draf chat pesanan terformat rapi. | Saat tombol ditekan, `stock_quantity` di database **tidak boleh berkurang** sampai dikonfirmasi manual oleh pemilik toko. |
| **FR-11** | Pesanan WA (ERP) | Validasi & Konfirmasi Manual Pesanan Online | ID Transaksi berstatus `PENDING_CONFIRMATION`, aksi klik "Konfirmasi Pesanan" atau "Batalkan". | Jika dikonfirmasi: ubah status menjadi `COMPLETED`, potong `stock_quantity` produk terkait, dan masukkan nilai ke perhitungan omzet harian. | Status pesanan berubah menjadi Selesai, stok inventori terpotong, dan laporan omzet terbarui. | Jika stok fisik saat akan dikonfirmasi ternyata kurang dari jumlah pesanan, sistem menolak konfirmasi dan menampilkan peringatan validasi stok. |

---

## 5. Non-Functional Requirements & Load Boundaries

1. **Pembatasan Beban Sistem & Kuota Data (Resource & Load Control)**
   * **Batas Kuota Entitas**: Maksimal **1 toko per user**, **50 produk per toko**, **15 item per keranjang transaksi**, dan **20 pesanan WhatsApp menggantung (`PENDING_CONFIRMATION`)** per toko.
   * **Client-Side Filtering untuk Katalog & Inventori**: Karena jumlah produk dibatasi maksimal 50 SKU per toko, fitur pencarian dan filter produk di halaman Inventori, POS Kasir, maupun Katalog Publik `/toko/[slug]` dieksekusi langsung di memori peramban (*client-side filtering*) setelah pemuatan awal, menghilangkan *request* berulang ke database saat pengguna mengetik.
   * **Pembatasan Query Historis**: Query dashboard hanya mengagregasi transaksi pada tanggal hari ini (`CURRENT_DATE`) dan membatasi daftar tabel aktivitas maksimal **20 baris terbaru** (`LIMIT 20`).

2. **Keamanan Data & Isolasi Multi-Tenant (Security)**
   * Setiap query pada modul ERP wajib memverifikasi `store_id` yang terikat pada sesi pengguna yang sedang login (Middleware Authorization) agar pemilik toko A tidak dapat mengakses atau memodifikasi stok maupun transaksi toko B.
   * Seluruh kredensial API kecerdasan buatan disimpan pada variabel lingkungan sisi server (*server-side environment variables*) dan tidak pernah diekspos ke peramban klien.

3. **Performa & Latensi Inferensi AI (Performance)**
   * Waktu respons (*latency*) pemanggilan API AI untuk menghasilkan pertanyaan Langkah 3–5 dibatasi maksimal **< 3,5 detik** dengan memanfaatkan model berkecepatan tinggi (`gemini-2.5-flash`) dalam 1 *batch request* dan penegakan *Structured JSON Output*.
   * Waktu muat awal (*First Contentful Paint*) halaman katalog publik `/toko/[slug]` maksimal **< 1,5 detik** pada jaringan seluler 4G karena ukuran gambar dibatasi (<= 500 KB) dan jumlah produk <= 50 item.

4. **Mekanisme Fallback AI (Reliability)**
   * Apabila layanan API AI eksternal mengalami gangguan jaringan, kuota habis, atau *timeout* (> 3,5 detik), sistem wajib memiliki *Fallback Question & Provisioning Template* berbasis aturan kategori usaha (*rule-based*) sehingga pengguna tetap dapat menyelesaikan proses onboarding 5 langkah tanpa gagal sistem (*zero blocker*).

5. **Integritas & Konsistensi Transaksi (Data Integrity)**
   * Pemotongan stok pada POS Kasir Offline maupun pada Konfirmasi Manual Pesanan WhatsApp wajib dibungkus dalam *Database Transaction* (`prisma.$transaction`) guna mencegah kondisi *race condition* atau stok bernilai negatif.

6. **Responsivitas Antarmuka (Responsiveness)**
   * Halaman publik (Landing Page dan Katalog Online `/toko/[slug]`) dirancang dengan pendekatan *Mobile-First* karena mayoritas pembeli mengakses katalog dan WhatsApp dari ponsel pintar.
   * Halaman ERP Dashboard dan Kasir/POS dioptimalkan untuk layar desktop, laptop, dan tablet dengan tata letak responsif satu halaman yang ringan.

---

## 6. UI/UX Specifications (Backoffice ERP & Clean Landing — Referensi OpenPOS)

Spesifikasi lengkap desain antarmuka merujuk pada berkas [`DESIGN.md`](../DESIGN.md) dan mengadopsi tata letak bersih dari [OpenPOS](https://github.com/0xMinomus/OpenPOS):

1. **Tipografi (`Poppins` — Maksimal `font-normal` / `400`)**:
   * Seluruh antarmuka menggunakan font **`Poppins`** (`font-weight: 400` / `font-normal`) dan `tabular-nums` untuk angka/nominal.
   * **DILARANG** menggunakan `font-bold`, `font-extrabold`, maupun `font-semibold`. Hierarki visual dibangun melalui ukuran huruf, kontras warna teks (`#111827` vs `#5f6f82`), dan jarak elemen.
2. **Landing Page (`/`) — Tanpa Badge & Tombol Capsule**:
   * **TIDAK ADA badge kapsul** atau dekorasi apa pun di atas judul Hero (cukup Judul `h1` `font-normal`, Deskripsi `p`, dan tombol aksi).
   * Tombol CTA pada Landing Page menggunakan bentuk **capsule (`rounded-full`)**.
3. **Sistem ERP / Backoffice (`/dashboard/*`) — Kotak Lengkungan Tipis (`5px–6px`) & Index Table**:
   * Seluruh komponen di dalam Dashboard & ERP (tombol, input pencarian, dropdown filter, kartu ringkasan, modal, dan tabel) berbentuk **kotak dengan lengkungan tipis (`border-radius: 5px` s.d. `6px`)** dan **bukan capsule**.
   * Struktur halaman ERP menggunakan pola standar backoffice (`Topbar 54px #1976d2` + `Sidebar 240px #1f2d3a` + `PageHeader` + `Bar Pencarian & Filter` + `Index Table` + `Pager`), tanpa elemen dekoratif yang membuat tampilan ramai.
4. **Integrasi 5 Modul Adaptif AI ke dalam Backoffice ERP**:
   * **Pelacak Kedaluwarsa (`enable_expiry_tracking`)**: Mengaktifkan kolom & input `Tanggal Kedaluwarsa` serta filter `Hampir Kedaluwarsa (<= 14 Hari)` pada Index Table Inventori & ringkasan Dashboard.
   * **Label Varian (`enable_variant_management`)**: Mengaktifkan kolom & filter `Varian (Ukuran/Warna)` pada Index Table Inventori.
   * **Harga Grosir 1-Lapis (`enable_wholesale_pricing`)**: Mengaktifkan kolom `Harga Grosir (Min. Beli)` pada Inventori dan pemotongan harga grosir otomatis di keranjang POS Kasir.
   * **Log Shift Kasir (`enable_shift_cashier_log`)**: Mengaktifkan pilihan `Shift Pagi / Shift Sore` di POS Kasir serta filter shift pada Index Table Transaksi.
   * **Catatan Kasbon (`enable_customer_debt_book`)**: Mengaktifkan metode bayar `Kasbon` di POS Kasir serta filter `Kasbon Belum Lunas` dengan tombol aksi `Tandai Lunas` pada Index Table Transaksi.

