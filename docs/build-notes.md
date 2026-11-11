# Build notes

How version 0.1.0 is put together, and how it differs from the design doc.

## The shape of the code

Everything is in `app/`. Plain ES modules, no build step.

| File | Job |
| --- | --- |
| `index.html`, `css/style.css` | The page, fonts and menu styles |
| `js/main.js` | Boot, the frame loop, and the glue between menus and a night |
| `js/data.js` | All the numbers: snacks, gadgets, ranks, pajamas, the house, the 10 nights |
| `js/world.js` | The house grid: collision, line of sight, sound through doors, pathfinding |
| `js/game.js` | One night of play: the raider, noise, Zs, every family member, gadgets, scoring |
| `js/render.js` | Drawing: floors, furniture, characters, rings, cones, the HUD |
| `js/input.js` | Touch stick, on-screen buttons, keyboard |
| `js/ui.js` | Menus and overlays as HTML |
| `js/save.js` | Progress in localStorage, ranks, prizes, the streak |
| `js/codes.js` | Promo and cheat codes (generated) |
| `js/audio.js` | Synthesized sound effects and the music loop |
| `js/gfx.js`, `js/sprites.js` | Sprite drawing, and every sprite as an SVG string (generated) |
| `sw.js`, `manifest.webmanifest` | Offline cache and install-to-home-screen |

## How a night works in code

- `new Game(level, options)` builds the world and everyone who is home.
- `game.update(dt, input)` runs one step. Input is just the stick vector and button edges, so tests can drive it.
- **Noise:** `game.noise(x, y, ringTiles)`. It shrinks the ring for cover sounds and closed doors, pops Zs on sleepers it reaches, and sends awake adults to look.
- **Sleepers** have `z` and `zmax`. At 0 they wake and follow a small plan: walk to the noise, look for 8 seconds, maybe check the bed, go back to bed 1 Z lighter.
- **Sight:** awake adults and Mika have a cone. Range is 5 tiles if the raider stands in light and 2 in the dark. An eye meter fills, then it is a bust.
- **Context actions:** `findContext()` picks what the big button does from what is nearby.
- **End of night:** `results()` adds up points, stars and style bonuses. `save.applyResult()` banks them.

## Tests

- `tools/sim-test.mjs`: checks every night's data, then plays scripted scenes: a bot wins Night 1, noise costs Dad Zs, the Excuse Card, the microwave, Mika's tax, a ride on Dusty, the whole boss.
- `tools/fuzz-test.mjs`: a random bot mashes every input on every night and gets teleported next to everything. Any exception fails.
- `tools/codes-test.mjs`: redeems all 26 codes.
- `tools/browser-test.py`: opens the real game in Chromium, clicks through the menus, plays a little, saves screenshots, and fails on any console error.

## Built versus designed

| Area | In v0.1.0 | Still to build |
| --- | --- | --- |
| Worlds | World 1: 8 nights, Sugar Dream, boss | Worlds 2 to 5 |
| Core stealth | Rings, Zs, cones, light, cover sounds, doors, hiding, the clock | Thunder, washing machine and other cover sounds |
| Cast | Dad, Mom, Mika, Baby Boo, Biscuit, Dusty | Buddy Biscuit, Sister Pact, everyone from later worlds |
| House | Creaky boards (remembered between tries), toy bricks, crumbs, puddles, laundry chute, sofa cushions, Secret Stash | Squeaky toys, bubble wrap, vents, banister slide, pet door, stool and high shelf |
| Snacks | 12 with traits | Watermelon, eat-now boosts |
| Shh Moments | Fridge, cookie jar, microwave. Petting and crib rocking are hold actions | High shelf, cereal, combo lock |
| Gadgets | Fuzzy Socks, Bunny Slippers, Oil Can, Pillow Muffler, Good Boy Biscuits, Squeaky Decoy, Night Goggles, Pillow Dummy. Levels 1 to 5 | The other 11 |
| Scoring | Stars, points, 9 style bonuses, Clean Getaway, Morning After | Statue, Burp Bandit |
| Economy | Coins, Golden Wrappers, Crumbs, 10 ranks, shop, upgrades, Excuse Cards, prize boxes | Sticker Album, shiny stickers |
| Daily play | Snack Streak, first raid of the day pays double | Daily Craving, Daily Dares, Weekend Feast, Night Twists, Festival Nights |
| Looks | 7 pajama sets, 2 raiders by pajama choice | 14 more sets, bedroom decorating, Make Your Raider |
| Codes | 16 promo, 10 cheat | |
| Sound | Synthesized effects, a simple music loop that speeds up | A composed, reactive score |
| Platform | Browser, offline, installable | Capacitor wrapper, tested on a real phone |

## Known rough edges

- Balance is untested with real players. The numbers follow the doc, but the feel needs tuning.
- The bedroom hub is a menu with a small room picture, not the full diegetic room from the doc.
- Characters slide and bob. They have no walk cycles yet.
- The Golden Donut can appear, but nothing else from the surprise list does yet.
- Sound has only been checked for errors, not listened to on a phone.
