"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/erp/AppShell";
import {
  CUSTOM_CATEGORY_VALUE,
  MICRO_RET_QUOTAS,
  RETAIL_CATEGORY_SUGGESTIONS,
} from "@/lib/quotas";
import { compressImageFile } from "@/lib/image-upload";
import { Check, ExternalLink, Upload, X } from "lucide-react";

export default function StoreSettingsPage() {
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    RETAIL_CATEGORY_SUGGESTIONS[0]
  );
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [isOnlineEnabled, setIsOnlineEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [onboardingAttempts, setOnboardingAttempts] = useState(1);

  const [templateLabel, setTemplateLabel] = useState("");
  const [dashboardFocus, setDashboardFocus] = useState("UMUM");
  const [itemTerm, setItemTerm] = useState("Barang");
  const [customAttributeLabel, setCustomAttributeLabel] =
    useState("Ukuran / Pilihan");
  const [defaultUnit, setDefaultUnit] = useState("pcs");
  const [enableExpiryTracking, setEnableExpiryTracking] = useState(false);
  const [enableVariantMatrix, setEnableVariantMatrix] = useState(false);
  const [enableWholesaleTier, setEnableWholesaleTier] = useState(false);
  const [enableManualDiscount, setEnableManualDiscount] = useState(false);
  const [enableShiftLog, setEnableShiftLog] = useState(false);
  const [enableDebtBook, setEnableDebtBook] = useState(false);
  const [enableDeliveryNote, setEnableDeliveryNote] = useState(true);
  const [enableFinanceReport, setEnableFinanceReport] = useState(true);
  const [enableExpenseTracker, setEnableExpenseTracker] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [receiptFooter, setReceiptFooter] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.store) {
          const s = data.store;
          setStoreName(s.store_name);
          setSlug(s.slug);
          const matched = (
            RETAIL_CATEGORY_SUGGESTIONS as readonly string[]
          ).includes(s.category);
          if (matched) {
            setSelectedCategory(s.category);
          } else {
            setSelectedCategory(CUSTOM_CATEGORY_VALUE);
            setCustomCategory(s.category);
          }
          setDescription(s.description || "");
          setAddress(s.address || "");
          setLogoUrl(s.logo_url || null);
          setBannerUrl(s.banner_url || null);
          setIsOnlineEnabled(s.is_online_enabled);
          setWhatsappNumber(s.whatsapp_number || "");
          setAccountHolderName(s.account_holder_name || "");
          setOnboardingAttempts(s.onboarding_attempts || 1);
        }
        if (data.config) {
          const c = data.config;
          setTemplateLabel(c.template_label || "");
          setDashboardFocus(c.dashboard_focus || "UMUM");
          setItemTerm(c.item_term || "Barang");
          setCustomAttributeLabel(
            c.custom_attribute_label || "Ukuran / Pilihan"
          );
          setDefaultUnit(c.default_unit || "pcs");
          setEnableExpiryTracking(Boolean(c.enable_expiry_tracking));
          setEnableVariantMatrix(Boolean(c.enable_variant_matrix));
          setEnableWholesaleTier(Boolean(c.enable_wholesale_tier));
          setEnableManualDiscount(Boolean(c.enable_manual_discount));
          setEnableShiftLog(Boolean(c.enable_shift_log));
          setEnableDebtBook(Boolean(c.enable_debt_book));
          setEnableDeliveryNote(
            c.enable_delivery_note !== undefined
              ? Boolean(c.enable_delivery_note)
              : true
          );
          setEnableFinanceReport(
            c.enable_finance_report !== undefined
              ? Boolean(c.enable_finance_report)
              : true
          );
          setEnableExpenseTracker(Boolean(c.enable_expense_tracker));
          setLowStockThreshold(String(c.low_stock_threshold ?? 10));
          setReceiptFooter(c.receipt_footer || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.82,
      });
      setLogoUrl(compressed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat logo toko.");
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 400,
        quality: 0.8,
      });
      setBannerUrl(compressed);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat banner toko."
      );
    }
  }

  const finalCategory =
    selectedCategory === CUSTOM_CATEGORY_VALUE
      ? customCategory.trim()
      : selectedCategory;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!finalCategory) {
      setError("Jenis usaha wajib diisi.");
      return;
    }
    setError("");
    setSavedNotice(false);
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: storeName,
          category: finalCategory,
          description,
          address,
          logo_url: logoUrl,
          banner_url: bannerUrl,
          is_online_enabled: isOnlineEnabled,
          whatsapp_number: whatsappNumber,
          account_holder_name: accountHolderName,
          custom_attribute_label: customAttributeLabel,
          dashboard_focus: dashboardFocus,
          item_term: itemTerm.trim() || "Barang",
          default_unit: defaultUnit,
          enable_expiry_tracking: enableExpiryTracking,
          enable_variant_matrix: enableVariantMatrix,
          enable_wholesale_tier: enableWholesaleTier,
          enable_manual_discount: enableManualDiscount,
          enable_shift_log: enableShiftLog,
          enable_debt_book: enableDebtBook,
          enable_delivery_note: enableDeliveryNote,
          enable_finance_report: enableFinanceReport,
          enable_expense_tracker: enableExpenseTracker,
          low_stock_threshold: Number(lowStockThreshold || 10),
          receipt_footer: receiptFooter,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan pengaturan.");
      } else {
        setSavedNotice(true);
        window.dispatchEvent(new Event("warungin:store-updated"));
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
        subtitle="Atur logo profil, banner toko online, nomor WhatsApp, dan fitur yang dipakai di toko Anda."
        breadcrumb="Pengaturan Toko"
        actions={
          slug && isOnlineEnabled ? (
            <Link
              href={`/toko/${slug}`}
              target="_blank"
              className="op-btn w-full sm:w-auto"
            >
              <span className="sm:hidden">Buka Toko Online</span>
              <span className="hidden sm:inline">
                Lihat Toko Online (/toko/{slug})
              </span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      />

      {savedNotice && (
        <div className="mb-4 flex items-center gap-2 rounded-[5px] border border-[#b7e4de] bg-[#eefaf8] px-4 py-2.5 text-xs text-[#167a6f]">
          <Check className="h-4 w-4" />
          <span>Perubahan profil, tampilan toko, dan fitur berhasil disimpan.</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-4 py-2.5 text-xs text-[#c0392b]">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 gap-5 lg:grid-cols-12"
      >
        {/* KIRI: VISUAL TOKO (LOGO & BANNER) + PROFIL USAHA */}
        <div className="op-card space-y-4 p-5 lg:col-span-6">
          <div className="border-b border-[#d8e1ea] pb-2.5">
            <h2 className="text-sm text-[#22303c]">
              Logo, Banner, & Profil Toko Online
            </h2>
            <p className="text-xs text-[#5f6f82]">
              Ditampilkan pada halaman toko online pembeli dan di bagian atas
              struk belanja
            </p>
          </div>

          {/* LOGO PROFIL TOKO */}
          <div className="flex items-center gap-4 rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
            {logoUrl ? (
              <div className="relative h-16 w-16 shrink-0">
                <img
                  src={logoUrl}
                  alt="Logo Toko"
                  className="h-16 w-16 rounded-[6px] border border-[#d8e1ea] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#e74c3c] text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[6px] border border-dashed border-[#d8e1ea] bg-white text-xs text-[#5f6f82]">
                Logo
              </div>
            )}
            <div className="flex-1">
              <div className="text-xs text-[#22303c]">
                Foto Profil / Logo Toko
              </div>
              <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                Gunakan logo toko atau foto depan toko Anda
              </div>
              <label className="op-btn op-btn-sm mt-2 inline-flex cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>Ganti Logo Toko</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* BANNER SAMPUL TOKO */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs text-[#22303c]">
                Banner Sampul Halaman Toko Online
              </label>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl(null)}
                  className="text-[11px] text-[#c0392b] hover:underline"
                >
                  Hapus Banner
                </button>
              )}
            </div>
            {bannerUrl ? (
              <div className="space-y-2">
                <img
                  src={bannerUrl}
                  alt="Banner Toko"
                  className="h-32 w-full rounded-[5px] border border-[#d8e1ea] object-cover"
                />
                <label className="op-btn op-btn-sm inline-flex cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Ganti Gambar Banner</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[5px] border border-dashed border-[#d8e1ea] bg-[#f8fafc] text-xs text-[#5f6f82] hover:border-[#1976d2]">
                <Upload className="h-4 w-4 text-[#1976d2]" />
                <span>Klik untuk mengunggah banner sampul toko</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </label>
            )}
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="op-select"
            >
              {RETAIL_CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={CUSTOM_CATEGORY_VALUE}>
                Lainnya (Tulis sendiri...)
              </option>
            </select>
            {selectedCategory === CUSTOM_CATEGORY_VALUE && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Tulis jenis usaha Anda..."
                className="op-input mt-2"
              />
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#22303c]">
              Keterangan Singkat Barang Jualan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="op-textarea"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#22303c]">
              Alamat Singkat Toko
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Merdeka No. 14"
              className="op-input"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3.5 sm:p-3">
            <div className="min-w-0">
              <div className="text-xs text-[#22303c]">
                Buka Halaman Toko Online (/toko/{slug})
              </div>
              <div className="text-[11px] text-[#5f6f82]">
                Pembeli bisa melihat foto barang dan memesan lewat WhatsApp
              </div>
            </div>
            <input
              type="checkbox"
              checked={isOnlineEnabled}
              onChange={(e) => setIsOnlineEnabled(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-[#22303c]">
                Nomor WhatsApp Toko
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="0812xxxx"
                className="op-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#22303c]">
                Nama Penerima Pesanan
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

          <div>
            <label className="mb-1 block text-xs text-[#22303c]">
              Kalimat Penutup di Bawah Struk Belanja
            </label>
            <textarea
              rows={2}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Contoh: Terima kasih sudah berbelanja di toko kami."
              className="op-textarea"
            />
          </div>
        </div>

        {/* KANAN: FITUR TOKO YANG DIPAKAI */}
        <div className="op-card flex flex-col justify-between p-5 lg:col-span-6">
          <div className="space-y-3">
            <div className="flex flex-col justify-between gap-2.5 border-b border-[#d8e1ea] pb-2.5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-sm text-[#22303c]">
                  Fitur Kasir & Catatan Stok Toko
                </h2>
                <p className="text-xs text-[#5f6f82]">
                  {templateLabel ||
                    "Nyalakan fitur yang Anda butuhkan saja agar layar tetap rapi"}
                </p>
              </div>
              {onboardingAttempts < MICRO_RET_QUOTAS.MAX_ONBOARDING_ATTEMPTS && (
                <Link
                  href="/onboarding"
                  className="op-btn op-btn-sm shrink-0 self-start sm:self-auto"
                >
                  Atur Ulang Tanya Jawab
                </Link>
              )}
            </div>

            {/* FOKUS TAMPILAN UTAMA & SEBUTAN DAGANGAN */}
            <div className="grid grid-cols-1 gap-3 rounded-[5px] border border-[#bfdbfe] bg-[#eff6ff] p-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Fokus Tampilan Halaman Utama
                </label>
                <select
                  value={dashboardFocus}
                  onChange={(e) => setDashboardFocus(e.target.value)}
                  className="op-select bg-white"
                >
                  <option value="UMUM">Seimbang (Kasir, Stok &amp; Keuangan)</option>
                  <option value="KASIR_CEPAT">Kasir Cepat &amp; Transaksi Harian</option>
                  <option value="STOK_GROSIR">Stok, Grosir &amp; Belanja Kulakan</option>
                  <option value="KATALOG_ONLINE">Toko Online &amp; Pesanan WhatsApp</option>
                  <option value="KEUANGAN_LABA">Rekap Keuangan, Pengeluaran &amp; Untung</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Sebutan Barang Jualan Anda
                </label>
                <input
                  type="text"
                  value={itemTerm}
                  onChange={(e) => setItemTerm(e.target.value)}
                  placeholder="Barang / Menu / Kue / Pakaian / Obat"
                  className="op-input bg-white"
                />
              </div>
            </div>

            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] p-3.5 hover:bg-[#f8fafc] sm:min-h-0 sm:p-3">
              <div>
                <div className="text-xs text-[#22303c]">
                  Halaman Rekap Keuangan &amp; Simpan PDF
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Tampilkan menu Rekap Keuangan untuk melihat laba rugi dan
                  menyimpan laporan dalam bentuk PDF
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableFinanceReport}
                onChange={(e) => setEnableFinanceReport(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
            </label>

            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] p-3.5 hover:bg-[#f8fafc] sm:min-h-0 sm:p-3">
              <div>
                <div className="text-xs text-[#22303c]">
                  Catat Pengeluaran Usaha &amp; Belanja Kulakan
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Tampilkan form catat pengeluaran (kulakan, listrik, kemasan,
                  ongkir) agar hitungan untung bersih akurat
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableExpenseTracker}
                onChange={(e) => setEnableExpenseTracker(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
            </label>

            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] p-3.5 hover:bg-[#f8fafc] sm:min-h-0 sm:p-3">
              <div>
                <div className="text-xs text-[#22303c]">
                  Halaman Pantau Kedaluwarsa Barang
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Cocok untuk makanan, minuman, kue, obat, kosmetik, atau pakan
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableExpiryTracking}
                onChange={(e) => setEnableExpiryTracking(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
            </label>

            <div className="rounded-[5px] border border-[#d8e1ea] p-3.5 sm:p-3">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#22303c]">
                    Kolom Keterangan Tambahan pada Barang
                  </div>
                  <div className="text-[11px] text-[#5f6f82]">
                    Misalnya untuk mencatat Ukuran/Warna, Masa Garansi, atau
                    Berat Kemasan
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableVariantMatrix}
                  onChange={(e) => setEnableVariantMatrix(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
                />
              </label>

              {enableVariantMatrix && (
                <div className="mt-2.5 border-t border-[#edf2f7] pt-2.5">
                  <label className="mb-1 block text-[11px] text-[#5f6f82]">
                    Nama Kolom yang Ditampilkan:
                  </label>
                  <input
                    type="text"
                    value={customAttributeLabel}
                    onChange={(e) => setCustomAttributeLabel(e.target.value)}
                    placeholder="Contoh: Ukuran & Warna / Masa Garansi / Kemasan"
                    className="op-input py-1.5 text-xs"
                  />
                </div>
              )}
            </div>

            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] p-3.5 hover:bg-[#f8fafc] sm:min-h-0 sm:p-3">
              <div>
                <div className="text-xs text-[#22303c]">
                  Harga Beli Banyak (Grosir)
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Harga otomatis turun saat pembeli membeli mencapai jumlah
                  minimal
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableWholesaleTier}
                onChange={(e) => setEnableWholesaleTier(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
            </label>

            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] p-3.5 hover:bg-[#f8fafc] sm:min-h-0 sm:p-3">
              <div>
                <div className="text-xs text-[#22303c]">
                  Potongan Diskon di Meja Kasir
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Memudahkan kasir memberikan potongan harga langsung saat
                  transaksi
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableManualDiscount}
                onChange={(e) => setEnableManualDiscount(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
            </label>

            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] p-3.5 hover:bg-[#f8fafc] sm:min-h-0 sm:p-3">
              <div>
                <div className="text-xs text-[#22303c]">
                  Jadwal Jaga Kasir (Pagi / Sore / Malam)
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Memisahkan hasil uang masuk setiap pergantian penjaga kasir
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableShiftLog}
                onChange={(e) => setEnableShiftLog(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
            </label>

            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] p-3.5 hover:bg-[#f8fafc] sm:min-h-0 sm:p-3">
              <div>
                <div className="text-xs text-[#22303c]">
                  Catatan Bon / Bayar Belakangan (Kasbon)
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Mencatat pelanggan yang ambil barang dulu dan menandai saat
                  lunas
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableDebtBook}
                onChange={(e) => setEnableDebtBook(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
            </label>

            <label className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-[5px] border border-[#d8e1ea] p-3.5 hover:bg-[#f8fafc] sm:min-h-0 sm:p-3">
              <div>
                <div className="text-xs text-[#22303c]">
                  Pilihan Ambil di Toko / Minta Diantar di Toko Online
                </div>
                <div className="text-[11px] text-[#5f6f82]">
                  Pembeli online bisa memilih ambil sendiri atau mengisi alamat
                  antar
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableDeliveryNote}
                onChange={(e) => setEnableDeliveryNote(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Satuan Barang Bawaan
                </label>
                <input
                  type="text"
                  value={defaultUnit}
                  onChange={(e) => setDefaultUnit(e.target.value)}
                  placeholder="pcs / kg / bungkus"
                  className="op-input"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Batas Ingatkan Stok Tipis
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="op-input tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t border-[#d8e1ea] pt-4">
            <button
              type="submit"
              disabled={saving}
              className="op-btn op-btn-primary w-full sm:w-auto"
            >
              {saving ? "Menyimpan..." : "Simpan Pengaturan Toko"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
