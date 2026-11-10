"use client";

import { useLang } from "@/lib/i18n";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const translations: Record<string, string> = {
  "Back to home": "\u1015\u1004\u103a\u1019\u1005\u102c\u1019\u103b\u1000\u103a\u1014\u103e\u102c",
  "The buying guide": "\u101d\u101a\u103a\u101a\u1030\u101b\u1014\u103a \u101c\u1019\u103a\u1038\u100a\u103d\u103e\u1014\u103a",
  "How to use": "\u1021\u101e\u102f\u1036\u1038\u1015\u103c\u102f\u1014\u100a\u103a\u1038",
  "Buy through the Telegram bot or place an order with our team.": "Bot \u1000\u1014\u1031 \u1000\u102d\u102f\u101a\u103a\u1010\u102d\u102f\u1004\u103a \u101d\u101a\u103a\u1019\u101c\u102c\u1038\u104a Admin \u1000\u102d\u102f \u1019\u103e\u102c\u1019\u101c\u102c\u1038\u104b \u1021\u1006\u1004\u103a\u1015\u103c\u1031\u1010\u1032\u1037\u1014\u100a\u103a\u1038\u1014\u1032\u1037 \u101d\u101a\u103a\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b",
  "Choose a buying guide": "\u101d\u101a\u103a\u101a\u1030\u1014\u100a\u103a\u1038 \u101b\u103d\u1031\u1038\u1001\u103b\u101a\u103a\u1015\u102b",
  "Telegram bot guide": "Telegram bot \u1021\u101e\u102f\u1036\u1038\u1015\u103c\u102f\u1014\u100a\u103a\u1038",
  "Top up your wallet and shop": "Wallet \u1004\u103d\u1031\u1016\u103c\u100a\u1037\u103a\u1015\u103c\u102e\u1038 \u101d\u101a\u103a\u101a\u1030\u1015\u102b",
  "How to buy": "\u101d\u101a\u103a\u101a\u1030\u101b\u1019\u100a\u1037\u103a \u1014\u100a\u103a\u1038\u101c\u1019\u103a\u1038\u1019\u103b\u102c\u1038",
  "01 / Telegram bot": "01 / Telegram bot",
  "Buy with your bot wallet": "Bot \u1000\u1014\u1031 \u101d\u101a\u103a\u1014\u100a\u103a\u1038",
  "For products available in the bot. Top up first, then shop with your approved balance.": "Wallet \u1011\u1032 \u1004\u103d\u1031\u1016\u103c\u100a\u1037\u103a\u1011\u102c\u1038\u1015\u103c\u102e\u1038 Bot \u1011\u1032\u1019\u103e\u102c Stock \u101b\u103e\u102d\u1010\u1032\u1037 Product \u1010\u103d\u1031\u1000\u102d\u102f \u101d\u101a\u103a\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b",
  "Open the bot": "Bot \u1000\u102d\u102f \u1016\u103d\u1004\u1037\u103a\u1015\u102b",
  "Open @PSNamso_bot in Telegram and tap Start.": "Telegram \u1019\u103e\u102c @PSNamso_bot \u1000\u102d\u102f \u1016\u103d\u1004\u1037\u103a\u1015\u103c\u102e\u1038 Start \u1014\u103e\u102d\u1015\u103a\u1015\u102b\u104b",
  "Top up your wallet": "Wallet \u1004\u103d\u1031\u1016\u103c\u100a\u1037\u103a\u1015\u102b",
  "Follow the bot's top-up instructions and submit your payment screenshot.": "Bot \u1011\u1032\u1000 \u1004\u103d\u1031\u1016\u103c\u100a\u1037\u103a\u1014\u100a\u103a\u1038\u1021\u1010\u102d\u102f\u1004\u103a\u1038 \u1004\u103d\u1031\u101c\u103d\u103e\u1032\u1015\u103c\u102e\u1038 Screenshot \u1015\u102d\u102f\u1037\u1015\u102b\u104b",
  "Wait for approval": "\u1021\u1010\u100a\u103a\u1015\u103c\u102f\u1015\u1031\u1038\u1010\u102c\u1000\u102d\u102f \u1005\u1031\u102c\u1004\u1037\u103a\u1015\u102b",
  "Choose and buy": "\u101c\u102d\u102f\u1001\u103b\u1004\u103a\u1010\u102c \u101b\u103d\u1031\u1038\u101d\u101a\u103a\u1015\u102b",
  "Use your balance to purchase an in-stock product in the bot.": "Balance \u101d\u1004\u103a\u101c\u102c\u101b\u1004\u103a Bot \u1011\u1032\u1019\u103e\u102c Stock \u101b\u103e\u102d\u1010\u1032\u1037 Product \u1000\u102d\u102f \u101b\u103d\u1031\u1038\u101d\u101a\u103a\u1015\u102b\u104b",
  "Open Telegram bot": "Telegram bot \u1016\u103d\u1004\u1037\u103a\u101b\u1014\u103a",
  "02 / Manual order": "02 / Admin \u1000\u1014\u1031 \u1019\u103e\u102c\u101a\u1030\u101b\u1014\u103a",
  "Order with our team": "Admin \u1000\u1014\u1031 \u1019\u103e\u102c\u101a\u1030\u1014\u100a\u103a\u1038",
  "Choose your plan and send your payment proof to the store team.": "\u101d\u101a\u103a\u1001\u103b\u1004\u103a\u1010\u1032\u1037 Plan \u1000\u102d\u102f \u101b\u103d\u1031\u1038\u1015\u103c\u102e\u1038 Admin \u1000\u102d\u102f \u1019\u103e\u102c\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b",
  "Choose a plan": "Plan \u101b\u103d\u1031\u1038\u1015\u102b",
  "Find the product and subscription plan you want.": "\u101c\u102d\u102f\u1001\u103b\u1004\u103a\u1010\u1032\u1037 Product \u1014\u1032\u1037 Plan \u1000\u102d\u102f \u101b\u103d\u1031\u1038\u1015\u102b\u104b",
  "Choose how to pay": "\u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1031\u1014\u100a\u103a\u1038 \u101b\u103d\u1031\u1038\u1015\u102b",
  "Use KBZPay, WavePay, or AYA Pay.": "KBZPay, WavePay, AYA Pay \u1011\u1032\u1000 \u1021\u1006\u1004\u103a\u1015\u103c\u1031\u1010\u102c\u1014\u1032\u1037 \u1004\u103d\u1031\u101c\u103d\u103e\u1032\u1015\u102b\u104b",
  "Send payment proof": "\u1004\u103d\u1031\u101c\u103d\u103e\u1032 Screenshot \u1015\u102d\u102f\u1037\u1015\u102b",
  "Send the product name, selected plan (including duration), and payment screenshot together on Telegram.": "Product \u1021\u1019\u100a\u103a\u104a \u101b\u103d\u1031\u1038\u1011\u102c\u1038\u1010\u1032\u1037 Plan (\u101e\u1000\u103a\u1010\u1019\u103a\u1038\u1015\u102b) \u1014\u1032\u1037 \u1004\u103d\u1031\u101c\u103d\u103e\u1032 Screenshot \u1000\u102d\u102f Telegram \u1019\u103e\u102c Admin \u1000\u102d\u102f \u1010\u1005\u103a\u1001\u102b\u1010\u100a\u103a\u1038 \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b",
  "Wait for a reply": "Admin \u1021\u1000\u103c\u1031\u102c\u1004\u103a\u1038\u1015\u103c\u1014\u103a\u1010\u102c\u1000\u102d\u102f \u1005\u1031\u102c\u1004\u1037\u103a\u1015\u102b",
  "Expect a reply from our team in about 15-30 minutes.": "Admin \u1000 15-30 \u1019\u102d\u1014\u1005\u103a\u101c\u1031\u102c\u1000\u103a\u1021\u1010\u103d\u1004\u103a\u1038 \u1021\u1000\u103c\u1031\u102c\u1004\u103a\u1038\u1015\u103c\u1014\u103a\u1015\u1031\u1038\u1015\u102b\u1019\u101a\u103a\u104b",
  "Contact Telegram support": "Admin \u1000\u102d\u102f \u1006\u1000\u103a\u101e\u103d\u101a\u103a\u101b\u1014\u103a",
  "Need a hand?": "\u1021\u1000\u1030\u1021\u100a\u102e\u101c\u102d\u102f\u101b\u1004\u103a",
  "Ask our team.": "Admin \u1000\u102d\u102f \u1019\u1031\u1038\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a",
  "Have your product name, selected plan, and payment screenshot ready when asking about an order.": "\u1019\u103e\u102c\u1011\u102c\u1038\u1010\u102c\u1014\u1032\u1037\u1015\u1010\u103a\u101e\u1000\u103a\u1015\u103c\u102e\u1038 \u1019\u1031\u1038\u1001\u103b\u1004\u103a\u101b\u1004\u103a Product \u1021\u1019\u100a\u103a\u104a Plan \u1014\u1032\u1037 \u1004\u103d\u1031\u101c\u103d\u103e\u1032 Screenshot \u1000\u102d\u102f \u1015\u102b\u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b",
  "View payment methods": "\u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1031\u1014\u100a\u103a\u1038\u1019\u103b\u102c\u1038 \u1000\u103c\u100a\u1037\u103a\u101b\u1014\u103a",
  "Find support": "\u1021\u1000\u1030\u1021\u100a\u102e \u101b\u101a\u1030\u101b\u1014\u103a",
  "Browse products": "Product \u1019\u103b\u102c\u1038 \u1000\u103c\u100a\u1037\u103a\u101b\u1014\u103a",
  " (opens in a new tab)": " (Tab \u1021\u101e\u1005\u103a\u1010\u103d\u1004\u103a \u1016\u103d\u1004\u1037\u103a\u1019\u100a\u103a)",
  "Your wallet balance will be added once the top-up is approved.": "\u1021\u1010\u100a\u103a\u1015\u103c\u102f\u1015\u103c\u102e\u1038\u101b\u1004\u103a Wallet \u1011\u1032 Balance \u101d\u1004\u103a\u101c\u102c\u1015\u102b\u1019\u101a\u103a\u104b"
};

