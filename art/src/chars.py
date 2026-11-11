"""Snack Raid cast, drawn as chunky vector toys. Each figure stands on (0, 0); up is negative y."""
import math
from base import *

SKIN_A = "#F6C9A0"
SKIN_B = "#B9774F"
SKIN_C = "#EBB58A"
BLUSH = "#FF9E9E"


def shadow(rx=64, ry=11, y=6):
    return ell(0, y, rx, ry, "#070A1E", stroke="none", extra='opacity="0.35"')


def cookie(cx, cy, r=16, bite=False):
    out = [circ(cx, cy, r, "#D9A066", sw=4)]
    for dx, dy in [(-6, -4), (5, -6), (2, 5), (-5, 6), (8, 3)]:
        out.append(circ(cx + dx * r / 16, cy + dy * r / 16, r * 0.15, "#6B3F1D", stroke="none"))
    return "".join(out)


def eyes(cx, cy, gap=20, rx=13, ry=15, look=(-4, 1), pupil=7.5, sw=4):
    out = []
    for sx in (-1, 1):
        ex = cx + sx * gap
        out.append(ell(ex, cy, rx, ry, "white", sw=sw))
        out.append(circ(ex + look[0], cy + look[1], pupil, OUT, stroke="none"))
        out.append(circ(ex + look[0] - 2.5, cy + look[1] - 3, 2.6, "white", stroke="none"))
    return "".join(out)


def blush(cx, cy, gap=34, rx=9, ry=5.5):
    return (ell(cx - gap, cy, rx, ry, BLUSH, stroke="none", extra='opacity="0.75"')
            + ell(cx + gap, cy, rx, ry, BLUSH, stroke="none", extra='opacity="0.75"'))


def sweat(x, y, s=1.0):
    return g(path("M 0 -14 Q 10 0 6 8 Q 0 14 -6 8 Q -10 0 0 -14 Z", "#9FE3FF", sw=3), x, y, s)


# ---------------------------------------------------------------- raiders

def kid_dino(skin=SKIN_A, look=(-4, 1), with_cookie=True, colors=None):
    G, GD, GL = colors or ("#4CCB7A", "#2FA35B", "#C9F5D9")
    o = [shadow()]
    # tail
    o.append(limb("M 34 -52 Q 80 -52 84 -18", 20, G))
    # legs: one planted, one lifted (tiptoe)
    o.append(limb("M -20 -50 L -22 -16", 24, G))
    o.append(ell(-27, -7, 22, 10, GD))
    o.append(limb("M 20 -52 L 30 -34", 24, G))
    o.append(ell(38, -24, 20, 9, GD, extra='transform="rotate(-18 38 -24)"'))
    # body and belly
    o.append(rrect(-44, -130, 88, 90, 38, G))
    o.append(ell(0, -80, 25, 28, GL, stroke="none"))
    # arms
    o.append(limb("M -40 -108 Q -66 -104 -78 -88", 20, G))
    o.append(circ(-82, -84, 11, skin, sw=4))
    o.append(limb("M 40 -108 Q 60 -106 68 -94", 20, G))
    if with_cookie:
        o.append(cookie(76, -90, 18))
    else:
        o.append(circ(72, -90, 11, skin, sw=4))
    # hood spikes (behind the hood)
    cx, cy = 0, -178
    for ang in (-34, -4, 26):
        a = math.radians(ang - 90)
        bx, by = cx + 60 * math.cos(a), cy + 60 * math.sin(a)
        tip = (cx + 94 * math.cos(a), cy + 94 * math.sin(a))
        px, py = -math.sin(a) * 17, math.cos(a) * 17
        o.append(poly([(bx - px, by - py), tip, (bx + px, by + py)], GD))
    o.append(circ(cx, cy, 68, G))
    # little dino eyes on the hood
    for sx in (-1, 1):
        o.append(circ(sx * 34, -226, 9, "white", sw=4))
        o.append(circ(sx * 34, -225, 3.5, OUT, stroke="none"))
    # face opening with teeth on the rim
    o.append(ell(0, -168, 50, 46, skin))
    for tx in (-27, -9, 9, 27):
        ty = -168 - math.sqrt(max(0, 1 - (tx / 50) ** 2)) * 46
        o.append(poly([(tx - 8, ty + 2), (tx + 8, ty + 2), (tx, ty + 15)], "white", sw=3))
    # face
    o.append(path("M -32 -191 Q -22 -198 -11 -192", "none", sw=4))
    o.append(path("M 11 -192 Q 22 -198 32 -191", "none", sw=4))
    o.append(eyes(0, -170, gap=20, look=look))
    o.append(blush(0, -151))
    o.append(path("M -9 -141 Q -4 -147 0 -141 Q 4 -135 9 -141", "none", sw=4))
    return "".join(o)


