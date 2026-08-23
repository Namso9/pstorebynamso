import type { Metadata } from "next";

import { BioscopeDownloads } from "@/components/bioscope/BioscopeDownloads";
import { OfficialChannels } from "@/components/content/OfficialChannels";
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
    images: ["/images/bioscope.svg"],
  },
};

export default function BioscopeDownloadPage() {
  return (
    <div className="content-page bioscope-page">
      <BioscopeDownloads initialData={staticBioscopeDownloadData} />
      <OfficialChannels includeTerms />
    </div>
  );
}
