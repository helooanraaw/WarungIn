"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/erp/AppShell";
import { compressImageFile } from "@/lib/image-upload";

interface ProductRecord {
  id: string;
  sku: string;
  name: string;
  product_category: string | null;
  image_url: string | null;
  unit: string;
  cost_price: number;
  sell_price: number;
  wholesale_price: number | null;
  wholesale_min_qty: number | null;
  stock_qty: number;
  is_online: boolean;
  variant_label: string | null;
  expiry_date: string | null;
}

interface ProductConfig {
  custom_attribute_label: string;
  default_unit: string;
  enable_expiry_tracking: boolean;
  enable_variant_matrix: boolean;
  enable_wholesale_tier: boolean;
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const editing = Boolean(productId);
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [config, setConfig] = useState<ProductConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [unit, setUnit] = useState("pcs");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [wholesaleMinQty, setWholesaleMinQty] = useState("");
  const [stockQty, setStockQty] = useState("10");
  const [variantLabel, setVariantLabel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/products")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat barang.");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setConfig(data.config || null);

        if (productId) {
          const current = (data.products as ProductRecord[] | undefined)?.find(
            (item) => item.id === productId
          );
          if (!current) {
            setFormError("Barang tidak ditemukan di toko ini.");
            return;
          }
          setProduct(current);
          setSku(current.sku);
          setName(current.name);
          setProductCategory(current.product_category || "");
          setImageUrl(current.image_url);
          setUnit(current.unit);
          setCostPrice(String(current.cost_price));
          setSellPrice(String(current.sell_price));
          setWholesalePrice(
            current.wholesale_price ? String(current.wholesale_price) : ""
          );
          setWholesaleMinQty(
            current.wholesale_min_qty
              ? String(current.wholesale_min_qty)
              : ""
          );
          setStockQty(String(current.stock_qty));
          setVariantLabel(current.variant_label || "");
          setExpiryDate(current.expiry_date || "");
          setIsOnline(current.is_online);
          return;
        }

