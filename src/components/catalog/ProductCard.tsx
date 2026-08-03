"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { useRevealMotion } from "@/hooks/useRevealMotion";
import { publicAssetPath } from "@/services/catalog";
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
            className={["product-logo", product.imageClass]
              .filter(Boolean)
              .join(" ")}
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
        onClick={() => onViewPlans(product.id)}
      >
        View Plans
      </button>
    </motion.article>
  );
}
