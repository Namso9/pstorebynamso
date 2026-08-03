export type CatalogSettings = {
  botUsername?: string;
  deepLinks?: boolean;
  deepLinkPrefix?: string;
  telegramChannel?: string;
  facebookPage?: string;
  paymentPage?: string;
};

export type CatalogCategory = {
  slug: string;
  title: string;
  subtitle: string;
  icon?: string;
  page?: string;
};

export type CatalogPlanGroup = {
  header: string;
};

export type CatalogPlan = {
  id: string;
  name: string;
  desc?: string;
  price?: string;
  bot?: boolean;
  contact?: boolean;
  stock?: boolean;
};

export type CatalogPlanEntry = CatalogPlanGroup | CatalogPlan;

export type CatalogProduct = {
  id: string;
  category: string;
  name: string;
  subtitle: string;
  image: string;
  imageClass?: string;
  modalTitle?: string;
  plans: CatalogPlanEntry[];
};

export type CatalogData = {
  settings: CatalogSettings;
  categories: CatalogCategory[];
  products: CatalogProduct[];
};

export function isCatalogPlan(entry: CatalogPlanEntry): entry is CatalogPlan {
  return "id" in entry;
}
