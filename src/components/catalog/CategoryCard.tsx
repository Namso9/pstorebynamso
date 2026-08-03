"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import { useRevealMotion } from "@/hooks/useRevealMotion";
import { categoryHref } from "@/services/catalog";
import type { CatalogCategory } from "@/types/catalog";

type CategoryCardProps = {
  category: CatalogCategory;
  image: string;
  productCount: number;
  priority?: boolean;
  index?: number;
};

const MotionLink = motion.create(Link);

export function CategoryCard({
  category,
  image,
  productCount,
  priority = false,
  index = 0,
}: CategoryCardProps) {
  const revealMotion = useRevealMotion({
    delay: Math.min(index, 7) * 0.045,
    duration: 0.42,
    offset: 16,
    amount: 0.15,
  });

  return (
    <MotionLink
      className="category-card"
      href={categoryHref(category.slug)}
      prefetch={false}
      {...revealMotion}
    >
      <div className="category-card__media">
        <Image
          src={image}
          alt={category.title}
          width={800}
          height={800}
          priority={priority}
          loading={priority ? undefined : "eager"}
        />
      </div>
      <div className="category-card__body">
        <div>
          <h3>{category.title}</h3>
          <p>App တစ်ခုချင်းစီ ကြည့်ရန် ပုံကိုနှိပ်ပါ</p>
        </div>
        <span className="category-count">
          {productCount} {productCount === 1 ? "product" : "products"}
        </span>
      </div>
    </MotionLink>
  );
}
