"use client";

import { useState } from "react";
import { productPresentation } from "@/data/productPresentation";
import ProductLogo from "@/components/ProductLogo";
import ProductPlansButton from "@/components/ProductPlansButton";
import { useCategoryPages } from "@/components/CatalogProvider";

export default function AllProductsGrid() {
  const categoryPages = useCategoryPages();
  const allProducts = categoryPages.flatMap((category) => category.products.map((product) => ({
  product,
  key: product.id,
  price: Math.min(...product.plans.filter((plan) => !plan.soldOut).flatMap((plan) => {
    const match = plan.price.match(/^([\d,]+) Ks$/);
    return match ? [Number(match[1].replaceAll(",", ""))] : [];
  })),
})));

  const [nameSort, setNameSort] = useState<"asc" | "desc" | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const hasPriceFilter = minPrice !== "" || maxPrice !== "";
  const invalidRange = minPrice !== "" && maxPrice !== "" && Number(minPrice) > Number(maxPrice);
  const filteredProducts = allProducts.filter(({ price }) => !hasPriceFilter || (
    Number.isFinite(price) && price >= (minPrice === "" ? 0 : Number(minPrice)) &&
    price <= (maxPrice === "" ? Infinity : Number(maxPrice))
  ));
  if (nameSort) filteredProducts.sort((a, b) => (nameSort === "asc" ? 1 : -1) * a.product.name.localeCompare(b.product.name, "en", { sensitivity: "base", numeric: true }));

  const clearFilters = () => {
    setNameSort(null);
    setMinPrice("");
    setMaxPrice("");
    setPriceOpen(false);
  };

  return (
    <>
      <div className="catalog-filters">
        <div className="catalog-filter-buttons" role="group" aria-label="Product filters">
          <button type="button" className={`catalog-name-sort${nameSort ? " active" : ""}`} aria-label={`Name ${nameSort === "desc" ? "Z to A" : "A to Z"}. Tap to sort ${nameSort === "asc" ? "Z to A" : "A to Z"}.`} onClick={() => setNameSort((value) => value === "asc" ? "desc" : "asc")}>
            Name
            <span key={nameSort || "default"} className={`catalog-sort-swap${nameSort ? " is-changing" : ""}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 8a8.5 8.5 0 0 0-14-3L3 8m0-5v5h5M4 16a8.5 8.5 0 0 0 14 3l3-3m0 5v-5h-5" /></svg>
              <span>{nameSort === "desc" ? "Z-A" : "A-Z"}</span>
            </span>
          </button>
          <button type="button" className={hasPriceFilter ? "active" : ""} aria-expanded={priceOpen} aria-controls="catalog-price-range" onClick={() => setPriceOpen((value) => !value)}>Price Range</button>
          <button type="button" className="catalog-clear-filters" onClick={clearFilters}>Clear All Filters</button>
        </div>
        {priceOpen && (
          <div id="catalog-price-range" className="catalog-price-range">
            <span>Starting price (MMK)</span>
            <label>Minimum<input type="number" min="0" step="1" inputMode="numeric" placeholder="No minimum" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /></label>
            <label>Maximum<input type="number" min="0" step="1" inputMode="numeric" placeholder="No maximum" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></label>
          </div>
        )}
        <p className="catalog-filter-status" role="status">{invalidRange ? "Minimum price must be less than or equal to maximum price." : `${filteredProducts.length} products`}</p>
      </div>
      <div className="all-products-grid">
        {filteredProducts.map(({ product, key }) => (
          <article className="all-product-card" key={key}>
            <ProductLogo product={product} />
            <strong className="all-product-name">{product.name}</strong>
            <span className="all-product-description">{productPresentation[product.name]?.subtitle || product.desc}</span>
            <ProductPlansButton product={product} />
          </article>
        ))}
      </div>
      {filteredProducts.length === 0 && !invalidRange && <div className="catalog-filter-empty">No products match this price range. <button type="button" onClick={clearFilters}>Clear All Filters</button></div>}
    </>
  );
}
