"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk ke akun.");
      } else {
        router.push(data.user.hasStore ? "/dashboard" : "/onboarding");
      }
    } catch {
      setError("Terjadi gangguan jaringan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#f4f7fa] px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] text-[#22303c] sm:py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between sm:mb-6">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 text-xs text-[#5f6f82] hover:text-[#22303c] sm:min-h-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Beranda</span>
          </Link>
          <span className="inline-flex items-center gap-2 text-xs text-[#22303c]">
            <BrandLogo size={20} variant="color" />
            <span>Warungin</span>
          </span>
        </div>

        <div className="op-card p-5 sm:p-6">
          <h1 className="text-xl text-[#22303c]">Masuk ke Toko Anda</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5f6f82]">
            Masukkan email dan kata sandi untuk membuka halaman kasir dan
            pengelolaan stok toko Anda.
          </p>

          {error && (
            <div className="mt-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-[#22303c]">
                Alamat Email
              </label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@tokoanda.com"
                className="op-input"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-[#22303c]">
                Kata Sandi
              </label>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="op-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="op-btn op-btn-primary w-full"
            >
              {loading ? "Memproses..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-5 border-t border-[#d8e1ea] pt-4 text-xs text-[#5f6f82]">
            Belum punya akun toko?{" "}
            <Link href="/register" className="text-[#1976d2] hover:underline">
              Buat toko pertama sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
