"use client";

import Reveal from "@/components/Reveal";
import { STR, useLang } from "@/lib/i18n";

// aesop-style closing quote before the footer
export default function QuoteBlock() {
  const lang = useLang();
  const s = STR[lang].quote;
  return (
    <Reveal>
      <section className="quote">
        <p className="quote-text">{s.text}</p>
        <div className="quote-author">{s.author}</div>
      </section>
    </Reveal>
  );
}
