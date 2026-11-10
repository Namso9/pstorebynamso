import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrendingThisWeek from "@/components/TrendingThisWeek";
import BrowseCategories from "@/components/BrowseCategories";
import BuyingGuidePrompt from "@/components/BuyingGuidePrompt";
import CompareSubs from "@/components/CompareSubs";
import CustomerReviews from "@/components/CustomerReviews";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  icons: { icon: "/images/pstore-favicon.svg" },
};

export default function Home() {
  return (
    <>
      <Header light />
      <Hero buttons="none" />
      <BrowseCategories />
      <BuyingGuidePrompt />
      <Reveal>
        <TrendingThisWeek />
      </Reveal>
      <CompareSubs />
      <CustomerReviews />
      <Footer />
    </>
  );
}
