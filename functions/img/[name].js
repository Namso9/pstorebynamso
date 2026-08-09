/**
 * Cloudflare Pages Function: GET /img/<name> — legacy panel-uploaded images.
 *
 * Older Admin Panel versions committed timestamp-named review photos to
 * images/uploads/. New uploads use canonical /images/reviewN.<ext>; keep this
 * route so any historical "img/<name>" JSON entry remains readable.
 *
 * Whitelist regex — image filename ပုံစံပဲခွင့်ပြု (path traversal မဖြစ်ရ)။
 */

const RAW_BASE =
  'https://raw.githubusercontent.com/Namso9/pstorebynamso/main/images/uploads/';
const NAME_RE = /^[A-Za-z0-9._-]{1,80}\.(webp|jpg|jpeg|png)$/;
const TYPES = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export async function onRequestGet({ params }) {
  const name = String(params.name || '');
  if (!NAME_RE.test(name) || name.includes('..')) {
    return new Response('not found', { status: 404 });
  }
  const r = await fetch(RAW_BASE + encodeURIComponent(name), {
    cf: { cacheTtl: 3600, cacheEverything: true },
  });
  if (!r.ok) return new Response('not found', { status: 404 });
  const ext = name.split('.').pop().toLowerCase();
  return new Response(r.body, {
    headers: {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
