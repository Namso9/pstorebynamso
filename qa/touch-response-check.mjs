// Touch behaviour on a phone-shaped, CPU-throttled Chrome: a real tap must act
// on the first try, a swipe that starts on a control must neither activate it
// nor select its text, and the haptic overlay must not exist on any surface a
// finger scrolls over.
//
// Written for the 2026-08-24 owner report: "scrolling ရတာလေးသွားတယ် / products
// တွေကို နှိပ်တာ ချက်ချင်းမရဘူး / back back to home နှစ်ခါနှိပ်နေရတယ် / faq ကို
// ပွတ်ဆွဲရင် auto select ဖြစ်နေတယ်". Amended the same day for the follow-up:
// "view plan ကိုထောက်မိပြီး ပွတ်ဆွဲလိုက်တာကို scroll မဖြစ်ဘဲ view plan
// ပွင့်လာပါတယ်" — the overlay left the View Plans button too, and a swipe that
// starts on View Plans must now scroll the page and open nothing.
//
//     node qa/touch-response-check.mjs [origin]
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const chromeBinary = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const origin = process.argv[2] || "http://127.0.0.1:8791";
const profile = await mkdtemp(path.join(tmpdir(), "pstore-touch-"));
const port = 9940 + Math.floor(Math.random() * 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// An iOS 18 UA: the only configuration that mounts `HapticSwitch` at all, so
// this is where "is the overlay still on a scroll surface" can be answered.
const IOS_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

class Cdp {
  constructor(url) {
    this.id = 0; this.pending = new Map(); this.listeners = new Map();
    this.socket = new WebSocket(url);
  }
  async open() {
    await new Promise((res, rej) => {
      this.socket.addEventListener("open", res, { once: true });
      this.socket.addEventListener("error", rej, { once: true });
    });
    this.socket.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id) {
        const p = this.pending.get(m.id);
        if (!p) return;
        this.pending.delete(m.id);
        if (m.error) p.reject(new Error(`${p.method}: ${m.error.message}`));
        else p.resolve(m.result);
        return;
      }
      for (const l of this.listeners.get(m.method) || []) l(m.params);
    });
  }
  call(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { resolve: res, reject: rej, method });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  once(method) {
    return new Promise((res) => {
      const l = (p) => {
        this.listeners.set(method,
          (this.listeners.get(method) || []).filter((i) => i !== l));
        res(p);
      };
      this.listeners.set(method, [...(this.listeners.get(method) || []), l]);
    });
  }
  close() { this.socket.close(); }
}

async function evaluate(cdp, expression) {
  const r = await cdp.call("Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
async function navigate(cdp, url) {
  const loaded = cdp.once("Page.loadEventFired");
  await cdp.call("Page.navigate", { url });
  await loaded;
  await sleep(900);
}
const point = (x, y) => [{ x, y, radiusX: 12, radiusY: 12, force: 1 }];

/**
 * Scroll a control into view and return where to put the finger.
 *
 * Two round trips on purpose: the site sets `scroll-behavior: smooth`, so a
 * `getBoundingClientRect()` in the same task as the `scrollIntoView()` returns
 * the PRE-scroll rect — which is how a gesture ends up asking to start 1627px
 * down a 844px viewport.
 */
async function centreOf(cdp, selector, index = 0, inset = 0) {
  const q = JSON.stringify(selector);
  for (let i = 0; i < 60; i += 1) {
    if (await evaluate(cdp, `document.querySelectorAll(${q}).length > ${index}`)) break;
    await sleep(100);
  }
  await evaluate(cdp, `(() => {
    document.querySelectorAll(${q})[${index}]
      .scrollIntoView({ block: "center", behavior: "instant" });
    return true;
  })()`);
  await sleep(450);
  return evaluate(cdp, `(() => {
    const r = document.querySelectorAll(${q})[${index}].getBoundingClientRect();
    return {
      x: ${inset} ? Math.round(r.left + ${inset}) : Math.round(r.left + r.width / 2),
      y: Math.round(r.top + r.height / 2),
      room: document.documentElement.scrollHeight - window.innerHeight,
    };
  })()`);
}

/** A deliberate tap: down and up in the same place, no travel. */
async function tap(cdp, x, y) {
  await cdp.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(x, y) });
  await sleep(60);
  await cdp.call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(500);
}

