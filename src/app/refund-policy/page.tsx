import type { Metadata } from "next";
import LegalPolicy from "@/components/LegalPolicy";

export const metadata: Metadata = {
  title: "Refund & Replacement Policy - Premium Store",
  description: "Premium Store's refund conditions, warranty and replacement policy, and how to request support.",
};

export default function PolicyPage() {
  return <LegalPolicy slug="refund-policy" />;
}
