"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "./StoreProvider";
import { site } from "@/lib/data/site";
import { trackStoreEvent } from "@/lib/store/analytics";

export default function ProductActions({ sku, name, stock }: { sku: string; name: string; stock: number }) {
  const { user, ready, cart, updateCart } = useStore();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const quantity = cart.items.find((item) => item.sku === sku)?.quantity ?? 0;
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    void fetch("/api/account/wishlist", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? await response.json() as { wishlist: { sku: string }[] } : { wishlist: [] })
      .then((result) => setSaved(result.wishlist.some((item) => item.sku === sku)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [user, sku]);
  async function add(enquire = false) {
    setBusy(true); setMessage("");
    try {
      if (!enquire || !quantity) { await updateCart(sku, enquire ? 1 : quantity + 1); trackStoreEvent("add_to_bag", sku); }
      if (enquire) { trackStoreEvent("enquiry_started", sku); router.push("/order-request"); }
      else setMessage(`${name} is in your bag.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update your selection."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!user) { router.push(`/login?next=${encodeURIComponent(pathname)}`); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/account/wishlist", { method: saved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku }) });
      if (!response.ok) throw new Error("We could not update your saved pieces. Please try again.");
      setSaved(!saved); setMessage(saved ? "Removed from saved pieces." : "Saved to your private collection.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save this piece."); }
    finally { setBusy(false); }
  }
  return <div className="mt-7 grid gap-4">
    {stock > 0 ? <>
      <button disabled={!ready || busy} onClick={() => void add(true)} className="bg-neutral-950 px-6 py-4 text-xs uppercase tracking-widest text-white disabled:opacity-50">Request this piece</button>
      <div className="flex flex-wrap items-center gap-5 text-sm">
        <button disabled={!ready || busy || quantity >= Math.min(stock, 25)} onClick={() => void add()} className="underline underline-offset-4 disabled:opacity-50">{quantity ? `Add another (${quantity} in bag)` : "Add to bag"}</button>
        <button disabled={!ready || busy} onClick={() => void save()} aria-pressed={saved} className="underline underline-offset-4">{saved ? "Saved" : "Save piece"}</button>
        <Link href="/cart" className="underline underline-offset-4">Review bag</Link>
      </div>
    </> : <a href={`mailto:${site.email}?subject=${encodeURIComponent(`Commission enquiry: ${name} (${sku})`)}`} className="bg-neutral-950 px-6 py-4 text-center text-xs uppercase tracking-widest text-white">Enquire about a commission</a>}
    <p role="status" className="text-sm text-neutral-600">{message}</p>
  </div>;
}
