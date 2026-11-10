"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { homeProducts } from "@/lib/products";
import { useCategoryPages } from "@/components/CatalogProvider";
import { STR, useLang } from "@/lib/i18n";
import { useInfiniteCarousel } from "@/lib/useInfiniteCarousel";

const TRAITS = [
  "AI", "Chat", "Images", "Video", "Music",
  "Streaming", "Learning", "Reading", "Work", "Ad-free",
];
const displayName = (name: string) => name === "Netflix (TV Plan)" ? "Netflix" :
  name === "Spotify (Canada Region)" ? "Spotify" : name;

const meta: Record<string, { tags: string[]; alike: string[] }> = {
  "ChatGPT Plus": { tags: ["AI", "Chat", "Images"], alike: ["Gemini AI", "Zoom Pro"] },
  "Netflix (TV Plan)": { tags: ["Video", "Streaming", "Ad-free"], alike: ["Spotify (Canada Region)", "Duolingo Super"] },
  "Spotify (Canada Region)": { tags: ["Music", "Ad-free"], alike: ["Netflix (TV Plan)", "Duolingo Super"] },
  "Gemini AI": { tags: ["AI", "Chat", "Images"], alike: ["ChatGPT Plus", "Zoom Pro"] },
  "Duolingo Super": { tags: ["Learning", "Ad-free"], alike: ["Spotify (Canada Region)", "Netflix (TV Plan)"] },
  "Zoom Pro": { tags: ["Video", "Work"], alike: ["ChatGPT Plus", "Gemini AI"] },
};

export default function CompareSubs() {
  const pages = useCategoryPages();
  const products = homeProducts(pages);
  const [idx, setIdx] = useState(0);
  const { rowRef, move, goTo, scrollToRendered } = useInfiniteCarousel(
    products.length,
    4500,
    true,
    { align: "center", onIndexChange: setIdx },
  );
  const lang = useLang();
  const s = STR[lang].compare;

  const p = products[Math.min(idx,products.length-1)];
  if (!p) return null;
  const m = meta[p.name] || { tags:[], alike:[] };

  return (
    <Reveal>
      <section className="compare">
        <h2>{s.heading}</h2>

        <div className="compare-carousel">
          <button
            type="button"
            className="strip-arrow left"
            aria-label={s.prev}
            onClick={() => move(-1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>

          <div className="compare-window">
            <div className="compare-track" ref={rowRef}>
              {[0, 1, 2].flatMap((setIndex) => products.map((prod, i) => (
                <button
                  type="button"
                  className={`compare-item${i === idx ? " active" : ""}`}
                  key={`${setIndex}-${prod.name}`}
                  onClick={() => {
                    setIdx(i);
                    scrollToRendered(setIndex * products.length + i);
                  }}
                  aria-label={displayName(prod.name)}
                  aria-hidden={setIndex !== 1}
                  tabIndex={setIndex === 1 ? 0 : -1}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prod.logo} alt={displayName(prod.name)} loading="lazy" decoding="async" />
                </button>
              )))}
            </div>
          </div>

          <button
            type="button"
            className="strip-arrow right"
            aria-label={s.next}
            onClick={() => move(1)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* details for the centered item */}
        <div className="compare-detail" key={p.name}>
          <div className="compare-name">{displayName(p.name)}</div>
          <div className="compare-line">{p.desc}</div>
          <div className="compare-price">{p.price}</div>

          <div className="compare-traits">
            {TRAITS.map((t) => (
              <div
                className={`trait${m.tags.includes(t) ? " on" : ""}`}
                key={t}
                style={{ "--brand": p.brand } as React.CSSProperties}
              >
                {s.traits[t] ?? t}
              </div>
            ))}
          </div>

          <div className="compare-alike">
            <div className="alike-title">{s.alike}</div>
            {m.alike.map((name) => {
              const target = products.findIndex((x) => x.name === name);
              return (
                <button
                  type="button"
                  key={name}
                  className="alike-link"
                  onClick={() => {
                    if (target < 0) return;
                    setIdx(target);
                    goTo(target);
                  }}
                >
                  {displayName(name)}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
