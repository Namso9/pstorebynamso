import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Search focus-stability verification: while typing, the search input must
// stay focused on every character, must not be remounted, and the cursor must
// stay at the end of the text. Regression guard for the Modal effect tearing
// down on every keystroke because `onClose` identity changed per render.
// Usage: node qa/kimi-search-focus-check.mjs <origin>
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

const profile = await mkdtemp(path.join(tmpdir(), "kimi-searchfocus-"));
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

// Tag the live input element so a remount (new DOM node) is detectable.
await evaluate(`(() => {
  const input = document.querySelector(".search-panel input");
  input.dataset.focusProbe = "original";
  input.focus();
  return true;
})()`);

const probe = `(() => {
  const input = document.querySelector(".search-panel input");
  if (!input) return JSON.stringify({ missing: true });
  return JSON.stringify({
    focused: document.activeElement === input,
    sameNode: input.dataset.focusProbe === "original",
    cursorAtEnd: input.selectionStart === input.value.length,
    value: input.value,
    bodyLocked: document.body.style.overflow === "hidden",
  });
})()`;

const sentence = "netflix premium plan";
const failures = [];
const focusLog = [];
for (let i = 1; i <= sentence.length; i++) {
  const term = sentence.slice(0, i);
  await evaluate(`(() => {
    const input = document.querySelector(".search-panel input");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, ${JSON.stringify(term)});
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  })()`);
  await sleep(150);
  const state = JSON.parse(await evaluate(probe));
  focusLog.push(state.focused);
  if (!state.focused || !state.sameNode || !state.cursorAtEnd || state.missing) {
    failures.push({ term, state });
  }
}

const results = {
  typed: sentence,
  focusedEveryKeystroke: focusLog.every(Boolean),
  failures,
  resultCount: await evaluate(`document.querySelectorAll(".search-result").length`),
  finalState: JSON.parse(await evaluate(probe)),
};
// Escape still closes the dialog via the ref-read handler.
await evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
await sleep(500);
results.closedByEscape = await evaluate(`!document.querySelector(".search-panel")`);
console.log(JSON.stringify(results, null, 2));
ws.close();
chrome.kill();
await rm(profile, { recursive: true, force: true });
process.exit(failures.length || !results.closedByEscape ? 1 : 0);
