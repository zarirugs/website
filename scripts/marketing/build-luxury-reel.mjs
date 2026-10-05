#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const heels = args.get("--heels");
const walk = args.get("--walk");
const room = args.get("--room");
const output = args.get("--output") ?? "public/marketing/instagram/drafts/reel-02-room-begins-underfoot.mp4";

if (!heels || !walk || !room) {
  console.error("Usage: node scripts/marketing/build-luxury-reel.mjs --heels <video> --walk <video> --room <video> [--output <mp4>]");
  process.exit(1);
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "zari-luxury-reel-"));
const audioPath = path.join(tempDir, "zari-luxury-pulse.wav");
const posterPath = output.replace(/\.mp4$/i, "-poster.jpg");
const previewPath = output.replace(/\.mp4$/i, "-preview.gif");

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function writeWav(filePath) {
  const sampleRate = 48_000;
  const seconds = 8;
  const channels = 2;
  const frameCount = sampleRate * seconds;
  const samples = new Int16Array(frameCount * channels);
  const notes = [43.65, 51.91, 65.41, 51.91];

  let seed = 0x5a415249;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  for (let frame = 0; frame < frameCount; frame += 1) {
    const t = frame / sampleRate;
    const beat = Math.floor(t / 0.5);
    const beatT = t - beat * 0.5;
    const barT = t % 2;

    const subEnvelope = Math.exp(-beatT * 6.8);
    const subFrequency = notes[Math.floor(beat / 4) % notes.length];
    let value = Math.sin(2 * Math.PI * subFrequency * t) * subEnvelope * 0.26;

    if (beat % 4 === 0) {
      const kickPhase = 2 * Math.PI * (76 * beatT - 36 * beatT * beatT);
      value += Math.sin(kickPhase) * Math.exp(-beatT * 18) * 0.48;
    }

    if (beatT < 0.035) {
      const tick = (random() * 2 - 1) * Math.exp(-beatT * 90);
      value += tick * (beat % 2 === 0 ? 0.13 : 0.08);
    }

    const offBeatT = ((t + 0.25) % 0.5);
    if (offBeatT < 0.028) {
      value += Math.sin(2 * Math.PI * 1580 * offBeatT) * Math.exp(-offBeatT * 120) * 0.055;
    }

    const air = Math.sin(2 * Math.PI * 174.61 * t + Math.sin(2 * Math.PI * 0.25 * t)) * 0.022;
    const swell = Math.pow(Math.sin(Math.PI * barT / 2), 2);
    value += air * swell;

    const master = Math.tanh(value * 1.6) * 0.76;
    const left = master * (0.985 + 0.015 * Math.sin(2 * Math.PI * 0.1 * t));
    const right = master * (0.985 - 0.015 * Math.sin(2 * Math.PI * 0.1 * t));
    samples[frame * 2] = Math.max(-32768, Math.min(32767, Math.round(left * 32767)));
    samples[frame * 2 + 1] = Math.max(-32768, Math.min(32767, Math.round(right * 32767)));
  }

  const dataBytes = samples.byteLength;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  Buffer.from(samples.buffer).copy(buffer, 44);
  fs.writeFileSync(filePath, buffer);
}

writeWav(audioPath);
fs.mkdirSync(path.dirname(output), { recursive: true });

const crop = (x) => `crop=608:1080:${x}:0,scale=1080:1920:flags=lanczos`;
const grade = "eq=contrast=1.08:brightness=-0.025:saturation=0.90:gamma=0.97,curves=all='0/0 0.2/0.16 0.72/0.76 1/1',fps=30,format=yuv420p";
const font = "/System/Library/Fonts/Supplemental/Didot.ttc";
const finalText = [
  `drawtext=fontfile='${font}':text='Z A R I':fontcolor=white:fontsize=90:x=(w-text_w)/2:y=h*0.72:alpha='if(lt(t,6.7),0,if(lt(t,7.05),(t-6.7)/0.35,1))':enable='between(t,6.5,8)'`,
  `drawtext=fontfile='${font}':text='THE ROOM BEGINS UNDERFOOT.':fontcolor=white@0.92:fontsize=30:x=(w-text_w)/2:y=h*0.79:alpha='if(lt(t,6.9),0,if(lt(t,7.25),(t-6.9)/0.35,1))':enable='between(t,6.5,8)'`,
].join(",");

const segments = [
  `[0:v]trim=start=0:end=0.5,setpts=PTS-STARTPTS,${crop(650)},${grade}[v0]`,
  `[1:v]trim=start=1.2:end=1.7,setpts=PTS-STARTPTS,${crop(690)},${grade}[v1]`,
  `[0:v]trim=start=0.62:end=1.12,setpts=PTS-STARTPTS,${crop(790)},${grade}[v2]`,
  `[1:v]trim=start=3.2:end=4.2,setpts=PTS-STARTPTS,${crop(610)},${grade}[v3]`,
  `[2:v]trim=start=2:end=3,setpts=PTS-STARTPTS,${crop(600)},${grade}[v4]`,
  `[1:v]trim=start=7:end=8,setpts=PTS-STARTPTS,${crop(760)},${grade}[v5]`,
  `[2:v]trim=start=8:end=9,setpts=PTS-STARTPTS,${crop(760)},${grade}[v6]`,
  `[1:v]trim=start=10:end=11,setpts=PTS-STARTPTS,${crop(520)},${grade}[v7]`,
  `[1:v]trim=start=12:end=13.5,setpts=PTS-STARTPTS,${crop(650)},${grade}[v8]`,
  `[v0][v1][v2][v3][v4][v5][v6][v7][v8]concat=n=9:v=1:a=0,${finalText}[video]`,
  `[3:a]atrim=0:8,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.08,afade=t=out:st=7.7:d=0.3,volume=0.95[audio]`,
].join(";");

run("ffmpeg", [
  "-y", "-i", heels, "-i", walk, "-i", room, "-i", audioPath,
  "-filter_complex", segments,
  "-map", "[video]", "-map", "[audio]",
  "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-level", "4.1",
  "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", "-t", "8", output,
]);

run("ffmpeg", ["-y", "-ss", "7.15", "-i", output, "-frames:v", "1", "-update", "1", "-q:v", "2", posterPath]);
run("ffmpeg", [
  "-y", "-i", output,
  "-vf", "fps=8,scale=270:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
  "-loop", "0", previewPath,
]);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log(`Built ${output}`);
console.log(`Built ${posterPath}`);
console.log(`Built ${previewPath}`);
