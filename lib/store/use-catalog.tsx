"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CatalogData } from "./catalog";

const CatalogContext = createContext<CatalogData | null>(null);
export function CatalogProvider({ initialCatalog, children }: { initialCatalog: CatalogData | null; children: ReactNode }) {
  return <CatalogContext.Provider value={initialCatalog}>{children}</CatalogContext.Provider>;
}
export function useCatalog() {
  const initial = useContext(CatalogContext);
  const [catalog, setCatalog] = useState<CatalogData>(initial ?? { collections: [], products: [] });
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (initial) return;
    const controller = new AbortController();
    void fetch("/api/catalog", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalogue unavailable");
        const data = await response.json() as CatalogData;
        if (!Array.isArray(data.products) || !Array.isArray(data.collections)) throw new Error("Invalid catalogue");
        setCatalog(data);
        setLoading(false);
      })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setLoading(false); } });
    return () => controller.abort();
  }, [initial]);
  return { ...catalog, loading, error };
}
