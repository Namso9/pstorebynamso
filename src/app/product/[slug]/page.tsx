import type { Metadata } from "next";
import ProductDetailBody from "@/components/ProductDetailBody";
import { detailProducts } from "@/lib/productDetails";
import designs from "@/data/catalog-design.json";
import { slugify } from "@/lib/categoryPages";
export function generateStaticParams() {
 const slugs = new Set([
  ...detailProducts.map(({slug})=>slug),
  ...designs.flatMap(category=>category.products.map(product=>slugify(product.name))),
 ]);
 return [...slugs].map(slug=>({slug}));
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
 const {slug}=await params; const item=detailProducts.find(p=>p.slug===slug);
 return {title:item ? `${item.product.name} - Premium Store` : 'Premium Store',description:item?.product.desc};
}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; return <ProductDetailBody slug={slug} />;
}
