/**
 * Cloudflare Pages Function: GET /data/<file> — LIVE proxy (products.json.js
 * pattern). Panel က data/*.json ကို GitHub ပေါ် commit လုပ်တာနဲ့ စက္ကန့်အနည်းငယ်အတွင်း
 * site မှာ live ဖြစ်တယ် — manual deploy မလိုတော့ဘူး။
 *
 * Fallback: GitHub မရရင် / JSON မမှန်ရင် build ထဲပါတဲ့ static copy ကို serve။
 * Whitelist: ALLOWED ထဲက ဖိုင်တွေပဲ — path traversal / arbitrary proxy မဖြစ်ရ။
 */

const ALLOWED = new Set([
  'faq.json',
  'reviews.json',
  'express-guide.json',
  'bioscope-download.json',
]);
const GITHUB_REPO = 'Namso9/pstorebynamso';
const GITHUB_BRANCH = 'main';

import {
  fetchGitHubLiveJson,
  freshFallbackResponse,
  freshJsonHeaders,
} from '../_shared/live-json.js';

export async function onRequestGet({ params, request, env }) {
  const file = String(params.file || '');
  if (!ALLOWED.has(file)) return new Response('not found', { status: 404 });
  try {
    const body = await fetchGitHubLiveJson(
      GITHUB_REPO,
      GITHUB_BRANCH,
      `data/${file}`,
    );
    return new Response(body, {
      headers: freshJsonHeaders('X-Data-Source', 'github-live'),
    });
  } catch (e) {
    // fall through to the static copy
  }
  const fallback = await env.ASSETS.fetch(request);
  return freshFallbackResponse(fallback, 'X-Data-Source');
}

export async function onRequestHead(ctx) {
  const r = await onRequestGet(ctx);
  return new Response(null, { status: r.status, headers: r.headers });
}
