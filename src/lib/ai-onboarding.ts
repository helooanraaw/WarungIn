import { GoogleGenAI } from "@google/genai";

export interface OnboardingQuestion {
  step: number;
  title: string;
  question: string;
  options: {
    label: string;
    value: string;
    description: string;
  }[];
}

export interface ProvisionedModulesResult {
  enable_expiry_tracking: boolean;
  enable_variant_matrix: boolean;
  enable_wholesale_tier: boolean;
  enable_shift_log: boolean;
  enable_debt_book: boolean;
  low_stock_threshold: number;
  ai_summary_reason: string;
}

/**
 * Rule-Based Fallback Questions berdasarkan kategori usaha.
 * Digunakan otomatis apabila GEMINI_API_KEY tidak diisi atau timeout (> 3.5 detik).
 */
export function getFallbackQuestions(
  category: string,
  storeName: string
): OnboardingQuestion[] {
  const catLower = category.toLowerCase();
  const isFoodOrHealth =
    catLower.includes("kelontong") ||
    catLower.includes("sembako") ||
    catLower.includes("kue") ||
    catLower.includes("apotek");
  const isFashion = catLower.includes("butik") || catLower.includes("pakaian");

  return [
    {
      step: 3,
      title: "Karakteristik Barang & Inventori",
      question: isFoodOrHealth
        ? `Apakah barang di ${storeName} memiliki tanggal kedaluwarsa (expired date) yang perlu dipantau?`
        : isFashion
        ? `Apakah produk di ${storeName} memiliki pilihan ukuran (S/M/L/XL) atau warna yang berbeda?`
        : `Karakteristik stok barang apa yang paling penting untuk dipantau di ${storeName}?`,
      options: [
        {
          label: "Pantau Tanggal Kedaluwarsa Barang",
          value: "EXPIRY_FOCUS",
          description:
            "Cocok untuk makanan, minuman, bahan kue, obat, atau barang konsumsi.",
        },
        {
          label: "Kelola Varian Ukuran & Warna",
          value: "VARIANT_FOCUS",
          description:
            "Cocok untuk pakaian, sepatu, aksesoris, atau barang dengan pilihan model.",
        },
        {
          label: "Pantau keduanya (Kedaluwarsa & Varian)",
          value: "BOTH_INVENTORY",
          description:
            "Aktifkan kolom tanggal kedaluwarsa sekaligus label varian pada tabel produk.",
        },
        {
          label: "Cukup Stok Standar (Tanpa Varian/Kedaluwarsa)",
          value: "STANDARD_INVENTORY",
          description:
            "Pencatatan stok masuk dan keluar yang ringkas untuk barang umum.",
        },
      ],
    },
    {
      step: 4,
      title: "Pola Harga & Shift Kasir Harian",
      question: `Bagaimana sistem harga jual dan penjagaan meja kasir harian di ${storeName}?`,
      options: [
        {
          label: "Ada Harga Grosir (Beli Banyak Lebih Murah)",
          value: "WHOLESALE_ONLY",
          description:
            "Kasir otomatis menghitung harga grosir saat jumlah beli mencapai batas minimum.",
        },
        {
          label: "Kasir Bergantian Shift (Pagi / Sore / Malam)",
          value: "SHIFT_ONLY",
          description:
            "Setiap transaksi mencatat shift penjaga toko untuk memudahkan serah terima uang.",
        },
        {
          label: "Aktifkan Harga Grosir & Pencatatan Shift Kasir",
          value: "WHOLESALE_AND_SHIFT",
          description:
            "Mengaktifkan harga bertingkat sekaligus pemisahan laporan shift kasir.",
        },
        {
          label: "Harga Eceran Tunggal & Dijaga Sendiri",
          value: "SIMPLE_POS",
          description:
            "Tampilan kasir paling ringkas dengan satu harga jual standar.",
        },
      ],
    },
    {
      step: 5,
      title: "Pencatatan Kasbon & Pengingat Stok Menipis",
      question: `Apakah ${storeName} menerima pembayaran tempo (kasbon pelanggan) dan berapa batas pengingat stok tipis?`,
      options: [
        {
          label: "Sediakan Buku Kasbon + Pengingat Stok <= 10",
          value: "DEBT_ON_10",
          description:
            "Bisa catat transaksi kasbon pelanggan tetap dan ingatkan saat stok sisa 10.",
        },
        {
          label: "Sediakan Buku Kasbon + Pengingat Stok <= 5",
          value: "DEBT_ON_5",
          description:
            "Bisa catat kasbon pelanggan dan ingatkan saat stok barang sisa 5.",
        },
        {
          label: "Semua Bayar Lunas + Pengingat Stok <= 10",
          value: "NO_DEBT_10",
          description:
            "Hanya melayani pembayaran Tunai/QRIS/Transfer dengan batas stok tipis 10.",
        },
        {
          label: "Semua Bayar Lunas + Pengingat Stok <= 5",
          value: "NO_DEBT_5",
          description:
            "Cocok untuk butik atau kios dengan jumlah stok per item yang sedikit.",
        },
      ],
    },
  ];
}

