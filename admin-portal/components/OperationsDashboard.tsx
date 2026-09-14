"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { AuthenticatedAdmin } from "@/lib/server/auth";
import { displayOrderStage, orderStages, type OrderStage } from "@/lib/data/orders";
import styles from "./operations.module.css";

type Metrics = { openOrders: number; awaitingPayment: number; lowStock: number; visibleProducts: number };
type Category = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; mediaAssetId: string | null; sortOrder: number; isActive: boolean; productCount: number };
type Order = { id: number; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string | null; deliveryAddress: string | null; notes: string | null; stage: OrderStage; createdAt: string; items: { sku: string; name: string; quantity: number }[] };
type MediaAsset = { id: string; name: string; altText: string | null; sourceType: "upload" | "url" | "color"; imageUrl: string | null; backgroundColor: string | null; previewUrl: string | null };
type MediaSlot = { slot_key: string; label: string; description: string; media_asset_id: string | null };

function date(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(`${value}Z`));
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result as T;
}

export default function OperationsDashboard({ initialAdmin }: { initialAdmin: AuthenticatedAdmin }) {
  const router = useRouter();
  const [admin, setAdmin] = useState(initialAdmin);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [mediaSlots, setMediaSlots] = useState<MediaSlot[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState("0");
  const [mediaName, setMediaName] = useState("");
  const [mediaAltText, setMediaAltText] = useState("");
  const [mediaSourceType, setMediaSourceType] = useState<MediaAsset["sourceType"]>("upload");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaColor, setMediaColor] = useState("#A88957");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [editingMedia, setEditingMedia] = useState<MediaAsset | null>(null);
  const [editingMediaName, setEditingMediaName] = useState("");
  const [editingMediaAltText, setEditingMediaAltText] = useState("");
  const [editingMediaUrl, setEditingMediaUrl] = useState("");
  const [editingMediaColor, setEditingMediaColor] = useState("#A88957");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboard, categoryResult, orderResult, mediaResult] = await Promise.all([
        json<{ admin: AuthenticatedAdmin; metrics: Metrics }>("/api/dashboard"),
        json<{ categories: Category[] }>("/api/categories"),
        json<{ orders: Order[] }>("/api/orders"),
        json<{ media: MediaAsset[]; slots: MediaSlot[] }>("/api/media"),
      ]);
      setAdmin(dashboard.admin);
      setMetrics(dashboard.metrics);
      setCategories(categoryResult.categories);
      setOrders(orderResult.orders);
      setMedia(mediaResult.media);
      setMediaSlots(mediaResult.slots);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load operations data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [load]);

  async function run(action: () => Promise<void>, success: string) {
    setSaving(true);
    setMessage("");
    try {
      await action();
      await load();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The update could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void (async () => {
      setSaving(true);
      setMessage("");
      try {
        const result = await json<{ category: { id: string } }>("/api/categories", {
          method: "POST",
          body: JSON.stringify({ name: categoryName, description: categoryDescription, sortOrder: Number(categorySortOrder) }),
        });
        router.push(`/dashboard/categories/${encodeURIComponent(result.category.id)}`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "The category could not be created.");
      } finally {
        setSaving(false);
      }
    })();
  }

  function updateStage(order: Order, stage: OrderStage) {
    void run(() => json(`/api/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ stage }) }), `Order ${order.orderNumber} moved to ${displayOrderStage(stage)}.`);
  }

  function createMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const form = new FormData();
      form.set("name", mediaName);
      form.set("altText", mediaAltText);
      form.set("sourceType", mediaSourceType);
      if (mediaSourceType === "upload" && mediaFile) form.set("file", mediaFile);
      if (mediaSourceType === "url") form.set("imageUrl", mediaUrl);
      if (mediaSourceType === "color") form.set("backgroundColor", mediaColor);
      const response = await fetch("/api/media", { method: "POST", body: form });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The media item could not be saved.");
      setMediaName(""); setMediaAltText(""); setMediaUrl(""); setMediaColor("#A88957"); setMediaFile(null);
    }, "Media added to the library.");
  }

  function beginMediaEdit(asset: MediaAsset) {
    setEditingMedia(asset);
    setEditingMediaName(asset.name);
    setEditingMediaAltText(asset.altText ?? "");
    setEditingMediaUrl(asset.imageUrl ?? "");
    setEditingMediaColor(asset.backgroundColor ?? "#A88957");
  }

  function updateMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMedia) return;
    void run(async () => {
      const update: Record<string, string> = { name: editingMediaName, altText: editingMediaAltText };
      if (editingMedia.sourceType === "url") update.imageUrl = editingMediaUrl;
      if (editingMedia.sourceType === "color") update.backgroundColor = editingMediaColor;
      await json(`/api/media/${encodeURIComponent(editingMedia.id)}`, { method: "PATCH", body: JSON.stringify(update) });
      setEditingMedia(null);
    }, "Media details updated.");
  }

  function deleteMedia(asset: MediaAsset) {
    if (!window.confirm(`Remove ${asset.name} from the library? Images currently used on the storefront cannot be removed.`)) return;
    void run(() => json(`/api/media/${encodeURIComponent(asset.id)}`, { method: "DELETE" }), `${asset.name} removed from the library.`);
  }

  function assignMediaSlot(slot: MediaSlot, mediaAssetId: string) {
    if (!mediaAssetId) return;
    void run(() => json(`/api/media/slots/${encodeURIComponent(slot.slot_key)}`, { method: "PATCH", body: JSON.stringify({ mediaAssetId }) }), `${slot.label} updated on the storefront.`);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>ZARI · Private operations</p><h1>Atelier desk</h1></div>
        <div className={styles.headerActions}><p>{admin.fullName}<span>{admin.role}</span></p><button onClick={() => void signOut()}>Sign out</button></div>
      </header>

      {message && <p className={styles.message} role="status">{message}</p>}
      {loading ? <p className={styles.loading}>Loading operations data…</p> : <>
        <section className={styles.metrics} aria-label="Operations overview">
          <Metric label="Open orders" value={metrics?.openOrders ?? 0} dark />
          <Metric label="Awaiting payment" value={metrics?.awaitingPayment ?? 0} />
          <Metric label="Low stock lines" value={metrics?.lowStock ?? 0} gold />
          <Metric label="Visible products" value={metrics?.visibleProducts ?? 0} />
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Catalog</p><h2>Categories</h2></div><p>Open a category to manage its storefront cover, products, and inventory on a dedicated page.</p></div>
          <div className={styles.categoryGrid}>
            {categories.map((category) => <Link href={`/dashboard/categories/${encodeURIComponent(category.id)}`} key={category.id} className={styles.categoryCard}>
              <CategoryVisual category={category} asset={media.find((item) => item.id === category.mediaAssetId)} />
              <span className={styles.categoryCardBody}><span className={styles.categoryCardMeta}>{category.isActive ? "Active" : "Hidden"} · {category.productCount} {category.productCount === 1 ? "piece" : "pieces"}</span><strong>{category.name}</strong><span>{category.description || "No collection description yet."}</span><span className={styles.openCategory}>Manage category →</span></span>
            </Link>)}
            {categories.length === 0 && <Empty text="Create your first category." />}
          </div>
          <form className={`${styles.formCard} ${styles.categoryCreateForm}`} onSubmit={createCategory}>
            <p className={styles.eyebrow}>New category</p>
            <p className={styles.categoryFormNote}>Create the category first. Its storefront cover and products are managed on the category page.</p>
            <label>Name<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></label>
            <label>Short description<textarea value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} rows={2} /></label>
            <label>Display order<input value={categorySortOrder} onChange={(event) => setCategorySortOrder(event.target.value)} type="number" min="0" required /></label>
            <button className={styles.primaryButton} disabled={saving}>Create and manage category</button>
          </form>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Visual library</p><h2>Storefront media</h2></div><p>Create a named image, external image link, or colour treatment once, then assign it anywhere on the public website.</p></div>
          <div className={styles.mediaLayout}>
            <div>
              <div className={styles.slotGrid}>{mediaSlots.map((slot) => <article className={styles.slot} key={slot.slot_key}>
                <div><h3>{slot.label}</h3><p>{slot.description}</p></div>
                <label>Assigned media<select value={slot.media_asset_id ?? ""} onChange={(event) => assignMediaSlot(slot, event.target.value)} disabled={saving}><option value="" disabled>Select media</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label>
              </article>)}</div>
              <div className={styles.mediaGrid}>{media.map((asset) => <article className={styles.mediaCard} key={asset.id}>
                <MediaPreview asset={asset} />
                <div><p className={styles.mediaType}>{asset.sourceType}</p><h3>{asset.name}</h3><p>{asset.altText || "No alt text yet."}</p><div className={styles.mediaActions}><button className={styles.textButton} type="button" onClick={() => beginMediaEdit(asset)} disabled={saving}>Edit</button><button className={styles.dangerButton} type="button" onClick={() => deleteMedia(asset)} disabled={saving}>Remove</button></div></div>
              </article>)}</div>
              {media.length === 0 && <Empty text="Add your first visual to the media library." />}
            </div>
            {editingMedia ? <form className={styles.formCard} onSubmit={updateMedia}>
              <p className={styles.eyebrow}>Edit media</p>
              <label>Name<input value={editingMediaName} onChange={(event) => setEditingMediaName(event.target.value)} required /></label>
              <label>Image description (alt text)<input value={editingMediaAltText} onChange={(event) => setEditingMediaAltText(event.target.value)} placeholder="Describe the image for visitors" /></label>
              {editingMedia.sourceType === "url" && <label>Image URL<input value={editingMediaUrl} onChange={(event) => setEditingMediaUrl(event.target.value)} type="url" placeholder="https://…" required /></label>}
              {editingMedia.sourceType === "color" && <label>Colour code<input value={editingMediaColor} onChange={(event) => setEditingMediaColor(event.target.value)} pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?" placeholder="#A88957" required /></label>}
              {editingMedia.sourceType === "upload" && <p className={styles.formHint}>To replace an uploaded image, add the replacement to the library and assign it where needed.</p>}
              <button className={styles.primaryButton} disabled={saving}>Save media details</button><button className={styles.textButton} type="button" onClick={() => setEditingMedia(null)} disabled={saving}>Cancel</button>
            </form> : <form className={styles.formCard} onSubmit={createMedia}>
              <p className={styles.eyebrow}>Add to library</p>
              <label>Name<input value={mediaName} onChange={(event) => setMediaName(event.target.value)} placeholder="e.g. Autumn collection hero" required /></label>
              <label>Image description (alt text)<input value={mediaAltText} onChange={(event) => setMediaAltText(event.target.value)} placeholder="Describe the image for visitors" /></label>
              <label>Source<select value={mediaSourceType} onChange={(event) => setMediaSourceType(event.target.value as MediaAsset["sourceType"])}><option value="upload">Upload image</option><option value="url">Image link</option><option value="color">Colour only</option></select></label>
              {mediaSourceType === "upload" && <label>Image file<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)} required /></label>}
              {mediaSourceType === "url" && <label>Image URL<input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} type="url" placeholder="https://…" required /></label>}
              {mediaSourceType === "color" && <label>Colour code<input value={mediaColor} onChange={(event) => setMediaColor(event.target.value)} pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?" placeholder="#A88957" required /></label>}
              <button className={styles.primaryButton} disabled={saving}>{mediaSourceType === "upload" ? "Upload image" : "Save media"}</button>
            </form>}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Order desk</p><h2>Customer orders</h2></div><p>Moving an order to paid reserves its inventory. Cancelling a paid order returns it.</p></div>
          <div className={styles.orders}>
            {orders.length === 0 ? <Empty text="No website orders yet." /> : orders.map((order) => <article key={order.id} className={styles.order}>
              <div><p className={styles.orderNumber}>{order.orderNumber}</p><h3>{order.customerName}</h3><p className={styles.contact}>{order.customerEmail}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</p><p className={styles.items}>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}</p>{order.deliveryAddress && <p className={styles.note}>{order.deliveryAddress}</p>}{order.notes && <p className={styles.note}>{order.notes}</p>}<time>{date(order.createdAt)}</time></div>
              <label className={styles.selectLabel}>Stage<select value={order.stage} onChange={(event) => updateStage(order, event.target.value as OrderStage)} disabled={saving || order.stage === "delivered" || order.stage === "cancelled"}>{orderStages.map((stage) => <option key={stage} value={stage}>{displayOrderStage(stage)}</option>)}</select></label>
            </article>)}
          </div>
        </section>
      </>}
    </main>
  );
}

function Metric({ label, value, dark, gold }: { label: string; value: number; dark?: boolean; gold?: boolean }) {
  return <article className={`${styles.metric}${dark ? ` ${styles.dark}` : ""}${gold ? ` ${styles.gold}` : ""}`}><p>{label}</p><strong>{value}</strong></article>;
}

function Empty({ text }: { text: string }) {
  return <p className={styles.empty}>{text}</p>;
}

function MediaPreview({ asset }: { asset: MediaAsset }) {
  return <div className={styles.mediaPreview} style={{ backgroundColor: asset.backgroundColor ?? "#e7e4dc", backgroundImage: asset.previewUrl ? `url(${asset.previewUrl})` : undefined }} aria-label={asset.altText ?? asset.name} role="img" />;
}

function CategoryVisual({ category, asset }: { category: Category; asset?: MediaAsset }) {
  const imageUrl = asset?.previewUrl ?? category.imageUrl;
  return <div className={styles.categoryVisual} style={{ backgroundColor: asset?.backgroundColor ?? "#d8d0c1", backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }} role="img" aria-label={asset?.altText ?? category.name} />;
}
