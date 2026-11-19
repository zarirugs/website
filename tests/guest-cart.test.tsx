import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { StoreProvider, useStore } from "@/components/store/StoreProvider";
import { guestCartKey, readGuestLines, resolveGuestCart, safeReturnPath } from "@/lib/store/guest-cart";
import type { Cart, CartItem } from "@/lib/store/types";
const products = [{ sku: "ZAR-CON-001", name: "Contemporary", categorySlug: "contemporary", stock: 5, image: "", description: null, pricePaise: null }];
let signedIn: boolean;
let serverCart: Cart;
let fail: boolean;
let fetchMock: ReturnType<typeof vi.fn>;
function Harness() {
  const { user, cart, ready, error, refresh, updateCart } = useStore();
  return <><p>{ready ? "Ready" : "Loading"}</p><p>{user ? "Member" : "Guest"}</p><p data-testid="count">{cart.itemCount}</p><p role="alert">{error}</p><button onClick={() => void updateCart("ZAR-CON-001", 2)}>Select two</button><button onClick={() => void updateCart("ZAR-CON-001", 1)}>Select one</button><button onClick={() => void refresh()}>Refresh</button></>;
}
beforeEach(() => {
  localStorage.clear(); signedIn = false; fail = false; serverCart = { items: [], itemCount: 0 };
  fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
    if (fail) throw new TypeError("Offline");
    if (url === "/api/auth/me") return new Response(JSON.stringify(signedIn ? { user: { id: "member", email: "member@example.com", fullName: "Member" } } : {}), { status: signedIn ? 200 : 401 });
    if (url === "/api/catalog") return new Response(JSON.stringify({ products, collections: [] }));
    if (url === "/api/cart" && options?.method === "PUT") {
      const { sku, quantity } = JSON.parse(options.body as string);
      const item: CartItem = { sku, quantity, availableStock: 5, collection: "contemporary", name: "Contemporary" };
      serverCart = { items: quantity ? [item] : [], itemCount: quantity };
    }
    return new Response(JSON.stringify(serverCart));
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("keeps a guest bag across reloads without requiring an account", async () => {
  const view = render(<StoreProvider><Harness /></StoreProvider>);
  await screen.findByText("Ready"); fireEvent.click(screen.getByText("Select two"));
  await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("2"));
  expect(readGuestLines(localStorage.getItem(guestCartKey))).toEqual([{ sku: "ZAR-CON-001", quantity: 2 }]);
  view.unmount(); render(<StoreProvider><Harness /></StoreProvider>);
  await screen.findByText("Ready"); expect(screen.getByText("Guest")).toBeTruthy(); expect(screen.getByTestId("count").textContent).toBe("2");
  expect(fetchMock.mock.calls.some(([, options]) => options?.method === "PUT")).toBe(false);
});
it("merges the guest selection after sign in without doubling a repeated merge", async () => {
  localStorage.setItem(guestCartKey, JSON.stringify([{ sku: "ZAR-CON-001", quantity: 2 }]));
  render(<StoreProvider><Harness /></StoreProvider>); await screen.findByText("Ready");
  signedIn = true; fireEvent.click(screen.getByText("Refresh")); await screen.findByText("Member");
  await waitFor(() => expect(serverCart.itemCount).toBe(2));
  fireEvent.click(screen.getByText("Refresh")); await screen.findByText("Ready");
  expect(serverCart.itemCount).toBe(2); expect(readGuestLines(localStorage.getItem(guestCartKey))).toEqual([]);
});
it("keeps an unavailable guest quantity editable after signing in", async () => {
  localStorage.setItem(guestCartKey, JSON.stringify([{ sku: "ZAR-CON-001", quantity: 6 }]));
  signedIn = true; render(<StoreProvider><Harness /></StoreProvider>); await screen.findByText("Ready");
  expect(screen.getByTestId("count").textContent).toBe("6");
  expect(serverCart.itemCount).toBe(0);
  fireEvent.click(screen.getByText("Select one"));
  await waitFor(() => expect(screen.getByTestId("count").textContent).toBe("1"));
  expect(serverCart.itemCount).toBe(1); expect(readGuestLines(localStorage.getItem(guestCartKey))).toEqual([]);
});
it("recovers a failed initial account request without leaving the bag loading forever", async () => {
  fail = true; render(<StoreProvider><Harness /></StoreProvider>); await screen.findByText("Ready");
  expect(screen.getByRole("alert").textContent).toMatch(/Offline|load/);
  fail = false; fireEvent.click(screen.getByText("Refresh"));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(""));
});
it("ignores malformed stored lines and resolves names and stock from the public catalogue", () => {
  expect(readGuestLines("bad")).toEqual([]);
  expect(readGuestLines(JSON.stringify([{ sku: "ZAR-CON-001", quantity: -1 }, { sku: "ZAR-CON-001", quantity: 2 }, { sku: "ZAR-CON-001", quantity: 1 }]))).toEqual([{ sku: "ZAR-CON-001", quantity: 2 }]);
  expect(resolveGuestCart([{ sku: "ZAR-CON-001", quantity: 2 }, { sku: "MISSING", quantity: 1 }], products)).toMatchObject({ itemCount: 2, items: [{ name: "Contemporary", availableStock: 5 }] });
});
it("only returns to a safe local page after authentication", () => {
  for (const value of [null, "https://elsewhere.example", "//elsewhere.example", "/%2felsewhere.example", "/%5celsewhere.example", "/\nelsewhere.example", "%invalid"]) expect(safeReturnPath(value)).toBe("/account");
  expect(safeReturnPath("/rugs/zar-con-001?view=details")).toBe("/rugs/zar-con-001?view=details");
});
