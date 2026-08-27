import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { VisitPing } from "@/components/common/VisitPing";
import { PageLayout } from "@/components/layout/PageLayout";

import "./globals.css";

const themeBootstrapScript = `
(function () {
  var mode = "system";
  try {
    var stored = localStorage.getItem("ps-theme");
    if (stored === "light" || stored === "dark") mode = stored;
  } catch (_) {}
  var resolved = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : mode;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.style.colorScheme = resolved;
})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://pstorebynamso.com"),
  title: "PREMIUM STORE — Digital Products & Subscriptions",
  description:
    "Premium Store by Namso - Netflix, Spotify, VPN, AI apps နှင့် premium subscription များကို စျေးနှုန်းချိုသာစွာ ဝယ်ယူနိုင်သည်။ Telegram Bot ဖြင့် အလွယ်တကူ မှာယူပါ။",
  applicationName: "Premium Store by Namso",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
  icons: {
    icon: "/images/favicon.svg?v=3",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Premium Store by Namso",
    title: "PREMIUM STORE by Namso",
    description:
      "Netflix, Spotify, VPN, AI apps နှင့် premium subscription များ - Telegram Bot ဖြင့် အလွယ်တကူမှာယူပါ",
    images: ["/images/og-cover.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#070b12" },
  ],
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="my" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* A head stylesheet loads the font CSS in parallel with the app CSS;
            the old CSS `@import` chained the font request behind the whole
            globals bundle, delaying text paint on mobile. `display=swap` and
            the CSP style-src/font-src allowlists are unchanged. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router: this is the root layout, so the font loads for every route. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Noto+Sans+Myanmar:wght@400;500;600;700&display=swap"
        />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <VisitPing />
        <PageLayout>{children}</PageLayout>
      </body>
    </html>
  );
}
