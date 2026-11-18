import { execFileSync } from "node:child_process";
import process from "node:process";
import { createHash } from "node:crypto";
import { readAndValidateQueue } from "./validate-queue.mjs";
import { policy, publicationHistory, selectDuePost, publishingLimitReason, weekBounds } from "./posting-schedule.mjs";

const apiVersion = process.env.INSTAGRAM_GRAPH_VERSION || "v26.0";
const apiBase = `https://graph.instagram.com/${apiVersion}`;
const manualPostId = process.env.POST_ID?.trim();
const dryRun = process.env.DRY_RUN === "1";
const connectionOnly = ["1", "true"].includes(process.env.CONNECTION_ONLY?.toLowerCase());

function tagFor(post) {
  return `instagram-post/${post.id}`;
}

function selectPost(posts) {
  return selectDuePost(posts, publicationHistory(), new Date().toISOString(), manualPostId);
}

async function graphRead(pathname, fields, accessToken, after) {
  const url = new URL(`${apiBase}/${pathname}`);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "100");
  if (after) url.searchParams.set("after", after);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error?.message || "Instagram read failed.");
  return result;
}

async function recentFeedHistory(accountId, accessToken) {
  const now = new Date().toISOString();
  const { start } = weekBounds(now);
  const history = [];
  let after;
  do {
    const result = await graphRead(`${accountId}/media`, "id,timestamp,media_product_type", accessToken, after);
    if (!Array.isArray(result.data)) throw new Error("Instagram did not return a readable feed history.");
    for (const item of result.data) {
      if (!Number.isFinite(Date.parse(item.timestamp))) throw new Error("Instagram returned a post without a valid timestamp.");
      if (item.media_product_type !== "STORY") history.push({ id: item.id, publishedAt: item.timestamp });
    }
    if (history.filter((item) => Date.parse(item.publishedAt) >= start).length >= policy.weeklyLimit) break;
    if (!result.paging?.next) break;
    // Instagram's user media edge returns the newest media first.
    if (result.data.length && result.data.every((item) => Date.parse(item.timestamp) < start)) break;
    const cursor = result.paging?.cursors?.after;
    if (!cursor || cursor === after) throw new Error("Could not finish checking Instagram's feed history.");
    after = cursor;
  } while (after);
  return history;
}

async function verifyMedia(post) {
  const response = await fetch(post.mediaUrl);
  if (!response.ok) throw new Error(`Public media is unavailable (${response.status}): ${post.mediaUrl}`);
  const expected = post.mediaType === "REELS" ? "video/" : "image/";
  if (!response.headers.get("content-type")?.startsWith(expected)) {
    throw new Error("The public media URL returned an unexpected content type.");
  }
  const media = Buffer.from(await response.arrayBuffer());
  if (post.mediaSha256 && createHash("sha256").update(media).digest("hex") !== post.mediaSha256) {
    throw new Error("The public media differs from the approved file. Wait for the approved deployment.");
  }
}

function savedContainer(post) {
  const output = execFileSync("git", [
    "for-each-ref", "--sort=-taggerdate", "--format=%(contents:subject)",
    `refs/tags/instagram-container/${post.id}/`,
  ], { encoding: "utf8" }).trim();
  return output ? JSON.parse(output.split("\n")[0]) : null;
}

