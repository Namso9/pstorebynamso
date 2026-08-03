"use client";

import { motion, type HTMLMotionProps } from "motion/react";

import { useRevealMotion } from "@/hooks/useRevealMotion";

type AnimatedSectionProps = HTMLMotionProps<"section">;

export function AnimatedSection({
  children,
  className = "",
  ...props
}: AnimatedSectionProps) {
  const revealMotion = useRevealMotion({ duration: 0.44, offset: 16, amount: 0.18 });

  return (
    <motion.section
      className={className}
      {...revealMotion}
      {...props}
    >
      {children}
    </motion.section>
  );
}
