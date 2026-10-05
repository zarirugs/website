#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) args.set(process.argv[index], process.argv[index + 1]);

const required = ["--carpet", "--touch", "--samples", "--green", "--fashion", "--loom", "--rug", "--studio"];
for (const key of required) {
  if (!args.get(key)) {
    console.error(`Missing ${key}`);
    process.exit(1);
  }
}

const outputDir = args.get("--output-dir") ?? "public/marketing/instagram/drafts";
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zari-weekly-reels-"));
const font = "/System/Library/Fonts/Supplemental/Didot.ttc";

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function writeScore(filePath, { duration, bpm, seed: initialSeed, mode }) {
  const sampleRate = 48_000;
  const channels = 2;
  const frames = Math.round(sampleRate * duration);
  const samples = new Int16Array(frames * channels);
  const beatLength = 60 / bpm;
  let seed = initialSeed;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  for (let frame = 0; frame < frames; frame += 1) {
    const t = frame / sampleRate;
    const beat = Math.floor(t / beatLength);
    const beatT = t - beat * beatLength;
    const root = mode === "tactile" ? [55, 65.41, 73.42, 65.41][Math.floor(beat / 4) % 4] : [43.65, 51.91, 58.27, 65.41][Math.floor(beat / 4) % 4];
    let value = Math.sin(2 * Math.PI * root * t) * Math.exp(-beatT * (mode === "tactile" ? 4.8 : 7.5)) * 0.22;

    if (beat % 4 === 0) {
      const phase = 2 * Math.PI * ((mode === "tactile" ? 64 : 82) * beatT - 31 * beatT * beatT);
      value += Math.sin(phase) * Math.exp(-beatT * 18) * (mode === "tactile" ? 0.31 : 0.48);
    }
    if (beatT < 0.03) value += (random() * 2 - 1) * Math.exp(-beatT * 105) * (mode === "tactile" ? 0.09 : 0.14);

    const halfBeat = (t + beatLength / 2) % beatLength;
    if (halfBeat < 0.02) {
      value += Math.sin(2 * Math.PI * (mode === "tactile" ? 980 : 1760) * halfBeat) * Math.exp(-halfBeat * 135) * 0.05;
    }

    if (mode === "tactile") {
      value += Math.sin(2 * Math.PI * 220 * t + Math.sin(2 * Math.PI * 0.2 * t)) * 0.018;
    } else {
      value += Math.sin(2 * Math.PI * 116.54 * t) * Math.sin(2 * Math.PI * 0.5 * t) * 0.025;
    }

    const master = Math.tanh(value * 1.7) * 0.76;
    samples[frame * 2] = Math.round(master * 32767);
    samples[frame * 2 + 1] = Math.round(master * 32767);
  }

  const dataBytes = samples.byteLength;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + dataBytes, 4); buffer.write("WAVE", 8);
  buffer.write("fmt ", 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22); buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28); buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(dataBytes, 40);
  Buffer.from(samples.buffer).copy(buffer, 44);
  fs.writeFileSync(filePath, buffer);
}

function derivatives(output, posterTime) {
  const poster = output.replace(/\.mp4$/i, "-poster.jpg");
  const preview = output.replace(/\.mp4$/i, "-preview.gif");
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(posterTime), "-i", output, "-frames:v", "1", "-update", "1", "-q:v", "2", poster]);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", output, "-vf", "fps=8,scale=270:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3", "-loop", "0", preview]);
}

fs.mkdirSync(outputDir, { recursive: true });

