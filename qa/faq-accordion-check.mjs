import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";
const verbose = process.argv.includes("--verbose");
const routes = [
  "ai-apps",
  "communication-apps",
  "computer-keys-and-office-apps",
  "creative-apps",
  "learning-apps",
  "music-apps",
  "premium-vpn-apps",
  "streaming-apps",
];
const viewports = [
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "desktop", width: 1280, height: 900, mobile: false },
];

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitFor(predicate, message, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (predicate()) return;
    await sleep(100);
  }
  throw new Error(message);
}

async function waitForJson(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpConnection {
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
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) {
        listener(message.params);
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

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        this.listeners.set(
          method,
          (this.listeners.get(method) || []).filter((item) => item !== listener),
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
    this.listeners.set(method, [
      ...(this.listeners.get(method) || []),
      listener,
    ]);
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(connection, expression) {
  const result = await connection.call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description ||
        result.exceptionDetails.text ||
        "Evaluation failed",
    );
  }
  return result.result.value;
}

async function navigate(connection, url) {
  const loaded = connection.once("Page.loadEventFired");
  await connection.call("Page.navigate", { url });
  await loaded;
  await evaluate(
    connection,
    `Promise.all([
      document.fonts?.ready || Promise.resolve(),
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    ]).then(() => new Promise((resolve) => setTimeout(resolve, 500)))`,
  );
}

function describeException(exceptionDetails) {
  const description =
    exceptionDetails.exception?.description || exceptionDetails.text || "exception";
  const frames = exceptionDetails.stackTrace?.callFrames || [];
  return {
    description,
    stack: frames.slice(0, 8).map((frame) =>
      `${frame.functionName || "<anonymous>"} (${frame.url}:${frame.lineNumber + 1}:${frame.columnNumber + 1})`,
    ),
  };
}

const profile = await mkdtemp(path.join(tmpdir(), "pstore-faq-check-"));
const port = 9750 + Math.floor(Math.random() * 200);
const chrome = spawn(
  chromeBinary,
  [
    "--headless=new",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const report = {
  origin,
  results: [],
  faqFocusRevalidation: null,
  runtimeExceptions: [],
  consoleErrors: [],
  failedRequests: [],
  failedResponses: [],
};

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  const connection = new CdpConnection(target.webSocketDebuggerUrl);
  await connection.open();
  await connection.call("Page.enable");
  await connection.call("Runtime.enable");
  await connection.call("Log.enable");
  await connection.call("Network.enable");

  let faqRequestCount = 0;

  connection.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    report.runtimeExceptions.push(describeException(exceptionDetails));
  });
  connection.on("Runtime.consoleAPICalled", ({ type, args }) => {
    if (!["error", "warning"].includes(type)) return;
    report.consoleErrors.push(
      args.map((argument) => argument.value || argument.description || "").join(" "),
    );
  });
  connection.on("Log.entryAdded", ({ entry }) => {
    if (entry.level === "error") report.consoleErrors.push(entry.text);
  });
  connection.on("Network.loadingFailed", (event) => {
    if (!event.canceled) {
      report.failedRequests.push(`${event.errorText}: ${event.requestId}`);
    }
  });
  connection.on("Network.requestWillBeSent", ({ request }) => {
    if (new URL(request.url).pathname === "/data/faq.json") {
      faqRequestCount += 1;
    }
  });
  connection.on("Network.responseReceived", ({ response }) => {
    if (response.status >= 400) {
      report.failedResponses.push(`${response.status} ${response.url}`);
    }
  });

  for (const viewport of viewports) {
    await connection.call("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      mobile: viewport.mobile,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });
    await connection.call("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
    });

    for (const route of routes) {
      await navigate(connection, `${origin}/${route}/`);
      if (report.faqFocusRevalidation === null) {
        await waitFor(
          () => faqRequestCount > 0,
          "The storefront did not request /data/faq.json after hydration",
        );
        await sleep(600);
        const beforeFocus = faqRequestCount;
        await evaluate(connection, 'window.dispatchEvent(new Event("focus"))');
        await waitFor(
          () => faqRequestCount > beforeFocus,
          "Returning to an open storefront tab must revalidate /data/faq.json",
        );
        report.faqFocusRevalidation = {
          beforeFocus,
          afterFocus: faqRequestCount,
        };
      }
      const result = await evaluate(
        connection,
        `(async () => {
          const buttons = [...document.querySelectorAll(".faq-question")];
          const steps = [];
          for (let index = 0; index < buttons.length; index += 1) {
            buttons[index].click();
            await new Promise((resolve) => setTimeout(resolve, 320));
            const boundary = document.documentElement.id === "__next_error__" ||
              document.body?.innerText.includes("This page couldn’t load");
            steps.push({
              opened: index + 1,
              expanded: document.querySelectorAll('.faq-question[aria-expanded="true"]').length,
              answers: document.querySelectorAll(".faq-answer").length,
              boundary,
            });
            if (boundary) break;
          }
          const openedAll = {
            expanded: document.querySelectorAll('.faq-question[aria-expanded="true"]').length,
            answers: document.querySelectorAll(".faq-answer").length,
          };
          if (!steps.at(-1)?.boundary) {
            for (const button of [...buttons].reverse()) button.click();
            await new Promise((resolve) => setTimeout(resolve, 320));
          }
          const collapsedAll = {
            expanded: document.querySelectorAll('.faq-question[aria-expanded="true"]').length,
            answers: document.querySelectorAll(".faq-answer").length,
          };
          if (!steps.at(-1)?.boundary) {
            for (const button of buttons.slice(0, 3)) button.click();
            await new Promise((resolve) => setTimeout(resolve, 320));
          }
          const reopenedThree = {
            expanded: document.querySelectorAll('.faq-question[aria-expanded="true"]').length,
            answers: document.querySelectorAll(".faq-answer").length,
          };
          return {
            itemCount: buttons.length,
            steps,
            openedAll,
            collapsedAll,
            reopenedThree,
            errorBoundary: document.documentElement.id === "__next_error__" ||
              document.body?.innerText.includes("This page couldn’t load"),
            hydrationMarkers: document.querySelectorAll("[data-nextjs-error-code]").length,
            horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          };
        })()`,
      );
      report.results.push({ viewport: viewport.name, route, ...result });
    }
  }

  connection.close();
} finally {
  const chromeExited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill("SIGTERM");
  await Promise.race([chromeExited, sleep(2000)]);
  await rm(profile, {
    recursive: true,
    force: true,
    maxRetries: 4,
    retryDelay: 100,
  });
}

