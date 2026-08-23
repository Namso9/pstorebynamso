import type { BioscopeDeviceToken } from "@/types/content";

/**
 * Which device family the visitor is on, for pre-selecting a download.
 *
 * The order matters because the answers overlap: an Android TV box also says
 * "android", and iPadOS 13+ reports a desktop Safari user agent that says
 * "Macintosh". A miss returns `null` — the caller falls back to its own
 * default rather than guessing.
 */
const matchers: [BioscopeDeviceToken, RegExp][] = [
  ["androidtv", /android tv|googletv|google tv|smart-?tv|aft[bmst]|fire\s?tv/i],
  ["android", /android/i],
  ["ios", /iphone|ipad|ipod/i],
  ["windows", /windows/i],
  ["mac", /macintosh|mac os x/i],
];

export function detectDeviceToken(): BioscopeDeviceToken | null {
  if (typeof navigator === "undefined") return null;
  const userAgent = navigator.userAgent;
  for (const [token, pattern] of matchers) {
    if (!pattern.test(userAgent)) continue;
    // An iPad on iPadOS 13+ is indistinguishable from a Mac by user agent
    // alone; a Mac reports no touch points.
    if (token === "mac" && navigator.maxTouchPoints > 1) return "ios";
    return token;
  }
  return null;
}
