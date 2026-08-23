/**
 * Exercises the live link resolver against a fake vendor page.
 *
 * The resolver is the one piece of this feature that trusts a third party's
 * HTML, so the cases that matter are the hostile ones: a foreign host, a
 * filename that is not an installer, and a file the vendor lists but has not
 * uploaded. None of those may reach a download button.
 */
import assert from "node:assert/strict";

import { onRequestGet, onRequestHead } from "../functions/api/bioscope-links.js";

const LINK_PAGE = `
<a href="./download/Bioscope-Android-V9.9.9.apk">phone</a>
<a href="./download/Bioscope-Android-TV-V8.8.8.apk">tv</a>
<a href="./download/Bioscope-V7.7.7-F009.exe">win</a>
<a href="./download/Bioscope-V7.7.7-F009.zip">winzip</a>
<a href="https://evil.example/download/Bioscope-Android-V1.0.0.apk">nope</a>
`;
const MAC_PAGE = `<a href="/downloads/Bioscope-V6.6.6-F009.dmg">mac</a>`;

const originalFetch = globalThis.fetch;
const heads = [];

function mockVendor({ missing = new Set(), pageStatus = 200 } = {}) {
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    if ((options.method || "GET") === "HEAD") {
      heads.push(href);
      return new Response(null, { status: missing.has(href) ? 404 : 200 });
    }
    if (pageStatus !== 200) return new Response("", { status: pageStatus });
    if (href.startsWith("https://link.bioscopeapp.com/")) {
      return new Response(LINK_PAGE, { status: 200 });
    }
    if (href === "https://bioscopeapp.com/download-mac") {
      return new Response(MAC_PAGE, { status: 200 });
    }
    return new Response("", { status: 404 });
  };
}

const readResolved = async () => (await (await onRequestGet({})).json()).resolved;

try {
  // --- happy path -------------------------------------------------------
  mockVendor();
  const resolved = await readResolved();
  assert.deepEqual(resolved["android-phone-apk"], {
    href: "https://link.bioscopeapp.com/download/Bioscope-Android-V9.9.9.apk",
    version: "9.9.9",
  });
  assert.deepEqual(resolved["android-tv-apk"], {
    href: "https://link.bioscopeapp.com/download/Bioscope-Android-TV-V8.8.8.apk",
    version: "8.8.8",
  });
  assert.equal(resolved["windows-exe"].version, "7.7.7-F009");
  assert.equal(resolved["windows-zip"].version, "7.7.7-F009");
  assert.deepEqual(resolved["mac-dmg"], {
    href: "https://bioscopeapp.com/downloads/Bioscope-V6.6.6-F009.dmg",
    version: "6.6.6-F009",
  });
  assert.equal(Object.keys(resolved).length, 5, "no extra ids may appear");

  // The phone pattern must not swallow the TV build.
  assert.notEqual(
    resolved["android-phone-apk"].href,
    resolved["android-tv-apk"].href,
  );

  // Every resolved link was verified to exist before being published.
  for (const entry of Object.values(resolved)) {
    assert.ok(heads.includes(entry.href), `${entry.href} was not HEAD-checked`);
  }

  // A foreign host in the vendor's HTML is never resolved.
  for (const entry of Object.values(resolved)) {
    assert.ok(
      !entry.href.includes("evil.example"),
      "an off-allowlist host reached the response",
    );
  }

  // --- the vendor lists a file it has not uploaded ----------------------
  heads.length = 0;
  mockVendor({
    missing: new Set([
      "https://link.bioscopeapp.com/download/Bioscope-Android-V9.9.9.apk",
    ]),
  });
  const partial = await readResolved();
  assert.ok(
    !("android-phone-apk" in partial),
    "a 404 file must not be published as a resolved link",
  );
  assert.ok("android-tv-apk" in partial, "the other targets still resolve");

  // --- the vendor page is gone or redesigned ---------------------------
  mockVendor({ pageStatus: 503 });
  assert.deepEqual(
    await readResolved(),
    {},
    "an unreachable vendor page must resolve nothing, not throw",
  );

  globalThis.fetch = async () => {
    throw new Error("network down");
  };
  assert.deepEqual(await readResolved(), {}, "a network failure resolves nothing");

  // --- response shape ---------------------------------------------------
  mockVendor();
  const response = await onRequestGet({});
  assert.equal(
    response.headers.get("Content-Type"),
    "application/json; charset=utf-8",
  );
  assert.equal(response.headers.get("Cache-Control"), "public, max-age=300");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("X-Bioscope-Resolved"), "5");

  const head = await onRequestHead({});
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
} finally {
  globalThis.fetch = originalFetch;
}

// --- the client-side overlay -------------------------------------------
// Node strips the types itself, so the check runs against the real module the
// browser gets — no second copy of the policy to drift out of sync.
const { applyResolvedLinks, parseBioscopeResolvedLinks } = await import(
  "../src/services/bioscope-links.ts"
);

const pinned = [
  {
    id: "android-phone-apk",
    group: "phone",
    title: "Android Phone",
    kind: "apk",
    action: "get",
    href: "https://link.bioscopeapp.com/download/Bioscope-Android-V2.2.1.apk",
    version: "2.2.1",
    size: "61.8 MB",
  },
  {
    id: "ios-testflight",
    group: "phone",
    title: "iPhone / iPad",
    kind: "testflight",
    action: "get",
    href: "https://testflight.apple.com/join/JKFM3C7G",
  },
];

assert.equal(
  applyResolvedLinks(pinned, null),
  pinned,
  "no resolver answer means the pinned array is reused as-is",
);

const overlaid = applyResolvedLinks(pinned, {
  "android-phone-apk": {
    href: "https://link.bioscopeapp.com/download/Bioscope-Android-V2.3.0.apk",
    version: "2.3.0",
  },
});
assert.equal(overlaid[0].version, "2.3.0");
assert.equal(
  overlaid[0].size,
  undefined,
  "a moved version must drop the pinned size rather than show a wrong one",
);
assert.equal(overlaid[1], pinned[1], "untouched entries keep their identity");

assert.equal(
  applyResolvedLinks(pinned, {
    "android-phone-apk": { href: pinned[0].href, version: "2.2.1" },
  }),
  pinned,
  "an identical resolved href changes nothing",
);

// A response that lies is dropped, not trusted.
assert.deepEqual(
  parseBioscopeResolvedLinks({
    resolved: {
      a: { href: "https://evil.example/download/Bioscope-Android-V1.0.0.apk" },
      b: { href: "http://link.bioscopeapp.com/download/Bioscope-Android-V1.apk" },
      c: { href: "https://link.bioscopeapp.com/download/../../etc/passwd" },
      d: { href: "https://testflight.apple.com/join/ABCDEFGH" },
      e: { href: "https://link.bioscopeapp.com/download/Bioscope-V1.2.3.exe" },
    },
  }),
  { e: { href: "https://link.bioscopeapp.com/download/Bioscope-V1.2.3.exe", version: undefined } },
  "only https installer files on an allowlisted host survive parsing",
);

console.log(
  "Bioscope link resolver checks passed: 5 targets resolved, off-allowlist " +
    "hosts, missing files, dead vendor pages and lying payloads all rejected.",
);
