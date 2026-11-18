import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const publisher = fileURLToPath(new URL("./publish-instagram.mjs", import.meta.url));
const media = Buffer.from("approved media fixture");
const candidate = {
  id: "approved-fixture", status: "approved", contentCategory: "education",
  publishAt: "2026-11-27T14:00:00Z", mediaType: "REELS",
  mediaUrl: "https://zarirugs.com/marketing/instagram/fixture.mp4",
  caption: "The exact caption accepted for this specific Reel.",
  mediaSha256: createHash("sha256").update(media).digest("hex"),
  approval: { method: "chat", text: "this is good to post", recordedAt: "2026-11-26T14:00:00Z" },
};

// Each child runs the real publishing entrypoint with isolated media, queue,
// environment, Git commands and HTTP responses. No account or repository is used.
const preload = `
import fs from "node:fs";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
const fixture = JSON.parse(process.env.ZARI_TEST_SCENARIO);
const OriginalDate = Date;
globalThis.Date = class extends OriginalDate {
  constructor(...args) { super(...(args.length ? args : ["2026-11-28T15:00:00Z"])); }
  static now() { return new OriginalDate("2026-11-28T15:00:00Z").getTime(); }
};
function log(event) { fs.appendFileSync("calls.jsonl", JSON.stringify(event) + "\\n"); }
childProcess.execFileSync = (command, args) => {
  log({ type: "git", command, args });
  if (args[0] === "for-each-ref" && args.at(-1).includes("instagram-container") && fixture.saved) {
    return JSON.stringify({ id: "container123", mediaUrl: fixture.post.mediaUrl,
      caption: fixture.post.caption, mediaSha256: fixture.post.mediaSha256 });
  }
  return "";
};
syncBuiltinESMExports();
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(input);
  const method = options.method || "GET";
  log({ type: "http", path: url.pathname, method });
  if (url.hostname === "zarirugs.com") {
    return new Response(Buffer.from(fixture.media), {
      status: fixture.unavailable ? 404 : 200, headers: { "content-type": "video/mp4" },
    });
  }
  let body;
  if (url.pathname.endsWith("/me")) body = { id: "test-account", username: "fixture", account_type: "BUSINESS" };
  else if (url.pathname.endsWith("/test-account/media") && method === "GET") body = { data: fixture.feed || [] };
  else if (url.pathname.endsWith("/test-account/media") && method === "POST") body = { id: "container123" };
  else if (url.pathname.endsWith("/container123")) body = { status_code: fixture.saved ? "PUBLISHED" : "FINISHED" };
  else if (url.pathname.endsWith("/test-account/media_publish") && method === "POST") body = { id: "published123" };
  else throw new Error("Unexpected fixture request: " + method + " " + url.pathname);
  return Response.json(body);
};
`;

function runPublisher(scenario = {}, extraEnv = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "zari-publisher-test-"));
  try {
    fs.mkdirSync(path.join(directory, "marketing"));
    fs.mkdirSync(path.join(directory, "public/marketing/instagram"), { recursive: true });
    fs.writeFileSync(path.join(directory, "marketing/queue.json"), JSON.stringify({ posts: [candidate] }));
    fs.writeFileSync(path.join(directory, "public/marketing/instagram/fixture.mp4"), media);
    if (scenario.oversized) {
      const file = fs.openSync(path.join(directory, "public/marketing/instagram/fixture.mp4"), "r+");
      fs.ftruncateSync(file, 26 * 1024 * 1024);
      fs.closeSync(file);
    }
    fs.writeFileSync(path.join(directory, "preload.mjs"), preload);
    const result = spawnSync(process.execPath, ["--import", path.join(directory, "preload.mjs"), publisher], {
      cwd: directory, encoding: "utf8", timeout: 10_000,
      env: {
        PATH: process.env.PATH, INSTAGRAM_ACCOUNT_ID: "test-account", INSTAGRAM_ACCESS_TOKEN: "fixture-only",
        ZARI_TEST_SCENARIO: JSON.stringify({ post: candidate, media: [...media], ...scenario }), ...extraEnv,
      },
    });
    const logPath = path.join(directory, "calls.jsonl");
    const calls = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, "utf8").trim().split("\n").map((line) => JSON.parse(line)) : [];
    return { ...result, calls };
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

const isCreate = (call) => call.type === "http" && call.method === "POST" && call.path.endsWith("/media");
const isPublish = (call) => call.type === "http" && call.method === "POST" && call.path.endsWith("/media_publish");

test("oversized local media is rejected before contacting Instagram", () => {
  const result = runPublisher({ oversized: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /25 MiB asset limit/);
  assert.equal(result.calls.some((call) => call.type === "http"), false);
});

test("an unavailable public video stops before creating an Instagram container", () => {
  const result = runPublisher({ unavailable: true });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Public media is unavailable \(404\)/);
  assert.equal(result.calls.some(isCreate), false);
});

test("deployed media must match the file accepted in chat", () => {
  const result = runPublisher({ media: [...Buffer.from("different deployed media")] });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /differs from the approved file/);
  assert.equal(result.calls.some(isCreate), false);
});

test("four posts on the live feed prevent even a manual publication", () => {
  const feed = [23, 24, 25, 26].map((day) => ({ id: String(day), timestamp: `2026-11-${day}T14:00:00Z`, media_product_type: "REELS" }));
  const result = runPublisher({ feed }, { POST_ID: candidate.id });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Four Instagram feed posts/);
  assert.equal(result.calls.some(isCreate), false);
  assert.equal(result.calls.some(isPublish), false);
});

test("unreadable feed timestamps stop publication until the weekly count is known", () => {
  const result = runPublisher({ feed: [{ id: "unknown-date" }] });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /without a valid timestamp/);
  assert.equal(result.calls.some(isCreate), false);
});

test("a successful release saves its container before publishing and records completion", () => {
  const result = runPublisher();
  assert.equal(result.status, 0, result.stderr);
  const checkpoint = result.calls.findIndex((call) => call.type === "git" && call.args[0] === "push" && call.args.at(-1).startsWith("instagram-container/"));
  const publish = result.calls.findIndex(isPublish);
  assert.ok(checkpoint >= 0 && checkpoint < publish);
  assert.equal(result.calls.filter((call) => call.type === "http" && call.method === "GET" && call.path.endsWith("/media")).length, 2);
  assert.ok(result.calls.some((call) => call.type === "git" && call.args[0] === "push" && call.args.at(-1) === "instagram-post/approved-fixture"));
});

test("a previously published container is recovered without publishing twice", () => {
  const result = runPublisher({ saved: true });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Recovered the completed publication/);
  assert.equal(result.calls.some(isCreate), false);
  assert.equal(result.calls.some(isPublish), false);
  assert.ok(result.calls.some((call) => call.type === "git" && call.args[0] === "push" && call.args.at(-1) === "instagram-post/approved-fixture"));
});

test("connection checks read the account and feed without creating or publishing media", () => {
  const result = runPublisher({}, { CONNECTION_ONLY: "true" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /connection check completed without publishing/);
  assert.equal(result.calls.some(isCreate), false);
  assert.equal(result.calls.some(isPublish), false);
});
