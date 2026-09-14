"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { AuthenticatedAdmin } from "@/lib/server/auth";
import styles from "./category-management.module.css";

type Category = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; mediaAssetId: string | null; sortOrder: number; isActive: boolean; productCount: number };
type Product = { sku: string; name: string; stock: number; reorderLevel: number; isActive: boolean; categoryId: string | null; categoryName: string | null; description: string | null; imageUrl: string | null; mediaAssetId: string | null; pricePaise: number | null; isVisible: boolean; sortOrder: number; tags: string[]; dimensions: string | null; material: string | null; weave: string | null; colour: string | null; pileHeight: string | null; origin: string | null };
type MediaAsset = { id: string; name: string; altText: string | null; sourceType: "upload" | "url" | "color"; imageUrl: string | null; backgroundColor: string | null; previewUrl: string | null };

function currency(value: number | null) {
  return value === null ? "On request" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value / 100);
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const result = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "The request could not be completed.");
  return result as T;
}

export default function CategoryManager({ categoryId, initialAdmin }: { categoryId: string; initialAdmin: AuthenticatedAdmin }) {
  const router = useRouter();
  const [admin] = useState(initialAdmin);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [coverUploadOpen, setCoverUploadOpen] = useState(false);
  const [coverImageName, setCoverImageName] = useState("");
  const [coverAltText, setCoverAltText] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [productSku, setProductSku] = useState("");
  const [productName, setProductName] = useState("");
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

  const refresh = useCallback(async () => {
    const [categoryResult, productResult, mediaResult] = await Promise.all([
      json<{ categories: Category[] }>("/api/categories"),
      json<{ products: Product[] }>("/api/products"),
      json<{ media: MediaAsset[] }>(`/api/media?categoryId=${encodeURIComponent(categoryId)}`),
    ]);
    const nextCategory = categoryResult.categories.find((item) => item.id === categoryId) ?? null;
    setCategory(nextCategory);
    setProducts(productResult.products.filter((product) => product.categoryId === categoryId));
    setMedia(mediaResult.media);
    return nextCategory;
  }, [categoryId]);

  useEffect(() => {
    void (async () => {
      try {
        const nextCategory = await refresh();
        if (!nextCategory) {
          setMessage("This category no longer exists.");
          return;
        }
        setName(nextCategory.name);
        setDescription(nextCategory.description ?? "");
        setSortOrder(String(nextCategory.sortOrder));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load this category.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const totalStock = useMemo(() => products.reduce((total, product) => total + product.stock, 0), [products]);

  async function run(action: () => Promise<void>, success: string) {
    setSaving(true);
    setMessage("");
    try {
      await action();
      await refresh();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The update could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category) return;
    void run(
      () => json(`/api/categories/${encodeURIComponent(category.id)}`, { method: "PATCH", body: JSON.stringify({ name, description, sortOrder: Number(sortOrder) }) }),
      "Category settings saved.",
    );
  }

  function chooseCover(mediaAssetId: string | null) {
    if (!category) return;
    setCoverPickerOpen(false);
    void run(
      () => json(`/api/categories/${encodeURIComponent(category.id)}`, { method: "PATCH", body: JSON.stringify({ mediaAssetId }) }),
      mediaAssetId ? "Category cover updated." : "Original category cover restored.",
    );
  }

  function uploadCover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category || !coverFile) return;
    void run(async () => {
      const form = new FormData();
      form.set("name", coverImageName);
      form.set("altText", coverAltText);
      form.set("sourceType", "upload");
      form.set("categoryId", category.id);
      form.set("file", coverFile);
      const response = await fetch("/api/media", { method: "POST", body: form });
      const result = await response.json().catch(() => ({})) as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error ?? "The image could not be uploaded.");
      await json(`/api/categories/${encodeURIComponent(category.id)}`, { method: "PATCH", body: JSON.stringify({ mediaAssetId: result.id }) });
      setCoverImageName("");
      setCoverAltText("");
      setCoverFile(null);
      setCoverUploadOpen(false);
      setCoverPickerOpen(false);
    }, "Category cover uploaded and selected.");
  }

  function toggleCategory() {
    if (!category) return;
    void run(
      () => json(`/api/categories/${encodeURIComponent(category.id)}`, { method: "PATCH", body: JSON.stringify({ isActive: !category.isActive }) }),
      `${category.name} is now ${category.isActive ? "hidden" : "visible"} on the storefront.`,
    );
  }

  function deleteCategory() {
    if (!category || !window.confirm(`Remove ${category.name}? This is only possible when it contains no products.`)) return;
    void (async () => {
      setSaving(true);
      setMessage("");
      try {
        await json(`/api/categories/${encodeURIComponent(category.id)}`, { method: "DELETE" });
        router.replace("/dashboard");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "The category could not be removed.");
      } finally {
        setSaving(false);
      }
    })();
  }

  function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category) return;
    void run(async () => {
      await json("/api/products", { method: "POST", body: JSON.stringify({
        sku: productSku,
        name: productName,
        categoryId: category.id,
        description: productDescription,
        mediaAssetId: productMediaAssetId || undefined,
        pricePaise: productPrice === "" ? null : Math.round(Number(productPrice) * 100),
        stock: Number(productStock),
        reorderLevel: Number(productReorder),
        sortOrder: 0,
        tags: productTags.split(",").map((tag) => tag.trim()).filter(Boolean),
        dimensions: productDimensions,
        material: productMaterial,
        weave: productWeave,
        colour: productColour,
        pileHeight: productPileHeight,
        origin: productOrigin,
      }) });
      setProductSku(""); setProductName(""); setProductDescription(""); setProductMediaAssetId(""); setProductPrice(""); setProductStock("0"); setProductReorder("0");
      setProductTags(""); setProductDimensions(""); setProductMaterial(""); setProductWeave(""); setProductColour(""); setProductPileHeight(""); setProductOrigin("Bhadohi, India");
    }, "Product added to this category.");
  }

  function updateProduct(sku: string, values: Record<string, unknown>, success: string) {
    void run(() => json(`/api/products/${encodeURIComponent(sku)}`, { method: "PATCH", body: JSON.stringify(values) }), success);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  if (loading) return <main className={styles.page}><p className={styles.loading}>Loading category…</p></main>;

  if (!category) return <main className={styles.page}><Link href="/dashboard" className={styles.backLink}>← Back to categories</Link><p className={styles.message} role="status">{message || "This category could not be found."}</p></main>;

  const coverAsset = media.find((asset) => asset.id === category.mediaAssetId);
  const coverImageUrl = coverAsset?.previewUrl ?? category.imageUrl;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div><Link href="/dashboard" className={styles.backLink}>← All categories</Link><p className={styles.eyebrow}>Catalog · category</p><h1>{category.name}</h1><p className={styles.slug}>/{category.slug}</p></div>
        <div className={styles.headerActions}><p>{admin.fullName}<span>{admin.role}</span></p><button onClick={() => void signOut()}>Sign out</button></div>
      </header>

      {message && <p className={styles.message} role="status">{message}</p>}

      <section className={styles.categorySetup}>
        <div className={styles.coverPanel}>
          <div className={styles.coverPreview} style={{ backgroundColor: coverAsset?.backgroundColor ?? "#d8d0c1", backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : undefined }} role="img" aria-label={coverAsset?.altText ?? `${category.name} category cover`} />
          <p className={styles.coverNote}>This cover is shown on the main website&apos;s category listing only. It is never used as a product image.</p>
        </div>
        <form className={styles.settingsForm} onSubmit={saveCategory}>
          <div className={styles.formHeading}><div><p className={styles.eyebrow}>Storefront category</p><h2>Category settings</h2></div><span className={category.isActive ? styles.active : styles.hidden}>{category.isActive ? "Visible" : "Hidden"}</span></div>
          <label>Category name<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></label>
          <div className={styles.coverControl}><span>Storefront category cover</span><div><strong>{coverAsset?.name ?? "Original category cover"}</strong><button className={styles.textButton} type="button" disabled={saving} onClick={() => setCoverPickerOpen((open) => !open)}>{coverPickerOpen ? "Close image library" : "Change cover"}</button></div></div>
          <label>Display order<input value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} type="number" min="0" required /></label>
          <div className={styles.actions}><button className={styles.primaryButton} disabled={saving}>Save category</button><button className={styles.textButton} type="button" disabled={saving} onClick={toggleCategory}>{category.isActive ? "Hide from storefront" : "Show on storefront"}</button><button className={styles.dangerButton} type="button" disabled={saving} onClick={deleteCategory}>Remove category</button></div>
        </form>
      </section>

      {coverPickerOpen && <section className={styles.coverPicker} aria-label={`${category.name} image library`}>
        <div className={styles.pickerHeading}><div><p className={styles.eyebrow}>{category.name} image library</p><h2>Choose a cover</h2><p>Only images uploaded to {category.name} appear here. They are not available in other categories.</p></div><button className={styles.primaryButton} type="button" disabled={saving} onClick={() => setCoverUploadOpen((open) => !open)}>{coverUploadOpen ? "Close upload" : "Add image"}</button></div>
        {coverUploadOpen && <form className={styles.coverUploadForm} onSubmit={uploadCover}>
          <label>Image name<input value={coverImageName} onChange={(event) => setCoverImageName(event.target.value)} placeholder={`${category.name} cover`} required /></label>
          <label>Image description (alt text)<input value={coverAltText} onChange={(event) => setCoverAltText(event.target.value)} placeholder="Describe the image for visitors" /></label>
          <label>Image file<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} required /></label>
          <button className={styles.primaryButton} disabled={saving}>Upload and use cover</button>
        </form>}
        <div className={styles.coverChoices}>
          <button className={`${styles.coverChoice}${!category.mediaAssetId ? ` ${styles.selectedCover}` : ""}`} type="button" disabled={saving} onClick={() => chooseCover(null)}><div className={styles.originalCover}>Original cover</div><span>Use original image</span></button>
          {media.map((asset) => <button className={`${styles.coverChoice}${asset.id === category.mediaAssetId ? ` ${styles.selectedCover}` : ""}`} type="button" key={asset.id} disabled={saving} onClick={() => chooseCover(asset.id)}><div className={styles.choicePreview} style={{ backgroundColor: asset.backgroundColor ?? "#d8d0c1", backgroundImage: asset.previewUrl ? `url(${asset.previewUrl})` : undefined }} role="img" aria-label={asset.altText ?? asset.name} /><span>{asset.name}</span><small>{asset.id === category.mediaAssetId ? "Current cover" : "Use as cover"}</small></button>)}
        </div>
        {media.length === 0 && <p className={styles.empty}>No images have been added to {category.name} yet. Use “Add image” to upload the first one.</p>}
      </section>}

      <section className={styles.productSection}>
        <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Category inventory</p><h2>{products.length} {products.length === 1 ? "product" : "products"}</h2></div><p>{totalStock} in stock across this category.</p></div>
        <div className={styles.productGrid}>{products.map((product) => <ProductCard key={`${product.sku}-${product.stock}-${product.pricePaise ?? "quote"}-${product.mediaAssetId ?? "none"}`} product={product} media={media} saving={saving} onSave={updateProduct} />)}</div>
        {products.length === 0 && <p className={styles.empty}>This category has no products yet. Add the first product below.</p>}
      </section>

      <section className={styles.newProductSection}>
        <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>New product</p><h2>Add to {category.name}</h2></div><p>The product belongs to this category automatically. Its visual, if it has one, is managed independently from the category cover.</p></div>
        <form className={styles.productForm} onSubmit={createProduct}>
          <label>SKU<input value={productSku} onChange={(event) => setProductSku(event.target.value.toUpperCase())} placeholder="ZAR-NEW-001" required /></label>
          <label>Product name<input value={productName} onChange={(event) => setProductName(event.target.value)} required /></label>
          <label className={styles.wideField}>Description<textarea value={productDescription} onChange={(event) => setProductDescription(event.target.value)} rows={3} /></label>
          <label>Product visual (optional)<select value={productMediaAssetId} onChange={(event) => setProductMediaAssetId(event.target.value)}><option value="">No product visual</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select></label>
          <label>Price (₹)<input value={productPrice} onChange={(event) => setProductPrice(event.target.value)} type="number" min="0" step="1" /></label>
          <label>Opening stock<input value={productStock} onChange={(event) => setProductStock(event.target.value)} type="number" min="0" required /></label>
          <label>Reorder at<input value={productReorder} onChange={(event) => setProductReorder(event.target.value)} type="number" min="0" required /></label>
          <label className={styles.wideField}>Tags<input value={productTags} onChange={(event) => setProductTags(event.target.value)} placeholder="hand-knotted, wool, new arrival" /></label>
          <label>Size<input value={productDimensions} onChange={(event) => setProductDimensions(event.target.value)} placeholder="6 × 9 ft" /></label>
          <label>Material<input value={productMaterial} onChange={(event) => setProductMaterial(event.target.value)} placeholder="Wool & silk" /></label>
          <label>Weave<input value={productWeave} onChange={(event) => setProductWeave(event.target.value)} placeholder="Hand-knotted" /></label>
          <label>Colour<input value={productColour} onChange={(event) => setProductColour(event.target.value)} placeholder="Ivory, gold" /></label>
          <label>Pile height<input value={productPileHeight} onChange={(event) => setProductPileHeight(event.target.value)} placeholder="10 mm" /></label>
          <label>Origin<input value={productOrigin} onChange={(event) => setProductOrigin(event.target.value)} /></label>
          <button className={styles.primaryButton} disabled={saving || !category.isActive}>Add product</button>
          {!category.isActive && <p className={styles.formHint}>Activate this category before adding a product.</p>}
        </form>
      </section>
    </main>
  );
}

