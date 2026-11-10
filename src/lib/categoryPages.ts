import designs from '@/data/catalog-design.json';
import { productImages } from '@/data/productImages';
import { staticCatalog } from '@/lib/static-catalog';
import { isAskPricePlan } from '@/services/catalog';
import { isCatalogPlan, type CatalogData } from '@/types/catalog';

export type ProductPlan = {
  id: string;
  label: string;
  price: string;
  soldOut?: boolean;
  contact?: boolean;
  bot?: boolean;
};
export type CategoryProduct = {
  id: string;
  slug: string;
  name: string;
  desc: string;
  logo?: string;
  initials?: string;
  brand: string;
  from: string;
  plans: ProductPlan[];
};
export type CategoryPage = {
  slug: string; name: string; headline: string; sub: string; hero: string;
  products: CategoryProduct[];
};
export const categorySlugs: Record<string, string> = {
  'streaming-apps':'streaming', 'ai-apps':'ai', 'premium-vpn-apps':'vpn',
  'mobile-data':'mobile-data', 'music-apps':'music', 'creative-apps':'creative-work', social:'social',
};
export function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function buildCategoryPages(catalog: CatalogData): CategoryPage[] {
  return catalog.categories.map(category => {
    const slug = categorySlugs[category.slug] || category.slug;
    const design = designs.find(c => c.slug === slug);
    const products = catalog.products.filter(p => p.category === category.slug).map(p => {
      const reference = staticCatalog.products.find(item => item.id === p.id);
      const visual = designs.flatMap(c => c.products).find(v => v.catalogId === p.id);
      const plans: ProductPlan[] = [];
      for (const entry of p.plans) {
        if (!isCatalogPlan(entry)) continue;
        const plan=entry;
        plans.push({
        id: plan.id,
        label: visual?.plans.find(item => item.catalogPlanId === plan.id)?.label || plan.name,
        price: isAskPricePlan(plan) ? 'Contact store' : plan.price || 'Contact store',
        soldOut: plan.stock === false,
        contact: isAskPricePlan(plan),
        bot: plan.bot === true,
        });
      }
      const prices = plans.filter(plan => !plan.soldOut && !plan.contact).flatMap(plan => {
        const match = plan.price.match(/^([\d,]+) Ks$/);
        return match ? [Number(match[1].replaceAll(',', ''))] : [];
      });
      return {
        id:p.id, slug:slugify(visual?.name || reference?.name || p.name), name:visual?.name || p.name, desc:visual?.desc || p.subtitle,
        logo:visual ? productImages[visual.name] || visual.logo : '/' + p.image.replace(/^\//, ''), initials:visual?.initials, brand:visual?.brand || '#555555', plans,
        from:prices.length ? `From ${Math.min(...prices).toLocaleString('en-US')} Ks` : 'Contact store',
      };
    }).sort((a, b) => {
      const position = (id: string) => {
        const index = design?.products.findIndex(item => item.catalogId === id) ?? -1;
        return index < 0 ? Number.MAX_SAFE_INTEGER : index;
      };
      return position(a.id) - position(b.id);
    });
    return { slug, name:design?.name || category.title, headline:design?.headline || category.title,
      sub:design?.sub || category.subtitle, hero:design?.hero || '/category/work.jpg', products };
  });
}
export const categoryPages = buildCategoryPages(staticCatalog);
export function getCategoryPage(slug: string, pages = categoryPages) {
  return pages.find(c => c.slug === (slug === 'ai-tools' ? 'ai' : slug));
}
export function categoryRoute(slug: string) { return `/category/${slug}/`; }
