"use client";

import Link from "next/link";

import { Icon } from "@/components/common/Icon";
import { useCatalog } from "@/hooks/useCatalog";
import { isAskPricePlan } from "@/services/catalog";
import type { CatalogData } from "@/types/catalog";
import { isCatalogPlan } from "@/types/catalog";

const BIOSCOPE_PRODUCT_ID = "bioscope";

/**
 * The download page's exit to the paid plans.
 *
 * Everything is read from the catalog, never restated here: `products.json` is
 * panel-owned and live-proxied, so a second price list on this page would be a
 * stale price list. It renders nothing at all while the product is absent, so
 * the page never ships a dead link between panel publish cycles.
 *
 * It lives outside `BioscopeDownloads` on purpose — that component is a pure
 * projection of `data/bioscope-download.json`, and `qa/bioscope-download-check.mjs`
 * requires every href in that file to be an https link on an approved host, so
 * a relative internal route cannot be modelled as a download entry.
 */
export function BioscopePlansCta({
  initialCatalog,
}: {
  initialCatalog: CatalogData;
}) {
  const { catalog = initialCatalog } = useCatalog(initialCatalog);
  const product = catalog.products.find(
    (item) => item.id === BIOSCOPE_PRODUCT_ID,
  );
  if (!product) return null;

  const prices = product.plans
    .filter(isCatalogPlan)
    .filter((plan) => plan.stock !== false && !isAskPricePlan(plan))
    .map((plan) => ({
      label: plan.price ?? "",
      amount: Number((plan.price ?? "").replace(/[^\d]/g, "")),
    }))
    .filter((entry) => entry.label && Number.isFinite(entry.amount) && entry.amount > 0)
    .sort((first, second) => first.amount - second.amount);
  const cheapest = prices[0]?.label;

  return (
    <section className="bioscope-plans" aria-label="Bioscope premium plans">
      <h2>Bioscope Premium ဝယ်ယူရန်</h2>
      <p>
        App ကို install လုပ်ပြီးပါက Premium plan လေး ရွေးလိုက်ရင် ကြည့်လို့ရပါပြီ။
        {cheapest ? ` စျေးနှုန်း ${cheapest} ကနေ စပါတယ်။` : ""}
      </p>
      <Link
        className="button button--primary button--sm"
        href={`/${product.category}/#app-${product.id}`}
        prefetch={false}
        data-haptic="medium"
      >
        Plan များ ကြည့်ရန်
        <Icon name="arrow-right" />
      </Link>
    </section>
  );
}
