"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { isAskPricePlan } from "@/services/catalog";
import { resolveCatalogSelection } from "@/services/order";
import type { CatalogData } from "@/types/catalog";
import { HapticSwitch } from "@/components/common/HapticSwitch";

type PlatformId = "kpay" | "wave" | "aya";

/**
 * `formValue` must match one of the order form's payment options exactly \u2014 it
 * is what gets submitted, so a mismatch would silently blank the field.
 */
const platforms: Record<
  PlatformId,
  {
    label: string;
    formValue: string;
    icon: string;
    iconAlt: string;
    qr: string;
    qrAlt: string;
    width: number;
    height: number;
    instruction: string;
  }
> = {
  kpay: {
    label: "KBZPay",
    formValue: "KBZ Pay",
    icon: "/images/kpayicon.webp",
    iconAlt: "KBZPay Icon",
    qr: "/images/kpay-qr.webp?v=2",
    qrAlt: "KBZPay QR",
    width: 864,
    height: 1280,
    instruction: "KPay > Scan > Album > QR Photo",
  },
  wave: {
    label: "WavePay",
    formValue: "Wave Pay",
    icon: "/images/wavepayicon.webp",
    iconAlt: "WavePay Icon",
    qr: "/images/wavepay-qr.webp?v=2",
    qrAlt: "WavePay QR",
    width: 1066,
    height: 1192,
    instruction: "WavePay > Scan > Gallery/Album > QR Photo",
  },
  aya: {
    label: "AyaPay",
    formValue: "AYA Pay",
    icon: "/images/aya.webp",
    iconAlt: "AyaPay Icon",
    qr: "/images/ayapay-qr.webp",
    qrAlt: "AyaPay QR",
    width: 600,
    height: 1067,
    instruction: "AYA Pay > Scan > Gallery/Album > QR Photo",
  },
};

