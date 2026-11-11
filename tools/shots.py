"""Stage a few moments in the game and screenshot them. Used for docs and for eyeballing the renderer.

Usage: python3 tools/shots.py <output folder>
"""
import http.server, os, socketserver, sys, threading, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app")
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
PORT = 8766


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", PORT), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
errors = []
T = 64
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=float(os.environ.get("DSF", "1")))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
    pg.goto(f"http://127.0.0.1:{PORT}/index.html")
    pg.wait_for_selector("#boot", state="detached", timeout=15000)

    def night(n, js="", wait=500):
        pg.evaluate(f"""() => {{
            const s = window.snackRaid; s.save.gadgets = {{socks:1, biscuits:1, dummy:1, muffler:1, goggles:1}}; s.save.loadout = ['socks','biscuits','dummy'];
            s.startNight({n}); const g = s.game; g.tips = []; g.tip = null; g.p.inBed = false; {js} }}""")
        pg.wait_for_timeout(wait)

    # Night 2: tiptoeing past the parents' door during a snore, a creaky board already found
    night(2, f"g.p.x = {14.4*T}; g.p.y = {6.6*T}; g.time = 6.1; g.creaks.get('14,6').known = true; g.creaks.get('17,6').known = true; g.p.carry = ['juice'];", 500)
    pg.keyboard.down("d"); pg.keyboard.down("Shift"); pg.wait_for_timeout(900)
    pg.screenshot(path=f"{OUT}/night2-snore.png"); pg.keyboard.up("d"); pg.keyboard.up("Shift")
    # Night 4: at the open fridge, Biscuit asleep nearby
    night(4, f"g.p.x = {11.6*T}; g.p.y = {11.6*T}; g.fridge.open = true; g.fridge.t = 1; g.p.carry = ['juice'];", 600)
    pg.screenshot(path=f"{OUT}/night4-fridge.png")
    # Night 5: the brick minefield
    night(5, f"g.p.x = {18.5*T}; g.p.y = {14.5*T}; g.p.carry = ['soda'];", 300)
    pg.keyboard.down("a"); pg.wait_for_timeout(700); pg.keyboard.up("a")
    pg.screenshot(path=f"{OUT}/night5-bricks.png")
    # Night 6: Mom on her water run, raider hiding spot nearby
    night(6, f"g.time = 81; g.p.x = {17.5*T}; g.p.y = {14.5*T}; g.p.carry = ['icecream']; g.p.melt = 30;", 5200)
    pg.screenshot(path=f"{OUT}/night6-mom.png")
    # Night 8: Mika in her doorway light, Dusty on patrol
    night(8, f"g.time = 45; g.p.x = {20.5*T}; g.p.y = {7.3*T};", 900)
    pg.screenshot(path=f"{OUT}/night8-mika.png")
    night(8, f"g.time = 45; g.p.x = {24.6*T}; g.p.y = {14.5*T};", 4000)
    pg.screenshot(path=f"{OUT}/night8-dusty.png")
    # a Shh Moment and the Busted screen
    night(4, f"g.p.x = {11.6*T}; g.p.y = {11.6*T}; g.startShh('release', {{what:'fridge'}});", 200)
    pg.keyboard.down("e"); pg.wait_for_timeout(1050)
    pg.screenshot(path=f"{OUT}/shh-fridge.png"); pg.keyboard.up("e")
    night(6, "g.bust(g.npc('mom'), 'seen');", 400)
    pg.screenshot(path=f"{OUT}/busted.png")
    b.close()
srv.shutdown()
print("console errors:", len(errors))
for e in errors[:10]:
    print("  ", e[:300])
