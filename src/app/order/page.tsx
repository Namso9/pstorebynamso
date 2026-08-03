import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderForm } from "@/components/order/OrderForm";
import { OrderSummary } from "@/components/order/OrderSummary";
import { staticCatalog } from "@/lib/static-catalog";

export const metadata: Metadata = {
  title: "Order Without Telegram | PREMIUM STORE",
  description:
    "Telegram မသုံးဘဲ website ကနေတိုက်ရိုက် order တင်နိုင်ပါသည်။ ငွေလွှဲ screenshot ကို ဒီမှာတင်ပါ။",
  alternates: { canonical: "/order/" },
  openGraph: {
    type: "website",
    url: "/order/",
    title: "Order Without Telegram | PREMIUM STORE",
    description:
      "Telegram မသုံးဘဲ website ကနေတိုက်ရိုက် order တင်နိုင်ပါသည်။ ငွေလွှဲ screenshot ကို ဒီမှာတင်ပါ။",
    images: ["/images/p1.webp"],
  },
};

export default function OrderPage() {
  return (
    <div className="content-page order-page-next">
      <Suspense fallback={null}>
        <OrderSummary initialCatalog={staticCatalog} location="order" />
        <OrderForm initialCatalog={staticCatalog} />
      </Suspense>
    </div>
  );
}
