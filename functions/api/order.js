/**
 * Cloudflare Pages Function: POST /api/order
 * Web order (Telegram မသုံးသူများအတွက်) ကို admin အားလုံး + sale group ဆီ
 * forward လုပ်ပေးသည်။
 *
 * Setup (Cloudflare Dashboard → Pages project → Settings → Environment variables):
 *   BOT_TOKEN      = Telegram bot token (BotFather ကရတဲ့ token — sale bot token ကိုပဲသုံးလို့ရသည်)
 *   ADMIN_CHAT_ID  = admin chat id — comma/space ခြားပြီး တစ်ခုထက်ပို ထည့်လို့ရသည်
 *   ADMIN_IDS      = (optional) ထပ်ဖြည့် admin id များ — sale bot ရဲ့ နာမည်နဲ့ တူအောင်
 *   SALE_GROUP_ID  = (optional) sale group / channel id (ဥပမာ -1001234567890)
 *   FB_PAGE_LINK   = https://m.me/YourPageUsername   (optional)
 *
 * ⚠️ ဒီ ၃ ခုလုံးက စာရင်းအဖြစ် ပေါင်းပြီး dedup လုပ်တယ်။ တစ်ခုမှ မထည့်ရင်
 * (ADMIN_CHAT_ID တစ်ခုတည်း ရှိရင်) အရင်အတိုင်းပဲ အလုပ်လုပ်သည်။
 */

const MAX_FILE = 8 * 1024 * 1024; // 8MB
// Whole-body cap — Content-Length ကို formData() မခေါ်ခင် စစ်လို့ ကြီးလွန်းတဲ့
// body ကို buffer + parse လုပ်ပြီးမှ ငြင်းရတာ မဖြစ်တော့ဘူး (multipart boundary /
// field overhead အတွက် MAX_FILE ထက် အနည်းငယ် ပိုပေးထားသည်)။
const MAX_BODY = 10 * 1024 * 1024; // 10MB
// Telegram sendPhoto ဆီ ပို့လို့ရတဲ့ format များ။ ဒါက ငွေလွှဲပြီးမှ ရောက်တဲ့
// form ဖြစ်လို့ စာရင်းကို ကျယ်ကျယ်ထားတယ် — iPhone/Android က screenshot ကို
// Files ကနေ ပြန် share ရင် heic/heif/avif ထွက်တတ်ပြီး၊ အရင်က အဲ့ဒါတွေကို
// ငြင်းလိုက်လို့ ငွေပေးပြီးသား order တွေ ဒီနေရာမှာတင် ပျက်ကုန်တယ်။
const ALLOWED_IMAGE = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/heif', 'image/avif', 'image/gif', 'image/bmp',
];
// Browser form ကနေပဲ POST လာရမယ်။ Origin header မပါတဲ့ client တွေကို မပိတ်ဘူး —
// ပါပြီး ကိုယ့် site မဟုတ်မှသာ ငြင်းတယ် (preview deploy အတွက် request ကိုယ်ပိုင်
// origin ကိုပါ လက်ခံသည်)။
const ALLOWED_ORIGINS = ['https://pstorebynamso.com', 'https://www.pstorebynamso.com'];
// FB fallback link — honeypot false positive နဲ့ success path ၂ ခုလုံးက သုံးတယ်
const FB_DEFAULT = 'https://www.facebook.com/share/1C7LUKTbdt/?mibextid=wwXIfr';

// Data packs cannot be fulfilled without the SIM the data is loaded onto, so
// the phone number is required for these and only these. This is the server
// side of the rule; the client copy is PHONE_REQUIRED_PRODUCTS in
// src/components/order/OrderForm.tsx. Both are checked because product_id is
// only posted when the customer arrived from a plan link — someone who types
// the product name by hand posts an empty product_id, so the free-text field is
// matched too. The two brands are the only telecom names in the catalog, and a
// false match can only ever ADD the requirement, never skip it.
const PHONE_REQUIRED_PRODUCT_IDS = ['atom-data', 'mytel-data'];
const PHONE_REQUIRED_TEXT = /\b(atom|mytel)\b/i;
// Same shape as MM_PHONE_PATTERN in OrderForm.tsx. The client `pattern` is a
// convenience, not a validation, and this column is read by a human as the
// number to top up — a typo is worth rejecting at the door.
const PHONE_SHAPE = /^09\d{7,9}$/;

