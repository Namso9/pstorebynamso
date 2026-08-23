import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "စာမျက်နှာ ရှာမတွေ့ပါ | PREMIUM STORE",
  robots: { index: false, follow: false },
};

const destinations = [
  { href: "/premium-vpn-apps/", label: "VPN Apps" },
  { href: "/streaming-apps/", label: "Streaming" },
  { href: "/ai-apps/", label: "AI Apps" },
  { href: "/mobile-data/", label: "Mobile Data" },
  { href: "/music-apps/", label: "Music" },
  { href: "/payment/", label: "Payment" },
  { href: "/order/", label: "Order Form" },
];

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <p className="not-found-code">404</p>
        <h1>စာမျက်နှာ ရှာမတွေ့ပါ</h1>
        <p>
          လင့်ခ် မှားနေတာ သို့မဟုတ် စာမျက်နှာ ရွှေ့ပြောင်းသွားတာ ဖြစ်နိုင်ပါတယ်။
          အောက်က လင့်ခ်တွေကနေ ဆက်သွားနိုင်ပါတယ်။
        </p>
        <div className="not-found-links">
          <Link className="button button--primary button--sm" href="/" prefetch={false}>
            Home
          </Link>
          {destinations.map((destination) => (
            <Link
              className="button button--secondary button--sm"
              href={destination.href}
              prefetch={false}
              key={destination.href}
            >
              {destination.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
