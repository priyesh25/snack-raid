"""Snack and gadget icons for Snack Raid. Each icon is drawn around (0, 0) and fits in about 110 x 110."""
import math
from base import *
from props import cake_slice, soda, pizza, icecream

BROWN = "#8B5E3C"
TAN = "#D9A066"


def sparkle(x, y, r=9, fill="white"):
    return path(f"M {x} {y - r} Q {x} {y} {x + r} {y} Q {x} {y} {x} {y + r} Q {x} {y} {x - r} {y} Q {x} {y} {x} {y - r} Z",
                fill, stroke="none")


# ------------------------------------------------------------------ snacks

def s_juice():
    return "".join([
        rrect(-24, -30, 48, 66, 8, "#FF8A3D"), rrect(-24, -30, 48, 18, 8, "#FFD166"),
        circ(0, 12, 12, "#FFD166", sw=4), path("M -4 8 Q 0 2 4 8", "none", sw=3),
        limb("M 8 -30 L 14 -50 L 28 -54", 5, MILK, sw=3)])


def s_cookie():
    o = [circ(0, 0, 38, TAN)]
    for dx, dy, r in [(-14, -12, 6), (12, -16, 5), (4, 8, 6), (-14, 14, 5), (20, 6, 4.5), (-2, -24, 3.5)]:
        o.append(circ(dx, dy, r, "#6B3F1D", stroke="none"))
    return "".join(o)


def s_chips():
    return "".join([
        path("M -30 -40 L 30 -40 L 34 40 L -34 40 Z", "#FFC93C"),
        path("M -30 -40 L -24 -48 L -18 -40 L -12 -48 L -6 -40 L 0 -48 L 6 -40 L 12 -48 L 18 -40 L 24 -48 L 30 -40 Z", "#FFC93C", sw=4),
        rrect(-32, -8, 64, 24, 0, RED, stroke="none"), line(-32, -8, 32, -8, sw=4), line(-33, 16, 33, 16, sw=4),
        ell(0, 4, 17, 9, "#FFE9A8", sw=3.5), path("M -10 4 Q 0 -2 10 4", "none", sw=2.5)])


def s_soda():
    return soda(0, 34, 1.75)


def s_chocolate():
    o = [rrect(-34, -24, 68, 48, 6, "#7A4A2A")]
    for x in (-12, 10):
        o.append(line(x, -24, x, 24, stroke="#5A3218", sw=4))
    o.append(line(-34, 0, 32, 0, stroke="#5A3218", sw=4))
    o.append(path("M 4 -30 L 40 -30 L 40 30 L 4 30 L 12 20 L 4 10 L 12 0 L 4 -10 L 12 -20 Z", "#7B61FF"))
    o.append(rrect(18, -10, 16, 20, 4, GLOW, sw=3))
    return "".join(o)


def s_pizza():
    return pizza(0, 6, 1.22)


def s_jelly():
    return "".join([
        path("M -30 -8 Q -34 -44 0 -44 Q 34 -44 30 -8 Z", RED),
        path("M -16 -30 Q -10 -38 0 -38", "none", stroke="white", sw=4, extra='opacity="0.8"'),
        path("M -32 -8 L 32 -8 L 24 34 Q 22 40 14 40 L -14 40 Q -22 40 -24 34 Z", "#CFE8FF", extra='fill-opacity="0.75"'),
        line(-36, -8, 36, -8, sw=6)])


def s_popcorn():
    o = []
    for cx, cy, r in [(-22, -22, 14), (0, -30, 16), (22, -22, 14), (-10, -14, 13), (12, -12, 13)]:
        o.append(circ(cx, cy, r, "#FFF3C4", sw=4))
    o.append(path("M -32 -10 L 32 -10 L 24 42 L -24 42 Z", "white"))
    for x1, x2 in [(-32, -18), (-6, 6), (18, 32)]:
        k = 24 / 32
        o.append(poly([(x1, -10), (x2, -10), (x2 * k, 42), (x1 * k, 42)], RED, sw=4))
    return "".join(o)


