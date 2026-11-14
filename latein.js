// Lateinische Textbezüge der Klassenversion.
// Quelle ausschließlich die beiden Unterrichtstexte zu Met. XI:
//   „Ceyx und Alcyone" (Met. 11, 559–748) und „Somnus und Morpheus" (Met. 11, 559–668).
// la = Wortlaut aus dem Text, v = Verse, de = Übersetzung wörtlich aus dem Text
// („…" markiert, wo ein Satz im Text weitergeht). Wo der Text keine Übersetzung
// bietet (Mole und Flug), stehen nur die Vokabelhilfen aus dem Text oder gar nichts.
// Geprüft mit einem Skript gegen beide PDFs: Latein, Übersetzung und Verszahl.

/** Kapitelkarten: ersetzen in der Klassenversion die Verse aus story.json. */
export const KAPITEL = {
  hafen_1: { la: 'maesta locum repetit, de quo spectarat euntem', v: '711', de: '… dort sucht sie traurig den Ort auf, wo sie ihm nachblickte, als er davonfuhr.' },
  sturm_1: { la: 'ecce super medios fluctus niger arcus aquarum frangitur', v: '568–569', de: 'Sieh, über dem Wasser zerbirst ein schwarzes Gewölbe aus Wogen …' },
  warten_1: { la: 'Aeolis interea, tantorum ignara malorum, dinumerat noctes', v: '573–574', de: 'Äolus’ Tochter, welche nichts von dem schrecklichen Unglück weiß, zählt indessen die Nächte …' },
  traum_1: { la: 'agnoscis Ceyca, miserrima coniunx …', v: '658', de: 'Erkennst du Ceyx, du ärmste Gemahlin?' },
  ufer_1: { la: 'Mane erat.', v: '710', de: 'Es war Morgen.' },
  mole_1: { la: 'fatis obnoxius isdem tunc quoque mansit amor', v: '742–743', de: 'Demselben Schicksal verfallen, blieb ihre Liebe auch jetzt …' },
  ende_ufer_1: { la: 'si non ossibus ossa meis, at nomen nomine tangam', v: '706–707', de: 'Berührt auch nicht mit Gebein sich Gebein, so doch mit dem Namen der Name.' },
};

