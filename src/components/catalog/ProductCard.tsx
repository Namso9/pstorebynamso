"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { productLogoClass } from "@/data/product-media";
import { useRevealMotion } from "@/hooks/useRevealMotion";
import { publicAssetPath } from "@/services/catalog";
import { trackProductClick } from "@/services/track";
import type { CatalogProduct } from "@/types/catalog";

type ProductCardProps = {
  product: CatalogProduct;
  onViewPlans: (productId: string) => void;
  index?: number;
};

export function ProductCard({ product, onViewPlans, index = 0 }: ProductCardProps) {
  const revealMotion = useRevealMotion({
    delay: Math.min(index, 7) * 0.045,
    duration: 0.4,
    amount: 0.18,
  });

  return (
    <motion.article
      className="product-card"
      id={`app-${product.id}`}
      {...revealMotion}
    >
      <div className="product-card__identity">
        <span className="product-logo-frame">
          <Image
            className={productLogoClass(product)}
            src={publicAssetPath(product.image)}
            alt={product.name}
            width={64}
            height={64}
            loading="eager"
          />
        </span>
        <div>
          <h2>{product.name}</h2>
          <p>{product.subtitle}</p>
        </div>
      </div>
      <button
        className="button button--primary button--sm product-card__action"
        type="button"
        data-haptic="light"
        onClick={() => {
          // Anonymous interest count — id, control and place, nothing else.
          // See src/services/track.ts.
          trackProductClick(product.id, "plans", "grid");
          onViewPlans(product.id);
        }}
      >
        View Plans
        {/* No HapticSwitch overlay here (2026-08-24, owner report): this
            button sits in the middle of a grid the finger scrolls through,
            and a WebKit switch is DRAGGABLE — a vertical swipe that should
            scroll the page was read as a switch drag and opened the plans
            dialog. The buzz here now comes from HapticRoot's read-only
            pointer path, which cannot touch click semantics, so a swipe is
            always a scroll and only a deliberate tap opens the dialog. */}
      </button>
    </motion.article>
  );
}
