import type { Cart, CartItem } from "./types";
import type { ShopProduct } from "./shop-catalog";
export const guestCartKey = "zari.guestBag.v1";
export type GuestLine = { sku: string; quantity: number };
export function readGuestLines(raw: string | null): GuestLine[] {
  try {
    const lines: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(lines)) return [];
    const grouped = new Map<string, number>();
    for (const line of lines.slice(0, 50)) {
      if (line && typeof line.sku === "string" && /^[A-Z0-9-]{3,64}$/.test(line.sku) && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 25) grouped.set(line.sku, Math.max(grouped.get(line.sku) ?? 0, line.quantity));
    }
    return [...grouped].map(([sku, quantity]) => ({ sku, quantity }));
  } catch { return []; }
}
export function resolveGuestCart(lines: GuestLine[], products: ShopProduct[]): Cart {
  const items: CartItem[] = lines.flatMap((line) => {
    const product = products.find((product) => product.sku === line.sku);
    return product ? [{ ...line, name: product.name, collection: product.categorySlug, availableStock: product.stock }] : [];
  });
  return { items, itemCount: items.reduce((total, item) => total + item.quantity, 0) };
}
export function safeReturnPath(value: string | null) {
  if (!value) return "/account";
  try {
    const decoded = decodeURIComponent(value);
    const hasControl = [...decoded].some((character) => character.charCodeAt(0) < 32);
    return decoded.startsWith("/") && !decoded.startsWith("//") && !decoded.includes("\\") && !hasControl ? value : "/account";
  } catch { return "/account"; }
}
