import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateWhatsAppOrderLink } from "@/lib/format";
import { MICRO_RET_QUOTAS } from "@/lib/quotas";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        modules_config: true,
        products: {
          where: { is_online: true },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!store || !store.is_online_enabled) {
      return NextResponse.json(
        { error: "Katalog toko tidak ditemukan atau sedang tidak aktif." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      store: {
        id: store.id,
        store_name: store.store_name,
        slug: store.slug,
        category: store.category,
        description: store.description,
        address: store.address,
        logo_url: store.logo_url,
        banner_url: store.banner_url,
        whatsapp_number: store.whatsapp_number,
        account_holder_name: store.account_holder_name,
        modules_config: store.modules_config,
      },
      products: store.products,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat katalog toko." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const store = await prisma.store.findUnique({
      where: { slug },
      include: { modules_config: true },
    });

    if (!store || !store.is_online_enabled) {
      return NextResponse.json(
        { error: "Toko tidak menerima pesanan online saat ini." },
        { status: 404 }
      );
    }

    const pendingCount = await prisma.transaction.count({
      where: {
        store_id: store.id,
        channel: "WHATSAPP_ONLINE",
        status: "PENDING_CONFIRMATION",
      },
    });

    if (pendingCount >= MICRO_RET_QUOTAS.MAX_PENDING_WA_ORDERS) {
      return NextResponse.json(
        {
          error:
            "Antrean pesanan online toko sedang penuh. Silakan hubungi WhatsApp toko secara langsung.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const customerName = String(body.customer_name || "").trim();
    const customerWa = String(body.customer_wa || "").trim();
    const deliveryMethod = String(body.delivery_method || "").trim();
    const rawCustomerNote = String(body.customer_note || "").trim();

    const combinedNoteParts: string[] = [];
    if (deliveryMethod === "DIANTAR") {
      combinedNoteParts.push("[Minta Diantar]");
    } else if (deliveryMethod === "AMBIL_SENDIRI") {
      combinedNoteParts.push("[Ambil di Toko]");
    }
    if (rawCustomerNote) {
      combinedNoteParts.push(rawCustomerNote);
    }
    const customerNote = combinedNoteParts.join(" ");

    const rawItems: { product_id: string; qty: number }[] = Array.isArray(
      body.items
    )
      ? body.items
      : [];

    if (!customerName || !customerWa) {
      return NextResponse.json(
        { error: "Nama Anda dan nomor WhatsApp wajib diisi." },
        { status: 400 }
      );
    }

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal 1 barang untuk dipesan." },
        { status: 400 }
      );
    }

    if (rawItems.length > MICRO_RET_QUOTAS.MAX_ITEMS_PER_TRANSACTION) {
      return NextResponse.json(
        {
          error: `Maksimal ${MICRO_RET_QUOTAS.MAX_ITEMS_PER_TRANSACTION} jenis barang per pesanan.`,
        },
        { status: 400 }
      );
    }

    let totalAmount = 0;
    let discountTotal = 0;
    const orderItemsData: {
      product_id: string;
      product_name: string;
      unit_price: number;
      normal_price: number;
      qty: number;
      subtotal: number;
    }[] = [];

    for (const item of rawItems) {
      const qty = Math.max(1, Number(item.qty || 1));
      const product = await prisma.product.findFirst({
        where: { id: item.product_id, store_id: store.id, is_online: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: "Salah satu barang tidak tersedia di katalog online." },
          { status: 400 }
        );
      }

      if (product.stock_qty < qty) {
        return NextResponse.json(
          {
            error: `Stok "${product.name}" hanya tersisa ${product.stock_qty} ${product.unit}.`,
          },
          { status: 400 }
        );
      }

      const normalPrice = product.sell_price;
      let unitPrice = normalPrice;
      if (
        store.modules_config?.enable_wholesale_tier &&
        product.wholesale_price &&
        product.wholesale_min_qty &&
        qty >= product.wholesale_min_qty
      ) {
        unitPrice = product.wholesale_price;
      }

      const subtotal = unitPrice * qty;
      const itemDiscount = Math.max(0, (normalPrice - unitPrice) * qty);
      totalAmount += subtotal;
      discountTotal += itemDiscount;

      const labelName =
        store.modules_config?.enable_variant_matrix && product.variant_label
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
    }

    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randPart = String(Math.floor(100 + Math.random() * 900));
    const invoiceCode = `WA-${datePart}-${randPart}`;

    const transaction = await prisma.transaction.create({
      data: {
        store_id: store.id,
        invoice_code: invoiceCode,
        channel: "WHATSAPP_ONLINE",
        status: "PENDING_CONFIRMATION",
        payment_method: "TRANSFER",
        customer_name: customerName,
        customer_wa: customerWa,
        customer_note: customerNote || null,
        is_debt_paid: true,
        discount_total: discountTotal,
        total_amount: totalAmount,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    const waUrl = generateWhatsAppOrderLink({
      storePhone: store.whatsapp_number || "",
      storeName: store.store_name,
      accountHolder: store.account_holder_name || "Pemilik Toko",
      invoiceCode,
      customerName,
      customerWa,
      customerNote,
      items: orderItemsData.map((i) => ({
        name: i.product_name,
        qty: i.qty,
        price: i.unit_price,
      })),
      totalAmount,
    });

    return NextResponse.json({
      transaction,
      wa_url: waUrl,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal membuat pesanan WhatsApp." },
      { status: 500 }
    );
  }
}
