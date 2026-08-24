"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { Icon } from "@/components/common/Icon";
import { Modal } from "@/components/common/Modal";
import { ErrorState, LoadingState } from "@/components/common/StatusState";
import { useCatalog } from "@/hooks/useCatalog";
import { trackProductClick } from "@/services/track";

export function ProductSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { catalog, status, error, refresh } = useCatalog(undefined, open);

  const results = useMemo(() => {
    const query = term.trim().toLowerCase();
    if (!catalog || !query) return [];
    const categoryNames = new Map(
      catalog.categories.map((category) => [category.slug, category.title]),
    );
    return catalog.products
      .filter((product) =>
        [product.name, product.subtitle, categoryNames.get(product.category) || ""]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 12);
  }, [catalog, term]);

  const close = () => {
    setOpen(false);
    setTerm("");
  };

  return (
    <>
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
