// Throwaway: capture the theme switch in both modes for visual review.
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";
const outDir = process.argv[3] || "qa/shots/theme-switch";
const profile = await mkdtemp(path.join(tmpdir(), "pstore-shots-"));
const port = 10300 + Math.floor(Math.random() * 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForJson(url) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
    } catch {}
    await sleep(100);
  }
  throw new Error("timeout");
}

class Cdp {
  constructor(url) {
    this.id = 0;
    this.pending = new Map();
    this.socket = new WebSocket(url);
  }
  open() {
    return new Promise((res, rej) => {
      this.socket.addEventListener("open", res, { once: true });
      this.socket.addEventListener("error", rej, { once: true });
    });
    // note: message handler below
  }
  attach() {
    this.socket.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(m.error.message)) : resolve(m.result);
      }
    });
  }
  call(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
}

const chrome = spawn(chromeBinary, [
  "--headless=new", "--hide-scrollbars", "--no-first-run",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  cdp.attach();
  await cdp.open();
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });

  await cdp.call("Page.navigate", { url: `${origin}/` });
  await sleep(1500);

  const rect = await cdp.call("Runtime.evaluate", {
    expression: `JSON.stringify(document.querySelector(".theme-switch").getBoundingClientRect())`,
    returnByValue: true,
  });
  const r = JSON.parse(rect.result.value);
  const clip = { x: r.x - 12, y: r.y - 8, width: r.width + 24, height: r.height + 16, scale: 3 };

  // light (default after hydration, stored cleared)
  await cdp.call("Runtime.evaluate", { expression: `localStorage.removeItem("ps-theme")` });
  let shot = await cdp.call("Page.captureScreenshot", { clip });
  await writeFile(`${outDir}/switch-light.png`, Buffer.from(shot.data, "base64"));

  // mid-transition
  await cdp.call("Runtime.evaluate", { expression: `document.querySelector(".theme-switch").click()` });
  await sleep(280);
  shot = await cdp.call("Page.captureScreenshot", { clip });
  await writeFile(`${outDir}/switch-mid.png`, Buffer.from(shot.data, "base64"));

  // settled dark
  await sleep(700);
  shot = await cdp.call("Page.captureScreenshot", { clip });
  await writeFile(`${outDir}/switch-dark.png`, Buffer.from(shot.data, "base64"));

  // header context shot (dark)
  await cdp.call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  shot = await cdp.call("Page.captureScreenshot", {
    clip: { x: 0, y: 0, width: 390, height: 120, scale: 2 },
  });
  await writeFile(`${outDir}/header-dark.png`, Buffer.from(shot.data, "base64"));

  console.log("shots written to", outDir);
} finally {
  chrome.kill();
  await new Promise((res) => { chrome.once("exit", res); setTimeout(res, 3000); });
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
