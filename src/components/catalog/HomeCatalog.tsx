"use client";

import { useMemo } from "react";

import { CategoryCard } from "./CategoryCard";
import { HomeGuideCard } from "./HomeGuideCard";
import { HomeSpotlight } from "./HomeSpotlight";
import { PopularProducts } from "./PopularProducts";

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
  const { catalog = initialCatalog, status, error, refresh } = useCatalog(initialCatalog);

  const counts = useMemo(
    () =>
      catalog.products.reduce<Record<string, number>>((result, product) => {
        result[product.category] = (result[product.category] || 0) + 1;
        return result;
      }, {}),
    [catalog],
  );

  return (
    <section className="home-section home-catalog" id="products" aria-label="Premium digital products">
      {status === "error" ? (
        <div className="catalog-notice" role="status">
          <span>Live update မရသေးပါ။ နောက်ဆုံး build data ကို ပြထားပါတယ်။</span>
          <button type="button" data-haptic="light" onClick={refresh}>
            Retry
          </button>
          <span className="sr-only">{error}</span>
        </div>
      ) : null}

      {/* `catalog` is passed down rather than fetched again: this component
          already owns the one live catalog poll on the home page, and a second
          `useCatalog` would double every products.json request. */}
      <PopularProducts catalog={catalog} initialPopular={initialPopular} />

      {homeSpotlights.length ? (
        <div className="home-spotlights" aria-label="New on Premium Store">
          {homeSpotlights.map((item, index) => (
            <HomeSpotlight item={item} index={index} key={item.id} />
          ))}
        </div>
      ) : null}

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
    </section>
  );
}
