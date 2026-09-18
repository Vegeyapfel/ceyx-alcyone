// Schneidet aus vorhandenen Clips einen Trailer (film/trailer.mp4).
// Reine ffmpeg-Arbeit, keine neue Bildberechnung.
//
//   node tools/trailer.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const FF = 'C:/AI/LatentSync/ffbin/ffmpeg.exe';
const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(filmDir, 'trailer_parts');
fs.mkdirSync(tmp, { recursive: true });

const W = 1280, H = 720, FPS = 24;
const FONT = 'C\\:/Windows/Fonts/georgia.ttf';
const FONT_I = 'C\\:/Windows/Fonts/georgiai.ttf';

// Bildausschnitte: id, Startsekunde, Länge
const SHOTS = [
  ['hafen_1', 0.6, 2.6],
  ['hafen_rede', 1.2, 2.0],
  ['hafen_abfahrt', 0.8, 2.0],
  ['sturm_1', 1.0, 1.8],
  ['sturm_2', 1.6, 2.4],
  ['sturm_welle', 2.6, 2.0],
  ['warten_1', 0.8, 1.8],
  ['traum_1', 1.2, 2.0],
  ['ufer_nah', 0.6, 1.8],
  ['mole_sprung', 1.4, 2.4],
  ['finale_nest', 0.8, 3.0],
];

// Texttafeln: nach welchem Ausschnitt sie folgen, Zeilen, Länge
const CARDS = [
  [2, ['Ovid, Metamorphosen XI'], 2.2, 46],
  [5, ['Sie bat ihn zu bleiben.'], 2.2, 54],
  [8, ['Jede Entscheidung', 'erzählt den Mythos anders.'], 2.6, 54],
];
const TITLE = ['Ceyx & Alcyone', 'Ein interaktiver Film', 'vegeyapfel.github.io/ceyx-alcyone'];

function run(args) {
  const r = spawnSync(FF, ['-y', '-loglevel', 'error', ...args]);
  if (r.status !== 0) throw new Error(String(r.stderr));
}

const parts = [];

// 1. Ausschnitte: gleiche Größe, gleiche Bildrate, kurzes Auf- und Abblenden
SHOTS.forEach(([id, start, dur], i) => {
  const out = path.join(tmp, `s${String(i).padStart(2, '0')}.mp4`);
  run(['-ss', String(start), '-t', String(dur), '-i', path.join(filmDir, 'clips', `${id}.mp4`),
    '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},`
      + `fade=t=in:st=0:d=0.25,fade=t=out:st=${(dur - 0.35).toFixed(2)}:d=0.35,setsar=1`,
    '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', out]);
  parts.push([i, out]);
});

// 2. Texttafeln auf schwarzem Grund
CARDS.forEach(([after, lines, dur, size], k) => {
  const out = path.join(tmp, `c${k}.mp4`);
  const draw = lines.map((t, n) => `drawtext=fontfile='${FONT_I}':text='${t}':fontcolor=0xE9E2D4:`
    + `fontsize=${size}:x=(w-text_w)/2:y=(h-text_h)/2+${(n - (lines.length - 1) / 2) * (size * 1.5)}:`
    + `alpha='if(lt(t,0.4),t/0.4,if(lt(t,${dur - 0.4}),1,(${dur}-t)/0.4))'`).join(',');
  run(['-f', 'lavfi', '-i', `color=c=0x05070A:s=${W}x${H}:r=${FPS}:d=${dur}`,
    '-vf', `${draw},setsar=1`, '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', out]);
  parts.push([after + 0.5, out]);
});

// 3. Schlusstafel mit Titel und Adresse
{
  const dur = 4.2, out = path.join(tmp, 'zz.mp4');
  const draw = [
    `drawtext=fontfile='${FONT}':text='${TITLE[0]}':fontcolor=0xE9E2D4:fontsize=74:x=(w-text_w)/2:y=h/2-110`,
    `drawtext=fontfile='${FONT_I}':text='${TITLE[1]}':fontcolor=0xD9B877:fontsize=40:x=(w-text_w)/2:y=h/2+10`,
    `drawtext=fontfile='${FONT}':text='${TITLE[2]}':fontcolor=0x9C9588:fontsize=28:x=(w-text_w)/2:y=h/2+120`,
  ].join(',');
  run(['-f', 'lavfi', '-i', `color=c=0x05070A:s=${W}x${H}:r=${FPS}:d=${dur}`,
    '-vf', `${draw},fade=t=in:st=0:d=0.6,fade=t=out:st=${dur - 0.8}:d=0.8,setsar=1`,
    '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', out]);
  parts.push([99, out]);
}

// 4. In Reihenfolge zusammenfügen
parts.sort((a, b) => a[0] - b[0]);
const list = path.join(tmp, 'liste.txt');
fs.writeFileSync(list, parts.map(([, p]) => `file '${p.replaceAll('\\', '/')}'`).join('\n'));
const stumm = path.join(tmp, 'stumm.mp4');
run(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', stumm]);

// 5. Ton: Sturmmusik unter den ersten Teil, ruhige Musik ab dem Finale
const dauer = SHOTS.reduce((s, [, , d]) => s + d, 0) + CARDS.reduce((s, c) => s + c[2], 0) + 4.2;
const wechsel = dauer - 7.5;
run(['-i', stumm, '-i', path.join(filmDir, 'music', 'storm.mp3'), '-i', path.join(filmDir, 'music', 'calm.mp3'),
  '-filter_complex',
  `[1:a]atrim=0:${wechsel + 1.5},afade=t=in:st=0:d=1.5,afade=t=out:st=${wechsel}:d=1.5,volume=0.75[a1];`
  + `[2:a]atrim=0:9,adelay=${Math.round(wechsel * 1000)}|${Math.round(wechsel * 1000)},`
  + `afade=t=in:st=${wechsel}:d=1.2,afade=t=out:st=${dauer - 1.6}:d=1.6,volume=0.8[a2];`
  + `[a1][a2]amix=inputs=2:dropout_transition=0[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest',
  path.join(filmDir, 'trailer.mp4')]);

console.log(`trailer.mp4 fertig, ${dauer.toFixed(1)} s`);
