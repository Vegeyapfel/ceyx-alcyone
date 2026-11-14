// Spielernamen für die Klassenversion – nur Gestalten aus den 14 Texten, die die
// Klasse gelesen hat (Actaeon, Arachne, Cadmus, Ceyx und Alcyone, Daedalus und
// Ikarus, Erysichthon, Jupiter und Europa, Niobe, Orpheus und Eurydike, Perseus
// und Andromeda, Philemon und Baucis, Pluto und Proserpina, Pyramus und Thisbe,
// Somnus und Morpheus). Ceyx und Alcyone fehlen absichtlich – sie spielen die Hauptrollen.
// n = Name (lateinische Form), d = ein Satz dazu, b = Buch der Metamorphosen
export const NAMEN = [
  // Ceyx und Alcyone / Somnus und Morpheus (Buch XI)
  { n: 'Somnus', d: 'Gott des Schlafes in seiner stillen Grotte – er schickt Alcyone den Traum.', b: 'XI' },
  { n: 'Morpheus', d: 'Traumgott, der Menschen nachahmt – er erscheint Alcyone als Ceyx.', b: 'XI' },
  { n: 'Phobetor', d: 'Traumgott, der sich in Tiere verwandelt.', b: 'XI' },
  { n: 'Phantasos', d: 'Traumgott, der zu Erde, Stein, Wasser und Baum wird.', b: 'XI' },
  { n: 'Iris', d: 'Botin Junos auf dem Regenbogen – sie eilt zum Haus des Schlafes.', b: 'XI' },
  { n: 'Iuno', d: 'Göttin, an deren Altar Alcyone für ihren Mann betet.', b: 'XI' },
  { n: 'Aeolus', d: 'Herr der Winde – und Alcyones Vater.', b: 'XI' },
  { n: 'Lucifer', d: 'der Morgenstern, Vater des Ceyx.', b: 'XI' },
  // Actaeon (Buch III)
  { n: 'Actaeon', d: 'sieht Diana beim Baden und wird zum Hirsch, den die eigenen Hunde jagen.', b: 'III' },
  { n: 'Diana', d: 'Göttin der Jagd – sie verwandelt Actaeon in einen Hirsch.', b: 'III' },
  { n: 'Crocale', d: 'Nymphe Dianas, die ihr in der Grotte das Haar ordnet.', b: 'III' },
  { n: 'Phiale', d: 'Nymphe Dianas, die mit großen Krügen das Badewasser gießt.', b: 'III' },
  { n: 'Psecas', d: 'Nymphe Dianas, die beim Bad Wasser schöpft.', b: 'III' },
  { n: 'Hyale', d: 'Nymphe Dianas in der Grotte von Gargaphie.', b: 'III' },
  { n: 'Nephele', d: 'Nymphe Dianas in der Grotte von Gargaphie.', b: 'III' },
  { n: 'Melampus', d: 'Actaeons Hund – er schlägt als Erster an.', b: 'III' },
  // Cadmus (Buch III)
  { n: 'Cadmus', d: 'Sohn Agenors, tötet die Schlange und gründet Theben.', b: 'III' },
  { n: 'Echion', d: 'einer der Krieger, die aus den Drachenzähnen wachsen.', b: 'III' },
  { n: 'Agenor', d: 'König von Phönizien, Vater von Cadmus und Europa.', b: 'III' },
  // Jupiter und Europa (Buch II)
  { n: 'Europa', d: 'wird von Jupiter als Stier übers Meer entführt.', b: 'II' },
  { n: 'Iuppiter', d: 'Göttervater, der sich in einen Stier verwandelt.', b: 'II' },
  // Perseus und Andromeda / Pyramus und Thisbe (Buch IV)
  { n: 'Perseus', d: 'fliegt mit Flügelschuhen und befreit Andromeda vom Ungeheuer.', b: 'IV' },
  { n: 'Andromeda', d: 'an einen Felsen gekettet, von Perseus gerettet.', b: 'IV' },
  { n: 'Medusa', d: 'Gorgo, deren Haupt jeden zu Stein erstarren lässt.', b: 'IV' },
  { n: 'Cassiope', d: 'Andromedas Mutter, die mit ihrer Schönheit prahlte.', b: 'IV' },
  { n: 'Cepheus', d: 'König von Äthiopien, Vater der Andromeda.', b: 'IV' },
  { n: 'Pyramus', d: 'stirbt unter dem Maulbeerbaum, weil er Thisbe tot glaubt.', b: 'IV' },
  { n: 'Thisbe', d: 'folgt Pyramus in den Tod; die Maulbeeren färben sich dunkel.', b: 'IV' },
  { n: 'Semiramis', d: 'Königin, die Babylon mit Mauern aus Ziegeln umgab.', b: 'IV' },
  // Pluto und Proserpina (Buch V)
  { n: 'Pluto', d: 'Herr der Unterwelt, von Amors Pfeil getroffen.', b: 'V' },
  { n: 'Proserpina', d: 'wird beim Blumenpflücken in die Unterwelt entführt.', b: 'V' },
  { n: 'Ceres', d: 'sucht ihre Tochter Proserpina über die ganze Welt.', b: 'V' },
  { n: 'Cyane', d: 'Nymphe, die sich Pluto in den Weg stellt und zu Wasser zerfließt.', b: 'V' },
  { n: 'Arethusa', d: 'Quellnymphe, die Ceres verrät, wo ihre Tochter ist.', b: 'V' },
  // Arachne / Niobe (Buch VI)
  { n: 'Arachne', d: 'fordert Pallas im Weben heraus und wird zur Spinne.', b: 'VI' },
  { n: 'Pallas', d: 'Göttin der Webkunst, die mit Arachne um die Wette webt.', b: 'VI' },
  { n: 'Idmon', d: 'Arachnes Vater, ein Purpurfärber.', b: 'VI' },
  { n: 'Niobe', d: 'prahlt mit ihren Kindern und erstarrt zu weinendem Stein.', b: 'VI' },
  { n: 'Latona', d: 'Mutter von Apollo und Diana, von Niobe verhöhnt.', b: 'VI' },
  { n: 'Apollo', d: 'rächt seine Mutter Latona mit seinen Pfeilen.', b: 'VI' },
  { n: 'Tantalus', d: 'Niobes Vater, der an der Tafel der Götter speisen durfte.', b: 'VI' },
  { n: 'Amphion', d: 'Niobes Mann, der Thebens Mauern mit Saitenspiel baute.', b: 'VI' },
  { n: 'Manto', d: 'Seherin, die den Thebanerinnen Latonas Fest befiehlt.', b: 'VI' },
  { n: 'Ismenus', d: 'Niobes ältester Sohn, als Erster vom Pfeil getroffen.', b: 'VI' },
  { n: 'Sipylus', d: 'Niobes Sohn, der vergeblich vor den Pfeilen flieht.', b: 'VI' },
  // Daedalus und Ikarus / Erysichthon / Philemon und Baucis (Buch VIII)
  { n: 'Daedalus', d: 'baut Flügel aus Federn und Wachs.', b: 'VIII' },
  { n: 'Icarus', d: 'fliegt zu nah an die Sonne und stürzt ins Meer.', b: 'VIII' },
  { n: 'Minos', d: 'König von Kreta, der Daedalus nicht ziehen lässt.', b: 'VIII' },
  { n: 'Perdix', d: 'Daedalus’ begabter Neffe, der zum Rebhuhn wird.', b: 'VIII' },
  { n: 'Erysichthon', d: 'fällt den heiligen Baum der Ceres und frisst sich selbst auf.', b: 'VIII' },
  { n: 'Fames', d: 'der Hunger in Person, den Ceres zu Erysichthon schickt.', b: 'VIII' },
  { n: 'Philemon', d: 'bewirtet mit Baucis die Götter und wird zur Eiche.', b: 'VIII' },
  { n: 'Baucis', d: 'wird mit Philemon zum Baum – ein Paar für immer.', b: 'VIII' },
  { n: 'Mercurius', d: 'kommt mit Jupiter verkleidet zur Hütte von Philemon und Baucis.', b: 'VIII' },
  { n: 'Lelex', d: 'erzählt die Geschichte von Philemon und Baucis.', b: 'VIII' },
  // Orpheus und Eurydike (Buch X)
  { n: 'Orpheus', d: 'singt sich in die Unterwelt – und dreht sich zu früh um.', b: 'X' },
  { n: 'Eurydice', d: 'stirbt am Biss einer Schlange und muss zurück zu den Schatten.', b: 'X' },
  { n: 'Hymenaeus', d: 'Gott der Hochzeit, der bei Orpheus kein Glück bringt.', b: 'X' },
  { n: 'Olenos', d: 'nahm die Schuld seiner Frau auf sich und wurde zu Stein.', b: 'X' },
  { n: 'Lethaea', d: 'prahlte mit ihrer Schönheit und erstarrte mit Olenos zu Stein.', b: 'X' },
];

/** Römische Schreibweise für Inschriften: U wird zu V. */
export const roemisch = (s) => s.toUpperCase().replace(/U/g, 'V');

/** Zahl als römische Ziffer (1–3999). */
export function zahlRoemisch(n) {
  if (!n) return '–';
  const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = '';
  for (const [w, z] of t) while (n >= w) { r += z; n -= w; }
  return r;
}
