/**
 * Cloudflare Pages Function: POST /api/order
 * Web order (Telegram မသုံးသူများအတွက်) ကို admin ရဲ့ Telegram ဆီ forward လုပ်ပေးသည်။
 *
 * Setup (Cloudflare Dashboard → Pages project → Settings → Environment variables):
 *   BOT_TOKEN      = Telegram bot token (BotFather ကရတဲ့ token — sale bot token ကိုပဲသုံးလို့ရသည်)
 *   ADMIN_CHAT_ID  = admin ရဲ့ chat id (သို့) private channel id (ဥပမာ -1001234567890)
 *   FB_PAGE_LINK   = https://m.me/YourPageUsername   (optional)
 */

const MAX_FILE = 8 * 1024 * 1024; // 8MB

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
 * Fire-and-forget: a panel hiccup never blocks the customer's order.
 * Password/screenshot are NOT mirrored — Telegram keeps the only copy.
 */
function mirrorToPanel(env, waitUntil, data) {
  if (!env.PANEL_INGEST_URL || !env.PANEL_INGEST_TOKEN) return;
  waitUntil(
    fetch(env.PANEL_INGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ingest-Token': env.PANEL_INGEST_TOKEN,
      },
      body: JSON.stringify(data),
    }).catch(() => {})
  );
}

export async function onRequestPost({ request, env, waitUntil }) {
  try {
    if (!env.BOT_TOKEN || !env.ADMIN_CHAT_ID) {
      return json({ ok: false, error: 'Server not configured' }, 500);
    }

    const form = await request.formData();

    // honeypot — bots fill hidden fields
    if (form.get('website')) return json({ ok: true, orderId: 'OK', fbLink: '#' });

    const name = clean(form.get('name'), 60);
    const product = clean(form.get('product'), 120);
    const payment = clean(form.get('payment'), 30);
    const contact = clean(form.get('contact'), 40);
    const customerMail = clean(form.get('customer_mail'), 120);
    const customerPw = clean(form.get('customer_pw'), 100);
    const note = clean(form.get('note'), 300);
    const productId = clean(form.get('product_id'), 60);
    const planId = clean(form.get('plan_id'), 60);
    const shot = form.get('screenshot');

    if (!name || !product || !contact || !payment) {
      return json({ ok: false, error: 'Missing fields' }, 400);
    }
    if (!shot || typeof shot === 'string') {
      return json({ ok: false, error: 'Screenshot required' }, 400);
    }
    if (shot.size > MAX_FILE) {
      return json({ ok: false, error: 'File too large' }, 400);
    }
    // must be an image (Telegram sendPhoto rejects anything else with a
    // confusing error). Empty type is allowed — some browsers omit it.
    if (shot.type && !shot.type.startsWith('image/')) {
      return json({ ok: false, error: 'Screenshot must be an image' }, 400);
    }

    const orderId = 'W' + Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 5).toUpperCase();

    // Server-side stock check (defense-in-depth vs stale tab / bookmarked /
    // forged POST). We DON'T reject — manual web orders are admin-reviewed and
    // the form intentionally lets a customer order an OOS plan ("admin will
    // contact when restocked"). Instead we flag it loudly in the admin caption.
    const stock = await checkPlanStock(productId, planId);
    const oos = stock.found && !stock.inStock;

    // Telegram sendPhoto caption hard limit is 1024 chars. Everything except
    // `note` is short & essential; trim only the note so a long note can never
    // push the caption over the limit and get the whole order rejected.
    const buildCaption = (n) =>
      `🛒 WEB ORDER  #${orderId}\n` +
      `━━━━━━━━━━━━━━━\n` +
      (oos ? `🚨 OUT OF STOCK plan — restock ပြီးမှ ပေးပါ / customer ကို အကြောင်းပြန်ပါ\n` : '') +
      `👤 Name: ${name}\n` +
      `📦 Product: ${product}\n` +
      `💳 Payment: ${payment}\n` +
      `📞 Contact: ${contact}\n` +
      (customerMail ? `📧 Customer Mail: ${customerMail}\n` : '') +
      (customerPw ? `🔑 Mail Password: ${customerPw}\n` : '') +
      (n ? `📝 Note: ${n}\n` : '') +
      `━━━━━━━━━━━━━━━\n` +
      `⚠️ Website order form ကနေ ဝင်လာတဲ့ order ပါ — အပေါ်က Contact (Viber နံပါတ် / Telegram username) အတိုင်း ပြန်ဆက်သွယ်ပေးပါ`;

    let caption = buildCaption(note);
    if (caption.length > 1024) {
      const budget = note.length - (caption.length - 1024) - 1; // -1 for ellipsis
      caption = buildCaption(budget > 0 ? note.slice(0, budget) + '…' : '');
      if (caption.length > 1024) caption = caption.slice(0, 1024);
    }

    const tg = new FormData();
    tg.append('chat_id', env.ADMIN_CHAT_ID);
    tg.append('caption', caption);
    tg.append('photo', shot, 'payment-screenshot.jpg');

    const resp = await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`,
      { method: 'POST', body: tg }
    );
    const data = await resp.json();

    if (!data.ok) {
      console.error('Telegram error:', JSON.stringify(data));
      return json({ ok: false, error: 'Delivery failed' }, 502);
    }

    mirrorToPanel(env, waitUntil, {
      order_ref: orderId,
      name, product, payment, contact,
      customer_mail: customerMail,
      note,
      has_pw: Boolean(customerPw),
      oos: Boolean(oos),
    });

    const fbBase = env.FB_PAGE_LINK || 'https://www.facebook.com/share/1C7LUKTbdt/?mibextid=wwXIfr';
    const fbRef = env.FB_PAGE_LINK && env.FB_PAGE_LINK.includes('m.me')
      ? (fbBase.includes('?') ? `&ref=${orderId}` : `?ref=${orderId}`)
      : '';
    return json({ ok: true, orderId, fbLink: fbBase + fbRef });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: 'Server error' }, 500);
  }
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
    },
  });
}
