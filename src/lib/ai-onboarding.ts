import { GoogleGenAI, Type, type Schema } from "@google/genai";

export interface OnboardingQuestion {
  step: number;
  title: string;
  question: string;
  notePrompt: string;
  options: {
    id: string;
    label: string;
    description: string;
  }[];
}

export interface StepAnswerInput {
  question: string;
  selectedLabels: string[];
  customNote: string;
}

export interface ProvisionedModulesResult {
  model_used: string;
  dashboard_template: string;
  template_label: string;
  custom_attribute_label: string;
  default_unit: string;
  enable_expiry_tracking: boolean;
  enable_variant_matrix: boolean;
  enable_wholesale_tier: boolean;
  enable_manual_discount: boolean;
  enable_shift_log: boolean;
  enable_debt_book: boolean;
  enable_delivery_note: boolean;
  low_stock_threshold: number;
  receipt_footer: string;
  ai_summary_reason: string;
}

interface ModelCandidate {
  model: string;
  useThinkingZero: boolean;
}

const AI_MODEL_PRIORITY: readonly ModelCandidate[] = [
  { model: "gemini-2.5-flash-lite", useThinkingZero: true },
  { model: "gemini-2.5-flash", useThinkingZero: true },
  { model: "gemini-3.5-flash-lite", useThinkingZero: false },
];

const QUESTIONS_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      question: { type: Type.STRING },
      notePrompt: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["label", "description"],
        },
      },
    },
    required: ["title", "question", "notePrompt", "options"],
  },
};

const PROVISION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    dashboard_template: { type: Type.STRING },
    template_label: { type: Type.STRING },
    enable_expiry_tracking: { type: Type.BOOLEAN },
    enable_variant_matrix: { type: Type.BOOLEAN },
    custom_attribute_label: { type: Type.STRING },
    default_unit: { type: Type.STRING },
    enable_wholesale_tier: { type: Type.BOOLEAN },
    enable_manual_discount: { type: Type.BOOLEAN },
    enable_shift_log: { type: Type.BOOLEAN },
    enable_debt_book: { type: Type.BOOLEAN },
    enable_delivery_note: { type: Type.BOOLEAN },
    low_stock_threshold: { type: Type.INTEGER },
    receipt_footer: { type: Type.STRING },
    ai_summary_reason: { type: Type.STRING },
  },
  required: [
    "dashboard_template",
    "template_label",
    "enable_expiry_tracking",
    "enable_variant_matrix",
    "custom_attribute_label",
    "default_unit",
    "enable_wholesale_tier",
    "enable_manual_discount",
    "enable_shift_log",
    "enable_debt_book",
    "enable_delivery_note",
    "low_stock_threshold",
    "receipt_footer",
    "ai_summary_reason",
  ],
};

interface CachedQuestionsEntry {
  expiresAt: number;
  questions: OnboardingQuestion[];
  modelUsed: string;
}

const QUESTION_CACHE = new Map<string, CachedQuestionsEntry>();
const QUESTION_CACHE_TTL_MS = 10 * 60 * 1000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "Kunci layanan belum terpasang di server. Silakan hubungi pengelola aplikasi."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: "v1beta" },
  });
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

function cleanText(value: unknown, fallback = ""): string {
  return String(value ?? fallback)
    .replace(/\u2014/g, "-")
    .trim();
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateJsonWithCascade(params: {
  prompt: string;
  responseSchema: Schema;
  maxOutputTokens: number;
  temperature: number;
  timeoutMs?: number;
}): Promise<{ parsed: unknown; modelUsed: string }> {
  const ai = getAiClient();
  const errors: string[] = [];
  const timeoutMs = params.timeoutMs ?? 7500;

  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) {
      await sleep(500);
    }

    const candidates =
      pass === 0 ? AI_MODEL_PRIORITY : AI_MODEL_PRIORITY.slice(0, 2);

    for (const candidate of candidates) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout (${timeoutMs}ms)`)),
            timeoutMs
          )
        );

        const genPromise = ai.models.generateContent({
          model: candidate.model,
          contents: params.prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: params.responseSchema,
            maxOutputTokens: params.maxOutputTokens,
            temperature: params.temperature,
            ...(candidate.useThinkingZero
              ? { thinkingConfig: { thinkingBudget: 0 } }
              : {}),
          },
        });

        const response = await Promise.race([genPromise, timeoutPromise]);
        const text = response?.text?.trim();
        if (text) {
          const parsed = JSON.parse(extractJsonText(text));
          return { parsed, modelUsed: candidate.model };
        }
        errors.push(`${candidate.model}: respons kosong`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${candidate.model}: ${msg}`);
      }
    }
  }

  console.error("[ai-onboarding] Semua kandidat model gagal:", errors.join(" | "));
  throw new Error(
    "Layanan penyesuaian otomatis sedang padat sebentar. Silakan tunggu beberapa detik lalu klik tombol sekali lagi."
  );
}

