import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding database Warungin...");

  await prisma.orderItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.modulesConfig.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // ==========================================
  // 1. TOKO SEMBAKO BERKAH JAYA
  // ==========================================
  const user1 = await prisma.user.create({
    data: {
      email: "berkah@demo.warungin.id",
      password_hash: "demo123",
      role: "OWNER",
    },
  });

  const store1 = await prisma.store.create({
    data: {
      user_id: user1.id,
      store_name: "Toko Sembako Berkah Jaya",
      slug: "berkah-jaya",
      category: "Toko Kelontong / Warung Sembako",
      description:
        "Menyediakan kebutuhan pokok harian, beras, minyak goreng, gula, mie instan, dan sembako harga ecer maupun grosir.",
      is_online_enabled: true,
      whatsapp_number: "6281234567801",
      account_holder_name: "H. Ahmad Fauzi",
      onboarding_attempts: 1,
      modules_config: {
        create: {
          enable_expiry_tracking: true,
          enable_variant_matrix: false,
          enable_wholesale_tier: true,
          enable_shift_log: false,
          enable_debt_book: true,
          low_stock_threshold: 10,
          ai_summary_reason:
            "Diaktifkan modul Pelacakan Kedaluwarsa, Harga Grosir Bertingkat, dan Buku Kasbon karena toko sembako mengelola produk makanan/minuman berbatas tanggal simpan, melayani pembelian dus/partai, serta memiliki pelanggan tetangga tetap.",
          raw_onboarding_json: JSON.stringify({
            q1: "Ya, banyak produk susu, roti, dan bumbu yang ada tanggal kedaluwarsanya.",
            q2: "Kami jual eceran dan grosir (beli minimal 6 atau 12 lebih murah).",
            q3: "Sering ada tetangga langganan yang ambil barang dulu dan bayar mingguan.",
          }),
        },
      },
    },
  });

  const s1Products = await Promise.all([
    prisma.product.create({
      data: {
        store_id: store1.id,
        sku: "SBK-001",
        name: "Beras Ramos Premium 5 Kg",
        unit: "karung",
        cost_price: 64000,
        sell_price: 72000,
        wholesale_price: 69500,
        wholesale_min_qty: 5,
        stock_qty: 28,
        is_online: true,
        expiry_date: "2027-02-15",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store1.id,
        sku: "SBK-002",
        name: "Minyak Goreng Sawit 2 Liter",
        unit: "pouch",
        cost_price: 31000,
        sell_price: 35000,
        wholesale_price: 33500,
        wholesale_min_qty: 6,
        stock_qty: 42,
        is_online: true,
        expiry_date: "2027-05-10",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store1.id,
        sku: "SBK-003",
        name: "Gula Pasir Kristal Putih 1 Kg",
        unit: "bungkus",
        cost_price: 15500,
        sell_price: 17500,
        wholesale_price: 16800,
        wholesale_min_qty: 10,
        stock_qty: 8, // Stok menipis (< 10)
        is_online: true,
        expiry_date: "2027-08-01",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store1.id,
        sku: "SBK-004",
        name: "Telur Ayam Negeri 1 Kg",
        unit: "kg",
        cost_price: 25000,
        sell_price: 28500,
        wholesale_price: 27000,
        wholesale_min_qty: 5,
        stock_qty: 6, // Stok menipis
        is_online: true,
        expiry_date: "2026-11-04",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store1.id,
        sku: "SBK-005",
        name: "Mie Instan Goreng (Paket 5 Bungkus)",
        unit: "paket",
        cost_price: 13500,
        sell_price: 15500,
        wholesale_price: 14500,
        wholesale_min_qty: 8,
        stock_qty: 50,
        is_online: true,
        expiry_date: "2027-01-20",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store1.id,
        sku: "SBK-006",
        name: "Susu UHT Full Cream 1 Liter",
        unit: "kotak",
        cost_price: 16500,
        sell_price: 19500,
        wholesale_price: 18200,
        wholesale_min_qty: 6,
        stock_qty: 5, // Stok menipis & mendekati expired
        is_online: true,
        expiry_date: "2026-11-02",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store1.id,
        sku: "SBK-007",
        name: "Kopi Bubuk Hitam Spesial 165g",
        unit: "bungkus",
        cost_price: 12000,
        sell_price: 14500,
        wholesale_price: 13500,
        wholesale_min_qty: 10,
        stock_qty: 34,
        is_online: true,
        expiry_date: "2027-06-12",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store1.id,
        sku: "SBK-008",
        name: "Gas LPG 3 Kg (Khusus Ambil di Warung)",
        unit: "tabung",
        cost_price: 18000,
        sell_price: 21000,
        stock_qty: 12,
        is_online: false, // Offline only
      },
    }),
  ]);

  // Transaksi Toko 1
  await prisma.transaction.create({
    data: {
      store_id: store1.id,
      invoice_code: "INV-BJ-261027-001",
      channel: "OFFLINE_POS",
      status: "COMPLETED",
      payment_method: "TUNAI",
      customer_name: "Pembeli Umum",
      is_debt_paid: true,
      total_amount: 142000,
      confirmed_at: new Date(),
      items: {
        create: [
          {
            product_id: s1Products[0].id,
            product_name: s1Products[0].name,
            unit_price: 72000,
            qty: 1,
            subtotal: 72000,
          },
          {
            product_id: s1Products[1].id,
            product_name: s1Products[1].name,
            unit_price: 35000,
            qty: 2,
            subtotal: 70000,
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      store_id: store1.id,
      invoice_code: "INV-BJ-261027-002",
      channel: "OFFLINE_POS",
      status: "COMPLETED",
      payment_method: "KASBON",
      customer_name: "Bu Rahma (RT 04)",
      customer_wa: "081398765432",
      customer_note: "Bayar hari Sabtu pagi",
      is_debt_paid: false,
      total_amount: 63500,
      confirmed_at: new Date(),
      items: {
        create: [
          {
            product_id: s1Products[2].id,
            product_name: s1Products[2].name,
            unit_price: 17500,
            qty: 2,
            subtotal: 35000,
          },
          {
            product_id: s1Products[3].id,
            product_name: s1Products[3].name,
            unit_price: 28500,
            qty: 1,
            subtotal: 28500,
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      store_id: store1.id,
      invoice_code: "WA-BJ-261027-003",
      channel: "WHATSAPP_ONLINE",
      status: "PENDING_CONFIRMATION",
      payment_method: "TRANSFER",
      customer_name: "Ibu Siti Aminah",
      customer_wa: "081288990011",
      customer_note: "Tolong diantar ke Jl. Melati No. 12 sore ini ya Pak.",
      is_debt_paid: true,
      total_amount: 173000,
      items: {
        create: [
          {
            product_id: s1Products[0].id,
            product_name: s1Products[0].name,
            unit_price: 72000,
            qty: 2,
            subtotal: 144000,
          },
          {
            product_id: s1Products[6].id,
            product_name: s1Products[6].name,
            unit_price: 14500,
            qty: 2,
            subtotal: 29000,
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      store_id: store1.id,
      invoice_code: "WA-BJ-261027-004",
      channel: "WHATSAPP_ONLINE",
      status: "PENDING_CONFIRMATION",
      payment_method: "QRIS",
      customer_name: "Pak Hendra",
      customer_wa: "085711223344",
      customer_note: "Saya ambil sendiri jam 5 sore sepulang kerja.",
      is_debt_paid: true,
      total_amount: 86500,
      items: {
        create: [
          {
            product_id: s1Products[1].id,
            product_name: s1Products[1].name,
            unit_price: 35000,
            qty: 1,
            subtotal: 35000,
          },
          {
            product_id: s1Products[4].id,
            product_name: s1Products[4].name,
            unit_price: 15500,
            qty: 2,
            subtotal: 31000,
          },
          {
            product_id: s1Products[5].id,
            product_name: s1Products[5].name,
            unit_price: 19500,
            qty: 1,
            subtotal: 19500,
          },
        ],
      },
    },
  });

  // ==========================================
  // 2. BUTIK NUSANTARA WEAR
  // ==========================================
  const user2 = await prisma.user.create({
    data: {
      email: "nusantara@demo.warungin.id",
      password_hash: "demo123",
      role: "OWNER",
    },
  });

  const store2 = await prisma.store.create({
    data: {
      user_id: user2.id,
      store_name: "Butik Nusantara Wear",
      slug: "nusantara-wear",
      category: "Butik & Pakaian",
      description:
        "Koleksi kemeja tenun, batik tulis kasual, blus kerja wanita, dan busana muslim harian dengan bahan katun sejuk.",
      is_online_enabled: true,
      whatsapp_number: "6281234567802",
      account_holder_name: "Nadia Putri Larasati",
      onboarding_attempts: 1,
      modules_config: {
        create: {
          enable_expiry_tracking: false,
          enable_variant_matrix: true,
          enable_wholesale_tier: false,
          enable_shift_log: true,
          enable_debt_book: false,
          low_stock_threshold: 5,
          ai_summary_reason:
            "Diaktifkan modul Matriks Varian (Ukuran/Warna) dan Pencatatan Shift Kasir untuk memisahkan stok ukuran pakaian (M/L/XL) serta memantau transaksi kasir pagi dan malam di butik.",
          raw_onboarding_json: JSON.stringify({
            q1: "Setiap model baju punya varian ukuran S, M, L, XL dan warna.",
            q2: "Ada 2 staf jaga toko yang bergantian shift pagi dan sore.",
            q3: "Semua pembayaran lunas via QRIS, transfer, atau tunai.",
          }),
        },
      },
    },
  });

  const s2Products = await Promise.all([
    prisma.product.create({
      data: {
        store_id: store2.id,
        sku: "BNW-001",
        name: "Kemeja Batik Sogan Pria Lengan Panjang",
        unit: "pcs",
        cost_price: 110000,
        sell_price: 165000,
        stock_qty: 14,
        is_online: true,
        variant_label: "Ukuran L - Cokelat Sogan",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store2.id,
        sku: "BNW-002",
        name: "Kemeja Batik Sogan Pria Lengan Panjang",
        unit: "pcs",
        cost_price: 110000,
        sell_price: 165000,
        stock_qty: 3, // Stok menipis (< 5)
        is_online: true,
        variant_label: "Ukuran XL - Cokelat Sogan",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store2.id,
        sku: "BNW-003",
        name: "Blus Tenun Troso Wanita Modern",
        unit: "pcs",
        cost_price: 125000,
        sell_price: 189000,
        stock_qty: 9,
        is_online: true,
        variant_label: "Ukuran M - Biru Indigo",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store2.id,
        sku: "BNW-004",
        name: "Tunik Katun Bordir Senada",
        unit: "pcs",
        cost_price: 98000,
        sell_price: 149000,
        stock_qty: 4, // Stok menipis (< 5)
        is_online: true,
        variant_label: "All Size - Putih Gading",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store2.id,
        sku: "BNW-005",
        name: "Celana Kulot Linen Premium",
        unit: "pcs",
        cost_price: 85000,
        sell_price: 129000,
        stock_qty: 18,
        is_online: true,
        variant_label: "All Size - Khaki",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store2.id,
        sku: "BNW-006",
        name: "Pashmina Voal Motif Nusantara",
        unit: "pcs",
        cost_price: 42000,
        sell_price: 68000,
        stock_qty: 25,
        is_online: true,
        variant_label: "180x75cm - Terracotta",
      },
    }),
  ]);

  await prisma.transaction.create({
    data: {
      store_id: store2.id,
      invoice_code: "INV-BNW-261027-001",
      channel: "OFFLINE_POS",
      status: "COMPLETED",
      payment_method: "QRIS",
      customer_name: "Kak Rina",
      shift_name: "Pagi",
      is_debt_paid: true,
      total_amount: 354000,
      confirmed_at: new Date(),
      items: {
        create: [
          {
            product_id: s2Products[0].id,
            product_name: `${s2Products[0].name} (${s2Products[0].variant_label})`,
            unit_price: 165000,
            qty: 1,
            subtotal: 165000,
          },
          {
            product_id: s2Products[2].id,
            product_name: `${s2Products[2].name} (${s2Products[2].variant_label})`,
            unit_price: 189000,
            qty: 1,
            subtotal: 189000,
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      store_id: store2.id,
      invoice_code: "WA-BNW-261027-002",
      channel: "WHATSAPP_ONLINE",
      status: "PENDING_CONFIRMATION",
      payment_method: "TRANSFER",
      customer_name: "Dian Sastroamidjojo",
      customer_wa: "081122334455",
      customer_note: "Mohon dicek jahitan kancing sebelum dikirim via kurir instan.",
      is_debt_paid: true,
      total_amount: 217000,
      items: {
        create: [
          {
            product_id: s2Products[3].id,
            product_name: `${s2Products[3].name} (${s2Products[3].variant_label})`,
            unit_price: 149000,
            qty: 1,
            subtotal: 149000,
          },
          {
            product_id: s2Products[5].id,
            product_name: `${s2Products[5].name} (${s2Products[5].variant_label})`,
            unit_price: 68000,
            qty: 1,
            subtotal: 68000,
          },
        ],
      },
    },
  });

  // ==========================================
  // 3. TOKO BAHAN KUE MANIS
  // ==========================================
  const user3 = await prisma.user.create({
    data: {
      email: "kuemanis@demo.warungin.id",
      password_hash: "demo123",
      role: "OWNER",
    },
  });

  const store3 = await prisma.store.create({
    data: {
      user_id: user3.id,
      store_name: "Toko Bahan Kue Manis",
      slug: "kue-manis",
      category: "Toko Bahan Kue & Roti",
      description:
        "Pusat bahan baking lengkap: tepung terigu protein tinggi, mentega wisman/anchor, cokelat batang, keju, dan kemasan kotak kue.",
      is_online_enabled: true,
      whatsapp_number: "6281234567803",
      account_holder_name: "Chef Liana Wijaya",
      onboarding_attempts: 1,
      modules_config: {
        create: {
          enable_expiry_tracking: true,
          enable_variant_matrix: false,
          enable_wholesale_tier: true,
          enable_shift_log: true,
          enable_debt_book: false,
          low_stock_threshold: 8,
          ai_summary_reason:
            "Diaktifkan modul Pelacakan Kedaluwarsa, Harga Grosir Bertingkat, dan Shift Kasir karena bahan kue seperti ragi, keju, dan butter sensitif terhadap masa kedaluwarsa serta sering dibeli partai oleh usaha bakery rumahan.",
          raw_onboarding_json: JSON.stringify({
            q1: "Keju, mentega, ragi, dan whipping cream wajib dipantau tanggal kedaluwarsanya.",
            q2: "Banyak pelanggan UMKM kue yang beli kartonan dengan harga grosir.",
            q3: "Toko buka dari jam 7 pagi sampai 8 malam dengan 2 shift kasir.",
          }),
        },
      },
    },
  });

  const s3Products = await Promise.all([
    prisma.product.create({
      data: {
        store_id: store3.id,
        sku: "BKM-001",
        name: "Tepung Terigu Protein Tinggi 1 Kg",
        unit: "bungkus",
        cost_price: 12500,
        sell_price: 15000,
        wholesale_price: 14000,
        wholesale_min_qty: 10,
        stock_qty: 40,
        is_online: true,
        expiry_date: "2027-03-15",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store3.id,
        sku: "BKM-002",
        name: "Dark Cooking Chocolate Compound 250g",
        unit: "batang",
        cost_price: 19000,
        sell_price: 24000,
        wholesale_price: 22000,
        wholesale_min_qty: 6,
        stock_qty: 22,
        is_online: true,
        expiry_date: "2027-04-30",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store3.id,
        sku: "BKM-003",
        name: "Unsalted Butter New Zealand 227g",
        unit: "blok",
        cost_price: 44000,
        sell_price: 53000,
        wholesale_price: 50000,
        wholesale_min_qty: 5,
        stock_qty: 6, // Stok menipis (< 8)
        is_online: true,
        expiry_date: "2026-11-05",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store3.id,
        sku: "BKM-004",
        name: "Keju Cheddar Olahan 165g",
        unit: "kotak",
        cost_price: 18500,
        sell_price: 22500,
        wholesale_price: 21000,
        wholesale_min_qty: 8,
        stock_qty: 30,
        is_online: true,
        expiry_date: "2027-02-20",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store3.id,
        sku: "BKM-005",
        name: "Ragi Instan Roti 11g (Isi 4 Sachet)",
        unit: "pak",
        cost_price: 14000,
        sell_price: 18000,
        wholesale_price: 16500,
        wholesale_min_qty: 10,
        stock_qty: 5, // Stok menipis
        is_online: true,
        expiry_date: "2026-11-10",
      },
    }),
    prisma.product.create({
      data: {
        store_id: store3.id,
        sku: "BKM-006",
        name: "Kotak Kemasan Brownies Kraft 22x10cm (Isi 10)",
        unit: "ikat",
        cost_price: 16000,
        sell_price: 21000,
        wholesale_price: 19000,
        wholesale_min_qty: 5,
        stock_qty: 19,
        is_online: true,
      },
    }),
  ]);

  await prisma.transaction.create({
    data: {
      store_id: store3.id,
      invoice_code: "INV-BKM-261027-001",
      channel: "OFFLINE_POS",
      status: "COMPLETED",
      payment_method: "TUNAI",
      customer_name: "Dapur Mama Nisa",
      shift_name: "Pagi",
      is_debt_paid: true,
      total_amount: 188000,
      confirmed_at: new Date(),
      items: {
        create: [
          {
            product_id: s3Products[0].id,
            product_name: s3Products[0].name,
            unit_price: 14000,
            qty: 10,
            subtotal: 140000,
          },
          {
            product_id: s3Products[1].id,
            product_name: s3Products[1].name,
            unit_price: 24000,
            qty: 2,
            subtotal: 48000,
          },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      store_id: store3.id,
      invoice_code: "WA-BKM-261027-002",
      channel: "WHATSAPP_ONLINE",
      status: "PENDING_CONFIRMATION",
      payment_method: "TRANSFER",
      customer_name: "Kue Basah Bu Sri",
      customer_wa: "081900112233",
      customer_note: "Pesan untuk produksi besok pagi ya Ci.",
      is_debt_paid: true,
      total_amount: 151000,
      items: {
        create: [
          {
            product_id: s3Products[2].id,
            product_name: s3Products[2].name,
            unit_price: 53000,
            qty: 2,
            subtotal: 106000,
          },
          {
            product_id: s3Products[3].id,
            product_name: s3Products[3].name,
            unit_price: 22500,
            qty: 2,
            subtotal: 45000,
          },
        ],
      },
    },
  });

  console.log("Seeding database Warungin selesai dengan 3 Toko Contoh!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
