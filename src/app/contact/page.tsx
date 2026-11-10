import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Contact Us - Premium Store",
  description: "Contact Premium Store through its official Telegram and Facebook channels.",
};

const channels = [
  { name: "Telegram support", detail: "Message our support account", href: "https://t.me/Premiumstorezz" },
  { name: "Telegram bot", detail: "Shop or manage wallet orders", href: "https://t.me/PSNamso_bot" },
  { name: "Telegram channel", detail: "Store news and updates", href: "https://t.me/premiumstorebzzz" },
  { name: "Facebook page", detail: "Visit our original store page", href: "https://www.facebook.com/share/1MyXdbrK9s/?mibextid=wwXIfr" },
  { name: "Messenger", detail: "Send us a Facebook message", href: "https://www.messenger.com/t/happyyou2020" },
];

export default function ContactPage() {
  return (
    <>
      <Header light />
      <main className="info-page">
        <div className="info-inner">
          <Link className="info-back" href="/">Back to home</Link>
          <p className="info-eyebrow">Premium Store</p>
          <h1>Contact us</h1>
          <p className="info-lead">Reach us through the official channels from our original store.</p>
          <div className="info-links">
            {channels.map((channel) => (
              <a href={channel.href} target="_blank" rel="noopener noreferrer" className="info-link" key={channel.name}>
                <span><strong>{channel.name}</strong><small>{channel.detail}</small></span>
                <span aria-hidden="true">&rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
