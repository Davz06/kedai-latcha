// ============================================================
// js/app.js — Kedai Latcha
// Logika Aplikasi: Keranjang Pesanan, WhatsApp Generator,
// Navigasi Mobile, Feedback Interaktif, dan Render Data
// ============================================================

/* ─── Konfigurasi & Data Fallback ─────────────────────────── */
var WA_DEFAULT_NUMBER = '6285819589125';
var DEFAULT_PREORDER_TEXT = 'Halo Kedai Latcha, saya mau pre-order...';

function getStoreConfig() {
  if (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.whatsapp) {
    return CONFIG;
  }
  return {
    whatsapp: WA_DEFAULT_NUMBER,
    phoneDisplay: '0858-1958-9125',
    namaKedai: 'Kedai Latcha',
    alamat: 'Citra Indah City, Bukit Palem',
    tagline: 'Coffee Latte 8K · Matcha Latte 10K · Iced Only, dibuat segar tiap pesanan',
  };
}

function getMenuList() {
  if (typeof MENU !== 'undefined' && Array.isArray(MENU) && MENU.length > 0) {
    return MENU;
  }
  return [
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
}

function getTeamList() {
  if (typeof TIM !== 'undefined' && Array.isArray(TIM) && TIM.length > 0) {
    return TIM;
  }
  return [];
}

/* ─── Utility: Format Rupiah ───────────────────────────────── */
function formatRupiah(n) {
  var num = parseInt(n, 10) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}

/* ─── State: Cart ─────────────────────────────────────────── */
var cart = [];

function saveCart() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (e) {
    // LocalStorage quota atau disabled
  }
}

function loadCart() {
  if (typeof localStorage === 'undefined') return;
  try {
    var raw = localStorage.getItem('cart');
    if (!raw) return;
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cart = [];
      return;
    }
    var menuList = getMenuList();
    cart = parsed
      .map(function (item) {
        if (!item || !item.id) return null;
        var menuItem = menuList.find(function (m) {
          return m.id === item.id;
        });
        if (!menuItem || (menuItem.tersedia === false)) return null;
        return {
          id: menuItem.id,
          nama: menuItem.nama,
          harga: menuItem.harga,
          qty: Math.max(1, parseInt(item.qty, 10) || 1),
        };
      })
      .filter(Boolean);
  } catch (e) {
    cart = [];
  }
}

function addToCart(id) {
  var menuList = getMenuList();
  var menuItem = menuList.find(function (m) {
    return m.id === id;
  });
  if (!menuItem || menuItem.tersedia === false) return;

  var existing = cart.find(function (c) {
    return c.id === id;
  });
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: menuItem.id,
      nama: menuItem.nama,
      harga: menuItem.harga,
      qty: 1,
    });
  }

  saveCart();
  updateCartUI();
  bumpCartButton();
  showToast(menuItem.nama + ' ditambahkan ke pesanan!');
}

function removeFromCart(id) {
  var item = cart.find(function (c) {
    return c.id === id;
  });
  var idx = cart.findIndex(function (c) {
    return c.id === id;
  });
  if (idx !== -1) {
    cart.splice(idx, 1);
  }
  saveCart();
  updateCartUI();
  if (item) {
    showToast(item.nama + ' dihapus dari pesanan');
  }
}

function changeQty(id, delta) {
  var item = cart.find(function (c) {
    return c.id === id;
  });
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart();
  updateCartUI();
}

function clearCart() {
  cart.length = 0;
  saveCart();
  updateCartUI();
}

function getCart() {
  return cart;
}

function getTotalQty() {
  return cart.reduce(function (sum, c) {
    return sum + (parseInt(c.qty, 10) || 0);
  }, 0);
}

function getTotalHarga() {
  return cart.reduce(function (sum, c) {
    return sum + (parseInt(c.qty, 10) || 0) * (parseInt(c.harga, 10) || 0);
  }, 0);
}

