import descriptions from "@/data/product-descriptions.json";

export type ProductDetails = {
  photo: string;
  content: string;
  // Add one checkout URL per plan, in the same order as the catalog plans.
  purchaseUrls: string[];
};

// Key entries by the product slug from /product/[slug].
// Missing fields stay empty until product content and ordering URLs are added.
export const productDetails: Record<string, Partial<ProductDetails>> = descriptions;
