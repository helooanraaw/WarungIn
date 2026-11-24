import { GoogleGenAI } from "@google/genai";

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

const AI_MODEL_PRIORITY = [
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.8-flash",
] as const;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY belum diisi di file .env. Silakan masukkan API Key Google Gemini terlebih dahulu."
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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateJsonWithCascade(
  prompt: string,
  timeoutMs = 14000
): Promise<{ parsed: unknown; modelUsed: string }> {
  const ai = getAiClient();
  const errors: string[] = [];

  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) {
      await sleep(1200);
    }
    for (const model of AI_MODEL_PRIORITY) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Waktu tunggu habis (${timeoutMs}ms)`)),
            timeoutMs
          )
        );

        const genPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const response = await Promise.race([genPromise, timeoutPromise]);
        const text = response?.text?.trim();
        if (text) {
          const parsed = JSON.parse(extractJsonText(text));
          return { parsed, modelUsed: model };
        }
        errors.push(`${model}: respons kosong`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${model}: ${msg}`);
      }
    }
  }

  throw new Error(
    `Server AI sedang sibuk, silakan klik tombol sekali lagi (${errors[0] || "503"})`
  );
}

/**
 * Menghasilkan 3 pertanyaan wawancara yang benar-benar fleksibel sesuai barang yang dijual pengguna,
 * menggunakan bahasa sehari-hari yang mudah dipahami pengguna awam (tanpa istilah teknis).
 * Pengguna nantinya dapat mencentang lebih dari satu pilihan dan/atau menulis jawaban sendiri.
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
  const prompt = `Kamu adalah pendamping ramah bagi pemilik warung dan toko ritel di Indonesia di aplikasi bernama Warungin.
Seorang pengguna baru sedang mengatur tokonya:
- Nama Toko: "${params.storeName}"
- Jenis Usaha: "${params.category}"
- Cerita Barang yang Dijual & Kebutuhan Toko: "${params.description}"

Tugasmu: Buat tepat 3 pertanyaan singkat (step 3, step 4, step 5) yang SANGAT FLEKSIBEL dan spesifik menyesuaikan jenis barang yang dijual toko tersebut.
ATURAN BAHASA WAJIB:
1. Gunakan bahasa sehari-hari yang sangat mudah dipahami orang awam (seperti ngobrol sopan dengan pemilik toko).
2. JANGAN gunakan kata teknis seperti "ERP", "SKU", "Matriks Varian", "Tier Grosir", "Provisioning", atau "Modul". Gunakan kata sederhana seperti "tanggal kadaluarsa", "ukuran/warna/tipe", "harga beli banyak", "potongan diskon", "jaga kasir bergantian", "catatan bon/utang pelanggan", "diantar ke rumah pembeli".
3. Jangan gunakan tanda em-dash (—).
4. Pengguna nanti BISA MENCENTANG LEBIH DARI SATU PILIHAN sekaligus pada setiap pertanyaan, serta punya kotak "Lainnya / Tulis sendiri". Jadi buatlah 4 pilihan yang relevan dan saling melengkapi untuk usaha "${params.category}" tersebut!

Cakupan 3 pertanyaan:
- step 3 (Ciri Barang & Catatan Stok): Tanyakan ciri barang di "${params.storeName}" yang perlu dicatat di daftar stok (misal: apakah ada tanggal kadaluarsa/batas simpan, apakah perlu membedakan ukuran/warna/rasa/tipe/garansi/kemasan, satuan jual seperti pcs/kg/meter/bungkus, atau cukup catat nama dan jumlah saja).
- step 4 (Cara Jualan & Harga di Kasir): Tanyakan kebiasaan melayani pembeli di meja kasir (misal: apakah beli banyak/grosir dapat harga lebih murah, apakah sering memberi potongan harga/diskon langsung saat transaksi, apakah kasir dijaga bergantian pagi dan sore/malam).
- step 5 (Pembayaran, Pengantaran & Pengingat Belanja Stok): Tanyakan kebiasaan pembayaran pelanggan dan pengingat stok (misal: apakah menerima catatan bon/bayar nanti untuk pelanggan langganan, apakah menerima pesanan minta diantar ke alamat pembeli lewat WhatsApp, dan ingin diingatkan saat sisa stok tinggal sedikit).

Kembalikan HANYA JSON array berisi tepat 3 objek dengan struktur persis berikut:
[
  {
    "step": 3,
    "title": "Judul singkat yang mudah dipahami",
    "question": "Pertanyaan ramah menyebut nama toko/barang jualan mereka (beri petunjuk singkat bahwa boleh pilih lebih dari satu)",
    "notePrompt": "Kalimat ajakan ramah untuk menulis sendiri jika ada ciri barang lain atau satuan khusus yang belum tertulis di atas",
    "options": [
      { "id": "opt_3_1", "label": "Kalimat pilihan 1 yang jelas", "description": "Penjelasan singkat manfaatnya bagi toko" },
      { "id": "opt_3_2", "label": "Kalimat pilihan 2 yang jelas", "description": "Penjelasan singkat manfaatnya bagi toko" },
      { "id": "opt_3_3", "label": "Kalimat pilihan 3 yang jelas", "description": "Penjelasan singkat manfaatnya bagi toko" },
      { "id": "opt_3_4", "label": "Kalimat pilihan 4 yang jelas", "description": "Penjelasan singkat manfaatnya bagi toko" }
    ]
  },
  { "step": 4, "title": "...", "question": "...", "notePrompt": "...", "options": [ ...4 item... ] },
  { "step": 5, "title": "...", "question": "...", "notePrompt": "...", "options": [ ...4 item... ] }
]`;

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

  const { parsed, modelUsed } = await generateJsonWithCascade(prompt);
  const parsedObj = parsed as { questions?: RawQuestionItem[] } | RawQuestionItem[];
  const list = Array.isArray(parsedObj) ? parsedObj : parsedObj?.questions;

  if (!Array.isArray(list) || list.length !== 3) {
    throw new Error("Format pertanyaan dari Gemini AI tidak sesuai.");
  }

  const questions: OnboardingQuestion[] = list.map((q, idx) => {
    if (!q?.question || !Array.isArray(q?.options) || q.options.length < 2) {
      throw new Error("Pilihan jawaban dari Gemini AI belum lengkap.");
    }
    return {
      step: idx + 3,
      title: String(q.title || `Pertanyaan ${idx + 1}`).replace(/—/g, "-"),
      question: String(q.question).replace(/—/g, "-"),
      notePrompt: String(
        q.notePrompt ||
          "Ada kebutuhan lain yang belum ada di pilihan atas? Tulis singkat di sini:"
      ).replace(/—/g, "-"),
      options: q.options.map(
        (
          opt: { id?: string; label?: string; value?: string; description?: string },
          oIdx: number
        ) => ({
          id: String(opt.id || opt.value || `opt_${idx + 3}_${oIdx + 1}`),
          label: String(opt.label || "").replace(/—/g, "-"),
          description: String(opt.description || "").replace(/—/g, "-"),
        })
      ),
    };
  });

  return {
    questions,
    source: "gemini",
    model_used: modelUsed,
  };
}

/**
 * Menganalisis jawaban fleksibel pengguna (pilihan multi-centang + jawaban ketikan sendiri)
 * untuk menyiapkan tampilan dashboard, kolom barang dinamis, satuan bawaan, dan fitur kasir yang pas.
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
  const formatStep = (s: StepAnswerInput) => {
    const picked =
      s.selectedLabels.length > 0
        ? s.selectedLabels.join("; ")
        : "(Tidak memilih opsi daftar)";
    const extra = s.customNote ? s.customNote : "-";
    return `Pertanyaan: "${s.question}"\n  Pilihan yang dicentang: ${picked}\n  Catatan tambahan pengguna: "${extra}"`;
  };

  const prompt = `Kamu adalah perancang halaman kasir dan toko online Warungin.
Baca baik-baik profil dan seluruh jawaban pemilik toko berikut, lalu sesuaikan fitur halaman kerja agar benar-benar pas dengan apa yang mereka jual dan butuhkan (jangan mengaktifkan fitur yang tidak mereka butuhkan supaya layar tetap rapi):

- Nama Toko: "${params.storeName}"
- Jenis Usaha: "${params.category}"
- Barang yang Dijual & Kebutuhan Utama: "${params.description}"
- Membuka Katalog Online WhatsApp: ${params.isOnlineEnabled ? "Ya" : "Tidak"}

Jawaban Langkah 3 (Stok & Ciri Barang):
${formatStep(params.step3)}

Jawaban Langkah 4 (Harga & Kasir):
${formatStep(params.step4)}

Jawaban Langkah 5 (Pembayaran, Pengantaran & Pengingat Stok):
${formatStep(params.step5)}

Kembalikan HANYA satu objek JSON murni dengan struktur persis berikut (gunakan bahasa sehari-hari yang mudah dipahami, tanpa tanda em-dash):
{
  "dashboard_template": "kode singkat seperti SEMBAKO_GROSIR | MAKANAN_EXPIRY | FASHION_VARIAN | ELEKTRONIK_GARANSI | RITEL_KUSTOM",
  "template_label": "Nama pengaturan tampilan yang ramah dan sesuai usaha mereka (contoh: Pengaturan Toko Pakan Hewan & Grosir, atau Pengaturan Konter Aksesoris & Garansi)",
  "enable_expiry_tracking": boolean (true HANYA jika barang mereka punya tanggal kadaluarsa / batas simpan yang perlu dipantau),
  "enable_variant_matrix": boolean (true jika barang mereka butuh kolom keterangan pembeda seperti Ukuran/Warna, Berat Kemasan, Rasa, Tipe HP, atau Masa Garansi),
  "custom_attribute_label": "Nama kolom pembeda barang yang paling cocok dengan jualan mereka (contoh: 'Ukuran & Warna', 'Berat / Kemasan', 'Tipe / Masa Garansi', 'Rasa / Pilihan'). Isi string singkat 2-3 kata.",
  "default_unit": "Satuan barang paling umum di toko mereka dalam 1 kata kecil (contoh: 'pcs', 'bungkus', 'kg', 'meter', 'botol', 'strip', 'porsi', 'karung')",
  "enable_wholesale_tier": boolean (true jika mereka melayani harga lebih murah untuk pembelian banyak / grosir),
  "enable_manual_discount": boolean (true jika mereka butuh fitur potongan harga / diskon langsung di kasir),
  "enable_shift_log": boolean (true jika kasir dijaga bergantian pagi/sore/malam oleh karyawan),
  "enable_debt_book": boolean (true jika mereka melayani catatan bon / bayar belakangan / kasbon pelanggan),
  "enable_delivery_note": boolean (true jika katalog online perlu pilihan Ambil di Toko atau Diantar ke Alamat Pembeli),
  "low_stock_threshold": number (angka batas pengingat sisa stok tipis yang masuk akal untuk usaha mereka, misal 3, 5, 10, atau sesuai angka yang disebut pengguna),
  "receipt_footer": "Kalimat penutup ramah di bagian bawah struk belanja toko ini (gunakan pesan pengguna jika mereka menuliskannya)",
  "ai_summary_reason": "Penjelasan ramah dalam 2 kalimat sederhana (mudah dipahami orang awam, tanpa kata teknis seperti ERP/SKU/Modul) tentang fitur apa saja yang sudah disiapkan untuk memudahkan jualan di toko mereka"
}`;

  const { parsed: rawParsed, modelUsed } = await generateJsonWithCascade(prompt);
  const parsed = rawParsed as Record<string, unknown>;

  if (
    typeof parsed.enable_expiry_tracking !== "boolean" ||
    typeof parsed.enable_variant_matrix !== "boolean" ||
    typeof parsed.enable_wholesale_tier !== "boolean" ||
    !parsed.template_label ||
    !parsed.ai_summary_reason
  ) {
    throw new Error("Hasil penyesuaian fitur dari Gemini AI belum lengkap.");
  }

  return {
    model_used: modelUsed,
    dashboard_template: String(parsed.dashboard_template || "RITEL_KUSTOM"),
    template_label: String(parsed.template_label).replace(/—/g, "-"),
    custom_attribute_label: String(
      parsed.custom_attribute_label || "Ukuran / Pilihan"
    ).replace(/—/g, "-"),
    default_unit: String(parsed.default_unit || "pcs")
      .trim()
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
    receipt_footer: String(
      parsed.receipt_footer ||
        `Terima kasih sudah berbelanja di ${params.storeName}.`
    ).replace(/—/g, "-"),
    ai_summary_reason: String(parsed.ai_summary_reason).replace(/—/g, "-"),
  };
}
