import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { MICRO_RET_QUOTAS } from "@/lib/quotas";
import { getExpiryStatus } from "@/lib/format";

export const dynamic = "force-dynamic";

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

    const [products, transactions, expenses] = await Promise.all([
      prisma.product.findMany({
        where: { store_id: store.id },
        orderBy: { created_at: "desc" },
      }),
      prisma.transaction.findMany({
        where: { store_id: store.id },
        include: { items: true },
        orderBy: { created_at: "desc" },
        take: 100,
      }),
      prisma.expense.findMany({
        where: { store_id: store.id },
        orderBy: { spent_at: "desc" },
        take: 100,
      }),
    ]);

    const completedTransactions = transactions.filter(
      (t) => t.status === "COMPLETED"
    );

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthPrefix = now.toISOString().slice(0, 7);

    const productCostMap = new Map<string, number>();
    let nilaiStokModal = 0;
    for (const p of products) {
      productCostMap.set(p.id, p.cost_price);
      nilaiStokModal += p.cost_price * Math.max(0, p.stock_qty);
    }

    const todayCompleted = completedTransactions.filter((t) => {
      const d = (t.confirmed_at || t.created_at).toISOString().slice(0, 10);
      return d === todayStr;
    });

    const monthCompleted = completedTransactions.filter((t) => {
      const d = (t.confirmed_at || t.created_at).toISOString().slice(0, 7);
      return d === monthPrefix;
    });

    const calcCogs = (list: typeof completedTransactions) =>
      list.reduce(
        (sum, trx) =>
          sum +
          trx.items.reduce(
            (itemSum, item) =>
              itemSum + (productCostMap.get(item.product_id) ?? 0) * item.qty,
            0
          ),
        0
      );

    const omzetHariIni = todayCompleted.reduce(
      (acc, t) => acc + t.total_amount,
      0
    );
    const transaksiHariIni = todayCompleted.length;
    const modalHariIni = calcCogs(todayCompleted);
    const pengeluaranHariIni = expenses
      .filter((e) => e.spent_at.toISOString().slice(0, 10) === todayStr)
      .reduce((acc, e) => acc + e.amount, 0);
    const labaBersihHariIni = omzetHariIni - modalHariIni - pengeluaranHariIni;

    const omzetBulanIni = monthCompleted.reduce(
      (acc, t) => acc + t.total_amount,
      0
    );
    const modalBulanIni = calcCogs(monthCompleted);
    const pengeluaranBulanIni = expenses
      .filter((e) => e.spent_at.toISOString().slice(0, 7) === monthPrefix)
      .reduce((acc, e) => acc + e.amount, 0);
    const labaBersihBulanIni =
      omzetBulanIni - modalBulanIni - pengeluaranBulanIni;

    const lowStockProducts = products.filter((p) => p.stock_qty <= threshold);
    const pendingWaOrders = transactions.filter(
      (t) =>
        t.channel === "WHATSAPP_ONLINE" && t.status === "PENDING_CONFIRMATION"
    );

    // Filter barang yang sudah atau hampir kedaluwarsa (EXP <= 14 hari)
    const expiringProducts = config?.enable_expiry_tracking
      ? products
          .map((p) => {
            const expInfo = getExpiryStatus(p.expiry_date);
            return {
              ...p,
              expStatus: expInfo.status,
              daysLeft: expInfo.daysLeft,
              expLabel: expInfo.label,
            };
          })
          .filter(
            (p) =>
              p.expStatus === "EXPIRED" || p.expStatus === "EXPIRING_SOON"
          )
          .sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999))
      : [];

    // Rekap per Shift Kasir hari ini jika modul shift aktif
    const shiftSummary = config?.enable_shift_log
      ? ["Pagi", "Sore", "Malam"].map((shift) => {
          const list = todayCompleted.filter(
            (t) => (t.shift_name || "Pagi") === shift
          );
          return {
            shift,
            count: list.length,
            revenue: list.reduce((s, t) => s + t.total_amount, 0),
          };
        })
      : [];

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
      ownerName: user.name,
      store,
      config,
      quotas: MICRO_RET_QUOTAS,
      kpis: {
        omzetHariIni,
        transaksiHariIni,
        stokMenipisCount: lowStockProducts.length,
        pesananWaMenungguCount: pendingWaOrders.length,
        totalProductsCount: products.length,
        expiringCount: expiringProducts.length,
        unpaidDebtTotal: unpaidDebts.reduce((s, t) => s + t.total_amount, 0),
        unpaidDebtCount: unpaidDebts.length,
        pengeluaranHariIni,
        labaBersihHariIni,
        omzetBulanIni,
        pengeluaranBulanIni,
        labaBersihBulanIni,
        nilaiStokModal,
      },
      recentTransactions: transactions.slice(
        0,
        MICRO_RET_QUOTAS.MAX_RECENT_TRANSACTIONS
      ),
      recentExpenses: expenses.slice(0, 5),
      topProducts,
      lowStockProducts,
      expiringProducts,
      shiftSummary,
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
