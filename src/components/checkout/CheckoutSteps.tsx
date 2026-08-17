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
  order: "အဆင့် ၁ / ၃ — ဝယ်လိုတဲ့ Plan ကို ရွေးပါ။",
  payment: "အဆင့် ၂ / ၃ — ငွေပေးချေမှု အဆင့်။ အောက်က အချက်အလက်အတိုင်း လုပ်ပါ။",
  done: "အဆင့် ၃ / ၃ — Order ရောက်ပါပြီ။ Admin က ပြန်ဆက်သွယ်ပါမယ်။",
};

const STATE_LABELS = {
  done: "ပြီးပါပြီ",
  current: "လက်ရှိအဆင့်",
  todo: "မလုပ်ရသေး",
} as const;

/**
 * The Order → Payment → Done rail shown across checkout, so a customer can see
 * how many steps are left before they part with money. Presentation only — it
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
                  {state === "done" ? "✓" : index + 1}
                </span>
                <span className="checkout-steps__text">{step.label}</span>
                <span className="sr-only"> — {STATE_LABELS[state]}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="checkout-steps__caption">{caption ?? CAPTIONS[current]}</p>
    </div>
  );
}
