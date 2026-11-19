import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import { Navbar } from "@/components/navigation";
import { Footer } from "@/components/sections";
import CollectionProducts from "@/components/store/CollectionProducts";
import { getCatalog } from "@/lib/server/catalog";
import styles from "./page.module.css";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const collection = (await getCatalog()).collections.find((item) => item.slug === slug);
  return collection ? { title: `${collection.title} rugs`, description: collection.subtitle, alternates: { canonical: `/collections/${slug}` }, openGraph: { title: `${collection.title} rugs`, url: `/collections/${slug}`, images: [{ url: collection.image, alt: collection.title }] } } : { title: "Collection not found", robots: { index: false } };
}
export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const collection = catalog.collections.find((item) => item.slug === slug);
  if (!collection) notFound();
  return <><Navbar surface="solid" /><main id="main-content" className={styles.page}><Container><header className={styles.intro}><p className={styles.eyebrow}>The collection</p><h1 className={styles.heading}>{collection.title}</h1><p className={styles.description}>{collection.subtitle}</p></header><div className={styles.products}><CollectionProducts products={catalog.products.filter((product) => product.categorySlug === slug)} /></div></Container></main><Footer /></>;
}
