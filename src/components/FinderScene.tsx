"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { categoryPages } from "@/lib/categoryPages";
import { productImages } from "@/data/productImages";
import { STR, useLang } from "@/lib/i18n";
import styles from "./FinderScene.module.css";

const selections = [
  { category: "AI Tools", names: ["ChatGPT Plus", "Gemini AI", "Perplexity AI"] },
  { category: "Music", names: ["Spotify (Canada Region)", "Tidal", "SoundCloud"] },
  { category: "VPN Premium", names: ["Proton VPN", "Jump Jump VPN", "ExpressVPN"] },
  { category: "Streaming", names: ["Netflix (TV Plan)", "Disney+", "YouTube Premium"] },
  { category: "Creative & Work", names: ["Canva Pro", "CapCut Pro", "Zoom Pro"] },
  { category: "Mobile Data", secondary: "Social", names: ["Atom Data", "Snapchat+", "Mytel Data"] },
];
const products = categoryPages.flatMap(category => category.products);
const displayNames: Record<string, string> = {
  "Spotify (Canada Region)": "Spotify",
  "ExpressVPN": "ExpressVPN",
  "Netflix (TV Plan)": "Netflix",
};
const scenes = selections.map(scene => ({ ...scene, products: scene.names.map(name => {
  const product = products.find(item => item.name === name);
  return { name: displayNames[name] || name, src: productImages[name] || product?.logo || "" };
}) }));
export default function FinderScene() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const lang = useLang();
  const labels = STR[lang].browse.cats;
  const categoryLabel = (scene: typeof scenes[number]) => [scene.category, scene.secondary]
    .filter((key): key is string => Boolean(key)).map(key => labels[key] ?? key).join(" / ");

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateVisibility = () => setTabVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .15 });
    if (root.current) observer.observe(root.current);
    return () => {
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (paused || hovered || focused || reducedMotion || !visible || !tabVisible) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % scenes.length), 5600);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, reducedMotion, visible, tabVisible]);

  return (
    <div ref={root} className={`finder-visual ${styles.scene}`} data-paused={paused || hovered || focused || reducedMotion || !visible || !tabVisible}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className={styles.landscape} aria-hidden="true">
        <div className={styles.daySky} />
        <div className={styles.nightSky} />
      </div>

      <div className={styles.heading} aria-hidden="true">
        <span className={styles.eyebrow}>PREMIUM STORE</span>
        <div className={styles.categoryLabels}>{scenes.map((scene, i) => <span key={scene.category} data-active={i === active}>{categoryLabel(scene)}</span>)}</div>
      </div>

      <div className={styles.logoStage}>
        {scenes.map((scene, i) => (
          <div className={styles.logoGroup} key={scene.category} data-active={i === active} aria-hidden={i !== active}>
            {scene.products.map((product, slot) => (
              <div className={styles.logoSlot} key={product.name} style={{ "--slot": slot } as CSSProperties}>
                <div className={styles.logoFloat}>
                  <div className={styles.logoCard}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.src} alt={product.name} width="80" height="80" decoding="async" loading="lazy" />
                  </div>
                  <span className={styles.productName}>{product.name}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.dots} role="group" aria-label={lang === "mm" ? "\u1000\u100f\u1039\u100d\u1019\u103b\u102c\u1038" : "Product categories"}>
          {scenes.map((scene, i) => <button key={scene.category} type="button" onClick={() => setActive(i)} aria-label={categoryLabel(scene)} aria-pressed={i === active}><span /></button>)}
        </div>
        <button type="button" className={styles.pause} onClick={() => setPaused(value => !value)} aria-pressed={paused}
          aria-label={lang === "mm" ? "Animation \u1001\u100f\u101b\u1015\u103a\u101b\u1014\u103a" : "Pause animation"}>
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">{paused ? <path d="m7 4 9 6-9 6Z" /> : <path d="M6 4h3v12H6zm6 0h3v12h-3z" />}</svg>
        </button>
      </div>
    </div>
  );
}
