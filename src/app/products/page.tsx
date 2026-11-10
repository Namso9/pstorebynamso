import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AllProductsGrid from "@/components/AllProductsGrid";
import CatalogNavigation from "@/components/CatalogNavigation";

export const metadata: Metadata = {
  title: "All Products - Premium Store",
  description: "Browse every Premium Store product by category.",
};

export default function ProductsPage() {
  return (
    <>
      <Header light />
      <main className="all-products-page">
        <div className="all-products-inner">
          <h1>Find Your Product</h1>
          <CatalogNavigation activeSlug="all" />
          <AllProductsGrid />
        </div>
      </main>
      <Footer />
    </>
  );
}
