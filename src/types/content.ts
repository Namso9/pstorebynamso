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