def s_cereal():
    o = []
    for cx, cy, col in [(-18, -14, RED), (0, -20, GLOW), (18, -14, GREEN), (-6, -8, MOON), (10, -6, PINK)]:
        o.append(circ(cx, cy, 9, col, sw=3.5))
        o.append(circ(cx, cy, 3, "#FFF6E5", sw=2))
    o.append(path("M -40 -6 L 40 -6 Q 38 36 0 38 Q -38 36 -40 -6 Z", MOON))
    o.append(line(-44, -6, 44, -6, sw=6))
    o.append(limb("M 26 -14 L 44 -44", 6, "#C9D1E4", sw=3))
    return "".join(o)


def s_icecream():
    return icecream(0, 4, 1.32)


def s_cake():
    return cake_slice(0, 14, 1.35)


def s_watermelon():
    o = [path("M -44 -10 A 44 44 0 0 0 44 -10 Z", "#3FAE5A"),
         path("M -34 -10 A 34 34 0 0 0 34 -10 Z", "#FF6B6B", stroke="none"),
         line(-46, -10, 46, -10, sw=5)]
    for sx, sy in [(-16, 0), (0, 10), (16, 0), (-6, -2), (8, 2)]:
        o.append(ell(sx, sy, 2.6, 4.2, OUT, stroke="none"))
    return g(o, 0, -8)


def s_carrot():
    return "".join([
        path("M -8 -22 l -14 -22 M -2 -24 l 0 -26 M 4 -22 l 14 -20", "none", stroke="#2FA35B", sw=7),
        poly([(-20, -24), (20, -24), (0, 46)], ORANGE),
        line(-8, -6, 4, -6, sw=3), line(-4, 10, 6, 10, sw=3), line(-2, 26, 3, 26, sw=3)])


def s_donut():
    o = [circ(0, 0, 40, "#E8B04A"), path("M -36 -6 Q -30 -40 0 -38 Q 34 -38 37 -4 Q 30 6 22 -2 Q 14 10 4 0 Q -6 12 -16 0 Q -28 8 -36 -6 Z", GLOW, sw=4),
         circ(0, 0, 13, "#232863")]
    o.append(sparkle(-44, -36, 12))
    o.append(sparkle(44, -30, 9))
    o.append(sparkle(40, 38, 7))
    return "".join(o)


SNACKS = [
    ("Juice box", "the starter", s_juice), ("Cookie", "drops crumbs", s_cookie), ("Chips", "crinkles", s_chips),
    ("Soda", "fizzes if you run", s_soda), ("Chocolate", "always hidden", s_chocolate), ("Cold pizza", "smelly", s_pizza),
    ("Jelly cup", "wobbly", s_jelly), ("Popcorn", "needs the microwave", s_popcorn), ("Cereal", "spills", s_cereal),
    ("Ice cream", "melts in 45 s", s_icecream), ("Cake slice", "two hands", s_cake), ("Watermelon", "heavy", s_watermelon),
    ("Carrot", "night eyes", s_carrot), ("Golden Donut", "rare, glows", s_donut),
]


# ------------------------------------------------------------------ gadgets

def g_socks():
    sock = ("M -14 -44 L 12 -44 L 12 2 Q 12 12 22 16 Q 40 22 38 36 Q 36 46 20 46 L -2 46 Q -16 46 -16 30 Z")
    o = [g(path(sock, MOON) + rrect(-18, -50, 34, 18, 6, MILK) + line(-10, 34, 2, 34, stroke="white", sw=4), -14, 0, 1.0, rot=-8),
         g(path(sock, PINK) + rrect(-18, -50, 34, 18, 6, MILK) + line(-10, 34, 2, 34, stroke="white", sw=4), 14, 4, 1.0, rot=8)]
    return "".join(o)