const VIBER_PHONE = /^(?:09[0-9]{7,9}|[+]95[0-9]{7,10})$/;
const PROFILE_PRODUCTS = ['netflix_tv', 'netflix_phone', 'hbomax', 'prime'];
const MAIL_PRODUCTS = ['zoom', 'zoom_business', 'canva', 'duolingo'];

// same source the /products.json proxy serves from — the live catalog
const PRODUCTS_RAW_URL =
  'https://raw.githubusercontent.com/Namso9/pstorebynamso/main/products.json';

/**
 * Look up a plan's live stock by product_id + plan_id.
 * Returns { found, inStock, label } — best-effort: if the catalog can't be
 * fetched or the ids don't resolve, found=false and the order proceeds
 * unflagged (never block a real customer on a transient fetch failure).
 */
async function checkPlanStock(productId, planId) {
  if (!productId || !planId) return { found: false };
  try {
    // Hard time-bound the subrequest: a stalled GitHub connection must never
    // hang the customer's order. On timeout -> fail open (found:false).
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 3000);
    let r;
    try {
      r = await fetch(PRODUCTS_RAW_URL, { cf: { cacheTtl: 60, cacheEverything: true }, signal: ctl.signal });
    } finally {
      clearTimeout(timer);
    }
    if (!r.ok) return { found: false };
    const data = JSON.parse(await r.text());
    const prod = (data.products || []).find((p) => p.id === productId);
    if (!prod) return { found: false };
    const plan = (prod.plans || []).find((p) => String(p.id) === String(planId));
    if (!plan) return { found: false };
    return {
      found: true,
      inStock: plan.stock !== false,
      label: `${prod.name} — ${plan.name}${plan.desc ? ' · ' + plan.desc : ''}`,
    };
  } catch (e) {
    return { found: false };
  }
}

/**
 * Optional panel mirror (tracking): set BOTH env vars to enable —
 *   PANEL_INGEST_URL   = https://admin.pstorebynamso.com/internal/web-order
 *   PANEL_INGEST_TOKEN = (WEB_ORDER_TOKEN from the panel .env)
 * plus a Cloudflare Access bypass/service-token policy for that exact path.
 * After primary delivery, mirror with a bounded timeout to get the panel row ID.
 * Password/screenshot are NOT mirrored — Telegram keeps the only copy.
 *
 * product_id / plan_id ride along so the panel can answer "ဘယ် plan/product
 * အဝယ်များလဲ" without parsing the free-text `product` line. Both are CATALOG
 * ids the form already collected as hidden fields, already clean()ed to 60
 * chars — they say what was bought, never who bought it, so they change
 * nothing about what customer data reaches the panel.
 */
async function mirrorToPanel(env, data) {
  if (!env.PANEL_INGEST_URL || !env.PANEL_INGEST_TOKEN) return;
  // Only token-backed inserts are idempotent across a lost response.
  const attempts = data.telegram_link_hash ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(env.PANEL_INGEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Token': env.PANEL_INGEST_TOKEN,
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(5000),
      });
      if (response.status < 500) {
        const row = await response.json();
        if (response.ok && row.ok && Number.isSafeInteger(row.id) && row.id > 0) return row.id;
        break;
      }
    } catch {
      // The screenshot is already in Telegram.
    }
  }
  console.warn('Web order mirror unavailable', data.order_ref);
}

function decisionKeyboard(id, ref, sender) {
  const buttons = ['Approve', 'Decline'].map((text) => {
    const payload = `web_${text.toLowerCase()}_${id}_${ref}`;
    return sender?.toLowerCase() === 'psnamso_bot'
      ? { text, callback_data: payload }
      : { text, url: `https://t.me/PSNamso_bot?start=${payload}` };
  });
  return { inline_keyboard: [buttons] };
}

