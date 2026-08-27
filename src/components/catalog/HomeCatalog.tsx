"use client";

import { useMemo } from "react";

import { CategoryCard } from "./CategoryCard";
import { HomeGuideCard } from "./HomeGuideCard";
import { HomeSpotlight } from "./HomeSpotlight";
import { MyanmarVpnRow } from "./MyanmarVpnRow";
import { PopularProducts } from "./PopularProducts";
import { VlessServersPanel } from "./VlessServersPanel";

import { homeGuideCards, homeSpotlights } from "@/data/home-highlights";
import { useCatalog } from "@/hooks/useCatalog";
import type { CatalogData } from "@/types/catalog";
import type { PopularData } from "@/types/content";

type HomeCatalogProps = {
  initialCatalog: CatalogData;
  initialPopular: PopularData;
};

export function HomeCatalog({
  initialCatalog,
  initialPopular,
}: HomeCatalogProps) {
  const {
    catalog = initialCatalog,
    status,
    error,
    refresh,
  } = useCatalog(initialCatalog);

  const counts = useMemo(
    () =>
      catalog.products.reduce<Record<string, number>>((result, product) => {
        result[product.category] = (result[product.category] || 0) + 1;
        return result;
      }, {}),
    [catalog],
  );

  return (
    <section
      className="home-section home-catalog"
      id="products"
      aria-label="Premium digital products"
    >
      {status === "error" ? (
        <div className="catalog-notice" role="status">
          <span>Live update မရသေးပါ။ နောက်ဆုံး build data ကို ပြထားပါတယ်။</span>
          <button type="button" data-haptic="light" onClick={refresh}>
            Retry
          </button>
          <span className="sr-only">{error}</span>
        </div>
      ) : null}

      {/* Owner-picked Myanmar VPN row first (owner request, 2026-08-27),
          then categories, then the measured popular row (2026-08-24 design):
          the grid stays the primary navigation, and the popular row still
          renders nothing at all when there is no data. */}
      <MyanmarVpnRow catalog={catalog} />

      {/* Compact disclosure under the VPN row (owner request, 2026-08-28):
          the live location list of the Myanmar VLESS key. Fetches only when
          opened — see VlessServersPanel. */}
      <VlessServersPanel />

      <div className="section-heading">
        <div>
          <p className="eyebrow">Explore</p>
          <h2>Category အလိုက် ရွေးချယ်ဝယ်ယူပါ</h2>
        </div>
      </div>
      <div className="category-grid">
        {catalog.categories.map((category, index) => (
          <CategoryCard
            category={category}
            productCount={counts[category.slug] || 0}
            index={index}
            key={category.slug}
          />
        ))}
        {homeGuideCards.map((item) => (
          <HomeGuideCard item={item} key={item.id} />
        ))}
      </div>

      {homeSpotlights.length ? (
        <div className="home-spotlights" aria-label="New on Premium Store">
          {homeSpotlights.map((item, index) => (
            <HomeSpotlight item={item} index={index} key={item.id} />
          ))}
        </div>
      ) : null}

      {/* `catalog` is passed down rather than fetched again: this component
          already owns the one live catalog poll on the home page, and a second
          `useCatalog` would double every products.json request. */}
      <PopularProducts catalog={catalog} initialPopular={initialPopular} />
    </section>
  );
}
