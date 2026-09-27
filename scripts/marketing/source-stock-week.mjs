import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = process.cwd();
const configPath = path.join(root, "marketing", "stock-sourcing.json");
const usagePath = path.join(root, "marketing", "stock-usage.json");
const queuePath = path.join(root, "marketing", "queue.json");
const outputDirectory = path.join(root, "public", "marketing", "instagram");
const reviewDirectory = path.join(root, "marketing", "reviews");
const args = process.argv.slice(2);

function argument(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function mondayFrom(value) {
  const date = value ? new Date(`${value}T00:00:00.000Z`) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error("--week must use YYYY-MM-DD");
  const day = date.getUTCDay();
  if (value && day !== 1) throw new Error("--week must be a Monday");
  const daysUntilMonday = value ? -((day + 6) % 7) : ((8 - day) % 7 || 7);
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function weekNumber(date) {
  const target = new Date(date);
  target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target - yearStart) / 86_400_000) + 1) / 7);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pexelsImageUrl(photo) {
  const url = new URL(photo.src.original);
  url.searchParams.set("auto", "compress");
  url.searchParams.set("cs", "tinysrgb");
  url.searchParams.set("fit", "crop");
  url.searchParams.set("w", "2160");
  url.searchParams.set("h", "2700");
  return url;
}

async function searchPexels(query, page, apiKey) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("size", "large");
  url.searchParams.set("per_page", "40");
  url.searchParams.set("page", String(page));
  const response = await fetch(url, { headers: { Authorization: apiKey } });
  if (!response.ok) throw new Error(`Pexels search failed (${response.status}): ${await response.text()}`);
  return (await response.json()).photos ?? [];
}

function choosePhoto(photos, usedIds, seed) {
  const candidates = photos
    .filter((photo) => photo.width >= 1080 && photo.height >= 1350 && photo.height > photo.width)
    .filter((photo) => !usedIds.has(`pexels:${photo.id}`))
    .map((photo) => ({
      photo,
      score: Math.log(photo.width * photo.height) - Math.abs((photo.width / photo.height) - 0.8) * 8,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
  if (!candidates.length) throw new Error("No unused portrait photo met the 1080 × 1350 requirement");
  return candidates[seed % candidates.length].photo;
}

async function downloadAndPrepare(photo, destination) {
  const response = await fetch(pexelsImageUrl(photo));
  if (!response.ok) throw new Error(`Could not download Pexels photo ${photo.id} (${response.status})`);
  const input = Buffer.from(await response.arrayBuffer());
  await sharp(input)
    .rotate()
    .resize(1080, 1350, { fit: "cover", position: "attention" })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", progressive: true })
    .toFile(destination);
}

const apiKey = process.env.PEXELS_API_KEY?.trim();
if (!apiKey) throw new Error("PEXELS_API_KEY is required");

const config = readJson(configPath);
if (config.provider !== "pexels") throw new Error(`Unsupported stock provider: ${config.provider}`);
const usage = readJson(usagePath);
const usedIds = new Set(usage.assets.map((asset) => `${asset.provider}:${asset.id}`));
const monday = mondayFrom(argument("--week"));
const week = dateOnly(monday);
const rotation = weekNumber(monday);
const posts = [];
const reviewSections = [];

fs.mkdirSync(outputDirectory, { recursive: true });
fs.mkdirSync(reviewDirectory, { recursive: true });

for (const [index, slot] of config.posts.entries()) {
  const query = slot.queries[(rotation + index) % slot.queries.length];
  const page = ((rotation + index) % 3) + 1;
  const photos = await searchPexels(query, page, apiKey);
  const photo = choosePhoto(photos, usedIds, rotation + index * 7);
  const id = `${week}-${slot.slug}`;
  const filename = `${id}.jpg`;
  const destination = path.join(outputDirectory, filename);
  await downloadAndPrepare(photo, destination);
  usedIds.add(`pexels:${photo.id}`);

  const publishAt = new Date(monday);
  publishAt.setUTCDate(publishAt.getUTCDate() + slot.dayOffset);
  publishAt.setUTCHours(14, 0, 0, 0);
  const caption = slot.captions[rotation % slot.captions.length];
  const mediaUrl = `https://zarirugs.com/marketing/instagram/${filename}`;
  posts.push({ id, status: "approved", publishAt: publishAt.toISOString(), mediaType: "IMAGE", mediaUrl, caption });

  const branchPreview = `https://raw.githubusercontent.com/zarirugs/website/codex/instagram-week-${week}/public/marketing/instagram/${filename}`;
  reviewSections.push(`## ${publishAt.toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" })} — 19:30 IST\n\n![${slot.title}](${branchPreview})\n\n**Image score:** pending Codex visual review\n\n**Caption**\n\n${caption.split("\n").map((line) => `> ${line}`).join("\n")}`);
  usage.assets.push({ provider: "pexels", id: String(photo.id), photographer: photo.photographer, sourceUrl: photo.url, query, week, filename });
}

fs.writeFileSync(queuePath, `${JSON.stringify({ posts }, null, 2)}\n`);
fs.writeFileSync(usagePath, `${JSON.stringify(usage, null, 2)}\n`);
const review = `# Instagram week of ${week}\n\nMerge this pull request after all three images are accepted. Reject one image by commenting \`REJECT 1 — reason\`, \`REJECT 2 — reason\`, or \`REJECT 3 — reason\`; only that image will be replaced. The photographs were sourced through the Pexels API, resized to 1080 × 1350, and checked against the private usage ledger.\n\n${reviewSections.join("\n\n")}\n\n## Approval checklist\n\n- [ ] Every image scored at least 21/25.\n- [ ] Aesthetic strength and authenticity are at least 4/5 for every image.\n- [ ] The complete sequence scored at least 4/5.\n- [ ] The people, setting and craft are represented appropriately.\n- [ ] Captions sound like ZARI.\n- [ ] Dates and times are correct.\n\n**Merge = approve the complete weekly pack.**\n`;
fs.writeFileSync(path.join(reviewDirectory, `${week}.md`), review);
console.log(`Prepared ${posts.length} Pexels-backed posts for the week of ${week}.`);
