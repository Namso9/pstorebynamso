"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ErrorState } from "@/components/common/StatusState";
import { useCatalog } from "@/hooks/useCatalog";
import type { CatalogData } from "@/types/catalog";

import { CheckoutModal } from "./CheckoutModal";
import { PlanModal } from "./PlanModal";
import { ProductGrid } from "./ProductGrid";

type CheckoutTarget = {
  productId: string;
  planId: string;
  nonce: number;
};

type CategoryCatalogProps = {
  categorySlug: string;
  initialCatalog: CatalogData;
};

export function CategoryCatalog({
  categorySlug,
  initialCatalog,
}: CategoryCatalogProps) {
  const { catalog = initialCatalog, status, error, refresh } = useCatalog(initialCatalog);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const lastLocationTarget = useRef("");

  const products = useMemo(
    () => catalog.products.filter((product) => product.category === categorySlug),
    [catalog, categorySlug],
  );
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) || null;

  /**
   * Rewrite the URL to say exactly which target is on screen — and nothing
   * else.
   *
   * This is the whole fix for "apps open by themselves while I scroll". The
   * location effect re-derives its target from the URL every time the live
   * catalog poll returns different bytes (a stock sync, every few minutes), so
   * ANY dismissed target left in the URL is a modal that re-opens on its own
   * minutes later. Three separate paths got that wrong, each found one review
   * pass after the last:
   *
   *   · a `#app-<id>` left behind by a close        -> the plan modal reopened
   *   · the same hash left behind by moving to      -> the plan modal reopened
   *     checkout, whose claim is a DIFFERENT key       UNDERNEATH the checkout
   *   · a `?product=&plan=` left behind when the    -> the CHECKOUT reopened
   *     visitor moved on to another product
   *
   * The query pair is a real entry point (the effect handles it deliberately),
   * so it has to be cleared rather than assumed absent.
   */
  const setLocationTarget = useCallback(
    (options: { hash?: string; keepCheckoutQuery?: boolean }) => {
      const url = new URL(window.location.href);
      if (!options.keepCheckoutQuery) {
        url.searchParams.delete("product");
        url.searchParams.delete("plan");
      }
      url.hash = options.hash || "";
      window.history.replaceState(
        null,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
    },
    [],
  );

  const openPlans = useCallback(
    (productId: string) => {
      setLocationTarget({ hash: `app-${productId}` });
      document.getElementById(`app-${productId}`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      // Claim the target BEFORE the state change, and make sure the URL now
      // resolves to exactly this key — the claim and the URL agreeing is what
      // the guard in the effect depends on.
      lastLocationTarget.current = `plans:${productId}`;
      setSelectedProductId(productId);
    },
    [setLocationTarget],
  );

  const closePlans = useCallback(() => {
    setLocationTarget({});
    lastLocationTarget.current = "";
    setSelectedProductId(null);
  }, [setLocationTarget]);

  const openCheckout = useCallback(
    (productId: string, planId: string) => {
      // The query pair, if the visitor arrived by one, still describes exactly
      // what is opening — so it is the one thing kept.
      setLocationTarget({ keepCheckoutQuery: true });
      lastLocationTarget.current = `checkout:${productId}:${planId}`;
      setSelectedProductId(null);
      setCheckoutTarget({ productId, planId, nonce: Date.now() });
    },
    [setLocationTarget],
  );

  useEffect(() => {
    const openFromLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const queryProduct = params.get("product");
      const queryPlan = params.get("plan");
      const hashProduct = window.location.hash.startsWith("#app-")
        ? decodeURIComponent(window.location.hash.slice(5))
        : null;
      const targetKey = queryProduct && queryPlan
        ? `checkout:${queryProduct}:${queryPlan}`
        : hashProduct
          ? `plans:${hashProduct}`
          : "";
      if (!targetKey || lastLocationTarget.current === targetKey) return;

      const frame = window.requestAnimationFrame(() => {
        if (queryProduct && queryPlan) {
          const product = products.find((item) => item.id === queryProduct);
          if (
            product?.plans.some(
              (entry) => "id" in entry && entry.id === queryPlan,
            )
          ) {
            lastLocationTarget.current = targetKey;
            document.getElementById(`app-${queryProduct}`)?.scrollIntoView({
              block: "center",
            });
            openCheckout(queryProduct, queryPlan);
          }
          return;
        }
        if (hashProduct && products.some((item) => item.id === hashProduct)) {
          lastLocationTarget.current = targetKey;
          document.getElementById(`app-${hashProduct}`)?.scrollIntoView({
            block: "center",
          });
          setSelectedProductId(hashProduct);
        }
      });
      return () => window.cancelAnimationFrame(frame);
    };

    const cancelFrame = openFromLocation();
    window.addEventListener("hashchange", openFromLocation);
    return () => {
      cancelFrame?.();
      window.removeEventListener("hashchange", openFromLocation);
    };
  }, [openCheckout, products]);

  return (
    <>
      {status === "error" ? (
        <div className="catalog-inline-error">
          <ErrorState
            title="Live catalog update မရသေးပါ"
            message={`${error || "Network error"} နောက်ဆုံး build data ကို ဆက်ပြထားပါတယ်။`}
            onRetry={refresh}
          />
        </div>
      ) : null}

      {products.length ? (
        <ProductGrid products={products} onViewPlans={openPlans} />
      ) : (
        <div className="catalog-empty">
          <p>
            ဒီ category မှာ product မရှိသေးပါ။ နောက်မှ ပြန်ကြည့်ပေးပါ သို့မဟုတ်
            Admin ကို မေးမြန်းနိုင်ပါတယ်။
          </p>
          <a
            className="button button--primary button--md"
            href={catalog.settings.telegramChannel || "https://t.me/Premiumstorezz"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Admin
          </a>
        </div>
      )}

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
    </>
  );
}
