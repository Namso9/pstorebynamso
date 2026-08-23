export type FaqItemData = {
  q: string;
  a_html: string;
};

export type FaqSectionData = {
  title: string;
  items: FaqItemData[];
};

export type FaqData = Record<string, FaqSectionData>;

export type ReviewsData = {
  images: string[];
};

export type ExpressLocation = {
  flag: string;
  country: string;
  city: string;
  ip: string;
  protocol: string;
  encryption?: string;
  natHeartbeats?: boolean;
};

export type ExpressGuideData = {
  updated: string;
  locations: ExpressLocation[];
};

/** Device families the download rail can pre-select from the visitor's UA. */
export type BioscopeDeviceToken =
  | "android"
  | "androidtv"
  | "ios"
  | "mac"
  | "windows";

/** What the visitor actually receives: a file, a store page, or a beta invite. */
export type BioscopeDownloadKind =
  | "apk"
  | "dmg"
  | "exe"
  | "store"
  | "testflight"
  | "zip";

export type BioscopeApp = {
  name: string;
  subtitle: string;
  tagline: string;
  logo: string;
  logoClass?: string;
};

export type BioscopeGroup = {
  id: string;
  label: string;
  hint: string;
  detect: BioscopeDeviceToken[];
};

/** A second route to the same app, e.g. the other open TestFlight slots. */
export type BioscopeDownloadAlternate = {
  label: string;
  href: string;
};

export type BioscopeDownload = {
  id: string;
  group: string;
  title: string;
  kind: BioscopeDownloadKind;
  /** The device this entry is the answer for, when one device owns it. */
  detect?: BioscopeDeviceToken;
  action: string;
  href: string;
  note?: string;
  alternates?: BioscopeDownloadAlternate[];
  version?: string;
  size?: string;
  featured?: boolean;
};

/** A numbered step, an unnumbered aside, or a red caution. */
export type BioscopeStepKind = "step" | "note" | "warning";

export type BioscopeStepImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

export type BioscopeGuideStep = {
  text: string;
  kind?: BioscopeStepKind;
  images?: BioscopeStepImage[];
};

export type BioscopeGuideSection = {
  title: string;
  steps: BioscopeGuideStep[];
};

export type BioscopeGuide = {
  group: string;
  sections: BioscopeGuideSection[];
};

export type BioscopeDownloadData = {
  updated: string;
  app: BioscopeApp;
  groups: BioscopeGroup[];
  downloads: BioscopeDownload[];
  guides: BioscopeGuide[];
};

/** One live-resolved installer link, keyed by its `BioscopeDownload.id`. */
export type BioscopeResolvedLink = {
  href: string;
  version?: string;
};

export type BioscopeResolvedLinks = Record<string, BioscopeResolvedLink>;
