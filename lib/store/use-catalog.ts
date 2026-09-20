"use client";

import { useEffect, useState } from "react";
import { collections, type Collection } from "@/lib/data/collections";
import { orderCatalog } from "@/lib/data/order-catalog";
import type { ShopProduct } from "./shop-catalog";

type CatalogData = {
  collections: Collection[];
  products: ShopProduct[];
};

const fallbackProducts: ShopProduct[] = collections.map((collection, index) => {
  const item = orderCatalog[index];

  return {
    sku: item?.sku ?? `ZAR-RUG-${index + 1}`,
    name: item?.name ?? `Rug ${index + 1}`,
    description: item?.description ?? "A hand-knotted rug from the ZARI atelier.",
    categorySlug: collection.slug ?? `category-${index + 1}`,
    image: collection.image,
    backgroundColor: collection.backgroundColor,
    imageFit: collection.imageFit ?? "cover",
    pricePaise: null,
    stock: 0,
    weave: /hand.knotted/i.test(item?.name ?? "") ? "Hand-knotted" : null,
  };
});

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogData>({ collections, products: fallbackProducts });

  useEffect(() => {
    async function loadCatalog() {
      const response = await fetch("/api/catalog", { cache: "no-store" }).catch(() => null);
      if (!response?.ok) return;

      const result = await response.json().catch(() => ({})) as Partial<CatalogData>;
      if (!result.collections && !result.products) return;

      setCatalog((current) => ({
        collections: result.collections?.length ? result.collections : current.collections,
        products: result.products ?? current.products,
      }));
    }

    void loadCatalog();
  }, []);

  return catalog;
}

