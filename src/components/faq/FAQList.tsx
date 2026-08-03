"use client";

import { ErrorState } from "@/components/common/StatusState";
import { useLiveContent } from "@/hooks/useLiveContent";
import { fetchFaqData } from "@/services/content";
import type { FaqData } from "@/types/content";

import { FAQItem } from "./FAQItem";

type FAQListProps = {
  categorySlug: string;
  initialData: FaqData;
};

export function FAQList({ categorySlug, initialData }: FAQListProps) {
  const { value, status, error, refresh } = useLiveContent(
    initialData,
    fetchFaqData,
  );
  const section = value[categorySlug] || initialData[categorySlug];
  if (!section?.items.length) return null;

  return (
    <section className="faq-section" aria-labelledby={`${categorySlug}-faq-title`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Helpful answers</p>
          <h2 id={`${categorySlug}-faq-title`}>{section.title}</h2>
        </div>
      </div>
      {status === "error" ? (
        <div className="content-inline-error">
          <ErrorState
            title="Live FAQ update မရသေးပါ"
            message={`${error || "Network error"} နောက်ဆုံး build data ကို ပြထားပါတယ်။`}
            onRetry={refresh}
          />
        </div>
      ) : null}
      <div className="faq-list">
        {section.items.map((item, index) => (
          <FAQItem item={item} index={index} key={`${item.q}-${index}`} />
        ))}
      </div>
    </section>
  );
}
