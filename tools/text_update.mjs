// Textstufe der Aufwertung: Versangaben auf den Kapitelkarten, mehr
// lateinische Zitate in den Untertiteln und längere Bewegungsbeschreibungen
// für die 7,5-Sekunden-Einstellungen.
//
//   node tools/text_update.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(filmDir, 'story.json');
const story = JSON.parse(fs.readFileSync(file, 'utf8'));
const S = story.scenes;

// Versangabe hinter das lateinische Zitat der Kapitelkarten
const VERSE = {
  hafen_1: 'Met. XI, 695',
  sturm_1: 'Met. XI, 568',
  warten_1: 'Met. XI, 574',
  traum_1: 'Met. XI, 658',
  ufer_1: 'Met. XI, 710',
  mole_1: 'Met. XI, 743',
};
for (const [id, nr] of Object.entries(VERSE)) {
  if (S[id]?.verse) S[id].verse[0] = `${S[id].verse[0]}  ·  ${nr}`;
}

// Lateinische Zitate, wo bisher nur Deutsch stand
const LATEIN = {
  traum_1: 'luridus, exsangui similis, sine vestibus ullis – Fahl, einem Blutleeren gleich, ohne Kleid steht Ceyx vor ihr: Er sei tot, der Südwind habe sein Schiff zerschlagen.',
  mole_1: 'facta manu moles – Eine von Menschenhand gebaute Mole bricht die heranrollende See.',
  finale_nest: 'incubat Alcyone pendentibus aequore nidis – Alkyone brütet auf dem Nest, das über dem Meer schwebt; sieben stille Tage hält Aiolos die Winde zurück.',
  finale_nest_rot: 'incubat Alcyone pendentibus aequore nidis – Alkyone brütet auf dem Nest, das über dem Meer schwebt; sieben stille Tage hält Aiolos die Winde zurück.',
  hafen_rede: 'ne me fugiens ventos sequerere rogabam – Sie bittet ihn, den Winden nicht zu folgen: Er solle bleiben oder sie mitnehmen.',
};
for (const [id, text] of Object.entries(LATEIN)) if (S[id]) S[id].subtitle = text;

// Längere Einstellungen brauchen mehr Handlung, sonst steht das Bild still.
const MOTION = {
  hafen_1: 'slow push in across the quiet harbour water at dawn, mist drifts over the surface, the moored galley rocks gently, its square sail luffs, ripples spread from the hull, a few gulls cross the frame, very slow steady camera move, no cuts',
  hafen_2: 'she holds his hands and looks up at him, he lowers his head toward her, the wind moves her hair and his cloak, behind them sailors carry bundles aboard, slow natural motion, the camera drifts almost imperceptibly closer',
  hafen_abfahrt: 'the moored ship pulls away from the quay, the gap of water between hull and stone widens, oars dip and lift, the square sail fills with wind, the ship glides toward the open sea and grows smaller, she stands still and watches, her dress moves in the wind, static camera',
  ufer_1: 'she walks slowly along the empty shore at sunrise, her dress and hair move in the breeze, small waves run up the sand beside her and withdraw, golden mist drifts, the camera follows her in a slow steady track',
  ufer_koerper: 'the body drifts closer on the swell, the water lifts and lowers it, the red cloak spreads in the water, she wades a step into the sea and stops, slow heavy water motion',
  mole_1: 'she runs along the stone mole toward the open sea, her dress streaming behind her, spray bursts against the stones beside her, the camera tracks alongside her, morning light flickering between the blocks',
  mole_flug: 'the kingfisher skims low over the water, wingtips almost touching the surface, a line of spray follows under it, it rises slightly and settles toward the floating body, smooth continuous flight, camera follows',
  mole_zwei: 'two kingfishers circle above the water and settle side by side on the floating wreck plank, they turn toward each other and touch beaks, calm sea, slow natural motion',
  warten_1: 'she counts the nights at the window, her lips move silently, she sets another small stone on the sill, candlelight flickers across her face, outside the night sea is dark, very slow camera drift',
  traum_erwachen: 'she wakes with a start, sits up, presses both hands to her face and weeps, the servants enter with lamps behind her, warm light spreads across the dark room, slow natural motion',
  hafen_rede: 'she speaks urgently to him, her hands gripping his forearms, he listens and shakes his head slowly, the wind pulls at her hair, behind them the sea glitters, slow natural motion, static camera',
  sturm_3: 'he clings to the broken plank, waves lift and drop him, he spits out water and lifts his head to breathe, rain hammers the surface, lightning flashes once across his face, handheld camera',
  traum_1: 'the pale drowned man stands beside her bed and leans over her, water runs from his hair and beard and drips onto the blanket, tears on his face, she sleeps on without waking, blue mist drifts slowly through the room, static camera',
};
for (const [id, motion] of Object.entries(MOTION)) if (S[id]) S[id].motion = motion;

// Traumbild nach Ovid XI 653-656 statt Greis im Laken
if (S.traum_1) {
  S.traum_1.image = 'side view of a dark ancient stone bedroom in cold blue moonlight, a young woman with long dark hair asleep in bed under a blanket, beside the bed stands the pale bloodless body of a young bearded man, bare chest and shoulders, wet dark curly hair and wet beard dripping water, leaning over her and weeping, his lower body hidden behind the bed';
  S.traum_1.negative = 'old man, white beard, grey hair, sheet ghost, glass box, veil, shroud, hood, clothing, cloak, genitals, woman standing';
}

fs.writeFileSync(file, JSON.stringify(story, null, 2) + '\n');
console.log('Verse ergänzt:', Object.keys(VERSE).length,
  ' Latein ergänzt:', Object.keys(LATEIN).length,
  ' Bewegungen neu:', Object.keys(MOTION).length);
