// Headless smoke test for the game logic. Run: node tools/sim-test.mjs
import { Game } from '../app/js/game.js';
import { LEVELS, T, SPOTS } from '../app/js/data.js';
import { World } from '../app/js/world.js';

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const idle = { mx: 0, my: 0, actionDown: false, actionHeld: false, actionUp: false, action2Down: false, gadget: -1, peek: false };

// 1. every level builds, and every snack, creak, brick and spot sits somewhere sensible
for (const lv of LEVELS) {
  const g = new Game(lv, { loadout: ['socks', 'biscuits', 'dummy'], carrySlots: 2 });
  const w = g.world;
  for (const it of g.items) {
    // a loose snack must be reachable: some walkable tile within 1.4 tiles
    let reach = false;
    for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++)
      if (w.walkable(x, y) && Math.hypot((x + 0.5) * T - it.x, (y + 0.5) * T - it.y) <= 1.4 * T) reach = true;
    ok(reach, `night ${lv.n}: ${it.id} is reachable`);
  }
  for (const [x, y] of lv.creaks || []) ok(w.walkable(x, y), `night ${lv.n}: creak ${x},${y} on floor`);
  for (const [x, y] of lv.bricks || []) ok(w.walkable(x, y), `night ${lv.n}: brick ${x},${y} on floor`);
  if (lv.stash) ok(!!w.obj(lv.stash), `night ${lv.n}: stash object ${lv.stash} exists`);
  const dog = g.npc('biscuit');
  if (dog) ok(w.walkable(Math.floor(dog.x / T), Math.floor(dog.y / T)), `night ${lv.n}: Biscuit on floor`);
  const du = g.npc('dusty');
  if (du) for (const [x, y] of du.route) ok(w.walkable(x, y), `night ${lv.n}: Dusty waypoint ${x},${y}`);
  // run 30 simulated seconds idle in bed without errors
  for (let i = 0; i < 30 * 60; i++) g.update(1 / 60, idle);
  ok(g.state === 'play', `night ${lv.n}: idles for 30 s`);
}

// 2. pathfinding: bed to kitchen exists
const w = new World(LEVELS[0]);
const path = w.path(SPOTS.kidExit[0], SPOTS.kidExit[1], 8, 11);
ok(path && path.length > 30, 'path from bed to kitchen exists (' + (path ? path.length : 0) + ' tiles)');
ok(!!w.path(13, 3, 3, 11) && !!w.path(13, 3, 27, 2) && !!w.path(15, 3, 11, 11), 'adult errand paths exist');

