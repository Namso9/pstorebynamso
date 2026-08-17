"use client";

import { useEffect, useState } from "react";

import { ErrorState, LoadingState } from "@/components/common/StatusState";
import { HapticSwitch } from "@/components/common/HapticSwitch";
import { Modal } from "@/components/common/Modal";
import {
  fetchCatalog,
  isAskPricePlan,
  paymentHref,
  telegramCheckoutHref,
} from "@/services/catalog";
import type {
  CatalogData,
  CatalogPlan,
  CatalogProduct,
} from "@/types/catalog";
import { isCatalogPlan } from "@/types/catalog";

type CheckoutSelection = {
  product: CatalogProduct;
  plan: CatalogPlan;
  catalog: CatalogData;
};

type CheckoutModalProps = {
  open: boolean;
  productId: string;
  planId: string;
  onClose: () => void;
};

export function CheckoutModal({
  open,
  productId,
  planId,
  onClose,
}: CheckoutModalProps) {
  const [selection, setSelection] = useState<CheckoutSelection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void fetchCatalog(controller.signal)
      .then((catalog) => {
        const product = catalog.products.find((item) => item.id === productId);
        const planEntry = product?.plans.find(
          (entry) => isCatalogPlan(entry) && entry.id === planId,
        );
        if (!product || !planEntry || !isCatalogPlan(planEntry)) {
          throw new Error("ရွေးထားသော product သို့မဟုတ် plan ကို မတွေ့ပါ။");
        }
        setSelection({ product, plan: planEntry, catalog });
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Checkout data မတင်နိုင်သေးပါ။",
        );
      });
    return () => controller.abort();
  }, [attempt, open, planId, productId]);

  const retry = () => {
    setSelection(null);
    setError(null);
    setAttempt((value) => value + 1);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ဝယ်ယူနည်း ရွေးပါ"
      className="catalog-modal"
    >
      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : selection ? (
        <CheckoutOptions selection={selection} onClose={onClose} />
      ) : (
        <LoadingState label="လက်ရှိ stock ကို စစ်ဆေးနေပါတယ်…" />
      )}
    </Modal>
  );
}

function CheckoutOptions({
  selection,
  onClose,
}: {
  selection: CheckoutSelection;
  onClose: () => void;
}) {
  const { product, plan, catalog } = selection;
  if (plan.stock === false) {
    return (
      <div className="checkout-unavailable" role="alert">
        <p>ဒီ plan လောလောဆယ် stock မရှိပါ။ နောက်မှ ပြန်စစ်ပေးပါ။</p>
        <button
          type="button"
          className="button button--secondary button--md"
          data-haptic="light"
          onClick={onClose}
        >
          ပိတ်မည်
          <HapticSwitch />
        </button>
      </div>
    );
  }

  if (isAskPricePlan(plan)) {
    return (
      <div className="checkout-unavailable" role="status">
        <p>ဒီ plan ရဲ့ လက်ရှိစျေးနှုန်းနဲ့ order availability ကို Admin ကို အရင်မေးပေးပါ။</p>
        <div className="plan-contact-row">
          <a
            className="button button--primary button--md"
            href={catalog.settings.telegramChannel || "https://t.me/Premiumstorezz"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask on Telegram
          </a>
          <a
            className="button button--secondary button--md"
            href={catalog.settings.facebookPage || "https://www.messenger.com/t/happyyou2020"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
        </div>
      </div>
    );
  }

  const telegramHref =
    plan.bot === true
      ? telegramCheckoutHref(catalog.settings, product.id, plan.id)
      : null;

  return (
    <div className="checkout-options">
      <div className="checkout-summary">
        <div>
          <strong>{product.name}</strong>
          <span>
            {plan.name}
            {plan.desc ? ` · ${plan.desc}` : ""}
          </span>
        </div>
        {plan.price ? <strong>{plan.price}</strong> : null}
      </div>

      {telegramHref ? (
        <a
          className="checkout-option checkout-option--recommended"
          href={telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          data-haptic="medium"
        >
          <strong>Telegram Bot ကနေ ဝယ်မည်</strong>
          <span>အမြန်ဆုံး · auto delivery · wallet/VIP အကျိုးရ (Recommended)</span>
        </a>
      ) : null}

      <a
        className="checkout-option"
        href={paymentHref(product.id, plan.id)}
        data-haptic="medium"
      >
        <strong>Website ကနေ Order Form တင်မည်</strong>
        <span>Payment screenshot တင် · admin က manual ပြန်ဆက်သွယ်</span>
      </a>

      {!telegramHref ? (
        <p className="checkout-note">
          ဒီ plan အတွက် bot auto မရသေးပါ — Website Order Form နဲ့ ဝယ်ပါ။
        </p>
      ) : null}
    </div>
  );
}
