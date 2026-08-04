import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Android-keyboard flicker fix verification: the centered search dialog must
// keep a constant box (and a constant input position) while typing, so the
// IME has no layout-shift trigger. Usage: node qa/kimi-search-typing-check.mjs <origin>
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8788";
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

const profile = await mkdtemp(path.join(tmpdir(), "kimi-searchtype-"));
const port = 9600 + Math.floor(Math.random() * 200);
const chrome = spawn(chromeBinary, [
  "--headless=new",
  "--no-first-run",
  "--disable-extensions",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--window-size=390,844",
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
  width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
});

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
await send("Page.navigate", { url: `${origin}/` });
await loaded;
await sleep(2200);

for (let i = 0; i < 12; i++) {
  await evaluate(`document.querySelector('button[aria-label="Search products"]')?.click()`);
  await sleep(400);
  if (await evaluate(`Boolean(document.querySelector('.search-panel input'))`)) break;
}
await sleep(500);

const rectProbe = `(() => {
  const panel = document.querySelector(".search-panel");
  const input = document.querySelector(".search-panel input");
  if (!panel || !input) return null;
  const p = panel.getBoundingClientRect();
  const i = input.getBoundingClientRect();
  return JSON.stringify({
    panelHeight: Math.round(p.height), panelTop: Math.round(p.top),
    inputTop: Math.round(i.top),
  });
})()`;

const results = {};
results.before = JSON.parse(await evaluate(rectProbe));
// Type through the native setter so React's controlled input picks it up.
for (const term of ["n", "ne", "net", "netf", "netflix"]) {
  await evaluate(`(() => {
    const input = document.querySelector(".search-panel input");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, "${term}");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);
  await sleep(250);
  results[`after_${term}`] = JSON.parse(await evaluate(rectProbe));
}
results.resultCount = await evaluate(`document.querySelectorAll(".search-result").length`);
results.panelComputed = JSON.parse(await evaluate(`(() => {
  const cs = getComputedStyle(document.querySelector(".search-panel"));
  return JSON.stringify({ display: cs.display, height: cs.height, maxHeight: cs.maxHeight });
})()`));
console.log(JSON.stringify(results, null, 2));
ws.close();
chrome.kill();
await rm(profile, { recursive: true, force: true });
