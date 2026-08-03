import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Reduced-motion + glass-contrast verification at 390px.
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

const profile = await mkdtemp(path.join(tmpdir(), "kimi-rm-"));
const port = 9901 + Math.floor(Math.random() * 90);
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
  socket.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
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
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };

  await call("Page.enable");
  await call("Runtime.enable");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });

  // 1) Reduced motion: nothing should be left hidden or transformed.
  await call("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [
      { name: "prefers-color-scheme", value: "light" },
      { name: "prefers-reduced-motion", value: "reduce" },
    ],
  });
  await call("Page.navigate", { url: `${origin}/` });
  await sleep(1600);
  const reduced = await evaluate(`(async () => {
    const step = Math.max(420, Math.floor(innerHeight * 0.75));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    await new Promise((r) => setTimeout(r, 300));
    const stuck = [];
    for (const el of document.querySelectorAll(".home-page section, .trust-card, .category-card")) {
      const style = getComputedStyle(el);
      if (Number(style.opacity) < 0.99 || (style.transform !== "none" && !style.transform.includes("matrix(1, 0, 0, 1, 0, 0)"))) {
        stuck.push(el.className);
      }
    }
    return { stuck };
  })()`);
  console.log("reduced-motion stuck elements:", JSON.stringify(reduced.stuck));

  // 2) Glass contrast: composite the glass surface over the page canvas and
  //    measure the actual text contrast on .bot-callout in both themes.
  const contrast = async (theme) => {
    await call("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [
        { name: "prefers-color-scheme", value: theme },
        { name: "prefers-reduced-motion", value: "no-preference" },
      ],
    });
    await call("Page.addScriptToEvaluateOnNewDocument", {
      source: `try { localStorage.setItem("ps-theme", "${theme}"); } catch {}`,
    });
    await call("Page.navigate", { url: `${origin}/` });
    await sleep(1500);
    return evaluate(`(() => {
      const parse = (value) => {
        const match = value.match(/rgba?\\(([^)]+)\\)/);
        if (!match) return null;
        const parts = match[1].split(",").map((v) => parseFloat(v));
        return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
      };
      const lum = ({ r, g, b }) => {
        const f = (c) => {
          c /= 255;
          return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const over = (fg, bg) => ({
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
      });
      const ratio = (a, b) => {
        const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
        return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
      };
      const canvas = parse(getComputedStyle(document.documentElement).backgroundColor);
      const section = document.querySelector(".bot-callout");
      const surface = parse(getComputedStyle(section).backgroundColor);
      const bg = surface.a >= 1 ? surface : over(surface, canvas);
      const heading = section.querySelector("h2");
      const copy = section.querySelector(".bot-callout__copy > p");
      const inkC = parse(getComputedStyle(heading).color);
      const mutC = parse(getComputedStyle(copy).color);
      const inkEff = inkC.a >= 1 ? inkC : over(inkC, bg);
      const mutEff = mutC.a >= 1 ? mutC : over(mutC, bg);
      return {
        themeAttr: document.documentElement.dataset.theme || null,
        surfaceAlpha: surface.a,
        heading: ratio(inkEff, bg),
        copy: ratio(mutEff, bg),
      };
    })()`);
  };
  console.log("light bot-callout:", JSON.stringify(await contrast("light")));
  console.log("dark bot-callout:", JSON.stringify(await contrast("dark")));
  socket.close();
} finally {
  chrome.kill("SIGTERM");
  await sleep(400);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
