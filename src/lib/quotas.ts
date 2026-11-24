export const MICRO_RET_QUOTAS = {
  MAX_STORES_PER_USER: 1,
  MAX_PRODUCTS_PER_STORE: 50,
  MAX_ITEMS_PER_TRANSACTION: 15,
  MAX_PENDING_WA_ORDERS: 20,
  MAX_RECENT_TRANSACTIONS: 20,
  MAX_ONBOARDING_ATTEMPTS: 3,
} as const;

export const CUSTOM_CATEGORY_VALUE = "__LAINNYA__";

export const RETAIL_CATEGORY_SUGGESTIONS = [
  "Warung Sembako / Toko Kelontong",
  "Makanan, Kue, Roti & Minuman",
  "Pakaian, Hijab, Sepatu & Aksesoris",
  "Konter HP, Pulsa & Elektronik",
  "Kosmetik, Skincare & Perawatan Diri",
  "Apotek Mini & Toko Obat",
  "Petshop, Pakan Hewan & Tanaman",
  "Toko Bangunan, Material & Alat Teknik",
  "Alat Tulis Kantor (ATK) & Fotokopi",
  "Sayur Segar, Buah & Frozen Food",
] as const;

// Tetap diekspor untuk kompatibilitas impor lama
export const RETAIL_CATEGORIES = RETAIL_CATEGORY_SUGGESTIONS;
