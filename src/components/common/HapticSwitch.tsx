"use client";

import { type MouseEvent, useEffect, useRef } from "react";

import { useSwitchHaptics } from "@/hooks/useHapticMode";

type HapticSwitchMode = "bubble" | "submit";

/**
 * WHERE THIS MAY BE MOUNTED — the rule that replaced the drag guard.
 *
 * WebKit's `switch` control can be toggled by DRAGGING it, so an overlay
 * stretched over a big control could turn a scroll into an activation. The
 * first answer was a slop guard in `onClick`: a click whose pointer had
 * travelled more than 10px was swallowed. It cost more than it bought — 10px
 * is about a millimetre and a half, so an ordinary thumb tap on a large target
 * exceeded it and the button "needed two presses".
 *
 * The guard is gone. Instead this overlay is mounted ONLY on small, deliberate
 * controls that commit something: the order form's submit button, a plan row,
 * the copy-account button. Never on a row or tile a finger scrolls over (FAQ
 * questions, product/category/review/popular cards, search results, nav
 * items) — those keep the Android `data-haptic` path, which cannot touch click
 * semantics because it only reads events, and iOS simply gets no buzz there.
 */

type HapticSwitchProps = {
  /**
   * `bubble` (default) — the host is a `<button type="button">` whose behaviour
   * is a React `onClick`. The tap lands on this switch, the click bubbles up
   * and the host handler runs exactly as before.
   *
   * `submit` — the host is a `<button type="submit">`. A click on the switch
   * makes IT the activation target, so the browser would never submit the
   * form; this mode re-runs the submission explicitly (validation included).
   */
  mode?: HapticSwitchMode;
};

/**
 * An invisible `<input type="checkbox" switch>` stretched over its parent
 * control. Rendered ONLY on iOS/iPadOS WebKit, where it is the sole way to
 * reach the Taptic Engine from a web page (see `@/lib/haptics`). On Android
 * and desktop this renders nothing at all, so click semantics there are
 * completely untouched.
 *
 * The parent must be a `<button>`: an overlay over an `<a>` would swallow the
 * navigation, so links are deliberately left on the Android/older-iOS path.
 *
 * ACCEPTED TRADE-OFF, deliberate and documented: `<input>` is interactive
 * content, so nesting it in a `<button>` is an HTML conformance error, and it
 * is the only shape in which WebKit will play the haptic (the published
 * `ios-haptics` library does the same thing). It is not a parsing error — the
 * static export's markup round-trips unchanged — and the cost is contained:
 * `tabIndex={-1}` keeps it out of the tab order, `aria-hidden` keeps it out of
 * the accessibility tree, so the host button stays a single control for
 * keyboard and screen-reader users, who never reach this element. Keyboard
 * activation, VoiceOver activation and the CSS `:active` / `:hover` states all
 * still resolve on the button, which is an ancestor of the activated element.
 * The alternative — wrapping every button in a positioned element — would
 * rewrite the layout of a dozen flex and grid parents for a conformance win.
 */
export function HapticSwitch({ mode = "bubble" }: HapticSwitchProps) {
  // `false` while the static export is prerendered and hydrated, then the
  // real answer — so the SSR markup carries no platform assumption.
  const enabled = useSwitchHaptics();
  const inputRef = useRef<HTMLInputElement>(null);

  // `switch` is a WebKit content attribute with no React DOM prop, so it is
  // set imperatively rather than through JSX.
  useEffect(() => {
    if (enabled) inputRef.current?.setAttribute("switch", "");
  }, [enabled]);

  if (!enabled) return null;

  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    // Bubble mode needs nothing more: the click reaches the host's own
    // handler. Never call preventDefault on the tap path — cancelling the
    // toggle cancels the haptic that is the whole point of this element.
    if (mode !== "submit") return;

    const host = event.currentTarget.closest("button");
    // A disabled host does not disable its descendants, so the in-flight
    // guard has to be re-checked here or a second tap could double-submit.
    if (!host || host.disabled) return;
    const form = host.form;
    if (!form) return;

    try {
      if (typeof form.requestSubmit === "function") form.requestSubmit(host);
      else host.click();
    } catch {
      // Last resort: activate the real submit button.
      host.click();
    }
  };

  return (
    <input
      ref={inputRef}
      className="haptic-tap"
      type="checkbox"
      tabIndex={-1}
      aria-hidden="true"
      onClick={handleClick}
    />
  );
}
