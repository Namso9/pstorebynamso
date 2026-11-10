"use client";

import Link from "@/components/TransitionLink";
import Reveal from "@/components/Reveal";
import FinderScene from "@/components/FinderScene";
import { STR, useLang } from "@/lib/i18n";
import { useInfiniteCarousel } from "@/lib/useInfiniteCarousel";

type Category = {
  label: string;
  icon: "ai" | "streaming" | "music" | "data" | "work" | "vpn" | "social";
  color: string;
  shade: string;
  href: string; // category page
};

const categories: Category[] = [
  { label: "AI Tools", icon: "ai", color: "#a75af5", shade: "#7545db", href: "/category/ai" },
  { label: "Streaming", icon: "streaming", color: "#ffb428", shade: "#f18b0b", href: "/category/streaming" },
  { label: "Music", icon: "music", color: "#18c7a9", shade: "#08a58c", href: "/category/music" },
  { label: "Mobile Data", icon: "data", color: "#25c4e8", shade: "#1688e3", href: "/category/mobile-data" },
  { label: "Creative & Work", icon: "work", color: "#7780f5", shade: "#5269df", href: "/category/creative-work" },
  { label: "VPN Premium", icon: "vpn", color: "#19cbae", shade: "#0ca58f", href: "/category/vpn" },
  { label: "Social", icon: "social", color: "#f76ba0", shade: "#df2a77", href: "/category/social" },
];

function CategoryIcon({ icon }: { icon: Category["icon"] }) {
  const paths = {
    ai: <><path d="m12 2.5 1.7 5.8 5.8 1.7-5.8 1.7-1.7 5.8-1.7-5.8-5.8-1.7 5.8-1.7L12 2.5Z" /><path d="m19 16 .6 1.4L21 18l-1.4.6L19 20l-.6-1.4L17 18l1.4-.6L19 16ZM4 18l.5 1L5.5 19l-1 .5L4 20.5l-.5-1L2.5 19l1-.5L4 18Z" /></>,
    streaming: <><rect x="3" y="5" width="18" height="15" rx="2.5" /><path d="M3 10h18M7.2 5l3.4 5M13.8 5l3.4 5" /><path d="m10 12.4 5 2.6-5 2.6v-5.2Z" fill="currentColor" stroke="none" /></>,
    music: <><path d="M9 17V5.7L20 3v12M9 8.6l11-2.7" /><ellipse cx="6" cy="18" rx="3" ry="2" fill="currentColor" /><ellipse cx="17" cy="16" rx="3" ry="2" fill="currentColor" /></>,
    data: <><rect x="5" y="2.5" width="14" height="19" rx="2.5" /><path d="M10 18.5h4M8 10a5.7 5.7 0 0 1 8 0M10 12.5a2.8 2.8 0 0 1 4 0" /><circle cx="12" cy="15" r=".8" fill="currentColor" stroke="none" /></>,
    work: <><rect x="3" y="6" width="18" height="14" rx="2.5" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a20 20 0 0 0 18 0M12 11.5v2.5" /></>,
    vpn: <><path d="M12 2 4.5 5v6c0 5 3.2 8.4 7.5 11 4.3-2.6 7.5-6 7.5-11V5L12 2Z" /><path d="m8.8 12 2.2 2.2 4.3-4.4" /></>,
    social: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8.7 8.7 0 0 1-3-.5L4 21l1.5-4A7.5 7.5 0 1 1 20 11.5Z" /><circle cx="9" cy="11.5" r=".85" fill="currentColor" stroke="none" /><circle cx="12.5" cy="11.5" r=".85" fill="currentColor" stroke="none" /><circle cx="16" cy="11.5" r=".85" fill="currentColor" stroke="none" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[icon]}
    </svg>
  );
}

export default function BrowseCategories() {
  const { rowRef, move } = useInfiniteCarousel(categories.length, 4500);
  const lang = useLang();
  const s = STR[lang].browse;

  return (
    <>
      {/* ---- browse by category ---- */}
      <Reveal>
      <section id="categories" className="browse">
        <h2>{s.heading}</h2>

        <div className="browse-strip">
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

          <div className="browse-row" ref={rowRef}>
            {[0, 1, 2].flatMap((setIndex) => categories.map((c) => (
              <Link
                href={c.href}
                prefetch={false}
                className="browse-card"
                key={`${setIndex}-${c.label}`}
                aria-hidden={setIndex !== 1}
                tabIndex={setIndex === 1 ? 0 : -1}
              >
                <div className="browse-visual">
                  <span
                    className="browse-icon"
                    style={{ "--icon-color": c.color, "--icon-shade": c.shade } as React.CSSProperties}
                  >
                    <CategoryIcon icon={c.icon} />
                  </span>
                </div>
                <div className="browse-label">{s.cats[c.label] ?? c.label}</div>
                <div className="browse-detail">{s.details[c.label]}</div>
              </Link>
            )))}
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
      </section>
      </Reveal>

      <Reveal>
      <section className="finder">
        <div className="finder-copy">
          <div className="finder-eyebrow">{s.finderEyebrow}</div>
          <h2>{s.finderTitle}</h2>
          <p>{s.finderBody}</p>
          <Link href="/products" className="finder-btn">
            {s.finderBtn}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 12h15" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        <FinderScene />
      </section>
      </Reveal>

    </>
  );
}
