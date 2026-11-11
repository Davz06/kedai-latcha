// ============================================================
// js/app.js — Kedai Latcha
// Logika: render menu & tim, keranjang, checkout, WhatsApp
// ============================================================

/* ─── Utility ─────────────────────────────────────────────── */

function formatRupiah(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

/* ─── State: Cart ─────────────────────────────────────────── */

var cart = [];

function saveCart() {
  try { localStorage.setItem('cart', JSON.stringify(cart)); } catch (e) {}
}

function loadCart() {
  try {
    var raw = localStorage.getItem('cart');
    if (!raw) return;
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) { cart = []; return; }
    // Sync with current MENU data: drop items no longer in menu or unavailable
    cart = parsed.map(function (item) {
      var menuItem = MENU.find(function (m) { return m.id === item.id; });
      if (!menuItem || !menuItem.tersedia) return null;
      return {
        id: menuItem.id,
        nama: menuItem.nama,
        harga: menuItem.harga,
        qty: Math.max(1, parseInt(item.qty) || 1),
      };
    }).filter(Boolean);
  } catch (e) { cart = []; }
}

function addToCart(id) {
  var menuItem = MENU.find(function (m) { return m.id === id; });
  if (!menuItem || !menuItem.tersedia) return;
  var existing = cart.find(function (c) { return c.id === id; });
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: menuItem.id, nama: menuItem.nama, harga: menuItem.harga, qty: 1 });
  }
  saveCart();
  updateCartUI();
  showToast(menuItem.nama + ' ditambahkan ke pesanan!');
}

function removeFromCart(id) {
  cart = cart.filter(function (c) { return c.id !== id; });
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  var item = cart.find(function (c) { return c.id === id; });
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); return; }
  saveCart();
  updateCartUI();
}

function getTotalQty() {
  return cart.reduce(function (sum, c) { return sum + c.qty; }, 0);
}

function getTotalHarga() {
  return cart.reduce(function (sum, c) { return sum + c.qty * c.harga; }, 0);
}

/* ─── Cart UI ─────────────────────────────────────────────── */