// 3. a scripted Night 1: walk the path with a bot, grab the cookie, come back, sleep
function bot(lv, opts, script) {
  const g = new Game(lv, opts);
  let res = null; g.hooks.onEnd = r => { res = r; };
  script(g);
  return { g, res };
}
function walkTo(g, tx, ty, mag = 0.6, maxS = 80) {
  const p = g.p;
  let path = g.world.path(Math.floor(p.x / T), Math.floor(p.y / T), tx, ty, { noDoors: true });
  if (!path) return false;
  for (let i = 0; i < maxS * 60 && path.length && g.state === 'play'; i++) {
    const [x, y] = path[0];
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < 6) { path.shift(); continue; }
    g.update(1 / 60, { ...idle, mx: (x - p.x) / d * mag, my: (y - p.y) / d * mag });
  }
  return path.length === 0;
}
function tap(g) { g.update(1 / 60, { ...idle, actionDown: true, actionHeld: true }); g.update(1 / 60, { ...idle, actionUp: true }); for (let i = 0; i < 5; i++) g.update(1 / 60, idle); }
{
  const { g, res } = bot(LEVELS[0], { carrySlots: 2 }, g => {
    g.update(1 / 60, { ...idle, mx: 1, my: 0 }); // get out of bed
    ok(!g.p.inBed, 'night 1: got out of bed');
    ok(walkTo(g, 6, 11), 'night 1: reached the cookie jar');
    g.update(1 / 60, idle);
    ok(g.ctx && g.ctx.key === 'jar', 'night 1: jar context (' + (g.ctx && g.ctx.label) + ')');
    tap(g); // start the jar mini-game
    ok(g.shh && g.shh.type === 'sweep', 'night 1: jar Shh Moment started');
    // wait for the marker to be in the middle, then tap
    for (let i = 0; i < 600 && g.shh; i++) { const hit = g.shh.t > 0.35 && Math.abs(g.shh.p - 0.5) < 0.03; g.update(1 / 60, { ...idle, actionDown: hit, actionHeld: hit }); }
    ok(g.p.carry.includes('cookie'), 'night 1: holding the cookie');
    for (let i = 0; i < 10; i++) g.update(1 / 60, idle);
    ok(walkTo(g, 3, 2), 'night 1: back at the bed');
    g.update(1 / 60, idle);
    ok(g.ctx && g.ctx.key === 'bed', 'night 1: bed context');
    tap(g);
    ok(g.p.inBed && g.delivered.includes('cookie'), 'night 1: cookie stashed');
    for (let i = 0; i < 20; i++) g.update(1 / 60, idle);
    tap(g); // Sleep
  });
  ok(res && res.win && res.stars[0], 'night 1: won with the Craving Star');
  ok(res && res.stars[2], 'night 1: Ghost Star (nobody woke) points=' + (res && res.points) + ' coins=' + (res && res.coins));
}

// 4. noise wakes Dad: run laps next to his open door on Night 2
{
  const g = new Game(LEVELS[1], { carrySlots: 2 });
  g.update(1 / 60, { ...idle, mx: 1 });
  walkTo(g, 16, 6, 1.0);
  const dad = g.npc('dad');
  const z0 = dad.zmax;
  for (let k = 0; k < 6 && dad.state === 'asleep'; k++) { walkTo(g, 16, 4, 1.0); walkTo(g, 16, 6, 1.0); }
  ok(dad.state !== 'asleep' || dad.z < z0, 'night 2: running by the open door costs Dad Zs (state ' + dad.state + ', z ' + dad.z + ')');
}

// 5. bust and Excuse Card
{
  const g = new Game(LEVELS[5], { carrySlots: 2 });
  g.update(1 / 60, { ...idle, mx: 1 });
  g.bust(g.npc('mom'), 'seen');
  ok(g.state === 'busted' && g.bustInfo.canExcuse, 'busted state with an excuse available');
  ok(g.playExcuse() && g.state === 'play' && g.p.inBed, 'Excuse Card puts you back in bed');
}

