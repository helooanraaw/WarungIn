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
    const body = await req.json();
    const action = String(body.action || "");

    const existing = await prisma.transaction.findFirst({
      where: { id, store_id: user.store.id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    // 1. Konfirmasi Pesanan WhatsApp (Potong Stok Fisik Secara Atomik)
    if (action === "CONFIRM_WA") {
      if (existing.status !== "PENDING_CONFIRMATION") {
        return NextResponse.json(
          { error: "Pesanan ini sudah diproses sebelumnya." },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        for (const item of existing.items) {
          const product = await tx.product.findFirst({
            where: { id: item.product_id, store_id: user.store!.id },
          });

          if (!product) {
            throw new Error(
              `Produk "${item.product_name}" sudah dihapus dari daftar inventori.`
            );
          }

          if (product.stock_qty < item.qty) {
            throw new Error(
              `Stok "${product.name}" tidak cukup untuk memenuhi pesanan ini (Stok fisik: ${product.stock_qty}, Pesanan: ${item.qty}).`
            );
          }

          await tx.product.update({
            where: { id: product.id },
            data: {
              stock_qty: { decrement: item.qty },
            },
          });
        }

        return tx.transaction.update({
          where: { id: existing.id },
          data: {
            status: "COMPLETED",
            confirmed_at: new Date(),
            payment_method: body.payment_method
              ? String(body.payment_method)
              : existing.payment_method,
          },
          include: { items: true },
        });
      });

      return NextResponse.json({ transaction: updated });
    }

    // 2. Batalkan Pesanan WhatsApp (Stok Fisik Tidak Berubah)
    if (action === "CANCEL_WA") {
      if (existing.status !== "PENDING_CONFIRMATION") {
        return NextResponse.json(
          { error: "Hanya pesanan berstatus Menunggu yang dapat dibatalkan." },
          { status: 400 }
        );
      }

      const updated = await prisma.transaction.update({
        where: { id: existing.id },
        data: { status: "CANCELLED" },
        include: { items: true },
      });

      return NextResponse.json({ transaction: updated });
    }

    // 3. Tandai Lunas Kasbon Pelanggan
    if (action === "MARK_DEBT_PAID") {
      const updated = await prisma.transaction.update({
        where: { id: existing.id },
        data: { is_debt_paid: true },
        include: { items: true },
      });

      return NextResponse.json({ transaction: updated });
    }

    return NextResponse.json(
      { error: "Tindakan tidak dikenali." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal memperbarui status transaksi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
