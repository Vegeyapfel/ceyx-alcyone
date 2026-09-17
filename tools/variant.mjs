// Standbild-Varianten aus einem vorhandenen Bild (img2img) oder per Inpainting,
// damit Schiff, Licht und Seegang aus einer geglückten Aufnahme erhalten bleiben.
//
//   node tools/variant.mjs img2img <quelle.png> <ziel.png> "<prompt>" [denoise] [seed]
//   node tools/variant.mjs inpaint <quelle.png> <maske.png> <ziel.png> "<prompt>" [seed]
//
// Die Maske ist weiß, wo neu gemalt werden soll (z. B. über dem Schiff).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = process.env.COMFY || 'http://127.0.0.1:8188';
const filmDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const story = JSON.parse(fs.readFileSync(path.join(filmDir, 'story.json'), 'utf8'));

async function upload(file, name) {
  const form = new FormData();
  form.append('image', new Blob([fs.readFileSync(file)]), name);
  form.append('overwrite', 'true');
  const r = await fetch(`${HOST}/upload/image`, { method: 'POST', body: form });
  return (await r.json()).name;
}

async function run(wf, dest) {
  const q = await (await fetch(`${HOST}/prompt`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt: wf }),
  })).json();
  if (!q.prompt_id) throw new Error(JSON.stringify(q.error || q.node_errors));
  for (;;) {
    const h = (await (await fetch(`${HOST}/history/${q.prompt_id}`)).json())[q.prompt_id];
    if (h?.status?.completed) {
      const f = Object.values(h.outputs).flatMap((o) => o.images || [])[0];
      const r = await fetch(`${HOST}/view?filename=${encodeURIComponent(f.filename)}&subfolder=${encodeURIComponent(f.subfolder || '')}&type=${f.type}`);
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      return console.log(`+ ${path.basename(dest)}`);
    }
    if (h?.status?.status_str === 'error') throw new Error(JSON.stringify(h.status.messages?.slice(-1)));
    await new Promise((res) => setTimeout(res, 2000));
  }
}

const [mode, ...rest] = process.argv.slice(2);
const base = (prompt, negExtra) => ({
  1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'Juggernaut-XL_v9.safetensors' } },
  2: { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: `${prompt}, ${story.style}` } },
  3: { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: story.negative + (negExtra ? ', ' + negExtra : '') } },
});

if (mode === 'img2img') {
  const [src, dest, prompt, denoise = '0.5', seed = '1234'] = rest;
  const name = await upload(src, `var_${path.basename(src)}`);
  await run({
    ...base(prompt, process.env.NEG),
    4: { class_type: 'LoadImage', inputs: { image: name } },
    5: { class_type: 'VAEEncode', inputs: { pixels: ['4', 0], vae: ['1', 2] } },
    6: { class_type: 'KSampler', inputs: {
      model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['5', 0],
      seed: Number(seed), steps: 34, cfg: 5, sampler_name: 'dpmpp_2m_sde', scheduler: 'karras',
      denoise: Number(denoise),
    } },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    8: { class_type: 'SaveImage', inputs: { images: ['7', 0], filename_prefix: 'ceyx/var' } },
  }, dest);
} else if (mode === 'inpaint') {
  const [src, mask, dest, prompt, seed = '1234'] = rest;
  const name = await upload(src, `var_${path.basename(src)}`);
  const maskName = await upload(mask, `mask_${path.basename(mask)}`);
  await run({
    ...base(prompt, process.env.NEG),
    4: { class_type: 'LoadImage', inputs: { image: name } },
    9: { class_type: 'LoadImage', inputs: { image: maskName } },
    10: { class_type: 'ImageToMask', inputs: { image: ['9', 0], channel: 'red' } },
    5: { class_type: 'VAEEncodeForInpaint', inputs: { pixels: ['4', 0], vae: ['1', 2], mask: ['10', 0], grow_mask_by: 12 } },
    6: { class_type: 'KSampler', inputs: {
      model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['5', 0],
      seed: Number(seed), steps: 34, cfg: 5, sampler_name: 'dpmpp_2m_sde', scheduler: 'karras', denoise: 1,
    } },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    8: { class_type: 'SaveImage', inputs: { images: ['7', 0], filename_prefix: 'ceyx/var' } },
  }, dest);
} else {
  console.log('Modus img2img oder inpaint angeben');
}
