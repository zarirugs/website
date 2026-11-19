"use client";
import { trackStoreEvent } from "@/lib/store/analytics";

import Link from "next/link";
import { type FormEvent, type ReactNode, useRef, useState } from "react";

import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import { useStore } from "@/components/store/StoreProvider";
import { useCatalog } from "@/lib/store/use-catalog";
import type { CartItem } from "@/lib/store/types";
import { site } from "@/lib/data/site";
import styles from "./OrderEnquiry.module.css";

type FormStatus = { kind: "idle" | "success" | "error"; message?: string };
type EnquirySource = "bag" | "catalog";

function EnquiryLayout({ source, children }: { source: EnquirySource; children: ReactNode }) {
  const Heading = source === "bag" ? "h1" : "h2";
  return (
    <Section id="order" className={styles.section}>
      <Container>
        <div className={styles.layout}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>Private order desk</p>
            <Heading className={styles.heading}>{source === "bag" ? "Review your request" : "Begin your collection"}</Heading>
            <p className={styles.introCopy}>
              {source === "bag"
                ? "Review the pieces in your bag and share your delivery details. Our concierge will confirm availability, sizing, and delivery with you personally."
                : "Reserve a piece or begin a bespoke commission. We will confirm availability, sizing, and delivery with you personally before anything is finalised."}
            </p>
            <p className={styles.notice}>
              Submitting this form is an order request, not a payment. Inventory is allocated only after our concierge confirms the order.
            </p>
            <p className="mt-6"><a href={`mailto:${site.email}`} className={styles.textLink}>Contact our concierge</a></p>
          </div>
          {children}
        </div>
      </Container>
    </Section>
  );
}

function EnquiryForm({ items, source, children }: { items: CartItem[]; source: EnquirySource; children?: ReactNode }) {
  const { user } = useStore();
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const selectionError = items.length > 10
    ? "Please request up to 10 different pieces at a time. Update your bag to continue."
    : items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 25 || item.quantity > item.availableStock)
      ? "The requested quantity is no longer available. Update your selection to continue."
      : "";

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (items.length === 0 || selectionError) {
      setStatus({ kind: "error", message: selectionError || "Please choose a piece for your request." });
      return;
    }

    // Read the form and selected lines before awaiting; React's currentTarget is event-scoped.
    const form = new FormData(event.currentTarget);
    const requestedItems = items.map(({ sku, quantity }) => ({ sku, quantity }));
    submitting.current = true;
    setIsSubmitting(true);
    setStatus({ kind: "idle" });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          customerEmail: form.get("customerEmail"),
          customerPhone: form.get("customerPhone"),
          deliveryAddress: form.get("deliveryAddress"),
          notes: form.get("notes"),
          website: form.get("website"),
          items: requestedItems,
        }),
      });
      const result = await response.json().catch(() => null) as {
        error?: string;
        orderNumber?: string;
      } | null;

      if (!response.ok) {
        setStatus({ kind: "error", message: result?.error || "We could not send your request. Please try again." });
        return;
      }

      if (!result?.orderNumber) {
        setStatus({ kind: "error", message: "We could not confirm your request. Please contact our concierge before trying again." });
        return;
      }

      trackStoreEvent("enquiry_submitted");
      setStatus({
        kind: "success",
        message: `Your order request has been received. Our concierge will confirm availability shortly. Reference: ${result.orderNumber}.`,
      });
    } catch {
      setStatus({ kind: "error", message: "We could not confirm your request. Check your connection and try again, or contact our concierge for help." });
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  if (status.kind === "success") {
    return (
      <div className={styles.form}>
        <p role="status" className={`${styles.status} ${styles.success} ${styles.wideField}`}>{status.message}</p>
        <Link href={user ? "/account" : "/shop"} className={styles.textLink}>{user ? "View your requests" : "Continue exploring"}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submitOrder} className={styles.form}>
      <fieldset disabled={isSubmitting} className={styles.fields}>
        <legend className={styles.srOnly}>Your order request</legend>
        {children}
        {items.length > 0 && (
          <section aria-label="Requested pieces" className={`${styles.selection} ${styles.wideField}`}>
            <h3 className={styles.selectionHeading}>Your selected pieces</h3>
            <ul className={styles.selectionList}>
              {items.map((item) => (
                <li key={item.sku} className={styles.selectionItem}>
                  <div><p>{item.name}</p><span className={styles.reference}>{item.sku}</span></div>
                  <span className={styles.quantity}>Quantity: {item.quantity}</span>
                </li>
              ))}
            </ul>
            {source === "bag" && <Link href="/cart" className={styles.textLink}>Edit your bag</Link>}
          </section>
        )}
        <label className={styles.field}>
          Full name *
          <input required name="customerName" defaultValue={user?.fullName ?? ""} autoComplete="name" maxLength={120} className={styles.input} />
        </label>
        <label className={styles.field}>
          Email *
          <input required name="customerEmail" type="email" defaultValue={user?.email ?? ""} readOnly={Boolean(user)} autoComplete="email" maxLength={254} className={styles.input} />
        </label>
        <label className={`${styles.field} ${styles.wideField}`}>
          Telephone
          <input name="customerPhone" type="tel" autoComplete="tel" maxLength={40} className={styles.input} />
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
          <button disabled={isSubmitting || items.length === 0 || Boolean(selectionError)} className={styles.submit}>
            {isSubmitting ? "Sending request…" : "Send order request"}
          </button>
          {(selectionError || status.kind === "error") && (
            <p role="alert" className={`${styles.status} ${styles.error}`}>{selectionError || status.message}</p>
          )}
        </div>
      </fieldset>
    </form>
  );
}

