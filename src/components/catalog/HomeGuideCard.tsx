"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import type { HomeGuideItem } from "@/data/home-highlights";

const MotionLink = motion.create(Link);

/**
 * A guide tile that sits in the category grid. Since the category cards went
 * photo-free it carries the same shape — a small mark, the copy, and a pill
 * where a category shows its product count — so the grid reads as one rhythm
 * instead of one photo tile among icon tiles.
 */
export function HomeGuideCard({ item }: { item: HomeGuideItem }) {
  return (
    <MotionLink
      className="category-card category-card--guide"
      href={item.href}
      prefetch={false}
      data-haptic="light"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className="category-card__icon category-card__icon--mark"
        aria-hidden="true"
      >
        {/* Decorative: the heading below already carries the tile's name, so an
            alt here would make the link announce itself twice. */}
        <Image src={item.image} alt="" width={96} height={96} />
      </span>
      <div className="category-card__body">
        <div>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </div>
        <span className="category-count">Guide</span>
      </div>
    </MotionLink>
  );
}
