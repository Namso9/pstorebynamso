"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";

import { Modal } from "@/components/common/Modal";
import { ErrorState } from "@/components/common/StatusState";
import { useLiveContent } from "@/hooks/useLiveContent";
import { useRevealMotion } from "@/hooks/useRevealMotion";
import { fetchReviewsData } from "@/services/content";
import { publicAssetPath } from "@/services/catalog";
import type { ReviewsData } from "@/types/content";

export function ReviewGallery({ initialData }: { initialData: ReviewsData }) {
  const { value, status, error, refresh } = useLiveContent(
    initialData,
    fetchReviewsData,
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedImage =
    selectedIndex === null ? null : value.images[selectedIndex] || null;

  return (
    <>
      {status === "error" ? (
        <div className="content-inline-error">
          <ErrorState
            title="Live reviews update မရသေးပါ"
            message={`${error || "Network error"} နောက်ဆုံး build list ကို ပြထားပါတယ်။`}
            onRetry={refresh}
          />
        </div>
      ) : null}

      <div className="review-grid">
        {value.images.map((image, index) => (
          <ReviewCard
            image={image}
            index={index}
            onOpen={() => setSelectedIndex(index)}
            key={`${image}-${index}`}
          />
        ))}
      </div>

      <Modal
        open={Boolean(selectedImage)}
        onClose={() => setSelectedIndex(null)}
        title={
          selectedIndex === null
            ? "Customer review image"
            : `Customer Review ${selectedIndex + 1}`
        }
        className="review-lightbox"
      >
        {selectedImage ? (
          <div className="review-lightbox__image">
            <Image
              src={publicAssetPath(selectedImage)}
              alt={`Customer Review ${(selectedIndex || 0) + 1}`}
              fill
              sizes="min(92vw, 900px)"
              priority
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function ReviewCard({
  image,
  index,
  onOpen,
}: {
  image: string;
  index: number;
  onOpen: () => void;
}) {
  const revealMotion = useRevealMotion({
    delay: (index % 8) * 0.032,
    duration: 0.36,
    offset: 12,
    amount: 0.16,
  });

  return (
    <motion.button
      type="button"
      className="review-card"
      aria-label={`Customer Review ${index + 1} — ပုံအကြီး ကြည့်ရန်`}
      onClick={onOpen}
      {...revealMotion}
    >
      <Image
        src={publicAssetPath(image)}
        alt={`Customer Review ${index + 1}`}
        fill
        sizes="(max-width: 719px) 50vw, (max-width: 1023px) 33vw, 25vw"
      />
    </motion.button>
  );
}
