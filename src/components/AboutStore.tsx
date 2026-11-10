"use client";

import Link from "next/link";
import { useLang } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutStore() {
  const mm = useLang() === "mm";
  const t = (en: string, my: string) => mm ? my : en;
  return (
    <>
      <Header light />
      <main className="info-page about-page" lang={mm ? "my" : "en"}>
        <div className="info-inner">
          <Link className="info-back" href="/">{t("Back to home", "\u1015\u1004\u103a\u1019\u1005\u102c\u1019\u103b\u1000\u103a\u1014\u103e\u102c")}</Link>
          <header className="about-heading">
            <p className="info-eyebrow">Premium Store / Since 2020</p>
            <h1>{t("Our story", "Premium Store \u1021\u1000\u103c\u1031\u102c\u1004\u103a\u1038")}</h1>
            <p className="info-lead">{t("More digital products. One familiar place.", "\u101c\u102d\u102f\u1001\u103b\u1004\u103a\u1010\u1032\u1037 Digital Product \u1010\u103d\u1031\u1000\u102d\u102f \u1010\u1005\u103a\u1014\u1031\u101b\u102c\u1010\u100a\u103a\u1038\u1019\u103e\u102c \u101d\u101a\u103a\u101c\u102d\u102f\u1037\u101b\u1016\u102d\u102f\u1037\u104b")}</p>
          </header>
          <section className="about-story" aria-labelledby="about-start">
            <div className="about-date">
              <span>2020</span>
              <h2 id="about-start">{t("Where we began", "\u1005\u1010\u1004\u103a\u1001\u1032\u1037\u1010\u102c\u1000\u1010\u1031\u102c\u1037")}</h2>
              <p>Windscribe VPN<br />Netflix<br />Disney+</p>
            </div>
            <div className="about-copy">
              <p>{t("Premium Store began in 2020 with just three services: Windscribe VPN, Netflix, and Disney+. Those first customers helped us build the business we have today.", "Premium Store \u1000\u102d\u102f 2020 \u1001\u102f\u1014\u103e\u1005\u103a\u1019\u103e\u102c Windscribe VPN, Netflix \u1014\u1032\u1037 Disney+ \u1010\u102d\u102f\u1037\u1000\u102d\u102f \u101b\u1031\u102c\u1004\u103a\u1038\u1001\u103b\u101b\u1004\u103a\u1038 \u1005\u1010\u1004\u103a\u1001\u1032\u1037\u1015\u102b\u1010\u101a\u103a\u104b \u1021\u1005\u1015\u102d\u102f\u1004\u103a\u1038\u1000\u1010\u100a\u103a\u1038\u1000 \u101a\u102f\u1036\u1000\u103c\u100a\u103a\u1015\u103c\u102e\u1038 \u1021\u102c\u1038\u1015\u1031\u1038\u1001\u1032\u1037\u1010\u1032\u1037 Customer \u1010\u103d\u1031\u1000\u103c\u1031\u102c\u1004\u1037\u103a \u1021\u1001\u102f\u101c\u102d\u102f \u1006\u1000\u103a\u101c\u102f\u1015\u103a\u101c\u102c\u1014\u102d\u102f\u1004\u103a\u1001\u1032\u1037\u1010\u102c\u1015\u102b\u104b")}</p>
              <p>{t("Today, you can find a wider range of digital products here, from streaming and music to AI tools, creative apps, and VPNs. We're continuing to add more, so you can find what you need in one place.", "\u1021\u1001\u102f\u1010\u1031\u102c\u1037 Streaming, Music, AI Tools, Creative Apps \u1014\u1032\u1037 VPN \u1010\u103d\u1031\u1021\u1015\u102b\u1021\u101d\u1004\u103a Digital Product \u1021\u1019\u103b\u102d\u102f\u1038\u1019\u103b\u102d\u102f\u1038\u1000\u102d\u102f \u1010\u1005\u103a\u1014\u1031\u101b\u102c\u1010\u100a\u103a\u1038\u1019\u103e\u102c \u101d\u101a\u103a\u101c\u102d\u102f\u1037\u101b\u1015\u102b\u1015\u103c\u102e\u104b \u101c\u102d\u102f\u1001\u103b\u1004\u103a\u1010\u102c\u1010\u103d\u1031 \u1015\u102d\u102f\u101b\u103d\u1031\u1038\u1001\u103b\u101a\u103a\u101c\u102d\u102f\u1037\u101b\u1021\u1031\u102c\u1004\u103a Product \u1021\u101e\u1005\u103a\u1010\u103d\u1031\u101c\u100a\u103a\u1038 \u1006\u1000\u103a\u1011\u100a\u1037\u103a\u1015\u1031\u1038\u1014\u1031\u1015\u102b\u1010\u101a\u103a\u104b")}</p>
              <h2>{t("What matters to us", "\u1000\u103b\u103d\u1014\u103a\u1010\u1031\u102c\u103a\u1010\u102d\u102f\u1037 \u1021\u101c\u1031\u1038\u1011\u102c\u1038\u1010\u102c")}</h2>
              <p>{t("We work to keep prices affordable and make buying straightforward. Good service matters just as much: helping you choose a suitable plan and answering questions when you need support.", "\u1005\u103b\u1031\u1038\u1014\u103e\u102f\u1014\u103a\u1038 \u101e\u1000\u103a\u101e\u102c\u1016\u102d\u102f\u1037\u1014\u1032\u1037 \u101d\u101a\u103a\u101b\u1010\u102c \u101c\u103d\u101a\u103a\u1000\u1030\u1016\u102d\u102f\u1037 \u1000\u103c\u102d\u102f\u1038\u1005\u102c\u1038\u1014\u1031\u1015\u102b\u1010\u101a\u103a\u104b \u1000\u102d\u102f\u1000\u103a\u100a\u102e\u1010\u1032\u1037 Plan \u101b\u103d\u1031\u1038\u101b\u102c\u1019\u103e\u102c \u1000\u1030\u100a\u102e\u1015\u1031\u1038\u1016\u102d\u102f\u1037\u1014\u1032\u1037 \u1021\u1000\u1030\u1021\u100a\u102e\u101c\u102d\u102f\u1010\u1032\u1037\u1021\u1001\u102b \u1019\u1031\u1038\u1019\u103c\u1014\u103a\u1038\u101c\u102d\u102f\u1037\u101b\u1016\u102d\u102f\u1037\u1000\u102d\u102f\u101c\u100a\u103a\u1038 \u1021\u101c\u1031\u1038\u1011\u102c\u1038\u1015\u102b\u1010\u101a\u103a\u104b")}</p>
            </div>
          </section>
          <section className="about-thanks" aria-labelledby="about-thanks-title">
            <h2 id="about-thanks-title">{t("Thank you for trusting us.", "\u101a\u102f\u1036\u1000\u103c\u100a\u103a\u1015\u103c\u102e\u1038 \u1021\u102c\u1038\u1015\u1031\u1038\u1010\u1032\u1037\u1021\u1010\u103d\u1000\u103a \u1000\u103b\u1031\u1038\u1007\u1030\u1038\u1010\u1004\u103a\u1015\u102b\u1010\u101a\u103a\u104b")}</h2>
            <p>{t("Whether you've been with us since 2020 or are visiting for the first time, thank you for choosing Premium Store.", "2020 \u1000\u1010\u100a\u103a\u1038\u1000 \u1021\u102c\u1038\u1015\u1031\u1038\u101c\u102c\u1010\u1032\u1037 Customer \u1010\u103d\u1031\u101b\u1031\u102c\u104a \u1021\u1001\u102f\u1019\u103e \u1005\u101d\u101a\u103a\u1010\u1032\u1037 Customer \u1010\u103d\u1031\u1000\u102d\u102f\u1015\u102b Premium Store \u1000\u102d\u102f \u101b\u103d\u1031\u1038\u1001\u103b\u101a\u103a\u1015\u1031\u1038\u1010\u1032\u1037\u1021\u1010\u103d\u1000\u103a \u1000\u103b\u1031\u1038\u1007\u1030\u1038\u1010\u1004\u103a\u1015\u102b\u1010\u101a\u103a\u104b")}</p>
            <div className="about-actions">
              <Link className="info-action" href="/products">{t("Explore products", "Product \u1010\u103d\u1031 \u1000\u103c\u100a\u1037\u103a\u101b\u1014\u103a")}</Link>
              <Link href="/contact">{t("Talk to us", "\u1006\u1000\u103a\u101e\u103d\u101a\u103a\u101b\u1014\u103a")}</Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
