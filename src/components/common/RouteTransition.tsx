"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

// No AnimatePresence and no pathname key: keying the wrapper on the route
// remounted the entire page subtree on every navigation, so every image
// remounted (flicker / "refresh-like" feel) and every reveal animation
// replayed. The wrapper now persists across navigations; only the incoming
// page's own content mounts, once.
export function RouteTransition({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="route-transition"
      initial={reducedMotion ? false : { opacity: 0.985, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
