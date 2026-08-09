/**
 * Cloudflare Pages Function: GET /images/reviewN.<ext> — canonical reviews.
 *
 * The Admin Panel commits new reviews directly to the repository's existing
 * images/ directory. This function makes a newly committed sequential file
 * available before the next static build; existing static assets remain the
 * fallback, and unrelated /images/* requests pass straight to ASSETS.
 */

const RAW_BASE =
  'https://raw.githubusercontent.com/Namso9/pstorebynamso/main/images/';
const REVIEW_NAME_RE = /^review\d+\.(webp|jpg|jpeg|png)$/i;
const TYPES = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export async function onRequestGet({ params, request, env }) {
  const name = String(params.name || '');
  if (!REVIEW_NAME_RE.test(name) || name.includes('..')) {
    return env.ASSETS.fetch(request);
  }

  try {
    const rollingKey = Math.floor(Date.now() / 5000);
    const upstream = await fetch(
      `${RAW_BASE}${encodeURIComponent(name)}?v=${rollingKey}`,
      {
      cf: { cacheTtl: 5, cacheEverything: true },
      },
    );
    if (upstream.ok) {
      const ext = name.split('.').pop().toLowerCase();
      return new Response(upstream.body, {
        headers: {
          'Content-Type': TYPES[ext] || 'application/octet-stream',
          // A deleted highest number may be reused by max+1 allocation. Do not
          // let a browser pin the prior image under that sequential URL.
          'Cache-Control': 'no-store, max-age=0',
          'X-Content-Type-Options': 'nosniff',
          'X-Image-Source': 'github-live',
        },
      });
    }
  } catch (_error) {
    // Fall through to the build snapshot.
  }

  const fallback = await env.ASSETS.fetch(request);
  if (fallback.ok) return fallback;
  return new Response('not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export async function onRequestHead(ctx) {
  const response = await onRequestGet(ctx);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
