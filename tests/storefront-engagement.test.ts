// @vitest-environment node
import type { DatabaseSync } from "node:sqlite";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { POST as signup, GET as subscribers } from "@/app/api/newsletter/route";
import { POST as event, GET as counts } from "@/app/api/store-events/route";
import { POST as login } from "@/app/api/auth/login/route";
import { storefrontDatabase } from "./helpers/storefront-database";
import { sqliteD1 } from "./helpers/sqlite-d1";
const { getDatabase, isAdminRequest } = vi.hoisted(() => ({ getDatabase: vi.fn(), isAdminRequest: vi.fn() }));
vi.mock("@/lib/server/database", () => ({ getDatabase, isAdminRequest }));
let db: DatabaseSync;
beforeEach(() => { db = storefrontDatabase(); getDatabase.mockResolvedValue(sqliteD1(db)); isAdminRequest.mockResolvedValue(false); });
afterEach(() => { db.close(); vi.restoreAllMocks(); });
function request(body: unknown, origin = "https://zarirugs.example") { return new Request("https://zarirugs.example/api/test", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin, "cf-connecting-ip": "192.0.2.1" }, body: JSON.stringify(body) }); }
it("stores consent and makes repeated newsletter signup idempotent", async () => {
  expect((await signup(request({ email: "  Buyer@Example.com  " }))).status).toBe(200);
  expect((await signup(request({ email: "buyer@example.com" }))).status).toBe(200);
  expect(db.prepare("SELECT email, consent_version FROM newsletter_subscribers").all()).toMatchObject([{ email: "buyer@example.com", consent_version: "private-register-2026-11" }]);
});
it("rejects invalid, oversized and foreign-origin signup requests", async () => {
  for (const body of [null, [], { email: "bad" }]) expect((await signup(request(body))).status).toBe(400);
  expect((await signup(request({ email: "x".repeat(3000) }))).status).toBe(413);
  expect((await signup(request({ email: "buyer@example.com" }, "https://elsewhere.example"))).status).toBe(403);
  expect(db.prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers").get()).toMatchObject({ n: 0 });
});
it("does not save honeypot submissions", async () => {
  expect((await signup(request({ email: "bot@example.com", website: "spam" }))).status).toBe(202);
  expect(db.prepare("SELECT COUNT(*) AS n FROM newsletter_subscribers").get()).toMatchObject({ n: 0 });
});
it("limits public writes and expires network keys without storing raw addresses", async () => {
  vi.spyOn(Date, "now").mockReturnValue(1000);
  for (let index = 0; index < 5; index++) expect((await signup(request({ email: `buyer${index}@example.com` }))).status).toBe(200);
  expect((await signup(request({ email: "extra@example.com" }))).status).toBe(429);
  const rows = db.prepare("SELECT request_key FROM public_request_limits").all();
  expect(JSON.stringify(rows)).not.toContain("192.0.2.1");
  vi.spyOn(Date, "now").mockReturnValue(61000);
  expect((await signup(request({ email: "extra@example.com" }))).status).toBe(200);
  expect(db.prepare("SELECT COUNT(*) AS n FROM public_request_limits").get()).toMatchObject({ n: 1 });
});
it("keeps newsletter addresses and store metrics private to operators", async () => {
  await signup(request({ email: "buyer@example.com" }));
  expect((await subscribers(new Request("https://zarirugs.example"))).status).toBe(401);
  expect((await counts(new Request("https://zarirugs.example"))).status).toBe(401);
  isAdminRequest.mockResolvedValue(true);
  const response = await subscribers(new Request("https://zarirugs.example"));
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect((await response.json()).subscribers).toHaveLength(1);
});
it("stores only aggregate event fields and prevents public confirmation spoofing", async () => {
  expect((await event(request({ event: "product_view", sku: "ZAR-CON-001", email: "discard@example.com", sessionId: "discard" }))).status).toBe(204);
  expect((await event(request({ event: "order_confirmed" }))).status).toBe(400);
  expect((await event(request({ event: "product_view", sku: "ZAR-UNKNOWN" }))).status).toBe(400);
  expect((await event(request(null))).status).toBe(400);
  const rows = db.prepare("SELECT * FROM storefront_events").all();
  expect(rows).toHaveLength(1); expect(JSON.stringify(rows)).not.toContain("discard");
  expect(Object.keys(rows[0]).sort()).toEqual(["created_at", "event_name", "id", "sku"]);
});
it("limits failed logins before continuing to password checks", async () => {
  for (let attempt = 0; attempt < 10; attempt++) expect((await login(request({ email: "none@example.com", password: "incorrect" }))).status).toBe(401);
  expect((await login(request({ email: "none@example.com", password: "incorrect" }))).status).toBe(429);
});
