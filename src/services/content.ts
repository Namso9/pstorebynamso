import type {
  ExpressGuideData,
  ExpressLocation,
  FaqData,
  FaqItemData,
  FaqSectionData,
  ReviewsData,
} from "@/types/content";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFaqItem(value: unknown): value is FaqItemData {
  return (
    isRecord(value) &&
    typeof value.q === "string" &&
    typeof value.a_html === "string"
  );
}

function isFaqSection(value: unknown): value is FaqSectionData {
  return (
    isRecord(value) &&
    typeof value.title === "string" &&
    Array.isArray(value.items) &&
    value.items.every(isFaqItem)
  );
}

export function parseFaqData(value: unknown): FaqData {
  if (!isRecord(value) || !Object.values(value).every(isFaqSection)) {
    throw new Error("FAQ data is invalid.");
  }
  return value as FaqData;
}

export function parseReviewsData(value: unknown): ReviewsData {
  if (
    !isRecord(value) ||
    !Array.isArray(value.images) ||
    !value.images.every((image) => typeof image === "string")
  ) {
    throw new Error("Reviews data is invalid.");
  }
  return value as ReviewsData;
}

function isExpressLocation(value: unknown): value is ExpressLocation {
  return (
    isRecord(value) &&
    typeof value.flag === "string" &&
    typeof value.country === "string" &&
    typeof value.city === "string" &&
    typeof value.ip === "string" &&
    typeof value.protocol === "string" &&
    (value.encryption === undefined || typeof value.encryption === "string") &&
    (value.natHeartbeats === undefined ||
      typeof value.natHeartbeats === "boolean")
  );
}

export function parseExpressGuideData(value: unknown): ExpressGuideData {
  if (
    !isRecord(value) ||
    typeof value.updated !== "string" ||
    !Array.isArray(value.locations) ||
    !value.locations.every(isExpressLocation)
  ) {
    throw new Error("ExpressVPN guide data is invalid.");
  }
  return value as ExpressGuideData;
}

async function fetchContent<T>(
  path: string,
  parser: (value: unknown) => T,
  signal?: AbortSignal,
) {
  const response = await fetch(path, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`${path} request failed with ${response.status}.`);
  return parser(await response.json());
}

export function fetchFaqData(signal?: AbortSignal) {
  return fetchContent("/data/faq.json", parseFaqData, signal);
}

export function fetchReviewsData(signal?: AbortSignal) {
  return fetchContent("/data/reviews.json", parseReviewsData, signal);
}

export function fetchExpressGuideData(signal?: AbortSignal) {
  return fetchContent(
    "/data/express-guide.json",
    parseExpressGuideData,
    signal,
  );
}
