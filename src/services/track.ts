/**
 * Anonymous product-interest and traffic counter.
 *
 * WHAT LEAVES THE BROWSER, exactly: a subject id (a product id, the constant
 * "site", or one of sixteen "pg-*" page constants), which kind of event it was,
 * one enum-ish source constant, and — for a settled search only — the
 * normalised search text. Nothing else. NOTHING THAT IDENTIFIES A PERSON IS
 * EVER TRANSMITTED OR STORED: no customer identifier, no cookie, no
 * localStorage key, no session id, no screen or device fingerprint, no IP the
 * payload could carry, no URL, no path, no query string, no UTM parameter and
 * no referrer. The Pages function forwards the same fields.
 *
 * WHAT THE PANEL KEEPS, precisely, because there are two tables and only one
 * of them is a pure counter:
 *
 *   · product and traffic events -> a per-minute COUNTER keyed
 *     (minute, subject, kind, source). No row per event, and no column an
 *     identifier could live in.
 *   · settled searches -> a per-DAY counter keyed (day, term, found). Still no
 *     row per event and still nothing about the visitor — but `term` IS a text
 *     column, so calling the whole store "a counter with no column an
 *     identifier could live in" would be an overclaim. What keeps that column
 *     honest is stated below and enforced in three places
 *     (`normalizeSearchQuery` here, `normalizeQuery` in the Pages function,
 *     `normalise_search_q` in the panel): the text is reduced to
 *     [a-z0-9 ._+-], capped at 40 characters, and DROPPED ENTIRELY if what
 *     survives still looks like a phone number or an email address.
 *
 * TWO THINGS THIS FILE TOUCHES THAT LOOK LIKE TRACKING AND ARE NOT. Stated
 * plainly because this doc-block is the site's ONLY privacy statement about
 * analytics, and an overclaim here would be worse than the feature itself:
 *
 *   1. `sessionStorage["ps-seen"]` — ONE boolean flag, the single storage
 *      access in this file. It holds the string "1" and nothing else: no id,
 *      no timestamp, no counter, nothing derived from the visitor. It exists
 *      so a session is counted ONCE instead of once per page load, it is never
 *      passed to `send()` and cannot reach a payload, and it dies with the tab.
 *      It marks the browser for the browser's own benefit; it does not identify
 *      the browser to us. Two sessions on one device stay indistinguishable
 *      from two sessions on two devices.
 *   2. `document.referrer` — READ, never sent. `referrerBucket()` parses it far
 *      enough to read the HOST and nothing else, purely to pick one of eight
 *      fixed constants ("ref-facebook", "ref-google", …). The host itself never
 *      leaves the browser, and neither does the path, the query string or any
 *      UTM parameter that came with it. An unrecognised referrer collapses to
 *      the single constant "ref-other", so the site a visitor came from cannot
 *      be reconstructed from what we send.
 *
 * The page ping obeys the same rule: `pageSlug()` maps `location.pathname`
 * through a LITERAL map to one of sixteen "pg-*" constants and returns
 * "pg-other" for anything it does not know, so a path is never transmitted —
 * only membership in a closed sixteen-value set is.
 *
 * So: two clicks by the same visitor are still indistinguishable from two
 * clicks by two visitors, by construction rather than by policy.
 *
 * Scope of that promise: the request itself still travels over HTTP, so the
 * network layer sees an address the way it does for every other request on the
 * site — see the note in functions/api/track.js. This is about the data, which
 * is the part a page can actually control.
 *
 * It exists to answer questions the owner actually asks: which products did
 * people reach for this week (so the home page can rank the "Popular" row from
 * behaviour instead of a hand-picked list), how many people came and roughly
 * from where, which pages they look at, and what they searched for and did not
 * find — a repeated miss is a product worth stocking.
 *
 * Every failure is silent. A blocked beacon, an offline phone, an ad blocker
 * eating /api/*: none of it may ever surface to a customer or interrupt the
 * click that is being counted.
 */

const ENDPOINT = "/api/track";

