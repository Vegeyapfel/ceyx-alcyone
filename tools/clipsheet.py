# Prüfbogen: pro Clip eine Zeile mit 4 Bildern (Anfang, 1/3, 2/3, Ende).
#   python clipsheet.py <out_prefix> [id ...]
import os, sys, av
from PIL import Image, ImageDraw
here = os.path.dirname(os.path.abspath(__file__))
clips = os.path.join(here, '..', 'clips')
prefix = sys.argv[1]
ids = sys.argv[2:] or sorted(f[:-4] for f in os.listdir(clips) if f.endswith('.mp4'))
tw, th, per = 400, 225, 8
for page in range(0, len(ids), per):
    chunk = ids[page:page + per]
    S = Image.new('RGB', (tw * 4, (th + 20) * len(chunk)), (15, 15, 15))
    d = ImageDraw.Draw(S)
    for r, id_ in enumerate(chunk):
        c = av.open(os.path.join(clips, id_ + '.mp4'))
        fr = [f.to_image() for f in c.decode(c.streams.video[0])]
        y = r * (th + 20)
        d.text((6, y + 4), f'{id_}  ({len(fr)} frames)', fill=(240, 220, 150))
        for k, idx in enumerate([0, len(fr) // 3, 2 * len(fr) // 3, len(fr) - 1]):
            S.paste(fr[idx].resize((tw, th)), (k * tw, y + 20))
    S.save(f'{prefix}_{page // per}.png')
    print('page', page // per, chunk)
