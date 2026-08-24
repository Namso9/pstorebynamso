/**
 * Anonymous product-interest counter.
 *
 * WHAT LEAVES THE BROWSER, exactly: a product id, which control was used, and
 * where on the site it was used. Nothing else. No customer identifier, no
 * cookie, no localStorage key, no referrer, no screen or device fingerprint,
 * no session id — so two clicks by the same visitor are indistinguishable from
 * two clicks by two visitors, by construction rather than by policy. The Pages
 * function forwards the same three fields, and what the panel keeps is a
 * per-minute COUNTER with no row per click and no column any identifier could
 * live in.
 *
 * Scope of that promise: the request itself still travels over HTTP, so the
 * network layer sees an address the way it does for every other request on the
 * site — see the note in functions/api/track.js. This is about the data, which
 * is the part a page can actually control.
 *
 * It exists to answer one question — which products did people actually reach
 * for this week — so the home page can rank the "Popular" row from behaviour
 * instead of a hand-picked list.
 *
 * Every failure is silent. A blocked beacon, an offline phone, an ad blocker
 * eating /api/*: none of it may ever surface to a customer or interrupt the
 * click that is being counted.
 */

const ENDPOINT = "/api/track";

/** Which control the visitor used. `checkout` is the stronger intent signal. */
export type TrackKind = "plans" | "checkout";

/**
 * Where on the site the click happened. `popular` is reported but deliberately
 * EXCLUDED from the ranking by the panel: counting clicks on the popular row
 * towards the popular row is a feedback loop that would freeze the top four in
 * place for as long as the site is up.
 */
export type TrackSource = "grid" | "popular" | "modal" | "search";

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
  // The map only ever holds one entry per product+control on one page view.
  // A visitor who opens dozens of products still costs a few dozen numbers.
  return true;
}

export function trackProductClick(
  productId: string,
  kind: TrackKind,
  source: TrackSource = "grid",
) {
  if (typeof window === "undefined" || !productId) return;
  if (!shouldSend(`${productId}:${kind}:${source}`)) return;

  const body = JSON.stringify({ id: productId, kind, source });

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