def g_slippers():
    o = [ell(-14, -34, 8, 20, PINK, extra='transform="rotate(-14 -14 -34)"'), ell(12, -34, 8, 20, PINK, extra='transform="rotate(14 12 -34)"'),
         ell(-14, -32, 3.5, 12, "#FFD0E4", stroke="none", extra='transform="rotate(-14 -14 -32)"'),
         ell(12, -32, 3.5, 12, "#FFD0E4", stroke="none", extra='transform="rotate(14 12 -32)"'),
         ell(0, 14, 44, 30, PINK), ell(0, 26, 30, 14, "#FFD0E4", sw=4),
         circ(-14, 0, 4.5, OUT, stroke="none"), circ(12, 0, 4.5, OUT, stroke="none"),
         ell(-1, 8, 4, 3, "#B93F7E", stroke="none")]
    return "".join(o)


def g_oilcan():
    return "".join([
        limb("M 14 -8 L 44 -40", 7, "#C9D1E4", sw=4),
        path("M -30 -10 L 22 -10 L 30 38 L -38 38 Z", GREEN), rrect(-18, -24, 30, 16, 5, "#2FA35B"),
        path("M -34 6 Q -52 4 -50 22 Q -48 34 -36 30", "none", sw=6),
        path("M 48 -30 Q 56 -18 52 -12 Q 48 -8 44 -12 Q 40 -18 48 -30 Z", GLOW, sw=3.5)])


def g_pillow(face=False):
    o = [path("M -40 -26 Q 0 -36 40 -26 Q 48 0 40 26 Q 0 36 -40 26 Q -48 0 -40 -26 Z", MILK)]
    for sx, sy in [(-40, -26), (40, -26), (-40, 26), (40, 26)]:
        o.append(circ(sx, sy, 5, MILK, sw=4))
    return "".join(o)


def g_muffler():
    o = [g_pillow()]
    o.append(path("M -14 -8 L -4 -8 L 8 -18 L 8 18 L -4 8 L -14 8 Z", MOON, sw=4))
    o.append(line(16, -12, 30, 12, stroke=RED, sw=6))
    o.append(line(30, -12, 16, 12, stroke=RED, sw=6))
    return "".join(o)


def g_cape():
    o = [path("M -30 -34 Q 0 -44 30 -34 Q 44 0 48 40 Q 24 30 0 42 Q -24 30 -48 40 Q -44 0 -30 -34 Z", "#7B61FF"),
         path("M -30 -34 Q 0 -22 30 -34", "none", sw=5),
         circ(0, -30, 7, GLOW, sw=4)]
    o.append(star(-18, 2, 9, GLOW, sw=2.5))
    o.append(star(16, 14, 7, GLOW, sw=2.5))
    return "".join(o)


def g_box():
    return "".join([
        poly([(-42, -14), (42, -14), (42, 40), (-42, 40)], "#C99A62"),
        poly([(-42, -14), (-52, -36), (-8, -36), (0, -14)], "#B5874F"),
        poly([(42, -14), (52, -36), (8, -36), (0, -14)], "#B5874F"),
        rrect(-24, 2, 48, 16, 8, NAVY, sw=4),
        circ(-10, 10, 4.5, "white", stroke="none"), circ(10, 10, 4.5, "white", stroke="none"),
        line(-42, 40, 42, 40, sw=5)])


def g_decoy():
    return "".join([
        path("M 34 14 Q 54 14 50 -6", "none", stroke=PINK, sw=6),
        ell(0, 10, 38, 24, "#AEB8D0"),
        circ(-22, -12, 12, "#AEB8D0"), circ(-22, -12, 5.5, PINK, stroke="none"),
        circ(-6, -16, 11, "#AEB8D0"), circ(-6, -16, 5, PINK, stroke="none"),
        circ(-24, 6, 4.5, OUT, stroke="none"), circ(-39, 12, 4.5, PINK, sw=3),
        line(12, -14, 12, -30, sw=6), ell(12, -38, 12, 8, GLOW, sw=4), circ(12, -38, 3, OUT, stroke="none"),
        circ(-12, 34, 6, "#59607A", sw=3.5), circ(16, 34, 6, "#59607A", sw=3.5)])


