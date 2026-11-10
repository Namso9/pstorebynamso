import { paymentHref } from "@/services/catalog";
import { detailProducts } from "@/lib/productDetails";

export const paymentMethods = [
  { name: "KBZPay", qr: "/payments/kpay-qr.webp" },
  { name: "WavePay", qr: "/payments/wavepay-qr.webp" },
  { name: "AYA Pay", qr: "/payments/ayapay-qr.webp" },
];
export const MAX_RECEIPT = 8 * 1024 * 1024;
export function orderHref(slug: string, plan = 0) {
  const item=detailProducts.find(p=>p.slug===slug);
  return item?.product.plans[plan] ? orderIdHref(item.product.id,item.product.plans[plan].id) : "/products/";
}
export function deliveryField(slug: string) {
  if (["atom-data", "mytel-data"].includes(slug)) return { name: "phone", label: "Data SIM phone number", hint: "Use the 09 number that should receive the data.", pattern: "09[0-9]{7,9}" };
  if (["canva-pro", "zoom-pro", "grammarly-premium"].includes(slug)) return { name: "email", label: "Email for your invitation", hint: "We will send the team invitation to this email.", pattern: undefined };
  if (["snapchat", "telegram-premium"].includes(slug)) return { name: "username", label: "Account username", hint: "Enter the username that should receive the subscription.", pattern: undefined };
  if (/^(netflix|disney|hbo-max|prime-video)/.test(slug)) return { name: "profile", label: "Preferred profile name", hint: "The name you would like on your streaming profile.", pattern: undefined };
  return null;
}
export function resolveOrder(slug: string, index: number) {
  const item = detailProducts.find(p => p.slug === slug);
  const plan = Number.isInteger(index) && index >= 0 ? item?.product.plans[index] : undefined;
  return item && plan ? { ...item, plan } : null;
}

export function orderIdHref(productId:string,planId:string){ return paymentHref(productId,planId).replace("/payment/", "/order/"); }
