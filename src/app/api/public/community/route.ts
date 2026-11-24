import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get("stores_limit"));
    const storesLimit =
      Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : null;
    const [stores, activeProducts, completedItems] = await Promise.all([
      prisma.store.findMany({
        where: {
          is_online_enabled: true,
          products: {
            some: { is_online: true, stock_qty: { gt: 0 } },
          },
        },
        include: {
          _count: {
            select: {
              products: {
                where: { is_online: true, stock_qty: { gt: 0 } },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.product.findMany({
        where: {
          is_online: true,
          stock_qty: { gt: 0 },
          store: { is_online_enabled: true },
        },
        include: {
          store: {
            select: {
              id: true,
              store_name: true,
              slug: true,
              category: true,
              logo_url: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.orderItem.findMany({
        where: {
          transaction: { status: "COMPLETED" },
        },
        select: {
          product_id: true,
          qty: true,
          transaction: {
            select: { store_id: true },
          },
        },
      }),
    ]);

    const productSoldMap = new Map<string, number>();
    const storeSoldMap = new Map<string, number>();

    for (const item of completedItems) {
      productSoldMap.set(
        item.product_id,
        (productSoldMap.get(item.product_id) ?? 0) + item.qty
      );
      storeSoldMap.set(
        item.transaction.store_id,
        (storeSoldMap.get(item.transaction.store_id) ?? 0) + item.qty
      );
    }

    const formattedStores = stores
      .map((s) => ({
        id: s.id,
        store_name: s.store_name,
        slug: s.slug,
        category: s.category,
        description: s.description,
        address: s.address,
        logo_url: s.logo_url,
        banner_url: s.banner_url,
        product_count: s._count.products,
        total_sold: storeSoldMap.get(s.id) ?? 0,
        has_whatsapp: Boolean(s.whatsapp_number),
        created_at: s.created_at.getTime(),
      }))
      .sort((a, b) => b.total_sold - a.total_sold || b.created_at - a.created_at)
      .map(({ created_at, ...store }) => store);

    const topProducts = activeProducts
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        product_category: p.product_category,
        image_url: p.image_url,
        unit: p.unit,
        sell_price: p.sell_price,
        stock_qty: p.stock_qty,
        variant_label: p.variant_label,
        total_sold: productSoldMap.get(p.id) ?? 0,
        created_at: p.created_at.getTime(),
        store: p.store,
      }))
      .sort((a, b) => b.total_sold - a.total_sold || b.created_at - a.created_at)
      .slice(0, 4)
      .map(({ created_at, ...product }) => product);

    return NextResponse.json({
      total_stores: formattedStores.length,
      stores: storesLimit
        ? formattedStores.slice(0, storesLimit)
        : formattedStores,
      products: topProducts,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat etalase produk toko." },
      { status: 500 }
    );
  }
}
