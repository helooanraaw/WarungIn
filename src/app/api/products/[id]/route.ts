import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.product.findFirst({
      where: { id, store_id: user.store.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Penyesuaian stok cepat (+ / - / set)
    if (body.stock_delta !== undefined) {
      const nextStock = Math.max(0, existing.stock_qty + Number(body.stock_delta));
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: { stock_qty: nextStock },
      });
      return NextResponse.json({ product: updated });
    }

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: {
        sku: body.sku !== undefined ? String(body.sku).trim() : existing.sku,
        name: body.name !== undefined ? String(body.name).trim() : existing.name,
        unit: body.unit !== undefined ? String(body.unit).trim() : existing.unit,
        cost_price:
          body.cost_price !== undefined
            ? Math.max(0, Number(body.cost_price))
            : existing.cost_price,
        sell_price:
          body.sell_price !== undefined
            ? Math.max(0, Number(body.sell_price))
            : existing.sell_price,
        wholesale_price:
          body.wholesale_price !== undefined
            ? body.wholesale_price
              ? Number(body.wholesale_price)
              : null
            : existing.wholesale_price,
        wholesale_min_qty:
          body.wholesale_min_qty !== undefined
            ? body.wholesale_min_qty
              ? Number(body.wholesale_min_qty)
              : null
            : existing.wholesale_min_qty,
        stock_qty:
          body.stock_qty !== undefined
            ? Math.max(0, Number(body.stock_qty))
            : existing.stock_qty,
        is_online:
          body.is_online !== undefined
            ? Boolean(body.is_online)
            : existing.is_online,
        variant_label:
          body.variant_label !== undefined
            ? body.variant_label
              ? String(body.variant_label).trim()
              : null
            : existing.variant_label,
        expiry_date:
          body.expiry_date !== undefined
            ? body.expiry_date
              ? String(body.expiry_date).trim()
              : null
            : existing.expiry_date,
      },
    });

    return NextResponse.json({ product: updated });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui produk." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.product.findFirst({
      where: { id, store_id: user.store.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.product.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}
