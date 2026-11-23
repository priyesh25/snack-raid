"""The in-game raider: a chibi sneaker with a front and a back view and a 3-frame tiptoe cycle.

raider(kind, colors, view, step)
  kind   'dino' (hooded onesie) or 'star' (pajamas and hair puffs)
  view   'front' (moving down or sideways) or 'back' (moving up)
  step   0 standing, 1 left foot up, 2 right foot up
The figure stands on (0, 0). Up is negative y.
"""
import math
from base import *
from chars import SKIN_A, SKIN_B, BLUSH

HAIR = "#2A1A14"


def _shine(x, y, rx, ry, rot=-25, a=0.45):
    return ell(x, y, rx, ry, "white", stroke="none", extra=f'opacity="{a}" transform="rotate({rot} {x} {y})"')


def _legs(col, shoe, step):
    o = []
    # (hip x, foot x, foot lift)
    for side, sx in ((-1, -18), (1, 18)):
        up = (step == 1 and side < 0) or (step == 2 and side > 0)
        lift = 16 if up else 0
        fx = sx + side * 3
        o.append(limb(f"M {sx} -46 L {fx} {-14 - lift}", 22, col))
        o.append(ell(fx + side * 2, -8 - lift, 18, 9 if not up else 8, shoe))
        o.append(ell(fx + side * 2 - 4, -11 - lift, 6, 3, "white", stroke="none", extra='opacity="0.4"'))
    return "".join(o)


def _sneak_arms(col, skin, step, back=False):
    """Hands held up by the chest, like a cartoon sneak. They bob with the step."""
    b = {0: 0, 1: -4, 2: 4}[step]
    o = []
    for side in (-1, 1):
        hx, hy = side * 30, -104 + (b * side)
        o.append(limb(f"M {side * 40} -112 Q {side * 58} -96 {hx} {hy}", 18, col))
        if not back:
            o.append(circ(hx, hy, 10, skin, sw=4))
    return "".join(o)


def _dino_spikes(cx, cy, r, col, angles=(-34, -4, 26), size=34):
    o = []
    for ang in angles:
        a = math.radians(ang - 90)
        bx, by = cx + (r - 8) * math.cos(a), cy + (r - 8) * math.sin(a)
        tip = (cx + (r + size) * math.cos(a), cy + (r + size) * math.sin(a))
        px, py = -math.sin(a) * 15, math.cos(a) * 15
        o.append(poly([(bx - px, by - py), tip, (bx + px, by + py)], col))
    return "".join(o)


