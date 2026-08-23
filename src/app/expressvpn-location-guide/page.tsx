import type { Metadata } from "next";

import { OfficialChannels } from "@/components/content/OfficialChannels";
import { ExpressGuide } from "@/components/guides/ExpressGuide";
import { staticExpressGuideData } from "@/lib/static-content";

export const metadata: Metadata = {
  title: "Express VPN Location Guide | Premium Store",
  description:
    "ExpressVPN location ရွေးချယ်နည်း လမ်းညွှန် — Premium Store customer များအတွက် server location အသုံးပြုနည်း။",
  alternates: { canonical: "/expressvpn-location-guide/" },
  openGraph: {
    type: "article",
    url: "/expressvpn-location-guide/",
    title: "Express VPN Location Guide | Premium Store",
    description:
      "ExpressVPN location ရွေးချယ်နည်း လမ်းညွှန် — Premium Store customer များအတွက် server location အသုံးပြုနည်း။",
    images: ["/images/og-cover.webp"],
  },
};

export default function ExpressVpnGuidePage() {
  return (
    <div className="content-page express-guide-page">
      <header className="content-hero">
        <p className="eyebrow">Server setup</p>
        <h1>Express VPN Location Guide</h1>
      </header>
      <ExpressGuide initialData={staticExpressGuideData} />
      <p className="guide-thanks">အားပေးကြတဲ့ customer များအားလုံးကျေးဇူးပါဗျ 💕</p>
      <OfficialChannels includeTerms />
    </div>
  );
}
