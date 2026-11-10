"use client";

import { useEffect, useEffectEvent, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, domAnimation, LazyMotion, useIsPresent, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

type DialogProps = {
  open: boolean;
  variant?: "search" | "plans" | "review";
  onClose: () => void;
  backdropClassName: string;
  className: string;
  label?: string;
  labelledBy?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
};

const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';
const activeDialogs = new Set<HTMLElement>();
let bodyOverflow = "";

function DialogSurface({ variant = "review", onClose, backdropClassName, className, label, labelledBy, initialFocusRef, returnFocusRef, children }: Omit<DialogProps, "open">) {
  const dialogRef = useRef<HTMLElement>(null);
  const present = useIsPresent();
  const reducedMotion = useReducedMotion();
  const enter = variant === "search" ? { y: -16, scale: 1 } : variant === "plans" ? { y: 32, scale: 1 } : { y: 0, scale: 0.97 };
  const leave = variant === "search" ? { y: -12, scale: 1 } : variant === "plans" ? { y: 24, scale: 1 } : { y: 0, scale: 0.985 };
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const dialog = dialogRef.current;
    if (!dialog || Array.from(activeDialogs).at(-1) !== dialog) return;
    if (event.key !== "Escape" && event.key !== "Tab") return;
    if (!present) {
      event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>(focusable))
      .filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) {
      event.preventDefault();
      dialog.focus();
    } else if (!dialog.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = returnFocusRef?.current ?? document.activeElement;
    if (activeDialogs.size === 0) bodyOverflow = document.body.style.overflow;
    activeDialogs.add(dialog);
    document.body.style.overflow = "hidden";

    const handleKey = (event: KeyboardEvent) => onKeyDown(event);
    window.addEventListener("keydown", handleKey);
    return () => {
      activeDialogs.delete(dialog);
      if (activeDialogs.size === 0) document.body.style.overflow = bodyOverflow;
      window.removeEventListener("keydown", handleKey);
      const remaining = Array.from(activeDialogs).at(-1);
      if (opener instanceof HTMLElement && opener.isConnected && (!remaining || remaining.contains(opener))) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [returnFocusRef]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (present && dialog) {
      (initialFocusRef?.current ?? dialog.querySelector<HTMLElement>(focusable) ?? dialog).focus({ preventScroll: true });
    }
  }, [present, initialFocusRef]);

  return (
    <m.div
      className={backdropClassName}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : present ? 0.24 : 0.2 }}
      aria-hidden={present ? undefined : true}
      onMouseDown={(event) => {
        if (present && event.target === event.currentTarget) onClose();
      }}
    >
      <m.section
        ref={dialogRef}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        inert={!present}
        tabIndex={-1}
        initial={reducedMotion ? false : enter}
        animate={{ y: 0, scale: 1 }}
        exit={reducedMotion ? { y: 0, scale: 1 } : leave}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", duration: present ? 0.48 : 0.32, bounce: present ? 0.06 : 0 }}
      >
        {children}
      </m.section>
    </m.div>
  );
}

export default function AnimatedDialog({ open, ...props }: DialogProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {open && (
        <LazyMotion key="dialog" features={domAnimation} strict>
          <DialogSurface {...props} />
        </LazyMotion>
      )}
    </AnimatePresence>,
    document.body,
  );
}
