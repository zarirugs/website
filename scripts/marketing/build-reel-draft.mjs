import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const values = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...rest] = argument.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  }),
);

const required = ["input", "output", "title", "subtitle"];
for (const key of required) {
  if (!values[key]) throw new Error(`Missing --${key}=...`);
}
if (!fs.existsSync(values.input)) throw new Error(`Input does not exist: ${values.input}`);
if (path.extname(values.output).toLowerCase() !== ".mp4") throw new Error("Output must be an .mp4 file");
fs.mkdirSync(path.dirname(values.output), { recursive: true });

const displayCandidates = [
  "/System/Library/Fonts/Supplemental/Bodoni 72 Smallcaps Book.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
];
const bodyCandidates = [
  "/System/Library/Fonts/Helvetica.ttc",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
];
const displayFont = displayCandidates.find(fs.existsSync);
const bodyFont = bodyCandidates.find(fs.existsSync);
if (!displayFont || !bodyFont) throw new Error("Compatible display and body fonts were not found");

function drawText(value) {
  return value.replaceAll("\\", "\\\\").replaceAll(":", "\\:").replaceAll("'", "\\'");
}

const focal = Number(values.focal ?? "0.5");
if (!Number.isFinite(focal) || focal < 0.35 || focal > 0.65) {
  throw new Error("--focal must be between 0.35 and 0.65");
}

const filter = [
  "[0:v]scale=1280:2276:force_original_aspect_ratio=increase",
  "crop=1280:2276",
  `zoompan=z='min(zoom+0.00022,1.065)':x='iw/2-(iw/zoom/2)':y='ih*${focal}-(ih/zoom/2)':d=240:s=1080x1920:fps=30`,
  "eq=brightness=-0.055:saturation=0.92",
  "drawbox=x=0:y=0:w=iw:h=ih:color=black@0.16:t=fill",
  `drawtext=fontfile='${displayFont}':text='${drawText(values.title)}':fontcolor=white:fontsize=70:x=(w-text_w)/2:y=260:enable='between(t,0.65,3.15)'`,
  `drawtext=fontfile='${bodyFont}':text='${drawText(values.subtitle)}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=1510:enable='between(t,3.15,6.1)'`,
  `drawtext=fontfile='${displayFont}':text='Z A R I':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=1550:enable='between(t,6.1,8)'`,
  "fade=t=in:st=0:d=0.45",
  "fade=t=out:st=7.45:d=0.55",
  "scale=in_range=full:out_range=tv",
  "format=yuv420p",
  "setparams=range=limited[v]",
].join(",");

execFileSync("ffmpeg", [
  "-y", "-hide_banner", "-loglevel", "error",
  "-loop", "1", "-i", values.input,
  "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
  "-filter_complex", filter,
  "-map", "[v]", "-map", "1:a", "-t", "8", "-r", "30",
  "-c:v", "libx264", "-profile:v", "high", "-level", "4.1", "-preset", "slow", "-crf", "18",
  "-movflags", "+faststart", "-color_range", "tv", "-c:a", "aac", "-b:a", "128k", "-shortest", values.output,
], { stdio: "inherit" });

console.log(`Built Reel draft: ${values.output}`);
