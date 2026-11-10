import type { Metadata } from "next";
import Resellers from "@/components/Resellers";

export const metadata: Metadata = {
  title: "Resellers - Premium Store",
  description: "Resell Zoom Pro, ExpressVPN, QuillBot, Spotify, and Snapchat+. Complete three purchases at regular prices, then contact our team for reseller pricing on future orders.",
};

export default function ResellersPage() {
  return <Resellers />;
}
