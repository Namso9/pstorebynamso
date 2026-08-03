import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Scrolled-state modal diagnosis: opens search + plan dialogs after scrolling
// down the page and reports geometry vs viewport.
// Usage: node qa/kimi-scroll-modal-check.mjs <origin> [outDir]
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8797";
const outputDirectory = process.argv[3] || path.resolve("qa/shots/tmp-scroll-check");
const emulateMobile = process.argv[4] !== "desktop";
const viewWidth = emulateMobile ? 390 : 1280;
const viewHeight = emulateMobile ? 844 : 800;
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

const profile = await mkdtemp(path.join(tmpdir(), "kimi-scrollmodal-"));
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
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
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
await send("Emulation.setDeviceMetricsOverride", {
  width: viewWidth, height: viewHeight, deviceScaleFactor: emulateMobile ? 2 : 1, mobile: emulateMobile,
});

const results = {};
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
await send("Page.navigate", { url: `${origin}/ai-apps/` });
await loaded;
await sleep(2500);

// Click with retry: hydration may still be attaching handlers.
const clickUntilDialog = async (selector) => {
  for (let i = 0; i < 12; i++) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
    await sleep(450);
    const found = await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`);
    if (found) return true;
  }
  return false;
};

const probe = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), height: Math.round(b.height) }; };
  return JSON.stringify({
    scrollY: Math.round(window.scrollY),
    header: r(document.querySelector(".site-header")),
    backdrop: r(document.querySelector(".modal-backdrop")),
    panel: r(document.querySelector(".modal-panel")),
    bodyOverflow: getComputedStyle(document.body).overflow,
    bodyPosition: getComputedStyle(document.body).position,
  });
})()`;

// 1) Search at top
results.searchAtTopOpened = await clickUntilDialog('button[aria-label="Search products"]');
await sleep(400);
results.searchAtTop = JSON.parse(await evaluate(probe));
await evaluate(`document.querySelector('.modal-close')?.click()`);
await sleep(400);

// 2) Search after scrolling down
await evaluate(`window.scrollTo(0, 1200)`);
await sleep(500);
results.searchScrolledOpened = await clickUntilDialog('button[aria-label="Search products"]');
await sleep(400);
results.searchScrolled = JSON.parse(await evaluate(probe));
const shot1 = await send("Page.captureScreenshot", { format: "png" });
await writeFile(path.join(outputDirectory, `search-scrolled-${viewWidth}.png`), Buffer.from(shot1.result.data, "base64"));
await evaluate(`document.querySelector('.modal-close')?.click()`);
await sleep(500);
results.scrollRestoredAfterClose = await evaluate(`Math.round(window.scrollY)`);
await evaluate(`window.scrollTo(0, 1200)`);
await sleep(500);
results.planScrolledOpened = await clickUntilDialog('.product-card__action');
await sleep(400);
results.planScrolled = JSON.parse(await evaluate(probe));
const shot2 = await send("Page.captureScreenshot", { format: "png" });
await writeFile(path.join(outputDirectory, `plan-scrolled-${viewWidth}.png`), Buffer.from(shot2.result.data, "base64"));

console.log(JSON.stringify(results, null, 2));
ws.close();
chrome.kill();
await rm(profile, { recursive: true, force: true });
