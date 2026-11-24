import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

export const SESSION_COOKIE_NAME = "warungin_session";

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "warungin-naisc-2026-secret-key";
}

function signUserId(userId: string): string {
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");
  return `${userId}.${sig}`;
}

function verifySignedToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [userId, sig] = parts;
  if (!userId || !sig) return null;

  const expected = crypto
    .createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");

  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  return userId;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash.includes(":")) {
    return storedHash === password;
  }
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export async function setSessionUser(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signUserId(userId), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = verifySignedToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      store: {
        include: {
          modules_config: true,
        },
      },
    },
  });

  return user;
}
