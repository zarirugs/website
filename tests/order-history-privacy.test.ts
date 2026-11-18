// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as accountOrders } from "@/app/api/account/orders/route";
import { POST as submitOrder, GET as adminOrders } from "@/app/api/orders/route";
import { POST as register } from "@/app/api/auth/register/route";
import { createSession } from "@/lib/server/auth";
import { sqliteD1 } from "./helpers/sqlite-d1";

const { getDatabase, isAdminRequest } = vi.hoisted(() => ({ getDatabase: vi.fn(), isAdminRequest: vi.fn() }));
vi.mock("@/lib/server/database", () => ({ getDatabase, isAdminRequest }));

const migrationsDirectory = new URL("../db/migrations/", import.meta.url);
const ownershipMigration = "0015_order_account_ownership.sql";
let database: DatabaseSync;
let ownerCookie: string;
let otherCookie: string;

function request(path: string, cookie = "", body?: Record<string, unknown>) {
  return new Request(`https://zarirugs.example${path}`, {
    method: body ? "POST" : "GET",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

const orderDetails = {
  customerName: "Customer",
  customerEmail: "guest@example.com",
  deliveryAddress: "Private delivery address",
  items: [{ sku: "ZAR-CON-001", quantity: 2 }],
};

beforeEach(async () => {
  database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  const adapter = sqliteD1(database);
  getDatabase.mockResolvedValue(adapter);
  isAdminRequest.mockResolvedValue(false);

  for (const file of readdirSync(migrationsDirectory).filter((name) => name.endsWith(".sql")).sort()) {
    // Reproduce the original migration's unsafe email-only link, rather than
    // constructing an artificial legacy row after applying the privacy fix.
    if (file === "0004_customer_account_dashboard.sql") {
      database.exec(`
        INSERT INTO customers (id, email, full_name, password_hash, password_salt)
          VALUES ('owner', 'prior@example.com', 'Owner', 'unused', 'unused'),
                 ('other', 'other@example.com', 'Other', 'unused', 'unused');
        INSERT INTO orders (id, order_number, customer_name, customer_email, delivery_address)
          VALUES (1, 'LEGACY-PRIVATE', 'Guest', 'prior@example.com', 'Legacy private address'),
                 (2, 'GUEST-PRIVATE', 'Guest', 'GuEsT@example.com', 'Guest private address');
        INSERT INTO order_items (order_id, sku, item_name, quantity)
          VALUES (1, 'ZAR-HER-001', 'Legacy private item', 1),
                 (2, 'ZAR-BES-001', 'Guest private item', 1);
      `);
    }
    database.exec(readFileSync(new URL(file, migrationsDirectory), "utf8"));
  }
  ownerCookie = `zari_session=${await createSession(adapter, "owner")}`;
  otherCookie = `zari_session=${await createSession(adapter, "other")}`;
});

afterEach(() => database.close());

describe("customer order privacy", () => {
  it("does not reveal a guest request after someone registers its email address", async () => {
    const signup = await register(request("/api/auth/register", "", {
      fullName: "New Account",
      email: "guest@example.com",
      password: "Disposable-test-password-2026",
    }));
    expect(signup.status).toBe(201);
    const cookie = signup.headers.get("set-cookie")!.split(";")[0];
    const response = await accountOrders(request("/api/account/orders", cookie));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orders: [] });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("withholds old email-backfilled links without deleting orders or their items", async () => {
    expect(database.prepare("SELECT customer_id, customer_link_source FROM orders WHERE id = 1").get())
      .toMatchObject({ customer_id: "owner", customer_link_source: "legacy" });
    const response = await accountOrders(request("/api/account/orders", ownerCookie));
    expect(await response.json()).toEqual({ orders: [] });
    expect(database.prepare("SELECT delivery_address FROM orders WHERE id = 1").get())
      .toMatchObject({ delivery_address: "Legacy private address" });
    expect(database.prepare("SELECT item_name FROM order_items WHERE order_id = 1").get())
      .toMatchObject({ item_name: "Legacy private item" });
  });

  it("records session ownership on new requests and returns only the owner's details", async () => {
    const submitted = await submitOrder(request("/api/orders", ownerCookie, {
      ...orderDetails,
      customerEmail: "someone-else@example.com",
      customer_id: "other",
      customer_link_source: "guest",
    }));
    expect(submitted.status).toBe(201);
    const { orderNumber } = await submitted.json();
    expect(database.prepare("SELECT customer_id, customer_email, customer_link_source FROM orders WHERE order_number = ?").get(orderNumber))
      .toMatchObject({ customer_id: "owner", customer_email: "prior@example.com", customer_link_source: "authenticated" });
    const response = await accountOrders(request("/api/account/orders", ownerCookie));
    expect(await response.json()).toMatchObject({ orders: [{
      orderNumber,
      deliveryAddress: orderDetails.deliveryAddress,
      items: [{ sku: "ZAR-CON-001", quantity: 2 }],
    }] });
    const otherResponse = await accountOrders(request("/api/account/orders", otherCookie));
    expect(await otherResponse.json()).toEqual({ orders: [] });
  });

  it("does not let a guest forge an account link or its ownership source", async () => {
    const submitted = await submitOrder(request("/api/orders", "", {
      ...orderDetails,
      customerEmail: "prior@example.com",
      customer_id: "owner",
      customerId: "owner",
      customer_link_source: "authenticated",
    }));
    expect(submitted.status).toBe(201);
    const { orderNumber } = await submitted.json();
    expect(database.prepare("SELECT customer_id, customer_link_source FROM orders WHERE order_number = ?").get(orderNumber))
      .toMatchObject({ customer_id: null, customer_link_source: "guest" });
    const response = await accountOrders(request("/api/account/orders", ownerCookie));
    expect(await response.json()).toEqual({ orders: [] });
  });

  it("uses account identity rather than email to select both orders and line items", async () => {
    await submitOrder(request("/api/orders", ownerCookie, orderDetails));
    await submitOrder(request("/api/orders", otherCookie, {
      ...orderDetails,
      items: [{ sku: "ZAR-BES-001", quantity: 1 }],
      deliveryAddress: "Another customer's private address",
    }));
    // A changed contact email must neither remove the authenticated link nor
    // create access to any unrelated order whose email now happens to match.
    database.prepare("UPDATE customers SET email = 'guest@example.com' WHERE id = 'owner'").run();
    const response = await accountOrders(request("/api/account/orders", ownerCookie));
    const result = await response.json();
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].items).toEqual([{ sku: "ZAR-CON-001", name: "Contemporary — hand-knotted rug", quantity: 2 }]);
    expect(JSON.stringify(result)).not.toMatch(/Guest private|Legacy private|Another customer's/);
  });

  it("rejects missing or invalid sessions", async () => {
    for (const cookie of ["", "zari_session=invalid"]) {
      const response = await accountOrders(request("/api/account/orders", cookie));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Sign in to view your orders." });
    }
  });

  it("keeps guest and legacy records available to the protected operations dashboard", async () => {
    isAdminRequest.mockResolvedValue(true);
    const response = await adminOrders(request("/api/orders"));
    const result = await response.json();
    expect(response.status).toBe(200);
    expect(result.orders.map((order: { orderNumber: string }) => order.orderNumber).sort())
      .toEqual(["GUEST-PRIVATE", "LEGACY-PRIVATE"]);
  });

  it("fails closed when the ownership migration has not yet been applied", async () => {
    database.exec("ALTER TABLE orders DROP COLUMN customer_link_source");
    const response = await accountOrders(request("/api/account/orders", ownerCookie));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Unable to complete this request. Please try again." });
  });

  it("marks every existing row as legacy and rejects unknown ownership sources", () => {
    expect(database.prepare("SELECT COUNT(*) AS count FROM orders WHERE customer_link_source = 'legacy'").get())
      .toMatchObject({ count: 2 });
    expect(() => database.prepare("UPDATE orders SET customer_link_source = 'email_verified' WHERE id = 1").run()).toThrow();
    expect(readFileSync(new URL(ownershipMigration, migrationsDirectory), "utf8")).not.toMatch(/DELETE FROM|DROP TABLE/i);
  });
});
