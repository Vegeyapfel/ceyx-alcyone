// Lenkung der Klassenversion: welche Möglichkeit soll die Klasse eher wählen?
// Gilt nur für klasse.html – das Original zeigt weiter die Texte aus story.json.
//   ziel  = gewünschte Möglichkeit (0 = I, 1 = II)
//   texte = angezeigte Formulierungen: die gewünschte warm und lebendig, die andere nüchtern
// Sanfte Mittel: Formulierung, ein Hauch Goldschimmer auf dem Handy, Gleichstand
// geht an die gewünschte Möglichkeit. Gezählt wird ehrlich.
// Szenen ohne Eintrag (Sturm, Traum) bleiben völlig frei.
export const TAKTIK = {
  hafen_rede: {
    ziel: 1,
    texte: ['Sie bittet ihn zu bleiben', 'Sie küsst ihn ein letztes Mal – und lässt ihn ziehen'],
  },
  warten_1: {
    ziel: 0,
    texte: ['Sie betet zu Juno, dass er heimkehrt', 'Sie webt an einem Gewand'],
  },
  // ufer_nah: keine Abstimmung mehr – die Klassenversion geht immer zur Mole (tools/klasse_bauen.mjs)
};
