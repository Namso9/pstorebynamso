import { categoryPages } from "@/lib/categoryPages";

export function productSlug(name: string): string {
  return categoryPages.flatMap(c => c.products).find(p => p.name === name)?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function productHref(name: string, id?:string): string {
  const product=categoryPages.flatMap(c=>c.products).find(p=>id ? p.id===id : p.name===name);
  return product ? `/product/${product.slug}/` : id ? `/product-details/?product=${encodeURIComponent(id)}` : '/products/';
}

export const detailProducts = categoryPages.flatMap((category) =>
  category.products.map((product) => ({
    product,
    slug: product.slug,
    category: { slug: category.slug, name: category.name },
  })),
);