/* ─── Cart UI ─────────────────────────────────────────────── */
function updateCartUI() {
  if (typeof document === 'undefined') return;
  var countEl = document.getElementById('cart-count');
  var itemsEl = document.getElementById('cart-items');
  var emptyEl = document.getElementById('cart-empty');
  var totalEl = document.getElementById('cart-total-price');
  var checkoutBtn = document.getElementById('checkout-btn');

  var totalQty = getTotalQty();
  if (countEl) {
    countEl.textContent = totalQty;
  }

  if (cart.length === 0) {
    if (itemsEl) itemsEl.innerHTML = '';
    if (emptyEl) emptyEl.removeAttribute('hidden');
    if (totalEl) totalEl.textContent = formatRupiah(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
    if (emptyEl) emptyEl.setAttribute('hidden', '');
    if (checkoutBtn) checkoutBtn.disabled = false;

    if (itemsEl) {
      itemsEl.innerHTML = cart
        .map(function (item) {
          var subtotal = item.qty * item.harga;
          return (
            '<div class="cart-item" data-id="' + item.id + '">' +
              '<div class="cart-item-info">' +
                '<div class="cart-item-name">' + item.nama + '</div>' +
                '<div class="cart-item-price">' + formatRupiah(item.harga) + '</div>' +
              '</div>' +
              '<div class="cart-qty-controls">' +
                '<button class="qty-btn qty-minus" data-id="' + item.id + '" data-delta="-1" aria-label="Kurangi jumlah ' + item.nama + '">−</button>' +
                '<span class="cart-qty-num">' + item.qty + '</span>' +
                '<button class="qty-btn qty-plus" data-id="' + item.id + '" data-delta="1" aria-label="Tambah jumlah ' + item.nama + '">+</button>' +
              '</div>' +
              '<span class="cart-item-subtotal">' + formatRupiah(subtotal) + '</span>' +
              '<button class="cart-item-delete" data-id="' + item.id + '" aria-label="Hapus ' + item.nama + '">🗑</button>' +
            '</div>'
          );
        })
        .join('');
    }

    if (totalEl) {
      totalEl.textContent = formatRupiah(getTotalHarga());
    }
  }
}

function bumpCartButton() {
  if (typeof document === 'undefined') return;
  var cartBtn = document.getElementById('cart-btn');
  if (!cartBtn) return;
  cartBtn.classList.remove('cart-bump');
  // Trigger reflow to restart animation
  void cartBtn.offsetWidth;
  cartBtn.classList.add('cart-bump');
  cartBtn.style.transition = 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  cartBtn.style.transform = 'scale(1.12)';
  setTimeout(function () {
    cartBtn.style.transform = 'scale(1)';
    cartBtn.classList.remove('cart-bump');
  }, 220);
}

/* ─── Render Menu ─────────────────────────────────────────── */
function renderMenu() {
  var grid = document.getElementById('menu-grid');
  if (!grid) return;
  var menuList = getMenuList();

  // Jika elemen sudah terisi statically dan panjangnya sama, kita pasang listener & data
  // Tapi bila kosong atau perlu disinkronkan dari data.js:
  grid.innerHTML = menuList
    .map(function (item) {
      var badgeClass = item.id === 'coffee-latte' ? 'badge-coffee' : 'badge-matcha';
      var badgeHtml = item.badge
        ? '<span class="card-badge ' + badgeClass + '">' + item.badge + '</span>'
        : '';
      var priceDisplay = item.harga === 8000 ? '8K' : item.harga === 10000 ? '10K' : formatRupiah(item.harga);
      var actionHtml = item.tersedia !== false
        ? '<button class="card-add-btn" data-id="' + item.id + '" aria-label="Pesan ' + item.nama + ' ke keranjang">' +
            '<svg class="plus-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
              '<path d="M8 3v10M3 8h10" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
            '<span>Pesan (Pre-Order)</span>' +
          '</button>'
        : '<div class="card-sold-out" role="status">Habis Sementara</div>';

      return (
        '<article class="menu-card" data-id="' + item.id + '">' +
          '<div class="card-photo-wrap">' +
            '<img src="' + item.gambar + '" alt="' + item.nama + ' Kedai Latcha" class="card-photo" loading="lazy" width="600" height="400" />' +
            badgeHtml +
          '</div>' +
          '<div class="card-content">' +
            '<div class="card-title-row">' +
              '<h3 class="card-title">' + item.nama + '</h3>' +
              '<span class="price-pill">' + priceDisplay + '</span>' +
            '</div>' +
            '<p class="card-desc">' + item.deskripsi + '</p>' +
            actionHtml +
          '</div>' +
        '</article>'
      );
    })
    .join('');
}

/* ─── Render Tim ──────────────────────────────────────────── */
function renderTim() {
  var grid = document.getElementById('tim-grid');
  if (!grid) return;
  var timList = getTeamList();
  if (!timList || timList.length === 0) return;

  grid.innerHTML = timList
    .map(function (t) {
      return (
        '<article class="team-card">' +
          '<div class="avatar-frame">' +
            '<img src="' + t.foto + '" alt="Foto ' + t.nama + '" class="avatar-img" loading="lazy" width="200" height="200" />' +
          '</div>' +
          '<h3 class="member-name">' + t.nama + '</h3>' +
          '<div class="role-badge">' + t.jabatan + '</div>' +
          '<p class="member-bio">' + t.bio + '</p>' +
          '<div class="fav-box">' +
            '<span class="fav-label">Favorit Racikan:</span>' +
            '<span class="fav-value">' + t.suka + '</span>' +
          '</div>' +
        '</article>'
      );
    })
    .join('');
}

/* ─── Toast Notification ──────────────────────────────────── */
function showToast(msg) {
  if (typeof document === 'undefined') return;
  var toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.remove('hide');
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function () {
    toast.classList.remove('show');
    toast.classList.add('hide');
  }, 2500);
}

