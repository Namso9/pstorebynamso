export type CategoryPresentation = {
  heading: string;
  pageSubtitle: string;
  metadataTitle: string;
  openGraphTitle: string;
  image: string;
};

export const categoryPresentations: Record<string, CategoryPresentation> = {
  "creative-apps": {
    heading: "Design and Creative Apps",
    pageSubtitle: "Premium Tools for Creators",
    metadataTitle: "Creative Apps — Canva, CapCut, Adobe | Premium Store by Namso",
    openGraphTitle: "Design & Creative Apps",
    image: "/images/p1.webp",
  },
  "music-apps": {
    heading: "Music Apps",
    pageSubtitle: "Choose your preferred plan",
    metadataTitle: "Music Apps — Spotify, Tidal, SoundCloud | Premium Store by Namso",
    openGraphTitle: "Music Apps Packages",
    image: "/images/p2.webp",
  },
  "communication-apps": {
    heading: "Communication Apps",
    pageSubtitle: "Connect with the World",
    metadataTitle:
      "Communication Apps — Zoom, Telegram Premium | Premium Store by Namso",
    openGraphTitle: "Communication Apps",
    image: "/images/p3.webp",
  },
  "streaming-apps": {
    heading: "Streaming Apps",
    pageSubtitle: "Premium Entertainment for You",
    metadataTitle:
      "Streaming Apps — Netflix, YouTube, Disney+ | Premium Store by Namso",
    openGraphTitle: "Streaming Apps",
    image: "/images/p4.webp",
  },
  "computer-keys-and-office-apps": {
    heading: "Computer Keys and Office Apps",
    pageSubtitle: "Licenses & Subscriptions",
    metadataTitle:
      "Computer Keys & Office — Windows, Office 365 | Premium Store by Namso",
    openGraphTitle: "Computer Keys & Office Apps",
    image: "/images/p5.webp",
  },
  "learning-apps": {
    heading: "Learning Apps",
    pageSubtitle: "Education & Productivity Tools",
    metadataTitle:
      "Learning Apps — Duolingo, Quillbot | Premium Store by Namso",
    openGraphTitle: "Learning Apps",
    image: "/images/p6.webp",
  },
  "ai-apps": {
    heading: "AI Apps",
    pageSubtitle: "Smart AI Assistants",
    metadataTitle:
      "AI Apps — ChatGPT, Gemini, Perplexity | Premium Store by Namso",
    openGraphTitle: "AI Apps",
    image: "/images/p7.webp",
  },
  "premium-vpn-apps": {
    heading: "Premium VPN Apps",
    pageSubtitle: "Secure & Fast Connection",
    metadataTitle:
      "Premium VPN Apps — ExpressVPN, NordVPN, Hiddify | Premium Store by Namso",
    openGraphTitle: "Premium VPN Apps",
    image: "/images/p8.webp",
  },
};
