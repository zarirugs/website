"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { useStore } from "./StoreProvider";

export default function CartPage() {
  const { cart, ready, updateCart, user } = useStore();
  const [error, setError] = useState("");
  const [busySku, setBusySku] = useState("");

  async function setQuantity(sku: string, quantity: number) {
    setBusySku(sku);
    setError("");
    try {
      await updateCart(sku, quantity);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update your cart.");
    } finally {
      setBusySku("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] px-6 pb-20 pt-40 text-neutral-900 sm:pt-44 lg:px-16 xl:px-32">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#8b7442]">Your selection</p>
        <h1 className="display-font mt-4 text-4xl leading-none tracking-[0.02em] sm:text-5xl">Shopping bag</h1>

        {!ready ? <p className="mt-10 text-sm text-neutral-500">Loading your cart…</p> : !user ? (
          <section className="mt-10 max-w-xl bg-white p-8 shadow-sm">
            <h2 className="display-font text-2xl">Sign in to save your pieces</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">Your ZARI account keeps your cart secure and ready for your next visit.</p>
            <Link href="/login" className="mt-7 inline-flex bg-neutral-950 px-6 py-4 text-[10px] uppercase tracking-[0.18em] text-white">Sign in</Link>
          </section>
        ) : cart.items.length === 0 ? (
          <section className="mt-12 grid min-h-72 place-items-center border border-black/5 bg-white px-8 py-12 text-center shadow-[0_16px_50px_rgba(42,34,21,0.05)] sm:min-h-80">
            <div className="max-w-sm">
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#8b7442]">A quiet beginning</p>
              <h2 className="display-font mt-5 text-3xl leading-tight">Your selection awaits</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                Explore rugs shaped by material, memory, and the rooms they will call home.
              </p>
              <Link href="/#collections" className="mt-8 inline-flex items-center gap-3 border-b border-neutral-900 pb-3 text-[10px] uppercase tracking-[0.22em] text-neutral-900 transition-colors hover:border-[#8b7442] hover:text-[#8b7442]">
                Explore collections <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="mt-10 divide-y divide-neutral-200 bg-white shadow-sm">
              {cart.items.map((item) => (
                <article key={item.sku} className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#8b7442]">{item.collection}</p>
                    <h2 className="display-font mt-2 text-2xl tracking-[0.05em]">{item.name}</h2>
                    <p className="mt-2 text-xs text-neutral-500">{item.availableStock} available</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-neutral-200">
                      <button aria-label={`Decrease ${item.name} quantity`} disabled={busySku === item.sku} onClick={() => void setQuantity(item.sku, item.quantity - 1)} className="p-3 hover:bg-neutral-100 disabled:opacity-50"><Minus size={15} /></button>
                      <span className="w-9 text-center text-sm">{item.quantity}</span>
                      <button aria-label={`Increase ${item.name} quantity`} disabled={busySku === item.sku || item.quantity >= item.availableStock} onClick={() => void setQuantity(item.sku, item.quantity + 1)} className="p-3 hover:bg-neutral-100 disabled:opacity-50"><Plus size={15} /></button>
                    </div>
                    <button aria-label={`Remove ${item.name} from cart`} disabled={busySku === item.sku} onClick={() => void setQuantity(item.sku, 0)} className="p-3 text-neutral-500 hover:text-red-700 disabled:opacity-50"><Trash2 size={17} /></button>
                  </div>
                </article>
              ))}
            </section>
            {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
            <section className="mt-6 flex flex-col justify-between gap-4 border-t border-neutral-300 pt-6 sm:flex-row sm:items-center">
              <p className="text-sm text-neutral-600">{cart.itemCount} {cart.itemCount === 1 ? "piece" : "pieces"} selected</p>
              <Link href="/#order" className="bg-neutral-950 px-6 py-4 text-center text-[10px] uppercase tracking-[0.18em] text-white">Continue to order request</Link>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