/** A thumb tap that rolls: the gesture the 10px slop guard used to swallow. */
async function rollingTap(cdp, x, y) {
  await cdp.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(x, y) });
  for (const dy of [3, 7, 11, 13]) {
    await cdp.call("Input.dispatchTouchEvent",
      { type: "touchMove", touchPoints: point(x + 2, y + dy) });
    await sleep(16);
  }
  await cdp.call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(500);
}

/**
 * A scroll flick that starts on a control. `synthesizeScrollGesture` drives the
 * real compositor scroll path, which is the only way a dispatched touch
 * actually moves the page in headless Chrome.
 */
async function swipe(cdp, x, y, distance = 260) {
  try {
    await cdp.call("Input.synthesizeScrollGesture", {
      x, y, xDistance: 0, yDistance: -distance,
      gestureSourceType: "touch", speed: 1600,
    });
  } catch (error) {
    const box = await evaluate(cdp, `[innerWidth, innerHeight]`);
    throw new Error(
      `swipe from ${x},${y} by ${distance} in ${box.join("x")}: ${error.message}`);
  }
  await sleep(320);
}

/**
 * A SLOW press-and-drag across a label — the gesture the owner reported as
 * "ပွတ်ဆွဲရင် auto select ဖြစ်နေတယ်". Dispatched by hand rather than as a
 * gesture, because a compositor fling never lingers long enough to start a
 * selection.
 */
