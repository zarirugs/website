"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MediaVisual from "./MediaVisual";
import AdminShell, { type WorkspaceView } from "./AdminShell";
import { Feedback, LoadingState, EmptyState, useFeedback } from "./Feedback";
import { requestJson as json } from "@/lib/client/api";

import type { AuthenticatedAdmin } from "@/lib/server/auth";
import {
  displayOrderStage,
  orderStages,
  type OrderStage,
} from "@/lib/data/orders";
import styles from "./operations.module.css";

type Metrics = {
  openOrders: number;
  awaitingPayment: number;
  lowStock: number;
  visibleProducts: number;
};
type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  mediaAssetId: string | null;
  coverPreviewUrl: string | null;
  coverBackgroundColor: string | null;
  coverAltText: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};
type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  stage: OrderStage;
  createdAt: string;
  items: { sku: string; name: string; quantity: number }[];
};
type MediaAsset = {
  id: string;
  name: string;
  altText: string | null;
  sourceType: "upload" | "url" | "color";
  mediaKind: "image" | "video";
  imageUrl: string | null;
  backgroundColor: string | null;
  previewUrl: string | null;
};
type MediaSlot = {
  slot_key: string;
  label: string;
  description: string;
  media_asset_id: string | null;
};

function date(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(
    new Date(
      /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
        ? value
        : `${value.replace(" ", "T")}Z`,
    ),
  );
}

