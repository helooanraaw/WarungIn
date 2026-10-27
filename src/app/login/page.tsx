"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";

const DEMO_STORES = [
  {
    name: "Toko Sembako Berkah Jaya",
    email: "berkah@demo.warungin.id",
    desc: "Contoh warung sembako dengan fitur tanggal kedaluwarsa, harga grosir, dan buku kasbon.",
  },
  {
    name: "Butik Nusantara Wear",
    email: "nusantara@demo.warungin.id",
    desc: "Contoh toko pakaian dengan fitur ukuran/warna baju dan pembagian shift kasir.",
  },
  {
    name: "Toko Bahan Kue Manis",
    email: "kuemanis@demo.warungin.id",
    desc: "Contoh toko bahan kue dengan fitur tanggal kedaluwarsa, harga grosir, dan shift kasir.",
  },
];

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

  async function handleDemoLogin(demoEmail: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: "demo123" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuka akun contoh.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] px-4 py-10 text-[#22303c]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-[#5f6f82] hover:text-[#22303c]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
          <span className="text-xs text-[#5f6f82]">Warungin Backoffice</span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* FORM MASUK */}
          <div className="op-card p-6 md:col-span-6">
            <h1 className="text-xl text-[#22303c]">Masuk ke Akun Toko</h1>
            <p className="mt-1.5 text-xs leading-relaxed text-[#5f6f82]">
              Masukkan email dan kata sandi Anda, atau pilih salah satu akun
              contoh di samping untuk langsung melihat cara kerja sistem.
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
                Daftar Toko Baru
              </Link>
            </div>
          </div>

          {/* 3 AKUN CONTOH INSTAN */}
          <div className="op-card p-6 md:col-span-6">
            <div className="flex items-center gap-2 text-sm text-[#22303c]">
              <Store className="h-4 w-4 text-[#1976d2]" />
              <span>Coba Instan dengan Akun Contoh</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[#5f6f82]">
              Klik salah satu toko di bawah ini untuk masuk tanpa mengetik kata
              sandi. Setiap toko menampilkan modul ERP yang berbeda sesuai jenis
              usahanya.
            </p>

            <div className="mt-4 space-y-3">
              {DEMO_STORES.map((demo) => (
                <div
                  key={demo.email}
                  className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-[#22303c]">{demo.name}</span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleDemoLogin(demo.email)}
                      className="op-btn op-btn-primary op-btn-sm"
                    >
                      Masuk Instan
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5f6f82]">
                    {demo.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
