"use client";

import { useEffect } from "react";

import { trackSession, trackSiteVisit } from "@/services/track";

/**
 * Fires the two anonymous arrival pings — see `track.ts` for exactly what
 * leaves the browser (enum-ish constants, no identifier) and why the visit
 * once-guard is module state rather than storage.
 *
 * `trackSession` FIRST, deliberately: a session is the scarcer and more
 * valuable number (roughly "how many people"), it is counted at most once per
 * browser session, and if only one of the two beacons survives a page that is
 * already navigating away, the arrival is the one worth keeping. The visit
 * ping fires every page load and gets another chance on the next one.
 *
 * Mounted once in the root layout; renders nothing.
 */
export function VisitPing() {
  useEffect(() => {
    trackSession();
    trackSiteVisit();
  }, []);
  return null;
}
