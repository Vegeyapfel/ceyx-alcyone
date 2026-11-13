// Klassenversion: läuft neben player_klasse.js (aus player.js erzeugt).
// – Startbild als Lobby: QR-Tafel, Code, Publikum mit Namen aus den Metamorphosen
//   (jedes Handy dreht sein Glücksrad; der Fernseher vergibt jeden Namen nur einmal)
// – Abstimmung als Waage: 5 Sekunden, Perle gleitet zur Mehrheit, Funken mit Namen
// – Steuerleiste im Film: vorige Szene, Szene von vorn, Pause
// Ohne Handys oder ohne Stimme bleibt alles wie im Original (Klick, Taste 1/2).

import { kanal, neuerCode, LOKAL, DIENST, STANDARD } from './kanal.js';
import { NAMEN, roemisch, zahlRoemisch } from './namen.js';
import { TAKTIK } from './taktik.js';

const $ = (s, el = document) => el.querySelector(s);
const RUNDE_MS = 5000;     // Abstimmzeit
const NACHFRIST = 700;     // Stimmen, die noch unterwegs waren
const ZEIGEN_MS = 1700;    // so lange steht das Ergebnis, bevor der Film weiterläuft
const DREH_MS = 5000;      // so lange dreht das Glücksrad auf dem Handy, bis der Name vorne erscheint
const ROEM = ['I', 'II', 'III', 'IV'];
const MACHER = 'Ein Film von Max, Henri und Julian';