async function dragAcross(cdp, x, y) {
  await cdp.call("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(x, y) });
  await sleep(220);
  for (let travelled = 8; travelled <= 120; travelled += 12) {
    await cdp.call("Input.dispatchTouchEvent",
      { type: "touchMove", touchPoints: point(x + travelled, y + Math.round(travelled / 6)) });
    await sleep(28);
  }
  await cdp.call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(400);
}

const pass = [];
const ok = (l, d = "") => { const s = `  PASS  ${l}${d ? ` — ${d}` : ""}`; pass.push(s); console.log(s); };

const chrome = spawn(chromeBinary, [
  "--headless=new", "--hide-scrollbars", "--no-first-run",
  // `--window-size` matters: `Input.synthesizeScrollGesture` validates its
  // points against the WIDGET, not the emulated metrics, so on a default
  // 800x600 window every gesture below the fold is "Position out of bounds".
  "--window-size=390,844",
  "--no-default-browser-check", `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });

try {
  for (let i = 0; i < 80; i += 1) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) break; } catch {}
    await sleep(100);
  }
  const target = await (await fetch(
    `http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.call("Page.enable");
  await cdp.call("Runtime.enable");
  await cdp.call("Emulation.setUserAgentOverride", { userAgent: IOS_UA });
  // The iOS UA alone is not enough. `usesSwitchHaptics()` starts with
  // `if (supportsVibration()) return false`, and headless Chrome DOES expose
  // navigator.vibrate — so without this the overlay mounts nowhere, every
  // ".haptic-tap" query returns zero, and an "it is not on the FAQ rows" check
  // passes for the wrong reason. Removing vibrate is what puts the run on the
  // iOS branch (the remaining gates are the UA version and
  // CSS.supports("selector(:has(> *))"), both of which Chrome satisfies).
  await cdp.call("Page.addScriptToEvaluateOnNewDocument", {
    source: `Object.defineProperty(navigator, "vibrate", { value: undefined });`,
  });
  await cdp.call("Emulation.setDeviceMetricsOverride",
    { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp.call("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  // A mid-range phone, roughly. Every timing below is measured under this.
  await cdp.call("Emulation.setCPUThrottlingRate", { rate: 4 });

  // ── the overlay is gone from every surface a finger scrolls over ────────
  await navigate(cdp, `${origin}/mobile-data/`);
  const overlays = await evaluate(cdp, `(() => {
    // A host is an element with the overlay as a DIRECT child. That distinction
    // is the whole point: the theme switch is supposed to have one; View Plans
    // and every scrollable tile are not.
    const hosts = [...document.querySelectorAll(".haptic-tap")]
      .map((i) => i.parentElement)
      .filter(Boolean);
    const hostOf = (selector) =>
      hosts.filter((h) => h.matches(selector)).length;
    const faq = document.querySelector(".faq-question");
    return {
      total: hosts.length,
      classes: [...new Set(hosts.map((h) => h.className.trim()))],
      pulse: !!document.querySelector(".haptic-pulse"),
      onScrollSurfaces:
        hostOf(".faq-question") + hostOf(".product-card") +
        hostOf(".category-card") + hostOf(".review-card") +
        hostOf(".popular-card") + hostOf(".search-result") +
        hostOf(".mobile-navigation a") + hostOf(".icon-button"),
      onThemeToggle: hostOf(".theme-switch"),
      onViewPlans: hostOf(".product-card__action"),
      faqSelectable: getComputedStyle(faq).userSelect,
      faqTouchAction: getComputedStyle(faq).touchAction,
    };
  })()`);
  // Prove the harness is on the iOS branch before trusting any count above.
  assert.ok(overlays.total > 0,
    "no overlay mounted anywhere — the run is not on the iOS branch, so every " +
    "count below would pass for the wrong reason");
  assert.equal(overlays.pulse, true, "the iOS programmatic-pulse label is missing");
  assert.equal(overlays.onScrollSurfaces, 0,
    `a scroll surface still carries the overlay: ${overlays.classes.join(" | ")}`);
  assert.equal(overlays.onThemeToggle, 1,
    `the light/dark toggle lost its haptic: ${overlays.classes.join(" | ")}`);
  // 2026-08-24 follow-up: View Plans sits in a grid the finger scrolls
  // through, and the draggable switch read a vertical swipe as a toggle and
  // opened the plans dialog. The overlay is deliberately OFF this button now.
  assert.equal(overlays.onViewPlans, 0,
    `View Plans carries the overlay again (${overlays.onViewPlans} of 2 buttons) — ` +
    "a swipe starting on it will open the plans dialog instead of scrolling");
  assert.equal(overlays.faqSelectable, "none");
  assert.equal(overlays.faqTouchAction, "manipulation");
  ok("the overlay is on the theme toggle only — not View Plans, not any scroll surface",
     `${overlays.total} hosts: ${overlays.classes.join(" | ")}`);

  // ── the product card still LOOKS like a card ──────────────────────────
  // The hover-guard pass shipped a card whose name column had collapsed to
  // three characters and whose action button sat on top of the text. Nothing in
  // this suite noticed, because every assertion was about behaviour.
  await navigate(cdp, `${origin}/music-apps/`);
  // The signal is MID-WORD breaking, measured, not guessed: the widest word is
  // rendered into an off-screen nowrap probe in the heading's own font, and the
  // heading's box has to be at least that wide. "SoundCloud" coming out as
  // "Soun / dClo / ud" is that assertion failing. A card-width fraction will not
  // do — the heading is a centred flex item, so its box is its text width, and
  // 83px inside a 174px card is correct for a one-word name.
  const cards = await evaluate(cdp, `(() => {
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;left:-9999px;white-space:nowrap;visibility:hidden";
    const read = (card) => {
      const name = card.querySelector("h2");
      const action = card.querySelector(".product-card__action");
      const style = getComputedStyle(name);
      probe.style.font = style.font;
      probe.style.letterSpacing = style.letterSpacing;
      document.body.appendChild(probe);
      let widest = 0;
      let widestWord = "";
      // Split on a plain space, not a regex. This whole expression is a JS
      // template literal, so a backslash escape written here does not survive
      // to the page: a whitespace class arrives as a bare "s" and splits on the
      // letter s instead. (And never write a backtick in a comment in here —
      // it closes the template literal.) Product names are space-separated; a
      // stray double space yields an empty word, which measures 0 and loses.
      for (const word of name.textContent.trim().split(" ")) {
        probe.textContent = word;
        const w = probe.getBoundingClientRect().width;
        if (w > widest) { widest = w; widestWord = word; }
      }
      probe.remove();
      const nameBox = name.getBoundingClientRect();
      const actionBox = action.getBoundingClientRect();
      return {
        id: card.id,
        name: name.textContent.trim(),
        lines: Math.round(nameBox.height / parseFloat(style.lineHeight)),
        nameWidth: Math.round(nameBox.width),
        widestWord,
        widestWidth: Math.round(widest),
        fitsAWord: nameBox.width + 0.5 >= widest,
        overlaps: !(actionBox.top >= nameBox.bottom - 1 ||
                    actionBox.bottom <= nameBox.top + 1),
        direction: getComputedStyle(card).flexDirection,
      };
    };
    return [...document.querySelectorAll(".product-card")].map(read);
  })()`);
  assert.ok(cards.length >= 3, `only ${cards.length} cards to measure`);
  for (const card of cards) {
    assert.equal(card.direction, "column",
      `${card.id} lost its column layout (flex-direction: ${card.direction})`);
    assert.equal(card.overlaps, false,
      `${card.id}'s View Plans button overlaps its name`);
    assert.ok(card.fitsAWord,
      `${card.id} breaks mid-word: "${card.widestWord}" needs ` +
      `${card.widestWidth}px, the heading box is ${card.nameWidth}px`);
    assert.ok(card.lines <= 2,
      `"${card.name}" wraps onto ${card.lines} lines in ${card.id}`);
  }
  ok("product cards keep their column layout and unbroken names",
     cards.map((c) => `${c.name}:${c.lines}L`).join(" · "));

  // ── a real tap opens the FAQ, first try ────────────────────────────────
  await navigate(cdp, `${origin}/mobile-data/`);
  const faqBox = await centreOf(cdp, ".faq-question");
  await tap(cdp, faqBox.x, faqBox.y);
  let expanded = await evaluate(cdp,
    `document.querySelectorAll('.faq-question[aria-expanded="true"]').length`);
  assert.equal(expanded, 1, "one deliberate tap did not open the FAQ");
  ok("a deliberate tap opens the FAQ on the first try");

  await tap(cdp, faqBox.x, faqBox.y);
  expanded = await evaluate(cdp,
    `document.querySelectorAll('.faq-question[aria-expanded="true"]').length`);
  assert.equal(expanded, 0, "the second tap did not close it");
  ok("the same tap closes it again");

  // ── a rolling thumb tap still counts (the 10px slop used to eat this) ──
  await rollingTap(cdp, faqBox.x, faqBox.y);
  expanded = await evaluate(cdp,
    `document.querySelectorAll('.faq-question[aria-expanded="true"]').length`);
  assert.equal(expanded, 1,
    "a tap whose finger rolled 13px was swallowed — the slop guard is back");
  ok("a thumb tap that rolls 13px still registers");
  await tap(cdp, faqBox.x, faqBox.y);

  // ── a swipe that starts on the FAQ neither opens it nor selects it ─────
  // On the tall page: /mobile-data/ has two products and cannot scroll far
  // enough for the assertion below to mean anything.
  await navigate(cdp, `${origin}/creative-apps/`);
  const tallFaq = await centreOf(cdp, ".faq-question");
  assert.ok(tallFaq.room > 600, `not enough scroll room to test: ${tallFaq.room}px`);
  const before = await evaluate(cdp, `Math.round(window.scrollY)`);
  await swipe(cdp, tallFaq.x, tallFaq.y);
  const swiped = await evaluate(cdp, `({
    expanded: document.querySelectorAll('.faq-question[aria-expanded="true"]').length,
    selection: (window.getSelection()?.toString() || "").trim().length,
    scrolled: Math.round(window.scrollY),
  })`);
  assert.equal(swiped.expanded, 0, "a swipe opened the FAQ");
  assert.equal(swiped.selection, 0,
    `a swipe selected text: ${swiped.selection} chars`);
  assert.ok(swiped.scrolled > before + 40,
    `the swipe did not scroll the page (${before} -> ${swiped.scrolled})`);
  ok("a swipe over an FAQ row scrolls, opens nothing, selects nothing",
     `scrollY ${before} -> ${swiped.scrolled}`);

  // ── a swipe that starts on View Plans scrolls and opens nothing ────────
  // The 2026-08-24 follow-up report: "view plan ကိုထောက်မိပြီး
  // ပွတ်ဆွဲလိုက်တာကို scroll မဖြစ်ဘဲ view plan ပွင့်လာပါတယ်". The overlay is
  // off this button, so the gesture must reach the compositor as a scroll.
  const plansBox = await centreOf(cdp, ".product-card__action");
  const plansBefore = await evaluate(cdp, `Math.round(window.scrollY)`);
  await swipe(cdp, plansBox.x, plansBox.y);
  const plansSwiped = await evaluate(cdp, `({
    modal: !!document.querySelector(".plan-list, .plan-picker, .modal-panel"),
    scrolled: Math.round(window.scrollY),
  })`);
  assert.equal(plansSwiped.modal, false,
    "a swipe that started on View Plans opened the plans dialog");
  assert.ok(plansSwiped.scrolled > plansBefore + 40,
    `the swipe from View Plans did not scroll (${plansBefore} -> ${plansSwiped.scrolled})`);
  ok("a swipe that starts on View Plans scrolls the page and opens nothing",
     `scrollY ${plansBefore} -> ${plansSwiped.scrolled}`);

  // ── and a slow press-and-drag selects nothing either ──────────────────
  const dragTarget = await centreOf(cdp, ".faq-question", 1, 24);
  await dragAcross(cdp, dragTarget.x, dragTarget.y);
  const dragged = await evaluate(cdp, `({
    expanded: document.querySelectorAll('.faq-question[aria-expanded="true"]').length,
    selection: (window.getSelection()?.toString() || "").trim().length,
  })`);
  assert.equal(dragged.selection, 0,
    `a press-and-drag selected the question text: ${dragged.selection} chars`);
  assert.equal(dragged.expanded, 0, "a press-and-drag opened the FAQ");
  ok("a slow press-and-drag over a question selects nothing and opens nothing");

  // ── hover paint is desktop-only ────────────────────────────────────────
  // Asserted against the CSSOM, not against a swiped element: headless Chrome
  // does not latch `:hover` from a synthesized touch (measured — an unguarded
  // `.faq-question:hover{background:red}` injected mid-gesture never painted),
  // so a computed-style check here would pass whatever the stylesheet says.
  // What can be proven is the property the fix actually establishes: no
  // `:hover` rule outside a hover-capable media query.
  const unguarded = await evaluate(cdp, `(() => {
    const bad = [];
    let seen = 0;
    // Check the selector BEFORE recursing: in current Chrome a plain
    // CSSStyleRule also exposes an (empty) cssRules list for CSS nesting, so a
    // walker that recurses first never tests a single selector and reports a
    // clean sheet no matter what is in it.
    //
    // Substring, not a regex: this source is a template literal, so a \s in a
    // pattern written here reaches the page as a plain "s" and the test matches
    // nothing. The minifier emits "(hover:hover)", the source says
    // "(hover: hover)", so spaces come out first.
    const walk = (rules, guarded) => {
      for (const rule of rules) {
        const condition = rule.conditionText || rule.media?.mediaText || "";
        const inHover =
          guarded || condition.replace(/ /g, "").includes("hover:hover");
        const selector = rule.selectorText || "";
        if (selector.includes(":hover")) {
          // Only a rule whose EVERY comma part is a hover selector is hover
          // paint. A mixed list like ".product-card, .product-card:hover" is
          // base layout repeating itself to outrank the hover rule — guarding
          // that one removed the whole card layout on every phone once, so this
          // check must not ask for it to be guarded again.
          const hoverOnly = selector
            .split(",")
            .every((part) => part.includes(":hover"));
          if (hoverOnly) {
            seen += 1;
            if (!inHover) bad.push(selector);
          }
        }
        if (rule.cssRules) walk(rule.cssRules, inHover);
      }
    };
    for (const sheet of document.styleSheets) {
      if (sheet.href && !sheet.href.includes("_next")) continue;
      try { walk(sheet.cssRules, false); } catch { /* cross-origin */ }
    }
    return { bad, count: bad.length, seen,
             phone: matchMedia("(hover: hover)").matches === false,
             bg: getComputedStyle(document.querySelector(".faq-question")).backgroundColor };
  })()`);
  assert.ok(unguarded.seen > 20,
    `only ${unguarded.seen} hover rules were inspected — the walker is blind`);
  assert.equal(unguarded.count, 0,
    `these hover rules still paint on a touch screen: ${unguarded.bad.join(" | ")}`);
  assert.equal(unguarded.phone, true, "the emulated phone reports a hover pointer");
  ok("every :hover rule is behind (hover: hover)",
     `${unguarded.seen} inspected, row background stays ${unguarded.bg}`);

  // ── View Plans, first tap, under 4x throttling ─────────────────────────
  const planBox = await centreOf(cdp, ".product-card__action");
  const tapStart = Date.now();
  await cdp.call("Input.dispatchTouchEvent",
    { type: "touchStart", touchPoints: point(planBox.x, planBox.y) });
  await sleep(50);
  await cdp.call("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  for (let i = 0; i < 60; i += 1) {
    if (await evaluate(cdp, `!!document.querySelector(".plan-list, .plan-picker")`)) break;
    await sleep(50);
  }
  const openedIn = Date.now() - tapStart;
  assert.ok(await evaluate(cdp, `!!document.querySelector(".plan-list, .plan-picker")`),
            "View Plans did not open the modal on the first tap");
  assert.ok(openedIn < 1200, `the plan modal took ${openedIn}ms to appear`);
  ok("View Plans opens on the first tap", `${openedIn}ms at 4x CPU throttle`);
  await evaluate(cdp,
    `document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
  await sleep(500);

  // ── Back, first tap ───────────────────────────────────────────────────
  await navigate(cdp, `${origin}/`);
  await navigate(cdp, `${origin}/mobile-data/`);
  const backBox = await centreOf(cdp, ".back-row .back-control");
  await rollingTap(cdp, backBox.x, backBox.y);
  for (let i = 0; i < 40; i += 1) {
    if (await evaluate(cdp, `location.pathname`) !== "/mobile-data/") break;
    await sleep(50);
  }
  assert.equal(await evaluate(cdp, `location.pathname`), "/",
    "Back needed more than one tap");
  ok("Back goes home on one tap, even when the thumb rolls");

  // ── scroll cost: main-thread blocking during a long flick ─────────────
  await navigate(cdp, `${origin}/creative-apps/`);
  // Frame deltas, not long tasks: a compositor-driven fling can show zero long
  // tasks and still stutter, and the thing being guarded here is whether the
  // main thread keeps up while the finger is down.
  await evaluate(cdp, `(() => {
    window.__frames = [];
    window.__long = 0;
    window.__obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__long += e.duration;
    });
    window.__obs.observe({ entryTypes: ["longtask"] });
    let last = performance.now();
    const tick = (now) => {
      window.__frames.push(now - last);
      last = now;
      window.__raf = requestAnimationFrame(tick);
    };
    window.__raf = requestAnimationFrame(tick);
    return true;
  })()`);
  for (let i = 0; i < 6; i += 1) {
    await swipe(cdp, 195, 700, 420);
  }
  const scrollCost = await evaluate(cdp, `(() => {
    cancelAnimationFrame(window.__raf);
    window.__obs.disconnect();
    const f = window.__frames.slice(1);
    return {
      frames: f.length,
      worst: Math.round(Math.max(...f)),
      janky: f.filter((d) => d > 50).length,
      blocking: Math.round(window.__long),
    };
  })()`);
  // Budget, not a benchmark. Six full-page flicks at 4x CPU throttle: a handful
  // of long frames is the gesture starting and stopping, a wall of them is a
  // listener doing work on every move.
  assert.ok(scrollCost.frames > 60,
    `only ${scrollCost.frames} frames sampled — the gestures did not run`);
  assert.ok(scrollCost.janky <= 12,
    `${scrollCost.janky}/${scrollCost.frames} frames over 50ms during six flicks`);
  assert.ok(scrollCost.blocking < 400,
    `${scrollCost.blocking}ms of long tasks while scrolling`);
  ok("scrolling keeps up with the finger",
     `${scrollCost.janky}/${scrollCost.frames} frames >50ms, worst ${scrollCost.worst}ms, ` +
     `${scrollCost.blocking}ms blocking`);

  cdp.close();
  console.log(`\n${pass.length} touch checks passed against ${origin}.`);
} finally {
  chrome.kill();
}
