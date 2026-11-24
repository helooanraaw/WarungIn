import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { MICRO_RET_QUOTAS } from "@/lib/quotas";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json(
        { error: "Tidak terautentikasi." },
        { status: 401 }
      );
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
    const rawCashReceived =
      body.cash_received !== undefined ? Number(body.cash_received) : null;
    const requestedManualDiscount = Math.max(
      0,
      Number(body.manual_discount || 0)
    );

    if (
      paymentMethod === "KASBON" &&
      (!customerName || customerName === "Pembeli Umum")
    ) {
      return NextResponse.json(
        { error: "Nama pelanggan wajib diisi untuk catatan bon / kasbon." },
        { status: 400 }
      );
    }

    const createdTransaction = await prisma.$transaction(async (tx) => {
      let itemsSubtotal = 0;
      let wholesaleSaved = 0;
      const orderItemsData: {
        product_id: string;
        product_name: string;
        unit_price: number;
        normal_price: number;
        qty: number;
        subtotal: number;
      }[] = [];

      for (const reqItem of rawItems) {
        const qty = Math.max(1, Number(reqItem.qty || 1));
        const product = await tx.product.findFirst({
          where: { id: reqItem.product_id, store_id: store.id },
        });

        if (!product) {
          throw new Error("Barang tidak ditemukan di toko Anda.");
        }

        if (product.stock_qty < qty) {
          throw new Error(
            `Stok "${product.name}" tidak mencukupi (tersedia ${product.stock_qty} ${product.unit}, diminta ${qty}).`
          );
        }

        const normalPrice = product.sell_price;
        let unitPrice = normalPrice;
        if (
          config?.enable_wholesale_tier &&
          product.wholesale_price &&
          product.wholesale_min_qty &&
          qty >= product.wholesale_min_qty
        ) {
          unitPrice = product.wholesale_price;
        }

        const subtotal = unitPrice * qty;
        const itemDiscount = Math.max(0, (normalPrice - unitPrice) * qty);
        itemsSubtotal += subtotal;
        wholesaleSaved += itemDiscount;

        const labelName =
          config?.enable_variant_matrix && product.variant_label
            ? `${product.name} (${product.variant_label})`
            : product.name;

        orderItemsData.push({
          product_id: product.id,
          product_name: labelName,
          unit_price: unitPrice,
          normal_price: normalPrice,
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

      const manualDiscount = config?.enable_manual_discount
        ? Math.min(itemsSubtotal, requestedManualDiscount)
        : 0;
      const finalTotal = Math.max(0, itemsSubtotal - manualDiscount);
      const totalDiscount = wholesaleSaved + manualDiscount;

      const cashReceived =
        paymentMethod === "TUNAI"
          ? Math.max(finalTotal, rawCashReceived ?? finalTotal)
          : finalTotal;
      const changeAmount =
        paymentMethod === "TUNAI" ? Math.max(0, cashReceived - finalTotal) : 0;

      const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
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
          discount_total: totalDiscount,
          manual_discount: manualDiscount,
          total_amount: finalTotal,
          cash_received: cashReceived,
          change_amount: changeAmount,
          confirmed_at: new Date(),
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      return trx;
    });

    return NextResponse.json({
      transaction: createdTransaction,
      store: {
        store_name: store.store_name,
        category: store.category,
        address: store.address,
        logo_url: store.logo_url,
        whatsapp_number: store.whatsapp_number,
        receipt_footer:
          config?.receipt_footer ||
          `Terima kasih sudah berbelanja di ${store.store_name}.`,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal memproses transaksi kasir.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
