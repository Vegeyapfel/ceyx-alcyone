// Spricht alle Untertitel mit ElevenLabs (Modell eleven_multilingual_v2, Deutsch).
// Der API-Schlüssel wird NUR aus film/.env gelesen (ELEVENLABS_API_KEY=...),
// die Datei trägt der Nutzer selbst ein. Gesamttext ca. 1.100 Zeichen –
// passt in das kostenlose Kontingent (10.000 Zeichen/Monat).
//
//   node film/tools/voices_elevenlabs.mjs          alle Zeilen
//   node film/tools/voices_elevenlabs.mjs voices   verfügbare Stimmen auflisten

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = fs.existsSync(path.join(filmDir, '.env')) ? fs.readFileSync(path.join(filmDir, '.env'), 'utf8') : '';
const KEY = (env.match(/ELEVENLABS_API_KEY\s*=\s*(\S+)/) || [])[1];
if (!KEY) { console.log('Kein Schlüssel: film/.env mit ELEVENLABS_API_KEY=... anlegen.'); process.exit(1); }

const API = 'https://api.elevenlabs.io/v1';
const headers = { 'xi-api-key': KEY, 'content-type': 'application/json' };

if (process.argv[2] === 'voices') {
  const j = await (await fetch(`${API}/voices`, { headers })).json();
  for (const v of j.voices || []) console.log(v.voice_id, v.name, v.labels?.gender, v.labels?.age, v.category);
  process.exit(0);
}

// Vorgefertigte Stimmen (auch im Gratisplan per API nutzbar)
const VOICES = {
  Alcyone: { id: 'XB0fDUnXU5powFXDhCwa', stability: 0.38, style: 0.45 },   // Charlotte
  Ceyx: { id: 'onwK4e9ZLuTAKqWW03F9', stability: 0.45, style: 0.35 },      // Daniel
  Morpheus: { id: 'onwK4e9ZLuTAKqWW03F9', stability: 0.7, style: 0.15 },   // Daniel, leiser und gleichförmiger
  narrator: { id: 'JBFqnCBsd6RMkjVDRZzb', stability: 0.55, style: 0.25 },  // George
};

const manifest = JSON.parse(fs.readFileSync(path.join(filmDir, 'voice', 'manifest.json'), 'utf8'));
const outDir = path.join(filmDir, 'voice_el');
fs.mkdirSync(outDir, { recursive: true });

for (const [id, { speaker, text }] of Object.entries(manifest)) {
  const file = path.join(outDir, `${id}.mp3`);
  if (fs.existsSync(file)) continue;
  const v = VOICES[speaker];
  const r = await fetch(`${API}/text-to-speech/${v.id}?output_format=mp3_44100_128`, {
    method: 'POST', headers,
    body: JSON.stringify({
      text, model_id: 'eleven_multilingual_v2', language_code: 'de',
      voice_settings: { stability: v.stability, similarity_boost: 0.8, style: v.style, use_speaker_boost: true },
    }),
  });
  if (!r.ok) { console.log(`! ${id}: ${r.status} ${(await r.text()).slice(0, 300)}`); break; }
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  console.log(`+ ${id} [${speaker}]`);
}
console.log('fertig – im Player wird voice_el/ automatisch bevorzugt');
