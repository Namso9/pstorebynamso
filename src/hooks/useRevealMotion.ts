"use client";

import { useEffect, useRef } from "react";
import { useAnimationControls, useReducedMotion } from "motion/react";

type RevealMotionOptions = {
  delay?: number;
  duration?: number;
  offset?: number;
  amount?: number;
};

export function useRevealMotion({
  delay = 0,
  duration = 0.42,
  offset = 14,
  amount = 0.16,
}: RevealMotionOptions = {}) {
  const controls = useAnimationControls();
  const reducedMotion = useReducedMotion();
  const hasRevealed = useRef(false);
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const reveal = () => {
    if (hasRevealed.current) return;
    hasRevealed.current = true;
    if (reducedMotion) return;

    // Elements already inside the viewport when the page hydrated were
    // painted visible by the SSR HTML. Hiding them now and re-animating
    // produces the "flash of content, then fade-in" that reads as a refresh
    // on slower devices. Only below-the-fold entries (which no one has seen
    // yet) get the entrance animation.
    if (mountedAt.current && Date.now() - mountedAt.current < 180) return;

    // Never touch opacity: hiding content and fading it back in is what read
    // as a "refresh" while scrolling. A short transform-only settle keeps the
    // entrance feel with zero disappearing.
    controls.set({ y: offset });
    void controls.start({
      y: 0,
      transition: {
        duration: Math.min(duration, 0.32),
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    });
  };

  return {
    animate: controls,
    initial: false as const,
    onViewportEnter: reveal,
    viewport: { once: true, amount },
  };
}
