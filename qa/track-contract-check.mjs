// The anonymous interest counter has three independent copies of one contract:
// the client beacon (src/services/track.ts), the Pages function that forwards it
// (functions/api/track.js), and the panel route that stores it. A drift between
// any two of them is SILENT — the beacon is fire-and-forget, so a rejected kind
// or source shows up as "the popular row stopped moving" weeks later, with no
// error anywhere. This pins the two halves that live in this repo, and asserts
// the exact strings the panel's own test pins on its side.
//
// It is also the enforcement behind track.ts's header doc-block, which is the
// site's only privacy statement about analytics. Two reads that were once flatly
// BANNED here — sessionStorage and document.referrer — are now allowed under
// owner-approved, narrow terms (§3a). The ban was NARROWED, not lifted: exactly
// one storage access holding one boolean under the key "ps-seen", exactly one
// referrer read living inside referrerBucket(), and neither may reach the
// payload. Do not relax §3a without changing that doc-block in the same edit.
//
//     node qa/track-contract-check.mjs

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const client = await readFile("src/services/track.ts", "utf8");
const fn = await readFile("functions/api/track.js", "utf8");
const popular = await readFile("src/components/catalog/PopularProducts.tsx", "utf8");
const card = await readFile("src/components/catalog/ProductCard.tsx", "utf8");
const modal = await readFile("src/components/catalog/PlanModal.tsx", "utf8");
const search = await readFile("src/components/catalog/ProductSearch.tsx", "utf8");
const visitPing = await readFile("src/components/common/VisitPing.tsx", "utf8");
const data = JSON.parse(await readFile("data/popular.json", "utf8"));
const proxy = await readFile("functions/data/[file].js", "utf8");
const prebuild = await readFile("scripts/sync-live-data.mjs", "utf8");

// What the panel accepts. Kept as literals on purpose: this file is the place a
// reviewer looks to see whether the three sides agree, so the third side's
// values have to be readable here rather than implied.
const PANEL_KINDS = ["plans", "checkout", "visit", "session", "search"];
const PANEL_SOURCES = [
  "grid", "popular", "modal", "search", "page",
  "ref-direct", "ref-internal", "ref-facebook", "ref-messenger",
  "ref-telegram", "ref-google", "ref-tiktok", "ref-other",
  "search-hit", "search-miss",
];
// The page slugs are a THIRD closed allowlist with three copies (client type,
// Pages function, panel `_PAGE_IDS`). A slug one side does not know is dropped
// there in silence, which is the same failure this whole file exists to catch.
const PANEL_PAGE_IDS = [
  "pg-home", "pg-streaming-apps", "pg-ai-apps", "pg-premium-vpn-apps",
  "pg-mobile-data", "pg-music-apps", "pg-creative-apps", "pg-payment",
  "pg-order", "pg-reviews", "pg-bioscope-download", "pg-expressvpn-guide",
  "pg-terms", "pg-terms-vpn", "pg-404", "pg-other",
];

// Digits and hyphens are part of these enums now ("pg-404", "search-hit"), so
// the extractors below match [a-z0-9-] — a narrower class silently returned a
// SHORTER list and the deepEqual would then fail for the wrong reason.
function tsUnion(source, typeName) {
  const match = new RegExp(
    `export type ${typeName} =([\\s\\S]*?);`,
  ).exec(source);
  assert.ok(match, `${typeName} not found`);
  return [...match[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]).sort();
}

