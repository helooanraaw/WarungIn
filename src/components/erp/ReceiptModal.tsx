"use client";

import React, { useState } from "react";
import {
  fmtDateTime,
  fmtRp,
  generateWhatsAppReceiptLink,
} from "@/lib/format";
import { Check, Printer, ExternalLink } from "lucide-react";

export interface ReceiptItemData {
  id: string;
  product_name: string;
  unit_price: number;
  normal_price?: number;
  qty: number;
  subtotal: number;
}

export interface ReceiptTransactionData {
  id: string;
  invoice_code: string;
  channel: string;
  status: string;
  payment_method: string;
  customer_name: string | null;
  customer_wa: string | null;
  customer_note: string | null;
  shift_name: string | null;
  is_debt_paid?: boolean;
  discount_total?: number;
  manual_discount?: number;
  total_amount: number;
  cash_received?: number | null;
  change_amount?: number | null;
  created_at: string;
  items: ReceiptItemData[];
}

export interface ReceiptStoreInfo {
  store_name: string;
  category?: string;
  address?: string | null;
  logo_url?: string | null;
  whatsapp_number?: string | null;
  receipt_footer?: string | null;
}

export default function ReceiptModal({
  transaction,
  store,
  onClose,
  title = "Struk Belanja",
}: {
  transaction: ReceiptTransactionData;
  store?: ReceiptStoreInfo | null;
  onClose: () => void;
  title?: string;
}) {
  const [waPhone, setWaPhone] = useState(transaction.customer_wa || "");

  const storeName = store?.store_name || "Toko Warungin";
  const receiptFooter =
    store?.receipt_footer ||
    `Terima kasih sudah berbelanja di ${storeName}.`;

  const discountTotal = Number(transaction.discount_total || 0);
  const manualDiscount = Number(transaction.manual_discount || 0);
  const wholesaleDiscount = Math.max(0, discountTotal - manualDiscount);
  const normalTotal = transaction.total_amount + discountTotal;

  function handleSendWa() {
    if (!waPhone.trim()) return;
    const url = generateWhatsAppReceiptLink({
      customerWa: waPhone,
      storeName,
      invoiceCode: transaction.invoice_code,
      createdAt: transaction.created_at,
      paymentMethod: transaction.payment_method,
      customerName: transaction.customer_name || "Pembeli Umum",
      shiftName: transaction.shift_name,
      isDebtPaid: transaction.is_debt_paid,
      customerNote: transaction.customer_note,
      items: transaction.items,
      discountTotal,
      totalAmount: transaction.total_amount,
      cashReceived: transaction.cash_received,
      changeAmount: transaction.change_amount,
      receiptFooter,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="op-card max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-[6px] sm:p-6">
        <div className="no-print mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8e1ea] sm:hidden" />
        <div className="no-print mb-3 flex items-center justify-between border-b border-[#d8e1ea] pb-2.5">
          <div className="flex items-center gap-2 text-xs text-[#167a6f]">
            <Check className="h-4 w-4" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#5f6f82] hover:text-[#22303c]"
          >
            Tutup
          </button>
        </div>

        {/* AREA CETAK STRUK (#printable-receipt) */}
        <div
          id="printable-receipt"
          className="rounded-[5px] border border-[#d8e1ea] bg-white p-4 text-xs text-[#22303c]"
        >
          {/* HEADER TOKO + LOGO PROFIL */}
          <div className="border-b border-dashed border-[#d8e1ea] pb-3 text-center">
            {store?.logo_url && (
              <img
                src={store.logo_url}
                alt={storeName}
                className="mx-auto mb-2 h-11 w-11 rounded-[6px] object-cover"
              />
            )}
            <div className="text-sm text-[#22303c]">{storeName}</div>
            {store?.category && (
              <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                {store.category}
              </div>
            )}
            {store?.address && (
              <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                {store.address}
              </div>
            )}
            {store?.whatsapp_number && (
              <div className="mt-0.5 text-[11px] text-[#5f6f82]">
                WA: {store.whatsapp_number}
              </div>
            )}
          </div>

          {/* METADATA NOTA */}
          <div className="space-y-1 border-b border-dashed border-[#d8e1ea] py-2.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#5f6f82]">No. Nota:</span>
              <span className="text-[#22303c] tabular-nums">
                {transaction.invoice_code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5f6f82]">Waktu:</span>
              <span className="text-[#22303c]">
                {fmtDateTime(transaction.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5f6f82]">Asal Pesanan:</span>
              <span className="text-[#22303c]">
                {transaction.channel === "WHATSAPP_ONLINE"
                  ? "Pesanan WhatsApp"
                  : "Kasir Toko"}
              </span>
            </div>
            {transaction.shift_name && (
              <div className="flex justify-between">
                <span className="text-[#5f6f82]">Jadwal Jaga:</span>
                <span className="text-[#22303c]">
                  Shift {transaction.shift_name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#5f6f82]">Pembeli:</span>
              <span className="text-[#22303c]">
                {transaction.customer_name || "Pembeli Umum"}
              </span>
            </div>
          </div>

          {/* DAFTAR BARANG */}
          <div className="divide-y divide-dashed divide-[#edf2f7] border-b border-dashed border-[#d8e1ea] py-2">
            {transaction.items.map((item) => {
              const isWholesale =
                item.normal_price && item.normal_price > item.unit_price;
              const savedPerItem = isWholesale
                ? (item.normal_price! - item.unit_price) * item.qty
                : 0;

              return (
                <div key={item.id} className="py-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[#22303c]">{item.product_name}</span>
                    <span className="shrink-0 text-[#22303c] tabular-nums">
                      {fmtRp(item.subtotal)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] text-[#5f6f82]">
                    <span className="tabular-nums">
                      {item.qty} x {fmtRp(item.unit_price)}
                    </span>
                    {isWholesale && (
                      <span className="text-[#167a6f]">
                        Harga Grosir (Hemat {fmtRp(savedPerItem)})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RINCIAN PEMBAYARAN */}
          <div className="space-y-1 border-b border-dashed border-[#d8e1ea] py-2.5">
            {discountTotal > 0 && (
              <div className="flex justify-between text-[11px] text-[#5f6f82]">
                <span>Subtotal Awal</span>
                <span className="tabular-nums">{fmtRp(normalTotal)}</span>
              </div>
            )}
            {wholesaleDiscount > 0 && (
              <div className="flex justify-between text-[11px] text-[#167a6f]">
                <span>Hemat Harga Grosir</span>
                <span className="tabular-nums">
                  -{fmtRp(wholesaleDiscount)}
                </span>
              </div>
            )}
            {manualDiscount > 0 && (
              <div className="flex justify-between text-[11px] text-[#167a6f]">
                <span>Potongan Diskon Kasir</span>
                <span className="tabular-nums">-{fmtRp(manualDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between pt-0.5 text-sm text-[#22303c]">
              <span>Total Bayar</span>
              <span className="tabular-nums">
                {fmtRp(transaction.total_amount)}
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-[#5f6f82]">
              <span>Cara Bayar</span>
              <span className="text-[#22303c]">
                {transaction.payment_method}
              </span>
            </div>

            {transaction.payment_method === "TUNAI" && (
              <>
                <div className="flex justify-between text-[11px] text-[#5f6f82]">
                  <span>Uang Diterima</span>
                  <span className="tabular-nums">
                    {fmtRp(
                      transaction.cash_received ?? transaction.total_amount
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#22303c]">
                  <span>Uang Kembalian</span>
                  <span className="tabular-nums">
                    {fmtRp(transaction.change_amount || 0)}
                  </span>
                </div>
              </>
            )}

            {transaction.payment_method === "KASBON" && (
              <div className="mt-1.5 rounded-[4px] border border-[#f5dcb0] bg-[#fef8ec] px-2.5 py-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5f6f82]">Status Bon / Kasbon:</span>
                  <span
                    className={
                      transaction.is_debt_paid
                        ? "text-[#167a6f]"
                        : "text-[#c0392b]"
                    }
                  >
                    {transaction.is_debt_paid ? "SUDAH LUNAS" : "BELUM LUNAS"}
                  </span>
                </div>
                {transaction.customer_note && (
                  <div className="mt-0.5 text-[#5f6f82]">
                    Janji Bayar: {transaction.customer_note}
                  </div>
                )}
              </div>
            )}

            {transaction.payment_method !== "KASBON" &&
              transaction.customer_note && (
                <div className="pt-1 text-[11px] text-[#5f6f82]">
                  Catatan: {transaction.customer_note}
                </div>
              )}
          </div>

          {/* FOOTER STRUK */}
          <div className="pt-2.5 text-center text-[11px] leading-relaxed text-[#5f6f82]">
            {receiptFooter}
          </div>
        </div>

        {/* KIRIM STRUK KE WHATSAPP PEMBELI */}
        <div className="no-print mt-3.5 rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3">
          <label className="mb-1 block text-[11px] text-[#5f6f82]">
            Kirim Struk ke Nomor WhatsApp Pembeli:
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              inputMode="tel"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="Contoh: 0812xxxx"
              className="op-input py-1.5 text-xs"
            />
            <button
              type="button"
              disabled={!waPhone.trim()}
              onClick={handleSendWa}
              className="op-btn op-btn-sm shrink-0"
            >
              <span>Kirim WA</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* TOMBOL AKSI BAWAH */}
        <div className="no-print mt-4 flex gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="op-btn flex-1 sm:flex-none"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Struk</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="op-btn op-btn-primary flex-1 sm:flex-none"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
