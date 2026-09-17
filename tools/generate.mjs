// Erzeugt Standbilder (SDXL) und Clips (Wan 2.2 TI2V 5B) für alle Szenen aus
// story.json über die lokale ComfyUI-API.
//
//   node film/tools/generate.mjs stills [id...]   nur Standbilder
//   node film/tools/generate.mjs clips  [id...]   Clips aus vorhandenen Standbildern
//   node film/tools/generate.mjs all    [id...]
//
// Optionen per Umgebung: SEED, STEPS, W, H, FRAMES, FORCE=1 (vorhandene überschreiben)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const HOST = process.env.COMFY || 'http://127.0.0.1:8188';
const here = path.dirname(fileURLToPath(import.meta.url));
const filmDir = path.resolve(here, '..');
const story = JSON.parse(fs.readFileSync(path.join(filmDir, 'story.json'), 'utf8'));
const stillsDir = path.join(filmDir, 'stills');
const clipsDir = path.join(filmDir, 'clips');
fs.mkdirSync(stillsDir, { recursive: true });
fs.mkdirSync(clipsDir, { recursive: true });

const FORCE = process.env.FORCE === '1';
const [mode = 'all', ...only] = process.argv.slice(2);
const ids = only.length ? only : Object.keys(story.scenes);

/** Figurennamen durch ihre feste Beschreibung ersetzen (Konsistenz). */
function expand(text) {
  let t = text;
  for (const [k, v] of Object.entries(story.characters)) t = t.replaceAll(k, v);
  return t;
}

/** Stabiler Seed pro Szene, damit Neuläufe reproduzierbar sind. */
function seedFor(id) {
  let h = Number(process.env.SEED || 1234567);
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

async function queue(workflow) {
  const r = await fetch(`${HOST}/prompt`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(JSON.stringify(j.error || j.node_errors || j));
  return j.prompt_id;
}

async function waitFor(promptId) {
  for (;;) {
    const r = await fetch(`${HOST}/history/${promptId}`);
    const h = (await r.json())[promptId];
    if (h?.status?.completed) return h.outputs;
    if (h?.status?.status_str === 'error') throw new Error(JSON.stringify(h.status.messages?.slice(-1)));
    await new Promise((res) => setTimeout(res, 2000));
  }
}

async function download(file, dest) {
  const u = `${HOST}/view?filename=${encodeURIComponent(file.filename)}&subfolder=${encodeURIComponent(file.subfolder || '')}&type=${file.type || 'output'}`;
  const r = await fetch(u);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

async function upload(filePath, name) {
  const form = new FormData();
  form.append('image', new Blob([fs.readFileSync(filePath)]), name);
  form.append('overwrite', 'true');
  const r = await fetch(`${HOST}/upload/image`, { method: 'POST', body: form });
  return (await r.json()).name;
}

// ------------------------------------------------------------ Workflows

function stillWorkflow(id, scene) {
  const field = process.env.PROMPT_FIELD || 'image';
  const positive = `${expand(scene[field])}, ${story.style}`;
  return {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'Juggernaut-XL_v9.safetensors' } },
    2: { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: positive } },
    3: { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: story.negative + (scene.negative ? ', ' + scene.negative : '') } },
    4: { class_type: 'EmptyLatentImage', inputs: { width: 1344, height: 768, batch_size: 1 } },
    5: { class_type: 'KSampler', inputs: {
      model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0],
      seed: seedFor(id), steps: Number(process.env.STEPS || 32), cfg: 4.5,
      sampler_name: 'dpmpp_2m_sde', scheduler: 'karras', denoise: 1,
    } },
    // Zweiter Durchgang in 1,5-facher Auflösung: Gesichter und besonders Augen
    // sind im ersten Durchgang nur wenige Pixel groß und werden hier nachgezeichnet.
    8: { class_type: 'LatentUpscaleBy', inputs: { samples: ['5', 0], upscale_method: 'bislerp', scale_by: 1.5 } },
    9: { class_type: 'KSampler', inputs: {
      model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['8', 0],
      seed: seedFor(id) + 1, steps: 22, cfg: 4.5,
      sampler_name: 'dpmpp_2m_sde', scheduler: 'karras', denoise: 0.42,
    } },
    6: { class_type: 'VAEDecode', inputs: { samples: ['9', 0], vae: ['1', 2] } },
    7: { class_type: 'SaveImage', inputs: { images: ['6', 0], filename_prefix: `ceyx/${id}` } },
  };
}

