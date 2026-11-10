"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState, type ComponentProps } from "react";

import { useCatalog } from "@/hooks/useCatalog";
import { OrderFormCard } from "@/components/order/OrderForm";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PaymentExperience } from "@/components/payment/PaymentExperience";
import { resolveCatalogSelection } from "@/services/order";
import type { CatalogData, CatalogSettings } from "@/types/catalog";

type CheckoutFlowProps = {
  initialCatalog: CatalogData;
  /**
   * Renders the QR / platform picker above the order form, making /payment/ a
   * single step: transfer, then attach the screenshot without leaving the page.
   */
  withPayment?: boolean;
};

/**
 * One checkout step, assembled in one place: the rail and order summary, the
 * payment panel when this is the payment route, and the order form.
 *
 * Paying and proving the payment used to be two pages, so the rail's Payment
 * step spanned a hop the customer had to make on their own \u2014 and the hop was
 * offered next to Messenger and Telegram links, which sent people off-site
 * mid-checkout. Both pages now render the whole step; /order/ simply omits the
 * QR panel for customers who arrive with the payment already made.
 *
 * This component owns the ONE live catalog subscription for the step and hands
 * the same snapshot to every child. That is not only cheaper \u2014 each
 * `useCatalog` carries its own request and five-second poll \u2014 it is what keeps
 * the guards honest: the payment panel and the order form both decide whether
 * a plan is buyable, and reading two independently refreshed snapshots could
 * leave one inviting a transfer while the other says to ask the admin first.
 */
export function CheckoutFlow({
  initialCatalog,
  withPayment = false,
}: CheckoutFlowProps) {
  const searchParams = useSearchParams();
  const { catalog = initialCatalog } = useCatalog(initialCatalog);
  const productId = searchParams.get("product");
  const planId = searchParams.get("plan");
  const selectionKey = `${productId ?? ""}:${planId ?? ""}`;
  // Completion is stored as the selection that completed, not a bare boolean:
  // switching product mid-session would otherwise show the new, unsubmitted
  // order as Done until the remounted child's effect got around to clearing it.
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const handleDone = useCallback(
    (done: boolean) => setDoneKey(done ? selectionKey : null),
    [selectionKey],
  );

  // Engagement is tracked per selection, so switching product starts fresh.
  // Scanning a QR counts: a customer can transfer money without ever touching
  // the form, and losing their platform choice to a refresh would be as bad as
  // losing typed input.
  const [engagedKey, setEngagedKey] = useState<string | null>(null);
  const [scannedMethod, setScannedMethod] = useState("");
  const handleEngaged = useCallback(
    () => setEngagedKey(selectionKey),
    [selectionKey],
  );
  const handlePlatform = useCallback(
    (formValue: string) => {
      setScannedMethod(formValue);
      setEngagedKey(selectionKey);
    },
    [selectionKey],
  );

  const selection = resolveCatalogSelection(catalog, productId, planId);
  const engaged = engagedKey === selectionKey;
  const done = doneKey === selectionKey;
  // Out of stock is a payment-page stop, not an order-page one: /order/ still
  // accepts the order so the admin can call back.
  const invalidSelection = Boolean(productId || planId) && !selection?.plan;
  const soldOut = withPayment && selection?.plan?.stock === false;

  // The QR and its "transfer now" copy go the moment stock does \u2014 nobody
  // should be invited to pay for something that cannot be delivered \u2014 and
  // again once the order is in, where they would only invite a second one.
  const showPayment = withPayment && !soldOut && !done && !invalidSelection;
  // The form only goes if there is nothing to lose. A background refresh lands
  // every five seconds, and unmounting a form mid-session would discard
  // everything typed, the screenshot chosen, and \u2014 worst \u2014 the success panel
  // of an order already paid for and sent, which is how a customer ends up
  // paying twice.
  const showForm = !soldOut || engaged;

  if (invalidSelection && !engaged && !done) return <section className="payment-card-next" role="status"><h1>Plan unavailable</h1><p>This link no longer identifies an available plan. Choose a current plan before paying.</p><a className="button button--primary" href="/products/">Browse products</a></section>;

  return (
    <>
      <OrderSummary
        catalog={catalog}
        location={withPayment ? "payment" : "order"}
        done={done}
      />
      {soldOut && !done ? (
        <SoldOutNotice settings={catalog.settings} engaged={engaged} />
      ) : null}
      {showPayment ? (
        <PaymentExperience catalog={catalog} onPlatformChange={handlePlatform} />
      ) : null}
      {showForm ? (
        <StableOrderForm
          key={selectionKey}
          initialCatalog={initialCatalog}
          catalog={catalog}
          productId={productId}
          planId={planId}
          onDone={handleDone}
          onEngaged={handleEngaged}
          defaultPayment={scannedMethod}
          engaged={engaged}
          // Only the payment panel prints the Ask Price notice, so the form
          // must print it whenever that panel is not on screen.
          askPriceHandledAbove={showPayment}
          headingLevel={withPayment ? "h2" : "h1"}
        />
      ) : null}
    </>
  );
}

