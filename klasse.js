// Klassenversion: läuft neben dem unveränderten player.js.
// Startbild: Einladung mit QR-Code. Bei jeder Entscheidung stimmen die Handys
// 5 Sekunden ab; statt der Knöpfe zeigt der Fernseher eine Waage, deren Perle
// zur Mehrheit gleitet. Danach klickt dieses Skript selbst die Mehrheit an.
// Ohne Handys oder ohne Stimme bleibt alles wie im Original (Klick, Taste 1/2).

import { kanal, neuerCode, LOKAL } from './kanal.js';

const $ = (s, el = document) => el.querySelector(s);
const RUNDE_MS = 5000;     // Abstimmzeit
const NACHFRIST = 700;     // Stimmen, die noch unterwegs waren
const ZEIGEN_MS = 1700;    // so lange steht das Ergebnis, bevor der Film weiterläuft
const ROEMISCH = ['I', 'II', 'III', 'IV'];

// ---------- Raum ----------
let code = '';
try { code = sessionStorage.getItem('ceyx_raum') || ''; } catch { /* privat */ }
if (!/^[A-Z2-9]{6}$/.test(code)) {
  code = neuerCode();
  try { sessionStorage.setItem('ceyx_raum', code); } catch { /* egal */ }
}
const handys = new Set();
let runde = null;
const verbindung = kanal(code, empfang);
setTimeout(() => verbindung.senden({ t: 'hallo' }), 1500);   // nach Neuladen melden sich Handys neu

const link = new URL('waehlen.html', location.href);
link.search = `?r=${code}${LOKAL ? '&lokal=1' : ''}`;
const codeHtml = `${code.slice(0, 3)}<span class="k-luft"></span>${code.slice(3)}`;

// ---------- QR-Code auf einer römischen Inschriftentafel (tabula ansata) ----------
// Der Code selbst bleibt ein ganz normaler QR-Code mit eckigen Modulen; römisch
// ist nur die Tafel drumherum: Griffe links und rechts, doppelte Randlinie,
// Inschrift in Kapitalen: SVFFRAGIA · FERTE („Gebt eure Stimmen ab").
function qrSvg(text, mitInschrift = true) {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const rand = 4;                         // heller Rand um den Code (Ruhezone)
  const oben = mitInschrift ? 6.5 : 0;    // Platz für die Inschrift
  const bw = n + rand * 2;                // Tafel ohne Griffe
  const bh = n + rand * 2 + oben;
  const ohr = 7;                          // Breite eines Griffs
  const W = bw + ohr * 2;
  const x0 = ohr;
  let pfad = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (q.isDark(r, c)) pfad += `M${x0 + rand + c} ${oben + rand + r}h1v1h-1z`;
  }
  const cy = bh / 2;
  const griff = (aussen, innen) => `<polygon points="${innen},${cy} ${aussen},${cy - bh * 0.32} ${aussen},${cy + bh * 0.32}" class="k-stein"/>`
    + `<polygon points="${innen},${cy} ${aussen},${cy - bh * 0.32} ${aussen},${cy + bh * 0.32}" class="k-linie k-fein"/>`
    + `<circle cx="${aussen + (innen - aussen) * 0.34}" cy="${cy}" r=".85" class="k-loch"/>`;
  return `<svg viewBox="0 0 ${W} ${bh}" role="img" aria-label="QR-Code zum Mitentscheiden">
    <defs><linearGradient id="k-marmor" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4ecda"/><stop offset=".55" stop-color="#ebe1ca"/><stop offset="1" stop-color="#ddd0b3"/>
    </linearGradient></defs>
    ${griff(0.3, x0 + 0.01)}${griff(W - 0.3, x0 + bw - 0.01)}
    <rect x="${x0}" y="0" width="${bw}" height="${bh}" class="k-stein"/>
    <rect x="${x0 + 1}" y="1" width="${bw - 2}" height="${bh - 2}" class="k-linie"/>
    <rect x="${x0 + 1.6}" y="1.6" width="${bw - 3.2}" height="${bh - 3.2}" class="k-linie k-fein"/>
    ${mitInschrift ? `<text x="${W / 2}" y="${oben + 0.9}" class="k-inschrift">SVFFRAGIA · FERTE</text>` : ''}
    <path d="${pfad}" class="k-modul" shape-rendering="crispEdges"/></svg>`;
}
const qr = qrSvg(link.href);

