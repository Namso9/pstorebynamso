/**
 * Cloudflare Pages Function: POST /api/track
 *
 * Anonymous product-interest counter. Takes {id, kind, source} from the
 * storefront (see src/services/track.ts) and forwards it to the panel, which
 * aggregates a weekly ranking and publishes data/popular.json back to this
 * repo. The PAYLOAD carries nothing else — no ip, no cookie, no session, no
 * user agent — and the panel's table has no column for any of them and no row
 * per click. Nothing here is logged.
 *
 * One honest limit, because the alternative is a false claim: a Cloudflare
 * subrequest to a Cloudflare-proxied hostname carries Cloudflare's own
 * `CF-Connecting-IP` for the original visitor, and a Pages Function cannot
 * suppress that. So the visitor's address reaches the panel's edge here exactly
 * as it does for /api/order and for every other request to that hostname. What
 * this route guarantees is narrower and is the part that was in our hands: the
 * payload is three enum-ish strings, the panel route reads no client address
 * (unlike the audit rows elsewhere in it), and nothing identifying is stored.
 *
 * Setup (Cloudflare Dashboard -> Pages project -> Settings -> Environment
 * variables). Both are required; with either missing this route is a silent
 * no-op and the site behaves exactly as it does today:
 *   PANEL_CLICK_URL    = the panel's click-ingest endpoint
 *   PANEL_INGEST_TOKEN = the same token /api/order already uses
 *
 * Always answers 204, whatever happens downstream. The customer's click must
 * never wait on this and must never see an error from it.
 */

// Same origin rule as /api/order: a missing or opaque ('null') Origin is
// accepted (in-app webviews and privacy modes send those), a present-and-wrong
// one is not.
const ALLOWED_ORIGINS = [
  'https://pstorebynamso.com',
  'https://www.pstorebynamso.com',
];

// A body this small can be read without a size guard doing any real work, but
// the cap is what makes that statement true rather than hopeful.
const MAX_BODY = 512;

const ID_RE = /^[A-Za-z0-9_-]{1,60}$/;
const KINDS = ['plans', 'checkout'];
const SOURCES = ['grid', 'popular', 'modal', 'search'];

// Same source /products.json serves. The shape check above is not enough on its
// own: a caller sending a DIFFERENT well-formed id on every request would create
// a new row in the panel's counter each time instead of reusing one minute
// bucket, which is exactly the unbounded growth the bucketed table exists to
// prevent. So the id has to be a product that really exists.
const PRODUCTS_RAW_URL =
  'https://raw.githubusercontent.com/Namso9/pstorebynamso/main/products.json';

/**
 * True when `id` is a product in the live catalog.
 *
 * Read through the SHARED live-JSON helper rather than a plain fetch with a
 * long TTL. That matters here in a way it does not for /api/order's stock
 * check: a stale catalog there fails OPEN (the order proceeds unflagged),
 * while a stale catalog here would fail CLOSED and silently reject every click
 * for a product the panel had just published. `fetchLiveJson` adds the same
 * rolling five-second cache key the /products.json proxy uses, so every click
 * inside one bucket shares a single cache entry — a hit per click, not a fetch.
 *
 * Fails OPEN on any fetch or parse problem: a GitHub blip must not stop
 * counting, and the panel keeps its own per-minute ceiling as the backstop for
 * exactly this window.
 */
async function isKnownProduct(id) {
  try {
    const body = await fetchLiveJson(PRODUCTS_RAW_URL);
    const data = JSON.parse(body);
    if (!data || !Array.isArray(data.products)) return true;
    return data.products.some((product) => product && product.id === id);
  } catch {
    return true;
  }
}

import { fetchLiveJson } from '../_shared/live-json.js';

function noContent() {
  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function onRequestPost({ request, env, waitUntil }) {
  try {
    const origin = request.headers.get('Origin');
    if (
      origin &&
      origin !== 'null' &&
      ALLOWED_ORIGINS.indexOf(origin) === -1 &&
      origin !== new URL(request.url).origin
    ) {
      return noContent();
    }

    // Require a declared, in-range length. `sendBeacon` with a Blob and the
    // `fetch` fallback with a string both set Content-Length, so a real beacon
    // always has one — and without this check `request.text()` would buffer an
    // arbitrarily large body before the slice below could bound it, which is a
    // free way for anyone to push this isolate into its memory limit.
    const declared = Number(request.headers.get('Content-Length'));
    if (!Number.isFinite(declared) || declared <= 0 || declared > MAX_BODY) {
      return noContent();
    }

    const text = (await request.text()).slice(0, MAX_BODY);
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return noContent();
    }
    if (!payload || typeof payload !== 'object') return noContent();

    // Unconfigured is a no-op, not an error: the storefront ships before the
    // dashboard variable exists and must not start logging 500s in the
    // meantime. Checked FIRST, before any validation: with nowhere to forward
    // to there is nothing to validate for, and doing it anyway meant the
    // "silent no-op" state was quietly fetching the catalog on every click.
    if (!env.PANEL_CLICK_URL || !env.PANEL_INGEST_TOKEN) return noContent();

    const id = String(payload.id || '');
    const kind = String(payload.kind || '');
    const source = String(payload.source || 'grid');
    if (!ID_RE.test(id)) return noContent();
    if (KINDS.indexOf(kind) === -1) return noContent();
    if (SOURCES.indexOf(source) === -1) return noContent();
    if (!(await isKnownProduct(id))) return noContent();

    waitUntil(
      fetch(env.PANEL_CLICK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Token': env.PANEL_INGEST_TOKEN,
        },
        body: JSON.stringify({ id, kind, source }),
      }).catch(() => {})
    );
    return noContent();
  } catch {
    // Deliberately no console.error: a burst of blocked or malformed beacons
    // would fill the Pages log that /api/order's honeypot trail lives in, and
    // a lost count is worth nothing next to a lost order.
    return noContent();
  }
}
