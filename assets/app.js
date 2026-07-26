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
  var dataTime = 0;
  // products.json edge cache TTL နဲ့ တန်းညှိထားသည်။ page တစ်သက်လုံး memo
  // လုပ်ထားရင် tab ဟောင်းတစ်ခုက sold-out plan ကို stock ရှိသလို ဆက်ပြနေမယ်
  // (checkout stock re-check ကလည်း အဲ့ဒီ ဟောင်းနေတဲ့ snapshot ကိုပဲ ဖတ်မိမယ်)။
  var DATA_TTL = 60000;

  function loadData() {
    if (dataPromise && (Date.now() - dataTime) < DATA_TTL) return dataPromise;
    dataTime = Date.now();
    dataPromise = fetch('products.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('products.json load failed'); return r.json(); })
      .then(function (d) { DATA = d; return d; })
      .catch(function (e) {
        console.error(e);
        dataPromise = null; // allow a later retry to refetch
        return null;
      });
    return dataPromise;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Modal focus handling (a11y) ----------
     Modal တွေက body အဆုံးမှာ inject လုပ်တာမို့ screen reader / keyboard user
     အတွက် focus ကို ကိုယ်တိုင် ရွှေ့ပေးမှ တွေ့မယ်။ ပိတ်ရင် ဖွင့်ခဲ့တဲ့ ခလုတ်ဆီ
     ပြန်ပို့ပေးသည်။ key တစ်ခုစီ modal တစ်ခုစီ (plan ထဲက checkout ဖွင့်တာမျိုး
     ထပ်နေလည်း trigger မမှားစေရ)။ */
  var lastFocus = {};

  function modalOpened(key, el, focusEl) {
    lastFocus[key] = document.activeElement;
    var f = focusEl || (el && el.querySelector('.close-modal, .close-search, button, [href], input'));
    if (f && f.focus) { try { f.focus(); } catch (e) {} }
  }

  function modalClosed(key) {
    var t = lastFocus[key];
    lastFocus[key] = null;
    // ကွယ်နေတဲ့ (ဥပမာ ပိတ်ပြီးသား modal ထဲက) element ဆီ focus မပို့ဘူး
    if (t && t.focus && document.contains(t) && t.offsetParent !== null) {
      try { t.focus(); } catch (e) {}
    }
  }

  /* ---------- Sticky header ---------- */
  function injectHeader() {
    if (document.querySelector('.site-header')) return;
    var hdr = document.createElement('header');
    hdr.className = 'site-header';
    hdr.innerHTML =
      '<a class="site-brand" href="index.html"><img class="site-logo" src="images/brand-logo.png" alt="Premium Store" width="30" height="30" /> <span>PREMIUM <b>STORE</b></span></a>' +
      '<div class="site-header-actions">' +
      // theme cycle button — clicks handled by theme.js (not bindActions)
      '<button class="hdr-btn theme-toggle-btn" type="button" id="themeToggle" data-action="theme-cycle" title="Theme" aria-label="Theme"><i class="fa-solid fa-circle-half-stroke"></i></button>' +
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
      '<div class="search-modal-content" role="dialog" aria-modal="true" aria-labelledby="searchModalTitle">' +
      '<div class="search-modal-header">' +
      '<h2 class="search-modal-title" id="searchModalTitle">Search Products</h2>' +
      '<button class="close-search" type="button" data-action="search-close" aria-label="Close search"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="search-input-wrapper">' +
      '<input type="text" class="search-input" id="searchInput" aria-label="Search products" placeholder="Search products... (e.g., Netflix, ChatGPT, VPN)" />' +
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
    modalOpened('search', m, inp);
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
    modalClosed('search');
  }

  function performSearch() {
    var inp = document.getElementById('searchInput');
    var res = document.getElementById('searchResults');
    if (!inp || !res) return;
    var term = inp.value.trim().toLowerCase();
    if (!term) { res.innerHTML = '<div class="no-results">Type to search for products</div>'; return; }
    loadData().then(function (d) {
      if (!d) { res.innerHTML = '<div class="no-results">ရှာဖွေမှု မရသေးပါ — Internet ပြန်စစ်ပြီး ထပ်ရိုက်ကြည့်ပေးပါ။</div>'; return; }
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
      '<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      // real <button> (span က keyboard နဲ့ နှိပ်လို့မရ) — inline style တွေက
      // browser ရဲ့ default button chrome ကို ဖယ်ပြီး .close-modal ရဲ့ ပုံစံအတိုင်း
      // ဆက်မြင်ရအောင် ထားသည် (CSS ဖိုင် မထိရအောင်)။
      '<button type="button" class="close-modal" data-action="plan-close" aria-label="Close" style="background:none;border:0;padding:0;line-height:1;font-family:inherit">&times;</button>' +
      '<h2 class="modal-title" id="modalTitle">Choose Plan</h2>' +
      '<div id="modalPlans"></div>' +
      '</div></div>';
    document.body.appendChild(wrap.firstChild);
  }

  function planButtonHTML(product, plan) {
    var s = DATA.settings || {};
    if (plan.stock === false) {
      return '<div class="plan-btn plan-btn--oos">' +
        '<div class="plan-info"><span class="plan-name">' + esc(plan.name) + '</span>' +
        '<span class="plan-desc">' + esc(plan.desc) + '</span></div>' +
        '<div style="text-align:right">' +
        '<span class="plan-price" style="text-decoration:line-through;opacity:0.55">' + esc(plan.price) + '</span>' +
        '<span style="display:block;font-size:0.72rem;font-weight:600;color:#ff6b6b;white-space:nowrap">Out of stock</span>' +
        '</div></div>';
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
      '<div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">' +
      '<button type="button" class="close-modal" data-action="checkout-close" aria-label="Close" style="background:none;border:0;padding:0;line-height:1;font-family:inherit">&times;</button>' +
      '<h2 class="modal-title" id="checkoutTitle">ဝယ်ယူနည်း ရွေးပါ</h2>' +
      '<div id="checkoutBody"></div>' +
      '</div></div>';
    document.body.appendChild(wrap.firstChild);
  }

  // Bumped on every open AND on close — a pending fetch from a closed (or
  // superseded) open sees a stale seq and must not render/re-show the modal.
  var checkoutSeq = 0;

  function openCheckout(productId, planId) {
    // Open instantly with a loading state — data may still be fetching.
    injectCheckoutModal();
    var seq = ++checkoutSeq;
    var body = document.getElementById('checkoutBody');
    var cmodal = document.getElementById('checkoutModal');
    body.innerHTML = '<div class="no-results">Loading…</div>';
    cmodal.style.display = 'flex';
    modalOpened('checkout', cmodal);
    loadData().then(function (d) {
      if (seq !== checkoutSeq) return; // closed / reopened while loading
      var product = d && d.products.find(function (p) { return p.id === productId; });
      var plan = product && (product.plans || []).find(function (x) { return x.id === planId; });
      if (!plan) {
        // fetch failed (retryable — loadData refetches) or unknown ids
        body.innerHTML =
          '<div class="no-results">အချက်အလက် မတင်နိုင်သေးပါ။ Internet ပြန်စစ်ပြီး ထပ်ကြိုးစားပေးပါ။</div>' +
          '<button type="button" class="view-plans-btn" style="width:100%" data-action="checkout-open" data-pid="' + esc(productId) + '" data-plid="' + esc(planId) + '">ထပ်ကြိုးစားမည်</button>';
        return;
      }
      // Stock re-check at checkout time — the plan button may have been
      // rendered from stale data (old tab) or reached via a bookmarked URL.
      if (plan.stock === false) {
        body.innerHTML =
          '<div class="no-results">ဒီ plan လောလောဆယ် stock မရှိပါ။ နောက်မှ ပြန်စစ်ပေးပါ (သို့) တခြား plan ရွေးပေးပါ။</div>' +
          '<button type="button" class="view-plans-btn" style="width:100%" data-action="checkout-close">ပိတ်မည်</button>';
        return;
      }
      var s = d.settings || {};
      var summary =
        '<div class="checkout-summary">' +
        '<span class="plan-name">' + esc(product.name) + ' — ' + esc(plan.name) +
        (plan.desc ? ' <span style="opacity:0.7;font-weight:400">(' + esc(plan.desc) + ')</span>' : '') + '</span>' +
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
        // ids/username are catalog-derived -> URL-encode the components and
        // esc() the final href before it touches innerHTML.
        var start = encodeURIComponent((s.deepLinkPrefix || 'buy') + '-' + product.id + '-' + plan.id);
        var tgHref = 'https://t.me/' + encodeURIComponent(s.botUsername) + '?start=' + start;
        botHtml =
          '<a class="checkout-opt checkout-opt--bot" href="' + esc(tgHref) + '" target="_blank" rel="noopener">' +
          '<div class="checkout-opt-main"><i class="fa-brands fa-telegram"></i> Telegram Bot ကနေ ဝယ်မည်</div>' +
          '<div class="checkout-opt-sub">အမြန်ဆုံး · auto delivery · wallet/VIP အကျိုးရ (Recommended)</div></a>';
      }

      // Website order form — always available as a fallback.
      var payHref = (s.paymentPage || 'payment.html') +
        '?product=' + encodeURIComponent(product.id) + '&plan=' + encodeURIComponent(plan.id);
      var webHtml =
        '<a class="checkout-opt checkout-opt--web" href="' + esc(payHref) + '">' +
        '<div class="checkout-opt-main"><i class="fa-solid fa-file-invoice"></i> Website ကနေ Order Form တင်မည်</div>' +
        '<div class="checkout-opt-sub">Payment screenshot တင် · admin က manual ပြန်ဆက်သွယ်</div></a>';

      var note = botHtml ? '' :
        '<div class="checkout-note">ဒီ plan အတွက် bot auto မရသေးပါ — Website Order Form နဲ့ ဝယ်ပါ။</div>';

      body.innerHTML = summary + botHtml + webHtml + note;
      document.getElementById('checkoutModal').style.display = 'flex';
    });
  }

  function closeCheckout() {
    checkoutSeq++; // abort any in-flight open (it must not re-show the modal)
    var m = document.getElementById('checkoutModal');
    if (m) m.style.display = 'none';
    modalClosed('checkout');
  }

  function openModal(productId) {
    // Open instantly with a loading state — data may still be fetching.
    var modal = document.getElementById('planModal');
    var plansEl = document.getElementById('modalPlans');
    if (!modal || !plansEl) return;
    document.getElementById('modalTitle').innerText = 'Choose Plan';
    plansEl.innerHTML = '<div class="no-results">Loading…</div>';
    modal.style.display = 'flex';
    modalOpened('plan', modal);
    loadData().then(function (d) {
      var product = d && d.products.find(function (p) { return p.id === productId; });
      if (!product) {
        // fetch failed (retryable — loadData refetches) or unknown id
        plansEl.innerHTML =
          '<div class="no-results">Plan များ မတင်နိုင်သေးပါ။ Internet ပြန်စစ်ပြီး ထပ်ကြိုးစားပေးပါ။</div>' +
          '<button type="button" class="view-plans-btn" style="width:100%" data-action="view-plans" data-pid="' + esc(productId) + '">ထပ်ကြိုးစားမည်</button>';
        return;
      }
      var s = d.settings || {};
      document.getElementById('modalTitle').innerText = product.modalTitle || product.name;
      var plans = product.plans || [];
      plansEl.innerHTML = plans.length ? plans.map(function (pl) {
        if (pl.header) return '<div class="plan-category">' + esc(pl.header) + '</div>';
        return planButtonHTML(product, pl);
      }).join('') :
        // no plans published yet -> same look as a contact-only plan row
        '<div class="plan-btn" style="cursor:default">' +
        '<div class="plan-info"><span class="plan-name">ဒီ product အတွက် plan များကို Admin ကို တိုက်ရိုက် မေးမြန်းပေးပါ</span></div>' +
        '<div class="plan-contact-row">' +
        '<a class="plan-contact-btn plan-contact-btn--tg" href="' + esc(s.telegramChannel || '#') + '" target="_blank" rel="noopener"><i class="fa-brands fa-telegram"></i> Ask price</a>' +
        '<a class="plan-contact-btn plan-contact-btn--fb" href="' + esc(s.facebookPage || '#') + '" target="_blank" rel="noopener"><i class="fa-brands fa-facebook"></i></a>' +
        '</div></div>';
    });
  }

  function closePlanModal() {
    var m = document.getElementById('planModal');
    if (m) m.style.display = 'none';
    modalClosed('plan');
  }

  /* ---------- Delegated click routing (CSP-safe, no inline handlers) ----- */
  function bindActions() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!el) return;
      var act = el.getAttribute('data-action');
      if (act === 'back') {
        e.preventDefault();
        // t.me / Facebook share ကနေ တိုက်ရိုက်ဖွင့်ထားရင် history မရှိလို့
        // history.back() က ဘာမှ မဖြစ်ဘူး — အဲ့ဒီအခါ homepage ကို ပို့ပေးသည်။
        if (window.history.length > 1 && document.referrer.indexOf(location.origin) === 0) {
          window.history.back();
        } else {
          location.href = 'index.html';
        }
      }
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
      else if (act === 'list-retry') { renderAppList(); }
    });
    // hash can change after load (back/forward, shared #app- links) — reuse
    // the same deep-anchor logic renderAppList runs on first paint.
    window.addEventListener('hashchange', openFromHash);
  }

  /* ---------- Category page: render app list ---------- */
  function openFromHash() {
    if (location.hash && location.hash.indexOf('#app-') === 0) {
      var id = location.hash.slice(5);
      var el = document.getElementById('app-' + id);
      if (el) { el.scrollIntoView({ block: 'center' }); openModal(id); }
    }
  }

  function renderAppList() {
    var list = document.getElementById('app-list');
    if (!list) return;
    var slug = list.getAttribute('data-category');
    list.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.6)">Loading products…</p>';
    loadData().then(function (d) {
      if (!d) {
        list.innerHTML =
          '<p style="text-align:center">Products များ မတင်နိုင်သေးပါ။ Internet ပြန်စစ်ပြီး ထပ်ကြိုးစားပေးပါ။</p>' +
          '<p style="text-align:center"><button class="view-plans-btn" type="button" data-action="list-retry">ထပ်ကြိုးစားမည်</button></p>';
        return;
      }
      var items = d.products.filter(function (p) { return p.category === slug; });
      if (!items.length) {
        // panel မှာ ဒီ category ထဲက product အကုန် hide/unpublish ဖြစ်သွားရင်
        // အလွတ်ကြီး မပြစေရ — plan-less product state အတိုင်း contact လမ်းကြောင်း
        // ပေးထားသည်။
        var st = d.settings || {};
        list.innerHTML =
          '<p style="text-align:center">ဒီ category မှာ product မရှိသေးပါ။ နောက်မှ ပြန်ကြည့်ပေးပါ (သို့) Admin ကို မေးမြန်းနိုင်ပါတယ်။</p>' +
          '<div class="plan-contact-row" style="justify-content:center">' +
          '<a class="plan-contact-btn plan-contact-btn--tg" href="' + esc(st.telegramChannel || '#') + '" target="_blank" rel="noopener"><i class="fa-brands fa-telegram"></i> Telegram Channel</a>' +
          '<a class="plan-contact-btn plan-contact-btn--fb" href="' + esc(st.facebookPage || '#') + '" target="_blank" rel="noopener"><i class="fa-brands fa-facebook"></i> Contact Admin</a>' +
          '</div>' +
          '<p style="text-align:center;margin-top:14px"><a href="index.html" style="color:#00d2ff">🏠 Home ကို ပြန်သွားမည်</a></p>';
        return;
      }
      list.innerHTML = items.map(function (p) {
        var cls = 'app-logo' + (p.imageClass ? ' ' + esc(p.imageClass) : '');
        return '<div class="app-item" id="app-' + esc(p.id) + '">' +
          '<img loading="lazy" decoding="async" src="' + esc(p.image) + '" alt="' + esc(p.name) + '" width="48" height="48" class="' + cls + '" />' +
          '<div class="app-info"><h3>' + esc(p.name) + '</h3><p>' + esc(p.subtitle) + '</p></div>' +
          '<button class="view-plans-btn" type="button" data-action="view-plans" data-pid="' + esc(p.id) + '">View Plans</button>' +
          '</div>';
      }).join('');
      // deep anchor: open modal if URL hash targets a product
      openFromHash();
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
      // Cloudflare Pages serves clean URLs too — match /order and /order.html
      // (end-anchored so unrelated paths containing 'order' don't hit this).
      var onOrderPage = /(^|\/)order(\.html)?$/.test(location.pathname);
      // Rebuild the query from the two validated params only — never echo the
      // raw location.search into innerHTML (HTML-injection vector).
      var safeSearch = '?product=' + encodeURIComponent(pid) +
        (plid ? '&plan=' + encodeURIComponent(plid) : '');
      var tail = onOrderPage
        ? 'အောက်က form ကိုဖြည့်ပြီး ငွေလွှဲ screenshot တင်ပေးပါ။'
        : 'အောက်မှာ Platform ရွေးပြီး QR နဲ့ ငွေလွှဲပါ။ ငွေလွှဲပြီးရင် screenshot ကို <a href="https://www.messenger.com/t/happyyou2020" target="_blank" rel="noopener" style="color:#00d2ff">Page Messenger</a> သို့မဟုတ် <a href="order.html' + esc(safeSearch) + '" style="color:#00d2ff">ဒီ order form</a> ကနေ တင်နိုင်ပါတယ်။';
      // Bookmark / share ထားတဲ့ link ကနေ ဖွင့်ရင် plan က stock ကုန်နေတတ်တယ် —
      // QR နဲ့ ငွေမလွှဲခင် အနီရောင်နဲ့ ကြိုသတိပေးသည်။ order.html မှာတော့
      // order.js က #of-stock-warn ကို ကိုယ်တိုင် ထည့်ပြီးသားမို့ ချန်ထားတယ်
      // (မဟုတ်ရင် အနီစာ ၂ ကြောင်း ထပ်နေမယ်)။
      var oosHtml = (!onOrderPage && plan && plan.stock === false)
        ? '<p style="font-size:0.82rem;color:#ff6b6b;margin:6px 0 0">သတိပြုရန် — ဒီ plan က လောလောဆယ် stock မရှိပါ။ ငွေမလွှဲခင် Admin ကို အရင်မေးပေးပါ။ Order တင်ထားရင် stock ပြန်ရှိချိန် Admin က အကြောင်းပြန်ပါမယ်။</p>'
        : '';
      host.innerHTML = '<h3><i class="fa-solid fa-cart-shopping"></i> Your Order</h3>' +
        '<p>' + esc(product.name) + (plan ? ' — ' + esc(plan.name) + (plan.desc ? ' (' + esc(plan.desc) + ')' : '') : '') + '</p>' +
        (plan && plan.price ? '<p class="os-price">' + esc(plan.price) + '</p>' : '') +
        oosHtml +
        '<p style="font-size:0.85rem;color:rgba(255,255,255,0.65)">' + tail + '</p>';
    });
  }

  /* ---------- FAQ toggles (works with existing markup) ---------- */
  function bindFAQ() {
    document.querySelectorAll('.faq-question').forEach(function (q) {
      // screen reader က ဖွင့်ထား/ပိတ်ထား သိရအောင် (faq.js မှာလည်း တူညီစွာ လုပ်သည်)
      q.setAttribute('aria-expanded', q.classList.contains('active') ? 'true' : 'false');
      q.addEventListener('click', function () {
        q.classList.toggle('active');
        var on = q.classList.contains('active');
        q.setAttribute('aria-expanded', on ? 'true' : 'false');
        var a = q.nextElementSibling;
        if (a) a.style.maxHeight = on ? (a.scrollHeight + 'px') : 0;
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
