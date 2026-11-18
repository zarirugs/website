"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { AuthenticatedAdmin } from "@/lib/server/auth";
import MediaVisual from "./MediaVisual";
import AdminShell from "./AdminShell";
import { Feedback, LoadingState, EmptyState, useFeedback } from "./Feedback";
import { requestJson as json } from "@/lib/client/api";
import styles from "./category-management.module.css";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  mediaAssetId: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};
type Product = {
  imageIds: string[];
  sku: string;
  name: string;
  stock: number;
  reorderLevel: number;
  isActive: boolean;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  imageUrl: string | null;
  mediaAssetId: string | null;
  pricePaise: number | null;
  isVisible: boolean;
  sortOrder: number;
  tags: string[];
  dimensions: string | null;
  material: string | null;
  weave: string | null;
  colour: string | null;
  pileHeight: string | null;
  origin: string | null;
};
type MediaAsset = {
  id: string;
  name: string;
  altText: string | null;
  sourceType: "upload" | "url" | "color";
  imageUrl: string | null;
  backgroundColor: string | null;
  previewUrl: string | null;
};

function currency(value: number | null) {
  return value === null
    ? "On request"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value / 100);
}

export default function CategoryManager({
  categoryId,
  initialAdmin,
}: {
  categoryId: string;
  initialAdmin: AuthenticatedAdmin;
}) {
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
  const [productImageIds, setProductImageIds] = useState<string[]>([]);
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
  const { feedback, clearFeedback, success, failure } = useFeedback();
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [categoryResult, productResult, mediaResult] = await Promise.all([
      json<{ categories: Category[] }>("/api/categories"),
      json<{ products: Product[] }>("/api/products"),
      json<{ media: MediaAsset[] }>(
        `/api/media?categoryId=${encodeURIComponent(categoryId)}`,
      ),
    ]);
    const nextCategory =
      categoryResult.categories.find((item) => item.id === categoryId) ?? null;
    setCategory(nextCategory);
    setProducts(
      productResult.products.filter(
        (product) => product.categoryId === categoryId,
      ),
    );
    setMedia(mediaResult.media);
    return nextCategory;
  }, [categoryId]);

  const loadCategory = useCallback(async () => {
    setLoading(true);
    clearFeedback();
    try {
      const nextCategory = await refresh();
      if (!nextCategory) throw new Error("This category no longer exists.");
      setName(nextCategory.name);
      setDescription(nextCategory.description ?? "");
      setSortOrder(String(nextCategory.sortOrder));
    } catch (error) {
      failure(error);
    } finally {
      setLoading(false);
    }
  }, [refresh, clearFeedback, failure]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategory();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCategory]);

  const totalStock = useMemo(
    () => products.reduce((total, product) => total + product.stock, 0),
    [products],
  );

  async function run(action: () => Promise<void>, successMessage: string) {
    setSaving(true);
    clearFeedback();
    try {
      await action();
      try {
        await refresh();
      } catch {
        failure(
          new Error(
            "Your change was saved, but the category could not refresh. Reload the page to see the latest data.",
          ),
        );
        return true;
      }
      success(successMessage);
      return true;
    } catch (error) {
      failure(error);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category) return;
    void run(
      () =>
        json(`/api/categories/${encodeURIComponent(category.id)}`, {
          method: "PATCH",
          body: JSON.stringify({
            name,
            description,
            sortOrder: Number(sortOrder),
          }),
        }),
      "Category settings saved.",
    );
  }

  function chooseCover(mediaAssetId: string | null) {
    if (!category) return;
    setCoverPickerOpen(false);
    void run(
      () =>
        json(`/api/categories/${encodeURIComponent(category.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ mediaAssetId }),
        }),
      mediaAssetId
        ? "Category cover updated."
        : "Original category cover restored.",
    );
  }

  function deleteCoverImage(asset: MediaAsset) {
    if (
      asset.sourceType !== "upload" ||
      !window.confirm(
        `Delete “${asset.name}” from the ${category?.name ?? "category"} image library? Images currently used as a cover or product image must be replaced first.`,
      )
    )
      return;
    void run(
      () =>
        json(`/api/media/${encodeURIComponent(asset.id)}`, {
          method: "DELETE",
        }),
      "Image deleted from the library.",
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
      const result = await json<{ id: string }>("/api/media", {
        method: "POST",
        body: form,
      });
      await json(`/api/categories/${encodeURIComponent(category.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ mediaAssetId: result.id }),
      });
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
      () =>
        json(`/api/categories/${encodeURIComponent(category.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: !category.isActive }),
        }),
      `${category.name} is now ${category.isActive ? "hidden" : "visible"} on the storefront.`,
    );
  }

  function deleteCategory() {
    if (
      !category ||
      !window.confirm(
        `Remove ${category.name}? This is only possible when it contains no products.`,
      )
    )
      return;
    void (async () => {
      setSaving(true);
      clearFeedback();
      try {
        await json(`/api/categories/${encodeURIComponent(category.id)}`, {
          method: "DELETE",
        });
        router.replace("/dashboard?view=categories");
      } catch (error) {
        failure(error);
      } finally {
        setSaving(false);
      }
    })();
  }

  async function uploadProductImage(file: File): Promise<string> {
    const form = new FormData();
    form.set("name", file.name.replace(/\.[^.]+$/, ""));
    form.set("sourceType", "upload");
    form.set("categoryId", categoryId);
    form.set("file", file);
    const result = await json<{ id: string }>("/api/media", {
      method: "POST",
      body: form,
    });
    await refresh();
    return result.id;
  }

  function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!category) return;
    void run(async () => {
      await json("/api/products", {
        method: "POST",
        body: JSON.stringify({
          sku: productSku,
          name: productName,
          categoryId: category.id,
          description: productDescription,
          imageIds: productImageIds,
          pricePaise:
            productPrice === "" ? null : Math.round(Number(productPrice) * 100),
          stock: Number(productStock),
          reorderLevel: Number(productReorder),
          sortOrder: 0,
          tags: productTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          dimensions: productDimensions,
          material: productMaterial,
          weave: productWeave,
          colour: productColour,
          pileHeight: productPileHeight,
          origin: productOrigin,
        }),
      });
      setProductSku("");
      setProductName("");
      setProductDescription("");
      setProductImageIds([]);
      setProductPrice("");
      setProductStock("0");
      setProductReorder("0");
      setProductTags("");
      setProductDimensions("");
      setProductMaterial("");
      setProductWeave("");
      setProductColour("");
      setProductPileHeight("");
      setProductOrigin("Bhadohi, India");
    }, "Product added to this category.");
  }

  function updateProduct(
    sku: string,
    values: Record<string, unknown>,
    success: string,
  ) {
    return run(
      () =>
        json(`/api/products/${encodeURIComponent(sku)}`, {
          method: "PATCH",
          body: JSON.stringify(values),
        }),
      success,
    );
  }

  if (loading || !category)
    return (
      <AdminShell admin={admin} active="categories">
        <Link href="/dashboard?view=categories" className={styles.backLink}>
          ← All collections
        </Link>
        <Feedback value={feedback} />
        {loading ? (
          <LoadingState label="Loading collection…" />
        ) : (
          <>
            <EmptyState
              title="Collection unavailable"
              description="It may have been removed, or the connection was interrupted."
            />
            <button
              className={styles.secondaryButton}
              onClick={() => void loadCategory()}
            >
              Try again
            </button>
          </>
        )}
      </AdminShell>
    );

  const filteredProducts = products.filter(
    (product) =>
      `${product.name} ${product.sku} ${product.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (stockFilter === "all" ||
        (stockFilter === "low"
          ? product.isActive && product.stock <= product.reorderLevel
          : stockFilter === "hidden"
            ? !product.isVisible || !product.isActive
            : product.isVisible && product.isActive)),
  );

  const coverAsset = media.find((asset) => asset.id === category.mediaAssetId);
  const coverImageUrl = coverAsset?.previewUrl ?? category.imageUrl;

  return (
    <AdminShell admin={admin} active="categories">
      <Link href="/dashboard?view=categories" className={styles.backLink}>
        ← All collections
      </Link>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Collections / Category</p>
          <h1>{category.name}</h1>
          <p className={styles.slug}>
            /{category.slug} · {products.length}{" "}
            {products.length === 1 ? "piece" : "pieces"} · {totalStock} in stock
          </p>
        </div>
        <div className={styles.headerActions}>
          <a
            className={styles.secondaryButton}
            href={`https://zarirugs.com/shop?category=${encodeURIComponent(category.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview collection ↗
          </a>
          <button
            className={styles.primaryButton}
            onClick={() => {
              setShowNewProduct(true);
              window.setTimeout(
                () =>
                  document
                    .getElementById("new-product")
                    ?.scrollIntoView({ block: "start" }),
                0,
              );
            }}
          >
            Add product
          </button>
        </div>
      </header>
      <Feedback value={feedback} />
      <section className={styles.categorySetup}>
        <div className={styles.coverPanel}>
          <MediaVisual
            className={styles.coverPreview}
            imageUrl={coverImageUrl}
            backgroundColor={coverAsset?.backgroundColor}
            label={coverAsset?.altText ?? `${category.name} category cover`}
          />
          <p className={styles.coverNote}>
            This cover is shown on the main website&apos;s category listing
            only. It is never used as a product image.
          </p>
        </div>
        <form className={styles.settingsForm} onSubmit={saveCategory}>
          <div className={styles.formHeading}>
            <div>
              <p className={styles.eyebrow}>Storefront category</p>
              <h2>Category settings</h2>
            </div>
            <span className={category.isActive ? styles.active : styles.hidden}>
              {category.isActive ? "Visible" : "Hidden"}
            </span>
          </div>
          <label>
            Category name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </label>
          <div className={styles.coverControl}>
            <span>Storefront category cover</span>
            <div>
              <strong>{coverAsset?.name ?? "Original category cover"}</strong>
              <button
                className={styles.textButton}
                type="button"
                disabled={saving}
                aria-expanded={coverPickerOpen}
                aria-controls="cover-library"
                onClick={() => setCoverPickerOpen((open) => !open)}
              >
                {coverPickerOpen ? "Close image library" : "Change cover"}
              </button>
            </div>
          </div>
          <label>
            Display order
            <input
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              type="number"
              min="0"
              max="10000"
              required
            />
          </label>
          <div className={styles.actions}>
            <button className={styles.primaryButton} disabled={saving}>
              Save category
            </button>
            <button
              className={styles.textButton}
              type="button"
              disabled={saving}
              onClick={toggleCategory}
            >
              {category.isActive
                ? "Hide from storefront"
                : "Show on storefront"}
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              disabled={saving || products.length > 0}
              title={
                products.length
                  ? "Move the products before removing this category"
                  : undefined
              }
              onClick={deleteCategory}
            >
              Remove category
            </button>
          </div>
        </form>
      </section>

      {coverPickerOpen && (
        <section
          id="cover-library"
          className={styles.coverPicker}
          aria-label={`${category.name} image library`}
        >
          <div className={styles.pickerHeading}>
            <div>
              <p className={styles.eyebrow}>{category.name} image library</p>
              <h2>Choose a cover</h2>
              <p>
                Only images uploaded to {category.name} appear here. They are
                not available in other categories.
              </p>
            </div>
            <button
              className={styles.primaryButton}
              type="button"
              disabled={saving}
              aria-expanded={coverUploadOpen}
              aria-controls="cover-upload"
              onClick={() => setCoverUploadOpen((open) => !open)}
            >
              {coverUploadOpen ? "Close upload" : "Add image"}
            </button>
          </div>
          {coverUploadOpen && (
            <form
              id="cover-upload"
              className={styles.coverUploadForm}
              onSubmit={uploadCover}
            >
              <label>
                Image name
                <input
                  value={coverImageName}
                  onChange={(event) => setCoverImageName(event.target.value)}
                  placeholder={`${category.name} cover`}
                  required
                />
              </label>
              <label>
                Image description (alt text)
                <input
                  value={coverAltText}
                  onChange={(event) => setCoverAltText(event.target.value)}
                  placeholder="Describe the image for visitors"
                />
              </label>
              <label>
                Image file
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  onChange={(event) =>
                    setCoverFile(event.target.files?.[0] ?? null)
                  }
                  required
                />
              </label>
              <button className={styles.primaryButton} disabled={saving}>
                Upload and use cover
              </button>
            </form>
          )}
          <div className={styles.coverChoices}>
            <button
              className={`${styles.coverChoice}${!category.mediaAssetId ? ` ${styles.selectedCover}` : ""}`}
              type="button"
              aria-pressed={!category.mediaAssetId}
              disabled={saving}
              onClick={() => chooseCover(null)}
            >
              <div className={styles.originalCover}>Original cover</div>
              <span>Use original image</span>
            </button>
            {media.map((asset) => (
              <div className={styles.coverChoiceCard} key={asset.id}>
                <button
                  className={`${styles.coverChoice}${asset.id === category.mediaAssetId ? ` ${styles.selectedCover}` : ""}`}
                  type="button"
                  aria-pressed={asset.id === category.mediaAssetId}
                  disabled={saving}
                  onClick={() => chooseCover(asset.id)}
                >
                  <MediaVisual
                    className={styles.choicePreview}
                    imageUrl={asset.previewUrl}
                    backgroundColor={asset.backgroundColor}
                    label={asset.altText ?? asset.name}
                  />
                  <span>{asset.name}</span>
                  <small>
                    {asset.id === category.mediaAssetId
                      ? "Current cover"
                      : "Use as cover"}
                  </small>
                </button>
                {asset.sourceType === "upload" && (
                  <button
                    className={styles.deleteCoverImage}
                    type="button"
                    disabled={saving}
                    aria-label={`Delete ${asset.name}`}
                    onClick={() => deleteCoverImage(asset)}
                  >
                    Delete image
                  </button>
                )}
              </div>
            ))}
          </div>
          {media.length === 0 && (
            <p className={styles.empty}>
              No images have been added to {category.name} yet. Use “Add image”
              to upload the first one.
            </p>
          )}
        </section>
      )}

      <section className={styles.productSection}>
        <div className={styles.sectionTitle}>
          <div>
            <p className={styles.eyebrow}>Category inventory</p>
            <h2>
              {products.length} {products.length === 1 ? "product" : "products"}
            </h2>
          </div>
          <p>{totalStock} in stock across this category.</p>
        </div>
        <div className={styles.toolbar}>
          <label className={styles.field}>
            Search products
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Product name, SKU or tag"
            />
          </label>
          <label className={styles.field}>
            Inventory filter
            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
            >
              <option value="all">All products</option>
              <option value="visible">Visible & active</option>
              <option value="hidden">Hidden or inactive</option>
              <option value="low">Low stock</option>
            </select>
          </label>
          <p className={styles.count} role="status">
            {filteredProducts.length} of {products.length} products
          </p>
        </div>
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={JSON.stringify(product)}
              product={product}
              media={media}
              saving={saving}
              onSave={updateProduct}
              onUpload={uploadProductImage}
              onBusy={setSaving}
            />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <EmptyState
            title={
              products.length
                ? "No matching products"
                : "A new collection awaits"
            }
            description={
              products.length
                ? "Try another search or inventory filter."
                : "Choose Add product to introduce your first piece."
            }
          />
        )}
      </section>

      <section id="new-product" className={styles.newProductSection}>
        <div className={styles.sectionTitle}>
          <div>
            <p className={styles.eyebrow}>New product</p>
            <h2>Add to {category.name}</h2>
          </div>
          <p>
            The product belongs to this category automatically. Its visual, if
            it has one, is managed independently from the category cover.
          </p>
        </div>
        <button
          className={styles.secondaryButton}
          type="button"
          aria-expanded={showNewProduct}
          aria-controls="new-product-form"
          onClick={() => setShowNewProduct((show) => !show)}
        >
          {showNewProduct ? "Close new product form" : "Add a product"}
        </button>
        {showNewProduct && (
          <form
            id="new-product-form"
            className={styles.productForm}
            onSubmit={createProduct}
          >
            <label>
              SKU
              <input
                value={productSku}
                onChange={(event) =>
                  setProductSku(event.target.value.toUpperCase())
                }
                placeholder="ZAR-NEW-001"
                required
              />
            </label>
            <label>
              Product name
              <input
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                required
              />
            </label>
            <label className={styles.wideField}>
              Description
              <textarea
                value={productDescription}
                onChange={(event) => setProductDescription(event.target.value)}
                rows={3}
              />
            </label>
            <ProductImages
              media={media}
              ids={productImageIds}
              onChange={setProductImageIds}
              disabled={saving}
              onUpload={uploadProductImage}
              onBusy={setSaving}
            />
            <label>
              Price (₹)
              <input
                value={productPrice}
                onChange={(event) => setProductPrice(event.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            <label>
              Opening stock
              <input
                value={productStock}
                onChange={(event) => setProductStock(event.target.value)}
                type="number"
                min="0"
                max="100000"
                required
              />
            </label>
            <label>
              Reorder at
              <input
                value={productReorder}
                onChange={(event) => setProductReorder(event.target.value)}
                type="number"
                min="0"
                max="100000"
                required
              />
            </label>
            <label className={styles.wideField}>
              Tags
              <input
                value={productTags}
                onChange={(event) => setProductTags(event.target.value)}
                placeholder="hand-knotted, wool, new arrival"
              />
            </label>
            <label>
              Size
              <input
                value={productDimensions}
                onChange={(event) => setProductDimensions(event.target.value)}
                placeholder="6 × 9 ft"
              />
            </label>
            <label>
              Material
              <input
                value={productMaterial}
                onChange={(event) => setProductMaterial(event.target.value)}
                placeholder="Wool & silk"
              />
            </label>
            <label>
              Weave
              <input
                value={productWeave}
                onChange={(event) => setProductWeave(event.target.value)}
                placeholder="Hand-knotted"
              />
            </label>
            <label>
              Colour
              <input
                value={productColour}
                onChange={(event) => setProductColour(event.target.value)}
                placeholder="Ivory, gold"
              />
            </label>
            <label>
              Pile height
              <input
                value={productPileHeight}
                onChange={(event) => setProductPileHeight(event.target.value)}
                placeholder="10 mm"
              />
            </label>
            <label>
              Origin
              <input
                value={productOrigin}
                onChange={(event) => setProductOrigin(event.target.value)}
              />
            </label>
            <button
              className={styles.primaryButton}
              disabled={saving || !category.isActive}
            >
              Add product
            </button>
            {!category.isActive && (
              <p className={styles.formHint}>
                Activate this category before adding a product.
              </p>
            )}
          </form>
        )}
      </section>
    </AdminShell>
  );
}

function ProductCard({
  product,
  media,
  saving,
  onSave,
  onUpload,
  onBusy,
}: {
  onUpload: (file: File) => Promise<string>;
  onBusy: (busy: boolean) => void;
  product: Product;
  media: MediaAsset[];
  saving: boolean;
  onSave: (
    sku: string,
    values: Record<string, unknown>,
    success: string,
  ) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [productName, setProductName] = useState(product.name);
  const [sortOrder, setSortOrder] = useState(String(product.sortOrder));
  const [stock, setStock] = useState(String(product.stock));
  const [reorderLevel, setReorderLevel] = useState(
    String(product.reorderLevel),
  );
  const [description, setDescription] = useState(product.description ?? "");
  const [imageIds, setImageIds] = useState(product.imageIds);
  const [price, setPrice] = useState(
    product.pricePaise === null ? "" : String(product.pricePaise / 100),
  );
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
  const specs = [
    ["Size", product.dimensions],
    ["Material", product.material],
    ["Weave", product.weave],
    ["Colour", product.colour],
    ["Pile", product.pileHeight],
    ["Origin", product.origin],
  ].filter(([, value]) => Boolean(value));

  function resetDraft() {
    setProductName(product.name);
    setSortOrder(String(product.sortOrder));
    setStock(String(product.stock));
    setReorderLevel(String(product.reorderLevel));
    setDescription(product.description ?? "");
    setImageIds(product.imageIds);
    setPrice(
      product.pricePaise === null ? "" : String(product.pricePaise / 100),
    );
    setTags(product.tags.join(", "));
    setDimensions(product.dimensions ?? "");
    setMaterial(product.material ?? "");
    setWeave(product.weave ?? "");
    setColour(product.colour ?? "");
    setPileHeight(product.pileHeight ?? "");
    setOrigin(product.origin ?? "");
    setIsVisible(product.isVisible);
    setIsActive(product.isActive);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await onSave(
      product.sku,
      {
        name: productName,
        sortOrder: Number(sortOrder),
        stock: Number(stock),
        reorderLevel: Number(reorderLevel),
        description,
        imageIds,
        pricePaise: price === "" ? null : Math.round(Number(price) * 100),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        dimensions,
        material,
        weave,
        colour,
        pileHeight,
        origin,
        isVisible,
        isActive,
      },
      `${productName} saved.`,
    );
    if (saved) setEditing(false);
  }

  return (
    <article
      className={`${styles.productCard}${product.isActive && product.stock <= product.reorderLevel ? ` ${styles.lowStock}` : ""}`}
    >
      {productImageUrl ? (
        <MediaVisual
          className={styles.productVisual}
          imageUrl={productImageUrl}
          backgroundColor={asset?.backgroundColor}
          label={asset?.altText ?? product.name}
        />
      ) : (
        <div className={styles.productVisualEmpty}>No product visual</div>
      )}
      <div className={styles.productBody}>
        <div className={styles.productHeading}>
          <div>
            <p>{product.sku}</p>
            <h3>{product.name}</h3>
          </div>
          <strong>{currency(product.pricePaise)}</strong>
        </div>
        <div className={styles.productBadges}>
          <span
            className={
              product.isVisible && product.isActive
                ? styles.active
                : styles.hidden
            }
          >
            {!product.isActive
              ? "Inactive"
              : product.isVisible
                ? "Visible"
                : "Hidden"}
          </span>
          {product.isActive && product.stock <= product.reorderLevel && (
            <span className={styles.warning}>Low stock</span>
          )}
        </div>
        <p className={styles.stockSummary}>
          {product.stock} in stock{" "}
          <span>· reorder at {product.reorderLevel}</span>
        </p>
        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}
        {product.tags.length > 0 && (
          <div className={styles.tagList}>
            {product.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
        {specs.length > 0 && (
          <dl className={styles.specList}>
            {specs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <button
          className={styles.textButton}
          type="button"
          aria-expanded={editing}
          aria-controls={`editor-${product.sku}`}
          onClick={() => {
            if (editing) resetDraft();
            setEditing((current) => !current);
          }}
          disabled={saving}
        >
          {editing ? "Close editor" : "Manage product"}
        </button>
        {editing && (
          <form
            id={`editor-${product.sku}`}
            className={styles.editor}
            onSubmit={saveProduct}
          >
            <label>
              Product name
              <input
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                maxLength={140}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </label>
            <ProductImages
              media={media}
              ids={imageIds}
              onChange={setImageIds}
              disabled={saving}
              onUpload={onUpload}
              onBusy={onBusy}
            />
            <p className={styles.editorNote}>
              The category cover is intentionally not used as a product visual.
            </p>
            <div>
              <label>
                Stock
                <input
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  type="number"
                  min="0"
                  max="100000"
                  required
                />
              </label>
              <label>
                Reorder at
                <input
                  value={reorderLevel}
                  onChange={(event) => setReorderLevel(event.target.value)}
                  type="number"
                  min="0"
                  max="100000"
                  required
                />
              </label>
            </div>
            <label>
              Price (₹)
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            <label>
              Display order
              <input
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                type="number"
                min="0"
                max="10000"
                required
              />
            </label>
            <label>
              Tags
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="wool, hand-knotted"
              />
            </label>
            <div>
              <label>
                Size
                <input
                  value={dimensions}
                  onChange={(event) => setDimensions(event.target.value)}
                />
              </label>
              <label>
                Material
                <input
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                Weave
                <input
                  value={weave}
                  onChange={(event) => setWeave(event.target.value)}
                />
              </label>
              <label>
                Colour
                <input
                  value={colour}
                  onChange={(event) => setColour(event.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                Pile height
                <input
                  value={pileHeight}
                  onChange={(event) => setPileHeight(event.target.value)}
                />
              </label>
              <label>
                Origin
                <input
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                />
              </label>
            </div>
            <div className={styles.checks}>
              <label>
                <input
                  checked={isVisible}
                  onChange={(event) => setIsVisible(event.target.checked)}
                  type="checkbox"
                />{" "}
                Visible on storefront
              </label>
              <label>
                <input
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  type="checkbox"
                />{" "}
                Active inventory line
              </label>
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={saving}>
                {saving ? "Saving…" : "Save product"}
              </button>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={saving}
                onClick={() => {
                  resetDraft();
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

function ProductImages({
  media,
  ids,
  onChange,
  disabled,
  onUpload,
  onBusy,
}: {
  media: MediaAsset[];
  ids: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
  onUpload: (file: File) => Promise<string>;
  onBusy: (busy: boolean) => void;
}) {
  const [error, setError] = useState("");
  async function upload(files: File[]) {
    if (!files.length) return;
    if (ids.length + files.length > 12) {
      setError("Choose up to 12 images per product.");
      return;
    }
    onBusy(true);
    setError("");
    const next = [...ids];
    try {
      for (const file of files) {
        next.push(await onUpload(file));
        onChange([...next]);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Upload failed. You can retry the remaining images.",
      );
    } finally {
      onBusy(false);
    }
  }
  function move(index: number, direction: number) {
    const next = [...ids];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next);
  }
  return (
    <fieldset className={styles.productImages} disabled={disabled}>
      <legend>Product images ({ids.length}/12)</legend>
      <p>
        Images up to 10 MB each. The first image is the main product photo. Add,
        reorder or remove photos, then save the product.
      </p>
      <ol>
        {ids.map((id, index) => {
          const asset = media.find((item) => item.id === id);
          return (
            <li key={id}>
              {asset?.previewUrl && (
                <MediaVisual
                  className={styles.galleryPreview}
                  imageUrl={asset.previewUrl}
                  label={asset.altText || asset.name}
                  contain
                />
              )}
              <span>
                {index + 1}. {asset?.name ?? "Product photo"}
                {index === 0 ? " · Main photo" : ""}
              </span>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move image ${index + 1} earlier`}
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === ids.length - 1}
                  aria-label={`Move image ${index + 1} later`}
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => onChange(ids.filter((value) => value !== id))}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <label>
        Add from image library
        <select
          value=""
          disabled={ids.length >= 12}
          onChange={(event) => {
            if (event.target.value) onChange([...ids, event.target.value]);
          }}
        >
          <option value="">Choose an image</option>
          {media
            .filter(
              (asset) =>
                asset.sourceType !== "color" && !ids.includes(asset.id),
            )
            .map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name}
              </option>
            ))}
        </select>
      </label>
      <label>
        Upload product photos
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          disabled={ids.length >= 12}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            void upload(files);
          }}
        />
      </label>
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}
