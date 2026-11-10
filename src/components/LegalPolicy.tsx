"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLang } from "@/lib/i18n";
import policies from "@/data/legal-policies.json";

export type PolicySlug = keyof typeof policies;

const links: { slug: PolicySlug; en: string; mm: string }[] = [
  { slug: "terms-and-conditions", en: "Terms & Conditions", mm: "\u1005\u100a\u103a\u1038\u1000\u1019\u103a\u1038\u1001\u103b\u1000\u103a\u1019\u103b\u102c\u1038" },
  { slug: "privacy-policy", en: "Privacy Policy", mm: "\u1000\u102d\u102f\u101a\u103a\u101b\u1031\u1038\u1021\u1001\u103b\u1000\u103a\u1021\u101c\u1000\u103a \u1019\u1030\u101d\u102b\u1012" },
  { slug: "refund-policy", en: "Refund & Replacement", mm: "Refund \u1014\u1032\u1037 Replacement" },
];

export default function LegalPolicy({ slug }: { slug: PolicySlug }) {
  const lang = useLang();
  const policy = policies[slug][lang];
  const mm = lang === "mm";
  return (
    <>
      <Header light />
      <main className="info-page policy-page" lang={mm ? "my" : "en"}>
        <div className="info-inner policy-inner">
          <Link className="info-back" href="/">{mm ? "\u1015\u1004\u103a\u1019\u1005\u102c\u1019\u103b\u1000\u103a\u1014\u103e\u102c" : "Back to home"}</Link>
          <p className="info-eyebrow">Premium Store</p>
          <h1>{policy.title}</h1>
          <p className="policy-updated">
            {mm ? "\u1014\u1031\u102c\u1000\u103a\u1006\u102f\u1036\u1038 \u1015\u103c\u1004\u103a\u1006\u1004\u103a\u1011\u102c\u1038\u101e\u100a\u1037\u103a\u101b\u1000\u103a - " : "Last Updated: "}
            <time dateTime="2026-11-07">{mm ? "2026 \u1001\u102f\u1014\u103e\u1005\u103a\u104a \u1014\u102d\u102f\u101d\u1004\u103a\u1018\u102c 7 \u101b\u1000\u103a" : "November 7, 2026"}</time>
          </p>
          {policy.intro && <p className="policy-intro">{policy.intro}</p>}
          <nav className="policy-nav" aria-label={mm ? "\u1019\u1030\u101d\u102b\u1012\u1019\u103b\u102c\u1038" : "Store policies"}>
            {links.map(link => <Link key={link.slug} href={`/${link.slug}`} aria-current={slug === link.slug ? "page" : undefined}>{link[lang]}</Link>)}
          </nav>
          {policy.sections.map((section, index) => (
            <section key={index} id={slug === "privacy-policy" && index === 2 ? "browser-storage" : `section-${index + 1}`} aria-labelledby={`policy-heading-${index}`}>
              <h2 id={`policy-heading-${index}`}>{section.title}</h2>
              {section.paragraphs.map((text, i) => <p key={i}>{text}</p>)}
              {section.bullets.length > 0 && <ul>{section.bullets.map((text, i) => <li key={i}>{text}</li>)}</ul>}
              {slug === "terms-and-conditions" && index === 2 && <Link href="/refund-policy">{links[2][lang]}</Link>}
            </section>
          ))}
          <div className="policy-contact">
            <a className="info-action" href="https://t.me/Premiumstorezz" target="_blank" rel="noopener noreferrer">{mm ? "Telegram \u1019\u103e\u102c \u1006\u1000\u103a\u101e\u103d\u101a\u103a\u101b\u1014\u103a" : "Contact support on Telegram"}</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
