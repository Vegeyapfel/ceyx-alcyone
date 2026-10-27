#!/usr/bin/env bash
# Restarbeiten: Nacharbeit, schärfen, Bildabschluss.
set -u
cd "$(dirname "$0")/.."
bash tools/nacharbeit.sh
echo "### schärfen  $(date +%H:%M)"
until [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8188/system_stats)" = "200" ]; do
  (cd /c/AI/ComfyUI_windows_portable && nohup ./python_embeded/python.exe -s ComfyUI/main.py \
    --windows-standalone-build --disable-async-offload --disable-pinned-memory > /dev/null 2>&1 &)
  sleep 90
done
node tools/upscale.mjs || true
echo "### Bildabschluss  $(date +%H:%M)"
node tools/finish.mjs || true
echo "### ALLES FERTIG  $(date +%H:%M)"