function updateCartUI() {
  var countEl    = document.getElementById('cart-count');
  var itemsEl    = document.getElementById('cart-items');
  var emptyEl    = document.getElementById('cart-empty');
  var totalEl    = document.getElementById('cart-total-price');
  var checkoutBtn = document.getElementById('checkout-btn');

  if (countEl) countEl.textContent = getTotalQty();

  if (cart.length === 0) {
    if (itemsEl) itemsEl.innerHTML = '';
    if (emptyEl) emptyEl.removeAttribute('hidden');
    if (totalEl) totalEl.textContent = formatRupiah(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
  } else {
    if (emptyEl) emptyEl.setAttribute('hidden', '');
    if (checkoutBtn) checkoutBtn.disabled = false;

    if (itemsEl) {
      itemsEl.innerHTML = cart.map(function (item) {
        return '<div class="cart-item" data-id="' + item.id + '">' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + item.nama + '</div>' +
            '<div class="cart-item-price">' + formatRupiah(item.harga) + '</div>' +
          '</div>' +
          '<div class="cart-qty-controls">' +
            '<button class="qty-btn" data-id="' + item.id + '" data-delta="-1" aria-label="Kurangi jumlah ' + item.nama + '">−</button>' +
            '<span class="cart-qty-num">' + item.qty + '</span>' +
            '<button class="qty-btn" data-id="' + item.id + '" data-delta="1" aria-label="Tambah jumlah ' + item.nama + '">+</button>' +
          '</div>' +
          '<span class="cart-item-subtotal">' + formatRupiah(item.qty * item.harga) + '</span>' +
          '<button class="cart-item-delete" data-id="' + item.id + '" aria-label="Hapus ' + item.nama + '">🗑</button>' +
        '</div>';
      }).join('');
    }

    if (totalEl) totalEl.textContent = formatRupiah(getTotalHarga());
  }
}

/* ─── Render Menu ─────────────────────────────────────────── */

function renderMenu() {
  var grid = document.getElementById('menu-grid');
  if (!grid) return;
  grid.innerHTML = MENU.map(function (item) {
    var badgeHtml  = item.badge ? '<span class="card-badge">' + item.badge + '</span>' : '';
    var actionHtml = item.tersedia
      ? '<button class="card-add-btn" data-id="' + item.id + '" aria-label="Tambah ' + item.nama + ' ke keranjang">+ Tambah</button>'
      : '<div class="card-sold-out" role="status">Habis</div>';
    return '<article class="menu-card">' +
      '<div class="card-img-wrap">' +
        '<img src="' + item.gambar + '" alt="' + item.nama + '" loading="lazy">' +
        badgeHtml +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-name-price">' +
          '<span class="card-name">' + item.nama + '</span>' +
          '<span class="card-price">' + formatRupiah(item.harga) + '</span>' +
        '</div>' +
        '<p class="card-desc">' + item.deskripsi + '</p>' +
        actionHtml +
      '</div>' +
    '</article>';
  }).join('');
}

/* ─── Render Tim ──────────────────────────────────────────── */

function renderTim() {
  var grid = document.getElementById('tim-grid');
  if (!grid) return;
  grid.innerHTML = TIM.map(function (t) {
    return '<article class="tim-card">' +
      '<img class="tim-foto" src="' + t.foto + '" alt="Foto ' + t.nama + '" loading="lazy">' +
      '<h3 class="tim-nama">' + t.nama + '</h3>' +
      '<span class="tim-jabatan">' + t.jabatan + '</span>' +
      '<p class="tim-bio">' + t.bio + '</p>' +
      '<div class="tim-suka-label">Suka Diseduh</div>' +
      '<div class="tim-suka">' + t.suka + '</div>' +
    '</article>';
  }).join('');
}

/* ─── Toast ───────────────────────────────────────────────── */

function showToast(msg) {
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

/* ─── Focus Trap ──────────────────────────────────────────── */

function trapFocus(element) {
  var focusable = Array.from(element.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  ));
  if (focusable.length === 0) return;
  var first = focusable[0];
  var last  = focusable[focusable.length - 1];
  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  element._trapFocusHandler = handler;
  element.addEventListener('keydown', handler);
  first.focus();
}

function releaseFocus(element) {
  if (element._trapFocusHandler) {
    element.removeEventListener('keydown', element._trapFocusHandler);
    delete element._trapFocusHandler;
  }
}

/* ─── Cart Popup ──────────────────────────────────────────── */

function openCart() {
  var popup = document.getElementById('cart-popup');
  if (!popup) return;
  popup.removeAttribute('hidden');
  updateCartUI();
  trapFocus(popup);
}

function closeCart() {
  var popup = document.getElementById('cart-popup');
  if (!popup) return;
  popup.setAttribute('hidden', '');
  releaseFocus(popup);
  var cartBtn = document.getElementById('cart-btn');
  if (cartBtn) cartBtn.focus();
}

/* ─── Checkout Modal ──────────────────────────────────────── */

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
    var savedNama   = localStorage.getItem('formNama');
    var savedTipe   = localStorage.getItem('formTipe');
    var savedAlamat = localStorage.getItem('formAlamat');
    if (savedNama) { var fn = document.getElementById('field-nama'); if (fn) fn.value = savedNama; }
    if (savedTipe) {
      var radio = modal.querySelector('input[name="tipe"][value="' + savedTipe + '"]');
      if (radio) { radio.checked = true; toggleAlamatField(savedTipe); }
    }
    if (savedAlamat) { var fa = document.getElementById('field-alamat'); if (fa) fa.value = savedAlamat; }
  } catch (e) {}
  var panel = modal.querySelector('.modal-panel');
  if (panel) trapFocus(panel);
}

function closeCheckout() {
  var modal = document.getElementById('checkout-modal');
  if (!modal) return;
  modal.setAttribute('hidden', '');
  var panel = modal.querySelector('.modal-panel');
  if (panel) releaseFocus(panel);
}

/* ─── Checkout Form Submit ────────────────────────────────── */

