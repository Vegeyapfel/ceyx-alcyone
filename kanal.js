// Verbindung zwischen Fernseher (klasse.html) und Handys (waehlen.html).
// Übertragen werden nur anonyme Klicks: zufällige Handy-Kennung, Spielername,
// gewählte Nummer. Drei Wege:
//   ntfy  – ntfy.sh, kostenlos, ohne Konto; Grenze 250 Nachrichten/Tag je Internetadresse
//   mqtt  – öffentlicher MQTT-Vermittler (HiveMQ), kostenlos, ohne Konto, ohne Tagesgrenze
//   lokal – BroadcastChannel im selben Browser, nur zum Testen (?lokal=1)
// Standard ist mqtt (HiveMQ); fällt der Dienst einmal aus, klasse.html?dienst=ntfy öffnen –
// der QR-Code nimmt den Ausweichweg dann automatisch mit.

const PARAMS = new URLSearchParams(location.search);
export const LOKAL = PARAMS.has('lokal');
export const STANDARD = 'mqtt';
export const DIENST = LOKAL ? 'lokal' : (PARAMS.get('dienst') || STANDARD);

const thema = (raum) => `ceyx-klasse-${raum}`;

/**
 * Öffnet den Kanal eines Raums.
 * @param {string} raum   sechsstelliger Raumcode
 * @param {(m: object) => void} empfang  wird für jede Nachricht aufgerufen
 * @param {{ rueckblick?: string }} opt  nur ntfy: zuletzt gesendete Nachrichten nachholen, z. B. '20s'
 */
export function kanal(raum, empfang, opt = {}) {
  if (DIENST === 'lokal') return lokal(raum, empfang);
  if (DIENST === 'mqtt' && typeof mqtt !== 'undefined') return mqttKanal(raum, empfang);
  return ntfy(raum, empfang, opt);
}

function lokal(raum, empfang) {
  const bc = new BroadcastChannel(thema(raum));
  bc.onmessage = (e) => empfang(e.data);
  return { senden: async (m) => { bc.postMessage(m); return true; }, zu: () => bc.close() };
}

function ntfy(raum, empfang, opt) {
  const DIENSTADRESSE = 'https://ntfy.sh';
  const since = opt.rueckblick ? `?since=${opt.rueckblick}` : '';
  const quelle = new EventSource(`${DIENSTADRESSE}/${thema(raum)}/sse${since}`);
  quelle.onmessage = (e) => {
    try {
      const d = JSON.parse(e.data);
      if (d.event === 'message' && d.message) empfang(JSON.parse(d.message));
    } catch { /* fremde oder kaputte Nachricht ignorieren */ }
  };
  return {
    senden: async (m) => {
      for (let versuch = 0; versuch < 3; versuch++) {
        try { const r = await fetch(`${DIENSTADRESSE}/${thema(raum)}`, { method: 'POST', body: JSON.stringify(m) }); if (r.ok) return true; }
        catch { /* gleich nochmal */ }
        await new Promise((r) => setTimeout(r, 400 * (versuch + 1)));
      }
      return false;
    },
    zu: () => quelle.close(),
  };
}

function mqttKanal(raum, empfang) {
  const t = `ceyx-alcyone/${thema(raum)}`;
  const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
    clientId: `ceyx_${Math.random().toString(36).slice(2, 12)}`,
    clean: true, keepalive: 30, reconnectPeriod: 1500, connectTimeout: 8000,
  });
  client.on('connect', () => client.subscribe(t, { qos: 0 }));
  client.on('message', (_, daten) => {
    try { empfang(JSON.parse(new TextDecoder().decode(daten))); } catch { /* ignorieren */ }
  });
  return {
    senden: async (m) => { client.publish(t, JSON.stringify(m), { qos: 0 }); return true; },
    zu: () => client.end(true),
  };
}

/** Zufälliger Code ohne verwechselbare Zeichen (kein 0/O, 1/I/L). */
export function neuerCode(laenge = 6) {
  const z = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(laenge)), (b) => z[b % z.length]).join('');
}
