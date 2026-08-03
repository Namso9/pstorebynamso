import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Retest the two artifact failures with realistic input: theme toggle with a
// React flush wait, and file-input focus via real Tab key events.
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

const profile = await mkdtemp(path.join(tmpdir(), "kimi-retest-"));
const port = 9970 + Math.floor(Math.random() * 25);
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
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      );
    }
    return result.result.value;
  };
  const tab = async () => {
    await call("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await call("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Tab",
      code: "Tab",
      windowsVirtualKeyCode: 9,
    });
    await sleep(120);
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
  await call("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-color-scheme", value: "light" }],
  });

  // Theme toggle with a React flush wait; seed "light" so the click cycles
  // light -> dark (from system the first click resolves to light again).
  await call("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { localStorage.setItem("ps-theme", "light"); } catch {}`,
  });
  await call("Page.navigate", { url: `${origin}/` });
  await sleep(1600);
  results.themeToggle = await evaluate(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const before = document.documentElement.dataset.theme;
    document.querySelector(".header-theme-button")?.click();
    await wait(400);
    const after = document.documentElement.dataset.theme;
    const stored = localStorage.getItem("ps-theme");
    return before && after && before !== after
      ? "OK " + before + "->" + after + " stored=" + stored
      : "FAIL before=" + before + " after=" + after;
  })()`);

  // File-input keyboard focus: Tab through the form until the file input is
  // focused, then inspect the visible label's outline.
  await call("Page.navigate", { url: `${origin}/order/` });
  await sleep(1600);
  await evaluate(`document.body.click?.()`);
  let focusResult = "FAIL: input never focused";
  for (let i = 0; i < 40; i++) {
    await tab();
    const state = await evaluate(`(() => {
      const active = document.activeElement;
      if (!active?.classList?.contains("order-file-input")) return null;
      const label = active.nextElementSibling;
      const style = getComputedStyle(label);
      return {
        sibling: label?.classList?.contains("order-file") ?? false,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        borderColor: style.borderColor,
      };
    })()`);
    if (state) {
      focusResult = JSON.stringify(state);
      break;
    }
  }
  results.fileFocusRing = focusResult;
  socket.close();
} finally {
  chrome.kill("SIGTERM");
  await sleep(400);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
console.log(JSON.stringify(results, null, 2));