def kid_star(skin=SKIN_B, look=(4, 1), with_juice=True, colors=None):
    P, FOOT, STARC = colors or ("#7B61FF", "#FFD166", GLOW)
    HAIR = "#2A1A14"
    o = [shadow()]
    # legs (mirrored tiptoe)
    o.append(limb("M 20 -50 L 22 -16", 24, P))
    o.append(ell(27, -7, 22, 10, FOOT))
    o.append(limb("M -20 -52 L -30 -34", 24, P))
    o.append(ell(-38, -24, 20, 9, FOOT, extra='transform="rotate(18 -38 -24)"'))
    # body
    o.append(rrect(-44, -130, 88, 90, 38, P))
    o.append(star(-18, -100, 9, STARC, sw=2.5))
    o.append(star(16, -76, 11, STARC, sw=2.5))
    o.append(star(-12, -58, 7, STARC, sw=2.5))
    # arms
    o.append(limb("M 40 -108 Q 66 -104 78 -88", 20, P))
    o.append(circ(82, -84, 11, skin, sw=4))
    o.append(limb("M -40 -108 Q -60 -106 -68 -94", 20, P))
    if with_juice:
        o.append(rrect(-92, -108, 26, 34, 5, "#FF8A3D", sw=4))
        o.append(rrect(-92, -108, 26, 10, 5, "#FFD166", sw=4))
        o.append(line(-74, -108, -68, -124, sw=4))
    else:
        o.append(circ(-72, -90, 11, skin, sw=4))
    # hair puffs behind the head
    o.append(circ(-54, -226, 27, HAIR))
    o.append(circ(54, -226, 27, HAIR))
    o.append(ell(-44, -208, 9, 6, PINK, sw=3, extra='transform="rotate(-40 -44 -208)"'))
    o.append(ell(44, -208, 9, 6, PINK, sw=3, extra='transform="rotate(40 44 -208)"'))
    # head
    o.append(circ(0, -176, 62, skin))
    o.append(path("M -61 -182 Q -62 -240 0 -240 Q 62 -240 61 -182 Q 44 -214 14 -214 Q 4 -200 -8 -214 Q -44 -214 -61 -182 Z", HAIR))
    # face
    o.append(path("M -32 -193 Q -22 -199 -11 -195", "none", sw=4))
    o.append(path("M 11 -195 Q 22 -199 32 -193", "none", sw=4))
    o.append(eyes(0, -172, gap=21, look=look))
    o.append(blush(0, -152, gap=36))
    o.append(path("M -10 -144 Q 0 -134 10 -144", "none", sw=4))
    return "".join(o)


# ---------------------------------------------------------------- pets and machines

def biscuit_sit():
    O, OD, W = "#F4A259", "#D9822B", "#FFF6E5"
    o = [shadow(56, 10)]
    # tail nub
    o.append(circ(46, -40, 12, O))
    # body
    o.append(ell(0, -46, 50, 46, O))
    o.append(ell(0, -38, 27, 32, W, stroke="none"))
    # front paws
    o.append(ell(-20, -5, 15, 9, W, sw=4))
    o.append(ell(20, -5, 15, 9, W, sw=4))
    # ears
    o.append(poly([(-50, -128), (-58, -196), (-12, -152)], O))
    o.append(poly([(-46, -140), (-52, -180), (-24, -152)], "#FFB8B8", stroke="none"))
    o.append(poly([(50, -128), (58, -196), (12, -152)], O))
    o.append(poly([(46, -140), (52, -180), (24, -152)], "#FFB8B8", stroke="none"))
    # head
    o.append(ell(0, -112, 56, 46, O))
    # white blaze and muzzle
    o.append(path("M -8 -156 Q 0 -160 8 -156 L 10 -118 L -10 -118 Z", W, stroke="none"))
    o.append(ell(0, -98, 29, 24, W, stroke="none"))
    # eyes
    for sx in (-1, 1):
        o.append(circ(sx * 25, -120, 7, OUT, stroke="none"))
        o.append(circ(sx * 25 - 2, -123, 2.4, "white", stroke="none"))
    # nose, mouth, tongue
    o.append(path("M -1 -100 Q -2 -88 -13 -88 M 1 -100 Q 2 -88 13 -88", "none", sw=3.5))
    o.append(path("M -7 -89 Q -7 -72 0 -72 Q 7 -72 7 -89 Z", "#FF7E9D", sw=3.5))
    o.append(ell(0, -104, 10, 7, OUT, stroke="none"))
    return "".join(o)


