// Erzeugt klasse.html (Klassenversion mit Handy-Abstimmung) aus index.html.
// So landet jede Änderung an der Originalseite automatisch auch in der
// Klassenversion. Szenen, Clips und Ton teilen sich beide ohnehin.
// Aufruf: node tools/klasse_bauen.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');

function ersetze(alt, neu) {
  if (!html.includes(alt)) throw new Error(`Ankerstelle fehlt in index.html: ${alt}`);
  html = html.replace(alt, neu);
}

ersetze('<!doctype html>', '<!doctype html>\n<!-- ERZEUGT aus index.html durch tools/klasse_bauen.mjs – nicht von Hand ändern. -->');
html = html.replace(/<title>([^<]*)<\/title>/, '<title>$1 · Klassenversion</title>');
ersetze('<link rel="stylesheet" href="player.css">', '<link rel="stylesheet" href="player.css">\n<link rel="stylesheet" href="klasse.css">');
ersetze('<script type="module" src="player.js"></script>',
  '<script src="vendor/qrcode.js"></script>\n  <script type="module" src="player.js"></script>\n  <script type="module" src="klasse.js"></script>');

fs.writeFileSync(path.join(dir, 'klasse.html'), html);
console.log('klasse.html erzeugt');
