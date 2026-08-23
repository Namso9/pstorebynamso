import type {
  CatalogCategory,
  CatalogData,
  CatalogPlan,
  CatalogPlanEntry,
  CatalogProduct,
  CatalogSettings,
} from "@/types/catalog";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isOptionalBoolean(value: unknown) {
  return value === undefined || typeof value === "boolean";
}

function isSettings(value: unknown): value is CatalogSettings {
  if (!isRecord(value)) return false;
  return (
    isOptionalString(value.botUsername) &&
    isOptionalBoolean(value.deepLinks) &&
    isOptionalString(value.deepLinkPrefix) &&
    isOptionalString(value.telegramChannel) &&
    isOptionalString(value.facebookPage) &&
    isOptionalString(value.paymentPage)
  );
}

function isCategory(value: unknown): value is CatalogCategory {
  if (!isRecord(value)) return false;
  return (
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.subtitle === "string" &&
    isOptionalString(value.icon) &&
    isOptionalString(value.page)
  );
}

function isPlanEntry(value: unknown): value is CatalogPlanEntry {
  if (!isRecord(value)) return false;
  if (typeof value.header === "string" && value.id === undefined) return true;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isOptionalString(value.desc) &&
    isOptionalString(value.price) &&
    isOptionalBoolean(value.bot) &&
    isOptionalBoolean(value.contact) &&
    isOptionalBoolean(value.stock) &&
    isOptionalString(value.bonus)
  );
}

function isProduct(value: unknown): value is CatalogProduct {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.category === "string" &&
    typeof value.name === "string" &&
    typeof value.subtitle === "string" &&
    typeof value.image === "string" &&
    isOptionalString(value.imageClass) &&
    isOptionalString(value.modalTitle) &&
    (value.planPicker === undefined || value.planPicker === "duration") &&
    Array.isArray(value.plans) &&
    value.plans.every(isPlanEntry)
  );
}

export function parseCatalogData(value: unknown): CatalogData {
  if (!isRecord(value)) throw new Error("Catalog response is not an object.");
  if (!isSettings(value.settings)) {
    throw new Error("Catalog settings are invalid.");
  }
  if (!Array.isArray(value.categories) || !value.categories.every(isCategory)) {
    throw new Error("Catalog categories are invalid.");
  }
  if (!Array.isArray(value.products) || !value.products.every(isProduct)) {
    throw new Error("Catalog products are invalid.");
  }

  const categorySlugs = new Set(value.categories.map((category) => category.slug));
  const productIds = new Set<string>();
  for (const product of value.products) {
    if (!categorySlugs.has(product.category)) {
      throw new Error(`Unknown category for product ${product.id}.`);
    }
    if (productIds.has(product.id)) {
      throw new Error(`Duplicate product id ${product.id}.`);
    }
    productIds.add(product.id);

    const planIds = new Set<string>();
    for (const entry of product.plans) {
      if (!("id" in entry)) continue;
      const plan = entry as CatalogPlan;
      if (planIds.has(plan.id)) {
        throw new Error(`Duplicate plan id ${plan.id} for ${product.id}.`);
      }
      planIds.add(plan.id);
    }
  }

  return value as CatalogData;
}

export async function fetchCatalog(signal?: AbortSignal): Promise<CatalogData> {
  const response = await fetch("/products.json", {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Products request failed with ${response.status}.`);
  }
  return parseCatalogData(await response.json());
}

export function isAskPricePlan(plan: CatalogPlan) {
  if (plan.contact === true) return true;
  if (typeof plan.price !== "string") return false;

  // SQLite price=0 is the bot/admin contract for "Ask Price". Older panel
  // publications exposed that sentinel as the literal string "0 Ks" instead
  // of Gamma's contact:true shape, so the storefront accepts both forms while
  // the panel-side writer migrates future edits to the canonical shape.
  const numeric = plan.price.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0];
  return numeric !== undefined && Number(numeric) === 0;
}

// Versioned asset URLs: the hosting cache headers mark /images/* as
// immutable, so content updates to an existing file need a new URL to show
// up. Bump this when image files change; unchanged images stay cached and
// are never re-requested during scrolling.
const ASSET_VERSION = "2";

export function publicAssetPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${normalized}?v=${ASSET_VERSION}`;
}

export function categoryHref(slug: string) {
  return `/${slug}/`;
}

export function paymentHref(productId: string, planId: string) {
  const query = new URLSearchParams({ product: productId, plan: planId });
  return `/payment/?${query.toString()}`;
}

export function telegramCheckoutHref(
  settings: CatalogSettings,
  productId: string,
  planId: string,
) {
  if (
    settings.deepLinks === false ||
    typeof settings.botUsername !== "string" ||
    !settings.botUsername
  ) {
    return null;
  }
  const payload = `${settings.deepLinkPrefix || "buy"}-${productId}-${planId}`;
  return `https://t.me/${encodeURIComponent(settings.botUsername)}?start=${encodeURIComponent(payload)}`;
}
