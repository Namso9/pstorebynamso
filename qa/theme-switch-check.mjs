// Browser checks for the animated light/dark theme switch.
//
// Run against a served copy of `out/`:
//     npx wrangler pages dev out --port 8791 --compatibility-date=2026-08-02
//     node qa/theme-switch-check.mjs http://127.0.0.1:8791
//
// Covers: system default (both prefers-color-scheme values), the animated
// toggle flipping data-theme with the theme-transition cross-fade class,
// localStorage persistence across reloads without a flash, reduced-motion
// collapsing the choreography, the 44px touch target, and zero console
// errors / horizontal overflow at 390px.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";
const profile = await mkdtemp(path.join(tmpdir(), "pstore-theme-"));
const port = 10100 + Math.floor(Math.random() * 8);
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

const switchState = `(() => {
  const button = document.querySelector(".theme-switch");
  if (!button) return null;
  const rect = button.getBoundingClientRect();
  const thumb = button.querySelector(".theme-switch__thumb");
  return {
    role: button.getAttribute("role"),
    checked: button.getAttribute("aria-checked"),
    label: button.getAttribute("aria-label") || "",
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    hasTrack: !!button.querySelector(".theme-switch__track"),
    hasStars: !!button.querySelector(".theme-switch__stars"),
    hasClouds: !!button.querySelector(".theme-switch__clouds"),
    thumbTransform: thumb ? getComputedStyle(thumb).transform : "",
    thumbDuration: thumb ? getComputedStyle(thumb).transitionDuration : "",
    theme: document.documentElement.dataset.theme || "",
    mode: document.documentElement.dataset.themeMode || "",
    transitioning: document.documentElement.classList.contains("theme-transition"),
    stored: localStorage.getItem("ps-theme"),
    haptic: button.getAttribute("data-haptic") || "",
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

  await cdp.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // --- system default, dark OS preference, nothing stored ---------------
  await cdp.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: "dark" }],
  });
  await navigate(cdp, `${origin}/`);
  await waitFor(cdp, `(${switchState})?.checked === "true"`);
  await sleep(700); // let the post-hydration thumb slide settle
  let state = await evaluate(cdp, switchState);
  assert.equal(state.theme, "dark", "OS dark preference must resolve dark");
  assert.equal(state.mode, "system", "no stored choice stays system mode");
  assert.equal(state.stored, null, "no choice may be written on first load");
  assert.equal(state.transitioning, false, "no cross-fade class on first paint");
  assert.equal(state.role, "switch");
  assert.equal(state.checked, "true", "the switch must reflect dark mode");
  assert.ok(state.hasTrack && state.hasStars && state.hasClouds, "scene parts render");
  assert.equal(state.haptic, "selection");
  assert.ok(state.height >= 44, `touch target height ${state.height} must stay >= 44px`);
  assert.ok(state.width >= 44, `touch target width ${state.width} must stay >= 44px`);
  assert.equal(state.overflow, false, "no horizontal overflow at 390px");
  assert.match(state.label, /dark/i);
  const darkThumb = state.thumbTransform;

  // --- toggle to light: animated flip + cross-fade + persistence ---------
  await evaluate(cdp, `document.querySelector(".theme-switch").click()`);
  await waitFor(cdp, `(${switchState})?.theme === "light"`);
  state = await evaluate(cdp, switchState);
  assert.equal(state.checked, "false", "aria-checked flips to light");
  assert.equal(state.stored, "light", "the tap stores an explicit choice");
  assert.equal(state.transitioning, true, "the cross-fade class applies on toggle");
  await sleep(700); // let the thumb slide settle before comparing positions
  state = await evaluate(cdp, switchState);
  assert.notEqual(state.thumbTransform, darkThumb, "the thumb must slide across");

  await sleep(700);
  state = await evaluate(cdp, switchState);
  assert.equal(state.transitioning, false, "the cross-fade class is removed after the beat");

  await navigate(cdp, `${origin}/`);
  await sleep(500); // hydration beat
  state = await waitFor(cdp, switchState);
  assert.equal(state.theme, "light", "stored light must survive reload");
  assert.equal(state.mode, "light");
  assert.equal(state.transitioning, false, "no cross-fade class on reload");
  assert.equal(state.checked, "false");

  // --- toggle back to dark and reload again ------------------------------
  await evaluate(cdp, `document.querySelector(".theme-switch").click()`);
  await waitFor(cdp, `(${switchState})?.theme === "dark"`);
  state = await evaluate(cdp, switchState);
  assert.equal(state.stored, "dark");
  await navigate(cdp, `${origin}/`);
  await sleep(500); // hydration beat
  state = await waitFor(cdp, switchState);
  assert.equal(state.theme, "dark", "stored dark must survive reload");
  assert.equal(state.checked, "true");

  // --- system default, light OS preference --------------------------------
  await evaluate(cdp, `localStorage.removeItem("ps-theme")`);
  await cdp.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: "light" }],
  });
  await navigate(cdp, `${origin}/`);
  await sleep(500); // hydration beat
  state = await waitFor(cdp, switchState);
  assert.equal(state.theme, "light", "OS light preference must resolve light");
  assert.equal(state.mode, "system");

  // --- reduced motion: instant swap, no choreography ----------------------
  await cdp.call("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: "light" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await navigate(cdp, `${origin}/`);
  await sleep(500); // hydration beat
  state = await waitFor(cdp, switchState);
  assert.ok(
    parseFloat(state.thumbDuration) <= 0.01,
    `reduced motion must collapse the thumb transition (got ${state.thumbDuration})`,
  );
  await evaluate(cdp, `document.querySelector(".theme-switch").click()`);
  await waitFor(cdp, `(${switchState})?.theme === "dark"`);
  state = await evaluate(cdp, switchState);
  assert.equal(state.theme, "dark", "reduced motion still toggles the theme");

  // --- second route: the switch works and fits on a category page ---------
  await cdp.call("Emulation.setEmulatedMedia", { features: [] });
  await navigate(cdp, `${origin}/music-apps/`);
  await sleep(500); // hydration beat
  state = await waitFor(cdp, switchState);
  assert.equal(state.theme, "dark", "stored theme applies on every route");
  assert.equal(state.overflow, false, "no horizontal overflow on category pages");

  // --- header fit across the supported widths -----------------------------
  // The switch is wider than the old 44px icon button, so prove the full
  // PREMIUM STORE wordmark and all header controls still fit with no
  // horizontal overflow at every supported width.
  const fitState = `(() => {
    const brand = document.querySelector(".site-brand__text")?.getBoundingClientRect();
    const toggle = document.querySelector(".theme-switch")?.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      brandVisible: !!brand && brand.width > 0 && brand.right <= document.documentElement.clientWidth,
      brandText: document.querySelector(".site-brand__text")?.textContent || "",
      toggleVisible: !!toggle && toggle.left >= 0 && toggle.right <= document.documentElement.clientWidth + 1,
    };
  })()`;
  for (const width of [360, 430, 768, 1024]) {
    await cdp.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 844,
      deviceScaleFactor: 2,
      mobile: width < 768,
    });
    await navigate(cdp, `${origin}/`);
    await sleep(400);
    const fit = await evaluate(cdp, fitState);
    assert.equal(fit.overflow, false, `no horizontal overflow at ${width}px`);
    assert.equal(fit.brandVisible, true, `full wordmark must fit at ${width}px`);
    assert.match(fit.brandText, /PREMIUM\s*STORE/);
    assert.equal(fit.toggleVisible, true, `the switch must stay on-screen at ${width}px`);
  }

  assert.deepEqual(consoleErrors, [], "no console errors during theme checks");
  cdp.close();
  console.log("theme-switch-check: all assertions passed");
} finally {
  chrome.kill();
  await new Promise((resolve) => {
    chrome.once("exit", resolve);
    setTimeout(resolve, 3000);
  });
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
