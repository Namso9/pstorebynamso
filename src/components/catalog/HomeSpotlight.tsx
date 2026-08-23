"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import { Icon } from "@/components/common/Icon";
import { useRevealMotion } from "@/hooks/useRevealMotion";
import type { HomeSpotlightItem } from "@/data/home-highlights";

const MotionLink = motion.create(Link);

type HomeSpotlightProps = {
  item: HomeSpotlightItem;
  index?: number;
};

export function HomeSpotlight({ item, index = 0 }: HomeSpotlightProps) {
  const revealMotion = useRevealMotion({
    delay: Math.min(index, 3) * 0.05,
    duration: 0.42,
    offset: 16,
    amount: 0.15,
  });

  return (
    <MotionLink
      className="home-spotlight"
      href={item.href}
      prefetch={false}
      data-haptic="light"
      {...revealMotion}
    >
      <span className="home-spotlight__mark">
        <Image
          className={item.imageClass}
          src={item.image}
          alt={item.imageAlt}
          width={96}
          height={96}
        />
      </span>
      <span className="home-spotlight__body">
        <span className="home-spotlight__badge">{item.badge}</span>
        <strong>{item.title}</strong>
        <span className="home-spotlight__text">{item.text}</span>
      </span>
      <span className="home-spotlight__action">
        <span>{item.action}</span>
        <Icon name="arrow-right" />
      </span>
    </MotionLink>
  );
}