def g_bone():
    o = []
    for cx, cy in [(-32, -12), (-32, 12), (32, -12), (32, 12)]:
        o.append(circ(cx, cy, 14, TAN))
    o.append(rrect(-32, -12, 64, 24, 4, TAN))
    for cx, cy in [(-32, -12), (-32, 12), (32, -12), (32, 12)]:
        o.append(circ(cx, cy, 11.5, TAN, stroke="none"))
    o.append(rrect(-30, -9.5, 60, 19, 2, TAN, stroke="none"))
    return g(o, 0, 0, 1.0, rot=-20)


def g_laser():
    return "".join([
        line(-6, 6, 40, -36, stroke=RED, sw=5, extra='opacity="0.85"'),
        circ(42, -38, 8, RED, sw=3), sparkle(42, -38, 16, fill="white"),
        g(rrect(-32, -9, 58, 18, 8, "#59607A") + rrect(-8, -9, 12, 18, 2, RED, sw=3) + rrect(-32, -9, 12, 18, 6, "#C9D1E4", sw=3), -14, 22, 1.0, rot=-42)])


def g_clicker():
    o = [g(rrect(-22, -40, 44, 82, 12, "#59607A") + circ(0, -24, 8, RED, sw=3.5)
           + circ(-9, 0, 5, "#C9D1E4", sw=3) + circ(9, 0, 5, "#C9D1E4", sw=3)
           + circ(-9, 18, 5, "#C9D1E4", sw=3) + circ(9, 18, 5, "#C9D1E4", sw=3), -8, 8, 1.0, rot=-18)]
    o.append(path("M 14 -34 Q 26 -40 32 -28", "none", stroke=GLOW, sw=5))
    o.append(path("M 18 -46 Q 38 -54 46 -32", "none", stroke=GLOW, sw=5))
    return "".join(o)


def g_toot():
    return "".join([
        circ(40, -28, 11, "#B8F0CC", sw=3.5), circ(52, -40, 7, "#B8F0CC", sw=3), circ(30, -42, 5, "#B8F0CC", sw=3),
        path("M 20 -6 L 38 -16 L 42 -6 L 26 4 Z", "#E05C9C"),
        ell(-6, 12, 38, 32, PINK),
        path("M -26 2 Q -8 -12 12 0", "none", stroke="white", sw=4, extra='opacity="0.7"')])


def g_rccar():
    return "".join([
        line(-22, -14, -30, -44, sw=4), circ(-30, -46, 4.5, GLOW, sw=3),
        path("M -44 20 L -44 2 Q -42 -6 -32 -6 L -16 -6 L -6 -22 L 22 -22 L 34 -6 L 42 -4 Q 48 -2 48 6 L 48 20 Z", RED),
        path("M -10 -8 L -2 -18 L 18 -18 L 26 -8 Z", "#CFE8FF", sw=4),
        circ(-24, 22, 13, NAVY, sw=4), circ(-24, 22, 5, "#C9D1E4", stroke="none"),
        circ(26, 22, 13, NAVY, sw=4), circ(26, 22, 5, "#C9D1E4", stroke="none")])


def g_goggles():
    return "".join([
        path("M -48 -4 Q -56 -20 -40 -22 M 48 -4 Q 56 -20 40 -22", "none", sw=8),
        rrect(-46, -20, 92, 40, 16, "#59607A"),
        circ(-20, 0, 17, "#B8F0CC"), circ(20, 0, 17, "#B8F0CC"),
        circ(-20, 0, 9, GREEN, sw=3), circ(20, 0, 9, GREEN, sw=3),
        circ(-24, -5, 3, "white", stroke="none"), circ(16, -5, 3, "white", stroke="none")])


