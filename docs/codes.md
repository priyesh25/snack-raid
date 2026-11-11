# Promo codes and cheat codes

The bedroom has a **Secret Codes** screen. Type a code there. Capitals and spaces do not matter.

- **Promo codes** work once per device. They give a benefit or open a feature.
- **Cheat codes** make the game easier. Most are switches you can turn on and off from the same screen.
- The game ships only scrambled (hashed) versions of these codes, so they cannot be read out of the app.
- This file is the readable list. If the repo is public, so is this file. Move it out before you hand out codes as prizes.

## Promo codes (16)

| Code | What it gives |
| --- | --- |
| SNACKRAID | 500 coins |
| COOKIEJAR | 1,000 coins |
| MIDNIGHT | 3 Excuse Cards |
| GOLDENDONUT | 5 Golden Wrappers |
| LUNCHBOX | A free Lunchbox (150 to 300 coins and an Excuse Card) |
| DOUBLECOINS | Double coins for the next 10 nights |
| LAVADINO | Lava Dino pajamas. Only this code unlocks them |
| GOLDENPJS | Golden Dino pajamas. Only this code unlocks them (or Rank 10) |
| STARLIGHT | Midnight Stars pajamas. Only this code unlocks them |
| TOYCHEST | The Night Goggles gadget |
| SQUEAK | The Squeaky Decoy gadget |
| BUNNYHOP | The Bunny Slippers gadget |
| LEVELUP | Every gadget you own goes up 1 level |
| BIGPOCKETS | The Hoodie Pouch right now: carry 3 snacks |
| GADGETBELT | The third gadget slot right now |
| BOSSKEY | Opens the Boss night without 15 stars |

If you already own a gadget, its code pays you the gadget's price in coins instead.

## Cheat codes (10)

| Code | What it does | Kind |
| --- | --- | --- |
| OPENSESAME | Unlocks every night | Permanent |
| PIGGYBANK | 5,000 coins | Works every time you type it |
| SLEEPYHEADS | Every sleeper gets 2 extra Zs | Switch |
| NINJAFEET | Every step is one ring size quieter | Switch |
| SLOWCLOCK | The night lasts twice as long | Switch |
| XRAYEYES | Creaky boards and the Secret Stash always show | Switch |
| DEEPPOCKETS | Carry 5 snacks | Switch |
| GHOSTMODE | Nobody can see you | Switch |
| EASYSNACKS | No melting, fizzing, wobbling, crumbs or crinkles | Switch |
| GADGETGALORE | Gadgets never run out | Switch |

Cheats do not block stars or coins. It is a single-player game, so that is the player's call.

## Adding or changing codes

1. Edit the lists at the top of `tools/make-codes.mjs`.
2. Run `node tools/make-codes.mjs`. It rewrites `app/js/codes.js` with new hashes.
3. A new kind of reward needs a few lines in the `PROMOS` table inside that script's template.
4. Run `node tools/codes-test.mjs` and update this file.
