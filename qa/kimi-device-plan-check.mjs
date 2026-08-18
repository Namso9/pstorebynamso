import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

// Plan-dialog backdrop blur verification on the connected Android device.
// Requires: adb forward tcp:9333 localabstract:chrome_devtools_remote
// Usage: node qa/kimi-device-plan-check.mjs [outDir]
const run = promisify(execFile);
const outDir = process.argv[2] || "qa/shots/device-check";
// qa/shots/ is not in git any more (its captures were deleted 2026-08-18), so the
// directory may not exist — create it instead of failing on the first write.
await mkdir(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const screencap = async (name) => {
  const { stdout } = await run("adb", ["exec-out", "screencap", "-p"], {
    encoding: "buffer",
    maxBuffer: 32 * 1024 * 1024,
  });
  await writeFile(`${outDir}/${name}.png`, stdout);
};

const targets = await (await fetch("http://127.0.0.1:9333/json/list")).json();
let page = targets.find((t) => t.type === "page");
if (!page) throw new Error("No page target on the device");
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
const send = (method, params = {}, timeoutMs = 15000) =>
  Promise.race([
    new Promise((resolve) => {
      const id = ++messageId;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    }),
    sleep(timeoutMs).then(() => null),
  ]);
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return response?.result?.result?.value;
};
const tapCss = async (x, y) => {
  await send("Input.dispatchTouchEvent", {
    type: "touchStart", touchPoints: [{ x, y }],
  });
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
};
const centerOf = async (selector) => {
  const rect = JSON.parse(await evaluate(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  })()`));
  return rect;
};

const results = {};
await evaluate(`window.location.href = "https://pstorebynamso.com/ai-apps/"`);
await sleep(5000);
results.url = await evaluate(`window.location.href`);
for (let i = 0; i < 12; i++) {
  const btn = await centerOf(".product-card__action");
  if (btn) {
    await tapCss(btn.x, btn.y);
    await sleep(700);
    if (await evaluate(`Boolean(document.querySelector('[role="dialog"]'))`)) break;
  }
  await sleep(500);
}
results.dialogOpen = await evaluate(
  `Boolean(document.querySelector('[role="dialog"]'))`,
);
await sleep(600);
results.planBackdrop = JSON.parse(await evaluate(`(() => {
  const el = document.querySelector(".modal-backdrop");
  if (!el) return null;
  const cs = getComputedStyle(el);
  return JSON.stringify({ backdropFilter: cs.backdropFilter,
    background: cs.backgroundColor, position: cs.position,
    zIndex: cs.zIndex });
})()`));
results.bodyScrollLocked = await evaluate(
  `getComputedStyle(document.body).overflow`,
);
results.panel = JSON.parse(await evaluate(`(() => {
  const el = document.querySelector(".modal-panel");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return JSON.stringify({ top: Math.round(r.top),
    bottom: Math.round(r.bottom),
    viewportHeight: Math.round(window.innerHeight) });
})()`));
await screencap("plan-modal-blur");
await evaluate(`document.querySelector('.modal-close')?.click()`);
console.log(JSON.stringify(results, null, 2));
ws.close();
