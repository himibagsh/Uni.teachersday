# Teachers' Day

A one-page site for Teachers' Day, Monday 5 October 2026. Plain HTML, CSS and
JavaScript. No build step, no dependencies.

```
index.html
assets/css/style.css
assets/js/main.js        <- the only file you edit when the film is ready
assets/favicon.svg
assets/video/            <- drop a self-hosted film here
```

## Looking at it

Open `index.html` in a browser, or serve the folder so the relative paths
behave the same way they will in production:

```sh
python3 -m http.server 8000
# then http://localhost:8000
```

## Dropping the film in

The page currently shows a slate with a live countdown to the premiere. When
the cut is finished, edit the `CONFIG` block at the top of
`assets/js/main.js`. Nothing in `index.html` needs touching.

**A file you host yourself** (best quality control, needs an H.264 `.mp4`):

```js
videoReady: true,
videoSrc: 'assets/video/teachers-day.mp4',
videoPoster: 'assets/video/poster.jpg',   // optional still frame
```

**YouTube or Vimeo** (lighter on bandwidth, use the *embed* address, not the
`watch?v=` one):

```js
videoReady: true,
videoSrc: 'https://www.youtube.com/embed/VIDEO_ID',
```

The script picks a `<video>` element for a file and an `<iframe>` for an embed
address, sized 16:9 in the same frame the slate occupied.

While you wait, you can also move the production markers that sit under the
slate:

```js
stages: [
  { label: 'Filming',        state: 'done'   },
  { label: 'Edit',           state: 'done'   },
  { label: 'Sound & colour', state: 'active' }
]
```

`state` is `done`, `active` or `pending`. If the premiere time passes while
`videoReady` is still `false`, the countdown stops on its own and the slate
reads "the premiere is under way".

## Changing the copy

Everything else is written directly into `index.html`, section by section, with
HTML comments marking each one. The parts you will almost certainly want to
change:

| What | Where |
| --- | --- |
| University and council names | "Our University" in the hero, premiere notes and footer |
| Date and times | the top bar, the hero stamps, and `CONFIG.premiere` |
| Programme entries | the `<ol class="ledger">` block |
| Departments | the `<ul class="roll">` block |

## Deploying to GitHub Pages

Push this branch, then in the repository go to **Settings → Pages** and set
*Source* to **Deploy from a branch**, picking the branch and the `/ (root)`
folder. The site appears at `https://himibagsh.github.io/Uni.teachersday/`
within a minute or two.

## Design notes

The page is laid out as an institutional register: a left rail of clock times
and entry numbers, hairline rules between entries, one column of content.
Display type is a Didone, the way a printed diploma is set; the timetable and
countdown figures are monospaced with tabular numerals so the digits do not
jump as they tick.

Colour lives in six custom properties at the top of `style.css` (chalk paper,
board-green ink, brass). Light and dark are both defined there, keyed off the
reader's system setting, so changing the palette is six values in one place.
