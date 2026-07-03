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

export async function onRequestPost({ request, env }) {
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

    const orderId = 'W' + Date.now().toString(36).toUpperCase() +
      Math.random().toString(36).slice(2, 5).toUpperCase();

    const caption =
      `🛒 WEB ORDER  #${orderId}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 Name: ${name}\n` +
      `📦 Product: ${product}\n` +
      `💳 Payment: ${payment}\n` +
      `📞 Contact: ${contact}\n` +
      (customerMail ? `📧 Customer Mail: ${customerMail}\n` : '') +
      (customerPw ? `🔑 Mail Password: ${customerPw}\n` : '') +
      (note ? `📝 Note: ${note}\n` : '') +
      `━━━━━━━━━━━━━━━\n` +
      `⚠️ Website order form ကနေ ဝင်လာတဲ့ order ပါ — အပေါ်က Contact (Viber နံပါတ် / Telegram username) အတိုင်း ပြန်ဆက်သွယ်ပေးပါ`;

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

    return json({
      ok: true,
      orderId,
      fbLink: (env.FB_PAGE_LINK || 'https://www.facebook.com/share/1C7LUKTbdt/?mibextid=wwXIfr') +
        (env.FB_PAGE_LINK && env.FB_PAGE_LINK.includes('m.me') ? `?ref=${orderId}` : ''),
    });
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
    headers: { 'Content-Type': 'application/json' },
  });
}
