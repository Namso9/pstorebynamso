import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  onRequestGet as canonicalImageGet,
  onRequestHead as canonicalImageHead,
} from "../functions/images/[name].js";
import { onRequestGet as legacyImageGet } from "../functions/img/[name].js";

const root = process.cwd();
const reviews = JSON.parse(await readFile(path.join(root, "data/reviews.json"), "utf8"));
const publicReviews = JSON.parse(
  await readFile(path.join(root, "public/data/reviews.json"), "utf8"),
);
const canonicalPath = /^images\/review(\d+)\.(webp|jpg|jpeg|png)$/i;

assert.deepEqual(publicReviews, reviews, "root/public reviews.json must match");
assert.ok(reviews.images.length >= 31, "the migrated 31 reviews must remain present");
assert.ok(reviews.images.every((item) => canonicalPath.test(item)));

const numbers = reviews.images.map((item) => Number(item.match(canonicalPath)[1]));
assert.equal(new Set(numbers).size, numbers.length, "review numbers must be unique");
assert.equal(numbers.at(-1), Math.max(...numbers), "highest review must be listed last");
assert.ok(numbers.includes(31), "review31 migration must remain present");

const rootReviewNames = (await readdir(path.join(root, "images")))
  .filter((name) => /^review\d+\.(webp|jpe?g|png)$/i.test(name))
  .sort();
const publicReviewNames = (await readdir(path.join(root, "public/images")))
  .filter((name) => /^review\d+\.(webp|jpe?g|png)$/i.test(name))
  .sort();
assert.deepEqual(publicReviewNames, rootReviewNames, "static review mirrors must match");
assert.deepEqual(
  await readFile(path.join(root, "public/images/review31.webp")),
  await readFile(path.join(root, "images/review31.webp")),
  "review31 static mirror must be byte-identical",
);

const originalFetch = globalThis.fetch;
try {
  let upstreamUrl = "";
  let assetCalls = 0;
  globalThis.fetch = async (url) => {
    upstreamUrl = String(url);
    return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
  };
  const env = {
    ASSETS: {
      fetch: async () => {
        assetCalls += 1;
        return new Response("static", { status: 200 });
      },
    },
  };
  const canonicalCtx = {
    params: { name: "review31.webp" },
    request: new Request("https://example.test/images/review31.webp?v=2"),
    env,
  };
  const canonical = await canonicalImageGet(canonicalCtx);
  assert.equal(canonical.status, 200);
  assert.equal(canonical.headers.get("content-type"), "image/webp");
  assert.equal(canonical.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(canonical.headers.get("x-image-source"), "github-live");
  assert.match(upstreamUrl, /\/images\/review31\.webp\?v=\d+$/);
  assert.equal(assetCalls, 0);

  const head = await canonicalImageHead(canonicalCtx);
  assert.equal(head.status, 200);
  assert.equal((await head.arrayBuffer()).byteLength, 0);

  upstreamUrl = "";
  const unrelated = await canonicalImageGet({
    params: { name: "brand-logo.png" },
    request: new Request("https://example.test/images/brand-logo.png"),
    env,
  });
  assert.equal(await unrelated.text(), "static");
  assert.equal(upstreamUrl, "", "unrelated images must not be proxied through GitHub");

  globalThis.fetch = async () => new Response("missing", { status: 404 });
  const fallback = await canonicalImageGet(canonicalCtx);
  assert.equal(await fallback.text(), "static", "GitHub failure must use build snapshot");
  assert.equal(fallback.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(fallback.headers.get("x-image-source"), "static-fallback");

  globalThis.fetch = async (url) => {
    upstreamUrl = String(url);
    return new Response(new Uint8Array([4]), { status: 200 });
  };
  const legacy = await legacyImageGet({ params: { name: "review-123.webp" } });
  assert.equal(legacy.status, 200);
  assert.ok(upstreamUrl.endsWith("/images/uploads/review-123.webp"));
} finally {
  globalThis.fetch = originalFetch;
}

console.log(
  `Review flow check passed: ${reviews.images.length} canonical images (max ${Math.max(...numbers)}) + live/static routes.`,
);