function BagEnquiry() {
  const { cart, ready, error, refresh } = useStore();
  if (!ready || error || cart.items.length === 0) {
    return (
      <div className={styles.form}>
        <p role="status" className={styles.wideField}>
          {!ready ? "Loading your selection…" : error || "Your bag is empty. Choose a piece before sending an order request."}
        </p>
        {ready && (error ? <button onClick={() => void refresh()} className={styles.textLink}>Try again</button> : <Link href="/shop" className={styles.textLink}>Explore shop</Link>)}
      </div>
    );
  }
  return <EnquiryForm items={cart.items} source="bag" />;
}

function CatalogueEnquiry() {
  const { products, loading, error } = useCatalog();
  const [selectedSku, setSelectedSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const selectedProduct = products.find((product) => product.sku === selectedSku);
  const items: CartItem[] = selectedProduct ? [{
    sku: selectedProduct.sku,
    name: selectedProduct.name,
    collection: selectedProduct.categorySlug,
    quantity,
    availableStock: selectedProduct.stock,
  }] : [];

  return (
    <EnquiryForm items={items} source="catalog">
      <label className={`${styles.field} ${styles.wideField}`}>
        Choose a piece *
        <select required value={selectedSku} onChange={(event) => { setSelectedSku(event.target.value); setQuantity(1); }} disabled={loading || error} className={styles.input}>
          <option value="">{loading ? "Loading pieces…" : "Select a piece"}</option>
          {products.map((product) => <option key={product.sku} value={product.sku} disabled={product.stock < 1}>{product.name} · {product.sku}{product.stock < 1 ? " · Unavailable" : ""}</option>)}
        </select>
      </label>
      {!loading && (error || products.length === 0) && <p role="alert" className={`${styles.status} ${styles.wideField}`}>We could not load the available pieces. Please contact our concierge for help.</p>}
      <label className={`${styles.field} ${styles.wideField}`}>
        Quantity *
        <input required value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} type="number" min="1" max={Math.min(25, selectedProduct?.stock ?? 25)} step="1" className={styles.input} />
      </label>
    </EnquiryForm>
  );
}

export default function OrderEnquiry({ source = "catalog" }: { source?: EnquirySource }) {
  return <EnquiryLayout source={source}>{source === "bag" ? <BagEnquiry /> : <CatalogueEnquiry />}</EnquiryLayout>;
}
