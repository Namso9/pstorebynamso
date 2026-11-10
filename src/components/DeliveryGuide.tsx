"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const groups = [
  {
    title: ["Account details", "Email \u1014\u1032\u1037 Password \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1019\u101a\u103a"],
    products: ["Jump Jump VPN", "Let's VPN", "Happ VPN", "Proton VPN", "NordVPN", "Norton", "ChatGPT", "Super Grok", "Perplexity", "CapCut", "Picsart", "Meitu", "Tidal", "SoundCloud", "Spotify Individual", "Adobe", "QuillBot"],
    send: ["Send your product, plan, and payment screenshot.", "Product \u1021\u1019\u100a\u103a\u104a Plan \u1014\u1032\u1037 \u1004\u103d\u1031\u101c\u103d\u103e\u1032 Screenshot \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b"],
    receive: ["We send you the email and password to sign in. Keep them somewhere safe.", "\u1021\u101e\u102f\u1036\u1038\u1015\u103c\u102f\u101b\u1019\u101a\u1037\u103a Email \u1014\u1032\u1037 Password \u1000\u102d\u102f \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u1019\u101a\u103a\u104b \u1021\u1032\u1012\u102b\u1014\u1032\u1037 Login \u101d\u1004\u103a\u1015\u103c\u102e\u1038 \u101e\u102f\u1036\u1038\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1015\u103c\u102e\u104b \u1014\u1031\u102c\u1000\u103a\u1019\u103e \u1015\u103c\u1014\u103a\u101e\u102f\u1036\u1038\u1016\u102d\u102f\u1037 \u101e\u102d\u1019\u103a\u1038\u1011\u102c\u1038\u1015\u1031\u1038\u1015\u102b\u104b"],
  },
  {
    title: ["Username", "Username \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u101b\u1019\u101a\u103a"],
    products: ["Snapchat+", "Telegram Premium"],
    send: ["Send your Snapchat or Telegram username with your product, plan, and payment screenshot.", "\u101d\u101a\u103a\u1019\u101a\u1037\u103a App \u1000 Username \u1000\u102d\u102f \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b Plan \u1014\u1032\u1037 \u1004\u103d\u1031\u101c\u103d\u103e\u1032 Screenshot \u101c\u100a\u103a\u1038 \u1010\u1005\u103a\u1001\u102b\u1010\u100a\u103a\u1038 \u1015\u102b\u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b"],
    receive: ["Your purchase will be applied to the username you provide.", "\u1015\u1031\u1038\u1011\u102c\u1038\u1010\u1032\u1037 Username \u101b\u1032\u1037 Account \u1021\u1010\u103d\u1000\u103a Premium \u101c\u102f\u1015\u103a\u1015\u1031\u1038\u1015\u102b\u1019\u101a\u103a\u104b"],
  },
  {
    title: ["Profile name", "Profile \u1021\u1019\u100a\u103a \u1015\u103c\u1031\u102c\u1015\u1031\u1038\u101b\u1019\u101a\u103a"],
    products: ["Netflix", "Disney+", "HBO Max", "Prime Video"],
    send: ["Send the profile name you'd like to use, along with your product, plan, and payment screenshot.", "Profile \u1019\u103e\u102c \u1011\u102c\u1038\u1001\u103b\u1004\u103a\u1010\u1032\u1037\u1021\u1019\u100a\u103a\u1000\u102d\u102f \u1015\u103c\u1031\u102c\u1015\u1031\u1038\u1015\u102b\u104b Product \u1021\u1019\u100a\u103a\u104a Plan \u1014\u1032\u1037 \u1004\u103d\u1031\u101c\u103d\u103e\u1032 Screenshot \u101c\u100a\u103a\u1038 \u1015\u102b\u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b"],
    receive: ["We'll set up your profile using the name you provide.", "\u1015\u103c\u1031\u102c\u1011\u102c\u1038\u1010\u1032\u1037\u1021\u1019\u100a\u103a\u1014\u1032\u1037 Profile \u101c\u102f\u1015\u103a\u1015\u1031\u1038\u1015\u102b\u1019\u101a\u103a\u104b"],
  },
  {
    title: ["Email invitation", "Email \u1000\u102d\u102f Invite \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1019\u101a\u103a"],
    products: ["Zoom", "Canva", "Grammarly"],
    send: ["Send the email address you use for that product.", "\u1021\u1032\u1012\u102e App \u1019\u103e\u102c Account \u1016\u103d\u1004\u1037\u103a\u1011\u102c\u1038\u1010\u1032\u1037 Email \u1000\u102d\u102f \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b"],
    receive: ["An invitation will arrive at that email address. Open it and accept the invitation to use your plan.", "\u1021\u1032\u1012\u102e Email \u1000\u102d\u102f Invite \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u1019\u101a\u103a\u104b \u101b\u1031\u102c\u1000\u103a\u101c\u102c\u1010\u1032\u1037 Mail \u1000\u102d\u102f \u1016\u103d\u1004\u1037\u103a\u1015\u103c\u102e\u1038 Invite \u1000\u102d\u102f Accept \u101c\u102f\u1015\u103a\u1015\u1031\u1038\u1015\u102b\u104b \u1015\u103c\u102e\u1038\u101b\u1004\u103a \u1005\u101e\u102f\u1036\u1038\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1015\u103c\u102e\u104b"],
  },
  {
    title: ["Mobile data", "Data \u1011\u100a\u1037\u103a\u1015\u1031\u1038\u1019\u101a\u103a"],
    products: ["Atom", "Mytel"],
    send: ["Send the SIM phone number and data plan. Check the number before sending.", "Data \u1011\u100a\u1037\u103a\u1001\u103b\u1004\u103a\u1010\u1032\u1037 \u1016\u102f\u1014\u103a\u1038\u1014\u1036\u1015\u102b\u1010\u103a\u1014\u1032\u1037 Data Plan \u1000\u102d\u102f \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b \u1019\u1015\u102d\u102f\u1037\u1001\u1004\u103a \u1016\u102f\u1014\u103a\u1038\u1014\u1036\u1015\u102b\u1010\u103a \u1019\u103e\u1014\u103a\u1019\u1019\u103e\u1014\u103a \u1015\u103c\u1014\u103a\u1005\u1005\u103a\u1015\u1031\u1038\u1015\u102b\u104b"],
    receive: ["The data is added to the phone number you provide.", "\u1015\u1031\u1038\u1011\u102c\u1038\u1010\u1032\u1037 \u1016\u102f\u1014\u103a\u1038\u1014\u1036\u1015\u102b\u1010\u103a\u1000\u102d\u102f Data \u1011\u100a\u1037\u103a\u1015\u1031\u1038\u1015\u102b\u1019\u101a\u103a\u104b"],
  },
];

