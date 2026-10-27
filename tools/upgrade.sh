#!/usr/bin/env bash
# Großer Aufwertungslauf. Läuft mehrere Stunden allein und übersteht Abstürze.
#
#   bash tools/upgrade.sh    (aus film/ heraus)
#
# Reihenfolge nach Wichtigkeit: bricht der Lauf ab, sind die entscheidenden
# Einstellungen schon neu. Fertige Abschnitte werden nicht erneut gerechnet.

set -u
cd "$(dirname "$0")/.."
mkdir -p rejected/vor_aufwertung

warte_auf_comfy() {
  until [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8188/system_stats)" = "200" ]; do
    echo "… ComfyUI weg, starte neu  $(date +%H:%M)"
    (cd /c/AI/ComfyUI_windows_portable && nohup ./python_embeded/python.exe -s ComfyUI/main.py \
      --windows-standalone-build --disable-async-offload --disable-pinned-memory > /dev/null 2>&1 &)
    sleep 90
  done
}

# lang <id> <abschnitte>  – eine durchgehende Einstellung aus mehreren Teilen
lang() {
  local id=$1 n=$2
  warte_auf_comfy
  [ -f "clips/$id.mp4" ] && [ ! -f "rejected/vor_aufwertung/$id.mp4" ] && cp "clips/$id.mp4" "rejected/vor_aufwertung/$id.mp4"
  echo "=== $id  ${n} Abschnitte  $(date +%H:%M)"
  if ! node tools/chain.mjs "$id" "$n" 4242; then
    echo "!!! $id fehlgeschlagen, zweiter Versuch  $(date +%H:%M)"
    warte_auf_comfy
    node tools/chain.mjs "$id" "$n" 4242 || echo "!!! $id endgültig fehlgeschlagen"
  fi
}

echo "###### Stufe 1: neue Standbilder  $(date +%H:%M)"
warte_auf_comfy
cp stills/traum_1.png rejected/vor_aufwertung/traum_1_still_alt.png 2>/dev/null
cp stills/_var/bett_nackt113.png stills/traum_1.png
for id in hafen_1 ufer_1; do
  cp "stills/$id.png" "rejected/vor_aufwertung/${id}_still_alt.png" 2>/dev/null
  FORCE=1 SEED=20260 node tools/generate.mjs stills "$id"
done

echo "###### Stufe 2: lange Einstellungen  $(date +%H:%M)"
lang hafen_1        3     # Auftakt, 22 s, langsame Fahrt über den Hafen
lang traum_1        3     # Erscheinung nach Ovid XI 653-656
lang ufer_1         3     # Morgen am leeren Strand
lang hafen_abfahrt  2
lang hafen_2        2
lang sturm_1        2
lang ufer_koerper   2
lang ufer_nah       2
lang mole_1         2
lang mole_flug      2
lang mole_zwei      2
lang finale_nest    2
lang warten_1       2
lang traum_erwachen 2
lang hafen_rede     2
lang sturm_3        2

echo "###### Stufe 3: schärfen  $(date +%H:%M)"
warte_auf_comfy
node tools/upscale.mjs || true

echo "###### FERTIG  $(date +%H:%M)"
