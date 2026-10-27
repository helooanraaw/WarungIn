import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { MICRO_RET_QUOTAS } from "@/lib/quotas";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const store = user.store;
    const config = store.modules_config;
    const body = await req.json();

    const rawItems: { product_id: string; qty: number }[] = Array.isArray(
      body.items
    )
      ? body.items
      : [];

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "Keranjang belanja masih kosong." },
        { status: 400 }
      );
    }

    if (rawItems.length > MICRO_RET_QUOTAS.MAX_ITEMS_PER_TRANSACTION) {
      return NextResponse.json(
        {
          error: `Maksimal ${MICRO_RET_QUOTAS.MAX_ITEMS_PER_TRANSACTION} jenis barang per transaksi.`,
        },
        { status: 400 }
      );
    }

    const paymentMethod = String(body.payment_method || "TUNAI");
    const customerName = String(body.customer_name || "Pembeli Umum").trim();
    const customerWa = body.customer_wa ? String(body.customer_wa).trim() : null;
    const customerNote = body.customer_note
      ? String(body.customer_note).trim()
      : null;
    const shiftName = body.shift_name ? String(body.shift_name).trim() : null;

    if (paymentMethod === "KASBON" && (!customerName || customerName === "Pembeli Umum")) {
      return NextResponse.json(
        { error: "Nama pelanggan wajib diisi untuk transaksi Kasbon." },
        { status: 400 }
      );
    }

    // Eksekusi atomik: cek stok, potong stok, simpan transaksi
    const createdTransaction = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData: {
        product_id: string;
        product_name: string;
        unit_price: number;
        qty: number;
        subtotal: number;
      }[] = [];

      for (const reqItem of rawItems) {
        const qty = Math.max(1, Number(reqItem.qty || 1));
        const product = await tx.product.findFirst({
          where: { id: reqItem.product_id, store_id: store.id },
        });

        if (!product) {
          throw new Error("Produk tidak ditemukan di toko Anda.");
        }

        if (product.stock_qty < qty) {
          throw new Error(
            `Stok "${product.name}" tidak mencukupi (tersedia ${product.stock_qty} ${product.unit}, diminta ${qty}).`
          );
        }

        // Cek apakah harga grosir berlaku
        let unitPrice = product.sell_price;
        if (
          config?.enable_wholesale_tier &&
          product.wholesale_price &&
          product.wholesale_min_qty &&
          qty >= product.wholesale_min_qty
        ) {
          unitPrice = product.wholesale_price;
        }

        const subtotal = unitPrice * qty;
        totalAmount += subtotal;

        const labelName =
          config?.enable_variant_matrix && product.variant_label
            ? `${product.name} (${product.variant_label})`
            : product.name;

        orderItemsData.push({
          product_id: product.id,
          product_name: labelName,
          unit_price: unitPrice,
          qty,
          subtotal,
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            stock_qty: { decrement: qty },
          },
        });
      }

      const datePart = new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, "");
      const randPart = String(Math.floor(100 + Math.random() * 900));
      const invoiceCode = `INV-${datePart}-${randPart}`;

      const trx = await tx.transaction.create({
        data: {
          store_id: store.id,
          invoice_code: invoiceCode,
          channel: "OFFLINE_POS",
          status: "COMPLETED",
          payment_method: paymentMethod,
          customer_name: customerName,
          customer_wa: customerWa,
          customer_note: customerNote,
          shift_name: shiftName,
          is_debt_paid: paymentMethod !== "KASBON",
          total_amount: totalAmount,
          confirmed_at: new Date(),
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      return trx;
    });

    return NextResponse.json({ transaction: createdTransaction });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal memproses transaksi kasir.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
