/**
 * Cloudflare Pages Function: POST /api/track
 *
 * Anonymous product-interest and traffic counter. Takes {id, kind, source} —
 * plus `q`, the normalised search text, for kind 'search' and nothing else —
 * from the storefront (see src/services/track.ts) and forwards it to the panel,
 * which aggregates a weekly ranking and publishes data/popular.json back to
 * this repo. The PAYLOAD carries nothing else — no ip, no cookie, no session
 * id, no user agent, no URL, no path, no referrer — and the panel's table has
 * no column for any of them and no row per click. Nothing here is logged.
 *
 * The five kinds and their subjects, validated PER KIND below because the wire
 * shape is shared and only a per-kind rule keeps the counters from
 * contaminating each other:
 *   plans/checkout  a real catalog product id   source grid|popular|modal|search
 *   visit           'site' (legacy) or a pg-*   source page
 *   session         'site'                      source ref-*
 *   search          'site'                      source search-hit|search-miss
 * `pg-*` and `site` are reserved ids a product click may never borrow, and the
 * page, ref and search source sets are all CLOSED — that, not traffic, is what
 * bounds the number of rows the panel can ever hold.
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
// the cap is what makes that statement true rather than hopeful. Raised 512 ->
// 768 for the one optional field, `q` (<= 40 chars after normalisation) — the
// declared Content-Length check and the .slice() below are what the cap
// actually acts through, and both still apply unchanged.
const MAX_BODY = 768;

const ID_RE = /^[A-Za-z0-9_-]{1,60}$/;
const KINDS = ['plans', 'checkout', 'visit', 'session', 'search'];
const SOURCES = [
  'grid', 'popular', 'modal', 'search', 'page',
  'ref-direct', 'ref-internal', 'ref-facebook', 'ref-messenger',
  'ref-telegram', 'ref-google', 'ref-tiktok', 'ref-other',
  'search-hit', 'search-miss',
];

// The non-product subjects. A visit may ONLY arrive as {site|pg-*, visit,
// page}, a session as {site, session, ref-*}, a search as {site, search,
// search-*}, and a product click may use NEITHER the reserved ids NOR any of
// those sources — so the four kinds of row can never contaminate each other,
// whatever a caller sends.
const SITE_ID = 'site';
// The page slugs, duplicated from PageSlug in src/services/track.ts and from
// the panel's _PAGE_IDS. All three copies must change in the same milestone —
// a slug one side does not know is dropped there with no error anywhere.
const PAGE_IDS = [
  'pg-home', 'pg-streaming-apps', 'pg-ai-apps', 'pg-premium-vpn-apps',
  'pg-mobile-data', 'pg-music-apps', 'pg-creative-apps', 'pg-payment',
  'pg-order', 'pg-reviews', 'pg-bioscope-download', 'pg-expressvpn-guide',
  'pg-terms', 'pg-terms-vpn', 'pg-404', 'pg-other',
];
const REF_SOURCES = [
  'ref-direct', 'ref-internal', 'ref-facebook', 'ref-messenger',
  'ref-telegram', 'ref-google', 'ref-tiktok', 'ref-other',
];
const SEARCH_SOURCES = ['search-hit', 'search-miss'];
const PRODUCT_SOURCES = ['grid', 'popular', 'modal', 'search'];

/**
 * Re-normalise a search term server-side. Byte for byte the same rules as
 * normalizeSearchQuery() in src/services/track.ts and the panel's own copy:
 * NEVER TRUST THE CLIENT — this function, not the browser, is what makes the
 * panel's text column safe (no markup, no control characters, no unicode
 * homographs) and what bounds it to 40 characters.
 *
 * Returns '' for anything that normalises to less than two usable characters;
 * the caller then forwards the event WITHOUT `q`, so the search-volume count
 * survives even when the term itself is unusable.
 */
// ⛔ CONTACT-DETAIL GUARD, two rules against two different inputs — the twin
// of AT_SIGN/LONG_DIGITS in src/services/track.ts and of the _SEARCH_Q_* pair
// in the panel. The character class keeps the value safe to store and render;
// this keeps it from being an IDENTIFIER.
//   - "@" is tested against the RAW input, before filtering: the class strips
//     "@" itself, so a clean term has already lost what marks it an address.
//   - 7+ digits is tested against the filtered term with separators removed,
//     because "0977 123 4567" is a phone number and /[0-9]{7,}/ does not match
//     it while the spaces are still there.
// NOT banned: gmail / yahoo / hotmail — this shop sells accounts for those, so
// they are product searches. A match drops the term WHOLE and the caller then
// forwards the event without `q`, so the search is still counted.
const AT_SIGN = /@/;
const SEPARATORS = /[ ._+-]/g;
const LONG_DIGITS = /[0-9]{7,}/;

function normalizeQuery(raw) {
  const rawText = String(raw || '').trim().toLowerCase();
  if (AT_SIGN.test(rawText)) return '';
  const q = rawText
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ._+-]/g, '')
    .slice(0, 40)
    .trim();
  if (LONG_DIGITS.test(q.replace(SEPARATORS, ''))) return '';
  return q.length < 2 ? '' : q;
}

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
    // Per-kind validation, in the same order the panel applies it. Each of the
    // three non-product kinds carries its own closed id/source pair, and none
    // of them needs the catalog check below — their subject is the site or a
    // page, not a product.
    let q = '';
    if (kind === 'visit') {
      // 'site' stays accepted for pings emitted before page slugs existed.
      if (id !== SITE_ID && PAGE_IDS.indexOf(id) === -1) return noContent();
      if (source !== 'page') return noContent();
    } else if (kind === 'session') {
      if (id !== SITE_ID) return noContent();
      if (REF_SOURCES.indexOf(source) === -1) return noContent();
    } else if (kind === 'search') {
      if (id !== SITE_ID) return noContent();
      if (SEARCH_SOURCES.indexOf(source) === -1) return noContent();
      // An unusable term drops the FIELD, not the event: the panel still gets
      // its search-volume row, it just has no text to file under.
      q = normalizeQuery(payload.q);
    } else {
      // And the reverse: a product click may not borrow a reserved subject or
      // any non-product source, and its id has to be a product that really
      // exists. `isKnownProduct` runs here and NOWHERE else — the closed
      // allowlists above already bound the other kinds, and a catalog fetch
      // per page load would be a subrequest for nothing.
      if (id === SITE_ID || id.indexOf('pg-') === 0) return noContent();
      if (PRODUCT_SOURCES.indexOf(source) === -1) return noContent();
      if (!(await isKnownProduct(id))) return noContent();
    }

    // Rebuilt field by field, never spread from the parsed payload: an extra
    // key a caller invented must not be forwarded to the panel.
    const forwarded = { id, kind, source };
    if (kind === 'search' && q) forwarded.q = q;

    waitUntil(
      fetch(env.PANEL_CLICK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Ingest-Token': env.PANEL_INGEST_TOKEN,
        },
        body: JSON.stringify(forwarded),
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
