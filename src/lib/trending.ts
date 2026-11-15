import { productHref } from "@/lib/productDetails";

export type TrendingItem = {
  id: string;
  name: string;
  desc: string;
  price: string;
  image: string;
  href: string;
};

export type TrendingData = {
  updated: string;
  window_days: number;
  items: TrendingItem[];
};

type OldPlan = { id?: string; price?: string; stock?: boolean };
type OldProduct = {
  id?: string;
  category?: string;
  name?: string;
  subtitle?: string;
  image?: string;
  plans?: OldPlan[];
};

function lowestAvailablePrice(plans: OldPlan[] | undefined): string | null {
  const prices = (Array.isArray(plans) ? plans : [])
    .filter((plan) => plan && typeof plan.id === "string" && plan.stock !== false)
    .map((plan) => {
      const match = plan.price?.match(/^([\d,]+) Ks$/);
      return match ? Number(match[1].replaceAll(",", "")) : null;
    })
    .filter((price): price is number => price !== null && Number.isFinite(price) && price > 0);

  return prices.length ? `From ${Math.min(...prices).toLocaleString("en-US")} Ks` : null;
}

export function resolveTrending(popular: unknown, catalog: unknown, now = Date.now()): TrendingData | null {
  if (!popular || typeof popular !== "object" || !catalog || typeof catalog !== "object") return null;
  const ranking = popular as { updated?: unknown; window_days?: unknown; items?: unknown };
  // The panel publishes daily. Never present an old fallback as this week's activity.
  const published = typeof ranking.updated === "string"
    ? Date.parse(`${ranking.updated} 00:00:00 GMT`) : NaN;
  if (ranking.window_days !== 7 || !Number.isFinite(published) ||
      published > now || now - published > 2 * 24 * 60 * 60 * 1000) return null;
  const source = catalog as { products?: unknown };
  if (!Array.isArray(ranking.items) || !Array.isArray(source.products)) return null;

  const byId = new Map<string, OldProduct>();
  for (const value of source.products) {
    const product = value as OldProduct;
    if (product && typeof product.id === "string") byId.set(product.id, product);
  }

  const items: TrendingItem[] = [];
  const seen = new Set<string>();
  for (const id of ranking.items) {
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,60}$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    const product = byId.get(id);
    if (!product || typeof product.name !== "string" || typeof product.category !== "string" ||
        typeof product.image !== "string" || !/^images\/[A-Za-z0-9._/-]+$/.test(product.image)) continue;
    const price = lowestAvailablePrice(product.plans);
    if (!price) continue;

    const href = productHref(product.name, id);
    const image = `/${product.image}`;

    items.push({
      id,
      name: product.name,
      desc: typeof product.subtitle === "string" ? product.subtitle : "",
      price,
      image,
      href,
    });
    if (items.length === 6) break;
  }

  return {
    updated: typeof ranking.updated === "string" ? ranking.updated : "",
    window_days: typeof ranking.window_days === "number" ? ranking.window_days : 7,
    items,
  };
}
