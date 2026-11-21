// Sprechtexte für die eigenen Aufnahmen (aufnahme.html) – in der Reihenfolge des Films.
// id = Szene, deren Erzählerstimme ersetzt wird; auch = weitere Szenen mit demselben Satz.
// Eingebaut werden die Aufnahmen als voice_eigen/<id>.mp3 (vor voice_el und voice).
export const SAETZE = [
  { id: 'einleitung', titel: 'Einleitung', text: 'Ovid erzählt im elften Buch seiner Metamorphosen von Ceyx und Alcyone. Ceyx ist König und will übers Meer zum Orakel des Apollo fahren. Seine Frau Alcyone, die Tochter des Windgottes Äolus, hat Angst um ihn – sie weiß, wie gefährlich die Winde auf dem Meer sind. Doch Ceyx bricht trotzdem auf.' },
  { id: 'hafen_rede', titel: 'Hafen – sie bittet ihn', text: 'Sie bittet ihn, sie mitzunehmen oder zu bleiben – sie fürchtet die Winde.' },
  { id: 'hafen_kuss', titel: 'Hafen – Abschiedskuss', text: 'An diesem Ufer küsste er sie zum Abschied.' },
  { id: 'hafen_schwur', titel: 'Hafen – sein Schwur', text: 'Er schwört beim Feuer seines Vaters: Bevor der Mond zweimal voll ist, kehrt er zurück.' },
  { id: 'hafen_abfahrt', titel: 'Hafen – Abfahrt', text: 'Hier löste er die Taue.' },
  { id: 'sturm_3', titel: 'Sturm – am Wrack', text: 'Er hält mit der Hand, die das Zepter trug, ein Stück vom Wrack.' },
  { id: 'sturm_ruf', titel: 'Sturm – er ruft ihren Namen', text: 'Er nennt Alkyones Namen und murmelt ihn in die Wellen.' },
  { id: 'sturm_stern', titel: 'Sturm – der Morgenstern', text: 'Der Morgenstern, sein Vater, verhüllt sein Gesicht.' },
  { id: 'sturm_welle', titel: 'Sturm – die Welle', text: 'Ein schwarzer Bogen aus Wasser bricht über ihm zusammen.' },
  { id: 'warten_gebet', titel: 'Warten – Gebet', text: 'Sie betet für einen, der nicht mehr lebt.' },
  { id: 'warten_weben', titel: 'Warten – Weben', text: 'Sie webt Kleider, die er tragen soll, wenn er heimkehrt.' },
  { id: 'warten_gebet_2', titel: 'Warten – im Tempel', text: 'Weihrauch bringt sie allen Göttern dar, doch Junos Tempel verehrt sie vor allen.' },
  { id: 'traum_1', titel: 'Traum – Ceyx erscheint', text: 'Im Traum steht Ceyx vor ihr, bleich und triefend: Er sei tot, der Südwind habe sein Schiff zerschlagen.' },
  { id: 'traum_greifen', titel: 'Traum – sie greift ins Leere', text: 'Im Schlaf sucht sie seinen Körper und umarmt nur Luft.' },
  { id: 'traum_fragen', titel: 'Traum – seine Botschaft', text: 'Kein Bote sei er – er selbst verkünde ihr sein Schicksal. Sie solle um ihn weinen.' },
  { id: 'traum_erwachen', titel: 'Traum – Erwachen', text: 'Nun ist es aus mit ihr, klagt Alkyone.' },
  { id: 'ufer_erinnerung_kuss', titel: 'Ufer – Erinnerung (Kuss)', text: 'Hier, erinnert sie sich, küsste er sie zum Abschied.' },
  { id: 'ufer_erinnerung_flehen', titel: 'Ufer – Erinnerung (Bitte)', text: 'Hier, erinnert sie sich, bat sie ihn zu bleiben.' },
  { id: 'ufer_nah', titel: 'Ufer – sie erkennt ihn', text: 'Da erkennt sie ihn: Er ist es.' },
  { id: 'mole_flug', titel: 'Mole – Flug', text: 'Sie streifte die Oberfläche der Wellen.' },
  { id: 'mole_zwei', titel: 'Mole – Verwandlung', text: 'Die Götter erbarmten sich: Auch Ceyx wurde ein Vogel.' },
  { id: 'finale_nest', titel: 'Finale – Eisvogeltage', text: 'Sieben stille Tage im Winter hält Äolus die Winde zurück.', auch: ['finale_nest_rot'] },
  { id: 'ende_ufer_1', titel: 'Anderes Ende (nur Original) – Name an Name', text: 'Wenigstens Name an Name will sie ihn berühren.' },
  { id: 'ende_ufer_2', titel: 'Anderes Ende (nur Original) – Schluss', text: 'Ovid erzählt es anders – doch auch hier blieb die Liebe.' },
];
