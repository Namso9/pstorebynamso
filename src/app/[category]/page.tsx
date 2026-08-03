import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryCatalog } from "@/components/catalog/CategoryCatalog";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { FAQList } from "@/components/faq/FAQList";
import { categoryPresentations } from "@/data/category-presentations";
import { staticCatalog } from "@/lib/static-catalog";
import { staticFaqData } from "@/lib/static-content";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return staticCatalog.categories.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = staticCatalog.categories.find((item) => item.slug === slug);
  const presentation = categoryPresentations[slug];
  if (!category || !presentation) return {};

  const description = `${category.title} - Premium Store by Namso. ${category.subtitle}. Telegram Bot ဖြင့် အလွယ်တကူ ဝယ်ယူနိုင်ပါသည်။`;
  return {
    title: presentation.metadataTitle,
    description,
    alternates: { canonical: `/${slug}/` },
    openGraph: {
      type: "website",
      url: `/${slug}/`,
      title: presentation.openGraphTitle,
      description,
      images: [presentation.image],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = staticCatalog.categories.find((item) => item.slug === slug);
  const presentation = categoryPresentations[slug];
  if (!category || !presentation) notFound();

  return (
    <div className="category-page">
      <AnimatedSection className="category-hero">
        <p className="eyebrow">{category.subtitle}</p>
        <h1>{presentation.heading}</h1>
        <p>{presentation.pageSubtitle}</p>
      </AnimatedSection>
      <section className="category-products" aria-label={`${category.title} products`}>
        <CategoryCatalog
          categorySlug={category.slug}
          initialCatalog={staticCatalog}
        />
      </section>
      <FAQList categorySlug={category.slug} initialData={staticFaqData} />
    </div>
  );
}
