// Interaktiver Film-Player: spielt Clips aus clips/<id>.mp4 ab, blendet über,
// zeigt Kapitelkarten, Untertitel und Entscheidungen. Fehlt ein Clip, wird
// stills/<id>.png mit Ken-Burns-Fahrt gezeigt, fehlt auch das, eine Textkarte.

import { startAudio, setAmbience, duck } from './ambience.js';

const $ = (s) => document.querySelector(s);

const AMBIENCE = [['hafen', 'sea'], ['sturm', 'storm'], ['warten', 'night'], ['traum', 'dream'], ['ufer', 'dawn'], ['mole', 'dawn'], ['finale', 'calm'], ['ende', 'calm']];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const story = await (await fetch('story.json')).json();
const layers = [$('#layerA'), $('#layerB')];
let front = 0;
let flags = {};
let path = [];
let skip = null;           // Auflöser zum Überspringen der aktuellen Wartezeit

async function exists(url) {
  try { const r = await fetch(url, { method: 'HEAD' }); return r.ok && !(r.headers.get('content-type') || '').includes('text/html'); }
  catch { return false; }
}

// Testmodus: ?speed=10 spielt alles zehnmal schneller ab
const SPEED = Number(new URLSearchParams(location.search).get('speed')) || 1;

function wait(ms) {
  ms /= SPEED;
  return new Promise((resolve) => {
    const t = setTimeout(done, ms);
    function done() { clearTimeout(t); skip = null; resolve(); }
    skip = done;
  });
}

async function showChapter(scene) {
  if (!scene.chapter) return;
  const el = $('#chapter');
  el.querySelector('.mark').textContent = scene.chapter;
  el.querySelector('.latin').textContent = scene.verse ? scene.verse[0] : '';
  el.querySelector('.german').textContent = scene.verse ? scene.verse[1] : '';
  el.classList.remove('hidden');
  await wait(4200);
  el.classList.add('hidden');
}

function subtitle(text) {
  const el = $('#subtitle');
  if (!text) { el.classList.add('hidden'); return; }
  el.textContent = text;
  el.classList.remove('hidden');
}

const voice = new Audio();
voice.volume = 0.95;
voice.onplay = () => duck(true);
voice.onended = () => duck(false);
/** Spielt voice/<id>.mp3 und liefert seine Dauer in ms (0, falls keine Datei). */
async function speak(id) {
  voice.pause();
  // Bessere Aufnahmen (ElevenLabs) haben Vorrang vor den Edge-Stimmen
  let ok = false;
  for (const dir of ['voice_el', 'voice']) {
    voice.src = `${dir}/${id}.mp3`;
    ok = await new Promise((r) => { voice.onloadedmetadata = () => r(true); voice.onerror = () => r(false); });
    if (ok) break;
  }
  if (!ok) return 0;
  voice.play().catch(() => {});
  return voice.duration * 1000;
}

/** Lesezeit: gut 60 ms pro Zeichen, mindestens 3,5 s. */
const readTime = (t) => (t ? Math.max(3500, t.length * 62) : 0);

async function playScene(id) {
  const scene = story.scenes[id];
  path.push(id);
  setAmbience((AMBIENCE.find(([p]) => id.startsWith(p)) || [])[1]);

  const next = layers[1 - front];
  const video = next.querySelector('video');
  const still = next.querySelector('.still');
  video.classList.remove('hold');
  still.className = 'still';
  still.style.backgroundImage = '';
  still.textContent = '';
  next.dataset.fx = scene.fx || '';
  video.removeAttribute('src');
  video.style.display = 'none';

  // Lippensynchrone Fassung (mit eigener Tonspur) hat Vorrang
  const synced = scene.lipsync && await exists(`lipsync/${id}.mp4`);
  const clip = synced ? `lipsync/${id}.mp4` : `clips/${id}.mp4`;
  video.muted = !synced;
  const img = `stills/${id}.png`;
  let duration = 6000;

  if (await exists(clip)) {
    video.src = clip;
    video.style.display = '';
    await new Promise((r) => { video.onloadeddata = r; video.onerror = r; video.load(); });
    duration = (video.duration || 5) * 1000;
  } else if (await exists(img)) {
    still.style.backgroundImage = `url(${img})`;
    still.classList.add('kenburns');
  } else {
    still.classList.add('card');
    still.textContent = `[${id}] ${scene.image}`;
  }

  // Kapitelkarte liegt über dem Bild; das Bild blendet darunter schon auf.
  const chapter = showChapter(scene);
  layers[front].classList.remove('on');
  next.classList.add('on');
  front = 1 - front;
  await chapter;

  if (video.style.display !== 'none') { video.currentTime = 0; video.play().catch(() => {}); }
  subtitle(scene.subtitle);
  if (synced) duck(true);
  const voiceMs = scene.subtitle && !synced ? await speak(id) : 0;

  // Clip läuft durch; reicht er nicht zum Lesen, bleibt das letzte Bild mit
  // langsamer Fahrt stehen, statt den Untertitel abzuschneiden.
  const need = Math.max(duration, readTime(scene.subtitle), voiceMs + 600);
  if (video.style.display !== 'none' && need > duration) {
    await wait(duration - 150);
    video.pause();
    video.classList.add('hold');
    await wait(need - duration + 150);
  } else {
    await wait(need);
  }

  if (synced) duck(false);

  let target;
  if (scene.choice) target = await choose(scene.choice);
  else if (scene.next_if) target = scene.next_if.find((c) => !c.flag || flags[c.flag] === c.is).goto;
  else target = scene.next;

  subtitle(null);
  if (scene.end) return finish(scene.end);
  return playScene(target);
}

