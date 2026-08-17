// Browser checks for the haptics engine and the Order -> Payment -> Done rail.
//
// Run against a served copy of `out/`:
//     npx wrangler pages dev out --port 8791 --compatibility-date=2026-08-02
//     node qa/haptics-steps-check.mjs http://127.0.0.1:8791
//
// Headless Chrome here is a DESKTOP browser, which is exactly the point for
// half of these assertions: the iOS switch overlay must never render outside
// iOS, and every control must keep working without it.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";
const productId = process.argv[3] || "netflix_tv";
const planId = process.argv[4] || "1_month";
const profile = await mkdtemp(path.join(tmpdir(), "pstore-haptics-"));
const port = 9990 + Math.floor(Math.random() * 8);
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

  on(method, listener) {
    this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
    return () => {
      this.listeners.set(
        method,
        (this.listeners.get(method) || []).filter((item) => item !== listener),
      );
    };
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

async function waitFor(cdp, expression) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const value = await evaluate(cdp, expression);
    if (value) return value;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${expression}`);
}

const railState = `(() => {
  const rail = document.querySelector(".checkout-steps__rail");
  if (!rail) return null;
  const items = [...rail.querySelectorAll(".checkout-steps__item")];
  return {
    states: items.map((item) => item.dataset.state),
    labels: items.map((item) => item.querySelector(".checkout-steps__text")?.textContent || ""),
    current: items.filter((item) => item.getAttribute("aria-current") === "step").length,
    caption: document.querySelector(".checkout-steps__caption")?.textContent || "",
    overlays: document.querySelectorAll(".haptic-tap").length,
    pulses: document.querySelectorAll(".haptic-pulse").length,
    haptics: document.querySelectorAll("[data-haptic]").length,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  };
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
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
  ).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");

  const consoleErrors = [];
  cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    consoleErrors.push(exceptionDetails?.text || "exception");
  });
  cdp.on("Runtime.consoleAPICalled", ({ type, args }) => {
    if (type !== "error") return;
    consoleErrors.push(args?.map((arg) => arg.value ?? arg.description).join(" ") || "error");
  });

  // 320px is the narrowest layout the storefront supports; the rail is new
  // horizontal content, so it is the thing most likely to push the page wide.
  await cdp.call("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 720,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // --- payment page ------------------------------------------------------
  await navigate(cdp, `${origin}/payment/?product=${productId}&plan=${planId}`);
  const payment = await waitFor(cdp, railState);
  assert.deepEqual(payment.states, ["done", "current", "todo"]);
  assert.deepEqual(payment.labels, ["Order", "Payment", "Done"]);
  assert.equal(payment.current, 1, "exactly one step may be aria-current");
  assert.match(payment.caption, /အဆင့် ၂ \/ ၃/);
  assert.equal(payment.overflow, false, "the rail must not widen the page at 320px");
  assert.equal(payment.overlays, 0, "the iOS switch overlay must not render off iOS");
  assert.equal(payment.pulses, 0, "the iOS fallback switch must not render off iOS");
  assert.ok(payment.haptics > 0, "payment controls must carry data-haptic");

  // Selecting a platform still works with the haptic attributes in place.
  await evaluate(
    cdp,
    `document.querySelectorAll(".platform-button-next")[0].click(), true`,
  );
  const qrShown = await waitFor(
    cdp,
    `!!document.querySelector(".qr-panel-next") || null`,
  );
  assert.ok(qrShown);

  // --- order page --------------------------------------------------------
  await navigate(cdp, `${origin}/order/?product=${productId}&plan=${planId}`);
  const order = await waitFor(cdp, railState);
  assert.deepEqual(order.states, ["done", "current", "todo"]);
  assert.equal(order.current, 1);
  assert.equal(order.overflow, false);
  assert.equal(order.overlays, 0);
  assert.ok(order.haptics > 0);

  // Submitting without a screenshot must still surface the error — the guard
  // that keeps the iOS overlay's `input` event from wiping it must not have
  // broken the ordinary path. Every `required` field has to be filled first or
  // native constraint validation stops the submit before any of this runs.
  await evaluate(
    cdp,
    `(() => {
      const fill = (id, value) => {
        const field = document.getElementById(id);
        const proto = field instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, "value").set.call(field, value);
        field.dispatchEvent(new Event("input", { bubbles: true }));
        field.dispatchEvent(new Event("change", { bubbles: true }));
      };
      fill("order-name", "QA Tester");
      fill("order-payment", "KBZ Pay");
      fill("order-contact", "09123456789");
      return true;
    })()`,
  );
  await sleep(150);
  const formValidity = await evaluate(
    cdp,
    `(() => {
      const form = document.querySelector(".order-form-card-next form");
      const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
      return { valid: form.checkValidity(), invalid: invalid.map((el) => el.id || el.name) };
    })()`,
  );
  assert.deepEqual(
    formValidity,
    { valid: true, invalid: [] },
    "the QA fixture must satisfy native validation before the JS guard runs",
  );
  await evaluate(cdp, `document.querySelector(".order-submit").click(), true`);
  const errorText = await waitFor(
    cdp,
    `document.querySelector(".order-result--error")?.textContent || null`,
  );
  assert.match(errorText, /Screenshot/);
  const stillOnStepTwo = await evaluate(cdp, railState);
  assert.deepEqual(stillOnStepTwo.states, ["done", "current", "todo"]);

  // Typing into the form clears the outcome and leaves the rail on step two.
  await evaluate(
    cdp,
    `(() => {
      const field = document.getElementById("order-name");
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(field, "QA");
      field.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    })()`,
  );
  const cleared = await waitFor(
    cdp,
    `document.querySelector(".order-result--error") ? null : true`,
  );
  assert.equal(cleared, true);

  // --- home page ---------------------------------------------------------
  await navigate(cdp, `${origin}/`);
  const home = await waitFor(cdp, `document.querySelectorAll("[data-haptic]").length || null`);
  assert.ok(home > 0, "home controls must carry data-haptic");
  const homeRail = await evaluate(cdp, `!!document.querySelector(".checkout-steps")`);
  assert.equal(homeRail, false, "the rail belongs to checkout only");

  assert.deepEqual(consoleErrors, [], "no page errors are allowed");

  cdp.close();
  console.log(
    "Haptics + checkout rail browser checks passed " +
      `(${productId}:${planId}; ${payment.haptics} payment / ${order.haptics} order haptic targets).`,
  );
} finally {
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill("SIGTERM");
  await Promise.race([exited, sleep(2000)]);
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 });
}
