"use client";

import { useEffect, useRef } from "react";

import { useProgrammaticPulse } from "@/hooks/useHapticMode";
import {
  type HapticIntensity,
  hapticsDisabled,
  isHapticIntensity,
  supportsVibration,
  vibrate,
} from "@/lib/haptics";

/** How far a finger may drift before the press is read as a scroll instead. */
const PRESS_SLOP_PX = 10;
/** How long a still finger must rest before the press counts as deliberate. */
const PRESS_CONFIRM_MS = 60;

/**
 * The single global piece of the haptics engine. Mounted once from
 * `PageLayout`.
 *
 * Android path: one delegated `pointerdown` listener drives every element
 * carrying `data-haptic="<intensity>"`, including the ones that mount later
 * inside dialogs. `pointerdown` is an activation-triggering event, so the very
 * first tap of a session already has the user activation `navigator.vibrate()`
 * requires.
 *
 * The buzz is held for a few frames rather than fired on touch-down, because
 * some haptic targets are large — a category card, an FAQ row — and a flick
 * that starts on one is a scroll, not a press. It fires early if the finger
 * lifts first (so a real tap still feels immediate) and is dropped on
 * `pointercancel`, which is what the browser sends when it takes the gesture
 * over for scrolling.
 *
 * iOS path: `HapticSwitch` handles the controls it can overlay. This component
 * adds the older programmatic trick (toggle a hidden switch through its label)
 * for everything else — links, nav items, category cards — and for iOS
 * 17.4–17.x, where no overlay is mounted at all. Apple patched that trick in
 * iOS 26.5, where it degrades to silence. It is skipped for any host that
 * already carries its own overlay, so those never buzz twice.
 */
export function HapticRoot() {
  const iosFallback = useProgrammaticPulse();
  const labelRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    const canVibrate = supportsVibration();
    if (!canVibrate && !iosFallback) return;

    let pendingPointerId: number | null = null;
    let pendingIntensity: HapticIntensity | null = null;
    let pendingTimer = 0;
    let startX = 0;
    let startY = 0;

    const clearPending = () => {
      if (pendingTimer) window.clearTimeout(pendingTimer);
      pendingTimer = 0;
      pendingPointerId = null;
      pendingIntensity = null;
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("pointerup", handlePointerUp, true);
      document.removeEventListener("pointercancel", handleCancel, true);
    };

    const play = () => {
      const intensity = pendingIntensity;
      clearPending();
      if (!intensity) return;
      if (canVibrate) {
        vibrate(intensity);
        return;
      }
      if (hapticsDisabled()) return;
      labelRef.current?.click();
    };

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== pendingPointerId) return;
      // Straight-line distance, not per-axis: a diagonal drag of 8px on each
      // axis travels 11px and is a scroll, not a press.
      if (
        Math.hypot(event.clientX - startX, event.clientY - startY) >
        PRESS_SLOP_PX
      ) {
        clearPending();
      }
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== pendingPointerId) return;
      play();
    }

    function handleCancel(event: PointerEvent) {
      if (event.pointerId !== pendingPointerId) return;
      clearPending();
    }

    const handlePointerDown = (event: PointerEvent) => {
      // Only real finger/stylus input. A mouse has nothing to buzz, and
      // synthetic events must never drive hardware.
      if (!event.isTrusted) return;
      if (event.pointerType === "mouse") return;

      // A second finger cancels whatever was armed and arms nothing itself:
      // a pinch or a two-finger scroll is not a press, wherever it lands.
      const wasArmed = pendingPointerId !== null;
      clearPending();
      if (wasArmed) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const host = target.closest<HTMLElement>("[data-haptic]");
      if (!host) return;
      if (host.getAttribute("aria-disabled") === "true") return;
      if (host instanceof HTMLButtonElement && host.disabled) return;

      const intensity = host.getAttribute("data-haptic");
      if (!isHapticIntensity(intensity)) return;

      // iOS: an overlaid switch is about to fire on its own.
      if (!canVibrate && host.querySelector(":scope > .haptic-tap")) return;

      pendingPointerId = event.pointerId;
      pendingIntensity = intensity;
      startX = event.clientX;
      startY = event.clientY;
      document.addEventListener("pointermove", handlePointerMove, true);
      document.addEventListener("pointerup", handlePointerUp, true);
      document.addEventListener("pointercancel", handleCancel, true);
      pendingTimer = window.setTimeout(play, PRESS_CONFIRM_MS);
    };

    document.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
      passive: true,
    });
    return () => {
      clearPending();
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [iosFallback]);

  // The switch has to stay in the render tree (WebKit only plays the haptic
  // for a control it actually paints), so it is made invisible with opacity
  // and pushed behind the page rather than with `display: none`.
  if (!iosFallback) return null;

  return (
    <label className="haptic-pulse" aria-hidden="true" ref={labelRef}>
      <HiddenSwitch />
    </label>
  );
}

function HiddenSwitch() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.setAttribute("switch", "");
  }, []);
  return <input ref={ref} type="checkbox" tabIndex={-1} />;
}