/* ─── Focus Trap Helper ───────────────────────────────────── */
function trapFocus(element) {
  if (!element) return;
  var focusable = Array.from(
    element.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  );
  if (focusable.length === 0) return;
  var first = focusable[0];
  var last = focusable[focusable.length - 1];

  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  element._trapFocusHandler = handler;
  element.addEventListener('keydown', handler);
  first.focus();
}

function releaseFocus(element) {
  if (element && element._trapFocusHandler) {
    element.removeEventListener('keydown', element._trapFocusHandler);
    delete element._trapFocusHandler;
  }
}

/* ─── Cart Drawer Controls ────────────────────────────────── */
function openCart() {
  var drawer = document.getElementById('cart-popup');
  if (!drawer) return;
  drawer.removeAttribute('hidden');
  updateCartUI();
  trapFocus(drawer);
}

function closeCart() {
  var drawer = document.getElementById('cart-popup');
  if (!drawer) return;
  drawer.setAttribute('hidden', '');
  releaseFocus(drawer);
  var cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.focus();
}

function toggleCart() {
  var drawer = document.getElementById('cart-popup');
  if (!drawer) return;
  if (drawer.hasAttribute('hidden')) {
    openCart();
  } else {
    closeCart();
  }
}

/* ─── Checkout Modal Controls ─────────────────────────────── */
function toggleAlamatField(tipe) {
  var alamatGroup = document.getElementById('alamat-group');
  var alamatField = document.getElementById('field-alamat');
  var errorAlamat = document.getElementById('error-alamat');
  if (!alamatGroup || !alamatField) return;

  if (tipe === 'antar') {
    alamatGroup.removeAttribute('hidden');
    alamatField.required = true;
  } else {
    alamatGroup.setAttribute('hidden', '');
    alamatField.required = false;
    alamatField.value = '';
    if (errorAlamat) errorAlamat.textContent = '';
  }
}

