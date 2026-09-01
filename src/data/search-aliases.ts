/**
 * Burmese and typo aliases for the catalog search (2026-08-24, homepage
 * redesign). Buyers type the name they SAY, not the name the panel publishes:
 * "နက်ဖလစ်", "chat gpt", "ကင်ဗာ". Each key maps to a lowercase term that is
 * guaranteed to appear in the product haystack (`name + subtitle + category
 * title`, lowercased — see ProductSearch.tsx), so an alias hit behaves exactly
 * like typing the English name.
 *
 * Storefront-owned: `products.json` is panel-written and has no alias field,
 * so the map lives here. Add a row when a product gains a common spoken name;
 * the target must stay a substring of the product's own text.
 */
const SEARCH_ALIASES: Record<string, string> = {
  // Netflix
  "နက်ဖလစ်": "netflix",
  netflex: "netflix",
  netfilx: "netflix",
  // ChatGPT
  "ချက်ဂျီပီတီ": "chatgpt",
  "ဂျီပီတီ": "chatgpt",
  "chat gpt": "chatgpt",
  chatgtp: "chatgpt",
  chatgbt: "chatgpt",
  gpt: "chatgpt",
  // Canva
  "ကင်ဗာ": "canva",
  canvas: "canva",
  // VPN (any)
  "ဗွီပီအင်": "vpn",
  // Spotify
  "စပေါ်တီဖိုင်း": "spotify",
  spotifi: "spotify",
  // YouTube
  "ယူတျုဗ်": "youtube",
  "ယူတျုပ်": "youtube",
  // CapCut
  "ကပ်ကတ်": "capcut",
  // Disney+
  "ဒစ်စနေး": "disney",
  // Prime Video
  "ပရိုင်း": "prime",
  // Gemini
  "ဂျီမီနီ": "gemini",
  // Grok
  "ဂရော့": "grok",
  // Adobe
  "အဒိုဘီ": "adobe",
  // Office 365
  "အော့ဖစ်": "office",
  // Windows keys
  "ဝင်းဒိုး": "windows",
  // Telegram Premium
  "တယ်လီဂရမ်": "telegram",
  // Zoom
  "ဇွန်း": "zoom",
  // Tidal
  "တိုင်ဒယ်": "tidal",
  // Bioscope
  "ဘိုင်စကုတ်": "bioscope",
  // Mytel / Atom data
  "မိုင်းတယ်": "mytel",
  "အေတမ်": "atom",
  // Meitu
  "မေတူ": "meitu",
  // Duolingo
  "ဒူအိုလင်ဂို": "duolingo",
  // Snapchat
  "စနက်ချက်": "snapchat",
  "စနက်": "snapchat",
  "snap chat": "snapchat",
  snapchart: "snapchat",
  // Coursera
  "ကိုဆဲရာ": "coursera",
  "ကော့ဆဲရာ": "coursera",
  coursea: "coursera",
  cousera: "coursera",
};

/**
 * The query itself plus every alias target it triggers. An alias fires when
 * the query contains it ("chat gpt free" → chatgpt) or — from three
 * characters up — completes its beginning ("နက်ဖ" → netflix, "chat g" →
 * chatgpt), so a half-typed Burmese name still finds the product.
 */
export function expandSearchTerms(query: string): string[] {
  const terms = new Set([query]);
  for (const [alias, target] of Object.entries(SEARCH_ALIASES)) {
    if (query.includes(alias) || (query.length >= 3 && alias.startsWith(query))) {
      terms.add(target);
    }
  }
  return [...terms];
}
