import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Mobile regression-guard verification (2026-08-03 mobile polish pass).
// Checks, at 390px unless noted:
//  1. Theme toggle switches html[data-theme].
//  2. Header Telegram link has an accessible name.
//  3. FAQ disclosure opens on click.
//  4. Search dialog: opens, input receives focus, Tab stays trapped,
//     Escape closes.
//  5. Plan dialog: opens, Escape closes, body scroll lock released.
//  6. /order/ file input sits immediately before its visible label and the
//     label shows an outline on keyboard :focus-visible.
//  7. Reduced-motion: no content left hidden or transformed after load.
//  8. Hash CSP blocks an unapproved inline script while normal flows remain
//     free of console errors.
// Usage: node qa/kimi-mobile-verify.mjs <origin>
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8794";

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

class Cdp {
  constructor(url) {
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.socket = new WebSocket(url);
  }
  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id) {
        const p = this.pending.get(msg.id);
        if (!p) return;
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
        return;
      }
      for (const l of this.listeners.get(msg.method) || []) l(msg.params);
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
      const listener = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) || []).filter((x) => x !== listener),
        );
        resolve(params);
      };
      this.listeners.set(method, [
        ...(this.listeners.get(method) || []),
        listener,
      ]);
    });
  }
  on(method, listener) {
    this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
  }
  close() {
    this.socket.close();
  }
}

async function evaluate(conn, expression) {
  const result = await conn.call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "evaluation failed");
  }
  return result.result.value;
}

async function navigate(conn, url) {
  const loaded = conn.once("Page.loadEventFired");
  await conn.call("Page.navigate", { url });
  await loaded;
  await evaluate(
    conn,
    `Promise.all([
      document.fonts?.ready || Promise.resolve(),
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    ]).then(() => new Promise((r) => setTimeout(r, 500)))`,
  );
}

