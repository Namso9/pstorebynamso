"use client";
import Link from "@/components/TransitionLink";
import CatalogNavigation from "@/components/CatalogNavigation";
import ProductLogo from "@/components/ProductLogo";
import ProductPlansButton from "@/components/ProductPlansButton";
import { productHref } from "@/lib/productDetails";
import { useCategoryPages } from "@/components/CatalogProvider";
import { getCategoryPage } from "@/lib/categoryPages";
export default function CategoryProducts({slug}:{slug:string}) {
  const pages=useCategoryPages();
  const cat=getCategoryPage(slug,pages);
  if (!cat) return <p>This category is unavailable.</p>;
  return (
      <section className="svc-list">
        <CatalogNavigation activeSlug={cat.slug} />
        <h2>{cat.name} plans</h2>
        <div className="svc-grid">
          {cat.products.map((p) => (
            <article className="svc-card" id={`app-${p.id}`} key={p.name}>
              <ProductLogo product={p} />
              <h3>{p.name}</h3>
              <p>{p.desc}</p>
              <ProductPlansButton product={p} className="svc-plans-action" />
              <div className="svc-buy">
                <span className="svc-price">{p.from}</span>
                <Link href={productHref(p.name,p.id)} className="pill-btn solid">
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
);
}
