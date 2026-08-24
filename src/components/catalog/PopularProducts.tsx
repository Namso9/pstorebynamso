"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import { useRevealMotion } from "@/hooks/useRevealMotion";
import { productLogoClass } from "@/data/product-media";
import {
  isCatalogPlan,
  type CatalogData,
  type CatalogProduct,
} from "@/types/catalog";
import { isAskPricePlan, publicAssetPath } from "@/services/catalog";
import { fetchPopularData } from "@/services/content";
import { trackProductClick } from "@/services/track";
import type { PopularData } from "@/types/content";

const MotionLink = motion.create(Link);

/** How many tiles the row shows. The published list is deliberately longer. */
const SHOWN = 4;

type PopularProductsProps = {
  catalog: CatalogData;
  initialPopular: PopularData;
};

/**
 * Cheapest real price across a product's plans, as the panel wrote it.
 *
 * Prices are display STRINGS ("12,000 Ks"), not numbers, so this parses for
 * comparison only and returns the original string — reformatting them here
 * would quietly invent a currency format the rest of the site does not use.
 * "Ask price" plans are skipped: they have no number to be cheapest.
 */
function cheapestPrice(product: CatalogProduct) {
  let best: { value: number; label: string } | null = null;
  for (const entry of product.plans) {
    if (!isCatalogPlan(entry)) continue;
    if (entry.stock === false || isAskPricePlan(entry)) continue;
    const numeric = entry.price?.replace(/,/g, "").match(/\d+(?:\.\d+)?/)?.[0];
    if (numeric === undefined) continue;
    const value = Number(numeric);
    if (!Number.isFinite(value) || value <= 0) continue;
    if (!best || value < best.value) best = { value, label: entry.price || "" };
  }
  return best?.label || null;
}

/**
 * "Most viewed this week" — ranked from real clicks, never hand-picked.
 *
 * The ranking arrives as an id list in panel-written `data/popular.json` and is
 * resolved against the LIVE catalog here, so a retired or renamed product drops
 * out instead of rendering a dead tile. That is also why the published list is
 * longer than `SHOWN`: the row stays full after a drop-out.
 *
 * Fetched once on mount rather than on the shared five-second revalidation
 * cadence: the panel republishes this hourly at most, and the home page already
 * polls `products.json` on that cadence for stock and price.
 *
 * Renders NOTHING until there is real data. An empty week must show an empty
 * space, not a filler list — the whole point of the row is that it is measured.
 *
 * LAYOUT-SHIFT CONTRACT, in two halves. First paint carries the BUILD-TIME
 * ranking and the live file corrects it a moment later, exactly as price and
 * stock already work everywhere else on the site — so a re-order after
 * hydration is expected and is not what has to be prevented. Height is.
 *
 *   · The CSS makes a card's height constant (`min-height` plus a two-line name
 *     clamp and a one-line meta clamp), so no re-order and no substitution can
 *     move the category grid below. That is why a same-length re-order is
 *     allowed to publish live.
 *   · The panel drops the `[CF-Pages-Skip]` prefix when the published COUNT
 *     changes, because that is the one thing the CSS cannot absorb — the row
 *     appearing, disappearing, or gaining a row at two columns.
 *
 * Breaking either half brings the shift back, so they are documented together.
 */
export function PopularProducts({
  catalog,
  initialPopular,
}: PopularProductsProps) {
  const [popular, setPopular] = useState(initialPopular);

  const categoryNames = useMemo(
    () =>
      new Map(catalog.categories.map((category) => [category.slug, category.title])),
    [catalog.categories],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchPopularData(controller.signal)
      .then(setPopular)
      // A failed or malformed fetch keeps the build-time list. This row is
      // never worth an error message on the home page.
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const products = useMemo(() => {
    const byId = new Map(catalog.products.map((entry) => [entry.id, entry]));
    const resolve = (items: string[]) =>
      items
        .map((id) => byId.get(id))
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .slice(0, SHOWN);

    const fromBuild = resolve(initialPopular.items);
    const fromLive = resolve(popular.items);
    // The live list is adopted only when it renders the SAME NUMBER of cards as
    // the build snapshot. A re-order is safe to apply immediately — the CSS
    // makes a card's height independent of its contents — but a count change
    // adds or removes a grid row, and the Pages rebuild that would make the
    // static HTML agree is asynchronous. Applying it here would shift the
    // category grid for every visitor in that window; waiting means the row is
    // one build behind for a minute, which nobody can see.
    return fromLive.length === fromBuild.length ? fromLive : fromBuild;
  }, [catalog.products, initialPopular.items, popular.items]);

  if (!products.length) return null;

  return (
    <section className="popular-products" aria-labelledby="popular-products-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">This week</p>
          <h2 id="popular-products-title">ဒီအပတ် လူကြည့်များဆုံး Products</h2>
        </div>
      </div>
      <div className="popular-grid">
        {products.map((product, index) => (
          <PopularCard
            product={product}
            rank={index + 1}
            categoryName={categoryNames.get(product.category) || ""}
            key={product.id}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * One card, and one reveal per card.
 *
 * `useRevealMotion` returns a single `AnimationControls`, which drives every
 * element it is spread onto — so calling it once in the parent and reusing it
 * across four tiles animates them as one object and throws the stagger away.
 * Every other card in this app (CategoryCard, HomeSpotlight, ProductCard) is a
 * component per item for exactly this reason.
 */
function PopularCard({
  product,
  rank,
  categoryName,
}: {
  product: CatalogProduct;
  rank: number;
  categoryName: string;
}) {
  const revealMotion = useRevealMotion({
    delay: Math.min(rank - 1, 3) * 0.045,
    duration: 0.4,
    offset: 14,
    amount: 0.1,
  });
  const price = cheapestPrice(product);

  return (
    <MotionLink
      className="popular-card"
      href={`/${product.category}/#app-${product.id}`}
      prefetch={false}
      data-product={product.id}
      /* `source: "popular"` is what keeps this row out of its own ranking —
         the panel records the click and excludes it. */
      onClick={() => trackProductClick(product.id, "plans", "popular")}
      {...revealMotion}
    >
      <span className="popular-card__rank" aria-hidden="true">
        {rank}
      </span>
      {/* `productLogoClass` carries `product.imageClass` through exactly as
          before — thirteen of the catalog's values select the light squircle
          plate that keeps a dark-ink brand mark (ChatGPT, Nord, Perplexity …)
          readable on the dark glass tile — and adds the full-bleed class for
          the owner's real raster app icons (Atom, Mytel, Bioscope). Manus has
          no class in the catalog and is styled by its card anchor instead, so
          the card carries its id. */}
      <span className="product-logo-frame">
        <Image
          className={productLogoClass(product)}
          src={publicAssetPath(product.image)}
          alt=""
          width={64}
          height={64}
          loading="eager"
        />
      </span>
      <span className="popular-card__body">
        <strong>{product.name}</strong>
        <span className="popular-card__meta">
          {price
            ? [categoryName, `${price} မှစ`].filter(Boolean).join(" · ")
            : product.subtitle}
        </span>
      </span>
    </MotionLink>
  );
}
