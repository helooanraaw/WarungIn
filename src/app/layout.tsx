import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warungin - Kasir, Stok, dan Katalog WhatsApp untuk Toko Ritel Kecil",
  description:
    "Catat penjualan di kasir, pantau sisa barang di rak, dan terima pesanan dari WhatsApp dalam satu halaman kerja yang rapi untuk UMKM ritel Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
