import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const media = await import("../src/data/product-media.ts");
const image = ({ src, alt, width, height, className }) =>
  React.createElement("img", { src, alt, width, height, className });
const mocks = {
  "next/image": image,
  "next/link": "a",
  "motion/react": { motion: { article: "article" } },
  "@/data/product-media": media,
  "@/hooks/useRevealMotion": { useRevealMotion: () => ({}) },
  "@/services/catalog": { publicAssetPath: (p) => `/${p}`, isAskPricePlan: () => false },
  "@/services/track": { trackProductClick: () => {} },
  "@/data/product-links": { productGuideLinks: {} },
  "@/types/catalog": { isCatalogPlan: (p) => Boolean(p.id) },
  "@/components/common/HapticSwitch": { HapticSwitch: () => null },
  "@/components/common/Modal": {
    Modal: ({ icon, children }) => React.createElement("section", {}, icon, children),
  },
};

function loadComponent(file, name) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const compiledModule = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    (id) => Object.hasOwn(mocks, id) ? mocks[id] : require(id), compiledModule, compiledModule.exports,
  );
  return compiledModule.exports[name];
}

const Card = loadComponent("../src/components/catalog/ProductCard.tsx", "ProductCard");
const Dialog = loadComponent("../src/components/catalog/PlanModal.tsx", "PlanModal");
const product = {
  id: "short_drama", name: "AI Movie Bot Credits", image: "images/reelscap.jpg",
  subtitle: "Credits for AI Movie Bot", plans: [],
};
for (const Component of [Card, Dialog]) {
  const render = (p) => renderToStaticMarkup(React.createElement(Component, {
    product: p, settings: {}, onViewPlans() {}, onClose() {}, onCheckout() {},
  }));
  const current = render(product);
  // Simulate initial data, an old live response, then current data again.
  for (const p of [product, { ...product, imageLayout: "banner" }, product]) {
    const html = render(p);
    assert.equal(html, current, `${Component.name}: live refresh changed logo layout`);
    assert.doesNotMatch(html, /product-card__photo|plan-list__photo|width="640"/);
  }
}
assert.equal(media.usesProductBanner({ ...product, id: "another", imageLayout: "banner" }), false);
assert.equal(media.usesProductBanner({ id: "other", image: "images/flyer.jpg", imageLayout: "banner" }), true);
console.log("PASS: ReelsCap card and dialog stay compact with current and legacy catalogs");
