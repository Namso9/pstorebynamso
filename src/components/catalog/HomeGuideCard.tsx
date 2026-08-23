"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import type { HomeGuideItem } from "@/data/home-highlights";

const MotionLink = motion.create(Link);

/**
 * A guide tile that sits in the category grid. It keeps the grid's card shape
 * and the entrance the live site already ships, so it reads as one row with
 * the catalog categories beside it.
 */
export function HomeGuideCard({ item }: { item: HomeGuideItem }) {
  return (
    <MotionLink
      className="category-card category-card--guide"
      href={item.href}
      prefetch={false}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="category-card__media">
        <Image src={item.image} alt={item.imageAlt} width={800} height={800} />
      </div>
      <div className="category-card__body">
        <div>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </div>
      </div>
    </MotionLink>
  );
}
