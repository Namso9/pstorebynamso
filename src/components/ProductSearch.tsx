"use client";

import Link from "@/components/TransitionLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { STR, useLang } from "@/lib/i18n";
import { useCategoryPages } from "@/components/CatalogProvider";
import { trackSearch } from "@/services/track";
import { searchProducts } from "@/lib/search";
import ProductLogo from "@/components/ProductLogo";
import AnimatedDialog from "@/components/AnimatedDialog";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5" />
    </svg>
  );
}

export default function ProductSearch() {
  const lang = useLang();
  const labels = STR[lang].nav;
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const openSearch = () => {
    openerRef.current = document.activeElement as HTMLElement;
    flushSync(() => setOpen(true));
    inputRef.current?.focus({ preventScroll: true });
  };
  const pages = useCategoryPages();
  const results = useMemo(() => searchProducts(term, pages), [term, pages]);

  useEffect(() => {
    if (!open || !term.trim()) return;
    const timer=window.setTimeout(()=>trackSearch(term,results.length>0),600);
    return ()=>window.clearTimeout(timer);
  },[open,term,results.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openerRef.current = document.activeElement as HTMLElement;
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => {
    setOpen(false);
    setTerm("");
  };

  return (
    <>
      <button type="button" className="foot-search" onClick={openSearch} aria-label={labels.search}>
        <SearchIcon />
        <span>{labels.search}</span>
      </button>
      <button type="button" className="mobile-search-button" onClick={openSearch} aria-label={labels.search}>
        <SearchIcon />
      </button>
      <AnimatedDialog
        variant="search"
        open={open}
        onClose={close}
        backdropClassName="product-search-backdrop search-top-overlay"
        className="product-search-dialog"
        labelledBy="product-search-title"
        initialFocusRef={inputRef}
        returnFocusRef={openerRef}
      >
        <div className="product-search-heading">
          <h2 id="product-search-title">{labels.searchTitle}</h2>
          <button type="button" className="product-search-close" onClick={close} aria-label={labels.closeSearch}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="m14 5-7 7 7 7M7 12h14" />
            </svg>
          </button>
          <label className="product-search-field">
            <SearchIcon />
            <input
              ref={inputRef}
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={labels.searchPlaceholder}
              autoComplete="off"
              aria-label={labels.search}
            />
          </label>
        </div>
        <div className="product-search-results" aria-live="polite">
          {!term.trim() ? (
            <p className="product-search-message">{labels.searchHint}</p>
          ) : results.length ? (
            results.map((product) => (
              <Link className="product-search-result" href={product.href} key={product.href} onClick={close}>
                <ProductLogo product={product} />
                <span className="product-search-copy">
                  <strong>{product.name}</strong>
                  <small>{product.category} - {product.from}</small>
                </span>
                <span className="product-search-chevron" aria-hidden="true">&rsaquo;</span>
              </Link>
            ))
          ) : (
            <p className="product-search-message">{labels.searchEmpty}</p>
          )}
        </div>
      </AnimatedDialog>
    </>
  );
}
