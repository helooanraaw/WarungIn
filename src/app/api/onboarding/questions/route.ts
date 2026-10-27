import { NextResponse } from "next/server";
import { generateOnboardingQuestionsAI } from "@/lib/ai-onboarding";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const storeName = String(body.store_name || "Toko Anda").trim();
    const category = String(
      body.category || "Toko Kelontong / Warung Sembako"
    ).trim();
    const description = String(body.description || "").trim();

    const result = await generateOnboardingQuestionsAI({
      storeName,
      category,
      description,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Gagal menyiapkan pertanyaan profil toko." },
      { status: 500 }
    );
  }
}
