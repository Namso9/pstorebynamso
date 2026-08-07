"use client";

import Image from "next/image";

import { Modal } from "@/components/common/Modal";
import { isAskPricePlan, publicAssetPath } from "@/services/catalog";
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

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={product?.modalTitle || product?.name || "Choose Plan"}
      className="catalog-modal"
      banner={
        <span className="plan-modal-brand">
          <Image
            src="/images/brand-logo.png"
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
                  onCheckout={() => onCheckout(product.id, entry.id)}
                  key={entry.id}
                />
              );
            })
          ) : (
            <div className="contact-plan-empty">
              <p>ဒီ product အတွက် plan များကို Admin ကို တိုက်ရိုက် မေးမြန်းပေးပါ။</p>
              {contactRow}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
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
    <button className="plan-row" type="button" onClick={onCheckout}>
      <PlanDetails plan={plan} />
      <span className="plan-row__price">{plan.price}</span>
    </button>
  );
}

function PlanDetails({ plan }: { plan: CatalogPlan }) {
  return (
    <span className="plan-row__details">
      <strong>{plan.name}</strong>
      {plan.desc ? <span>{plan.desc}</span> : null}
    </span>
  );
}
