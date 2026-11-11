from base import *
from chars import *
from props import *

W, H = 1600, 1000


def card(x, y, w, h, tint, fig, scale, name, tag, foot=292, extra=""):
    o = [rrect(x, y, w, h, 28, "#232863")]
    cx = x + w / 2
    o.append(circ(cx, y + 168, 122, tint, stroke="none", extra='opacity="0.22"'))
    o.append(g(fig, cx, y + foot, scale))
    o.append(extra)
    o.append(text(cx, y + h - 58, name, 40, fill=MILK, weight=700))
    o.append(text(cx, y + h - 22, tag, 25, fill=MOON, weight=500))
    return "".join(o)


def build():
    c = []
    for sx in range(40, W, 110):
        for sy in range(40, H, 110):
            c.append(circ(sx + (55 if (sy // 110) % 2 else 0), sy, 5, "#1B2150", stroke="none"))
    c.append(otext(60, 92, "Meet the household", 66, fill=MILK, weight=800, anchor="start", font="Baloo 2", ow=14))
    c.append(text(64, 128, "Nobody is a villain. Everyone is a puzzle.", 27, fill=MOON, weight=500, anchor="start"))
    cw, ch, gap, left = 350, 390, 26.6, 60
    xs = [left + i * (cw + gap) for i in range(4)]
    y1, y2 = 156, 572
    c.append(card(xs[0], y1, cw, ch, GREEN, kid_dino(), 0.95, "Kai", "Raider · Dino Onesie"))
    c.append(card(xs[1], y1, cw, ch, "#7B61FF", kid_star(), 0.95, "Zara", "Raider · Star Pajamas"))
    c.append(card(xs[2], y1, cw, ch, MOON, dad(), 0.78, "Dad", "Big Snore · 5 Zs",
                  extra=zzz(xs[2] + 272, y1 + 84, n=3, size=24, dx=16, dy=-20)))
    c.append(card(xs[3], y1, cw, ch, PINK, mom(), 0.80, "Mom", "Radar Mom · 3 Zs"))
    c.append(card(xs[0], y2, cw, ch, "#2EC4B6", mika(), 0.86, "Mika", "Snack Tax · awake till 2:00"))
    c.append(card(xs[1], y2, cw, ch, GLOW, baby(), 1.12, "Baby Boo", "Light sleeper · 2 Zs", foot=286))
    c.append(card(xs[2], y2, cw, ch, ORANGE, biscuit_sit(), 1.12, "Biscuit", "Super nose · 2 Zs", foot=288))
    c.append(card(xs[3], y2, cw, ch, "#C9D1E4", dusty(), 1.5, "Dusty", "Robo-vac · never sleeps", foot=236))
    return svg_doc(c, W, H, bg="#161B45")


if __name__ == "__main__":
    import sys
    render(build(), sys.argv[1] if len(sys.argv) > 1 else "cast.png", W, H, scale=1.5)
    print("ok")
