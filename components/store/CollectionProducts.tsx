"use client";
import Link from "next/link";
import type { ShopProduct } from "@/lib/store/shop-catalog";
import { formatPrice } from "@/lib/store/shop-catalog";
import { productPath } from "@/lib/store/catalog";
import RugImage from "./RugImage";
import ProductActions from "./ProductActions";
import styles from "./CollectionProducts.module.css";
export default function CollectionProducts({ products }: { products: ShopProduct[] }) {
  if (!products.length) return <p className={styles.empty}>This collection is being prepared. Our concierge can help with an enquiry.</p>;
  return <section className={styles.section}><div className={styles.grid}>{products.map((product) => <article key={product.sku} className={styles.card}>
    <Link href={productPath(product.sku)} className={styles.image} aria-label={`View ${product.name}`}><RugImage src={product.image} alt={product.name} fit={product.imageFit} /></Link>
    <div className={styles.details}><h2 className={styles.name}><Link href={productPath(product.sku)}>{product.name}</Link></h2><p className={styles.description}>{product.description}</p><p className={styles.price}>{formatPrice(product.pricePaise)}</p><ProductActions sku={product.sku} name={product.name} stock={product.stock} /></div>
  </article>)}</div></section>;
}
