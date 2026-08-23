"use client";

import { useSyncExternalStore } from "react";

import { detectDeviceToken } from "@/lib/device";
import type { BioscopeDeviceToken } from "@/types/content";

/**
 * The visitor's device family, read the way a static export has to read
 * anything about the browser: the server snapshot is `null`, so the prerendered
 * markup carries no device assumption, and React swaps in the real answer right
 * after hydration. Same idiom as `useHapticMode` — `useState` + `useEffect`
 * here is a cascading render, and `react-hooks/set-state-in-effect` rejects it.
 *
 * The answer cannot change during a session, so `subscribe` is inert and the
 * snapshot is computed once and cached; `getSnapshot` runs on every render and
 * should not re-read the user agent that often.
 */
const subscribe = () => () => {};
const readServer = () => null;

let cache: BioscopeDeviceToken | null | undefined;
const readClient = () =>
  cache === undefined ? (cache = detectDeviceToken()) : cache;

export function useDetectedDevice(): BioscopeDeviceToken | null {
  return useSyncExternalStore(subscribe, readClient, readServer);
}
