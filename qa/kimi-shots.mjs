import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Full-page screenshot capture for the local Next.js export.
// Usage: node qa/kimi-shots.mjs <outDir> <origin> <widths csv> <routes csv> [dark]
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputDirectory = path.resolve(process.argv[2]);
const origin = process.argv[3] || "http://localhost:8788";
const widths = (process.argv[4] || "390")
  .split(",")
  .map((v) => Number(v.trim()))
  .filter(Number.isFinite);
const routeList = (process.argv[5] || "/,/creative-apps/,/payment/,/order/")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
const dark = process.argv[6] === "dark";

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
const profile = await mkdtemp(path.join(tmpdir(), "kimi-shots-"));
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

  for (const width of widths) {
    await conn.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 932,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: width,
      screenHeight: 932,
    });
    for (const route of routeList) {
      errors.length = 0;
      const loaded = conn.once("Page.loadEventFired");
      await conn.call("Page.navigate", { url: `${origin}${route}` });
      await loaded;
      await evaluate(
        conn,
        `Promise.all([
          document.fonts?.ready || Promise.resolve(),
          new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        ]).then(() => new Promise((r) => setTimeout(r, 500)))`,
      );
      // Scroll through to trigger reveals, then back to top.
      await evaluate(
        conn,
        `(async () => {
          const step = Math.max(420, Math.floor(innerHeight * 0.75));
          const height = document.documentElement.scrollHeight;
          for (let y = 0; y < height; y += step) {
            scrollTo(0, y);
            await new Promise((r) => requestAnimationFrame(r));
          }
          scrollTo(0, 0);
          await new Promise((r) => setTimeout(r, 300));
        })()`,
      );
      const overflow = await evaluate(
        conn,
        `document.documentElement.scrollWidth > innerWidth ? document.documentElement.scrollWidth : 0`,
      );
      const name = route === "/" ? "home" : route.replaceAll("/", "");
      const shot = await conn.call("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: true,
      });
      await writeFile(
        path.join(outputDirectory, `${name}--${width}px${dark ? "--dark" : ""}.png`),
        Buffer.from(shot.data, "base64"),
      );
      summary.push({ route, width, overflow, errors: [...errors] });
    }
  }
  conn.close();
} finally {
  chrome.kill("SIGTERM");
  await sleep(400);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
console.log(JSON.stringify(summary, null, 2));
