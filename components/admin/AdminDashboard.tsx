"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { orderStatuses, type InventoryItem, type OrderRecord } from "@/lib/inventory/types";

type DashboardState = {
  inventory: InventoryItem[];
  orders: OrderRecord[];
};

const initialState: DashboardState = { inventory: [], orders: [] };

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export default function AdminDashboard() {
  const [token, setToken] = useState(() => (
    typeof window === "undefined" ? "" : window.sessionStorage.getItem("zari-admin-token") ?? ""
  ));
  const [dashboard, setDashboard] = useState<DashboardState>(initialState);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const lowStock = useMemo(
    () => dashboard.inventory.filter((item) => item.stock <= item.reorderLevel),
    [dashboard.inventory],
  );
  const openOrders = useMemo(
    () => dashboard.orders.filter((order) => !["fulfilled", "cancelled"].includes(order.status)),
    [dashboard.orders],
  );

  async function loadDashboard(activeToken: string) {
    if (!activeToken) return;
    setLoading(true);
    setMessage("");
    const [inventoryResponse, ordersResponse] = await Promise.all([
      fetch("/api/inventory", { headers: authHeaders(activeToken) }),
      fetch("/api/orders", { headers: authHeaders(activeToken) }),
    ]);
    const [inventoryResult, ordersResult] = await Promise.all([
      inventoryResponse.json().catch(() => ({})),
      ordersResponse.json().catch(() => ({})),
    ]);
    setLoading(false);

    if (!inventoryResponse.ok || !ordersResponse.ok) {
      setMessage(inventoryResult.error ?? ordersResult.error ?? "Unable to load the dashboard.");
      return;
    }

    setDashboard({ inventory: inventoryResult.inventory, orders: ordersResult.orders });
    setStockDrafts(Object.fromEntries(inventoryResult.inventory.map((item: InventoryItem) => [item.sku, String(item.stock)])));
  }

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.sessionStorage.setItem("zari-admin-token", token);
    void loadDashboard(token);
  }

  async function apiUpdate(path: string, body: object, successMessage: string) {
    const response = await fetch(path, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(result.error ?? "The update could not be saved.");
      return;
    }
    await loadDashboard(token);
    setMessage(successMessage);
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        sku: form.get("sku"),
        name: form.get("name"),
        collection: form.get("collection"),
        stock: Number(form.get("stock")),
        reorderLevel: Number(form.get("reorderLevel")),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(result.error ?? "The item could not be created.");
      return;
    }
    event.currentTarget.reset();
    await loadDashboard(token);
    setMessage("Inventory item created.");
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-5 py-8 text-neutral-900 md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 border-b border-neutral-300 pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#8b7442]">Zari operations</p>
            <h1 className="display-font mt-3 text-4xl tracking-[0.12em]">Orders & inventory</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">Confirming an order automatically reduces stock. Cancelling a confirmed order returns those pieces to inventory.</p>
          </div>
          <Link href="/" className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:text-neutral-900">Return to site →</Link>
        </header>

        <form onSubmit={unlock} className="mt-8 flex max-w-xl flex-col gap-3 rounded-sm bg-white p-5 shadow-sm sm:flex-row">
          <label className="sr-only" htmlFor="admin-token">Admin token</label>
          <input id="admin-token" value={token} onChange={(event) => setToken(event.target.value)} type="password" placeholder="Enter admin token" className="min-w-0 flex-1 border-b border-neutral-300 px-1 py-3 text-sm outline-none focus:border-neutral-900" />
          <button className="bg-neutral-950 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-[#8b7442]">Open dashboard</button>
        </form>

        {message && <p role="status" className="mt-4 text-sm text-[#8b7442]">{message}</p>}

        {dashboard.inventory.length > 0 && (
          <>
            <section className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="bg-neutral-950 p-6 text-white"><p className="text-[10px] uppercase tracking-[0.2em] text-neutral-400">Open orders</p><p className="display-font mt-2 text-4xl">{openOrders.length}</p></div>
              <div className="bg-white p-6"><p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Inventory lines</p><p className="display-font mt-2 text-4xl">{dashboard.inventory.length}</p></div>
              <div className="bg-[#b89b5e] p-6 text-white"><p className="text-[10px] uppercase tracking-[0.2em] text-white/75">Needs reorder</p><p className="display-font mt-2 text-4xl">{lowStock.length}</p></div>
            </section>

            <section className="mt-10">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] uppercase tracking-[0.24em] text-[#8b7442]">Stock room</p><h2 className="display-font mt-2 text-3xl tracking-[0.08em]">Inventory</h2></div><p className="text-xs text-neutral-500">A gold row is at or below its reorder level.</p></div>
              <div className="mt-5 overflow-x-auto bg-white shadow-sm">
                <table className="min-w-[760px] w-full text-left text-sm"><thead className="border-b border-neutral-200 text-[10px] uppercase tracking-[0.16em] text-neutral-500"><tr><th className="px-5 py-4 font-medium">Piece</th><th className="px-5 py-4 font-medium">SKU</th><th className="px-5 py-4 font-medium">Stock</th><th className="px-5 py-4 font-medium">Reorder at</th><th className="px-5 py-4 font-medium">Action</th></tr></thead>
                  <tbody>{dashboard.inventory.map((item) => <tr key={item.sku} className={item.stock <= item.reorderLevel ? "bg-[#fbf7ed]" : "border-b border-neutral-100"}><td className="px-5 py-4"><p>{item.name}</p><p className="mt-1 text-xs text-neutral-500">{item.collection}</p></td><td className="px-5 py-4 font-mono text-xs text-neutral-500">{item.sku}</td><td className="px-5 py-4"><input aria-label={`${item.name} stock`} value={stockDrafts[item.sku] ?? ""} onChange={(event) => setStockDrafts((drafts) => ({ ...drafts, [item.sku]: event.target.value }))} type="number" min="0" className="w-20 border-b border-neutral-300 bg-transparent px-1 py-2 outline-none focus:border-neutral-900" /></td><td className="px-5 py-4">{item.reorderLevel}</td><td className="px-5 py-4"><button onClick={() => void apiUpdate(`/api/inventory/${encodeURIComponent(item.sku)}`, { stock: Number(stockDrafts[item.sku]) }, `Saved ${item.sku}.`)} className="text-[10px] uppercase tracking-[0.16em] text-[#8b7442] hover:text-neutral-950">Save count</button></td></tr>)}</tbody>
                </table>
              </div>
            </section>

            <section className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_.65fr]">
              <div><p className="text-[10px] uppercase tracking-[0.24em] text-[#8b7442]">Order desk</p><h2 className="display-font mt-2 text-3xl tracking-[0.08em]">Latest requests</h2><div className="mt-5 space-y-3">{dashboard.orders.map((order) => <article key={order.id} className="bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="font-mono text-xs text-[#8b7442]">{order.orderNumber}</p><h3 className="mt-2 text-base">{order.customerName}</h3><p className="mt-1 text-xs text-neutral-500">{order.customerEmail}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</p><p className="mt-3 text-sm text-neutral-700">{order.items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}</p>{order.notes && <p className="mt-3 max-w-2xl text-xs leading-relaxed text-neutral-500">{order.notes}</p>}</div><div className="flex min-w-40 flex-col gap-2"><label className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Status</label><select defaultValue={order.status} onChange={(event) => void apiUpdate(`/api/orders/${order.id}`, { status: event.target.value }, `Order ${order.orderNumber} updated.`)} className="border border-neutral-200 bg-white px-3 py-2 text-xs capitalize outline-none focus:border-neutral-900">{orderStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}</select><p className="text-[10px] text-neutral-400">{new Date(`${order.createdAt}Z`).toLocaleDateString()}</p></div></div></article>)}</div></div>
              <aside className="self-start bg-white p-6 shadow-sm"><p className="text-[10px] uppercase tracking-[0.2em] text-[#8b7442]">New stock line</p><h2 className="display-font mt-2 text-2xl tracking-[0.08em]">Add inventory</h2><form onSubmit={addItem} className="mt-6 grid gap-4"><label className="grid gap-1 text-xs text-neutral-600">SKU<input required name="sku" placeholder="ZAR-NEW-001" className="border-b border-neutral-300 px-0 py-2 text-sm outline-none focus:border-neutral-900" /></label><label className="grid gap-1 text-xs text-neutral-600">Piece name<input required name="name" className="border-b border-neutral-300 px-0 py-2 text-sm outline-none focus:border-neutral-900" /></label><label className="grid gap-1 text-xs text-neutral-600">Collection<input required name="collection" className="border-b border-neutral-300 px-0 py-2 text-sm outline-none focus:border-neutral-900" /></label><div className="grid grid-cols-2 gap-4"><label className="grid gap-1 text-xs text-neutral-600">Opening stock<input required name="stock" type="number" min="0" defaultValue="0" className="border-b border-neutral-300 px-0 py-2 text-sm outline-none focus:border-neutral-900" /></label><label className="grid gap-1 text-xs text-neutral-600">Reorder at<input required name="reorderLevel" type="number" min="0" defaultValue="0" className="border-b border-neutral-300 px-0 py-2 text-sm outline-none focus:border-neutral-900" /></label></div><button className="mt-2 bg-neutral-950 px-5 py-3 text-[10px] uppercase tracking-[0.16em] text-white hover:bg-[#8b7442]">Add to inventory</button></form></aside>
            </section>
          </>
        )}
        {loading && <p className="mt-8 text-sm text-neutral-500">Loading operations data…</p>}
      </div>
    </main>
  );
}
