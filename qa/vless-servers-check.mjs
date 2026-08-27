/**
 * Does the VLESS server-locations disclosure behave, and does it stay lazy?
 *
 * The panel (src/components/catalog/VlessServersPanel.tsx) has three promises
 * that reading the code cannot prove hold together in a real browser:
 *   1. NO request to /api/vless-servers before the visitor opens it — the
 *      route proxies the owner's key panel, so an eager fetch would turn
 *      every home view into a hit on that panel.
 *   2. Open -> chips render; close -> reopen does NOT refetch.
 *   3. A failed fetch shows the Retry note, and Retry actually recovers.
 * Plus one layout property: the chip list must never widen the page on a
 * phone (chips wrap, the page does not scroll sideways).
 *
 * The API is mocked by wrapping window.fetch before any page script runs, so
 * this needs only the static server:
 *   node qa/vless-servers-check.mjs                       # live site
 *   node qa/vless-servers-check.mjs http://127.0.0.1:8791 # a served out/
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForJson(url, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class Cdp {
  constructor(url) {
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(url);
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const m = JSON.parse(event.data);
      if (m.id) {
        const p = this.pending.get(m.id);
        if (!p) return;
        this.pending.delete(m.id);
        if (m.error) p.reject(new Error(m.error.message));
        else p.resolve(m.result);
        return;
      }
      for (const l of this.listeners.get(m.method) || []) l(m.params);
    });
  }
  call(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  once(method) {
    return new Promise((resolve) => {
      const l = (p) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) || []).filter((x) => x !== l),
        );
        resolve(p);
      };
      this.listeners.set(method, [...(this.listeners.get(method) || []), l]);
    });
  }
  close() {
    this.socket.close();
  }
}

async function evaluate(cdp, expression) {
  const r = await cdp.call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(
      r.exceptionDetails.exception?.description ||
        r.exceptionDetails.text ||
        "Evaluation failed",
    );
  }
  return r.result.value;
}

// Realistic remarks: flag-glued names, a plain no-flag one, mixed casing.
const FIXTURE = [
  "🇹🇭THAI VIP",
  "🇹🇭THAI VVIP",
  "🇲🇾MALAYSIA VIP",
  "🇸🇬 SG-2",
  "🇯🇵JPv2",
  "MM",
];

// Wraps fetch before any page script runs. `__vlessMockMode` picks the
// behaviour per call: 'ok' answers the fixture, 'fail' answers a 503 (the
// function's real error shape). Everything else passes through untouched.
const MOCK = `
  window.__vlessMockMode = 'ok';
  window.__vlessCalls = 0;
  const realFetch = window.fetch.bind(window);
  const fixture = ${JSON.stringify({ servers: FIXTURE.map((name) => ({ name })) })};
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.includes('/api/vless-servers')) return realFetch(input, init);
    window.__vlessCalls += 1;
    if (window.__vlessMockMode === 'fail') {
      return Promise.resolve(new Response('{"servers":[]}', {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
    return Promise.resolve(new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  };
`;

const READ = `(() => {
  const root = document.querySelector('.vless-servers');
  const toggle = root?.querySelector('.vless-servers__toggle');
  const body = root?.querySelector('.vless-servers__body');
  const chips = [...(root?.querySelectorAll('.vless-servers__chip') || [])];
  const note = root?.querySelector('.vless-servers__note');
  return {
    present: Boolean(root),
    expanded: toggle?.getAttribute('aria-expanded') === 'true',
    bodyOpen: Boolean(body),
    chips: chips.map((chip) => chip.textContent.trim()),
    noteText: note ? note.textContent.trim() : '',
    hasRetry: Boolean(note?.querySelector('button')),
    calls: window.__vlessCalls,
    pageOverflow:
      document.scrollingElement.scrollWidth > window.innerWidth + 1,
  };
})()`;

const profile = await mkdtemp(path.join(tmpdir(), "pstore-vless-check-"));
const port = 9950 + Math.floor(Math.random() * 40);
const chrome = spawn(
  chromeBinary,
  [
    "--headless=new",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let failures = 0;
const check = (ok, label) => {
  console.log(`  ${ok ? "PASS " : "FAIL "} ${label}`);
  if (!ok) failures += 1;
};

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Page.addScriptToEvaluateOnNewDocument", { source: MOCK });
  await cdp.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  console.log(`origin: ${origin}\n`);
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.call("Page.navigate", { url: `${origin}/?cb=${Date.now()}` });
  await loaded;
  await evaluate(
    cdp,
    `new Promise((r) => setTimeout(r, 1200))`, // hydration + first catalog poll
  );

  let s = await evaluate(cdp, READ);
  check(s.present, "panel is on the home page");
  check(!s.expanded && !s.bodyOpen, "closed by default");
  check(s.calls === 0, `no fetch before opening (calls=${s.calls})`);

  await evaluate(
    cdp,
    `document.querySelector('.vless-servers__toggle').click();
     new Promise((r) => setTimeout(r, 400))`,
  );
  s = await evaluate(cdp, READ);
  check(s.expanded && s.bodyOpen, "opens on tap");
  check(s.calls === 1, `exactly one fetch on first open (calls=${s.calls})`);
  check(
    s.chips.length === FIXTURE.length,
    `all ${FIXTURE.length} locations render (got ${s.chips.length})`,
  );
  check(
    s.chips.some((chip) => chip.includes("THAI VIP")) &&
      s.chips.some((chip) => chip.startsWith("🌐") && chip.endsWith("MM")),
    "flagged names keep their flag; a flagless one gets the globe",
  );
  check(!s.pageOverflow, "chips wrap — no horizontal page scroll on a phone");

  await evaluate(
    cdp,
    `document.querySelector('.vless-servers__toggle').click();
     new Promise((r) => setTimeout(r, 200))`,
  );
  s = await evaluate(cdp, READ);
  check(!s.bodyOpen, "closes on second tap");

  await evaluate(
    cdp,
    `document.querySelector('.vless-servers__toggle').click();
     new Promise((r) => setTimeout(r, 400))`,
  );
  s = await evaluate(cdp, READ);
  check(
    s.bodyOpen && s.calls === 1 && s.chips.length === FIXTURE.length,
    `reopen reuses the fetched list, no refetch (calls=${s.calls})`,
  );

  // Fresh load with a failing API: the Retry path.
  const reloaded = cdp.once("Page.loadEventFired");
  await cdp.call("Page.navigate", { url: `${origin}/?cb=${Date.now() + 1}` });
  await reloaded;
  await evaluate(
    cdp,
    `window.__vlessMockMode = 'fail';
     new Promise((r) => setTimeout(r, 1200))`,
  );
  await evaluate(
    cdp,
    `document.querySelector('.vless-servers__toggle').click();
     new Promise((r) => setTimeout(r, 400))`,
  );
  s = await evaluate(cdp, READ);
  check(
    s.bodyOpen && s.hasRetry && s.chips.length === 0,
    "a failed fetch shows the Retry note, not a broken list",
  );

  await evaluate(
    cdp,
    `window.__vlessMockMode = 'ok';
     document.querySelector('.vless-servers__note button').click();
     new Promise((r) => setTimeout(r, 400))`,
  );
  s = await evaluate(cdp, READ);
  check(
    s.chips.length === FIXTURE.length && !s.hasRetry,
    "Retry recovers to the full list",
  );

  cdp.close();
} finally {
  chrome.kill("SIGKILL");
  await rm(profile, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n${failures} VLESS panel check(s) failed against ${origin}.`);
  process.exit(1);
}
console.log(`\nAll VLESS panel checks passed against ${origin}.`);
