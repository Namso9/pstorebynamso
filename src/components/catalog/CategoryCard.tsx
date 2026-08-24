"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { Icon } from "@/components/common/Icon";
import { categoryIconName, categoryWordmark } from "@/data/category-icons";
import { useRevealMotion } from "@/hooks/useRevealMotion";
import { categoryHref } from "@/services/catalog";
import type { CatalogCategory } from "@/types/catalog";

type CategoryCardProps = {
  category: CatalogCategory;
  productCount: number;
  index?: number;
};

const MotionLink = motion.create(Link);

/**
 * Photo-free by decision (owner, 2026-08-23): the old green `images/p*.webp`
 * category photos were retired rather than redrawn, so the tile carries an
 * inline-SVG mark from `categories[].icon` plus the real `categories[].subtitle`
 * instead of a picture and a "tap the photo" placeholder line. The mark uses its
 * own class — `.category-card__media` still belongs to the guide tile's photo
 * and would force `aspect-ratio: 1` / `object-fit: cover` onto a 24px glyph.
 */
export function CategoryCard({
  category,
  productCount,
  index = 0,
}: CategoryCardProps) {
  const revealMotion = useRevealMotion({
    delay: Math.min(index, 7) * 0.045,
    duration: 0.42,
    offset: 16,
    amount: 0.15,
  });
  const wordmark = categoryWordmark(category.slug);

  return (
    <MotionLink
      className="category-card"
      href={categoryHref(category.slug)}
      prefetch={false}
      data-haptic="light"
      {...revealMotion}
    >
      {/* `aria-hidden` either way: the tile's own <h3> already names the
          category, so the mark is decoration and a screen reader that read
          "AI" here would announce the name twice. */}
      <span
        className="category-card__icon"
        data-wordmark={wordmark ? "" : undefined}
        aria-hidden="true"
      >
        {wordmark ? (
          <span className="category-card__wordmark">{wordmark}</span>
        ) : (
          <Icon name={categoryIconName(category.icon)} />
        )}
      </span>
      {/* `.category-card__body` must keep exactly two children — the count pill
          is pinned with `margin-block-start: auto` and a third child breaks the
          shared baseline across a grid row. */}
      <div className="category-card__body">
        <div>
          <h3>{category.title}</h3>
          <p>{category.subtitle}</p>
        </div>
        <span className="category-count">
          {productCount} {productCount === 1 ? "product" : "products"}
        </span>
      </div>
    </MotionLink>
  );
}
