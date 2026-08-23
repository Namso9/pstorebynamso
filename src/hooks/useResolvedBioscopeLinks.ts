"use client";

import { useEffect, useState } from "react";

import { fetchBioscopeLinks } from "@/services/bioscope-links";
import type { BioscopeResolvedLinks } from "@/types/content";

/**
 * Asks the Pages Function what Bioscope is publishing right now, once per page
 * view. Deliberately NOT on the five-second live-content cadence: the answer
 * only changes when the vendor cuts a release, and the function is edge-cached
 * for minutes.
 *
 * Failure is silent on purpose — the caller keeps the pinned links, which is
 * the correct outcome when the vendor's page is down or has been redesigned.
 */
export function useResolvedBioscopeLinks(): BioscopeResolvedLinks | null {
  const [resolved, setResolved] = useState<BioscopeResolvedLinks | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchBioscopeLinks(controller.signal)
      .then((links) => {
        if (Object.keys(links).length > 0) setResolved(links);
      })
      .catch(() => {
        // Pinned data stays on screen.
      });
    return () => controller.abort();
  }, []);

  return resolved;
}
