"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useCatalog } from "@/hooks/useCatalog";
import { orderQuery, resolveCatalogSelection } from "@/services/order";
import type { CatalogData } from "@/types/catalog";

type OrderSummaryProps = {
  initialCatalog: CatalogData;
  location: "payment" | "order";
};

export function OrderSummary({ initialCatalog, location }: OrderSummaryProps) {
  const searchParams = useSearchParams();
  const { catalog = initialCatalog } = useCatalog(initialCatalog);
  const productId = searchParams.get("product");
  const planId = searchParams.get("plan");
  const selection = resolveCatalogSelection(catalog, productId, planId);
  if (!selection) return null;

  const { product, plan } = selection;
  const query = orderQuery(product.id, plan?.id || null);

  return (
    <section className="order-summary-next" aria-labelledby="order-summary-title">
      <p className="eyebrow">Selected product</p>
      <h2 id="order-summary-title">Your Order</h2>
      <p>
        <strong>{product.name}</strong>
        {plan ? ` — ${plan.name}${plan.desc ? ` (${plan.desc})` : ""}` : ""}
      </p>
      {plan?.price ? <p className="order-summary-next__price">{plan.price}</p> : null}
      {plan?.stock === false ? (
        <p className="order-stock-warning" role="alert">
          သတိပြုရန် — ဒီ plan က လောလောဆယ် stock မရှိပါ။
          {location === "payment"
            ? " ငွေမလွှဲခင် Admin ကို အရင်မေးပေးပါ။"
            : " Order တင်ထားရင် stock ပြန်ရှိချိန် Admin က အကြောင်းပြန်ပါမယ်။"}
        </p>
      ) : null}
      {location === "payment" ? (
        <p className="order-summary-next__note">
          အောက်မှာ Platform ရွေးပြီး QR နဲ့ ငွေလွှဲပါ။ ပြီးရင် screenshot ကို{" "}
          <a href="https://www.messenger.com/t/happyyou2020" target="_blank" rel="noopener noreferrer">
            Page Messenger
          </a>{" "}
          သို့မဟုတ်{" "}
          <Link href={`/order/${query}`} prefetch={false}>ဒီ order form</Link> ကနေ တင်နိုင်ပါတယ်။
        </p>
      ) : (
        <p className="order-summary-next__note">
          အောက်က form ကိုဖြည့်ပြီး ငွေလွှဲ screenshot တင်ပေးပါ။
        </p>
      )}
    </section>
  );
}
