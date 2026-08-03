import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// One-off interactive captures: order summary with product/plan params, and
// the plan + checkout modals open, at 390px in both themes.
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputDirectory = path.resolve(process.argv[2]);
const origin = process.argv[3] || "http://localhost:8788";

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
      }
    });
  }
  call(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
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
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text ||
        "evaluation failed",
    );
  }
  return result.result.value;
}

await mkdir(outputDirectory, { recursive: true });
const profile = await mkdtemp(path.join(tmpdir(), "kimi-modal-"));
const port = 9855 + Math.floor(Math.random() * 100);
const chrome = spawn(
  chromeBinary,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const report = [];
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
  await conn.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });

  const navigate = async (url) => {
    await conn.call("Page.navigate", { url });
    await sleep(1400);
    await evaluate(
      conn,
      `Promise.all([
        document.fonts?.ready || Promise.resolve(),
        new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      ]).then(() => new Promise((r) => setTimeout(r, 400)))`,
    );
  };
  const shot = async (name) => {
    const s = await conn.call("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
    });
    await writeFile(
      path.join(outputDirectory, `${name}.png`),
      Buffer.from(s.data, "base64"),
    );
  };

  for (const theme of ["light", "dark"]) {
    await conn.call("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-color-scheme", value: theme }],
    });
    await navigate(`${origin}/`);
    await evaluate(conn, `localStorage.setItem("ps-theme", "${theme}")`);

    // Order summary panel with product + plan params.
    await navigate(`${origin}/order/?product=picsart&plan=6_months`);
    const hasSummary = await evaluate(
      conn,
      `Boolean(document.querySelector(".order-summary-next__price"))`,
    );
    report.push({ theme, check: "order-summary", hasSummary });
    await shot(`order-summary--390px--${theme}`);

    // Plan modal open from a category page.
    await navigate(`${origin}/creative-apps/`);
    await evaluate(
      conn,
      `document.querySelector(".product-card__action")?.click();
       new Promise((r) => setTimeout(r, 500))`,
    );
    const modalOpen = await evaluate(
      conn,
      `Boolean(document.querySelector('[role="dialog"] .plan-row'))`,
    );
    report.push({ theme, check: "plan-modal", modalOpen });
    await shot(`plan-modal--390px--${theme}`);

    // First plan row -> checkout modal.
    await evaluate(
      conn,
      `document.querySelector("button.plan-row")?.click();
       new Promise((r) => setTimeout(r, 500))`,
    );
    const checkoutOpen = await evaluate(
      conn,
      `Boolean(document.querySelector('[role="dialog"] .checkout-option'))`,
    );
    report.push({ theme, check: "checkout-modal", checkoutOpen });
    await shot(`checkout-modal--390px--${theme}`);
  }
  conn.close();
} finally {
  chrome.kill("SIGTERM");
  await sleep(400);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
console.log(JSON.stringify(report, null, 2));
