"use client";

import { useRef, useState } from "react";
import AnimatedDialog from "@/components/AnimatedDialog";
import reviews from "@/data/reviews.json";
import { useInfiniteCarousel } from "@/lib/useInfiniteCarousel";

const reviewImages = reviews.images.map((path) => `/${path}`);

export default function CustomerReviews() {
  const openerRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const { rowRef, move } = useInfiniteCarousel(reviewImages.length, 4000, selected === null);

  return (
    <section className="customer-reviews" aria-labelledby="customer-reviews-title">
      <div className="customer-reviews-head">
        <div>
          <p className="customer-reviews-eyebrow">Real customer feedback</p>
          <h2 id="customer-reviews-title">Our Customer Reviews</h2>
          <p>See what customers are saying about Premium Store.</p>
        </div>
        <div className="customer-reviews-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous reviews">Previous</button>
          <button type="button" onClick={() => move(1)} aria-label="Next reviews">Next</button>
        </div>
      </div>

      <div className="customer-reviews-content">
        <div className="customer-reviews-featured-wrap">
          <button type="button" className="customer-reviews-side-button" onClick={() => move(-1)} aria-label="Previous reviews">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <div className="customer-reviews-featured">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/p9.webp" alt="We love our customers" loading="lazy" decoding="async" />
          </div>
          <button type="button" className="customer-reviews-side-button" onClick={() => move(1)} aria-label="Next reviews">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>
        </div>
        <div
          className="customer-reviews-row"
          ref={rowRef}
        >
          {[0, 1, 2].flatMap((setIndex) => reviewImages.map((src, index) => (
            <button
              type="button"
              className="customer-review-card"
              key={`${setIndex}-${src}`}
              onClick={(event) => { openerRef.current = event.currentTarget; setSelected(index); }}
              aria-label={`Open customer review ${index + 1}`}
              aria-hidden={setIndex !== 1}
              tabIndex={setIndex === 1 ? 0 : -1}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Customer review ${index + 1}`} loading="lazy" />
            </button>
          )))}
        </div>
      </div>

      <AnimatedDialog
        variant="review"
        open={selected !== null}
        onClose={() => setSelected(null)}
        backdropClassName="customer-review-overlay"
        className="customer-review-dialog"
        label={`Customer review ${(selected ?? 0) + 1}`}
        returnFocusRef={openerRef}
      >
        <button
          type="button"
          className="customer-review-close"
          onClick={() => setSelected(null)}
          aria-label="Close review"
        >
          Close
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {selected !== null && <img src={reviewImages[selected]} alt={`Customer review ${selected + 1}`} />}
      </AnimatedDialog>
    </section>
  );
}
