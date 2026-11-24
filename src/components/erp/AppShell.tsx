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
import BrandLogo from "@/components/BrandLogo";

interface StoreInfo {
  id: string;
  store_name: string;
  slug: string;
  category: string;
  logo_url: string | null;
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
    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-[#d8e1ea] pb-3.5 sm:mb-5 sm:flex-row sm:items-center sm:pb-4">
      <div className="min-w-0">
        <h1 className="text-[20px] leading-snug text-[#22303c] sm:text-[25px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-xs leading-relaxed text-[#5f6f82] sm:text-[13px]">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="hidden text-xs text-[#5f6f82] sm:inline">
          Beranda / <span className="text-[#22303c]">{breadcrumb}</span>
        </span>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {actions}
          </div>
        )}
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
    <div className="flex flex-col items-stretch justify-between gap-2.5 border-t border-[#d8e1ea] bg-[#f8fafc] px-4 py-3 text-xs text-[#5f6f82] sm:flex-row sm:items-center sm:py-2.5">
      <div className="text-center sm:text-left">
        Menampilkan total {totalItems} baris data
      </div>
      <div className="flex items-center justify-between gap-1.5 sm:justify-end">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="op-btn op-btn-sm flex-1 sm:flex-none"
        >
          Sebelumnya
        </button>
        <span className="shrink-0 px-2 text-xs text-[#22303c] tabular-nums">
          {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="op-btn op-btn-sm flex-1 sm:flex-none"
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
  const [ownerName, setOwnerName] = useState<string>("");
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
        setOwnerName(data.user.name || "");
        setUserEmail(data.user.email || "");
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

  const navGroups = [
    {
      label: "UTAMA",
      items: [
        {
          href: "/dashboard",
          label: "Ringkasan Harian",
          icon: LayoutDashboard,
        },
        {
          href: "/dashboard/pos",
          label: "Kasir Toko",
          icon: ShoppingCart,
        },
      ],
    },
    {
      label: "MANAJEMEN",
      items: [
        {
          href: "/dashboard/inventory",
          label: "Barang & Stok",
          icon: Package,
        },
        {
          href: "/dashboard/whatsapp-orders",
          label: "Pesanan WhatsApp",
          icon: MessageSquare,
        },
        {
          href: "/dashboard/transactions",
          label: "Riwayat Penjualan",
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

  const bottomTabs = [
    {
      href: "/dashboard",
      label: "Ringkasan",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/pos",
      label: "Kasir",
      icon: ShoppingCart,
      isActive: pathname.startsWith("/dashboard/pos"),
    },
    {
      href: "/dashboard/inventory",
      label: "Stok",
      icon: Package,
      isActive: pathname.startsWith("/dashboard/inventory"),
    },
    {
      href: "/dashboard/whatsapp-orders",
      label: "Pesanan",
      icon: MessageSquare,
      isActive: pathname.startsWith("/dashboard/whatsapp-orders"),
    },
  ];

  const isDrawerRouteActive =
    pathname.startsWith("/dashboard/transactions") ||
    pathname.startsWith("/dashboard/settings");

  return (
    <div className="op-shell min-h-[100dvh] lg:min-h-screen">
      {/* MOBILE TOP APP BAR (< 1024px) */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-[#d8e1ea] bg-white/95 px-4 backdrop-blur-sm lg:hidden">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5"
        >
          {store?.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.store_name}
              className="h-8 w-8 shrink-0 rounded-lg border border-[#d8e1ea] bg-white object-cover"
            />
          ) : (
            <BrandLogo size={28} variant="tile" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm text-[#22303c]">
              {store?.store_name || "Warungin"}
            </div>
            <div className="truncate text-[11px] text-[#5f6f82]">
              {store?.category || ownerName || "Panel Toko"}
            </div>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {store?.is_online_enabled && (
            <Link
              href={`/toko/${store.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#d8e1ea] bg-[#f8fafc] px-2.5 text-xs text-[#22303c]"
            >
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 text-[#1976d2]" />
              <span>Toko</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#d8e1ea] bg-white px-2.5 text-xs text-[#22303c]"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="dashboard-navigation"
          >
            {mobileOpen ? (
              <X aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Menu aria-hidden="true" className="h-4 w-4" />
            )}
            <span>Menu</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100dvh-3.5rem)] lg:min-h-screen">
        {mobileOpen && (
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-[#101820]/45 lg:hidden"
          />
        )}
        <aside
          id="dashboard-navigation"
          className={`${
            mobileOpen ? "fixed inset-y-0 left-0 z-50 flex" : "hidden"
          } h-[100dvh] w-[264px] shrink-0 flex-col overflow-y-auto bg-[#1f2d3a] pb-safe text-[#d9e2ea] lg:sticky lg:top-0 lg:left-auto lg:z-auto lg:flex lg:h-screen lg:w-[240px] lg:pb-0`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 text-sm text-white"
            >
              <BrandLogo size={30} variant="tile" />
              <span>Warungin</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu samping"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#d9e2ea] hover:bg-[#25394a] lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 border-b border-white/10 px-4 py-3.5">
            {store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.store_name}
                className="h-9 w-9 shrink-0 rounded-[5px] bg-white object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#25394a] text-xs text-white">
                {store?.store_name
                  ? store.store_name.charAt(0).toUpperCase()
                  : "T"}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-xs text-white">
                {store?.store_name || "Toko Anda"}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-[#9fb1c1]">
                {ownerName || userEmail || "Pemilik Toko"}
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-4 p-3">
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
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-[44px] items-center gap-2.5 rounded-[5px] px-3 py-2 text-xs transition-colors lg:min-h-0 ${
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

          <div className="space-y-1 border-t border-white/10 p-3">
            {store?.is_online_enabled && (
              <Link
                href={`/toko/${store.slug}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center gap-2.5 rounded-[5px] px-3 py-2 text-xs text-[#d9e2ea] transition-colors hover:bg-[#25394a] lg:min-h-0"
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                <span>Lihat Toko Online</span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[44px] w-full items-center gap-2.5 rounded-[5px] px-3 py-2 text-left text-xs text-[#d9e2ea] transition-colors hover:bg-[#25394a] lg:min-h-0"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        <main
          aria-label="Konten dashboard"
          className="min-w-0 flex-1 px-3.5 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:p-6"
        >
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (< 1024px) */}
      <nav
        aria-label="Navigasi utama mobile"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d8e1ea] bg-white/95 pb-safe backdrop-blur-sm lg:hidden"
      >
        <div className="grid grid-cols-5">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => setMobileOpen(false)}
                aria-current={tab.isActive ? "page" : undefined}
                className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 text-[11px] transition-colors ${
                  tab.isActive ? "text-[#1976d2]" : "text-[#5f6f82]"
                }`}
              >
                {tab.isActive && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-[#1976d2]" />
                )}
                <Icon className="h-5 w-5" />
                <span className="truncate">{tab.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="dashboard-navigation"
            className={`relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 text-[11px] transition-colors ${
              mobileOpen || isDrawerRouteActive
                ? "text-[#1976d2]"
                : "text-[#5f6f82]"
            }`}
          >
            {(mobileOpen || isDrawerRouteActive) && (
              <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-[#1976d2]" />
            )}
            <Menu className="h-5 w-5" />
            <span>Lainnya</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
