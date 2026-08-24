import type {
  BioscopeApp,
  BioscopeDeviceToken,
  BioscopeDownload,
  BioscopeDownloadData,
  BioscopeDownloadKind,
  BioscopeGroup,
  BioscopeGuide,
  BioscopeGuideStep,
  BioscopeStepImage,
  BioscopeStepKind,
  ExpressGuideData,
  ExpressLocation,
  FaqData,
  FaqItemData,
  FaqSectionData,
  PopularData,
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

/**
 * Panel-written, so it is parsed as untrusted input like every other live JSON.
 * A product id becomes a URL fragment and a DOM id, so the shape is pinned
 * tight; the cap stops a runaway list from being rendered at all.
 */
const POPULAR_ID_RE = /^[A-Za-z0-9_-]{1,60}$/;
const POPULAR_MAX_ITEMS = 20;

export function parsePopularData(value: unknown): PopularData {
  if (
    !isRecord(value) ||
    typeof value.updated !== "string" ||
    typeof value.window_days !== "number" ||
    !Number.isFinite(value.window_days) ||
    value.window_days <= 0 ||
    !Array.isArray(value.items) ||
    value.items.length > POPULAR_MAX_ITEMS ||
    !value.items.every(
      (item) => typeof item === "string" && POPULAR_ID_RE.test(item),
    ) ||
    new Set(value.items).size !== value.items.length
  ) {
    throw new Error("Popular products data is invalid.");
  }
  return value as PopularData;
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

export function fetchPopularData(signal?: AbortSignal) {
  return fetchContent("/data/popular.json", parsePopularData, signal);
}

export function fetchExpressGuideData(signal?: AbortSignal) {
  return fetchContent(
    "/data/express-guide.json",
    parseExpressGuideData,
    signal,
  );
}

// Download hrefs arrive over the same live JSON proxy as the rest of the
// content, so the page treats them as untrusted input: https only, and only
// the official app-distribution hosts. A typo or a tampered payload becomes a
// parse error that keeps the last good build data on screen instead of
// pointing a customer at an unrelated binary.
const BIOSCOPE_DOWNLOAD_HOSTS = new Set([
  "apps.apple.com",
  "bioscopeapp.com",
  "link.bioscopeapp.com",
  "play.google.com",
  "testflight.apple.com",
]);

const BIOSCOPE_DEVICE_TOKENS = new Set<BioscopeDeviceToken>([
  "android",
  "androidtv",
  "ios",
  "mac",
  "windows",
]);

const BIOSCOPE_DOWNLOAD_KINDS = new Set<BioscopeDownloadKind>([
  "apk",
  "dmg",
  "exe",
  "store",
  "testflight",
  "zip",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOfficialDownloadHref(value: unknown) {
  if (!isNonEmptyString(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && BIOSCOPE_DOWNLOAD_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

const BIOSCOPE_STEP_KINDS = new Set<BioscopeStepKind>([
  "note",
  "step",
  "warning",
]);

function isBioscopeApp(value: unknown): value is BioscopeApp {
  return (
    isRecord(value) &&
    isNonEmptyString(value.name) &&
    isNonEmptyString(value.subtitle) &&
    isNonEmptyString(value.tagline) &&
    isNonEmptyString(value.logo) &&
    (value.logoClass === undefined || typeof value.logoClass === "string")
  );
}

function isBioscopeGroup(value: unknown): value is BioscopeGroup {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.label) &&
    isNonEmptyString(value.hint) &&
    Array.isArray(value.detect) &&
    value.detect.every(
      (token): token is BioscopeDeviceToken =>
        typeof token === "string" &&
        BIOSCOPE_DEVICE_TOKENS.has(token as BioscopeDeviceToken),
    )
  );
}

function isBioscopeDownload(value: unknown): value is BioscopeDownload {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.group) &&
    isNonEmptyString(value.title) &&
    typeof value.kind === "string" &&
    BIOSCOPE_DOWNLOAD_KINDS.has(value.kind as BioscopeDownloadKind) &&
    (value.detect === undefined ||
      (typeof value.detect === "string" &&
        BIOSCOPE_DEVICE_TOKENS.has(value.detect as BioscopeDeviceToken))) &&
    isNonEmptyString(value.action) &&
    isOfficialDownloadHref(value.href) &&
    (value.note === undefined || isNonEmptyString(value.note)) &&
    (value.alternates === undefined ||
      (Array.isArray(value.alternates) &&
        value.alternates.every(
          (alternate) =>
            isRecord(alternate) &&
            isNonEmptyString(alternate.label) &&
            isOfficialDownloadHref(alternate.href),
        ))) &&
    (value.version === undefined || typeof value.version === "string") &&
    (value.size === undefined || typeof value.size === "string") &&
    (value.featured === undefined || typeof value.featured === "boolean")
  );
}

// Guide screenshots stay same-origin: the CSP allows `img-src 'self' data:`
// only, so a remote src would render as a broken image.
function isBioscopeStepImage(value: unknown): value is BioscopeStepImage {
  return (
    isRecord(value) &&
    isNonEmptyString(value.src) &&
    !/^[a-z]+:/i.test(value.src) &&
    !value.src.startsWith("//") &&
    isNonEmptyString(value.alt) &&
    typeof value.width === "number" &&
    Number.isFinite(value.width) &&
    value.width > 0 &&
    typeof value.height === "number" &&
    Number.isFinite(value.height) &&
    value.height > 0 &&
    (value.caption === undefined || isNonEmptyString(value.caption))
  );
}

function isBioscopeGuideStep(value: unknown): value is BioscopeGuideStep {
  return (
    isRecord(value) &&
    isNonEmptyString(value.text) &&
    (value.kind === undefined ||
      (typeof value.kind === "string" &&
        BIOSCOPE_STEP_KINDS.has(value.kind as BioscopeStepKind))) &&
    (value.images === undefined ||
      (Array.isArray(value.images) && value.images.every(isBioscopeStepImage)))
  );
}

function isBioscopeGuide(value: unknown): value is BioscopeGuide {
  return (
    isRecord(value) &&
    isNonEmptyString(value.group) &&
    Array.isArray(value.sections) &&
    value.sections.every(
      (section) =>
        isRecord(section) &&
        isNonEmptyString(section.title) &&
        Array.isArray(section.steps) &&
        section.steps.length > 0 &&
        section.steps.every(isBioscopeGuideStep),
    )
  );
}

export function parseBioscopeDownloadData(
  value: unknown,
): BioscopeDownloadData {
  if (
    !isRecord(value) ||
    typeof value.updated !== "string" ||
    !isBioscopeApp(value.app) ||
    !Array.isArray(value.groups) ||
    !value.groups.every(isBioscopeGroup) ||
    !Array.isArray(value.downloads) ||
    !value.downloads.every(isBioscopeDownload) ||
    !Array.isArray(value.guides) ||
    !value.guides.every(isBioscopeGuide)
  ) {
    throw new Error("Bioscope download data is invalid.");
  }

  const groupIds = new Set(value.groups.map((group) => group.id));
  if (groupIds.size !== value.groups.length) {
    throw new Error("Bioscope groups contain a duplicate id.");
  }

  const downloadIds = new Set<string>();
  for (const download of value.downloads) {
    if (!groupIds.has(download.group)) {
      throw new Error(`Unknown group for Bioscope download ${download.id}.`);
    }
    if (downloadIds.has(download.id)) {
      throw new Error(`Duplicate Bioscope download id ${download.id}.`);
    }
    downloadIds.add(download.id);

    if (download.detect) {
      const group = value.groups.find((entry) => entry.id === download.group);
      if (!group?.detect.includes(download.detect)) {
        throw new Error(
          `Bioscope download ${download.id} claims a device its group does not cover.`,
        );
      }
    }
  }

  for (const guide of value.guides) {
    if (!groupIds.has(guide.group)) {
      throw new Error(`Unknown group for a Bioscope guide (${guide.group}).`);
    }
  }

  return value as BioscopeDownloadData;
}

export function fetchBioscopeDownloadData(signal?: AbortSignal) {
  return fetchContent(
    "/data/bioscope-download.json",
    parseBioscopeDownloadData,
    signal,
  );
}
