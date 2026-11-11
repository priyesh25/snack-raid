# Art

All art is drawn by code, so every character, icon and screen stays in one style and can be redrawn in seconds.

- `concept/keyart.png`: the title image
- `concept/cast.png`: the household
- `concept/snacks.png` and `concept/gadgets.png`: the icon sheets
- `src/`: the Python that draws them

## The style

Chunky toy shapes, thick navy outlines, flat colors. Characters are about 2.5 heads tall. The palette is in `src/base.py` and in the design doc.

## Rebuild everything

Needs Python 3 with `playwright` (plus its Chromium) and `Pillow`.

```sh
sh art/src/build_all.sh
```

That redraws the concept art, re-exports the game sprites to `app/js/sprites.js`, and rebuilds the app icons and the title image.

## Files in src

| File | What it draws |
| --- | --- |
| `base.py` | Palette, shape helpers, PNG rendering |
| `chars.py` | The cast: both raiders, Dad, Mom, Mika, Baby Boo, Biscuit, Dusty |
| `props.py` | Fridge, cookie jar, microwave, window, clock, toy bricks |
| `icons.py` | 14 snack icons, 19 gadget icons, the two icon sheets |
| `keyart.py`, `cast.py` | The key art and the cast sheet |
| `export_sprites.py` | Writes every in-game sprite into `app/js/sprites.js` |
| `appicons.py` | App icons and the title image |

To add a pajama set, add a color variant in `export_sprites.py`, then list it in `PAJAMAS` in `app/js/data.js`.
