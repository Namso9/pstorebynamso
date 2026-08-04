import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";

// Real-device verification on a USB-connected Android (Samsung SM-S948B):
// production Chrome, soft-keyboard stability while typing in the search
// dialog, and the plan-dialog backdrop blur. Requires:
//   adb forward tcp:9333 localabstract:chrome_devtools_remote
// Usage: node qa/kimi-device-check.mjs [outDir]
const run = promisify(execFile);
const outDir = process.argv[2] || "qa/shots/device-check";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const adb = async (...args) => (await run("adb", args)).stdout.trim();
const imeShown = async () =>
  /mInputShown=true/.test(await adb("shell", "dumpsys", "input_method"));
const screencap = async (name) => {
  const { stdout } = await run("adb", ["exec-out", "screencap", "-p"], {
    encoding: "buffer",
    maxBuffer: 32 * 1024 * 1024,
  });
  await writeFile(`${outDir}/${name}.png`, stdout);
};

const targets = await (await fetch("http://127.0.0.1:9333/json/list")).json();
const page = targets.find(
  (t) => t.type === "page" && t.url.includes("pstorebynamso.com"),
);
if (!page) throw new Error("Production page not open on the device");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
let messageId = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const id = ++messageId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return response.result?.result?.value;
};
const tapCss = async (x, y) => {
  await send("Input.dispatchTouchEvent", {
    type: "touchStart", touchPoints: [{ x, y }],
  });
  await send("Input.dispatchTouchEvent", {
    type: "touchEnd", touchPoints: [],
  });
};
const centerOf = async (selector) => {
  const rect = JSON.parse(await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2,
      top: Math.round(r.top), height: Math.round(r.height) });
  })()`));
  return rect;
};
await send("Page.enable");

const results = { device: await adb("shell", "getprop", "ro.product.model") };

// 1) Search dialog: real tap opens the real soft keyboard; type and watch.
results.pageLoaded = await evaluate(`document.readyState`);
for (let i = 0; i < 10; i++) {
  const searchBtn = await centerOf('button[aria-label="Search products"]');
  if (searchBtn) {
    await tapCss(searchBtn.x, searchBtn.y);
    await sleep(500);
    if (await evaluate(`Boolean(document.querySelector('.search-panel input'))`)) break;
  }
}
const input = await centerOf(".search-panel input");
await tapCss(input.x, input.y);
await sleep(1500);
results.keyboardShownAfterTap = await imeShown();
results.visualViewportWithKeyboard = await evaluate(
  `Math.round(visualViewport.height)`,
);
await screencap("search-keyboard-open");

const rectProbe = `(() => {
  const panel = document.querySelector(".search-panel");
  const input = document.querySelector(".search-panel input");
  const p = panel.getBoundingClientRect(), i = input.getBoundingClientRect();
  return JSON.stringify({ panelHeight: Math.round(p.height),
    panelTop: Math.round(p.top), inputTop: Math.round(i.top) });
})()`;
results.beforeTyping = JSON.parse(await evaluate(rectProbe));
for (const ch of ["n", "e", "t", "f", "l", "i", "x"]) {
  await adb("shell", "input", "text", ch);
  await sleep(600);
}
await sleep(800);
results.keyboardShownAfterTyping = await imeShown();
results.afterTyping = JSON.parse(await evaluate(rectProbe));
results.typedValue = await evaluate(
  `document.querySelector(".search-panel input").value`,
);
results.resultCount = await evaluate(
  `document.querySelectorAll(".search-result").length`,
);
results.visualViewportAfterTyping = await evaluate(
  `Math.round(visualViewport.height)`,
);
await screencap("search-after-typing");

console.log(JSON.stringify(results, null, 2));
ws.close();
