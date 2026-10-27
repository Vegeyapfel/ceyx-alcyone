// Lange Einstellungen ohne Schnitt: rechnet mehrere Abschnitte nacheinander,
// wobei das letzte Bild eines Abschnitts zum Startbild des nächsten wird,
// und fügt sie zu einem Clip zusammen.
//
//   node tools/chain.mjs <id> <anzahl abschnitte> [seed]
//
// 3 Abschnitte ≈ 22 s. Die Einzelteile liegen in clips/_chain und bleiben
// liegen, damit ein abgebrochener Lauf dort weitermacht, wo er stand.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const FF = 'C:/AI/LatentSync/ffbin/ffmpeg.exe';
const PY = 'C:/AI/ComfyUI_windows_portable/python_embeded/python.exe';
const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const teilDir = path.join(filmDir, 'clips', '_chain');
fs.mkdirSync(teilDir, { recursive: true });

const [id, anzahlArg, seedArg] = process.argv.slice(2);
if (!id) { console.log('Aufruf: node tools/chain.mjs <id> <abschnitte> [seed]'); process.exit(1); }
const anzahl = Number(anzahlArg || 2);
const seed = Number(seedArg || 4242);

/** Letztes Bild eines Clips als PNG herausziehen – Startbild des nächsten Abschnitts. */
function letztesBild(clip, ziel) {
  const r = spawnSync(PY, ['-c', `
import av
c = av.open(r'${clip}')
f = None
for frame in c.decode(c.streams.video[0]):
    f = frame
f.to_image().save(r'${ziel}')
`]);
  if (r.status !== 0) throw new Error(`letztes Bild: ${r.stderr}`);
}

function abschnitt(nr, startBild, ausgabe) {
  if (fs.existsSync(ausgabe)) { console.log(`= ${id} Abschnitt ${nr} (vorhanden)`); return; }
  const t = Date.now();
  const r = spawnSync('node', [path.join(filmDir, 'tools', 'generate.mjs'), 'clips', id], {
    stdio: 'inherit',
    env: { ...process.env,
      MODEL: '14b', FORCE: '1',
      W: process.env.W || '832', H: process.env.H || '480',
      FRAMES: process.env.FRAMES || '121',
      STEPS14: process.env.STEPS14 || '6', SWITCH: process.env.SWITCH || '3',
      SEED: String(seed + nr * 17),
      START_IMAGE: startBild, OUT: ausgabe,
    },
  });
  if (r.status !== 0 || !fs.existsSync(ausgabe)) throw new Error(`Abschnitt ${nr} fehlgeschlagen`);
  console.log(`+ ${id} Abschnitt ${nr}  ${((Date.now() - t) / 1000 / 60).toFixed(1)} min`);
}

let start = path.join(filmDir, 'stills', `${id}.png`);
const teile = [];
for (let n = 1; n <= anzahl; n++) {
  const teil = path.join(teilDir, `${id}_${n}.mp4`);
  abschnitt(n, start, teil);
  teile.push(teil);
  if (n < anzahl) {
    start = path.join(teilDir, `${id}_${n}_ende.png`);
    letztesBild(teil, start);
  }
}

// Zusammenfügen; gleiche Auflösung und Bildrate, daher reicht Kopieren.
const liste = path.join(teilDir, `${id}_liste.txt`);
fs.writeFileSync(liste, teile.map((p) => `file '${p.replaceAll('\\', '/')}'`).join('\n'));
const ziel = path.join(filmDir, 'clips', `${id}.mp4`);
const r = spawnSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', liste, '-c', 'copy', ziel]);
if (r.status !== 0) throw new Error(String(r.stderr));
console.log(`+ ${id} zusammengefügt aus ${anzahl} Abschnitten`);
