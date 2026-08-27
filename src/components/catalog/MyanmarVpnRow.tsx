"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";

import { cheapestPrice, isModifiedClick } from "./PopularProducts";

import { productLogoClass } from "@/data/product-media";
import { useRevealMotion } from "@/hooks/useRevealMotion";
import { publicAssetPath } from "@/services/catalog";
import type { CatalogData, CatalogProduct } from "@/types/catalog";

const MotionLink = motion.create(Link);

/**
 * Hand-picked by the owner, cheapest plan first (owner order, 2026-08-28):
 * the VPNs that work from inside Myanmar. Resolved against the LIVE catalog
 * exactly like the popular row, so an id that has not been published yet —
 * `myanmar-vless` lands via the panel, not this repo — or is later retired
 * simply drops out instead of rendering a dead tile.
 */
const FEATURED_IDS = ["myanmar-vless", "proton", "nord", "express_phone"];

type MyanmarVpnRowProps = {
  catalog: CatalogData;
  /** Open the product's plan modal IN PLACE (see the card's onClick). */
  onViewPlans: (productId: string) => void;
};

/**
 * "Myanmar Region ရတဲ့ VPN များ" — a hand-picked row, NOT a measured one.
 *
 * It reuses the popular row's card classes wholesale (same height contract,
 * same phone side-scroll) but deliberately does NOT call `trackProductClick`:
 * the source enum is pinned across three repos by `npm run track:check`, and
 * reporting these clicks as "grid" would let a hand-picked promo row feed the
 * measured popular ranking — the same feedback loop `source: "popular"` exists
 * to prevent.
 */
export function MyanmarVpnRow({ catalog, onViewPlans }: MyanmarVpnRowProps) {
  const products = useMemo(() => {
    const byId = new Map(catalog.products.map((entry) => [entry.id, entry]));
    return FEATURED_IDS.map((id) => byId.get(id)).filter(
      (entry): entry is NonNullable<typeof entry> => Boolean(entry),
    );
  }, [catalog.products]);

  if (!products.length) return null;

  return (
    <section
      className="popular-products myanmar-vpn-row"
      aria-labelledby="myanmar-vpn-title"
    >
      <div className="section-heading">
        <div>
          <h2 id="myanmar-vpn-title">Myanmar Region ရတဲ့ VPN များ</h2>
        </div>
      </div>
      <div className="popular-grid">
        {products.map((product, index) => (
          <MyanmarVpnCard
            product={product}
            index={index}
            onViewPlans={onViewPlans}
            key={product.id}
          />
        ))}
      </div>
    </section>
  );
}

/** One card per component, for the same stagger reason as `PopularCard`. */
function MyanmarVpnCard({
  product,
  index,
  onViewPlans,
}: {
  product: CatalogProduct;
  index: number;
  onViewPlans: (productId: string) => void;
}) {
  const revealMotion = useRevealMotion({
    delay: Math.min(index, 3) * 0.045,
    duration: 0.4,
    offset: 14,
    amount: 0.1,
  });
  const price = cheapestPrice(product);

  return (
    <MotionLink
      className="popular-card"
      href={`/${product.category}/#app-${product.id}`}
      prefetch={false}
      data-product={product.id}
      /* A plain tap opens the plan modal RIGHT HERE instead of following the
         href (owner report, 2026-08-28: "နှိပ်လိုက်ရင် category ထဲ
         အလိုလိုရောက်သွားတယ်") — the visitor stays on the home page and the
         modal closes back onto it. The href is kept for what a modal cannot
         serve: middle/cmd-click, long-press "open in new tab", crawlers. */
      onClick={(event) => {
        if (isModifiedClick(event)) return;
        event.preventDefault();
        onViewPlans(product.id);
      }}
      {...revealMotion}
    >
      {/* The corner chip reuses the rank chip's styling; here it marks the
          row's one shared property instead of a ranking. */}
      <span className="popular-card__rank" aria-hidden="true">
        🇲🇲
      </span>
      <span className="product-logo-frame">
        <Image
          className={productLogoClass(product)}
          src={publicAssetPath(product.image)}
          alt=""
          width={64}
          height={64}
          loading="eager"
        />
      </span>
      <span className="popular-card__body">
        <strong>{product.name}</strong>
        <span className="popular-card__meta">
          {price ? `${price} မှစ` : product.subtitle}
        </span>
      </span>
    </MotionLink>
  );
}
