"use client";

import Link from "@/components/TransitionLink";
import snapshot from "@/data/trending-snapshot.json";
import { STR, useLang } from "@/lib/i18n";
import type { TrendingData, TrendingItem } from "@/lib/trending";
import { detailProducts, productHref } from "@/lib/productDetails";

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
      <Link className="add" prefetch={false} href={detailProducts.some(({ product }) => product.name === item.name) ? productHref(item.name) : item.href}>{s.discover}</Link>
    </article>
  );
}

export default function TrendingThisWeek() {
  const lang = useLang();
  const s = STR[lang].catalog;
  const trending: TrendingData = snapshot;

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
