"use client";

import { useCallback, useMemo, useState } from "react";

import { CategoryCard } from "./CategoryCard";
import { CheckoutModal } from "./CheckoutModal";
import { HomeGuideCard } from "./HomeGuideCard";
import { HomeSpotlight } from "./HomeSpotlight";
import { MyanmarVpnRow } from "./MyanmarVpnRow";
import { PlanModal } from "./PlanModal";
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

type CheckoutTarget = {
  productId: string;
  planId: string;
  nonce: number;
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

  /**
   * The home page hosts its own PlanModal/CheckoutModal pair (owner report,
   * 2026-08-28): a tap on a Myanmar-row or popular-row card used to follow the
   * card's href into the product's category page, so closing the modal left
   * the visitor somewhere they never chose to go. Opening it here keeps them
   * on the home page, and closing lands them exactly where they tapped.
   *
   * Unlike CategoryCatalog, NO URL hash or query is written and no location
   * effect exists — the modal state lives and dies with plain React state, so
   * the whole re-open-on-stock-sync class of bugs CategoryCatalog documents
   * cannot start here. `#app-<id>` deep links keep resolving on the category
   * pages, where the anchor actually exists in the grid.
   */
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(
    null,
  );
  const selectedProduct =
    catalog.products.find((product) => product.id === selectedProductId) ||
    null;
  const openPlans = useCallback(
    (productId: string) => setSelectedProductId(productId),
    [],
  );
  const closePlans = useCallback(() => setSelectedProductId(null), []);
  const openCheckout = useCallback((productId: string, planId: string) => {
    setSelectedProductId(null);
    setCheckoutTarget({ productId, planId, nonce: Date.now() });
  }, []);

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
      <MyanmarVpnRow catalog={catalog} onViewPlans={openPlans} />

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
      <PopularProducts
        catalog={catalog}
        initialPopular={initialPopular}
        onViewPlans={openPlans}
      />

      <PlanModal
        product={selectedProduct}
        settings={catalog.settings}
        onClose={closePlans}
        onCheckout={openCheckout}
      />

      {checkoutTarget ? (
        <CheckoutModal
          key={`${checkoutTarget.productId}:${checkoutTarget.planId}:${checkoutTarget.nonce}`}
          open
          productId={checkoutTarget.productId}
          planId={checkoutTarget.planId}
          onClose={() => setCheckoutTarget(null)}
        />
      ) : null}
    </section>
  );
}
