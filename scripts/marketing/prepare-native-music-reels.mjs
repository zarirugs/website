#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const reels = [
  {
    file: "public/marketing/instagram/drafts/reel-02-room-begins-underfoot.mp4",
    factor: 1,
    bpm: 120,
    beats: 16,
    track: "Timeless (Instrumental) — The Weeknd feat. Playboi Carti",
  },
  {
    file: "public/marketing/instagram/drafts/reel-03-material-remembers.mp4",
    factor: 100 / 94,
    bpm: 94,
    beats: 14,
    track: "Apocalypse — Cigarettes After Sex",
  },
  {
    file: "public/marketing/instagram/drafts/reel-04-made-in-rhythm.mp4",
    factor: 128 / 105,
    bpm: 105,
    beats: 16,
    track: "Aarzu — Noor, Khan, Madhurxo",
  },
];

for (const reel of reels) {
  const temporary = reel.file.replace(/\.mp4$/i, ".native.tmp.mp4");
  const result = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y", "-i", reel.file,
    "-filter:v", `setpts=${reel.factor}*PTS,fps=30`,
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "17",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", temporary,
  ], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
  fs.renameSync(temporary, reel.file);
  console.log(`${path.basename(reel.file)}: ${reel.beats} beats at ${reel.bpm} BPM for ${reel.track}`);
}
