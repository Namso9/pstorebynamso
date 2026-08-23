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
  /**
   * Display-only bonus badge (e.g. "+7 days"). Storefront-owned: it is NOT in
   * the panel's `_ALLOWED_PLAN_KEYS`, so panel price/stock syncs leave it
   * alone — the same guarantee `desc` already relies on. Never fold a bonus
   * into `name`; the panel treats `name` as the shared bot/panel identity and
   * overwrites it on every save.
   */
  bonus?: string;
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
  /**
   * Opt-in plan renderer. Absent (the default for every other product) keeps
   * the flat plan list byte-for-byte; "duration" swaps in the two-step
   * duration picker for products with too many plans to scan as a list.
   */
  planPicker?: "duration";
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
