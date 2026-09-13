import type { D1Database } from "@/lib/server/d1";

export type CustomerCartItem = {
  sku: string;
  name: string;
  collection: string;
  quantity: number;
  availableStock: number;
};

type CartRow = {
  sku: string;
  name: string;
  collection: string;
  quantity: number;
  stock: number;
};

export async function getCustomerCart(database: D1Database, customerId: string) {
  const result = await database.prepare(
    `SELECT cart_items.sku, inventory_items.name, inventory_items.collection,
      cart_items.quantity, inventory_items.stock
     FROM cart_items
     JOIN inventory_items ON inventory_items.sku = cart_items.sku
     WHERE cart_items.customer_id = ? AND inventory_items.is_active = 1
     ORDER BY cart_items.updated_at DESC`,
  ).bind(customerId).all<CartRow>();

  const items: CustomerCartItem[] = result.results.map((item) => ({
    sku: item.sku,
    name: item.name,
    collection: item.collection,
    quantity: item.quantity,
    availableStock: item.stock,
  }));

  return { items, itemCount: items.reduce((total, item) => total + item.quantity, 0) };
}
