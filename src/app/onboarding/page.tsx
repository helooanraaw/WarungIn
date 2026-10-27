"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RETAIL_CATEGORIES } from "@/lib/quotas";
import type { OnboardingQuestion } from "@/lib/ai-onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [storeName, setStoreName] = useState("");
  const [category, setCategory] = useState<string>(RETAIL_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [isOnlineEnabled, setIsOnlineEnabled] = useState<boolean>(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);
  const [answer3, setAnswer3] = useState("EXPIRY_FOCUS");
  const [answer4, setAnswer4] = useState("WHOLESALE_ONLY");
  const [answer5, setAnswer5] = useState("DEBT_ON_10");

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) router.push("/login");
        return res.json();
      })
      .then((data) => {
        if (data?.user?.store) {
          const s = data.user.store;
          setStoreName(s.store_name);
          setCategory(s.category);
          setDescription(s.description);
          setIsOnlineEnabled(s.is_online_enabled);
          setWhatsappNumber(s.whatsapp_number || "");
          setAccountHolderName(s.account_holder_name || "");
        }
      })
      .catch(() => {});
  }, [router]);

  async function goToStep3() {
    setError("");
    if (
      isOnlineEnabled &&
      (!whatsappNumber.trim() || !accountHolderName.trim())
    ) {
      setError(
        "Nomor WhatsApp dan Nama Pemilik wajib diisi jika Katalog Online diaktifkan."
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
          category,
          description,
        }),
      });
      const data = await res.json();
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        if (data.questions[0]?.options?.[0]?.value)
          setAnswer3(data.questions[0].options[0].value);
        if (data.questions[1]?.options?.[0]?.value)
          setAnswer4(data.questions[1].options[0].value);
        if (data.questions[2]?.options?.[0]?.value)
          setAnswer5(data.questions[2].options[0].value);
      }
      setStep(3);
    } catch {
      setError("Gagal menyiapkan pertanyaan profil toko.");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function handleFinish() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: storeName,
          category,
          description,
          is_online_enabled: isOnlineEnabled,
          whatsapp_number: whatsappNumber,
          account_holder_name: accountHolderName,
          answer3,
          answer4,
          answer5,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan konfigurasi toko.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Gagal menyimpan pengaturan toko.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentQuestion = questions.find((q) => q.step === step);

  return (
    <div className="min-h-screen bg-[#f4f7fa] px-4 py-10 text-[#22303c]">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between text-xs text-[#5f6f82]">
          <span>Warungin - Pengaturan Awal Toko</span>
          <Link href="/dashboard" className="hover:text-[#22303c]">
            Lewati ke Dashboard
          </Link>
        </div>

        <div className="op-card p-6 sm:p-7">
          {/* INDIKATOR LANGKAH */}
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

          <h1 className="mt-5 text-xl text-[#22303c]">
            Atur Tampilan Toko Anda
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-[#5f6f82]">
            Jawab 5 pertanyaan singkat ini agar menu kasir dan stok disesuaikan
            dengan kebutuhan usaha Anda.
          </p>

          {error && (
            <div className="mt-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]">
              {error}
            </div>
          )}

          {/* LANGKAH 1: PROFIL TOKO */}
          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-[#22303c]">
                  Nama Toko
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Contoh: Toko Sembako Berkah Jaya"
                  className="op-input"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-[#22303c]">
                  Jenis Usaha
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="op-select"
                >
                  {RETAIL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-[#22303c]">
                  Deskripsi Singkat Toko
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Menjual beras, minyak goreng, gula, dan kebutuhan dapur harian."
                  className="op-textarea"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!storeName.trim()) {
                      setError("Nama toko wajib diisi.");
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                  className="op-btn op-btn-primary"
                >
                  Lanjut ke Langkah 2
                </button>
              </div>
            </div>
          )}

          {/* LANGKAH 2: INTEGRASI KATALOG ONLINE WHATSAPP */}
          {step === 2 && (
            <div className="mt-6 space-y-4">
              <div>
                <div className="text-sm text-[#22303c]">
                  Aktifkan Katalog Toko Online?
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#5f6f82]">
                  Jika diaktifkan, toko Anda mendapat halaman katalog publik dan
                  pembeli bisa memesan barang langsung ke WhatsApp Anda.
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
                    Ya, Aktifkan Katalog Online
                  </div>
                  <div className="mt-1 text-[11px] text-[#5f6f82]">
                    Tampilkan barang terpilih di halaman katalog dan terima
                    pesanan via WhatsApp.
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
                    Tidak, Hanya Kasir Toko Fisik
                  </div>
                  <div className="mt-1 text-[11px] text-[#5f6f82]">
                    Gunakan untuk pencatatan kasir dan stok di dalam toko saja.
                  </div>
                </button>
              </div>

              {isOnlineEnabled && (
                <div className="space-y-4 rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-4">
                  <div>
                    <label className="mb-1.5 block text-xs text-[#22303c]">
                      Nomor WhatsApp Toko
                    </label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="Contoh: 081234567890"
                      className="op-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-[#22303c]">
                      Nama Pemilik / Admin Toko
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Contoh: Ibu Siti"
                      className="op-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="op-btn"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  disabled={loadingQuestions}
                  onClick={goToStep3}
                  className="op-btn op-btn-primary"
                >
                  {loadingQuestions
                    ? "Menyiapkan Pertanyaan..."
                    : "Lanjut ke Langkah 3"}
                </button>
              </div>
            </div>
          )}

          {/* LANGKAH 3, 4, 5: PERTANYAAN DINAMIS AI / FALLBACK */}
          {(step === 3 || step === 4 || step === 5) && currentQuestion && (
            <div className="mt-6 space-y-4">
              <div>
                <div className="text-xs text-[#1976d2]">
                  {currentQuestion.title}
                </div>
                <div className="mt-1 text-sm text-[#22303c]">
                  {currentQuestion.question}
                </div>
              </div>

              <div className="space-y-2.5">
                {currentQuestion.options.map((opt) => {
                  const currentVal =
                    step === 3 ? answer3 : step === 4 ? answer4 : answer5;
                  const isSelected = currentVal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (step === 3) setAnswer3(opt.value);
                        if (step === 4) setAnswer4(opt.value);
                        if (step === 5) setAnswer5(opt.value);
                      }}
                      className={`w-full rounded-[5px] border p-3.5 text-left transition-colors ${
                        isSelected
                          ? "border-[#1976d2] bg-[#eff6ff]"
                          : "border-[#d8e1ea] bg-white hover:bg-[#f8fafc]"
                      }`}
                    >
                      <div className="text-xs text-[#22303c]">{opt.label}</div>
                      <div className="mt-1 text-[11px] leading-relaxed text-[#5f6f82]">
                        {opt.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="op-btn"
                >
                  Kembali
                </button>
                {step < 5 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="op-btn op-btn-primary"
                  >
                    Lanjut ke Langkah {step + 1}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinish}
                    className="op-btn op-btn-primary"
                  >
                    {submitting
                      ? "Menyusun Halaman Kerja..."
                      : "Selesai dan Buka Dashboard"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
