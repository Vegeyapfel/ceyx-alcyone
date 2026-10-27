#!/usr/bin/env bash
# Nacharbeit nach dem großen Lauf: Einstellungen, die beim Sichten durchfielen.
set -u
cd "$(dirname "$0")/.."

warte() {
  until [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8188/system_stats)" = "200" ]; do
    (cd /c/AI/ComfyUI_windows_portable && nohup ./python_embeded/python.exe -s ComfyUI/main.py \
      --windows-standalone-build --disable-async-offload --disable-pinned-memory > /dev/null 2>&1 &)
    sleep 90
  done
}

echo "### Hafen-Auftakt: Abschnitte 2 und 3 mit angeglichener Takelage  $(date +%H:%M)"
warte
rm -f clips/_chain/hafen_1_2.mp4 clips/_chain/hafen_1_3.mp4 clips/_chain/hafen_1_1_ende.png clips/_chain/hafen_1_2_ende.png
node tools/chain.mjs hafen_1 3 4242

echo "### Abfahrt: Schiff muss sichtbar ablegen  $(date +%H:%M)"
warte
# Endbild: leeres Hafenbecken, Schiff klein am Horizont – zwingt die Bewegung
NEG="large ship in foreground, moored ship, ship at quay" node tools/variant.mjs img2img \
  stills/hafen_abfahrt.png stills/hafen_abfahrt_end.png \
  "wide shot from behind a young woman in a white dress standing alone at the end of a stone quay at dawn, the harbour basin in front of her is empty, far away near the horizon a small ancient ship under sail, calm water, mist" 0.55 7001
rm -f clips/_chain/hafen_abfahrt_*.mp4 clips/_chain/hafen_abfahrt_*.png
node tools/chain.mjs hafen_abfahrt 2 7001

echo "### Körper im Wasser: näher heran  $(date +%H:%M)"
warte
FORCE=1 SEED=8002 node tools/generate.mjs stills ufer_koerper
rm -f clips/_chain/ufer_koerper_*.mp4 clips/_chain/ufer_koerper_*.png
node tools/chain.mjs ufer_koerper 2 8002

echo "### NACHARBEIT FERTIG  $(date +%H:%M)"

echo "### Mole: echte Steinmole statt Felsstrand  $(date +%H:%M)"
warte
FORCE=1 SEED=9003 node tools/generate.mjs stills mole_1
rm -f clips/_chain/mole_1_*.mp4 clips/_chain/mole_1_*.png
node tools/chain.mjs mole_1 2 9003
echo "### NACHARBEIT WIRKLICH FERTIG  $(date +%H:%M)"

echo "### Sturm an der Planke: See wirkt zu ruhig  $(date +%H:%M)"
warte
FORCE=1 SEED=7104 node tools/generate.mjs stills sturm_3
rm -f clips/_chain/sturm_3_*.mp4 clips/_chain/sturm_3_*.png
node tools/chain.mjs sturm_3 2 7104
