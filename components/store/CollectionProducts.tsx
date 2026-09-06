"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useStore } from "./StoreProvider";
import styles from "./CollectionProducts.module.css";

export type PublicCatalogProduct = {
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pricePaise: number | null;
  stock: number;
};

function price(value: number | null) {
  return value === null
    ? "Price on request"
    : new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value / 100);
}

export default function CollectionProducts({ products }: { products: PublicCatalogProduct[] }) {
  const router = useRouter();
  const { ready, user, updateCart } = useStore();
  const [busySku, setBusySku] = useState("");
  const [message, setMessage] = useState("");

  async function addProduct(product: PublicCatalogProduct) {
    if (!user) {
      router.push("/login");
      return;
    }

    setBusySku(product.sku);
    setMessage("");

    try {
      await updateCart(product.sku, 1);
      setMessage(`${product.name} was added to your bag.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add this piece to your bag.");
    } finally {
      setBusySku("");
    }
  }

  if (!products.length) {
    return <p className={styles.empty}>This collection is being prepared. Please return soon.</p>;
  }

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {products.map((product) => (
          <article key={product.sku} className={styles.card}>
            <div
              role="img"
              aria-label={product.name}
              className={styles.image}
              style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
            />
            <div className={styles.details}>
              <p className={styles.price}>{price(product.pricePaise)}</p>
              <h2 className={styles.name}>{product.name}</h2>
              {product.description && <p className={styles.description}>{product.description}</p>}
              <div className={styles.purchase}>
                <p className={styles.stock}>{product.stock > 0 ? `${product.stock} available` : "Made to order"}</p>
                <button
                  disabled={!ready || busySku === product.sku || product.stock < 1}
                  onClick={() => void addProduct(product)}
                  className={styles.addButton}
                >
                  {busySku === product.sku ? "Adding…" : "Add to bag"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {message && <p className={styles.message} role="status">{message}</p>}
    </section>
  );
}
