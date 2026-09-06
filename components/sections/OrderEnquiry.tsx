"use client";

import { FormEvent, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { orderCatalog } from "@/lib/data/order-catalog";
import styles from "./OrderEnquiry.module.css";

type FormStatus = { kind: "idle" | "success" | "error"; message?: string };

export default function OrderEnquiry() {
  const selectedSku = orderCatalog[0].sku;
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
    <Section id="order" className={styles.section}>
      <Container>
        <div className={styles.layout}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Private order desk</p>
            <h2 className={styles.heading}>Begin your collection</h2>
            <p className={styles.introCopy}>
              Reserve a piece or begin a bespoke commission. We will confirm availability, sizing, and delivery with you personally before anything is finalised.
            </p>
            <p className={styles.notice}>
              Submitting this form is an order request, not a payment. Inventory is allocated only after our concierge confirms the order.
            </p>
          </div>

          <form onSubmit={submitOrder} className={styles.form}>
            <label className={styles.field}>
              Full name *
              <input required name="customerName" autoComplete="name" maxLength={120} className={styles.input} />
            </label>
            <label className={styles.field}>
              Email *
              <input required name="customerEmail" type="email" autoComplete="email" maxLength={254} className={styles.input} />
            </label>
            <label className={styles.field}>
              Telephone
              <input name="customerPhone" type="tel" autoComplete="tel" maxLength={40} className={styles.input} />
            </label>
            <label className={styles.field}>
              Quantity *
              <input required value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(25, Number(event.target.value) || 1)))} type="number" min="1" max="25" className={styles.input} />
            </label>
            <label className={`${styles.field} ${styles.wideField}`}>
              Delivery location
              <input name="deliveryAddress" autoComplete="street-address" maxLength={500} placeholder="City, country" className={styles.input} />
            </label>
            <label className={`${styles.field} ${styles.wideField}`}>
              Notes for our atelier
              <textarea name="notes" rows={4} maxLength={1500} placeholder="Size, palette, timing, or anything else we should know." className={styles.textarea} />
            </label>
            <label className={styles.honeypot} aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <div className={styles.actions}>
              <button disabled={isSubmitting} className={styles.submit}>
                {isSubmitting ? "Sending request…" : "Send order request"}
              </button>
              {status.kind !== "idle" && (
                <p role="status" className={`${styles.status} ${status.kind === "success" ? styles.success : styles.error}`}>
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