/**
 * Notify targets: ADMIN_CHAT_ID + ADMIN_IDS + SALE_GROUP_ID ကို တစ်စာရင်းတည်း
 * ပေါင်းပေးသည်။ comma / semicolon / whitespace နဲ့ ခွဲထားလို့ရတယ်။
 * တန်ဖိုးကို format မစစ်ဘူး — အခု live မှာရှိပြီးသား ADMIN_CHAT_ID တစ်ခုတည်းက
 * separator မပါလို့ ဒီအတိုင်း အပြောင်းအလဲမရှိ ဖြတ်သွားရမယ် (backward compatible)။
 * ပထမ target က primary — အဲ့ဒါက screenshot ကို တကယ် upload လုပ်တဲ့ ခေါင်းစဉ်။
 */
function notifyTargets(env) {
  const out = [];
  const seen = Object.create(null);
  for (const raw of [env.ADMIN_CHAT_ID, env.ADMIN_IDS, env.SALE_GROUP_ID]) {
    for (const part of String(raw || '').split(/[\s,;]+/)) {
      const id = part.trim();
      if (!id || seen[id]) continue;
      seen[id] = true;
      out.push(id);
    }
  }
  return out;
}

/**
 * Telegram sendPhoto response ထဲက အကြီးဆုံး PhotoSize ရဲ့ file_id။
 * ဒါရှိရင် ကျန် chat တွေဆီ ပုံကို ပြန် upload မလုပ်တော့ဘဲ id နဲ့ပဲ ပို့လို့ရတယ် —
 * 8MB ကို admin အရေအတွက်အလိုက် ထပ်တင်စရာ မလိုတော့ဘူး။
 */
function photoFileId(data) {
  const sizes = (data && data.result && data.result.photo) || [];
  const last = sizes[sizes.length - 1];
  return last && last.file_id ? last.file_id : '';
}

/**
 * ကျန် target များဆီ file_id နဲ့ fan-out. **AWAITED**, `waitUntil` မဟုတ်။
 *
 * အရင်က `waitUntil` ဖြစ်ခဲ့တယ် — customer စောင့်ချိန် မတိုးစေရဖို့။ ဒါပေမဲ့
 * fan-out မရောက်တဲ့အခါ (2026-09-04) `waitUntil` က တိတ်တဆိတ်လား၊ env
 * အဟောင်းလားကို အပြင်ကနေ ခွဲလို့ မရဘူး — fire-and-forget က မဖြေရှင်းနိုင်တဲ့
 * အမှားမျိုး ဖြစ်စေတယ်။ file_id နဲ့ ပို့တာက ပုံ upload မလိုတော့လို့ ~300ms
 * ပဲ ကုန်တာမို့ await လုပ်တာ ပိုသင့်တယ်၊ ပြီးတော့ ရလဒ်ကို ရေတွက်လို့ရတယ်။
 *
 * ကျရင်လည်း order ကို ဘယ်တော့မှ မပျက်စေရ (ငွေလွှဲပြီးသား) — error ကို
 * log ထဲ ထည့်ရုံပဲ။ Telegram တစ်ခု ဆွဲနေရင် customer ကို မထိစေဖို့ တစ်ခုချင်း
 * 5s AbortController နဲ့ ချုပ်ထားတယ်။
 * primary ရှာရင်း ကျသွားခဲ့တဲ့ id ကိုလည်း ဒီမှာ ထပ်ကြိုးစားတယ် — ခဏတာ
 * အမှား (rate limit / timeout) ဆိုရင် ဒုတိယအကြိမ်မှာ ရောက်သွားနိုင်လို့။
 */