/** Texttafeln: erscheinen oben im Bild, solange die Szene läuft. */
export const TAFELN = {
  hafen_rede: { la: 'et ne me fugiens ventos sequerere rogabam', v: '695', de: '… deshalb bat ich, du solltest nicht fliehen und den Winden nicht folgen.' },
  hafen_flehen: { la: 'at certe vellem, quoniam periturus abibas, me quoque duxisses', v: '696–697', de: 'Da du nun mal in den Tod gingst, wollte ich wenigstens, auch mich hättest du mitgenommen!' },
  hafen_kuss: { la: 'hoc mihi discedens dedit oscula litore', v: '713', de: '… an diesem Strand, da gab er mir zum Abschied Küsse.' },
  hafen_abfahrt: { la: 'hic retinacula solvit', v: '712', de: 'Hier band er die Taue los …' },
  sturm_2: { la: 'alii partes et membra carinae trunca tenent', v: '559–560', de: 'Andere klammern sich an Teile und Planken des Schiffes …' },
  sturm_3: { la: 'tenet ipse manu, qua sceptra solebat, fragmina navigii Ceyx', v: '560–561', de: '… selbst Ceyx, in der Hand, die sonst das Szepter hielt, hält er nun Trümmer des Schiffs …' },
  sturm_ruf: { la: 'dum natat, absentem, quotiens sinit hiscere fluctus, nominat Alcyonen ipsisque inmurmurat undis', v: '566–567', de: '… er nennt, so oft die Flut ihm den Mund zu öffnen erlaubt, den Namen der fernen Alkyone, murmelt ihn auch in die Wellen.' },
  sturm_stern: { la: 'Lucifer obscurus nec quem cognoscere posses illa luce fuit', v: '570–571', de: 'Lucifer war verdüstert an jenem Tag, und man hätte ihn auch nicht erkennen können …' },
  sturm_welle: { la: 'rupta mersum caput obruit unda', v: '569', de: '… stürzt sich auf seinen Kopf und versenkt ihn tief in den Wellen.' },
  warten_gebet: { la: 'proque viro, qui nullus erat, veniebat ad aras', v: '579', de: '… trat für ihren Mann, der doch nicht mehr war, zum Altar hin …' },
  warten_weben: { la: 'iam, quas induat ille, festinat vestes', v: '574–575', de: '… bald sorgt sie voll Eifer für Kleider, welche Ceyx tragen soll …' },
  warten_gebet_2: { la: 'omnibus illa quidem superis pia tura ferebat, ante tamen cunctos Iunonis templa colebat', v: '577–578', de: 'Weihrauch brachte sie fromm zwar allen Göttern dar, doch Junos Tempel verehrte sie vor allen anderen …' },
  traum_1: { la: 'luridus, exanimi similis, sine vestibus ullis, coniugis ante torum miserae stetit: uda videtur barba viri, madidisque gravis fluere unda capillis', v: '654–656', de: '… tritt nun in dieser bleich, einem Entseelten gleich und gänzlich ohne Gewand vors Bett der armen Gemahlin. Der Bart des Mannes, man sieht es, ist feucht, und es fließen schwere Tropfen herab aus den Haaren.', quelle: 'Somnus und Morpheus' },
  traum_greifen: { la: 'motatque lacertos per somnum corpusque petens amplectitur auras', v: '674–675', de: '… bewegt noch im Schlaf die Arme, greift nach dem Körper, umarmt doch nur Luft …' },
  traum_fragen: { la: 'ipse ego fata tibi praesens mea naufragus edo', v: '668', de: 'Ich selbst bin hier und informiere als Opfer des Schiffbruchs mein Schicksal.' },
  traum_erwachen: { la: "'nulla est Alcyone, nulla est' ait. 'occidit una cum Ceyce suo.'", v: '684–685', de: 'Aus ist es mit Alkyone, aus ist es, zusammen mit ihrem Ceyx kam sie um.' },
  ufer_1: { la: 'egreditur tectis ad litus', v: '710', de: 'Sie geht vom Hause zum Strand …' },
  ufer_erinnerung_kuss: { la: 'hoc mihi discedens dedit oscula litore', v: '713', de: '… an diesem Strand, da gab er mir zum Abschied Küsse.' },
  ufer_erinnerung_flehen: { la: 'et ne me fugiens ventos sequerere rogabam', v: '695', de: '… deshalb bat ich, du solltest nicht fliehen und den Winden nicht folgen.' },
  ufer_koerper: { la: 'in liquida, spatio distante, tuetur nescio quid quasi corpus aqua', v: '715–716', de: '… da erblickt sie entfernt in dem klaren Wasser ein Etwas, das einem Körper gleichsieht.' },
  ufer_nah: { la: "erat coniunx! 'ille est!' exclamat", v: '725', de: 'Es war ihr Mann. »Er ist es!« schreit sie …' },
  mole_1: { la: 'adiacet undis facta manu moles, quae primas aequoris iras frangit', v: '728–730', glossen: ['facta manu: von Menschen errichtet', 'aequoris ira: das Wüten der Wellen'] },
  mole_sprung: { la: 'insilit huc, mirumque fuit potuisse: volabat', v: '731' },
  mole_flug: { la: 'stringebat summas ales miserabilis undas', v: '733' },
  mole_zwei: { la: 'et tandem, superis miserantibus, ambo alite mutantur', v: '741–742', de: 'Und die Götter erbarmen sich endlich, und beide werden in Vögel verwandelt.' },
  finale_nest: { la: 'perque dies placidos hiberno tempore septem incubat Alcyone pendentibus aequore nidis', v: '745–746', de: 'Während der Winterszeit brütet Alcyone sieben freundliche Tage im Nest, das über dem Meer hängt.' },
  finale_nest_rot: { la: 'perque dies placidos hiberno tempore septem incubat Alcyone pendentibus aequore nidis', v: '745–746', de: 'Während der Winterszeit brütet Alcyone sieben freundliche Tage im Nest, das über dem Meer hängt.' },
  ende_ufer_2: { la: 'plura dolor prohibet', v: '708', de: 'Weiteres zu sagen verwehrt ihr der Schmerz …' },
};

/**
 * Untertitel unten = genau das, was der Sprecher sagt (abgehört).
 * Das Latein steht in der Klassenversion auf der Tafel oben, daher hier nur Deutsch.
 */
export const GESPROCHEN = {
  hafen_kuss: 'An diesem Ufer küsste er sie zum Abschied.',
  hafen_abfahrt: 'Hier löste er die Taue.',
  sturm_ruf: 'Er nennt Alkyones Namen und murmelt ihn in die Wellen.',
  sturm_stern: 'Der Morgenstern, sein Vater, verhüllt sein Gesicht.',
  sturm_welle: 'Ein schwarzer Bogen aus Wasser bricht über ihm zusammen.',
  traum_greifen: 'Im Schlaf sucht sie seinen Körper und umarmt nur Luft.',
  traum_erwachen: 'Nun ist es aus mit ihr, klagt Alkyone.',
  ufer_nah: 'Da erkennt sie ihn: Er ist es.',
  ende_ufer_1: 'Wenigstens Name an Name will sie ihn berühren.',
  mole_flug: 'Sie streifte die Oberfläche der Wellen.',
};
