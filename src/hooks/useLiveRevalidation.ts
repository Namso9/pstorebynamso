"use client";

import { useEffect, useRef } from "react";

export const LIVE_REVALIDATION_INTERVAL_MS = 5_000;
const REVALIDATION_COALESCE_MS = 500;

/**
 * Keep panel-written public data fresh in tabs that were already open.
 *
 * Returning from the admin tab revalidates immediately. A visible tab also
 * polls on the same five-second cadence as the Pages live-JSON cache, while a
 * background tab makes no interval requests.
 */
export function useLiveRevalidation(revalidate: () => void, enabled = true) {
  const revalidateRef = useRef(revalidate);

  useEffect(() => {
    revalidateRef.current = revalidate;
  }, [revalidate]);

  useEffect(() => {
    if (!enabled) return;
    let lastRevalidationAt = Date.now();

    const revalidateIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRevalidationAt < REVALIDATION_COALESCE_MS) return;
      lastRevalidationAt = now;
      revalidateRef.current();
    };

    const interval = window.setInterval(
      revalidateIfVisible,
      LIVE_REVALIDATION_INTERVAL_MS,
    );
    window.addEventListener("focus", revalidateIfVisible);
    document.addEventListener("visibilitychange", revalidateIfVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", revalidateIfVisible);
      document.removeEventListener("visibilitychange", revalidateIfVisible);
    };
  }, [enabled]);
}