/**
 * Menghasilkan 3 pertanyaan onboarding yang ringkas, hemat token, dan relevan dengan barang jualan toko,
 * memakai bahasa sehari-hari tanpa istilah teknis maupun nama model AI.
 */
export async function generateOnboardingQuestionsAI(params: {
  storeName: string;
  category: string;
  description: string;
}): Promise<{
  questions: OnboardingQuestion[];
  source: "gemini";
  model_used: string;
}> {
  const storeName = params.storeName.trim().slice(0, 80);
  const category = params.category.trim().slice(0, 60);
  const description = params.description.trim().slice(0, 300);

  const cacheKey = `${storeName.toLowerCase()}|${category.toLowerCase()}|${description.toLowerCase()}`;
  const cached = QUESTION_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      questions: cached.questions,
      source: "gemini",
      model_used: cached.modelUsed,
    };
  }

  const prompt = `Pendamping ramah Warungin untuk toko "${storeName}" (Usaha: "${category}").
Dagangan & kebutuhan: "${description}".
Buat tepat 3 pertanyaan (array 3 objek) dengan bahasa sehari-hari akrab (sapa "Anda", hindari "Kak", dilarang kata teknis ERP/SKU/varian/tier/modul atau tanda em-dash). Tiap pertanyaan berisi 4 opsi saling melengkapi (pengguna boleh centang >1):
1. Ciri pembeda barang dagangan ini (misal ukuran/warna/rasa/tipe/garansi/tanggal kedaluwarsa bila relevan) beserta satuannya (pcs/kg/bungkus/dll).
2. Kebiasaan jualan di kasir (harga beli banyak/grosir, potongan diskon, atau jaga kasir bergantian).
3. Pembayaran pelanggan (catatan bon/kasbon), kirim pesanan via WhatsApp, dan pengingat stok hampir habis.
Buat sangat ringkas: title <=4 kata, label <=7 kata, description <=12 kata, notePrompt <=9 kata.`;

  interface RawQuestionItem {
    title?: string;
    question?: string;
    notePrompt?: string;
    options?: {
      id?: string;
      label?: string;
      value?: string;
      description?: string;
    }[];
  }

  const { parsed, modelUsed } = await generateJsonWithCascade({
    prompt,
    responseSchema: QUESTIONS_SCHEMA,
    maxOutputTokens: 1100,
    temperature: 0.3,
  });

  const parsedObj = parsed as { questions?: RawQuestionItem[] } | RawQuestionItem[];
  const list = Array.isArray(parsedObj) ? parsedObj : parsedObj?.questions;

  if (!Array.isArray(list) || list.length !== 3) {
    throw new Error("Format pertanyaan belum lengkap. Silakan coba sekali lagi.");
  }

  const questions: OnboardingQuestion[] = list.map((q, idx) => {
    if (!q?.question || !Array.isArray(q?.options) || q.options.length < 2) {
      throw new Error("Pilihan pertanyaan belum lengkap. Silakan coba sekali lagi.");
    }
    return {
      step: idx + 3,
      title: cleanText(q.title, `Pertanyaan ${idx + 1}`),
      question: cleanText(q.question),
      notePrompt: cleanText(
        q.notePrompt,
        "Ada tambahan khusus untuk toko Anda? Tulis di sini:"
      ),
      options: q.options.slice(0, 4).map((opt, oIdx) => ({
        id: cleanText(opt.id || opt.value, `opt_${idx + 3}_${oIdx + 1}`),
        label: cleanText(opt.label),
        description: cleanText(opt.description),
      })),
    };
  });

  if (QUESTION_CACHE.size >= 100) {
    const oldestKey = QUESTION_CACHE.keys().next().value;
    if (oldestKey) QUESTION_CACHE.delete(oldestKey);
  }
  QUESTION_CACHE.set(cacheKey, {
    expiresAt: Date.now() + QUESTION_CACHE_TTL_MS,
    questions,
    modelUsed,
  });

  return {
    questions,
    source: "gemini",
    model_used: modelUsed,
  };
}

/**
 * Menganalisis profil usaha dan jawaban singkat pemilik toko secara hemat token dan akurat
 * untuk menyetel menu kasir, catatan stok, serta tampilan toko online yang sesuai.
 */