        setSku(`BRG-${String((data.products?.length || 0) + 1).padStart(3, "0")}`);
        setUnit(data.config?.default_unit || "pcs");
      })
      .catch((error: unknown) => {
        if (active) {
          setFormError(
            error instanceof Error ? error.message : "Gagal memuat barang."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  async function handleUploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 480,
        maxHeight: 480,
        quality: 0.78,
      });
      setImageUrl(compressed);
      setFormError("");
    } catch (error: unknown) {
      setFormError(
        error instanceof Error ? error.message : "Gagal memproses foto barang."
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const nextStock = Number(stockQty || 0);
    const stockChanged = product && nextStock !== product.stock_qty;
    const listingChanged = product && isOnline !== product.is_online;

    if (product && (stockChanged || listingChanged)) {
      const changes = [
        stockChanged
          ? `Stok: ${product.stock_qty} ${product.unit} menjadi ${nextStock} ${unit}.`
          : null,
        listingChanged
          ? `Katalog: ${product.is_online ? "ditampilkan" : "disembunyikan"} menjadi ${isOnline ? "ditampilkan" : "disembunyikan"}.`
          : null,
      ].filter(Boolean);

      if (
        !window.confirm(
          `Yakin menyimpan perubahan untuk ${product.name}?\n\n${changes.join("\n")}`
        )
      ) {
        return;
      }
    }

    setSaving(true);
    const payload = {
      sku,
      name,
      product_category: productCategory || null,
      image_url: imageUrl,
      unit,
      cost_price: Number(costPrice || 0),
      sell_price: Number(sellPrice || 0),
      wholesale_price: wholesalePrice ? Number(wholesalePrice) : null,
      wholesale_min_qty: wholesaleMinQty ? Number(wholesaleMinQty) : null,
      stock_qty: nextStock,
      variant_label: variantLabel || null,
      expiry_date: expiryDate || null,
      is_online: isOnline,
    };

    try {
      const response = await fetch(
        product ? `/api/products/${product.id}` : "/api/products",
        {
          method: product ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setFormError(data.error || "Gagal menyimpan barang.");
        return;
      }

      router.push("/dashboard/inventory");
    } catch {
      setFormError("Terjadi gangguan koneksi. Perubahan belum tersimpan.");
    } finally {
      setSaving(false);
    }
  }

  const attrLabel = config?.custom_attribute_label || "Ukuran / Pilihan";

  if (loading) {
    return (
      <div className="op-card p-6 text-xs text-[#5f6f82]">
        Memuat data barang...
      </div>
    );
  }

  if (editing && !product) {
    return (
      <div className="op-card p-5">
        <p role="alert" className="text-sm text-[#c0392b]">
          {formError || "Barang tidak ditemukan."}
        </p>
        <Link href="/dashboard/inventory" className="op-btn mt-4">
          Kembali ke Barang & Stok
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={editing ? "Edit Barang" : "Tambah Barang"}
        subtitle={
          editing
            ? "Perbarui data barang. Perubahan stok dan katalog akan meminta konfirmasi sebelum disimpan."
            : "Isi nama, harga, satuan, dan jumlah awal agar barang siap dicatat di kasir."
        }
        breadcrumb={editing ? "Edit Barang" : "Tambah Barang"}
        actions={
          <Link href="/dashboard/inventory" className="op-btn">
            Kembali ke daftar
          </Link>
        }
      />

      {formError && (
        <div
          role="alert"
          className="mb-4 rounded-[5px] border border-[#f3c2be] bg-[#fdf2f2] px-3 py-2 text-xs text-[#c0392b]"
        >
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <section className="op-card p-4 sm:p-5">
            <h2 className="text-sm text-[#22303c]">Informasi barang</h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-dashed border-[#d8e1ea] bg-[#f8fafc]">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Foto barang" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon aria-hidden="true" className="h-7 w-7 text-[#8fa3b5]" />
                )}
              </div>
              <div className="flex flex-col items-start justify-center">
                <p className="text-xs text-[#22303c]">Foto barang</p>
                <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-[#5f6f82]">
                  Foto tampil di kasir dan katalog toko. Gambar akan diperkecil
                  otomatis sebelum disimpan.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="op-btn op-btn-sm cursor-pointer">
                    <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                    Pilih foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadPhoto}
                      className="sr-only"
                    />
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="op-btn op-btn-sm"
                    >
                      <X aria-hidden="true" className="h-3.5 w-3.5" />
                      Hapus foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[#22303c]">
                Nama barang
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Contoh: Susu UHT Cokelat 1 Liter"
                  className="op-input mt-1"
                />
              </label>
              <label className="text-xs text-[#22303c]">
                Kategori
                <input
                  value={productCategory}
                  onChange={(event) => setProductCategory(event.target.value)}
                  placeholder="Contoh: Minuman"
                  className="op-input mt-1"
                />
              </label>
              <label className="text-xs text-[#22303c]">
                Kode barang
                <input
                  required
                  value={sku}
                  onChange={(event) => setSku(event.target.value)}
                  className="op-input mt-1"
                />
              </label>
              <label className="text-xs text-[#22303c]">
                Satuan
                <input
                  required
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="pcs / bungkus / kg"
                  className="op-input mt-1"
                />
              </label>
              {config?.enable_variant_matrix && (
                <label className="text-xs text-[#22303c] sm:col-span-2">
                  {attrLabel}
                  <input
                    value={variantLabel}
                    onChange={(event) => setVariantLabel(event.target.value)}
                    placeholder={`Isi ${attrLabel.toLowerCase()}...`}
                    className="op-input mt-1"
                  />
                </label>
              )}
            </div>
          </section>

          <section className="op-card p-4 sm:p-5">
            <h2 className="text-sm text-[#22303c]">Harga dan stok</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="text-xs text-[#22303c]">
                Harga beli (Rp)
                <input
                  required
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={costPrice}
                  onChange={(event) => setCostPrice(event.target.value)}
                  className="op-input tabular-nums mt-1"
                />
              </label>
              <label className="text-xs text-[#22303c]">
                Harga jual (Rp)
                <input
                  required
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={sellPrice}
                  onChange={(event) => setSellPrice(event.target.value)}
                  className="op-input tabular-nums mt-1"
                />
              </label>
              <label className="col-span-2 text-xs text-[#22303c] sm:col-span-1">
                Jumlah stok
                <input
                  required
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={stockQty}
                  onChange={(event) => setStockQty(event.target.value)}
                  className="op-input tabular-nums mt-1"
                />
              </label>
            </div>
            {config?.enable_wholesale_tier && (
              <div className="mt-4 grid gap-3 rounded-[5px] border border-[#d8e1ea] bg-[#f8fafc] p-3 sm:grid-cols-2">
                <label className="text-xs text-[#22303c]">
                  Harga grosir (Rp)
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={wholesalePrice}
                    onChange={(event) => setWholesalePrice(event.target.value)}
                    placeholder="Kosongkan jika tidak ada"
                    className="op-input tabular-nums mt-1"
                  />
                </label>
                <label className="text-xs text-[#22303c]">
                  Minimal jumlah grosir
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={wholesaleMinQty}
                    onChange={(event) => setWholesaleMinQty(event.target.value)}
                    placeholder="Contoh: 6"
                    className="op-input tabular-nums mt-1"
                  />
                </label>
              </div>
            )}
            {config?.enable_expiry_tracking && (
              <label className="mt-4 block text-xs text-[#22303c]">
                Tanggal kedaluwarsa
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(event) => setExpiryDate(event.target.value)}
                  className="op-input mt-1 sm:max-w-xs"
                />
              </label>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <section className="op-card p-4 sm:p-5">
            <h2 className="text-sm text-[#22303c]">Katalog online</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs text-[#22303c]">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(event) => setIsOnline(event.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#1976d2] sm:h-4 sm:w-4"
              />
              <span>
                Tampilkan barang ini di toko online
                <span className="mt-1 block text-[11px] leading-relaxed text-[#5f6f82]">
                  Pembeli dapat melihat barang dan memesannya lewat WhatsApp.
                </span>
              </span>
            </label>
            {editing && (
              <p className="mt-3 border-t border-[#edf2f7] pt-3 text-[11px] leading-relaxed text-[#5f6f82]">
                Perubahan stok atau status katalog akan meminta konfirmasi saat
                disimpan.
              </p>
            )}
          </section>

          <section className="op-card space-y-2 p-4 sm:p-5">
            <button
              type="submit"
              disabled={saving}
              className="op-btn op-btn-primary w-full"
            >
              {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Barang"}
            </button>
            <Link href="/dashboard/inventory" className="op-btn w-full">
              Batal
            </Link>
            <p className="pt-1 text-center text-[11px] text-[#5f6f82]">
              Barang dapat diubah kembali dari menu Barang & Stok.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}
