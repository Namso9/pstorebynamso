/**
 * One brand OpenGraph card for every page, 1200x630. It replaced the eight
 * 800x800 `images/p1..p8.webp` category photos, which cropped badly on social
 * and were retired with the card photos on 2026-08-23.
 */
export const BRAND_OG_IMAGE = "/images/og-cover.webp";
const OG_COVER = BRAND_OG_IMAGE;

export type CategoryPresentation = {
  heading: string;
  pageSubtitle: string;
  metadataTitle: string;
  openGraphTitle: string;
  /**
   * ⚠️ METADATA ONLY — this is the category page's OpenGraph image, nothing
   * else. It used to double as the home-grid card photo; the category tiles
   * went photo-free on 2026-08-23 (owner decision) and the index-based
   * `/images/p{n}.webp` fallback in `HomeCatalog` was deleted with them.
   * Do NOT wire this field back into a card.
   */
  openGraphImage: string;
};

/**
 * Storefront-owned presentation for a panel-owned category.
 *
 * A missing entry is NOT fatal: `src/app/[category]/page.tsx` falls back to the
 * category's own `title`/`subtitle` from `products.json`, so a slug the panel
 * publishes before this map catches up still renders a real page instead of a
 * 404. Entries here that `products.json` does not (yet) list are equally safe —
 * they simply pre-create the route.
 */
export const categoryPresentations: Record<string, CategoryPresentation> = {
  "streaming-apps": {
    heading: "Streaming Apps",
    pageSubtitle: "Premium Entertainment for You",
    metadataTitle:
      "Streaming Apps — Netflix, YouTube, Bioscope | Premium Store by Namso",
    openGraphTitle: "Streaming Apps",
    openGraphImage: OG_COVER,
  },
  "premium-vpn-apps": {
    heading: "Premium VPN Apps",
    pageSubtitle: "Secure & Fast Connection",
    metadataTitle:
      "Premium VPN Apps — ExpressVPN, NordVPN, Hiddify | Premium Store by Namso",
    openGraphTitle: "Premium VPN Apps",
    openGraphImage: OG_COVER,
  },
  "ai-apps": {
    heading: "AI Apps",
    pageSubtitle: "Smart AI Assistants",
    metadataTitle:
      "AI Apps — ChatGPT, Gemini, Perplexity | Premium Store by Namso",
    openGraphTitle: "AI Apps",
    openGraphImage: OG_COVER,
  },
  "mobile-data": {
    heading: "Mobile Data Packs",
    pageSubtitle: "Atom & Mytel data, straight to your SIM",
    metadataTitle:
      "Mobile Data — Atom & Mytel Data Packs | Premium Store by Namso",
    openGraphTitle: "Mobile Data Packs",
    openGraphImage: OG_COVER,
  },
  "music-apps": {
    heading: "Music Apps",
    pageSubtitle: "Choose your preferred plan",
    metadataTitle: "Music Apps — Spotify, Tidal, SoundCloud | Premium Store by Namso",
    openGraphTitle: "Music Apps Packages",
    openGraphImage: OG_COVER,
  },
  // Added 2026-09-01 with Snapchat+. The slug is bare `social`, not
  // `social-apps`: the owner's call, and `mobile-data` already shows the
  // suffix is not part of the contract.
  social: {
    heading: "Social Apps",
    pageSubtitle: "Premium Social Media Accounts",
    metadataTitle: "Social Apps — Snapchat+ | Premium Store by Namso",
    openGraphTitle: "Social Apps",
    openGraphImage: OG_COVER,
  },
  // The 2026-08-23 compaction merged communication-apps,
  // computer-keys-and-office-apps and learning-apps in here. The slug stays —
  // /creative-apps/ already ranks for Canva and CapCut — only the labels widen.
  "creative-apps": {
    heading: "Creative & Work Apps",
    pageSubtitle: "Premium tools for creating, working and studying",
    metadataTitle:
      "Creative & Work — Canva, CapCut, Meitu, Zoom, Office | Premium Store by Namso",
    openGraphTitle: "Creative & Work Apps",
    openGraphImage: OG_COVER,
  },
};

/**
 * One-line Burmese blurbs for the HOMEPAGE category tiles only (2026-08-24
 * redesign): a card is read, not decoded, so the tile says plainly what the
 * category holds. The panel-owned `categories[].subtitle` stays the category
 * PAGE's line and is the fallback for a slug this map has not caught up with.
 */
export const categoryCardDescriptions: Record<string, string> = {
  "streaming-apps": "Netflix, YouTube စတဲ့ ရုပ်ရှင် & Series app များ",
  "premium-vpn-apps": "လုံခြုံမြန်ဆန်စွာ သုံးနိုင်တဲ့ VPN app များ",
  "ai-apps": "ChatGPT, Gemini စတဲ့ AI tool များ",
  "mobile-data": "Atom & Mytel data pack များ",
  "music-apps": "Spotify, Tidal စတဲ့ ဂီတနားထောင် app များ",
  "creative-apps": "Canva, CapCut, Office စတဲ့ အလုပ်နှင့် ဒီဇိုင်း tool များ",
  social: "Snapchat+ စတဲ့ social media premium များ",
};

export function categoryCardDescription(slug: string, fallback: string): string {
  return categoryCardDescriptions[slug] || fallback;
}
