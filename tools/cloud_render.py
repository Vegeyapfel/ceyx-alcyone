# Rechnet Einstellungen des Films auf einer geliehenen Cloud-Grafikkarte
# (Kaggle oder Colab, je eine T4 mit 16 GB). Holt ComfyUI, die Modelle und die
# Standbilder selbst, arbeitet die Liste ab und legt die Clips als Zip ab.
#
#   !curl -sL <rohlink>/tools/cloud_render.py -o r.py && python r.py hafen_1:2 ufer_1:3
#
# Argumente sind "id:abschnitte". Ohne Argumente wird LISTE unten verwendet.
# Auf 16 GB läuft die feinere Stufe 1024x576, die auf der 3070 nicht passt.

import json, os, subprocess, sys, time, urllib.request, zipfile, shutil

REPO = os.environ.get('REPO', 'https://raw.githubusercontent.com/Vegeyapfel/ceyx-alcyone/main')
W, H = int(os.environ.get('W', 1024)), int(os.environ.get('H', 576))
FRAMES = int(os.environ.get('FRAMES', 121))
STEPS, SWITCH = int(os.environ.get('STEPS', 8)), int(os.environ.get('SWITCH', 4))
LISTE = ['hafen_1:2', 'ufer_1:3', 'traum_1:2']
AUS = '/kaggle/working' if os.path.isdir('/kaggle/working') else '/content/aus'
# ComfyUI und Modelle gehören auf den großen Zwischenspeicher: der Ausgabeordner
# ist bei Kaggle auf 20 GB begrenzt, die Modelle brauchen rund 24 GB.
ARBEIT = '/kaggle/temp' if os.path.isdir('/kaggle') else ('/content/arbeit' if os.path.isdir('/content') else '.')
os.makedirs(ARBEIT, exist_ok=True)
os.chdir(ARBEIT)
print('Arbeitsordner:', ARBEIT, flush=True)

def sh(c):
    print('>', c, flush=True)
    subprocess.run(c, shell=True, check=False)

def hole(url, ziel):
    if os.path.exists(ziel) and os.path.getsize(ziel) > 1000:
        return
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    print('lade', os.path.basename(ziel), flush=True)
    urllib.request.urlretrieve(url, ziel)

# ---------------------------------------------------------------- Aufbau
def aufbau():
    if not os.path.isdir('ComfyUI'):
        sh('git clone --depth 1 https://github.com/comfyanonymous/ComfyUI')
        sh('git clone --depth 1 https://github.com/city96/ComfyUI-GGUF ComfyUI/custom_nodes/ComfyUI-GGUF')
        sh('pip install -q -r ComfyUI/requirements.txt gguf av')
    HF = 'https://huggingface.co'
    M = [
        (f'{HF}/QuantStack/Wan2.2-I2V-A14B-GGUF/resolve/main/HighNoise/Wan2.2-I2V-A14B-HighNoise-Q4_K_S.gguf',
         'ComfyUI/models/unet/Wan2.2-I2V-A14B-HighNoise-Q4_K_S.gguf'),
        (f'{HF}/QuantStack/Wan2.2-I2V-A14B-GGUF/resolve/main/LowNoise/Wan2.2-I2V-A14B-LowNoise-Q4_K_S.gguf',
         'ComfyUI/models/unet/Wan2.2-I2V-A14B-LowNoise-Q4_K_S.gguf'),
        (f'{HF}/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors',
         'ComfyUI/models/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors'),
        (f'{HF}/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors',
         'ComfyUI/models/loras/wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors'),
        (f'{HF}/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/vae/wan_2.1_vae.safetensors',
         'ComfyUI/models/vae/wan_2.1_vae.safetensors'),
        (f'{HF}/Comfy-Org/Wan_2.2_ComfyUI_Repackaged/resolve/main/split_files/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors',
         'ComfyUI/models/text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors'),
    ]
    for url, ziel in M:
        hole(url, ziel)

