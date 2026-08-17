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
 * `formValue` must match one of the order form's payment options exactly — it
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
        <p>ဒီ plan အတွက် ငွေမလွှဲခင် လက်ရှိစျေးနှုန်းနဲ့ order availability ကို Admin ကို အရင်မေးပေးပါ။</p>
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
        ⚠️ <strong>ငွေမလွှဲခင် သေချာဖတ်ပေးပါ ခင်ဗျ</strong>
      </p>
      <p>
        QR ကို Scan ဖတ်ပြီး Note မှာ <strong>&quot;Payment&quot;</strong> လို့ပဲ ရေးပြီး
        screenshot ပို့ပေးရင် ရပါတယ်ခင်ဗျ။
      </p>
      <div className="vpn-payment-warning" role="note">
        ❌ စာသေချာဖတ်ပေးပါခဗျ Vpnအတွက်ငွေလွှဲမယ့် customer များ VPN သို့မဟုတ်
        VPN နှင့်ပတ်သက်သော စကားလုံးများ လုံးဝမထည့်ပါနဲ့ ❌
      </div>

      <section className="payment-selector-next" aria-labelledby="platform-title">
        <h2 id="platform-title">ငွေပေးချေမည့် Platform ကိုရွေးပါ</h2>
        <label htmlFor="payment-platform">Select Platform</label>
        <select
          id="payment-platform"
          value={selected}
          onChange={(event) => choosePlatform(event.target.value as PlatformId)}
        >
          <option value="" disabled>-- Platform ရွေးပါ --</option>
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
            <p>Note မှာ <strong>&quot;Payment&quot;</strong> လို့ပဲရေးပေးပါ။</p>
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
            ✅ <strong>{platform.label}</strong> နဲ့ ငွေလွှဲပြီးပါက screenshot ကို
            Order Form မှာ ပူးတွဲပြီး Order တင်ပေးပါ။
          </p>
          <p className="bot-note-next">
            🤖 Telegram Bot မှာ Wallet ဖြည့်ပြီး တန်းဝယ်လို့လည်း ရပါတယ်။
          </p>
          <a className="button button--primary button--md" href="https://t.me/PSNamso_bot" target="_blank" rel="noopener noreferrer">
            Open Telegram Bot (Top Up)
          </a>
        </section>
      ) : null}
    </div>
  );
}