function openCheckout() {
  closeCart();
  var modal = document.getElementById('checkout-modal');
  if (!modal) return;
  modal.removeAttribute('hidden');

  // Restore saved form values
  try {
    var savedNama = localStorage.getItem('formNama');
    var savedTipe = localStorage.getItem('formTipe');
    var savedAlamat = localStorage.getItem('formAlamat');
    if (savedNama) {
      var fn = document.getElementById('field-nama');
      if (fn) fn.value = savedNama;
    }
    if (savedTipe) {
      var radio = modal.querySelector('input[name="tipe"][value="' + savedTipe + '"]');
      if (radio) {
        radio.checked = true;
        toggleAlamatField(savedTipe);
      }
    }
    if (savedAlamat) {
      var fa = document.getElementById('field-alamat');
      if (fa) fa.value = savedAlamat;
    }
  } catch (e) {}

  var panel = modal.querySelector('.modal-panel') || modal;
  trapFocus(panel);
}

function closeCheckout() {
  var modal = document.getElementById('checkout-modal');
  if (!modal) return;
  modal.setAttribute('hidden', '');
  var panel = modal.querySelector('.modal-panel') || modal;
  releaseFocus(panel);

  var prompt = document.getElementById('cart-clear-prompt');
  if (prompt) prompt.setAttribute('hidden', '');
}

