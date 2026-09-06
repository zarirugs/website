"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useStore } from "./StoreProvider";

export type PublicCatalogProduct = {
  sku: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pricePaise: number | null;
  stock: number;
};

function price(value: number | null) {
  return value === null ? "Price on request" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
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

  return <section className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
    {products.map((product) => <article key={product.sku} className="group">
      <div role="img" aria-label={product.name} className="aspect-[4/5] bg-[#eee9de] bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.01]" style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined} />
      <div className="mt-6"><p className="text-[10px] uppercase tracking-[.22em] text-[#8b7442]">{price(product.pricePaise)}</p><h2 className="display-font mt-3 text-3xl tracking-[.04em]">{product.name}</h2>{product.description && <p className="mt-3 text-sm leading-relaxed text-neutral-500">{product.description}</p>}<div className="mt-6 flex items-center justify-between gap-4"><p className="text-xs text-neutral-400">{product.stock > 0 ? `${product.stock} available` : "Made to order"}</p><button disabled={!ready || busySku === product.sku || product.stock < 1} onClick={() => void addProduct(product)} className="text-[10px] uppercase tracking-[.18em] text-neutral-900 transition-colors hover:text-[#8b7442] disabled:cursor-not-allowed disabled:text-neutral-400">{busySku === product.sku ? "Adding…" : "Add to bag"}</button></div></div>
    </article>)}
    {message && <p className="sm:col-span-2 lg:col-span-3" role="status">{message}</p>}
  </section>;
}