function ProductCard({ product, media, saving, onSave }: { product: Product; media: MediaAsset[]; saving: boolean; onSave: (sku: string, values: Record<string, unknown>, success: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [stock, setStock] = useState(String(product.stock));
  const [reorderLevel, setReorderLevel] = useState(String(product.reorderLevel));
  const [description, setDescription] = useState(product.description ?? "");
  const [mediaAssetId, setMediaAssetId] = useState(product.mediaAssetId ?? "");
  const [price, setPrice] = useState(product.pricePaise === null ? "" : String(product.pricePaise / 100));
  const [tags, setTags] = useState(product.tags.join(", "));
  const [dimensions, setDimensions] = useState(product.dimensions ?? "");
  const [material, setMaterial] = useState(product.material ?? "");
  const [weave, setWeave] = useState(product.weave ?? "");
  const [colour, setColour] = useState(product.colour ?? "");
  const [pileHeight, setPileHeight] = useState(product.pileHeight ?? "");
  const [origin, setOrigin] = useState(product.origin ?? "");
  const [isVisible, setIsVisible] = useState(product.isVisible);
  const [isActive, setIsActive] = useState(product.isActive);
  const asset = media.find((item) => item.id === product.mediaAssetId);
  const productImageUrl = asset?.previewUrl ?? product.imageUrl;
  const specs = [["Size", product.dimensions], ["Material", product.material], ["Weave", product.weave], ["Colour", product.colour], ["Pile", product.pileHeight], ["Origin", product.origin]].filter(([, value]) => Boolean(value));

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(product.sku, {
      stock: Number(stock),
      reorderLevel: Number(reorderLevel),
      description,
      mediaAssetId: mediaAssetId || null,
      pricePaise: price === "" ? null : Math.round(Number(price) * 100),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      dimensions,
      material,
      weave,
      colour,
      pileHeight,
      origin,
      isVisible,
      isActive,
    }, `${product.name} saved.`);
    setEditing(false);
  }

  return <article className={`${styles.productCard}${product.isActive && product.stock <= product.reorderLevel ? ` ${styles.lowStock}` : ""}`}>
    {productImageUrl ? <div className={styles.productVisual} style={{ backgroundColor: asset?.backgroundColor ?? "#e7e4dc", backgroundImage: `url(${productImageUrl})` }} role="img" aria-label={asset?.altText ?? product.name} /> : <div className={styles.productVisualEmpty}>No product visual</div>}
    <div className={styles.productBody}>
      <div className={styles.productHeading}><div><p>{product.sku}</p><h3>{product.name}</h3></div><strong>{currency(product.pricePaise)}</strong></div>
      <p className={styles.stockSummary}>{product.stock} in stock <span>· reorder at {product.reorderLevel}</span></p>
      {product.description && <p className={styles.description}>{product.description}</p>}
      {product.tags.length > 0 && <div className={styles.tagList}>{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
      {specs.length > 0 && <dl className={styles.specList}>{specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
      <button className={styles.textButton} type="button" onClick={() => setEditing((current) => !current)} disabled={saving}>{editing ? "Close editor" : "Manage product"}</button>
      {editing && <form className={styles.editor} onSubmit={saveProduct}>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></label>
        <label>Product visual (optional)<select value={mediaAssetId} onChange={(event) => setMediaAssetId(event.target.value)}><option value="">No product visual</option>{media.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <p className={styles.editorNote}>The category cover is intentionally not used as a product visual.</p>
        <div><label>Stock<input value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" required /></label><label>Reorder at<input value={reorderLevel} onChange={(event) => setReorderLevel(event.target.value)} type="number" min="0" required /></label></div>
        <label>Price (₹)<input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="1" /></label>
        <label>Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="wool, hand-knotted" /></label>
        <div><label>Size<input value={dimensions} onChange={(event) => setDimensions(event.target.value)} /></label><label>Material<input value={material} onChange={(event) => setMaterial(event.target.value)} /></label></div>
        <div><label>Weave<input value={weave} onChange={(event) => setWeave(event.target.value)} /></label><label>Colour<input value={colour} onChange={(event) => setColour(event.target.value)} /></label></div>
        <div><label>Pile height<input value={pileHeight} onChange={(event) => setPileHeight(event.target.value)} /></label><label>Origin<input value={origin} onChange={(event) => setOrigin(event.target.value)} /></label></div>
        <div className={styles.checks}><label><input checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} type="checkbox" /> Visible on storefront</label><label><input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" /> Active inventory line</label></div>
        <button className={styles.primaryButton} disabled={saving}>Save product</button>
      </form>}
    </div>
  </article>;
}