function clipWorkflow(id, scene, imageName) {
  const positive = `${expand(scene.motion)}. ${expand(scene.image)}. cinematic, realistic, smooth natural motion, film grain`;
  const negative = 'static, still image, frozen, cartoon, deformed, extra limbs, morphing face, distorted eyes, blinking artifacts, blurry, low quality, text, watermark, subtitles, nude, naked, topless, cleavage, undressing';
  return {
    1: { class_type: 'UNETLoader', inputs: { unet_name: 'wan2.2_ti2v_5B_fp16.safetensors', weight_dtype: 'default' } },
    2: { class_type: 'CLIPLoader', inputs: { clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', type: 'wan', device: 'default' } },
    3: { class_type: 'VAELoader', inputs: { vae_name: 'wan2.2_vae.safetensors' } },
    4: { class_type: 'LoadImage', inputs: { image: imageName } },
    5: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: positive } },
    6: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 0], text: negative } },
    7: { class_type: 'Wan22ImageToVideoLatent', inputs: {
      vae: ['3', 0], start_image: ['4', 0],
      width: Number(process.env.W || 1280), height: Number(process.env.H || 704),
      length: Number(process.env.FRAMES || 121), batch_size: 1,
    } },
    8: { class_type: 'ModelSamplingSD3', inputs: { model: ['1', 0], shift: 8 } },
    9: { class_type: 'KSampler', inputs: {
      model: ['8', 0], positive: ['5', 0], negative: ['6', 0], latent_image: ['7', 0],
      seed: seedFor(id), steps: Number(process.env.STEPS || 20), cfg: 5,
      sampler_name: 'uni_pc', scheduler: 'simple', denoise: 1,
    } },
    10: { class_type: 'VAEDecode', inputs: { samples: ['9', 0], vae: ['3', 0] } },
    11: { class_type: 'CreateVideo', inputs: { images: ['10', 0], fps: 24 } },
    12: { class_type: 'SaveVideo', inputs: { video: ['11', 0], filename_prefix: `ceyx/${id}`, format: 'auto', 'format.codec': 'auto' } },
  };
}

/**
 * Wan 2.2 I2V A14B (GGUF Q4) mit lightx2v-LoRA: 4 Schritte, zwei Experten.
 * Deutlich realistischere Bewegung und Physik als das 5B-Modell. Das Modell
 * arbeitet nativ mit 16 fps; makeClip interpoliert danach auf 24 fps.
 */
function clipWorkflow14b(id, scene, imageName, endName) {
  const positive = `${expand(scene.motion)}. ${expand(scene.image)}. cinematic, photorealistic, natural realistic motion, film grain`;
  const negative = 'static, frozen, cartoon, 3d render, deformed, extra limbs, morphing, melting, distorted face, blurry, low quality, text, watermark, subtitles, nude, naked, topless, cleavage';
  const seed = seedFor(id);
  return {
    1: { class_type: 'UnetLoaderGGUF', inputs: { unet_name: 'Wan2.2-I2V-A14B-HighNoise-Q4_K_S.gguf' } },
    2: { class_type: 'UnetLoaderGGUF', inputs: { unet_name: 'Wan2.2-I2V-A14B-LowNoise-Q4_K_S.gguf' } },
    3: { class_type: 'LoraLoaderModelOnly', inputs: { model: ['1', 0], lora_name: 'wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors', strength_model: 1 } },
    4: { class_type: 'LoraLoaderModelOnly', inputs: { model: ['2', 0], lora_name: 'wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors', strength_model: 1 } },
    5: { class_type: 'ModelSamplingSD3', inputs: { model: ['3', 0], shift: 5 } },
    6: { class_type: 'ModelSamplingSD3', inputs: { model: ['4', 0], shift: 5 } },
    7: { class_type: 'CLIPLoader', inputs: { clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', type: 'wan', device: 'default' } },
    8: { class_type: 'VAELoader', inputs: { vae_name: 'wan_2.1_vae.safetensors' } },
    9: { class_type: 'LoadImage', inputs: { image: imageName } },
    10: { class_type: 'CLIPTextEncode', inputs: { clip: ['7', 0], text: positive } },
    11: { class_type: 'CLIPTextEncode', inputs: { clip: ['7', 0], text: negative } },
    ...(endName ? { 18: { class_type: 'LoadImage', inputs: { image: endName } } } : {}),
    12: { class_type: endName ? 'WanFirstLastFrameToVideo' : 'WanImageToVideo', inputs: {
      positive: ['10', 0], negative: ['11', 0], vae: ['8', 0], start_image: ['9', 0],
      ...(endName ? { end_image: ['18', 0] } : {}),
      width: Number(process.env.W || 832), height: Number(process.env.H || 480),
      length: Number(process.env.FRAMES || 81), batch_size: 1,
    } },
    13: { class_type: 'KSamplerAdvanced', inputs: {
      model: ['5', 0], add_noise: 'enable', noise_seed: seed, steps: 4, cfg: 1,
      sampler_name: 'euler', scheduler: 'simple', positive: ['12', 0], negative: ['12', 1],
      latent_image: ['12', 2], start_at_step: 0, end_at_step: 2, return_with_leftover_noise: 'enable',
    } },
    14: { class_type: 'KSamplerAdvanced', inputs: {
      model: ['6', 0], add_noise: 'disable', noise_seed: seed, steps: 4, cfg: 1,
      sampler_name: 'euler', scheduler: 'simple', positive: ['12', 0], negative: ['12', 1],
      latent_image: ['13', 0], start_at_step: 2, end_at_step: 10000, return_with_leftover_noise: 'disable',
    } },
    15: { class_type: 'VAEDecode', inputs: { samples: ['14', 0], vae: ['8', 0] } },
    16: { class_type: 'CreateVideo', inputs: { images: ['15', 0], fps: 16 } },
    17: { class_type: 'SaveVideo', inputs: { video: ['16', 0], filename_prefix: `ceyx/${id}_14b`, format: 'auto', 'format.codec': 'auto' } },
  };
}

/** 16 → 24 fps per Bewegungsinterpolation (ffmpeg minterpolate). */
function to24fps(src, dest) {
  const ff = 'C:/AI/LatentSync/ffbin/ffmpeg.exe';
  const r = spawnSync(ff, ['-y', '-loglevel', 'error', '-i', src,
    '-vf', 'minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1',
    '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', dest]);
  if (r.status !== 0) throw new Error(`ffmpeg: ${r.stderr}`);
}

/** Endbild aus dem Startbild (img2img), damit Komposition und Licht gleich bleiben. */
function endStillWorkflow(id, scene, imageName) {
  const positive = `${expand(scene.end_image)}, ${story.style}`;
  return {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'Juggernaut-XL_v9.safetensors' } },
    2: { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: positive } },
    3: { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: story.negative + (scene.negative ? ', ' + scene.negative : '') } },
    4: { class_type: 'LoadImage', inputs: { image: imageName } },
    5: { class_type: 'VAEEncode', inputs: { pixels: ['4', 0], vae: ['1', 2] } },
    6: { class_type: 'KSampler', inputs: {
      model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['5', 0],
      seed: seedFor(id) + 7, steps: 32, cfg: 5, sampler_name: 'dpmpp_2m_sde', scheduler: 'karras',
      denoise: Number(process.env.END_DENOISE || 0.68),
    } },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    8: { class_type: 'SaveImage', inputs: { images: ['7', 0], filename_prefix: `ceyx/${id}_end` } },
  };
}

