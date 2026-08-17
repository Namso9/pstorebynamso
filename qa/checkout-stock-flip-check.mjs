// Proves the checkout step behaves correctly when a plan goes out of stock
// WHILE the page is open — the live catalog is re-polled every five seconds,
// so this is not a hypothetical.
//
// Two rules, and they pull in opposite directions:
//   1. An untouched payment page must swap to the sold-out notice, so nobody is
//      shown a QR for something that cannot be delivered.
//   2. A form the customer has typed into — or already submitted — must NEVER
//      be unmounted, or they lose their work and can be led into paying twice.
//      The QR still disappears; the notice switches to wording that covers the
//      customer who has already transferred.
//
// Run against a served copy of `out/` (this script rewrites out/products.json
// and restores it afterwards):
//     node qa/checkout-stock-flip-check.mjs http://127.0.0.1:8791

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";
const catalogFile = path.resolve(process.argv[3] || "out/products.json");
const productId = process.argv[4] || "netflix_tv";
const planId = process.argv[5] || "1_month";
const profile = await mkdtemp(path.join(tmpdir(), "pstore-stock-"));
const port = 9940 + Math.floor(Math.random() * 8);
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

async function waitFor(cdp, expression, attempts = 140) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const value = await evaluate(cdp, expression);
    if (value) return value;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

const original = await readFile(catalogFile, "utf8");

function withStock(json, inStock) {
  const data = JSON.parse(json);
  const product = data.products.find((item) => item.id === productId);
  const plan = product?.plans.find((item) => item && item.id === planId);
  if (!plan) throw new Error(`${productId}:${planId} not found in ${catalogFile}`);
  if (inStock) delete plan.stock;
  else plan.stock = false;
  return JSON.stringify(data);
}

const typeName = `(() => {
  const field = document.getElementById("order-name");
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(field, "QA Tester");
  field.dispatchEvent(new Event("input", { bubbles: true }));
  return field.value;
})()`;

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
  await writeFile(catalogFile, withStock(original, true));
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

  // --- 1. untouched page: the notice must take over -----------------------
  await navigate(cdp, `${origin}/payment/?product=${productId}&plan=${planId}`);
  await waitFor(cdp, `!!document.querySelector(".order-submit") || null`);
  await writeFile(catalogFile, withStock(original, false));
  const notice = await waitFor(
    cdp,
    `document.querySelector(".checkout-unavailable")?.textContent || null`,
  );
  assert.match(notice, /stock မရှိ/);
  assert.equal(
    await evaluate(cdp, `!!document.querySelector(".order-submit")`),
    false,
    "an untouched payment page must stop offering the form once stock is gone",
  );

  // --- 2. engaged page: the form must survive the same change -------------
  await writeFile(catalogFile, withStock(original, true));
  await navigate(cdp, `${origin}/payment/?product=${productId}&plan=${planId}`);
  await waitFor(cdp, `!!document.querySelector(".order-submit") || null`);
  assert.equal(await evaluate(cdp, typeName), "QA Tester");

  await writeFile(catalogFile, withStock(original, false));
  // The live warning has to reach the summary, so we know the refresh landed.
  await waitFor(
    cdp,
    `document.querySelector(".order-stock-warning")?.textContent || null`,
  );
  const survived = await evaluate(
    cdp,
    `(() => ({
      form: !!document.querySelector(".order-submit"),
      typed: document.getElementById("order-name")?.value || "",
      notice: document.querySelector(".checkout-unavailable")?.textContent || "",
      picker: !!document.querySelector(".payment-selector-next"),
    }))()`,
  );
  assert.equal(survived.form, true, "a form in use must never be unmounted");
  assert.equal(survived.typed, "QA Tester", "typed input must survive the refresh");
  // The QR still goes — nobody should be invited to transfer now — but the
  // notice has to acknowledge the customer who may already have paid.
  assert.equal(survived.picker, false, "the QR must go when stock does");
  assert.match(survived.notice, /ငွေလွှဲပြီးသားဆိုရင်/);

  cdp.close();
  console.log(
    `Stock-flip checks passed for ${productId}:${planId} ` +
      "(untouched page stops; engaged form survives).",
  );
} finally {
  await writeFile(catalogFile, original);
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill("SIGTERM");
  await Promise.race([exited, sleep(2000)]);
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 });
}