// ---------- Einladung auf dem Startbild ----------
const titel = $('#title');
const hinweis = $('.hint', titel);
if (hinweis) hinweis.textContent = 'Eure Entscheidungen verändern den Film';

const einladung = document.createElement('div');
einladung.id = 'k-einladung';
einladung.innerHTML = `
  <div class="k-qr">${qr}</div>
  <div class="k-haar" aria-hidden="true"></div>
  <div class="k-text">
    <p class="k-ruf">Entscheidet mit.</p>
    <p class="k-weg">Kamera auf den Code richten – oder <span class="k-adresse"></span> öffnen und eingeben:</p>
    <p class="k-code">${codeHtml}</p>
    <p class="k-dabei"><span class="k-punkte" aria-hidden="true"></span><span class="k-zahl">Noch niemand dabei</span></p>
  </div>`;
titel.append(einladung);
$('.k-adresse', einladung).textContent = `${link.host}${link.pathname.replace(/\/waehlen\.html$/, '/waehlen')}`;

// Kleiner Code in der Ecke, solange abgestimmt wird – für Nachzügler
const ecke = document.createElement('div');
ecke.id = 'k-ecke';
ecke.innerHTML = `<div class="k-qr">${qrSvg(link.href, false)}</div><p class="k-code">${codeHtml}</p>`;
$('#stage').append(ecke);

function dabei() {
  const n = handys.size;
  $('.k-zahl', einladung).textContent = n === 0 ? 'Noch niemand dabei' : n === 1 ? '1 ist dabei' : `${n} sind dabei`;
  const punkte = $('.k-punkte', einladung);
  while (punkte.children.length < Math.min(n, 36)) {
    const p = document.createElement('i');
    punkte.append(p);
  }
}

// ---------- Waage für die Abstimmung ----------
const waage = document.createElement('div');
waage.id = 'k-wahl';
waage.innerHTML = `
  <p class="k-frage"></p>
  <div class="k-zeit"><i></i></div>
  <div class="k-seiten"></div>
  <div class="k-balken"><i class="k-fuell"></i><i class="k-perle"></i></div>
  <p class="k-stand">Noch keine Stimme</p>`;
$('#stage').append(waage);

// ---------- Nachrichten von den Handys ----------
function empfang(m) {
  if (!m || typeof m.id !== 'string') return;
  if ((m.t === 'da' || m.t === 'stimme') && !handys.has(m.id)) { handys.add(m.id); dabei(); }
  if (m.t === 'da' && runde && runde.frist && !runde.entschieden) verbindung.senden(frageNachricht());
  if (m.t === 'stimme' && runde && runde.frist && m.n === runde.n && !runde.entschieden
      && Date.now() <= runde.frist + NACHFRIST
      && Number.isInteger(m.i) && m.i >= 0 && m.i < runde.texte.length) {
    const vorher = runde.stimmen.get(m.id);
    runde.stimmen.set(m.id, m.i);
    if (vorher !== m.i) funke(m.i);
    neuZaehlen();
  }
}

// ---------- Ablauf einer Entscheidung ----------
const wahl = $('#choice');
const ende = $('#end');
const sichtbar = (el) => !el.classList.contains('hidden');
const beobachte = (el, f) => new MutationObserver(f).observe(el, { attributes: true, attributeFilter: ['class'] });

beobachte(wahl, () => {
  if (sichtbar(wahl) && !runde) starten();
  else if (!sichtbar(wahl) && runde) aufraeumen();
});
beobachte(ende, () => { if (sichtbar(ende)) verbindung.senden({ t: 'ende' }); });
$('#again').addEventListener('click', () => verbindung.senden({ t: 'warten' }));

