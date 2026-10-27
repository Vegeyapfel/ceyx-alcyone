// Textstufe nach dem Original: setzt für jede Szene das lateinische Zitat mit
// Versangabe und prüft jedes Zitat gegen den Text des Handouts
// (Met. 11, 559-748). Nur geprüfte Zitate landen im Film.
//
//   node tools/text_ovid.mjs [--probe]
//
// --probe schreibt nichts, meldet nur, welche Zitate im Original stehen.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quelle = process.env.HANDOUT || path.join(filmDir, 'docs_handout.txt');
const nurProbe = process.argv.includes('--probe');

const roh = fs.readFileSync(quelle, 'utf8');
// Original normalisieren: Zeilenumbrüche, doppelte Leerzeichen und die
// Trennstellen aus dem PDF ("Ausseh en") stören den Vergleich.
const norm = (t) => t.toLowerCase().replace(/[’']/g, '').replace(/[^a-zäöüß ]+/g, ' ').replace(/\s+/g, ' ').trim();
const original = norm(roh);
const steht = (zitat) => original.includes(norm(zitat));

// Szene: [lateinisch, Versangabe, deutsche Wiedergabe]
const TEXTE = {
  hafen_rede:            ['at certe vellem, quoniam periturus abibas, me quoque duxisses', 'V. 696-697', 'Sie bittet ihn, sie mitzunehmen – oder zu bleiben.'],
  hafen_abfahrt:         ['hic retinacula solvit', 'V. 712', 'Hier löste er die Taue.'],
  hafen_kuss:            ['hoc mihi discedens dedit oscula litore', 'V. 713', 'An diesem Ufer gab er mir zum Abschied Küsse.'],
  sturm_3:               ['tenet ipse manu, qua sceptra solebat, fragmina navigii', 'V. 560-561', 'Mit der Hand, die sonst das Szepter hielt, hält er Trümmer des Schiffs.'],
  sturm_ruf:             ['nominat Alcyonen ipsisque inmurmurat undis', 'V. 567', 'Er nennt Alkyones Namen und murmelt ihn in die Wellen.'],
  sturm_stern:           ['Lucifer obscurus', 'V. 570', 'Der Morgenstern, sein Vater, verhüllte sein Gesicht mit Wolken.'],
  sturm_welle:           ['niger arcus aquarum frangitur et rupta mersum caput obruit unda', 'V. 568-569', 'Ein schwarzes Gewölbe aus Wogen zerbirst und versenkt seinen Kopf.'],
  warten_gebet:          ['proque viro, qui nullus erat, veniebat ad aras', 'V. 579', 'Für ihren Mann, der doch nicht mehr war, trat sie zum Altar.'],
  warten_weben:          ['quas induat ille, festinat vestes', 'V. 574-575', 'Voll Eifer sorgt sie für Kleider, die er tragen soll.'],
  traum_1:               ['inveniesque tuo pro coniuge coniugis umbram', 'V. 660', 'Statt deines Mannes findest du nur den Schatten des Mannes. Der Südwind zerbrach sein Schiff.'],
  traum_greifen:         ['corpusque petens amplectitur auras', 'V. 675', 'Im Schlaf greift sie nach seinem Körper und umarmt nur Luft.'],
  traum_fragen:          ['ipse ego fata tibi praesens mea naufragus edo', 'V. 668', 'Kein zweifelhafter Bote meldet es: Er selbst verkündet ihr sein Schicksal.'],
  traum_erwachen:        ['nulla est Alcyone, nulla est', 'V. 684', 'Aus ist es mit Alkyone, aus ist es, klagt sie der Amme.'],
  ufer_erinnerung_flehen:['ne me fugiens ventos sequerere rogabam', 'V. 695', 'Hier, erinnert sie sich, bat sie ihn, nicht zu fliehen und den Winden nicht zu folgen.'],
  ufer_erinnerung_kuss:  ['hoc mihi discedens dedit oscula litore', 'V. 713', 'Hier, erinnert sie sich, gab er ihr zum Abschied Küsse.'],
  ufer_koerper:          ['nescio quid quasi corpus aqua', 'V. 716', 'Fern im klaren Wasser treibt etwas, das einem Körper gleicht.'],
  ufer_nah:              ['erat coniunx! ille est!', 'V. 725', 'Es war ihr Mann. Er ist es!'],
  mole_1:                ['facta manu moles, quae primas aequoris iras frangit', 'V. 729-730', 'Eine von Menschenhand gebaute Mole bricht das erste Wüten der See.'],
  mole_flug:             ['stringebat summas ales miserabilis undas', 'V. 733', 'Als bejammernswerter Vogel streifte sie die Oberfläche der Wellen.'],
  mole_zwei:             ['superis miserantibus, ambo alite mutantur', 'V. 741-742', 'Die Götter erbarmten sich, und beide wurden in Vögel verwandelt.'],
  finale_nest:           ['incubat Alcyone pendentibus aequore nidis', 'V. 746', 'Alkyone brütet im Nest, das über dem Meer hängt – sieben ruhige Tage im Winter.'],
  finale_nest_rot:       ['incubat Alcyone pendentibus aequore nidis', 'V. 746', 'Alkyone brütet im Nest, das über dem Meer hängt – sieben ruhige Tage im Winter.'],
  ende_ufer_1:           ['si non ossibus ossa meis, at nomen nomine tangam', 'V. 706-707', 'Berührt sich schon nicht Gebein mit Gebein, so doch Name mit Name.'],
  ende_ufer_2:           ['ventos custodit et arcet Aeolus', 'V. 747-748', 'Äolus hält die Winde zurück – doch Alkyone bleibt allein am Ufer.'],
};

// Kapitelkarten
const KAPITEL = {
  hafen_1:  ['ne me fugiens ventos sequerere rogabam', 'V. 695', 'Ich bat dich, nicht zu fliehen und den Winden nicht zu folgen.'],
  sturm_1:  ['ecce super medios fluctus niger arcus aquarum', 'V. 568', 'Sieh, über dem Wasser ein schwarzes Gewölbe aus Wogen.'],
  warten_1: ['dinumerat noctes', 'V. 574', 'Sie zählt die Nächte.'],
  traum_1:  ['agnoscis Ceyca, miserrima coniunx?', 'V. 658', 'Erkennst du Ceyx, du ärmste Gemahlin?'],
  ufer_1:   ['Mane erat.', 'V. 710', 'Es war Morgen.'],
  mole_1:   ['tunc quoque mansit amor', 'V. 743', 'Auch dann blieb die Liebe.'],
};

let fehlend = 0;
const pruefe = (wo, zitat) => {
  const ok = steht(zitat);
  if (!ok) fehlend++;
  console.log(`${ok ? 'ok  ' : 'FEHLT'}  ${wo.padEnd(24)} ${zitat.slice(0, 60)}`);
  return ok;
};

const story = JSON.parse(fs.readFileSync(path.join(filmDir, 'story.json'), 'utf8'));
for (const [id, [lat, nr, de]] of Object.entries(TEXTE)) {
  if (!story.scenes[id]) { console.log(`?     ${id} gibt es nicht`); continue; }
  if (!pruefe(id, lat)) continue;
  if (!nurProbe) story.scenes[id].subtitle = `${lat} – ${de}`;
}
for (const [id, [lat, nr, de]] of Object.entries(KAPITEL)) {
  if (!story.scenes[id]) continue;
  if (!pruefe(`${id} (Kapitel)`, lat)) continue;
  if (!nurProbe) story.scenes[id].verse = [`${lat}  ·  Met. XI, ${nr.replace('V. ', '')}`, de];
}

if (!nurProbe && fehlend === 0) {
  fs.writeFileSync(path.join(filmDir, 'story.json'), JSON.stringify(story, null, 2) + '\n');
  console.log('\nstory.json geschrieben.');
} else if (!nurProbe) {
  console.log(`\nNICHT geschrieben: ${fehlend} Zitate stehen so nicht im Original.`);
}
