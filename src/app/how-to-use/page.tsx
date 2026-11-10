import type { Metadata } from "next";
import HowToUseGuide from "@/components/HowToUseGuide";

export const metadata: Metadata = {
  title: "How to Use - Premium Store",
  description: "Learn how to top up your Telegram bot wallet or place a manual order with Premium Store.",
};

export default function HowToUsePage() {
  return <HowToUseGuide />;
}
