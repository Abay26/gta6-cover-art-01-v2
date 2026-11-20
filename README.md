[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Abay26/gta6-cover-art-01-v2/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Abay26/gta6-cover-art-01-v2/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Press — GTA-style Cover Studio

A free, offline web app that turns your own photos and a caption into GTA-style
multi-panel cover art — the iconic poster / loading-screen look with a Vice City
neon-sunset grade — exported as a PNG to share. No upload, no account, no network:
open `app/index.html` in a desktop browser and it just works.

## What it does

- **Multi-panel covers** — eight layouts: Hero + 3, Nine Panel (3 × 3 grid),
  Tilted Snaps (three tilted polaroids over a retro striped sun), Full Bleed,
  Comic Strip (four vertical panels under one headline), Duo Split, Mosaic 6,
  and Crew Five (one wide hero over four role panels). Layout thumbnails are
  painted live from your own photos, so you see each look before you pick it.
- **Any photo** — add your own photos from your machine, or use the four bundled
  samples. Click a panel, then a photo, to place it; drag inside a panel to
  reposition the photo and use the zoom slider to crop tighter. Fill all panels
  with one tap, shuffle the photos across them, or deal a whole new look with
  the randomize dice.
- **Caption lettering** — a bold Anton title in four styles (sunset gradient,
  solid white, neon outline, chrome 3D block), a Pacifico neon-script subtitle,
  and a badge ribbon, all editable live. Optional per-panel crew-role captions
  (THE DRIVER, THE HACKER, …) — edit each one, or switch them off.
- **Original vector art** — a retro striped sun, a Vice City skyline silhouette
  with lit windows, palm trees and halftone dots, all drawn in canvas by the
  app. No Rockstar logo, artwork or font anywhere. Fonts are vendored under
  the SIL Open Font License.
- **Colour grades** — Vice Sunset, Neon Night, Palm Teal, Heat Haze, Noir,
  Bayside Gold, Midnight Vice, and Candy Floss, plus film grain and a vignette
  for the poster finish.
- **Export in one step** — 1080 × 1080, 1080 × 1350, and 1920 × 1080 PNGs, one
  size at a time or all three at once. Undo / redo included (Ctrl+Z / Ctrl+Y).

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` directly in a desktop browser — the app loads nothing
over the network.

## Build the dossier

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

<sub>Entered on [make.fun](https://make.fun/?ref=qw56w9dq&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
