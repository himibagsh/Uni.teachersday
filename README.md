# Эрхэм хүндэт багшдаа

The page behind the QR code on the back of the chemistry Teachers' Day card.
МУИС · ШУС · Химийн тэнхим, «Багш, химийн боловсрол» хөтөлбөрийн оюутнууд,
2026.10.05.

A teacher scans the QR on the card, lands here, and gets three things: the
greeting, the video of how we made the card, flowers and cake, and the answer
to the periodic-table puzzle hidden behind a tap — the same way the printed
answer sits under a glued flap.

Plain HTML, CSS and JavaScript. No build step, no dependencies.

```
index.html
assets/css/style.css
assets/js/main.js        <- the only file you edit
assets/favicon.svg
assets/img/bagsh/        <- teacher portraits go here
assets/video/            <- a self-hosted film goes here
print/qr.svg             <- the QR code for the card
print/qr.png
```

## Looking at it

```sh
python3 -m http.server 8000
# http://localhost:8000
```

## The QR code for the card

`print/qr.svg` (vector, best for print) and `print/qr.png` (900 × 900) both
encode:

```
https://himibagsh.github.io/Uni.teachersday/
```

The code uses error-correction level H, so it still scans with glue, a fold or
a smudge across a corner. Place it in the "QR код наах хэсэг" box on the back of
the card at 30–40 mm and keep the white margin around it — that quiet zone is
part of the code.

**Before printing**, publish the site and scan the code with a real phone. The
URL only works once GitHub Pages is switched on (below). If you ever change the
repository name or the branch Pages serves from, the URL changes and every
printed card goes dead — regenerate the code at that point.

## Publishing

Repository → **Settings → Pages** → *Source*: **Deploy from a branch**, branch
`claude/great-newton-6uqpee`, folder `/ (root)`. The site is live at the URL
above within a minute or two.

## Dropping the film in

The page shows a slate with a live countdown until the film exists. When the
edit is finished, change the `CONFIG` block at the top of `assets/js/main.js`.
Nothing in `index.html` needs touching.

A file you host yourself (H.264 `.mp4`):

```js
videoReady: true,
videoSrc: 'assets/video/beltgel.mp4',
videoPoster: 'assets/video/poster.jpg',   // optional
```

YouTube or Vimeo — use the **embed** address, not the `watch?v=` one:

```js
videoReady: true,
videoSrc: 'https://www.youtube.com/embed/VIDEO_ID',
```

The script picks a `<video>` element for a file and an `<iframe>` for an embed
address, and stops the countdown either way.

GitHub has a 100 MB limit per file, so anything longer than a couple of minutes
at good quality belongs on YouTube rather than in `assets/video/`.

While you wait, you can move the production markers under the slate:

```js
stages: [
  { label: 'Зураг авалт', state: 'done'   },
  { label: 'Эвлүүлэг',    state: 'done'   },
  { label: 'Дуу, өнгө',   state: 'active' }
]
```

`state` is `done`, `active` or `pending`. If 2026.10.05 12:00 passes while
`videoReady` is still `false`, the countdown stops by itself and the slate
reads "Бичлэг удахгүй энд тавигдана".

## Adding the teachers

The "Багш нартаа" section is hidden until you fill in the `teachers` list in
`assets/js/main.js`:

```js
teachers: [
  { name: 'Б. Отгонбаатар', role: 'Профессор', symbol: 'От',
    photo: 'assets/img/bagsh/otgonbaatar.jpg' },
  { name: 'Д. Сарантуяа',   role: 'Дэд профессор', symbol: 'Са',
    photo: 'assets/img/bagsh/sarantuya.jpg' }
]
```

Each teacher is drawn as a periodic-table cell. `photo` fills the cell; drop
the files in `assets/img/bagsh/` as square-ish JPEGs around 600 × 700, since
they are cropped to fit. Without a `photo`, the `symbol` shows instead, so the
section works before the portraits are ready.

## The puzzle

The card hides **БАЯРЫН МЭНД** in the periodic table: each clue names an
element, and its atomic number is the position of a letter in the Mongolian
alphabet. The page shows the same ten cells face down and flips them on a tap.

| | Element | Z | Letter | | Element | Z | Letter |
|---|---|---|---|---|---|---|---|
| 1 | He · Гели | 2 | Б | 7 | Si · Цахиур | 14 | М |
| 2 | H · Устөрөгч | 1 | А | 8 | As · Хүнцэл | 33 | Э |
| 3 | Br · Бром | 35 | Я | 9 | P · Фосфор | 15 | Н |
| 4 | K · Кали | 19 | Р | 10 | B · Бор | 5 | Д |
| 5 | Ga · Галли | 31 | Ы | | | | |
| 6 | P · Фосфор | 15 | Н | | | | |

The cells are written out in `index.html` under `#word1` and `#word2`. If a
clue changes on the card, change the matching cell here so the two agree.

## Design

The page continues the printed card rather than restating it: the same
letterspaced institution line, the same copper rule under an italic salutation,
and the periodic-table cell as the one repeating object — atomic number in the
corner, symbol in the middle, Mongolian letter underneath.

Colour is six custom properties at the top of `style.css`, sampled from the
card artwork: paper, panel, ink `#1b2240`, soft ink, rule, copper `#b35228`.
Light and dark are both defined there and follow the reader's phone setting,
which matters because most people arrive here from a camera in a corridor.

Type is Playfair Display for the serif voice, Golos Text for running text and
IBM Plex Mono for the atomic numbers and labels. All three carry Cyrillic.
