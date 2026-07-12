/* faq.js — FAQ content ကို /data/faq.json (panel-managed, live-served) ကနေ
   render လုပ်တယ်။ fetch မအောင်မြင်ရင် page ထဲ hardcode ထားတဲ့ static FAQ
   အတိုင်း ကျန်တယ် (progressive enhancement — UI/markup အတိအကျတူ)။
   Toggle logic သည် app.js bindFAQ() နဲ့ တစ်ထပ်တည်း။ */
(function () {
  'use strict';

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
        var item = document.createElement('div');
        item.className = 'faq-item';
        var btn = document.createElement('button');
        btn.className = 'faq-question';
        btn.innerHTML = it.q + ' <i class="fa-solid fa-chevron-down"></i>';
        var ans = document.createElement('div');
        ans.className = 'faq-answer';
        ans.innerHTML = it.a_html;
        btn.addEventListener('click', function () {
          btn.classList.toggle('active');
          ans.style.maxHeight = btn.classList.contains('active')
            ? (ans.scrollHeight + 'px') : 0;
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
