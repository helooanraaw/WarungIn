import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sanitizeWaNumber } from "@/lib/format";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json(
        { error: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      store: user.store,
      config: user.store.modules_config,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat pengaturan toko." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json(
        { error: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const store = user.store;

    const store_name = String(body.store_name || store.store_name).trim();
    const category = String(body.category || store.category).trim();
    const description = String(body.description ?? store.description).trim();
    const address =
      body.address !== undefined
        ? body.address
          ? String(body.address).trim()
          : null
        : store.address;
    const logo_url =
      body.logo_url !== undefined
        ? body.logo_url
          ? String(body.logo_url)
          : null
        : store.logo_url;
    const banner_url =
      body.banner_url !== undefined
        ? body.banner_url
          ? String(body.banner_url)
          : null
        : store.banner_url;

    const is_online_enabled =
      body.is_online_enabled !== undefined
        ? Boolean(body.is_online_enabled)
        : store.is_online_enabled;
    const whatsapp_number = body.whatsapp_number
      ? sanitizeWaNumber(String(body.whatsapp_number))
      : store.whatsapp_number;
    const account_holder_name =
      body.account_holder_name !== undefined
        ? String(body.account_holder_name).trim()
        : store.account_holder_name;

    const custom_attribute_label =
      body.custom_attribute_label !== undefined
        ? String(body.custom_attribute_label).trim() || "Ukuran / Pilihan"
        : store.modules_config?.custom_attribute_label || "Ukuran / Pilihan";
    const default_unit =
      body.default_unit !== undefined
        ? String(body.default_unit).trim() || "pcs"
        : store.modules_config?.default_unit || "pcs";

    const enable_expiry_tracking = Boolean(body.enable_expiry_tracking);
    const enable_variant_matrix = Boolean(body.enable_variant_matrix);
    const enable_wholesale_tier = Boolean(body.enable_wholesale_tier);
    const enable_manual_discount = Boolean(body.enable_manual_discount);
    const enable_shift_log = Boolean(body.enable_shift_log);
    const enable_debt_book = Boolean(body.enable_debt_book);
    const enable_delivery_note =
      body.enable_delivery_note !== undefined
        ? Boolean(body.enable_delivery_note)
        : store.modules_config?.enable_delivery_note ?? true;
    const low_stock_threshold = Math.max(
      1,
      Number(body.low_stock_threshold || 10)
    );
    const receipt_footer =
      body.receipt_footer !== undefined
        ? String(body.receipt_footer).trim()
        : store.modules_config?.receipt_footer ||
          `Terima kasih sudah berbelanja di ${store_name}.`;

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        store_name,
        category,
        description,
        address,
        logo_url,
        banner_url,
        is_online_enabled,
        whatsapp_number,
        account_holder_name,
        modules_config: {
          upsert: {
            create: {
              custom_attribute_label,
              default_unit,
              enable_expiry_tracking,
              enable_variant_matrix,
              enable_wholesale_tier,
              enable_manual_discount,
              enable_shift_log,
              enable_debt_book,
              enable_delivery_note,
              low_stock_threshold,
              receipt_footer,
            },
            update: {
              custom_attribute_label,
              default_unit,
              enable_expiry_tracking,
              enable_variant_matrix,
              enable_wholesale_tier,
              enable_manual_discount,
              enable_shift_log,
              enable_debt_book,
              enable_delivery_note,
              low_stock_threshold,
              receipt_footer,
            },
          },
        },
      },
      include: { modules_config: true },
    });

    return NextResponse.json({
      store: updatedStore,
      config: updatedStore.modules_config,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan toko." },
      { status: 500 }
    );
  }
}
