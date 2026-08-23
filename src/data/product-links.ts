/**
 * Storefront-owned links that hang off a panel-owned product.
 *
 * Same convention as `category-presentations.ts` and `home-highlights.ts`: the
 * catalog itself comes from panel-written `products.json`, so anything the
 * storefront adds around a product lives here rather than as a new field the
 * panel would have to learn to write.
 */
export type ProductGuideLink = {
  href: string;
  label: string;
};

export const productGuideLinks: Record<string, ProductGuideLink> = {
  bioscope: { href: "/bioscope-download/", label: "Download & install guide" },
};
