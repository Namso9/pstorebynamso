"use client";

import { useSearchParams } from "next/navigation";

import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { isAskPricePlan } from "@/services/catalog";
import { resolveCatalogSelection } from "@/services/order";
import type { CatalogData } from "@/types/catalog";

type OrderSummaryLocation = "payment" | "order";

type OrderSummaryProps = {
  /** The one live catalog `CheckoutFlow` resolves for the whole step. */
  catalog: CatalogData;
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
  catalog,
  location,
  done = false,
}: OrderSummaryProps) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");
  const planId = searchParams.get("plan");
  const selection = resolveCatalogSelection(catalog, productId, planId);
  const plan = selection?.plan ?? null;
  // The note tells the customer to pay. A plan whose price has to be asked, or
  // one that is out of stock, is told the opposite two lines below — so it
  // gets no note at all.
  const payable = plan ? !isAskPricePlan(plan) && plan.stock !== false : false;

  return (
    <>
      <CheckoutSteps current={done ? "done" : "payment"} />
      {/* The Done step keeps the rail and nothing else: what was bought is
          restated inside the confirmation, and a live "Your Order" card next
          to a sent order reads like there is still something to do. */}
      {selection && !done ? (
        <SummaryCard
          selection={selection}
          location={location}
          payable={payable}
        />
      ) : null}
    </>
  );
}

function SummaryCard({
  selection,
  location,
  payable,
}: {
  selection: Selection;
  location: OrderSummaryLocation;
  payable: boolean;
}) {
  const { product, plan } = selection;

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
      {payable ? (
        <p className="order-summary-next__note">
          {location === "payment"
            ? "ငွေပေးချမှု နည်းလမ်း ရွေးချယ်ပါ (KPay / Wave Money / AYA Pay)"
            : "ငွေလွှဲ screenshot နဲ့ Order တင်ပါ။"}
        </p>
      ) : null}
    </section>
  );
}