function jsArray(source, name) {
  const match = new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`).exec(source);
  assert.ok(match, `${name} not found`);
  return [...match[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]).sort();
}

/** Counting, not testing: several rules below are "exactly once", not "present". */
function occurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

/**
 * The text of one top-level function, comments already stripped. Used to prove
 * WHERE something is read, not just that it is read — `document.referrer` is
 * allowed in `referrerBucket` and banned in `send`, and only an extraction can
 * tell those two apart.
 */
function functionBody(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start !== -1, `${signature} not found`);
  const end = source.indexOf("\n}", start);
  assert.ok(end !== -1, `${signature} is not a top-level function any more`);
  return source.slice(start, end + 2);
}

// ── 1. the three sides agree on both enums ────────────────────────────────
assert.deepEqual(
  tsUnion(client, "TrackKind"),
  [...PANEL_KINDS].sort(),
  "client TrackKind and the panel's _CLICK_KINDS disagree",
);
assert.deepEqual(
  jsArray(fn, "KINDS"),
  [...PANEL_KINDS].sort(),
  "the Pages function's KINDS and the panel's _CLICK_KINDS disagree",
);
assert.deepEqual(
  tsUnion(client, "TrackSource"),
  [...PANEL_SOURCES].sort(),
  "client TrackSource and the panel's _CLICK_SOURCES disagree",
);
assert.deepEqual(
  jsArray(fn, "SOURCES"),
  [...PANEL_SOURCES].sort(),
  "the Pages function's SOURCES and the panel's _CLICK_SOURCES disagree",
);
assert.deepEqual(
  tsUnion(client, "PageSlug"),
  [...PANEL_PAGE_IDS].sort(),
  "client PageSlug and the panel's _PAGE_IDS disagree",
);
assert.deepEqual(
  jsArray(fn, "PAGE_IDS"),
  [...PANEL_PAGE_IDS].sort(),
  "the Pages function's PAGE_IDS and the panel's _PAGE_IDS disagree",
);
// The three per-kind source sets are subsets of SOURCES, and the function
// validates against them individually — a value in SOURCES but in none of the
// four sets would pass the outer gate and be rejected by every branch.
assert.deepEqual(
  jsArray(fn, "REF_SOURCES"),
  PANEL_SOURCES.filter((s) => s.startsWith("ref-")).sort(),
  "the Pages function's REF_SOURCES is not the eight ref-* values",
);
assert.deepEqual(
  jsArray(fn, "SEARCH_SOURCES"),
  ["search-hit", "search-miss"],
  "the Pages function's SEARCH_SOURCES is not the two search-* values",
);
assert.deepEqual(
  jsArray(fn, "PRODUCT_SOURCES"),
  ["grid", "modal", "popular", "search"],
  "the Pages function's PRODUCT_SOURCES is not the four in-site click sources",
);

// ── 2. the id shape is identical on both sides of the wire ────────────────
// Compared as REGEX SOURCE, not as an identifier: matching the name
// `POPULAR_ID_RE` passed no matter what pattern was assigned to it, which is
// exactly the silent drift this file claims to catch.
function regexSource(source, name, kind) {
  const pattern = kind === "ts"
    ? new RegExp(`const ${name} = /(?<body>[^\\n]+?)/;`)
    : new RegExp(`const ${name} = /(?<body>[^\\n]+?)/;`);
  const match = pattern.exec(source);
  assert.ok(match, `${name} is not a plain regex literal any more`);
  return match.groups.body;
}
const content = await readFile("src/services/content.ts", "utf8");
const parserId = regexSource(content, "POPULAR_ID_RE", "ts");
const functionId = regexSource(fn, "ID_RE", "js");
assert.equal(
  parserId,
  functionId,
  `the id grammar differs: parser /${parserId}/ vs function /${functionId}/`,
);
// And it is the grammar the panel pins on its side.
assert.equal(parserId, "^[A-Za-z0-9_-]{1,60}$");
// Both must actually accept and reject the same things, so the sources being
// equal is checked by behaviour too — a copied-but-flag-changed regex passes
// a string comparison.
const live = new RegExp(parserId);
for (const good of ["netflix_tv", "atom-data", "a", "A9_-"]) {
  assert.ok(live.test(good), `${good} must be accepted`);
}
for (const bad of ["", "a b", "a/b", "a".repeat(61), "café"]) {
  assert.ok(!live.test(bad), `${bad} must be rejected`);
}

// ── 3. nothing identifying is ever sent ──────────────────────────────────
// The payload is built in exactly one place; assert it by shape, not by hope.
// Four kinds send three fields; `search` alone adds the normalised query.
const bodyMatch =
  /JSON\.stringify\(\s*q === undefined \? \{ id, kind, source \} : \{ id, kind, source, q \},?\s*\)/
    .exec(client);
assert.ok(bodyMatch, "the beacon payload is no longer exactly {id, kind, source(, q)}");

/** Comments are stripped first: the privacy note NAMES what it does not read. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const clientCode = stripComments(client);
const fnCode = stripComments(fn);

for (const banned of [
  "document.cookie",
  "localStorage",
  "navigator.userAgent",
  "screen.",
]) {
  assert.ok(
    !clientCode.includes(banned),
    `src/services/track.ts must never read ${banned}`,
  );
}
assert.ok(
  !fnCode.includes("cf-connecting-ip") && !fnCode.includes("User-Agent"),
  "functions/api/track.js must never forward an identifier",
);

// ── 3a. the two reads that ARE allowed, and their exact limits ───────────
// `sessionStorage` and `document.referrer` were both on the banned list until
// the session ping existed. The owner approved exactly two narrow uses, so the
// ban is NARROWED, not lifted: each is allowed once, in one named place, and
// neither may reach the payload. The header doc-block of track.ts is the site's
// only privacy statement about analytics — these asserts are what keep it true.
const sendBody = functionBody(clientCode, "function send(");
const bucketBody = functionBody(clientCode, "export function referrerBucket(");

assert.equal(
  occurrences(clientCode, "sessionStorage"),
  1,
  "track.ts may touch sessionStorage exactly once — one boolean, one place",
);
assert.ok(
  /const SESSION_KEY = "ps-seen";/.test(client),
  'the session flag must be the literal key "ps-seen", named once as a const',
);
assert.equal(
  occurrences(clientCode, '"ps-seen"'),
  1,
  "the key literal must appear only in the SESSION_KEY const",
);
assert.ok(
  /try \{\s*const store = window\.sessionStorage;\s*if \(store\.getItem\(SESSION_KEY\)\) return;\s*store\.setItem\(SESSION_KEY, "1"\);\s*\} catch \{/
    .test(clientCode),
  "the storage access must be get-then-set on SESSION_KEY inside a try/catch — " +
    "access THROWS in private mode, and a throw must mean 'do not count a " +
    "session', never a broken page",
);
for (const leak of ["ps-seen", "SESSION_KEY", "sessionStorage"]) {
  assert.ok(
    !sendBody.includes(leak),
    `send() must never see ${leak} — the session flag is stored, never sent`,
  );
}

assert.equal(
  occurrences(clientCode, "document.referrer"),
  1,
  "track.ts may read document.referrer exactly once",
);
assert.ok(
  bucketBody.includes("document.referrer"),
  "the one referrer read must live in referrerBucket(), nowhere else",
);
assert.ok(
  !sendBody.includes("referrer") && !sendBody.includes("hostname"),
  "send() must never see the referrer or a host — only the ref-* constant",
);
assert.ok(
  /return "ref-other";/.test(client) && !/return host/.test(clientCode),
  "an unrecognised referrer must collapse to the ref-other CONSTANT; " +
    "returning the host itself would transmit the site they came from",
);
// Same rule for the page ping: a pathname is read, a constant is sent.
assert.ok(
  !sendBody.includes("pathname") && !sendBody.includes("location"),
  "send() must never see a path — pageSlug() hands it one of 16 constants",
);
assert.ok(
  /PAGE_SLUG_BY_PATH\[path\] \?\? "pg-other"/.test(client),
  "an unknown path must fall back to pg-other, never be transmitted",
);
// Both derivations must be callable without a DOM, or nothing can test them.
assert.ok(
  /export function pageSlug\(pathname\?: string\)/.test(client) &&
    /export function referrerBucket\(referrer\?: string\)/.test(client),
  "pageSlug() and referrerBucket() must stay pure, exported and injectable",
);

// ── 3c. the search term is the only free text on the wire ────────────────
// It reaches the panel's only TEXT column, so both sides normalise it with the
// SAME rules and the server never trusts the client's copy. Drift here means
// markup or control characters in a column a human reads.
for (const [name, source] of [["track.ts", client], ["track.js", fn]]) {
  assert.ok(
    source.includes("[^a-z0-9 ._+-]") && source.includes(".slice(0, 40)"),
    `${name} must keep the shared q normaliser: [a-z0-9 ._+-], 40 chars`,
  );
}
// The CONTACT-DETAIL guard, in both copies. The character class makes the
// term safe to store; this is what keeps it from being an identifier. A
// customer who pastes "09771234567" into the search box survives the class
// untouched, so without this the panel's text column collects phone numbers.
for (const [name, source] of [["track.ts", client], ["track.js", fn]]) {
  // Two rules against two different inputs, and BOTH matter:
  //   · "@" against the RAW input — the character class strips "@" itself, so
  //     testing the cleaned term would never see an address.
  //   · 7+ digits against the cleaned term with SEPARATORS REMOVED — otherwise
  //     "0977 123 4567" walks straight through /[0-9]{7,}/.
  assert.ok(
    /const AT_SIGN = \/@\//.test(source) &&
      /const SEPARATORS = \/\[ \._\+-\]\/g;/.test(source) &&
      /const LONG_DIGITS = \/\[0-9\]\{7,\}\//.test(source),
    `${name} must carry both contact-detail guards`,
  );
  assert.ok(
    /AT_SIGN\.test\(rawText\)/.test(source),
    `${name} must test "@" against the RAW input, before the character filter`,
  );
  assert.ok(
    /LONG_DIGITS\.test\(q\.replace\(SEPARATORS, ['"]{2}\)\)/.test(source),
    `${name} must strip separators before the long-digit test`,
  );
  // NOT banned, on purpose: this shop sells accounts for these providers, so
  // they are product searches, not contact details.
  assert.ok(
    !/\\bgmail\\b/.test(source),
    `${name} must not ban "gmail" — it is a product this shop sells`,
  );
}
// An unusable term must not be SENT as `q` — but it must not cancel the event
// either. Burmese filters to "" by design, and returning early made the whole
// search-volume number a count of Latin searches only, on a Myanmar
// storefront. The event goes out without `q`; the panel counts it and skips
// the term.
assert.ok(
  /const usable = q\.length >= 2;/.test(client) &&
    /usable \? q : undefined,/.test(client),
  "an unusable search term must be omitted from the payload, not suppress the event",
);
assert.ok(
  !/if \(q\.length < 2\) return;/.test(client),
  "trackSearch must no longer drop the whole event for an unusable term",
);
assert.ok(
  /q = normalizeQuery\(payload\.q\);/.test(fn),
  "the Pages function must re-normalise q server-side, never trust the client",
);
assert.ok(
  /const forwarded = \{ id, kind, source \};/.test(fn) &&
    /if \(kind === 'search' && q\) forwarded\.q = q;/.test(fn) &&
    /body: JSON\.stringify\(forwarded\),/.test(fn),
  "the forwarded body must be {id, kind, source} plus q for search only",
);

// ── 3b. the four kinds cannot mix, on either side ────────────────────────
// The wire shape is shared, so the separation is enforced by VALUE, per kind
// and in the panel's own order: each non-product kind owns a closed id/source
// pair, and a product click may borrow neither a reserved id nor any of their
// sources. Losing one direction lets one counter contaminate another.
assert.ok(
  /if \(kind === 'visit'\) \{[\s\S]*?if \(id !== SITE_ID && PAGE_IDS\.indexOf\(id\) === -1\) return noContent\(\);\s*if \(source !== 'page'\) return noContent\(\);/
    .test(fn),
  "a visit must be {site|pg-*, visit, page} and nothing else",
);
assert.ok(
  /\} else if \(kind === 'session'\) \{\s*if \(id !== SITE_ID\) return noContent\(\);\s*if \(REF_SOURCES\.indexOf\(source\) === -1\) return noContent\(\);/
    .test(fn),
  "a session must be {site, session, ref-*} and nothing else",
);
assert.ok(
  /\} else if \(kind === 'search'\) \{\s*if \(id !== SITE_ID\) return noContent\(\);\s*if \(SEARCH_SOURCES\.indexOf\(source\) === -1\) return noContent\(\);/
    .test(fn),
  "a search must be {site, search, search-hit|search-miss} and nothing else",
);
assert.ok(
  /\} else \{[\s\S]*?if \(id === SITE_ID \|\| id\.indexOf\('pg-'\) === 0\) return noContent\(\);\s*if \(PRODUCT_SOURCES\.indexOf\(source\) === -1\) return noContent\(\);/
    .test(fn),
  "a product click must never carry a reserved id or a non-product source",
);
// The catalog fetch is the one expensive check, so it must run for product
// clicks ONLY — the other three kinds are bounded by closed allowlists and a
// subrequest per page load would buy nothing.
assert.equal(
  occurrences(fn, "await isKnownProduct"),
  1,
  "isKnownProduct must be called exactly once",
);
assert.ok(
  fn.indexOf("id.indexOf('pg-') === 0") < fn.indexOf("await isKnownProduct"),
  "isKnownProduct must run inside the product branch only",
);
assert.ok(
  /const MAX_BODY = 768;/.test(fn),
  "MAX_BODY must be 768 — 512 no longer fits the optional q field",
);

// The client fires the visit once per full page load, from module state; the
// session once per browser session, behind the one storage flag (3a).
assert.ok(
  /let visitSent = false;/.test(client) &&
    /send\(explicit \?\? pageSlug\(\), "visit", "page"\)/.test(client),
  "trackSiteVisit must send a pg-* slug with the fixed source behind a module once-guard",
);
assert.ok(
  /let sessionSent = false;/.test(client) &&
    /send\(SITE_ID, "session", referrerBucket\(\)\)/.test(client),
  "trackSession must send {site, session, ref-*} behind a module once-guard",
);
assert.ok(
  /send\(\s*SITE_ID,\s*"search",\s*found \? "search-hit" : "search-miss",\s*usable \? q : undefined,\s*\)/.test(
    client,
  ),
  "trackSearch must send {site, search, search-hit|search-miss} plus q ONLY when the term is usable",
);
const layout = await readFile("src/app/layout.tsx", "utf8");
assert.ok(
  layout.includes("<VisitPing />"),
  "the root layout must mount VisitPing, or visits silently stop counting",
);
// Session FIRST: it is counted at most once per browser session, so if only
// one of the two beacons survives a page already navigating away, the arrival
// is the one worth keeping. The visit ping gets another chance next page load.
assert.ok(
  visitPing.indexOf("trackSession();") !== -1 &&
    visitPing.indexOf("trackSession();") < visitPing.indexOf("trackSiteVisit();"),
  "VisitPing must call trackSession() before trackSiteVisit()",
);

// ── 4. an unconfigured panel is a silent no-op, never a 5xx ──────────────
assert.ok(
  /if \(!env\.PANEL_CLICK_URL \|\| !env\.PANEL_INGEST_TOKEN\) return noContent\(\);/
    .test(fn),
  "the forward must be gated on both variables being set",
);
// And that gate must come BEFORE the catalog fetch, or the documented
// "disabled" state quietly does a live-JSON read per click for no output.
assert.ok(
  fn.indexOf("!env.PANEL_CLICK_URL") < fn.indexOf("await isKnownProduct"),
  "the disabled check must short-circuit before any catalog validation",
);
assert.equal(
  (fn.match(/return noContent\(\)/g) || []).length >= 7,
  true,
  "every path in the track function must answer 204",
);
assert.ok(
  !/status:\s*(4|5)\d\d/.test(fn),
  "the track function must never answer 4xx/5xx to a beacon",
);
// No internal hostname or path may be committed to this public repo.
assert.ok(
  !/admin\.|internal\/web-/.test(fnCode),
  "functions/api/track.js must not name the panel's host or path",
);

// ── 5. the popular row cannot feed its own ranking ───────────────────────
assert.ok(
  /trackProductClick\(product\.id, "plans", "popular"\)/.test(popular),
  "the popular row must report source=popular so the panel can exclude it",
);
assert.ok(
  /trackProductClick\(product\.id, "plans", "grid"\)/.test(card),
  "the product grid must report source=grid",
);
assert.ok(
  /trackProductClick\(productId, "checkout", "modal"\)/.test(modal),
  "the plan modal must report the checkout intent",
);
assert.ok(
  /trackProductClick\(product\.id, "plans", "search"\)/.test(search),
  "a search result click must be counted too",
);
// One wrapper, so a future plan renderer cannot forget to count.
assert.equal(
  (modal.match(/trackProductClick\(/g) || []).length,
  1,
  "PlanModal must keep exactly one tracking call (the handleCheckout wrapper)",
);

// ── 5b. the search event fires on a SETTLED query, never per keystroke ───
// "netflix" typed at speed is seven prefixes, six of them misses. Reporting
// those would drown the zero-result report — the one report that names a
// product worth stocking — and multiply the panel's rows by word length.
const settleMatch = /const SEARCH_SETTLE_MS = (\d+);/.exec(search);
assert.ok(settleMatch, "ProductSearch must name its debounce as a constant");
assert.ok(
  Number(settleMatch[1]) >= 600,
  `the search debounce must be >= 600ms, found ${settleMatch[1]}ms`,
);
assert.equal(
  (search.match(/trackSearch\(/g) || []).length,
  1,
  "ProductSearch must report the query from exactly one place",
);
assert.ok(
  /setTimeout\(\s*\(\) => \{\s*trackSearch\(term, resultCount > 0\);\s*\}, SEARCH_SETTLE_MS\)/
    .test(search),
  "trackSearch must run from the debounce timer, not from onChange",
);
assert.ok(
  /return \(\) => window\.clearTimeout\(timer\);/.test(search),
  "the timer must be cleared on every re-run, or the debounce is a per-keystroke fire",
);
assert.ok(
  /if \(!open \|\| !catalog \|\| !term\.trim\(\)\) return;/.test(search),
  "an empty box, a closed dialog or an unloaded catalog must report nothing — " +
    "without the catalog guard every query looks like a miss",
);

// ── 6. popular.json is wired into every path it needs ────────────────────
assert.deepEqual(Object.keys(data).sort(), ["items", "updated", "window_days"]);
assert.ok(Array.isArray(data.items), "items must be an array");
assert.ok(
  !("clicks" in data) && !JSON.stringify(data).includes("count"),
  "the published file must never carry counts",
);
assert.ok(proxy.includes("'popular.json'"), "the live proxy whitelist is missing it");
assert.ok(
  prebuild.includes('"data/popular.json"'),
  "prebuild does not mirror it into public/, so the static fallback would 404",
);

console.log(
  "Track contract checks passed: " +
    `${PANEL_KINDS.length} kinds, ${PANEL_SOURCES.length} sources, ` +
    `${PANEL_PAGE_IDS.length} page slugs agree across client, Pages function ` +
    "and the panel's pinned values; " +
    `${data.items.length} ids published, no counts, no identifiers; ` +
    "one sessionStorage boolean that is never sent, one referrer read that " +
    "never leaves referrerBucket().",
);
