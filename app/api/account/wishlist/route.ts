import { NextResponse } from "next/server";

import { getCurrentCustomer } from "@/lib/server/customer-account";
import { databaseErrorResponse, errorResponse } from "@/lib/server/http";
import type { WishlistItem } from "@/lib/store/types";

type WishlistRow = {
  sku: string;
  name: string;
  collection: string;
  description: string | null;
  image_url: string | null;
  price_paise: number | null;
  stock: number;
  is_active: number;
};

const skuPattern = /^[A-Z0-9-]{3,64}$/;

function normalizedSku(value: unknown) {
  const sku = typeof value === "string" ? value.trim().toUpperCase() : "";
  return skuPattern.test(sku) ? sku : null;
}

async function currentWishlist(request: Request) {
  const { database, customer } = await getCurrentCustomer(request);
  return { database, customer };
}

export async function GET(request: Request) {
  try {
    const { database, customer } = await currentWishlist(request);
    if (!customer) return errorResponse("Sign in to view your saved pieces.", 401);

    const result = await database.prepare(
      `SELECT inventory_items.sku, inventory_items.name, inventory_items.collection, product_catalog.description,
        product_catalog.image_url, product_catalog.price_paise, inventory_items.stock, inventory_items.is_active
       FROM customer_wishlist
       JOIN inventory_items ON inventory_items.sku = customer_wishlist.sku
       LEFT JOIN product_catalog ON product_catalog.sku = inventory_items.sku
       WHERE customer_wishlist.customer_id = ?
       ORDER BY customer_wishlist.created_at DESC`,
    ).bind(customer.id).all<WishlistRow>();
    const wishlist: WishlistItem[] = result.results.map((item) => ({
      sku: item.sku,
      name: item.name,
      collection: item.collection,
      description: item.description,
      imageUrl: item.image_url,
      pricePaise: item.price_paise,
      stock: item.stock,
      isActive: item.is_active === 1,
    }));
    const response = NextResponse.json({ wishlist });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const sku = normalizedSku(body && typeof body === "object" ? (body as Record<string, unknown>).sku : null);
    if (!sku) return errorResponse("Choose a valid piece to save.");

    const { database, customer } = await currentWishlist(request);
    if (!customer) return errorResponse("Sign in to save a piece.", 401);
    const item = await database.prepare(
      "SELECT sku FROM inventory_items WHERE sku = ? AND is_active = 1",
    ).bind(sku).first<{ sku: string }>();
    if (!item) return errorResponse("This piece is no longer available.", 404);

    await database.prepare(
      "INSERT OR IGNORE INTO customer_wishlist (customer_id, sku) VALUES (?, ?)",
    ).bind(customer.id, sku).run();
    const response = NextResponse.json({ saved: true, sku }, { status: 201 });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body: unknown = await request.json();
    const sku = normalizedSku(body && typeof body === "object" ? (body as Record<string, unknown>).sku : null);
    if (!sku) return errorResponse("Choose a valid saved piece.");

    const { database, customer } = await currentWishlist(request);
    if (!customer) return errorResponse("Sign in to manage your saved pieces.", 401);
    await database.prepare(
      "DELETE FROM customer_wishlist WHERE customer_id = ? AND sku = ?",
    ).bind(customer.id, sku).run();
    const response = NextResponse.json({ removed: true, sku });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return databaseErrorResponse(error);
  }
}
