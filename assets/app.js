/* ==========================================================
   PREMIUM STORE — shared app engine
   Data source: /products.json  (single source of truth)
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
      '<button class="search-btn" type="button" onclick="openSearchModal()"><i class="fas fa-search"></i><span> Search</span></button>' +
      '<a class="hdr-btn hdr-btn--bot" href="https://t.me/PSNamso_bot" target="_blank" rel="noopener" rel="noopener"><i class="fa-brands fa-telegram"></i><span> Bot</span></a>' +
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
      '<button class="close-search" type="button" onclick="closeSearchModal()"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="search-input-wrapper">' +
      '<input type="text" class="search-input" id="searchInput" placeholder="Search products... (e.g., Netflix, ChatGPT, VPN)" oninput="performSearch()" />' +
      '</div>' +
      '<div class="search-results" id="searchResults"><div class="no-results">Type to search for products</div></div>' +
      '</div></div>';
    document.body.appendChild(wrap.firstChild);

    document.getElementById('searchModal').addEventListener('click', function (e) {
      if (e.target === this) closeSearchModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeSearchModal(); closePlanModal(); }
    });
  }

  window.openSearchModal = function () {
    var m = document.getElementById('searchModal');
    if (!m) return;
    m.classList.add('active');
    var inp = document.getElementById('searchInput');
    if (inp) inp.focus();
    loadData();
  };

  window.closeSearchModal = function () {
    var m = document.getElementById('searchModal');
    if (!m) return;
    m.classList.remove('active');
    var inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    var res = document.getElementById('searchResults');
    if (res) res.innerHTML = '<div class="no-results">Type to search for products</div>';
  };

  window.performSearch = function () {
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
        return (p.name + ' ' + p.subtitle + ' ' + (cat.title || '')).toLowerCase().indexOf(term) !== -1;
      }).slice(0, 12);
      if (!hits.length) { res.innerHTML = '<div class="no-results">No products found for "' + esc(inp.value) + '"</div>'; return; }
      res.innerHTML = hits.map(function (p) {
        var cat = catBySlug[p.category] || {};
        return '<a href="' + esc(p.category) + '.html#app-' + esc(p.id) + '" class="search-result-item" onclick="closeSearchModal()">' +
          '<div class="search-result-icon"><i class="fas ' + esc(cat.icon || 'fa-box') + '"></i></div>' +
          '<div class="search-result-name">' + esc(p.name) + '</div>' +
          '</a>';
      }).join('');
    });
  };

  /* ---------- Plan modal ---------- */
  function injectPlanModal() {
    if (document.getElementById('planModal')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div id="planModal" class="modal-overlay" onclick="closeModalOutside(event)">' +
      '<div class="modal-content">' +
      '<span class="close-modal" onclick="closePlanModal()">&times;</span>' +
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
        '<a class="plan-contact-btn plan-contact-btn--tg" href="' + esc(s.telegramChannel || '#') + '" target="_blank" rel="noopener" rel="noopener"><i class="fa-brands fa-telegram"></i> Ask price</a>' +
        '<a class="plan-contact-btn plan-contact-btn--fb" href="' + esc(s.facebookPage || '#') + '" target="_blank" rel="noopener" rel="noopener"><i class="fa-brands fa-facebook"></i></a>' +
        '</div></div>';
    }
    var href;
    if (s.deepLinks) {
      href = 'https://t.me/' + s.botUsername + '?start=' + (s.deepLinkPrefix || 'buy') + '-' + product.id + '-' + plan.id;
    } else {
      href = (s.paymentPage || 'payment.html') + '?product=' + encodeURIComponent(product.id) + '&plan=' + encodeURIComponent(plan.id);
    }
    var target = s.deepLinks ? ' target="_blank" rel="noopener" rel="noopener"' : '';
    return '<a href="' + href + '" class="plan-btn"' + target + '>' +
      '<div class="plan-info"><span class="plan-name">' + esc(plan.name) + '</span>' +
      '<span class="plan-desc">' + esc(plan.desc) + '</span></div>' +
      '<span class="plan-price">' + esc(plan.price) + '</span></a>';
  }

  window.openModal = function (productId) {
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
  };

  window.closePlanModal = function () {
    var m = document.getElementById('planModal');
    if (m) m.style.display = 'none';
  };
  window.closeModal = window.closePlanModal;
  window.closeModalOutside = function (e) {
    if (e.target === document.getElementById('planModal')) closePlanModal();
  };

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
          '<button class="view-plans-btn" type="button" onclick="openModal(\'' + esc(p.id) + '\')">View Plans</button>' +
          '</div>';
      }).join('');
      // deep anchor: open modal if URL hash targets a product
      if (location.hash && location.hash.indexOf('#app-') === 0) {
        var id = location.hash.slice(5);
        var el = document.getElementById('app-' + id);
        if (el) { el.scrollIntoView({ block: 'center' }); window.openModal(id); }
      }
    });
  }

  /* ---------- Homepage: category grid + review preview ---------- */
  function renderCategoryGrid() {
    var grid = document.getElementById('category-grid');
    if (!grid) return;
    loadData().then(function (d) {
      if (!d) return;
      var counts = {};
      d.products.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
      var html = d.categories.map(function (c) {
        return '<a href="' + esc(c.page) + '" class="category-card">' +
          '<div class="cat-icon"><i class="fa-solid ' + esc(c.icon) + '"></i></div>' +
          '<h3>' + esc(c.title) + '</h3>' +
          '<span class="cat-count">' + (counts[c.slug] || 0) + ' products</span>' +
          '</a>';
      }).join('');
      html += '<a href="reviews.html" class="category-card category-card--alt">' +
        '<div class="cat-icon"><i class="fa-solid fa-star"></i></div>' +
        '<h3>Customer Reviews</h3><span class="cat-count">30+ reviews</span></a>';
      html += '<a href="expressvpn-location-guide.html" class="category-card category-card--alt">' +
        '<div class="cat-icon"><i class="fa-solid fa-location-dot"></i></div>' +
        '<h3>ExpressVPN Location Guide</h3><span class="cat-count">Guide</span></a>';
      grid.innerHTML = html;
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
    renderAppList();
    renderCategoryGrid();
    renderOrderSummary();
    bindFAQ();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
