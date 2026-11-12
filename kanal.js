// Verbindung zwischen Fernseher (klasse.html) und Handys (waehlen.html).
// Standard: der öffentliche Vermittlungsdienst ntfy.sh – kostenlos, ohne Konto.
// Übertragen werden nur anonyme Klicks (zufällige Handy-Kennung, gewählte Nummer).
// Mit ?lokal=1 läuft alles über BroadcastChannel im selben Browser – zum Testen
// in zwei Tabs, ganz ohne Internetdienst.

export const LOKAL = new URLSearchParams(location.search).has('lokal');
const DIENST = 'https://ntfy.sh';
const thema = (raum) => `ceyx-klasse-${raum}`;

/**
 * Öffnet den Kanal eines Raums.
 * @param {string} raum   sechsstelliger Raumcode
 * @param {(m: object) => void} empfang  wird für jede Nachricht aufgerufen
 * @param {{ rueckblick?: string }} opt  rueckblick z. B. '15s': zuletzt gesendete Nachrichten nachholen
 */
export function kanal(raum, empfang, opt = {}) {
  if (LOKAL) {
    const bc = new BroadcastChannel(thema(raum));
    bc.onmessage = (e) => empfang(e.data);
    return { senden: async (m) => bc.postMessage(m), zu: () => bc.close() };
  }
  const since = opt.rueckblick ? `?since=${opt.rueckblick}` : '';
  let quelle;
  const verbinden = () => {
    quelle = new EventSource(`${DIENST}/${thema(raum)}/sse${since}`);
    quelle.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.event === 'message' && d.message) empfang(JSON.parse(d.message));
      } catch { /* fremde oder kaputte Nachricht ignorieren */ }
    };
  };
  verbinden();
  return {
    senden: async (m) => {
      for (let versuch = 0; versuch < 3; versuch++) {
        try { const r = await fetch(`${DIENST}/${thema(raum)}`, { method: 'POST', body: JSON.stringify(m) }); if (r.ok) return true; }
        catch { /* gleich nochmal */ }
        await new Promise((r) => setTimeout(r, 400 * (versuch + 1)));
      }
      return false;
    },
    zu: () => quelle && quelle.close(),
  };
}

/** Zufälliger Code ohne verwechselbare Zeichen (kein 0/O, 1/I/L). */
export function neuerCode(laenge = 6) {
  const z = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(laenge)), (b) => z[b % z.length]).join('');
}