export default function OperationsDashboard({
  initialAdmin,
  view = "overview",
}: {
  initialAdmin: AuthenticatedAdmin;
  view?: WorkspaceView;
}) {
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
  const [mediaSourceType, setMediaSourceType] =
    useState<MediaAsset["sourceType"]>("upload");
  const [mediaKind, setMediaKind] = useState<MediaAsset["mediaKind"]>("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaColor, setMediaColor] = useState("#A88957");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const mediaEditor = useRef<HTMLFormElement>(null);
  const [editingMedia, setEditingMedia] = useState<MediaAsset | null>(null);
  const [editingMediaName, setEditingMediaName] = useState("");
  const [editingMediaAltText, setEditingMediaAltText] = useState("");
  const [editingMediaUrl, setEditingMediaUrl] = useState("");
  const [editingMediaColor, setEditingMediaColor] = useState("#A88957");
  const { feedback, clearFeedback, success, failure } = useFeedback();
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [mediaFilter, setMediaFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboard, categoryResult, orderResult, mediaResult] =
        await Promise.all([
          json<{ admin: AuthenticatedAdmin; metrics: Metrics }>(
            "/api/dashboard",
          ),
          view === "categories"
            ? json<{ categories: Category[] }>("/api/categories")
            : Promise.resolve({ categories: [] }),
          view === "orders"
            ? json<{ orders: Order[] }>("/api/orders")
            : Promise.resolve({ orders: [] }),
          view === "media"
            ? json<{ media: MediaAsset[]; slots: MediaSlot[] }>("/api/media")
            : Promise.resolve({ media: [], slots: [] }),
        ]);
      setAdmin(dashboard.admin);
      setMetrics(dashboard.metrics);
      setCategories(categoryResult.categories);
      setOrders(orderResult.orders);
      setMedia(mediaResult.media);
      setMediaSlots(mediaResult.slots);
      return true;
    } catch (error) {
      failure(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [failure, view]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [load]);

  useEffect(() => {
    if (editingMedia) {
      mediaEditor.current?.scrollIntoView({ block: "nearest" });
      mediaEditor.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
  }, [editingMedia]);

  async function run(action: () => Promise<void>, successMessage: string) {
    setSaving(true);
    clearFeedback();
    try {
      await action();
      if (await load()) success(successMessage);
      else
        failure(
          new Error(
            "Your change was saved, but the workspace could not refresh. Choose Refresh to load the latest data.",
          ),
        );
    } catch (error) {
      failure(error);
    } finally {
      setSaving(false);
    }
  }

  function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void (async () => {
      setSaving(true);
      clearFeedback();
      try {
        const result = await json<{ category: { id: string } }>(
          "/api/categories",
          {
            method: "POST",
            body: JSON.stringify({
              name: categoryName,
              description: categoryDescription,
              sortOrder: Number(categorySortOrder),
            }),
          },
        );
        router.push(
          `/dashboard/categories/${encodeURIComponent(result.category.id)}`,
        );
      } catch (error) {
        failure(error);
      } finally {
        setSaving(false);
      }
    })();
  }

  function updateStage(order: Order, stage: OrderStage) {
    void run(
      () =>
        json(`/api/orders/${order.id}`, {
          method: "PATCH",
          body: JSON.stringify({ stage }),
        }),
      `Order ${order.orderNumber} moved to ${displayOrderStage(stage)}.`,
    );
  }

  function createMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const form = new FormData();
      form.set("name", mediaName);
      form.set("altText", mediaAltText);
      form.set("sourceType", mediaSourceType);
      form.set("mediaKind", mediaKind);
      if (mediaSourceType === "upload" && mediaFile)
        form.set("file", mediaFile);
      if (mediaSourceType === "url") form.set("imageUrl", mediaUrl);
      if (mediaSourceType === "color") form.set("backgroundColor", mediaColor);
      await json("/api/media", { method: "POST", body: form });
      setMediaName("");
      setMediaAltText("");
      setMediaUrl("");
      setMediaColor("#A88957");
      setMediaFile(null);
      setMediaKind("image");
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
      const update: Record<string, string> = {
        name: editingMediaName,
        altText: editingMediaAltText,
      };
      if (editingMedia.sourceType === "url") update.imageUrl = editingMediaUrl;
      if (editingMedia.sourceType === "color")
        update.backgroundColor = editingMediaColor;
      await json(`/api/media/${encodeURIComponent(editingMedia.id)}`, {
        method: "PATCH",
        body: JSON.stringify(update),
      });
      setEditingMedia(null);
    }, "Media details updated.");
  }

  function deleteMedia(asset: MediaAsset) {
    if (
      !window.confirm(
        `Remove ${asset.name} from the library? Images currently used on the storefront cannot be removed.`,
      )
    )
      return;
    void run(
      () =>
        json(`/api/media/${encodeURIComponent(asset.id)}`, {
          method: "DELETE",
        }),
      `${asset.name} removed from the library.`,
    );
  }

  function assignMediaSlot(slot: MediaSlot, mediaAssetId: string) {
    if (!mediaAssetId) return;
    void run(
      () =>
        json(`/api/media/slots/${encodeURIComponent(slot.slot_key)}`, {
          method: "PATCH",
          body: JSON.stringify({ mediaAssetId }),
        }),
      `${slot.label} updated on the storefront.`,
    );
  }

  const search = (value: string) =>
    value.toLowerCase().includes(query.trim().toLowerCase());
  const filteredCategories = categories.filter(
    (category) =>
      search(`${category.name} ${category.description ?? ""}`) &&
      (visibility === "all" ||
        category.isActive === (visibility === "visible")),
  );
  const filteredMedia = media.filter(
    (asset) =>
      search(`${asset.name} ${asset.altText ?? ""}`) &&
      (mediaFilter === "all" ||
        (mediaFilter === "color"
          ? asset.sourceType === "color"
          : asset.mediaKind === mediaFilter && asset.sourceType !== "color")),
  );
  const filteredOrders = orders.filter(
    (order) =>
      search(
        `${order.orderNumber} ${order.customerName} ${order.customerEmail} ${order.items.map((item) => `${item.name} ${item.sku}`).join(" ")}`,
      ) &&
      (stageFilter === "all" || order.stage === stageFilter),
  );
  const headings = {
    overview: [
      "Atelier overview",
      "A considered space for your collections, imagery and customer orders.",
    ],
    categories: [
      "Collections",
      "Curate the pieces, presentation and availability of every collection.",
    ],
    media: [
      "Media library",
      "Manage the imagery and films that bring the ZARI storefront to life.",
    ],
    orders: [
      "Order desk",
      "Follow every request from first enquiry to delivery.",
    ],
  };

  return (
    <AdminShell admin={admin} active={view}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Private operations / {view === "overview" ? "The atelier" : view}
          </p>
          <h1>{headings[view][0]}</h1>
          <p className={styles.intro}>{headings[view][1]}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => {
              clearFeedback();
              void load();
            }}
            disabled={loading || saving}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <a
            className={styles.primaryButton}
            href="https://zarirugs.com/shop"
            target="_blank"
            rel="noopener noreferrer"
          >
            View shop ↗
          </a>
        </div>
      </header>
      <Feedback value={feedback} />
      {loading && !metrics ? (
        <LoadingState label="Loading operations data…" />
      ) : (
        metrics && (
          <>
            {view === "overview" && (
              <>
                <section
                  className={styles.metrics}
                  aria-label="Operations overview"
                >
                  <Metric
                    label="Open orders"
                    value={metrics.openOrders}
                    href="/dashboard?view=orders"
                    note="Requests in progress"
                    dark
                  />
                  <Metric
                    label="Awaiting payment"
                    value={metrics.awaitingPayment}
                    href="/dashboard?view=orders"
                    note="Ready for follow-up"
                  />
                  <Metric
                    label="Low stock lines"
                    value={metrics.lowStock}
                    href="/dashboard?view=categories"
                    note={
                      metrics.lowStock
                        ? "Review collection inventory"
                        : "Stock levels look healthy"
                    }
                    gold={metrics.lowStock > 0}
                  />
                  <Metric
                    label="Visible products"
                    value={metrics.visibleProducts}
                    href="/dashboard?view=categories"
                    note="Published to your storefront"
                  />
                </section>
                <div className={styles.quickLinks}>
                  <Link href="/dashboard?view=categories">
                    <span>01 / Collections</span>
                    <h2>Curate the collection</h2>
                    <p>Manage category covers, product details and stock.</p>
                    <strong>Open collections →</strong>
                  </Link>
                  <Link href="/dashboard?view=media">
                    <span>02 / Visual identity</span>
                    <h2>Set the scene</h2>
                    <p>Organise imagery and assign storefront placements.</p>
                    <strong>Open media library →</strong>
                  </Link>
                  <Link href="/dashboard?view=orders">
                    <span>03 / Customer care</span>
                    <h2>Attend to every request</h2>
                    <p>Review enquiries, payments and delivery stages.</p>
                    <strong>Open order desk →</strong>
                  </Link>
                </div>
              </>
            )}

            {view === "categories" && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>
                  <div>
                    <p className={styles.eyebrow}>Catalog</p>
                    <h2>Categories</h2>
                  </div>
                  <p>
                    Open a category to manage its storefront cover, products,
                    and inventory on a dedicated page.
                  </p>
                </div>
                <div className={styles.toolbar}>
                  <label className={styles.field}>
                    Search collections
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Name or description"
                    />
                  </label>
                  <label className={styles.field}>
                    Visibility
                    <select
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value)}
                    >
                      <option value="all">All collections</option>
                      <option value="visible">Visible</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </label>
                  <p className={styles.count} role="status">
                    {filteredCategories.length} of {categories.length}{" "}
                    collections
                  </p>
                </div>
                <div className={styles.categoryGrid}>
                  {filteredCategories.map((category) => (
                    <Link
                      href={`/dashboard/categories/${encodeURIComponent(category.id)}`}
                      key={category.id}
                      className={styles.categoryCard}
                    >
                      <CategoryVisual category={category} />
                      <span className={styles.categoryCardBody}>
                        <span className={styles.categoryCardMeta}>
                          {category.isActive ? "Active" : "Hidden"} ·{" "}
                          {category.productCount}{" "}
                          {category.productCount === 1 ? "piece" : "pieces"}
                        </span>
                        <strong>{category.name}</strong>
                        <span>
                          {category.description ||
                            "No collection description yet."}
                        </span>
                        <span className={styles.openCategory}>
                          Manage category →
                        </span>
                      </span>
                    </Link>
                  ))}
                  {filteredCategories.length === 0 && (
                    <EmptyState
                      title={
                        categories.length
                          ? "No matching collections"
                          : "Your collection starts here"
                      }
                      description={
                        categories.length
                          ? "Try another search or visibility filter."
                          : "Create a category below, then add its cover and pieces."
                      }
                    />
                  )}
                </div>
                <details className={styles.createPanel}>
                  <summary>
                    Create a new category <span aria-hidden="true">＋</span>
                  </summary>
                  <form
                    className={`${styles.formCard} ${styles.categoryCreateForm}`}
                    onSubmit={createCategory}
                  >
                    <p className={styles.eyebrow}>New category</p>
                    <p className={styles.categoryFormNote}>
                      Create the category first. Its storefront cover and
                      products are managed on the category page.
                    </p>
                    <label>
                      Name
                      <input
                        value={categoryName}
                        onChange={(event) =>
                          setCategoryName(event.target.value)
                        }
                        required
                      />
                    </label>
                    <label>
                      Short description
                      <textarea
                        value={categoryDescription}
                        onChange={(event) =>
                          setCategoryDescription(event.target.value)
                        }
                        rows={2}
                      />
                    </label>
                    <label>
                      Display order
                      <input
                        value={categorySortOrder}
                        onChange={(event) =>
                          setCategorySortOrder(event.target.value)
                        }
                        type="number"
                        min="0"
                        required
                      />
                    </label>
                    <button className={styles.primaryButton} disabled={saving}>
                      Create and manage category
                    </button>
                  </form>
                </details>
              </section>
            )}

            {view === "media" && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>
                  <div>
                    <p className={styles.eyebrow}>Visual library</p>
                    <h2>Storefront media</h2>
                  </div>
                  <p>
                    Create a named image, hero video, external link, or colour
                    treatment, then assign it to the public website.
                  </p>
                </div>
                <div className={styles.toolbar}>
                  <label className={styles.field}>
                    Search media
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Name or description"
                    />
                  </label>
                  <label className={styles.field}>
                    Filter media type
                    <select
                      value={mediaFilter}
                      onChange={(event) => setMediaFilter(event.target.value)}
                    >
                      <option value="all">All media</option>
                      <option value="image">Images</option>
                      <option value="video">Videos</option>
                      <option value="color">Colours</option>
                    </select>
                  </label>
                  <p className={styles.count} role="status">
                    {filteredMedia.length} of {media.length} assets
                  </p>
                </div>
                <div className={styles.mediaLayout}>
                  <div>
                    <div className={styles.slotGrid}>
                      {mediaSlots.map((slot) => (
                        <article className={styles.slot} key={slot.slot_key}>
                          <div>
                            <h3>{slot.label}</h3>
                            <p>{slot.description}</p>
                          </div>
                          <label className={styles.field}>
                            Assigned media
                            <select
                              value={slot.media_asset_id ?? ""}
                              onChange={(event) =>
                                assignMediaSlot(slot, event.target.value)
                              }
                              disabled={saving}
                            >
                              <option value="" disabled>
                                Select media
                              </option>
                              {media
                                .filter(
                                  (asset) =>
                                    slot.slot_key === "hero" ||
                                    asset.mediaKind !== "video",
                                )
                                .map((asset) => (
                                  <option key={asset.id} value={asset.id}>
                                    {asset.name}
                                    {asset.mediaKind === "video"
                                      ? " · Video"
                                      : ""}
                                  </option>
                                ))}
                            </select>
                          </label>
                        </article>
                      ))}
                    </div>
                    <div className={styles.mediaGrid}>
                      {filteredMedia.map((asset) => (
                        <article className={styles.mediaCard} key={asset.id}>
                          <MediaPreview asset={asset} />
                          <div>
                            <p className={styles.mediaType}>
                              {asset.mediaKind} · {asset.sourceType}
                            </p>
                            <h3>{asset.name}</h3>
                            <p>{asset.altText || "No description yet."}</p>
                            <div className={styles.mediaActions}>
                              <button
                                className={styles.textButton}
                                type="button"
                                aria-label={`Edit ${asset.name}`}
                                onClick={() => beginMediaEdit(asset)}
                                disabled={saving}
                              >
                                Edit
                              </button>
                              <button
                                className={styles.dangerButton}
                                type="button"
                                aria-label={`Remove ${asset.name}`}
                                onClick={() => deleteMedia(asset)}
                                disabled={saving}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    {filteredMedia.length === 0 && (
                      <EmptyState
                        title={
                          media.length
                            ? "No matching media"
                            : "Build your visual library"
                        }
                        description={
                          media.length
                            ? "Try another search or media type."
                            : "Add an image, video or colour using the form."
                        }
                      />
                    )}
                  </div>
                  {editingMedia ? (
                    <form
                      ref={mediaEditor}
                      className={styles.formCard}
                      onSubmit={updateMedia}
                    >
                      <p className={styles.eyebrow}>Edit media</p>
                      <label>
                        Name
                        <input
                          value={editingMediaName}
                          onChange={(event) =>
                            setEditingMediaName(event.target.value)
                          }
                          required
                        />
                      </label>
                      <label>
                        Image description (alt text)
                        <input
                          value={editingMediaAltText}
                          onChange={(event) =>
                            setEditingMediaAltText(event.target.value)
                          }
                          placeholder="Describe the image for visitors"
                        />
                      </label>
                      {editingMedia.sourceType === "url" && (
                        <label>
                          Image URL
                          <input
                            value={editingMediaUrl}
                            onChange={(event) =>
                              setEditingMediaUrl(event.target.value)
                            }
                            type="url"
                            placeholder="https://…"
                            required
                          />
                        </label>
                      )}
                      {editingMedia.sourceType === "color" && (
                        <label>
                          Colour code
                          <input
                            value={editingMediaColor}
                            onChange={(event) =>
                              setEditingMediaColor(event.target.value)
                            }
                            pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?"
                            placeholder="#A88957"
                            required
                          />
                        </label>
                      )}
                      {editingMedia.sourceType === "upload" && (
                        <p className={styles.formHint}>
                          To replace an uploaded image, add the replacement to
                          the library and assign it where needed.
                        </p>
                      )}
                      <button
                        className={styles.primaryButton}
                        disabled={saving}
                      >
                        Save media details
                      </button>
                      <button
                        className={styles.textButton}
                        type="button"
                        onClick={() => setEditingMedia(null)}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <form className={styles.formCard} onSubmit={createMedia}>
                      <p className={styles.eyebrow}>Add to library</p>
                      <label>
                        Name
                        <input
                          value={mediaName}
                          onChange={(event) => setMediaName(event.target.value)}
                          placeholder="e.g. Autumn collection hero"
                          required
                        />
                      </label>
                      <label>
                        Media description
                        <input
                          value={mediaAltText}
                          onChange={(event) =>
                            setMediaAltText(event.target.value)
                          }
                          placeholder="Describe the image or video"
                        />
                      </label>
                      {mediaSourceType !== "color" && (
                        <label>
                          Media type
                          <select
                            value={mediaKind}
                            onChange={(event) => {
                              setMediaKind(
                                event.target.value as MediaAsset["mediaKind"],
                              );
                              setMediaFile(null);
                            }}
                          >
                            <option value="image">Image</option>
                            <option value="video">Hero video</option>
                          </select>
                        </label>
                      )}
                      <label>
                        Source
                        <select
                          value={mediaSourceType}
                          onChange={(event) =>
                            setMediaSourceType(
                              event.target.value as MediaAsset["sourceType"],
                            )
                          }
                        >
                          <option value="upload">Upload file</option>
                          <option value="url">External link</option>
                          <option value="color">Colour only</option>
                        </select>
                      </label>
                      {mediaSourceType === "upload" && (
                        <label>
                          {mediaKind === "video"
                            ? "MP4 video file"
                            : "Image file"}
                          <input
                            key={`${mediaKind}-${mediaSourceType}-${media.length}`}
                            type="file"
                            accept={
                              mediaKind === "video"
                                ? "video/mp4"
                                : "image/jpeg,image/png,image/webp,image/avif,image/gif"
                            }
                            onChange={(event) =>
                              setMediaFile(event.target.files?.[0] ?? null)
                            }
                            required
                          />
                        </label>
                      )}
                      <p className={styles.formHint}>
                        Images: JPG, PNG, WebP, AVIF or GIF, up to 10 MB. Hero
                        videos: MP4, up to 50 MB.
                      </p>
                      {mediaSourceType === "url" && (
                        <label>
                          {mediaKind === "video"
                            ? "MP4 video URL"
                            : "Image URL"}
                          <input
                            value={mediaUrl}
                            onChange={(event) =>
                              setMediaUrl(event.target.value)
                            }
                            type="url"
                            placeholder="https://…"
                            required
                          />
                        </label>
                      )}
                      {mediaSourceType === "color" && (
                        <label>
                          Colour code
                          <input
                            value={mediaColor}
                            onChange={(event) =>
                              setMediaColor(event.target.value)
                            }
                            pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?"
                            placeholder="#A88957"
                            required
                          />
                        </label>
                      )}
                      <button
                        className={styles.primaryButton}
                        disabled={saving}
                      >
                        {mediaSourceType === "upload"
                          ? `Upload ${mediaKind}`
                          : "Save media"}
                      </button>
                    </form>
                  )}
                </div>
              </section>
            )}

            {view === "orders" && (
              <section className={styles.section}>
                <div className={styles.sectionTitle}>
                  <div>
                    <p className={styles.eyebrow}>Order desk</p>
                    <h2>Customer orders</h2>
                  </div>
                  <p>
                    Moving an order to paid reserves its inventory. Cancelling a
                    paid order returns it.
                  </p>
                </div>
                <div className={styles.toolbar}>
                  <label className={styles.field}>
                    Search orders
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Order, customer, email or SKU"
                    />
                  </label>
                  <label className={styles.field}>
                    Filter by stage
                    <select
                      value={stageFilter}
                      onChange={(event) => setStageFilter(event.target.value)}
                    >
                      <option value="all">All stages</option>
                      {orderStages.map((stage) => (
                        <option key={stage} value={stage}>
                          {displayOrderStage(stage)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className={styles.count} role="status">
                    {filteredOrders.length} of {orders.length} recent orders ·
                    Times in IST
                  </p>
                </div>
                <div className={styles.orders}>
                  {filteredOrders.length === 0 ? (
                    <EmptyState
                      title={
                        orders.length ? "No matching orders" : "No orders yet"
                      }
                      description={
                        orders.length
                          ? "Try another search or stage."
                          : "Requests from your storefront will appear here for your team to review."
                      }
                    />
                  ) : (
                    filteredOrders.map((order) => (
                      <OrderCard
                        key={`${order.id}-${order.stage}`}
                        order={order}
                        saving={saving}
                        onUpdate={updateStage}
                      />
                    ))
                  )}
                </div>
              </section>
            )}
          </>
        )
      )}
    </AdminShell>
  );
}

function Metric({
  label,
  value,
  href,
  note,
  dark,
  gold,
}: {
  label: string;
  value: number;
  href: string;
  note: string;
  dark?: boolean;
  gold?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${styles.metric}${dark ? ` ${styles.dark}` : ""}${gold ? ` ${styles.gold}` : ""}`}
    >
      <p>
        {label}
        <span aria-hidden="true">↗</span>
      </p>
      <strong>{value}</strong>
      <small>{note}</small>
    </Link>
  );
}

function OrderCard({
  order,
  saving,
  onUpdate,
}: {
  order: Order;
  saving: boolean;
  onUpdate: (order: Order, stage: OrderStage) => void;
}) {
  const [stage, setStage] = useState(order.stage);
  const terminal = order.stage === "delivered" || order.stage === "cancelled";
  return (
    <article className={styles.order}>
      <div>
        <div className={styles.orderTop}>
          <p className={styles.orderNumber}>{order.orderNumber}</p>
          <span className={styles.badge}>{displayOrderStage(order.stage)}</span>
        </div>
        <h3>{order.customerName}</h3>
        <p className={styles.contact}>
          <a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a>
          {order.customerPhone ? ` · ${order.customerPhone}` : ""}
        </p>
        <p className={styles.items}>
          {order.items
            .map((item) => `${item.quantity} × ${item.name}`)
            .join(" · ")}
        </p>
        {order.deliveryAddress && (
          <p className={styles.note}>{order.deliveryAddress}</p>
        )}
        {order.notes && <p className={styles.note}>{order.notes}</p>}
        <time
          dateTime={
            /(?:Z|[+-]\d{2}:?\d{2})$/.test(order.createdAt)
              ? order.createdAt
              : `${order.createdAt.replace(" ", "T")}Z`
          }
        >
          {date(order.createdAt)} IST
        </time>
      </div>
      <form
        className={styles.stageForm}
        onSubmit={(event) => {
          event.preventDefault();
          onUpdate(order, stage);
        }}
      >
        <label className={styles.field}>
          Order stage
          <select
            aria-label={`Stage for ${order.orderNumber}`}
            value={stage}
            onChange={(event) => setStage(event.target.value as OrderStage)}
            disabled={saving || terminal}
          >
            {orderStages.map((value) => (
              <option key={value} value={value}>
                {displayOrderStage(value)}
              </option>
            ))}
          </select>
        </label>
        {!terminal && (
          <button
            className={styles.secondaryButton}
            disabled={saving || stage === order.stage}
          >
            {saving && stage !== order.stage ? "Saving…" : "Update stage"}
          </button>
        )}
        <p className={styles.formHint}>
          {terminal
            ? "This order is closed."
            : "Stock changes only when you save."}
        </p>
      </form>
    </article>
  );
}

function MediaPreview({ asset }: { asset: MediaAsset }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (asset.mediaKind === "video") {
    return asset.previewUrl && failedUrl !== asset.previewUrl ? (
      <video
        className={styles.mediaPreview}
        src={asset.previewUrl}
        aria-label={asset.altText ?? asset.name}
        controls
        muted
        playsInline
        preload="metadata"
        onError={() => setFailedUrl(asset.previewUrl)}
      />
    ) : (
      <div
        className={`${styles.mediaPreview} ${styles.unavailable}`}
        role="img"
        aria-label={`${asset.name}: video unavailable`}
      >
        Video unavailable
      </div>
    );
  }
  return (
    <MediaVisual
      className={styles.mediaPreview}
      imageUrl={asset.previewUrl}
      backgroundColor={asset.backgroundColor}
      label={asset.altText ?? asset.name}
    />
  );
}

function CategoryVisual({ category }: { category: Category }) {
  const imageUrl = category.coverPreviewUrl ?? category.imageUrl;
  return (
    <MediaVisual
      className={styles.categoryVisual}
      imageUrl={imageUrl}
      backgroundColor={category.coverBackgroundColor}
      label={category.coverAltText ?? category.name}
    />
  );
}
