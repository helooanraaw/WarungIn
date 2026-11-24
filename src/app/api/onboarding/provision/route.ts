import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import {
  provisionModulesWithAI,
  type StepAnswerInput,
} from "@/lib/ai-onboarding";
import { sanitizeWaNumber, slugifyStoreName } from "@/lib/format";
import { MICRO_RET_QUOTAS } from "@/lib/quotas";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function parseStepInput(raw: unknown, fallbackQuestion: string): StepAnswerInput {
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return {
      question: String(obj.question || fallbackQuestion),
      selectedLabels: Array.isArray(obj.selectedLabels)
        ? obj.selectedLabels.map((x) => String(x))
        : [],
      customNote: String(obj.customNote || "").trim(),
    };
  }
  return {
    question: fallbackQuestion,
    selectedLabels: raw ? [String(raw)] : [],
    customNote: "",
  };
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sesi berakhir. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const storeName = String(body.store_name || "").trim();
    const category = String(body.category || "").trim();
    const description = String(body.description || "").trim();
    const address = body.address ? String(body.address).trim() : null;
    const logoUrl = body.logo_url ? String(body.logo_url) : null;
    const bannerUrl = body.banner_url ? String(body.banner_url) : null;

    const isOnlineEnabled = Boolean(body.is_online_enabled);
    const whatsappNumber = isOnlineEnabled
      ? sanitizeWaNumber(String(body.whatsapp_number || ""))
      : null;
    const accountHolderName = isOnlineEnabled
      ? String(body.account_holder_name || user.name || "").trim()
      : user.name || null;

    const step3 = parseStepInput(body.step3, "Ciri barang & catatan stok");
    const step4 = parseStepInput(body.step4, "Cara jualan & harga di kasir");
    const step5 = parseStepInput(body.step5, "Pembayaran & pengingat stok");

    if (!storeName || !category) {
      return NextResponse.json(
        { error: "Nama toko dan jenis usaha wajib diisi." },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          error:
            "Mohon ceritakan singkat barang apa saja yang Anda jual agar tampilan toko bisa disesuaikan.",
        },
        { status: 400 }
      );
    }

    if (isOnlineEnabled && (!whatsappNumber || !accountHolderName)) {
      return NextResponse.json(
        {
          error:
            "Nomor WhatsApp dan Nama Penerima wajib diisi jika halaman toko online diaktifkan.",
        },
        { status: 400 }
      );
    }

    if (
      user.store &&
      user.store.onboarding_attempts >= MICRO_RET_QUOTAS.MAX_ONBOARDING_ATTEMPTS
    ) {
      return NextResponse.json(
        {
          error: `Batas penyesuaian ulang otomatis (${MICRO_RET_QUOTAS.MAX_ONBOARDING_ATTEMPTS}x) telah tercapai. Anda tetap bebas mengubah semua fitur kapan saja di menu Pengaturan Toko.`,
        },
        { status: 400 }
      );
    }

    const provisioned = await provisionModulesWithAI({
      storeName,
      category,
      description,
      isOnlineEnabled,
      step3,
      step4,
      step5,
    });

    const rawOnboardingJson = JSON.stringify({
      model_used: provisioned.model_used,
      retail_description: description,
      step3,
      step4,
      step5,
      updatedAt: new Date().toISOString(),
    });

    const configData = {
      dashboard_template: provisioned.dashboard_template,
      template_label: provisioned.template_label,
      custom_attribute_label: provisioned.custom_attribute_label,
      default_unit: provisioned.default_unit,
      enable_expiry_tracking: provisioned.enable_expiry_tracking,
      enable_variant_matrix: provisioned.enable_variant_matrix,
      enable_wholesale_tier: provisioned.enable_wholesale_tier,
      enable_manual_discount: provisioned.enable_manual_discount,
      enable_shift_log: provisioned.enable_shift_log,
      enable_debt_book: provisioned.enable_debt_book,
      enable_delivery_note: provisioned.enable_delivery_note,
      low_stock_threshold: provisioned.low_stock_threshold,
      receipt_footer: provisioned.receipt_footer,
      ai_summary_reason: provisioned.ai_summary_reason,
      raw_onboarding_json: rawOnboardingJson,
    };

    let baseSlug = slugifyStoreName(storeName) || "toko-umkm";
    const slugConflict = await prisma.store.findUnique({
      where: { slug: baseSlug },
    });
    if (slugConflict && slugConflict.user_id !== user.id) {
      baseSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (user.store) {
      const updatedStore = await prisma.store.update({
        where: { id: user.store.id },
        data: {
          store_name: storeName,
          category,
          description,
          address: address ?? user.store.address,
          logo_url: logoUrl !== null ? logoUrl : user.store.logo_url,
          banner_url: bannerUrl !== null ? bannerUrl : user.store.banner_url,
          is_online_enabled: isOnlineEnabled,
          whatsapp_number: whatsappNumber,
          account_holder_name: accountHolderName,
          onboarding_attempts: { increment: 1 },
          modules_config: {
            upsert: {
              create: configData,
              update: configData,
            },
          },
        },
        include: { modules_config: true },
      });

      return NextResponse.json({ store: updatedStore, provisioned });
    }

    const newStore = await prisma.store.create({
      data: {
        user_id: user.id,
        store_name: storeName,
        slug: baseSlug,
        category,
        description,
        address,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        is_online_enabled: isOnlineEnabled,
        whatsapp_number: whatsappNumber,
        account_holder_name: accountHolderName,
        onboarding_attempts: 1,
        modules_config: {
          create: configData,
        },
      },
      include: { modules_config: true },
    });

    return NextResponse.json({ store: newStore, provisioned });
  } catch (err: unknown) {
    console.error("Onboarding provision error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Gagal memproses pengaturan toko dengan Gemini AI.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
