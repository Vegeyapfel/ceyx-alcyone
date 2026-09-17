// Spricht alle Untertitel aus story.json als MP3 nach film/voice/<id>.mp3.
// Sprecher wird aus dem Präfix "Alcyone:" / "Ceyx:" / "Morpheus:" abgeleitet,
// sonst Erzähler. Lateinische Teile ("latein – deutsch") werden nicht gesprochen.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const story = JSON.parse(fs.readFileSync(path.join(filmDir, 'story.json'), 'utf8'));
const outDir = path.join(filmDir, 'voice');
fs.mkdirSync(outDir, { recursive: true });

const VOICES = {
  Alcyone: { voice: 'de-DE-KatjaNeural', rate: '-8%', pitch: '+0Hz' },
  Ceyx: { voice: 'de-DE-ConradNeural', rate: '-10%', pitch: '-2Hz' },
  Morpheus: { voice: 'de-DE-ConradNeural', rate: '-22%', pitch: '-6Hz' },
  narrator: { voice: 'de-DE-KillianNeural', rate: '-15%', pitch: '-3Hz' },
};

function parse(sub) {
  let speaker = 'narrator';
  let text = sub;
  const m = sub.match(/^(Alcyone|Ceyx|Morpheus):\s*(.*)$/);
  if (m) { speaker = m[1]; text = m[2]; }
  // Nur echte lateinische Vorsätze abtrennen, nicht deutsche Gedankenstriche
  const i = text.indexOf(' – ');
  if (i > 0 && /^(nominat|hoc mihi|hic retinacula|Lucifer|nulla est|ille est|stringebat|nomen nomine|tunc quoque)/.test(text)) {
    text = text.slice(i + 3);
  }
  text = text.replace(/[„“"]/g, '').trim();
  return { speaker, text };
}

const force = process.env.FORCE === '1';
const manifest = {};

for (const [id, scene] of Object.entries(story.scenes)) {
  if (!scene.subtitle) continue;
  const { speaker, text } = parse(scene.subtitle);
  const file = path.join(outDir, `${id}.mp3`);
  manifest[id] = { speaker, text };
  if (fs.existsSync(file) && !force) continue;

  const v = VOICES[speaker];
  for (let attempt = 1; attempt <= 4; attempt++) {
  try {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(v.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const { audioStream } = tts.toStream(text, { rate: v.rate, pitch: v.pitch });
  const chunks = [];
  await new Promise((res, rej) => {
    audioStream.on('data', (c) => chunks.push(c));
    audioStream.on('end', res);
    audioStream.on('error', rej);
  });
  fs.writeFileSync(file, Buffer.concat(chunks));
  tts.close();
  console.log(`+ ${id} [${speaker}] ${text.slice(0, 50)}`);
  break;
  } catch (e) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
    console.log(`! ${id} Versuch ${attempt}: ${e.message}`);
    await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  }
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('fertig');
