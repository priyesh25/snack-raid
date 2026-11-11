"""Props for Snack Raid scenes."""
import math
from base import *


def rect(x, y, w, h, fill, stroke="none", sw=SW, extra=""):
    return rrect(x, y, w, h, 0, fill, stroke, sw, extra)


def brick(x, y, color, s=1.0):
    dark = {"#FF5A4F": "#C93B32", "#FFC93C": "#D69E12", "#4CCB7A": "#2FA35B", "#7FB4FF": "#4D86D9"}.get(color, color)
    o = [rrect(-22, -14, 44, 22, 4, dark, sw=4), rrect(-22, -24, 44, 20, 4, color, sw=4),
         rrect(-15, -31, 11, 9, 3, color, sw=3.5), rrect(4, -31, 11, 9, 3, color, sw=3.5)]
    return g(o, x, y, s)


def cake_slice(x, y, s=1.0):
    o = [poly([(-30, 8), (30, 8), (30, -26), (-30, -8)], "#F7D9A8", sw=4),
         poly([(-30, -8), (30, -26), (30, -36), (-30, -18)], PINK, sw=4),
         line(-30, 0, 30, -9, stroke="#C98A4B", sw=4),
         circ(18, -40, 7, RED, sw=3.5)]
    return g(o, x, y, s)


def soda(x, y, s=1.0, color=RED):
    o = [rrect(-13, -40, 26, 42, 6, color, sw=4), rrect(-13, -40, 26, 8, 4, "#C9D1E4", sw=4),
         rrect(-13, -24, 26, 10, 0, "white", stroke="none", extra='opacity="0.85"')]
    return g(o, x, y, s)


def pizza(x, y, s=1.0):
    o = [poly([(-26, -30), (26, -30), (0, 26)], "#FFC93C", sw=4),
         path("M -29 -30 Q 0 -44 29 -30", "none", stroke=OUT, sw=13),
         path("M -29 -30 Q 0 -44 29 -30", "none", stroke="#D9903A", sw=6),
         circ(-8, -14, 6, RED, sw=3), circ(9, -12, 6, RED, sw=3), circ(0, 4, 5, RED, sw=3)]
    return g(o, x, y, s)


def icecream(x, y, s=1.0):
    o = [poly([(-15, -4), (15, -4), (0, 34)], "#E0A458", sw=4),
         circ(0, -16, 19, PINK, sw=4), circ(-7, -22, 4, "white", stroke="none"),
         circ(0, -37, 5, RED, sw=3)]
    return g(o, x, y, s)


def jar(x, y, s=1.0):
    o = [rrect(-40, -86, 80, 86, 22, "#CFE8FF", sw=5, extra='fill-opacity="0.55"')]
    for cx, cy in [(-14, -22), (12, -18), (-4, -44), (16, -50), (-18, -58)]:
        o.append(circ(cx, cy, 13, "#D9A066", sw=3.5))
        o.append(circ(cx - 4, cy - 3, 2, "#6B3F1D", stroke="none"))
        o.append(circ(cx + 4, cy + 3, 2, "#6B3F1D", stroke="none"))
    o.append(rrect(-44, -100, 88, 18, 8, RED))
    o.append(circ(0, -108, 9, RED))
    return g(o, x, y, s)


