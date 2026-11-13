// Erzeugt die Klassenversion aus dem Original:
//   klasse.html      aus index.html  (+ klasse.css, QR-Bibliothek, klasse.js)
//   player_klasse.js aus player.js   (+ Pause, Szene neu, Szene zurück)
// So landet jede Änderung am Original automatisch auch in der Klassenversion;
// das Original selbst wird nie verändert. Fehlt eine Ankerstelle, bricht das
// Skript laut ab, statt still etwas Falsches zu bauen.
// Aufruf: node tools/klasse_bauen.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function patcher(datei) {
  let text = fs.readFileSync(path.join(dir, datei), 'utf8').split('\r\n').join('\n');
  const p = {
    ersetze(alt, neu, alle = false) {
      if (!text.includes(alt)) throw new Error(`Ankerstelle fehlt in ${datei}: ${alt}`);
      text = alle ? text.split(alt).join(neu) : text.replace(alt, neu);
      return p;
    },
    abschnitt(von, bis, f) {
      const a = text.indexOf(von); const b = text.indexOf(bis, a);
      if (a < 0 || b < 0) throw new Error(`Abschnitt fehlt in ${datei}: ${von} … ${bis}`);
      text = text.slice(0, a) + f(text.slice(a, b)) + text.slice(b);
      return p;
    },
    text: () => text,
  };
  return p;
}

// ---------- klasse.html ----------
const html = patcher('index.html')
  .ersetze('<!doctype html>', '<!doctype html>\n<!-- ERZEUGT aus index.html durch tools/klasse_bauen.mjs – nicht von Hand ändern. -->')
  .ersetze('<link rel="stylesheet" href="player.css">', '<link rel="stylesheet" href="player.css">\n<link rel="stylesheet" href="klasse.css">')
  .ersetze('<script type="module" src="player.js"></script>',
    '<script src="vendor/qrcode.js"></script>\n  <script src="vendor/mqtt.min.js"></script>\n  <script type="module" src="player_klasse.js"></script>\n  <script type="module" src="klasse.js"></script>')
  .text()
  .replace(/<title>([^<]*)<\/title>/, '<title>$1 · Klassenversion</title>');
fs.writeFileSync(path.join(dir, 'klasse.html'), html);

// ---------- player_klasse.js ----------
const STEUERUNG = `// ---- Klassenversion: anhaltbare Wartezeiten, Szenensprünge ----
let pausiert = false;
let lauf = 0;              // jede Szene bekommt eine Nummer; ein Sprung macht alte Abläufe ungültig
let jetzt = null;          // laufende Szene
const wartende = new Set();

function wait(ms) {
  ms /= SPEED;
  return new Promise((resolve) => {
    const w = { rest: ms, seit: 0, t: 0 };
    w.los = () => { w.seit = performance.now(); w.t = setTimeout(w.fertig, w.rest); };
    w.halt = () => { clearTimeout(w.t); w.rest = Math.max(0, w.rest - (performance.now() - w.seit)); };
    w.fertig = () => { clearTimeout(w.t); wartende.delete(w); if (skip === w.fertig) skip = null; resolve(); };
    wartende.add(w);
    skip = w.fertig;
    if (!pausiert) w.los();
  });
}
/** Wie wait, löst aber nie auf, wenn inzwischen eine andere Szene gestartet wurde. */
const warte = (ich, ms) => wait(ms).then(() => (ich === lauf ? undefined : new Promise(() => {})));

const angehalten = { videos: [], stimme: false };
window.__film = {
  get pausiert() { return pausiert; },
  get szene() { return jetzt; },
  pause() {
    if (pausiert || !jetzt) return;
    pausiert = true;
    wartende.forEach((w) => w.halt());
    angehalten.videos = [...document.querySelectorAll('.layer video')].filter((v) => !v.paused);
    angehalten.videos.forEach((v) => v.pause());
    angehalten.stimme = !voice.paused;
    voice.pause();
    duck(true);
    document.body.classList.add('k-pause');
  },
  weiter() {
    if (!pausiert) return;
    pausiert = false;
    angehalten.videos.forEach((v) => v.play().catch(() => {}));
    if (angehalten.stimme) voice.play().catch(() => {}); else duck(false);
    wartende.forEach((w) => w.los());
    document.body.classList.remove('k-pause');
  },
  /** Springt in eine Szene (die laufende von vorn oder die vorige). */
  springe(ziel) {
    const id = ziel === 'zurueck' ? (path.length >= 2 ? (path.pop(), path.pop()) : path.pop()) : (path.pop(), jetzt);
    if (!id) return;
    lauf++;
    pausiert = false;
    document.body.classList.remove('k-pause');
    wartende.forEach((w) => clearTimeout(w.t));
    wartende.clear();
    skip = null;
    voice.pause();
    duck(false);
    subtitle(null);
    $('#choice').classList.add('hidden');
    $('#chapter').classList.add('hidden');
    playScene(id);
  },
};
`;

const player = patcher('player.js')
  .ersetze('// Interaktiver Film-Player:', '// ERZEUGT aus player.js durch tools/klasse_bauen.mjs – nicht von Hand ändern.\n// Interaktiver Film-Player:')
  .abschnitt('function wait(ms) {', 'async function showChapter', () => `${STEUERUNG}\n`)
  .ersetze('async function playScene(id) {\n  const scene = story.scenes[id];', 'async function playScene(id) {\n  const ich = ++lauf;\n  jetzt = id;\n  const scene = story.scenes[id];')
  .ersetze('  // Kapitelkarte liegt über dem Bild', '  if (ich !== lauf) return;\n  // Kapitelkarte liegt über dem Bild')
  .ersetze('  await chapter;\n', '  await chapter;\n  if (ich !== lauf) return;\n')
  .ersetze('  const voiceMs = scene.subtitle && !synced ? await speak(id) : 0;\n', '  const voiceMs = scene.subtitle && !synced ? await speak(id) : 0;\n  if (ich !== lauf) return;\n')
  .abschnitt('  // Clip läuft durch;', '  if (synced) duck(false);', (s) => s.split('await wait(').join('await warte(ich, '))
  .ersetze('  subtitle(null);\n  if (scene.end)', '  if (ich !== lauf) return;\n  subtitle(null);\n  if (scene.end)')
  .text();
fs.writeFileSync(path.join(dir, 'player_klasse.js'), player);

console.log('klasse.html und player_klasse.js erzeugt');
