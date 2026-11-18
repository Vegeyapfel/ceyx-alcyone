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
  // Eigenes App-Profil: das Symbol auf dem Home-Bildschirm öffnet die Klassenversion im Vollbild
  .ersetze('<link rel="manifest" href="manifest.webmanifest">', '<link rel="manifest" href="klasse.webmanifest">')
  .ersetze('<meta name="apple-mobile-web-app-title" content="Ceyx &amp; Alcyone">', '<meta name="apple-mobile-web-app-title" content="Ceyx Klasse">')
  .ersetze('<link rel="stylesheet" href="player.css">', '<link rel="stylesheet" href="player.css">\n<link rel="stylesheet" href="klasse.css">\n<link rel="stylesheet" href="abspann.css">')
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
  // ---- Lateinische Textbezüge (latein.js): Kapitelverse und gesprochene Untertitel ----
  .ersetze("import { startAudio, setAmbience, duck } from './ambience.js';\n",
    "import { startAudio, setAmbience, duck } from './ambience.js';\nimport { KAPITEL, GESPROCHEN } from './latein.js';\n")
  .ersetze("const story = await (await fetch('story.json')).json();\n",
    "const story = await (await fetch('story.json')).json();\n"
    + "// Klassenversion: Kapitelverse wörtlich aus dem Unterrichtstext, Untertitel = was der Sprecher sagt\n"
    + "for (const [id, k] of Object.entries(KAPITEL)) if (story.scenes[id]) story.scenes[id].verse = [`${k.la}  ·  Met. XI, ${k.v}`, k.de];\n"
    + "for (const [id, t] of Object.entries(GESPROCHEN)) if (story.scenes[id]) story.scenes[id].subtitle = t;\n"
    + "// Klassenversion: am Ufer keine Abstimmung – es geht immer weiter zur Mole (Ovids Ende)\n"
    + "if (story.scenes.ufer_nah && story.scenes.mole_1) { delete story.scenes.ufer_nah.choice; story.scenes.ufer_nah.next = 'mole_1'; story.scenes.mole_1.set = { end: 'mole' }; }\n")
  .ersetze('  path.push(id);\n', '  path.push(id);\n  if (scene.set) Object.assign(flags, scene.set);\n')
  // ---- Flüssigerer Ablauf (nur Klassenversion) ----
  // 1. Vorhandene Dateien merken und die nächsten Szenen im Hintergrund vorladen,
  //    damit zwischen zwei Szenen nicht erst geladen werden muss.
  .ersetze('async function exists(url) {\n', `const vorhanden = new Map();
const vorgeladen = new Set();
function vorladen(scene) {
  const ziele = [scene.next, ...(scene.next_if || []).map((c) => c.goto), ...((scene.choice && scene.choice.options) || []).map((o) => o.goto)];
  for (const z of ziele) {
    if (!z || vorgeladen.has(z)) continue;
    vorgeladen.add(z);
    for (const u of [\`clips/\${z}.mp4\`, \`voice_el/\${z}.mp3\`, \`voice/\${z}.mp3\`]) {
      fetch(u, { priority: 'low' }).then((r) => { vorhanden.set(u, r.ok && !(r.headers.get('content-type') || '').includes('text/html')); return r.blob(); }).catch(() => {});
    }
  }
}
async function exists(url) {
  if (vorhanden.has(url)) return vorhanden.get(url);
  vorhanden.set(url, await existsNetz(url));
  return vorhanden.get(url);
}
async function existsNetz(url) {
`)
  .ersetze('  path.push(id);\n', '  path.push(id);\n  vorladen(scene);\n')
  // 2. Erzählerstimme schon mit der Überblendung starten (außer bei Kapitelkarten)
  .ersetze('    video.src = clip;\n', '    video.src = clip;\n    video.playbackRate = 1;\n')
  .ersetze('  // Kapitelkarte liegt über dem Bild; das Bild blendet darunter schon auf.\n  const chapter = showChapter(scene);\n',
    '  // Klassenversion: ohne Kapitelkarte beginnt die Stimme schon mit der Überblendung\n'
    + '  const frueh = !scene.chapter && scene.subtitle && !synced;\n'
    + '  const fruehStimme = frueh ? speak(id) : null;\n'
    + '  if (frueh) subtitle(scene.subtitle);\n'
    + '  // Kapitelkarte liegt über dem Bild; das Bild blendet darunter schon auf.\n  const chapter = showChapter(scene);\n')
  .ersetze('  const voiceMs = scene.subtitle && !synced ? await speak(id) : 0;\n', '  const voiceMs = fruehStimme ? await fruehStimme : (scene.subtitle && !synced ? await speak(id) : 0);\n')
  // 3. Kein langes Standbild: die nächste Szene blendet knapp vor Clipende ein,
  //    Lesezeit zählt nur ohne Sprecher; ist die Stimme länger als der Clip,
  //    läuft das Video bis auf 65 % verlangsamt weiter.
  .ersetze('  const need = Math.max(duration, readTime(scene.subtitle), voiceMs + 600);\n',
    '  // Die nächste Szene blendet schon 0,45 s vor Clipende ein – kein Standbild am Ende\n'
    + '  const need = voiceMs ? Math.max(duration - 450, voiceMs + 150) : Math.max(duration - 450, readTime(scene.subtitle));\n'
    + '  if (video.style.display !== \'none\' && need > duration) {\n'
    + '    const rate = Math.max(0.65, duration / need);\n'
    + '    video.playbackRate = tempo * rate;\n'
    + '    duration /= rate;\n'
    + '  }\n')
  .text();
fs.writeFileSync(path.join(dir, 'player_klasse.js'), player);

console.log('klasse.html und player_klasse.js erzeugt');
