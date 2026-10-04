"""Google Form-ын CSV хариултыг assets/data/letters.js болгон хөрвүүлнэ.

    python3 scripts/letters.py hariult.csv [--form https://forms.gle/XXXX]

Маягтын багана дараах утгатай байхад л хангалттай (толгойн нэр нь ойролцоо
байсан ч танина):

    Багш            — хэний тухай (жагсаалтаас сонгоно)
    Захидал         — захидлын бичвэр
    Нэр             — бичсэн хүний нэр (заавал биш)
    Курс            — анги, курс (заавал биш)

Бүх захидал хүн уншиж шалгасны дараа л нийтлэгдэнэ: энэ скрипт файл бичээд
зогсох ба git-д commit хийх эсэхийг та шийднэ.
"""
import csv, json, re, sys, unicodedata
from pathlib import Path

OUT = Path('assets/data/letters.js')
IMG = Path('assets/img/bagsh')

def slugs():
    """slug -> монгол нэр, зургийн файлын нэрнээс."""
    out = {}
    for p in sorted(IMG.glob('*.jpg')):
        out[p.stem.split('-', 1)[1]] = p.stem
    return out

# Монгол нэр -> slug. Зургийн файлын нэр нь латинаар бичигдсэн тул
# багшийн нэрийг таних хүснэгтийг энд барина.
NAMES = {
 'болормаа':'bolormaa','наранмандах':'naranmandakh','рэнцэнмядаг':'rentsenmyadag',
 'сарангэрэл':'sarangerel','энхсаруул':'enkhsaruul','алтангэрэл':'altangerel',
 'амгалан':'amgalan','буян':'buyan','ирэхбаяр':'irekhbayar','мөнхжаргал':'munkhjargal',
 'нямгэрэл':'nyamgerel','оюунбилэг':'oyunbileg','саруул':'saruul','сүхбаатар':'sukhbaatar',
 'сайнбилэг':'sainbileg','манлайбаатар':'manlaibaatar','долгормаа':'dolgormaa',
 'гансувд':'gansuvd','ербулан':'erbulan','сарантуяа':'sarantuya',
 'хишигсүрэн':'khishigsuren','хонгорзул':'khongorzul','энхжаргал':'enkhjargal',
}

def norm(s):
    return unicodedata.normalize('NFC', (s or '')).strip().lower()

def to_slug(cell):
    """«О.Болормаа», «Болормаа багш» гэх мэтийг slug болгоно."""
    t = norm(cell)
    t = re.sub(r'^[а-яөүё]\.\s*', '', t)          # эхний үсгийн товчлол
    t = re.sub(r'\s*багш.*$', '', t)
    t = re.sub(r'[^а-яөүё]', '', t)
    if t in NAMES:
        return NAMES[t]
    for key, slug in NAMES.items():               # хэсэгчилсэн тааралт
        if key in t or t in key:
            return slug
    return None

def pick(header, *words):
    for i, h in enumerate(header):
        hl = norm(h)
        if any(w in hl for w in words):
            return i
    return None

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    form = ''
    if '--form' in sys.argv:
        form = sys.argv[sys.argv.index('--form') + 1]

    rows = list(csv.reader(src.open(encoding='utf-8-sig')))
    if not rows:
        sys.exit('CSV хоосон байна.')
    header, body = rows[0], rows[1:]

    i_who  = pick(header, 'багш', 'хэн')
    i_text = pick(header, 'захидал', 'захиа', 'бичвэр', 'мессеж')
    i_name = pick(header, 'нэр', 'таны нэр')
    i_note = pick(header, 'курс', 'анги', 'хөтөлбөр')
    if i_who is None or i_text is None:
        sys.exit(f'«Багш», «Захидал» баганыг олсонгүй. Толгой: {header}')

    letters, skipped = {}, []
    for r in body:
        def cell(i):
            return r[i].strip() if i is not None and i < len(r) else ''
        text = cell(i_text)
        if not text:
            continue
        slug = to_slug(cell(i_who))
        if not slug:
            skipped.append(cell(i_who))
            continue
        entry = {'text': text}
        if cell(i_name): entry['from'] = cell(i_name)
        if cell(i_note): entry['note'] = cell(i_note)
        letters.setdefault(slug, []).append(entry)

    known = slugs()
    unknown = [s for s in letters if s not in known]
    if unknown:
        sys.exit(f'Зурагтай таарахгүй slug: {unknown}')

    head = OUT.read_text(encoding='utf-8').split('window.LETTERS')[0]
    OUT.write_text(
        head + 'window.LETTERS = {\n'
        f'  form: {json.dumps(form, ensure_ascii=False)},\n'
        '  letters: ' + json.dumps(letters, ensure_ascii=False, indent=2).replace('\n', '\n  ') + '\n};\n',
        encoding='utf-8')

    total = sum(len(v) for v in letters.values())
    print(f'{total} захидал, {len(letters)} багшид -> {OUT}')
    if skipped:
        print('Багшийг нь танисангүй:', sorted(set(skipped)))
    print('Нийтлэхийн өмнө уншиж шалгаад commit хийнэ үү.')

if __name__ == '__main__':
    main()
