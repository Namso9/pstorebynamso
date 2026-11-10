import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./local-fonts.css";
import { VisitPing } from "@/components/common/VisitPing";
import { CatalogProvider } from "@/components/CatalogProvider";
import PageTransition from "@/components/PageTransition";

const masterpiece = localFont({
  src: "../fonts/MasterpieceYayChanZin.ttf",
  weight: "400",
  variable: "--font-mm",
  display: "swap",
});

const masterpieceStadium = localFont({
  src: "../fonts/MasterpieceStadium.ttf",
  weight: "400",
  variable: "--font-mm-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pstorebynamso.com"),
  title: "Premium Store - Digital Subscriptions",
  description: "Yearly plans for your favorite digital services at one simple price.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${masterpiece.variable} ${masterpieceStadium.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t;var l=localStorage.getItem("lang");document.documentElement.dataset.lang=l==="mm"?"mm":"en"}catch(e){}})();',
          }}
        />
      </head>
      <body><CatalogProvider><VisitPing /><PageTransition>{children}</PageTransition></CatalogProvider></body>
    </html>
  );
}