const tactileAudio = path.join(tempDir, "material-memory.wav");
writeScore(tactileAudio, { duration: 8.4, bpm: 100, seed: 0x54414354, mode: "tactile" });
const tactileOutput = path.join(outputDir, "reel-03-material-remembers.mp4");
const tactileGrade = "eq=contrast=1.06:brightness=-0.015:saturation=0.78:gamma=1.01,curves=all='0/0 0.18/0.15 0.75/0.79 1/1',fps=30,format=yuv420p";
const hCrop = (x) => `crop=1215:2160:${x}:0,scale=1080:1920:flags=lanczos,setsar=1`;
const tactileFilter = [
  `[0:v]trim=0:0.6,setpts=PTS-STARTPTS,${hCrop(1312)},${tactileGrade}[a0]`,
  `[1:v]trim=0.8:1.4,setpts=PTS-STARTPTS,${hCrop(1440)},${tactileGrade}[a1]`,
  `[2:v]trim=1.2:2.4,setpts=PTS-STARTPTS,${hCrop(900)},${tactileGrade}[a2]`,
  `[3:v]trim=2.4:3.6,setpts=PTS-STARTPTS,${hCrop(1340)},${tactileGrade}[a3]`,
  `[1:v]trim=3.2:4.4,setpts=PTS-STARTPTS,${hCrop(1220)},${tactileGrade}[a4]`,
  `[2:v]trim=5.4:6.6,setpts=PTS-STARTPTS,${hCrop(1540)},${tactileGrade}[a5]`,
  `[3:v]trim=9:11.4,setpts=PTS-STARTPTS,${hCrop(1050)},${tactileGrade}[a6]`,
  `[a0][a1][a2][a3][a4][a5][a6]concat=n=7:v=1:a=0,drawtext=fontfile='${font}':text='M A T E R I A L':fontcolor=white:fontsize=65:x=(w-text_w)/2:y=h*0.71:alpha='if(lt(t,7.25),0,if(lt(t,7.55),(t-7.25)/0.3,1))':enable='between(t,7.2,8.4)',drawtext=fontfile='${font}':text='REMEMBERS.':fontcolor=white@0.92:fontsize=31:x=(w-text_w)/2:y=h*0.77:alpha='if(lt(t,7.4),0,if(lt(t,7.7),(t-7.4)/0.3,1))':enable='between(t,7.2,8.4)'[video]`,
  `[4:a]atrim=0:8.4,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.08,afade=t=out:st=8.1:d=0.3,volume=0.98[audio]`,
].join(";");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", args.get("--carpet"), "-i", args.get("--touch"), "-i", args.get("--samples"), "-i", args.get("--green"), "-i", tactileAudio, "-filter_complex", tactileFilter, "-map", "[video]", "-map", "[audio]", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", "8.4", tactileOutput]);
derivatives(tactileOutput, 7.75);

const rhythmAudio = path.join(tempDir, "made-in-rhythm.wav");
writeScore(rhythmAudio, { duration: 7.5, bpm: 128, seed: 0x52485954, mode: "rhythm" });
const rhythmOutput = path.join(outputDir, "reel-04-made-in-rhythm.mp4");
const rhythmGrade = "eq=contrast=1.10:brightness=-0.03:saturation=0.88:gamma=0.98,curves=all='0/0 0.2/0.15 0.72/0.77 1/1',fps=30,format=yuv420p";
const vScale = "scale=1080:1920:flags=lanczos,setsar=1";
const rhythmFilter = [
  `[0:v]trim=0:0.46875,setpts=PTS-STARTPTS,${vScale},${rhythmGrade}[b0]`,
  `[1:v]trim=1:1.46875,setpts=PTS-STARTPTS,${vScale},${rhythmGrade}[b1]`,
  `[2:v]trim=0.8:1.7375,setpts=PTS-STARTPTS,${hCrop(1280)},${rhythmGrade}[b2]`,
  `[3:v]trim=1.5:2.4375,setpts=PTS-STARTPTS,${vScale},${rhythmGrade}[b3]`,
  `[0:v]trim=3:3.9375,setpts=PTS-STARTPTS,${vScale},${rhythmGrade}[b4]`,
  `[1:v]trim=5:5.9375,setpts=PTS-STARTPTS,${vScale},${rhythmGrade}[b5]`,
  `[2:v]trim=5.5:6.4375,setpts=PTS-STARTPTS,${hCrop(1450)},${rhythmGrade}[b6]`,
  `[3:v]trim=5:5.9375,setpts=PTS-STARTPTS,${vScale},${rhythmGrade}[b7]`,
  `[0:v]trim=7:7.9375,setpts=PTS-STARTPTS,${vScale},${rhythmGrade}[b8]`,
  `[b0][b1][b2][b3][b4][b5][b6][b7][b8]concat=n=9:v=1:a=0,drawtext=fontfile='${font}':text='Z A R I':fontcolor=white:fontsize=84:x=(w-text_w)/2:y=h*0.72:alpha='if(lt(t,6.7),0,if(lt(t,7.0),(t-6.7)/0.3,1))':enable='between(t,6.56,7.5)',drawtext=fontfile='${font}':text='MADE IN RHYTHM.':fontcolor=white@0.92:fontsize=31:x=(w-text_w)/2:y=h*0.79:alpha='if(lt(t,6.85),0,if(lt(t,7.15),(t-6.85)/0.3,1))':enable='between(t,6.56,7.5)'[video]`,
  `[4:a]atrim=0:7.5,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.06,afade=t=out:st=7.2:d=0.3,volume=0.98[audio]`,
].join(";");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", args.get("--fashion"), "-i", args.get("--loom"), "-i", args.get("--rug"), "-i", args.get("--studio"), "-i", rhythmAudio, "-filter_complex", rhythmFilter, "-map", "[video]", "-map", "[audio]", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", "7.5", rhythmOutput]);
derivatives(rhythmOutput, 7.1);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log(`Built ${tactileOutput}`);
console.log(`Built ${rhythmOutput}`);
