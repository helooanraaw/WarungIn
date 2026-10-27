import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { provisionModulesWithAI } from "@/lib/ai-onboarding";
import { sanitizeWaNumber, slugifyStoreName } from "@/lib/format";
import { MICRO_RET_QUOTAS } from "@/lib/quotas";

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
    const isOnlineEnabled = Boolean(body.is_online_enabled);
    const whatsappNumber = isOnlineEnabled
      ? sanitizeWaNumber(String(body.whatsapp_number || ""))
      : null;
    const accountHolderName = isOnlineEnabled
      ? String(body.account_holder_name || "").trim()
      : null;

    const answer3 = String(body.answer3 || "STANDARD_INVENTORY");
    const answer4 = String(body.answer4 || "SIMPLE_POS");
    const answer5 = String(body.answer5 || "NO_DEBT_10");

    if (!storeName || !category) {
      return NextResponse.json(
        { error: "Nama toko dan kategori usaha wajib diisi." },
        { status: 400 }
      );
    }

    if (isOnlineEnabled && (!whatsappNumber || !accountHolderName)) {
      return NextResponse.json(
        {
          error:
            "Nomor WhatsApp dan Nama Pemilik wajib diisi jika Katalog Online diaktifkan.",
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
          error: `Batas penyesuaian ulang otomatis (${MICRO_RET_QUOTAS.MAX_ONBOARDING_ATTEMPTS}x) telah tercapai. Anda tetap dapat mengubah modul secara manual di menu Pengaturan Toko.`,
        },
        { status: 400 }
      );
    }

    const provisioned = await provisionModulesWithAI({
      storeName,
      category,
      description,
      answer3,
      answer4,
      answer5,
    });

    const rawOnboardingJson = JSON.stringify({
      answer3,
      answer4,
      answer5,
      updatedAt: new Date().toISOString(),
    });

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
          is_online_enabled: isOnlineEnabled,
          whatsapp_number: whatsappNumber,
          account_holder_name: accountHolderName,
          onboarding_attempts: { increment: 1 },
          modules_config: {
            upsert: {
              create: {
                ...provisioned,
                raw_onboarding_json: rawOnboardingJson,
              },
              update: {
                ...provisioned,
                raw_onboarding_json: rawOnboardingJson,
              },
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
        description:
          description ||
          `Melayani kebutuhan ${category.toLowerCase()} dengan pelayanan cepat dan stok terjaga.`,
        is_online_enabled: isOnlineEnabled,
        whatsapp_number: whatsappNumber,
        account_holder_name: accountHolderName,
        onboarding_attempts: 1,
        modules_config: {
          create: {
            ...provisioned,
            raw_onboarding_json: rawOnboardingJson,
          },
        },
        products: {
          create: [
            {
              sku: "PRD-001",
              name: "Produk Contoh Unggulan 1",
              unit: "pcs",
              cost_price: 15000,
              sell_price: 20000,
              wholesale_price: provisioned.enable_wholesale_tier ? 18500 : null,
              wholesale_min_qty: provisioned.enable_wholesale_tier ? 5 : null,
              stock_qty: 25,
              is_online: true,
              variant_label: provisioned.enable_variant_matrix
                ? "Ukuran Standar"
                : null,
              expiry_date: provisioned.enable_expiry_tracking
                ? "2027-06-30"
                : null,
            },
            {
              sku: "PRD-002",
              name: "Produk Contoh Harian 2",
              unit: "pcs",
              cost_price: 8000,
              sell_price: 12000,
              wholesale_price: provisioned.enable_wholesale_tier ? 11000 : null,
              wholesale_min_qty: provisioned.enable_wholesale_tier ? 6 : null,
              stock_qty: 4,
              is_online: true,
              variant_label: provisioned.enable_variant_matrix
                ? "Varian Reguler"
                : null,
              expiry_date: provisioned.enable_expiry_tracking
                ? "2027-03-15"
                : null,
            },
          ],
        },
      },
      include: { modules_config: true },
    });

    return NextResponse.json({ store: newStore, provisioned });
  } catch (err) {
    console.error("Onboarding provision error:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan toko." },
      { status: 500 }
    );
  }
}
