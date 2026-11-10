'use client';
import { useLiveCatalog } from '@/components/CatalogProvider';
import type { CatalogData } from '@/types/catalog';
// All commerce views share one live request and one refresh cadence.
export function useCatalog(_initialCatalog?: CatalogData, _enabled = true) {
  void _initialCatalog; void _enabled;
  return useLiveCatalog();
}