/**
 * Rule-Based Fallback Provisioning Engine.
 * Menentukan 5 boolean flag modul + low_stock_threshold secara deterministik.
 */
export function getFallbackProvisioning(params: {
  storeName: string;
  category: string;
  description: string;
  answer3: string;
  answer4: string;
  answer5: string;
}): ProvisionedModulesResult {
  const catLower = params.category.toLowerCase();
  const descLower = params.description.toLowerCase();

  const enable_expiry_tracking =
    params.answer3 === "EXPIRY_FOCUS" ||
    params.answer3 === "BOTH_INVENTORY" ||
    catLower.includes("apotek") ||
    catLower.includes("kue") ||
    descLower.includes("expired") ||
    descLower.includes("kedaluwarsa");

  const enable_variant_matrix =
    params.answer3 === "VARIANT_FOCUS" ||
    params.answer3 === "BOTH_INVENTORY" ||
    catLower.includes("butik") ||
    catLower.includes("pakaian") ||
    descLower.includes("ukuran") ||
    descLower.includes("warna");

  const enable_wholesale_tier =
    params.answer4 === "WHOLESALE_ONLY" ||
    params.answer4 === "WHOLESALE_AND_SHIFT" ||
    descLower.includes("grosir") ||
    descLower.includes("partai");

  const enable_shift_log =
    params.answer4 === "SHIFT_ONLY" ||
    params.answer4 === "WHOLESALE_AND_SHIFT" ||
    descLower.includes("shift") ||
    descLower.includes("karyawan");

  const enable_debt_book =
    params.answer5 === "DEBT_ON_10" ||
    params.answer5 === "DEBT_ON_5" ||
    descLower.includes("kasbon") ||
    descLower.includes("tempo");

  const low_stock_threshold =
    params.answer5 === "DEBT_ON_5" || params.answer5 === "NO_DEBT_5" ? 5 : 10;

  const activeNames: string[] = [];
  if (enable_expiry_tracking) activeNames.push("Pelacakan Kedaluwarsa");
  if (enable_variant_matrix) activeNames.push("Matriks Varian Ukuran/Warna");
  if (enable_wholesale_tier) activeNames.push("Harga Grosir Bertingkat");
  if (enable_shift_log) activeNames.push("Pencatatan Shift Kasir");
  if (enable_debt_book) activeNames.push("Buku Kasbon Pelanggan");

  const ai_summary_reason =
    activeNames.length > 0
      ? `Berdasarkan profil ${params.storeName} (${params.category}), sistem mengaktifkan modul ${activeNames.join(", ")} dengan batas pengingat stok tipis ${low_stock_threshold} unit.`
      : `Berdasarkan profil ${params.storeName} (${params.category}), sistem mengaktifkan antarmuka kasir dan stok standar yang ringkas dengan batas pengingat stok tipis ${low_stock_threshold} unit.`;

  return {
    enable_expiry_tracking,
    enable_variant_matrix,
    enable_wholesale_tier,
    enable_shift_log,
    enable_debt_book,
    low_stock_threshold,
    ai_summary_reason,
  };
}