/* ─── WhatsApp Message Builder ────────────────────────────── */
function buildWhatsAppMessage(cartItems, formValues) {
  var lines = [];
  lines.push('Halo Kedai Latcha, saya mau pesan:');
  lines.push('');

  cartItems.forEach(function (item, i) {
    var subtotal = item.qty * item.harga;
    lines.push((i + 1) + '. ' + item.nama + ' x' + item.qty + ' = ' + formatRupiah(subtotal));
  });

  lines.push('');
  var total = cartItems.reduce(function (sum, item) {
    return sum + item.qty * item.harga;
  }, 0);
  lines.push('*Total: ' + formatRupiah(total) + '*');

  if (formValues.tipe === 'antar') {
    lines.push('_Belum termasuk ongkir_');
  }

  lines.push('');
  lines.push('Nama: ' + (formValues.nama || '-'));
  lines.push('Tipe: ' + (formValues.tipe === 'antar' ? 'Antar ke Rumah (Citra Indah)' : 'Ambil di Kedai'));

  if (formValues.tipe === 'antar' && formValues.alamat) {
    lines.push('Alamat: ' + formValues.alamat);
  }

  if (formValues.catatan) {
    lines.push('Catatan: ' + formValues.catatan);
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function buildWhatsAppUrl(message, waNumber) {
  var number = waNumber || getStoreConfig().whatsapp || WA_DEFAULT_NUMBER;
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
}

/* ─── Form Checkout Submit Handler ────────────────────────── */
function handleCheckoutSubmit(e) {
  e.preventDefault();

  var fieldNama = document.getElementById('field-nama');
  var tipeRadio = document.querySelector('input[name="tipe"]:checked');
  var fieldAlamat = document.getElementById('field-alamat');
  var fieldCatatan = document.getElementById('field-catatan');

  var errorNama = document.getElementById('error-nama');
  var errorTipe = document.getElementById('error-tipe');
  var errorAlamat = document.getElementById('error-alamat');

  var nama = fieldNama ? fieldNama.value.trim() : '';
  var tipe = tipeRadio ? tipeRadio.value : '';
  var alamat = fieldAlamat ? fieldAlamat.value.trim() : '';
  var catatan = fieldCatatan ? fieldCatatan.value.trim() : '';

  // Clear previous errors
  if (errorNama) errorNama.textContent = '';
  if (errorTipe) errorTipe.textContent = '';
  if (errorAlamat) errorAlamat.textContent = '';

  var valid = true;
  if (!nama) {
    if (errorNama) errorNama.textContent = 'Nama pemesan tidak boleh kosong.';
    valid = false;
  }
  if (!tipe) {
    if (errorTipe) errorTipe.textContent = 'Pilih tipe pengambilan pesanan.';
    valid = false;
  }
  if (tipe === 'antar' && !alamat) {
    if (errorAlamat) errorAlamat.textContent = 'Alamat wajib diisi untuk pengantaran.';
    valid = false;
  }

  if (!valid) return;

  if (cart.length === 0) {
    showToast('Keranjang pesanan masih kosong!');
    return;
  }

  // Save for returning users
  try {
    localStorage.setItem('formNama', nama);
    localStorage.setItem('formTipe', tipe);
    if (tipe === 'antar') localStorage.setItem('formAlamat', alamat);
  } catch (err) {}

  var message = buildWhatsAppMessage(cart, {
    nama: nama,
    tipe: tipe,
    alamat: alamat,
    catatan: catatan,
  });

  var cfg = getStoreConfig();
  var waUrl = buildWhatsAppUrl(message, cfg.whatsapp);

  // Warning jika URL melebihi batas umum browser
  if (waUrl.length > 2000) {
    showToast('Pesanan terlalu panjang! Kurangi catatan atau jumlah varian.');
    return;
  }

  // Buka WhatsApp (harus synchronous di click/submit agar tidak diblokir popup blocker)
  var opened = window.open(waUrl, '_blank', 'noopener,noreferrer');

  var fallback = document.getElementById('wa-fallback-link');
  if (fallback) {
    fallback.href = waUrl;
    fallback.removeAttribute('hidden');
  }

  if (!opened) {
    showToast('Pop-up WhatsApp diblokir. Silakan klik tautan manual di bawah.');
  }

  // Tampilkan konfirmasi pengosongan keranjang
  var prompt = document.getElementById('cart-clear-prompt');
  if (prompt) {
    prompt.removeAttribute('hidden');
  } else {
    closeCheckout();
  }
}

/* ─── Setup Event Listeners ───────────────────────────────── */
function setupEventListeners() {
  var cartBtn = document.getElementById('cart-btn');
  var cartCloseBtn = document.getElementById('cart-close-btn');
  var cartItemsEl = document.getElementById('cart-items');
  var backToMenu = document.getElementById('back-to-menu');
  var checkoutBtn = document.getElementById('checkout-btn');
  var checkoutCloseBtn = document.getElementById('checkout-close-btn');
  var modalOverlay = document.querySelector('.modal-overlay');
  var checkoutForm = document.getElementById('checkout-form');
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var mobileNav = document.getElementById('mobile-nav');
  var mobileNavClose = document.getElementById('mobile-nav-close');
  var btnClear = document.getElementById('btn-clear-cart');
  var btnKeep = document.getElementById('btn-keep-cart');

  // Cart open/close/toggle
  if (cartBtn) {
    cartBtn.addEventListener('click', toggleCart);
  }
  if (cartCloseBtn) {
    cartCloseBtn.addEventListener('click', closeCart);
  }

  // Cart item delegation (minus, plus, delete)
  if (cartItemsEl) {
    cartItemsEl.addEventListener('click', function (e) {
      var qtyBtn = e.target.closest('.qty-btn');
      var deleteBtn = e.target.closest('.cart-item-delete');
      if (qtyBtn && qtyBtn.dataset.id) {
        changeQty(qtyBtn.dataset.id, parseInt(qtyBtn.dataset.delta, 10));
      } else if (deleteBtn && deleteBtn.dataset.id) {
        removeFromCart(deleteBtn.dataset.id);
      }
    });
  }

  // Back to menu link in empty cart
  if (backToMenu) {
    backToMenu.addEventListener('click', function (e) {
      e.preventDefault();
      closeCart();
      var menuSection = document.getElementById('menu');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Checkout modal open & close
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', openCheckout);
  }
  if (checkoutCloseBtn) {
    checkoutCloseBtn.addEventListener('click', closeCheckout);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeCheckout);
  }
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Radio tipe toggle address
  document.querySelectorAll('input[name="tipe"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      toggleAlamatField(this.value);
    });
  });

  // Menu cards Add button delegation
  var menuGrid = document.getElementById('menu-grid');
  if (menuGrid) {
    menuGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('.card-add-btn');
      if (btn && btn.dataset.id) {
        addToCart(btn.dataset.id);
      }
    });
  }

  // Hero Starburst Price Badges -> Add to Cart
  document.querySelectorAll('.badge-coffee-wrap, .price-badge-coffee').forEach(function (el) {
    el.style.cursor = 'pointer';
    el.setAttribute('title', 'Klik untuk tambah Coffee Latte (8K) ke pesanan');
    el.addEventListener('click', function () {
      addToCart('coffee-latte');
    });
  });

  document.querySelectorAll('.badge-matcha-wrap, .price-badge-matcha').forEach(function (el) {
    el.style.cursor = 'pointer';
    el.setAttribute('title', 'Klik untuk tambah Matcha Latte (10K) ke pesanan');
    el.addEventListener('click', function () {
      addToCart('matcha-latte');
    });
  });

  // Standalone Pre-Order / WhatsApp Buttons
  setupPreorderLinks();

  // Mobile nav hamburger toggle
  if (hamburgerBtn && mobileNav) {
    hamburgerBtn.addEventListener('click', function () {
      mobileNav.removeAttribute('hidden');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      trapFocus(mobileNav);
    });
  }
  if (mobileNavClose && mobileNav) {
    mobileNavClose.addEventListener('click', function () {
      mobileNav.setAttribute('hidden', '');
      if (hamburgerBtn) {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.focus();
      }
      releaseFocus(mobileNav);
    });
  }
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.setAttribute('hidden', '');
        if (hamburgerBtn) {
          hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
        releaseFocus(mobileNav);
      });
    });
  }

  // Escape key handler: prioritize checkout modal -> cart drawer -> mobile nav
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;

    var modal = document.getElementById('checkout-modal');
    if (modal && !modal.hasAttribute('hidden')) {
      closeCheckout();
      return;
    }

    var drawer = document.getElementById('cart-popup');
    if (drawer && !drawer.hasAttribute('hidden')) {
      closeCart();
      return;
    }

    if (mobileNav && !mobileNav.hasAttribute('hidden')) {
      mobileNav.setAttribute('hidden', '');
      if (hamburgerBtn) {
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        hamburgerBtn.focus();
      }
      releaseFocus(mobileNav);
    }
  });

  // Click outside cart popup to close
  document.addEventListener('click', function (e) {
    var drawer = document.getElementById('cart-popup');
    var cartBtnEl = document.getElementById('cart-btn');
    if (!drawer || drawer.hasAttribute('hidden')) return;

    // Abaikan jika klik berasal dari dalam drawer atau tombol cart trigger
    if (
      !drawer.contains(e.target) &&
      e.target !== cartBtnEl &&
      (!cartBtnEl || !cartBtnEl.contains(e.target))
    ) {
      closeCart();
    }
  }, true);

  // Cart clear prompt buttons
  if (btnClear) {
    btnClear.addEventListener('click', function () {
      clearCart();
      closeCheckout();
      showToast('Keranjang pesanan telah dikosongkan.');
    });
  }
  if (btnKeep) {
    btnKeep.addEventListener('click', function () {
      closeCheckout();
      showToast('Pesanan di keranjang tetap disimpan.');
    });
  }
}

/* ─── Setup Preorder Links with Default Greeting ──────────── */
function setupPreorderLinks() {
  var cfg = getStoreConfig();
  var defaultUrl = buildWhatsAppUrl(DEFAULT_PREORDER_TEXT, cfg.whatsapp);

  var targetSelectors = [
    '#hero-wa-btn',
    '#cta-wa-btn',
    '.po-badge',
    '.mobile-po-btn',
    '[data-action="preorder"]',
  ];

  targetSelectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.setAttribute('href', defaultUrl);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });
  });
}

/* ─── Initialization ──────────────────────────────────────── */
function init() {
  loadCart();
  renderMenu();
  renderTim();
  updateCartUI();
  setupEventListeners();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

/* ─── Dual Environment Export for Testing ─────────────────── */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cart: cart,
    formatRupiah: formatRupiah,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    changeQty: changeQty,
    clearCart: clearCart,
    getTotalQty: getTotalQty,
    getTotalHarga: getTotalHarga,
    buildWhatsAppMessage: buildWhatsAppMessage,
    buildWhatsAppUrl: buildWhatsAppUrl,
    saveCart: saveCart,
    loadCart: loadCart,
    getStoreConfig: getStoreConfig,
    getMenuList: getMenuList,
  };
}
