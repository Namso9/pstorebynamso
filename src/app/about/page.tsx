import type { Metadata } from "next";
import AboutStore from "@/components/AboutStore";

export const metadata: Metadata = {
  title: "About Premium Store",
  description: "From Windscribe VPN, Netflix, and Disney+ in 2020 to a growing range of digital products in one place. Read the Premium Store story.",
};

export default function AboutPage() {
  return <AboutStore />;
}
