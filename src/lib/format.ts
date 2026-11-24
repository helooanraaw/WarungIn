export function fmtRp(amount: number | null | undefined): string {
  const n = Number(amount || 0);
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export function fmtNumber(amount: number | null | undefined): string {
  return Number(amount || 0).toLocaleString("id-ID");
}

export function fmtDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(
  dateInput: string | Date | null | undefined
): string {
  if (!dateInput) return "-";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getExpiryStatus(expiryDate: string | null | undefined): {
  status: "EXPIRED" | "EXPIRING_SOON" | "SAFE" | "NONE";
  daysLeft: number | null;
  label: string;
} {
  if (!expiryDate || !expiryDate.trim()) {
    return { status: "NONE", daysLeft: null, label: "-" };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate + "T00:00:00");
  if (isNaN(exp.getTime())) {
    return { status: "NONE", daysLeft: null, label: expiryDate };
  }
  const diffMs = exp.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      status: "EXPIRED",
      daysLeft,
      label: `Sudah EXP (${Math.abs(daysLeft)} hari lalu)`,
    };
  }
  if (daysLeft === 0) {
    return {
      status: "EXPIRED",
      daysLeft: 0,
      label: "EXP Hari Ini",
    };
  }
  if (daysLeft <= 14) {
    return {
      status: "EXPIRING_SOON",
      daysLeft,
      label: `Hampir EXP (${daysLeft} hari lagi)`,
    };
  }
  return {
    status: "SAFE",
    daysLeft,
    label: expiryDate,
  };
}

export function sanitizeWaNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  if (digits.startsWith("8")) {
    return "62" + digits;
  }
  return digits;
}

export function slugifyStoreName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export interface WaOrderItem {
  name: string;
  qty: number;
  price: number;
}

export function generateWhatsAppOrderLink(params: {
  storePhone: string;
  storeName: string;
  accountHolder: string;
  invoiceCode: string;
  customerName: string;
  customerWa: string;
  customerNote?: string;
  items: WaOrderItem[];
  totalAmount: number;
}): string {
  const cleanPhone = sanitizeWaNumber(params.storePhone);
  const itemLines = params.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (${item.qty}x @ ${fmtRp(
          item.price
        )}) = ${fmtRp(item.qty * item.price)}`
    )
    .join("\n");

  const lines = [
    `Halo *${params.storeName}* (u.p. ${params.accountHolder || "Admin Toko"}),`,
    `Saya ingin memesan barang dari katalog online:`,
    ``,
    `*Kode Pesanan:* ${params.invoiceCode}`,
    `*Nama Pembeli:* ${params.customerName}`,
    `*No. WA Pembeli:* ${params.customerWa}`,
    ``,
    `*Rincian Pesanan:*`,
    itemLines,
    ``,
    `*Total Estimasi:* ${fmtRp(params.totalAmount)}`,
  ];

  if (params.customerNote && params.customerNote.trim()) {
    lines.push(`*Catatan:* ${params.customerNote.trim()}`);
  }

  lines.push(
    ``,
    `Mohon konfirmasi ketersediaan stok dan rincian pembayarannya. Terima kasih.`
  );

  const encoded = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function generateWhatsAppReceiptLink(params: {
  customerWa: string;
  storeName: string;
  invoiceCode: string;
  createdAt: string;
  paymentMethod: string;
  customerName: string;
  shiftName?: string | null;
  isDebtPaid?: boolean;
  customerNote?: string | null;
  items: {
    product_name: string;
    qty: number;
    unit_price: number;
    normal_price?: number;
    subtotal: number;
  }[];
  discountTotal?: number;
  totalAmount: number;
  cashReceived?: number | null;
  changeAmount?: number | null;
  receiptFooter?: string;
}): string {
  const cleanPhone = sanitizeWaNumber(params.customerWa);
  const itemLines = params.items
    .map((item, idx) => {
      const isWholesale =
        item.normal_price && item.normal_price > item.unit_price;
      return `${idx + 1}. ${item.product_name}\n   ${item.qty} x ${fmtRp(
        item.unit_price
      )}${isWholesale ? " (Grosir)" : ""} = ${fmtRp(item.subtotal)}`;
    })
    .join("\n");

  const lines = [
    `*STRUK PEMBELIAN - ${params.storeName.toUpperCase()}*`,
    `--------------------------------`,
    `No. Nota: ${params.invoiceCode}`,
    `Waktu: ${fmtDateTime(params.createdAt)}`,
    `Pelanggan: ${params.customerName || "Pembeli Umum"}`,
  ];

  if (params.shiftName) {
    lines.push(`Shift Kasir: ${params.shiftName}`);
  }

  lines.push(`--------------------------------`, itemLines, `--------------------------------`);

  if (params.discountTotal && params.discountTotal > 0) {
    lines.push(`Hemat Harga Grosir: -${fmtRp(params.discountTotal)}`);
  }

  lines.push(
    `*TOTAL TAGIHAN: ${fmtRp(params.totalAmount)}*`,
    `Metode Bayar: ${params.paymentMethod}`
  );

  if (params.paymentMethod === "TUNAI" && params.cashReceived) {
    lines.push(
      `Tunai Diterima: ${fmtRp(params.cashReceived)}`,
      `Uang Kembalian: ${fmtRp(params.changeAmount || 0)}`
    );
  }

  if (params.paymentMethod === "KASBON") {
    lines.push(
      `Status Kasbon: ${params.isDebtPaid ? "LUNAS" : "BELUM LUNAS"}`
    );
    if (params.customerNote) {
      lines.push(`Catatan Tempo: ${params.customerNote}`);
    }
  }

  lines.push(
    `--------------------------------`,
    params.receiptFooter || `Terima kasih telah berbelanja di ${params.storeName}.`
  );

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    lines.join("\n")
  )}`;
}
