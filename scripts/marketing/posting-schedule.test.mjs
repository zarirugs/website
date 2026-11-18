import test from "node:test";
import assert from "node:assert/strict";
import { nextSlot, weekBounds, selectDuePost, publishingLimitReason, scheduleErrors } from "./posting-schedule.mjs";
import { schedulePost } from "./schedule-instagram.mjs";

const now = "2026-11-23T00:00:00Z";
const slots = ["23", "25", "27", "28"].map((day) => `2026-11-${day}T14:00:00.000Z`);
function post(id, publishAt = slots[0], contentCategory = "education") {
  return {
    id, publishAt, contentCategory, status: "approved", mediaType: "REELS",
    mediaUrl: `https://zarirugs.com/marketing/instagram/${id}.mp4`,
    caption: "An approved caption for this particular Reel.",
    mediaSha256: "a".repeat(64),
  };
}

test("weeks change at Monday midnight in India", () => {
  assert.equal(new Date(weekBounds("2026-11-22T18:30:00Z").start).toISOString(), "2026-11-22T18:30:00.000Z");
  assert.equal(new Date(weekBounds("2026-11-22T18:29:59Z").start).toISOString(), "2026-11-15T18:30:00.000Z");
});

test("the next slot keeps the existing 19:30 India posting time", () => {
  assert.equal(nextSlot([], [], now), slots[0]);
  assert.equal(nextSlot([], [], "2026-11-23T14:01:00Z"), slots[1]);
});

test("a fifth approval moves to the following week", () => {
  const booked = slots.map((date, index) => post(`reel-${index}`, date, index % 2 ? "trend" : "education"));
  assert.equal(nextSlot(booked, [], now), "2026-11-30T14:00:00.000Z");
  assert.ok(scheduleErrors([...booked, post("fifth", "2026-11-29T14:00:00Z")]).length);
});

test("actual publication dates reserve capacity without double-counting queue entries", () => {
  const published = [{ id: "already-posted", publishedAt: slots[0] }];
  const queue = [post("already-posted"), post("waiting", slots[1], "trend")];
  assert.equal(nextSlot(queue, published, "2026-11-24T00:00:00Z"), slots[2]);
});

test("four live feed posts also block a manual post selection", () => {
  const history = ["23", "24", "25", "26"].map((day, index) => ({
    id: String(index), publishedAt: `2026-11-${day}T14:00:00Z`,
  }));
  const date = "2026-11-28T16:00:00Z";
  assert.match(publishingLimitReason(history, date), /Four/);
  assert.equal(selectDuePost([post("manual")], history, date, "manual"), null);
});

test("the publisher preserves day spacing and waits for the due time", () => {
  assert.equal(selectDuePost([post("later")], [], now), null);
  const history = [{ id: "another", publishedAt: "2026-11-23T10:00:00Z" }];
  assert.equal(selectDuePost([post("later")], history, "2026-11-23T15:00:00Z"), null);
});

test("old failed campaigns are retained without being retried by the new schedule", () => {
  const old = post("old-campaign", "2026-11-09T14:00:00Z");
  assert.equal(selectDuePost([old], [], now), null);
  assert.deepEqual(scheduleErrors(Array.from({ length: 8 }, (_, i) => post(`old-${i}`, old.publishAt))), []);
});

test("repeated approval of the same content is idempotent", () => {
  const queue = { posts: [] };
  const candidate = post("approved-reel");
  const scheduled = schedulePost(queue, candidate, [], now, "this is good to post");
  assert.equal(scheduled.approval.method, "chat");
  assert.equal(schedulePost(queue, candidate, [], now, "this is good to post"), scheduled);
  assert.equal(queue.posts.length, 1);
});

test("two educational slots leave the rest of the week for trends", () => {
  const queue = { posts: [post("education-one", slots[0]), post("education-two", slots[1])] };
  const scheduled = schedulePost(queue, post("education-three"), [], now, "this is good to post");
  assert.equal(scheduled.publishAt, "2026-11-30T14:00:00.000Z");
  const trend = schedulePost(queue, post("trend-one", slots[0], "trend"), [], now, "this is good to post");
  assert.equal(trend.publishAt, slots[2]);
});

test("approval records the revised content and prevents rescheduling a published ID", () => {
  const queue = { posts: [] };
  const candidate = post("revised");
  schedulePost(queue, candidate, [], now, "this is good to post");
  const updated = schedulePost(queue, { ...candidate, caption: "A revised caption approved by the user." }, [], now, "this is good to post");
  assert.match(updated.caption, /revised/);
  assert.equal(queue.posts.length, 1);
  assert.throws(() => schedulePost(queue, candidate, [{ id: "revised", publishedAt: slots[0] }], now, "approved"), /already published/);
});
