export type CheckoutStepKey = "order" | "payment" | "done";

type CheckoutStepsProps = {
  current: CheckoutStepKey;
  /** Overrides the default Burmese caption under the rail. */
  caption?: string;
};

const STEPS: { key: CheckoutStepKey; label: string }[] = [
  { key: "order", label: "Order" },
  { key: "payment", label: "Payment" },
  { key: "done", label: "Done" },
];

/**
 * Captions name the step and stop there. They must never instruct a customer
 * to transfer money: whether that is the right advice depends on the selected
 * plan (Ask Price, out of stock, edited since the last build), and the page
 * body below the rail is what resolves that.
 */
const CAPTIONS: Record<CheckoutStepKey, string> = {
  order: "\u1021\u1006\u1004\u1037\u103a \u1041 / \u1043 \u2014 Plan \u101b\u103d\u1031\u1038\u1015\u102b\u104b",
  payment: "\u1021\u1006\u1004\u1037\u103a \u1042 / \u1043 \u2014 \u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1031\u1019\u103e\u102f \u1021\u1006\u1004\u1037\u103a\u104b",
  done: "\u1021\u1006\u1004\u1037\u103a \u1043 / \u1043 \u2014 Order \u101b\u1031\u102c\u1000\u103a\u1015\u102b\u1015\u103c\u102e\u104b",
};

const STATE_LABELS = {
  done: "\u1015\u103c\u102e\u1038\u1015\u102b\u1015\u103c\u102e",
  current: "\u101c\u1000\u103a\u101b\u103e\u102d\u1021\u1006\u1004\u1037\u103a",
  todo: "\u1019\u101c\u102f\u1015\u103a\u101b\u101e\u1031\u1038",
} as const;

/**
 * The Order \u2192 Payment \u2192 Done rail shown across checkout, so a customer can see
 * how many steps are left before they part with money. Presentation only \u2014 it
 * carries no links and no state of its own; each page passes the step it is on.
 */
export function CheckoutSteps({ current, caption }: CheckoutStepsProps) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <div className="checkout-steps">
      <ol className="checkout-steps__rail" aria-label="Checkout progress">
        {STEPS.map((step, index) => {
          const state =
            index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
          return (
            <li
              className="checkout-steps__item"
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
              key={step.key}
            >
              {index > 0 ? (
                <span className="checkout-steps__line" aria-hidden="true" />
              ) : null}
              <span className="checkout-steps__pill">
                <span className="checkout-steps__badge" aria-hidden="true">
                  {state === "done" ? "\u2713" : index + 1}
                </span>
                <span className="checkout-steps__text">{step.label}</span>
                <span className="sr-only"> &#8212; {STATE_LABELS[state]}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="checkout-steps__caption">{caption ?? CAPTIONS[current]}</p>
    </div>
  );
}