const summary = {
  origin,
  scenarios: report.results.length,
  faqFocusRevalidation: report.faqFocusRevalidation,
  faqItemsPerViewport:
    report.results
      .filter((result) => result.viewport === viewports[0].name)
      .reduce((total, result) => total + result.itemCount, 0),
  sequentialOpenChecks: report.results.reduce(
    (total, result) => total + result.steps.length,
    0,
  ),
  maxConcurrentOpen: Math.max(
    ...report.results.map((result) => result.openedAll.expanded),
  ),
  allCollapsed: report.results.every(
    (result) => result.collapsedAll.expanded === 0,
  ),
  threeReopened: report.results.every(
    (result) => result.reopenedThree.expanded === 3,
  ),
  errorBoundaries: report.results.filter((result) => result.errorBoundary).length,
  runtimeExceptions: report.runtimeExceptions.length,
  consoleErrors: report.consoleErrors.length,
  failedRequests: report.failedRequests.length,
  failedResponses: report.failedResponses.length,
  hydrationMarkers: report.results.reduce(
    (total, result) => total + result.hydrationMarkers,
    0,
  ),
  overflowFailures: report.results.filter((result) => result.horizontalOverflow)
    .length,
};

console.log(JSON.stringify(verbose ? report : summary, null, 2));

const failed =
  report.faqFocusRevalidation === null ||
  report.faqFocusRevalidation.afterFocus <=
    report.faqFocusRevalidation.beforeFocus ||
  report.results.some(
    (result) =>
      result.itemCount < 3 ||
      result.errorBoundary ||
      result.openedAll.expanded !== result.itemCount ||
      result.openedAll.answers !== result.itemCount ||
      result.collapsedAll.expanded !== 0 ||
      result.collapsedAll.answers !== 0 ||
      result.reopenedThree.expanded !== 3 ||
      result.reopenedThree.answers !== 3 ||
      result.horizontalOverflow,
  ) ||
  report.runtimeExceptions.length > 0 ||
  report.consoleErrors.length > 0 ||
  report.failedRequests.length > 0 ||
  report.failedResponses.length > 0;

if (failed) process.exitCode = 1;
