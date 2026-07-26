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
      var FILE_IDLE_TEXT = 'Screenshot ရွေးရန် နှိပ်ပါ';
      function resetFileLabel() {
        fileText.textContent = FILE_IDLE_TEXT;
        fileLabel.classList.remove('has-file');
      }
      fileInput.addEventListener('change', function () {
        if (fileInput.files.length) {
          fileText.textContent = fileInput.files[0].name;
          fileLabel.classList.add('has-file');
        } else {
          // ရွေးထားတဲ့ပုံကို ပြန်ဖျက်လိုက်ရင် ဖိုင်နာမည်ဟောင်း ကျန်မနေစေရ
          resetFileLabel();
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
      var prefilledProductId = '';
      var prefilledPlanId = '';
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
      var prodIdInput = document.getElementById('of-product-id');
      var planIdInput = document.getElementById('of-plan-id');

      // Gemini 18-month plan က single-use activation link (auto delivery) —
      // customer ရဲ့ Gmail/password လုံးဝ မလိုဘူး။ ဒါကြောင့် product id တင်
      // မဟုတ်ဘဲ plan level ကိုပါ စစ်တယ် (မလိုတဲ့ Google password တောင်းမိတာ
      // မဖြစ်စေရ)။ plan id မရှိရင် ရိုက်ထားတဲ့ စာသားကနေ ခန့်မှန်းသည်။
      function geminiNeedsPw() {
        var plid = (planIdInput && planIdInput.value) || '';
        if (plid) return plid !== '18_months';
        var t = (productInput.value || '').toLowerCase();
        return t.indexOf('18 month') === -1 && t.indexOf('link') === -1;
      }

      function updateExtraFields() {
        var needMail = MAIL_REQUIRED.indexOf(currentProductId) !== -1 || planNeedsMail;
        var isGemini = MAIL_PW_OPTIONAL.indexOf(currentProductId) !== -1 && geminiNeedsPw();
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

      function clearStockWarn() {
        var w = document.getElementById('of-stock-warn');
        if (w) w.remove();
      }

      productInput.addEventListener('input', function () {
        currentProductId = resolveProductId(productInput.value);
        // Only keep the prefill-bound ids/flag while the text still matches the
        // prefill (trimmed) — a genuine edit means "different product", so the
        // hidden ids must not keep pointing at the old plan.
        var stillPrefill = prefilledValue && productInput.value.trim() === prefilledValue;
        planNeedsMail = stillPrefill ? prefilledNeedsMail : false;
        if (!stillPrefill) {
          if (prodIdInput) prodIdInput.value = '';
          if (planIdInput) planIdInput.value = '';
          clearStockWarn();  // OOS warning belonged to the prefilled plan
        } else {
          // restore the EXACT prefill ids (not a re-resolved guess)
          if (prodIdInput) prodIdInput.value = prefilledProductId;
          if (planIdInput) planIdInput.value = prefilledPlanId;
        }
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
          // carry the resolved ids for server-side stock validation
          prefilledProductId = p.id;
          prefilledPlanId = plan ? plan.id : '';
          if (prodIdInput) prodIdInput.value = prefilledProductId;
          if (planIdInput) planIdInput.value = prefilledPlanId;
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
        // Screenshot မရွေးဘဲ တင်လိုက်ရင် (browser required check မရှိတဲ့အခါ)
        // ဘာမှမဖြစ်ဘဲ ငြိမ်နေတာ မဖြစ်စေရ — အထက်က 8MB check အတိုင်း အမြင်ရှိတဲ့
        // error ပြသည်။
        if (!f) {
          result.className = 'of-result err';
          result.textContent = 'ငွေလွှဲ Screenshot ရွေးပေးပါဦး — အပေါ်က "' + FILE_IDLE_TEXT + '" ကိုနှိပ်ပြီး ပုံရွေးပါ။';
          resetFileLabel();
          return;
        }
        if (f.size > 8 * 1024 * 1024) {
          result.className = 'of-result err';
          result.textContent = 'Screenshot ဖိုင်က 8MB ထက်ကြီးနေပါတယ်။ ပိုသေးတဲ့ပုံပြန်ရွေးပေးပါ။';
          return;
        }
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ပို့နေသည်…';
        result.className = 'of-result';

        var fd = new FormData(e.target);
        // mobile data ရပ်သွားရင် spinner ထာဝရ မလည်စေရ — အချိန်ကျော်ရင် ဖြတ်တယ်။
        // 3 မိနစ်ထားရတဲ့အကြောင်းရင်း: ဒါက screenshot (8MB အထိ) ပါတဲ့ multipart
        // upload ဖြစ်ပြီး မြန်မာ mobile data မှာ 1MB တင်ဖို့ကို 40s+ ကြာနိုင်တယ်။
        // အချိန်တိုထားရင် ငွေလွှဲပြီးသား order တွေ အလကား ပျက်ကုန်မယ်။
        var ctl = new AbortController();
        var timer = setTimeout(function () { ctl.abort(); }, 180000);
        fetch('/api/order', { method: 'POST', body: fd, signal: ctl.signal })
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
              resetFileLabel();
              // reset() blanks the fields but not our derived state — reconcile
              // so a cleared form can't keep showing a required email / warning
              planNeedsMail = false;
              currentProductId = '';
              prefilledValue = '';
              prefilledProductId = '';
              prefilledPlanId = '';
              if (prodIdInput) prodIdInput.value = '';
              if (planIdInput) planIdInput.value = '';
              clearStockWarn();
              updateExtraFields();
            } else {
              throw new Error(res.j.error || 'failed');
            }
          })
          .catch(function (err) {
            // server ပြန်ပေးတဲ့ အကြောင်းရင်းအတိုင်း လမ်းညွှန်ပေးတယ် — အကုန်လုံးကို
            // "internet မကောင်းလို့" လို့ ပြောလိုက်ရင် ငွေလွှဲပြီးသား customer က
            // ဖိုင်တစ်ခုတည်းကို ထပ်ခါထပ်ခါ တင်ပြီး order ပျောက်သွားတယ်။
            var msg = String((err && err.message) || '');
            var name = String((err && err.name) || '');
            // ဘယ် error မှာမဆို အရန်လမ်းကြောင်း ၂ ခု ပြထားပေးသည်
            var fallback = ' (သို့) Telegram Bot <a href="https://t.me/PSNamso_bot" target="_blank" rel="noopener" style="color:#00d2ff">@PSNamso_bot</a> ' +
              '(သို့) <a href="https://www.messenger.com/t/happyyou2020" target="_blank" rel="noopener" style="color:#00d2ff">Page Messenger</a> ကနေ ဆက်သွယ်နိုင်ပါတယ်။';
            var html;
            if (name === 'AbortError') {
              // abort က browser ဘက်ကပဲ ရပ်တာ — server ဘက်မှာ order က
              // ရောက်ပြီးသား ဖြစ်နေနိုင်တယ်။ "ထပ်နှိပ်ပါ" လို့ ပြောလိုက်ရင်
              // order ၂ ခု ဖြစ်သွားနိုင်လို့ အရင် စစ်ခိုင်းတယ်။
              html = 'Order ပို့တာ အချိန်ကြာနေလို့ ရပ်လိုက်ပါတယ်။ <strong>Order က ရောက်နှင့်ပြီး ဖြစ်နေနိုင်ပါတယ်</strong> — ထပ်မတင်ခင် အောက်က လမ်းကြောင်းတစ်ခုကနေ Admin ကို အရင် စစ်ပေးပါ။' + fallback;
            } else if (msg.indexOf('Unsupported image type') !== -1) {
              html = 'ဒီ screenshot ဖိုင်အမျိုးအစားကို လက်မခံပါ။ ပုံကို <strong>JPG / PNG</strong> အနေနဲ့ ပြန်သိမ်းပြီး (iPhone ဆိုရင် screenshot ကို Photos ထဲကနေ share → save အသစ်လုပ်ပြီး) ထပ်တင်ပေးပါ။';
            } else if (msg.indexOf('File too large') !== -1) {
              html = 'Screenshot ဖိုင်က ကြီးလွန်းနေပါတယ် (8MB အထိသာ ရပါတယ်)။ ပိုသေးတဲ့ပုံ ပြန်ရွေးပေးပါ။';
            } else if (msg.indexOf('Screenshot required') !== -1) {
              html = 'ငွေလွှဲ Screenshot ပါမလာပါ — ပုံပြန်ရွေးပြီး ထပ်တင်ပေးပါ။';
            } else if (msg.indexOf('Missing fields') !== -1) {
              html = 'လိုအပ်တဲ့ အချက်အလက် မပြည့်စုံသေးပါ — * ပါတဲ့ အကွက်အားလုံး ဖြည့်ပေးပါ။';
            } else if (msg.indexOf('Delivery failed') !== -1) {
              html = 'Order က Admin ဆီ မရောက်သေးပါ။ ခဏနေ ထပ်ကြိုးစားပါ' + fallback;
            } else {
              html = 'Order ပို့မရသေးပါ။ Internet ပြန်စစ်ပြီး ထပ်ကြိုးစားပါ' + fallback;
            }
            result.className = 'of-result err';
            result.innerHTML = html;
          })
          .finally(function () {
            clearTimeout(timer);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Order တင်မယ်';
          });
      });
    })();
