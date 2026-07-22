    (function () {
      // defense-in-depth: escape anything we interpolate into innerHTML,
      // even server-generated values (API response shape may change later)
      function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }

      var fileInput = document.getElementById('of-file');
      var fileLabel = document.getElementById('of-file-label');
      var fileText = document.getElementById('of-file-text');
      fileInput.addEventListener('change', function () {
        if (fileInput.files.length) {
          fileText.textContent = fileInput.files[0].name;
          fileLabel.classList.add('has-file');
        }
      });

      // ---- Product-specific extra fields ----
      // Own-mail products: customer email required (upgrade သင့် mail ပေါ်မှာလုပ်ရလို့)
      var MAIL_REQUIRED = ['zoom', 'canva', 'duolingo'];
      // Plan-level own-mail flag: YouTube "Own Mail Invite" plan ids contain
      // 'cus_mail' — set from the ?plan= prefill (plan id ride-along).
      // prefilledValue/prefilledNeedsMail remember the original prefill so the
      // flag survives cosmetic edits and comes back if the user restores it.
      var planNeedsMail = false;
      var prefilledValue = '';
      var prefilledNeedsMail = false;
      // Gemini: gmail + password optional (မဖြည့်ရင် admin ဆက်သွယ်ချိန်ပေးလို့ရ)
      var MAIL_PW_OPTIONAL = ['gemini'];

      var productInput = document.getElementById('of-product');
      var mailField = document.getElementById('of-mail-field');
      var mailInput = document.getElementById('of-mail');
      var mailLabel = document.getElementById('of-mail-label');
      var mailHint = document.getElementById('of-mail-hint');
      var pwField = document.getElementById('of-pw-field');
      var pwInput = document.getElementById('of-pw');
      var pwShow = document.getElementById('of-pw-show');
      if (pwShow) {
        pwShow.addEventListener('change', function () {
          pwInput.type = pwShow.checked ? 'text' : 'password';
        });
      }
      var allProducts = null;
      var currentProductId = '';

      function updateExtraFields() {
        var needMail = MAIL_REQUIRED.indexOf(currentProductId) !== -1 || planNeedsMail;
        var isGemini = MAIL_PW_OPTIONAL.indexOf(currentProductId) !== -1;
        if (needMail) {
          mailField.style.display = '';
          pwField.style.display = 'none';
          pwInput.value = '';
          mailInput.required = true;
          mailLabel.textContent = 'Upgrade လုပ်မည့် သင့် Email *';
          mailHint.textContent = 'ဒီ product က သင့် mail ပေါ်မှာ တင်ပေးရတာမို့ Email ဖြည့်ပေးပါ။';
        } else if (isGemini) {
          mailField.style.display = '';
          pwField.style.display = '';
          mailInput.required = false;
          mailLabel.textContent = 'Gmail (optional)';
          mailHint.textContent = 'Gemini က သင့် Gmail + Password နဲ့ တင်ပေးရပါတယ်။ အခုမဖြည့်ချင်ရင် Admin ဆက်သွယ်လာချိန် ပေးလို့ရပါတယ်။';
        } else {
          mailField.style.display = 'none';
          pwField.style.display = 'none';
          mailInput.required = false;
          mailInput.value = '';
          pwInput.value = '';
        }
      }

      function resolveProductId(text) {
        var t = (text || '').toLowerCase();
        if (!t) return '';
        var best = '', bestLen = 0;
        (allProducts || []).forEach(function (p) {
          var n = (p.name || '').toLowerCase();
          if (n && t.indexOf(n) !== -1 && n.length > bestLen) { best = p.id; bestLen = n.length; }
        });
        if (best) return best;
        if (t.indexOf('canva') !== -1) return 'canva';
        if (t.indexOf('zoom') !== -1) return 'zoom';
        if (t.indexOf('gemini') !== -1) return 'gemini';
        if (t.indexOf('duolingo') !== -1 && t.indexOf('crack') === -1) return 'duolingo';
        return '';
      }

      productInput.addEventListener('input', function () {
        currentProductId = resolveProductId(productInput.value);
        // Only drop the plan flag when the product text genuinely changed from
        // the prefill (trimmed compare) — and restore it if they undo the edit.
        planNeedsMail = (prefilledValue && productInput.value.trim() === prefilledValue)
          ? prefilledNeedsMail : false;
        updateExtraFields();
      });

      // Load products.json (prefill from ?product=xxx&plan=yyy + name matching အတွက်)
      var q = new URLSearchParams(location.search);
      fetch('products.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
        allProducts = d.products || [];
        var pid = q.get('product');
        if (pid) {
          var p = allProducts.find(function (x) { return x.id === pid; });
          if (!p) return;
          var plan = (p.plans || []).find(function (x) { return x.id === q.get('plan'); });
          productInput.value = p.name + (plan
            ? ' — ' + plan.name + (plan.desc ? ' · ' + plan.desc : '') + (plan.price ? ' (' + plan.price + ')' : '')
            : '');
          currentProductId = p.id;
          planNeedsMail = !!(plan && String(plan.id).indexOf('cus_mail') !== -1);
          prefilledValue = productInput.value.trim();
          prefilledNeedsMail = planNeedsMail;
          // Prefilled plan is out of stock -> warn visibly (textContent, no
          // innerHTML) but keep the form usable — admin reviews manual orders.
          if (plan && plan.stock === false && !document.getElementById('of-stock-warn')) {
            var warn = document.createElement('p');
            warn.id = 'of-stock-warn';
            warn.style.cssText = 'font-size:0.78rem;color:#ff6b6b;margin:6px 0 0';
            warn.textContent = 'သတိပြုရန် — ဒီ plan က လောလောဆယ် stock မရှိပါ။ Order တင်ထားရင် stock ပြန်ရှိချိန် Admin က အကြောင်းပြန်ပါမယ်။';
            productInput.parentNode.appendChild(warn);
          }
          updateExtraFields();
        } else if (productInput.value) {
          currentProductId = resolveProductId(productInput.value);
          updateExtraFields();
        }
      }).catch(function () {});

      document.getElementById('orderForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('of-submit');
        var result = document.getElementById('of-result');
        var f = fileInput.files[0];
        if (f && f.size > 8 * 1024 * 1024) {
          result.className = 'of-result err';
          result.textContent = 'Screenshot ဖိုင်က 8MB ထက်ကြီးနေပါတယ်။ ပိုသေးတဲ့ပုံပြန်ရွေးပေးပါ။';
          return;
        }
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ပို့နေသည်…';
        result.className = 'of-result';

        var fd = new FormData(e.target);
        fetch('/api/order', { method: 'POST', body: fd })
          .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (res.ok && res.j.ok) {
              // only allow an https link from the server; anything else -> '#'
              var fbLink = /^https:\/\//.test(res.j.fbLink) ? res.j.fbLink : '#';
              result.className = 'of-result ok';
              result.innerHTML =
                '<strong><i class="fa-solid fa-circle-check"></i> Order တင်ပြီးပါပြီ!</strong><br/>' +
                'Order ID: <strong>' + esc(res.j.orderId) + '</strong><br/>' +
                'Admin က သင်ပေးထားတဲ့ Contact (Viber / Telegram) အတိုင်း မကြာခင် ပြန်ဆက်သွယ်ပါမယ်။<br/>' +
                'Facebook နဲ့လည်း ဆက်သွယ်နိုင်ပါတယ် — အောက်ကခလုတ်နှိပ်ပြီး Order ID ကို ပို့ထားပါ:<br/>' +
                '<a class="of-fb-btn" target="_blank" rel="noopener" href="' + esc(fbLink) + '"><i class="fa-brands fa-facebook-messenger"></i> Facebook Page ကို စာပို့မယ်</a>';
              e.target.reset();
              fileText.textContent = 'Screenshot ရွေးရန် နှိပ်ပါ';
              fileLabel.classList.remove('has-file');
            } else {
              throw new Error(res.j.error || 'failed');
            }
          })
          .catch(function () {
            result.className = 'of-result err';
            result.innerHTML = 'Order ပို့မရသေးပါ။ Internet ပြန်စစ်ပြီး ထပ်ကြိုးစားပါ (သို့) Telegram Bot <a href="https://t.me/PSNamso_bot" style="color:#00d2ff">@PSNamso_bot</a> ကနေ ဝယ်ယူနိုင်ပါတယ်။';
          })
          .finally(function () {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Order တင်မယ်';
          });
      });
    })();
