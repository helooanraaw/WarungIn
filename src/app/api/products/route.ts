import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { MICRO_RET_QUOTAS } from "@/lib/quotas";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { store_id: user.store.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      products,
      config: user.store.modules_config,
      quota: {
        used: products.length,
        max: MICRO_RET_QUOTAS.MAX_PRODUCTS_PER_STORE,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat daftar produk." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const currentCount = await prisma.product.count({
      where: { store_id: user.store.id },
    });

    if (currentCount >= MICRO_RET_QUOTAS.MAX_PRODUCTS_PER_STORE) {
      return NextResponse.json(
        {
          error: `Batas maksimal produk (${MICRO_RET_QUOTAS.MAX_PRODUCTS_PER_STORE} SKU) untuk toko skala mikro telah tercapai. Hapus produk lama terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const sku =
      String(body.sku || "").trim() ||
      `SKU-${String(currentCount + 1).padStart(3, "0")}`;
    const unit = String(body.unit || "pcs").trim();
    const cost_price = Math.max(0, Number(body.cost_price || 0));
    const sell_price = Math.max(0, Number(body.sell_price || 0));
    const stock_qty = Math.max(0, Number(body.stock_qty || 0));
    const is_online =
      body.is_online !== undefined ? Boolean(body.is_online) : true;
    const wholesale_price = body.wholesale_price
      ? Number(body.wholesale_price)
      : null;
    const wholesale_min_qty = body.wholesale_min_qty
      ? Number(body.wholesale_min_qty)
      : null;
    const variant_label = body.variant_label
      ? String(body.variant_label).trim()
      : null;
    const expiry_date = body.expiry_date
      ? String(body.expiry_date).trim()
      : null;

    if (!name || sell_price <= 0) {
      return NextResponse.json(
        { error: "Nama produk dan harga jual wajib diisi dengan benar." },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        store_id: user.store.id,
        sku,
        name,
        unit,
        cost_price,
        sell_price,
        wholesale_price,
        wholesale_min_qty,
        stock_qty,
        is_online,
        variant_label,
        expiry_date,
      },
    });

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: "Gagal menambahkan produk baru." },
      { status: 500 }
    );
  }
}