const guides = [
  {
    id: "telegram-bot",
    label: "01 / Telegram bot",
    title: "Buy with your bot wallet",
    description: "For products available in the bot. Top up first, then shop with your approved balance.",
    steps: [
      ["Open the bot", "Open @PSNamso_bot in Telegram and tap Start."],
      ["Top up your wallet", "Follow the bot's top-up instructions and submit your payment screenshot."],
      ["Wait for approval", "Your wallet balance will be added once the top-up is approved."],
      ["Choose and buy", "Use your balance to purchase an in-stock product in the bot."],
    ],
    action: "Open Telegram bot",
    href: "https://t.me/PSNamso_bot",
  },
  {
    id: "manual-order",
    label: "02 / Manual order",
    title: "Order with our team",
    description: "Choose your plan and send your payment proof to the store team.",
    steps: [
      ["Choose a plan", "Find the product and subscription plan you want."],
      ["Choose how to pay", "Use KBZPay, WavePay, or AYA Pay."],
      ["Send payment proof", "Send the product name, selected plan (including duration), and payment screenshot together on Telegram."],
      ["Wait for a reply", "Expect a reply from our team in about 15-30 minutes."],
    ],
    action: "Contact Telegram support",
    href: "https://t.me/Premiumstorezz",
  },
];