function handleCheckoutSubmit(e) {
  e.preventDefault();

  var nama       = document.getElementById('field-nama').value.trim();
  var tipeRadio  = document.querySelector('input[name="tipe"]:checked');
  var tipe       = tipeRadio ? tipeRadio.value : '';
  var alamat     = document.getElementById('field-alamat').value.trim();
  var catatan    = document.getElementById('field-catatan').value.trim();
  var errorNama  = document.getElementById('error-nama');
  var errorTipe  = document.getElementById('error-tipe');
  var errorAlamat = document.getElementById('error-alamat');

  // Clear previous errors
  if (errorNama)   errorNama.textContent   = '';
  if (errorTipe)   errorTipe.textContent   = '';
  if (errorAlamat) errorAlamat.textContent = '';

  var valid = true;
  if (!nama) {
    if (errorNama) errorNama.textContent = 'Nama tidak boleh kosong.';
    valid = false;
  }
  if (!tipe) {
    if (errorTipe) errorTipe.textContent = 'Pilih tipe pesanan.';
    valid = false;
  }
  if (tipe === 'antar' && !alamat) {
    if (errorAlamat) errorAlamat.textContent = 'Alamat wajib diisi untuk tipe Antar.';
    valid = false;
  }
  if (!valid) return;

  // Save form values for next time
  try {
    localStorage.setItem('formNama', nama);
    localStorage.setItem('formTipe', tipe);
    if (tipe === 'antar') localStorage.setItem('formAlamat', alamat);
  } catch (e) {}

  // Build WA message
  var lines = [];
  lines.push('Halo Kedai Latcha, saya mau pesan:');
  lines.push('');
  cart.forEach(function (item, i) {
    lines.push((i + 1) + '. ' + item.nama + ' x' + item.qty + ' = ' + formatRupiah(item.qty * item.harga));
  });
  lines.push('');
  lines.push('*Total: ' + formatRupiah(getTotalHarga()) + '*');
  if (tipe === 'antar') lines.push('_Belum termasuk ongkir_');
  lines.push('');
  lines.push('Nama: ' + nama);
  lines.push('Tipe: ' + (tipe === 'antar' ? 'Antar' : 'Ambil di Tempat'));
  if (tipe === 'antar') lines.push('Alamat: ' + alamat);
  if (catatan) lines.push('Catatan: ' + catatan);

  // Remove consecutive blank lines, trim
  var message = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  var waUrl = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(message);

  // URL length warning
  if (waUrl.length > 2000) {
    showToast('Pesanan terlalu panjang! Coba pecah menjadi beberapa kali pesan.');
    return;
  }

  // Open WA — MUST be synchronous in submit handler to avoid popup blockers
  var opened = window.open(waUrl, '_blank', 'noopener,noreferrer');

  // Update fallback link (always set, shown after attempt)
  var fallback = document.getElementById('wa-fallback-link');
  if (fallback) {
    fallback.href = waUrl;
    fallback.removeAttribute('hidden');
  }

  if (!opened) {
    showToast('Pop-up diblokir. Gunakan tautan di bawah untuk membuka WhatsApp.');
  }

  closeCheckout();

  // Show clear cart prompt
  var prompt = document.getElementById('cart-clear-prompt');
  if (prompt) prompt.removeAttribute('hidden');
}

/* ─── Setup Event Listeners ───────────────────────────────── */

