"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Collection } from "@/lib/data/collections";
import { Heading, Text } from "@/components/typography";
import { orderCatalog } from "@/lib/data/order-catalog";
import { useStore } from "@/components/store";

interface CollectionCardProps {
  collection: Collection;
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();
  const { cart, updateCart, user } = useStore();
  const [status, setStatus] = useState("");
  const product = orderCatalog.find((item) => item.collection === collection.title);

  async function addToCart() {
    if (!product) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setStatus("");
    try {
      const existing = cart.items.find((item) => item.sku === product.sku);
      await updateCart(product.sku, (existing?.quantity ?? 0) + 1);
      setStatus("Added to your bag");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to add this piece.");
    }
  }

  return (
    <article className="group cursor-pointer">
      {/* Swapped aspect-ratio for explicit, foolproof responsive heights */}
      <div className="relative w-full h-[450px] lg:h-[600px] overflow-hidden rounded-sm bg-neutral-200">
        <Image
          src={collection.image}
          alt={collection.title}
          fill
          className="object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-700 group-hover:bg-black/10" />
      </div>

      <div className="mt-10 lg:mt-12">
        <Heading as="h3" size="md" className="transition-colors duration-300 group-hover:text-[#B89B5E]">
          {collection.title}
        </Heading>

        <Text size="sm" className="mt-4 max-w-xs text-neutral-500 leading-relaxed">
          {collection.subtitle}
        </Text>

        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link href="#order" className="inline-flex items-center gap-4 text-[11px] uppercase tracking-[0.3em] transition-all duration-300 group-hover:gap-6 group-hover:text-[#B89B5E] text-neutral-400">Explore <span>→</span></Link>
          {product && <button onClick={() => void addToCart()} className="border-b border-neutral-400 pb-1 text-[10px] uppercase tracking-[0.18em] text-neutral-800 transition-colors hover:border-[#b89b5e] hover:text-[#8b7442]">{user ? "Add to bag" : "Sign in to add"}</button>}
        </div>
        {status && <p role="status" className="mt-4 text-xs text-[#8b7442]">{status}</p>}
      </div>
    </article>
  );
}