const beschriftung = (b) => b.lastChild.textContent.trim();
const frageNachricht = () => ({
  t: 'frage', n: runde.n, q: runde.frage, o: runde.texte,
  ms: Math.max(0, runde.frist - Date.now()), ts: Date.now(),
});

function starten() {
  const knoepfe = [...wahl.querySelectorAll('.options button')];
  if (knoepfe.length < 2) return;
  runde = {
    n: Date.now(), frage: $('.question', wahl).textContent, knoepfe,
    texte: knoepfe.map(beschriftung), stimmen: new Map(),
    frist: 0, zeitgeber: 0, entschieden: false,
    anteil: 0.5, ziel: 0.5, zahlen: knoepfe.map(() => 0), anzeige: knoepfe.map(() => 0),
  };
  // Vorne selbst klicken entscheidet sofort – wie im Original
  knoepfe.forEach((b, i) => b.addEventListener('click', () => verkuenden(i), { capture: true, once: true }));

  if (handys.size === 0) return;   // keine Handys: Original-Verhalten

  // Waage aufbauen
  $('.k-frage', waage).textContent = runde.frage;
  $('.k-seiten', waage).innerHTML = runde.texte.map((t, i) => `
    <div class="k-seite" data-i="${i}">
      <span class="k-roem">${ROEMISCH[i] || i + 1}</span>
      <span class="k-option"></span>
      <span class="k-prozent"><b>0</b><small>%</small></span>
    </div>`).join('');
  [...waage.querySelectorAll('.k-option')].forEach((el, i) => { el.textContent = runde.texte[i]; });
  waage.classList.toggle('k-zwei', runde.texte.length === 2);
  waage.classList.remove('k-fertig', 'k-leer');
  $('.k-stand', waage).textContent = 'Noch keine Stimme';
  setzeWaage(0.5, true);

  // Zeitlinie: läuft per CSS-Übergang, also auch ohne JavaScript-Bildtakt flüssig
  const zeit = $('.k-zeit i', waage);
  zeit.style.transition = 'none';
  zeit.style.transform = 'scaleX(1)';
  void zeit.offsetWidth;
  zeit.style.transition = `transform ${RUNDE_MS}ms linear`;
  zeit.style.transform = 'scaleX(0)';

  wahl.classList.add('k-aktiv');
  document.body.classList.add('k-stimmt');
  void waage.offsetWidth;
  waage.classList.add('k-an');

  runde.frist = Date.now() + RUNDE_MS;
  verbindung.senden(frageNachricht());
  const diese = runde;
  runde.zeitgeber = setTimeout(() => runde === diese && auswerten(), RUNDE_MS + NACHFRIST);
  bewegen();
}

function neuZaehlen() {
  const z = runde.texte.map(() => 0);
  for (const i of runde.stimmen.values()) z[i]++;
  runde.zahlen = z;
  const gesamt = runde.stimmen.size;
  if (runde.texte.length === 2 && gesamt) runde.ziel = z[1] / gesamt;   // 0 = ganz bei I (links), 1 = ganz bei II (rechts)
  $('.k-stand', waage).textContent = gesamt === 1 ? '1 Stimme' : `${gesamt} Stimmen`;
  waage.classList.toggle('k-hat', gesamt > 0);
}

// Weiche Bewegung: Perle und Prozentzahlen gleiten zum neuen Stand
function bewegen() {
  const r = runde;
  if (!r || r.entschieden && !waage.classList.contains('k-an')) return;
  r.anteil += (r.ziel - r.anteil) * 0.12;
  setzeWaage(r.anteil);
  const gesamt = Math.max(1, r.stimmen.size);
  const prozente = [...waage.querySelectorAll('.k-prozent b')];
  r.zahlen.forEach((z, i) => {
    const soll = r.stimmen.size ? (100 * z) / gesamt : 0;
    r.anzeige[i] += (soll - r.anzeige[i]) * 0.14;
    if (prozente[i]) prozente[i].textContent = Math.round(r.anzeige[i]);
  });
  r.takt = requestAnimationFrame(bewegen);
}