// 6. Night 7: pantry, microwave, stop at 0:01
{
  const g = new Game(LEVELS[6], { carrySlots: 2 });
  const put = (x, y) => { if (g.p.inBed) g.leaveBed(); g.p.x = (x + 0.5) * T; g.p.y = (y + 0.5) * T; g.p.tile = ''; g.update(1 / 60, idle); };
  put(2, 11); ok(g.ctx && g.ctx.key === 'pantry', 'night 7: pantry context'); tap(g);
  ok(g.p.carry.includes('popbag'), 'night 7: got the popcorn bag');
  put(9, 11); ok(g.ctx && g.ctx.key === 'micro', 'night 7: microwave context'); tap(g);
  ok(g.shh && g.shh.type === 'micro', 'night 7: microwave started');
  for (let i = 0; i < 60 * 12 && g.shh; i++) { const hit = g.shh.left != null && g.shh.left <= 0.9; g.update(1 / 60, { ...idle, actionDown: hit, actionHeld: hit }); }
  ok(g.p.carry.includes('popcorn') && g.stats.microPerfect, 'night 7: popcorn stopped at 0:01');
  ok(g.npc('baby').state === 'asleep', 'night 7: Baby Boo stayed asleep');
  // now let it beep on a fresh night and check the baby wakes
  const h = new Game(LEVELS[6], { carrySlots: 2 });
  h.leaveBed(); h.p.x = 9.5 * T; h.p.y = 11.5 * T; h.p.carry = ['popbag']; h.update(1 / 60, idle);
  h.update(1 / 60, { ...idle, actionDown: true, actionHeld: true }); h.update(1 / 60, idle);
  for (let i = 0; i < 60 * 14; i++) h.update(1 / 60, idle);
  ok(h.stats.woke.has('baby'), 'night 7: letting it beep wakes Baby Boo');
}
// 7. Night 8: Mika taxes, Dusty gives rides
{
  const g = new Game(LEVELS[7], { carrySlots: 2 });
  g.leaveBed(); g.p.x = 23.5 * T; g.p.y = 6.6 * T;
  for (let i = 0; i < 60 * 3; i++) g.update(1 / 60, idle);
  ok(g.npc('mika').owed > 0, 'night 8: Mika spots you in her doorway light and wants a snack');
  g.time = 41; for (let i = 0; i < 60 * 3; i++) g.update(1 / 60, idle);
  const du = g.npc('dusty');
  ok(du.state === 'run', 'night 8: Dusty starts at 1:00');
  g.p.x = du.x + 50; g.p.y = du.y; du.bonkCd = 5; g.update(1 / 60, idle);
  ok(g.ctx && g.ctx.key === 'ride', 'night 8: ride context'); tap(g);
  ok(g.p.riding === du, 'night 8: riding Dusty');
  for (let i = 0; i < 60 * 6; i++) g.update(1 / 60, idle);
  ok(g.stats.rideDist > 5 * T, 'night 8: the ride moves (' + (g.stats.rideDist / T).toFixed(1) + ' tiles)');
  tap(g); ok(!g.p.riding, 'night 8: hopped off');
}
// 8. Boss: Dad plates the cake, you swipe it, Mom catches Dad, you are in bed in time
{
  let res = null;
  const g = new Game(LEVELS[9], { carrySlots: 2, hooks: { onEnd: r => { res = r; } } });
  for (let i = 0; i < 60 * 200 && !g.plate; i++) g.update(1 / 60, idle);
  ok(g.plate && g.plate.has, 'boss: Dad plated the cake at ' + g.clock());
  g.leaveBed(); g.p.x = 8.5 * T; g.p.y = 11.5 * T; g.p.tile = '';
  // wait until his back is turned (he is pouring milk)
  const dad = g.npc('dad');
  for (let i = 0; i < 60 * 30 && !(dad.state === 'wait' && Math.floor(dad.x / T) === 4); i++) { g.p.hidden = { obj: g.world.obj('ktable'), px: g.p.x, py: g.p.y }; g.update(1 / 60, idle); }
  g.p.hidden = null; g.update(1 / 60, idle);
  ok(g.state === 'play' && g.ctx && g.ctx.key === 'plate', 'boss: cake is there for the taking (' + (g.ctx && g.ctx.label) + ')');
  tap(g);
  ok(g.p.carry.includes('cake'), 'boss: swiped the cake');
  g.p.x = 3.5 * T; g.p.y = 2.5 * T; g.p.tile = ''; g.update(1 / 60, idle); tap(g);
  ok(g.p.inBed && g.delivered.includes('cake'), 'boss: cake stashed, in bed');
  for (let i = 0; i < 60 * 90 && g.state === 'play' && !(g.stats.bossMom && g.npc('mom').state === 'asleep'); i++) g.update(1 / 60, idle);
  ok(g.state === 'play' && g.stats.bossMom, 'boss: Mom came, checked the bed, and went back to sleep');
  g.finish('sleep');
  ok(res && res.win, 'boss: won');
}
console.log(fails ? `\n${fails} FAILED` : '\nall good');
process.exit(fails ? 1 : 0);
