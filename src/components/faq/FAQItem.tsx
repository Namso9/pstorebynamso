"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

import { SafeRichText } from "@/components/common/SafeRichText";
import { useRevealMotion } from "@/hooks/useRevealMotion";
import type { FaqItemData } from "@/types/content";

export function FAQItem({ item, index = 0 }: { item: FaqItemData; index?: number }) {
  const [open, setOpen] = useState(false);
  const answerId = useId();
  const reducedMotion = useReducedMotion();
  const revealMotion = useRevealMotion({
    delay: Math.min(index, 5) * 0.035,
    duration: 0.34,
    offset: 10,
    amount: 0.15,
  });

  return (
    <motion.article
      className="faq-item"
      {...revealMotion}
    >
      <button
        type="button"
        className="faq-question"
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{item.q}</span>
        <span className="faq-chevron" aria-hidden="true">⌄</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={answerId}
            className="faq-answer"
            initial={reducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="faq-answer__inner">
              <SafeRichText html={item.a_html} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
