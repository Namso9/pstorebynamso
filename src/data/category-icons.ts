import type { IconName } from "@/components/common/Icon";

/**
 * `categories[].icon` in panel-owned `products.json` holds Font Awesome class
 * names (`fa-palette`, `fa-brain`, …) left over from the legacy site. There is
 * no Font Awesome in the Next app — `Icon.tsx` is a hand-rolled inline-SVG set,
 * which is what keeps the CSP hash-only and `npm run csp:check` green.
 *
 * So the panel string is never passed to `<Icon>` directly: `Icon.tsx` indexes
 * `paths[name]` with no guard and would throw on an unknown name. Everything
 * goes through this map, which always returns a real `IconName`.
 *
 * `products.json` is panel-written, so the keys here are a fixed input — add a
 * key when the panel starts publishing a new `fa-*` value, never rename one.
 */
const CATEGORY_ICON_NAMES: Record<string, IconName> = {
  "fa-brain": "brain",
  "fa-briefcase": "briefcase",
  "fa-clapperboard": "clapperboard",
  "fa-comments": "comments",
  "fa-graduation-cap": "graduation-cap",
  "fa-laptop": "laptop",
  "fa-music": "music",
  "fa-palette": "palette",
  "fa-shield-halved": "shield",
  "fa-signal": "signal",
};

/** Neutral mark for a category whose icon is missing or not yet mapped. */
const FALLBACK_ICON: IconName = "bolt";

export function categoryIconName(icon?: string): IconName {
  return (icon && CATEGORY_ICON_NAMES[icon]) || FALLBACK_ICON;
}
