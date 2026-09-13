"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthenticatedAdmin } from "@/lib/server/auth";
import { displayOrderStage, orderStages, type OrderStage } from "@/lib/data/orders";
import styles from "./operations.module.css";

type Metrics = { openOrders: number; awaitingPayment: number; lowStock: number; visibleProducts: number };
type Category = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; mediaAssetId: string | null; sortOrder: number; isActive: boolean; productCount: number };
type Product = { sku: string; name: string; stock: number; reorderLevel: number; isActive: boolean; categoryId: string | null; categoryName: string | null; description: string | null; imageUrl: string | null; mediaAssetId: string | null; pricePaise: number | null; isVisible: boolean; sortOrder: number; tags: string[]; dimensions: string | null; material: string | null; weave: string | null; colour: string | null; pileHeight: string | null; origin: string | null };
type Order = { id: number; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string | null; deliveryAddress: string | null; notes: string | null; stage: OrderStage; createdAt: string; items: { sku: string; name: string; quantity: number }[] };
type MediaAsset = { id: string; name: string; altText: string | null; sourceType: "upload" | "url" | "color"; imageUrl: string | null; backgroundColor: string | null; previewUrl: string | null };
type MediaSlot = { slot_key: string; label: string; description: string; media_asset_id: string | null };

function currency(value: number | null) {
  return value === null ? "On request" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
}

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
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [mediaSlots, setMediaSlots] = useState<MediaSlot[]>([]);
  const [mediaName, setMediaName] = useState("");
  const [mediaAltText, setMediaAltText] = useState("");
  const [mediaSourceType, setMediaSourceType] = useState<MediaAsset["sourceType"]>("upload");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaColor, setMediaColor] = useState("#A88957");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryMediaAssetId, setCategoryMediaAssetId] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState("0");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productMediaAssetId, setProductMediaAssetId] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("0");
  const [productReorder, setProductReorder] = useState("0");
  const [productTags, setProductTags] = useState("");
  const [productDimensions, setProductDimensions] = useState("");
  const [productMaterial, setProductMaterial] = useState("");
  const [productWeave, setProductWeave] = useState("");
  const [productColour, setProductColour] = useState("");
  const [productPileHeight, setProductPileHeight] = useState("");
  const [productOrigin, setProductOrigin] = useState("Bhadohi, India");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboard, categoryResult, productResult, orderResult, mediaResult] = await Promise.all([
        json<{ admin: AuthenticatedAdmin; metrics: Metrics }>("/api/dashboard"),
        json<{ categories: Category[] }>("/api/categories"),
        json<{ products: Product[] }>("/api/products"),
        json<{ orders: Order[] }>("/api/orders"),
        json<{ media: MediaAsset[]; slots: MediaSlot[] }>("/api/media"),
      ]);
      setAdmin(dashboard.admin);
      setMetrics(dashboard.metrics);
      setCategories(categoryResult.categories);
      setProducts(productResult.products);
      setOrders(orderResult.orders);
      setMedia(mediaResult.media);
      setMediaSlots(mediaResult.slots);
      setProductCategoryId((current) => current || categoryResult.categories.find((category) => category.isActive)?.id || "");
      setSelectedCategoryId((current) => categoryResult.categories.some((category) => category.id === current) ? current : categoryResult.categories[0]?.id ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load operations data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadInitialDashboard() {
      try {
        const [dashboard, categoryResult, productResult, orderResult, mediaResult] = await Promise.all([
          json<{ admin: AuthenticatedAdmin; metrics: Metrics }>("/api/dashboard"),
          json<{ categories: Category[] }>("/api/categories"),
          json<{ products: Product[] }>("/api/products"),
          json<{ orders: Order[] }>("/api/orders"),
          json<{ media: MediaAsset[]; slots: MediaSlot[] }>("/api/media"),
        ]);
        setAdmin(dashboard.admin);
        setMetrics(dashboard.metrics);
        setCategories(categoryResult.categories);
        setProducts(productResult.products);
        setOrders(orderResult.orders);
        setMedia(mediaResult.media);
        setMediaSlots(mediaResult.slots);
        setProductCategoryId(categoryResult.categories.find((category) => category.isActive)?.id || "");
        setSelectedCategoryId(categoryResult.categories[0]?.id ?? "");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load operations data.");
      } finally {
        setLoading(false);
      }
    }
    void loadInitialDashboard();
  }, []);

  const lowStock = useMemo(() => products.filter((product) => product.isActive && product.stock <= product.reorderLevel), [products]);
  const selectedCategory = useMemo(() => categories.find((category) => category.id === selectedCategoryId) ?? null, [categories, selectedCategoryId]);
  const selectedProducts = useMemo(() => products.filter((product) => product.categoryId === selectedCategoryId), [products, selectedCategoryId]);

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
    void run(async () => {
      await json("/api/categories", { method: "POST", body: JSON.stringify({
        name: categoryName, description: categoryDescription, mediaAssetId: categoryMediaAssetId || undefined, sortOrder: Number(categorySortOrder),
      }) });
      setCategoryName(""); setCategoryDescription(""); setCategoryMediaAssetId(""); setCategorySortOrder("0");
    }, "Category created and ready for products.");
  }

  function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await json("/api/products", { method: "POST", body: JSON.stringify({
        sku: productSku, name: productName, categoryId: productCategoryId, description: productDescription,
        mediaAssetId: productMediaAssetId || undefined, pricePaise: productPrice === "" ? null : Math.round(Number(productPrice) * 100),
        stock: Number(productStock), reorderLevel: Number(productReorder), sortOrder: 0,
        tags: productTags.split(",").map((tag) => tag.trim()).filter(Boolean), dimensions: productDimensions,
        material: productMaterial, weave: productWeave, colour: productColour, pileHeight: productPileHeight, origin: productOrigin,
      }) });
      setProductSku(""); setProductName(""); setProductDescription(""); setProductMediaAssetId(""); setProductPrice(""); setProductStock("0"); setProductReorder("0");
      setProductTags(""); setProductDimensions(""); setProductMaterial(""); setProductWeave(""); setProductColour(""); setProductPileHeight(""); setProductOrigin("Bhadohi, India");
    }, "Product added to the catalog and inventory.");
  }

  function updateStage(order: Order, stage: OrderStage) {
    void run(() => json(`/api/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ stage }) }), `Order ${order.orderNumber} moved to ${displayOrderStage(stage)}.`);
  }

  function updateStock(product: Product, stock: number) {
    void run(() => json(`/api/products/${encodeURIComponent(product.sku)}`, { method: "PATCH", body: JSON.stringify({ stock }) }), `Inventory saved for ${product.sku}.`);
  }

  function updateProductDetails(product: Product, details: Pick<Product, "tags" | "dimensions" | "material" | "weave" | "colour" | "pileHeight" | "origin" | "pricePaise">) {
    void run(() => json(`/api/products/${encodeURIComponent(product.sku)}`, { method: "PATCH", body: JSON.stringify(details) }), `${product.name} details updated.`);
  }

  function toggleCategory(category: Category) {
    void run(() => json(`/api/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !category.isActive }) }), `${category.name} is now ${category.isActive ? "hidden" : "active"}.`);
  }

  function selectCategory(category: Category) {
    setSelectedCategoryId(category.id);
    if (category.isActive) setProductCategoryId(category.id);
  }

  function deleteCategory(category: Category) {
    if (!window.confirm(`Remove ${category.name}? This is only possible when it contains no products.`)) return;
    void run(() => json(`/api/categories/${category.id}`, { method: "DELETE" }), `${category.name} removed from the catalog.`);
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
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Catalog</p><h2>Categories</h2></div><p>Choose a collection to manage its visible products, their images, and live inventory.</p></div>
          <div className={styles.catalogWorkspace}>
            <div className={styles.categoryGrid}>
              {categories.map((category) => <button type="button" key={category.id} className={`${styles.categoryCard}${category.id === selectedCategoryId ? ` ${styles.selectedCategory}` : ""}`} onClick={() => selectCategory(category)}>
                <CategoryVisual category={category} asset={media.find((item) => item.id === category.mediaAssetId)} />
                <span className={styles.categoryCardBody}><span className={styles.categoryCardMeta}>{category.isActive ? "Active" : "Hidden"} · {category.productCount} {category.productCount === 1 ? "piece" : "pieces"}</span><strong>{category.name}</strong><span>{category.description || "No collection description yet."}</span></span>
              </button>)}
              {categories.length === 0 && <Empty text="Create your first category." />}
            </div>

            <aside className={styles.categoryDetail}>
              {selectedCategory ? <>
                <div className={styles.categoryDetailHeader}>
                  <div><p className={styles.eyebrow}>{selectedCategory.isActive ? "Visible on storefront" : "Hidden from storefront"}</p><h3>{selectedCategory.name}</h3><p>/{selectedCategory.slug}</p></div>
                  <div className={styles.categoryActions}><button className={styles.textButton} disabled={saving} onClick={() => toggleCategory(selectedCategory)}>{selectedCategory.isActive ? "Hide" : "Activate"}</button><button className={styles.dangerButton} disabled={saving} onClick={() => deleteCategory(selectedCategory)}>Remove</button></div>
                </div>
                <CategoryVisual category={selectedCategory} asset={media.find((item) => item.id === selectedCategory.mediaAssetId)} large />
                <p className={styles.categoryDescription}>{selectedCategory.description || "Add a short description to introduce this collection."}</p>
                <div className={styles.detailHeading}><div><p className={styles.eyebrow}>Collection inventory</p><h4>{selectedProducts.length} {selectedProducts.length === 1 ? "product" : "products"}</h4></div><span>{selectedProducts.reduce((total, product) => total + product.stock, 0)} in stock</span></div>
                <div className={styles.inventoryCards}>{selectedProducts.length ? selectedProducts.map((product) => <ProductInventoryCard key={product.sku} product={product} asset={media.find((item) => item.id === product.mediaAssetId)} saving={saving} onSave={updateProductDetails} />) : <Empty text="This category has no products yet. Add the first piece below." />}</div>
              </> : <Empty text="Select or create a category to manage its inventory." />}
            </aside>
          </div>
          <form className={`${styles.formCard} ${styles.categoryCreateForm}`} onSubmit={createCategory}><p className={styles.eyebrow}>New category</p><label>Name<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></label><label>Short description<textarea value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} rows={2} /></label><label>Collection visual<select value={categoryMediaAssetId} onChange={(event) => setCategoryMediaAssetId(event.target.value)}><option value="">Choose from library</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><label>Display order<input value={categorySortOrder} onChange={(event) => setCategorySortOrder(event.target.value)} type="number" min="0" required /></label><button className={styles.primaryButton} disabled={saving}>Create category</button></form>
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
                <div><p className={styles.mediaType}>{asset.sourceType}</p><h3>{asset.name}</h3><p>{asset.altText || "No alt text yet."}</p></div>
              </article>)}</div>
              {media.length === 0 && <Empty text="Add your first visual to the media library." />}
            </div>
            <form className={styles.formCard} onSubmit={createMedia}>
              <p className={styles.eyebrow}>Add to library</p>
              <label>Name<input value={mediaName} onChange={(event) => setMediaName(event.target.value)} placeholder="e.g. Autumn collection hero" required /></label>
              <label>Image description (alt text)<input value={mediaAltText} onChange={(event) => setMediaAltText(event.target.value)} placeholder="Describe the image for visitors" /></label>
              <label>Source<select value={mediaSourceType} onChange={(event) => setMediaSourceType(event.target.value as MediaAsset["sourceType"])}><option value="upload">Upload image</option><option value="url">Image link</option><option value="color">Colour only</option></select></label>
              {mediaSourceType === "upload" && <label>Image file<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)} required /></label>}
              {mediaSourceType === "url" && <label>Image URL<input value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} type="url" placeholder="https://…" required /></label>}
              {mediaSourceType === "color" && <label>Colour code<input value={mediaColor} onChange={(event) => setMediaColor(event.target.value)} pattern="#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?" placeholder="#A88957" required /></label>}
              <button className={styles.primaryButton} disabled={saving}>{mediaSourceType === "upload" ? "Upload image" : "Save media"}</button>
            </form>
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

        <section className={styles.section}>
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Stock room</p><h2>Products & inventory</h2></div><p>{lowStock.length ? `${lowStock.length} active products need attention.` : "All active stock lines are above their reorder level."}</p></div>
          <div className={styles.productLayout}>
            <div className={styles.tableWrap}><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Reorder</th><th /></tr></thead><tbody>{products.map((product) => <ProductRow key={`${product.sku}-${product.stock}`} product={product} saving={saving} onSave={updateStock} />)}</tbody></table>{products.length === 0 && <Empty text="No products created yet." />}</div>
            <form className={styles.formCard} onSubmit={createProduct}><p className={styles.eyebrow}>New rug</p><label>SKU<input value={productSku} onChange={(event) => setProductSku(event.target.value.toUpperCase())} placeholder="ZAR-NEW-001" required /></label><label>Product name<input value={productName} onChange={(event) => setProductName(event.target.value)} required /></label><label>Category<select value={productCategoryId} onChange={(event) => setProductCategoryId(event.target.value)} required><option value="" disabled>Select category</option>{categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Description<textarea value={productDescription} onChange={(event) => setProductDescription(event.target.value)} rows={3} /></label><label>Product visual<select value={productMediaAssetId} onChange={(event) => setProductMediaAssetId(event.target.value)}><option value="">Choose from library</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label><label>Tags<input value={productTags} onChange={(event) => setProductTags(event.target.value)} placeholder="hand-knotted, wool, new arrival" /></label><div className={styles.twoFields}><label>Size<input value={productDimensions} onChange={(event) => setProductDimensions(event.target.value)} placeholder="6 × 9 ft" /></label><label>Material<input value={productMaterial} onChange={(event) => setProductMaterial(event.target.value)} placeholder="Wool & silk" /></label></div><div className={styles.twoFields}><label>Weave<input value={productWeave} onChange={(event) => setProductWeave(event.target.value)} placeholder="Hand-knotted" /></label><label>Colour<input value={productColour} onChange={(event) => setProductColour(event.target.value)} placeholder="Ivory, gold" /></label></div><div className={styles.twoFields}><label>Pile height<input value={productPileHeight} onChange={(event) => setProductPileHeight(event.target.value)} placeholder="10 mm" /></label><label>Origin<input value={productOrigin} onChange={(event) => setProductOrigin(event.target.value)} /></label></div><label>Price (₹)<input value={productPrice} onChange={(event) => setProductPrice(event.target.value)} type="number" min="0" step="1" /></label><div className={styles.twoFields}><label>Opening stock<input value={productStock} onChange={(event) => setProductStock(event.target.value)} type="number" min="0" required /></label><label>Reorder at<input value={productReorder} onChange={(event) => setProductReorder(event.target.value)} type="number" min="0" required /></label></div><button className={styles.primaryButton} disabled={saving || !categories.some((category) => category.isActive)}>Add product</button></form>
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

function CategoryVisual({ category, asset, large = false }: { category: Category; asset?: MediaAsset; large?: boolean }) {
  const imageUrl = asset?.previewUrl ?? category.imageUrl;
  return <div className={large ? styles.categoryDetailVisual : styles.categoryVisual} style={{ backgroundColor: asset?.backgroundColor ?? "#d8d0c1", backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }} role="img" aria-label={asset?.altText ?? category.name} />;
}

function ProductInventoryCard({ product, asset, saving, onSave }: { product: Product; asset?: MediaAsset; saving: boolean; onSave: (product: Product, details: Pick<Product, "tags" | "dimensions" | "material" | "weave" | "colour" | "pileHeight" | "origin" | "pricePaise">) => void }) {
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState(product.tags.join(", "));
  const [dimensions, setDimensions] = useState(product.dimensions ?? "");
  const [material, setMaterial] = useState(product.material ?? "");
  const [weave, setWeave] = useState(product.weave ?? "");
  const [colour, setColour] = useState(product.colour ?? "");
  const [pileHeight, setPileHeight] = useState(product.pileHeight ?? "");
  const [origin, setOrigin] = useState(product.origin ?? "");
  const [price, setPrice] = useState(product.pricePaise === null ? "" : String(product.pricePaise / 100));
  const imageUrl = asset?.previewUrl ?? product.imageUrl;
  const specs = [["Size", product.dimensions], ["Material", product.material], ["Weave", product.weave], ["Colour", product.colour], ["Pile", product.pileHeight], ["Origin", product.origin]].filter(([, value]) => Boolean(value));
  function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(product, { tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), dimensions, material, weave, colour, pileHeight, origin, pricePaise: price === "" ? null : Math.round(Number(price) * 100) });
    setEditing(false);
  }
  return <article className={`${styles.inventoryCard}${product.isActive && product.stock <= product.reorderLevel ? ` ${styles.inventoryLowStock}` : ""}`}>
    <div className={styles.productVisual} style={{ backgroundColor: asset?.backgroundColor ?? "#e7e4dc", backgroundImage: imageUrl ? `url(${imageUrl})` : undefined }} role="img" aria-label={asset?.altText ?? product.name} />
    <div className={styles.inventoryCardBody}><div className={styles.productCardHeading}><div><p>{product.sku}</p><h5>{product.name}</h5></div><strong>{currency(product.pricePaise)}</strong></div><p className={styles.inventoryStock}>{product.stock} in stock <span>· reorder at {product.reorderLevel}</span></p>{product.tags.length > 0 && <div className={styles.tagList}>{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}{specs.length > 0 && <dl className={styles.specList}>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}<button className={styles.textButton} onClick={() => setEditing((value) => !value)} disabled={saving}>{editing ? "Close editor" : "Edit rug details"}</button>{editing && <form className={styles.productDetailsForm} onSubmit={saveDetails}><label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="wool, hand-knotted" /></label><div><label>Size<input value={dimensions} onChange={(event) => setDimensions(event.target.value)} /></label><label>Material<input value={material} onChange={(event) => setMaterial(event.target.value)} /></label></div><div><label>Weave<input value={weave} onChange={(event) => setWeave(event.target.value)} /></label><label>Colour<input value={colour} onChange={(event) => setColour(event.target.value)} /></label></div><div><label>Pile height<input value={pileHeight} onChange={(event) => setPileHeight(event.target.value)} /></label><label>Origin<input value={origin} onChange={(event) => setOrigin(event.target.value)} /></label></div><label>Price (₹)<input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="1" /></label><button className={styles.primaryButton} disabled={saving}>Save rug details</button></form>}</div>
  </article>;
}

function ProductRow({ product, saving, onSave }: { product: Product; saving: boolean; onSave: (product: Product, stock: number) => void }) {
  const [stock, setStock] = useState(String(product.stock));
  return <tr className={product.isActive && product.stock <= product.reorderLevel ? styles.lowStock : ""}><td><strong>{product.name}</strong><span>{product.sku}{!product.isVisible && " · hidden"}</span></td><td>{product.categoryName ?? "Uncategorised"}</td><td>{currency(product.pricePaise)}</td><td><input aria-label={`${product.name} stock`} value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" /></td><td>{product.reorderLevel}</td><td><button className={styles.textButton} disabled={saving || Number(stock) === product.stock || !Number.isInteger(Number(stock)) || Number(stock) < 0} onClick={() => onSave(product, Number(stock))}>Save</button></td></tr>;
}
