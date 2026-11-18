import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { nextSlot, policy, publicationHistory, inWeek } from "./posting-schedule.mjs";
import { readAndValidateQueue } from "./validate-queue.mjs";

export function schedulePost(queue, candidate, history, now, approvalText) {
  if (!approvalText?.trim()) throw new Error("Record the user's posting approval.");
  if (!policy.categoryLimits[candidate.contentCategory]) {
    throw new Error("Set contentCategory to education or trend.");
  }
  const existing = queue.posts.find((post) => post.id === candidate.id);
  if (history.some((entry) => entry.id === candidate.id)) throw new Error("This post is already published.");
  const unchanged = existing?.approval && existing.status === "approved" &&
    ["mediaUrl", "caption", "mediaType", "contentCategory", "mediaSha256"]
      .every((field) => existing[field] === candidate[field]);
  if (unchanged && Date.parse(existing.publishAt) > Date.parse(now)) return existing;
  const pending = queue.posts.filter((post) => post.id !== candidate.id);
  const publishedIds = new Set(history.map((entry) => entry.id));
  let cursor = now;
  let publishAt;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    publishAt = nextSlot(pending, history, cursor);
    const sameCategory = queue.posts.filter((post) =>
      post.status === "approved" && post.id !== candidate.id &&
      post.contentCategory === candidate.contentCategory &&
      inWeek(publishedIds.has(post.id)
        ? history.find((entry) => entry.id === post.id).publishedAt : post.publishAt, publishAt));
    if (sameCategory.length < policy.categoryLimits[candidate.contentCategory]) break;
    cursor = publishAt;
    publishAt = null;
  }
  if (!publishAt) throw new Error("No free slot for this content category.");
  const post = {
    ...candidate,
    status: "approved",
    publishAt,
    approval: { method: "chat", text: approvalText.trim(), recordedAt: now },
  };
  queue.posts = [...pending, post];
  return post;
}

function main() {
  const args = process.argv.slice(2);
  const argument = (name) => args[args.indexOf(name) + 1];
  if (!args.includes("--post") || !args.includes("--approval")) {
    throw new Error('Use --post candidate.json --approval "this is good to post" [--dry-run].');
  }
  const queuePath = path.resolve("marketing/queue.json");
  const original = fs.readFileSync(queuePath, "utf8");
  readAndValidateQueue();
  const queue = JSON.parse(original);
  const candidate = JSON.parse(fs.readFileSync(argument("--post"), "utf8"));
  const publicPath = path.join(process.cwd(), "public", new URL(candidate.mediaUrl).pathname);
  const media = fs.readFileSync(publicPath);
  candidate.mediaSha256 = createHash("sha256").update(media).digest("hex");
  const post = schedulePost(queue, candidate, publicationHistory(), new Date().toISOString(), argument("--approval"));
  const temporary = `${queuePath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(queue, null, 2)}\n`, { flag: "wx" });
    readAndValidateQueue(temporary);
    if (!args.includes("--dry-run")) {
      if (fs.readFileSync(queuePath, "utf8") !== original) {
        throw new Error("The queue changed during scheduling. Read it again and retry.");
      }
      fs.renameSync(temporary, queuePath);
    }
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  console.log(JSON.stringify({ dryRun: args.includes("--dry-run"), post }, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
