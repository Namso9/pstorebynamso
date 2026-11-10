"use client";

import type { ProductFaq } from "@/data/productFaqs";
import { useLang } from "@/lib/i18n";
import { linkify } from "@/lib/linkify";

function answerParts(faq: ProductFaq) {
  const namedLinks = faq.links?.filter(link => link.label !== link.href && faq.answer.includes(link.label)) || [];
  const escaped = namedLinks.map(link => link.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = escaped.length ? faq.answer.split(new RegExp(`(${escaped.join("|")})`, "g")) : [faq.answer];
  return parts.flatMap((part, index) => {
    const named = namedLinks.find(link => link.label === part);
    if (named) return [<a key={`named-${index}`} href={named.href} target="_blank" rel="noopener noreferrer">{part}</a>];
    return linkify(part).map((piece, pieceIndex) => piece.href ? (
      <a key={`${index}-${pieceIndex}`} href={piece.href} target="_blank" rel="noopener noreferrer">{piece.text}</a>
    ) : piece.text);
  });
}

export default function ProductFaqs({ faqs }: { faqs: ProductFaq[] }) {
  const lang = useLang();
  if (!faqs.length) return null;

  return (
    <section className="detail-faqs" aria-labelledby="product-faq-title">
      <h2 id="product-faq-title">{lang === "mm" ? "\u1019\u1031\u1038\u101c\u1031\u1037\u101b\u103e\u102d\u101e\u100a\u1037\u103a \u1019\u1031\u1038\u1001\u103d\u1014\u103a\u1038\u1019\u103b\u102c\u1038" : "Frequently asked questions"}</h2>
      <div className="detail-faq-list">
        {faqs.map((faq, index) => (
          <details className="detail-faq" key={`${index}-${faq.question}`}>
            <summary>{faq.question}<span aria-hidden="true">+</span></summary>
            <div className="detail-faq-answer">
              <p>{answerParts(faq)}</p>
              {faq.links?.filter((link) => !faq.answer.includes(link.href) && !faq.answer.includes(link.label)).map((link) => (
                <a key={link.href} href={link.href} target={link.href.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer">{link.label}</a>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
