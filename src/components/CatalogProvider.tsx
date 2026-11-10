'use client';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { staticCatalog } from '@/lib/static-catalog';
import { fetchCatalog } from '@/services/catalog';
import { buildCategoryPages } from '@/lib/categoryPages';

const CatalogContext = createContext({ catalog:staticCatalog, error:null as string | null, refreshing:false });
export function CatalogProvider({ children }: { children:React.ReactNode }) {
  const [catalog,setCatalog] = useState(staticCatalog);
  const [error,setError] = useState<string | null>(null);
  const current = useRef(JSON.stringify(staticCatalog));
  useEffect(() => {
    let controller:AbortController | null = null;
    const refresh = async () => {
      if (document.hidden || controller) return;
      controller = new AbortController();
      const request = controller;
      const timeout = window.setTimeout(() => request.abort(), 10000);
      try {
        const next = await fetchCatalog(request.signal);
        const serialized = JSON.stringify(next);
        if (serialized !== current.current) { current.current = serialized; setCatalog(next); }
        setError(null);
      } catch { if (!request.signal.aborted) setError('Live catalog unavailable. Showing the last loaded catalog.'); }
      finally { clearTimeout(timeout); if (controller === request) controller = null; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(),5000);
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    return () => { clearInterval(timer); controller?.abort(); window.removeEventListener('focus',refresh); document.removeEventListener('visibilitychange',refresh); };
  },[]);
  const value = useMemo(() => ({ catalog,error,refreshing:false }),[catalog,error]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
export function useLiveCatalog() { return useContext(CatalogContext); }
export function useCategoryPages() {
  const {catalog} = useLiveCatalog();
  return useMemo(() => buildCategoryPages(catalog),[catalog]);
}
export function useDetailProducts() {
  const pages = useCategoryPages();
  return useMemo(() => pages.flatMap(category => category.products.map(product => ({product,slug:product.slug,category:{slug:category.slug,name:category.name}}))),[pages]);
}
