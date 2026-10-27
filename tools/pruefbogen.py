# Prüfbogen für fertige Clips: eine Zeile je Clip mit sechs Bildern.
#   python tools/pruefbogen.py <ziel.png> <id> [id ...]
import os, sys, av
from PIL import Image, ImageDraw
hier = os.path.dirname(os.path.abspath(__file__))
clips = os.path.join(hier, '..', 'clips')
ziel, ids = sys.argv[1], sys.argv[2:]
tw, th = 320, 180
S = Image.new('RGB', (tw * 6, (th + 16) * len(ids)), (12, 12, 12))
d = ImageDraw.Draw(S)
for r, i in enumerate(ids):
    c = av.open(os.path.join(clips, i + '.mp4'))
    fr = [f.to_image() for f in c.decode(c.streams.video[0])]
    y = r * (th + 16)
    d.text((6, y + 3), f'{i}  {len(fr)} Bilder  {len(fr)/24:.1f} s', fill=(240, 220, 150))
    for k, x in enumerate([int(n * (len(fr) - 1) / 5) for n in range(6)]):
        S.paste(fr[x].resize((tw, th)), (k * tw, y + 16))
S.save(ziel)
print('Prüfbogen:', ziel)
