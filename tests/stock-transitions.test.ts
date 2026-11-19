// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import type { D1Database, D1PreparedStatement } from "@/lib/server/d1";
import { PATCH } from "@/app/api/orders/[id]/route";
import { storefrontDatabase } from "./helpers/storefront-database";
import { sqliteD1 } from "./helpers/sqlite-d1";
const { getDatabase, isAdminRequest } = vi.hoisted(() => ({ getDatabase: vi.fn(), isAdminRequest: vi.fn() }));
vi.mock("@/lib/server/database", () => ({ getDatabase, isAdminRequest }));
let db: DatabaseSync;
beforeEach(() => { db = storefrontDatabase(); getDatabase.mockResolvedValue(sqliteD1(db)); isAdminRequest.mockResolvedValue(true); });
afterEach(() => db.close());
function order(id: number, quantity = 1, status = "new") {
  db.prepare("INSERT INTO orders (id, order_number, customer_name, customer_email, status) VALUES (?, ?, 'Test', 'test@example.com', ?)").run(id, `ORDER-${id}`, status);
  db.prepare("INSERT INTO order_items (order_id, sku, item_name, quantity) VALUES (?, 'ZAR-CON-001', 'Rug', ?)").run(id, quantity);
}
function update(id: number, status = "confirmed") { return PATCH(new Request("https://zarirugs.example/api/orders/" + id, { method: "PATCH", body: JSON.stringify({ status }) }), { params: Promise.resolve({ id: String(id) }) }); }
function stock() { return (db.prepare("SELECT stock FROM inventory_items WHERE sku = 'ZAR-CON-001'").get() as { stock: number }).stock; }
function movements() { return (db.prepare("SELECT COUNT(*) AS n FROM stock_movements").get() as { n: number }).n; }
function staleConcurrentReads() {
  const adapter = sqliteD1(db);
  let reads = 0;
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  let sequence: Promise<unknown> = Promise.resolve();
  const concurrent: D1Database = {
    prepare(query) {
      const statement = adapter.prepare(query);
      if (query.startsWith("SELECT id, order_number, status")) {
        const first = statement.first.bind(statement);
        statement.first = async <T,>() => { const value = await first<T>(); if (++reads === 2) release(); await barrier; return value; };
      }
      return statement;
    },
    batch<T>(statements: D1PreparedStatement[]) {
      const next = sequence.then(() => adapter.batch<T>(statements));
      sequence = next.catch(() => undefined);
      return next;
    },
  };
  getDatabase.mockResolvedValue(concurrent);
}
it("allows only one of two stale confirmations to reserve the last piece", async () => {
  order(1); order(2); db.exec("UPDATE inventory_items SET stock = 1 WHERE sku = 'ZAR-CON-001'"); staleConcurrentReads();
  const responses = await Promise.all([update(1), update(2)]);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
  expect(stock()).toBe(0); expect(movements()).toBe(1);
  expect(db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'confirmed'").get()).toMatchObject({ n: 1 });
  expect(db.prepare("SELECT COUNT(*) AS n FROM storefront_events WHERE event_name = 'order_confirmed'").get()).toMatchObject({ n: 1 });
});
it("deducts once when the same order is confirmed concurrently", async () => {
  order(1, 2); db.exec("UPDATE inventory_items SET stock = 5 WHERE sku = 'ZAR-CON-001'"); staleConcurrentReads();
  const responses = await Promise.all([update(1), update(1)]);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
  expect(stock()).toBe(3); expect(movements()).toBe(1);
});
it("restores stock once for simultaneous cancellations", async () => {
  order(1, 2, "confirmed"); db.exec("UPDATE inventory_items SET stock = 3 WHERE sku = 'ZAR-CON-001'"); staleConcurrentReads();
  const responses = await Promise.all([update(1, "cancelled"), update(1, "cancelled")]);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 409]); expect(stock()).toBe(5); expect(movements()).toBe(1);
});
it("keeps successful retries idempotent", async () => {
  order(1, 2); expect((await update(1)).status).toBe(200); const count = stock();
  expect((await update(1)).status).toBe(200); expect(stock()).toBe(count); expect(movements()).toBe(1);
  expect((await update(1, "cancelled")).status).toBe(200); expect((await update(1, "cancelled")).status).toBe(200); expect(stock()).toBe(12); expect(movements()).toBe(2);
});
it("does not partly reserve a multi-rug order when one line is unavailable", async () => {
  order(1, 2); db.exec("UPDATE inventory_items SET stock = 0 WHERE sku = 'ZAR-BES-001'; INSERT INTO order_items (order_id, sku, item_name, quantity) VALUES (1, 'ZAR-BES-001', 'Commission', 1)");
  expect((await update(1)).status).toBe(409); expect(stock()).toBe(12); expect(movements()).toBe(0);
  expect(db.prepare("SELECT status FROM orders WHERE id = 1").get()).toMatchObject({ status: "new" });
});
it("checks the combined quantity of historical duplicate SKU lines", async () => {
  order(1, 2); db.exec("UPDATE inventory_items SET stock = 3 WHERE sku = 'ZAR-CON-001'; INSERT INTO order_items (order_id, sku, item_name, quantity) VALUES (1, 'ZAR-CON-001', 'Duplicate', 2)");
  expect((await update(1)).status).toBe(409); expect(stock()).toBe(3); expect(movements()).toBe(0);
});
it("rolls the status, stock and confirmation metric back together if an effect fails", async () => {
  order(1); db.exec("CREATE TRIGGER fail_movement BEFORE INSERT ON stock_movements BEGIN SELECT RAISE(ABORT, 'test failure'); END");
  expect((await update(1)).status).toBe(500); expect(stock()).toBe(12); expect(movements()).toBe(0);
  expect(db.prepare("SELECT status FROM orders WHERE id = 1").get()).toMatchObject({ status: "new" });
  expect(db.prepare("SELECT COUNT(*) AS n FROM storefront_events").get()).toMatchObject({ n: 0 });
});
it("requires an operator session", async () => { order(1); isAdminRequest.mockResolvedValue(false); expect((await update(1)).status).toBe(401); expect(movements()).toBe(0); });
