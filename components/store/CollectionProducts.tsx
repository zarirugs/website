"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [savedSkus, setSavedSkus] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!user) {
        setSavedSkus(new Set());
        return;
      }
      void fetch("/api/account/wishlist", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) return [];
          const result = await response.json() as { wishlist?: { sku: string }[] };
          return result.wishlist ?? [];
        })
        .then((wishlist) => setSavedSkus(new Set(wishlist.map((item) => item.sku))))
        .catch(() => setSavedSkus(new Set()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

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

  async function toggleSaved(product: PublicCatalogProduct) {
    if (!user) {
      router.push("/login");
      return;
    }

    const isSaved = savedSkus.has(product.sku);
    setBusySku(`saved-${product.sku}`);
    setMessage("");
    try {
      const response = await fetch("/api/account/wishlist", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku: product.sku }),
      });
      const result = await response.json().catch(() => ({})) as { error?: unknown };
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to update saved pieces.");
      setSavedSkus((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(product.sku);
        else next.add(product.sku);
        return next;
      });
      setMessage(isSaved ? `${product.name} was removed from your saved pieces.` : `${product.name} was saved to your private collection.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update saved pieces.");
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
              <button
                disabled={!ready || busySku === `saved-${product.sku}`}
                onClick={() => void toggleSaved(product)}
                className={styles.saveButton}
                aria-label={`${savedSkus.has(product.sku) ? "Remove" : "Save"} ${product.name}`}
                aria-pressed={savedSkus.has(product.sku)}
              >
                <Heart size={16} fill={savedSkus.has(product.sku) ? "currentColor" : "none"} />
                {busySku === `saved-${product.sku}` ? "Saving…" : savedSkus.has(product.sku) ? "Saved" : "Save"}
              </button>
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
