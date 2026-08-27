/**
 * Does a home-page product card open its plans ON the home page?
 *
 * Owner report, 2026-08-28: tapping a Myanmar-row (or popular-row) card
 * followed the card's href into the product's category page before the modal
 * appeared, so closing the modal stranded the visitor somewhere they never
 * chose to go. The fix opens the PlanModal in place (HomeCatalog hosts it) —
 * and this pins the three parts of that promise a code read cannot:
 *   1. a plain tap opens the modal and the URL STAYS "/",
 *   2. closing it lands the visitor back on the untouched home page,
 *   3. a modifier click (cmd/ctrl) still navigates — the href survives.
 *
 *   node qa/home-plan-modal-check.mjs                          # a served out/ (default)
 *   node qa/home-plan-modal-check.mjs https://pstorebynamso.com # the live site
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForJson(url, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
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
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const m = JSON.parse(event.data);
      if (m.id) {
        const p = this.pending.get(m.id);
        if (!p) return;
        this.pending.delete(m.id);
        if (m.error) p.reject(new Error(m.error.message));
        else p.resolve(m.result);
        return;
      }
      for (const l of this.listeners.get(m.method) || []) l(m.params);
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

async function evaluate(cdp, expression) {
  const r = await cdp.call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(
      r.exceptionDetails.exception?.description ||
        r.exceptionDetails.text ||
        "Evaluation failed",
    );
  }
  return r.result.value;
}

const READ = `(() => {
  const modal = document.querySelector('.catalog-modal');
  return {
    path: location.pathname,
    hash: location.hash,
    modalOpen: Boolean(modal && modal.offsetParent !== null),
    modalTitle: modal?.querySelector('h2, h3, [class*="title"]')?.textContent?.trim() || '',
    planRows: modal ? modal.querySelectorAll('button, a').length : 0,
  };
})()`;

const profile = await mkdtemp(path.join(tmpdir(), "pstore-home-modal-"));
const port = 9950 + Math.floor(Math.random() * 40);
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

let failures = 0;
const check = (ok, label) => {
  console.log(`  ${ok ? "PASS " : "FAIL "} ${label}`);
  if (!ok) failures += 1;
};

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const target = await (
    await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
      method: "PUT",
    })
  ).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  console.log(`origin: ${origin}\n`);
  await cdp.call("Page.navigate", { url: `${origin}/?cb=${Date.now()}` });
  await sleep(2500); // hydration + first catalog poll

  // Cards render only for ids the live catalog resolves; take whatever the
  // Myanmar row's first card is rather than assuming a specific product.
  const cardId = await evaluate(
    cdp,
    `document.querySelector('.myanmar-vpn-row .popular-card')?.dataset.product || ''`,
  );
  check(Boolean(cardId), `the Myanmar row has a first card (${cardId})`);

  // 1. plain click -> modal opens, URL untouched
  await evaluate(
    cdp,
    `document.querySelector('.myanmar-vpn-row .popular-card').click();
     new Promise((r) => setTimeout(r, 600))`,
  );
  let s = await evaluate(cdp, READ);
  check(s.modalOpen, "a plain tap opens the plan modal");
  check(
    s.path === "/" && s.hash === "",
    `the URL stays "/" (got ${s.path}${s.hash})`,
  );

  // 2. close -> still home, modal gone
  await evaluate(
    cdp,
    `(document.querySelector('.catalog-modal [aria-label*="lose"], .catalog-modal [class*="close"]')
        || document.querySelector('.modal-backdrop, [class*="backdrop"]'))?.click();
     new Promise((r) => setTimeout(r, 500))`,
  );
  s = await evaluate(cdp, READ);
  check(!s.modalOpen, "closing the modal removes it");
  check(s.path === "/", `still on the home page after close (got ${s.path})`);

  // 3. popular row behaves the same (it exists only when data resolves)
  const popularCard = await evaluate(
    cdp,
    `document.querySelector('.popular-products:not(.myanmar-vpn-row) .popular-card')?.dataset.product || ''`,
  );
  if (popularCard) {
    await evaluate(
      cdp,
      `document.querySelector('.popular-products:not(.myanmar-vpn-row) .popular-card').click();
       new Promise((r) => setTimeout(r, 600))`,
    );
    s = await evaluate(cdp, READ);
    check(
      s.modalOpen && s.path === "/",
      `the popular row opens in place too (${popularCard})`,
    );
    await evaluate(
      cdp,
      `(document.querySelector('.catalog-modal [aria-label*="lose"], .catalog-modal [class*="close"]')
          || document.querySelector('.modal-backdrop, [class*="backdrop"]'))?.click();
       new Promise((r) => setTimeout(r, 400))`,
    );
  } else {
    console.log("  SKIP  popular row empty in this build — nothing to click");
  }

  // 4. a cmd-click must NOT be hijacked: the href still wins. Dispatched as a
  // synthetic event because headless Chrome cannot hold a real Meta key.
  const hijacked = await evaluate(
    cdp,
    `(() => {
      const card = document.querySelector('.myanmar-vpn-row .popular-card');
      const event = new MouseEvent('click', {
        bubbles: true, cancelable: true, metaKey: true, button: 0,
      });
      card.dispatchEvent(event);
      // If our handler called preventDefault, it stole the modifier click.
      return event.defaultPrevented;
    })()`,
  );
  await sleep(300);
  check(!hijacked, "a cmd-click keeps its default (href) behaviour");

  cdp.close();
} finally {
  chrome.kill("SIGKILL");
  await rm(profile, { recursive: true, force: true });
}

if (failures) {
  console.error(
    `\n${failures} home plan-modal check(s) failed against ${origin}.`,
  );
  process.exit(1);
}
console.log(`\nAll home plan-modal checks passed against ${origin}.`);
