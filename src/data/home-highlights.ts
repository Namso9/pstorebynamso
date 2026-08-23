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

export const homeSpotlights: HomeSpotlightItem[] = [
  {
    id: "bioscope",
    href: "/bioscope-download/",
    badge: "New",
    title: "Bioscope",
    text: "ဖုန်း, TV, PC အတွက် official download link များ ရောက်ပါပြီ။ Plan နှင့် စျေးနှုန်း မကြာမီ။",
    action: "Download page",
    image: "/images/bioscope.svg",
    imageAlt: "Bioscope",
    imageClass: "home-spotlight__logo",
  },
];

export const homeGuideCards: HomeGuideItem[] = [
  {
    id: "expressvpn-location-guide",
    href: "/expressvpn-location-guide/",
    title: "Expressvpn Location Guide",
    text: "အသေးစိတ် ကြည့်ရန် ပုံကိုနှိပ်ပါ",
    image: "/images/express.svg",
    imageAlt: "ExpressVPN Location Guide",
  },
];
