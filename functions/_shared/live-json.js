export const LIVE_JSON_TTL_SECONDS = 5;
export const LIVE_JSON_CACHE_CONTROL = 'no-store, max-age=0';
export const LIVE_JSON_MAX_BYTES = 2_000_000;

export function versionedRawUrl(rawUrl, now = Date.now()) {
  const url = new URL(rawUrl);
  // Keep each Cloudflare edge entry short-lived. The request headers below
  // force raw.githubusercontent.com to revalidate its advertised five-minute
  // cache whenever a new edge entry is populated.
  url.searchParams.set(
    'pstore_live_rev',
    String(Math.floor(now / (LIVE_JSON_TTL_SECONDS * 1000))),
  );
  return url.toString();
}

export async function fetchLiveJson(rawUrl) {
  const response = await fetch(versionedRawUrl(rawUrl), {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    cf: {
      cacheTtl: LIVE_JSON_TTL_SECONDS,
      cacheEverything: true,
    },
  });
  if (!response.ok) throw new Error(`live JSON fetch failed: ${response.status}`);
  const declaredBytes = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredBytes) && declaredBytes > LIVE_JSON_MAX_BYTES) {
    throw new Error('live JSON exceeds size limit');
  }
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > LIVE_JSON_MAX_BYTES) {
    throw new Error('live JSON exceeds size limit');
  }
  JSON.parse(body);
  return body;
}

export function freshJsonHeaders(sourceHeader, source) {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': LIVE_JSON_CACHE_CONTROL,
    'X-Content-Type-Options': 'nosniff',
    [sourceHeader]: source,
  };
}

export function freshFallbackResponse(fallback, sourceHeader) {
  const headers = new Headers(fallback.headers);
  headers.set('Cache-Control', LIVE_JSON_CACHE_CONTROL);
  headers.set(sourceHeader, 'static-fallback');
  return new Response(fallback.body, { status: fallback.status, headers });
}
