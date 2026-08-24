"use client";

import { Icon } from "@/components/common/Icon";

/**
 * The hero's search-first field (2026-08-24 homepage redesign).
 *
 * It is a BUTTON dressed as a search field, not a second search: the real
 * search lives in the header's `ProductSearch` modal, which carries
 * hard-won mobile fixes (constant 84dvh height against Android IME
 * dismissal, `onCloseRef` against keystroke focus loss). Duplicating that
 * dialog here would ship the bugs it already fixed, so this field simply
 * asks that one to open — the same event ⌘K / Ctrl+K fires.
 */
export function HomeSearch() {
  const openSearch = () => {
    window.dispatchEvent(new Event("ps-open-search"));
  };

  return (
    <button
      type="button"
      className="home-search"
      aria-haspopup="dialog"
      aria-label="Search products"
      data-haptic="selection"
      onClick={openSearch}
    >
      <Icon name="search" />
      <span className="home-search__placeholder">
        App သို့မဟုတ် service အမည်နဲ့ ရှာပါ — Netflix, ChatGPT, VPN
      </span>
      <kbd className="home-search__kbd" aria-hidden="true">
        ⌘K
      </kbd>
    </button>
  );
}