// ---------- Raum und Namen ----------
const merke = (k, v) => { try { sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch { /* privat */ } };
const lies = (k) => { try { return sessionStorage.getItem(k); } catch { return null; } };

let code = lies('ceyx_raum') || '';
if (!/^[A-Z2-9]{6}$/.test(code)) { code = neuerCode(); merke('ceyx_raum', code); }

/** Kennung des Handys → Spielername. Bleibt beim Neuladen der Seite erhalten. */
let vergeben = {};
try { vergeben = JSON.parse(lies(`ceyx_namen_${code}`) || '{}'); } catch { vergeben = {}; }
const handys = new Set(Object.keys(vergeben));
let runde = null;

function nameFuer(id) {
  if (vergeben[id]) return vergeben[id];
  const belegt = new Set(Object.values(vergeben));
  const frei = NAMEN.map((x) => x.n).filter((n) => !belegt.has(n));
  let name;
  if (frei.length) name = frei[Math.floor(Math.random() * frei.length)];
  else {
    // Mehr Handys als Namen: zweite Runde mit römischer Zahl
    const k = Object.keys(vergeben).length;
    name = `${NAMEN[k % NAMEN.length].n} ${zahlRoemisch(2 + Math.floor(k / NAMEN.length) - 1)}`;
  }
  vergeben[id] = name;
  merke(`ceyx_namen_${code}`, vergeben);
  return name;
}

const verbindung = kanal(code, empfang);
let namenUhr = 0;
/** Namen gebündelt verschicken – spart Nachrichten, wenn viele gleichzeitig beitreten. */
function namenSenden() {
  clearTimeout(namenUhr);
  namenUhr = setTimeout(() => verbindung.senden({ t: 'namen', m: vergeben }), 350);
}
setTimeout(() => verbindung.senden({ t: 'hallo' }), 1500);   // nach Neuladen melden sich Handys neu

const link = new URL('waehlen.html', location.href);
link.search = `?r=${code}${LOKAL ? '&lokal=1' : ''}${DIENST !== STANDARD && !LOKAL ? `&dienst=${DIENST}` : ''}`;
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
  const rand = 4;
  const oben = mitInschrift ? 6.5 : 0;
  const bw = n + rand * 2;
  const bh = n + rand * 2 + oben;
  const ohr = 7;
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

// ---------- Startbild als Lobby ----------
const titel = $('#title');
const startKnopf = $('#start');
const hinweis = $('.hint', titel);
if (hinweis) hinweis.textContent = 'Eure Entscheidungen verändern den Film';
titel.classList.add('k-lobby-an');

const macher = document.createElement('p');
macher.className = 'k-macher';
macher.textContent = MACHER;
$('.sub', titel).after(macher);

const lobby = document.createElement('div');
lobby.id = 'k-lobby';
lobby.innerHTML = `
  <div class="k-eintritt">
    <div class="k-qr">${qrSvg(link.href)}</div>
    <div class="k-text">
      <p class="k-ruf">Entscheidet mit.</p>
      <p class="k-weg">Kamera auf den Code richten – oder <span class="k-adresse"></span> öffnen und eingeben:</p>
      <p class="k-code">${codeHtml}</p>
    </div>
  </div>
  <div class="k-haar" aria-hidden="true"></div>
  <div class="k-publikum">
    <div class="k-kopf">
      <span class="k-roemzahl">–</span>
      <span class="k-kopftext"><span class="k-spect">Spectatores</span><span class="k-zahl">Noch niemand dabei</span></span>
    </div>
    <p class="k-rolle" aria-live="polite"></p>
  </div>`;
macher.after(lobby);
lobby.after(hinweis || document.createComment(''));
(hinweis || lobby).after(startKnopf);
$('.k-adresse', lobby).textContent = `${link.host}${link.pathname.replace(/\/waehlen\.html$/, '/waehlen')}`;

const rolle = $('.k-rolle', lobby);
const kachel = new Map();     // id → Element in der Liste

function namensKachel(id, sofort) {
  if (kachel.has(id)) return;
  const el = document.createElement('span');
  el.className = 'k-person k-dreht';
  el.innerHTML = '<i></i><i></i><i></i>';
  rolle.append(el);
  kachel.set(id, el);
  const zeigen = () => {
    el.className = 'k-person k-neu';
    el.textContent = roemisch(vergeben[id] || '');
    setTimeout(() => el.classList.remove('k-neu'), 2400);
  };
  if (sofort) zeigen(); else setTimeout(zeigen, DREH_MS);
}

function zaehlen() {
  const n = handys.size;
  $('.k-roemzahl', lobby).textContent = zahlRoemisch(n);
  $('.k-zahl', lobby).textContent = n === 0 ? 'Noch niemand dabei' : n === 1 ? '1 ist dabei' : `${n} sind dabei`;
  const z = $('.k-roemzahl', lobby);
  z.classList.remove('k-puls'); void z.offsetWidth; z.classList.add('k-puls');
}
// Schon bekannte Handys (nach Neuladen) gleich zeigen
for (const id of Object.keys(vergeben)) namensKachel(id, true);
zaehlen();

// Credits auch auf dem Endbild
const endMacher = macher.cloneNode(true);
$('#end .path').after(endMacher);

// Kleiner Code in der Ecke, solange abgestimmt wird – für Nachzügler
const ecke = document.createElement('div');
ecke.id = 'k-ecke';
ecke.innerHTML = `<div class="k-qr">${qrSvg(link.href, false)}</div><p class="k-code">${codeHtml}</p>`;
$('#stage').append(ecke);

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
  if (!m || typeof m.id !== 'string' || m.id.length > 40) return;
  if (m.t === 'da' || m.t === 'stimme') {
    const neu = !vergeben[m.id];
    nameFuer(m.id);
    if (!handys.has(m.id)) { handys.add(m.id); zaehlen(); }
    namensKachel(m.id, !neu);
    if (m.t === 'da') namenSenden();
  }
  if (m.t === 'da' && runde && runde.frist && !runde.entschieden) verbindung.senden(frageNachricht());
  if (m.t === 'stimme' && runde && runde.frist && m.n === runde.n && !runde.entschieden
      && Date.now() <= runde.frist + NACHFRIST
      && Number.isInteger(m.i) && m.i >= 0 && m.i < runde.texte.length) {
    const vorher = runde.stimmen.get(m.id);
    runde.stimmen.set(m.id, m.i);
    if (vorher !== m.i) funke(m.i, vergeben[m.id]);
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
beobachte(ende, () => { if (sichtbar(ende)) verbindung.senden({ t: 'ende' }); lage(); });
beobachte(titel, () => lage());
$('#again').addEventListener('click', () => verbindung.senden({ t: 'warten' }));

const beschriftung = (b) => b.lastChild.textContent.trim();
const frageNachricht = () => ({
  t: 'frage', n: runde.n, q: runde.frage, o: runde.texte, z: runde.ziel,
  ms: Math.max(0, runde.frist - Date.now()), ts: Date.now(),
});

function starten() {
  const knoepfe = [...wahl.querySelectorAll('.options button')];
  if (knoepfe.length < 2) return;
  runde = {
    n: Date.now(), frage: $('.question', wahl).textContent, knoepfe,
    texte: knoepfe.map(beschriftung), stimmen: new Map(), ziel: -1,
    frist: 0, zeitgeber: 0, entschieden: false,
    anteil: 0.5, ziel: 0.5, zahlen: knoepfe.map(() => 0), anzeige: knoepfe.map(() => 0),
  };
  // Lenkung (taktik.js): andere Formulierung, gewünschte Möglichkeit merken
  const t = TAKTIK[window.__film && window.__film.szene];
  if (t && Array.isArray(t.texte) && t.texte.length === knoepfe.length) runde.texte = [...t.texte];
  if (t && Number.isInteger(t.ziel) && t.ziel >= 0 && t.ziel < knoepfe.length) runde.ziel = t.ziel;

  // Vorne selbst klicken entscheidet sofort – wie im Original
  knoepfe.forEach((b, i) => b.addEventListener('click', () => verkuenden(i), { capture: true, once: true }));

  if (handys.size === 0) return;   // keine Handys: Original-Verhalten

  $('.k-frage', waage).textContent = runde.frage;
  $('.k-seiten', waage).innerHTML = runde.texte.map((t, i) => `
    <div class="k-seite${i === runde.ziel ? ' k-warm' : ''}" data-i="${i}">
      <span class="k-roem">${ROEM[i] || i + 1}</span>
      <span class="k-option"></span>
      <span class="k-prozent"><b>0</b><small>%</small></span>
    </div>`).join('');
  [...waage.querySelectorAll('.k-option')].forEach((el, i) => { el.textContent = runde.texte[i]; });
  waage.classList.toggle('k-zwei', runde.texte.length === 2);
  waage.classList.remove('k-fertig', 'k-leer', 'k-hat');
  $('.k-stand', waage).textContent = 'Noch keine Stimme';
  setzeWaage(0.5, true);

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
  if (!r || (r.entschieden && !waage.classList.contains('k-an'))) return;
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

// Goldfunke mit Namen: jede neue Stimme fliegt zu ihrer Seite
function funke(i, name) {
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
  if (name) { const s = document.createElement('span'); s.textContent = name; f.append(s); }
  document.body.append(f);
  const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * 120;
  const my = Math.min(y0, y1) - 60 - Math.random() * 80;
  const a = f.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(.4)`, opacity: 0 },
    { transform: `translate(${mx}px, ${my}px) scale(1)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${x1}px, ${y1}px) scale(.6)`, opacity: 0.9, offset: 0.92 },
    { transform: `translate(${x1}px, ${y1}px) scale(2.2)`, opacity: 0 },
  ], { duration: 1100 + Math.random() * 300, easing: 'cubic-bezier(.25,.6,.3,1)' });
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
    waage.classList.add('k-leer');
    waage.classList.remove('k-an');
    wahl.classList.remove('k-aktiv');
    wahl.classList.add('k-keine');
    document.body.classList.remove('k-stimmt');
    lage();
    return;
  }
  const max = Math.max(...r.zahlen);
  const vorn = r.zahlen.flatMap((z, i) => (z === max ? [i] : []));
  // Gleichstand: die gewünschte Möglichkeit gewinnt, sonst das Los
  const sieger = vorn.includes(r.ziel) ? r.ziel : vorn[Math.floor(Math.random() * vorn.length)];
  waage.querySelectorAll('.k-seite').forEach((s, i) => s.classList.add(i === sieger ? 'k-sieger' : 'k-verlierer'));
  waage.classList.add('k-fertig');
  $('.k-stand', waage).textContent = vorn.length > 1 ? (vorn.includes(r.ziel) ? 'Gleichstand' : 'Gleichstand – das Los hat entschieden') : 'Die Klasse hat entschieden';
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
  if (r.frist && !r.entschieden) verbindung.senden({ t: 'zu', n: r.n, w: -1, o: r.texte });
  waage.classList.remove('k-an');
  document.body.classList.remove('k-stimmt');
  setTimeout(() => wahl.classList.remove('k-aktiv', 'k-keine'), 900);
  lage();
}

// ---------- Steuerleiste: vorige Szene, Szene von vorn, Pause ----------
const ICON = {
  zurueck: '<svg viewBox="0 0 24 24"><path d="M7 5v14M18 6l-8 6 8 6z"/></svg>',
  neu: '<svg viewBox="0 0 24 24"><path d="M5.5 12a6.5 6.5 0 1 0 2-4.7"/><path d="M5 4v4h4"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>',
  weiter: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
};
const steuer = document.createElement('div');
steuer.id = 'k-steuer';
steuer.innerHTML = `
  <button data-a="zurueck" title="Vorige Szene (←)" aria-label="Vorige Szene">${ICON.zurueck}</button>
  <button data-a="neu" title="Szene von vorn (R)" aria-label="Szene von vorn">${ICON.neu}</button>
  <button data-a="pause" class="k-gross" title="Pause (P)" aria-label="Pause">${ICON.pause}</button>`;
$('#stage').append(steuer);

const pausa = document.createElement('div');
pausa.id = 'k-pausa';
pausa.innerHTML = '<span class="k-haarlinie"></span><span class="k-wort">PAVSA</span><span class="k-haarlinie"></span><span class="k-tipp">Zum Weiterspielen tippen</span>';
$('#stage').append(pausa);

const film = () => window.__film;
function pauseUmschalten() {
  const f = film();
  if (!f || runde) return;
  if (f.pausiert) f.weiter(); else f.pause();
  lage();
}
function aktion(a) {
  const f = film();
  if (!f) return;
  if (a === 'pause') pauseUmschalten();
  else { f.springe(a); setTimeout(lage, 50); }
  zeigeSteuer();
}
steuer.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { e.stopPropagation(); aktion(b.dataset.a); } });
pausa.addEventListener('click', () => pauseUmschalten());

function lage() {
  const imFilm = !sichtbar(titel) && !sichtbar(ende);
  const f = film();
  document.body.classList.toggle('k-imfilm', imFilm);
  document.body.classList.toggle('k-angehalten', !!(f && f.pausiert));
  const p = $('[data-a="pause"]', steuer);
  const an = f && f.pausiert;
  p.innerHTML = an ? ICON.weiter : ICON.pause;
  p.title = an ? 'Weiter (P)' : 'Pause (P)';
  p.setAttribute('aria-label', an ? 'Weiter' : 'Pause');
}

let steuerUhr = 0;
function zeigeSteuer() {
  document.body.classList.add('k-zeigsteuer');
  clearTimeout(steuerUhr);
  steuerUhr = setTimeout(() => document.body.classList.remove('k-zeigsteuer'), 2800);
}
window.addEventListener('pointermove', zeigeSteuer, { passive: true });
window.addEventListener('pointerdown', zeigeSteuer, { passive: true });
window.addEventListener('keydown', (e) => {
  if (!document.body.classList.contains('k-imfilm')) return;
  if (e.key === 'p' || e.key === 'P' || e.key === 'k' || e.key === 'K') { pauseUmschalten(); zeigeSteuer(); }
  else if (e.key === 'ArrowLeft') aktion('zurueck');
  else if (e.key === 'r' || e.key === 'R') aktion('neu');
});
lage();
