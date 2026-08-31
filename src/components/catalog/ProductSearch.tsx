"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/common/Icon";
import { Modal } from "@/components/common/Modal";
import { ErrorState, LoadingState } from "@/components/common/StatusState";
import { expandSearchTerms } from "@/data/search-aliases";
import { useCatalog } from "@/hooks/useCatalog";
import { trackProductClick, trackSearch } from "@/services/track";

/**
 * How long the box must sit still before a query counts as SETTLED.
 *
 * ⚠️ Never report per keystroke. "netflix" typed at a normal speed is seven
 * prefixes, six of which are misses — reporting those would drown the
 * zero-result report (the one report that names a product worth stocking) in
 * noise and multiply the panel's row count by the length of the average word.
 * 700 ms is comfortably past the contract's 600 ms floor and past a Burmese
 * keyboard's syllable pause.
 */
const SEARCH_SETTLE_MS = 700;

type ProductSearchProps = {
  /**
   * Custom opener. The header uses the default icon button; the home hero
   * (`HomeSearch`) passes its field-styled button so the same dialog — with
   * its hard-won mobile fixes — serves both doors. One page still renders
   * exactly one `ProductSearch` instance: on `/` it lives in the hero (the
   * header hides its own via `HeaderSearch`), elsewhere it lives in the
   * header.
   */
  trigger?: (open: () => void) => ReactNode;
};

export function ProductSearch({ trigger }: ProductSearchProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { catalog, status, error, refresh } = useCatalog(undefined, open);

  // The ⌘K / Ctrl+K shortcut lands here too, so the mobile fixes below exist
  // exactly once per page regardless of which trigger opened the dialog.
  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  const results = useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!catalog || !query) return [];
    const categoryNames = new Map(
      catalog.categories.map((category) => [category.slug, category.title]),
    );
    // Burmese/typo aliases expand to terms that exist in the haystack, so
    // "နက်ဖလစ်" and "netflex" find Netflix without a fuzzy-search dependency.
    const terms = expandSearchTerms(query);
    return catalog.products
      .filter((product) => {
        const haystack = [
          product.name,
          product.subtitle,
          categoryNames.get(product.category) || "",
        ]
          .join(" ")
          .toLowerCase();
        return terms.some((t) => haystack.includes(t));
      })
      .slice(0, 12);
  }, [catalog, term]);

  // Count the query only once it SETTLES. Every dependency here is load-bearing:
  //   `open`   — a closed dialog reports nothing;
  //   `term`   — a new keystroke restarts the timer via the cleanup below, which
  //              is what makes this a debounce rather than a per-keystroke fire;
  //   `catalog`— without it `results` is [] and every query would look like a
  //              miss, poisoning the zero-result report with loading states;
  //   `results.length` — a term whose result count changes when the live
  //              catalog lands must be re-judged, not reported from the stale
  //              count. `trackSearch`'s own 1.5 s dedupe is keyed on the
  //              normalised query alone, so that re-judgement still counts once.
  const resultCount = results.length;
  useEffect(() => {
    if (!open || !catalog || !term.trim()) return;
    const timer = window.setTimeout(() => {
      trackSearch(term, resultCount > 0);
    }, SEARCH_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [open, catalog, term, resultCount]);

  const close = () => {
    setOpen(false);
    setTerm("");
  };

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          className="icon-button"
          aria-label="Search products"
          title="Search products"
          data-haptic="selection"
          onClick={() => setOpen(true)}
        >
          <Icon name="search" />
        </button>
      )}

      <Modal
        open={open}
        onClose={close}
        title="Search Products"
        className="search-panel"
        initialFocusRef={inputRef}
      >
        <label className="search-field">
          <span className="sr-only">Search products</span>
          <Icon name="search" />
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search products… (Netflix, ChatGPT, VPN)"
            autoComplete="off"
          />
        </label>

        <div className="search-results" aria-live="polite">
          {status === "loading" || status === "idle" ? (
            <LoadingState label="Products တင်နေပါတယ်…" />
          ) : status === "error" ? (
            <ErrorState
              title="Search မရသေးပါ"
              message={error || "Catalog loading failed."}
              onRetry={refresh}
            />
          ) : !term.trim() ? (
            <p className="search-message">Product အမည်ကို စရိုက်ပါ။</p>
          ) : results.length ? (
            results.map((product) => (
              <Link
                href={`/${product.category}/#app-${product.id}`}
                className="search-result"
                prefetch={false}
                onClick={() => {
                  trackProductClick(product.id, "plans", "search");
                  close();
                }}
                key={product.id}
              >
                <span>
                  <strong>{product.name}</strong>
                  <small>{product.subtitle}</small>
                </span>
                <Icon name="arrow-right" />
              </Link>
            ))
          ) : (
            <p className="search-message">“{term}” နဲ့ကိုက်ညီတဲ့ product မရှိပါ။</p>
          )}
        </div>
      </Modal>
    </>
  );
}
