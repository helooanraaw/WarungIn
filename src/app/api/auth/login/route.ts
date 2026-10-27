import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        store: {
          include: { modules_config: true },
        },
      },
    });

    if (!user || user.password_hash !== password) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak sesuai." },
        { status: 401 }
      );
    }

    await setSessionUser(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hasStore: Boolean(user.store),
        storeSlug: user.store?.slug || null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memproses permintaan masuk." },
      { status: 500 }
    );
  }
}
