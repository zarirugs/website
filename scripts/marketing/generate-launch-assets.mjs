import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const outputDir = path.join(process.cwd(), "public", "marketing", "instagram");
const cards = [
  { file: "01-meet-zari.jpg", eyebrow: "INTRODUCING", lines: ["ZARI"], footer: "RUGS FOR TIMELESS HOMES", dark: true },
  { file: "02-from-bhadohi.jpg", eyebrow: "OUR BEGINNING", lines: ["From Bhadohi,", "for homes", "everywhere."], footer: "FOLLOW THE MAKING OF ZARI", dark: false },
  { file: "03-follow-the-making.jpg", eyebrow: "BEFORE THE FIRST COLLECTION", lines: ["Follow", "the making."], footer: "@ZARIRUGS", dark: true },
];

function profileSvg() {
  return `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1080" fill="#1d1d1b"/>
    <circle cx="540" cy="540" r="430" fill="none" stroke="#b89b5e" stroke-width="5"/>
    <text x="540" y="600" text-anchor="middle" fill="#f7f3eb" font-family="Georgia, serif" font-size="190" font-weight="400" letter-spacing="24">ZARI</text>
  </svg>`;
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function cardSvg(card) {
  const background = card.dark ? "#1d1d1b" : "#f1ede4";
  const foreground = card.dark ? "#f7f3eb" : "#1d1d1b";
  const accent = "#b89b5e";
  const lineHeight = card.lines.length === 1 ? 0 : 132;
  const fontSize = card.lines.length === 1 ? 178 : 110;
  const startY = card.lines.length === 1 ? 730 : 535;
  const text = card.lines.map((line, index) =>
    `<text x="96" y="${startY + index * lineHeight}" fill="${foreground}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="400">${escapeXml(line)}</text>`
  ).join("");

  return `<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1350" fill="${background}"/>
    <rect x="64" y="64" width="952" height="1222" fill="none" stroke="${accent}" stroke-width="2"/>
    <text x="96" y="150" fill="${accent}" font-family="Helvetica, Arial, sans-serif" font-size="21" letter-spacing="7">${escapeXml(card.eyebrow)}</text>
    ${text}
    <line x1="96" y1="1160" x2="984" y2="1160" stroke="${accent}" stroke-width="2"/>
    <text x="96" y="1225" fill="${foreground}" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="5">${escapeXml(card.footer)}</text>
  </svg>`;
}

await fs.mkdir(outputDir, { recursive: true });
await sharp(Buffer.from(profileSvg())).jpeg({ quality: 94, chromaSubsampling: "4:4:4" }).toFile(path.join(outputDir, "zari-profile.jpg"));
console.log("Generated zari-profile.jpg");
for (const card of cards) {
  await sharp(Buffer.from(cardSvg(card))).jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toFile(path.join(outputDir, card.file));
  console.log(`Generated ${card.file}`);
}
