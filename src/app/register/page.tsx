"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mendaftarkan akun.");
      } else {
        router.push("/onboarding");
      }
    } catch {
      setError("Terjadi gangguan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] px-4 py-10 text-[#22303c]">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-[#5f6f82] hover:text-[#22303c]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>

        <div className="op-card p-6">
          <h1 className="text-xl text-[#22303c]">Daftar Akun Toko Baru</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5f6f82]">
            Buat akun pemilik toko terlebih dahulu, lalu lanjutkan ke pengaturan
            profil dan modul usaha dalam 5 langkah singkat.
          </p>

          {error && (
            <div className="mt-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-[#22303c]">
                Alamat Email Pemilik Toko
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pemilik@warunganda.id"
                className="op-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-[#22303c]">
                Kata Sandi Baru
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 4 karakter"
                className="op-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="op-btn op-btn-primary w-full"
            >
              {loading ? "Menyiapkan Akun..." : "Lanjut ke Pengaturan Toko"}
            </button>
          </form>

          <div className="mt-5 border-t border-[#d8e1ea] pt-4 text-xs text-[#5f6f82]">
            Sudah punya akun atau ingin mencoba akun demo?{" "}
            <Link href="/login" className="text-[#1976d2] hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
