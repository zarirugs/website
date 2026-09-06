import { notFound } from "next/navigation";

import Container from "@/components/layout/Container";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/sections";
import CollectionProducts, { type PublicCatalogProduct } from "@/components/store/CollectionProducts";
import { collections } from "@/lib/data/collections";
import { orderCatalog } from "@/lib/data/order-catalog";
import { getDatabase } from "@/lib/server/database";
import styles from "./page.module.css";

type Category = { id: string; name: string; description: string | null };
type ProductRow = {
  sku: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_paise: number | null;
  stock: number;
};

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallbackCollection = collections.find((collection) => collection.slug === slug);
  if (!fallbackCollection) notFound();

  let collection = {
    name: fallbackCollection.title,
    description: fallbackCollection.subtitle,
  };
  let products: PublicCatalogProduct[] = orderCatalog
    .filter((product) => product.collection === fallbackCollection.title)
    .map((product) => ({
      sku: product.sku,
      name: product.name,
      description: product.description,
      imageUrl: fallbackCollection.image,
      pricePaise: null,
      stock: product.quantity,
    }));

  try {
    const database = await getDatabase();
    const category = await database.prepare(
      "SELECT id, name, description FROM categories WHERE slug = ? AND is_active = 1",
    ).bind(slug).first<Category>();

    if (category) {
      const productResult = await database.prepare(
        `SELECT inventory_items.sku, inventory_items.name, product_catalog.description, product_catalog.image_url,
          product_catalog.price_paise, inventory_items.stock
         FROM product_catalog JOIN inventory_items ON inventory_items.sku = product_catalog.sku
         WHERE product_catalog.category_id = ? AND product_catalog.is_visible = 1 AND inventory_items.is_active = 1
         ORDER BY product_catalog.sort_order ASC, inventory_items.name ASC`,
      ).bind(category.id).all<ProductRow>();

      collection = {
        name: category.name,
        description: category.description ?? fallbackCollection.subtitle,
      };
      products = productResult.results.map((product) => ({
        sku: product.sku,
        name: product.name,
        description: product.description,
        imageUrl: product.image_url ?? fallbackCollection.image,
        pricePaise: product.price_paise,
        stock: product.stock,
      }));
    }
  } catch {
    // Use the curated collection until the catalog migration is available.
  }

  return (
    <>
      <Navbar surface="solid" />
      <main className={styles.page}>
        <Container>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>The collection</p>
            <h1 className={styles.heading}>{collection.name}</h1>
            {collection.description && <p className={styles.description}>{collection.description}</p>}
          </header>
          <div className={styles.products}>
            <CollectionProducts products={products} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
