// ============================================================
// js/data.js — Kedai Latcha
// Edit file ini untuk mengubah menu, tim, dan konfigurasi.
// Tidak perlu menyentuh HTML atau JS lainnya.
// ============================================================

const CONFIG = {
  namaKedai: 'Kedai Latcha',
  whatsapp: '6285819589125', // Nomor WhatsApp kedai (format: 62xxxxxxxxxx)
  phoneDisplay: '0858-1958-9125',
  tagline: 'Coffee Latte 8K · Matcha Latte 10K · Iced Only, dibuat segar tiap pesanan',
  alamat: 'Citra Indah City, Bukit Palem',
  lokasi: 'Citra Indah City, Bukit Palem',
  jamBuka: 'Setiap hari 07.00 – 21.00 WIB',
  copyright: '© 2025 Kedai Latcha — Coffee & Matcha Latte (Citra Indah City, Bukit Palem)',
};

const MENU = [
  {
    id: 'coffee-latte',
    nama: 'Coffee Latte',
    harga: 8000,
    deskripsi: 'Es kopi susu segar racikan khas Kedai Latcha. Creamy, seimbang, manis pas.',
    gambar: 'img/menu-coffee-latte.webp',
    badge: 'Terfavorit',
    tersedia: true,
  },
  {
    id: 'matcha-latte',
    nama: 'Matcha Latte',
    harga: 10000,
    deskripsi: 'Pure matcha Jepang berpadu susu segar dingin. Manis lembut, earthy autentik.',
    gambar: 'img/menu-matcha-latte.webp',
    badge: 'Best Seller',
    tersedia: true,
  },
];

const TIM = [
  {
    nama: 'Nadia Latcha',
    jabatan: 'Founder & Recipe Creator',
    bio: 'Pencipta resep Matcha Latte 10K & Coffee Latte 8K.',
    suka: 'Matcha Latte 10K',
    foto: 'img/tim-nadia.webp',
  },
  {
    nama: 'Rizky Barista',
    jabatan: 'Head Barista',
    bio: 'Barista ramah pengatur takaran manis & es melimpah.',
    suka: 'Coffee Latte 8K',
    foto: 'img/tim-rizky.webp',
  },
  {
    nama: 'Siti Rahma',
    jabatan: 'Quality & Bahan',
    bio: 'Memastikan susu & matcha selalu segar dan higienis.',
    suka: 'Matcha Latte 10K',
    foto: 'img/tim-siti.webp',
  },
  {
    nama: 'Bima Putra',
    jabatan: 'Operasional & Kasir',
    bio: 'Melayani pesan WhatsApp 0858-1958-9125 dengan cepat.',
    suka: 'Coffee Latte 8K',
    foto: 'img/tim-bima.webp',
  },
  {
    nama: 'Fajar Kurir',
    jabatan: 'Antar & Pre-Order',
    bio: 'Kurir sigap siap antar dingin untuk Citra Indah City.',
    suka: 'Red Velvet Ice',
    foto: 'img/tim-fajar.webp',
  },
];

// Support CommonJS export for testing environments while preserving browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, MENU, TIM };
}
