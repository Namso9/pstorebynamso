"use client";

import Link from "@/components/TransitionLink";
import { useCategoryPages } from "@/components/CatalogProvider";
import { categoryRoute } from "@/lib/categoryPages";
import { STR, useLang } from "@/lib/i18n";

export default function CatalogNavigation({ activeSlug }: { activeSlug: string }) {
  const categoryPages = useCategoryPages();
  const lang = useLang();
  const s = STR[lang].browse;

  return (
    <nav className="product-category-nav" aria-label={s.heading}>
      <Link href="/products" className={activeSlug === "all" ? "active" : ""} aria-current={activeSlug === "all" ? "page" : undefined}>
        {s.finderAll}
      </Link>
      {categoryPages.map((category) => (
        <Link
          key={category.slug}
          href={categoryRoute(category.slug)}
          className={activeSlug === category.slug ? "active" : ""}
          aria-current={activeSlug === category.slug ? "page" : undefined}
        >
          {s.cats[category.name] || category.name}
        </Link>
      ))}
    </nav>
  );
}