/**
 * Which control the visitor used. `checkout` is the stronger intent signal.
 * The other three are not controls at all and carry no product:
 *   `visit`   — one FULL page load, subject `pg-*` (see `trackSiteVisit`)
 *   `session` — the first page load of a browser session, subject `site`
 *   `search`  — one SETTLED search query, subject `site`
 * All three are EXCLUDED from the popular ranking by the panel.
 */
export type TrackKind = "plans" | "checkout" | "visit" | "session" | "search";

/**
 * Where on the site the click happened, or — for the three non-product kinds —
 * which closed-allowlist bucket the event fell into. `popular` is reported but
 * deliberately EXCLUDED from the ranking by the panel: counting clicks on the
 * popular row towards the popular row is a feedback loop that would freeze the
 * top four in place for as long as the site is up. `page` belongs to the visit
 * ping only, `ref-*` to the session ping only, `search-*` to the search event
 * only. Each of those three groups is a CLOSED set, which is what bounds the
 * panel's row count by construction instead of by traffic.
 */
export type TrackSource =
  | "grid"
  | "popular"
  | "modal"
  | "search"
  | "page"
  | "ref-direct"
  | "ref-internal"
  | "ref-facebook"
  | "ref-messenger"
  | "ref-telegram"
  | "ref-google"
  | "ref-tiktok"
  | "ref-other"
  | "search-hit"
  | "search-miss";

/**
 * The eight referrer buckets, derived from `TrackSource` so the two can never
 * drift apart. Adding a ninth means teaching the panel about it in the same
 * push — an unknown source is dropped there in silence.
 */
export type RefBucket = Extract<TrackSource, `ref-${string}`>;

/**
 * The sixteen page constants. A CLOSED set on purpose: this is the only thing
 * about the current URL that is ever transmitted, and a closed set is what
 * makes "no path leaves the browser" a property of the shape rather than a
 * promise. The panel keeps a duplicate of this list as its validation
 * allowlist — EDIT BOTH COPIES IN THE SAME PUSH, a slug the panel does not
 * know is dropped there with no error anywhere.
 */
export type PageSlug =
  | "pg-home"
  | "pg-streaming-apps"
  | "pg-ai-apps"
  | "pg-premium-vpn-apps"
  | "pg-mobile-data"
  | "pg-music-apps"
  | "pg-creative-apps"
  | "pg-payment"
  | "pg-order"
  | "pg-reviews"
  | "pg-bioscope-download"
  | "pg-expressvpn-guide"
  | "pg-terms"
  | "pg-terms-vpn"
  | "pg-404"
  | "pg-other";

/**
 * Collapse an accidental double-fire (a fat-fingered double tap, a synthetic
 * click landing next to a real one) without keeping any per-visitor state that
 * outlives the page. Module scope, cleared on navigation like everything else.
 */
const DEDUPE_WINDOW_MS = 1_500;
const lastSent = new Map<string, number>();

function shouldSend(key: string) {
  const now = Date.now();
  const previous = lastSent.get(key);
  if (previous !== undefined && now - previous < DEDUPE_WINDOW_MS) return false;
  lastSent.set(key, now);
  // The map only ever holds one entry per product+control, plus one per
  // SETTLED search term, on one page view. A visitor who opens dozens of
  // products still costs a few dozen numbers, and the search keys are bounded
  // by the debounce upstream rather than by keystrokes.
  return true;
}

export function trackProductClick(
  productId: string,
  // `visit`/`session`/`search` are the three non-product kinds and `page` /
  // `ref-*` / `search-*` are their sources; BOTH servers reject every one of
  // them on a product click by VALUE. Excluding them here makes the compiler
  // enforce what the wire enforces, instead of a call site finding out via
  // silent 204s. (`"search"` the SOURCE survives — a click on a search result
  // is a real product click; only `"search-hit"`/`"search-miss"` are removed.)
  kind: Exclude<TrackKind, "visit" | "session" | "search">,
  source: Exclude<
    TrackSource,
    "page" | `ref-${string}` | `search-${string}`
  > = "grid",
) {
  if (typeof window === "undefined" || !productId) return;
  if (!shouldSend(`${productId}:${kind}:${source}`)) return;
  send(productId, kind, source);
}

