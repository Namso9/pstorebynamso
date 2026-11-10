"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const methods = [
  { id: "kpay", name: "KBZPay", icon: "kpayicon.webp", qr: "kpay-qr.webp", width: 864, height: 1280, scan: "KPay > Scan > Album > QR Photo" },
  { id: "wave", name: "WavePay", icon: "wavepayicon.webp", qr: "wavepay-qr.webp", width: 1066, height: 1192, scan: "WavePay > Scan > Gallery/Album > QR Photo" },
  { id: "aya", name: "AYA Pay", icon: "aya.webp", qr: "ayapay-qr.webp", width: 600, height: 1067, scan: "AYA Pay > Scan > Gallery/Album > QR Photo" },
];

export default function PaymentMethods() {
  const lang = useLang();
  const t = (en: string, mm: string) => lang === "mm" ? mm : en;
  const [selected, setSelected] = useState<string | null>(null);
  const method = methods.find((item) => item.id === selected);
  return (
    <>
      <Header light />
      <main className="info-page payment-page" lang={lang === "mm" ? "my" : "en"}>
        <div className="info-inner">
          <Link className="info-back" href="/">{t("Back to home", "\u1015\u1004\u103a\u1019\u1005\u102c\u1019\u103b\u1000\u103a\u1014\u103e\u102c")}</Link>
          <p className="info-eyebrow">Premium Store</p>
          <h1>{t("Payment methods", "\u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1031\u1014\u100a\u103a\u1038\u1019\u103b\u102c\u1038")}</h1>
          <p className="info-lead">{t("Choose how you'd like to pay. Save the QR image and scan it in your payment app.", "\u1021\u1006\u1004\u103a\u1015\u103c\u1031\u1010\u1032\u1037 \u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1031\u1014\u100a\u103a\u1038\u1000\u102d\u102f \u101b\u103d\u1031\u1038\u1015\u102b\u104b QR \u1015\u102f\u1036\u1000\u102d\u102f \u101e\u102d\u1019\u103a\u1038\u1015\u103c\u102e\u1038 \u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1031\u1019\u101a\u1037\u103a App \u1011\u1032\u1019\u103e\u102c Scan \u1016\u1010\u103a\u1015\u102b\u104b")}</p>

          <fieldset className="payment-choices">
            <legend>{t("Choose a payment method", "\u1004\u103d\u1031\u1015\u1031\u1038\u1001\u103b\u1031\u1014\u100a\u103a\u1038 \u101b\u103d\u1031\u1038\u1015\u102b")}</legend>
            <div className="payment-options">
              {methods.map((item) => (
                <label className="payment-option" key={item.id}>
                  <input type="radio" name="payment-method" value={item.id} checked={selected === item.id} onChange={() => setSelected(item.id)} aria-controls="payment-details" />
                  <Image src={`/payments/${item.icon}`} alt="" width={36} height={36} />
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div id="payment-details" aria-live="polite">
            {method && (
              <section className="info-panel payment-detail" aria-labelledby="payment-qr-title">
                <div className="payment-qr">
                  <h2 id="payment-qr-title">{method.name} QR</h2>
                  <Image unoptimized src={`/payments/${method.qr}`} alt={`${method.name} payment QR`} width={method.width} height={method.height} />
                  <a className="info-action" href={`/payments/${method.qr}`} download>{t("Save QR image", "QR \u1015\u102f\u1036 \u101e\u102d\u1019\u103a\u1038\u101b\u1014\u103a")}</a>
                </div>
                <div className="payment-instructions">
                  <h2>{t("How to pay", "\u1004\u103d\u1031\u101c\u103d\u103e\u1032\u1014\u100a\u103a\u1038")}</h2>
                  <p className="payment-scan">{method.scan}</p>
                  <p>{t('Write only "Payment" in the transfer note.', 'Note \u1019\u103e\u102c "Payment" \u101c\u102d\u102f\u1037\u1015\u1032 \u101b\u1031\u1038\u1015\u1031\u1038\u1015\u102b\u104b')}</p>
                  <p>{t("For VPN purchases, do not include VPN or related words in the note.", "VPN \u1021\u1010\u103d\u1000\u103a \u1004\u103d\u1031\u101c\u103d\u103e\u1032\u101b\u1004\u103a Note \u1019\u103e\u102c VPN \u1014\u1032\u1037\u1015\u1010\u103a\u101e\u1000\u103a\u1010\u1032\u1037 \u1005\u1000\u102c\u1038\u101c\u102f\u1036\u1038\u1010\u103d\u1031 \u1019\u1011\u100a\u1037\u103a\u1015\u102b\u1014\u1032\u1037\u104b")}</p>
                  <h3>{t("After your transfer", "\u1004\u103d\u1031\u101c\u103d\u103e\u1032\u1015\u103c\u102e\u1038\u101b\u1004\u103a")}</h3>
                  <p>{t("Send your payment screenshot on Telegram or Messenger, along with your product and plan.", "\u1004\u103d\u1031\u101c\u103d\u103e\u1032 Screenshot \u1000\u102d\u102f Product \u1021\u1019\u100a\u103a\u104a Plan \u1014\u1032\u1037\u1021\u1010\u1030 Telegram \u1012\u102b\u1019\u103e\u1019\u101f\u102f\u1010\u103a Messenger \u1019\u103e\u102c \u1015\u102d\u102f\u1037\u1015\u1031\u1038\u1015\u102b\u104b")}</p>
                  <div className="payment-actions">
                    <a className="info-action" href="https://t.me/Premiumstorezz" target="_blank" rel="noopener noreferrer">Telegram</a>
                    <a className="payment-link" href="https://www.messenger.com/t/happyyou2020" target="_blank" rel="noopener noreferrer">Messenger</a>
                  </div>
                </div>
              </section>
            )}
          </div>

          <section className="info-panel payment-bot">
            <h2>{t("Buying through the bot?", "Bot \u1000\u1014\u1031 \u101d\u101a\u103a\u1019\u101c\u102c\u1038")}</h2>
            <p>{t("Open the bot and follow its wallet top-up instructions. Send your screenshot there and wait for approval.", "Bot \u1011\u1032\u1000 Wallet \u1004\u103d\u1031\u1016\u103c\u100a\u1037\u103a\u1014\u100a\u103a\u1038\u1021\u1010\u102d\u102f\u1004\u103a\u1038 \u101c\u102f\u1015\u103a\u1015\u102b\u104b Screenshot \u1000\u102d\u102f Bot \u1011\u1032\u1019\u103e\u102c\u1015\u1032 \u1015\u102d\u102f\u1037\u1015\u103c\u102e\u1038 \u1021\u1010\u100a\u103a\u1015\u103c\u102f\u1015\u1031\u1038\u1010\u102c\u1000\u102d\u102f \u1005\u1031\u102c\u1004\u1037\u103a\u1015\u102b\u104b")}</p>
            <div className="payment-actions">
              <a className="info-action" href="https://t.me/PSNamso_bot" target="_blank" rel="noopener noreferrer">{t("Open Telegram bot", "Telegram bot \u1016\u103d\u1004\u1037\u103a\u101b\u1014\u103a")}</a>
              <Link className="payment-link" href="/how-to-use">{t("How to use", "\u1021\u101e\u102f\u1036\u1038\u1015\u103c\u102f\u1014\u100a\u103a\u1038")}</Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
