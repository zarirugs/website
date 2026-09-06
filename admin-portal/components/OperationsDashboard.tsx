"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { AuthenticatedAdmin } from "@/lib/server/auth";
import { displayOrderStage, orderStages, type OrderStage } from "@/lib/data/orders";
import styles from "./operations.module.css";

type Metrics = { openOrders: number; awaitingPayment: number; lowStock: number; visibleProducts: number };
type Category = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; sortOrder: number; isActive: boolean; productCount: number };
type Product = { sku: string; name: string; stock: number; reorderLevel: number; isActive: boolean; categoryId: string | null; categoryName: string | null; description: string | null; imageUrl: string | null; pricePaise: number | null; isVisible: boolean; sortOrder: number };
type Order = { id: number; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string | null; deliveryAddress: string | null; notes: string | null; stage: OrderStage; createdAt: string; items: { sku: string; name: string; quantity: number }[] };

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
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryImageUrl, setCategoryImageUrl] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState("0");
  const [productSku, setProductSku] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productStock, setProductStock] = useState("0");
  const [productReorder, setProductReorder] = useState("0");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboard, categoryResult, productResult, orderResult] = await Promise.all([
        json<{ admin: AuthenticatedAdmin; metrics: Metrics }>("/api/dashboard"),
        json<{ categories: Category[] }>("/api/categories"),
        json<{ products: Product[] }>("/api/products"),
        json<{ orders: Order[] }>("/api/orders"),
      ]);
      setAdmin(dashboard.admin);
      setMetrics(dashboard.metrics);
      setCategories(categoryResult.categories);
      setProducts(productResult.products);
      setOrders(orderResult.orders);
      setProductCategoryId((current) => current || categoryResult.categories.find((category) => category.isActive)?.id || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load operations data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadInitialDashboard() {
      try {
        const [dashboard, categoryResult, productResult, orderResult] = await Promise.all([
          json<{ admin: AuthenticatedAdmin; metrics: Metrics }>("/api/dashboard"),
          json<{ categories: Category[] }>("/api/categories"),
          json<{ products: Product[] }>("/api/products"),
          json<{ orders: Order[] }>("/api/orders"),
        ]);
        setAdmin(dashboard.admin);
        setMetrics(dashboard.metrics);
        setCategories(categoryResult.categories);
        setProducts(productResult.products);
        setOrders(orderResult.orders);
        setProductCategoryId(categoryResult.categories.find((category) => category.isActive)?.id || "");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load operations data.");
      } finally {
        setLoading(false);
      }
    }
    void loadInitialDashboard();
  }, []);

  const lowStock = useMemo(() => products.filter((product) => product.isActive && product.stock <= product.reorderLevel), [products]);

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
        name: categoryName, description: categoryDescription, imageUrl: categoryImageUrl, sortOrder: Number(categorySortOrder),
      }) });
      setCategoryName(""); setCategoryDescription(""); setCategoryImageUrl(""); setCategorySortOrder("0");
    }, "Category created and ready for products.");
  }

  function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await json("/api/products", { method: "POST", body: JSON.stringify({
        sku: productSku, name: productName, categoryId: productCategoryId, description: productDescription,
        imageUrl: productImageUrl, pricePaise: productPrice === "" ? null : Math.round(Number(productPrice) * 100),
        stock: Number(productStock), reorderLevel: Number(productReorder), sortOrder: 0,
      }) });
      setProductSku(""); setProductName(""); setProductDescription(""); setProductImageUrl(""); setProductPrice(""); setProductStock("0"); setProductReorder("0");
    }, "Product added to the catalog and inventory.");
  }

  function updateStage(order: Order, stage: OrderStage) {
    void run(() => json(`/api/orders/${order.id}`, { method: "PATCH", body: JSON.stringify({ stage }) }), `Order ${order.orderNumber} moved to ${displayOrderStage(stage)}.`);
  }

  function updateStock(product: Product, stock: number) {
    void run(() => json(`/api/products/${encodeURIComponent(product.sku)}`, { method: "PATCH", body: JSON.stringify({ stock }) }), `Inventory saved for ${product.sku}.`);
  }

  function toggleCategory(category: Category) {
    void run(() => json(`/api/categories/${category.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !category.isActive }) }), `${category.name} is now ${category.isActive ? "hidden" : "active"}.`);
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
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Order desk</p><h2>Customer orders</h2></div><p>Moving an order to paid reserves its inventory. Cancelling a paid order returns it.</p></div>
          <div className={styles.orders}>
            {orders.length === 0 ? <Empty text="No website orders yet." /> : orders.map((order) => <article key={order.id} className={styles.order}>
              <div><p className={styles.orderNumber}>{order.orderNumber}</p><h3>{order.customerName}</h3><p className={styles.contact}>{order.customerEmail}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</p><p className={styles.items}>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}</p>{order.deliveryAddress && <p className={styles.note}>{order.deliveryAddress}</p>}{order.notes && <p className={styles.note}>{order.notes}</p>}<time>{date(order.createdAt)}</time></div>
              <label className={styles.selectLabel}>Stage<select value={order.stage} onChange={(event) => updateStage(order, event.target.value as OrderStage)} disabled={saving || order.stage === "delivered" || order.stage === "cancelled"}>{orderStages.map((stage) => <option key={stage} value={stage}>{displayOrderStage(stage)}</option>)}</select></label>
            </article>)}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Catalog</p><h2>Categories</h2></div><p>Active categories appear in the public collection.</p></div>
          <div className={styles.catalogGrid}>
            <div className={styles.categoryList}>{categories.map((category) => <article key={category.id} className={styles.category}>
              <div><h3>{category.name}</h3><p>/{category.slug} · {category.productCount} products</p>{category.description && <p className={styles.note}>{category.description}</p>}</div>
              <button className={styles.textButton} disabled={saving} onClick={() => toggleCategory(category)}>{category.isActive ? "Hide" : "Activate"}</button>
            </article>)}
            {categories.length === 0 && <Empty text="Create your first category." />}</div>
            <form className={styles.formCard} onSubmit={createCategory}><p className={styles.eyebrow}>New category</p><label>Name<input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} required /></label><label>Short description<textarea value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} rows={3} /></label><label>Image URL<input value={categoryImageUrl} onChange={(event) => setCategoryImageUrl(event.target.value)} type="url" placeholder="https://…" required /></label><label>Display order<input value={categorySortOrder} onChange={(event) => setCategorySortOrder(event.target.value)} type="number" min="0" required /></label><button className={styles.primaryButton} disabled={saving}>Create category</button></form>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>Stock room</p><h2>Products & inventory</h2></div><p>{lowStock.length ? `${lowStock.length} active products need attention.` : "All active stock lines are above their reorder level."}</p></div>
          <div className={styles.productLayout}>
            <div className={styles.tableWrap}><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Reorder</th><th /></tr></thead><tbody>{products.map((product) => <ProductRow key={`${product.sku}-${product.stock}`} product={product} saving={saving} onSave={updateStock} />)}</tbody></table>{products.length === 0 && <Empty text="No products created yet." />}</div>
            <form className={styles.formCard} onSubmit={createProduct}><p className={styles.eyebrow}>New product</p><label>SKU<input value={productSku} onChange={(event) => setProductSku(event.target.value.toUpperCase())} placeholder="ZAR-NEW-001" required /></label><label>Product name<input value={productName} onChange={(event) => setProductName(event.target.value)} required /></label><label>Category<select value={productCategoryId} onChange={(event) => setProductCategoryId(event.target.value)} required><option value="" disabled>Select category</option>{categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Description<textarea value={productDescription} onChange={(event) => setProductDescription(event.target.value)} rows={3} /></label><label>Image URL<input value={productImageUrl} onChange={(event) => setProductImageUrl(event.target.value)} type="url" placeholder="https://…" required /></label><label>Price (₹)<input value={productPrice} onChange={(event) => setProductPrice(event.target.value)} type="number" min="0" step="1" /></label><div className={styles.twoFields}><label>Opening stock<input value={productStock} onChange={(event) => setProductStock(event.target.value)} type="number" min="0" required /></label><label>Reorder at<input value={productReorder} onChange={(event) => setProductReorder(event.target.value)} type="number" min="0" required /></label></div><button className={styles.primaryButton} disabled={saving || !categories.some((category) => category.isActive)}>Add product</button></form>
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

function ProductRow({ product, saving, onSave }: { product: Product; saving: boolean; onSave: (product: Product, stock: number) => void }) {
  const [stock, setStock] = useState(String(product.stock));
  return <tr className={product.isActive && product.stock <= product.reorderLevel ? styles.lowStock : ""}><td><strong>{product.name}</strong><span>{product.sku}{!product.isVisible && " · hidden"}</span></td><td>{product.categoryName ?? "Uncategorised"}</td><td>{currency(product.pricePaise)}</td><td><input aria-label={`${product.name} stock`} value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" /></td><td>{product.reorderLevel}</td><td><button className={styles.textButton} disabled={saving || Number(stock) === product.stock || !Number.isInteger(Number(stock)) || Number(stock) < 0} onClick={() => onSave(product, Number(stock))}>Save</button></td></tr>;
}