export function PaymentExperience({
  catalog,
  onPlatformChange,
}: {
  catalog: CatalogData;
  /** Reports the platform the customer actually scanned, to the step above. */
  onPlatformChange?: (formValue: string) => void;
}) {
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<PlatformId | "">("");
  const panelRef = useRef<HTMLDivElement>(null);
  const productId = searchParams.get("product");
  const planId = searchParams.get("plan");
  const selection = resolveCatalogSelection(catalog, productId, planId);
  const platform = selected ? platforms[selected] : null;

  const choosePlatform = (next: PlatformId) => {
    setSelected(next);
    onPlatformChange?.(platforms[next].formValue);
    window.requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  };

  if (selection?.plan && isAskPricePlan(selection.plan)) {
    return (
      <div className="payment-card-next checkout-unavailable" role="status">
        <p>&#4114;&#4142; plan &#4129;&#4112;&#4157;&#4096;&#4154; &#4100;&#4157;&#4145;&#4121;&#4124;&#4157;&#4158;&#4146;&#4097;&#4100;&#4154; &#4124;&#4096;&#4154;&#4123;&#4158;&#4141;&#4101;&#4155;&#4145;&#4152;&#4116;&#4158;&#4143;&#4116;&#4154;&#4152;&#4116;&#4146;&#4151; order availability &#4096;&#4141;&#4143; Admin &#4096;&#4141;&#4143; &#4129;&#4123;&#4100;&#4154;&#4121;&#4145;&#4152;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;</p>
        <div className="plan-contact-row">
          <a
            className="button button--primary button--md"
            href={catalog.settings.telegramChannel || "https://t.me/Premiumstorezz"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask on Telegram
          </a>
          <a
            className="button button--secondary button--md"
            href={catalog.settings.facebookPage || "https://www.messenger.com/t/happyyou2020"}
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-card-next">
      <p className="payment-warning-heading">
        &#9888;&#65039; <strong>&#4100;&#4157;&#4145;&#4121;&#4124;&#4157;&#4158;&#4146;&#4097;&#4100;&#4154; &#4126;&#4145;&#4097;&#4155;&#4140;&#4118;&#4112;&#4154;&#4117;&#4145;&#4152;&#4117;&#4139; &#4097;&#4100;&#4154;&#4119;&#4155;</strong>
      </p>
      <p>
        QR &#4096;&#4141;&#4143; Scan &#4118;&#4112;&#4154;&#4117;&#4156;&#4142;&#4152; Note &#4121;&#4158;&#4140; <strong>&quot;Payment&quot;</strong> &#4124;&#4141;&#4143;&#4151;&#4117;&#4146; &#4123;&#4145;&#4152;&#4117;&#4156;&#4142;&#4152;
        screenshot &#4117;&#4141;&#4143;&#4151;&#4117;&#4145;&#4152;&#4123;&#4100;&#4154; &#4123;&#4117;&#4139;&#4112;&#4122;&#4154;&#4097;&#4100;&#4154;&#4119;&#4155;&#4171;
      </p>
      <div className="vpn-payment-warning" role="note">
        &#10060; &#4101;&#4140;&#4126;&#4145;&#4097;&#4155;&#4140;&#4118;&#4112;&#4154;&#4117;&#4145;&#4152;&#4117;&#4139;&#4097;&#4119;&#4155; Vpn&#4129;&#4112;&#4157;&#4096;&#4154;&#4100;&#4157;&#4145;&#4124;&#4157;&#4158;&#4146;&#4121;&#4122;&#4151;&#4154; customer &#4121;&#4155;&#4140;&#4152; VPN &#4126;&#4141;&#4143;&#4151;&#4121;&#4127;&#4143;&#4112;&#4154;
        VPN &#4116;&#4158;&#4100;&#4151;&#4154;&#4117;&#4112;&#4154;&#4126;&#4096;&#4154;&#4126;&#4145;&#4140; &#4101;&#4096;&#4140;&#4152;&#4124;&#4143;&#4150;&#4152;&#4121;&#4155;&#4140;&#4152; &#4124;&#4143;&#4150;&#4152;&#4125;&#4121;&#4113;&#4106;&#4151;&#4154;&#4117;&#4139;&#4116;&#4146;&#4151; &#10060;
      </div>

      <section className="payment-selector-next" aria-labelledby="platform-title">
        <h2 id="platform-title">&#4100;&#4157;&#4145;&#4117;&#4145;&#4152;&#4097;&#4155;&#4145;&#4121;&#4106;&#4151;&#4154; Platform &#4096;&#4141;&#4143;&#4123;&#4157;&#4145;&#4152;&#4117;&#4139;</h2>
        <label htmlFor="payment-platform">Select Platform</label>
        <select
          id="payment-platform"
          value={selected}
          onChange={(event) => choosePlatform(event.target.value as PlatformId)}
        >
          <option value="" disabled>-- Platform &#4123;&#4157;&#4145;&#4152;&#4117;&#4139; --</option>
          <option value="kpay">KBZPay (KPay)</option>
          <option value="wave">WavePay</option>
          <option value="aya">AyaPay</option>
        </select>

        <div className="platform-buttons-next" aria-label="Platform quick select">
          {(Object.entries(platforms) as [PlatformId, (typeof platforms)[PlatformId]][]).map(
            ([id, item]) => (
              <button
                type="button"
                className={selected === id ? "platform-button-next platform-button-next--active" : "platform-button-next"}
                aria-pressed={selected === id}
                data-haptic="medium"
                onClick={() => choosePlatform(id)}
                key={id}
              >
                <Image src={item.icon} alt={item.iconAlt} width={30} height={30} />
                {item.label}
                <HapticSwitch />
              </button>
            ),
          )}
        </div>
      </section>

      <div ref={panelRef}>
        {platform ? (
          <section className="qr-panel-next" aria-live="polite">
            <div className="qr-panel-next__heading">
              <h2>{platform.label} QR</h2>
              <span>Selected: {platform.label}</span>
            </div>
            <p>{platform.instruction}</p>
            <p>Note &#4121;&#4158;&#4140; <strong>&quot;Payment&quot;</strong> &#4124;&#4141;&#4143;&#4151;&#4117;&#4146;&#4123;&#4145;&#4152;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;</p>
            <Image
              src={platform.qr}
              alt={platform.qrAlt}
              width={platform.width}
              height={platform.height}
            />
          </section>
        ) : null}
      </div>

      {platform ? (
        <section className="send-proof-next" aria-live="polite">
          {/* One route out of this step on purpose: the order form is the next
              thing on the page. Offering a Messenger/Telegram hand-off here
              sent paying customers off-site mid-checkout. */}
          <p>
            &#9989; <strong>{platform.label}</strong> &#4116;&#4146;&#4151; &#4100;&#4157;&#4145;&#4124;&#4157;&#4158;&#4146;&#4117;&#4156;&#4142;&#4152;&#4117;&#4139;&#4096; screenshot &#4096;&#4141;&#4143;
            Order Form &#4121;&#4158;&#4140; &#4117;&#4144;&#4152;&#4112;&#4157;&#4146;&#4117;&#4156;&#4142;&#4152; Order &#4112;&#4100;&#4154;&#4117;&#4145;&#4152;&#4117;&#4139;&#4171;
          </p>
          <p className="bot-note-next">
            &#129302; Telegram Bot &#4121;&#4158;&#4140; Wallet &#4118;&#4156;&#4106;&#4151;&#4154;&#4117;&#4156;&#4142;&#4152; &#4112;&#4116;&#4154;&#4152;&#4125;&#4122;&#4154;&#4124;&#4141;&#4143;&#4151;&#4124;&#4106;&#4154;&#4152; &#4123;&#4117;&#4139;&#4112;&#4122;&#4154;&#4171;
          </p>
          <a className="button button--primary button--md" href="https://t.me/PSNamso_bot" target="_blank" rel="noopener noreferrer">
            Open Telegram Bot (Top Up)
          </a>
        </section>
      ) : null}
    </div>
  );
}
