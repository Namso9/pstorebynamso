"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useDetailProducts,useLiveCatalog } from "@/components/CatalogProvider";
import { telegramCheckoutHref } from "@/services/catalog";
import { deliveryField, MAX_RECEIPT, paymentMethods } from "@/lib/ordering";
import { useLang } from "@/lib/i18n";

const TELEGRAM_ORDER_LINK = /^https:\/\/t\.me\/PSNamso_bot\?start=linkweb_[0-9a-f]{32}$/;
const VIBER_PHONE_PATTERN = "09[0-9]{7,9}|[+]95[0-9]{7,10}";

type Receipt = { orderId: string; telegramLink?: string; contactMethod: "telegram" | "viber" };

export default function WebsiteOrder() {
  const lang=useLang();
  const t=(en:string,mm:string)=>lang==="mm" ? mm : en;
  const query=useSearchParams();
  const detailProducts=useDetailProducts();
  const {catalog}=useLiveCatalog();
  const [choice,setChoice]=useState<{slug:string;planId:string}|null>(null);
  const [baseline,setBaseline]=useState<(typeof detailProducts)[number]|null>(null);
  const requested=query.get("product") || "";
  const slug=choice?.slug ?? detailProducts.find(p=>p.product.id===requested || p.slug===requested)?.slug ?? (baseline?.product.id===requested ? baseline.slug : "");
  const liveItem=detailProducts.find(p=>p.slug===slug);
  const item=liveItem || (baseline?.slug===slug ? baseline : undefined);
  const planId=choice?.planId ?? query.get("plan") ?? item?.product.plans[0]?.id ?? "";
  const planIndex=item?.product.plans.findIndex(p=>p.id===planId) ?? -1;
  const selectedPlan=item?.product.plans[planIndex] || baseline?.product.plans.find(p=>p.id===planId);
  const order=item && selectedPlan ? {...item,plan:selectedPlan} : null;
  const productUnavailable=Boolean(liveItem && liveItem.product.plans.length===0);
  const available=Boolean(liveItem?.product.plans.some(p=>p.id===planId && !p.soldOut && !p.contact));
  const [engaged,setEngaged]=useState(false);
  const [payment, setPayment] = useState(paymentMethods[0].name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const submissionStarted = useRef(false);
  const screenshotInput = useRef<HTMLInputElement>(null);
  const [attachedScreenshot, setAttachedScreenshot] = useState<File | null>(null);
  const productId=item?.product.id || "";
  const needsMail=["zoom","zoom_business","canva","duolingo"].includes(productId) || planId.includes("cus_mail") || (productId==="gemini" && planId!=="18_months");
  const needsDevices = productId === "netflix_phone";
  const needsPassword=productId==="gemini" && planId!=="18_months";
  const field=needsMail ? {name:"email",label:"Email for your subscription",hint:"Use the email address for this subscription.",pattern:undefined} : deliveryField(slug);
  const botHref=order?.plan.bot && !order.plan.contact ? telegramCheckoutHref(catalog.settings,productId,planId) : null;
  const method = paymentMethods.find(p => p.name === payment)!;
  useEffect(() => {
    if (receipt?.telegramLink) window.location.assign(receipt.telegramLink);
  }, [receipt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStarted.current || !order || productUnavailable || (!available && !engaged)) return;
    if (contactMethod !== "telegram" && contactMethod !== "viber") return;
    const form = new FormData(event.currentTarget);
    form.set("product_id",productId);
    form.set("plan_id",planId);
    form.set("product",[order.product.name,order.plan.label,order.plan.price].join(" - "));
    form.set("payment",payment === "KBZPay" ? "KBZ Pay" : payment === "WavePay" ? "Wave Pay" : payment);
    const delivery=String(form.get("delivery") || "");
    if(field?.name==="phone")form.set("phone",delivery);
    else if(field?.name==="email")form.set("customer_mail",delivery);
    else if(field?.name==="profile")form.set("profile_name",delivery);
    else if(delivery)form.set("note",[String(form.get("note") || ""),`${field?.label}: ${delivery}`].filter(Boolean).join("; "));
    const file = form.get("screenshot");
    if (!(file instanceof File) || !file.size || file.size > MAX_RECEIPT) { setError("Please attach a payment screenshot under 8 MB."); return; }
    submissionStarted.current = true;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/order", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.orderId) throw new Error(result.error || "Please contact the store to check your order.");
      const telegramLink = contactMethod === "telegram" && typeof result.telegramLink === "string" &&
        TELEGRAM_ORDER_LINK.test(result.telegramLink) ? result.telegramLink : undefined;
      setReceipt({ orderId: result.orderId, contactMethod, telegramLink });
    } catch (cause) {
      submissionStarted.current = false;
      setError(cause instanceof Error ? cause.message : "Please contact the store to check your order before submitting again.");
    }
    finally { setBusy(false); }
  }
  if (productUnavailable && !receipt) return <div className="info-inner website-order">
    <p className="info-eyebrow">Premium Store</p>
    <h1>{item?.product.name || "Product unavailable"}</h1>
    <p className="order-notice" role="status">Out of stock. No plans are currently available.</p>
    <Link className="info-action" href="/products/">Browse available products</Link>
  </div>;
  return <div className="info-inner website-order" lang={lang === "mm" ? "my" : "en"}>
    <Link className="info-back" href="/products">{t("Browse products", "Product \u1019\u103b\u102c\u1038 \u1000\u103c\u100a\u1037\u103a\u101b\u1014\u103a")}</Link>
    <p className="info-eyebrow">Premium Store</p>
    <h1>{t("Order on website", "Website \u1000\u1014\u1031 \u101d\u101a\u103a\u101b\u1014\u103a")}</h1>
    {receipt ? <section className="info-panel" role="status">
      <h2>{t("Order received", "Order \u101b\u101b\u103e\u102d\u1015\u102b\u1015\u103c\u102e")}</h2>
      <p>{t("Your reference", "Order \u1014\u1036\u1015\u102b\u1010\u103a")}: <strong>{receipt.orderId}</strong></p>
      {receipt.telegramLink ? <>
        <p>Tap Start in Telegram so our team can reply in your bot chat.</p>
        <a className="info-action" href={receipt.telegramLink}>Open Telegram</a>
      </> : receipt.contactMethod === "telegram" ? <>
        <p>Send your order ID to our Telegram support account.</p>
        <a className="info-action" href="https://t.me/Premiumstorezz" target="_blank" rel="noopener noreferrer">
          Contact Telegram support
        </a>
      </> : <p>Our team will contact you on Viber.</p>}
    </section> : <>
      <p className="info-lead">Choose your plan, pay with your preferred app, and send your order here.</p>
      {productUnavailable && <p className="order-notice" role="status">Out of stock. No plans are currently available.</p>}
      {order?.plan.contact && <p className="order-notice" role="status">Please contact the store for the current price before paying.</p>}
      <form onSubmit={submit} onInput={() => { setEngaged(true); if (!baseline && item) setBaseline(item); }}>
        <fieldset disabled={busy} className="order-fields">
          <section className="info-panel"><h2>1. Your plan</h2>
            <label>Product<select name="product_id" required value={slug} onChange={event => { const next=detailProducts.find(p=>p.slug===event.target.value); setChoice({slug:event.target.value,planId:next?.product.plans[0]?.id || ""}); setBaseline(null); setEngaged(false); }}><option value="">Choose a product</option>{detailProducts.map(p => <option value={p.slug} key={p.slug} disabled={!p.product.plans.length}>{p.product.name}{!p.product.plans.length ? " - Out of stock" : ""}</option>)}</select></label>
            {item && item.product.plans.length>0 && <label>Plan<select name="plan_id" value={planId} onChange={event => { setChoice({slug,planId:event.target.value}); setBaseline(null); setEngaged(false); }}>{item.product.plans.map((p) => <option key={p.id} value={p.id} disabled={p.soldOut}>{p.label} - {p.price}{p.soldOut ? " (Out of stock)" : ""}</option>)}</select></label>}
            {order && <p className="order-total">Total <strong>{order.plan.price}</strong></p>}
            {order?.plan.soldOut && <p role="status">This plan is out of stock. Please choose another plan.</p>}
          </section>
          <section className="info-panel"><h2>2. Contact & delivery</h2>
            <label>How should we contact you?
              <select name="contact_method" required value={contactMethod} onChange={event => setContactMethod(event.target.value)}>
                <option value="">Choose Telegram or Viber</option>
                <option value="telegram">Telegram</option>
                <option value="viber">Viber</option>
              </select>
            </label>
            {contactMethod === "telegram" && <small>Telegram opens after you place the order.</small>}
            {contactMethod === "viber" && <label>Viber phone number
              <input name="contact" type="tel" required pattern={VIBER_PHONE_PATTERN}
                maxLength={14} autoComplete="tel" placeholder="09xxxxxxxxx" />
            </label>}
            {field && <label key={slug}>{field.label}
              <input name="delivery" type={field.name === "email" ? "email" : "text"}
                inputMode={field.name === "phone" ? "tel" : undefined} pattern={field.pattern} required
                minLength={field.name === "profile" ? 2 : undefined} maxLength={field.name === "profile" ? 60 : 120} />
              <small>{field.hint}</small>
            </label>}
            {needsDevices && <label>Devices you will use
              <input name="devices" required minLength={2} maxLength={100}
                pattern="(?!.*(?:[Tt][Vv]|[Bb][Oo][Xx])).{2,}" title="Enter a phone, tablet or computer"
                placeholder="For example, iPhone and laptop" />
            </label>}
            {needsPassword && <label>Account password<input name="customer_pw" type="password" required maxLength={100} autoComplete="off" /></label>}
            <label>Note (optional)<textarea name="note" rows={3} maxLength={200} placeholder="Anything we should know about this order" /></label>
          </section>
          <section className="info-panel"><h2>3. Payment</h2>
            <label>Payment method<select name="payment" value={payment} onChange={event => setPayment(event.target.value)}>{paymentMethods.map(p => <option key={p.name}>{p.name}</option>)}</select></label>
            {available && order && !order.plan.soldOut && <details className="order-qr"><summary>Show {method.name} payment QR</summary>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={method.qr} alt={`${method.name} payment QR`} loading="lazy" />
              <a href={method.qr} download>Save QR image</a>
              <p>Pay {order.plan.price}. Write only &quot;Payment&quot; in the transfer note.</p>
            </details>}
            <label>Payment screenshot<input ref={screenshotInput} name="screenshot" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif" required onChange={event => { setAttachedScreenshot(event.currentTarget.files?.[0] || null); setError(""); }} /><small>JPG, PNG, WebP, GIF, HEIC or AVIF. Maximum 8 MB.</small></label>
            {attachedScreenshot && <div className="order-attachment" role="status"><span>Screenshot attached: <strong>{attachedScreenshot.name}</strong></span><button type="button" className="order-attachment-remove" aria-label="Remove payment screenshot" onClick={() => { if (screenshotInput.current) screenshotInput.current.value = ""; setAttachedScreenshot(null); }}>&times;</button></div>}
          </section>
          <label className="order-consent"><input type="checkbox" name="terms" value="accepted" required /> <span>I have checked my plan and payment, and agree to the <Link href="/terms-and-conditions/" target="_blank" rel="noopener noreferrer">terms</Link> and <Link href="/refund-policy/" target="_blank" rel="noopener noreferrer">refund policy</Link>. See how order details are used in our <Link href="/privacy-policy/" target="_blank" rel="noopener noreferrer">privacy policy</Link>.</span></label>
          <div className="order-honeypot" aria-hidden="true"><input name="extra_field_hp" tabIndex={-1} autoComplete="off" /></div>
          {error && <p className="order-notice" role="alert">{error}</p>}
          <button className="info-action" type="submit" disabled={busy || !order || productUnavailable || (!available && !engaged)}>{busy ? "Sending your order..." : contactMethod === "telegram" ? "Place order and open Telegram" : "Place order"}</button>
        </fieldset>
      </form>
      <aside className="info-panel order-alternatives"><h2>Other ways to buy</h2><a href={botHref || "https://t.me/PSNamso_bot"} target="_blank" rel="noopener noreferrer">Shop with Telegram bot</a><a href="https://t.me/Premiumstorezz" target="_blank" rel="noopener noreferrer">Order with Telegram support</a></aside>
    </>}
  </div>;
}