export default function HowToUseGuide() {
  const lang = useLang();
  const t = (en: string) => lang === "mm" ? translations[en] ?? en : en;
  return (
    <>
      <Header light />
      <main className="info-page how-page" lang={lang === "mm" ? "my" : "en"}>
        <div className="info-inner">
          <Link className="info-back" href="/">{t("Back to home")}</Link>
          <header className="how-heading">
            <p className="info-eyebrow">{t("The buying guide")}</p>
            <h1>{t("How to use")}</h1>
            <p className="info-lead">{t("Buy through the Telegram bot or place an order with our team.")}</p>
          </header>

          <section className="info-panel">
            <h2>{lang === "mm" ? "Website \u1000\u1014\u1031 \u101d\u101a\u103a\u101b\u1014\u103a" : "Order on website"}</h2>
            <p>Choose a product and plan, enter your contact and delivery details, then upload your payment screenshot. Keep the order reference and wait for confirmation.</p>
            <Link className="info-action" href="/order">Start an order</Link>
          </section>
          <nav className="how-paths" aria-label={t("Choose a buying guide")}>
            <a href="#telegram-bot"><span>01</span><strong>{t("Telegram bot guide")}</strong><small>{t("Top up your wallet and shop")}</small></a>
            <a href="#manual-order"><span>02</span><strong>{t("How to buy")}</strong><small>{t("Order with our team")}</small></a>
          </nav>

          {guides.map((guide) => (
            <section className="how-section" id={guide.id} key={guide.id} aria-labelledby={`${guide.id}-title`}>
              <div className="how-intro">
                <p className="info-eyebrow">{t(guide.label)}</p>
                <h2 id={`${guide.id}-title`}>{t(guide.title)}</h2>
                <p>{t(guide.description)}</p>
                <a className="info-action" href={guide.href} target="_blank" rel="noopener noreferrer">{t(guide.action)}<span className="how-sr-only">{t(" (opens in a new tab)")}</span></a>
              </div>
              <ol className="how-steps">
                {guide.steps.map(([title, body], index) => (
                  <li key={title}>
                    <span className="how-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <div><h3>{t(title)}</h3><p>{t(body)}</p></div>
                  </li>
                ))}
              </ol>
            </section>
          ))}

          <section className="how-help" aria-labelledby="how-help-title">
            <div>
              <p className="info-eyebrow">{t("Need a hand?")}</p>
              <h2 id="how-help-title">{t("Ask our team.")}</h2>
              <p>{t("Have your product name, selected plan, and payment screenshot ready when asking about an order.")}</p>
            </div>
            <div className="how-help-links">
              <Link href="/payment-methods">{t("View payment methods")}</Link>
              <Link href="/contact">{t("Find support")}</Link>
              <Link href="/products">{t("Browse products")}</Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
