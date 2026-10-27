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

export function fmtDateTime(dateInput: string | Date | null | undefined): string {
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
        `${idx + 1}. ${item.name} (${item.qty}x @ ${fmtRp(item.price)}) = ${fmtRp(
          item.qty * item.price
        )}`
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
