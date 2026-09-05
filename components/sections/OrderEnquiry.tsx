"use client";

import { FormEvent, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { orderCatalog } from "@/lib/data/order-catalog";

type FormStatus = { kind: "idle" | "success" | "error"; message?: string };

export default function OrderEnquiry() {
  const [selectedSku, setSelectedSku] = useState(orderCatalog[0].sku);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ kind: "idle" });

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.get("customerName"),
        customerEmail: form.get("customerEmail"),
        customerPhone: form.get("customerPhone"),
        deliveryAddress: form.get("deliveryAddress"),
        notes: form.get("notes"),
        // A visually hidden anti-bot field. It should remain empty for people.
        website: form.get("website"),
        items: [{ sku: selectedSku, quantity }],
      }),
    });

    const result = await response.json().catch(() => ({}));
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus({ kind: "error", message: result.error ?? "We could not send your request. Please try again." });
      return;
    }

    event.currentTarget.reset();
    setQuantity(1);
    setStatus({
      kind: "success",
      message: `${result.message} Reference: ${result.orderNumber}.`,
    });
  }

  return (
    <Section id="order" className="bg-neutral-950 text-white">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div className="max-w-md">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#b89b5e]">Private order desk</p>
            <h2 className="display-font mt-6 text-4xl leading-tight tracking-[0.04em] md:text-5xl">
              Begin your collection
            </h2>
            <p className="mt-8 text-sm leading-loose text-neutral-400">
              Reserve a piece or begin a bespoke commission. We will confirm availability, sizing, and delivery with you personally before anything is finalised.
            </p>
            <p className="mt-8 border-l border-[#b89b5e] pl-4 text-xs leading-relaxed text-neutral-500">
              Submitting this form is an order request, not a payment. Inventory is allocated only after our concierge confirms the order.
            </p>
          </div>

          <form onSubmit={submitOrder} className="grid gap-5 rounded-sm bg-white p-6 text-neutral-900 shadow-2xl md:grid-cols-2 md:p-9">
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Full name *
              <input required name="customerName" autoComplete="name" maxLength={120} className="border-b border-neutral-300 px-0 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900" />
            </label>
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Email *
              <input required name="customerEmail" type="email" autoComplete="email" maxLength={254} className="border-b border-neutral-300 px-0 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900" />
            </label>
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Telephone
              <input name="customerPhone" type="tel" autoComplete="tel" maxLength={40} className="border-b border-neutral-300 px-0 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900" />
            </label>
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Collection *
              <select value={selectedSku} onChange={(event) => setSelectedSku(event.target.value)} className="border-b border-neutral-300 bg-white px-0 py-3 text-sm text-neutral-900 outline-none focus:border-neutral-900">
                {orderCatalog.map((item) => <option key={item.sku} value={item.sku}>{item.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Quantity *
              <input required value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(25, Number(event.target.value) || 1)))} type="number" min="1" max="25" className="border-b border-neutral-300 px-0 py-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900" />
            </label>
            <label className="grid gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Delivery location
              <input name="deliveryAddress" autoComplete="street-address" maxLength={500} placeholder="City, country" className="border-b border-neutral-300 px-0 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900" />
            </label>
            <label className="col-span-full grid gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              Notes for our atelier
              <textarea name="notes" rows={3} maxLength={1500} placeholder="Size, palette, timing, or anything else we should know." className="resize-y border-b border-neutral-300 px-0 py-3 text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900" />
            </label>
            <label className="sr-only" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <div className="col-span-full mt-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <button disabled={isSubmitting} className="rounded-full bg-neutral-950 px-7 py-4 text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b89b5e] disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Sending request…" : "Send order request"}
              </button>
              {status.kind !== "idle" && (
                <p role="status" className={`max-w-sm text-xs leading-relaxed ${status.kind === "success" ? "text-emerald-700" : "text-red-700"}`}>
                  {status.message}
                </p>
              )}
            </div>
          </form>
        </div>
      </Container>
    </Section>
  );
}
