import type { Collection } from "@/lib/data/collections";
import type { ShopProduct } from "./shop-catalog";
export type CatalogData = { collections: Collection[]; products: ShopProduct[] };
export function productPath(sku: string) { return `/rugs/${encodeURIComponent(sku.toLowerCase())}`; }
