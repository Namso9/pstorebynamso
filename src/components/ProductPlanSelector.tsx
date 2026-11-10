"use client";

import Link from "next/link";
import { useDetailProducts } from "@/components/CatalogProvider";
import { orderIdHref } from "@/lib/ordering";
import { useState } from "react";
import type { ProductPlan } from "@/lib/categoryPages";

export default function ProductPlanSelector({ slug }: {
  plans: ProductPlan[];
  slug: string;
}) {
  const products=useDetailProducts();
  const product=products.find(p=>p.slug===slug)?.product;
  const plans=product?.plans || [];
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=plans.findIndex(p=>p.id===selectedId);
  const plan = selected < 0 ? null : plans[selected];
  const purchaseUrl = product && plan ? orderIdHref(product.id,plan.id) : "";

  if (!plans.length) return <p className="order-notice" role="status">Out of stock. No plans are currently available.</p>;

  return (
    <div className="detail-purchase">
      <fieldset className="detail-plan-options">
        <legend>Choose your plan</legend>
        {plans.map((option, index) => (
          <label className={`detail-plan${selected === index ? " selected" : ""}${option.soldOut ? " sold-out" : ""}`} key={option.id}>
            <input type="radio" name="product-plan" value={index} checked={selected === index} disabled={option.soldOut} onChange={() => setSelectedId(option.id)} />
            <span><strong>{option.label}</strong>{option.soldOut && <small>Out of stock</small>}</span>
            <b>{option.price}</b>
          </label>
        ))}
      </fieldset>
      <div className="detail-order">
        <span className="detail-selected-price" aria-live="polite">{plan?.price || ""}</span>
        {plan && !plan.soldOut && !plan.contact && purchaseUrl ? (
          <Link className="detail-buy" href={purchaseUrl}>Buy now</Link>
        ) : (
          <button type="button" className="detail-buy" disabled>Buy now</button>
        )}
      </div>
    </div>
  );
}
