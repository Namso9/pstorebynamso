import { categoryPages, getCategoryPage, type CategoryPage, type CategoryProduct } from "@/lib/categoryPages";
import { productHref } from "@/lib/productDetails";

export type Product = {
  name: string;
  desc: string;
  price: string;
  brand: string;
  logo: string;
  href: string;
};

type HomePick = { category: string; name: string };

const homePicks: HomePick[] = [
  { category: "ai", name: "ChatGPT Plus" },
  { category: "streaming", name: "Netflix (TV Plan)" },
  { category: "music", name: "Spotify (Canada Region)" },
  { category: "ai", name: "Gemini AI" },
  { category: "creative-work", name: "Duolingo Super" },
  { category: "creative-work", name: "Zoom Pro" },
];

function minimumAvailablePrice(product: CategoryProduct): string {
  const prices = product.plans
    .filter((plan) => !plan.soldOut)
    .map((plan) => {
      const match = plan.price.match(/^([\d,]+) Ks$/);
      return match ? Number(match[1].replaceAll(",", "")) : null;
    })
    .filter((price): price is number => price !== null);

  if (prices.length === 0) return "Contact store";
  return `From ${Math.min(...prices).toLocaleString("en-US")} Ks`;
}

function homeProduct({ category, name }: HomePick, pages:CategoryPage[]): Product | null {
  const product = getCategoryPage(category, pages)?.products.find((item) => item.slug === name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
  if (!product?.logo) return null;

  return {
    name: product.name,
    desc: product.desc,
    price: minimumAvailablePrice(product),
    brand: product.brand,
    logo: product.logo,
    href: productHref(product.name),
  };
}

export function homeProducts(pages:CategoryPage[]) { return homePicks.flatMap(p => { const item=homeProduct(p,pages); return item ? [item] : []; }); }
export const products = homeProducts(categoryPages);
