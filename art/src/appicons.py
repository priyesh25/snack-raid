"""App icons and the title image for the web build."""
import sys
from base import *
from chars import kid_dino
import keyart

out = sys.argv[1]
for size in (512, 192):
    c = [rrect(0, 0, 512, 512, 0, "#2B2F77", stroke="none"),
         circ(256, 250, 210, "#3B4096", stroke="none"),
         circ(384, 118, 46, GLOW, stroke="none"), circ(404, 104, 42, "#3B4096", stroke="none"),
         g(kid_dino(), 250, 452, 1.42)]
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">{"".join(c)}</svg>')
    render(svg, f"{out}/icon-{size}.png", 512, 512, scale=size / 512)
render(keyart.build(), f"{out}/keyart.png", keyart.W, keyart.H, scale=1)
print("ok")
