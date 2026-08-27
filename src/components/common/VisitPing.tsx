"use client";

import { useEffect } from "react";

import { trackSiteVisit } from "@/services/track";

/**
 * Fires the one anonymous site-visit ping per full page load — see
 * `trackSiteVisit` for exactly what leaves the browser (three fixed strings,
 * no identifier) and why the once-guard is module state rather than storage.
 * Mounted once in the root layout; renders nothing.
 */
export function VisitPing() {
  useEffect(() => {
    trackSiteVisit();
  }, []);
  return null;
}
