import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryCatalog } from "@/components/catalog/CategoryCatalog";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { FAQList } from "@/components/faq/FAQList";
import {
  BRAND_OG_IMAGE,
  categoryPresentations,
  type CategoryPresentation,
} from "@/data/category-presentations";
import { staticCatalog } from "@/lib/static-catalog";
import { staticFaqData } from "@/lib/static-content";
import type { CatalogCategory } from "@/types/catalog";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export const dynamicParams = false;

/**
 * The route set is the UNION of the panel-owned catalog and the storefront's own
 * presentation map, because the two sides ship in separate commits: the panel
 * writes `products.json` and the GitHub-raw proxy serves it live within seconds,
 * while a route only exists after a Pages build. Building both sides' slugs means
 * a taxonomy change can land in either order without a live 404 in between.
 */
export function generateStaticParams() {
  const slugs = new Set([
    ...staticCatalog.categories.map((category) => category.slug),
    ...Object.keys(categoryPresentations),
  ]);
  return [...slugs].map((category) => ({ category }));
}

/**
 * Either side alone is enough to render a real page — the panel supplies
 * title/subtitle, the presentation supplies the SEO copy — so whichever is
 * missing is derived from the other. Only a slug absent from BOTH is a 404.
 */
function resolveCategoryPage(slug: string) {
  const catalogCategory = staticCatalog.categories.find(
    (item) => item.slug === slug,
  );
  const presentation = categoryPresentations[slug];

  if (catalogCategory && presentation) {
    return { category: catalogCategory, presentation };
  }
  if (catalogCategory) {
    return {
      category: catalogCategory,
      presentation: {
        heading: catalogCategory.title,
        pageSubtitle: catalogCategory.subtitle,
        metadataTitle: `${catalogCategory.title} | Premium Store by Namso`,
        openGraphTitle: catalogCategory.title,
        openGraphImage: BRAND_OG_IMAGE,
      } satisfies CategoryPresentation,
    };
  }
  if (presentation) {
    return {
      category: {
        slug,
        title: presentation.openGraphTitle,
        subtitle: presentation.pageSubtitle,
      } satisfies CatalogCategory,
      presentation,
    };
  }
  return null;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const resolved = resolveCategoryPage(slug);
  if (!resolved) return {};
  const { category, presentation } = resolved;

  // A slug the presentation map pre-created, or one the catalog has just been
  // reorganised out of, builds with an empty product grid. Self-canonical thin
  // pages are worth keeping out of the index until they have stock; the guard
  // lifts itself on the next build after `products.json` catches up.
  const productCount = staticCatalog.products.filter(
    (product) => product.category === slug,
  ).length;

  const description = `${category.title} - Premium Store by Namso. ${category.subtitle}. Telegram Bot ဖြင့် အလွယ်တကူ ဝယ်ယူနိုင်ပါသည်။`;
  return {
    title: presentation.metadataTitle,
    description,
    ...(productCount ? {} : { robots: { index: false, follow: true } }),
    alternates: { canonical: `/${slug}/` },
    openGraph: {
      type: "website",
      url: `/${slug}/`,
      title: presentation.openGraphTitle,
      description,
      images: [presentation.openGraphImage],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const resolved = resolveCategoryPage(slug);
  if (!resolved) notFound();
  const { category, presentation } = resolved;

  return (
    <div className="category-page">
      <AnimatedSection className="category-hero">
        {/* The eyebrow is the catalog subtitle and the line under the heading is
            the presentation subtitle. When one side of the pair is being derived
            from the other (a slug the catalog or the map has not caught up with)
            they are the same sentence — print it once. */}
        {category.subtitle === presentation.pageSubtitle ? null : (
          <p className="eyebrow">{category.subtitle}</p>
        )}
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
