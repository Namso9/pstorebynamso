"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { useCatalog } from "@/hooks/useCatalog";
import { isAskPricePlan } from "@/services/catalog";
import { orderQuery, resolveCatalogSelection } from "@/services/order";
import type { CatalogData } from "@/types/catalog";

type OrderSummaryLocation = "payment" | "order";

type OrderSummaryProps = {
  initialCatalog: CatalogData;
  location: OrderSummaryLocation;
  /** Set once the order has actually been submitted (order page only). */
  done?: boolean;
};

type Selection = NonNullable<ReturnType<typeof resolveCatalogSelection>>;

/**
 * The checkout rail plus, when a plan was selected, the summary card.
 *
 * The rail names the step and nothing else. It deliberately gives no
 * instruction about transferring money: an Ask Price plan, an out-of-stock
 * plan, or a plan edited since the last build must not be told to pay, and the
 * page body below — which resolves the same live catalog and already carries
 * every one of those guards — stays the single source of truth for what this
 * particular customer should do.
 */
export function OrderSummary({
  initialCatalog,
  location,
  done = false,
}: OrderSummaryProps) {
  const searchParams = useSearchParams();
  const { catalog = initialCatalog } = useCatalog(initialCatalog);
  const productId = searchParams.get("product");
  const planId = searchParams.get("plan");
  const selection = resolveCatalogSelection(catalog, productId, planId);

  return (
    <>
      <CheckoutSteps current={done ? "done" : "payment"} />
      {selection ? (
        <SummaryCard selection={selection} location={location} />
      ) : null}
    </>
  );
}

function SummaryCard({
  selection,
  location,
}: {
  selection: Selection;
  location: OrderSummaryLocation;
}) {
  const { product, plan } = selection;
  const query = orderQuery(product.id, plan?.id || null);

  return (
    <section className="order-summary-next" aria-labelledby="order-summary-title">
      <p className="eyebrow">Selected product</p>
      <h2 id="order-summary-title">Your Order</h2>
      <p>
        <strong>{product.name}</strong>
        {plan ? ` — ${plan.name}${plan.desc ? ` (${plan.desc})` : ""}` : ""}
      </p>
      {plan && (isAskPricePlan(plan) || plan.price) ? (
        <p className="order-summary-next__price">
          {isAskPricePlan(plan) ? "Ask Price" : plan.price}
        </p>
      ) : null}
      {plan?.stock === false ? (
        <p className="order-stock-warning" role="alert">
          သတိပြုရန် — ဒီ plan က လောလောဆယ် stock မရှိပါ။
          {location === "payment"
            ? " ငွေမလွှဲခင် Admin ကို အရင်မေးပေးပါ။"
            : " Order တင်ထားရင် stock ပြန်ရှိချိန် Admin က အကြောင်းပြန်ပါမယ်။"}
        </p>
      ) : null}
      {location === "payment" ? (
        <p className="order-summary-next__note">
          အောက်မှာ Platform ရွေးပြီး QR နဲ့ ငွေလွှဲပါ။ ပြီးရင် screenshot ကို{" "}
          <a href="https://www.messenger.com/t/happyyou2020" target="_blank" rel="noopener noreferrer">
            Page Messenger
          </a>{" "}
          သို့မဟုတ်{" "}
          <Link href={`/order/${query}`} prefetch={false}>ဒီ order form</Link> ကနေ တင်နိုင်ပါတယ်။
        </p>
      ) : (
        <p className="order-summary-next__note">
          အောက်က form ကိုဖြည့်ပြီး ငွေလွှဲ screenshot တင်ပေးပါ။
        </p>
      )}
    </section>
  );
}
