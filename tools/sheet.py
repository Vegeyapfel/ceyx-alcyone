# Kontaktabzug: alle (oder ausgewählte) Standbilder beschriftet auf einem Bogen.
#   python sheet.py <out.png> [id ...]
import os, sys
from PIL import Image, ImageDraw

here = os.path.dirname(os.path.abspath(__file__))
stills = os.path.join(here, '..', 'stills')
out = sys.argv[1]
ids = sys.argv[2:] or sorted(f[:-4] for f in os.listdir(stills) if f.endswith('.png'))

tw, th, cols = 480, 275, 3
rows = (len(ids) + cols - 1) // cols
sheet = Image.new('RGB', (tw * cols, (th + 22) * rows), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, id_ in enumerate(ids):
    p = os.path.join(stills, id_ + '.png')
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert('RGB').resize((tw, th))
    x, y = (i % cols) * tw, (i // cols) * (th + 22)
    sheet.paste(im, (x, y + 22))
    d.text((x + 6, y + 5), id_, fill=(240, 220, 150))
sheet.save(out)
print(len(ids), 'Bilder')