def biscuit_sleep():
    O, W = "#F4A259", "#FFF6E5"
    o = [shadow(74, 10, 2)]
    # body curled
    o.append(ell(8, -30, 62, 32, O))
    o.append(circ(64, -40, 11, O))
    o.append(ell(34, -8, 16, 8, W, sw=4))
    # head resting on paws
    o.append(poly([(-78, -44), (-92, -84), (-52, -60)], O))
    o.append(poly([(-28, -60), (-22, -92), (-52, -62)], O))
    o.append(ell(-50, -32, 38, 30, O))
    o.append(ell(-58, -22, 20, 15, W, stroke="none"))
    o.append(ell(-66, -26, 7, 5, OUT, stroke="none"))
    o.append(path("M -50 -40 Q -44 -34 -38 -40", "none", sw=3.5))
    o.append(path("M -74 -42 Q -70 -37 -66 -42", "none", sw=3.5))
    o.append(ell(-36, -6, 16, 8, W, sw=4))
    return "".join(o)


def dusty(mood="happy"):
    top, rim, side = "#D5DCEC", "#AEB8D0", "#59607A"
    o = [shadow(70, 12, 4)]
    o.append(ell(0, -18, 64, 26, side))
    o.append(rrect(-64, -34, 128, 16, 0, side, stroke="none"))
    o.append(line(-64, -34, -64, -18, sw=SW))
    o.append(line(64, -34, 64, -18, sw=SW))
    o.append(ell(0, -34, 64, 26, top))
    o.append(ell(0, -36, 42, 16, rim, sw=3))
    o.append(ell(0, -37, 13, 6, "#4DE1B0", sw=3))
    # LED eyes on the bumper
    eye = "#7FE9FF" if mood == "happy" else RED
    o.append(rrect(-30, -17, 16, 11, 5, eye, sw=3))
    o.append(rrect(14, -17, 16, 11, 5, eye, sw=3))
    # side brushes
    o.append(line(-66, -8, -80, 0, sw=4))
    o.append(line(-64, -4, -74, 6, sw=4))
    o.append(line(66, -8, 80, 0, sw=4))
    o.append(line(64, -4, 74, 6, sw=4))
    return "".join(o)


# ---------------------------------------------------------------- family

def half_lids(cx, cy, gap, rx, ry, skin, drop=0.45):
    """Sleepy or unimpressed eyelids drawn over eyes()."""
    out = []
    for sx in (-1, 1):
        ex = cx + sx * gap
        yl = cy - ry + 2 * ry * drop
        out.append(path(f"M {ex - rx - 1} {yl} Q {ex - rx - 2} {cy - ry - 3} {ex} {cy - ry - 3} "
                        f"Q {ex + rx + 2} {cy - ry - 3} {ex + rx + 1} {yl} Z", skin, stroke="none"))
        out.append(line(ex - rx - 1, yl, ex + rx + 1, yl, sw=4))
    return "".join(out)


