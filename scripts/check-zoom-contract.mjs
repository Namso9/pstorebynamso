import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPaths = [
  path.join(projectRoot, "products.json"),
  path.join(projectRoot, "public", "products.json"),
];

const expectedPlans = [
  { name: "1 Month", desc: "Monthly", price: "29,000 Ks", id: "1_month", bot: true },
  { name: "3 Months", desc: "Quarterly", price: "85,000 Ks", id: "3_months", bot: true },
  { name: "6 Months", desc: "⭐ Most Popular", price: "169,000 Ks", id: "6_months", bot: true },
  { name: "1 Year", desc: "🔥 Best Value", price: "329,000 Ks", id: "1_year", bot: true },
];

for (const catalogPath of catalogPaths) {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const zoomProducts = catalog.products.filter((product) => product.id === "zoom");
  assert.equal(zoomProducts.length, 1, `${catalogPath}: expected one Zoom product`);

  const product = zoomProducts[0];
  assert.deepEqual(product.plans, expectedPlans, `${catalogPath}: Zoom plans differ`);

  const popular = product.plans.filter((plan) => plan.desc.includes("Most Popular"));
  const bestValue = product.plans.filter((plan) => plan.desc.includes("Best Value"));
  assert.deepEqual(popular.map((plan) => plan.id), ["6_months"]);
  assert.deepEqual(bestValue.map((plan) => plan.id), ["1_year"]);

  for (const plan of product.plans) {
    const payload = `${catalog.settings.deepLinkPrefix}-${product.id}-${plan.id}`;
    const botUrl = new URL(`https://t.me/${catalog.settings.botUsername}`);
    botUrl.searchParams.set("start", payload);
    assert.equal(botUrl.searchParams.get("start"), `buy-zoom-${plan.id}`);

    const paymentUrl = new URL("https://pstorebynamso.com/payment/");
    paymentUrl.searchParams.set("product", product.id);
    paymentUrl.searchParams.set("plan", plan.id);
    assert.equal(paymentUrl.searchParams.get("product"), "zoom");
    assert.equal(paymentUrl.searchParams.get("plan"), plan.id);
  }
}

console.log("Zoom catalog, badges, deep links, and payment query contract: PASS");
