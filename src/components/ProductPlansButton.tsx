"use client";

import { useId, useRef, useState } from "react";
import AnimatedDialog from "@/components/AnimatedDialog";
import PlanActions from "@/components/PlanActions";
import { useCategoryPages } from "@/components/CatalogProvider";
import { trackProductClick } from "@/services/track";
import ProductLogo from "@/components/ProductLogo";
import type { CategoryProduct } from "@/lib/categoryPages";

export default function ProductPlansButton({ product, className = "all-product-action", titleTrigger }: {
  product: CategoryProduct;
  className?: string;
  titleTrigger?: string;
}) {
  const [open, setOpen] = useState(false);
  const pages = useCategoryPages();
  const selected = open ? pages.flatMap(c => c.products).find(p => p.id === product.id) : null;
  const titleId = useId();
  const openerRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastOpenedAt = useRef(0);
  const openPlans = () => {
    if (titleTrigger && Date.now() - lastOpenedAt.current < 500) return;
    if (titleTrigger) lastOpenedAt.current = Date.now();
    trackProductClick(product.id, "plans", titleTrigger ? "modal" : "grid");
    setOpen(true);
  };

  const onTitleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const now = Date.now();
    const x = touch.clientX;
    const y = touch.clientY;
    if (now - start.time > 300 || Math.hypot(x - start.x, y - start.y) > 12) {
      lastTap.current = null;
      return;
    }
    const previous = lastTap.current;
    lastTap.current = { time: now, x, y };
    if (previous && now - previous.time <= 400 && Math.hypot(x - previous.x, y - previous.y) <= 24) {
      event.preventDefault();
      lastTap.current = null;
      openPlans();
    }
  };

  return (
    <>
      {titleTrigger ? (
        <h1
          ref={(element) => { openerRef.current = element; }}
          tabIndex={-1}
          onDoubleClick={openPlans}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStart.current = event.touches.length === 1
              ? { time: Date.now(), x: touch.clientX, y: touch.clientY }
              : null;
          }}
          onTouchEnd={onTitleTouchEnd}
          onTouchCancel={() => { touchStart.current = null; lastTap.current = null; }}
        >{titleTrigger}</h1>
      ) : (
        <button ref={(element) => { openerRef.current = element; }} type="button" className={className} aria-haspopup="dialog" onClick={openPlans}>
          View Plans
        </button>
      )}
      <AnimatedDialog
        variant="plans"
        open={open}
        onClose={() => setOpen(false)}
        backdropClassName="catalog-plans-backdrop"
        className="catalog-plans-dialog"
        labelledBy={titleId}
        returnFocusRef={openerRef}
      >
        <button type="button" className="catalog-plans-close" aria-label="Close plans" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div className="catalog-plans-brand">
          <span>PREMIUM <strong>STORE</strong></span>
        </div>
        <div className="catalog-plans-heading">
          {selected && <ProductLogo product={selected} />}
          <h2 id={titleId}>{selected?.name || "Product unavailable"}</h2>
        </div>
        {!selected && <p>This product is no longer available. Please choose another product.</p>}
        <div className="catalog-plans-list">
          {selected?.plans.map((plan) => (
            <div className={`catalog-plans-row${plan.soldOut ? " sold-out" : ""}`} key={plan.id}>
              <span><strong>{plan.label}</strong>{plan.soldOut && <small>Out of stock</small>}</span>
              <b>{plan.price}</b>
              <PlanActions product={selected} plan={plan} onChoose={() => setOpen(false)} />
            </div>
          ))}
        </div>
      </AnimatedDialog>
    </>
  );
}
