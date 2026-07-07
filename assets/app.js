/* ==========================================================
   PREMIUM STORE — shared app engine
   Data source: /products.json  (single source of truth)
   CSP-safe: NO inline handlers — one delegated click listener
   routes [data-action] elements (see boot()).
   ========================================================== */
(function () {
  'use strict';

  var DATA = null;
  var dataPromise = null;

  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = fetch('products.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('products.json load failed'); return r.json(); })
      .then(function (d) { DATA = d; return d; })
      .catch(function (e) { console.error(e); return null; });
    return dataPromise;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Sticky header ---------- */
  function injectHeader() {
    if (document.querySelector('.site-header')) return;
    var hdr = document.createElement('header');
    hdr.className = 'site-header';
    hdr.innerHTML =
      '<a class="site-brand" href="index.html"><i class="fa-solid fa-gem"></i> PREMIUM STORE</a>' +
      '<div class="site-header-actions">' +
      '<a class="hdr-btn" href="index.html"><i class="fa-solid fa-house"></i><span> Home</span></a>' +
      '<button class="search-btn" type="button" data-action="search-open"><i class="fas fa-search"></i><span> Search</span></button>' +
      '<a class="hdr-btn hdr-btn--bot" href="https://t.me/PSNamso_bot" target="_blank" rel="noopener"><i class="fa-brands fa-telegram"></i><span> Bot</span></a>' +
      '</div>';
    document.body.insertBefore(hdr, document.body.firstChild);
  }

  /* ---------- Search modal ---------- */
  function injectSearchModal() {
    if (document.getElementById('searchModal')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="search-modal" id="searchModal">' +
      '<div class="search-modal-content">' +
      '<div class="search-modal-header">' +
      '<h2 class="search-modal-title">Search Products</h2>' +
      '<button class="close-search" type="button" data-action="search-close"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="search-input-wrapper">' +
      '<input type="text" class="search-input" id="searchInput" placeholder="Search products... (e.g., Netflix, ChatGPT, VPN)" />' +
      '</div>' +
      '<div class="search-results" id="searchResults"><div class="no-results">Type to search for products</div></div>' +
      '</div></div>';
    document.body.appendChild(wrap.firstChild);

    document.getElementById('searchInput').addEventListener('input', performSearch);
    document.getElementById('searchModal').addEventListener('click', function (e) {
      if (e.target === this) closeSearchModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeSearchModal(); closePlanModal(); closeCheckout(); }
    });
  }

  function openSearchModal() {
    var m = document.getElementById('searchModal');
    if (!m) return;
    m.classList.add('active');
    var inp = document.getElementById('searchInput');
    if (inp) inp.focus();
    loadData();
  }

  function closeSearchModal() {
    var m = document.getElementById('searchModal');
    if (!m) return;
    m.classList.remove('active');
    var inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    var res = document.getElementById('searchResults');
    if (res) res.innerHTML = '<div class="no-results">Type to search for products</div>';
  }

  function performSearch() {
    var inp = document.getElementById('searchInput');
    var res = document.getElementById('searchResults');
    if (!inp || !res) return;
    var term = inp.value.trim().toLowerCase();
    if (!term) { res.innerHTML = '<div class="no-results">Type to search for products</div>'; return; }
    loadData().then(function (d) {
      if (!d) { res.innerHTML = '<div class="no-results">Search unavailable</div>'; return; }
      var catBySlug = {};
      d.categories.forEach(function (c) { catBySlug[c.slug] = c; });
      var hits = d.products.filter(function (p) {
        var cat = catBySlug[p.category] || {};
        return (p.name + ' ' + (p.subtitle || '') + ' ' + (cat.title || '')).toLowerCase().indexOf(term) !== -1;
      }).slice(0, 12);
      if (!hits.length) { res.innerHTML = '<div class="no-results">No products found for "' + esc(inp.value) + '"</div>'; return; }
      res.innerHTML = hits.map(function (p) {
        var cat = catBySlug[p.category] || {};
        return '<a href="' + esc(p.category) + '.html#app-' + esc(p.id) + '" class="search-result-item" data-action="search-close">' +
          '<div class="search-result-icon"><i class="fas ' + esc(cat.icon || 'fa-box') + '"></i></div>' +
          '<div class="search-result-name">' + esc(p.name) + '</div>' +
          '</a>';
      }).join('');
    });
  }

  /* ---------- Plan modal ---------- */
  function injectPlanModal() {
    if (document.getElementById('planModal')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div id="planModal" class="modal-overlay" data-action="overlay-plan">' +
      '<div class="modal-content">' +
      '<span class="close-modal" data-action="plan-close">&times;</span>' +
      '<h2 class="modal-title" id="modalTitle">Choose Plan</h2>' +
      '<div id="modalPlans"></div>' +
      '</div></div>';
    document.body.appendChild(wrap.firstChild);
  }

  function planButtonHTML(product, plan) {
    var s = DATA.settings || {};
    if (plan.stock === false) {
      return '<div class="plan-btn" style="cursor:default;opacity:0.55">' +
        '<div class="plan-info"><span class="plan-name">' + esc(plan.name) + '</span>' +
        '<span class="plan-desc">' + esc(plan.desc) + '</span></div>' +
        '<span class="plan-price" style="color:#ff6b6b">Out of stock</span></div>';
    }
    if (plan.contact) {
      return '<div class="plan-btn" style="cursor:default">' +
        '<div class="plan-info"><span class="plan-name">' + esc(plan.name) + '</span>' +
        '<span class="plan-desc">' + esc(plan.desc) + '</span></div>' +
        '<div class="plan-contact-row">' +
        '<a class="plan-contact-btn plan-contact-btn--tg" href="' + esc(s.telegramChannel || '#') + '" target="_blank" rel="noopener"><i class="fa-brands fa-telegram"></i> Ask price</a>' +
        '<a class="plan-contact-btn plan-contact-btn--fb" href="' + esc(s.facebookPage || '#') + '" target="_blank" rel="noopener"><i class="fa-brands fa-facebook"></i></a>' +
        '</div></div>';
    }
    // Hybrid checkout: clicking a plan opens the checkout-method chooser.
    // product/plan ids ride on data attrs; the delegated listener routes it.
    return '<button type="button" class="plan-btn" data-action="checkout-open" ' +
      'data-pid="' + esc(product.id) + '" data-plid="' + esc(plan.id) + '">' +
      '<div class="plan-info"><span class="plan-name">' + esc(plan.name) + '</span>' +
      '<span class="plan-desc">' + esc(plan.desc) + '</span></div>' +
      '<span class="plan-price">' + esc(plan.price) + '</span></button>';
  }

  /* ---------- Checkout-method modal (hybrid: bot + web form) ---------- */
  function injectCheckoutModal() {
    if (document.getElementById('checkoutModal')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div id="checkoutModal" class="modal-overlay" data-action="overlay-checkout">' +
      '<div class="modal-content">' +
      '<span class="close-modal" data-action="checkout-close">&times;</span>' +
      '<h2 class="modal-title">ဝယ်ယူနည်း ရွေးပါ</h2>' +
      '<div id="checkoutBody"></div>' +
      '</div></div>';
    document.body.appendChild(wrap.firstChild);
  }

  function openCheckout(productId, planId) {
    loadData().then(function (d) {
      if (!d) return;
      var s = d.settings || {};
      var product = d.products.find(function (p) { return p.id === productId; });
      if (!product) return;
      var plan = (product.plans || []).find(function (x) { return x.id === planId; });
      if (!plan) return;

      injectCheckoutModal();
      var body = document.getElementById('checkoutBody');
      var summary =
        '<div class="checkout-summary">' +
        '<span class="plan-name">' + esc(product.name) + ' — ' + esc(plan.name) + '</span>' +
        '<span class="plan-price">' + esc(plan.price) + '</span></div>';

      // Telegram bot option — only when a bot mapping exists for THIS plan
      // (mapping flag = plan.bot === true, set from products.json by the panel)
      // AND the global settings.deepLinks master-switch is not turned off.
      // deepLinks !== false => on when true or absent (backward compatible);
      // deepLinks:false hides ALL bot deep-link buttons site-wide (kill-switch).
      // Deep-link format MUST be 'buy-<product>-<plan>' (hyphen, 3 parts) —
      // that is exactly what the live bot's /start handler parses
      // (^/start buy-...  ->  split('-',2) -> web_catalog.lookup(pid, plid)).
      var botHtml = '';
      if (s.deepLinks !== false && plan.bot === true && s.botUsername) {
        var start = (s.deepLinkPrefix || 'buy') + '-' + product.id + '-' + plan.id;
        var tgHref = 'https://t.me/' + s.botUsername + '?start=' + start;
        botHtml =
          '<a class="checkout-opt checkout-opt--bot" href="' + tgHref + '" target="_blank" rel="noopener">' +
          '<div class="checkout-opt-main"><i class="fa-brands fa-telegram"></i> Telegram Bot ကနေ ဝယ်မည်</div>' +
          '<div class="checkout-opt-sub">အမြန်ဆုံး · auto delivery · wallet/VIP အကျိုးရ (Recommended)</div></a>';
      }

      // Website order form — always available as a fallback.
      var payHref = (s.paymentPage || 'payment.html') +
        '?product=' + encodeURIComponent(product.id) + '&plan=' + encodeURIComponent(plan.id);
      var webHtml =
        '<a class="checkout-opt checkout-opt--web" href="' + payHref + '">' +
        '<div class="checkout-opt-main"><i class="fa-solid fa-file-invoice"></i> Website ကနေ Order Form တင်မည်</div>' +
        '<div class="checkout-opt-sub">Payment screenshot တင် · admin က manual ပြန်ဆက်သွယ်</div></a>';

      var note = botHtml ? '' :
        '<div class="checkout-note">ဒီ plan အတွက် bot auto မရသေးပါ — Website Order Form နဲ့ ဝယ်ပါ။</div>';

      body.innerHTML = summary + botHtml + webHtml + note;
      document.getElementById('checkoutModal').style.display = 'flex';
    });
  }

  function closeCheckout() {
    var m = document.getElementById('checkoutModal');
    if (m) m.style.display = 'none';
  }

  function openModal(productId) {
    loadData().then(function (d) {
      if (!d) return;
      var product = d.products.find(function (p) { return p.id === productId; });
      if (!product) return;
      var modal = document.getElementById('planModal');
      document.getElementById('modalTitle').innerText = product.modalTitle || product.name;
      document.getElementById('modalPlans').innerHTML = product.plans.map(function (pl) {
        if (pl.header) return '<div class="plan-category">' + esc(pl.header) + '</div>';
        return planButtonHTML(product, pl);
      }).join('');
      modal.style.display = 'flex';
    });
  }

  function closePlanModal() {
    var m = document.getElementById('planModal');
    if (m) m.style.display = 'none';
  }

  /* ---------- Delegated click routing (CSP-safe, no inline handlers) ----- */
  function bindActions() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!el) return;
      var act = el.getAttribute('data-action');
      if (act === 'back') { e.preventDefault(); window.history.back(); }
      else if (act === 'search-open') { openSearchModal(); }
      else if (act === 'search-close') { closeSearchModal(); }          // <a> keeps navigating
      else if (act === 'plan-close') { closePlanModal(); }
      else if (act === 'checkout-close') { closeCheckout(); }
      else if (act === 'view-plans') { openModal(el.getAttribute('data-pid')); }
      else if (act === 'checkout-open') {
        openCheckout(el.getAttribute('data-pid'), el.getAttribute('data-plid'));
      }
      else if (act === 'overlay-plan') { if (e.target === el) closePlanModal(); }
      else if (act === 'overlay-checkout') { if (e.target === el) closeCheckout(); }
    });
  }

  /* ---------- Category page: render app list ---------- */
  function renderAppList() {
    var list = document.getElementById('app-list');
    if (!list) return;
    var slug = list.getAttribute('data-category');
    loadData().then(function (d) {
      if (!d) { list.innerHTML = '<p style="text-align:center">Products failed to load. Please refresh.</p>'; return; }
      var items = d.products.filter(function (p) { return p.category === slug; });
      list.innerHTML = items.map(function (p) {
        var cls = 'app-logo' + (p.imageClass ? ' ' + esc(p.imageClass) : '');
        return '<div class="app-item" id="app-' + esc(p.id) + '">' +
          '<img loading="lazy" decoding="async" src="' + esc(p.image) + '" alt="' + esc(p.name) + '" width="48" height="48" class="' + cls + '" />' +
          '<div class="app-info"><h3>' + esc(p.name) + '</h3><p>' + esc(p.subtitle) + '</p></div>' +
          '<button class="view-plans-btn" type="button" data-action="view-plans" data-pid="' + esc(p.id) + '">View Plans</button>' +
          '</div>';
      }).join('');
      // deep anchor: open modal if URL hash targets a product
      if (location.hash && location.hash.indexOf('#app-') === 0) {
        var id = location.hash.slice(5);
        var el = document.getElementById('app-' + id);
        if (el) { el.scrollIntoView({ block: 'center' }); openModal(id); }
      }
    });
  }

  /* ---------- Homepage: enhance the static category cards with live product
     counts. Progressive enhancement — the image cards in index.html are the
     no-JS fallback; here we only add a "N products" badge once data loads, so
     a JS/products.json failure leaves the static cards fully intact. ---------- */
  function enhanceHomeCards() {
    var cards = document.querySelectorAll('.product-container .card-link');
    if (!cards.length) return;
    loadData().then(function (d) {
      if (!d) return; // data failed -> static cards stay as-is (fallback)
      var counts = {};
      d.products.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
      cards.forEach(function (a) {
        var slug = (a.getAttribute('href') || '').replace(/\.html.*$/, '');
        var n = counts[slug];
        if (!n) return; // guide / unknown card -> no count badge
        var card = a.querySelector('.product-card');
        if (!card || card.querySelector('.cat-count')) return;
        var badge = document.createElement('span');
        badge.className = 'cat-count';
        badge.textContent = n + ' products';
        card.appendChild(badge);
      });
    });
  }

  /* ---------- Payment page: order summary from query ---------- */
  function renderOrderSummary() {
    var host = document.getElementById('order-summary');
    if (!host) return;
    var q = new URLSearchParams(location.search);
    var pid = q.get('product'), plid = q.get('plan');
    if (!pid) { host.style.display = 'none'; return; }
    loadData().then(function (d) {
      if (!d) return;
      var product = d.products.find(function (p) { return p.id === pid; });
      if (!product) { host.style.display = 'none'; return; }
      var plan = (product.plans || []).find(function (pl) { return pl.id === plid; });
      host.style.display = '';
      var onOrderPage = location.pathname.indexOf('order.html') !== -1;
      var tail = onOrderPage
        ? 'အောက်က form ကိုဖြည့်ပြီး ငွေလွှဲ screenshot တင်ပေးပါ။'
        : 'အောက်မှာ Platform ရွေးပြီး QR နဲ့ ငွေလွှဲပါ။ ငွေလွှဲပြီးရင် screenshot ကို <a href="https://www.messenger.com/t/happyyou2020" target="_blank" rel="noopener" style="color:#00d2ff">Page Messenger</a> သို့မဟုတ် <a href="order.html' + location.search + '" style="color:#00d2ff">ဒီ order form</a> ကနေ တင်နိုင်ပါတယ်။';
      host.innerHTML = '<h3><i class="fa-solid fa-cart-shopping"></i> Your Order</h3>' +
        '<p>' + esc(product.name) + (plan ? ' — ' + esc(plan.name) : '') + '</p>' +
        (plan && plan.price ? '<p class="os-price">' + esc(plan.price) + '</p>' : '') +
        '<p style="font-size:0.85rem;color:rgba(255,255,255,0.65)">' + tail + '</p>';
    });
  }

  /* ---------- FAQ toggles (works with existing markup) ---------- */
  function bindFAQ() {
    document.querySelectorAll('.faq-question').forEach(function (q) {
      q.addEventListener('click', function () {
        q.classList.toggle('active');
        var a = q.nextElementSibling;
        if (a) a.style.maxHeight = q.classList.contains('active') ? (a.scrollHeight + 'px') : 0;
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    injectHeader();
    injectSearchModal();
    injectPlanModal();
    bindActions();
    renderAppList();
    enhanceHomeCards();
    renderOrderSummary();
    bindFAQ();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
