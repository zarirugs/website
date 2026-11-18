import fs from "node:fs";
import { execFileSync } from "node:child_process";

export const policy = JSON.parse(
  fs.readFileSync(new URL("../../marketing/posting-policy.json", import.meta.url), "utf8"),
);
const dayMs = 86_400_000;
const offsetMs = 330 * 60_000;

export function localDay(value) {
  return new Date(Date.parse(value) + offsetMs).toISOString().slice(0, 10);
}

export function weekBounds(value) {
  const local = new Date(Date.parse(value) + offsetMs);
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - (local.getUTCDay() + 6) % 7);
  const start = local.getTime() - offsetMs;
  return { start, end: start + 7 * dayMs };
}

export function inWeek(value, now) {
  const { start, end } = weekBounds(now);
  const time = Date.parse(value);
  return time >= start && time < end;
}

export function publishingLimitReason(history, now) {
  if (history.filter((entry) => inWeek(entry.publishedAt, now)).length >= policy.weeklyLimit) {
    return "Four Instagram feed posts have already been published this India calendar week.";
  }
  if (history.some((entry) => localDay(entry.publishedAt) === localDay(now))) {
    return "An Instagram feed post has already been published today.";
  }
  return null;
}

export function scheduleErrors(posts) {
  const errors = [];
  const weeks = new Map();
  for (const post of posts) {
    if (post.status !== "approved" || !Number.isFinite(Date.parse(post.publishAt)) ||
        Date.parse(post.publishAt) < Date.parse(policy.effectiveFrom)) continue;
    const key = weekBounds(post.publishAt).start;
    const group = weeks.get(key) ?? [];
    group.push(post);
    weeks.set(key, group);
  }
  for (const group of weeks.values()) {
    if (group.length > policy.weeklyLimit) errors.push("An active Instagram week has more than four approved posts.");
    const days = group.map((post) => localDay(post.publishAt));
    if (new Set(days).size !== days.length) errors.push("An active Instagram date has multiple approved posts.");
    for (const [category, limit] of Object.entries(policy.categoryLimits)) {
      if (group.filter((post) => post.contentCategory === category).length > limit) {
        errors.push(`An active Instagram week has more than ${limit} ${category} posts.`);
      }
    }
  }
  return errors;
}

export function publicationHistory() {
  const output = execFileSync("git", [
    "for-each-ref", "--format=%(refname:strip=2)%09%(taggerdate:iso-strict)",
    "refs/tags/instagram-post/",
  ], { encoding: "utf8" }).trim();
  if (!output) return [];
  return output.split("\n").map((line) => {
    const [tag, publishedAt] = line.split("\t");
    return { id: tag.slice("instagram-post/".length), publishedAt };
  });
}

export function nextSlot(posts, history = [], now = new Date().toISOString()) {
  const publishedIds = new Set(history.map((entry) => entry.id));
  const reservations = posts.filter((post) => post.status === "approved" && !publishedIds.has(post.id));
  const [hour, minute] = policy.publishTime.split(":").map(Number);
  const local = new Date(Date.parse(now) + offsetMs);
  local.setUTCHours(hour, minute, 0, 0);

  for (let day = 0; day < 370; day += 1) {
    const candidate = new Date(local.getTime() + day * dayMs);
    const value = new Date(candidate.getTime() - offsetMs).toISOString();
    if (Date.parse(value) <= Date.parse(now) || !policy.weekdays.includes(candidate.getUTCDay())) continue;
    const booked = reservations.filter((post) => inWeek(post.publishAt, value));
    const published = history.filter((entry) => inWeek(entry.publishedAt, value));
    if (booked.length + published.length >= policy.weeklyLimit) continue;
    const occupied = [...booked.map((post) => post.publishAt), ...published.map((entry) => entry.publishedAt)];
    if (!occupied.some((date) => localDay(date) === localDay(value))) return value;
  }
  throw new Error("No free Instagram slot found in the next year.");
}

export function selectDuePost(posts, history, now, manualPostId) {
  const publishedIds = new Set(history.map((entry) => entry.id));
  const approved = posts.filter((post) => post.status === "approved");
  if (manualPostId && !approved.some((post) => post.id === manualPostId)) {
    throw new Error(`Approved post not found: ${manualPostId}`);
  }
  const candidates = approved.filter((post) => !manualPostId || post.id === manualPostId)
    .filter((post) => !publishedIds.has(post.id))
    .filter((post) => Date.parse(post.publishAt) >= Date.parse(policy.effectiveFrom))
    .filter((post) => Date.parse(post.publishAt) <= Date.parse(now))
    .sort((a, b) => Date.parse(a.publishAt) - Date.parse(b.publishAt));
  if (manualPostId && candidates.some((post) => post.publishingMode === "instagram-native-music")) {
    throw new Error("This Reel requires Instagram's native music scheduling.");
  }
  if (publishingLimitReason(history, now)) return null;
  return candidates.find((post) => post.publishingMode !== "instagram-native-music") ?? null;
}
