#!/usr/bin/env bash
# Gleiches Schiff in allen Hafen- und Sturmszenen: Standbilder und Clips neu.
set -u
cd "$(dirname "$0")/.."
warte() {
  until [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8188/system_stats)" = "200" ]; do
    (cd /c/AI/ComfyUI_windows_portable && nohup ./python_embeded/python.exe -s ComfyUI/main.py \
      --windows-standalone-build --disable-async-offload --disable-pinned-memory > /dev/null 2>&1 &)
    sleep 90
  done
}
for id in hafen_2 hafen_abfahrt sturm_1 sturm_2; do
  warte
  cp "stills/$id.png" "rejected/${id}_still_vor_schiff.png" 2>/dev/null
  cp "clips/$id.mp4" "rejected/${id}_vor_schiff.mp4" 2>/dev/null
  echo "=== $id  $(date +%H:%M)"
  FORCE=1 SEED=6060 node tools/generate.mjs stills "$id"
  FRAMES=81 STEPS14=6 SWITCH=3 SEED=6060 MODEL=14b FORCE=1 node tools/generate.mjs clips "$id"
  rm -f "clips_lowres/$id.mp4"
  node tools/upscale.mjs "$id" || true
done
echo "### SCHIFF FERTIG  $(date +%H:%M)"

echo "=== hafen_1 ohne Menschen, Schiff legt ab  $(date +%H:%M)"
warte
cp stills/hafen_1.png rejected/hafen_1_still_mitleuten.png 2>/dev/null
cp clips/hafen_1.mp4 rejected/hafen_1_mitleuten.mp4 2>/dev/null
FORCE=1 SEED=6161 node tools/generate.mjs stills hafen_1
FRAMES=81 STEPS14=6 SWITCH=3 SEED=6161 MODEL=14b FORCE=1 node tools/generate.mjs clips hafen_1
rm -f clips_lowres/hafen_1.mp4
node tools/upscale.mjs hafen_1 || true
echo "### AUFTAKT NEU FERTIG  $(date +%H:%M)"
