import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiError, requestJson } from "../lib/client/api.ts";

test("connection failures are actionable and do not leave a hanging promise", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(
    requestJson("/api/products"),
    /Connection lost.*entries are still here/,
  );
});
test("expired sessions are distinguished from validation errors", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Unauthorised." }, { status: 401 }),
  );
  await assert.rejects(
    requestJson("/api/products"),
    (error) =>
      error instanceof ApiError &&
      error.status === 401 &&
      /session has expired/.test(error.message),
  );
  await assert.rejects(
    requestJson("/api/auth/login"),
    (error) => error instanceof ApiError && error.message === "Unauthorised.",
  );
});
test("multipart uploads keep browser-generated boundaries and failures never masquerade as success", async (t) => {
  const body = new FormData();
  body.set("name", "Test media");
  t.mock.method(globalThis, "fetch", async (path, init) => {
    assert.equal(init.headers["Content-Type"], undefined);
    assert.equal(init.cache, "no-store");
    return new Response("<html>Unavailable</html>", { status: 503 });
  });
  await assert.rejects(
    requestJson("/api/media", { method: "POST", body }),
    /could not be completed/,
  );
});
