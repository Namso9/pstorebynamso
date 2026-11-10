import Link from "@/components/TransitionLink";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryProducts from "@/components/CategoryProducts";
import { categoryPages, getCategoryPage } from "@/lib/categoryPages";

export function generateStaticParams() {
  return [...categoryPages.map((c) => ({ slug: c.slug })), { slug: "ai-tools" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategoryPage(slug);
  return { title: cat ? `${cat.name} - Premium Store` : "Premium Store" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategoryPage(slug);
  if (!cat) notFound();
  const mobileHero = cat.hero.replace(/\.jpg$/, ".mobile.jpg");
  const largeHero = cat.slug === "music" ? cat.hero : cat.hero.replace(/\.jpg$/, ".large.jpg");
  const largeWidth = cat.slug === "music" ? 1168 : 1600;

  return (
    <>
      <Header />
      <section className="cat-hero">
        <img className="cat-hero-img" src={largeHero} srcSet={`${mobileHero} 960w, ${largeHero} ${largeWidth}w`} sizes="100vw" fetchPriority="high" decoding="async" alt="" />
        <div className="cat-hero-shade" />
        <div className="cat-hero-copy">
          <Link className="cat-back" href="/#categories">
            All categories
          </Link>
          <h1>{cat.headline}</h1>
          <p>{cat.sub}</p>
        </div>
      </section>

      <CategoryProducts slug={cat.slug} />
      <Footer />
    </>
  );
}
