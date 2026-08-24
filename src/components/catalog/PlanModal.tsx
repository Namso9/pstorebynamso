"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import { HapticSwitch } from "@/components/common/HapticSwitch";
import { Modal } from "@/components/common/Modal";
import { productGuideLinks } from "@/data/product-links";
import { isAskPricePlan, publicAssetPath } from "@/services/catalog";
import { trackProductClick } from "@/services/track";
import type {
  CatalogPlan,
  CatalogProduct,
  CatalogSettings,
} from "@/types/catalog";
import { isCatalogPlan } from "@/types/catalog";

type PlanModalProps = {
  product: CatalogProduct | null;
  settings: CatalogSettings;
  onClose: () => void;
  onCheckout: (productId: string, planId: string) => void;
};

export function PlanModal({
  product,
  settings,
  onClose,
  onCheckout,
}: PlanModalProps) {
  /**
   * Wrapped once here rather than at the two call sites below, and NOT in
   * `CategoryCatalog.openCheckout`, which is also reached by a
   * `?product=&plan=` deep link — a reload of a payment URL is not a click.
   */
  const handleCheckout = useCallback(
    (productId: string, planId: string) => {
      trackProductClick(productId, "checkout", "modal");
      onCheckout(productId, planId);
    },
    [onCheckout],
  );

  const contactRow = (
    <div className="plan-contact-row">
      <a
        className="button button--primary button--sm"
        href={settings.telegramChannel || "https://t.me/Premiumstorezz"}
        target="_blank"
        rel="noopener noreferrer"
      >
        Ask on Telegram
      </a>
      <a
        className="button button--secondary button--sm"
        href={settings.facebookPage || "https://www.messenger.com/t/happyyou2020"}
        target="_blank"
        rel="noopener noreferrer"
      >
        Facebook
      </a>
    </div>
  );

  const guideLink = product ? productGuideLinks[product.id] : undefined;

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={product?.modalTitle || product?.name || "Choose Plan"}
      className="catalog-modal"
      banner={
        <span className="plan-modal-brand">
          <Image
            src="/images/brand-logo.png?v=2"
            alt=""
            width={28}
            height={28}
          />
          <span className="plan-modal-brand__text">
            PREMIUM <strong>STORE</strong>
          </span>
        </span>
      }
      icon={
        product ? (
          <span className="plan-modal-icon">
            <Image
              className={["plan-modal-icon__img", product.imageClass]
                .filter(Boolean)
                .join(" ")}
              src={publicAssetPath(product.image)}
              alt=""
              width={40}
              height={40}
            />
          </span>
        ) : undefined
      }
    >
      {product ? (
        <div className="plan-list">
          {product.plans.length ? (
            product.planPicker === "duration" ? (
              <DurationPicker
                product={product}
                contactRow={contactRow}
                onCheckout={handleCheckout}
              />
            ) : (
              product.plans.map((entry, index) => {
                if (!isCatalogPlan(entry)) {
                  return (
                    <h3 className="plan-group" key={`${entry.header}-${index}`}>
                      {entry.header}
                    </h3>
                  );
                }
                return (
                  <PlanRow
                    plan={entry}
                    contactRow={contactRow}
                    onCheckout={() => handleCheckout(product.id, entry.id)}
                    key={entry.id}
                  />
                );
              })
            )
          ) : (
            <div className="contact-plan-empty">
              <p>ဒီ product အတွက် plan များကို Admin ကို တိုက်ရိုက် မေးမြန်းပေးပါ။</p>
              {contactRow}
            </div>
          )}
          {guideLink ? (
            <div className="plan-modal-links">
              <Link
                className="button button--secondary button--sm"
                href={guideLink.href}
                prefetch={false}
                data-haptic="light"
              >
                {guideLink.label}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

/** "12 Months" -> "12". Falls back to the whole name when there is no number. */
function chipLabel(plan: CatalogPlan) {
  return plan.name.trim().match(/^(\d+)/)?.[1] ?? plan.name;
}

/**
 * Two-step selection for products with more plans than anyone wants to scan as
 * a list: pick a duration, then act on one result card.
 *
 * Opt-in only, via `products.json` `planPicker: "duration"` — every other
 * product keeps the flat list above, byte for byte. The result card is a real
 * `PlanRow`, so the three plan states (out of stock, ask-price, buy) and the
 * haptics contract are not forked. `{header}` group rows have no meaning in a
 * one-line-at-a-time picker and are ignored here.
 */
function DurationPicker({
  product,
  contactRow,
  onCheckout,
}: {
  product: CatalogProduct;
  contactRow: React.ReactNode;
  onCheckout: (productId: string, planId: string) => void;
}) {
  const plans = useMemo(
    () => product.plans.filter(isCatalogPlan),
    [product.plans],
  );
  const [requestedId, setRequestedId] = useState("");
  const chipRefs = useRef(new Map<string, HTMLButtonElement | null>());

  // A live products.json edit can retire the selected plan mid-session; fall
  // back to the first one rather than rendering an empty result card.
  const activeId = plans.some((plan) => plan.id === requestedId)
    ? requestedId
    : plans[0]?.id ?? "";
  const activePlan = plans.find((plan) => plan.id === activeId);

  const select = (planId: string) => {
    setRequestedId(planId);
    chipRefs.current.get(planId)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = plans.findIndex((plan) => plan.id === activeId);
    const last = plans.length - 1;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = index >= last ? 0 : index + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = index <= 0 ? last : index - 1;
    } else if (event.key === "Home") {
      next = 0;
    } else {
      next = last;
    }
    const target = plans[next];
    if (target) select(target.id);
  };

  if (!activePlan) return null;

  return (
    <div className="plan-picker">
      <p className="plan-picker__label" id="plan-picker-label">
        ကာလ (လ) ရွေးပါ
      </p>
      <div
        className="plan-picker__chips"
        role="radiogroup"
        aria-labelledby="plan-picker-label"
        onKeyDown={onKeyDown}
      >
        {plans.map((plan) => {
          const checked = plan.id === activeId;
          return (
            <button
              className="plan-picker__chip"
              type="button"
              role="radio"
              aria-checked={checked}
              aria-controls="plan-picker-result"
              tabIndex={checked ? 0 : -1}
              data-haptic="selection"
              key={plan.id}
              ref={(node) => {
                chipRefs.current.set(plan.id, node);
              }}
              onClick={() => select(plan.id)}
            >
              {chipLabel(plan)}
            </button>
          );
        })}
      </div>
      <div
        className="plan-picker__result"
        id="plan-picker-result"
        aria-live="polite"
      >
        <PlanRow
          plan={activePlan}
          contactRow={contactRow}
          onCheckout={() => onCheckout(product.id, activePlan.id)}
          key={activePlan.id}
        />
      </div>
    </div>
  );
}

function PlanRow({
  plan,
  contactRow,
  onCheckout,
}: {
  plan: CatalogPlan;
  contactRow: React.ReactNode;
  onCheckout: () => void;
}) {
  if (plan.stock === false) {
    return (
      <div className="plan-row plan-row--unavailable">
        <PlanDetails plan={plan} />
        <div className="plan-row__price">
          <span>{plan.price}</span>
          <strong>Out of stock</strong>
        </div>
      </div>
    );
  }

  if (isAskPricePlan(plan)) {
    return (
      <div className="plan-row plan-row--contact">
        <PlanDetails plan={plan} />
        {contactRow}
      </div>
    );
  }

  return (
    <button
      className="plan-row"
      type="button"
      data-haptic="medium"
      onClick={onCheckout}
    >
      <PlanDetails plan={plan} />
      <span className="plan-row__price">{plan.price}</span>
      <HapticSwitch />
    </button>
  );
}

function PlanDetails({ plan }: { plan: CatalogPlan }) {
  return (
    <span className="plan-row__details">
      <strong>{plan.name}</strong>
      {plan.desc ? <span>{plan.desc}</span> : null}
      {plan.bonus ? (
        <span className="plan-picker__bonus">🎁 {plan.bonus}</span>
      ) : null}
    </span>
  );
}
