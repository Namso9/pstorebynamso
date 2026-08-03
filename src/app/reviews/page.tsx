import type { Metadata } from "next";
import Image from "next/image";

import { OfficialChannels } from "@/components/content/OfficialChannels";
import { ReviewGallery } from "@/components/reviews/ReviewGallery";
import { staticReviewsData } from "@/lib/static-content";

export const metadata: Metadata = {
  title: "Customer Reviews | Premium Store",
  description:
    "Premium Store customer reviews — ဝယ်ယူပြီးသော customer များ၏ သုံးသပ်ချက် screenshot များ။",
  alternates: { canonical: "/reviews/" },
  openGraph: {
    type: "website",
    url: "/reviews/",
    title: "Customer Reviews | Premium Store",
    description:
      "Premium Store customer reviews — ဝယ်ယူပြီးသော customer များ၏ သုံးသပ်ချက် screenshot များ။",
    images: ["/images/p1.webp"],
  },
};

export default function ReviewsPage() {
  return (
    <div className="content-page reviews-page">
      <header className="content-hero">
        <Image
          className="reviews-hero-image"
          src="/images/p9.webp"
          alt="We love our customers"
          width={800}
          height={800}
          priority
        />
        <p className="eyebrow">Real customer proof</p>
        <h1>Our Customer Reviews</h1>
        <p>Tap any image to zoom</p>
      </header>
      <section aria-label="Customer review screenshots">
        <ReviewGallery initialData={staticReviewsData} />
      </section>
      <OfficialChannels includeTerms />
    </div>
  );
}
