from base import *
from chars import *
from props import *

W, H = 1600, 900
FLOOR_Y = 570


def build():
    defs = (
        '<radialGradient id="vig" cx="50%" cy="48%" r="72%"><stop offset="55%" stop-color="#000" stop-opacity="0"/>'
        '<stop offset="100%" stop-color="#000" stop-opacity="0.5"/></radialGradient>'
        '<linearGradient id="spill" gradientUnits="userSpaceOnUse" x1="1380" y1="600" x2="760" y2="900">'
        '<stop offset="0" stop-color="#FFE08A" stop-opacity="0.62"/><stop offset="1" stop-color="#FFE08A" stop-opacity="0.05"/></linearGradient>'
        '<radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE08A" stop-opacity="0.38"/>'
        '<stop offset="100%" stop-color="#FFE08A" stop-opacity="0"/></radialGradient>'
        '<linearGradient id="moonbeam" gradientUnits="userSpaceOnUse" x1="830" y1="340" x2="700" y2="900">'
        '<stop offset="0" stop-color="#7FB4FF" stop-opacity="0.20"/><stop offset="1" stop-color="#7FB4FF" stop-opacity="0.02"/></linearGradient>'
    )
    c = []
    # wall and floor
    c.append(rect(0, 0, W, FLOOR_Y, "#2B2F77"))
    for sx in range(40, W, 110):   # faint wallpaper dots
        for sy in range(40, FLOOR_Y - 30, 110):
            c.append(circ(sx + (55 if (sy // 110) % 2 else 0), sy, 5, "#343A8C", stroke="none"))
    c.append(rect(0, FLOOR_Y, W, H - FLOOR_Y, "#1D2157"))
    vpx, vpy = 800, 250
    t = (H - FLOOR_Y) / (H - vpy)
    for x in range(-1600, 3201, 200):
        x2 = x + (vpx - x) * t
        c.append(line(x, H, x2, FLOOR_Y, stroke="#2A2F74", sw=4))
    for y in (604, 650, 712, 794):
        c.append(line(0, y, W, y, stroke="#2A2F74", sw=4))
    c.append(rect(0, FLOOR_Y - 14, W, 22, "#4A4FA8", stroke=OUT, sw=4))

    # window, moonbeam, clock
    c.append(window(700, 100, 250, 230))
    c.append(poly([(700, 344), (950, 344), (880, 900), (360, 900)], "url(#moonbeam)", stroke="none"))
    c.append(clock(1076, 196, 48, hour=12, minute=0))

    # counter with jar and microwave
    c.append(rrect(560, 432, 640, 132, 6, "#3B4096"))
    for dx in (600, 760, 920, 1080):
        c.append(rrect(dx, 462, 130, 88, 8, "#454BAA", sw=4))
        c.append(circ(dx + 112, 506, 6, GLOW, sw=3))
    c.append(rrect(548, 412, 664, 26, 8, "#6B73A6"))
    c.append(jar(640, 412, 1.0))
    c.append(microwave(1008, 412, 170, 96))

    # fridge: halo on the wall, then the fridge, then light on the floor
    c.append(ell(1330, 380, 420, 360, "url(#halo)", stroke="none"))
    c.append(fridge_open(1196, 600, 280, 480))
    c.append(poly([(1206, 602), (1560, 636), (1600, 900), (640, 900)], "url(#spill)", stroke="none"))

    # Dusty on patrol in the back
    c.append(f'<path d="M 60 628 Q 280 590 500 634" fill="none" stroke="{MOON}" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round" opacity="0.7"/>')
    c.append(g(dusty(), 574, 648, 0.8))

    # Biscuit asleep in his bed
    c.append(dog_bed(290, 812, 176, 50))
    c.append(g(biscuit_sleep(), 300, 806, 1.5))
    c.append(zzz(372, 716, n=3, size=40, dx=30, dy=-40))

    # toy bricks: the classic trap
    c.append(brick(700, 846, RED, 1.25))
    c.append(brick(770, 802, "#FFC93C", 1.05))
    c.append(brick(640, 790, MOON, 0.95))

    # the raider, tiptoeing, with noise rings
    kx, ky = 1010, 828
    c.append(ring(kx - 10, ky + 6, 150, MILK, sw=5, opacity=0.35, squash=0.26))
    c.append(ring(kx - 10, ky + 6, 104, MILK, sw=5, opacity=0.6, squash=0.26))
    c.append(g(kid_dino(look=(-5, 1)), kx, ky, 1.42))
    c.append(sweat(kx + 104, ky - 300, 1.5))

    # vignette
    c.append(rect(0, 0, W, H, "url(#vig)"))

    # title
    tx = 70
    c.append(text(tx + 10, 204, "SNACK", 176, fill="#0A0D26", weight=800, anchor="start", font="Baloo 2",
                  extra='stroke="#0A0D26" stroke-width="26" stroke-linejoin="round"'))
    c.append(text(tx + 10, 364, "RAID", 176, fill="#0A0D26", weight=800, anchor="start", font="Baloo 2",
                  extra='stroke="#0A0D26" stroke-width="26" stroke-linejoin="round"'))
    c.append(otext(tx, 194, "SNACK", 176, fill=MILK, weight=800, anchor="start", font="Baloo 2", ow=22))
    c.append(otext(tx, 354, "RAID", 176, fill=GLOW, weight=800, anchor="start", font="Baloo 2", ow=22))
    c.append(g(cookie(0, 0, 44), 520, 300, 1.0, rot=-12))
    c.append(circ(552, 268, 20, "#2B2F77", stroke=OUT, sw=5))   # bite
    c.append(otext(tx + 6, 424, "Shh. The fridge is waiting.", 40, fill=MOON, weight=600, anchor="start", ow=9))
    return svg_doc(c, W, H, defs=defs)


if __name__ == "__main__":
    import sys
    render(build(), sys.argv[1] if len(sys.argv) > 1 else "keyart.png", W, H, scale=1.5)
    print("ok")
