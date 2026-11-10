"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { STR, useLang } from "@/lib/i18n";

const HOLD = 2600; // ms front card stays centered
const MOVE = 1100; // ms rotation to the next card

function Dots() {
  return (
    <svg className="premium-store-dots" viewBox="0 0 16 4" aria-hidden="true">
      <circle cx="2" cy="2" r="1.6" />
      <circle cx="8" cy="2" r="1.6" />
      <circle cx="14" cy="2" r="1.6" />
    </svg>
  );
}

type HeroButtons = "anchors" | "pages" | "none";

export default function Hero({ buttons = "anchors" }: { buttons?: HeroButtons }) {
  const lang = useLang();
  const s = STR[lang].hero;
  const mediaRef = useRef<HTMLDivElement>(null);
  const browseHref = buttons === "pages" ? "/categories" : "#categories";
  const exploreHref = buttons === "pages" ? "/deals" : "#deals";

  useEffect(() => {
    const stage = mediaRef.current;
    if (!stage) return;
    const base = Array.from(stage.querySelectorAll<HTMLElement>(".premium-store-card:not([data-clone])"));
    // CC Cylinder look needs close neighbors: each card sits twice on the drum
    let clones = Array.from(stage.querySelectorAll<HTMLElement>(".premium-store-card[data-clone]"));
    if (clones.length === 0) {
      clones = base.map((c) => {
        const k = c.cloneNode(true) as HTMLElement;
        k.setAttribute("data-clone", "1");
        stage.appendChild(k);
        return k;
      });
    }
    const cards = [...base, ...clones];
    const N = cards.length;
    const STEP = 360 / N;

    let angle = 0;
    let from = 0;
    let to = 0;
    let t0 = 0;
    let raf = 0;
    let timer = 0;
    let visible = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const render = (a: number) => {
      // CC Cylinder: tight drum, narrow gaps, sides recede behind
      const cardW = cards[0].offsetWidth || stage.clientWidth * 0.26;
      const radius = (N * cardW * 1.08) / (2 * Math.PI);
      for (let i = 0; i < N; i++) {
        const theta = a + i * STEP;
        const rad = (theta * Math.PI) / 180;
        const z = Math.cos(rad) * radius;
        const n = (z / radius + 1) / 2; // 0 back .. 1 front
        const c = cards[i];
        c.style.transform = `translate(-50%,-50%) translateZ(${(-radius * 0.6).toFixed(1)}px) rotateY(${theta.toFixed(2)}deg) translateZ(${radius.toFixed(1)}px)`;
        c.style.opacity = (0.35 + 0.65 * n).toFixed(3);
        c.style.zIndex = String(100 + Math.round(z));
      }
    };

    const loop = (now: number) => {
      const t = Math.min(1, (now - t0) / MOVE);
      angle = from + (to - from) * easeInOut(t);
      render(angle);
      if (t < 1) raf = requestAnimationFrame(loop);
      else timer = window.setTimeout(startMove, HOLD);
    };
    const startMove = () => {
      from = angle;
      to = angle - STEP;
      t0 = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const update = () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      if (visible && !document.hidden && !motion.matches) timer = window.setTimeout(startMove, HOLD);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(stage);
    const onResize = () => render(angle);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    render(0);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  return (
    <section
      id="subscription-hero"
      className="subscription-hero"
      aria-labelledby="subscription-title"
    >
      <div className="subscription-hero-inner">
        <div className="subscription-copy">
          {s.eyebrow && (
            <p className="subscription-eyebrow subscription-enter">
              <span className="subscription-shimmer">{s.eyebrow}</span>
            </p>
          )}
          <h1 id="subscription-title" className="subscription-title subscription-enter">
            <span className="subscription-shimmer">
              {s.titleLines.map((line, i) => (
                <span key={line}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </span>
          </h1>
          <p className="subscription-description subscription-enter">
            <span className="subscription-shimmer">
              {s.descLines[0]}
              <br />
              {s.descLines[1]}
            </span>
          </p>
          {buttons !== "none" && (
            <div className="subscription-actions subscription-enter">
              <a className="subscription-primary" href={browseHref}>
                {s.browse}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M4 12h16M14 6l6 6-6 6" />
                </svg>
              </a>
              <a className="subscription-secondary" href={exploreHref}>
                {s.explore}
              </a>
            </div>
          )}
        </div>

        <div className="subscription-visual">
          <div className="subscription-media premium-store-3d" ref={mediaRef} aria-hidden="true">
            {/* Music */}
            <article className="premium-store-card premium-store-card--dark" style={{ "--i": 0 } as CSSProperties}>
              <div className="premium-store-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V6l10-2v12" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="16" cy="16" r="3" />
                </svg>
                <span>Music</span>
                <Dots />
              </div>
              <div className="premium-store-media-row">
                <span className="premium-store-thumb premium-store-thumb--spotify">
                  <img src="/logos/spotify.svg" alt="" />
                </span>
                <div className="premium-store-wave" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <i key={n} style={{ animationDelay: `${n * -0.13}s` }} />
                  ))}
                </div>
              </div>
              <p className="premium-store-muted">Good days, on repeat.</p>
              <div className="premium-store-track" />
              <div className="premium-store-times premium-store-muted">
                <span>1:24</span>
                <span>3:56</span>
              </div>
              <div className="premium-store-controls">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6v12M19 6l-9 6 9 6z" /></svg>
                <span className="premium-store-play">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
                </span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 6v12M5 6l9 6-9 6z" /></svg>
              </div>
            </article>

            {/* Streaming */}
            <article className="premium-store-card premium-store-card--blue" style={{ "--i": 1 } as CSSProperties}>
              <div className="premium-store-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="13" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                  <path d="M11 9l3 1.8-3 1.8z" fill="currentColor" stroke="none" />
                </svg>
                <span>Streaming</span>
                <Dots />
              </div>
              <div className="premium-store-video">
                <img className="premium-store-video-brand" src="/logos/netflix.svg" alt="" />
                <span className="premium-store-play">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
                </span>
                <span className="premium-store-vbar" />
              </div>
              <p className="premium-store-muted">Something worth watching.</p>
            </article>

            {/* AI Tools */}
            <article className="premium-store-card premium-store-card--blue" style={{ "--i": 2 } as CSSProperties}>
              <div className="premium-store-head">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
                </svg>
                <span>AI Tools</span>
                <Dots />
              </div>
              <div className="premium-store-input">
                <span className="premium-store-type">Turn my ideas into a plan</span>
                <span className="premium-store-caret" />
              </div>
              <div className="premium-store-check is-done"><i />Outline created</div>
              <div className="premium-store-check is-done"><i />Key points ready</div>
              <div className="premium-store-check"><i />Next steps suggested</div>
            </article>

            {/* VPN */}
            <article className="premium-store-card premium-store-card--dark" style={{ "--i": 3 } as CSSProperties}>
              <div className="premium-store-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 4.3-3 7.4-7 8.5-4-1.1-7-4.2-7-8.5V6z" />
                </svg>
                <span>VPN</span>
                <Dots />
              </div>
              <div className="premium-store-toggle-row">
                <span className="premium-store-sub">Your private space</span>
                <span className="premium-store-toggle" />
              </div>
              <svg className="premium-store-graph" viewBox="0 0 120 46" preserveAspectRatio="none" aria-hidden="true">
                <line className="grid" x1="30" y1="2" x2="30" y2="44" />
                <line className="grid" x1="60" y1="2" x2="60" y2="44" />
                <line className="grid" x1="90" y1="2" x2="90" y2="44" />
                <path className="ln" d="M4 38 C24 30 34 10 60 12 C86 14 96 30 116 20" />
              </svg>
            </article>

            {/* Learning */}
            <article className="premium-store-card premium-store-card--blue" style={{ "--i": 4 } as CSSProperties}>
              <div className="premium-store-head">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z" />
                </svg>
                <span>Learning</span>
                <Dots />
              </div>
              <p className="premium-store-sub">Build new skills</p>
              <div className="premium-store-lesson"><span>Lesson 1</span><span className="premium-store-bar" style={{ "--p": 0.82 } as CSSProperties} /></div>
              <div className="premium-store-lesson"><span>Lesson 2</span><span className="premium-store-bar" style={{ "--p": 0.45 } as CSSProperties} /></div>
              <div className="premium-store-lesson"><span>Lesson 3</span><span className="premium-store-bar" style={{ "--p": 0.15 } as CSSProperties} /></div>
            </article>
          </div>

        </div>
      </div>
    </section>
  );
}
