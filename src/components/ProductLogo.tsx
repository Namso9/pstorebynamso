import type { CSSProperties } from "react";
import { productImages } from "@/data/productImages";
import { productPresentation } from "@/data/productPresentation";
import type { CategoryProduct } from "@/lib/categoryPages";

const fullBleedImages = new Set([
  "atom.webp", "mytel.webp", "bioscope.webp", "meitu.webp",
  "happ.webp", "snapchat.webp", "coursera.webp",
]);

export default function ProductLogo({ product }: { product: CategoryProduct }) {
  const image = productImages[product.name] || product.logo;
  const classes = [
    productPresentation[product.name]?.imageClass,
    product.name === "Manus AI Agent" ? "manus-logo" : "",
    image && fullBleedImages.has(image.split("/").pop() || "") ? "fullbleed-logo" : "",
  ].filter(Boolean).join(" ");

  return (
    <span className="all-product-logo" style={{ "--product-brand": product.brand } as CSSProperties}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} className={classes} alt="" loading="lazy" decoding="async" />
      ) : (
        <span>{product.initials || product.name.slice(0, 2).toUpperCase()}</span>
      )}
    </span>
  );
}
