"use client";

import { useSyncExternalStore } from "react";

import {
  hapticsDisabled,
  isIosWebKit,
  supportsVibration,
  usesSwitchHaptics,
} from "@/lib/haptics";

/**
 * Which haptic mechanism this device gets, read the way a static export has to
 * read anything about the browser: the server snapshot is always `false`, so
 * the prerendered markup carries no platform assumption, and React swaps in
 * the real answer right after hydration. That is what `useSyncExternalStore`
 * is for — the same thing done with `useState` + `useEffect` is a cascading
 * render (and `react-hooks/set-state-in-effect` rejects it).
 *
 * The answer cannot change during a session, so `subscribe` is inert and each
 * snapshot is computed once and cached. `getSnapshot` runs on every render, and
 * it reads the user agent, `CSS.supports` and `localStorage` — none of which
 * should be touched that often.
 */
const subscribe = () => () => {};
const readServer = () => false;

let switchCache: boolean | null = null;
const readSwitch = () => (switchCache ??= usesSwitchHaptics());

let pulseCache: boolean | null = null;
const readPulse = () =>
  (pulseCache ??= !supportsVibration() && isIosWebKit() && !hapticsDisabled());

/** True where the haptic comes from an overlaid WebKit switch (iOS 18+). */
export function useSwitchHaptics(): boolean {
  return useSyncExternalStore(subscribe, readSwitch, readServer);
}

/**
 * True on any iOS/iPadOS browser, where the shared hidden switch is worth
 * mounting for the controls that cannot carry an overlay.
 */
export function useProgrammaticPulse(): boolean {
  return useSyncExternalStore(subscribe, readPulse, readServer);
}
