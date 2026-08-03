import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const outputDirectory = path.resolve(
  process.argv[2] || "qa/comparisons/current",
);
const previewOrigin = process.argv[3] || "http://localhost:8788";
const widths = (process.argv[4] || "390")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter(Number.isFinite);

const routeDefinitions = [
  { name: "home", production: "/", preview: "/" },
  {
    name: "creative-apps",
    production: "/creative-apps.html",
    preview: "/creative-apps/",
  },
  { name: "payment", production: "/payment.html", preview: "/payment/" },
  { name: "order", production: "/order.html", preview: "/order/" },
  { name: "reviews", production: "/reviews.html", preview: "/reviews/" },
  {
    name: "expressvpn-location-guide",
    production: "/expressvpn-location-guide.html",
    preview: "/expressvpn-location-guide/",
  },
  {
    name: "terms-of-service",
    production: "/terms-of-service.html",
    preview: "/terms-of-service/",
  },
  {
    name: "terms-of-service-vpn",
    production: "/terms-of-service-vpn.html",
    preview: "/terms-of-service-vpn/",
  },
];
const requestedRouteNames = (process.argv[5] || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const routes = requestedRouteNames.length
  ? routeDefinitions.filter((route) => requestedRouteNames.includes(route.name))
  : routeDefinitions;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForJson(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Chrome may still be opening its debugging socket.
    }
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
      this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
    });
  }

  on(method, listener) {
    this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
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
    throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
  }
  return result.result.value;
}

async function navigate(connection, url) {
  const loaded = connection.once("Page.loadEventFired");
  await connection.call("Page.navigate", { url });
  await loaded;
  await evaluate(
    connection,
    `(async () => {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        if (!document.body.textContent?.includes("Loading products...")) return;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    })()`,
  );
  await evaluate(
    connection,
    `Promise.all([
      document.fonts?.ready || Promise.resolve(),
      new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    ]).then(() => new Promise((resolve) => setTimeout(resolve, 350)))`,
  );
  await evaluate(
    connection,
    `(async () => {
      const step = Math.max(420, Math.floor(innerHeight * 0.75));
      const height = document.documentElement.scrollHeight;
      for (let y = 0; y < height; y += step) {
        scrollTo(0, y);
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      scrollTo(0, 0);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 150));
    })()`,
  );
}

async function inspectPage(connection) {
  return evaluate(
    connection,
    `(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const value = element.getBoundingClientRect();
        return {
          x: Math.round(value.x * 10) / 10,
          y: Math.round(value.y * 10) / 10,
          width: Math.round(value.width * 10) / 10,
          height: Math.round(value.height * 10) / 10,
        };
      };
      const columns = (selector) => {
        const values = [...document.querySelectorAll(selector)]
          .map((element) => Math.round(element.getBoundingClientRect().x));
        return new Set(values).size;
      };
      return {
        title: document.title,
        viewportWidth: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        theme: document.documentElement.dataset.theme ||
          (document.documentElement.classList.contains("theme-light") ? "light" : "dark"),
        header: rect(".site-header"),
        heading: rect("h1"),
        catalog: rect(".category-grid, .product-container"),
        productGrid: rect(".product-grid, .app-list"),
        paymentCard: rect(".payment-card-next, .payment-card"),
        orderCard: rect(".order-form-card-next, .order-form-card"),
        reviewGrid: rect(".review-grid, .proof-grid"),
        footer: rect(".site-footer, .route-footer"),
        landmarks: {
          trust: rect(".trust-grid"),
          reviews: rect(".review-preview, .proof-section"),
          bot: rect(".bot-callout, .bot-cta-container"),
          purchase: rect(".purchase-guide, .guide-container"),
          channels: rect(".official-channels"),
        },
        guideSets: [...document.querySelectorAll(".location-guide, .lg-set")].map((element) => {
          const value = element.getBoundingClientRect();
          return {
            y: Math.round(value.y * 10) / 10,
            height: Math.round(value.height * 10) / 10,
          };
        }),
        guideCards: [...document.querySelectorAll(".location-step, .lg-card")].map((element) => {
          const value = element.getBoundingClientRect();
          return {
            y: Math.round(value.y * 10) / 10,
            height: Math.round(value.height * 10) / 10,
          };
        }),
        guideParts: [...document.querySelectorAll(
          ".connection-shell, .connection-status, .connection-body, .selected-location, .connection-ip-block, .connection-details, .connection-assistant, .conn, .conn-top, .conn-body, .loc-row, .conn-block, .grid2, .sda",
        )].map((element) => {
          const value = element.getBoundingClientRect();
          return {
            className: element.className,
            y: Math.round(value.y * 10) / 10,
            height: Math.round(value.height * 10) / 10,
          };
        }),
        homeSections: [...document.querySelectorAll(".home-page > section")].map((element) => {
          const value = element.getBoundingClientRect();
          return {
            className: element.className,
            y: Math.round(value.y * 10) / 10,
            height: Math.round(value.height * 10) / 10,
          };
        }),
        categoryCards: document.querySelectorAll(".category-card, .product-container .card-link").length,
        productCards: document.querySelectorAll(".product-card, .app-item").length,
        productColumns: columns(".product-grid > *, .app-list > .app-item"),
      };
    })()`,
  );
}