function setzeWaage(anteil, sofort) {
  const fuell = $('.k-fuell', waage);
  const perle = $('.k-perle', waage);
  if (sofort) { fuell.style.transition = perle.style.transition = 'none'; }
  fuell.style.left = `${Math.min(0.5, anteil) * 100}%`;
  fuell.style.width = `${Math.abs(anteil - 0.5) * 100}%`;
  perle.style.left = `${anteil * 100}%`;
  if (sofort) { void fuell.offsetWidth; fuell.style.transition = perle.style.transition = ''; }
}

// Goldfunke: jede neue Stimme fliegt zu ihrer Seite
function funke(i) {
  const ziel = waage.querySelectorAll('.k-prozent')[i];
  if (!ziel || !waage.classList.contains('k-an')) return;
  const z = ziel.getBoundingClientRect();
  const b = waage.getBoundingClientRect();
  const x0 = b.left + b.width * (0.35 + Math.random() * 0.3);
  const y0 = innerHeight + 10;
  const x1 = z.left + z.width / 2;
  const y1 = z.top + z.height / 2;
  const f = document.createElement('i');
  f.className = 'k-funke';
  document.body.append(f);
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * 120;
  const my = Math.min(y0, y1) - 60 - Math.random() * 80;
  const a = f.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(.4)`, opacity: 0 },
    { transform: `translate(${mx}px, ${my}px) scale(1)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${x1}px, ${y1}px) scale(.6)`, opacity: 0.9, offset: 0.92 },
    { transform: `translate(${x1}px, ${y1}px) scale(2.2)`, opacity: 0 },
  ], { duration: 950 + Math.random() * 250, easing: 'cubic-bezier(.25,.6,.3,1)' });
  a.onfinish = () => {
    f.remove();
    ziel.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }],
      { duration: 380, easing: 'ease-out' });
  };
}

function auswerten() {
  if (!runde || runde.entschieden) return;
  const r = runde;
  if (r.stimmen.size === 0) {
    // Niemand hat gestimmt: Waage weg, Original-Knöpfe für vorne
    waage.classList.add('k-leer');
    waage.classList.remove('k-an');
    wahl.classList.remove('k-aktiv');
    wahl.classList.add('k-keine');
    document.body.classList.remove('k-stimmt');
    return;
  }
  const max = Math.max(...r.zahlen);
  const vorn = r.zahlen.flatMap((z, i) => (z === max ? [i] : []));
  const sieger = vorn[Math.floor(Math.random() * vorn.length)];
  waage.querySelectorAll('.k-seite').forEach((s, i) => s.classList.add(i === sieger ? 'k-sieger' : 'k-verlierer'));
  waage.classList.add('k-fertig');
  $('.k-stand', waage).textContent = vorn.length > 1 ? 'Gleichstand – das Los hat entschieden' : 'Die Klasse hat entschieden';
  verkuenden(sieger);
  const knopf = r.knoepfe[sieger];
  setTimeout(() => {
    waage.classList.remove('k-an');
    document.body.classList.remove('k-stimmt');
    setTimeout(() => knopf.click(), 450);
  }, ZEIGEN_MS);
}

function verkuenden(i) {
  if (!runde || runde.entschieden) return;
  runde.entschieden = true;
  clearTimeout(runde.zeitgeber);
  if (runde.frist) verbindung.senden({ t: 'zu', n: runde.n, w: i, o: runde.texte });
}

function aufraeumen() {
  const r = runde;
  runde = null;
  clearTimeout(r.zeitgeber);
  cancelAnimationFrame(r.takt);
  // Per Taste vorne entschieden? Dann die Handys trotzdem zurücksetzen
  if (r.frist && !r.entschieden) verbindung.senden({ t: 'zu', n: r.n, w: -1, o: r.texte });
  waage.classList.remove('k-an');
  document.body.classList.remove('k-stimmt');
  setTimeout(() => wahl.classList.remove('k-aktiv', 'k-keine'), 900);
}
