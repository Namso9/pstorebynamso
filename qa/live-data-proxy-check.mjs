import assert from "node:assert/strict";

import {
  onRequestGet as getProducts,
  onRequestHead as headProducts,
} from "../functions/products.json.js";
import { onRequestGet as getData } from "../functions/data/[file].js";
import {
  LIVE_JSON_MAX_BYTES,
  LIVE_JSON_TTL_SECONDS,
} from "../functions/_shared/live-json.js";

const originalFetch = globalThis.fetch;
const originalNow = Date.now;
const calls = [];
const liveCatalog = JSON.stringify({ settings: {}, categories: [], products: [] });
const liveFaq = JSON.stringify({ "ai-apps": { title: "FAQ", items: [] } });

const env = {
  ASSETS: {
    fetch: async () =>
      new Response(JSON.stringify({ fallback: true }), {
        headers: { "Cache-Control": "public, max-age=86400" },
      }),
  },
};

try {
  Date.now = () => 1_786_110_000_000;
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    const body = String(url).includes("/data/") ? liveFaq : liveCatalog;
    return new Response(body, { status: 200 });
  };

  const productResponse = await getProducts({
    request: new Request("https://example.test/products.json"),
    env,
  });
  assert.equal(productResponse.headers.get("Cache-Control"), "no-store, max-age=0");
  assert.equal(productResponse.headers.get("X-Products-Source"), "github-live");
  assert.deepEqual(await productResponse.json(), JSON.parse(liveCatalog));

  const faqResponse = await getData({
    params: { file: "faq.json" },
    request: new Request("https://example.test/data/faq.json"),
    env,
  });
  assert.equal(faqResponse.headers.get("Cache-Control"), "no-store, max-age=0");
  assert.equal(faqResponse.headers.get("X-Data-Source"), "github-live");
  assert.deepEqual(await faqResponse.json(), JSON.parse(liveFaq));

  for (const call of calls) {
    const url = new URL(call.url);
    assert.equal(
      url.searchParams.get("pstore_live_rev"),
      String(Math.floor(Date.now() / (LIVE_JSON_TTL_SECONDS * 1000))),
    );
    assert.equal(call.options.cf.cacheTtl, LIVE_JSON_TTL_SECONDS);
    assert.equal(call.options.cf.cacheEverything, true);
    const requestHeaders = new Headers(call.options.headers);
    assert.equal(requestHeaders.get("Cache-Control"), "no-cache");
    assert.equal(requestHeaders.get("Pragma"), "no-cache");
  }

  const missing = await getData({
    params: { file: "private.json" },
    request: new Request("https://example.test/data/private.json"),
    env,
  });
  assert.equal(missing.status, 404);

  globalThis.fetch = async () => new Response("not-json", { status: 200 });
  const fallback = await getProducts({
    request: new Request("https://example.test/products.json"),
    env,
  });
  assert.equal(fallback.headers.get("X-Products-Source"), "static-fallback");
  assert.equal(fallback.headers.get("Cache-Control"), "no-store, max-age=0");
  assert.deepEqual(await fallback.json(), { fallback: true });

  globalThis.fetch = async () =>
    new Response("{}", {
      status: 200,
      headers: { "Content-Length": String(LIVE_JSON_MAX_BYTES + 1) },
    });
  const oversizedFallback = await getProducts({
    request: new Request("https://example.test/products.json"),
    env,
  });
  assert.equal(oversizedFallback.headers.get("X-Products-Source"), "static-fallback");
  assert.deepEqual(await oversizedFallback.json(), { fallback: true });

  const head = await headProducts({
    request: new Request("https://example.test/products.json", { method: "HEAD" }),
    env,
  });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("Cache-Control"), "no-store, max-age=0");
} finally {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
}

console.log("Live catalog/content proxy checks passed.");
