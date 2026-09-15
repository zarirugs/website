"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { Cart, Customer } from "@/lib/store/types";

type StoreContextValue = {
  user: Customer | null;
  cart: Cart;
  ready: boolean;
  refresh: () => Promise<void>;
  updateCart: (sku: string, quantity: number) => Promise<Cart>;
  signOut: () => Promise<void>;
};

const emptyCart: Cart = { items: [], itemCount: 0 };
const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Customer | null>(null);
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const userResponse = await fetch("/api/auth/me", { cache: "no-store" });
    if (!userResponse.ok) {
      setUser(null);
      setCart(emptyCart);
      setReady(true);
      return;
    }

    const userResult = await userResponse.json() as { user: Customer };
    const cartResponse = await fetch("/api/cart", { cache: "no-store" });
    const cartResult = cartResponse.ok ? await cartResponse.json() as Cart : emptyCart;
    setUser(userResult.user);
    setCart(cartResult);
    setReady(true);
  }, []);

  useEffect(() => {
    const loadStore = async () => {
      await refresh();
    };
    void loadStore();
  }, [refresh]);

  const updateCart = useCallback(async (sku: string, quantity: number) => {
    const response = await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, quantity }),
    });
    const result = await response.json().catch(() => ({})) as Partial<Cart> & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Unable to update your cart.");
    const nextCart = result as Cart;
    setCart(nextCart);
    return nextCart;
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCart(emptyCart);
  }, []);

  const value = useMemo(() => ({ user, cart, ready, refresh, updateCart, signOut }), [user, cart, ready, refresh, updateCart, signOut]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider.");
  return context;
}