def dad(awake=False):
    PJ, skin, HAIR = "#8FB8FF", "#EBB58A", "#6B4423"
    o = [shadow(80, 12)]
    # legs and slippers
    o.append(limb("M -26 -70 L -28 -20", 34, PJ))
    o.append(limb("M 26 -70 L 28 -20", 34, PJ))
    o.append(ell(-33, -8, 29, 11, "#8B5E3C"))
    o.append(ell(33, -8, 29, 11, "#8B5E3C"))
    # arms (behind belly)
    o.append(limb("M -60 -166 Q -96 -136 -90 -98", 26, PJ))
    o.append(circ(-90, -90, 14, skin, sw=4))
    o.append(limb("M 60 -166 Q 96 -136 90 -98", 26, PJ))
    o.append(circ(90, -90, 14, skin, sw=4))
    # belly with stripes
    cid = uid("clip")
    o.append(f'<clipPath id="{cid}"><ellipse cx="0" cy="-124" rx="69" ry="71"/></clipPath>')
    o.append(ell(0, -124, 72, 74, PJ))
    stripes = "".join(f'<rect x="{x - 5}" y="-204" width="10" height="170" fill="white" opacity="0.75"/>'
                      for x in range(-60, 61, 24))
    o.append(f'<g clip-path="url(#{cid})">{stripes}</g>')
    o.append(ell(0, -124, 72, 74, "none"))
    for by in (-150, -122, -94):
        o.append(circ(0, by, 4.5, "white", sw=3))
    # head
    o.append(circ(-54, -236, 12, skin))
    o.append(circ(54, -236, 12, skin))
    o.append(circ(0, -238, 56, skin))
    o.append(path("M -55 -246 Q -62 -262 -50 -272 L -44 -250 Z", HAIR, sw=4))
    o.append(path("M 55 -246 Q 62 -262 50 -272 L 44 -250 Z", HAIR, sw=4))
    # nightcap
    o.append(path("M -52 -266 Q -34 -322 22 -318 Q 80 -310 100 -262 Q 76 -280 50 -270 Z", "#7B61FF"))
    o.append(star(8, -296, 9, GLOW, sw=2.5))
    o.append(star(52, -290, 6, GLOW, sw=2.5))
    o.append(limb("M -50 -264 Q 0 -288 50 -264", 13, GLOW, sw=4))
    o.append(circ(102, -254, 14, GLOW))
    # face: closed eyes, big nose, mustache, snoring mouth
    if awake:
        o.append(eyes(0, -240, gap=21, rx=11, ry=11, look=(0, 3), pupil=6))
        o.append(half_lids(0, -240, 21, 11, 11, skin, drop=0.42))
        o.append(path("M -9 -196 Q 0 -200 9 -196", "none", sw=4))
    else:
        o.append(path("M -32 -238 Q -21 -229 -10 -238", "none", sw=4))
        o.append(path("M 10 -238 Q 21 -229 32 -238", "none", sw=4))
        o.append(ell(0, -196, 13, 10, "#7A2E2E", sw=4))
    o.append(path("M -32 -212 Q -16 -224 0 -214 Q 16 -224 32 -212 Q 16 -200 0 -207 Q -16 -200 -32 -212 Z", HAIR, sw=4))
    o.append(ell(0, -224, 12, 10, "#E09A6E", sw=4))
    return "".join(o)


def mom(asleep=False):
    ROBE, ROBE_D, COLLAR = "#E05C9C", "#B93F7E", "#FFD0E4"
    skin, HAIR = "#F2C7A5", "#4A2C1A"
    o = [shadow(68, 11)]
    o.append(ell(-22, -7, 22, 10, MILK))
    o.append(ell(22, -7, 22, 10, MILK))
    # robe
    o.append(path("M -38 -180 Q -52 -180 -54 -164 L -62 -26 Q -62 -14 -50 -14 L 50 -14 Q 62 -14 62 -26 "
                  "L 54 -164 Q 52 -180 38 -180 Z", ROBE))
    o.append(poly([(-22, -180), (0, -140), (22, -180)], COLLAR, sw=4))
    o.append(rrect(-59, -104, 118, 14, 6, ROBE_D, sw=4))
    # crossed arms
    o.append(limb("M 50 -160 Q 62 -128 4 -132", 24, ROBE))
    o.append(circ(-2, -132, 11, skin, sw=4))
    o.append(limb("M -50 -160 Q -62 -116 -6 -118", 24, ROBE))
    o.append(circ(2, -118, 11, skin, sw=4))
    # hair bun, head, hair cap
    o.append(circ(0, -296, 22, HAIR))
    o.append(circ(0, -230, 52, skin))
    o.append(path("M -52 -228 Q -58 -288 0 -286 Q 58 -288 52 -228 Q 42 -264 0 -264 Q -42 -264 -52 -228 Z", HAIR))
    if asleep:
        o.append(rrect(-40, -244, 80, 26, 12, "#8E7CFF", sw=4))
        o.append(path("M -26 -232 Q -17 -224 -8 -232", "none", stroke="white", sw=3))
        o.append(path("M 8 -232 Q 17 -224 26 -232", "none", stroke="white", sw=3))
        o.append(blush(0, -208, gap=34, rx=8, ry=5))
        o.append(path("M -7 -200 Q 0 -196 7 -200", "none", sw=4))
    else:
        # sleep mask pushed up
        o.append(rrect(-38, -284, 76, 22, 11, "#8E7CFF", sw=4))
        o.append(path("M -24 -274 Q -16 -267 -8 -274", "none", stroke="white", sw=3))
        o.append(path("M 8 -274 Q 16 -267 24 -274", "none", stroke="white", sw=3))
        # face: unimpressed eyes, one raised eyebrow
        o.append(eyes(0, -228, gap=20, rx=12, ry=12, look=(-3, 3), pupil=6.5))
        o.append(half_lids(0, -228, 20, 12, 12, skin, drop=0.38))
        o.append(path("M -32 -248 L -10 -246", "none", sw=4))
        o.append(path("M 9 -250 Q 20 -262 33 -252", "none", sw=4))
        o.append(blush(0, -208, gap=34, rx=8, ry=5))
        o.append(path("M -9 -200 Q 2 -198 12 -204", "none", sw=4))
    return "".join(o)


