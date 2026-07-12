/**
 * Cloudflare Pages Function: GET /data/<file> — LIVE proxy (products.json.js
 * pattern). Panel က data/*.json ကို GitHub ပေါ် commit လုပ်တာနဲ့ ၁-၂ မိနစ်အတွင်း
 * site မှာ live ဖြစ်တယ် — manual deploy မလိုတော့ဘူး။
 *
 * Fallback: GitHub မရရင် / JSON မမှန်ရင် build ထဲပါတဲ့ static copy ကို serve။
 * Whitelist: သတ်မှတ်ထားတဲ့ ၃ ဖိုင်ပဲ — path traversal / arbitrary proxy မဖြစ်ရ။
 */

const ALLOWED = new Set(['faq.json', 'reviews.json', 'express-guide.json']);
const RAW_BASE =
  'https://raw.githubusercontent.com/Namso9/pstorebynamso/main/data/';

export async function onRequestGet({ params, request, env }) {
  const file = String(params.file || '');
  if (!ALLOWED.has(file)) return new Response('not found', { status: 404 });
  try {
    const r = await fetch(RAW_BASE + file, {
      cf: { cacheTtl: 60, cacheEverything: true },
    });
    if (r.ok) {
      const body = await r.text();
      JSON.parse(body); // corrupt-content guard — throw -> fallback
      return new Response(body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60, must-revalidate',
          'X-Data-Source': 'github-live',
        },
      });
    }
  } catch (e) {
    // fall through to the static copy
  }
  const fallback = await env.ASSETS.fetch(request);
  const headers = new Headers(fallback.headers);
  headers.set('X-Data-Source', 'static-fallback');
  return new Response(fallback.body, { status: fallback.status, headers });
}

export async function onRequestHead(ctx) {
  const r = await onRequestGet(ctx);
  return new Response(null, { status: r.status, headers: r.headers });
}