function choose(choice) {
  return new Promise((resolve) => {
    const el = $('#choice');
    el.querySelector('.question').textContent = choice.prompt;
    const box = el.querySelector('.options');
    box.innerHTML = '';
    const pick = (o) => {
      window.removeEventListener('keydown', onKey);
      Object.assign(flags, o.set || {});
      el.classList.add('hidden');
      resolve(o.goto);
    };
    if (window.__autoChoose) { const o = window.__autoChoose(choice); setTimeout(() => pick(o), 200); }
    const onKey = (e) => { const i = Number(e.key) - 1; if (choice.options[i]) pick(choice.options[i]); };
    choice.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.innerHTML = `<span class="key">${i + 1}</span>`;
      b.append(o.label);
      b.onclick = () => pick(o);
      box.append(b);
    });
    window.addEventListener('keydown', onKey);
    el.classList.remove('hidden');
  });
}

const ENDINGS = {
  ovid: ['Ende', 'Das Ende, wie Ovid es erzählt: Beide leben als Eisvögel weiter.'],
  shore: ['Ende', 'Ein anderes Ende: Alcyone bleibt am Ufer.'],
};

function finish(kind) {
  layers.forEach((l) => l.classList.remove('on'));
  const [t, p] = ENDINGS[kind];
  $('#end .endtitle').textContent = t;
  const WEGE = {
    farewell: { plea: 'Alcyone flehte Ceyx an zu bleiben', kiss: 'Alcyone ließ Ceyx mit einem Kuss ziehen' },
    storm: { name: 'Ceyx rief im Sturm ihren Namen', star: 'Ceyx blickte zum verhüllten Morgenstern' },
    waiting: { pray: 'sie betete Nacht für Nacht zu Juno', weave: 'sie webte ein Gewand für seine Rückkehr' },
    dream: { reach: 'im Traum griff sie nach ihm', ask: 'im Traum fragte sie, ob er es wirklich sei' },
  };
  const wege = Object.entries(WEGE).map(([k, m]) => m[flags[k]]).filter(Boolean);
  $('#end .path').innerHTML = `${p}<br><br><em>Dein Weg:</em> ${wege.join(' · ')}.`;
  $('#end').classList.remove('hidden');
}

/**
 * Vollbild und Querformat. Beides darf nur aus einer Nutzergeste heraus
 * angefordert werden, deshalb hängt es am Startknopf. Auf iPhones lehnt Safari
 * den Vollbildmodus für die Seite ab; dort greift der Hinweis „Gerät drehen".
 */
/** Kurze Meldung unten links – nur sichtbar, wenn etwas schiefgeht. */
function toast(text) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = text;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 6000);
}

async function goFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenEnabled && !el.webkitRequestFullscreen) {
    return toast('Vollbild wird von diesem Browser nicht angeboten');
  }
  try {
    await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
  } catch (e) {
    toast(`Vollbild abgelehnt: ${e.name} – ${e.message}`);
  }
  try { await screen.orientation?.lock?.('landscape'); } catch { /* nicht unterstützt */ }
}

async function toggleFullscreen() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    try { await (document.exitFullscreen?.() ?? document.webkitExitFullscreen?.()); } catch { /* egal */ }
  } else {
    await goFullscreen();
  }
}

// Taste F schaltet um (F11 fängt der Browser selbst ab), Knopf oben rechts ebenso.
window.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') toggleFullscreen();
});
$('#fs').onclick = toggleFullscreen;
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) {
  document.addEventListener(ev, () => {
    const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
    $('#fs').textContent = on ? '⛶' : '⛶';
    $('#fs').title = on ? 'Vollbild verlassen (F)' : 'Vollbild (F)';
  });
}

/** Chrome lehnt die erste Anfrage gelegentlich ab; dann beim nächsten Tippen erneut. */
function retryFullscreenOnTap() {
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  const once = () => { goFullscreen(); window.removeEventListener('pointerdown', once); };
  window.addEventListener('pointerdown', once, { once: true });
}

$('#start').onclick = async () => {
  await goFullscreen();
  retryFullscreenOnTap();
  await startAudio();
  $('#title').classList.add('hidden');
  playScene(story.start);
};
$('#again').onclick = () => {
  startAudio();
  flags = {}; path = [];
  $('#end').classList.add('hidden');
  playScene(story.start);
};
window.addEventListener('keydown', (e) => { if (e.code === 'Space' && skip) { e.preventDefault(); skip(); } });

// Debug: ?scene=<id> springt direkt in eine Szene
const q = new URLSearchParams(location.search).get('scene');
if (q && story.scenes[q]) { $('#title').classList.add('hidden'); window.addEventListener('pointerdown', startAudio, { once: true }); playScene(q); }
