"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MessageSquare,
  FileText,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface StoreInfo {
  id: string;
  store_name: string;
  slug: string;
  category: string;
  is_online_enabled: boolean;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumb: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#d8e1ea] pb-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-[22px] text-[#22303c] sm:text-[25px]">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[#5f6f82] sm:text-[13px]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs text-[#5f6f82]">
          Beranda / <span className="text-[#22303c]">{breadcrumb}</span>
        </span>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Pager({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (next: number) => void;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-2 border-t border-[#d8e1ea] bg-[#f8fafc] px-4 py-2.5 text-xs text-[#5f6f82] sm:flex-row sm:items-center">
      <div>Menampilkan total {totalItems} baris data</div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="op-btn op-btn-sm"
        >
          Sebelumnya
        </button>
        <span className="px-2 text-xs text-[#22303c]">
          Halaman {page} dari {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="op-btn op-btn-sm"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.user) return;
        setUserEmail(data.user.email);
        if (!data.user.store) {
          router.push("/onboarding");
        } else {
          setStore(data.user.store);
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function switchDemoStore(email: string) {
    await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "demo123" }),
    });
    window.location.reload();
  }

  const navGroups = [
    {
      label: "UTAMA",
      items: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/dashboard/pos",
          label: "Kasir (POS)",
          icon: ShoppingCart,
        },
      ],
    },
    {
      label: "MANAJEMEN",
      items: [
        {
          href: "/dashboard/inventory",
          label: "Produk & Stok",
          icon: Package,
        },
        {
          href: "/dashboard/whatsapp-orders",
          label: "Pesanan WhatsApp",
          icon: MessageSquare,
        },
        {
          href: "/dashboard/transactions",
          label: "Riwayat Transaksi",
          icon: FileText,
        },
      ],
    },
    {
      label: "PENGATURAN",
      items: [
        {
          href: "/dashboard/settings",
          label: "Pengaturan Toko",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="op-shell flex min-h-screen flex-col">
      {/* FIXED TOPBAR (54px) */}
      <header className="sticky top-0 z-30 flex h-[54px] w-full">
        {/* LEFT BRAND BLOCK (240px on desktop) */}
        <div className="flex w-auto items-center justify-between bg-[#1b2733] px-4 text-white lg:w-[240px]">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-[#1976d2] text-xs text-white">
              W
            </span>
            <span className="truncate">Warungin ERP</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-3 text-[#d9e2ea] lg:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* RIGHT HEADER BAR (#1976d2) */}
        <div className="flex flex-1 items-center justify-between bg-[#1976d2] px-4 text-white sm:px-6">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="truncate text-xs sm:text-sm">
              {store ? store.store_name : "Memuat Toko..."}
            </span>
            {store && (
              <span className="hidden rounded-[4px] bg-[#1565c0] px-2 py-0.5 text-[11px] text-white/90 md:inline-block">
                {store.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Pengalih Cepat 3 Toko Contoh untuk Pengujian / Demo */}
            <select
              aria-label="Pilih Toko Contoh"
              value={userEmail}
              onChange={(e) => {
                if (e.target.value.endsWith("@demo.warungin.id")) {
                  switchDemoStore(e.target.value);
                }
              }}
              className="hidden h-8 rounded-[5px] border border-white/25 bg-[#1565c0] px-2.5 text-xs text-white outline-none sm:block"
            >
              <option value="berkah@demo.warungin.id">
                Demo 1: Toko Sembako Berkah Jaya
              </option>
              <option value="nusantara@demo.warungin.id">
                Demo 2: Butik Nusantara Wear
              </option>
              <option value="kuemanis@demo.warungin.id">
                Demo 3: Toko Bahan Kue Manis
              </option>
              {!userEmail.endsWith("@demo.warungin.id") && userEmail && (
                <option value={userEmail}>Akun: {userEmail}</option>
              )}
            </select>

            {store && store.is_online_enabled && (
              <Link
                href={`/toko/${store.slug}`}
                target="_blank"
                className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-white/25 bg-[#1565c0] px-2.5 text-xs text-white hover:bg-[#1256a3]"
              >
                <span className="hidden sm:inline">Lihat Katalog</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-white/25 bg-[#1565c0] px-2.5 text-xs text-white hover:bg-[#1256a3]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* BODY: SIDEBAR + MAIN WORKSPACE */}
      <div className="flex flex-1">
        {/* SIDEBAR DESKTOP & MOBILE */}
        <aside
          className={`${
            mobileOpen ? "fixed inset-y-[54px] left-0 z-40 block" : "hidden"
          } w-[240px] shrink-0 bg-[#1f2d3a] text-[#d9e2ea] lg:block`}
        >
          <div className="border-b border-white/10 px-4 py-3.5">
            <div className="truncate text-xs text-white">
              {store?.store_name || "Toko UMKM"}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-[#9fb1c1]">
              {userEmail || "Pemilik Toko"}
            </div>
          </div>

          <nav className="space-y-4 p-3">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-2.5 pb-1.5 text-[10px] tracking-wider text-[#8fa3b5]">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      item.href === "/dashboard"
                        ? pathname === "/dashboard"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 rounded-[5px] px-3 py-2 text-xs transition-colors ${
                          active
                            ? "bg-[#1976d2] text-white"
                            : "text-[#d9e2ea] hover:bg-[#25394a]"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* MAIN WORKSPACE */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
