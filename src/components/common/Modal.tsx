"use client";

import {
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Icon } from "./Icon";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  banner?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

let bodyLockCount = 0;
let originalBodyOverflow = "";
let lockedScrollY = 0;

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    lockedScrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    // iOS Safari snaps the layout viewport back to the document top when
    // body overflow flips to hidden, so a fixed-position dialog opened
    // while scrolled appears at the very top of the page instead of in
    // view. Pinning the body at the current offset keeps the visual page —
    // and the viewport-anchored dialog — exactly where the user was.
    if (lockedScrollY > 0) {
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    }
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    if (lockedScrollY > 0) {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      // Restore the scroll position instantly; html has
      // `scroll-behavior: smooth`, which would otherwise animate the jump.
      const rootStyle = document.documentElement.style;
      const originalScrollBehavior = rootStyle.scrollBehavior;
      rootStyle.scrollBehavior = "auto";
      window.scrollTo(0, lockedScrollY);
      rootStyle.scrollBehavior = originalScrollBehavior;
      lockedScrollY = 0;
    }
  }
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className = "",
  icon,
  banner,
  initialFocusRef,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    lockBodyScroll();

    const frame = window.requestAnimationFrame(() => {
      const firstFocusable =
        initialFocusRef?.current ??
        dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
      firstFocusable?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      unlockBodyScroll();
      if (bodyLockCount === 0) returnFocusRef.current?.focus();
    };
  }, [initialFocusRef, onClose, open]);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const backdropMotion = prefersReducedMotion
    ? undefined
    : { duration: 0.18, ease: "easeOut" as const };
  const panelMotion = prefersReducedMotion
    ? undefined
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const };

  // Portal to document.body: the search dialog is rendered inside the
  // sticky header, whose backdrop-filter makes it the containing block for
  // fixed-position descendants in Safari — there the "fixed" backdrop was
  // positioned against the header instead of the viewport, so the dialog
  // appeared at the document top once the user had scrolled. Rendering at
  // the body level removes every ancestor containing-block effect (filters,
  // transforms, clips) for all dialogs.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal-backdrop"
          onMouseDown={handleBackdropClick}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={backdropMotion}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={["modal-panel", className].filter(Boolean).join(" ")}
            initial={
              prefersReducedMotion ? false : { opacity: 0, y: 18, scale: 0.98 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? undefined
                : { opacity: 0, y: 10, scale: 0.99 }
            }
            transition={panelMotion}
          >
            {banner}
            <div className="modal-heading">
              <div className="modal-heading__title">
                {icon}
                <h2 id={titleId}>{title}</h2>
              </div>
              <button
                type="button"
                className="icon-button modal-close"
                aria-label="Close dialog"
                onClick={onClose}
              >
                <Icon name="close" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
