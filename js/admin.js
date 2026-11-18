// ============================================================
// js/admin.js — Kedai Latcha
// Logika Kasir POS & Pencatatan Real-Time Admin
// Selaras 100% dengan Desain Mockup pen.dev (Boutique Coffee POS)
// ============================================================

(function () {
  'use strict';

  var STORAGE_KEY = 'latcha_pos_transactions';

  // State Kasir
  var orderState = {};
  var activePayment = 'tunai';
  var activeFilter = 'all';
  var transactions = [];
  var currentOrderNumber = 1001;

  // Helper Format Rupiah
  function formatRupiah(num) {
    var val = parseInt(num, 10) || 0;
    return 'Rp ' + val.toLocaleString('id-ID');
  }

  // Ambil Konfigurasi
  function getConfig() {
    if (typeof CONFIG !== 'undefined' && CONFIG) return CONFIG;
    return {
      namaKedai: 'Kedai Latcha',
      metodePembayaran: [
        { id: 'tunai', nama: 'Tunai (Cash)', icon: '💵' },
        { id: 'dana',  nama: 'DANA',         icon: '💙' },
        { id: 'gopay', nama: 'GoPay',        icon: '💚' },
      ],
      sugarOptions: ['Normal Sugar', 'Less Sugar'],
      iceOptions: ['Normal Ice', 'Less Ice'],
      googleSheetWebhookUrl: '',
    };
  }

  function getMenu() {
    if (typeof MENU !== 'undefined' && Array.isArray(MENU) && MENU.length > 0) {
      return MENU;
    }
    return [
      {
        id: 'coffee-latte',
        nama: 'Coffee Latte',
        harga: 8000,
        badge: 'Terfavorit',
        deskripsi: 'Es kopi susu segar racikan khas Latcha — creamy, seimbang, manis pas.',
        gambar: 'img/menu-coffee-latte.webp'
      },
      {
        id: 'matcha-latte',
        nama: 'Matcha Latte',
        harga: 10000,
        badge: 'Best Seller',
        deskripsi: 'Pure matcha Jepang berpadu susu segar dingin. Earthy, lembut, autentik.',
        gambar: 'img/menu-matcha-latte.webp'
      },
    ];
  }

  // Muat Transaksi dari LocalStorage
  function loadTransactions() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          transactions = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat transaksi lokal:', e);
    }
    transactions = [];
  }

  // Simpan Transaksi ke LocalStorage
  function persistTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('LocalStorage error:', e);
    }
  }

  // Inisialisasi State Pesanan Baru
  function initOrderState() {
    var menu = getMenu();
    var cfg = getConfig();
    var defaultSugar = (cfg.sugarOptions && cfg.sugarOptions[0]) || 'Normal Sugar';
    var defaultIce = (cfg.iceOptions && cfg.iceOptions[0]) || 'Normal Ice';

    orderState = {};
    menu.forEach(function (m) {
      orderState[m.id] = {
        id: m.id,
        nama: m.nama,
        harga: m.harga,
        qty: 0,
        sugar: defaultSugar,
        ice: defaultIce,
      };
    });

    var custInput = document.getElementById('customer-name');
    var notesInput = document.getElementById('order-notes');
    if (custInput) custInput.value = '';
    if (notesInput) notesInput.value = '';

    currentOrderNumber = 1000 + transactions.length + 1;
    var liveIdEl = document.getElementById('receipt-live-id');
    if (liveIdEl) liveIdEl.textContent = '#LTC-' + currentOrderNumber;

    updateOrderUI();
  }

  // Render Kartu Menu POS
  function renderMenuCards() {
    var container = document.getElementById('pos-menu-list');
    if (!container) return;

    var menu = getMenu();
    var cfg = getConfig();
    var sugarOpts = cfg.sugarOptions || ['Normal Sugar', 'Less Sugar'];
    var iceOpts = cfg.iceOptions || ['Normal Ice', 'Less Ice'];

    var filteredMenu = menu.filter(function (m) {
      if (activeFilter === 'all') return true;
      return m.id === activeFilter;
    });

    container.innerHTML = filteredMenu
      .map(function (item) {
        var state = orderState[item.id] || { qty: 0, sugar: sugarOpts[0], ice: iceOpts[0] };
        var imgHtml = item.gambar
          ? '<img src="' + item.gambar + '" alt="' + item.nama + '" class="drink-thumb" loading="lazy" />'
          : '';
        var badgeHtml = item.badge
          ? '<span class="drink-badge">' + item.badge + '</span>'
          : '';
        var subtotal = state.qty * item.harga;

        return (
          '<div class="drink-card' + (state.qty > 0 ? ' has-qty' : '') + '" id="card-' + item.id + '">' +
            '<div class="drink-card-top">' +
              '<div class="drink-main-info">' +
                imgHtml +
                '<div class="drink-meta">' +
                  '<div class="drink-name-wrap">' +
                    '<span class="drink-name">' + item.nama + '</span>' +
                    badgeHtml +
                  '</div>' +
                  '<div class="drink-desc">' + (item.deskripsi || '') + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="drink-pricing-stepper">' +
                '<div class="drink-price">' + formatRupiah(item.harga) + '</div>' +
                '<div class="stepper-btn-wrap">' +
                  '<button type="button" class="qty-step-btn btn-minus" data-id="' + item.id + '" aria-label="Kurangi">−</button>' +
                  '<span class="qty-display" id="qty-' + item.id + '">' + state.qty + '</span>' +
                  '<button type="button" class="qty-step-btn btn-plus" data-id="' + item.id + '" aria-label="Tambah">+</button>' +
                '</div>' +
                (state.qty > 0 ? '<div class="drink-subtotal" id="subtotal-' + item.id + '">' + formatRupiah(subtotal) + '</div>' : '<div class="drink-subtotal" id="subtotal-' + item.id + '"></div>') +
              '</div>' +
            '</div>' +
            '<div class="drink-modifiers-row">' +
              '<div class="mod-cluster">' +
                '<span class="mod-tag">Gula:</span>' +
                '<div class="mod-pill-group" data-id="' + item.id + '" data-mod="sugar">' +
                  sugarOpts
                    .map(function (s) {
                      var active = state.sugar === s ? ' active' : '';
                      return '<button type="button" class="pill-opt' + active + '" data-val="' + s + '">' + s + '</button>';
                    })
                    .join('') +
                '</div>' +
              '</div>' +
              '<div class="mod-cluster">' +
                '<span class="mod-tag">Es:</span>' +
                '<div class="mod-pill-group" data-id="' + item.id + '" data-mod="ice">' +
                  iceOpts
                    .map(function (i) {
                      var active = state.ice === i ? ' active' : '';
                      return '<button type="button" class="pill-opt' + active + '" data-val="' + i + '">' + i + '</button>';
                    })
                    .join('') +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');
  }

  // Render Pilihan Metode Pembayaran
  function renderPaymentPills() {
    var container = document.getElementById('payment-pills');
    if (!container) return;

    var cfg = getConfig();
    var methods = cfg.metodePembayaran || [
      { id: 'tunai', nama: 'Tunai (Cash)', icon: '💵' },
      { id: 'dana',  nama: 'DANA',         icon: '💙' },
      { id: 'gopay', nama: 'GoPay',        icon: '💚' },
    ];

    container.innerHTML = methods
      .map(function (p) {
        var active = p.id === activePayment ? ' active' : '';
        return (
          '<button type="button" class="pay-btn' + active + '" data-pay="' + p.id + '">' +
            '<span>' + (p.icon || '') + '</span> ' + p.nama +
          '</button>'
        );
      })
      .join('');

    var receiptPayName = document.getElementById('receipt-pay-name');
    var matched = methods.find(function (m) { return m.id === activePayment; });
    if (receiptPayName && matched) {
      receiptPayName.textContent = matched.nama;
    }
  }

  // Update UI & Perhitungan Total Struk Live
  function updateOrderUI() {
    var totalAmount = 0;
    var totalQty = 0;
    var activeItems = [];

    Object.keys(orderState).forEach(function (id) {
      var item = orderState[id];
      var qtyEl = document.getElementById('qty-' + id);
      var cardEl = document.getElementById('card-' + id);
      var subtotalEl = document.getElementById('subtotal-' + id);

      if (qtyEl) qtyEl.textContent = item.qty;
      if (cardEl) {
        if (item.qty > 0) {
          cardEl.classList.add('has-qty');
        } else {
          cardEl.classList.remove('has-qty');
        }
      }
      if (subtotalEl) {
        subtotalEl.textContent = item.qty > 0 ? formatRupiah(item.qty * item.harga) : '';
      }

      if (item.qty > 0) {
        activeItems.push(item);
        totalAmount += item.qty * item.harga;
        totalQty += item.qty;
      }
    });

    // Update Struk Live di Kolom Kanan
    var receiptList = document.getElementById('receipt-live-items');
    var receiptCups = document.getElementById('receipt-total-cups');
    var receiptSubtotal = document.getElementById('receipt-subtotal-val');
    var orderTotalDisplay = document.getElementById('order-total-display');
    var btnSave = document.getElementById('btn-save-order');

    if (receiptCups) receiptCups.textContent = totalQty;
    if (receiptSubtotal) receiptSubtotal.textContent = formatRupiah(totalAmount);
    if (orderTotalDisplay) orderTotalDisplay.textContent = formatRupiah(totalAmount);

    if (receiptList) {
      if (activeItems.length === 0) {
        receiptList.innerHTML =
          '<div class="receipt-empty-note">' +
            'Belum ada minuman dipilih.<br />Tap tombol + di samping!' +
          '</div>';
      } else {
        receiptList.innerHTML = activeItems
          .map(function (it) {
            return (
              '<div class="receipt-row">' +
                '<div class="receipt-item-left">' +
                  '<span class="receipt-item-qty">' + it.qty + 'x</span>' +
                  '<div class="receipt-item-details">' +
                    '<span class="receipt-item-name">' + it.nama + '</span>' +
                    '<span class="receipt-item-mods">' + it.sugar + ' · ' + it.ice + '</span>' +
                  '</div>' +
                '</div>' +
                '<span class="receipt-item-price">' + formatRupiah(it.qty * it.harga) + '</span>' +
              '</div>'
            );
          })
          .join('');
      }
    }

    if (btnSave) {
      btnSave.disabled = totalQty === 0;
      btnSave.innerHTML = totalQty > 0
        ? '💾 SIMPAN &amp; CETAK STRUK (' + formatRupiah(totalAmount) + ')'
        : '💾 SIMPAN PESANAN';
    }
  }

  // Update Statistik Real-time
  function updateStats() {
    var todayStr = new Date().toLocaleDateString('id-ID');
    var todayTrx = transactions.filter(function (t) {
      return t.dateDisplay === todayStr;
    });

    var omzetHariIni = 0;
    var totalCupKopi = 0;
    var totalCupMatcha = 0;
    var totalCupSemua = 0;
    var modCounts = { 'Less Sugar': 0, 'Normal Sugar': 0, 'Less Ice': 0, 'Normal Ice': 0 };

    todayTrx.forEach(function (t) {
      omzetHariIni += t.total || 0;
      if (Array.isArray(t.items)) {
        t.items.forEach(function (it) {
          totalCupSemua += it.qty || 0;
          if (it.id === 'coffee-latte') {
            totalCupKopi += it.qty || 0;
          } else if (it.id === 'matcha-latte') {
            totalCupMatcha += it.qty || 0;
          }
          if (it.sugar && modCounts[it.sugar] !== undefined) modCounts[it.sugar] += it.qty || 0;
          if (it.ice && modCounts[it.ice] !== undefined) modCounts[it.ice] += it.qty || 0;
        });
      }
    });

    // Update Elements
    var omzetEl = document.getElementById('stat-omzet');
    var cupEl = document.getElementById('stat-cup');
    var trxEl = document.getElementById('stat-trx');
    var cupSubEl = document.getElementById('stat-cup-sub');
    var avgTrxEl = document.getElementById('stat-avg-trx');
    var favModEl = document.getElementById('stat-fav-mod');
    var favSubEl = document.getElementById('stat-fav-sub');
    var greetingCountEl = document.getElementById('greeting-orders-count');
    var barKopi = document.getElementById('bar-kopi');
    var barMatcha = document.getElementById('bar-matcha');

    if (omzetEl) omzetEl.textContent = formatRupiah(omzetHariIni);
    if (cupEl) cupEl.innerHTML = totalCupSemua + ' <small style="font-size:16px; font-weight:600">cup</small>';
    if (trxEl) trxEl.innerHTML = todayTrx.length + ' <small style="font-size:16px; font-weight:600">pesanan</small>';

    if (cupSubEl) {
      cupSubEl.innerHTML = '<span>' + totalCupKopi + ' kopi</span><span>' + totalCupMatcha + ' matcha</span>';
    }

    if (barKopi && barMatcha) {
      var totalKnown = totalCupKopi + totalCupMatcha;
      if (totalKnown > 0) {
        var kopiPct = Math.round((totalCupKopi / totalKnown) * 100);
        barKopi.style.width = kopiPct + '%';
        barMatcha.style.width = (100 - kopiPct) + '%';
      } else {
        barKopi.style.width = '50%';
        barMatcha.style.width = '50%';
      }
    }

    if (avgTrxEl) {
      var avg = todayTrx.length > 0 ? Math.round(omzetHariIni / todayTrx.length) : 0;
      avgTrxEl.innerHTML = '<span>Rata-rata: ' + formatRupiah(avg) + ' per pesanan</span>';
    }

    if (favModEl && favSubEl) {
      if (totalCupSemua > 0) {
        var maxMod = 'Less Sugar';
        var maxVal = modCounts['Less Sugar'];
        Object.keys(modCounts).forEach(function (k) {
          if (modCounts[k] > maxVal) {
            maxMod = k;
            maxVal = modCounts[k];
          }
        });
        favModEl.textContent = maxMod;
        favSubEl.innerHTML = '<span>' + maxVal + ' dari ' + totalCupSemua + ' cup</span>';
      } else {
        favModEl.textContent = 'Less Sugar';
        favSubEl.innerHTML = '<span>Pilihan favorit pelanggan</span>';
      }
    }

    if (greetingCountEl) {
      greetingCountEl.textContent = todayTrx.length + ' pesanan tercatat hari ini — jangan lupa senyum ✨';
    }
  }

  // Render Tabel Riwayat Transaksi (8 Kolom)
  function renderTransactionsTable() {
    var tbody = document.getElementById('trx-table-body');
    if (!tbody) return;

    if (transactions.length === 0) {
      tbody.innerHTML =
        '<tr>' +
          '<td colspan="8" class="empty-book">' +
            '<div>Belum ada pesanan yang dicatat hari ini.</div>' +
            '<span>Siap melayani pesanan segar berikutnya! ✨</span>' +
          '</td>' +
        '</tr>';
      return;
    }

    tbody.innerHTML = transactions
      .map(function (t) {
        var badgeClass = 'pay-badge-' + (t.paymentId || 'tunai');
        return (
          '<tr>' +
            '<td class="td-time">' + t.timeDisplay + '</td>' +
            '<td class="td-customer">' + (t.customer || 'Pelanggan') + '</td>' +
            '<td class="td-items">' + (t.itemsSimple || '-') + '</td>' +
            '<td class="td-mods">' + (t.modsSummary || 'Normal') + '</td>' +
            '<td class="td-total">' + formatRupiah(t.total) + '</td>' +
            '<td><span class="pay-badge ' + badgeClass + '">' + t.paymentMethod + '</span></td>' +
            '<td><span style="color:#2F855A; font-weight:700">✓ Lunas</span></td>' +
            '<td>' +
              '<button type="button" class="btn-del-entry" data-id="' + t.id + '" title="Hapus Transaksi">🗑️</button>' +
            '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  // Notifikasi Toast
  var toastTimer = null;
  function showToast(msg) {
    var toast = document.getElementById('toast-notice');
    if (!toast) return;

    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2800);
  }

  // Kirim ke Google Sheets di Background
  function sendToGoogleSheets(trxData) {
    var cfg = getConfig();
    if (!cfg.googleSheetWebhookUrl) return;

    try {
      fetch(cfg.googleSheetWebhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trxData),
        keepalive: true,
      }).catch(function (err) {
        console.warn('Gagal kirim ke Google Sheets:', err);
      });
    } catch (e) {
      console.warn('Network error Google Sheets:', e);
    }
  }

  // Simpan Transaksi Baru
  function handleSaveTransaction() {
    var itemsOrdered = [];
    var totalAmount = 0;

    Object.keys(orderState).forEach(function (id) {
      var item = orderState[id];
      if (item.qty > 0) {
        itemsOrdered.push({
          id: item.id,
          name: item.nama,
          price: item.harga,
          qty: item.qty,
          sugar: item.sugar,
          ice: item.ice,
        });
        totalAmount += item.qty * item.harga;
      }
    });

    if (itemsOrdered.length === 0) {
      showToast('⚠️ Pilih minimal 1 cup minuman!');
      return;
    }

    var cfg = getConfig();
    var methods = cfg.metodePembayaran || [];
    var matchedPay = methods.find(function (m) {
      return m.id === activePayment;
    });
    var paymentLabel = matchedPay ? matchedPay.nama : 'Tunai';

    var custInput = document.getElementById('customer-name');
    var notesInput = document.getElementById('order-notes');
    var customerName = (custInput && custInput.value.trim()) || 'Pelanggan';
    var orderNotes = (notesInput && notesInput.value.trim()) || '';

    var now = new Date();
    var timeDisplay = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    var dateDisplay = now.toLocaleDateString('id-ID');

    var itemsSimple = itemsOrdered
      .map(function (it) {
        return it.qty + 'x ' + it.name;
      })
      .join(', ');

    var modsSummary = itemsOrdered
      .map(function (it) {
        return it.sugar + ' · ' + it.ice;
      })
      .join('; ');

    var newTrx = {
      id: 'LTC-' + currentOrderNumber,
      timestamp: now.toISOString(),
      timeDisplay: timeDisplay,
      dateDisplay: dateDisplay,
      customer: customerName,
      notes: orderNotes,
      items: itemsOrdered,
      itemsSimple: itemsSimple,
      modsSummary: modsSummary,
      total: totalAmount,
      paymentMethod: paymentLabel,
      paymentId: activePayment,
    };

    transactions.unshift(newTrx);
    persistTransactions();

    sendToGoogleSheets(newTrx);

    initOrderState();
    renderMenuCards();
    updateStats();
    renderTransactionsTable();

    showToast('✅ Berhasil mencatat ' + formatRupiah(totalAmount) + ' (' + customerName + ')');
  }

  // Hapus Transaksi
  function handleDeleteTransaction(id) {
    if (!confirm('Yakin ingin membatalkan & menghapus transaksi #' + id + '?')) return;

    transactions = transactions.filter(function (t) {
      return t.id !== id;
    });
    persistTransactions();
    updateStats();
    renderTransactionsTable();
    showToast('🗑️ Transaksi telah dihapus');
  }

  // Export ke CSV
  function exportToCSV() {
    if (transactions.length === 0) {
      showToast('⚠️ Belum ada transaksi untuk di-download!');
      return;
    }

    var headers = ['ID Transaksi', 'Tanggal', 'Jam', 'Nama Pembeli', 'Pesanan', 'Takaran', 'Catatan', 'Total (Rp)', 'Metode Bayar', 'Status'];
    var rows = transactions.map(function (t) {
      return [
        '"' + t.id + '"',
        '"' + t.dateDisplay + '"',
        '"' + t.timeDisplay + '"',
        '"' + (t.customer || '').replace(/"/g, '""') + '"',
        '"' + (t.itemsSimple || '').replace(/"/g, '""') + '"',
        '"' + (t.modsSummary || '').replace(/"/g, '""') + '"',
        '"' + (t.notes || '').replace(/"/g, '""') + '"',
        t.total,
        '"' + (t.paymentMethod || '') + '"',
        '"Lunas"',
      ];
    });

    var csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.map(function (r) { return r.join(','); }).join('\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'pembukuan-kedai-latcha-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('📥 CSV berhasil diunduh!');
  }

  // Bersihkan Data
  function clearAllData() {
    if (transactions.length === 0) return;
    if (!confirm('PERINGATAN: Semua riwayat transaksi akan dihapus dari browser ini. Lanjutkan?')) return;

    transactions = [];
    persistTransactions();
    initOrderState();
    updateStats();
    renderTransactionsTable();
    showToast('Semua data transaksi telah dibersihkan');
  }

  // Digital Clock
  function startClock() {
    var clockEl = document.getElementById('live-clock');
    var datePill = document.getElementById('current-date-pill');

    function tick() {
      var now = new Date();
      var timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (clockEl) clockEl.textContent = '🕒 ' + timeStr + ' WIB';
      if (datePill) {
        var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        datePill.textContent = 'Hari ini · ' + days[now.getDay()] + ', ' + now.getDate() + ' ' + months[now.getMonth()];
      }
    }

    tick();
    setInterval(tick, 1000);
  }

  // Setup Event Listeners
  function setupListeners() {
    var menuList = document.getElementById('pos-menu-list');
    if (menuList) {
      menuList.addEventListener('click', function (e) {
        var plusBtn = e.target.closest('.btn-plus');
        var minusBtn = e.target.closest('.btn-minus');
        var modPill = e.target.closest('.pill-opt');

        if (plusBtn) {
          var idPlus = plusBtn.getAttribute('data-id');
          if (orderState[idPlus]) {
            orderState[idPlus].qty += 1;
            updateOrderUI();
          }
        } else if (minusBtn) {
          var idMinus = minusBtn.getAttribute('data-id');
          if (orderState[idMinus] && orderState[idMinus].qty > 0) {
            orderState[idMinus].qty -= 1;
            updateOrderUI();
          }
        } else if (modPill) {
          var parent = modPill.closest('.mod-pill-group');
          if (parent) {
            var itemId = parent.getAttribute('data-id');
            var modType = parent.getAttribute('data-mod');
            var val = modPill.getAttribute('data-val');

            if (orderState[itemId] && modType) {
              orderState[itemId][modType] = val;
              parent.querySelectorAll('.pill-opt').forEach(function (p) {
                p.classList.remove('active');
              });
              modPill.classList.add('active');
              updateOrderUI();
            }
          }
        }
      });
    }

    // Filter Kategori (Semua, Kopi, Matcha)
    var catTabs = document.getElementById('category-tabs');
    if (catTabs) {
      catTabs.addEventListener('click', function (e) {
        var tab = e.target.closest('.cat-tab');
        if (tab) {
          activeFilter = tab.getAttribute('data-filter') || 'all';
          catTabs.querySelectorAll('.cat-tab').forEach(function (t) {
            t.classList.remove('active');
          });
          tab.classList.add('active');
          renderMenuCards();
        }
      });
    }

    // Live update customer name on receipt
    var custInput = document.getElementById('customer-name');
    var receiptCustName = document.getElementById('receipt-cust-name');
    if (custInput && receiptCustName) {
      custInput.addEventListener('input', function () {
        receiptCustName.textContent = custInput.value.trim() || '-';
      });
    }

    // Payment Selection
    var payContainer = document.getElementById('payment-pills');
    if (payContainer) {
      payContainer.addEventListener('click', function (e) {
        var pill = e.target.closest('.pay-btn');
        if (pill) {
          activePayment = pill.getAttribute('data-pay');
          payContainer.querySelectorAll('.pay-btn').forEach(function (p) {
            p.classList.remove('active');
          });
          pill.classList.add('active');

          var receiptPayName = document.getElementById('receipt-pay-name');
          var cfg = getConfig();
          var matched = (cfg.metodePembayaran || []).find(function (m) { return m.id === activePayment; });
          if (receiptPayName && matched) {
            receiptPayName.textContent = matched.nama;
          }
        }
      });
    }

    // Save
    var btnSave = document.getElementById('btn-save-order');
    if (btnSave) {
      btnSave.addEventListener('click', handleSaveTransaction);
    }

    // Delete in table
    var tbody = document.getElementById('trx-table-body');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var delBtn = e.target.closest('.btn-del-entry');
        if (delBtn) {
          var id = delBtn.getAttribute('data-id');
          handleDeleteTransaction(id);
        }
      });
    }

    // Export CSV
    var btnExport = document.getElementById('btn-export-csv');
    if (btnExport) {
      btnExport.addEventListener('click', exportToCSV);
    }

    // Clear
    var btnClear = document.getElementById('btn-clear-data');
    if (btnClear) {
      btnClear.addEventListener('click', clearAllData);
    }
  }

  // Cek Status Google Sheets
  function updateSyncBadge() {
    var badge = document.getElementById('sync-status-badge');
    if (!badge) return;

    var cfg = getConfig();
    if (cfg.googleSheetWebhookUrl) {
      badge.className = 'sync-status';
      badge.innerHTML = '<span class="sync-dot"></span> Google Sheets Terhubung';
    } else {
      badge.className = 'sync-status offline';
      badge.innerHTML = '<span class="sync-dot"></span> Mode lokal · tersimpan';
    }
  }

  // Inisialisasi
  function init() {
    loadTransactions();
    initOrderState();
    renderMenuCards();
    renderPaymentPills();
    updateOrderUI();
    updateStats();
    renderTransactionsTable();
    startClock();
    updateSyncBadge();
    setupListeners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
