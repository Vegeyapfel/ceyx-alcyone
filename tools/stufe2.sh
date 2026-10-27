#!/usr/bin/env bash
# Zweite Welle: sechs tragende Nebeneinstellungen von 5 auf 15 Sekunden,
# danach schärfen und Bildabschluss über alle Clips.
set -u
cd "$(dirname "$0")/.."
warte() {
  until [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8188/system_stats)" = "200" ]; do
    (cd /c/AI/ComfyUI_windows_portable && nohup ./python_embeded/python.exe -s ComfyUI/main.py \
      --windows-standalone-build --disable-async-offload --disable-pinned-memory > /dev/null 2>&1 &)
    sleep 90
  done
}
for id in sturm_2 mole_sprung sturm_welle traum_greifen ende_ufer_1 warten_weben; do
  warte
  [ -f "clips/$id.mp4" ] && [ ! -f "rejected/vor_aufwertung/$id.mp4" ] && cp "clips/$id.mp4" "rejected/vor_aufwertung/$id.mp4"
  echo "=== $id  $(date +%H:%M)"
  node tools/chain.mjs "$id" 2 4242 || echo "!!! $id fehlgeschlagen"
done
echo "### schärfen  $(date +%H:%M)"
warte; node tools/upscale.mjs || true
echo "### Bildabschluss  $(date +%H:%M)"
node tools/finish.mjs || true
echo "### STUFE2 FERTIG  $(date +%H:%M)"

echo "### Traum neu: Kopf war unnatuerlich gross  $(date +%H:%M)"
warte
FORCE=1 SEED=11007 node tools/generate.mjs stills traum_1
rm -f clips/_chain/traum_1_*.mp4 clips/_chain/traum_1_*.png
node tools/chain.mjs traum_1 2 11007
warte; node tools/upscale.mjs traum_1 || true
node tools/finish.mjs traum_1 || true
echo "### TRAUM FERTIG  $(date +%H:%M)"

echo "### Abfahrt erzwingen: Endbild ohne Schiff am Kai  $(date +%H:%M)"
warte
NEG="large ship at the quay, moored ship in foreground" node tools/variant.mjs img2img \
  stills/hafen_abfahrt.png stills/hafen_abfahrt_end.png \
  "wide shot from behind a young woman in a white dress alone at the end of a stone quay at dawn, the water in front of her empty, far away near the horizon a small ancient ship under sail, calm misty sea" 0.6 7102
rm -f clips/_chain/hafen_abfahrt_*.mp4 clips/_chain/hafen_abfahrt_*.png
node tools/chain.mjs hafen_abfahrt 2 7102
warte; node tools/upscale.mjs hafen_abfahrt || true
node tools/finish.mjs hafen_abfahrt || true
echo "### ALLES-STUFE2 FERTIG  $(date +%H:%M)"
