import { execFileSync } from "node:child_process";
import process from "node:process";
import { readAndValidateQueue } from "./validate-queue.mjs";

const apiVersion = process.env.INSTAGRAM_GRAPH_VERSION || "v26.0";
const apiBase = `https://graph.instagram.com/${apiVersion}`;
const manualPostId = process.env.POST_ID?.trim();
const dryRun = process.env.DRY_RUN === "1";

function tagFor(post) {
  return `instagram-post/${post.id}`;
}

function isPublished(post) {
  try {
    execFileSync("git", ["ls-remote", "--exit-code", "--tags", "origin", `refs/tags/${tagFor(post)}`], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function selectPost(posts) {
  const approved = posts.filter((post) => post.status === "approved");

  if (manualPostId) {
    const selected = approved.find((post) => post.id === manualPostId);
    if (!selected) throw new Error(`Approved post not found: ${manualPostId}`);
    return isPublished(selected) ? null : selected;
  }

  const now = Date.now();
  return approved
    .filter((post) => Date.parse(post.publishAt) <= now)
    .sort((a, b) => Date.parse(a.publishAt) - Date.parse(b.publishAt))
    .find((post) => !isPublished(post));
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
    if (result.status_code === "FINISHED") return;
    if (["ERROR", "EXPIRED"].includes(result.status_code)) {
      throw new Error(`Instagram media container ${result.status_code}: ${result.status || "unknown error"}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
  throw new Error("Instagram media container did not finish within five minutes");
}

function markPublished(post, mediaId) {
  const tag = tagFor(post);
  execFileSync("git", ["config", "user.name", "github-actions[bot]"]);
  execFileSync("git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
  execFileSync("git", ["tag", "-a", tag, "-m", `Published ${post.id} to Instagram as ${mediaId}`]);
  execFileSync("git", ["push", "origin", tag], { stdio: "inherit" });
}

const posts = readAndValidateQueue();
const post = selectPost(posts);

if (!post) {
  console.log("No unpublished approved Instagram post is due.");
  process.exit(0);
}

if (dryRun) {
  console.log(`Next publishable post: ${post.id} (${post.publishAt})`);
  process.exit(0);
}

const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
if (!accountId || !accessToken) {
  throw new Error("INSTAGRAM_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN are required");
}

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

const container = await graphRequest(`${accountId}/media`, createBody);
await waitForContainer(container.id, accessToken);
const published = await graphRequest(`${accountId}/media_publish`, {
  access_token: accessToken,
  creation_id: container.id,
});
markPublished(post, published.id);
console.log(`Published ${post.id} successfully as Instagram media ${published.id}.`);
