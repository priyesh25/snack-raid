# Decisions and the thinking behind them

## Design decisions

| Decision | Why |
| --- | --- |
| Stealth where **quiet is a skill** | The analog stick maps to noise. A gentle push is a tiptoe. That is easy to learn, hard to master, and it feels right under a thumb |
| **Rings and Zs** drawn on screen | A stealth game fails when the player cannot tell why they were caught. Every noise is a visible ring, every sleeper shows their Zs |
| **Busted is a joke** | For this age group a harsh fail screen ends the session. An excuse line and a one-tap retry keep them playing |
| **Nobody is a villain** | Parents hand the phone over more easily. It also gives each family member a personality: Dad snores, Mom checks beds, Mika taxes snacks |
| **Greed loop** | One snack is always possible. The stars reward going back for more, which is where the stories come from |
| **Gadgets with levels** | The Mech Arena itch: collect, upgrade, pick a loadout |
| **Pajamas and a bedroom** | The Roblox itch: look how you want. Looks only, never power |
| **Teach, test, twist** levels | The Nintendo pattern. Each night adds one new thing, and gifts the tool for it |
| **No ads, no purchases** | Kid-safe, simpler to build, and nothing to regret later |
| **Coins from play only, boxes never sold** | No gambling-style loops for children |

## Build decisions

| Decision | Why |
| --- | --- |
| **Hybrid, not native** | A 2D tile game runs well as HTML5. It can be hosted and tested in a browser, and wrapped for Android when ready |
| **Plain JavaScript and Canvas, no engine** | No dependencies, no build step, tiny download, works offline. Phaser was considered and not needed |
| **All art drawn by code** | One style everywhere. Sprites are SVG strings in one file, so there are no image requests and everything is sharp at any size |
| **All sound synthesized** | No audio files to make, license or load |
| **Game logic has no DOM** | It runs headless, so tests can play whole nights in milliseconds |
| **Menus in HTML, game on canvas** | Menus need text, lists and scrolling. The game needs speed |
| **Codes shipped as hashes** | Kids will look. The readable list stays in `docs/codes.md` |
| **Root page forwards to `app/`** | The repo can be hosted from its root with no settings, and `app/` stays a clean web root for the Android wrapper |

## Assumptions made for the first build

He asked for no more questions, so these were chosen for him. Each is easy to change.

- **One house on one map.** Upstairs is the top of the map, downstairs the bottom, joined by a stair strip. The design doc pictured two floors.
- **Bedrooms are closed boxes for sound.** A noise gets in or out only through the door. An open door lets it all through. A closed door cuts it by 3 tiles, as in the doc.
- **The parents' bed is near their door**, so running past an open door costs Zs.
- **Dad dozes on the sofa on Night 5**, to put a sleeper in the brick room.
- **Shh Moments use one button**: hold and let go for the fridge, tap in the green for the jar, tap on time for the microwave. The doc described drags. One button works on touch and keyboard alike.
- **The boss is scripted**: Dad walks down, plates the cake, turns his back to pour milk, and looks over his shoulder in a loop. Taking the cake wakes Mom.
- **Sugar Dream is a 60 second coin rush** through the house, not the Giant Kitchen from the doc.
- **7 pajama sets**, all color variants of the two raiders. The doc lists 21.
- **Prize boxes hold coins, Excuse Cards and wrappers.** Stickers wait for the Sticker Album.
- **Mika's room light spills into the hallway**, so her eyes reach it. Without that, the 2 tile dark vision rule made her harmless.
- **Cheats still earn stars and coins.** It is a single-player game.

## Open questions for later

- Who is the first tester, and what do they laugh at?
- Should a later version have a parents' corner with a play-time reminder?
- Which local snacks join the menu?
