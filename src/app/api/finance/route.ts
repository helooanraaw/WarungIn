import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json(
        { error: "Toko belum dikonfigurasi." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";
    const startDate = getPeriodStart(period);

    const store = user.store;

    const [transactions, expenses, products] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          store_id: store.id,
          status: "COMPLETED",
          ...(startDate ? { created_at: { gte: startDate } } : {}),
        },
        include: { items: true },
        orderBy: { created_at: "desc" },
      }),
      prisma.expense.findMany({
        where: {
          store_id: store.id,
          ...(startDate ? { spent_at: { gte: startDate } } : {}),
        },
        orderBy: { spent_at: "desc" },
      }),
      prisma.product.findMany({
        where: { store_id: store.id },
        select: { id: true, cost_price: true, stock_qty: true },
      }),
    ]);

    const costMap = new Map<string, number>();
    let totalInventoryCostValue = 0;
    for (const p of products) {
      costMap.set(p.id, p.cost_price);
      totalInventoryCostValue += p.cost_price * Math.max(0, p.stock_qty);
    }

    let totalRevenue = 0;
    let totalCostOfGoods = 0;
    let totalDiscounts = 0;
    let unpaidDebtTotal = 0;

    const byPaymentMethod: Record<string, { count: number; total: number }> = {
      TUNAI: { count: 0, total: 0 },
      QRIS: { count: 0, total: 0 },
      TRANSFER: { count: 0, total: 0 },
      KASBON: { count: 0, total: 0 },
    };

    const byChannel: Record<string, { count: number; total: number }> = {
      OFFLINE_POS: { count: 0, total: 0 },
      WHATSAPP_ONLINE: { count: 0, total: 0 },
    };

    for (const trx of transactions) {
      totalRevenue += trx.total_amount;
      totalDiscounts += trx.discount_total + trx.manual_discount;
      if (trx.payment_method === "KASBON" && !trx.is_debt_paid) {
        unpaidDebtTotal += trx.total_amount;
      }

      if (!byPaymentMethod[trx.payment_method]) {
        byPaymentMethod[trx.payment_method] = { count: 0, total: 0 };
      }
      byPaymentMethod[trx.payment_method].count += 1;
      byPaymentMethod[trx.payment_method].total += trx.total_amount;

      if (!byChannel[trx.channel]) {
        byChannel[trx.channel] = { count: 0, total: 0 };
      }
      byChannel[trx.channel].count += 1;
      byChannel[trx.channel].total += trx.total_amount;

      for (const item of trx.items) {
        const unitCost = costMap.get(item.product_id) ?? 0;
        totalCostOfGoods += unitCost * item.qty;
      }
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalRevenue - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;

    return NextResponse.json({
      period,
      generatedAt: new Date().toISOString(),
      store: {
        store_name: store.store_name,
        category: store.category,
        address: store.address,
        logo_url: store.logo_url,
        whatsapp_number: store.whatsapp_number,
        account_holder_name: store.account_holder_name,
      },
      config: store.modules_config,
      summary: {
        totalRevenue,
        totalCostOfGoods,
        grossProfit,
        totalExpenses,
        netProfit,
        totalDiscounts,
        unpaidDebtTotal,
        transactionCount: transactions.length,
        expenseCount: expenses.length,
        totalInventoryCostValue,
      },
      byPaymentMethod,
      byChannel,
      transactions: transactions.map((t) => ({
        id: t.id,
        invoice_code: t.invoice_code,
        channel: t.channel,
        payment_method: t.payment_method,
        is_debt_paid: t.is_debt_paid,
        customer_name: t.customer_name,
        total_amount: t.total_amount,
        created_at: t.created_at,
        item_count: t.items.reduce((s, i) => s + i.qty, 0),
      })),
      expenses,
    });
  } catch (err) {
    console.error("Finance GET error:", err);
    return NextResponse.json(
      { error: "Gagal memuat rekap keuangan." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json(
        { error: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const title = String(body.title || "").trim();
    const category = String(body.category || "Belanja Stok").trim();
    const amount = Math.round(Number(body.amount || 0));
    const note = body.note ? String(body.note).trim() : null;
    const spentAt = body.spent_at ? new Date(String(body.spent_at)) : new Date();

    if (!title || amount <= 0 || Number.isNaN(spentAt.getTime())) {
      return NextResponse.json(
        { error: "Nama pengeluaran dan nominal lebih dari Rp 0 wajib diisi." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        store_id: user.store.id,
        title,
        category,
        amount,
        note,
        spent_at: spentAt,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    console.error("Finance POST error:", err);
    return NextResponse.json(
      { error: "Gagal mencatat pengeluaran." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json(
        { error: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID pengeluaran tidak ditemukan." },
        { status: 400 }
      );
    }

    const existing = await prisma.expense.findFirst({
      where: { id, store_id: user.store.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Catatan pengeluaran tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.expense.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Finance DELETE error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus pengeluaran." },
      { status: 500 }
    );
  }
}
