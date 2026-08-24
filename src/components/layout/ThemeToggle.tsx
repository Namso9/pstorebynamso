"use client";

import { useEffect, useState } from "react";


type ResolvedTheme = "light" | "dark";

const storageKey = "ps-theme";
const transitionMs = 520;

function readStoredTheme(): ResolvedTheme | null {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    // Storage may be disabled in private or embedded browsers.
    return null;
  }
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(theme: ResolvedTheme, explicit: boolean) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themeMode = explicit ? theme : "system";
  document.documentElement.style.colorScheme = theme;
}

/**
 * Animated light/dark switch. The track is a tiny scene — day sky with
 * drifting clouds, night sky with rising stars — and the thumb morphs
 * between a glowing sun and a cratered moon while sliding across it. All of
 * the artwork is CSS keyed off `aria-checked`, so the choreography also
 * collapses cleanly under the global reduced-motion rule.
 *
 * Behaviour: with no stored choice the switch follows the OS theme; the
 * first tap stores an explicit `ps-theme` light/dark choice (the same key
 * the head bootstrap script reads, so reloads stay flash-free). Each toggle
 * also adds `theme-transition` to `<html>` for one beat so every
 * token-driven surface cross-fades instead of snapping.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ResolvedTheme | null>(null);
  const [explicit, setExplicit] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    const frame = window.requestAnimationFrame(() => {
      setExplicit(stored !== null);
      setTheme(stored ?? systemTheme());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (explicit) return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      const next = systemTheme();
      applyTheme(next, false);
      setTheme(next);
    };
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, [explicit]);

  const toggleTheme = () => {
    const next = (theme ?? systemTheme()) === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // The active page still changes even when storage is unavailable.
    }
    const root = document.documentElement;
    root.classList.add("theme-transition");
    applyTheme(next, true);
    window.setTimeout(() => root.classList.remove("theme-transition"), transitionMs);
    setExplicit(true);
    setTheme(next);
  };

  const isDark = theme === "dark";
  const label = isDark
    ? "Dark mode. Switch to light mode."
    : "Light mode. Switch to dark mode.";

  return (
    <button
      type="button"
      className="theme-switch header-theme-button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      data-haptic="selection"
      onClick={toggleTheme}
    >
      <span className="theme-switch__track" aria-hidden="true">
        <span className="theme-switch__stars" />
        <span className="theme-switch__clouds" />
        <span className="theme-switch__thumb" />
      </span>
    </button>
  );
}
