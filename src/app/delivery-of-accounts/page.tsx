import type { Metadata } from "next";
import DeliveryGuide from "@/components/DeliveryGuide";

export const metadata: Metadata = {
  title: "Delivery of Accounts - Premium Store",
  description: "What to send with your order and how to receive your account, invitation, or mobile data.",
};

export default function DeliveryPage() {
  return <DeliveryGuide />;
}
