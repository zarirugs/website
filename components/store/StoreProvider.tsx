"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Cart, CartItem, Customer } from "@/lib/store/types";
import type { CatalogData } from "@/lib/store/catalog";
import { guestCartKey, readGuestLines, resolveGuestCart } from "@/lib/store/guest-cart";

type StoreContextValue = {
  user: Customer | null; cart: Cart; ready: boolean; error: string;
  refresh: () => Promise<void>;
  updateCart: (sku: string, quantity: number) => Promise<Cart>;
  signOut: () => Promise<void>;
};
const emptyCart: Cart = { items: [], itemCount: 0 };
const StoreContext = createContext<StoreContextValue | null>(null);
function storedLines() { try { return readGuestLines(localStorage.getItem(guestCartKey)); } catch { return []; } }
function persist(cart: Cart) { try { localStorage.setItem(guestCartKey, JSON.stringify(cart.items.map(({ sku, quantity }) => ({ sku, quantity })))); } catch { /* The in-memory bag remains available when storage is blocked. */ } }
async function catalog() {
  const response = await fetch("/api/catalog");
  if (!response.ok) throw new Error("We could not load your selection. Please try again.");
  return await response.json() as CatalogData;
}
async function saveCart(sku: string, quantity: number) {
  const response = await fetch("/api/cart", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku, quantity }) });
  const result = await response.json() as Cart & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Unable to update your bag.");
  return result;
}
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const currentCart = useRef(emptyCart);
  const currentUser = useRef<Customer | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const commit = useCallback((next: Cart) => { currentCart.current = next; setCart(next); }, []);
  const refresh = useCallback(async () => {
    setError(""); setReady(false);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.status === 401) {
        currentUser.current = null; setUser(null);
        const lines = storedLines();
        commit(lines.length ? resolveGuestCart(lines, (await catalog()).products) : emptyCart);
      } else {
        if (!response.ok) throw new Error("We could not load your account. Please try again.");
        const result = await response.json() as { user: Customer };
        currentUser.current = result.user; setUser(result.user);
        const cartResponse = await fetch("/api/cart", { cache: "no-store" });
        if (!cartResponse.ok) throw new Error("We could not load your bag. Please try again.");
        let next = await cartResponse.json() as Cart;
        const lines = storedLines();
        if (lines.length) {
          const guest = resolveGuestCart(lines, (await catalog()).products);
          const unresolved: CartItem[] = [];
          for (const item of guest.items) {
            const quantity = Math.max(next.items.find((line) => line.sku === item.sku)?.quantity ?? 0, item.quantity);
            if (quantity > item.availableStock) unresolved.push({ ...item, quantity });
            else next = await saveCart(item.sku, quantity);
          }
          persist({ items: unresolved, itemCount: 0 });
          next = { items: [...next.items.filter((item) => !unresolved.some((pending) => pending.sku === item.sku)), ...unresolved], itemCount: 0 };
          next.itemCount = next.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        commit(next);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not load your selection. Please try again.");
    } finally { setReady(true); }
  }, [commit]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  const updateCart = useCallback((sku: string, quantity: number): Promise<Cart> => {
    const operation = queue.current.catch(() => undefined).then(async () => {
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 25) throw new Error("Choose a quantity between 0 and 25.");
      let next: Cart;
      if (currentUser.current) {
        next = await saveCart(sku, quantity);
        const pending = storedLines().filter((line) => line.sku !== sku);
        if (pending.length) {
          const unresolved = resolveGuestCart(pending, (await catalog()).products);
          next = { items: [...next.items.filter((item) => !unresolved.items.some((line) => line.sku === item.sku)), ...unresolved.items], itemCount: 0 };
          next.itemCount = next.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        try { localStorage.setItem(guestCartKey, JSON.stringify(pending)); } catch { /* A future merge remains idempotent. */ }
      }
      else {
        const products = (await catalog()).products;
        const product = products.find((item) => item.sku === sku);
        if (quantity && (!product || quantity > product.stock)) throw new Error("That quantity is not currently available.");
        const lines = currentCart.current.items.filter((item) => item.sku !== sku).map(({ sku, quantity }) => ({ sku, quantity }));
        if (quantity) lines.push({ sku, quantity });
        next = resolveGuestCart(lines, products); persist(next);
      }
      commit(next); setError(""); return next;
    });
    queue.current = operation;
    return operation;
  }, [commit]);
  const signOut = useCallback(async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Unable to sign out. Please try again.");
    currentUser.current = null; setUser(null); commit(emptyCart);
  }, [commit]);
  const value = useMemo(() => ({ user, cart, ready, error, refresh, updateCart, signOut }), [user, cart, ready, error, refresh, updateCart, signOut]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider.");
  return context;
}
