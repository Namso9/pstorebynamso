"use client";

import Link from "@/components/TransitionLink";
import { useEffect, useState } from "react";
import { fetchPopularData } from "@/services/content";
import { fetchCatalog } from "@/services/catalog";
import { STR, useLang } from "@/lib/i18n";
import { resolveTrending, type TrendingData, type TrendingItem } from "@/lib/trending";

function Card({ item, rank }: { item: TrendingItem; rank: number }) {
  const lang = useLang();
  const s = STR[lang].catalog;

  return (
    <article className={`cat-card${item.id === "chatgpt" ? " trending-chatgpt" : ""}`}>
      <div className="visual">
        <span className="trending-rank">{rank}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={item.image.endsWith(".svg") ? "" : "trending-raster"}
          src={item.image}
          alt=""
          loading="lazy"
        />
      </div>
      <h3>{item.name}</h3>
      <p className="desc">{item.desc}</p>
      <div className="price">{item.price}</div>
      <Link className="add" prefetch={false} href={item.href}>{s.discover}</Link>
    </article>
  );
}

export default function TrendingThisWeek() {
  const lang = useLang();
  const s = STR[lang].catalog;
  const [trending, setTrending] = useState<TrendingData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const [ranking, catalog] = await Promise.all([
          fetchPopularData(controller.signal),
          fetchCatalog(controller.signal),
        ]);
        if (!controller.signal.aborted) setTrending(resolveTrending(ranking, catalog));
      } catch {
        if (!controller.signal.aborted) setTrending(null);
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5 * 60 * 1000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  if (!trending?.items.length) return null;

  return (
    <section id="deals" className="catalog" aria-label={s.heading}>
      <h2>{s.heading}</h2>
      <div className="cat-grid deals-grid">
        {trending.items.map((item, index) => (
          <Card key={item.id} item={item} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
