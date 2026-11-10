import { categoryPages, type CategoryPage } from "@/lib/categoryPages";
import { productHref } from "@/lib/productDetails";

const aliases: Record<string, string> = {
  // Netflix
  "\u1014\u1000\u103a\u1016\u101c\u1005\u103a": "netflix",
  netflex: "netflix",
  netfilx: "netflix",
  // ChatGPT
  "\u1001\u103b\u1000\u103a\u1002\u103b\u102e\u1015\u102e\u1010\u102e": "chatgpt",
  "\u1002\u103b\u102e\u1015\u102e\u1010\u102e": "chatgpt",
  "chat gpt": "chatgpt",
  chatgtp: "chatgpt",
  chatgbt: "chatgpt",
  gpt: "chatgpt",
  // Canva
  "\u1000\u1004\u103a\u1017\u102c": "canva",
  canvas: "canva",
  // VPN (any)
  "\u1017\u103d\u102e\u1015\u102e\u1021\u1004\u103a": "vpn",
  // Spotify
  "\u1005\u1015\u1031\u102b\u103a\u1010\u102e\u1016\u102d\u102f\u1004\u103a\u1038": "spotify",
  spotifi: "spotify",
  // YouTube
  "\u101a\u1030\u1010\u103b\u102f\u1017\u103a": "youtube",
  "\u101a\u1030\u1010\u103b\u102f\u1015\u103a": "youtube",
  // CapCut
  "\u1000\u1015\u103a\u1000\u1010\u103a": "capcut",
  // Disney+
  "\u1012\u1005\u103a\u1005\u1014\u1031\u1038": "disney",
  // Prime Video
  "\u1015\u101b\u102d\u102f\u1004\u103a\u1038": "prime",
  // Gemini
  "\u1002\u103b\u102e\u1019\u102e\u1014\u102e": "gemini",
  // Grok
  "\u1002\u101b\u1031\u102c\u1037": "grok",
  // Adobe
  "\u1021\u1012\u102d\u102f\u1018\u102e": "adobe",
  // Office 365
  "\u1021\u1031\u102c\u1037\u1016\u1005\u103a": "office",
  // Windows keys
  "\u101d\u1004\u103a\u1038\u1012\u102d\u102f\u1038": "windows",
  // Telegram Premium
  "\u1010\u101a\u103a\u101c\u102e\u1002\u101b\u1019\u103a": "telegram",
  // Zoom
  "\u1007\u103d\u1014\u103a\u1038": "zoom",
  // Tidal
  "\u1010\u102d\u102f\u1004\u103a\u1012\u101a\u103a": "tidal",
  // Bioscope
  "\u1018\u102d\u102f\u1004\u103a\u1005\u1000\u102f\u1010\u103a": "bioscope",
  // Mytel / Atom data
  "\u1019\u102d\u102f\u1004\u103a\u1038\u1010\u101a\u103a": "mytel",
  "\u1021\u1031\u1010\u1019\u103a": "atom",
  // Meitu
  "\u1019\u1031\u1010\u1030": "meitu",
  // Duolingo
  "\u1012\u1030\u1021\u102d\u102f\u101c\u1004\u103a\u1002\u102d\u102f": "duolingo",
  // Snapchat
  "\u1005\u1014\u1000\u103a\u1001\u103b\u1000\u103a": "snapchat",
  "\u1005\u1014\u1000\u103a": "snapchat",
  "snap chat": "snapchat",
  snapchart: "snapchat",
  // Coursera
  "\u1000\u102d\u102f\u1006\u1032\u101b\u102c": "coursera",
  "\u1000\u1031\u102c\u1037\u1006\u1032\u101b\u102c": "coursera",
  coursea: "coursera",
  cousera: "coursera",
};

export function searchProducts(rawQuery: string, pages: CategoryPage[] = categoryPages) {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return [];

  const terms = new Set([query]);
  for (const [alias, target] of Object.entries(aliases)) {
    if (query.includes(alias) || (query.length >= 3 && alias.startsWith(query))) {
      terms.add(target);
    }
  }

  return pages.flatMap((category) =>
    category.products.flatMap((product) => {
      const haystack = `${product.name} ${product.desc} ${category.name}`.toLocaleLowerCase();
      return [...terms].some((term) => haystack.includes(term))
        ? [{ ...product, category: category.name, href: productHref(product.name, product.id) }]
        : [];
    }),
  ).slice(0, 12);
}
