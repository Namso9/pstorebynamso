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
 * page body below \u2014 which resolves the same live catalog and already carries
 * every one of those guards \u2014 stays the single source of truth for what this
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
  // one that is out of stock, is told the opposite two lines below \u2014 so it
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
        {plan ? ` \u2014 ${plan.name}${plan.desc ? ` (${plan.desc})` : ""}` : ""}
      </p>
      {plan && (isAskPricePlan(plan) || plan.price) ? (
        <p className="order-summary-next__price">
          {isAskPricePlan(plan) ? "Ask Price" : plan.price}
        </p>
      ) : null}
      {plan?.stock === false ? (
        <p className="order-stock-warning" role="alert">
          &#4126;&#4112;&#4141;&#4117;&#4156;&#4143;&#4123;&#4116;&#4154; &#8212; &#4114;&#4142; plan &#4096; &#4124;&#4145;&#4140;&#4124;&#4145;&#4140;&#4102;&#4122;&#4154; stock &#4121;&#4123;&#4158;&#4141;&#4117;&#4139;&#4171;
          {location === "payment"
            ? " \u1004\u103d\u1031\u1019\u101c\u103d\u103e\u1032\u1001\u1004\u103a Admin \u1000\u102d\u102f \u1021\u101b\u1004\u103a\u1019\u1031\u1038\u1015\u1031\u1038\u1015\u102b\u104b"
            : " Order \u1010\u1004\u103a\u1011\u102c\u1038\u101b\u1004\u103a stock \u1015\u103c\u1014\u103a\u101b\u103e\u102d\u1001\u103b\u102d\u1014\u103a Admin \u1000 \u1021\u1000\u103c\u1031\u102c\u1004\u103a\u1038\u1015\u103c\u1014\u103a\u1015\u102b\u1019\u101a\u103a\u104b"}
        </p>
      ) : null}
      {payable ? (
        <p className="order-summary-next__note">
          {location === "payment"
            ? "\u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1019\u103e\u102f \u1014\u100a\u103a\u1038\u101c\u1019\u103a\u1038 \u101b\u103d\u1031\u1038\u1001\u103b\u101a\u103a\u1015\u102b (KPay / Wave Money / AYA Pay)"
            : "\u1004\u103d\u1031\u101c\u103d\u103e\u1032 screenshot \u1014\u1032\u1037 Order \u1010\u1004\u103a\u1015\u102b\u104b"}
        </p>
      ) : null}
    </section>
  );
}
