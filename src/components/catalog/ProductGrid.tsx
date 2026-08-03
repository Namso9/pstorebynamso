import type { CatalogProduct } from "@/types/catalog";

import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: CatalogProduct[];
  onViewPlans: (productId: string) => void;
};

export function ProductGrid({ products, onViewPlans }: ProductGridProps) {
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          product={product}
          onViewPlans={onViewPlans}
          index={index}
          key={product.id}
        />
      ))}
    </div>
  );
}
