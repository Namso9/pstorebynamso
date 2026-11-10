"use client";

import { useCallback, useEffect, useRef } from "react";

type CarouselOptions = {
  align?: "start" | "center";
  onIndexChange?: (index: number) => void;
};

export function useInfiniteCarousel(
  itemCount: number,
  intervalMs: number,
  autoEnabled = true,
  options: CarouselOptions = {},
) {
  const rowRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const cycleRef = useRef(0);
  const baseRef = useRef(0);
  const lastManualRef = useRef(0);
  const pointerDownRef = useRef(false);
  const pausedRef = useRef(false);
  const onIndexChangeRef = useRef(options.onIndexChange);
  const align = options.align ?? "start";

  useEffect(() => {
    onIndexChangeRef.current = options.onIndexChange;
  }, [options.onIndexChange]);

  const scrollToRendered = useCallback((renderedIndex: number) => {
    const row = rowRef.current;
    if (!row || !stepRef.current) return;
    lastManualRef.current = Date.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({
      left: baseRef.current + (renderedIndex - itemCount) * stepRef.current,
      behavior: reducedMotion ? "instant" : "smooth",
    });
  }, [itemCount]);

  const goTo = useCallback((index: number) => {
    scrollToRendered(itemCount + index);
  }, [itemCount, scrollToRendered]);

  const move = useCallback((direction: -1 | 1, manual = true) => {
    const row = rowRef.current;
    if (!row || !stepRef.current) return;
    if (manual) lastManualRef.current = Date.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * stepRef.current, behavior: reducedMotion ? "instant" : "smooth" });
  }, []);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || itemCount < 2) return;

    let initialized = false;
    let settleTimer = 0;
    let restoreFrame = 0;

    const jump = (left: number) => {
      window.cancelAnimationFrame(restoreFrame);
      row.style.scrollSnapType = "none";
      row.style.scrollBehavior = "auto";
      row.scrollLeft = left;
      restoreFrame = window.requestAnimationFrame(() => {
        row.style.scrollSnapType = "";
        row.style.scrollBehavior = "";
      });
    };

    const measure = () => {
      const cards = row.children;
      if (cards.length < itemCount * 3) return;
      const first = cards[0] as HTMLElement;
      const second = cards[1] as HTMLElement;
      const middle = cards[itemCount] as HTMLElement;
      const nextStep = second.offsetLeft - first.offsetLeft;
      const nextCycle = middle.offsetLeft - first.offsetLeft;
      if (!nextStep || !nextCycle) return;

      const oldStep = stepRef.current;
      const oldBase = baseRef.current;
      const position = initialized && oldStep ? (row.scrollLeft - oldBase) / oldStep : 0;
      const centerOffset = align === "center" ? (row.clientWidth - first.offsetWidth) / 2 : 0;
      const nextBase = nextCycle - centerOffset;
      stepRef.current = nextStep;
      cycleRef.current = nextCycle;
      baseRef.current = nextBase;
      jump(nextBase + position * nextStep);
      initialized = true;
    };

    const normalize = () => {
      if (pointerDownRef.current || !cycleRef.current) return;
      const cycle = cycleRef.current;
      const base = baseRef.current;
      let left = row.scrollLeft;
      while (left < base) left += cycle;
      while (left >= base + cycle) left -= cycle;
      if (Math.abs(left - row.scrollLeft) > 1) jump(left);
      if (onIndexChangeRef.current && stepRef.current) {
        const rawIndex = Math.round((left - base) / stepRef.current);
        onIndexChangeRef.current(((rawIndex % itemCount) + itemCount) % itemCount);
      }
    };

    const scheduleNormalize = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(normalize, 180);
    };
    const onPointerDown = () => {
      pointerDownRef.current = true;
      lastManualRef.current = Date.now();
    };
    const onPointerUp = () => {
      if (!pointerDownRef.current) return;
      pointerDownRef.current = false;
      lastManualRef.current = Date.now();
      scheduleNormalize();
    };
    const onMouseEnter = () => { pausedRef.current = true; };
    const onMouseLeave = () => { pausedRef.current = false; };
    const onFocusIn = () => { pausedRef.current = true; };
    const onFocusOut = (event: FocusEvent) => {
      if (!row.contains(event.relatedTarget as Node | null)) pausedRef.current = false;
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(row);
    row.addEventListener("scroll", scheduleNormalize, { passive: true });
    row.addEventListener("scrollend", normalize);
    row.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    row.addEventListener("mouseenter", onMouseEnter);
    row.addEventListener("mouseleave", onMouseLeave);
    row.addEventListener("focusin", onFocusIn);
    row.addEventListener("focusout", onFocusOut);

    return () => {
      resizeObserver.disconnect();
      window.clearTimeout(settleTimer);
      window.cancelAnimationFrame(restoreFrame);
      row.removeEventListener("scroll", scheduleNormalize);
      row.removeEventListener("scrollend", normalize);
      row.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      row.removeEventListener("mouseenter", onMouseEnter);
      row.removeEventListener("mouseleave", onMouseLeave);
      row.removeEventListener("focusin", onFocusIn);
      row.removeEventListener("focusout", onFocusOut);
    };
  }, [align, itemCount]);

  useEffect(() => {
    const row = rowRef.current;
    if (!autoEnabled || itemCount < 2 || !row || typeof IntersectionObserver === "undefined") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let timer: number | undefined;
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const sync = () => {
      stop();
      if (!visible || document.hidden || reducedMotion.matches) return;
      timer = window.setInterval(() => {
        if (!visible || document.hidden || reducedMotion.matches || pointerDownRef.current || pausedRef.current) return;
        if (Date.now() - lastManualRef.current < intervalMs) return;
        move(1, false);
      }, intervalMs);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.01;
      sync();
    }, { threshold: 0.01 });
    observer.observe(row);
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, [autoEnabled, intervalMs, itemCount, move]);

  return { rowRef, move, goTo, scrollToRendered };
}
