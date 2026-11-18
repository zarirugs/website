import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, request } from "./fixture.mjs";

function newOrder(f, number = "TEST-1") {
  const result = f.sqlite
    .prepare(
      "INSERT INTO orders (order_number,customer_name,customer_email,workflow_status) VALUES (?, 'Test customer', 'test@example.invalid', 'new')",
    )
    .run(number);
  const id = Number(result.lastInsertRowid);
  f.sqlite
    .prepare(
      "INSERT INTO order_items (order_id,sku,item_name,quantity) VALUES (?, 'ZAR-HER-001', 'Heritage rug', 2)",
    )
    .run(id);
  return id;
}

test("paid → unpaid → paid → cancelled balances inventory without double reservation", async () => {
  const f = fixture();
  try {
    const id = newOrder(f);
    const route = f.route("orders/[id]");
    const stock = () =>
      f.sqlite
        .prepare("SELECT stock FROM inventory_items WHERE sku = 'ZAR-HER-001'")
        .get().stock;
    const stage = (value) =>
      route.PATCH(request({ stage: value }, "PATCH"), {
        params: Promise.resolve({ id: String(id) }),
      });
    assert.equal(stock(), 8);
    for (const [value, expected] of [
      ["paid", 6],
      ["in_production", 6],
      ["payment_pending", 8],
      ["paid", 6],
      ["cancelled", 8],
    ]) {
      assert.equal((await stage(value)).status, 200);
      assert.equal(stock(), expected);
    }
    assert.equal((await stage("paid")).status, 409);
    assert.equal(stock(), 8);
    assert.equal(
      f.sqlite
        .prepare(
          "SELECT SUM(quantity_delta) AS total FROM stock_movements WHERE order_id = ?",
        )
        .get(id).total,
      0,
    );
  } finally {
    f.sqlite.close();
  }
});

test("insufficient stock and unauthorised stage updates leave the order unchanged", async () => {
  const f = fixture();
  try {
    const id = newOrder(f);
    f.sqlite.exec(
      "UPDATE inventory_items SET stock = 1 WHERE sku = 'ZAR-HER-001'",
    );
    const route = f.route("orders/[id]");
    const paid = () =>
      route.PATCH(request({ stage: "paid" }, "PATCH"), {
        params: Promise.resolve({ id: String(id) }),
      });
    assert.equal((await paid()).status, 409);
    assert.equal(
      f.sqlite
        .prepare("SELECT workflow_status FROM orders WHERE id = ?")
        .get(id).workflow_status,
      "new",
    );
    assert.equal(
      f.sqlite.prepare("SELECT COUNT(*) AS count FROM stock_movements").get()
        .count,
      0,
    );
    f.deny();
    assert.equal((await paid()).status, 401);
  } finally {
    f.sqlite.close();
  }
});

test("latest 100 orders include every line and a deterministic order for tied timestamps", async () => {
  const f = fixture();
  try {
    for (let i = 1; i <= 101; i++) newOrder(f, `TEST-${i}`);
    const line = f.sqlite.prepare(
      "INSERT INTO order_items (order_id,sku,item_name,quantity) VALUES (101, 'ZAR-HER-001', 'Additional piece', 1)",
    );
    for (let i = 0; i < 500; i++) line.run();
    const response = await f
      .route("orders")
      .GET(new Request("http://localhost/api/orders"));
    const { orders } = await response.json();
    assert.equal(orders.length, 100);
    assert.equal(orders[0].id, 101);
    assert.equal(orders[0].items.length, 501);
    assert.equal(orders.at(-1).id, 2);
  } finally {
    f.sqlite.close();
  }
});

test("visible product metric excludes hidden categories and inactive inventory", async () => {
  const f = fixture();
  try {
    const route = f.route("dashboard");
    assert.equal(
      (await (await route.GET(new Request("http://localhost"))).json()).metrics
        .visibleProducts,
      3,
    );
    f.sqlite.exec(
      "UPDATE categories SET is_active = 0 WHERE id = 'category-heritage'; UPDATE inventory_items SET is_active = 0 WHERE sku = 'ZAR-CON-001'",
    );
    assert.equal(
      (await (await route.GET(new Request("http://localhost"))).json()).metrics
        .visibleProducts,
      1,
    );
  } finally {
    f.sqlite.close();
  }
});

test("a stale stage update cannot reserve inventory twice", async () => {
  const f = fixture();
  try {
    const id = newOrder(f);
    const batch = f.database.batch;
    f.database.batch = async (statements) => {
      if (statements.some((s) => s.sql.startsWith("UPDATE inventory_items"))) {
        f.sqlite
          .prepare("UPDATE orders SET workflow_status = 'paid' WHERE id = ?")
          .run(id);
        f.sqlite.exec(
          "UPDATE inventory_items SET stock = 6 WHERE sku = 'ZAR-HER-001'",
        );
      }
      return batch(statements);
    };
    const response = await f
      .route("orders/[id]")
      .PATCH(request({ stage: "paid" }, "PATCH"), {
        params: Promise.resolve({ id: String(id) }),
      });
    assert.equal(response.status, 409);
    assert.equal(
      f.sqlite
        .prepare("SELECT stock FROM inventory_items WHERE sku = 'ZAR-HER-001'")
        .get().stock,
      6,
    );
    assert.equal(
      f.sqlite.prepare("SELECT COUNT(*) AS count FROM stock_movements").get()
        .count,
      0,
    );
  } finally {
    f.sqlite.close();
  }
});

test("stock depleted after availability checks rolls back the entire order update", async () => {
  const f = fixture();
  try {
    const id = newOrder(f);
    const batch = f.database.batch;
    f.database.batch = async (statements) => {
      if (statements.some((s) => s.sql.startsWith("UPDATE inventory_items")))
        f.sqlite.exec(
          "UPDATE inventory_items SET stock = 1 WHERE sku = 'ZAR-HER-001'",
        );
      return batch(statements);
    };
    const response = await f
      .route("orders/[id]")
      .PATCH(request({ stage: "paid" }, "PATCH"), {
        params: Promise.resolve({ id: String(id) }),
      });
    assert.equal(response.status, 409);
    assert.equal(
      f.sqlite
        .prepare("SELECT workflow_status FROM orders WHERE id = ?")
        .get(id).workflow_status,
      "new",
    );
    assert.equal(
      f.sqlite.prepare("SELECT COUNT(*) AS count FROM stock_movements").get()
        .count,
      0,
    );
  } finally {
    f.sqlite.close();
  }
});
