"""Browser smoke test. Serves app/ on a local port, clicks through the menus, plays a little of Night 1
with the keyboard, and saves screenshots. Fails on any console error.

Usage: python3 tools/browser-test.py [output folder for screenshots]
"""
import http.server, os, socketserver, sys, threading, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
PORT = 8765


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()

errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
    pg.goto(f"http://127.0.0.1:{PORT}/index.html")
    pg.wait_for_selector("#boot", state="detached", timeout=15000)
    pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/01-title.png")
    pg.click("text=PLAY")
    pg.wait_for_timeout(300)
    if pg.locator("text=OK").count():
        pg.screenshot(path=f"{OUT}/02-daily.png")
        pg.click("text=OK")
    pg.wait_for_timeout(200)
    pg.screenshot(path=f"{OUT}/03-hub.png")
    pg.click("text=START A RAID")
    pg.wait_for_timeout(200)
    pg.screenshot(path=f"{OUT}/04-map.png")
    pg.click("text=Cookie Run")
    pg.wait_for_timeout(200)
    pg.screenshot(path=f"{OUT}/05-brief.png")
    pg.click("text=SNEAK OUT")
    pg.wait_for_timeout(600)
    pg.screenshot(path=f"{OUT}/06-in-bed.png")
    pg.keyboard.down("d"); pg.wait_for_timeout(300); pg.keyboard.up("d")
    pg.keyboard.down("s"); pg.wait_for_timeout(900); pg.keyboard.up("s")
    pg.screenshot(path=f"{OUT}/07-out-of-bed.png")
    pg.keyboard.down("s"); pg.wait_for_timeout(700); pg.keyboard.up("s")
    pg.keyboard.down("d"); pg.keyboard.down(" "); pg.wait_for_timeout(2500); pg.keyboard.up(" "); pg.keyboard.up("d")
    pg.screenshot(path=f"{OUT}/08-hallway.png")
    pg.keyboard.down("m"); pg.wait_for_timeout(700)
    pg.screenshot(path=f"{OUT}/09-peek.png")
    pg.keyboard.up("m")
    state = pg.evaluate("({mode: window.snackRaid.mode, t: window.snackRaid.game.time, inBed: window.snackRaid.game.p.inBed, x: window.snackRaid.game.p.x, y: window.snackRaid.game.p.y})")
    print("state", state)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    pg.screenshot(path=f"{OUT}/10-pause.png")
    b.close()
srv.shutdown()
print("console errors:", len(errors))
for e in errors[:15]:
    print("  ", e[:300])
sys.exit(1 if errors else 0)
