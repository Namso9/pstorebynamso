/**
 * Extra entries on the home catalog that are not catalog categories.
 *
 * The catalog itself comes from panel-written `products.json`; anything the
 * storefront adds around it lives here so a new arrival or guide is one config
 * entry, not another hand-written card in `HomeCatalog`.
 */

/** A wide card above the category grid, for something new on the store. */
export type HomeSpotlightItem = {
  id: string;
  href: string;
  badge: string;
  title: string;
  text: string;
  action: string;
  image: string;
  imageAlt: string;
  imageClass?: string;
};

/** An extra tile inside the category grid, next to the catalog categories. */
export type HomeGuideItem = {
  id: string;
  href: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
};

/**
 * Deliberately EMPTY (owner's call, 2026-08-24): the wide card above the
 * category grid is gone, and that slot now belongs to `PopularProducts`.
 * Bioscope keeps its own tile inside the streaming category, its guide link
 * inside the plan modal, and its `/bioscope-download/` page.
 *
 * The array and `HomeSpotlight` are kept so a future arrival is one entry
 * again rather than a rebuilt card — do NOT re-add one without asking.
 */
export const homeSpotlights: HomeSpotlightItem[] = [];

export const homeGuideCards: HomeGuideItem[] = [
  {
    id: "expressvpn-location-guide",
    href: "/expressvpn-location-guide/",
    title: "Expressvpn Location Guide",
    text: "Server location ရွေးနည်း အသေးစိတ် လမ်းညွှန်",
    image: "/images/express.svg",
    imageAlt: "ExpressVPN Location Guide",
  },
];