/**
 * Memanggil Gemini API (gemini-3.8-flash) dengan batas waktu 3.5 detik.
 * Jika API key kosong atau gagal, langsung kembali ke Fallback Engine.
 */
export async function generateOnboardingQuestionsAI(params: {
  storeName: string;
  category: string;
  description: string;
}): Promise<{ questions: OnboardingQuestion[]; source: "gemini" | "fallback" }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      questions: getFallbackQuestions(params.category, params.storeName),
      source: "fallback",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Kamu adalah asisten konfigurasi sistem kasir dan inventori toko ritel kecil bernama Warungin.
Pengguna sedang mendaftarkan toko:
- Nama Toko: ${params.storeName}
- Kategori: ${params.category}
- Deskripsi: ${params.description}

Buat tepat 3 pertanyaan pilihan ganda (Langkah 3, 4, dan 5) dalam bahasa Indonesia yang sederhana untuk memetakan modul toko:
- Langkah 3 (step=3): tentang karakteristik stok (apakah butuh pantau kedaluwarsa: EXPIRY_FOCUS, varian ukuran/warna: VARIANT_FOCUS, keduanya: BOTH_INVENTORY, atau standar: STANDARD_INVENTORY).
- Langkah 4 (step=4): tentang pola harga dan shift kasir (apakah ada harga grosir: WHOLESALE_ONLY, shift kasir: SHIFT_ONLY, keduanya: WHOLESALE_AND_SHIFT, atau kasir tunggal: SIMPLE_POS).
- Langkah 5 (step=5): tentang pencatatan kasbon dan batas pengingat stok tipis (DEBT_ON_10, DEBT_ON_5, NO_DEBT_10, NO_DEBT_5).

Pastikan nilai "value" pada setiap opsi persis menggunakan kode di atas agar sistem dapat memetakannya dengan akurat. Kembalikan hanya JSON murni sesuai struktur.`;

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3500)
    );

    const genPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const response = await Promise.race([genPromise, timeoutPromise]);
    if (!response || !response.text) {
      return {
        questions: getFallbackQuestions(params.category, params.storeName),
        source: "fallback",
      };
    }

    const parsed = JSON.parse(response.text);
    const list = Array.isArray(parsed) ? parsed : parsed.questions;
    if (Array.isArray(list) && list.length === 3) {
      return { questions: list, source: "gemini" };
    }
  } catch {
    // Fallback otomatis tanpa error ke pengguna
  }

  return {
    questions: getFallbackQuestions(params.category, params.storeName),
    source: "fallback",
  };
}

export async function provisionModulesWithAI(params: {
  storeName: string;
  category: string;
  description: string;
  answer3: string;
  answer4: string;
  answer5: string;
}): Promise<ProvisionedModulesResult> {
  const baseResult = getFallbackProvisioning(params);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return baseResult;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Buat 1 kalimat ringkas dalam Bahasa Indonesia yang ramah dan mudah dipahami pemilik warung/toko ritel kecil mengenai alasan pengaktifan modul kasir untuk toko "${params.storeName}" (${params.category}: ${params.description}).
Modul yang diaktifkan:
- Pelacakan Kedaluwarsa: ${baseResult.enable_expiry_tracking}
- Varian Ukuran/Warna: ${baseResult.enable_variant_matrix}
- Harga Grosir: ${baseResult.enable_wholesale_tier}
- Shift Kasir: ${baseResult.enable_shift_log}
- Buku Kasbon: ${baseResult.enable_debt_book}
- Batas Stok Menipis: ${baseResult.low_stock_threshold} unit.
Jangan gunakan tanda baca em-dash. Langsung tulis kalimat penjelasannya saja.`;

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3000)
    );
    const genPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const response = await Promise.race([genPromise, timeoutPromise]);
    if (response && response.text && response.text.trim().length > 15) {
      return {
        ...baseResult,
        ai_summary_reason: response.text.trim().replace(/—/g, "-"),
      };
    }
  } catch {
    // Gunakan ringkasan fallback
  }

  return baseResult;
}
