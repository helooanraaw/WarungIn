import type { Metadata, Viewport } from "next";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warungin - Kasir, Stok, dan Katalog WhatsApp untuk Toko Ritel Kecil",
  description:
    "Catat penjualan di kasir, pantau sisa barang di rak, dan terima pesanan dari WhatsApp dalam satu halaman kerja yang rapi untuk UMKM ritel Indonesia.",
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffdf9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