/**
 * The fixed non-product subject. Not a product id: the Pages function accepts
 * it ONLY with kind "session"/"search" (and "visit", for pings emitted before
 * page slugs existed), so a product click can never smuggle it and a visit can
 * never masquerade as product interest.
 */
const SITE_ID = "site";

/**
 * pathname → page constant. A LITERAL map, deliberately: it is the whole
 * mechanism behind "no path is ever transmitted". Anything not listed here is
 * `pg-other`, so a new route starts out counted-but-unnamed rather than
 * leaking its path.
 *
 * ⚠️ The panel keeps a duplicate of the VALUES as its validation allowlist.
 * A value added here and not there is dropped in silence at ingest.
 */
const PAGE_SLUG_BY_PATH: Readonly<Record<string, PageSlug>> = {
  "/": "pg-home",
  "/streaming-apps/": "pg-streaming-apps",
  "/ai-apps/": "pg-ai-apps",
  "/premium-vpn-apps/": "pg-premium-vpn-apps",
  "/mobile-data/": "pg-mobile-data",
  "/music-apps/": "pg-music-apps",
  "/creative-apps/": "pg-creative-apps",
  "/payment/": "pg-payment",
  "/order/": "pg-order",
  "/reviews/": "pg-reviews",
  "/bioscope-download/": "pg-bioscope-download",
  "/expressvpn-location-guide/": "pg-expressvpn-guide",
  "/terms-of-service/": "pg-terms",
  "/terms-of-service-vpn/": "pg-terms-vpn",
  "/404/": "pg-404",
};

/**
 * Which page this is, as one of sixteen constants. Pure and exported so the
 * contract check and a future test can call it without a DOM.
 *
 * The query string and the hash are cut off BEFORE the lookup and never
 * reach a payload — that is the point of the function, not an optimisation.
 * The path is normalised to the one form the map is keyed on (lower case, a
 * leading slash, one trailing slash, `.html` folded away) because this site is
 * served with trailing slashes but a hand-typed, app-rewritten or legacy
 * `.html` URL arrives without one, and an unnormalised miss would report
 * `pg-other` for a page we can perfectly well name.
 *
 * ⚠️ `pg-404` is only reached by a direct hit on `/404/`. A 404 RENDERED at an
 * unknown path reports `pg-other`, because the slug is derived from the
 * pathname alone and that pathname is arbitrary — `not-found.tsx` would have to
 * pass `"pg-404"` to `trackSiteVisit()` explicitly for the honest count. Do not
 * "fix" this by transmitting the unknown path.
 */
export function pageSlug(pathname?: string): PageSlug {
  const raw =
    typeof pathname === "string"
      ? pathname
      : typeof window === "undefined"
        ? "/"
        : window.location.pathname;
  let path = raw.toLowerCase();
  const cut = path.search(/[?#]/);
  if (cut !== -1) path = path.slice(0, cut);
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.endsWith(".html")) path = `${path.slice(0, -5)}/`;
  if (!path.endsWith("/")) path = `${path}/`;
  return PAGE_SLUG_BY_PATH[path] ?? "pg-other";
}

/**
 * Host suffix → referrer bucket. Matched as `host === suffix` or
 * `host.endsWith("." + suffix)`, which is what folds `www.`, `m.`, `l.`, `vt.`
 * and `web.` sub-domains into their parent without a per-host entry.
 */
const REFERRER_HOSTS: ReadonlyArray<readonly [string, RefBucket]> = [
  ["pstorebynamso.com", "ref-internal"],
  ["facebook.com", "ref-facebook"],
  ["fb.com", "ref-facebook"],
  ["messenger.com", "ref-messenger"],
  ["t.me", "ref-telegram"],
  ["telegram.org", "ref-telegram"],
  ["tiktok.com", "ref-tiktok"],
  ["googleusercontent.com", "ref-google"],
  ["googleadservices.com", "ref-google"],
];

/**
 * Google ships one host per country TLD (google.com, google.com.mm,
 * google.co.uk …), which no literal list can keep up with — so this one bucket
 * is a shape test instead of an entry. It still only ever answers yes/no.
 */
const GOOGLE_HOST_RE = /(^|\.)google\.[a-z]{2,}(\.[a-z]{2,})?$/;

/**
 * Where the visitor came from, as ONE of eight constants. Pure and exported so
 * the contract check and a future test can call it without a DOM.
 *
 * ⚠️ READS the referrer, NEVER sends it. The `new URL()` below exists only to
 * get at `.hostname`; the URL object is dropped on the next line and the host,
 * the path, the query string and any UTM parameter never leave this function.
 * A host we do not recognise becomes the single constant "ref-other" — do not
 * replace that with the host itself, it is the whole reason this is a bucket.
 */
export function referrerBucket(referrer?: string): RefBucket {
  const raw =
    typeof referrer === "string"
      ? referrer
      : typeof document === "undefined"
        ? ""
        : document.referrer;
  if (!raw) return "ref-direct";
  let host = "";
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    // An unparseable referrer is not worth guessing at, and guessing would
    // mean looking at the string itself.
    return "ref-other";
  }
  if (!host) return "ref-other";
  if (GOOGLE_HOST_RE.test(host)) return "ref-google";
  for (const [suffix, bucket] of REFERRER_HOSTS) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return bucket;
  }
  return "ref-other";
}

