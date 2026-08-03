/* faq.js — FAQ content ကို /data/faq.json (panel-managed, live-served) ကနေ
   render လုပ်တယ်။ fetch မအောင်မြင်ရင် page ထဲ hardcode ထားတဲ့ static FAQ
   အတိုင်း ကျန်တယ် (progressive enhancement — UI/markup အတိအကျတူ)။
   Toggle logic သည် app.js bindFAQ() နဲ့ တစ်ထပ်တည်း။ */
(function () {
  'use strict';

  /* panel ကနေ ရေးလို့ရတဲ့ HTML ကို allowlist နဲ့ သန့်စင်တယ်။ panel session (သို့)
     data-scoped GITHUB_PAT တစ်ခုခု ပေါက်သွားရင်တောင် site ထဲ script / onclick /
     javascript: link / page ဖုံးအုပ်တဲ့ style မဝင်နိုင်စေရ (repo access မလိုဘဲ
     ဝယ်သူတွေဆီ ပိုက်ဆံလွှဲပြောင်း လိမ်စာ ထည့်လို့ရတဲ့ လမ်းကြောင်း ပိတ်သည်)။ */
  var OK_TAGS = {
    A: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, BR: 1, P: 1, UL: 1, OL: 1, LI: 1,
    SPAN: 1, SMALL: 1, DIV: 1, CODE: 1,
    // panel FAQ editor က HTML အလွတ်လပ် ရိုက်လို့ရတယ် — heading / ခွဲမျဉ်း တွေက
    // ဘေးမဲ့ဖြစ်ပြီး သဘာဝကျလို့ ခွင့်ပြုသည် (မပါရင် တိတ်တဆိတ် ပျောက်သွားမယ်)။
    H3: 1, H4: 1, H5: 1, HR: 1
  };
  var DROP_TAGS = { SCRIPT: 1, STYLE: 1, IFRAME: 1, OBJECT: 1, EMBED: 1, TEMPLATE: 1, LINK: 1, META: 1 };
  // live FAQ content က class (faq-link / telegram-post-link) နဲ့ heading အရောင်
  // style ကို သုံးထားလို့ အဲ့ ၂ ခုကို ကျဉ်းကျဉ်း pattern နဲ့ ခွင့်ပြုသည် —
  // position/background/url() လို ဖုံးအုပ်နိုင်တဲ့ style တွေ လုံးဝ မဝင်နိုင်။
  var SAFE_CLASS = /^[\w\- ]{1,80}$/;
  var SAFE_STYLE = /^\s*color\s*:\s*(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)\s*;?\s*$/i;
  // panel-entered FAQ content still carries dark-theme inline heading colors
  // (cyan/mint/red picked for the dark canvas — near-invisible on light).
  // Known hexes are rewritten to the accent CLASSES, which have per-theme
  // definitions (components.css dark / theme.css light). Unknown colors keep
  // the old pass-through behavior.
  var COLOR_TO_CLASS = {
    '#00d2ff': 'faq-accent-blue', '#0ba2ff': 'faq-accent-blue',
    '#453dd8': 'faq-accent-blue', '#a29bfe': 'faq-accent-blue',
    '#2ed573': 'faq-accent-green', '#69f6a4': 'faq-accent-green',
    '#ff6b6b': 'faq-accent-red', '#dd3c4c': 'faq-accent-red',
    '#ff4757': 'faq-accent-red'
  };

  function safeHref(v) {
    var raw = String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, '').trim();
    if (!raw) return '';
    var proto;
    try { proto = new URL(raw, location.href).protocol; } catch (e) { return ''; }
    // http ကို ခွင့်ပြုရသည် — live FAQ ထဲမှာ Office ISO download link က http ပါ
    return (proto === 'https:' || proto === 'http:' || proto === 'mailto:' || proto === 'tel:') ? raw : '';
  }

  function scrub(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) return;                       // text node — safe
      if (n.nodeType !== 1 || DROP_TAGS[n.tagName]) { n.parentNode.removeChild(n); return; }
      if (!OK_TAGS[n.tagName]) {                          // unknown tag -> keep text only
        // admin က panel ကနေ ခွင့်မပြုထားတဲ့ tag ထည့်မိရင် တိတ်တဆိတ် ပျောက်တာမို့
        // console မှာ တစ်ကြောင်း ချန်ခဲ့ — ဘာပျောက်သွားလဲ ရှာလို့ရအောင်။
        if (window.console && console.warn) console.warn('faq: dropped <' + n.tagName + '>');
        n.parentNode.replaceChild(document.createTextNode(n.textContent || ''), n);
        return;
      }
      scrub(n);
      var href = n.tagName === 'A' ? safeHref(n.getAttribute('href')) : '';
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var keep = (a.name === 'class' && SAFE_CLASS.test(a.value)) ||
          (a.name === 'style' && SAFE_STYLE.test(a.value));
        if (!keep) n.removeAttribute(a.name);
      });
      // known dark-palette inline color -> theme-aware accent class
      var st = n.getAttribute && n.getAttribute('style');
      if (st) {
        var hex = (st.match(/#[0-9a-f]{3,8}/i) || [''])[0].toLowerCase();
        var cls = COLOR_TO_CLASS[hex];
        if (cls) {
          n.removeAttribute('style');
          if ((' ' + n.className + ' ').indexOf(' ' + cls + ' ') === -1) {
            n.className = (n.className ? n.className + ' ' : '') + cls;
          }
        }
      }
      if (n.tagName === 'A' && href) {
        n.setAttribute('href', href);
        n.setAttribute('target', '_blank');
        n.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  // string ကို inert template ထဲ parse (script မလည်၊ image မဆွဲ) → သန့်စင် →
  // node အဖြစ် ထည့်
  function setSafeHTML(host, html) {
    var tpl = document.createElement('template');
    tpl.innerHTML = String(html == null ? '' : html);
    scrub(tpl.content);
    host.appendChild(tpl.content);
  }

  var wrap = document.querySelector('.faq-container');
  if (!wrap) return;
  var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (!page) return;

  fetch('/data/faq.json')
    .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function (all) {
      var d = all && all[page];
      if (!d || !Array.isArray(d.items) || !d.items.length) return;

      var frag = document.createDocumentFragment();
      var h2 = document.createElement('h2');
      h2.className = 'faq-title';
      h2.textContent = d.title || 'မေးလေ့ရှိသည့် မေးခွန်းများ';
      frag.appendChild(h2);

      d.items.forEach(function (it) {
        // ၂ ခုလုံး လွတ်နေတဲ့ item (panel save လွဲတာမျိုး) ကို ကျော်သည် —
        // 'undefined' ဆိုတဲ့ စာလုံး ပေါ်မလာစေရ
        if (!it || (!it.q && !it.a_html)) return;
        var item = document.createElement('div');
        item.className = 'faq-item';
        var btn = document.createElement('button');
        btn.className = 'faq-question';
        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        // မေးခွန်းက HTML ဖြစ်ဖို့ အကြောင်းမရှိ — textContent နဲ့ပဲ ထည့်ပြီး
        // chevron icon ကို element အနေနဲ့ တွဲသည်
        var qText = document.createElement('span');
        qText.textContent = String(it.q || '');
        var chev = document.createElement('i');
        chev.className = 'fa-solid fa-chevron-down';
        btn.appendChild(qText);
        btn.appendChild(chev);
        var ans = document.createElement('div');
        ans.className = 'faq-answer';
        setSafeHTML(ans, it.a_html || '');
        btn.addEventListener('click', function () {
          btn.classList.toggle('active');
          var on = btn.classList.contains('active');
          btn.setAttribute('aria-expanded', on ? 'true' : 'false');
          ans.style.maxHeight = on ? (ans.scrollHeight + 'px') : 0;
        });
        item.appendChild(btn);
        item.appendChild(ans);
        frag.appendChild(item);
      });

      wrap.innerHTML = '';
      wrap.appendChild(frag);
    })
    .catch(function () { /* static fallback markup stays */ });
})();
