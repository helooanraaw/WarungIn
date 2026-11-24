"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CUSTOM_CATEGORY_VALUE,
  RETAIL_CATEGORY_SUGGESTIONS,
} from "@/lib/quotas";
import { compressImageFile } from "@/lib/image-upload";
import type {
  OnboardingQuestion,
  ProvisionedModulesResult,
} from "@/lib/ai-onboarding";
import { Check, Upload, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [storeName, setStoreName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    RETAIL_CATEGORY_SUGGESTIONS[0]
  );
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const [isOnlineEnabled, setIsOnlineEnabled] = useState<boolean>(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [modelUsed, setModelUsed] = useState<string>("");

  // Jawaban fleksibel: pengguna boleh mencentang beberapa pilihan + menulis sendiri
  const [selectedIds, setSelectedIds] = useState<Record<number, string[]>>({
    3: [],
    4: [],
    5: [],
  });
  const [customNotes, setCustomNotes] = useState<Record<number, string>>({
    3: "",
    4: "",
    5: "",
  });

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [provisionResult, setProvisionResult] =
    useState<ProvisionedModulesResult | null>(null);

  const finalCategory =
    selectedCategory === CUSTOM_CATEGORY_VALUE
      ? customCategory.trim()
      : selectedCategory;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) router.push("/login");
        return res.json();
      })
      .then((data) => {
        if (data?.user?.name && !accountHolderName) {
          setAccountHolderName(data.user.name);
        }
        if (data?.user?.store) {
          const s = data.user.store;
          setStoreName(s.store_name);
          const matchedPreset = (
            RETAIL_CATEGORY_SUGGESTIONS as readonly string[]
          ).includes(s.category);
          if (matchedPreset) {
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
          setAccountHolderName(
            s.account_holder_name || data.user.name || ""
          );
        }
      })
      .catch(() => {});
  }, [router]);

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleUploadBanner(e: React.ChangeEvent<HTMLInputElement>) {
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

  function toggleOption(stepNum: number, optId: string) {
    setSelectedIds((prev) => {
      const current = prev[stepNum] || [];
      const next = current.includes(optId)
        ? current.filter((id) => id !== optId)
        : [...current, optId];
      return { ...prev, [stepNum]: next };
    });
  }

  async function goToStep3() {
    setError("");
    if (
      isOnlineEnabled &&
      (!whatsappNumber.trim() || !accountHolderName.trim())
    ) {
      setError(
        "Nomor WhatsApp dan Nama Penerima wajib diisi jika halaman toko online diaktifkan."
      );
      return;
    }

    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/onboarding/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: storeName,
          category: finalCategory,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.questions)) {
        setError(
          data.error ||
            "Gagal menyiapkan pertanyaan dari AI. Silakan klik tombol sekali lagi."
        );
        return;
      }

      setQuestions(data.questions);
      setModelUsed(data.model_used || "gemini");
      setStep(3);
    } catch {
      setError("Gagal menghubungi server AI. Silakan coba lagi.");
    } finally {
      setLoadingQuestions(false);
    }
  }

  function validateStepAnswer(stepNum: number): boolean {
    const pickedCount = (selectedIds[stepNum] || []).length;
    const hasCustom = Boolean((customNotes[stepNum] || "").trim());
    if (pickedCount === 0 && !hasCustom) {
      setError(
        "Silakan centang minimal satu pilihan di atas, atau tulis sendiri kondisi toko Anda pada kotak di bawah."
      );
      return false;
    }
    setError("");
    return true;
  }

  async function handleFinish() {
    if (!validateStepAnswer(5)) return;

    setSubmitting(true);
    try {
      const buildPayloadStep = (stepNum: number) => {
        const q = questions.find((item) => item.step === stepNum);
        const ids = selectedIds[stepNum] || [];
        const labels = q
          ? q.options.filter((o) => ids.includes(o.id)).map((o) => o.label)
          : [];
        return {
          question: q?.question || "",
          selectedLabels: labels,
          customNote: (customNotes[stepNum] || "").trim(),
        };
      };

      const res = await fetch("/api/onboarding/provision", {
        method: "POST",
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
          step3: buildPayloadStep(3),
          step4: buildPayloadStep(4),
          step5: buildPayloadStep(5),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan pengaturan toko.");
      } else {
        setProvisionResult(data.provisioned);
        setStep(6);
      }
    } catch {
      setError("Gagal menghubungi server saat menyiapkan halaman toko.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentQuestion = questions.find((q) => q.step === step);

  return (
    <div className="min-h-[100dvh] bg-[#f4f7fa] px-4 py-5 pb-28 text-[#22303c] sm:py-10 sm:pb-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between gap-2 text-xs text-[#5f6f82]">
          <span className="inline-flex min-w-0 items-center gap-2 text-[#22303c]">
            <BrandLogo size={20} variant="color" />
            <span className="truncate">Warungin - Pengaturan Awal</span>
          </span>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[40px] shrink-0 items-center hover:text-[#22303c] sm:min-h-0"
          >
            Ke Dashboard
          </Link>
        </div>

        <div className="op-card p-5 sm:p-7">
          {step <= 5 && (
            <div className="sticky top-0 z-20 -mx-5 -mt-5 mb-4 border-b border-[#edf2f7] bg-white/95 px-5 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:mt-0 sm:mb-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
              <div className="flex items-center justify-between text-xs text-[#5f6f82]">
                <span>Langkah {step} dari 5</span>
                <span>{step * 20}% selesai</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[4px] bg-[#edf2f7]">
                <div
                  className="h-full bg-[#1976d2] transition-all duration-200"
                  style={{ width: `${step * 20}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]">
              {error}
            </div>
          )}

          {/* LANGKAH 1: IDENTITAS TOKO, LOGO PROFIL, & BEBAS PILIH/KETIK USAHA */}
          {step === 1 && (
            <div className="mt-5 space-y-4">
              <div>
                <h1 className="text-xl text-[#22303c]">
                  Kenalkan Toko & Barang Jualan Anda
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-[#5f6f82]">
                  Apa pun yang Anda jual, tulis saja dengan bahasa sehari-hari.
                  Sistem akan menyiapkan tampilan kasir dan catatan stok yang
                  paling pas untuk usaha Anda.
                </p>
              </div>

              {/* LOGO FOTO PROFIL TOKO (OPSIONAL) */}
              <div className="flex items-center gap-4 rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
                {logoUrl ? (
                  <div className="relative h-14 w-14 shrink-0">
                    <img
                      src={logoUrl}
                      alt="Logo Toko"
                      className="h-14 w-14 rounded-[6px] border border-[#d8e1ea] object-cover"
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
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[6px] border border-dashed border-[#d8e1ea] bg-white text-xs text-[#5f6f82]">
                    Logo
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-xs text-[#22303c]">
                    Foto Profil / Logo Toko (Opsional)
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                    Akan tampil di halaman toko online dan di bagian atas struk.
                  </div>
                  <label className="op-btn op-btn-sm mt-2 inline-flex cursor-pointer">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Pilih Foto Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Nama Toko / Usaha Anda
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: Toko Berkah / Konter Maju / Petshop Ceria"
                  className="op-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Jenis Usaha (Pilih atau Tulis Sendiri)
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="op-select"
                >
                  {RETAIL_CATEGORY_SUGGESTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value={CUSTOM_CATEGORY_VALUE}>
                    Lainnya (Tulis sendiri jenis usaha saya...)
                  </option>
                </select>

                {selectedCategory === CUSTOM_CATEGORY_VALUE && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ketik jenis usaha Anda, misal: Toko Pancing, Laundry, Bengkel Motor, Toko Bunga..."
                    className="op-input mt-2"
                  />
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Barang apa saja yang Anda jual sehari-hari, dan bagian apa
                  yang paling ingin dibantu?
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Jual aksesoris HP seperti charger dan casing berbagai tipe HP, ada garansi toko 1 minggu, dan pembeli kadang minta diskon kalau beli banyak."
                  className="op-textarea"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#22303c]">
                  Alamat Singkat Toko (Opsional, untuk info pembeli & struk)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Merdeka No. 14, Dekat Pasar Baru"
                  className="op-input"
                />
              </div>

              <div className="fixed inset-x-0 bottom-0 z-20 flex justify-end border-t border-[#d8e1ea] bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!storeName.trim()) {
                      setError("Nama toko wajib diisi.");
                      return;
                    }
                    if (!finalCategory) {
                      setError("Silakan tulis jenis usaha Anda terlebih dahulu.");
                      return;
                    }
                    if (!description.trim() || description.trim().length < 8) {
                      setError(
                        "Ceritakan sedikit barang apa yang Anda jual (minimal 1 kalimat singkat) agar pertanyaan berikutnya pas dengan usaha Anda."
                      );
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                  className="op-btn op-btn-primary w-full sm:w-auto"
                >
                  Lanjut ke Langkah 2
                </button>
              </div>
            </div>
          )}

          {/* LANGKAH 2: TOKO ONLINE E-COMMERCE, WHATSAPP & BANNER TOKO */}
          {step === 2 && (
            <div className="mt-5 space-y-4">
              <div>
                <h1 className="text-xl text-[#22303c]">
                  Buka Halaman Toko Online & Pesanan WhatsApp?
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-[#5f6f82]">
                  Jika dinyalakan, pembeli bisa melihat foto barang dagangan
                  Anda seperti di aplikasi belanja online, lalu mengirim
                  pesanannya langsung ke WhatsApp Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsOnlineEnabled(true)}
                  className={`rounded-[5px] border p-3.5 text-left text-xs transition-colors ${
                    isOnlineEnabled
                      ? "border-[#1976d2] bg-[#eff6ff] text-[#22303c]"
                      : "border-[#d8e1ea] bg-white text-[#5f6f82]"
                  }`}
                >
                  <div className="text-sm text-[#22303c]">
                    Ya, Buatkan Toko Online
                  </div>
                  <div className="mt-1 text-[11px] text-[#5f6f82]">
                    Punya halaman katalog sendiri lengkap banner, foto barang, &
                    tombol pesan ke WhatsApp.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOnlineEnabled(false)}
                  className={`rounded-[5px] border p-3.5 text-left text-xs transition-colors ${
                    !isOnlineEnabled
                      ? "border-[#1976d2] bg-[#eff6ff] text-[#22303c]"
                      : "border-[#d8e1ea] bg-white text-[#5f6f82]"
                  }`}
                >
                  <div className="text-sm text-[#22303c]">
                    Tidak, Cukup Kasir di Toko
                  </div>
                  <div className="mt-1 text-[11px] text-[#5f6f82]">
                    Hanya dipakai untuk mencatat kasir dan sisa stok di dalam
                    toko fisik.
                  </div>
                </button>
              </div>

              {isOnlineEnabled && (
                <div className="space-y-3.5 rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-[#22303c]">
                        Nomor WhatsApp Penerima Pesanan
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="op-input"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-[#22303c]">
                        Nama Pemilik / Admin Toko
                      </label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="Contoh: Ibu Rina"
                        className="op-input"
                      />
                    </div>
                  </div>

                  {/* BANNER SAMPUL TOKO (OPSIONAL) */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-xs text-[#22303c]">
                        Gambar Banner Sampul Toko (Opsional, bisa diatur nanti)
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
                      <img
                        src={bannerUrl}
                        alt="Banner Toko"
                        className="h-28 w-full rounded-[5px] border border-[#d8e1ea] object-cover"
                      />
                    ) : (
                      <label className="flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-[5px] border border-dashed border-[#d8e1ea] bg-white text-xs text-[#5f6f82] hover:border-[#1976d2]">
                        <Upload className="h-4 w-4 text-[#1976d2]" />
                        <span>Klik untuk unggah gambar banner toko</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadBanner}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2.5 border-t border-[#d8e1ea] bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="op-btn shrink-0"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={loadingQuestions}
                  onClick={goToStep3}
                  className="op-btn op-btn-primary flex-1 sm:flex-none"
                >
                  {loadingQuestions
                    ? "Menyiapkan Pertanyaan..."
                    : "Lanjut Jawab Kebutuhan"}
                </button>
              </div>
            </div>
          )}

          {/* LANGKAH 3, 4, 5: PERTANYAAN FLEKSIBEL DARI AI (MULTI-CENTANG + TULIS SENDIRI) */}
          {(step === 3 || step === 4 || step === 5) && currentQuestion && (
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[#1976d2]">
                    {currentQuestion.title}
                  </span>
                  <span className="op-tag op-tag-info">
                    Disesuaikan AI ({modelUsed})
                  </span>
                </div>
                <h2 className="mt-1.5 text-base leading-snug text-[#22303c]">
                  {currentQuestion.question}
                </h2>
                <p className="mt-1 text-[11px] text-[#5f6f82]">
                  Boleh centang lebih dari satu pilihan yang cocok, atau tulis
                  sendiri di kotak bawah.
                </p>
              </div>

              <div className="space-y-2">
                {currentQuestion.options.map((opt) => {
                  const currentList = selectedIds[step] || [];
                  const isChecked = currentList.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(step, opt.id)}
                      className={`flex w-full items-start gap-3 rounded-[8px] border p-3.5 text-left transition-colors sm:rounded-[5px] sm:p-3 ${
                        isChecked
                          ? "border-[#1976d2] bg-[#eff6ff]"
                          : "border-[#d8e1ea] bg-white hover:bg-[#f8fafc]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border sm:h-4 sm:w-4 sm:rounded-[3px] ${
                          isChecked
                            ? "border-[#1976d2] bg-[#1976d2] text-white"
                            : "border-[#9fb1c1] bg-white"
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </span>
                      <div>
                        <div className="text-xs text-[#22303c]">{opt.label}</div>
                        <div className="mt-0.5 text-[11px] leading-relaxed text-[#5f6f82]">
                          {opt.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* KOTAK FLEKSIBEL: LAINNYA / TULIS SENDIRI */}
              <div className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
                <label className="mb-1 block text-xs text-[#22303c]">
                  {currentQuestion.notePrompt}
                </label>
                <textarea
                  rows={2}
                  value={customNotes[step] || ""}
                  onChange={(e) =>
                    setCustomNotes((prev) => ({
                      ...prev,
                      [step]: e.target.value,
                    }))
                  }
                  placeholder="Tulis bebas dengan bahasa Anda sendiri di sini jika pilihan di atas belum pas atau ada tambahan..."
                  className="op-textarea"
                />
              </div>

              <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2.5 border-t border-[#d8e1ea] bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(step - 1);
                  }}
                  className="op-btn shrink-0"
                >
                  Kembali
                </button>
                {step < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStepAnswer(step)) {
                        setStep(step + 1);
                      }
                    }}
                    className="op-btn op-btn-primary flex-1 sm:flex-none"
                  >
                    Pertanyaan Berikutnya
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinish}
                    className="op-btn op-btn-primary flex-1 sm:flex-none"
                  >
                    {submitting
                      ? "Menyiapkan Toko..."
                      : "Selesai & Siapkan Toko"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* LANGKAH 6: HASIL PENYESUAIAN TOKO DENGAN BAHASA SEDERHANA */}
          {step === 6 && provisionResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-[#167a6f]">
                  <Check className="h-4 w-4" />
                  <span>Halaman Toko Siap Digunakan</span>
                </div>
                <span className="op-tag op-tag-info">
                  {provisionResult.model_used}
                </span>
              </div>

              <div className="rounded-[5px] border border-[#bfdbfe] bg-[#eff6ff] p-4">
                <div className="text-xs text-[#1d4ed8]">
                  Tampilan yang Disiapkan untuk {storeName}:
                </div>
                <div className="mt-0.5 text-base text-[#22303c]">
                  {provisionResult.template_label}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#5f6f82]">
                  {provisionResult.ai_summary_reason}
                </p>
              </div>

              <div className="rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-4">
                <div className="text-xs text-[#22303c]">
                  Fitur yang Dinyalakan Sesuai Kebutuhan Anda:
                </div>
                <div className="mt-2.5 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-[4px] border border-[#d8e1ea] bg-white px-3 py-2">
                    <span>Pengingat Tanggal Kadaluarsa</span>
                    <span
                      className={
                        provisionResult.enable_expiry_tracking
                          ? "op-tag op-tag-success"
                          : "op-tag"
                      }
                    >
                      {provisionResult.enable_expiry_tracking
                        ? "Dipakai"
                        : "Disembunyikan"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[4px] border border-[#d8e1ea] bg-white px-3 py-2">
                    <span>
                      Kolom {provisionResult.custom_attribute_label || "Varian"}
                    </span>
                    <span
                      className={
                        provisionResult.enable_variant_matrix
                          ? "op-tag op-tag-success"
                          : "op-tag"
                      }
                    >
                      {provisionResult.enable_variant_matrix
                        ? "Dipakai"
                        : "Disembunyikan"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[4px] border border-[#d8e1ea] bg-white px-3 py-2">
                    <span>Harga Beli Banyak (Grosir)</span>
                    <span
                      className={
                        provisionResult.enable_wholesale_tier
                          ? "op-tag op-tag-success"
                          : "op-tag"
                      }
                    >
                      {provisionResult.enable_wholesale_tier
                        ? "Dipakai"
                        : "Disembunyikan"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[4px] border border-[#d8e1ea] bg-white px-3 py-2">
                    <span>Potongan Diskon di Kasir</span>
                    <span
                      className={
                        provisionResult.enable_manual_discount
                          ? "op-tag op-tag-success"
                          : "op-tag"
                      }
                    >
                      {provisionResult.enable_manual_discount
                        ? "Dipakai"
                        : "Disembunyikan"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[4px] border border-[#d8e1ea] bg-white px-3 py-2">
                    <span>Jadwal Jaga Kasir (Shift)</span>
                    <span
                      className={
                        provisionResult.enable_shift_log
                          ? "op-tag op-tag-success"
                          : "op-tag"
                      }
                    >
                      {provisionResult.enable_shift_log
                        ? "Dipakai"
                        : "Disembunyikan"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[4px] border border-[#d8e1ea] bg-white px-3 py-2">
                    <span>Catatan Bon / Kasbon</span>
                    <span
                      className={
                        provisionResult.enable_debt_book
                          ? "op-tag op-tag-success"
                          : "op-tag"
                      }
                    >
                      {provisionResult.enable_debt_book
                        ? "Dipakai"
                        : "Disembunyikan"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[4px] border border-[#d8e1ea] bg-white px-3 py-2">
                    <span>Satuan Barang Bawaan</span>
                    <span className="op-tag op-tag-info">
                      {provisionResult.default_unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[4px] border border-[#d8e1ea] bg-white px-3 py-2">
                    <span>Ingatkan Sisa Stok &le;</span>
                    <span className="op-tag op-tag-info tabular-nums">
                      {provisionResult.low_stock_threshold}{" "}
                      {provisionResult.default_unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="op-btn op-btn-primary w-full sm:w-auto"
                >
                  Masuk ke Dashboard Toko Saya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