function recordTag(tag, message) {
  execFileSync("git", ["config", "user.name", "github-actions[bot]"]);
  execFileSync("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
  execFileSync("git", ["tag", "-a", tag, "-m", message]);
  execFileSync("git", ["push", "origin", tag], { stdio: "inherit" });
}

function saveContainer(post, container) {
  const receipt = {
    id: container.id, mediaUrl: post.mediaUrl, caption: post.caption,
    mediaSha256: post.mediaSha256 ?? null,
  };
  recordTag(`instagram-container/${post.id}/${container.id}`, JSON.stringify(receipt));
}

async function graphRequest(pathname, body) {
  const response = await fetch(`${apiBase}/${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(`Instagram API error (${response.status}): ${result.error?.message || JSON.stringify(result)}`);
  }
  return result;
}

async function verifyConnection(accountId, accessToken) {
  const url = new URL(`${apiBase}/me`);
  url.searchParams.set("fields", "id,username,account_type");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(`Instagram connection check failed (${response.status}): ${result.error?.message || JSON.stringify(result)}`);
  }
  if (String(result.id) !== String(accountId)) {
    throw new Error(`Instagram account mismatch: token belongs to ${result.id}, expected ${accountId}`);
  }

  console.log(`Authenticated Instagram account @${result.username} (${result.account_type}).`);
}

async function containerStatus(containerId, accessToken) {
  const url = new URL(`${apiBase}/${containerId}`);
  url.searchParams.set("fields", "status_code,status");
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error?.message || "Could not read media status");
  return result;
}

async function waitForContainer(containerId, accessToken) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await containerStatus(containerId, accessToken);
    if (["FINISHED", "PUBLISHED"].includes(result.status_code)) return result.status_code;
    if (["ERROR", "EXPIRED"].includes(result.status_code)) {
      throw new Error(`Instagram media container ${result.status_code}: ${result.status || "unknown error"}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
  throw new Error("Instagram media container did not finish within five minutes");
}

function markPublished(post, mediaId, containerId) {
  recordTag(tagFor(post), JSON.stringify({
    postId: post.id, mediaId: mediaId ?? null, containerId,
    publishedAt: new Date().toISOString(),
  }));
}

const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

if (connectionOnly) {
  if (!accountId || !accessToken) {
    throw new Error("INSTAGRAM_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN are required");
  }
  await verifyConnection(accountId, accessToken);
  const history = await recentFeedHistory(accountId, accessToken);
  console.log(`Live feed posts this India week: ${history.filter((item) => Date.parse(item.publishedAt) >= weekBounds(new Date().toISOString()).start).length}/${policy.weeklyLimit}.`);
  console.log("Instagram connection check completed without publishing content.");
  process.exit(0);
}

const posts = readAndValidateQueue();
const post = selectPost(posts);

if (!post) {
  console.log("No approved Instagram post is due within the current scheduling policy.");
  console.log(`Older unpublished entries before ${policy.effectiveFrom} require rescheduling.`);
  process.exit(0);
}

if (dryRun) {
  console.log(`Next publishable post: ${post.id} (${post.publishAt})`);
  process.exit(0);
}

if (!accountId || !accessToken) {
  throw new Error("INSTAGRAM_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN are required");
}

await verifyConnection(accountId, accessToken);
const liveHistory = await recentFeedHistory(accountId, accessToken);
const limitReason = publishingLimitReason(liveHistory, new Date().toISOString());
if (limitReason) {
  console.log(limitReason);
  process.exit(0);
}
await verifyMedia(post);

const createBody = {
  access_token: accessToken,
  caption: post.caption,
};

if (post.mediaType === "REELS") {
  createBody.media_type = "REELS";
  createBody.video_url = post.mediaUrl;
  createBody.share_to_feed = "true";
} else {
  createBody.image_url = post.mediaUrl;
}

let container = savedContainer(post);
if (container && (container.mediaUrl !== post.mediaUrl || container.caption !== post.caption ||
    container.mediaSha256 !== (post.mediaSha256 ?? null))) {
  throw new Error("A publication attempt already exists for different content under this ID.");
}
if (!container) {
  container = await graphRequest(`${accountId}/media`, createBody);
  saveContainer(post, container);
}
const state = await waitForContainer(container.id, accessToken);
if (state === "PUBLISHED") {
  markPublished(post, null, container.id);
  console.log(`Recovered the completed publication of ${post.id}.`);
} else {
  const finalLimit = publishingLimitReason(await recentFeedHistory(accountId, accessToken), new Date().toISOString());
  if (finalLimit) {
    console.log(finalLimit);
    process.exit(0);
  }
  const published = await graphRequest(`${accountId}/media_publish`, {
    access_token: accessToken,
    creation_id: container.id,
  });
  markPublished(post, published.id, container.id);
  console.log(`Published ${post.id} successfully as Instagram media ${published.id}.`);
}
