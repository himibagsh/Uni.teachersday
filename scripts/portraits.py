"""Rebuild assets/img/bagsh/* from the roster sheet and the hi-res originals."""
from PIL import Image, ImageOps, ImageEnhance
import json, os, sys

SRC = os.environ.get('PORTRAIT_SRC', 'sources')  # roster sheet 1.jpg + hi-res originals
OUT = 'assets/img/bagsh'
INK, PAPER = (0x1b, 0x22, 0x40), (0xfb, 0xfb, 0xfd)
RATIO, W_OUT = 4/5, 560

PEOPLE = [
 ('bolormaa','О.Болормаа','Тэнхимийн эрхлэгч, Профессор'),
 ('naranmandakh','Ш.Наранмандах','Профессор'),
 ('rentsenmyadag','Д.Рэнцэнмядаг','Профессор'),
 ('sarangerel','Д.Сарангэрэл','Профессор'),
 ('enkhsaruul','Б.Энхсаруул','Профессор'),
 ('altangerel','А.Алтангэрэл','Дэд профессор'),
 ('amgalan','Н.Амгалан','Дэд профессор'),
 ('buyan','Ч.Буян','Дэд профессор'),
 ('irekhbayar','Ж.Ирэхбаяр','Дэд профессор'),
 ('munkhjargal','Б.Мөнхжаргал','Дэд профессор'),
 ('nyamgerel','Ч.Нямгэрэл','Дэд профессор'),
 ('oyunbileg','Г.Оюунбилэг','Дэд профессор'),
 ('saruul','И.Саруул','Дэд профессор'),
 ('sukhbaatar','Б.Сүхбаатар','Дэд профессор'),
 ('sainbileg','Ш.Сайнбилэг','Ахлах багш'),
 ('manlaibaatar','П.Манлайбаатар','Дадлагажигч багш'),
 ('dolgormaa','М.Долгормаа','Цагийн багш, Судлаач'),
 ('gansuvd','Г.Гансувд','Тэнхимийн туслах ажилтан'),
 ('erbulan','Т.Ербулан','Лаборант'),
 ('sarantuya','Т.Сарантуяа','Лаборант'),
 ('khishigsuren','Ц.Хишигсүрэн','Лаборант'),
 ('khongorzul','Б.Хонгорзул','Лаборант'),
 ('enkhjargal','Г.Энхжаргал','Лаборант'),
]

BOXES = [
 (20,26,240,300),(268,52,507,295),(558,86,741,300),(787,55,1022,300),(1073,8,1267,300),(1323,76,1532,287),
 (20,390,240,680),(268,422,512,680),(554,417,759,680),(788,446,1032,680),(1060,388,1279,680),(1308,437,1552,680),
 (8,816,252,1060),(284,834,493,1047),(537,824,765,1053),(857,929,962,1060),(1117,939,1222,1060),(1377,929,1482,1060),
 (77,1309,182,1440),(271,1148,508,1440),(597,1309,702,1440),(857,1309,962,1440),(1074,1148,1265,1440),
]
ORIGINALS = {0:'2.jpg', 1:'3.jpg', 2:'4.jpg', 3:'5.jpg'}

# slug -> (zoom, vertical bias) for sources where the face sits small or off-centre
TUNE = {
 'naranmandakh': (0.60, 0.16),
 'oyunbileg':    (0.52, 0.34),
 'sarantuya':    (0.66, 0.12),
 'buyan':        (0.86, 0.20),
}

def duotone(img):
    g = ImageOps.autocontrast(ImageOps.grayscale(img), cutoff=1)
    g = ImageEnhance.Contrast(g).enhance(1.12)
    luts = [[round(INK[c] + (PAPER[c]-INK[c]) * (i/255)) for i in range(256)] for c in range(3)]
    return Image.merge('RGB', tuple(g.point(l) for l in luts))

def crop45(img, bias=0.35):
    w, h = img.size
    nw, nh = (int(round(h*RATIO)), h) if w/h > RATIO else (w, int(round(w/RATIO)))
    x, y = (w-nw)//2, int(round((h-nh)*bias))
    return img.crop((x, y, x+nw, y+nh))

def zoom(img, factor, vbias):
    w, h = img.size
    nw, nh = int(round(w*factor)), int(round(h*factor))
    x, y = (w-nw)//2, int(round((h-nh)*vbias))
    return img.crop((x, y, x+nw, y+nh))

os.makedirs(OUT, exist_ok=True)
sheet = Image.open(f'{SRC}/1.jpg').convert('RGB')
manifest = []
for i, (slug, name, role) in enumerate(PEOPLE):
    img = (Image.open(f'{SRC}/{ORIGINALS[i]}') if i in ORIGINALS else sheet.crop(BOXES[i])).convert('RGB')
    img = crop45(img)
    if slug in TUNE:
        img = crop45(zoom(img, *TUNE[slug]))
    img = duotone(img)
    if img.width > W_OUT:
        img = img.resize((W_OUT, round(W_OUT/RATIO)), Image.LANCZOS)
    path = f'{OUT}/{i+1:02d}-{slug}.jpg'
    img.save(path, 'JPEG', quality=84, optimize=True, progressive=True)
    manifest.append({'n': i+1, 'slug': slug, 'name': name, 'role': role,
                     'file': path, 'size': img.size, 'bytes': os.path.getsize(path)})

json.dump(manifest, open(sys.argv[1] + '/people.json','w') if len(sys.argv) > 1 else open('/dev/null','w'), ensure_ascii=False, indent=1)
print('portraits', len(manifest), '| total', sum(m['bytes'] for m in manifest)//1024, 'KB')