async function fanOutToRest(env, targets, caption, fileId, shot, keyboard) {
  if (!targets.length) return { sent: 0, failed: 0 };
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`;
  const results = await Promise.allSettled(
    targets.map(async (chatId) => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 5000);
      try {
        let resp;
        if (fileId) {
          resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, caption, photo: fileId, reply_markup: keyboard }),
            signal: ctl.signal,
          });
        } else {
          // file_id မရခဲ့ရင်သာ ပုံကို ပြန်တင်တယ် (မဖြစ်သင့်တဲ့ လမ်းကြောင်း)။
          const tg = new FormData();
          tg.append('chat_id', chatId);
          tg.append('caption', caption);
          if (keyboard) tg.append('reply_markup', JSON.stringify(keyboard));
          tg.append('photo', shot, 'payment-screenshot.jpg');
          resp = await fetch(url, { method: 'POST', body: tg, signal: ctl.signal });
        }
        const data = await resp.json();
        if (!data.ok) {
          console.error('Telegram fan-out error:', chatId, JSON.stringify(data));
          throw new Error('not ok');
        }
      } finally {
        clearTimeout(timer);
      }
    })
  );
  const failed = results.filter((r) => r.status === 'rejected').length;
  return { sent: results.length - failed, failed };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const targets = notifyTargets(env);
    if (!env.BOT_TOKEN || targets.length === 0) {
      return json({ ok: false, error: 'Server not configured' }, 500);
    }

    // Cross-origin POST guard — form က ကိုယ့် page ကနေပဲ တင်တာ။
    // 'null' က sandboxed iframe / privacy mode / in-app webview တွေ ပို့တဲ့
    // တန်ဖိုး — header မပါတာနဲ့ တူတူ သဘောထားတယ်၊ မဟုတ်ရင် ငွေလွှဲပြီးသား
    // customer တစ်ယောက် ဘာကြောင့်မှန်း မသိဘဲ 403 မိသွားမယ်။
    const origin = request.headers.get('Origin');
    if (origin && origin !== 'null' &&
        ALLOWED_ORIGINS.indexOf(origin) === -1 &&
        origin !== new URL(request.url).origin) {
      return json({ ok: false, error: 'Forbidden origin' }, 403);
    }

    // Size cap BEFORE formData() — oversized body ကို parse တောင် မလုပ်ဘူး။
    const declared = Number(request.headers.get('Content-Length') || 0);
    if (declared > MAX_BODY) {
      return json({ ok: false, error: 'File too large' }, 413);
    }

    const form = await request.formData();

    // honeypot — bots fill hidden fields. နာမည်က 'extra_field_hp'; အရင်က
    // 'website' လို့ ခေါ်ခဲ့တာကို ဖြုတ်လိုက်ပြီ — autofill / password manager
    // တွေက 'website' ဆိုတဲ့ semantic နာမည်ကို ဖြည့်မိလို့ ငွေလွှဲပြီးသား
    // တကယ့် order တွေ တိတ်တဆိတ် ကျသွားနိုင်တယ်။ False positive ဖြစ်သွားရင်လည်း
    // customer က traceable ဖြစ်တဲ့ ပုံမှန် order id မြင်ရအောင် စစ်စစ် format
    // အတိုင်း ပြန်ပေးတယ် ('OK' ဆိုတဲ့ id က ဘာမှ ရှာလို့မရ)။
    if (form.get('extra_field_hp')) {
      // false positive က တိတ်တဆိတ် ဖြစ်တာမို့ Pages log ထဲ မှတ်ခဲ့တယ် —
      // ငွေလွှဲပြီးသား customer တစ်ယောက် "ရပြီ" ဆိုတဲ့ id ရပြီး order က
      // ဘယ်တော့မှ မရောက်ဘူးဆိုရင် ဒီ log ကပဲ တစ်ခုတည်းသော သဲလွန်စ။
      console.warn('Web order honeypot hit');
      return json({ ok: true, orderId: newOrderId(), fbLink: env.FB_PAGE_LINK || FB_DEFAULT });
    }

    const name = clean(form.get('name'), 60);
    const product = clean(form.get('product'), 120);
    const payment = clean(form.get('payment'), 30);
    const contactMethod = clean(form.get('contact_method'), 16);
    const telegram = contactMethod === 'telegram';
    const contact = telegram ? '' : clean(form.get('contact'), 40);
    const profileName = clean(form.get('profile_name'), 60);
    const devices = clean(form.get('devices'), 100);
    const customerMail = clean(form.get('customer_mail'), 120);
    const customerPw = clean(form.get('customer_pw'), 100);
    const note = clean(form.get('note'), 300);
    const phone = clean(form.get('phone'), 20);
    const productId = clean(form.get('product_id'), 60);
    // Gemini is paused, including stale forms and old plan URLs.
    if (productId === 'gemini') return json({ ok: false, error: 'Gemini is out of stock. No plans are currently available.' }, 409);
    const planId = clean(form.get('plan_id'), 60);
    const shot = form.get('screenshot');

    if (contactMethod && !['telegram', 'viber'].includes(contactMethod)) {
      return json({ ok: false, error: 'Invalid contact method' }, 400);
    }
    if (contactMethod === 'viber' && !VIBER_PHONE.test(contact)) {
      return json({ ok: false, error: 'Invalid Viber number' }, 400);
    }
    if (!product || !payment || (!contactMethod && (!name || !contact))) {
      return json({ ok: false, error: 'Missing fields' }, 400);
    }
    if (!shot || typeof shot === 'string' || !shot.size) {
      return json({ ok: false, error: 'Screenshot required' }, 400);
    }
    const needsPhone =
      PHONE_REQUIRED_PRODUCT_IDS.includes(productId) ||
      PHONE_REQUIRED_TEXT.test(product);
    if (needsPhone && !phone) {
      return json({ ok: false, error: 'Missing fields' }, 400);
    }
    if (needsPhone && !PHONE_SHAPE.test(phone)) {
      return json({ ok: false, error: 'Invalid phone' }, 400);
    }
    const netflixPhone = productId === 'netflix_phone' || /netflix.*phone/i.test(product);
    const needsProfile = netflixPhone || PROFILE_PRODUCTS.includes(productId) ||
      /netflix.*tv|hbo|prime video/i.test(product);
    if (contactMethod && needsProfile && profileName.length < 2) {
      return json({ ok: false, error: 'Profile name required' }, 400);
    }
    if (contactMethod && netflixPhone && (devices.length < 2 || /tv|box/i.test(devices))) {
      return json({ ok: false, error: 'Phone, tablet or computer required' }, 400);
    }
    if (contactMethod && (MAIL_PRODUCTS.includes(productId) || planId.includes('cus_mail')) &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerMail)) {
      return json({ ok: false, error: 'Valid email required' }, 400);
    }
    if (shot.size > MAX_FILE) {
      return json({ ok: false, error: 'File too large' }, 400);
    }
    // must be an image Telegram sendPhoto can actually take (HEIC/PDF ဆိုရင်
    // Telegram က ရှုပ်ထွေးတဲ့ error ပဲ ပြန်ပေးတယ်)။ Empty type is allowed —
    // some browsers omit it.
    if (shot.type && ALLOWED_IMAGE.indexOf(shot.type.toLowerCase().split(';')[0].trim()) === -1) {
      return json({ ok: false, error: 'Unsupported image type' }, 400);
    }

    const orderId = newOrderId();
    const linkToken = telegram ? crypto.randomUUID().replaceAll('-', '') : '';
    const tokenHash = linkToken
      ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(linkToken))),
          (byte) => byte.toString(16).padStart(2, '0')).join('')
      : '';

    // Server-side stock check (defense-in-depth vs stale tab / bookmarked /
    // forged POST). We DON'T reject — manual web orders are admin-reviewed and
    // the form intentionally lets a customer order an OOS plan ("admin will
    // contact when restocked"). Instead we flag it loudly in the admin caption.
    const stock = await checkPlanStock(productId, planId);
    const oos = stock.found && !stock.inStock;

    const captionLines = [
      `Web order #${orderId}`,
      product,
      oos && 'Out of stock - contact customer before fulfillment.',
      `Payment: ${payment}`,
      name && `Customer: ${name}`,
      telegram ? 'Contact: Telegram (waiting for Start)' :
        `${contactMethod === 'viber' ? 'Viber' : 'Contact'}: ${contact}`,
      profileName && `Profile: ${profileName}`,
      devices && `Devices: ${devices}`,
      phone && `Data SIM: ${phone}`,
      customerMail && `Customer email: ${customerMail}`,
      customerPw && `Mail password: ${customerPw}`,
    ].filter(Boolean).join('\n');
    // Leave room for the review status that the bot appends.
    const noteBudget = 980 - captionLines.length - '\nNote: '.length;
    const caption = captionLines + (note && noteBudget > 0 ? `\nNote: ${note.slice(0, noteBudget)}` : '');

    // Target အားလုံးထဲက တစ်ခုကိုပဲ await လုပ်တယ် (ပုံ upload တစ်ခါတည်း) —
    // customer ရဲ့ စောင့်ချိန်က admin အရေအတွက်နဲ့ မတက်ဘူး။ ပထမတစ်ခု ကျရင်
    // နောက်တစ်ခုကို ဆက်ကြိုးစားတယ်၊ id တစ်ခု မှားနေလို့ ငွေလွှဲပြီးသား order
    // တစ်ခုလုံး မပျက်စေရ။ တစ်ခုအောင်တာနဲ့ ကျန်တာက file_id fan-out။
    let primary;
    let deliveredTo = '';
    let fileId = '';
    for (const chatId of targets) {
      const tg = new FormData();
      tg.append('chat_id', chatId);
      tg.append('caption', caption);
      tg.append('photo', shot, 'payment-screenshot.jpg');

      const resp = await fetch(
        `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`,
        { method: 'POST', body: tg }
      );
      const data = await resp.json();

      if (data.ok) {
        primary = data.result;
        deliveredTo = chatId;
        fileId = photoFileId(data);
        break;
      }
      console.error('Telegram error:', chatId, JSON.stringify(data));
    }

    if (!deliveredTo) {
      return json({ ok: false, error: 'Delivery failed' }, 502);
    }

    const id = await mirrorToPanel(env, {
      order_ref: orderId,
      name, product, payment, contact,
      contact_method: contactMethod,
      telegram_link_hash: tokenHash,
      profile_name: profileName,
      devices,
      phone,
      customer_mail: customerMail,
      note,
      product_id: productId,
      plan_id: planId,
      has_pw: Boolean(customerPw),
      oos: Boolean(oos),
    });

    const keyboard = id ? decisionKeyboard(id, orderId, primary?.from?.username) : undefined;
    if (keyboard) {
      context.waitUntil(fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: deliveredTo, message_id: primary.message_id, reply_markup: keyboard,
        }),
      }).then(response => {
        if (!response.ok) console.warn('Web order buttons unavailable', orderId);
      }).catch(() => console.warn('Web order buttons unavailable', orderId)));
    }

    const fan = await fanOutToRest(
      env,
      targets.filter((id) => id !== deliveredTo),
      caption,
      fileId,
      shot,
      keyboard
    );
    console.log('order', orderId, 'notify targets', targets.length,
                'primary ok, fan-out sent', fan.sent, 'failed', fan.failed);

    const fbBase = env.FB_PAGE_LINK || FB_DEFAULT;
    const fbRef = env.FB_PAGE_LINK && env.FB_PAGE_LINK.includes('m.me')
      ? (fbBase.includes('?') ? `&ref=${orderId}` : `?ref=${orderId}`)
      : '';
    const telegramLink = id && linkToken ? `https://t.me/PSNamso_bot?start=linkweb_${linkToken}` : undefined;
    return json({ ok: true, orderId, fbLink: fbBase + fbRef, telegramLink });
  } catch {
    console.error('Web order request failed');
    return json({ ok: false, error: 'Server error' }, 500);
  }
}

// customer ကို ပြတဲ့ order reference — real order နဲ့ honeypot false positive
// ၂ ခုလုံး တူညီတဲ့ format ('W' + timestamp) ကို သုံးသည်။
function newOrderId() {
  return 'W' + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 5).toUpperCase();
}

function clean(v, max) {
  return String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // _headers rules don't apply to Pages Function responses — set here
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}
