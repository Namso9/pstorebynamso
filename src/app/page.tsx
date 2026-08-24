import Image from "next/image";
import Link from "next/link";

import { HomeCatalog } from "@/components/catalog/HomeCatalog";
import { HomeSearch } from "@/components/catalog/HomeSearch";
import { AnimatedSection } from "@/components/common/AnimatedSection";
import { Icon } from "@/components/common/Icon";
import { OfficialChannels } from "@/components/content/OfficialChannels";
import { staticCatalog } from "@/lib/static-catalog";
import { staticPopularData } from "@/lib/static-content";

const trustItems = [
  {
    title: "Instant Bot Delivery",
    text: "Stock ရှိတဲ့ Digital Product များကို Telegram Bot ထဲမှာ Wallet Balance နဲ့ ချက်ချင်း ဝယ်ယူနိုင်ပါတယ်။",
    icon: "bolt" as const,
  },
  {
    title: "Local Payments",
    text: "KBZPay, WavePay, AYA Pay ဖြင့် လွယ်ကူလုံခြုံစွာ ငွေပေးချေနိုင်ပါတယ်။",
    icon: "credit-card" as const,
  },
  {
    title: "Verified Reviews",
    text: "Customer များ၏ Screenshot Review အစစ်အမှန်များကို ကြည့်ရှု စိတ်ချစွာ ဝယ်ယူနိုင်ပါတယ်။",
    icon: "reviews" as const,
  },
  {
    title: "Telegram Support",
    text: "အကူအညီလိုအပ်ပါက Telegram Channel နှင့် Bot မှတဆင့် အမြန် ဆက်သွယ်နိုင်ပါတယ်။",
    icon: "telegram" as const,
  },
];

const reviewImages = [
  { src: "/images/p9.webp", alt: "Customer review 1", width: 800, height: 800 },
  { src: "/images/review5.webp", alt: "Customer review 2", width: 700, height: 587 },
  { src: "/images/review7.webp", alt: "Customer review 3", width: 700, height: 587 },
  { src: "/images/review10.webp", alt: "Customer review 4", width: 700, height: 489 },
];

const botSteps = [
  "Wallet Top Up ဖြည့်ပါ",
  "Screenshot ပို့ပါ",
  "Admin Approve ပြီးရင် Balance ဝင်ပါမယ်",
  "Product ကို Bot ထဲမှာ ဝယ်ယူပါ",
];

const storeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://pstorebynamso.com/#organization",
      name: "Premium Store by Namso",
      url: "https://pstorebynamso.com/",
      logo: "https://pstorebynamso.com/images/brand-logo.png",
      foundingDate: "2020",
      areaServed: "MM",
      sameAs: [
        "https://t.me/premiumstorebzzz",
        "https://t.me/Premiumstorezz",
        "https://www.facebook.com/share/1MyXdbrK9s/?mibextid=wwXIfr",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://pstorebynamso.com/#website",
      url: "https://pstorebynamso.com/",
      name: "Premium Store by Namso",
      inLanguage: "my",
      publisher: { "@id": "https://pstorebynamso.com/#organization" },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(storeStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      {/* Search-first hero (2026-08-24 redesign): one solid brand band, a
          left-aligned headline, and the widest element on the page — the
          search field. No reveal animation here: the band IS the LCP. */}
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__inner">
          <h1 id="home-title">လိုချင်တဲ့ Premium App ကို ရှာဖွေဝယ်ယူပါ</h1>
          <p>
            Netflix, ChatGPT, VPN စတဲ့ premium apps &amp; subscriptions တွေကို
            စျေးနှုန်းချိုသာစွာ တစ်နေရာတည်းမှာ မှာယူနိုင်ပါတယ်။
          </p>
          <HomeSearch />
          <a
            className="home-hero__bot"
            href="https://t.me/PSNamso_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="telegram" /> Telegram Bot ကနေ ချက်ချင်းဝယ်ယူရန်
          </a>
        </div>
      </section>

      <div className="home-page">
        <AnimatedSection>
          <HomeCatalog
            initialCatalog={staticCatalog}
            initialPopular={staticPopularData}
          />
        </AnimatedSection>

      <AnimatedSection className="home-section">
        <div className="trust-grid">
          {trustItems.map((item) => (
            <article className="trust-card" key={item.title}>
              <span className="trust-card__icon"><Icon name={item.icon} /></span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="home-section review-preview">
        <div className="section-heading section-heading--inline">
          <div>
            <p className="eyebrow">Verified customers</p>
            <h2>Customer Reviews</h2>
          </div>
          <Link href="/reviews/" prefetch={false}>
            အားလုံးကြည့်ရန် <Icon name="arrow-right" />
          </Link>
        </div>
        <div className="review-strip">
          {reviewImages.map((review) => (
            <Image
              src={review.src}
              alt={review.alt}
              width={review.width}
              height={review.height}
              loading="eager"
              key={review.src}
            />
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="home-section bot-callout">
        <div className="bot-callout__copy">
          <span className="hero-badge"><Icon name="telegram" /> New Bot Checkout</span>
          <h2>Telegram Bot ထဲမှာ Wallet Top Up ဖြည့်ပြီး ပိုမြန်မြန်ဝယ်ယူနိုင်ပါပြီ</h2>
          <p>
            Admin reply စောင့်စရာမလိုဘဲ Bot ထဲမှာ Screenshot ပို့ပြီး Top Up
            ဖြည့်နိုင်ပါတယ်။ Stock ရှိတဲ့ Digital Product များကို Wallet Balance
            နဲ့ အလွယ်တကူ ဝယ်ယူနိုင်ပါပြီ။
          </p>
          <div className="bot-callout__actions">
            <a
              className="button button--primary button--lg"
              href="https://t.me/PSNamso_bot"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="telegram" /> Open Telegram Bot
            </a>
          </div>
        </div>
        <ol className="bot-steps">
          {botSteps.map((step) => (
            <li key={step}><Icon name="check" /><span>{step}</span></li>
          ))}
        </ol>
      </AnimatedSection>

      <AnimatedSection className="home-section purchase-guide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">How to buy</p>
            <h2>ဝယ်ယူရမည့် နည်းလမ်းများ</h2>
          </div>
        </div>
        <ol className="guide-steps">
          <li>လိုချင်တဲ့ Plan ကို ရွေးချယ်ပြီး နှိပ်ပါ။</li>
          <li>KBZPay, WavePay သို့မဟုတ် AYA Pay ကို ရွေးချယ်ပါ။</li>
          <li>ငွေလွှဲပြီး Screenshot ကို Order Form သို့မဟုတ် Telegram မှ ပို့ပါ။</li>
          <li>Manual order ကို ၁၅–၃၀ မိနစ်အတွင်း Admin က ပြန်ဆက်သွယ်ပါမယ်။</li>
        </ol>
        <div className="guide-actions">
          <Link className="button button--primary button--md" href="/payment/" prefetch={false}>
            Buy Now
          </Link>
          <a className="button button--secondary button--md" href="https://t.me/Premiumstorezz" target="_blank" rel="noopener noreferrer">
            Telegram Support
          </a>
          <a className="button button--secondary button--md" href="https://www.messenger.com/t/happyyou2020" target="_blank" rel="noopener noreferrer">
            Messenger
          </a>
        </div>
      </AnimatedSection>

      <AnimatedSection className="home-section">
        <OfficialChannels />
      </AnimatedSection>
      </div>
    </>
  );
}
