"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/erp/AppShell";
import { RETAIL_CATEGORIES } from "@/lib/quotas";
import { Check, ExternalLink } from "lucide-react";

export default function StoreSettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<string>(RETAIL_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [isOnlineEnabled, setIsOnlineEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [onboardingAttempts, setOnboardingAttempts] = useState(1);

  const [enableExpiryTracking, setEnableExpiryTracking] = useState(false);
  const [enableVariantMatrix, setEnableVariantMatrix] = useState(false);
  const [enableWholesaleTier, setEnableWholesaleTier] = useState(false);
  const [enableShiftLog, setEnableShiftLog] = useState(false);
  const [enableDebtBook, setEnableDebtBook] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState("10");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.store) {
          setStoreName(data.store.store_name);
          setSlug(data.store.slug);
          setCategory(data.store.category);
          setDescription(data.store.description || "");
          setIsOnlineEnabled(data.store.is_online_enabled);
          setWhatsappNumber(data.store.whatsapp_number || "");
          setAccountHolderName(data.store.account_holder_name || "");
          setOnboardingAttempts(data.store.onboarding_attempts || 1);
        }
        if (data.config) {
          setEnableExpiryTracking(data.config.enable_expiry_tracking);
          setEnableVariantMatrix(data.config.enable_variant_matrix);
          setEnableWholesaleTier(data.config.enable_wholesale_tier);
          setEnableShiftLog(data.config.enable_shift_log);
          setEnableDebtBook(data.config.enable_debt_book);
          setLowStockThreshold(String(data.config.low_stock_threshold ?? 10));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavedNotice(false);
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: storeName,
          category,
          description,
          is_online_enabled: isOnlineEnabled,
          whatsapp_number: whatsappNumber,
          account_holder_name: accountHolderName,
          enable_expiry_tracking: enableExpiryTracking,
          enable_variant_matrix: enableVariantMatrix,
          enable_wholesale_tier: enableWholesaleTier,
          enable_shift_log: enableShiftLog,
          enable_debt_book: enableDebtBook,
          low_stock_threshold: Number(lowStockThreshold || 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan pengaturan.");
      } else {
        setSavedNotice(true);
      }
    } catch {
      setError("Terjadi gangguan koneksi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="op-card p-6 text-xs text-[#5f6f82]">
        Memuat pengaturan toko...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Pengaturan Toko"
        subtitle="Ubah profil toko, nomor WhatsApp bisnis, dan aktifkan modul tambahan sesuai kebutuhan."
        breadcrumb="Pengaturan Toko"
        actions={
          slug && isOnlineEnabled ? (
            <Link
              href={`/toko/${slug}`}
              target="_blank"
              className="op-btn"
            >
              <span>Buka Katalog (/toko/{slug})</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      />

      {savedNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-[5px] border border-[#b7e4de] bg-[#eefaf8] px-4 py-2.5 text-xs text-[#167a6f]">
          <Check className="h-4 w-4" />
          <span>Pengaturan toko dan modul berhasil diperbarui.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-4 py-2.5 text-xs text-[#c0392b]">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* PROFIL TOKO & WHATSAPP (6 KOLOM) */}
        <div className="op-card space-y-4 p-5 lg:col-span-6">
          <div className="border-b border-[#d8e1ea] pb-2.5">
            <h2 className="text-sm text-[#22303c]">Profil Usaha & Katalog Online</h2>
            <p className="text-xs text-[#5f6f82]">
              Informasi ini tampil pada halaman katalog online toko Anda
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#22303c]">
              Nama Toko
            </label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="op-input"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#22303c]">
              Jenis Usaha
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="op-select"
            >
              {RETAIL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#22303c]">
              Deskripsi Singkat Toko
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="op-textarea"
            />
          </div>

          <div className="flex items-center justify-between rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
            <div>
              <div className="text-xs text-[#22303c]">
                Aktifkan Halaman Katalog Online (/toko/{slug})
              </div>
              <div className="text-[11px] text-[#5f6f82]">
                Memungkinkan pelanggan memesan barang ke WhatsApp toko
              </div>
            </div>
            <input
              type="checkbox"
              checked={isOnlineEnabled}
              onChange={(e) => setIsOnlineEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#1976d2]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#22303c]">
                Nomor WhatsApp Toko
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="62812xxxx"
                className="op-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#22303c]">
                Nama Penanggung Jawab
              </label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Nama Pemilik / Admin"
                className="op-input"
              />
            </div>
          </div>
        </div>

        {/* MODUL OPERASIONAL ADAPTIF (6 KOLOM) */}
        <div className="op-card flex flex-col justify-between p-5 lg:col-span-6">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#d8e1ea] pb-2.5">
              <div>
                <h2 className="text-sm text-[#22303c]">
                  Modul Operasional Toko
                </h2>
                <p className="text-xs text-[#5f6f82]">
                  Aktifkan atau matikan kolom fitur sesuai kebutuhan harian
                </p>
              </div>
              {onboardingAttempts < 2 && (
                <Link href="/onboarding" className="op-btn op-btn-sm">
                  Wawancara Ulang AI
                </Link>
              )}
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-[5px] border border-[#d8e1ea] p-3 hover:bg-[#f8fafc]">
              <div>
                <div className="text-xs text-[#22303c]">
                  Pelacakan Tanggal Kedaluwarsa
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Tampilkan kolom expired date pada tabel produk & stok
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableExpiryTracking}
                onChange={(e) => setEnableExpiryTracking(e.target.checked)}
                className="h-4 w-4 accent-[#1976d2]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-[5px] border border-[#d8e1ea] p-3 hover:bg-[#f8fafc]">
              <div>
                <div className="text-xs text-[#22303c]">
                  Varian Ukuran & Warna
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Tampilkan kolom ukuran/warna untuk produk pakaian atau butik
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableVariantMatrix}
                onChange={(e) => setEnableVariantMatrix(e.target.checked)}
                className="h-4 w-4 accent-[#1976d2]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-[5px] border border-[#d8e1ea] p-3 hover:bg-[#f8fafc]">
              <div>
                <div className="text-xs text-[#22303c]">
                  Harga Grosir Bertingkat
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Otomatis gunakan harga grosir saat jumlah beli mencapai batas
                  minimum
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableWholesaleTier}
                onChange={(e) => setEnableWholesaleTier(e.target.checked)}
                className="h-4 w-4 accent-[#1976d2]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-[5px] border border-[#d8e1ea] p-3 hover:bg-[#f8fafc]">
              <div>
                <div className="text-xs text-[#22303c]">
                  Pencatatan Shift Kasir
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Pilih shift Pagi / Sore / Malam saat memproses transaksi kasir
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableShiftLog}
                onChange={(e) => setEnableShiftLog(e.target.checked)}
                className="h-4 w-4 accent-[#1976d2]"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-[5px] border border-[#d8e1ea] p-3 hover:bg-[#f8fafc]">
              <div>
                <div className="text-xs text-[#22303c]">
                  Buku Kasbon Pelanggan
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Izinkan metode pembayaran Kasbon dan pantau status pelunasan
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableDebtBook}
                onChange={(e) => setEnableDebtBook(e.target.checked)}
                className="h-4 w-4 accent-[#1976d2]"
              />
            </label>

            <div>
              <label className="mb-1 block text-xs text-[#22303c]">
                Batas Pengingat Stok Menipis (Unit)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="op-input tabular-nums"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-[#d8e1ea] pt-4">
            <button
              type="submit"
              disabled={saving}
              className="op-btn op-btn-primary"
            >
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
