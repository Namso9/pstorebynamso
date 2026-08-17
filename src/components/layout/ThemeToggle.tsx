"use client";

import { useEffect, useState } from "react";

import { HapticSwitch } from "@/components/common/HapticSwitch";
import { Icon, type IconName } from "@/components/common/Icon";

type ThemeMode = "system" | "light" | "dark";

const storageKey = "ps-theme";

const modeDetails: Record<
  ThemeMode,
  { label: string; icon: IconName; next: ThemeMode }
> = {
  system: { label: "Theme: System", icon: "theme", next: "light" },
  light: { label: "Theme: Light", icon: "sun", next: "dark" },
  dark: { label: "Theme: Dark", icon: "moon", next: "system" },
};

function isThemeMode(value: string | null): value is Exclude<ThemeMode, "system"> {
  return value === "light" || value === "dark";
}

function applyTheme(mode: ThemeMode) {
  const resolved =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : mode;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.style.colorScheme = resolved;
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      // Storage may be disabled in private or embedded browsers.
    }
    const frame = window.requestAnimationFrame(() => {
      setMode(isThemeMode(stored) ? stored : "system");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (mode === null) return;
    applyTheme(mode);
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      if (mode === "system") applyTheme("system");
    };
    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
  }, [mode]);

  const cycleTheme = () => {
    const current = mode ?? "system";
    const next = modeDetails[current].next;
    try {
      if (next === "system") window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, next);
    } catch {
      // The active page still changes even when storage is unavailable.
    }
    applyTheme(next);
    setMode(next);
  };

  const details = modeDetails[mode ?? "system"];
  return (
    <button
      type="button"
      className="icon-button header-theme-button"
      aria-label={`${details.label}. Activate ${modeDetails[details.next].label}.`}
      title={details.label}
      data-haptic="selection"
      onClick={cycleTheme}
    >
      <Icon name={details.icon} />
      <HapticSwitch />
    </button>
  );
}
