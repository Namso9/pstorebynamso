"use client";
import Link from "@/components/TransitionLink";
import { useDetailProducts } from "@/components/CatalogProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductLogo from "@/components/ProductLogo";
import ProductPlanSelector from "@/components/ProductPlanSelector";
import ProductPlansButton from "@/components/ProductPlansButton";
import ProductFaqs from "@/components/ProductFaqs";
import { productFaqs } from "@/data/productFaqs";
import HappLocations from "@/components/HappLocations";
import { productHref } from "@/lib/productDetails";
import { productDetails } from "@/data/productDetails";

export default function ProductDetailBody({slug}:{slug:string}) {
  const detailProducts = useDetailProducts();
  const item = detailProducts.find((entry) => entry.slug === slug);
  if (!item) return <><Header light /><main className="info-page"><p>This product is no longer available.</p><Link href="/products">Browse products</Link></main><Footer /></>;
  const { product, category } = item;
  const details = productDetails[slug];
  const relatedCategories: Record<string, string> = { social: "creative-work", "mobile-data": "vpn" };
  const related = detailProducts.filter((entry) => entry.slug !== slug && entry.category.slug === category.slug).slice(0, 4);
  if (related.length < 4 && relatedCategories[category.slug]) {
    related.push(...detailProducts.filter((entry) => entry.category.slug === relatedCategories[category.slug]).slice(0, 4 - related.length));
  }

  return (
    <>
      <Header light />
      <main className="product-detail-page">
        <div className="product-detail-inner">
          <nav className="detail-breadcrumb" aria-label="Breadcrumb">
            <Link href="/products">All products</Link><span aria-hidden="true">/</span>
            <Link href={`/category/${category.slug}`}>{category.name}</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{product.name}</span>
          </nav>
          <div className="detail-layout">
            <div className="detail-photo" role="img" aria-label={product.name}>
              {details?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={details.photo} alt="" />
              ) : <ProductLogo product={product} />}
            </div>
            <div className="detail-summary">
              <p className="detail-category">{category.name}</p>
              <ProductPlansButton product={product} titleTrigger={product.name} />
              <p className="detail-description">{product.desc}</p>
              <ProductPlanSelector plans={product.plans} slug={slug} />
            </div>
          </div>
          <section className="detail-content" aria-labelledby="product-content-title">
            <h2 id="product-content-title">Product details</h2>
            <div className="detail-content-body">{details?.content || ""}</div>
          </section>
          {slug === "hiddify-v2box-v2ray" && <HappLocations />}
          {slug === "bioscope-premium" && (
            <section className="detail-downloads">
              <h2>Download Bioscope</h2>
              <p>Find the download for your phone, tablet, TV, or computer.</p>
              <Link className="info-action" href="/bioscope-download">View downloads</Link>
            </section>
          )}
          <ProductFaqs faqs={productFaqs[slug] || []} />
          {related.length > 0 && (
            <section className="detail-related" aria-labelledby="related-products-title">
              <h2 id="related-products-title">Related products</h2>
              <div className="detail-related-grid">
                {related.map(({ product: other, slug: otherSlug }) => (
                  <article className="detail-related-card" key={otherSlug}>
                    <ProductLogo product={other} />
                    <h3>{other.name}</h3>
                    <p>{other.from}</p>
                    <Link className="all-product-action" href={productHref(other.name,other.id)}>View details</Link>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