async function verifyInteractions(connection, routeName, isPreview) {
  if (!isPreview) return null;
  return evaluate(
    connection,
    `(async () => {
      const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
      const result = { search: false, motion: false, theme: false, plans: null, faq: null };
      const themeButton = document.querySelector('.header-theme-button');
      const initialTheme = document.documentElement.dataset.theme;
      themeButton?.click();
      await wait(80);
      result.theme = Boolean(initialTheme && document.documentElement.dataset.theme !== initialTheme);
      const search = document.querySelector('[aria-label="Search products"]');
      search?.click();
      await wait(80);
      result.search = Boolean(document.querySelector('[role="dialog"]'));
      result.motion = Boolean(document.querySelector('.modal-backdrop[style]'));
      document.querySelector('[aria-label="Close dialog"]')?.click();
      await wait(260);
      if (${JSON.stringify(routeName)} === "creative-apps") {
        document.querySelector('.product-card__action')?.click();
        await wait(100);
        result.plans = Boolean(document.querySelector('[role="dialog"]'));
        document.querySelector('[aria-label="Close dialog"]')?.click();
        await wait(260);
        const faq = document.querySelector('.faq-question');
        faq?.click();
        await wait(80);
        result.faq = faq?.getAttribute('aria-expanded') === 'true';
      }
      return result;
    })()`,
  );
}

await mkdir(outputDirectory, { recursive: true });
const profileDirectory = await mkdtemp(path.join(tmpdir(), "pstore-cdp-"));
const port = 9333 + Math.floor(Math.random() * 300);
const chrome = spawn(
  chromeBinary,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDirectory}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const report = [];
try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const targetResponse = await fetch(
    `http://127.0.0.1:${port}/json/new?about:blank`,
    { method: "PUT" },
  );
  const target = await targetResponse.json();
  const connection = new CdpConnection(target.webSocketDebuggerUrl);
  await connection.open();
  await connection.call("Page.enable");
  await connection.call("Runtime.enable");
  await connection.call("Log.enable");
  const browserErrors = [];
  connection.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    browserErrors.push(exceptionDetails.text || "Unhandled exception");
  });
  connection.on("Log.entryAdded", ({ entry }) => {
    if (entry.level === "error") browserErrors.push(entry.text);
  });
  await connection.call("Page.addScriptToEvaluateOnNewDocument", {
    source: `try { localStorage.setItem("ps-theme", "light"); } catch {}`,
  });

  for (const width of widths) {
    await connection.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 932,
      deviceScaleFactor: 1,
      mobile: true,
      screenWidth: width,
      screenHeight: 932,
    });
    await connection.call("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [
        { name: "prefers-color-scheme", value: "light" },
        { name: "prefers-reduced-motion", value: "no-preference" },
      ],
    });

    for (const route of routes) {
      for (const targetSite of ["production", "preview"]) {
        const origin =
          targetSite === "production"
            ? "https://pstorebynamso.com"
            : previewOrigin;
        const url = `${origin}${route[targetSite]}`;
        browserErrors.length = 0;
        await navigate(connection, url);
        const metrics = await inspectPage(connection);
        const screenshot = await connection.call("Page.captureScreenshot", {
          format: "png",
          fromSurface: true,
          captureBeyondViewport: false,
        });
        const interactions = await verifyInteractions(
          connection,
          route.name,
          targetSite === "preview",
        );
        const filename = `${route.name}--${targetSite}--${width}px.png`;
        await writeFile(
          path.join(outputDirectory, filename),
          Buffer.from(screenshot.data, "base64"),
        );
        report.push({
          route: route.name,
          target: targetSite,
          width,
          url,
          metrics,
          interactions,
          browserErrors: [...browserErrors],
        });
      }
    }
  }
  connection.close();
} finally {
  chrome.kill("SIGTERM");
  await sleep(400);
  try {
    await rm(profileDirectory, { recursive: true, force: true });
  } catch {
    await sleep(600);
    await rm(profileDirectory, { recursive: true, force: true });
  }
}

await writeFile(
  path.join(outputDirectory, "report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
