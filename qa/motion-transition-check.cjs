/* eslint-disable @typescript-eslint/no-require-imports -- Offline UI lifecycle checks, without a browser or additional dependencies. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const postcss = require("postcss");

// Push/pop snapshots must move together without fading through an empty canvas.
const stylesheet = postcss.parse(fs.readFileSync("src/app/globals.css", "utf8"));
const navigationRules = new Map();
stylesheet.walkRules(rule => navigationRules.set(rule.selector, rule));
const animationFor = selector => navigationRules.get(selector).nodes.find(node => node.prop === "animation").value;
const oldAnimation = animationFor("html[data-route-motion]::view-transition-old(root)");
const newAnimation = animationFor("html[data-route-motion]::view-transition-new(root)");
assert.equal(oldAnimation.slice(oldAnimation.indexOf(" ")), newAnimation.slice(newAnimation.indexOf(" ")), "Outgoing and incoming snapshots must share their entire timing curve");
stylesheet.walkAtRules("keyframes", rule => {
  if (!/^page-(forward|back)-(in|out)$/.test(rule.params)) return;
  rule.walkDecls("opacity", () => assert.fail("Directional push/pop must remain opaque throughout"));
});
const layerFor = selector => navigationRules.get(selector).nodes.find(node => node.prop === "z-index").value;
assert(Number(layerFor('html[data-route-motion="back"]::view-transition-old(root)')) > Number(layerFor('html[data-route-motion="back"]::view-transition-new(root)')), "Back must reveal the previous page beneath the departing page");

// Run component effects explicitly to check navigation and dialog cleanup.
function hooks() {
  const slots = [];
  let index = 0;
  let pending = [];
  return {
    useRef(value) { return slots[index++] ??= { current: value }; },
    useEffectEvent(fn) {
      const cell = slots[index++] ??= { fn };
      cell.fn = fn;
      return (...args) => cell.fn(...args);
    },
    useEffect(fn, deps) {
      const slot = index++;
      const previous = slots[slot];
      if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      pending.push(() => {
        previous?.cleanup?.();
        slots[slot] = { deps, cleanup: fn() };
      });
    },
    render(Component, props) { index = 0; return Component(props); },
    flush() { const effects = pending; pending = []; effects.forEach(fn => fn()); },
    unmount() { slots.forEach(slot => slot?.cleanup?.()); },
  };
}

const events = new Map();
const mediaEvents = new Set();
const media = {
  matches: false,
  addEventListener: (_, fn) => mediaEvents.add(fn),
  removeEventListener: (_, fn) => mediaEvents.delete(fn),
};
const document = { hidden: false, body: { style: { overflow: "auto" } }, activeElement: null };
document.documentElement = { dataset: {} };
document.addEventListener = (name, fn) => { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn); };
document.removeEventListener = (name, fn) => events.get(name)?.delete(fn);
const timers = new Map();
let timerId = 0;
const window = {
  innerHeight: 800,
  location: { href: "https://fixture.invalid/", origin: "https://fixture.invalid" },
  setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
  clearTimeout(id) { timers.delete(id); },
  matchMedia: () => media,
  addEventListener(name, fn) { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn); },
  removeEventListener(name, fn) { events.get(name)?.delete(fn); },
};
class Element {
  constructor(tag = "main", top = 0, bottom = 500) {
    Object.assign(this, { tag, top, bottom, children: [], animations: [], isConnected: true, focusCount: 0 });
  }
  matches() { return ["main", "section", "reveal"].includes(this.tag); }
  getBoundingClientRect() { return { top: this.top, bottom: this.bottom }; }
  getClientRects() { return [this.getBoundingClientRect()]; }
  animate(frames, options) {
    let finish;
    let cancel;
    const finished = new Promise((resolve, reject) => { finish = resolve; cancel = reject; });
    void finished.catch(() => {});
    const animation = {
      frames, options, finished, cancelled: false,
      finish() { finish(); },
      cancel() { this.cancelled = true; cancel(new Error("Animation cancelled")); },
    };
    this.animations.push(animation);
    return animation;
  }
  querySelector() { return this.children[0]; }
  querySelectorAll() { return this.children; }
  contains(element) { return element === this || this.children.includes(element); }
  focus() { document.activeElement = this; this.focusCount++; }
}
function load(file, modules) {
  const moduleObject = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    module: moduleObject, exports: moduleObject.exports, window, document, HTMLElement: Element, URL,
    require: name => modules[name] ?? require(name),
  }, { filename: file });
  return moduleObject.exports.default;
}

let pathname = "/";
const pageHooks = hooks();
pageHooks.createContext = React.createContext;
pageHooks.useCallback = fn => fn;
pageHooks.useLayoutEffect = pageHooks.useEffect;
const PageTransition = load("src/components/PageTransition.tsx", {
  react: pageHooks, "next/navigation": { usePathname: () => pathname, useRouter: () => ({}) },
});
const root = new Element();
const main = new Element();
const header = new Element("header");
const footer = new Element("footer");
const offscreen = new Element("section", 1200, 1600);
root.children = [header, main, footer, offscreen];
function navigate(path) {
  pathname = path;
  const node = pageHooks.render(PageTransition, { children: React.createElement("main", null, "Visible content") });
  node.props.children.props.ref.current = root;
  pageHooks.flush();
  return node;
}
const html = renderToStaticMarkup(navigate("/"));
assert(html.includes("Visible content") && !html.includes("style="), "Exported content must be visible before effects");
assert.equal(main.animations.length, 0, "First paint must not animate");
navigate("/products/");
assert.equal(main.animations.length, 1);
assert.equal(main.animations[0].options.duration, 440);
assert.equal(main.animations[0].frames[0].transform, "translateX(28px)", "Forward navigation must enter from the right");
assert.equal(header.animations.length + footer.animations.length + offscreen.animations.length, 0);
assert.equal(main.animations[0].options.fill, undefined, "Navigation must leave no persistent transform");
navigate("/products/");
assert.equal(main.animations.length, 1, "Query changes and live refreshes must not restart motion");
navigate("/product/chatgpt-plus/");
assert(main.animations[0].cancelled, "Interrupted navigation must cancel the old animation");
media.matches = true;
mediaEvents.forEach(fn => fn());
assert(main.animations[1].cancelled, "Enabling reduced motion must stop an active animation");
navigate("/about/");
assert.equal(main.animations.length, 2, "Reduced motion must skip page animation");
media.matches = false;
document.hidden = true;
navigate("/contact/");
assert.equal(main.animations.length, 2, "Background navigation must not animate");
document.hidden = false;
main.animate = undefined;
navigate("/products/");
pageHooks.unmount();
assert.equal(mediaEvents.size, 0, "Navigation listeners must be released");

let activeHooks;
let present = true;
let reduced = false;
const AnimatedDialog = load("src/components/AnimatedDialog.tsx", {
  react: {
    useRef: (...args) => activeHooks.useRef(...args),
    useEffect: (...args) => activeHooks.useEffect(...args),
    useEffectEvent: (...args) => activeHooks.useEffectEvent(...args),
  },
  "react-dom": { createPortal: node => node },
  "motion/react": { AnimatePresence: "presence", LazyMotion: "lazy", domAnimation: {}, useIsPresent: () => present, useReducedMotion: () => reduced },
  "motion/react-m": { div: "div", section: "section" },
});
assert.equal(AnimatedDialog({ open: false }).props.children, false);
function surface(props, lifecycle, dialog) {
  activeHooks = lifecycle;
  const tree = AnimatedDialog({ open: true, backdropClassName: "backdrop", className: "dialog", ...props });
  const component = tree.props.children.props.children;
  const node = lifecycle.render(component.type, component.props);
  node.props.children.props.ref.current = dialog;
  lifecycle.flush();
  return node;
}
function key(name, shiftKey = false) {
  const event = { key: name, shiftKey, prevented: false, preventDefault() { this.prevented = true; } };
  events.get("keydown")?.forEach(fn => fn(event));
  return event;
}
const firstHooks = hooks();
const opener = new Element("button");
const input = new Element("input");
const close = new Element("button");
const dialog = new Element();
dialog.children = [close, input];
let closes = 0;
const props = { initialFocusRef: { current: input }, returnFocusRef: { current: opener }, onClose: () => closes++ };
surface(props, firstHooks, dialog);
assert.equal(document.activeElement, input, "Search must focus immediately");
assert.equal(document.body.style.overflow, "hidden");
assert(key("Tab").prevented);
assert.equal(document.activeElement, close);
assert(key("Tab", true).prevented);
assert.equal(document.activeElement, input);
surface({ ...props, onClose: () => { closes += 10; } }, firstHooks, dialog);
assert.equal(input.focusCount, 2, "Typing must not refocus or reset the dialog effect");
key("Escape");
assert.equal(closes, 10, "Keyboard handling must use the current close callback");
present = false;
const leaving = surface(props, firstHooks, dialog);
assert.equal(leaving.props.children.props.inert, true, "Closing controls must stop accepting input");
key("Escape");
assert.equal(closes, 10);
assert.equal(document.body.style.overflow, "hidden", "Scroll lock must last through the exit");
present = true;
surface(props, firstHooks, dialog);
assert.equal(document.activeElement, input, "Reopening during exit must restore input focus");
assert.equal(input.focusCount, 3);
assert.equal(document.body.style.overflow, "hidden");
present = false;
surface(props, firstHooks, dialog);

// A new dialog can overlap the previous exit without leaking or stealing focus.
present = true;
reduced = true;
const secondHooks = hooks();
const secondDialog = new Element();
const secondButton = new Element("button");
secondDialog.children = [secondButton];
const second = surface({ onClose: () => closes++ }, secondHooks, secondDialog);
assert.equal(second.props.initial, false);
assert.equal(second.props.transition.duration, 0);
assert.equal(second.props.children.props.exit.y, 0);
firstHooks.unmount();
assert.equal(document.activeElement, secondButton, "An old exit must not steal focus from the new dialog");
assert.equal(document.body.style.overflow, "hidden");
secondHooks.unmount();
assert.equal(document.body.style.overflow, "auto");
assert.equal(events.get("keydown").size, 0);

reduced = false;
present = true;
for (const [variant, y, scale] of [["search", -16, 1], ["plans", 32, 1], ["review", 0, 0.97]]) {
  const lifecycle = hooks();
  const node = surface({ variant, onClose() {} }, lifecycle, new Element());
  assert.equal(node.props.children.props.initial.y, y);
  assert.equal(node.props.children.props.initial.scale, scale);
  assert.equal(node.props.children.props.transition.type, "spring");
  assert(node.props.children.props.transition.bounce <= 0.06, "Spring settling must remain restrained");
  lifecycle.unmount();
}

async function checkNativeNavigation() {
  const lifecycle = hooks();
  Object.assign(lifecycle, { createContext: React.createContext, useCallback: fn => fn, useLayoutEffect: lifecycle.useEffect });
  const calls = [];
  const views = [];
  const router = { push: (href, options) => calls.push({ href, options, replace: false }), replace: (href, options) => calls.push({ href, options, replace: true }) };
  document.startViewTransition = update => {
    let complete;
    const view = { update, ready: Promise.resolve(), finished: new Promise(resolve => { complete = resolve; }), skipped: false, skipTransition() { this.skipped = true; }, complete: () => complete() };
    views.push(view);
    return view;
  };
  let route = "/";
  const Component = load("src/components/PageTransition.tsx", { react: lifecycle, "next/navigation": { usePathname: () => route, useRouter: () => router } });
  const content = new Element();
  const scope = new Element();
  scope.children = [content];
  let navigate;
  const render = path => {
    route = path;
    const node = lifecycle.render(Component, { children: "content" });
    node.props.children.props.ref.current = scope;
    navigate = node.props.value;
    lifecycle.flush();
  };
  render("/");
  assert(navigate("/category/music/?source=test#plans", { scroll: false }));
  assert.equal(calls.length, 0, "Capture the outgoing page before starting navigation");
  assert.equal(document.documentElement.dataset.routeMotion, "forward");
  let committed = false;
  const update = views[0].update().then(() => { committed = true; });
  await Promise.resolve();
  assert.equal(committed, false, "The incoming snapshot must wait for the actual route commit");
  assert.equal(calls[0].href, "/category/music/?source=test#plans");
  assert.equal(calls[0].options.scroll, false);
  render("/category/music/");
  await update;
  assert.equal(content.animations.length, 0, "Do not double animate a native page transition");
  views[0].complete();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.documentElement.dataset.routeMotion, undefined);
  assert.equal(timers.size, 0);
  assert.equal(navigate("/category/music?new=query", {}), false, "Same-page query and hash navigation stay immediate");
  assert.equal(navigate("https://external.invalid/", {}), false);
  media.matches = true;
  assert.equal(navigate("/category/ai/", {}), false, "Reduced motion must skip native transitions");
  media.matches = false;
  navigate("/category/ai/", {});
  assert.equal(document.documentElement.dataset.routeMotion, "back", "Earlier categories move left to right");
  navigate("/category/vpn/?product=fixture&plan=fixture-plan", { replace: true });
  assert.equal(document.documentElement.dataset.routeMotion, "back", "Cancelled routes do not become the direction origin");
  assert(views[1].skipped, "A second navigation must cancel the previous snapshot");
  views[1].update();
  assert.equal(calls.length, 1, "A cancelled snapshot callback must not perform a stale navigation");
  const replacement = views[2].update();
  assert.equal(calls[1].href, "/category/vpn/?product=fixture&plan=fixture-plan");
  assert.equal(calls[1].replace, true);
  render("/category/vpn/");
  await replacement;
  views[1].complete(); views[2].complete();
  await new Promise(resolve => setImmediate(resolve));
  navigate("/products/", {});
  const timeout = [...timers.values()][0];
  assert(timeout, "Slow navigation must have a release timeout");
  timeout();
  assert(views[3].skipped);
  await views[3].update();
  views[3].complete();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(timers.size, 0);

  const TransitionLink = load("src/components/TransitionLink.tsx", { react: { useContext: () => navigate }, "next/link": "a", "@/components/PageTransition": { RouteMotionContext: {} } });
  let prevented = 0;
  let link = TransitionLink({ href: "/about/", prefetch: false, onNavigate: event => event.preventDefault() });
  link.props.onNavigate({ preventDefault: () => prevented++ });
  assert.equal(views.length, 4, "A caller's navigation cancellation must be respected");
  assert.equal(prevented, 1);
  link = TransitionLink({ href: "/about/", prefetch: false });
  assert.equal(link.props.prefetch, false);
  link.props.onNavigate({ preventDefault: () => prevented++ });
  assert.equal(views.length, 5);
  assert.equal(prevented, 2, "Intercept the default push only when a native transition takes ownership");
  lifecycle.unmount();
  assert(views[4].skipped);
  assert.equal(timers.size, 0);
  delete document.startViewTransition;
}

async function checkFallbackNavigation() {
  const lifecycle = hooks();
  Object.assign(lifecycle, { createContext: React.createContext, useCallback: fn => fn, useLayoutEffect: lifecycle.useEffect });
  const calls = [];
  const prefetched = [];
  const router = { push: href => calls.push(href), replace: href => calls.push(href), prefetch: href => prefetched.push(href) };
  let route = "/";
  const Component = load("src/components/PageTransition.tsx", { react: lifecycle, "next/navigation": { usePathname: () => route, useRouter: () => router } });
  const content = new Element();
  const scope = new Element();
  scope.children = [content];
  let navigate;
  const render = path => {
    route = path;
    const node = lifecycle.render(Component, { children: "content" });
    node.props.children.props.ref.current = scope;
    navigate = node.props.value;
    lifecycle.flush();
  };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  render("/");
  assert(navigate("/category/music/?source=test#plans", {}));
  assert.equal(calls.length, 0, "Older browsers must show the exit before changing pages");
  assert.equal(prefetched[0], "/category/music/?source=test", "Fetch the route during exit, preserving the query");
  const outgoing = content.animations[0];
  assert.equal(outgoing.options.duration, 180);
  assert.equal(outgoing.frames[1].transform, "translateX(-12px)");
  assert(outgoing.frames[1].opacity >= 0.75, "An older browser must keep readable content while the destination loads");
  outgoing.finish();
  await settle();
  assert.deepEqual(calls, ["/category/music/?source=test#plans"]);
  render("/category/music/");
  assert(outgoing.cancelled, "The old page's frozen exit must be released on route commit");
  assert.equal(content.animations[1].options.duration, 440);
  assert.equal(content.animations[1].options.fill, undefined, "The incoming page must not retain transforms");
  assert.equal(timers.size, 0);

  navigate("/category/vpn/", {});
  const cancelled = content.animations.at(-1);
  navigate("/category/ai/", {});
  assert(cancelled.cancelled);
  content.animations.at(-1).finish();
  await settle();
  assert.equal(calls.at(-1), "/category/ai/");
  assert.equal(calls.length, 2, "Rapid clicks must only navigate to the latest destination");
  render("/category/ai/");

  navigate("/products/", {});
  media.matches = true;
  mediaEvents.forEach(fn => fn());
  await settle();
  assert.equal(calls.at(-1), "/products/", "Turning on reduced motion must finish the requested navigation");
  render("/products/");
  media.matches = false;

  navigate("/contact/", {});
  [...timers.values()][0]();
  await settle();
  assert.equal(calls.at(-1), "/contact/", "A stalled animation must never swallow navigation");
  assert.equal(timers.size, 0);
  render("/contact/");
  window.location.href = "https://fixture.invalid/category/ai/";
  events.get("popstate").forEach(fn => fn());
  render("/category/ai/");
  assert.equal(content.animations.at(-1).frames[0].transform, "translateX(-28px)", "Browser Back enters from the left");
  window.location.href = "https://fixture.invalid/contact/";
  events.get("popstate").forEach(fn => fn());
  render("/contact/");
  assert.equal(content.animations.at(-1).frames[0].transform, "translateX(28px)", "Browser Forward enters from the right");
  window.location.href = "https://fixture.invalid/";
  events.get("popstate").forEach(fn => fn());
  render("/");
  window.location.href = "https://fixture.invalid/category/music/";
  events.get("popstate").forEach(fn => fn());
  render("/category/music/");
  assert.equal(content.animations.at(-1).frames[0].transform, "translateX(28px)", "Forward from the first history entry must not be mistaken for Back");
  const beforeBack = calls.length;
  navigate("/about/", {});
  const interruptedByBack = content.animations.at(-1);
  events.get("popstate").forEach(fn => fn());
  await settle();
  assert(interruptedByBack.cancelled);
  assert.equal(calls.length, beforeBack, "Browser Back must cancel an uncommitted outgoing navigation");
  assert.equal(timers.size, 0);
  lifecycle.unmount();
  assert.equal(mediaEvents.size, 0);
  assert.equal(events.get("popstate").size, 0);
}

checkNativeNavigation().then(checkFallbackNavigation).then(() => {
  console.log("Motion lifecycle checks passed: directional routes and browser history, distinct dialog styles, native snapshots, older-browser exit/entry, route commit timing, preserved URLs, cancellation, slow-route recovery, immediate first paint, reduced motion, focus and scroll cleanup. Browser rendering is checked separately.");
}).catch(error => { console.error(error); process.exitCode = 1; });
