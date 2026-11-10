"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const products = ["Zoom Pro", "ExpressVPN", "QuillBot", "Spotify", "Snapchat+"];

export default function Resellers() {
  const mm = useLang() === "mm";
  const t = (en: string, my: string) => mm ? my : en;
  const steps = [
    {
      title: t("Make three purchases", "3 \u1000\u103c\u102d\u1019\u103a \u101d\u101a\u103a\u101a\u1030\u1015\u102b"),
      body: t("Complete your first three purchases at the regular price.", "\u1015\u1011\u1019 3 \u1000\u103c\u102d\u1019\u103a\u1000\u102d\u102f \u1015\u102f\u1036\u1019\u103e\u1014\u103a\u1005\u103b\u1031\u1038\u1014\u1032\u1037 \u101d\u101a\u103a\u101a\u1030\u1015\u1031\u1038\u1015\u102b\u104b"),
    },
    {
      title: t("Ask to become a reseller", "Reseller \u101c\u102f\u1015\u103a\u1001\u103b\u1004\u103a\u1000\u103c\u1031\u102c\u1004\u103a\u1038 \u1015\u103c\u1031\u102c\u1015\u1031\u1038\u1015\u102b"),
      body: t("After your third purchase, message our admin on Telegram and ask for reseller pricing.", "3 \u1000\u103c\u102d\u1019\u103a \u101d\u101a\u103a\u1015\u103c\u102e\u1038\u101b\u1004\u103a Telegram \u1019\u103e\u102c Admin \u1000\u102d\u102f Reseller \u101c\u102f\u1015\u103a\u1001\u103b\u1004\u103a\u1000\u103c\u1031\u102c\u1004\u103a\u1038 \u1015\u103c\u1031\u102c\u1015\u103c\u102e\u1038 Reseller \u1005\u103b\u1031\u1038 \u1019\u1031\u1038\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b"),
    },
    {
      title: t("Get special prices on future orders", "\u1014\u1031\u102c\u1000\u103a\u1021\u1000\u103c\u102d\u1019\u103a\u1010\u103d\u1031\u1019\u103e\u102c Reseller \u1005\u103b\u1031\u1038\u1014\u1032\u1037 \u101d\u101a\u103a\u1015\u102b"),
      body: t("Once your reseller status is confirmed, you'll receive special prices for later purchases. Ask our admin for the current reseller prices.", "Reseller \u1021\u1016\u103c\u1005\u103a \u1021\u1010\u100a\u103a\u1015\u103c\u102f\u1015\u103c\u102e\u1038\u101b\u1004\u103a \u1014\u1031\u102c\u1000\u103a\u101d\u101a\u103a\u1010\u1032\u1037\u1021\u1000\u103c\u102d\u1019\u103a\u1010\u103d\u1031\u1019\u103e\u102c \u1021\u1011\u1030\u1038\u1005\u103b\u1031\u1038\u1014\u1032\u1037 \u101b\u1015\u102b\u1019\u101a\u103a\u104b \u101c\u1000\u103a\u101b\u103e\u102d Reseller \u1005\u103b\u1031\u1038\u1010\u103d\u1031\u1000\u102d\u102f Admin \u1011\u1036\u1019\u103e\u102c \u1019\u1031\u1038\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b"),
    },
  ];
  return <>
    <Header light />
    <main className="info-page reseller-page" lang={mm ? "my" : "en"}>
      <div className="info-inner">
        <Link className="info-back" href="/">{t("Back to home", "\u1015\u1004\u1019\u1005\u102c\u1019\u103b\u1000\u103a\u1014\u103e\u102c")}</Link>
        <p className="info-eyebrow">Premium Store</p>
        <h1>Resellers</h1>
        <p className="info-lead">{t("Want to sell digital products to your own customers? Start with us and get reseller prices for future orders.", "Digital Product \u1010\u103d\u1031 \u1015\u103c\u1014\u103a\u101b\u1031\u102c\u1004\u103a\u1038\u1001\u103b\u1004\u103a\u101c\u102c\u1038\u104b Premium Store \u1019\u103e\u102c Reseller \u1021\u1016\u103c\u1005\u103a \u101d\u101a\u103a\u101a\u1030\u1015\u103c\u102e\u1038 \u1000\u102d\u102f\u101a\u1037\u103a Customer \u1010\u103d\u1031\u1000\u102d\u102f \u1015\u103c\u1014\u103a\u101b\u1031\u102c\u1004\u103a\u1038\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1010\u101a\u103a\u104b")}</p>
        <section className="reseller-products" aria-labelledby="reseller-products-title">
          <h2 id="reseller-products-title">{t("Products you can resell", "\u1015\u103c\u1014\u103a\u101b\u1031\u102c\u1004\u103a\u1038\u101c\u102d\u102f\u1037\u101b\u1010\u1032\u1037 Product \u1010\u103d\u1031")}</h2>
          <ul>{products.map(product => <li key={product}>{product}</li>)}</ul>
        </section>
        <section className="reseller-start" aria-labelledby="reseller-start-title">
          <h2 id="reseller-start-title">{t("How to get started", "\u1018\u101a\u103a\u101c\u102d\u102f \u1005\u101b\u1019\u101c\u1032")}</h2>
          <ol>{steps.map((step, index) => <li key={index}><span aria-hidden="true">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
        </section>
        <div className="reseller-actions">
          <a className="info-action" href="https://t.me/Premiumstorezz" target="_blank" rel="noopener noreferrer">{t("Ask about reseller pricing", "Reseller \u1005\u103b\u1031\u1038 \u1019\u1031\u1038\u101b\u1014\u103a")}</a>
          <Link href="/products">{t("Browse products", "Product \u1010\u103d\u1031 \u1000\u103c\u100a\u1037\u103a\u101b\u1014\u103a")}</Link>
        </div>
      </div>
    </main>
    <Footer />
  </>;
}