function setupEventListeners() {
  var cartBtn        = document.getElementById('cart-btn');
  var cartCloseBtn   = document.getElementById('cart-close-btn');
  var cartItemsEl    = document.getElementById('cart-items');
  var checkoutBtn    = document.getElementById('checkout-btn');
  var checkoutCloseBtn = document.getElementById('checkout-close-btn');
  var modalOverlay   = document.querySelector('.modal-overlay');
  var checkoutForm   = document.getElementById('checkout-form');
  var heroOrderBtn   = document.getElementById('hero-order-btn');
  var hamburgerBtn   = document.getElementById('hamburger-btn');
  var mobileNav      = document.getElementById('mobile-nav');
  var mobileNavClose = document.getElementById('mobile-nav-close');
  var btnClear       = document.getElementById('btn-clear-cart');
  var btnKeep        = document.getElementById('btn-keep-cart');

  // Open cart
  if (cartBtn)      cartBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);

  // Cart items delegation (qty, delete)
  if (cartItemsEl) {
    cartItemsEl.addEventListener('click', function (e) {
      var qtyBtn    = e.target.closest('.qty-btn');
      var deleteBtn = e.target.closest('.cart-item-delete');
      if (qtyBtn)    changeQty(qtyBtn.dataset.id, parseInt(qtyBtn.dataset.delta));
      else if (deleteBtn) removeFromCart(deleteBtn.dataset.id);
    });
  }

  // Back to menu link in empty cart
  var backToMenu = document.getElementById('back-to-menu');
  if (backToMenu) {
    backToMenu.addEventListener('click', function (e) {
      e.preventDefault();
      closeCart();
      var menuSection = document.getElementById('menu');
      if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Checkout open/close
  if (checkoutBtn)      checkoutBtn.addEventListener('click', openCheckout);
  if (checkoutCloseBtn) checkoutCloseBtn.addEventListener('click', closeCheckout);
  if (modalOverlay)     modalOverlay.addEventListener('click', closeCheckout);
  if (checkoutForm)     checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Tipe radio toggle address
  document.querySelectorAll('input[name="tipe"]').forEach(function (radio) {
    radio.addEventListener('change', function () { toggleAlamatField(this.value); });
  });

  // Menu grid delegation
  var menuGrid = document.getElementById('menu-grid');
  if (menuGrid) {
    menuGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('.card-add-btn');
      if (btn && !btn.disabled) addToCart(btn.dataset.id);
    });
  }

  // Hero order button → scroll to menu
  if (heroOrderBtn) {
    heroOrderBtn.addEventListener('click', function () {
      var menuSection = document.getElementById('menu');
      if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Hamburger / mobile nav
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
      if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
      releaseFocus(mobileNav);
      if (hamburgerBtn) hamburgerBtn.focus();
    });
  }
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.setAttribute('hidden', '');
        if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
        releaseFocus(mobileNav);
      });
    });
  }

  // Esc key: close modals/nav in priority order
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var modal    = document.getElementById('checkout-modal');
    var popup    = document.getElementById('cart-popup');
    var mobileN  = document.getElementById('mobile-nav');
    if (modal   && !modal.hasAttribute('hidden'))   { closeCheckout(); return; }
    if (popup   && !popup.hasAttribute('hidden'))   { closeCart();     return; }
    if (mobileN && !mobileN.hasAttribute('hidden')) {
      mobileN.setAttribute('hidden', '');
      if (hamburgerBtn) { hamburgerBtn.setAttribute('aria-expanded', 'false'); hamburgerBtn.focus(); }
      releaseFocus(mobileN);
    }
  });

  // Click outside cart popup to close
  document.addEventListener('click', function (e) {
    var popup   = document.getElementById('cart-popup');
    var cBtn    = document.getElementById('cart-btn');
    if (!popup || popup.hasAttribute('hidden')) return;
    if (!popup.contains(e.target) && e.target !== cBtn && !cBtn.contains(e.target)) {
      closeCart();
    }
  }, true);

  // Cart clear prompt
  if (btnClear) {
    btnClear.addEventListener('click', function () {
      cart = [];
      saveCart();
      updateCartUI();
      var prompt = document.getElementById('cart-clear-prompt');
      if (prompt) prompt.setAttribute('hidden', '');
      var fallback = document.getElementById('wa-fallback-link');
      if (fallback) fallback.setAttribute('hidden', '');
    });
  }
  if (btnKeep) {
    btnKeep.addEventListener('click', function () {
      var prompt = document.getElementById('cart-clear-prompt');
      if (prompt) prompt.setAttribute('hidden', '');
    });
  }
}

/* ─── Init ────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  loadCart();
  renderMenu();
  renderTim();
  updateCartUI();
  setupEventListeners();

  // Set WA general chat links
  var waUrl    = 'https://wa.me/' + CONFIG.whatsapp;
  var heroWaBtn = document.getElementById('hero-wa-btn');
  if (heroWaBtn) heroWaBtn.href = waUrl;
  var ctaWaBtn = document.getElementById('cta-wa-btn');
  if (ctaWaBtn) ctaWaBtn.href = waUrl;
});
