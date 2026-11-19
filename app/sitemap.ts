import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/server/catalog";
import { productPath } from "@/lib/store/catalog";
import { site } from "@/lib/data/site";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  return ["/", "/shop", "/buying-guide", "/privacy", ...catalog.collections.map((item) => `/collections/${item.slug}`), ...catalog.products.map((item) => productPath(item.sku))].map((path) => ({ url: site.url + path }));
}
