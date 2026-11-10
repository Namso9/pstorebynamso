import importedFaqs from "@/data/product-faqs.json";

export type ProductFaq = {
  question: string;
  answer: string;
  links?: { label: string; href: string }[];
  source?: string;
};

// Use product slugs to keep each FAQ on its relevant product page.
export const productFaqs: Record<string, ProductFaq[]> = importedFaqs;
