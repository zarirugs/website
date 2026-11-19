import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderEnquiry from "@/components/sections/OrderEnquiry";
import CartPage from "@/components/store/CartPage";
import type { CartItem } from "@/lib/store/types";

const { useStore, useCatalog } = vi.hoisted(() => ({ useStore: vi.fn(), useCatalog: vi.fn() }));
vi.mock("@/components/store/StoreProvider", () => ({ useStore }));
vi.mock("@/lib/store/use-catalog", () => ({ useCatalog }));
vi.mock("@/lib/store/analytics", () => ({ trackStoreEvent: vi.fn() }));

const pieces: CartItem[] = [
  { sku: "ZAR-CON-001", name: "Contemporary rug", collection: "Contemporary", quantity: 2, availableStock: 12 },
  { sku: "ZAR-BES-001", name: "Bespoke consultation", collection: "Bespoke", quantity: 3, availableStock: 4 },
];
const customer = { id: "customer-1", fullName: "Test Customer", email: "customer@example.com" };
const fetchMock = vi.fn();

function storeWith(items = pieces, overrides = {}) {
  useStore.mockReturnValue({
    user: customer,
    ready: true,
    cart: { items, itemCount: items.reduce((total, item) => total + item.quantity, 0) },
    ...overrides,
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Send order request" }));
}

beforeEach(() => {
  storeWith();
  useCatalog.mockReturnValue({
    products: pieces.map((item) => ({ ...item, categorySlug: item.collection.toLowerCase(), stock: item.availableStock })),
    loading: false,
    error: false,
  });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ orderNumber: "ZARI-TEST-001" }), { status: 201 }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("bag order requests", () => {
  it("links the bag to the dedicated request review page", () => {
    render(<CartPage />);
    expect(screen.getByRole("link", { name: "Review order request" }).getAttribute("href")).toBe("/order-request");
  });

  it("reviews and submits every bag SKU and quantity without substituting Heritage", async () => {
    render(<OrderEnquiry source="bag" />);
    const summary = screen.getByRole("region", { name: "Requested pieces" });
    expect(within(summary).getByText("Contemporary rug")).toBeTruthy();
    expect(within(summary).getByText("Quantity: 2")).toBeTruthy();
    expect(within(summary).getByText("Bespoke consultation")).toBeTruthy();
    expect(within(summary).getByText("Quantity: 3")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Edit your bag" }).getAttribute("href")).toBe("/cart");
    submit();
    await screen.findByText(/Reference: ZARI-TEST-001/);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/orders");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toMatchObject({
      customerName: customer.fullName,
      customerEmail: customer.email,
      items: [{ sku: "ZAR-CON-001", quantity: 2 }, { sku: "ZAR-BES-001", quantity: 3 }],
    });
    expect(screen.queryByRole("button", { name: "Send order request" })).toBeNull();
  });

  it.each([
    ["loading", { ready: false }, /Loading your selection/],
    ["empty", { cart: { items: [], itemCount: 0 } }, /Your bag is empty/],
  ])("does not submit a fallback rug when the bag is %s", (_name, overrides, message) => {
    storeWith(pieces, overrides);
    render(<OrderEnquiry source="bag" />);
    expect(screen.getByRole("status").textContent).toMatch(message);
    expect(screen.queryByRole("button", { name: "Send order request" })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a guest bag with the guest's own contact details", async () => {
    storeWith(pieces, { user: null });
    render(<OrderEnquiry source="bag" />);
    fireEvent.change(screen.getByLabelText("Full name *"), { target: { value: "Guest Customer" } });
    fireEvent.change(screen.getByLabelText("Email *"), { target: { value: "guest@example.com" } });
    submit();
    await screen.findByText(/Reference: ZARI-TEST-001/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ customerName: "Guest Customer", customerEmail: "guest@example.com", items: [{ sku: "ZAR-CON-001", quantity: 2 }, { sku: "ZAR-BES-001", quantity: 3 }] });
  });

  it("blocks quantities that exceed currently available stock", () => {
    storeWith([{ ...pieces[0], availableStock: 1 }]);
    render(<OrderEnquiry source="bag" />);
    expect(screen.getByRole("alert").textContent).toMatch(/no longer available/);
    expect((screen.getByRole("button", { name: "Send order request" }) as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks bags above the API's ten-line limit", () => {
    storeWith(Array.from({ length: 11 }, (_, index) => ({ ...pieces[0], sku: `ZAR-${index}` })));
    render(<OrderEnquiry source="bag" />);
    expect(screen.getByRole("alert").textContent).toMatch(/up to 10/);
    expect((screen.getByRole("button", { name: "Send order request" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("disables form controls and ignores duplicate submissions while awaiting a response", async () => {
    let complete!: (response: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((resolve) => { complete = resolve; }));
    const { container } = render(<OrderEnquiry source="bag" />);
    submit();
    expect((screen.getByRole("group", { name: "Your order request" }) as HTMLFieldSetElement).disabled).toBe(true);
    fireEvent.submit(container.querySelector("form")!);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    complete(new Response(JSON.stringify({ orderNumber: "ZARI-TEST-002" }), { status: 201 }));
    await screen.findByText(/Reference: ZARI-TEST-002/);
  });
});

describe("request recovery", () => {
  it.each([
    ["network failure", () => Promise.reject(new TypeError("Failed to fetch")), /Check your connection/],
    ["stock rejection", () => Promise.resolve(new Response(JSON.stringify({ error: "That quantity is not currently available." }), { status: 409 })), /not currently available/],
    ["invalid response", () => Promise.resolve(new Response("upstream error", { status: 502 })), /Please try again/],
  ])("keeps details and permits a successful retry after %s", async (_name, response, message) => {
    fetchMock.mockImplementationOnce(response);
    render(<OrderEnquiry source="bag" />);
    fireEvent.change(screen.getByLabelText("Delivery location"), { target: { value: "Delhi, India" } });
    submit();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(message));
    expect((screen.getByRole("button", { name: "Send order request" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByLabelText("Delivery location") as HTMLInputElement).value).toBe("Delhi, India");
    submit();
    await screen.findByText(/Reference: ZARI-TEST-001/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not claim success without an order reference", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ received: true }), { status: 202 }));
    render(<OrderEnquiry source="bag" />);
    submit();
    expect((await screen.findByRole("alert")).textContent).toMatch(/contact our concierge before trying again/);
    expect(screen.queryByText(/Reference:/)).toBeNull();
  });
});

describe("homepage enquiries", () => {
  it("requires a deliberate catalogue selection and submits that SKU and quantity", async () => {
    render(<OrderEnquiry />);
    expect((screen.getByRole("button", { name: "Send order request" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Choose a piece *"), { target: { value: "ZAR-BES-001" } });
    fireEvent.change(screen.getByLabelText("Quantity *"), { target: { value: "2" } });
    submit();
    await screen.findByText(/Reference: ZARI-TEST-001/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).items).toEqual([{ sku: "ZAR-BES-001", quantity: 2 }]);
  });

  it("keeps the form unavailable when catalogue loading fails", () => {
    useCatalog.mockReturnValue({ products: [], loading: false, error: true });
    render(<OrderEnquiry />);
    expect(screen.getByRole("alert").textContent).toMatch(/could not load/);
    expect((screen.getByRole("button", { name: "Send order request" }) as HTMLButtonElement).disabled).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
