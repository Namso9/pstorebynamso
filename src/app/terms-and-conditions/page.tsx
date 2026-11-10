import type { Metadata } from "next";
import LegalPolicy from "@/components/LegalPolicy";

export const metadata: Metadata = {
  title: "Terms & Conditions - Premium Store",
  description: "VPN service terms, warranty coverage, restrictions, and renewal guidance for Premium Store.",
};

export default function PolicyPage() {
  return <LegalPolicy slug="terms-and-conditions" />;
}
