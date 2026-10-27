export const MICRO_RET_QUOTAS = {
  MAX_STORES_PER_USER: 1,
  MAX_PRODUCTS_PER_STORE: 50,
  MAX_ITEMS_PER_TRANSACTION: 15,
  MAX_PENDING_WA_ORDERS: 20,
  MAX_RECENT_TRANSACTIONS: 20,
  MAX_ONBOARDING_ATTEMPTS: 2,
} as const;

export const RETAIL_CATEGORIES = [
  "Toko Kelontong / Warung Sembako",
  "Butik & Pakaian",
  "Toko Bahan Kue & Roti",
  "Apotek Mini & Kesehatan",
  "Kios Perlengkapan Harian",
] as const;

export type RetailCategory = (typeof RETAIL_CATEGORIES)[number];