def mika():
    HOOD, HOOD_D, skin, HAIR = "#2EC4B6", "#1E9E93", "#EBB58A", "#1E1B2E"
    o = [shadow(62, 10)]
    o.append(limb("M -18 -72 L -20 -20", 26, "#59607A"))
    o.append(limb("M 18 -72 L 20 -20", 26, "#59607A"))
    o.append(ell(-25, -8, 22, 10, PINK))
    o.append(ell(25, -8, 22, 10, PINK))
    # back hair
    o.append(path("M -52 -214 Q -60 -276 0 -274 Q 60 -276 52 -214 L 58 -160 L -58 -160 Z", HAIR))
    # hoodie
    o.append(rrect(-48, -174, 96, 110, 34, HOOD))
    o.append(rrect(-30, -104, 60, 26, 10, HOOD_D, sw=4))
    o.append(line(-10, -166, -12, -140, stroke="white", sw=3))
    o.append(line(10, -166, 12, -140, stroke="white", sw=3))
    # arms and phone
    o.append(limb("M -44 -154 Q -66 -124 -58 -96", 22, HOOD))
    o.append(circ(-58, -90, 11, skin, sw=4))
    o.append(circ(64, -150, 46, "#9FD8FF", stroke="none", extra='opacity="0.22"'))
    o.append(limb("M 44 -152 Q 70 -128 62 -140", 22, HOOD))
    o.append(rrect(50, -178, 28, 44, 6, "#1B1E3F", sw=4))
    o.append(rrect(54, -174, 20, 36, 3, "#9FD8FF", stroke="none"))
    # head and bangs
    o.append(circ(0, -218, 50, skin))
    o.append(path("M -50 -222 Q -52 -272 0 -270 Q 52 -272 50 -222 Q 40 -246 12 -240 Q -4 -222 -30 -232 Q -44 -236 -50 -222 Z", HAIR))
    o.append(path("M 14 -266 Q 30 -250 34 -236", "none", stroke="#B06CFF", sw=5))
    # headphones
    o.append('<path d="M -56 -224 Q -58 -286 0 -286 Q 58 -286 56 -224" fill="none" stroke="%s" stroke-width="15" stroke-linecap="round"/>' % OUT)
    o.append('<path d="M -56 -224 Q -58 -286 0 -286 Q 58 -286 56 -224" fill="none" stroke="%s" stroke-width="6" stroke-linecap="round"/>' % PINK)
    o.append(rrect(-70, -240, 24, 42, 11, PINK))
    o.append(rrect(46, -240, 24, 42, 11, PINK))
    # face: bored
    o.append(eyes(0, -214, gap=19, rx=11, ry=11, look=(4, 3), pupil=6))
    o.append(half_lids(0, -214, 19, 11, 11, skin, drop=0.45))
    o.append(path("M -7 -190 L 9 -190", "none", sw=4))
    return "".join(o)


def baby(state="awake"):
    Y, skin = "#FFD166", "#F8D2B0"
    o = [shadow(50, 9)]
    o.append(limb("M -34 -62 Q -54 -52 -54 -38", 16, Y))
    o.append(circ(-54, -34, 9, skin, sw=4))
    o.append(limb("M 34 -62 Q 54 -52 54 -38", 16, Y))
    o.append(circ(54, -34, 9, skin, sw=4))
    o.append(ell(0, -42, 42, 40, Y))
    o.append(ell(-26, -9, 18, 11, Y))
    o.append(ell(26, -9, 18, 11, Y))
    o.append(circ(0, -112, 52, skin))
    o.append(path("M 0 -162 Q -16 -182 2 -190 Q 18 -192 14 -176 Q 10 -168 3 -174", "none", stroke="#8B5E3C", sw=5))
    if state == "awake":
        for sx in (-1, 1):
            o.append(circ(sx * 21, -114, 9.5, OUT, stroke="none"))
            o.append(circ(sx * 21 - 3, -118, 3.2, "white", stroke="none"))
    else:
        for sx in (-1, 1):
            o.append(path(f"M {sx * 21 - 10} -114 Q {sx * 21} -106 {sx * 21 + 10} -114", "none", sw=4))
    o.append(blush(0, -98, gap=36))
    if state == "cry":
        o.append(ell(0, -88, 14, 12, "#7A2E2E", sw=4))
        o.append(sweat(-38, -100, 0.9))
        o.append(sweat(38, -100, 0.9))
    else:
        o.append(circ(0, -90, 15, PINK, sw=4))
        o.append(circ(0, -90, 6.5, MILK, sw=3))
    return "".join(o)
