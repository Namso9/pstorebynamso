import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";
const profile = await mkdtemp(path.join(tmpdir(), "pstore-ask-price-"));
const port = 9950 + Math.floor(Math.random() * 30);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJson(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class Cdp {
  constructor(url) {
    this.id = 0;
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
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params);
    });
  }

  call(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) || []).filter((item) => item !== listener),
        );
        resolve(params);
      };
      this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function navigate(cdp, url) {
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.call("Page.navigate", { url });
  await loaded;
}

async function waitForText(cdp, expression, expected) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const current = await evaluate(cdp, expression);
    if (String(current).includes(expected)) return current;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${JSON.stringify(expected)}`);
}

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

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
  ).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await navigate(cdp, `${origin}/ai-apps/#app-manus`);
  await waitForText(
    cdp,
    `document.querySelector('[role="dialog"]')?.textContent || ''`,
    "Ask on Telegram",
  );
  const planModal = await evaluate(
    cdp,
    `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return {
        title: dialog?.querySelector('h2')?.textContent || '',
        text: dialog?.textContent || '',
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    })()`,
  );
  assert.match(planModal.title, /Manus/i);
  assert.match(planModal.text, /Ask on Telegram/);
  assert.doesNotMatch(planModal.text, /0\s*Ks/i);
  assert.equal(planModal.overflow, false);

  await navigate(
    cdp,
    `${origin}/ai-apps/?product=manus&plan=1_year_5000_credits`,
  );
  await waitForText(
    cdp,
    `document.querySelector('[role="dialog"]')?.textContent || ''`,
    "Ask on Telegram",
  );
  const directLink = await evaluate(
    cdp,
    `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.textContent || '';
    })()`,
  );
  assert.match(directLink, /Ask on Telegram/);
  assert.doesNotMatch(directLink, /Telegram Bot ကနေ ဝယ်မည်/);
  assert.doesNotMatch(directLink, /Website ကနေ Order Form တင်မည်/);

  await navigate(
    cdp,
    `${origin}/payment/?product=manus&plan=1_year_5000_credits`,
  );
  await waitForText(cdp, `document.body.textContent || ''`, "Ask on Telegram");
  const paymentPage = await evaluate(cdp, `document.body.textContent || ''`);
  assert.match(paymentPage, /Ask on Telegram/);
  assert.doesNotMatch(paymentPage, /ငွေပေးချေမည့် Platform ကိုရွေးပါ/);

  await navigate(
    cdp,
    `${origin}/order/?product=manus&plan=1_year_5000_credits`,
  );
  await waitForText(cdp, `document.body.textContent || ''`, "Ask on Telegram");
  const orderPage = await evaluate(cdp, `document.body.textContent || ''`);
  assert.match(orderPage, /Ask on Telegram/);
  assert.doesNotMatch(orderPage, /Screenshot ရွေးရန် နှိပ်ပါ/);

  cdp.close();
  console.log("Ask Price browser checks passed (plan, direct, payment, and order links).");
} finally {
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill("SIGTERM");
  await Promise.race([exited, sleep(2000)]);
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 });
}
