// Prozedurale Geräuschkulisse mit WebAudio: Meer, Sturm, Nacht, Morgen.
// Keine Audiodateien – alles aus gefiltertem Rauschen und Sinus-Flächen.

let ctx, master, current = null;

// Echte Filmmusik (music/<preset>.mp3) ersetzt die synthetischen Klangflächen.
const musicEl = { a: null, name: null };
let musicAvailable = false;
const MUSIC_VOLUME = 0.55;

function noiseBuffer(seconds = 4) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let b = 0;
    for (let i = 0; i < len; i++) {
      // leicht gefärbtes (braunes) Rauschen klingt nach Wasser, nicht nach Radio
      b = (b + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = b * 3.5;
    }
  }
  return buf;
}

function loopNoise(out, { type = 'lowpass', freq = 600, q = 0.7, gain = 0.3 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(out);
  src.start();
  return { src, f, g };
}

/** Langsames An- und Abschwellen wie Brandung. */
function swell(param, base, depth, period) {
  const lfo = ctx.createOscillator();
  const amt = ctx.createGain();
  lfo.frequency.value = 1 / period;
  amt.gain.value = depth;
  param.value = base;
  lfo.connect(amt).connect(param);
  lfo.start();
  return lfo;
}

function pad(out, notes, gain = 0.035) {
  if (musicAvailable) return [];
  const g = ctx.createGain();
  g.gain.value = gain;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 900;
  g.connect(f).connect(out);
  const oscs = notes.map((hz, i) => {
    const o = ctx.createOscillator();
    o.type = i % 2 ? 'triangle' : 'sine';
    o.frequency.value = hz;
    o.detune.value = (i - notes.length / 2) * 4;
    o.connect(g);
    o.start();
    return o;
  });
  swell(g.gain, gain, gain * 0.5, 11);
  return oscs;
}

const PRESETS = {
  sea(out) {
    const w = loopNoise(out, { freq: 500, gain: 0.22 });
    swell(w.g.gain, 0.22, 0.15, 7);
    swell(w.f.frequency, 500, 250, 7);
    pad(out, [110, 164.8, 220], 0.02);
  },
  storm(out) {
    const rain = loopNoise(out, { type: 'highpass', freq: 2500, gain: 0.12 });
    const wind = loopNoise(out, { type: 'bandpass', freq: 400, q: 1.5, gain: 0.35 });
    swell(wind.f.frequency, 420, 260, 5);
    const sea = loopNoise(out, { freq: 250, gain: 0.45 });
    swell(sea.g.gain, 0.45, 0.3, 4);
    pad(out, [55, 82.4, 116.5], 0.03);
    const thunder = () => {
      if (current?.name !== 'storm') return;
      const t = loopNoise(out, { freq: 120, gain: 0 });
      const now = ctx.currentTime;
      t.g.gain.setValueAtTime(0, now);
      t.g.gain.linearRampToValueAtTime(0.9, now + 0.08);
      t.g.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
      t.src.stop(now + 3.6);
      setTimeout(thunder, 5000 + Math.random() * 7000);
    };
    setTimeout(thunder, 2500);
  },
  night(out) {
    loopNoise(out, { freq: 300, gain: 0.06 });
    pad(out, [98, 146.8, 196, 233], 0.03);
  },
  dream(out) {
    loopNoise(out, { type: 'bandpass', freq: 900, q: 3, gain: 0.03 });
    pad(out, [130.8, 196, 246.9, 329.6], 0.035);
  },
  dawn(out) {
    const w = loopNoise(out, { freq: 700, gain: 0.12 });
    swell(w.g.gain, 0.12, 0.08, 9);
    pad(out, [146.8, 220, 277.2, 329.6], 0.03);
  },
  calm(out) {
    const w = loopNoise(out, { freq: 400, gain: 0.05 });
    swell(w.g.gain, 0.05, 0.03, 12);
    pad(out, [174.6, 261.6, 329.6, 440], 0.035);
  },
};

let starting = null;
export function startAudio() {
  return (starting ??= initAudio());
}

async function initAudio() {
  if (ctx) return;
  try {
    const r = await fetch('music/storm.mp3', { method: 'HEAD' });
    musicAvailable = r.ok && (r.headers.get('content-type') || '').startsWith('audio');
  } catch { musicAvailable = false; }
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);
}

/** Wechselt weich (3 s Überblendung) zur Kulisse `name`. */
export function setAmbience(name) {
  if (!ctx || !name || current?.name === name) return;
  const now = ctx.currentTime;
  if (current) {
    const old = current;
    old.bus.gain.setValueAtTime(old.bus.gain.value, now);
    old.bus.gain.linearRampToValueAtTime(0, now + 3);
    setTimeout(() => old.bus.disconnect(), 3200);
  }
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0, now);
  bus.gain.linearRampToValueAtTime(1, now + 3);
  bus.connect(master);
  current = { name, bus };
  PRESETS[name]?.(bus);
  setMusic(name);
}

/** Blendet über 3 s von der alten zur neuen Musik. */
function setMusic(name) {
  if (!musicAvailable || musicEl.name === name) return;
  const old = musicEl.a;
  if (old) fadeTo(old, 0, 3000, () => old.pause());
  const a = new Audio(`music/${name}.mp3`);
  a.loop = true;
  a.volume = 0;
  a.play().catch(() => {});
  fadeTo(a, MUSIC_VOLUME * duckLevel, 3000);
  musicEl.a = a;
  musicEl.name = name;
}

function fadeTo(a, target, ms, done) {
  const start = a.volume, t0 = performance.now();
  const step = (t) => {
    const k = Math.max(0, Math.min(1, (t - t0) / ms));
    a.volume = Math.max(0, Math.min(1, start + (target - start) * k));
    if (k < 1) requestAnimationFrame(step); else done?.();
  };
  requestAnimationFrame(step);
}

let duckLevel = 1;

/** Beim Sprechen die Kulisse absenken, damit die Stimme verständlich bleibt. */
export function duck(on) {
  if (!ctx) return;
  master.gain.setTargetAtTime(on ? 0.45 : 0.8, ctx.currentTime, 0.4);
  duckLevel = on ? 0.5 : 1;
  if (musicEl.a) fadeTo(musicEl.a, MUSIC_VOLUME * duckLevel, 600);
}