function StableOrderForm(props: ComponentProps<typeof OrderFormCard>) {
  const [baseline] = useState(props.catalog);
  return <OrderFormCard {...props} initialCatalog={baseline} />;
}

/**
 * Offers contact and nothing else when the customer has not started. The order
 * form is not an alternative there: it requires a payment method and a
 * transfer screenshot, which is exactly what they have just been told not to
 * send. Once they HAVE started, the form stays below this notice \u2014 they may
 * already have transferred, and that order still has to reach the admin.
 */
function SoldOutNotice({
  settings,
  engaged,
}: {
  settings: CatalogSettings;
  engaged: boolean;
}) {
  return (
    <div className="payment-card-next checkout-unavailable" role="alert">
      <p>
        {engaged ? (
          <>
            <strong>&#4114;&#4142; plan stock &#4096;&#4143;&#4116;&#4154;&#4126;&#4157;&#4140;&#4152;&#4117;&#4139;&#4117;&#4156;&#4142;&#4171;</strong> &#4100;&#4157;&#4145;&#4124;&#4157;&#4158;&#4146;&#4117;&#4156;&#4142;&#4152;&#4126;&#4140;&#4152;&#4102;&#4141;&#4143;&#4123;&#4100;&#4154;
            &#4129;&#4145;&#4140;&#4096;&#4154;&#4121;&#4158;&#4140; Order &#4102;&#4096;&#4154;&#4112;&#4100;&#4154;&#4117;&#4139;&#4171; &#4121;&#4124;&#4157;&#4158;&#4146;&#4123;&#4126;&#4145;&#4152;&#4123;&#4100;&#4154; &#4100;&#4157;&#4145;&#4121;&#4124;&#4157;&#4158;&#4146;&#4117;&#4139;&#4116;&#4146;&#4151;&#4171;
          </>
        ) : (
          <>
            <strong>&#4114;&#4142; plan stock &#4121;&#4123;&#4158;&#4141;&#4126;&#4145;&#4152;&#4117;&#4139;&#4171;</strong> &#4100;&#4157;&#4145;&#4121;&#4124;&#4157;&#4158;&#4146;&#4117;&#4139;&#4116;&#4146;&#4151;&#4171; Admin &#4096;&#4141;&#4143;
            &#4121;&#4145;&#4152;&#4117;&#4139;&#4171;
          </>
        )}
      </p>
      <div className="plan-contact-row">
        <a
          className="button button--primary button--md"
          href={settings.telegramChannel || "https://t.me/Premiumstorezz"}
          target="_blank"
          rel="noopener noreferrer"
          data-haptic="light"
        >
          Telegram
        </a>
        <a
          className="button button--secondary button--md"
          href={settings.facebookPage || "https://www.messenger.com/t/happyyou2020"}
          target="_blank"
          rel="noopener noreferrer"
          data-haptic="light"
        >
          Facebook
        </a>
      </div>
    </div>
  );
}
