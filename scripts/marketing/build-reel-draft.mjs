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
if (values.audio && !fs.existsSync(values.audio)) throw new Error(`Audio does not exist: ${values.audio}`);
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
const audioVolume = Number(values["audio-volume"] ?? "0.22");
if (!Number.isFinite(audioVolume) || audioVolume < 0 || audioVolume > 1) {
  throw new Error("--audio-volume must be between 0 and 1");
}

const motion = values.motion ?? "smooth-push";
if (!["still", "smooth-push"].includes(motion)) {
  throw new Error("--motion must be still or smooth-push");
}

const titleAlpha = "if(lt(t,0.65),0,if(lt(t,1.05),(t-0.65)/0.4,if(lt(t,2.75),1,if(lt(t,3.15),(3.15-t)/0.4,0))))";
const subtitleAlpha = "if(lt(t,3.15),0,if(lt(t,3.55),(t-3.15)/0.4,if(lt(t,5.7),1,if(lt(t,6.1),(6.1-t)/0.4,0))))";
const brandAlpha = "if(lt(t,6.1),0,if(lt(t,6.5),(t-6.1)/0.4,1))";

const motionFilter = motion === "smooth-push"
  ? [
      "scale=2880:3840:force_original_aspect_ratio=increase",
      "crop=2880:3840",
      "zoompan=z='1+0.07*(0.5-0.5*cos(PI*on/239))':x='iw/2-iw/(2*zoom)':y='(ih-ih/zoom)*0.82':d=240:s=2160x3840:fps=30",
      "scale=1080:1920:flags=lanczos",
    ]
  : [
      "scale=1080:1920:force_original_aspect_ratio=increase",
      `crop=1080:1920:x='(iw-ow)/2':y='max(0,min(ih-oh,ih*${focal}-oh/2))'`,
      "fps=30",
    ];

const filter = [
  `[0:v]${motionFilter.join(",")}`,
  "eq=brightness=-0.055:saturation=0.92",
  "drawbox=x=0:y=0:w=iw:h=ih:color=black@0.16:t=fill",
  `drawtext=fontfile='${displayFont}':text='${drawText(values.title)}':fontcolor=white:fontsize=70:x=(w-text_w)/2:y=260:alpha='${titleAlpha}'`,
  `drawtext=fontfile='${bodyFont}':text='${drawText(values.subtitle)}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=1510:alpha='${subtitleAlpha}'`,
  `drawtext=fontfile='${displayFont}':text='Z A R I':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=1550:alpha='${brandAlpha}'`,
  "fade=t=in:st=0:d=0.45",
  "fade=t=out:st=7.45:d=0.55",
  "scale=in_range=full:out_range=tv",
  "format=yuv420p",
  "setparams=range=limited[v]",
].join(",");

const filterComplex = `${filter};[1:a]atrim=duration=8,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.2,afade=t=out:st=7.5:d=0.5,volume=${audioVolume}[a]`;
const audioInput = values.audio
  ? ["-stream_loop", "-1", "-i", values.audio]
  : ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"];

execFileSync("ffmpeg", [
  "-y", "-hide_banner", "-loglevel", "error",
  "-loop", "1", "-i", values.input,
  ...audioInput,
  "-filter_complex", filterComplex,
  "-map", "[v]", "-map", "[a]", "-t", "8", "-r", "30",
  "-c:v", "libx264", "-profile:v", "high", "-level", "4.1", "-preset", "slow", "-crf", "18",
  "-movflags", "+faststart", "-color_range", "tv", "-c:a", "aac", "-b:a", "128k", "-shortest", values.output,
], { stdio: "inherit" });

console.log(`Built Reel draft: ${values.output}`);
