import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Overlay/touch/font verification for the 2026-08-04 mobile perf pass:
// modal backdrop fixed layer + backdrop-filter, body scroll lock/restore,
// touch-action coverage on interactive controls, and the head font link.
// Usage: node qa/kimi-overlay-touch-check.mjs <origin>
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8788";
const viewWidth = 390;
const viewHeight = 844;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForJson(url, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const profile = await mkdtemp(path.join(tmpdir(), "kimi-overlay-"));
const port = 9600 + Math.floor(Math.random() * 200);
const chrome = spawn(chromeBinary, [
  "--headless=new",
  "--no-first-run",
  "--disable-extensions",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  `--window-size=${viewWidth},${viewHeight}`,
  "about:blank",
]);
await waitForJson(`http://127.0.0.1:${port}/json/version`);
const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`);
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
let messageId = 0;
const pending = new Map();
const consoleErrors = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
  if (message.method === "Log.entryAdded" && message.params?.entry?.level === "error") {
    consoleErrors.push(message.params.entry.text);
  }
  if (message.method === "Runtime.exceptionThrown") {
    consoleErrors.push(message.params?.exceptionDetails?.text || "exception");
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++messageId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return response.result?.result?.value;
};
await send("Page.enable");
await send("Log.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: viewWidth, height: viewHeight, deviceScaleFactor: 2, mobile: true,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: true });

const navigate = async (url) => {
  const loaded = new Promise((resolve) => {
    const listener = (event) => {
      const message = JSON.parse(event.data);
      if (message.method === "Page.loadEventFired") {
        ws.removeEventListener("message", listener);
        resolve();
      }
    };
    ws.addEventListener("message", listener);
  });
  await send("Page.navigate", { url });
  await loaded;
  await sleep(2200);
};

const results = {};

// 1) Catalog page: font link, plan modal backdrop, scroll lock, touch-action.
await navigate(`${origin}/ai-apps/`);
results.fontLinkInHead = await evaluate(
  `Boolean(document.querySelector('head link[rel="stylesheet"][href*="fonts.googleapis.com/css2"]))`,
);
results.fontImportRemovedFromCss = await evaluate(
  `(async () => {
    const href = [...document.styleSheets].map((s) => s.href).find(Boolean);
    if (!href) return null;
    const text = await (await fetch(href)).text();
    return !text.includes('@import url("https://fonts.googleapis.com');
  })()`,
);
results.touchAction = JSON.parse(await evaluate(`JSON.stringify(Object.fromEntries([
  ".plan-row", ".checkout-option", ".search-result", ".faq-question",
  ".review-card", ".platform-button-next", ".order-file", ".back-control",
  ".button", ".icon-button",
].map((sel) => {
  const el = document.querySelector(sel);
  return [sel, el ? getComputedStyle(el).touchAction : "absent"];
})))`));

const clickUntilDialog = async (selector) => {
  for (let i = 0; i < 12; i++) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
    await sleep(450);
    if (await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`)) return true;
  }
  return false;
};

await evaluate(`window.scrollTo(0, 1000)`);
await sleep(400);
results.planModalOpened = await clickUntilDialog(".product-card__action");
await sleep(500);
results.backdrop = JSON.parse(await evaluate(`(() => {
  const el = document.querySelector(".modal-backdrop");
  if (!el) return null;
  const cs = getComputedStyle(el);
  return JSON.stringify({
    position: cs.position,
    inset: [cs.top, cs.right, cs.bottom, cs.left].join(" "),
    zIndex: cs.zIndex,
    background: cs.backgroundColor,
    backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
    portalledToBody: el.parentElement === document.body,
  });
})()`));
results.scrollLock = JSON.parse(await evaluate(`JSON.stringify({
  overflow: getComputedStyle(document.body).overflow,
  position: getComputedStyle(document.body).position,
  scrollY: Math.round(window.scrollY),
})`));

// 2) Plan -> checkout modal, then close everything and verify scroll restore.
await evaluate(`document.querySelector(".plan-row:not(.plan-row--unavailable)")?.click()`);
await sleep(900);
results.checkoutOpened = await evaluate(
  `Boolean(document.querySelector('[role="dialog"] .checkout-options'))`,
);
results.checkoutOptionTouchAction = await evaluate(
  `getComputedStyle(document.querySelector(".checkout-option")).touchAction`,
);
await evaluate(`document.querySelector('.modal-close')?.click()`);
await sleep(600);
results.scrollRestoredAfterClose = await evaluate(`Math.round(window.scrollY)`);
results.dialogClosed = await evaluate(`!document.querySelector('[role="dialog"]')`);

// 3) Reviews page: review lightbox backdrop uses the same fixed layer.
await navigate(`${origin}/reviews/`);
results.reviewOpened = await clickUntilDialog(".review-card");
await sleep(500);
results.lightboxBackdropFixed = await evaluate(
  `getComputedStyle(document.querySelector(".modal-backdrop")).position`,
);
await evaluate(`document.querySelector('.modal-close')?.click()`);
await sleep(400);

results.consoleErrors = consoleErrors.slice(0, 5);
console.log(JSON.stringify(results, null, 2));
ws.close();
chrome.kill();
await rm(profile, { recursive: true, force: true });
