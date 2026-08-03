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

  const openPlans = useCallback((productId: string) => {
    const url = new URL(window.location.href);
    url.hash = `app-${productId}`;
    window.history.replaceState(null, "", url);
    document.getElementById(`app-${productId}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
    setSelectedProductId(productId);
  }, []);

  const openCheckout = useCallback((productId: string, planId: string) => {
    setSelectedProductId(null);
    setCheckoutTarget({ productId, planId, nonce: Date.now() });
  }, []);

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
        onClose={() => setSelectedProductId(null)}
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
