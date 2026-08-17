"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { motion } from "motion/react";

import { HapticSwitch } from "@/components/common/HapticSwitch";
import { CategoryCard } from "./CategoryCard";

import { categoryPresentations } from "@/data/category-presentations";
import { useCatalog } from "@/hooks/useCatalog";
import type { CatalogData } from "@/types/catalog";

type HomeCatalogProps = {
  initialCatalog: CatalogData;
};

const MotionLink = motion.create(Link);

export function HomeCatalog({ initialCatalog }: HomeCatalogProps) {
  const { catalog = initialCatalog, status, error, refresh } = useCatalog(initialCatalog);

  const counts = useMemo(
    () =>
      catalog.products.reduce<Record<string, number>>((result, product) => {
        result[product.category] = (result[product.category] || 0) + 1;
        return result;
      }, {}),
    [catalog],
  );

  return (
    <section className="home-section home-catalog" id="products" aria-label="Premium digital products">
      {status === "error" ? (
        <div className="catalog-notice" role="status">
          <span>Live update မရသေးပါ။ နောက်ဆုံး build data ကို ပြထားပါတယ်။</span>
          <button type="button" data-haptic="light" onClick={refresh}>
            Retry
            <HapticSwitch />
          </button>
          <span className="sr-only">{error}</span>
        </div>
      ) : null}

      <div className="category-grid">
        {catalog.categories.map((category, index) => (
          <CategoryCard
            category={category}
            image={
              categoryPresentations[category.slug]?.image ||
              `/images/p${index + 1}.webp`
            }
            productCount={counts[category.slug] || 0}
            priority={index < 2}
            index={index}
            key={category.slug}
          />
        ))}
        <MotionLink
          className="category-card category-card--guide"
          href="/expressvpn-location-guide/"
          prefetch={false}
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="category-card__media">
            <Image
              src="/images/express.svg"
              alt="ExpressVPN Location Guide"
              width={800}
              height={800}
            />
          </div>
          <div className="category-card__body">
            <div>
              <h3>Expressvpn Location Guide</h3>
              <p>အသေးစိတ် ကြည့်ရန် ပုံကိုနှိပ်ပါ</p>
            </div>
          </div>
        </MotionLink>
      </div>
    </section>
  );
}
