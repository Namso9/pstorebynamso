// The anonymous interest counter has three independent copies of one contract:
// the client beacon (src/services/track.ts), the Pages function that forwards it
// (functions/api/track.js), and the panel route that stores it. A drift between
// any two of them is SILENT — the beacon is fire-and-forget, so a rejected kind
// or source shows up as "the popular row stopped moving" weeks later, with no
// error anywhere. This pins the two halves that live in this repo, and asserts
// the exact strings the panel's own test pins on its side.
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
const data = JSON.parse(await readFile("data/popular.json", "utf8"));
const proxy = await readFile("functions/data/[file].js", "utf8");
const prebuild = await readFile("scripts/sync-live-data.mjs", "utf8");

// What the panel accepts. Kept as literals on purpose: this file is the place a
// reviewer looks to see whether the three sides agree, so the third side's
// values have to be readable here rather than implied.
const PANEL_KINDS = ["plans", "checkout"];
const PANEL_SOURCES = ["grid", "popular", "modal", "search"];

function tsUnion(source, typeName) {
  const match = new RegExp(
    `export type ${typeName} =([\\s\\S]*?);`,
  ).exec(source);
  assert.ok(match, `${typeName} not found`);
  return [...match[1].matchAll(/"([a-z]+)"/g)].map((m) => m[1]).sort();
}

function jsArray(source, name) {
  const match = new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`).exec(source);
  assert.ok(match, `${name} not found`);
  return [...match[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort();
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
const bodyMatch = /JSON\.stringify\(\{ id: productId, kind, source \}\)/.exec(client);
assert.ok(bodyMatch, "the beacon payload is no longer exactly {id, kind, source}");

/** Comments are stripped first: the privacy note NAMES what it does not read. */
const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const clientCode = stripComments(client);
const fnCode = stripComments(fn);

for (const banned of [
  "document.cookie",
  "localStorage",
  "sessionStorage",
  "navigator.userAgent",
  "document.referrer",
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
    `${PANEL_KINDS.length} kinds, ${PANEL_SOURCES.length} sources agree across ` +
    "client, Pages function and the panel's pinned values; " +
    `${data.items.length} ids published, no counts, no identifiers.`,
);