def starte_server():
    subprocess.Popen('python ComfyUI/main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch',
                     shell=True, stdout=open('comfy.log', 'w'), stderr=subprocess.STDOUT)
    for _ in range(120):
        try:
            urllib.request.urlopen('http://127.0.0.1:8188/system_stats', timeout=3)
            print('ComfyUI bereit', flush=True)
            return
        except Exception:
            time.sleep(5)
    raise SystemExit('ComfyUI startet nicht – siehe comfy.log')

# ---------------------------------------------------------------- Rechnen
def post(pfad, daten=None, roh=False):
    req = urllib.request.Request('http://127.0.0.1:8188' + pfad,
                                 data=json.dumps(daten).encode() if daten else None,
                                 headers={'Content-Type': 'application/json'} if daten else {})
    with urllib.request.urlopen(req) as r:
        return r.read() if roh else json.loads(r.read())

def lade_bild_hoch(pfad):
    import uuid
    grenze = uuid.uuid4().hex
    name = os.path.basename(pfad)
    teile = (f'--{grenze}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\n'
             'Content-Type: image/png\r\n\r\n').encode() + open(pfad, 'rb').read() + \
            f'\r\n--{grenze}\r\nContent-Disposition: form-data; name="overwrite"\r\n\r\ntrue\r\n--{grenze}--\r\n'.encode()
    req = urllib.request.Request('http://127.0.0.1:8188/upload/image', data=teile,
                                 headers={'Content-Type': f'multipart/form-data; boundary={grenze}'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['name']

def workflow(szene, bild, seed):
    def erweitern(t):
        for k, v in STORY['characters'].items():
            t = t.replace(k, v)
        return t
    pos = f"{erweitern(szene['motion'])}. {erweitern(szene['image'])}. cinematic, photorealistic, natural realistic motion, film grain"
    neg = ('static, frozen, cartoon, 3d render, deformed, extra limbs, morphing, melting, distorted face, '
           'blurry, low quality, text, watermark, subtitles, nude, naked, topless, cleavage'
           + (', ' + szene['negative'] if szene.get('negative') else ''))
    return {
        1: {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'Wan2.2-I2V-A14B-HighNoise-Q4_K_S.gguf'}},
        2: {'class_type': 'UnetLoaderGGUF', 'inputs': {'unet_name': 'Wan2.2-I2V-A14B-LowNoise-Q4_K_S.gguf'}},
        3: {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['1', 0], 'lora_name': 'wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors', 'strength_model': 1}},
        4: {'class_type': 'LoraLoaderModelOnly', 'inputs': {'model': ['2', 0], 'lora_name': 'wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors', 'strength_model': 1}},
        5: {'class_type': 'ModelSamplingSD3', 'inputs': {'model': ['3', 0], 'shift': 5}},
        6: {'class_type': 'ModelSamplingSD3', 'inputs': {'model': ['4', 0], 'shift': 5}},
        7: {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', 'type': 'wan', 'device': 'default'}},
        8: {'class_type': 'VAELoader', 'inputs': {'vae_name': 'wan_2.1_vae.safetensors'}},
        9: {'class_type': 'LoadImage', 'inputs': {'image': bild}},
        10: {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['7', 0], 'text': pos}},
        11: {'class_type': 'CLIPTextEncode', 'inputs': {'clip': ['7', 0], 'text': neg}},
        12: {'class_type': 'WanImageToVideo', 'inputs': {'positive': ['10', 0], 'negative': ['11', 0], 'vae': ['8', 0],
             'start_image': ['9', 0], 'width': W, 'height': H, 'length': FRAMES, 'batch_size': 1}},
        13: {'class_type': 'KSamplerAdvanced', 'inputs': {'model': ['5', 0], 'add_noise': 'enable', 'noise_seed': seed,
             'steps': STEPS, 'cfg': 1, 'sampler_name': 'euler', 'scheduler': 'simple', 'positive': ['12', 0],
             'negative': ['12', 1], 'latent_image': ['12', 2], 'start_at_step': 0, 'end_at_step': SWITCH,
             'return_with_leftover_noise': 'enable'}},
        14: {'class_type': 'KSamplerAdvanced', 'inputs': {'model': ['6', 0], 'add_noise': 'disable', 'noise_seed': seed,
             'steps': STEPS, 'cfg': 1, 'sampler_name': 'euler', 'scheduler': 'simple', 'positive': ['12', 0],
             'negative': ['12', 1], 'latent_image': ['13', 0], 'start_at_step': SWITCH, 'end_at_step': 10000,
             'return_with_leftover_noise': 'disable'}},
        15: {'class_type': 'VAEDecode', 'inputs': {'samples': ['14', 0], 'vae': ['8', 0]}},
        16: {'class_type': 'CreateVideo', 'inputs': {'images': ['15', 0], 'fps': 16}},
        17: {'class_type': 'SaveVideo', 'inputs': {'video': ['16', 0], 'filename_prefix': 'ceyx', 'format': 'auto', 'format.codec': 'auto'}},
    }

