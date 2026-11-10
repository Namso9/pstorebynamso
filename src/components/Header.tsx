"use client";

import Link from "@/components/TransitionLink";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { STR, setLang, useLang } from "@/lib/i18n";
import ProductSearch from "@/components/ProductSearch";

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const CAT_LINKS: { key: string; href: string }[] = [
  { key: "AI Tools", href: "/category/ai" },
  { key: "Streaming", href: "/category/streaming" },
  { key: "Music", href: "/category/music" },
  { key: "Mobile Data", href: "/category/mobile-data" },
  { key: "Creative & Work", href: "/category/creative-work" },
  { key: "VPN Premium", href: "/category/vpn" },
  { key: "Social", href: "/category/social" },
];

export default function Header({ light = false }: { light?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const catsRef = useRef<HTMLDetailsElement>(null);
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "light");
  const lang = useLang();
  const s = STR[lang].nav;
  const cats = STR[lang].browse.cats;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (catsRef.current && !catsRef.current.contains(event.target as Node)) catsRef.current.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && catsRef.current?.open) {
        catsRef.current.open = false;
        catsRef.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <header className={`footbar${light ? " light" : ""}${scrolled ? " scrolled" : ""}`}>
      <div className="foot-left">
        <Link className="foot-logo" href="/" aria-label="Premium Store home">
          <span>Premium Store</span>
        </Link>
        <details className="foot-cats" ref={catsRef}>
          <summary
            className="cats-btn"
            aria-label={s.categories}
            aria-controls="category-menu"
          >
            <span className="cats-label">{s.categories}</span>
            <svg className="cats-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
            <svg className="cats-hamburger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path className="cats-lines" d="M3 6h18M3 12h18M3 18h18" />
              <path className="cats-close" d="M4 4l16 16M20 4L4 20" />
            </svg>
          </summary>
            <nav className="cats-menu" id="category-menu">
              {CAT_LINKS.map((c) => (
                <Link key={c.key} href={c.href} onClick={() => { if (catsRef.current) catsRef.current.open = false; }}>
                  {cats[c.key] ?? c.key}
                </Link>
              ))}
            </nav>
        </details>
      </div>

      <div className="foot-right">
        <ProductSearch />
        <div className="foot-icons">
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLang(lang === "mm" ? "en" : "mm")}
            title={lang === "mm" ? "Switch to English" : "Switch to Burmese"}
            aria-label={lang === "mm" ? "Switch to English" : "Switch to Burmese"}
          >
            <span className="lang-card lang-card--en" aria-hidden="true">EN</span>
            <span className="lang-card lang-card--mm" aria-hidden="true">MM</span>
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
