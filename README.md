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
print/qr-stickers.pdf    <- print this: 40 stickers + one large
print/qr.svg             <- plain black code, for anything else
print/qr.png
print/khamt-olon.png     <- the department as one sheet
```

## Looking at it

```sh
python3 -m http.server 8000
# http://localhost:8000
```

## The QR code for the card

The box on the card measures 50 x 50 mm, so the sticker is 45 mm and sits
inside it with a 2.5 mm margin all round.

**`print/qr-stickers.pdf`** is what you print. Three pages:

| Page | Contents |
| --- | --- |
| 1 | 20 stickers, 45 mm, with cut guides |
| 2 | the same 20 again — 40 in total, for 23 teachers plus spares |
| 3 | one 120 mm code with the address underneath, for a door or noticeboard |

Everything in it is vector, so it stays sharp at any size. Print it on A4
sticker paper at 100% — **not** "fit to page", which would shrink it.

`print/qr.svg` and `print/qr.png` are the plain black version, kept for anything
else that needs a code.

### Why the decorated one still scans

Scanners threshold on luminance, not colour, so the rules are about how dark
the modules are rather than what hue they carry:

- The ramp runs between a deepened copper `#a8491f` and the card's navy
  `#151a33`, both far darker than the paper. Copper is the lighter end, at
  about 5.7:1 against the background, which is still comfortable.
- Error correction stays at level H, recovering 30%. The cleared centre holding
  the benzene mark is 49 of 1369 modules, about 3.6%, so it spends a small part
  of that budget.
- The three corner eyes keep their exact proportions. Only their corners are
  rounded, which readers tolerate; changing their size or spacing is what
  breaks detection.

Tested against ZXing, the same engine family phone cameras use, alongside the
plain black code as a control. Both behaved identically: readable down to 80 px
square, through Gaussian blur to sigma 2.5, sensor noise, rotation to 45
degrees, dim light, washed-out contrast and JPEG quality 25. The only failure,
blur at sigma 4.0, took the plain code down too.

`scripts/qr_sticker.py` regenerates the PDF. If the URL ever changes, edit
`URL` at the top and re-run it — and re-print, because every sticker already
stuck to a card will be pointing at nothing.

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

### Pen drawings from the photographs

`scripts/ink.py` converts the photographs into pen drawings, to sit closer to
the hand-drawn cards. A local-mean threshold traces edges, so dark hair becomes
hatching instead of a solid mass, and the threshold auto-solves per photograph
so 23 very different sources land on the same ink density. Nothing is invented:
every line comes from the supplied photograph.

The results are in `assets/img/bagsh-ink/`. **The page does not use them**, and
that is a judgement, not an oversight. About fourteen of the twenty-three are
good. The rest fail for reasons no parameter fixes:

- **02, 12** — the photograph is mostly background. The banner behind
  Наранмандах and the lab signage behind Оюунбилэг have stronger edges than the
  face, so the conversion draws the room instead of the person.
- **08, 18** — glasses, a microphone and low resolution break the features into
  disconnected strokes.
- **04** — a patterned blouse turns into a field of stipple that outweighs the face.
- **20** — edge tracing exaggerates every line on a face. It is accurate and
  unkind, which is the wrong thing to hand someone on their own holiday.

To switch the page over anyway:

```sh
sed -i 's|img/bagsh/|img/bagsh-ink/|g' index.html
```

The better route is the one already under way: the hand drawings on the cards
are better than anything this script produces. Photograph or scan them square
and evenly lit, save them into `assets/img/bagsh/`, and the page carries the
real drawings with no code change at all.

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

## Motion

Everything that moves is drawn from the subject rather than applied to it.

- **The background** is a canvas of benzene rings and free atoms. The rings
  drift and turn, carrying their alternating double bonds; loose atoms form
  bonds with whichever neighbour comes close enough, and scatter away from a
  finger or a cursor. Ring and atom counts scale with the viewport, the loop
  stops when the tab is hidden, and device pixel ratio is capped at 2.
- **The periodic table** is two stacked copies. The lower one is dim; the upper
  one is brighter and masked to a circle that follows the pointer, so the table
  lights up under your finger. With no pointer the circle drifts on its own, and
  the ten cells the card names pulse on a stagger.
- **The puzzle cells** flip one at a time now, not only all at once. The
  greeting appears when the tenth turns, however you got there.
- **The roster** deals its portraits out in sequence as each group scrolls in.
- **The countdown** ticks each digit as it changes.

Every one of these is disabled by `prefers-reduced-motion: reduce`, which also
leaves the big word unsplit and every section visible at rest. The reveals live
behind a `.js` class set in the head, so with scripting off nothing is hidden.

Colour is six custom properties at the top of `style.css`, sampled from the
card artwork: paper, panel, ink `#1b2240`, soft ink, rule, copper `#b35228`.
Light and dark are both defined there and follow the reader's phone setting,
which matters because most people arrive here from a camera in a corridor.

Type is Playfair Display for the serif voice, Golos Text for running text, IBM
Plex Mono for the atomic numbers and labels, and Caveat for the two signatures,
which answer the handwritten names on the cards. All four carry Cyrillic — most
display faces do not, so check before swapping one out.
