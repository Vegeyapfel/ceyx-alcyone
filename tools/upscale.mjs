// Schärft Clips mit Real-ESRGAN x2 und skaliert auf 1280×720 (bzw. passende
// Höhe). Originale werden nach film/clips_lowres gesichert.
//
//   node film/tools/upscale.mjs [id ...]   ohne ids: alle Clips unter 1280 px Breite

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HOST = 'http://127.0.0.1:8188';
const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clipsDir = path.join(filmDir, 'clips');
const backupDir = path.join(filmDir, 'clips_lowres');
fs.mkdirSync(backupDir, { recursive: true });
const PY = 'C:/AI/ComfyUI_windows_portable/python_embeded/python.exe';
const FF = 'C:/AI/LatentSync/ffbin/ffmpeg.exe';

function width(file) {
  const r = spawnSync(PY, ['-c', `import av;print(av.open(r'${file}').streams.video[0].width)`]);
  return Number(String(r.stdout).trim());
}

async function post(url, body) {
  const r = await fetch(url, body);
  return r.json();
}

async function run(id) {
  const src = path.join(clipsDir, `${id}.mp4`);
  if (width(src) >= 1280) return console.log(`= ${id} (schon scharf)`);
  const t = Date.now();

  const form = new FormData();
  form.append('image', new Blob([fs.readFileSync(src)]), `up_${id}.mp4`);
  form.append('overwrite', 'true');
  const up = await post(`${HOST}/upload/image`, { method: 'POST', body: form });

  const wf = {
    1: { class_type: 'LoadVideo', inputs: { file: up.name } },
    2: { class_type: 'GetVideoComponents', inputs: { video: ['1', 0] } },
    3: { class_type: 'UpscaleModelLoader', inputs: { model_name: 'RealESRGAN_x2plus.pth' } },
    4: { class_type: 'ImageUpscaleWithModel', inputs: { upscale_model: ['3', 0], image: ['2', 0] } },
    5: { class_type: 'ImageScale', inputs: { image: ['4', 0], upscale_method: 'lanczos', width: 1280, height: 738, crop: 'center' } },
    6: { class_type: 'CreateVideo', inputs: { images: ['5', 0], fps: 24 } },
    7: { class_type: 'SaveVideo', inputs: { video: ['6', 0], filename_prefix: `ceyx/up_${id}`, format: 'auto', 'format.codec': 'auto' } },
  };
  const q = await post(`${HOST}/prompt`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: wf }) });
  if (!q.prompt_id) throw new Error(JSON.stringify(q.node_errors || q.error));

  let out;
  for (;;) {
    const h = (await post(`${HOST}/history/${q.prompt_id}`))[q.prompt_id];
    if (h?.status?.completed) { out = h.outputs; break; }
    if (h?.status?.status_str === 'error') throw new Error(JSON.stringify(h.status.messages?.slice(-1)));
    await new Promise((r) => setTimeout(r, 2000));
  }
  const f = (out['7'].images || out['7'].videos)[0];
  const tmp = path.join(clipsDir, `${id}_up.mp4`);
  const r = await fetch(`${HOST}/view?filename=${encodeURIComponent(f.filename)}&subfolder=${encodeURIComponent(f.subfolder)}&type=${f.type}`);
  fs.writeFileSync(tmp, Buffer.from(await r.arrayBuffer()));

  // 738 px Höhe (durch 2 teilbar) ergibt mit 1280 fast exakt 16:9; hohe Qualität neu kodieren
  const final = path.join(clipsDir, `${id}_hq.mp4`);
  const enc = spawnSync(FF, ['-y', '-loglevel', 'error', '-i', tmp, '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-pix_fmt', 'yuv420p', final]);
  if (enc.status !== 0) throw new Error(String(enc.stderr));
  fs.renameSync(src, path.join(backupDir, `${id}.mp4`));
  fs.renameSync(final, src);
  fs.unlinkSync(tmp);
  console.log(`+ ${id}  ${((Date.now() - t) / 1000).toFixed(0)} s`);
}

const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(clipsDir).filter((f) => f.endsWith('.mp4')).map((f) => f.slice(0, -4));
for (const id of ids) {
  try { await run(id); } catch (e) { console.log(`! ${id}: ${e.message}`); }
}
console.log('fertig');
