// Fuzz test: a random bot mashes the stick, the button and the gadgets on every night, and gets
// teleported around the house so every context action fires. Any exception fails the test.
// Run: node tools/fuzz-test.mjs [runs per night]
import { Game } from '../app/js/game.js';
import { LEVELS, T, GADGETS } from '../app/js/data.js';

const RUNS = +process.argv[2] || 4;
let seed = 12345;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const ready = Object.keys(GADGETS).filter(id => GADGETS[id].ready);
let fails = 0, nights = 0, busts = 0, wins = 0, ctxSeen = new Set(), states = new Set();

for (const lv of LEVELS) {
  for (let run = 0; run < RUNS; run++) {
    const cheats = run % 4 === 3 ? { ghost: true, sleepy: true, gadgetgalore: true, deeppockets: true, xray: true, easysnacks: true, ninja: true, slowclock: false } : {};
    const loadout = [...ready].sort(() => rnd() - 0.5).slice(0, 3);
    let ended = null, cards = 2;
    const g = new Game(lv, { loadout, gadgets: { socks: 3, goggles: 2 }, carrySlots: 2 + (run % 3), cheats, knownCreaks: [],
      hooks: { onEnd: r => { ended = r; }, onBusted: () => { busts++; } } });
    const walk = [];
    for (let y = 0; y < g.world.H; y++) for (let x = 0; x < g.world.W; x++) if (g.world.walkable(x, y)) walk.push([x, y]);
    let mx = 0, my = 0, hold = false, tChange = 0, tTele = 3;
    try {
      for (let i = 0; i < 60 * 400 && !ended; i++) {
        const dt = 1 / 60;
        tChange -= dt; tTele -= dt;
        if (tChange <= 0) { tChange = 0.3 + rnd() * 1.2; const a = rnd() * Math.PI * 2, m = rnd() < 0.15 ? 0 : 0.2 + rnd() * 0.8; mx = Math.cos(a) * m; my = Math.sin(a) * m; hold = rnd() < 0.4; }
        if (tTele <= 0 && g.state === 'play' && !g.p.hidden && !g.p.riding && !g.shh) {
          tTele = 2 + rnd() * 5;
          // jump next to something interesting: a snack, the fridge, the bed, a door, an npc
          const spots = [[11, 11], [3, 2], [6, 11], [9, 11], [2, 11], [8, 11], [24, 6], [16, 6], [10, 3], [20, 7], [21, 15], [16, 11], [2, 6]];
          for (const n of g.npcs) spots.push([Math.floor(n.x / T) + 1, Math.floor(n.y / T)]);
          for (const it of g.items) spots.push([Math.floor(it.x / T), Math.floor(it.y / T) + 1]);
          let [x, y] = rnd() < 0.7 ? spots[Math.floor(rnd() * spots.length)] : walk[Math.floor(rnd() * walk.length)];
          [x, y] = g.world.nearestWalkable(x, y);
          if (g.p.inBed) g.leaveBed();
          g.p.x = (x + 0.5) * T; g.p.y = (y + 0.5) * T; g.p.tile = '';
        }
        const tap = rnd() < 0.05;
        const inp = { mx, my, actionDown: tap, actionHeld: tap || hold, actionUp: false, action2Down: rnd() < 0.01, gadget: rnd() < 0.01 ? Math.floor(rnd() * 3) : -1, peek: false };
        g.update(dt, inp);
        if (g.ctx) ctxSeen.add(g.ctx.key.replace(/\d+$/, '').replace(/^(door|hide).*/, '$1'));
        for (const n of g.npcs) states.add(n.kind + ':' + n.state);
        if (g.state === 'busted') { if (cards > 0 && g.bustInfo.canExcuse && rnd() < 0.7) { cards--; g.playExcuse(); } else g.giveUp(); }
      }
      nights++;
      if (ended && ended.win) wins++;
      if (!ended) { fails++; console.log(`FAIL night ${lv.n} run ${run}: never ended (state ${g.state}, t=${g.time.toFixed(0)})`); }
      else if (!Number.isFinite(ended.coins) || !Number.isFinite(ended.points)) { fails++; console.log(`FAIL night ${lv.n}: bad numbers`, ended.coins, ended.points); }
    } catch (e) { fails++; console.log(`FAIL night ${lv.n} run ${run}: ${e.stack.split('\n').slice(0, 4).join(' | ')}`); }
  }
}
console.log(`${nights} nights played, ${wins} wins, ${busts} busts`);
console.log('context actions seen:', [...ctxSeen].sort().join(', '));
console.log('npc states seen:', [...states].sort().join(', '));
console.log(fails ? `${fails} FAILED` : 'all good');
process.exit(fails ? 1 : 0);
