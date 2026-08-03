import Link from "next/link";

import { Icon } from "@/components/common/Icon";

const channels = [
  { label: "Telegram Channel", href: "https://t.me/premiumstorebzzz" },
  {
    label: "Premium Store",
    href: "https://www.facebook.com/share/1MyXdbrK9s/?mibextid=wwXIfr",
  },
  {
    label: "Premium Store 2",
    href: "https://www.facebook.com/share/1C7LUKTbdt/?mibextid=wwXIfr",
  },
  {
    label: "Premium Store 3",
    href: "https://www.facebook.com/share/1Fdm6SB8GQ/?mibextid=wwXIfr",
  },
  {
    label: "Premium Store 2.0",
    href: "https://www.facebook.com/share/1GSXUU97JG/?mibextid=wwXIfr",
  },
  {
    label: "Movie For You",
    href: "https://www.facebook.com/share/1HigTwYwir/?mibextid=wwXIfr",
  },
];

export function OfficialChannels({ includeTerms = false }: { includeTerms?: boolean }) {
  return (
    <section className="official-channels" aria-labelledby="official-channels-title">
      <h2 id="official-channels-title">Official Channels &amp; Pages</h2>
      <div className="official-channel-grid">
        {channels.map((channel, index) => (
          <a
            className={index === 0 ? "official-channel--primary" : ""}
            href={channel.href}
            target="_blank"
            rel="noopener noreferrer"
            key={channel.href}
          >
            <Icon name={index === 0 ? "telegram" : "facebook"} />
            <span>{channel.label}</span>
          </a>
        ))}
      </div>
      {includeTerms ? (
        <div className="official-channels__terms">
          <Link href="/terms-of-service-vpn/" prefetch={false}>VPN Terms</Link>
          <span aria-hidden="true">|</span>
          <Link href="/terms-of-service/" prefetch={false}>Shop Terms</Link>
        </div>
      ) : null}
    </section>
  );
}