def g_radar():
    o = [line(22, -30, 34, -52, sw=5), circ(35, -54, 5, RED, sw=3),
         rrect(-36, -36, 72, 80, 14, PINK),
         circ(0, -2, 26, "#12301F", sw=4), circ(0, -2, 15, "none", stroke=GREEN, sw=2.5),
         line(0, -2, 20, -18, stroke=GREEN, sw=3.5), circ(-10, 6, 4.5, PINK, stroke="none"),
         rrect(-14, 30, 28, 7, 3, MILK, sw=3)]
    return "".join(o)


def g_dummy():
    o = [g_pillow()]
    o.append(circ(-14, -4, 4.5, OUT, stroke="none"))
    o.append(circ(14, -4, 4.5, OUT, stroke="none"))
    o.append(path("M -12 10 Q 0 20 12 10", "none", sw=4))
    o.append(path("M -10 -30 Q -4 -46 4 -32 Q 10 -46 16 -30", "none", stroke=BROWN, sw=6))
    return "".join(o)


def g_pacifier():
    return "".join([
        circ(0, 26, 17, "none", stroke=OUT, sw=13), circ(0, 26, 17, "none", stroke=MOON, sw=6),
        ell(0, -24, 13, 17, "#FFE9A8"),
        ell(0, -2, 36, 15, PINK), circ(0, -2, 5, "#FFD0E4", stroke="none")])


def g_musicbox():
    return "".join([
        path("M -34 -30 Q -30 -44 -22 -34 M -22 -34 L -22 -52 L -10 -48", "none", stroke=GLOW, sw=5),
        circ(-36, -28, 5, GLOW, sw=3),
        path("M 6 -40 L 6 -58 L 18 -54", "none", stroke=GLOW, sw=5), circ(2, -38, 5, GLOW, sw=3),
        rrect(-38, -16, 76, 54, 8, "#7B61FF"), rrect(-38, -16, 76, 16, 8, "#5A43D6"),
        star(0, 18, 11, GLOW, sw=2.5),
        line(38, 10, 52, 10, sw=6), line(52, 10, 52, -6, sw=6), circ(52, -10, 6, RED, sw=3.5)])


def g_claw():
    o = [limb("M -30 34 L 14 -10", 9, ORANGE, sw=4),
         rrect(-44, 26, 26, 22, 8, RED),
         path("M 14 -10 Q 4 -34 22 -44", "none", sw=14), path("M 14 -10 Q 4 -34 22 -44", "none", stroke="#C9D1E4", sw=6),
         path("M 14 -10 Q 40 -4 46 -22", "none", sw=14), path("M 14 -10 Q 40 -4 46 -22", "none", stroke="#C9D1E4", sw=6),
         circ(14, -10, 8, "#59607A", sw=4)]
    return "".join(o)


def g_drone():
    o = []
    for sx in (-1, 1):
        o.append(line(0, -8, sx * 38, -22, sw=7))
        o.append(ell(sx * 38, -28, 22, 7, "#CFE8FF", sw=3.5, extra='fill-opacity="0.8"'))
        o.append(circ(sx * 38, -22, 5, "#59607A", sw=3))
    o.append(rrect(-22, -18, 44, 26, 10, MOON))
    o.append(circ(-8, -5, 4.5, "white", sw=3))
    o.append(circ(8, -5, 4.5, "white", sw=3))
    o.append(line(0, 8, 0, 22, sw=4))
    o.append(g(s_cookie(), 0, 36, 0.42))
    return "".join(o)


# type -> color
TYPES = {"Sneak": MOON, "Distract": ORANGE, "Sense": GREEN, "Rescue": PINK, "Reach": GLOW}

