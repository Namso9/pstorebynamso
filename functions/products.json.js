/**
 * Cloudflare Pages Function: GET /products.json — LIVE proxy.
 *
 * ဘာကြောင့်လဲ: ဒီ project က Cloudflare Pages မှာ manual deploy ဖြစ်နေလို့
 * panel/databot က products.json ကို GitHub ပေါ် commit လုပ်လည်း "Create
 * deployment" မနှိပ်မချင်း website မှာ မပေါ်ဘူး။ ဒီ function က products.json
 * ကို GitHub raw (main branch) ကနေ တိုက်ရိုက်ဆွဲပြီး serve လုပ်တာမို့ —
 * stock/price commit ဖြစ်တာနဲ့ ၁-၂ မိနစ်အတွင်း site မှာ live ဖြစ်တယ်၊
 * deploy ထပ်မလိုတော့ဘူး။ (ဒီ function ကိုယ်တိုင်အတွက် နောက်ဆုံးတစ်ခါ deploy လို)
 *
 * Fallback: GitHub မရရင် / JSON မမှန်ရင် build ထဲပါတဲ့ static products.json
 * ကို ပြန် serve — site ဘယ်တော့မှ data မဲ့မကျန်။
 */

const RAW_URL =
  'https://raw.githubusercontent.com/Namso9/pstorebynamso/main/products.json';

export async function onRequestGet({ request, env }) {
  try {
    const r = await fetch(RAW_URL, {
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (r.ok) {
      const body = await r.text();
      JSON.parse(body); // corrupt-content guard — throw -> fallback
      return new Response(body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60, must-revalidate',
          'X-Products-Source': 'github-live',
        },
      });
    }
  } catch (e) {
    // fall through to the static copy
  }
  const fallback = await env.ASSETS.fetch(request);
  const headers = new Headers(fallback.headers);
  headers.set('X-Products-Source', 'static-fallback');
  return new Response(fallback.body, { status: fallback.status, headers });
}
