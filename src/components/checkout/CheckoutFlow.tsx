"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

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
 * step spanned a hop the customer had to make on their own — and the hop was
 * offered next to Messenger and Telegram links, which sent people off-site
 * mid-checkout. Both pages now render the whole step; /order/ simply omits the
 * QR panel for customers who arrive with the payment already made.
 *
 * This component owns the ONE live catalog subscription for the step and hands
 * the same snapshot to every child. That is not only cheaper — each
 * `useCatalog` carries its own request and five-second poll — it is what keeps
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
  // Out of stock is a payment-page stop, not an order-page one: /order/ still
  // accepts the order so the admin can call back.
  const soldOut = withPayment && selection?.plan?.stock === false;

  // The QR and its "transfer now" copy go the moment stock does — nobody
  // should be invited to pay for something that cannot be delivered.
  const showPayment = withPayment && !soldOut;
  // The form only goes if there is nothing to lose. A background refresh lands
  // every five seconds, and unmounting a form mid-session would discard
  // everything typed, the screenshot chosen, and — worst — the success panel
  // of an order already paid for and sent, which is how a customer ends up
  // paying twice.
  const showForm = !soldOut || engaged;

  return (
    <>
      <OrderSummary
        catalog={catalog}
        location={withPayment ? "payment" : "order"}
        done={doneKey === selectionKey}
      />
      {soldOut ? (
        <SoldOutNotice settings={catalog.settings} engaged={engaged} />
      ) : null}
      {showPayment ? (
        <PaymentExperience catalog={catalog} onPlatformChange={handlePlatform} />
      ) : null}
      {showForm ? (
        <OrderFormCard
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

/**
 * Offers contact and nothing else when the customer has not started. The order
 * form is not an alternative there: it requires a payment method and a
 * transfer screenshot, which is exactly what they have just been told not to
 * send. Once they HAVE started, the form stays below this notice — they may
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
            <strong>ဒီ plan stock ကုန်သွားပါပြီ။</strong> ငွေလွှဲပြီးသားဆိုရင်
            အောက်မှာ Order ဆက်တင်ပါ။ မလွှဲရသေးရင် ငွေမလွှဲပါနဲ့။
          </>
        ) : (
          <>
            <strong>ဒီ plan stock မရှိသေးပါ။</strong> ငွေမလွှဲပါနဲ့။ Admin ကို
            မေးပါ။
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
