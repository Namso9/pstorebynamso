import type { CatalogData, CatalogPlan, CatalogProduct } from "@/types/catalog";
import { isCatalogPlan } from "@/types/catalog";

export const ORDER_TIMEOUT_MS = 180_000;
export const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

export const allowedScreenshotTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",
  "image/gif",
  "image/bmp",
]);

export type CatalogSelection = {
  product: CatalogProduct;
  plan?: CatalogPlan;
};

export function resolveCatalogSelection(
  catalog: CatalogData,
  productId: string | null,
  planId: string | null,
): CatalogSelection | null {
  if (!productId) return null;
  const product = catalog.products.find((item) => item.id === productId);
  if (!product) return null;
  const entry = product.plans.find(
    (item) => isCatalogPlan(item) && item.id === planId,
  );
  return {
    product,
    plan: entry && isCatalogPlan(entry) ? entry : undefined,
  };
}

export function selectionLabel(selection: CatalogSelection) {
  const { product, plan } = selection;
  if (!plan) return product.name;
  return `${product.name} — ${plan.name}${plan.desc ? ` · ${plan.desc}` : ""}${
    plan.price ? ` (${plan.price})` : ""
  }`;
}

export function resolveProductIdFromText(catalog: CatalogData, text: string) {
  const normalized = text.toLowerCase();
  let best = "";
  let bestLength = 0;
  for (const product of catalog.products) {
    const name = product.name.toLowerCase();
    if (name && normalized.includes(name) && name.length > bestLength) {
      best = product.id;
      bestLength = name.length;
    }
  }
  if (best) return best;
  if (normalized.includes("canva")) return "canva";
  if (normalized.includes("zoom")) return "zoom";
  if (normalized.includes("gemini")) return "gemini";
  if (normalized.includes("duolingo") && !normalized.includes("crack")) {
    return "duolingo";
  }
  return "";
}

export function orderQuery(productId: string | null, planId: string | null) {
  const query = new URLSearchParams();
  if (productId) query.set("product", productId);
  if (planId) query.set("plan", planId);
  const value = query.toString();
  return value ? `?${value}` : "";
}
