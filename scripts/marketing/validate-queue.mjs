import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const queuePath = path.join(root, "marketing", "queue.json");
const allowedStatuses = new Set(["draft", "approved"]);
const allowedMediaTypes = new Set(["IMAGE", "REELS"]);

export function readAndValidateQueue() {
  const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
  const errors = [];
  const ids = new Set();

  if (!Array.isArray(queue.posts)) {
    throw new Error("marketing/queue.json must contain a posts array");
  }

  for (const [index, post] of queue.posts.entries()) {
    const label = post.id || `post at index ${index}`;

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.id ?? "")) {
      errors.push(`${label}: id must contain lowercase letters, numbers and hyphens only`);
    }
    if (ids.has(post.id)) errors.push(`${label}: duplicate id`);
    ids.add(post.id);

    if (!allowedStatuses.has(post.status)) errors.push(`${label}: invalid status`);
    if (!allowedMediaTypes.has(post.mediaType)) errors.push(`${label}: invalid mediaType`);
    if (Number.isNaN(Date.parse(post.publishAt))) errors.push(`${label}: invalid publishAt`);
    if (typeof post.caption !== "string" || post.caption.length < 20 || post.caption.length > 2200) {
      errors.push(`${label}: caption must be between 20 and 2,200 characters`);
    }

    let url;
    try {
      url = new URL(post.mediaUrl);
    } catch {
      errors.push(`${label}: mediaUrl must be a valid URL`);
      continue;
    }

    if (url.protocol !== "https:" || url.hostname !== "zarirugs.com") {
      errors.push(`${label}: mediaUrl must use https://zarirugs.com`);
    }

    const publicPath = path.join(root, "public", decodeURIComponent(url.pathname));
    if (!fs.existsSync(publicPath)) errors.push(`${label}: local media file is missing at public${url.pathname}`);

    const expectedExtension = post.mediaType === "IMAGE" ? ".jpg" : ".mp4";
    if (path.extname(url.pathname).toLowerCase() !== expectedExtension) {
      errors.push(`${label}: ${post.mediaType} media must use ${expectedExtension}`);
    }
  }

  if (errors.length) throw new Error(errors.map((error) => `- ${error}`).join("\n"));
  return queue.posts;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const posts = readAndValidateQueue();
  const approved = posts.filter((post) => post.status === "approved").length;
  console.log(`Validated ${posts.length} Instagram posts (${approved} approved).`);
}
