import { notFound } from "next/navigation";

import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/sections";
import CollectionProducts, { type PublicCatalogProduct } from "@/components/store/CollectionProducts";
import { getDatabase } from "@/lib/server/database";

type Category = { id: string; name: string; description: string | null };
type ProductRow = { sku: string; name: string; description: string | null; image_url: string | null; price_paise: number | null; stock: number };

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const database = await getDatabase();
  const category = await database.prepare(
    "SELECT id, name, description FROM categories WHERE slug = ? AND is_active = 1",
  ).bind(slug).first<Category>();
  if (!category) notFound();
  const productResult = await database.prepare(
    `SELECT inventory_items.sku, inventory_items.name, product_catalog.description, product_catalog.image_url,
      product_catalog.price_paise, inventory_items.stock
     FROM product_catalog JOIN inventory_items ON inventory_items.sku = product_catalog.sku
     WHERE product_catalog.category_id = ? AND product_catalog.is_visible = 1 AND inventory_items.is_active = 1
     ORDER BY product_catalog.sort_order ASC, inventory_items.name ASC`,
  ).bind(category.id).all<ProductRow>();
  const products: PublicCatalogProduct[] = productResult.results.map((product) => ({
    sku: product.sku, name: product.name, description: product.description, imageUrl: product.image_url,
    pricePaise: product.price_paise, stock: product.stock,
  }));

  return <><Navbar /><main className="min-h-screen bg-[#f8f6f1] px-6 pb-24 pt-36 text-neutral-900 lg:px-16 xl:px-32"><div className="mx-auto max-w-7xl"><p className="text-[10px] uppercase tracking-[.28em] text-[#8b7442]">The collection</p><h1 className="display-font mt-4 text-5xl tracking-[.06em] md:text-7xl">{category.name}</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-600">{category.description}</p><div className="mt-16"><CollectionProducts products={products} /></div></div></main><Footer /></>;
}
