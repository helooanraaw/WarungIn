import { NextResponse } from "next/server";
import { generateOnboardingQuestionsAI } from "@/lib/ai-onboarding";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const storeName = String(body.store_name || "").trim();
    const category = String(body.category || "").trim();
    const description = String(body.description || "").trim();

    if (!storeName || !description) {
      return NextResponse.json(
        {
          error:
            "Nama toko dan deskripsi singkat usaha wajib diisi agar AI dapat menyusun pertanyaan.",
        },
        { status: 400 }
      );
    }

    const result = await generateOnboardingQuestionsAI({
      storeName,
      category,
      description,
    });

    return NextResponse.json({
      questions: result.questions,
      source: result.source,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Gagal menghubungi Gemini AI untuk menyusun pertanyaan.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