def fridge_open(x, y, w=280, h=470, is_open=True):
    """Fridge with the main door open. (x, y) is the bottom-left corner."""
    o = []
    top = y - h
    o.append(rrect(x, top, w, h, 26, "#C9D1E4"))
    # freezer door (closed)
    o.append(line(x, top + 130, x + w, top + 130))
    o.append(rrect(x + 22, top + 62, 16, 44, 8, "#8E9AAF", sw=4))
    for mx, my, mc in [(x + 190, top + 50, RED), (x + 222, top + 84, GREEN), (x + 160, top + 92, "#FFC93C")]:
        o.append(rrect(mx, my, 20, 16, 4, mc, sw=3))
    if not is_open:
        o.append(rrect(x + 22, top + 160, 16, 70, 8, "#8E9AAF", sw=4))
        o.append(line(x + w - 30, y - 14, x + w - 30, y - 4, sw=4))
        return "".join(o)
    # lit interior
    ix, iy, iw, ih = x + 16, top + 146, w - 32, h - 162
    o.append(rrect(ix, iy, iw, ih, 12, "#FFF0B8"))
    for sy in (iy + ih * 0.36, iy + ih * 0.70):
        o.append(line(ix, sy, ix + iw, sy, sw=4))
    s1, s2, s3 = iy + ih * 0.36, iy + ih * 0.70, iy + ih
    o.append(cake_slice(ix + 54, s1 - 12, 1.1))
    o.append(soda(ix + 150, s1 - 4, 1.0))
    o.append(soda(ix + 184, s1 - 4, 1.0, color="#7FB4FF"))
    o.append(pizza(ix + 60, s2 - 32, 0.95))
    o.append(rrect(ix + 130, s2 - 40, 78, 38, 8, GREEN, sw=4))
    o.append(rrect(ix + 130, s2 - 40, 78, 12, 6, "#FFF6E5", sw=4))
    # bottom shelf: watermelon half and a carrot
    o.append(path(f"M {ix + 22} {s3 - 12} A 52 52 0 0 1 {ix + 126} {s3 - 12} Z", "#3FAE5A", sw=4))
    o.append(path(f"M {ix + 34} {s3 - 12} A 40 40 0 0 1 {ix + 114} {s3 - 12} Z", "#FF6B6B", stroke="none"))
    for sx in (ix + 56, ix + 74, ix + 92):
        o.append(ell(sx, s3 - 26, 2.5, 4, OUT, stroke="none"))
    o.append(poly([(ix + 150, s3 - 36), (ix + 226, s3 - 22), (ix + 150, s3 - 10)], ORANGE, sw=4))
    o.append(path(f"M {ix + 150} {s3 - 23} l -16 -10 M {ix + 150} {s3 - 23} l -18 2 M {ix + 150} {s3 - 23} l -14 12", "none", stroke="#2FA35B", sw=5))
    # open door swung to the right
    dx = x + w
    o.append(poly([(dx, top + 136), (dx + 92, top + 168), (dx + 92, y + 34), (dx, y)], "#B8C2DA"))
    o.append(poly([(dx + 12, top + 168), (dx + 80, top + 190), (dx + 80, y + 12), (dx + 12, y - 14)], "#E4E9F5", sw=4))
    for fy in (0.42, 0.70):
        yy = top + 168 + (h - 180) * fy
        o.append(line(dx + 12, yy, dx + 80, yy + 12, sw=4))
    o.append(soda(dx + 46, top + 168 + (h - 180) * 0.42 + 2, 0.8, color=GREEN))
    return "".join(o)


def window(x, y, w, h):
    o = [rrect(x - 14, y - 14, w + 28, h + 28, 14, "#4A4FA8"),
         rrect(x, y, w, h, 6, "#0C1030", sw=4)]
    # moon and stars
    cid = uid("clip")
    o.append(f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath>')
    sky = [circ(x + w * 0.66, y + h * 0.36, 44, GLOW, stroke="none"),
           circ(x + w * 0.66 + 20, y + h * 0.36 - 12, 40, "#0C1030", stroke="none")]
    for sx, sy, r in [(0.18, 0.2, 6), (0.32, 0.55, 4), (0.5, 0.16, 5), (0.84, 0.72, 5), (0.2, 0.8, 4), (0.44, 0.78, 3)]:
        sky.append(star(x + w * sx, y + h * sy, r * 1.6, MILK, stroke="none"))
    o.append(f'<g clip-path="url(#{cid})">{"".join(sky)}</g>')
    o.append(line(x + w / 2, y, x + w / 2, y + h, stroke="#4A4FA8", sw=10))
    o.append(line(x, y + h / 2, x + w, y + h / 2, stroke="#4A4FA8", sw=10))
    o.append(rrect(x - 26, y + h + 10, w + 52, 18, 8, "#5D63C2"))
    return "".join(o)


def clock(x, y, r=46, hour=12, minute=0):
    o = [circ(x, y, r, MILK), circ(x, y, r - 9, "white", sw=3)]
    for i in range(12):
        a = math.radians(i * 30 - 90)
        o.append(circ(x + (r - 17) * math.cos(a), y + (r - 17) * math.sin(a), 2.5, OUT, stroke="none"))
    ha = math.radians((hour % 12) * 30 + minute * 0.5 - 90)
    ma = math.radians(minute * 6 - 90)
    o.append(line(x, y, x + (r - 26) * math.cos(ha), y + (r - 26) * math.sin(ha), sw=6))
    o.append(line(x, y, x + (r - 16) * math.cos(ma), y + (r - 16) * math.sin(ma), stroke=RED, sw=4))
    o.append(circ(x, y, 4, OUT, stroke="none"))
    return "".join(o)


def microwave(x, y, w=170, h=96, display="0:01"):
    o = [rrect(x, y - h, w, h, 12, "#59607A"),
         rrect(x + 12, y - h + 14, w - 62, h - 28, 8, "#1B1E3F", sw=4),
         rrect(x + w - 44, y - h + 14, 32, 22, 5, "#0C1030", sw=3),
         text(x + w - 28, y - h + 31, display, 15, fill="#4DE1B0", weight=700),
         circ(x + w - 28, y - 26, 10, "#C9D1E4", sw=3.5)]
    # popcorn bag glowing inside
    o.append(rrect(x + 36, y - h + 34, 44, 38, 8, GLOW, sw=3.5, extra='opacity="0.9"'))
    return "".join(o)


def dog_bed(x, y, rx=150, ry=44):
    return ell(x, y, rx, ry, "#B93F7E") + ell(x, y - 8, rx - 22, ry - 14, "#E05C9C", sw=4)
