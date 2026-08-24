import type { CatalogProduct } from "@/types/catalog";

/**
 * Raster app icons that fill their tile edge to edge (2026-08-24 design pass).
 *
 * `atom.webp`, `mytel.webp` and `bioscope.webp` are the owner's real 256px app
 * icons — finished artwork with their own background, unlike the flat SVG
 * brand marks that need the glass tile's 7px inset and light squircle plate.
 * Listing an image here renders it full-bleed: the frame still clips to the
 * shared radius (`overflow: hidden`), so the tile keeps its exact size and
 * only the padding/plate treatment drops away.
 *
 * Keyed on the image PATH, not the product id: the panel owns `products.json`
 * and may point a different product at the same asset. `imageClass` stays the
 * panel's channel and is passed through untouched.
 */
const FULL_BLEED_LOGO_IMAGES = new Set([
  "images/atom.webp",
  "images/mytel.webp",
  "images/bioscope.webp",
]);

export function isFullBleedLogo(image: string): boolean {
  return FULL_BLEED_LOGO_IMAGES.has(image);
}

/** The `className` every product logo renders with, everywhere. */
export function productLogoClass(
  product: Pick<CatalogProduct, "image" | "imageClass">,
): string {
  return [
    "product-logo",
    product.imageClass,
    isFullBleedLogo(product.image) ? "product-logo--fullbleed" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
