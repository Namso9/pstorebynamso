import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderSummary } from "@/components/order/OrderSummary";
import { PaymentExperience } from "@/components/payment/PaymentExperience";
import { staticCatalog } from "@/lib/static-catalog";

export const metadata: Metadata = {
  title: "Payment Methods | Premium Store",
  description:
    "Premium Store ငွေပေးချေနည်းများ — KBZPay, WavePay, AyaPay QR ဖြင့် ငွေလွှဲပြီး screenshot ပို့ရုံဖြင့် ဝယ်ယူနိုင်သည်။",
  alternates: { canonical: "/payment/" },
  openGraph: {
    type: "website",
    url: "/payment/",
    title: "Payment Methods | Premium Store",
    description:
      "Premium Store ငွေပေးချေနည်းများ — KBZPay, WavePay, AyaPay QR ဖြင့် ငွေလွှဲပြီး screenshot ပို့ရုံဖြင့် ဝယ်ယူနိုင်သည်။",
    images: ["/images/p1.webp"],
  },
};

export default function PaymentPage() {
  return (
    <div className="content-page payment-page-next">
      <header className="content-hero">
        <h1>Payment Methods</h1>
      </header>
      <Suspense fallback={null}>
        <OrderSummary initialCatalog={staticCatalog} location="payment" />
        <PaymentExperience initialCatalog={staticCatalog} />
      </Suspense>
    </div>
  );
}