export async function provisionModulesWithAI(params: {
  storeName: string;
  category: string;
  description: string;
  isOnlineEnabled: boolean;
  step3: StepAnswerInput;
  step4: StepAnswerInput;
  step5: StepAnswerInput;
}): Promise<ProvisionedModulesResult> {
  const formatCompactStep = (label: string, s: StepAnswerInput) => {
    const picked =
      s.selectedLabels.length > 0 ? s.selectedLabels.join("; ") : "-";
    const extra = s.customNote ? s.customNote.slice(0, 220) : "-";
    return `${label}: dipilih=[${picked}] | tambahan="${extra}"`;
  };

  const prompt = `Atur menu toko Warungin agar hanya menyalakan fitur yang benar-benar dibutuhkan:
Toko: "${params.storeName.slice(0, 80)}" | Usaha: "${params.category.slice(0, 60)}" | Online WA: ${params.isOnlineEnabled ? "Ya" : "Tidak"}
Jualan: "${params.description.slice(0, 300)}"
${formatCompactStep("1. Ciri Barang & Satuan", params.step3)}
${formatCompactStep("2. Kasir & Harga", params.step4)}
${formatCompactStep("3. Bayar, Antar & Stok", params.step5)}

Aturan:
- dashboard_template: SEMBAKO_GROSIR | MAKANAN_EXPIRY | FASHION_VARIAN | ELEKTRONIK_GARANSI | RITEL_KUSTOM
- template_label: nama singkat ramah (cth: Pengaturan Konter Aksesoris & Garansi)
- enable_expiry_tracking: true HANYA jika barang bisa basi/kedaluwarsa
- enable_variant_matrix: true jika butuh pembeda ukuran/warna/rasa/tipe/garansi; custom_attribute_label: 2-3 kata paling pas
- default_unit: 1 kata kecil (pcs/kg/bungkus/cup/porsi/meter/dll)
- enable_wholesale_tier: beli banyak lebih murah; enable_manual_discount: diskon kasir; enable_shift_log: jaga bergantian; enable_debt_book: catatan kasbon; enable_delivery_note: pilih ambil sendiri atau diantar
- low_stock_threshold: angka wajar (pakai angka yang disebut pengguna bila ada)
- receipt_footer: pesan singkat bawah struk
- ai_summary_reason: 2 kalimat untuk pemilik toko dalam bahasa sehari-hari (tanpa kata teknis/em-dash) menjelaskan menu apa saja yang dinyalakan di kasir dan stok.`;

  const { parsed: rawParsed, modelUsed } = await generateJsonWithCascade({
    prompt,
    responseSchema: PROVISION_SCHEMA,
    maxOutputTokens: 550,
    temperature: 0.15,
  });

  const parsed = rawParsed as Record<string, unknown>;

  if (
    typeof parsed.enable_expiry_tracking !== "boolean" ||
    typeof parsed.enable_variant_matrix !== "boolean" ||
    typeof parsed.enable_wholesale_tier !== "boolean" ||
    !parsed.template_label ||
    !parsed.ai_summary_reason
  ) {
    throw new Error("Hasil penyesuaian menu belum lengkap. Silakan coba sekali lagi.");
  }

  return {
    model_used: modelUsed,
    dashboard_template: cleanText(parsed.dashboard_template, "RITEL_KUSTOM"),
    template_label: cleanText(parsed.template_label),
    custom_attribute_label: cleanText(
      parsed.custom_attribute_label,
      "Ukuran / Pilihan"
    ),
    default_unit: cleanText(parsed.default_unit, "pcs")
      .toLowerCase()
      .slice(0, 20),
    enable_expiry_tracking: Boolean(parsed.enable_expiry_tracking),
    enable_variant_matrix: Boolean(parsed.enable_variant_matrix),
    enable_wholesale_tier: Boolean(parsed.enable_wholesale_tier),
    enable_manual_discount: Boolean(parsed.enable_manual_discount),
    enable_shift_log: Boolean(parsed.enable_shift_log),
    enable_debt_book: Boolean(parsed.enable_debt_book),
    enable_delivery_note:
      parsed.enable_delivery_note !== undefined
        ? Boolean(parsed.enable_delivery_note)
        : true,
    low_stock_threshold: Math.max(1, Number(parsed.low_stock_threshold) || 5),
    receipt_footer: cleanText(
      parsed.receipt_footer,
      `Terima kasih sudah berbelanja di ${params.storeName}.`
    ),
    ai_summary_reason: cleanText(parsed.ai_summary_reason),
  };
}
