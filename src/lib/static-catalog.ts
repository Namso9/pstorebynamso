import catalogJson from "../../products.json";

import { parseCatalogData } from "@/services/catalog";

export const staticCatalog = parseCatalogData(catalogJson);