GADGETS = [
    ("Fuzzy Socks", "Sneak", g_socks), ("Bunny Slippers", "Sneak", g_slippers), ("Oil Can", "Sneak", g_oilcan),
    ("Pillow Muffler", "Sneak", g_muffler), ("Blanket Cape", "Sneak", g_cape), ("Cardboard Box", "Sneak", g_box),
    ("Good Boy Biscuits", "Distract", g_bone), ("Squeaky Decoy", "Distract", g_decoy), ("Laser Pointer", "Distract", g_laser),
    ("Clicker", "Distract", g_clicker), ("Toot Box", "Distract", g_toot), ("RC Car", "Distract", g_rccar),
    ("Night Goggles", "Sense", g_goggles), ("Mom Radar", "Sense", g_radar),
    ("Pillow Dummy", "Rescue", g_dummy), ("Pacifier", "Rescue", g_pacifier), ("Music Box", "Rescue", g_musicbox),
    ("Grabby Claw", "Reach", g_claw), ("Snack Drone", "Reach", g_drone),
]


def tile(x, y, size, icon, ring_color, scale=1.5):
    """Sticker-style tile with the icon centered. (x, y) is the tile center."""
    h = size / 2
    return (rrect(x - h, y - h, size, size, 34, "#232863", stroke=ring_color, sw=6)
            + g(icon, x, y, scale))


def sheet(items, cols, title, subtitle, legend=None, kind="snack"):
    W = 1600
    cw = (W - 120) / cols
    rows = math.ceil(len(items) / cols)
    top = 190 if legend else 170
    rh = 312
    H = int(top + rows * rh + 20)
    c = []
    for sx in range(40, W, 110):
        for sy in range(40, H, 110):
            c.append(circ(sx + (55 if (sy // 110) % 2 else 0), sy, 5, "#1B2150", stroke="none"))
    c.append(otext(60, 92, title, 66, fill=MILK, weight=800, anchor="start", font="Baloo 2", ow=14))
    c.append(text(64, 130, subtitle, 28, fill=MOON, weight=500, anchor="start"))
    if legend:
        lx = 1540
        for name, col in reversed(list(legend.items())):
            wtxt = len(name) * 12.6 + 22
            c.append(text(lx, 100, name, 26, fill=MILK, weight=600, anchor="end"))
            c.append(circ(lx - wtxt, 91, 11, col, sw=3.5))
            lx -= wtxt + 42
    for i, it in enumerate(items):
        r, k = divmod(i, cols)
        # center the last row if it is short
        n_in_row = min(cols, len(items) - r * cols)
        offset = (cols - n_in_row) * cw / 2
        cx = 60 + offset + k * cw + cw / 2
        cy = top + r * rh + 112
        if kind == "snack":
            name, tag, fn = it
            col = GLOW if name == "Golden Donut" else "#4A4FA8"
            c.append(tile(cx, cy, 200, fn(), col, 1.55))
            c.append(text(cx, cy + 142, name, 32, fill=MILK, weight=700))
            c.append(text(cx, cy + 174, tag, 25, fill=MOON, weight=500))
        else:
            name, typ, fn = it
            c.append(tile(cx, cy, 200, fn(), TYPES[typ], 1.55))
            c.append(text(cx, cy + 142, name, 30, fill=MILK, weight=700))
            c.append(text(cx, cy + 174, typ, 25, fill=TYPES[typ], weight=600))
    return svg_doc(c, W, H, bg="#161B45"), W, H


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "."
    svg, W, H = sheet(SNACKS, 5, "The snack menu", "Every snack fights back in its own way.")
    render(svg, out + "/snacks.png", W, H, scale=1.25)
    svg, W, H = sheet(GADGETS, 5, "The toolbox", "19 gadgets. Each one levels up 5 times.", legend=TYPES, kind="gadget")
    render(svg, out + "/gadgets.png", W, H, scale=1.25)
    print("ok")
