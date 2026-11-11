// ============================================================
// js/data.js — Kedai Latcha
// Edit file ini untuk mengubah menu, tim, dan konfigurasi.
// Tidak perlu menyentuh HTML atau JS lainnya.
// ============================================================

const CONFIG = {
  whatsapp: '628123456789', // Ganti dengan nomor WhatsApp kedai (format: 62xxxxxxxxxx)
  jamBuka: 'Setiap hari 07.00 – 21.00 WIB',
  alamat: 'Jl. Kemang Selatan No. 21, Jakarta',
  namaKedai: 'Kedai Latcha',
};

const MENU = [
  {
    id: 'es-kopi-susu',
    nama: 'Es Kopi Susu Senja',
    harga: 28000,
    deskripsi: 'Espresso, susu segar & gula aren organik.',
    gambar: 'img/menu-es-kopi-susu.webp',
    badge: 'Terfavorit',
    tersedia: true,
  },
  {
    id: 'americano-cold-brew',
    nama: 'Americano Cold Brew',
    harga: 26000,
    deskripsi: 'Perem 16 jam, fruity & menyegarkan.',
    gambar: 'img/menu-americano.webp',
    badge: null,
    tersedia: true,
  },
  {
    id: 'v60-single-origin',
    nama: 'V60 Single Origin',
    harga: 35000,
    deskripsi: 'Gayo / Kintamani, karakter rasa terang.',
    gambar: 'img/menu-v60.webp',
    badge: 'Best Filter',
    tersedia: true,
  },
  {
    id: 'kopi-latte-oat',
    nama: 'Kopi Latte Oat',
    harga: 32000,
    deskripsi: 'Espresso ganda dengan susu oat premium.',
    gambar: 'img/menu-latte-oat.webp',
    badge: null,
    tersedia: true,
  },
];

const TIM = [
  {
    nama: 'Bagas Pratama',
    jabatan: 'Head Roaster',
    bio: '7 tahun pengalaman sangrai biji Nusantara.',
    suka: 'Gayo Honey V60',
    foto: 'img/tim-bagas.webp',
  },
  {
    nama: 'Rania Salsabila',
    jabatan: 'Lead Barista',
    bio: 'Spesialis latte art & racikan gula aren.',
    suka: 'Es Kopi Senja',
    foto: 'img/tim-rania.webp',
  },
  {
    nama: 'Doni Wijaya',
    jabatan: 'Coffee Specialist',
    bio: 'Kurator biji kopi langsung dari petani.',
    suka: 'Toraja Sapan',
    foto: 'img/tim-doni.webp',
  },
  {
    nama: 'Maya Putri',
    jabatan: 'Pastry Chef',
    bio: 'Pembuat roti & dessert pendamping kopi.',
    suka: 'Cappuccino + Croissant',
    foto: 'img/tim-maya.webp',
  },
  {
    nama: 'Adit Nugroho',
    jabatan: 'Store Manager',
    bio: 'Memastikan pengalaman berkedai yang hangat.',
    suka: 'Americano Cold Brew',
    foto: 'img/tim-adit.webp',
  },
];
