import type { Metadata } from "next";
import PaymentMethods from "@/components/PaymentMethods";

export const metadata: Metadata = {
  title: "Payment Methods - Premium Store",
  description: "Pay for Premium Store subscriptions with KBZPay, WavePay, or AYA Pay.",
};

export default function PaymentMethodsPage() {
  return <PaymentMethods />;
}
