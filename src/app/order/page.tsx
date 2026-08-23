import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
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
    images: ["/images/og-cover.webp"],
  },
};

export default function OrderPage() {
  return (
    <div className="content-page order-page-next">
      {/* The same checkout step as /payment/, minus the QR panel — for
          customers who already transferred and only need to file the order. */}
      <Suspense fallback={null}>
        <CheckoutFlow initialCatalog={staticCatalog} />
      </Suspense>
    </div>
  );
}
