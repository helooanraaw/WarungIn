import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !user.store) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const channel = searchParams.get("channel");
    const status = searchParams.get("status");

    const whereClause: Record<string, unknown> = {
      store_id: user.store.id,
    };

    if (channel && channel !== "ALL") {
      whereClause.channel = channel;
    }
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return NextResponse.json({
      transactions,
      store: user.store,
      config: user.store.modules_config,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat daftar transaksi." },
      { status: 500 }
    );
  }
}
