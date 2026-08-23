import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
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
    images: ["/images/og-cover.webp"],
  },
};

export default function PaymentPage() {
  return (
    <div className="content-page payment-page-next">
      <header className="content-hero">
        <h1>Payment Methods</h1>
      </header>
      {/* Transfer and proof-of-transfer are one step: the order form renders
          under the QR panel, so the customer never leaves this page. */}
      <Suspense fallback={null}>
        <CheckoutFlow initialCatalog={staticCatalog} withPayment />
      </Suspense>
    </div>
  );
}