def raider(kind="dino", colors=None, view="front", step=0):
    back = view == "back"
    bob = -3 if step else 0
    o = [ell(0, 4, 50, 10, "#070A1E", stroke="none", extra='opacity="0.35"')]
    if kind == "dino":
        G, GD, GL = colors or ("#4CCB7A", "#2FA35B", "#C9F5D9")
        skin = SKIN_A
        body = []
        # tail: behind the body in front view, in front of it in back view
        tail = limb("M 24 -50 Q 62 -44 70 -14", 18, G) + _dino_spikes(58, -40, 6, GD, angles=(70,), size=12)
        if not back:
            body.append(tail)
        body.append(_legs(G, GD, step))
        body.append(rrect(-42, -128, 84, 86, 36, G))
        if back:
            for y in (-116, -92, -68):
                body.append(poly([(-9, y + 8), (0, y - 8), (9, y + 8)], GD, sw=3.5))
            body.append(tail)
        else:
            body.append(ell(0, -80, 24, 28, GL, stroke="none"))
            body.append(_shine(-24, -112, 9, 14))
        body.append(_sneak_arms(G, skin, step, back))
        # the hood
        cy = -178
        body.append(_dino_spikes(0, cy, 66, GD, angles=(-40, -10, 20) if not back else (-30, 0, 30)))
        body.append(circ(0, cy, 66, G))
        body.append(_shine(-30, cy - 30, 13, 20))
        if back:
            for y in (-236, -206, -176, -146):
                body.append(poly([(-10, y + 8), (0, y - 10), (10, y + 8)], GD, sw=3.5))
        else:
            for sx in (-1, 1):
                body.append(circ(sx * 32, -228, 10, "white", sw=4))
                body.append(circ(sx * 32 + 2, -227, 4, OUT, stroke="none"))
            body.append(ell(0, -166, 48, 44, skin))
            for tx in (-26, -9, 9, 26):
                ty = -166 - math.sqrt(max(0, 1 - (tx / 48) ** 2)) * 44
                body.append(poly([(tx - 7, ty + 2), (tx + 7, ty + 2), (tx, ty + 13)], "white", sw=3))
            body.append(_face(0, -166, skin))
        o.append(g(body, 0, bob))
    else:
        P, FOOT, STARC = colors or ("#7B61FF", "#FFD166", GLOW)
        skin = SKIN_B
        body = [_legs(P, FOOT, step)]
        body.append(rrect(-42, -128, 84, 86, 36, P))
        for sx, sy, r in ((-18, -100, 9), (16, -76, 11), (-12, -58, 7)):
            body.append(star(sx if not back else -sx, sy, r, STARC, sw=2.5))
        body.append(_shine(-24, -112, 9, 14, a=0.3))
        body.append(_sneak_arms(P, skin, step, back))
        cy = -176
        body.append(circ(-52, cy - 48, 26, HAIR))
        body.append(circ(52, cy - 48, 26, HAIR))
        body.append(ell(-42, cy - 30, 9, 6, PINK, sw=3, extra=f'transform="rotate(-40 -42 {cy - 30})"'))
        body.append(ell(42, cy - 30, 9, 6, PINK, sw=3, extra=f'transform="rotate(40 42 {cy - 30})"'))
        if back:
            body.append(circ(0, cy, 62, HAIR))
            body.append(path(f"M -30 {cy - 40} Q 0 {cy - 52} 30 {cy - 40}", "none", stroke="#5A3A2A", sw=4))
            body.append(path(f"M -40 {cy - 10} Q 0 {cy - 22} 40 {cy - 10}", "none", stroke="#5A3A2A", sw=4))
        else:
            body.append(circ(0, cy, 62, skin))
            body.append(path(f"M -61 {cy - 6} Q -62 {cy - 64} 0 {cy - 64} Q 62 {cy - 64} 61 {cy - 6} "
                             f"Q 44 {cy - 38} 14 {cy - 38} Q 4 {cy - 24} -8 {cy - 38} Q -44 {cy - 38} -61 {cy - 6} Z", HAIR))
            body.append(_shine(-26, cy - 46, 10, 6, rot=-15, a=0.25))
            body.append(_face(0, cy + 4, skin))
        o.append(g(body, 0, bob))
    return "".join(o)


def _face(cx, cy, skin):
    """Sly sneaky face: eyes looking to the side, one eyebrow up, a little 'shh' mouth."""
    o = []
    for sx in (-1, 1):
        ex = cx + sx * 20
        o.append(ell(ex, cy, 13, 15, "white", sw=4))
        o.append(circ(ex + 5, cy + 1, 7.5, OUT, stroke="none"))
        o.append(circ(ex + 2.5, cy - 3, 2.8, "white", stroke="none"))
    o.append(path(f"M {cx - 32} {cy - 22} Q {cx - 22} {cy - 26} {cx - 11} {cy - 21}", "none", sw=4))
    o.append(path(f"M {cx + 11} {cy - 25} Q {cx + 22} {cy - 33} {cx + 32} {cy - 26}", "none", sw=4))
    o.append(ell(cx - 34, cy + 18, 9, 5.5, BLUSH, stroke="none", extra='opacity="0.75"'))
    o.append(ell(cx + 34, cy + 18, 9, 5.5, BLUSH, stroke="none", extra='opacity="0.75"'))
    o.append(ell(cx + 4, cy + 26, 5, 6, "#7A2E2E", sw=3.5))
    return "".join(o)
