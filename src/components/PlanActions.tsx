"use client";
import Link from "next/link";
import { useLiveCatalog } from "@/components/CatalogProvider";
import { orderIdHref } from "@/lib/ordering";
import { trackProductClick } from "@/services/track";
import type { CategoryProduct,ProductPlan } from "@/lib/categoryPages";
export default function PlanActions({product,plan,onChoose}:{product:CategoryProduct;plan:ProductPlan;onChoose?:()=>void}){
 const {catalog}=useLiveCatalog();
 if(plan.soldOut)return null;
 if(plan.contact)return <a className="order-plan-link" href={catalog.settings.telegramChannel || "https://t.me/Premiumstorezz"} target="_blank" rel="noopener noreferrer">Ask price</a>;
 return <Link className="order-plan-link" href={orderIdHref(product.id,plan.id)} onClick={()=>{trackProductClick(product.id,"checkout","modal");onChoose?.();}}>Buy now</Link>;
}
