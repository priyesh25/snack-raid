"""Makes the Android launcher icons and splash screens from app/assets/img/icon-512.png.

Usage: python3 tools/android-icons.py
Run it again if the game icon changes. Needs Pillow.
"""
import glob, os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")
ICON = Image.open(os.path.join(ROOT, "app", "assets", "img", "icon-512.png")).convert("RGBA")
ICON_BG = (0x2B, 0x2F, 0x77, 255)   # the icon's own background, so the adaptive icon has no seams
NAVY = (0x14, 0x1A, 0x3C, 255)      # the game's background

DENS = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

for name, k in DENS.items():
    d = os.path.join(RES, "mipmap-" + name)
    # legacy square and round icons, 48dp
    s = round(48 * k)
    sq = ICON.resize((s, s), Image.LANCZOS)
    sq.save(os.path.join(d, "ic_launcher.png"))
    mask = Image.new("L", (s * 4, s * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, s * 4 - 1, s * 4 - 1), fill=255)
    rnd = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    rnd.paste(sq, (0, 0), mask.resize((s, s), Image.LANCZOS))
    rnd.save(os.path.join(d, "ic_launcher_round.png"))
    # adaptive foreground, 108dp canvas; the art fills 84dp so the mask never cuts the raider
    f = round(108 * k)
    fg = Image.new("RGBA", (f, f), ICON_BG)
    a = round(84 * k)
    fg.paste(ICON.resize((a, a), Image.LANCZOS), ((f - a) // 2, (f - a) // 2))
    fg.save(os.path.join(d, "ic_launcher_foreground.png"))

with open(os.path.join(RES, "values", "ic_launcher_background.xml"), "w", newline="\n") as fh:
    fh.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#2B2F77</color>\n</resources>\n')

# splash: navy with the icon in the middle, same sizes as Capacitor's defaults
for p in glob.glob(os.path.join(RES, "drawable*", "splash.png")):
    w, h = Image.open(p).size
    img = Image.new("RGBA", (w, h), NAVY)
    a = round(min(w, h) * 0.42)
    img.paste(ICON.resize((a, a), Image.LANCZOS), ((w - a) // 2, (h - a) // 2))
    img.convert("RGB").save(p)
print("ok")
