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
assets/img/bagsh/        <- the 23 portraits, ink duotone, 4:5
assets/video/            <- a self-hosted film goes here
print/qr.svg             <- the QR code for the card
print/qr.png
print/khamt-olon.png     <- the department as one sheet
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

## The roster

All 23 of the department are in `index.html` under `#bagsh`, grouped Профессор
/ Дэд профессор / Багш / Тэнхимийн хамт олон. One person is one block:

```html
<li class="person">
  <div class="person__cell">
    <img class="person__photo" src="assets/img/bagsh/01-bolormaa.jpg"
         alt="О.Болормаа" width="560" height="700" loading="lazy" decoding="async">
    <span class="person__n">01</span>
  </div>
  <p class="person__name">О.Болормаа</p>
  <p class="person__role">Тэнхимийн эрхлэгч</p>
</li>
```

`person__role` is only there when the role differs from the group heading, so
the heading is not repeated under every face.

### The portraits

The photographs came from the department roster sheet. Nineteen were cut out of
that sheet and four were sent as separate files, so the sources ranged from
2417 × 3223 down to 105 × 131, with coloured rings, banners and grey passport
backgrounds all mixed together. They are all now cropped to 4:5 and toned to a
single ink ramp — `#1b2240` in the shadows, `#fbfbfd` in the highlights — which
is what makes 23 photographs of wildly different origin read as one set, and
what lets them sit next to the hand-drawn cards without fighting them.

`scripts/portraits.py` rebuilds the whole set from the sources. If you get a
better photograph of someone, drop it in and re-run it, or just replace the one
JPEG — nothing else depends on it. `TUNE` in that script holds the per-person
zoom for the few whose face sat small in a busy frame.

For a colour set instead of the ink one, delete the `duotone(...)` call in the
script and re-run.

### The group sheet

`print/khamt-olon.png` is all 23 laid out as one sheet, same cells and same
tones as the page. It is 1410 × 1636, which prints cleanly up to about A4, and
it works as an end card for the film.

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
and the periodic-table cell as the one repeating object. The cell holds the
hidden word in the puzzle and it holds a face in the roster, so one shape
carries the whole page.

Behind the opening sits the full periodic table, all 118 cells in hairlines,
with the ten the card's clues name picked out in copper. It is generated, not
drawn by hand, and it is the reason the first screen is not empty while the
film is still missing.

Colour is six custom properties at the top of `style.css`, sampled from the
card artwork: paper, panel, ink `#1b2240`, soft ink, rule, copper `#b35228`.
Light and dark are both defined there and follow the reader's phone setting,
which matters because most people arrive here from a camera in a corridor.

Type is Playfair Display for the serif voice, Golos Text for running text, IBM
Plex Mono for the atomic numbers and labels, and Caveat for the two signatures,
which answer the handwritten names on the cards. All four carry Cyrillic — most
display faces do not, so check before swapping one out.
