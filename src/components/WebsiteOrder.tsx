"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useDetailProducts,useLiveCatalog } from "@/components/CatalogProvider";
import { telegramCheckoutHref } from "@/services/catalog";
import { deliveryField, MAX_RECEIPT, paymentMethods } from "@/lib/ordering";
import { useLang } from "@/lib/i18n";

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
  const available=Boolean(liveItem?.product.plans.some(p=>p.id===planId && !p.soldOut && !p.contact));
  const [engaged,setEngaged]=useState(false);
  const [payment, setPayment] = useState(paymentMethods[0].name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const screenshotInput = useRef<HTMLInputElement>(null);
  const [attachedScreenshot, setAttachedScreenshot] = useState<File | null>(null);
  const productId=item?.product.id || "";
  const needsMail=["zoom","zoom_business","canva","duolingo"].includes(productId) || planId.includes("cus_mail") || (productId==="gemini" && planId!=="18_months");
  const needsPassword=productId==="gemini" && planId!=="18_months";
  const field=needsMail ? {name:"email",label:"Email for your subscription",hint:"Use the email address for this subscription.",pattern:undefined} : deliveryField(slug);
  const botHref=order?.plan.bot && !order.plan.contact ? telegramCheckoutHref(catalog.settings,productId,planId) : null;
  const method = paymentMethods.find(p => p.name === payment)!;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !order || (!available && !engaged)) return;
    const form = new FormData(event.currentTarget);
    form.set("product_id",productId);
    form.set("plan_id",planId);
    form.set("product",[order.product.name,order.plan.label,order.plan.price].join(" - "));
    form.set("payment",payment === "KBZPay" ? "KBZ Pay" : payment === "WavePay" ? "Wave Pay" : payment);
    const delivery=String(form.get("delivery") || "");
    if(field?.name==="phone")form.set("phone",delivery);
    else if(field?.name==="email")form.set("customer_mail",delivery);
    else if(delivery)form.set("note",[String(form.get("note") || ""),`${field?.label}: ${delivery}`].filter(Boolean).join("; "));
    const file = form.get("screenshot");
    if (!(file instanceof File) || !file.size || file.size > MAX_RECEIPT) { setError("Please attach a payment screenshot under 8 MB."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/order", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.orderId) throw new Error(result.error || "Please contact the store to check your order.");
      setReference(result.orderId);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Please contact the store to check your order before submitting again."); }
    finally { setBusy(false); }
  }
  return <div className="info-inner website-order" lang={lang === "mm" ? "my" : "en"}>
    <Link className="info-back" href="/products">{t("Browse products", "Product \u1019\u103b\u102c\u1038 \u1000\u103c\u100a\u1037\u103a\u101b\u1014\u103a")}</Link>
    <p className="info-eyebrow">Premium Store</p>
    <h1>{t("Order on website", "Website \u1000\u1014\u1031 \u101d\u101a\u103a\u101b\u1014\u103a")}</h1>
    {reference ? <section className="info-panel" role="status">
      <h2>{t("Order received", "Order \u101b\u101b\u103e\u102d\u1015\u102b\u1015\u103c\u102e")}</h2>
      <p>{t("Your reference", "Order \u1014\u1036\u1015\u102b\u1010\u103a")}: <strong>{reference}</strong></p>
      <p>{t("Keep this reference and wait for confirmation. We will reply using the contact details you provided.", "Order \u1014\u1036\u1015\u102b\u1010\u103a\u1000\u102d\u102f \u101e\u102d\u1019\u103a\u1038\u1011\u102c\u1038\u1015\u103c\u102e\u1038 \u1021\u1010\u100a\u103a\u1015\u103c\u102f\u1001\u103b\u1000\u103a\u1000\u102d\u102f \u1005\u1031\u102c\u1004\u1037\u103a\u1015\u1031\u1038\u1015\u102b\u104b \u1016\u103c\u100a\u1037\u103a\u1011\u102c\u1038\u1010\u1032\u1037 Contact \u1000\u1014\u1031 \u1015\u103c\u1014\u103a\u1006\u1000\u103a\u101e\u103d\u101a\u103a\u1015\u1031\u1038\u1015\u102b\u1019\u101a\u103a\u104b")}</p>
      <Link className="info-action" href="/contact">Contact support</Link>
    </section> : <>
      <p className="info-lead">Choose your plan, pay with your preferred app, and send your order here.</p>
      {order?.plan.contact && <p className="order-notice" role="status">Please contact the store for the current price before paying.</p>}
      <form onSubmit={submit} onInput={() => { setEngaged(true); if (!baseline && item) setBaseline(item); }}>
        <fieldset disabled={busy} className="order-fields">
          <section className="info-panel"><h2>1. Your plan</h2>
            <label>Product<select name="product_id" required value={slug} onChange={event => { const next=detailProducts.find(p=>p.slug===event.target.value); setChoice({slug:event.target.value,planId:next?.product.plans[0]?.id || ""}); setBaseline(null); setEngaged(false); }}><option value="">Choose a product</option>{detailProducts.map(p => <option value={p.slug} key={p.slug}>{p.product.name}</option>)}</select></label>
            {item && <label>Plan<select name="plan_id" value={planId} onChange={event => { setChoice({slug,planId:event.target.value}); setBaseline(null); setEngaged(false); }}>{item.product.plans.map((p) => <option key={p.id} value={p.id} disabled={p.soldOut}>{p.label} - {p.price}{p.soldOut ? " (Out of stock)" : ""}</option>)}</select></label>}
            {order && <p className="order-total">Total <strong>{order.plan.price}</strong></p>}
            {order?.plan.soldOut && <p role="status">This plan is out of stock. Please choose another plan.</p>}
          </section>
          <section className="info-panel"><h2>2. Contact & delivery</h2>
            <label>Your name<input name="name" autoComplete="name" required maxLength={60} /></label>
            <label>Contact for delivery<input name="contact" required maxLength={40} placeholder="Enter your contact" aria-describedby="delivery-contact-help" /><small id="delivery-contact-help">Telegram username, Viber number or email.</small></label>
            {field && <label key={slug}>{field.label}<input name="delivery" type={field.name === "email" ? "email" : "text"} inputMode={field.name === "phone" ? "tel" : undefined} pattern={field.pattern} required maxLength={120} /><small>{field.hint}</small></label>}
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
          <button className="info-action" type="submit" disabled={busy || !order || (!available && !engaged)}>{busy ? "Sending your order..." : "Submit order"}</button>
        </fieldset>
      </form>
      <aside className="info-panel order-alternatives"><h2>Other ways to buy</h2><a href={botHref || "https://t.me/PSNamso_bot"} target="_blank" rel="noopener noreferrer">Shop with Telegram bot</a><a href="https://t.me/Premiumstorezz" target="_blank" rel="noopener noreferrer">Order with Telegram support</a></aside>
    </>}
  </div>;
}
