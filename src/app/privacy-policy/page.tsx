import type { Metadata } from "next";
import LegalPolicy from "@/components/LegalPolicy";

export const metadata: Metadata = {
  title: "Privacy Policy - Premium Store",
  description: "How Premium Store handles order details, support messages, website statistics, and browser storage.",
};

export default function PolicyPage() {
  return <LegalPolicy slug="privacy-policy" />;
}
