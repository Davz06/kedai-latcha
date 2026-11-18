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

  // URL Webhook Google Apps Script (Bisa ditempel di sini jika sudah dibuat)
  googleSheetWebhookUrl: '',

  // Opsi Takaran Minuman
  sugarOptions: ['Normal Sugar', 'Less Sugar'],
  iceOptions: ['Normal Ice', 'Less Ice'],

  // Metode Pembayaran (Bisa diedit/ditambah sendiri dengan mudah)
  metodePembayaran: [
    { id: 'tunai', nama: 'Tunai (Cash)', icon: '💵' },
    { id: 'dana',  nama: 'DANA',         icon: '💙' },
    { id: 'gopay', nama: 'GoPay',        icon: '💚' },
  ],
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
    nama: 'Mirza Ashabul Annafi Oemar',
    jabatan: 'Owner Kedai Latcha',
    kelas: 'XII RPL 1',
    bio: 'Penggagas utama Kedai Latcha, menghadirkan racikan latte segar berkualitas hemat di Bukit Palem.',
    suka: 'Coffee Latte 8K',
    foto: 'img/tim-mirza.webp',
  },
  {
    nama: 'Dava Zaky Abdulgani',
    jabatan: 'Web Developer & Layanan 24 Jam',
    kelas: 'XII RPL 1',
    bio: 'Mengembangkan website dan memastikan sistem pemesanan online Kedai Latcha aktif 24 jam.',
    suka: 'Coffee Latte 8K',
    foto: 'img/tim-dava.webp',
  },
  {
    nama: 'M. Fadhil Al-Fajri',
    jabatan: 'Marketing & Supplier Keeper',
    kelas: 'XII RPL 1',
    bio: 'Menjaga pasokan bahan baku kopi & matcha selalu segar dan berkualitas tinggi tiap hari.',
    suka: 'Matcha Latte 10K',
    foto: 'img/tim-fadhil.webp',
  },
  {
    nama: 'M. Shaquille Ihsan Habibie',
    jabatan: 'Marketing',
    kelas: 'XII RPL 1',
    bio: 'Menyebarkan kesegaran racikan Kedai Latcha ke seluruh Citra Indah City dan sekitarnya.',
    suka: 'Matcha Latte 10K',
    foto: 'img/tim-shaquille.webp',
  },
  {
    nama: 'Jiro Nando Zavier',
    jabatan: 'Marketing & Media Kreatif',
    kelas: 'XII RPL 1',
    bio: 'Merancang promosi kreatif dan membangun interaksi hangat bersama para pelanggan setia Latcha.',
    suka: 'Coffee Latte 8K',
    foto: 'img/tim-jiro.webp',
  },
];

// Support CommonJS export for testing environments while preserving browser globals
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, MENU, TIM };
}
