import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Plan-modal screenshot capture: opens a product "View Plans" dialog on a
// catalog page at exact viewport sizes and records panel positioning,
// focus behaviour, and Escape close.
// Usage: node qa/kimi-plan-modal-shot.mjs <outDir> <origin> <WxH csv> [dark]
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputDirectory = path.resolve(process.argv[2]);
const origin = process.argv[3] || "http://127.0.0.1:8792";
const sizes = (process.argv[4] || "390x844")
  .split(",")
  .map((v) => v.trim().split("x").map(Number))
  .filter((p) => p.length === 2 && p.every(Number.isFinite));
const dark = process.argv[5] === "dark";
const isMobile = (w) => w < 640;

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

await mkdir(outputDirectory, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), "kimi-plan-modal-"));
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

const summary = [];
try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const t = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: "PUT",
    })
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
  await conn.call("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { localStorage.setItem("ps-theme", "${dark ? "dark" : "light"}"); } catch {}`,
  });
  await conn.call("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
      { name: "prefers-reduced-motion", value: "no-preference" },
    ],
  });

  for (const [width, height] of sizes) {
    await conn.call("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile(width),
      screenWidth: width,
      screenHeight: height,
    });
    errors.length = 0;
    const loaded = conn.once("Page.loadEventFired");
    await conn.call("Page.navigate", { url: `${origin}/ai-apps/` });
    await loaded;
    await evaluate(
      conn,
      `Promise.all([
        document.fonts?.ready || Promise.resolve(),
        new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      ]).then(() => new Promise((r) => setTimeout(r, 400)))`,
    );
    // Open the first product's View Plans dialog and let motion settle.
    const opened = await evaluate(
      conn,
      `(async () => {
        const btn = document.querySelector(".product-card__action");
        if (!btn) return "no-button";
        btn.click();
        await new Promise((r) => setTimeout(r, 800));
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return "no-dialog";
        const r = dialog.getBoundingClientRect();
        return JSON.stringify({
          top: Math.round(r.top),
          bottom: Math.round(innerHeight - r.bottom),
          left: Math.round(r.left),
          right: Math.round(innerWidth - r.right),
          height: Math.round(r.height),
          vh: innerHeight,
          scrollable: dialog.scrollHeight > dialog.clientHeight,
          focused: document.activeElement?.tagName,
          bodyLocked: document.body.style.overflow === "hidden",
        });
      })()`,
    );
    const shot = await conn.call("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
    });
    await writeFile(
      path.join(
        outputDirectory,
        `plan-modal--${width}x${height}${dark ? "--dark" : ""}.png`,
      ),
      Buffer.from(shot.data, "base64"),
    );
    // Verify Escape closes the dialog and focus returns to the trigger.
    await conn.call("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await conn.call("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await sleep(400);
    const closed = await evaluate(
      conn,
      `JSON.stringify({
        state: document.querySelector('[role="dialog"]') ? "still-open" : "closed",
        focusBack: document.activeElement?.classList?.contains("product-card__action") || false,
        bodyUnlocked: document.body.style.overflow !== "hidden",
      })`,
    );
    summary.push({ width, height, opened, afterEscape: JSON.parse(closed), errors: [...errors] });
  }
  conn.close();
} finally {
  chrome.kill("SIGTERM");
  await sleep(400);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
console.log(JSON.stringify(summary, null, 2));
