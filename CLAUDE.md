# Snack Raid: project memory

Read this first when you pick the project up again.

## What this is

- A stealth game for kids aged 10 to 12 who like Roblox, Mech Arena and Nintendo games.
- Owner: Priyesh. It is a personal project.
- Target: Android. The build is a hybrid: an HTML5 game in `app/` that can be hosted as a website and wrapped as an Android app later.
- The plan had three steps: define the game, design the UI, build the app. Step 1 is done. A first playable build (v0.1.0) covers steps 2 and 3 for World 1.

## Where things are

- `docs/game-design.md`: the design. It is the source of truth for rules and numbers. A living copy is at https://claude.ai/artifact/4ui3nEqzU1zTjZr1bngEGx.
- `docs/build-notes.md`: architecture, and what is built versus planned. Read it before changing code.
- `docs/context/`: the brief, ideas considered, decisions and their reasons.
- `docs/codes.md`: promo and cheat codes in plain text. The repo is public, so these are public too.
- `docs/android.md`: the Android app. Install, updates, signing, releases.
- Live site: https://priyesh25.github.io/snack-raid/ (GitHub Pages from `main`). App download page: https://priyesh25.github.io/snack-raid/apk/ (the workflow keeps `snack-raid-X.Y.Z.apk` at the repo root). Repo: https://github.com/priyesh25/snack-raid
- `android/`: the Capacitor project. `.github/workflows/android.yml`: builds and releases the APK.
- `app/`: the game. `art/src/`: the scripts that draw every sprite. `tools/`: tests and generators.

## Decisions that are settled

- Name: Snack Raid.
- Burps and toots are in. Nothing meaner or grosser.
- Snack menu: a global mix, plus a few local favorites.
- Hero: two preset raiders, Kai and Zara.
- No ads, no purchases, no accounts, no chat, no personal data. Raider names stay on the device.
- Android ships as an APK on GitHub releases, not Google Play (see `docs/android.md` for why).
- Version 1 is World 1 with 10 nights.
- Landscape. Two thumbs: stick on the left, buttons on the right.

## Commands

```sh
python3 -m http.server 8000 --directory app   # play locally
node tools/sim-test.mjs                        # logic tests
node tools/fuzz-test.mjs                       # crash hunt on every night
node tools/codes-test.mjs                      # all 26 codes
python3 tools/browser-test.py out/             # browser run with screenshots (playwright)
python3 tools/raiders-test.py out/             # raiders, save codes, Back button, update button
python3 tools/android-icons.py                 # redraw Android icons and splash from the game icon
npx cap sync android                           # copy app/ into the Android project
python3 tools/shots.py docs/screenshots        # stage and capture gameplay screenshots
node tools/make-codes.mjs                      # rebuild app/js/codes.js after editing codes
sh art/src/build_all.sh                        # redraw all art and re-export app/js/sprites.js
```

## Rules for working on the code

- No build step and no dependencies in `app/`. Plain ES modules.
- `app/js/game.js` and `world.js` must not touch the DOM. They run headless in the tests.
- `app/js/sprites.js` and `app/js/codes.js` are generated. Edit their sources instead.
- Numbers come from the design doc. If you change a number in code, change the doc too.
- After any gameplay change, run the sim test and the fuzz test.
- On release, bump `VERSION` in `app/js/data.js` and `CACHE` in `app/sw.js`, and add `docs/release-notes/vX.Y.Z.md`. Pushing to `main` then builds and publishes the signed APK (see `docs/android.md`).
- On Windows, `python3` is the Store stub. Use `python`.
- The signing key lives outside the repo in `~/snack-raid-signing/` (in your user folder). Never commit it. Losing it breaks updates for every installed app.
- Kid-safe rules are not optional: nobody gets hurt, grown-ups are funny and never scary, nothing dangerous to copy (no stove, no knives, no leaving the house).

## Rules for writing (docs and in-game text)

- Plain words and short sentences. A 10 year old should read every line in the game with ease.
- No em dashes. No filler words.
- In chat, Priyesh likes short bulleted answers. He asked not to be asked questions on the build: make a sensible assumption and write it down.

## State of the build (v0.2.0)

- Playable: World 1 nights 1 to 8, the Sugar Dream coin rush (night 9), the Dad boss (night 10).
- Works: rings and Zs, vision and light, cover sounds, doors, hiding, 6 cast members, 12 snacks, 3 Shh Moments, 8 gadgets, scoring, ranks, shop, pajamas, streak, codes, save, sound, offline.
- v0.2.0 adds the Android app, named raiders (up to 4 per device), save codes, and update checks with a notification.
- All tests pass. It has been run in headless Chromium at desktop and phone sizes. It has not been played by a real kid yet, and it has not been tried on a real Android phone.

## Next steps, in order

1. Put it in front of a 10 to 12 year old. Watch where they get stuck. Tune Zs, ring sizes and the clock.
2. Try it on a real Android phone: touch feel, performance, sound.
3. Install the APK on a real phone. Check the update flow end to end with a 0.2.1 release.
4. Build the missing version 1 pieces: Daily Craving, Daily Dares, Night Twists, Sticker Album, eat-now boosts.
5. World 2, Grandma's House.
