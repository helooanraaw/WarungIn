# Panduan Deploy Warungin ke Vercel (Gratis & Siap Produksi)

Aplikasi **Warungin** sudah disesuaikan agar dapat berjalan otomatis di **Vercel** (Serverless Next.js + PostgreSQL) maupun di **komputer lokal** (SQLite).

---

## Mengapa di Vercel Harus Memakai PostgreSQL (Tidak Bisa SQLite)?
Serverless Function di Vercel bersifat *read-only* dan sementara (*stateless*), sehingga file database lokal seperti `prisma/dev.db` tidak dapat menyimpan transaksi baru di Vercel.
Proyek ini sudah dilengkapi skrip otomatis [`scripts/sync-prisma-provider.mjs`](../scripts/sync-prisma-provider.mjs) yang mendeteksi isi `DATABASE_URL`:
- Jika `DATABASE_URL` diawali `file:`, Prisma otomatis memakai **`sqlite`** (untuk lokal).
- Jika `DATABASE_URL` diawali `postgresql://` atau `postgres://`, Prisma otomatis beralih ke **`postgresql`** saat proses build di Vercel, lalu langsung menjalankan `prisma db push` untuk membuat seluruh tabel secara otomatis.

---

## Langkah 1: Siapkan Database PostgreSQL Gratis (Pilih Salah Satu)
1. **Neon (Direkomendasikan — Gratis & Cepat)**:
   - Buka `https://neon.tech`, daftar/masuk, lalu buat Project baru (misal: `warungin-db`).
   - Salin **Connection String** (pilih yang berakhiran `?sslmode=require`), contohnya:
     `postgresql://neondb_owner:xxxx@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
2. **Atau Supabase / Prisma Postgres**:
   - Buat project baru dan salin `URI Connection String` PostgreSQL-nya.

---

## Langkah 2: Push Perubahan Terbaru ke GitHub
Pastikan perubahan terbaru sudah di-commit dan di-push ke repositori GitHub Anda:
```bash
git add .
git commit -m "chore: configure Warungin for Vercel deployment"
git push origin main
```
*(File `.env` dan `prisma/dev.db` tidak ikut terunggah karena sudah dilindungi oleh `.gitignore`).*

---

## Langkah 3: Import & Deploy di Dashboard Vercel
1. Buka `https://vercel.com` lalu klik **Add New -> Project**.
2. Pilih repositori GitHub **WarungIn**.
3. Sebelum menekan tombol **Deploy**, buka bagian **Environment Variables** dan tambahkan **3 variabel berikut**:

   | Name | Value |
   | :--- | :--- |
   | `DATABASE_URL` | Tempel *Connection String* PostgreSQL dari Neon / Supabase |
   | `SESSION_SECRET` | Isi teks acak panjang yang aman (misal: `warungin-prod-2026-kunci-rahasia-9918`) |
   | `GEMINI_API_KEY` | Tempel API Key Google Gemini Anda |

4. Klik **Deploy**.
5. Saat proses build berjalan, `vercel.json` akan otomatis menjalankan `npm run vercel-build` (`sync-prisma-provider` -> `prisma generate` -> `prisma db push` -> `next build`) sehingga seluruh tabel database langsung terbuat di PostgreSQL dan aplikasi langsung siap dipakai!
