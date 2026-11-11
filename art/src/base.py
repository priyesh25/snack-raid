"""Drawing helpers for Snack Raid concept art. Builds SVG strings and renders PNGs with Chromium."""
import base64, math, os, itertools

HERE = os.path.dirname(os.path.abspath(__file__))
# fonts ship with the app, so the art uses the same files
FONT_DIR = os.path.join(HERE, "..", "..", "app", "assets", "fonts")

# Palette (matches the design doc)
NAVY = "#141A3C"
INDIGO = "#2B2F77"
MOON = "#7FB4FF"
GLOW = "#FFE08A"
ORANGE = "#FFA630"
RED = "#FF5A4F"
GREEN = "#4CCB7A"
PINK = "#FF7EB6"
MILK = "#FFF6E5"

OUT = NAVY  # outline color
SW = 5      # default outline width

_uid = itertools.count(1)


def uid(prefix="id"):
    return f"{prefix}{next(_uid)}"


def _attrs(fill, stroke, sw, extra):
    s = f'fill="{fill}"'
    if stroke and stroke != "none":
        s += f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"'
    if extra:
        s += " " + extra
    return s


def ell(cx, cy, rx, ry, fill, stroke=OUT, sw=SW, extra=""):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" {_attrs(fill, stroke, sw, extra)}/>'


def circ(cx, cy, r, fill, stroke=OUT, sw=SW, extra=""):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" {_attrs(fill, stroke, sw, extra)}/>'


def rrect(x, y, w, h, r, fill, stroke=OUT, sw=SW, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" {_attrs(fill, stroke, sw, extra)}/>'


def path(d, fill, stroke=OUT, sw=SW, extra=""):
    return f'<path d="{d}" {_attrs(fill, stroke, sw, extra)}/>'


def poly(pts, fill, stroke=OUT, sw=SW, extra=""):
    p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return f'<polygon points="{p}" {_attrs(fill, stroke, sw, extra)}/>'


def line(x1, y1, x2, y2, stroke=OUT, sw=SW, extra=""):
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}" '
            f'stroke-linecap="round" {extra}/>')


def limb(d, w, color, sw=SW):
    """A thick outlined stroke (arm, leg, tail) along path d."""
    return (f'<path d="{d}" fill="none" stroke="{OUT}" stroke-width="{w + 2 * sw}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')


def text(x, y, s, size, fill=MILK, weight=600, anchor="middle", font="Fredoka", extra=""):
    return (f'<text x="{x}" y="{y}" font-family="\'{font}\'" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" text-anchor="{anchor}" {extra}>{s}</text>')


def otext(x, y, s, size, fill=MILK, weight=700, anchor="middle", font="Fredoka", ow=8, ocolor=NAVY, extra=""):
    """Text with a thick outline behind it (sticker look)."""
    return (f'<text x="{x}" y="{y}" font-family="\'{font}\'" font-size="{size}" font-weight="{weight}" '
            f'fill="{fill}" stroke="{ocolor}" stroke-width="{ow}" stroke-linejoin="round" paint-order="stroke" '
            f'text-anchor="{anchor}" {extra}>{s}</text>')


def g(content, tx=0, ty=0, s=1.0, rot=0, extra=""):
    if isinstance(content, (list, tuple)):
        content = "".join(content)
    t = f"translate({tx},{ty})"
    if rot:
        t += f" rotate({rot})"
    if s != 1.0:
        t += f" scale({s})"
    return f'<g transform="{t}" {extra}>{content}</g>'


def star(cx, cy, r, fill, stroke=OUT, sw=3, inner=0.45, rot=-90, points=5):
    pts = []
    for i in range(points * 2):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(rot + i * 180 / points)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return poly(pts, fill, stroke, sw)


def zzz(x, y, n=3, size=30, fill=MILK, dx=18, dy=-22, grow=1.25):
    """Floating Zs, growing as they rise."""
    out = []
    s = size
    cx, cy = x, y
    for i in range(n):
        out.append(otext(cx, cy, "Z", round(s), fill=fill, weight=700, ow=max(4, s * 0.22)))
        cx += dx * (1 + i * 0.25)
        cy += dy * (1 + i * 0.25)
        s *= grow
    return "".join(out)


def ring(cx, cy, r, color=MILK, sw=4, opacity=0.9, dash="", squash=0.5):
    d = f'stroke-dasharray="{dash}"' if dash else ""
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{r * squash}" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" opacity="{opacity}" {d}/>')


def font_css():
    def b64(pkg, fname):
        with open(os.path.join(FONT_DIR, fname), "rb") as f:
            return base64.b64encode(f.read()).decode()
    css = ""
    for w in (400, 500, 600, 700):
        css += ("@font-face{font-family:'Fredoka';font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2');}"
                % (w, b64("fredoka", f"fredoka-latin-{w}-normal.woff2")))
    for w in (800,):
        css += ("@font-face{font-family:'Baloo 2';font-weight:%d;src:url(data:font/woff2;base64,%s) format('woff2');}"
                % (w, b64("baloo-2", f"baloo-2-latin-{w}-normal.woff2")))
    return css


def svg_doc(content, w, h, bg=NAVY, defs=""):
    if isinstance(content, (list, tuple)):
        content = "".join(content)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
            f'<defs>{defs}</defs><rect width="{w}" height="{h}" fill="{bg}"/>{content}</svg>')


def render(svg, out_png, w, h, scale=2):
    from playwright.sync_api import sync_playwright
    html = (f"<!doctype html><html><head><meta charset='utf-8'><style>{font_css()}"
            f"html,body{{margin:0;padding:0;background:{NAVY};}}svg{{display:block;}}</style></head>"
            f"<body>{svg}</body></html>")
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=scale)
        pg.set_content(html)
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(300)
        pg.screenshot(path=out_png, clip={"x": 0, "y": 0, "width": w, "height": h})
        b.close()
    return out_png
