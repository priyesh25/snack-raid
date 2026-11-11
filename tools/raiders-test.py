"""Browser test for raiders, save codes, the Back button and the update notice.

It runs the game twice: once as a plain web page, once pretending to be the Android app
(a fake window.Capacitor, and a fake GitHub answer that says version 9.9.9 is out).
Fails on any console error or wrong screen.

Usage: python3 tools/raiders-test.py [output folder for screenshots]
"""
import functools, http.server, json, os, socketserver, sys, threading
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
URL = f"http://127.0.0.1:{PORT}/index.html"
errors = []


def expect(cond, what):
    if not cond:
        raise SystemExit("FAIL " + what)
    print("ok  ", what)


def open_page(b, app=False):
    pg = b.new_page(viewport={"width": 1280, "height": 720})
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append("PAGEERROR " + str(e)))
    if app:
        pg.add_init_script("window.Capacitor = { isNativePlatform: () => true };")
        pg.route("https://api.github.com/**", lambda r: r.fulfill(status=200, content_type="application/json",
                 headers={"Access-Control-Allow-Origin": "*"}, body=json.dumps({"tag_name": "v9.9.9", "body": "More snacks"})))
    pg.goto(URL)
    pg.wait_for_selector("#boot", state="detached", timeout=15000)
    return pg


with sync_playwright() as p:
    b = p.chromium.launch()

    # ---- web: name, a second raider, save code round trip, Back
    pg = open_page(b)
    pg.click("text=PLAY")
    expect(pg.locator("#rname").count() == 1, "first PLAY asks for a name")
    pg.click("text=Let's go")
    expect("letters or numbers" in pg.inner_text("#namemsg"), "an empty name is refused")
    pg.fill("#rname", "Kai")
    pg.press("#rname", "Enter")
    pg.wait_for_timeout(200)
    if pg.locator("text=OK").count():
        pg.click("text=OK")
    expect("Kai's bedroom" in pg.inner_text("#ui"), "the bedroom has the raider's name")
    pg.evaluate("window.snackRaid.save.coins = 1234")
    pg.evaluate("window.snackRaidBack()")
    expect("Raider: Kai" in pg.inner_text("#ui"), "Back from the bedroom goes to the title")
    expect(pg.evaluate("window.snackRaidBack()") == "exit", "Back on the title says exit")

    pg.click("text=Raider: Kai")
    pg.click("text=Copy my save code")
    code = pg.input_value("#codeout")
    expect(code.startswith("SNACK1-"), "a save code is made")
    pg.screenshot(path=f"{OUT}/r1-raiders.png")
    pg.click("text=New raider")
    pg.fill("#rname", "Zara")
    pg.click("text=Let's go")
    pg.wait_for_timeout(200)
    if pg.locator("text=OK").count():
        pg.click("text=OK")
    expect(pg.evaluate("window.snackRaid.save.name") == "Zara" and pg.evaluate("window.snackRaid.save.coins") < 1234, "a new raider starts fresh")
    pg.evaluate("window.snackRaidBack()")
    pg.click("text=Raider: Zara")
    pg.fill("#codein", code[:30] + "\n" + code[30:])
    pg.click("text=Load as a new raider")
    pg.wait_for_timeout(200)
    expect(pg.evaluate("window.snackRaid.save.coins") == 1234, "a pasted save code brings the coins back")
    pg.click("text=OK")
    pg.evaluate("window.snackRaidBack()")
    pg.click("text=switch")
    expect(pg.locator(".item:not(.newraider)").count() == 3, "three raiders listed")
    pg.screenshot(path=f"{OUT}/r2-three-raiders.png")
    pg.click("text=Play as Zara")
    expect("Raider: Zara" in pg.inner_text("#ui"), "switching raiders works")
    pg.reload()
    pg.wait_for_selector("text=PLAY", timeout=15000)
    expect("Raider: Zara" in pg.inner_text("#ui"), "the chosen raider is remembered after a reload")
    expect("Tap to update" not in pg.inner_text("#ui"), "the web page shows no app update")

    # Back during a night pauses it
    pg.click("text=PLAY")
    pg.wait_for_timeout(200)
    if pg.locator("text=OK").count():
        pg.click("text=OK")
    pg.click("text=START A RAID")
    pg.click("text=Cookie Run")
    pg.click("text=SNEAK OUT")
    pg.wait_for_timeout(400)
    pg.evaluate("window.snackRaidBack()")
    expect(pg.evaluate("window.snackRaid.mode") == "paused", "Back pauses a night")
    pg.evaluate("window.snackRaidBack()")
    expect(pg.evaluate("window.snackRaid.mode") == "play", "Back again resumes")
    pg.close()

    # ---- app: the update notice
    pg = open_page(b, app=True)
    pg.wait_for_timeout(500)
    expect("Version 9.9.9 is ready" in pg.inner_text("#ui"), "the app shows the update button")
    expect(pg.locator("text=Full screen").count() == 0, "the app hides the Full screen button")
    pg.screenshot(path=f"{OUT}/r3-app-update.png")
    b.close()

expect(not errors, "no console errors " + "; ".join(errors))
print("all good")
