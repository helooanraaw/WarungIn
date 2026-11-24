import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "Pemilik Toko").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Nama lengkap pemilik wajib diisi." },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Masukkan alamat email yang valid." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Kata sandi minimal 4 karakter." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email ini sudah terdaftar. Silakan langsung masuk." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashPassword(password),
        role: "OWNER",
      },
    });

    await setSessionUser(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasStore: false,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal mendaftarkan akun baru." },
      { status: 500 }
    );
  }
}
