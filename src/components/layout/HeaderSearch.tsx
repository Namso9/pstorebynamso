"use client";

import { usePathname } from "next/navigation";

import { ProductSearch } from "@/components/catalog/ProductSearch";

/**
 * The header's search icon, everywhere EXCEPT the home page.
 *
 * The home hero carries its own search-first field (`HomeSearch`, which
 * renders the same `ProductSearch` dialog with a field-style trigger), so a
 * header icon there would be a second door to the same dialog — the owner
 * asked for it to be removed on home only (2026-08-24). `usePathname` is
 * baked per route by the static export, so the prerendered HTML for `/`
 * simply has no search button in the header.
 */
export function HeaderSearch() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <ProductSearch />;
}
