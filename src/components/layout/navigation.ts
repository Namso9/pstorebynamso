import type { IconName } from "@/components/common/Icon";

export type NavigationItem = {
  href: string;
  label: string;
  icon: IconName;
};

export const primaryNavigation: NavigationItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/reviews/", label: "Reviews", icon: "reviews" },
  { href: "/payment/", label: "Payment", icon: "credit-card" },
];

export const shopNavigation = [
  { href: "/", label: "Home" },
  { href: "/payment/", label: "Payment Methods" },
  { href: "/reviews/", label: "Customer Reviews" },
  { href: "/order/", label: "Order Form" },
];

export const officialNavigation = [
  {
    href: "https://t.me/premiumstorebzzz",
    label: "Telegram Channel",
  },
  { href: "https://t.me/PSNamso_bot", label: "Telegram Bot" },
  { href: "https://t.me/Premiumstorezz", label: "Telegram Support" },
  {
    href: "https://www.facebook.com/share/1MyXdbrK9s/?mibextid=wwXIfr",
    label: "Facebook Page",
  },
];
