/**
 * Cross-browser haptic feedback.
 *
 * Two completely separate mechanisms, because no single API covers both
 * platforms:
 *
 * 1. Android (Chrome, Firefox, Samsung Internet, DuckDuckGo, Edge — every
 *    engine there ships it): `navigator.vibrate()`. Real per-place intensity,
 *    because we control the millisecond duration and the pattern. Armed from a
 *    delegated `pointerdown` listener (see `HapticRoot`) so the buzz lands on
 *    the press, the way a physical button does, rather than on release.
 *
 * 2. iOS / iPadOS — Safari, Chrome, Firefox, DuckDuckGo are ALL WebKit and
 *    none of them implement the Vibration API. The only Taptic Engine a web
 *    page can reach is the one Safari 17.4+ plays when an
 *    `<input type="checkbox" switch>` toggles. Apple patched the old
 *    "programmatically `.click()` a hidden switch" trick in iOS 26.5, but a
 *    REAL user tap on a real switch still fires it — so `HapticSwitch` lays an
 *    invisible switch over the control and lets the finger land on it.
 *    `HapticRoot` still keeps the programmatic path as a best-effort fallback
 *    for iOS 17.4–26.4 and for controls that cannot carry an overlay (links).
 *
 * Consequence to keep in mind: intensity is tunable on Android only. iOS gets
 * one fixed system tick per tap — that is all WebKit exposes.
 */

export type HapticIntensity =
  | "selection"
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

/**
 * Durations in ms. Kept short on purpose: anything past ~35ms reads as a
 * notification buzz rather than a button press.
 */
const PATTERNS: Record<HapticIntensity, number | number[]> = {
  selection: 7,
  light: 12,
  medium: 20,
  heavy: 32,
  success: [14, 44, 26],
  warning: [20, 60, 20],
  error: [26, 46, 26, 46, 26],
};

const INTENSITIES = Object.keys(PATTERNS) as HapticIntensity[];

/** Opt-out escape hatch: `localStorage.setItem("ps-haptics", "off")`. */
const STORAGE_KEY = "ps-haptics";

export function isHapticIntensity(
  value: string | null | undefined,
): value is HapticIntensity {
  return typeof value === "string" && INTENSITIES.includes(value as HapticIntensity);
}

export function hapticsDisabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "off";
  } catch {
    // Private mode / embedded browsers can throw on storage access.
    return false;
  }
}

export function supportsVibration(): boolean {
  return (
    typeof navigator !== "undefined" && typeof navigator.vibrate === "function"
  );
}

/**
 * iOS / iPadOS detection. Deliberately NOT a Safari check: Chrome, Firefox and
 * DuckDuckGo on iOS are WebKit too and behave identically here. iPadOS reports
 * a desktop macOS user agent, so `maxTouchPoints` is what separates it from a
 * real Mac (a Mac reports 0).
 */
export function isIosWebKit(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }
  const ua = navigator.userAgent;
  if (!/AppleWebKit/.test(ua)) return false;
  if (/Android/.test(ua)) return false;
  return navigator.maxTouchPoints > 0;
}

/**
 * Major iOS/iPadOS version, or null when it cannot be read. Covers both user
 * agent shapes: the iPhone/iPad one ("… CPU iPhone OS 18_1 like Mac OS X …",
 * which Chrome, Firefox and DuckDuckGo on iOS all keep) and the desktop-mode
 * iPadOS one, where only "Version/18.0" gives the release away.
 */
export function iosMajorVersion(): number | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  const os = /\bOS (\d+)(?:[._]\d+)*\s+like Mac OS X/.exec(ua);
  if (os) return Number(os[1]);
  const version = /\bVersion\/(\d+)/.exec(ua);
  return version ? Number(version[1]) : null;
}

/**
 * True when this device gets its haptics from the WebKit switch overlay.
 *
 * Gated at iOS 18, the release that gave the switch control its haptic — the
 * `switch` attribute itself landed in Safari 17.4 but stayed silent. iOS
 * 17.4–17.x is not left out: `HapticRoot`'s programmatic path still works
 * there, and it only stands down for controls that carry an overlay. An
 * unreadable version therefore has to fail CLOSED — mounting a silent overlay
 * would also switch off the fallback that would have worked.
 *
 * The `:has()` check is what keeps the overlay safe rather than merely useful.
 * `.haptic-tap` is `position: absolute; inset: 0`, and the rule that makes its
 * host the containing block is `:where(button):has(> .haptic-tap)`. Without
 * `:has()` the overlay would resolve against some far ancestor instead and
 * become a large invisible control that eats taps. Every iOS 18 browser
 * supports `:has()`, so this can only ever fail closed.
 */
export function usesSwitchHaptics(): boolean {
  if (supportsVibration() || !isIosWebKit() || hapticsDisabled()) return false;
  const major = iosMajorVersion();
  if (major === null || major < 18) return false;
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("selector(:has(> *))")
  );
}

/**
 * Play a haptic through the Vibration API. Returns false when the platform has
 * no vibration motor exposed to the web (every iOS browser) — callers must
 * treat a haptic as a best-effort nicety, never as confirmation of anything.
 */
export function vibrate(intensity: HapticIntensity): boolean {
  if (!supportsVibration() || hapticsDisabled()) return false;
  try {
    return navigator.vibrate(PATTERNS[intensity]);
  } catch {
    return false;
  }
}
