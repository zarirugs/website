import { NextResponse } from "next/server";

import { orderStatuses, type OrderStatus, type PublicOrderItem } from "@/lib/inventory/types";
import { getDatabase, isAdminRequest } from "@/lib/server/database";
import type { D1Result } from "@/lib/server/d1";
import { databaseErrorResponse, errorResponse, optionalText, requiredText } from "@/lib/server/http";

type InventoryLookup = {
  sku: string;
  name: string;
  stock: number;
  is_active: number;
};

type OrderRow = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  notes: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  order_id: number;
  sku: string;
  item_name: string;
  quantity: number;
};

const skuPattern = /^[A-Z0-9-]{3,64}$/;

function normalizeItems(value: unknown): PublicOrderItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 10) return null;

  const grouped = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const { sku, quantity } = item as { sku?: unknown; quantity?: unknown };
    const normalizedSku = typeof sku === "string" ? sku.trim().toUpperCase() : "";
    if (!skuPattern.test(normalizedSku) || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 25) {
      return null;
    }
    grouped.set(normalizedSku, (grouped.get(normalizedSku) ?? 0) + quantity);
  }

  return [...grouped].map(([sku, quantity]) => ({ sku, quantity, name: "" }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const honeypot = optionalText(body.website, 200);
    if (honeypot) return NextResponse.json({ received: true }, { status: 202 });

    const customerName = requiredText(body.customerName, "name", 120);
    const customerEmail = requiredText(body.customerEmail, "email", 254)?.toLowerCase();
    const customerPhone = optionalText(body.customerPhone, 40);
    const deliveryAddress = optionalText(body.deliveryAddress, 500);
    const notes = optionalText(body.notes, 1500);
    const items = normalizeItems(body.items);

    if (!customerName || !customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !items) {
      return errorResponse("Please complete the required order details.");
    }

    const database = await getDatabase();
    const inventoryResults = await database.batch<InventoryLookup>(
      items.map(({ sku }) => database.prepare(
        "SELECT sku, name, stock, is_active FROM inventory_items WHERE sku = ?",
      ).bind(sku)),
    );
    const inventory = inventoryResults.map((result: D1Result<InventoryLookup>) => result.results[0]);

    if (inventory.some((item) => !item || item.is_active !== 1)) {
      return errorResponse("One of the selected pieces is no longer available. Please choose another collection.");
    }

    const insufficientItem = items.find((item, index) => (inventory[index]?.stock ?? 0) < item.quantity);
    if (insufficientItem) {
      return errorResponse("That quantity is not currently available. Our concierge can help with a bespoke request.", 409);
    }

    const orderNumber = `ZARI-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const statements = [
      database.prepare(
        `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, delivery_address, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(orderNumber, customerName, customerEmail, customerPhone, deliveryAddress, notes),
      ...items.map((item, index) => database.prepare(
        `INSERT INTO order_items (order_id, sku, item_name, quantity)
         VALUES ((SELECT id FROM orders WHERE order_number = ?), ?, ?, ?)`,
      ).bind(orderNumber, item.sku, inventory[index]!.name, item.quantity)),
    ];

    await database.batch(statements);

    return NextResponse.json({
      received: true,
      orderNumber,
      message: "Your order request has been received. Our concierge will confirm availability shortly.",
    }, { status: 201 });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) return errorResponse("Unauthorised.", 401);

    const database = await getDatabase();
    const [orderResult, itemResult] = await database.batch([
      database.prepare(`SELECT id, order_number, customer_name, customer_email, customer_phone,
        delivery_address, notes, status, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 100`),
      database.prepare(`SELECT oi.order_id, oi.sku, oi.item_name, oi.quantity FROM order_items oi
        JOIN orders o ON o.id = oi.order_id ORDER BY o.created_at DESC, oi.id ASC LIMIT 500`),
    ]);

    const itemsByOrder = new Map<number, OrderItemRow[]>();
    for (const item of itemResult.results as OrderItemRow[]) {
      const lines = itemsByOrder.get(item.order_id) ?? [];
      lines.push(item);
      itemsByOrder.set(item.order_id, lines);
    }

    const orders = (orderResult.results as OrderRow[]).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
      notes: order.notes,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        sku: item.sku,
        name: item.item_name,
        quantity: item.quantity,
      })),
    }));

    return NextResponse.json({ orders, statuses: orderStatuses });
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
