"use client";

import { Icon } from "@/components/common/Icon";

import { ProductSearch } from "./ProductSearch";

/**
 * The hero's search-first field (2026-08-24 homepage redesign).
 *
 * It is a BUTTON dressed as a search field, and it is the home page's one
 * `ProductSearch` instance: the dialog lives here (the header hides its own
 * icon on `/` via `HeaderSearch`), so the field, this dialog and the
 * ⌘K / Ctrl+K shortcut all share one set of hard-won mobile fixes (constant
 * 84dvh height against Android IME dismissal, `onCloseRef` against
 * keystroke focus loss).
 */
export function HomeSearch() {
  return (
    <ProductSearch
      trigger={(open) => (
        <button
          type="button"
          className="home-search"
          aria-haspopup="dialog"
          aria-label="Search products"
          data-haptic="selection"
          onClick={open}
        >
          <Icon name="search" />
          <span className="home-search__placeholder">
            App သို့မဟုတ် service အမည်နဲ့ ရှာပါ
          </span>
          <kbd className="home-search__kbd" aria-hidden="true">
            ⌘K
          </kbd>
        </button>
      )}
    />
  );
}
