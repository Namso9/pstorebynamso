/**
 * Is any text in the "most viewed this week" row being cut off?
 *
 * Owner report, 2026-08-24: on a phone the row shows only
 * "streaming apps 5000 မှစ" and the rest is not visible. `.popular-card__meta`
 * is `white-space: nowrap` + `text-overflow: ellipsis`, and the name above it is
 * `-webkit-line-clamp: 2`, so either can silently swallow text. Reading the CSS
 * cannot tell you WHICH is truncating at a given width — this measures it.
 *
 * A truncated element is one whose scroll size exceeds its client size:
 *   meta  -> scrollWidth  > clientWidth   (ellipsis ate the end of the line)
 *   name  -> scrollHeight > clientHeight  (line-clamp ate a third line)
 *
 *   node qa/popular-row-check.mjs                       # live site
 *   node qa/popular-row-check.mjs http://127.0.0.1:8791 # a served out/
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "https://pstorebynamso.com";
const viewports = [
  { name: "phone-360", width: 360, height: 780, mobile: true },
  { name: "phone-390", width: 390, height: 844, mobile: true },
  { name: "phone-430", width: 430, height: 932, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: false },
  { name: "desktop-1280", width: 1280, height: 900, mobile: false },
];

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

const MEASURE = `(() => {
  const cards = [...document.querySelectorAll('.popular-card')];
  if (!cards.length) return { present: false, cards: [] };
  return {
    present: true,
    cards: cards.map((card) => {
      const name = card.querySelector('.popular-card__body strong');
      const meta = card.querySelector('.popular-card__meta');
      const body = card.querySelector('.popular-card__body');
      const px = (el, prop) => el ? parseFloat(getComputedStyle(el)[prop]) : null;
      return {
        product: card.dataset.product || '',
        cardWidth: Math.round(card.getBoundingClientRect().width),
        bodyWidth: body ? Math.round(body.getBoundingClientRect().width) : null,
        name: {
          text: name ? name.textContent.trim() : '',
          fontPx: px(name, 'fontSize'),
          clientH: name ? name.clientHeight : 0,
          scrollH: name ? name.scrollHeight : 0,
          clipped: name ? name.scrollHeight > name.clientHeight + 1 : false,
        },
        meta: {
          text: meta ? meta.textContent.trim() : '',
          fontPx: px(meta, 'fontSize'),
          clientW: meta ? meta.clientWidth : 0,
          scrollW: meta ? meta.scrollWidth : 0,
          clipped: meta ? meta.scrollWidth > meta.clientWidth + 1 : false,
        },
      };
    }),
  };
})()`;

const profile = await mkdtemp(path.join(tmpdir(), "pstore-popular-check-"));
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

  console.log(`origin: ${origin}\n`);
  for (const vp of viewports) {
    await cdp.call("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.mobile,
    });
    const loaded = cdp.once("Page.loadEventFired");
    await cdp.call("Page.navigate", { url: `${origin}/?cb=${Date.now()}` });
    await loaded;
    await evaluate(
      cdp,
      `Promise.all([
        document.fonts?.ready || Promise.resolve(),
        new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      ]).then(() => new Promise((r) => setTimeout(r, 900)))`,
    );
    const m = await evaluate(cdp, MEASURE);
    console.log(`── ${vp.name} (${vp.width}px) ──`);
    if (!m.present) {
      console.log("   no .popular-card in the DOM (row renders nothing)\n");
      continue;
    }
    for (const c of m.cards) {
      const nameFlag = c.name.clipped ? "NAME CLIPPED" : "name ok";
      const metaFlag = c.meta.clipped ? "META CLIPPED" : "meta ok";
      if (c.name.clipped || c.meta.clipped) failures += 1;
      console.log(
        `   ${c.product.padEnd(15)} card=${String(c.cardWidth).padStart(3)}px body=${String(c.bodyWidth).padStart(3)}px  ${nameFlag} / ${metaFlag}`,
      );
      console.log(
        `        name "${c.name.text}" ${c.name.fontPx}px  h ${c.name.scrollH}/${c.name.clientH}`,
      );
      console.log(
        `        meta "${c.meta.text}" ${c.meta.fontPx}px  w ${c.meta.scrollW}/${c.meta.clientW}${c.meta.clipped ? `  (${c.meta.scrollW - c.meta.clientW}px cut)` : ""}`,
      );
    }
    console.log("");
  }
  cdp.close();
} finally {
  chrome.kill("SIGKILL");
  await rm(profile, { recursive: true, force: true });
}

console.log(
  failures === 0
    ? "PASS — nothing clipped at any tested width"
    : `FAIL — ${failures} card/viewport combinations have clipped text`,
);
process.exit(failures === 0 ? 0 : 1);
