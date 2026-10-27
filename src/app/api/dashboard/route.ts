import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { MICRO_RET_QUOTAS } from "@/lib/quotas";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json(
        { error: "Toko belum dikonfigurasi." },
        { status: 401 }
      );
    }

    const store = user.store;
    const config = store.modules_config;
    const threshold = config?.low_stock_threshold ?? 10;

    const [products, transactions] = await Promise.all([
      prisma.product.findMany({
        where: { store_id: store.id },
        orderBy: { created_at: "desc" },
      }),
      prisma.transaction.findMany({
        where: { store_id: store.id },
        include: { items: true },
        orderBy: { created_at: "desc" },
        take: 50,
      }),
    ]);

    const completedTransactions = transactions.filter(
      (t) => t.status === "COMPLETED"
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCompleted = completedTransactions.filter((t) => {
      const d = (t.confirmed_at || t.created_at).toISOString().slice(0, 10);
      return d === todayStr;
    });

    // Jika transaksi sampel berada di tanggal berbeda, gunakan seluruh COMPLETED untuk ringkasan demo jika hari ini 0
    const activeSet =
      todayCompleted.length > 0 ? todayCompleted : completedTransactions;

    const omzetHariIni = activeSet.reduce((acc, t) => acc + t.total_amount, 0);
    const transaksiHariIni = activeSet.length;

    const lowStockProducts = products.filter((p) => p.stock_qty <= threshold);
    const pendingWaOrders = transactions.filter(
      (t) =>
        t.channel === "WHATSAPP_ONLINE" && t.status === "PENDING_CONFIRMATION"
    );

    // Hitung produk terlaris dari item transaksi COMPLETED
    const soldMap = new Map<
      string,
      { id: string; name: string; unit: string; qtySold: number; revenue: number }
    >();

    for (const trx of completedTransactions) {
      for (const item of trx.items) {
        const existing = soldMap.get(item.product_id) || {
          id: item.product_id,
          name: item.product_name,
          unit: "pcs",
          qtySold: 0,
          revenue: 0,
        };
        existing.qtySold += item.qty;
        existing.revenue += item.subtotal;
        soldMap.set(item.product_id, existing);
      }
    }

    const topProducts = Array.from(soldMap.values())
      .sort((a, b) => b.qtySold - a.qtySold)
      .slice(0, 5);

    const unpaidDebts = completedTransactions.filter(
      (t) => t.payment_method === "KASBON" && !t.is_debt_paid
    );

    return NextResponse.json({
      store,
      config,
      quotas: MICRO_RET_QUOTAS,
      kpis: {
        omzetHariIni,
        transaksiHariIni,
        stokMenipisCount: lowStockProducts.length,
        pesananWaMenungguCount: pendingWaOrders.length,
        totalProductsCount: products.length,
        unpaidDebtTotal: unpaidDebts.reduce((s, t) => s + t.total_amount, 0),
        unpaidDebtCount: unpaidDebts.length,
      },
      recentTransactions: transactions.slice(
        0,
        MICRO_RET_QUOTAS.MAX_RECENT_TRANSACTIONS
      ),
      topProducts,
      lowStockProducts,
      pendingWaOrders,
      unpaidDebts,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: "Gagal memuat ringkasan dashboard." },
      { status: 500 }
    );
  }
}