// ------------------------------------------------------------ Ablauf

function firstFile(outputs) {
  for (const o of Object.values(outputs)) {
    for (const key of ['images', 'videos', 'gifs']) if (o[key]?.length) return o[key][0];
  }
  return null;
}

async function makeStill(id) {
  // VARIANT=n schreibt Kandidaten nach stills/_var/<id>_<n>.png zum Vergleichen
  const v = process.env.VARIANT;
  if (v) fs.mkdirSync(path.join(stillsDir, '_var'), { recursive: true });
  const tag = process.env.PROMPT_FIELD === 'end_image' ? '_end' : '';
  const dest = v ? path.join(stillsDir, '_var', `${id}${tag}_t${v}.png`) : path.join(stillsDir, `${id}${tag}.png`);
  if (fs.existsSync(dest) && !FORCE) return console.log(`= still ${id} (vorhanden)`);
  const t = Date.now();
  const out = await waitFor(await queue(stillWorkflow(id, story.scenes[id])));
  await download(firstFile(out), dest);
  console.log(`+ still ${id}  ${((Date.now() - t) / 1000).toFixed(0)} s`);
}

async function makeEndStill(id) {
  const scene = story.scenes[id];
  if (!scene.end_image) return console.log(`! ${id}: kein end_image`);
  const v = process.env.VARIANT;
  const dest = v ? path.join(stillsDir, '_var', `${id}_end_${v}.png`) : path.join(stillsDir, `${id}_end.png`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const name = await upload(path.join(stillsDir, `${id}.png`), `ceyx_${id}.png`);
  const out = await waitFor(await queue(endStillWorkflow(id, scene, name)));
  await download(firstFile(out), dest);
  console.log(`+ end ${id}`);
}

async function makeClip(id) {
  const dest = path.join(clipsDir, `${id}.mp4`);
  const still = path.join(stillsDir, `${id}.png`);
  if (fs.existsSync(dest) && !FORCE) return console.log(`= clip ${id} (vorhanden)`);
  if (!fs.existsSync(still)) return console.log(`! clip ${id}: kein Standbild`);
  const t = Date.now();
  const name = await upload(still, `ceyx_${id}.png`);
  if (process.env.MODEL === '14b') {
    const endPath = path.join(stillsDir, `${id}_end.png`);
    const endName = fs.existsSync(endPath) ? await upload(endPath, `ceyx_${id}_end.png`) : null;
    const out = await waitFor(await queue(clipWorkflow14b(id, story.scenes[id], name, endName)));
    const raw = path.join(clipsDir, `${id}_16fps.mp4`);
    await download(firstFile(out), raw);
    to24fps(raw, dest);
    fs.unlinkSync(raw);
  } else {
    const out = await waitFor(await queue(clipWorkflow(id, story.scenes[id], name)));
    await download(firstFile(out), dest);
  }
  console.log(`+ clip ${id}  ${((Date.now() - t) / 1000).toFixed(0)} s`);
}

for (const id of ids) {
  if (!story.scenes[id]) { console.log(`? unbekannte Szene ${id}`); continue; }
  try {
    if (mode === 'stills' || mode === 'all') await makeStill(id);
    if (mode === 'end') await makeEndStill(id);
    if (mode === 'clips' || mode === 'all') await makeClip(id);
  } catch (e) {
    console.log(`! ${id}: ${e.message}`);
  }
}
console.log('fertig');