def rechne(szene, bild_pfad, seed, ziel):
    name = lade_bild_hoch(bild_pfad)
    q = post('/prompt', {'prompt': workflow(szene, name, seed)})
    pid = q['prompt_id']
    while True:
        h = post(f'/history/{pid}').get(pid)
        if h and h.get('status', {}).get('completed'):
            break
        if h and h.get('status', {}).get('status_str') == 'error':
            raise RuntimeError(json.dumps(h['status'].get('messages', [])[-1:]))
        time.sleep(5)
    datei = None
    for o in h['outputs'].values():
        for schl in ('images', 'videos', 'gifs'):
            if o.get(schl):
                datei = o[schl][0]
    roh = post(f"/view?filename={datei['filename']}&subfolder={datei.get('subfolder','')}&type={datei.get('type','output')}", roh=True)
    open(ziel, 'wb').write(roh)

def letztes_bild(clip, ziel):
    import av
    c = av.open(clip)
    f = None
    for frame in c.decode(c.streams.video[0]):
        f = frame
    f.to_image().save(ziel)

# ---------------------------------------------------------------- Ablauf
aufbau()
STORY = json.loads(urllib.request.urlopen(REPO + '/story.json').read())
starte_server()
os.makedirs(AUS, exist_ok=True)
os.makedirs('bilder', exist_ok=True)

auftraege = sys.argv[1:] or LISTE
for auftrag in auftraege:
    sid, _, n = auftrag.partition(':')
    n = int(n or 2)
    szene = STORY['scenes'][sid]
    start = f'bilder/{sid}.png'
    hole(f'{REPO}/stills/{sid}.png', start)
    teile = []
    for k in range(1, n + 1):
        ziel = f'{AUS}/{sid}_{k}.mp4'
        t = time.time()
        rechne(szene, start, 4242 + k * 17, ziel)
        print(f'+ {sid} Abschnitt {k}  {(time.time()-t)/60:.1f} min', flush=True)
        teile.append(ziel)
        if k < n:
            start = f'bilder/{sid}_{k}_ende.png'
            letztes_bild(ziel, start)
    with open(f'{AUS}/{sid}_liste.txt', 'w') as f:
        f.write('\n'.join(f"file '{p}'" for p in teile))
    sh(f"ffmpeg -y -loglevel error -f concat -safe 0 -i {AUS}/{sid}_liste.txt -c copy {AUS}/{sid}_roh.mp4")
    sh(f"ffmpeg -y -loglevel error -i {AUS}/{sid}_roh.mp4 -vf "
       f"minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1 "
       f"-c:v libx264 -crf 17 -pix_fmt yuv420p {AUS}/{sid}.mp4")
    for p in teile + [f'{AUS}/{sid}_roh.mp4', f'{AUS}/{sid}_liste.txt']:
        if os.path.exists(p):
            os.remove(p)
    print(f'=== {sid} fertig', flush=True)

with zipfile.ZipFile(f'{AUS}/clips_cloud.zip', 'w') as z:
    for f in os.listdir(AUS):
        if f.endswith('.mp4'):
            z.write(f'{AUS}/{f}', f)
print('FERTIG – clips_cloud.zip liegt in', AUS, flush=True)
