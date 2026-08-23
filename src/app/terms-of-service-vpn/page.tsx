import type { Metadata } from "next";

const sections = [
  {
    title: "1. Service Commitment",
    items: [
      "We strive to provide reliable VPN services and explore various ways to ensure uninterrupted service for our customers.",
      "Our responsibility is limited to maintaining the premium version of the purchased VPN account.",
    ],
  },
  {
    title: "2. Government Restrictions",
    items: [
      "VPN services may be restricted or prohibited by government authorities.",
      "While VPN providers like Express and LetsVPN are designed to withstand strict regulations (including those in China), we cannot always guarantee service in regions with total VPN bans.",
    ],
  },
  {
    title: "3. Refund Policy",
    items: [
      "We are not responsible for service interruptions or refunds if VPN usage is restricted due to government-imposed bans.",
      "At the time of purchase, the VPN service is fully operational, and we guarantee the usability of the premium version within the warranty period.",
    ],
  },
  {
    title: "4. Subscription Expiration and Reminders",
    items: [
      "Customers are responsible for establishing personal reminders for their subscription renewals.",
    ],
  },
  {
    title: "5. Acknowledgments",
    items: [
      "By purchasing our VPN services, you agree to these terms and conditions. Thank you for choosing our services. We value your trust and look forward to serving you.",
    ],
  },
];

export const metadata: Metadata = {
  title: "VPN Terms of Service | Premium Store",
  description:
    "Premium Store VPN ဝယ်ယူမှုဆိုင်ရာ စည်းမျဉ်းများ — VPN plan များအတွက် သီးသန့်သတ်မှတ်ချက်များ။",
  alternates: { canonical: "/terms-of-service-vpn/" },
  openGraph: {
    type: "article",
    url: "/terms-of-service-vpn/",
    title: "VPN Terms of Service | Premium Store",
    description:
      "Premium Store VPN ဝယ်ယူမှုဆိုင်ရာ စည်းမျဉ်းများ — VPN plan များအတွက် သီးသန့်သတ်မှတ်ချက်များ။",
    images: ["/images/og-cover.webp"],
  },
};

export default function VpnTermsPage() {
  return (
    <article className="content-page terms-document">
      <header className="terms-header">
        <p className="eyebrow">VPN policy</p>
        <h1>Terms &amp; Conditions For VPN Services</h1>
      </header>

      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </section>
      ))}

      <aside className="terms-disclaimer">
        <h2>Disclaimer</h2>
        <p>
          If there is any error, we will help our best to solve. But please keep
          in mind that we&apos;re not responsible for anything apart from Account
          Issues.
        </p>
      </aside>
    </article>
  );
}
