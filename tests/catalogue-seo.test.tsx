// @vitest-environment node
import type { DatabaseSync } from "node:sqlite";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Suspense } from "react";
import { getCatalog } from "@/lib/server/catalog";
import { productSchema, jsonLd } from "@/lib/store/seo";
import { mediaSrcSet, mediaWidth } from "@/lib/store/media";
import { productPath } from "@/lib/store/catalog";
import { CatalogProvider } from "@/lib/store/use-catalog";
import ShopCatalogue from "@/components/store/ShopCatalogue";
import sitemap from "@/app/sitemap";
import { storefrontDatabase } from "./helpers/storefront-database";
import { sqliteD1 } from "./helpers/sqlite-d1";
const { getDatabase } = vi.hoisted(() => ({ getDatabase: vi.fn() }));
vi.mock("@/lib/server/database", () => ({ getDatabase }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
let db: DatabaseSync;
beforeEach(() => { db = storefrontDatabase(); getDatabase.mockResolvedValue(sqliteD1(db)); });
afterEach(() => db.close());
it("hides empty admin categories without deleting them", async () => {
  db.exec("INSERT INTO categories (id, name, slug) VALUES ('test', 'test', 'test')");
  const catalog = await getCatalog();
  expect(catalog.collections.some((item) => item.slug === "test")).toBe(false);
  expect(db.prepare("SELECT id FROM categories WHERE id = 'test'").get()).toBeTruthy();
});
it("renders product text and crawlable product links in the initial shop HTML", async () => {
  const catalog = await getCatalog();
  const html = renderToString(<CatalogProvider initialCatalog={catalog}><Suspense><ShopCatalogue /></Suspense></CatalogProvider>);
  expect(html).toContain("Heritage"); expect(html).toContain('href="/rugs/zar-her-001"'); expect(html).not.toContain("Loading rugs");
});
it("publishes sitemap entries from active catalogue data", async () => {
  const result = await sitemap();
  expect(result.map((item) => item.url)).toContain("https://zarirugs.com/rugs/zar-con-001");
  expect(result.map((item) => item.url)).toContain("https://zarirugs.com/collections/heritage");
  expect(result.some((item) => item.url.includes("/account"))).toBe(false);
});
it("keeps unknown specifications unasserted and never invents free offers or reviews", async () => {
  const product = (await getCatalog()).products[0];
  const schema = productSchema(product);
  expect(schema).not.toHaveProperty("offers"); expect(schema).not.toHaveProperty("aggregateRating"); expect(schema.material).toBeUndefined();
  expect(productSchema({ ...product, pricePaise: 12500000 })).toMatchObject({ offers: { price: 125000, priceCurrency: "INR" } });
  expect(jsonLd({ value: "</script><script>" })).not.toContain("</script>");
});
it("uses responsive widths for uploaded images and preserves external image URLs", () => {
  expect(mediaSrcSet("/api/media/photo-id")).toContain("?w=640 640w");
  expect(mediaWidth("/api/media/photo-id", 1200)).toBe("/api/media/photo-id?w=1200");
  expect(mediaSrcSet("https://images.example/photo.jpg")).toBeUndefined();
  expect(productPath("ZAR-CON-001")).toBe("/rugs/zar-con-001");
});