export default function DeliveryGuide() {
  const lang = useLang();
  const index = lang === "mm" ? 1 : 0;
  const t = (en: string, mm: string) => index ? mm : en;
  return <>
    <Header light />
    <main className="info-page delivery-page" lang={index ? "my" : "en"}>
      <div className="info-inner">
        <Link className="info-back" href="/">{t("Back to home", "\u1015\u1004\u103a\u1019\u1005\u102c\u1019\u103b\u1000\u103a\u1014\u103e\u102c")}</Link>
        <p className="info-eyebrow">Premium Store</p>
        <h1>{t("Delivery of accounts", "\u101d\u101a\u103a\u1015\u103c\u102e\u1038\u101b\u1004\u103a \u1018\u101a\u103a\u101c\u102d\u102f\u101b\u1019\u101c\u1032")}</h1>
        <p className="info-lead">{t("What you need to send depends on the product. Include your product name, plan, and payment screenshot with every manual order.", "\u101d\u101a\u103a\u1010\u1032\u1037 Product \u1021\u101c\u102d\u102f\u1000\u103a \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u101b\u1019\u101a\u1037\u103a\u1021\u1001\u103b\u1000\u103a\u1010\u103d\u1031 \u1000\u103d\u102c\u1015\u102b\u1010\u101a\u103a\u104b Admin \u1000\u1014\u1031 \u1019\u103e\u102c\u101b\u1004\u103a Product \u1021\u1019\u100a\u103a\u104a Plan \u1014\u1032\u1037 \u1004\u103d\u1031\u101c\u103d\u103e\u1032 Screenshot \u1000\u102d\u102f \u1010\u1005\u103a\u1001\u102b\u1010\u100a\u103a\u1038 \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b")}</p>
        {groups.map((group) => <section className="info-panel delivery-group" key={group.products[0]}>
          <header><h2>{group.title[index]}</h2><p className="delivery-products">{group.products.join(" / ")}</p></header>
          <dl>
            <div><dt>{t("What to send", "\u1018\u102c\u1015\u102d\u102f\u1037\u1015\u1031\u1038\u101b\u1019\u101c\u1032")}</dt><dd>{group.send[index]}</dd></div>
            <div><dt>{t("What you receive", "\u1018\u101a\u103a\u101c\u102d\u102f\u101b\u1019\u101c\u1032")}</dt><dd>{group.receive[index]}</dd></div>
          </dl>
        </section>)}
        <section className="info-panel">
          <h2>{t("Buying a different product?", "\u1000\u102d\u102f\u101a\u103a\u101d\u101a\u103a\u1019\u101a\u1037\u103a App \u1000\u102d\u102f \u1019\u1010\u103d\u1031\u1037\u1018\u1030\u1038\u101c\u102c\u1038")}</h2>
          <p>{t("Check the FAQ on the product page for its delivery and setup instructions. If you're unsure what to send, ask us with the product name and plan.", "Product \u1005\u102c\u1019\u103b\u1000\u103a\u1014\u103e\u102c\u1000 FAQ \u1019\u103e\u102c \u1000\u103c\u100a\u1037\u103a\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b \u1018\u102c\u1015\u102d\u102f\u1037\u1015\u1031\u1038\u101b\u1019\u101c\u1032 \u1019\u101e\u1031\u1001\u103b\u102c\u101b\u1004\u103a Product \u1021\u1019\u100a\u103a\u1014\u1032\u1037 Plan \u1000\u102d\u102f \u1015\u103c\u1031\u102c\u1015\u103c\u102e\u1038 \u1019\u1031\u1038\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b")}</p>
          <a className="info-action" href="https://t.me/Premiumstorezz" target="_blank" rel="noopener noreferrer">{t("Ask on Telegram", "Telegram \u1019\u103e\u102c \u1019\u1031\u1038\u101b\u1014\u103a")}</a>
        </section>
      </div>
    </main>
    <Footer />
  </>;
}
