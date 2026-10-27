// Gemeinsamer Bildabschluss für alle Clips: Filmkorn, leichte Vignette,
// einheitlicher Kontrast und eine Spur Schärfe. Das nimmt der KI-Oberfläche
// die glatte, wachsartige Anmutung und bindet alle Einstellungen zusammen.
//
//   node tools/finish.mjs [id ...]      ohne ids: alle Clips
//   KORN=0.9 VIGNETTE=0.25 node tools/finish.mjs hafen_1
//
// Originale wandern nach film/clips_ungegradet, damit nichts verloren geht.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const FF = 'C:/AI/LatentSync/ffbin/ffmpeg.exe';
const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clipsDir = path.join(filmDir, 'clips');
const rohDir = path.join(filmDir, 'clips_ungegradet');
fs.mkdirSync(rohDir, { recursive: true });

const KORN = Number(process.env.KORN || 6);        // Stärke des Korns
const VIGNETTE = Number(process.env.VIGNETTE || 0.22);

/**
 * Kette bewusst zurückhaltend: zu viel Korn sieht nach Filter aus, zu wenig
 * ändert nichts. unsharp hebt feine Kanten (Takelage, Haar) wieder an, die
 * das Videomodell weichzeichnet.
 */
const filter = [
  'format=yuv444p',
  'eq=contrast=1.04:saturation=0.95:gamma=0.99',
  'unsharp=5:5:0.5:5:5:0.0',
  `vignette=PI/4.2:eval=init`,
  `noise=alls=${KORN}:allf=t+u`,
  'format=yuv420p',
].join(',');

function run(id) {
  const src = path.join(clipsDir, `${id}.mp4`);
  if (!fs.existsSync(src)) return console.log(`! ${id}: kein Clip`);
  const roh = path.join(rohDir, `${id}.mp4`);
  if (!fs.existsSync(roh)) fs.copyFileSync(src, roh);   // einmalig sichern
  const tmp = path.join(clipsDir, `${id}_grade.mp4`);
  const r = spawnSync(FF, ['-y', '-loglevel', 'error', '-i', roh,
    '-vf', filter, '-c:v', 'libx264', '-crf', '17', '-preset', 'slow',
    '-pix_fmt', 'yuv420p', '-an', tmp]);
  if (r.status !== 0) { console.log(`! ${id}: ${String(r.stderr).slice(0, 200)}`); return; }
  fs.renameSync(tmp, src);
  console.log(`+ ${id}`);
}

const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(clipsDir).filter((f) => f.endsWith('.mp4')).map((f) => f.slice(0, -4));
for (const id of ids) run(id);
console.log('fertig');
