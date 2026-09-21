"use client";

import { useEffect, useState } from "react";
import { collections, type Collection } from "@/lib/data/collections";
import type { ShopProduct } from "./shop-catalog";

type CatalogData = {
  collections: Collection[];
  products: ShopProduct[];
};

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogData>({ collections, products: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      const response = await fetch("/api/catalog", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) { setError(true); setLoading(false); return; }

      const result = await response.json().catch(() => ({})) as Partial<CatalogData>;
      if (!Array.isArray(result.products)) { setError(true); setLoading(false); return; }

      setCatalog((current) => ({
        collections: result.collections ?? current.collections,
        products: result.products ?? current.products,
      }));
      setLoading(false);
    }

    void loadCatalog();
  }, []);

  return { ...catalog, loading, error };
}

