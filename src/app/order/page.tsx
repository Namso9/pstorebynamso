import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderForm } from "@/components/order/OrderForm";
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
      {/* OrderForm owns the checkout rail and the order summary: the Done
          step depends on the submit result, which only it knows. */}
      <Suspense fallback={null}>
        <OrderForm initialCatalog={staticCatalog} />
      </Suspense>
    </div>
  );
}
