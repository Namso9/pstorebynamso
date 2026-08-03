import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Post-polish functional verification: interactions, a11y regressions,
// reduced motion, overflow at 320/360/390/430, asset availability.
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://localhost:8788";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForJson(url, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res.json();
    } catch {}
    await sleep(100);
  }
  throw new Error("timeout");
}

const profile = await mkdtemp(path.join(tmpdir(), "kimi-func-"));
const port = 9930 + Math.floor(Math.random() * 60);
const chrome = spawn(
  chromeBinary,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const results = {};
try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const t = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  const socket = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => socket.addEventListener("open", r, { once: true }));
  let nextId = 0;
  const pending = new Map();
  const consoleErrors = [];
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
      return;
    }
    if (msg.method === "Runtime.exceptionThrown") {
      consoleErrors.push(msg.params.exceptionDetails.text || "exception");
    }
    if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
      consoleErrors.push(msg.params.entry.text);
    }
  });
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, (msg) =>
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result),
      );
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await call("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      );
    }
    return result.result.value;
  };

  await call("Page.enable");
  await call("Runtime.enable");
  await call("Log.enable");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });
  await call("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      { name: "prefers-color-scheme", value: "light" },
      { name: "prefers-reduced-motion", value: "no-preference" },
    ],
  });
  const navigate = async (url) => {
    await call("Page.navigate", { url });
    await sleep(1500);
    await evaluate(
      `Promise.all([
        document.fonts?.ready || Promise.resolve(),
        new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      ]).then(() => new Promise((r) => setTimeout(r, 300)))`,
    );
  };

  // 1) Header Telegram button accessible name (mobile width).
  await navigate(`${origin}/`);
  results.telegramButtonName = await evaluate(`(() => {
    const btn = document.querySelector(".site-header .header-bot-button");
    if (!btn) return "MISSING";
    const name = (btn.getAttribute("aria-label") || btn.textContent || "").trim();
    return name.length > 0 ? "OK: " + name.slice(0, 60) : "EMPTY NAME";
  })()`);

  // 2) Theme toggle.
  results.themeToggle = await evaluate(`(() => {
    const before = document.documentElement.dataset.theme;
    document.querySelector(".header-theme-button")?.click();
    const after = document.documentElement.dataset.theme;
    return before && after && before !== after ? "OK " + before + "->" + after : "FAIL";
  })()`);
  await evaluate(`localStorage.setItem("ps-theme", "light")`);
  await navigate(`${origin}/`);

  // 3) Search modal: opens, contains focus, Escape closes.
  results.searchModal = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    document.querySelector('[aria-label="Search products"]')?.click();
    await wait(400);
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) return "FAIL: no dialog";
    const focusInside = dialog.contains(document.activeElement);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await wait(400);
    const closed = !document.querySelector('[role="dialog"]');
    return focusInside && closed ? "OK" : "FAIL focus=" + focusInside + " closed=" + closed;
  })()`);

  // 4) Plan modal + FAQ on category page.
  await navigate(`${origin}/creative-apps/`);
  results.planModal = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    document.querySelector(".product-card__action")?.click();
    await wait(400);
    const open = Boolean(document.querySelector('[role="dialog"] .plan-row'));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await wait(400);
    const closed = !document.querySelector('[role="dialog"]');
    return open && closed ? "OK" : "FAIL open=" + open + " closed=" + closed;
  })()`);
  results.faq = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const q = document.querySelector(".faq-question");
    q?.click();
    await wait(300);
    return q?.getAttribute("aria-expanded") === "true" ? "OK" : "FAIL";
  })()`);

  // 5) Order form: file input directly before label; keyboard focus ring.
  await navigate(`${origin}/order/`);
  results.fileInputOrder = await evaluate(`(() => {
    const input = document.querySelector(".order-file-input");
    if (!input) return "FAIL: no input";
    const next = input.nextElementSibling;
    return next?.classList.contains("order-file") ? "OK" : "FAIL: next=" + next?.className;
  })()`);
  results.fileFocusRing = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const input = document.querySelector(".order-file-input");
    const label = document.querySelector(".order-file");
    input.focus();
    await wait(150);
    const matches = label.matches(":has(.order-file-input:focus-visible)") ||
      getComputedStyle(label).outlineStyle !== "none" ||
      getComputedStyle(label).boxShadow !== "none";
    return matches ? "OK" : "FAIL";
  })()`);

  // 6) Reduced motion: no hidden/transformed content after full scroll.
  await call("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      { name: "prefers-color-scheme", value: "light" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await navigate(`${origin}/`);
  results.reducedMotion = await evaluate(`(async () => {
    const step = Math.max(420, Math.floor(innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    await new Promise((r) => setTimeout(r, 300));
    const stuck = [];
    for (const el of document.querySelectorAll(".home-page section, .category-card, .trust-card")) {
      const s = getComputedStyle(el);
      if (Number(s.opacity) < 0.99 || (s.transform !== "none" && !s.transform.includes("matrix(1, 0, 0, 1, 0, 0)"))) stuck.push(el.className);
    }
    return stuck.length === 0 ? "OK" : "FAIL " + stuck.join(",");
  })()`);
  await call("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      { name: "prefers-color-scheme", value: "light" },
      { name: "prefers-reduced-motion", value: "no-preference" },
    ],
  });

  // 7) Overflow at 320/360/390/430 on home.
  results.overflow = [];
  for (const width of [320, 360, 390, 430]) {
    await call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: width,
      screenHeight: 844,
    });
    await navigate(`${origin}/`);
    const bad = await evaluate(`(() => {
      if (document.documentElement.scrollWidth > innerWidth) return "scrollWidth=" + document.documentElement.scrollWidth;
      const wide = [...document.querySelectorAll("body *")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width && (r.right > innerWidth + 0.5 || r.left < -0.5);
      }).slice(0, 3).map((el) => el.className);
      return wide.length ? "elements: " + wide.join(",") : null;
    })()`);
    results.overflow.push(`${width}px: ${bad ?? "OK"}`);
  }

  // 8) Assets and data availability.
  results.assets = await evaluate(`(async () => {
    const urls = ["/products.json", "/data/faq.json", "/images/brand-logo.png", "/images/bg.webp"];
    const out = [];
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: "HEAD" });
        out.push(url + "=" + res.status);
      } catch { out.push(url + "=FETCHFAIL"); }
    }
    return out.join(" ");
  })()`);

  results.consoleErrors = consoleErrors.length ? consoleErrors : "none";
  socket.close();
} finally {
  chrome.kill("SIGTERM");
  await sleep(400);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
console.log(JSON.stringify(results, null, 2));
