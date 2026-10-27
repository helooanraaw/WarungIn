import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: { is_online_enabled: true },
      include: {
        products: {
          where: { is_online: true, stock_qty: { gt: 0 } },
          take: 4,
          orderBy: { created_at: "desc" },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const products = stores.flatMap((store) =>
      store.products.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        sell_price: p.sell_price,
        stock_qty: p.stock_qty,
        variant_label: p.variant_label,
        store: {
          id: store.id,
          store_name: store.store_name,
          slug: store.slug,
          category: store.category,
        },
      }))
    );

    return NextResponse.json({
      stores: stores.map((s) => ({
        id: s.id,
        store_name: s.store_name,
        slug: s.slug,
        category: s.category,
        description: s.description,
      })),
      products: products.slice(0, 12),
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat etalase produk toko." },
      { status: 500 }
    );
  }
}