/** One ping per FULL page load, guarded by module state alone. */
let visitSent = false;

/**
 * Count one site visit — the same payload shape, the same promise.
 *
 * "Visit" here means a full page load of the site: the guard is a module
 * variable, so client-side navigations inside one load never re-fire, and no
 * cookie/storage of any kind marks the visitor (the same construction-level
 * privacy claim `trackProductClick` makes). A visitor who returns in a new
 * tab or later in the day counts again — the number is a page-load count that
 * approximates visits, and the panel labels it as such. `trackSession` is the
 * per-session counterpart; the two are reported separately on purpose, because
 * neither one alone is an honest answer to "how many people came".
 *
 * `explicit` exists for the one page that cannot name itself from its
 * pathname — the 404 route. Nothing else should pass it.
 */
export function trackSiteVisit(explicit?: PageSlug) {
  if (typeof window === "undefined" || visitSent) return;
  visitSent = true;
  send(explicit ?? pageSlug(), "visit", "page");
}

/**
 * The one storage key this site writes for analytics. A boolean flag, value
 * "1", scoped to the tab. Never read into a payload — see the header.
 */
const SESSION_KEY = "ps-seen";

/** One session ping per module lifetime, before the storage flag is consulted. */
let sessionSent = false;

/**
 * Count one browser SESSION — the first page load of a visit, with a coarse
 * referrer bucket so the owner can see roughly where people arrive from.
 *
 * ⚠️ `sessionStorage` can THROW on access, not just return null: Safari's
 * private mode and a browser with site data blocked both do it, and one
 * uncaught throw here would take the whole page down for exactly the visitors
 * least willing to be counted. A throw therefore means "do not count a
 * session" and nothing else. Same for `setItem`, which can throw on quota
 * after `getItem` succeeded — that path must also just walk away.
 */
export function trackSession() {
  if (typeof window === "undefined" || sessionSent) return;
  sessionSent = true;
  try {
    const store = window.sessionStorage;
    if (store.getItem(SESSION_KEY)) return;
    store.setItem(SESSION_KEY, "1");
  } catch {
    return;
  }
  send(SITE_ID, "session", referrerBucket());
}

/**
 * Normalise a search term to the ONLY shape allowed on the wire, byte for byte
 * the same rules the Pages function and the panel re-apply (never trust the
 * client, and never let the three drift).
 *
 * Keeping only `[a-z0-9 ._+-]` is what makes the panel's `web_searches.q`
 * column safe: no markup, no control characters, no unicode homographs, no
 * direction marks. ⚠️ It also means a Burmese query is stripped to nothing and
 * is therefore NEVER SENT AT ALL — `trackSearch` returns early below 2
 * characters. That is a real gap in the "what did they search for" report and
 * it is deliberate; widening the class is a panel-side decision, not a
 * storefront one.
 */
