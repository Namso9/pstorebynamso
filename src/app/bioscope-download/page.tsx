import type { Metadata } from "next";

import { BioscopeDownloads } from "@/components/bioscope/BioscopeDownloads";
import { BioscopePlansCta } from "@/components/bioscope/BioscopePlansCta";
import { OfficialChannels } from "@/components/content/OfficialChannels";
import { staticCatalog } from "@/lib/static-catalog";
import { staticBioscopeDownloadData } from "@/lib/static-content";

const description =
  "Bioscope app ကို Android ဖုန်း, Android TV, Windows PC နှင့် Mac အတွက် official download link များဖြင့် install လုပ်နည်း — Premium Store by Namso.";

export const metadata: Metadata = {
  title: "Bioscope Download — Phone, TV & PC | Premium Store",
  description,
  alternates: { canonical: "/bioscope-download/" },
  openGraph: {
    type: "article",
    url: "/bioscope-download/",
    title: "Bioscope Download — Phone, TV & PC | Premium Store",
    description,
    // An OG card has to be a raster at ~1200x630 — Facebook and Telegram do
    // not render an SVG here, and the 96x96 app mark was never going to work.
    images: ["/images/og-cover.webp"],
  },
};

export default function BioscopeDownloadPage() {
  return (
    <div className="content-page bioscope-page">
      <BioscopeDownloads initialData={staticBioscopeDownloadData} />
      <BioscopePlansCta initialCatalog={staticCatalog} />
      <OfficialChannels includeTerms />
    </div>
  );
}