async function pressKey(conn, key, code, vk) {
  await conn.call("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk });
  await conn.call("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk });
}

const results = {};
const profile = await mkdtemp(path.join(tmpdir(), "kimi-verify-"));
const port = 9555 + Math.floor(Math.random() * 300);
const chrome = spawn(
  chromeBinary,
  [
    "--headless=new",
    "--disable-gpu",
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
  const t = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })
  ).json();
  const conn = new Cdp(t.webSocketDebuggerUrl);
  await conn.open();
  await conn.call("Page.enable");
  await conn.call("Runtime.enable");
  await conn.call("Log.enable");
  const errors = [];
  conn.on("Runtime.exceptionThrown", ({ exceptionDetails }) =>
    errors.push(exceptionDetails.text || "exception"),
  );
  conn.on("Log.entryAdded", ({ entry }) => {
    if (entry.level === "error") errors.push(entry.text);
  });
  await conn.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });
  await conn.call("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

  // 1+2: home — theme toggle and Telegram accessible name.
  await navigate(conn, `${origin}/`);
  results.telegramName = await evaluate(
    conn,
    `(() => {
      const a = document.querySelector('.site-header .header-bot-button[href*="t.me"]');
      if (!a) return "no-link";
      const name = (a.getAttribute("aria-label") || a.textContent || "").trim();
      return name || "EMPTY-NAME";
    })()`,
  );
  results.themeToggle = await evaluate(
    conn,
    `(async () => {
      const before = document.documentElement.getAttribute("data-theme");
      const btn = document.querySelector('button[aria-label*="theme" i], .theme-toggle');
      if (!btn) return "no-toggle";
      btn.click();
      await new Promise((r) => setTimeout(r, 300));
      const after = document.documentElement.getAttribute("data-theme");
      btn.click();
      await new Promise((r) => setTimeout(r, 300));
      const restored = document.documentElement.getAttribute("data-theme");
      return JSON.stringify({ before, after, restored, works: before !== after && restored === before });
    })()`,
  );

  // 3: FAQ disclosure lives on category pages, not the home page.
  await navigate(conn, `${origin}/ai-apps/`);
  results.faq = await evaluate(
    conn,
    `(async () => {
      const btn = document.querySelector('.faq-section button, [class*="faq"] button');
      if (!btn) return "no-faq";
      btn.click();
      await new Promise((r) => setTimeout(r, 300));
      return btn.getAttribute("aria-expanded") ?? "no-aria";
    })()`,
  );

  // 4: search dialog focus behaviour.
  results.search = await evaluate(
    conn,
    `(async () => {
      const btn = document.querySelector('button[aria-label="Search products"]');
      if (!btn) return "no-button";
      btn.click();
      await new Promise((r) => setTimeout(r, 700));
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return "no-dialog";
      return JSON.stringify({
        inputFocused: document.activeElement?.tagName === "INPUT",
      });
    })()`,
  );
  await pressKey(conn, "Tab", "Tab", 9);
  await pressKey(conn, "Tab", "Tab", 9);
  results.searchTrap = await evaluate(
    conn,
    `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? dialog.contains(document.activeElement) : "no-dialog";
    })()`,
  );
  await pressKey(conn, "Escape", "Escape", 27);
  await sleep(400);
  results.searchEscape = await evaluate(
    conn,
    `document.querySelector('[role="dialog"]') ? "still-open" : "closed"`,
  );

  // 5: plan dialog on a catalog page.
  await navigate(conn, `${origin}/ai-apps/`);
  await evaluate(
    conn,
    `(async () => {
      document.querySelector(".product-card__action")?.click();
      await new Promise((r) => setTimeout(r, 700));
    })()`,
  );
  await pressKey(conn, "Tab", "Tab", 9);
  await pressKey(conn, "Tab", "Tab", 9);
  results.planTrap = await evaluate(
    conn,
    `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? dialog.contains(document.activeElement) : "no-dialog";
    })()`,
  );
  await pressKey(conn, "Escape", "Escape", 27);
  await sleep(400);
  results.planEscape = await evaluate(
    conn,
    `JSON.stringify({
      state: document.querySelector('[role="dialog"]') ? "still-open" : "closed",
      bodyUnlocked: document.body.style.overflow !== "hidden",
    })`,
  );

  // 6: /order/ file-input DOM order + keyboard focus ring.
  await navigate(conn, `${origin}/order/`);
  results.fileInputOrder = await evaluate(
    conn,
    `(() => {
      const input = document.querySelector(".order-file-input");
      if (!input) return "no-input";
      const next = input.nextElementSibling;
      return next?.classList?.contains("order-file") ? "ok" : "BROKEN:" + (next?.className || next?.tagName);
    })()`,
  );
  // Focus the file input via keyboard: tab through the page until it is active.
  await evaluate(conn, `document.querySelector(".order-file-input")?.scrollIntoView({ block: "center" })`);
  let fileFocus = "not-reached";
  for (let i = 0; i < 60; i++) {
    await pressKey(conn, "Tab", "Tab", 9);
    await sleep(60);
    const active = await evaluate(
      conn,
      `document.activeElement?.classList?.contains("order-file-input") ? "hit" : (document.activeElement?.tagName || "")`,
    );
    if (active === "hit") {
      fileFocus = await evaluate(
        conn,
        `(() => {
          const input = document.activeElement;
          const label = input.nextElementSibling;
          const outline = getComputedStyle(label).outlineColor;
          const width = getComputedStyle(label).outlineWidth;
          const visible = input.matches(":focus-visible");
          return JSON.stringify({ visible, outline, width });
        })()`,
      );
      break;
    }
  }
  results.fileFocusRing = fileFocus;

  // 7: reduced-motion — nothing left hidden or transformed.
  await conn.call("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await navigate(conn, `${origin}/ai-apps/`);
  await sleep(1200);
  results.reducedMotion = await evaluate(
    conn,
    `(() => {
      const bad = [];
      for (const el of document.querySelectorAll(".product-card, .section-heading, .faq-section, .category-card")) {
        const cs = getComputedStyle(el);
        if (Number(cs.opacity) < 0.99) bad.push(el.className + ":opacity=" + cs.opacity);
        if (cs.transform !== "none" && !cs.transform.includes("matrix(1, 0, 0, 1, 0, 0)")) bad.push(el.className + ":transform");
      }
      return bad.length ? bad.slice(0, 5) : "clean";
    })()`,
  );

  // Snapshot real application errors before deliberately triggering one CSP
  // violation. The probe proves that an arbitrary inline script is blocked;
  // its expected browser log must not be confused with an application error.
  results.consoleErrors = [...errors];
  results.hashCspProbe = await evaluate(
    conn,
    `new Promise((resolve) => {
      window.__pstoreHashCspProbeExecuted = false;
      let violation = null;
      const handler = (event) => {
        violation = {
          blockedURI: event.blockedURI,
          effectiveDirective: event.effectiveDirective,
        };
      };
      document.addEventListener("securitypolicyviolation", handler, { once: true });
      const script = document.createElement("script");
      script.textContent = "window.__pstoreHashCspProbeExecuted = true;";
      document.head.append(script);
      setTimeout(() => {
        script.remove();
        resolve({
          executed: window.__pstoreHashCspProbeExecuted,
          violation,
        });
      }, 300);
    })`,
  );

  if (
    results.hashCspProbe?.executed !== false ||
    !results.hashCspProbe?.violation?.effectiveDirective?.startsWith("script-src")
  ) {
    throw new Error(
      `Hash CSP probe failed: ${JSON.stringify(results.hashCspProbe)}`,
    );
  }
  conn.close();
} finally {
  chrome.kill("SIGTERM");
  await sleep(400);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
console.log(JSON.stringify(results, null, 2));