/**
 * ⛔ CONTACT-DETAIL GUARD, two rules against two different inputs.
 *
 * The character class keeps the value safe to store and render; this is what
 * keeps it from being an IDENTIFIER. A search box accepts anything, and a
 * customer who pastes a phone number or an email into it would otherwise have
 * it kept for 14 days and printed on an admin page.
 *
 *   - `@` is tested against the RAW input, BEFORE filtering. The class strips
 *     "@" itself, so by the time the term is clean an address has already lost
 *     the one character that identifies it as one.
 *   - seven or more digits is tested against the filtered term with its
 *     separators removed, because "0977 123 4567" is a phone number and
 *     /[0-9]{7,}/ does not match it while the spaces are still there.
 *
 * Deliberately NOT banned: "gmail", "yahoo", "hotmail". This shop SELLS
 * accounts for those, so "gmail" is a product search — banning the word would
 * delete the very signal this feature exists to collect.
 *
 * A match drops the term WHOLE rather than masking it: a partly-redacted phone
 * number is still a phone number. The search is still COUNTED — the event goes
 * out without `q` — so the volume graph never disagrees with the term table.
 */
const AT_SIGN = /@/;
const SEPARATORS = /[ ._+-]/g;
const LONG_DIGITS = /[0-9]{7,}/;

export function normalizeSearchQuery(raw: string): string {
  const rawText = String(raw ?? "").trim().toLowerCase();
  if (AT_SIGN.test(rawText)) return "";
  const q = rawText
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ._+-]/g, "")
    .slice(0, 40)
    .trim();
  if (LONG_DIGITS.test(q.replace(SEPARATORS, ""))) return "";
  return q;
}

/**
 * Count one SETTLED search query — never one per keystroke. The caller
 * debounces (see ProductSearch); this function is the second guard: the
 * existing 1.5 s dedupe map is keyed on the NORMALISED query alone, so a term
 * that flips from miss to hit as the catalog finishes loading still counts
 * once.
 *
 * `found` becomes `search-hit` / `search-miss`. A repeated miss is the point
 * of the whole feature: it names a product the shop does not stock yet.
 */
export function trackSearch(query: string, found: boolean) {
  if (typeof window === "undefined") return;
  const q = normalizeSearchQuery(query);
  // ⚠️ An unusable term does NOT cancel the event — it sends WITHOUT `q`.
  //
  // Most searches on this site are typed in Burmese, and Burmese filters down
  // to "" by design (the character class is what makes the stored column
  // safe). Returning early here would have made "how many people searched
  // this week" a count of LATIN searches only, silently, on a Myanmar
  // storefront — and the panel's own comment promises the opposite: the term
  // may be refused, the search is still counted. The panel and the Pages
  // function both accept a `search` event with no `q` for exactly this.
  const usable = q.length >= 2;
  // Dedupe on the term when there is one, and on the outcome when there is
  // not, so a customer retyping the same Burmese word does not count twice.
  if (!shouldSend(usable ? `search:${q}` : `search:_:${found}`)) return;
  send(
    SITE_ID,
    "search",
    found ? "search-hit" : "search-miss",
    usable ? q : undefined,
  );
}

/**
 * The ONE place a payload is built. Four fields at most: three enum-ish
 * constants plus `q`, the normalised search text, which is present for kind
 * "search" alone. Nothing read from storage and nothing derived from the
 * referrer can reach this object — `referrerBucket()` hands over one of eight
 * constants and the `ps-seen` flag is never passed in at all.
 */
function send(id: string, kind: TrackKind, source: TrackSource, q?: string) {
  const body = JSON.stringify(
    q === undefined ? { id, kind, source } : { id, kind, source, q },
  );

  try {
    // `sendBeacon` survives the navigation this click usually starts, which a
    // plain fetch does not. Same-origin, so the JSON content type needs no
    // preflight. A false return means the queue was full — fall through.
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: "application/json" }),
      )
    ) {
      return;
    }
  } catch {
    // fall through to fetch
  }

  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  } catch {
    // Counting is a nicety. Never let it reach the customer.
  }
}
