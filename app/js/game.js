// Snack Raid: one night of play. Pure simulation, no DOM, so it can be tested headless.
import { T, SNACKS, GADGETS, gadgetCharges, SPOTS, LIGHTS, COUNTER, EXCUSES } from './data.js';
import { World } from './world.js';

const SPEED = { tiptoe: 1.5 * T, walk: 3 * T, run: 5 * T };
const STRIDE = { tiptoe: 0.55 * T, walk: 0.7 * T, run: 0.9 * T };
// ring size in tiles by floor and pace (design doc, "How loud your feet are")
const RING = { c: { tiptoe: 0, walk: 1, run: 2 }, w: { tiptoe: 1, walk: 2, run: 4 }, t: { tiptoe: 1, walk: 3, run: 5 } };
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const tc = v => v * T;
const tileOf = e => [Math.floor(e.x / T), Math.floor(e.y / T)];
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const UP = -Math.PI / 2, DOWN = Math.PI / 2;

export class Game {
  constructor(level, opts = {}) {
    this.lv = level;
    this.o = opts;
    this.cheat = opts.cheats || {};
    this.hooks = opts.hooks || {};
    this.world = new World(level);
    this.dream = level.type === 'dream';
    this.hourLen = (level.type === 'boss' ? 60 : 40) * (this.cheat.slowclock ? 2 : 1);
    this.nightLen = this.dream ? 60 : 6 * this.hourLen;
    this.time = 0;
    this.state = 'play';
    this.slots = this.cheat.deeppockets ? 5 : (opts.carrySlots || 2);
    this.loadout = (opts.loadout || []).filter(id => GADGETS[id] && GADGETS[id].ready);
    this.charges = {};
    for (const id of this.loadout) this.charges[id] = gadgetCharges(id, (opts.gadgets || {})[id] || 1);
    this.p = { x: tc(SPOTS.kidBed[0]), y: tc(SPOTS.kidBed[1]), r: 15, dir: DOWN, mode: 'idle', inBed: true, hidden: null,
      riding: null, stun: 0, stride: 0, slide: null, carry: [], fizz: 0, wob: 0, melt: 0, tile: '', face: 1 };
    this.delivered = []; this.trips = 0;
    this.npcs = []; this.rings = []; this.crumbs = []; this.puddles = []; this.treats = []; this.decoys = [];
    this.coins = []; this.timers = []; this.toasts = []; this.floaters = [];
    this.items = level.snacks.filter(s => s.src === 'loose').map(s => ({ id: s.id, x: tc(s.at[0]), y: tc(s.at[1]), taken: false }));
    this.fridge = { open: false, t: 0, beep: 0, muted: false, byDad: false, snacks: level.snacks.filter(s => s.src === 'fridge').map(s => s.id) };
    this.jar = { snacks: level.snacks.filter(s => s.src === 'jar').map(s => s.id) };
    this.pantryBag = level.snacks.some(s => s.src === 'microwave');
    this.plate = null;
    this.creaks = new Map();
    const known = new Set(opts.knownCreaks || []);
    for (const [x, y] of level.creaks || []) this.creaks.set(x + ',' + y, { x, y, known: known.has(x + ',' + y), oiled: false });
    this.bricks = (level.bricks || []).map(([x, y, col]) => ({ x, y, col }));
    this.goggles = 0; this.muffArmed = false; this.dummy = false; this.excuseUsed = false;
    this.hold = null; this.holdLock = false; this.shh = null; this.ctx = null; this.ctx2 = null;
    this.tips = (level.tips || []).slice(); this.tip = null; this.tipT = 0.6;
    this.stats = { woke: new Set(), usedGadget: false, coinsFound: 0, wrapper: false, cushions: false, closeCalls: 0,
      snoreGood: 0, snoreBad: 0, rideDist: 0, slides: 0, slideCrash: false, microPerfect: false, underNose: false,
      oneTrip: false, newCreaks: [], halfPop: false, mikaPaid: 0, barks: 0 };
    this.snoreOn = false;
    this.covers = []; // extra cover sounds {x, y, reach, until}
    const h = level.home || {};
    if (h.dad) this.addAdult('dad', h.dad);
    if (h.mom) this.addAdult('mom', h.mom);
    if (h.baby) this.npcs.push({ id: 'baby', kind: 'baby', x: tc(SPOTS.baby[0]), y: tc(SPOTS.baby[1]), zmax: this.zs(2), z: this.zs(2),
      state: 'asleep', t: 0, cryTick: 0, quiet: 0, hitCd: 0, hears: true });
    if (h.mika) this.npcs.push({ id: 'mika', kind: 'mika', x: tc(SPOTS.mika[0] + 0.5), y: tc(SPOTS.mika[1] + 0.5), state: 'idle', dir: DOWN,
      speed: 2.6 * T, cone: 90, eye: 0, peak: 0, t: 22, owed: 0, cool: 0, plan: [], path: null, hears: false, home: SPOTS.mika });
    if (h.biscuit) {
      const [bx, by] = h.biscuit.at;
      this.npcs.push({ id: 'biscuit', kind: 'dog', x: tc(bx), y: tc(by), bx: tc(bx), by: tc(by), zmax: this.zs(2), z: this.zs(2), state: 'asleep',
        dir: 0, speed: 3.4 * T, t: 0, whine: 0, quiet: 0, hitCd: 0, ignore: 0, lost: 0, repath: 0, stride: 0, path: null, hears: true });
    }
    if (h.dusty) this.npcs.push({ id: 'dusty', kind: 'dusty', x: tc(24.5), y: tc(17.5), state: 'dock', route: h.dusty.route, ri: -1, path: null,
      speed: 2 * T, bonkCd: 0, pause: 0, angry: 0, from: h.dusty.from, dir: 0 });
    if (this.dream) this.spawnDreamCoins();
    else if (level.n > 1 && Math.random() < 0.05) {
      const [x, y] = pick([[25.5, 13.5], [17.5, 14.5], [2.5, 13.5], [9.5, 15.5], [15.5, 6.5]]);
      this.items.push({ id: 'donut', x: tc(x), y: tc(y), taken: false });
    }
  }

  // ------------------------------------------------------------ small helpers
  zs(n) { return n + (this.cheat.sleepy ? 2 : 0); }
  hour() { return this.time / this.hourLen; }
  clock() {
    if (this.dream) return Math.max(0, Math.ceil(this.nightLen - this.time)) + 's';
    const mins = Math.floor(this.hour() * 60);
    const h = Math.floor(mins / 60), m = mins % 60;
    return (h === 0 ? 12 : h) + ':' + String(m).padStart(2, '0');
  }
  npc(id) { return this.npcs.find(n => n.id === id); }
  sfx(name, x, y) {
    if (!this.hooks.sfx) return;
    let vol = 1;
    if (x != null) vol = Math.max(0, 1 - dist(x, y, this.p.x, this.p.y) / (14 * T));
    if (vol > 0.02) this.hooks.sfx(name, vol);
  }
  toast(text, ttl = 2.6) { this.toasts.push({ text, t: ttl }); if (this.toasts.length > 3) this.toasts.shift(); }
  float(text, x, y, col = '#FFF6E5') { this.floaters.push({ text, x, y, t: 1.2, col }); }
  after(sec, fn) { this.timers.push({ t: sec, fn }); }
  used() { return this.p.carry.reduce((s, id) => s + SNACKS[id].slots, 0); }
  room(id) { return this.used() + SNACKS[id].slots <= this.slots; }
  has(gid) { return this.loadout.includes(gid); }
  rectDist(o) {
    const p = this.p, x0 = o.x * T, y0 = o.y * T, x1 = (o.x + o.w) * T, y1 = (o.y + o.h) * T;
    const cx = Math.max(x0, Math.min(p.x, x1)), cy = Math.max(y0, Math.min(p.y, y1));
    return dist(p.x, p.y, cx, cy);
  }
  sleepers() { return this.npcs.filter(n => n.z != null && n.state === 'asleep'); }

  addAdult(id, cfg) {
    const s = cfg.sofa ? SPOTS.sofa : SPOTS[id], zmax = this.zs(id === 'dad' ? 5 : 3);
    this.npcs.push({ id, kind: 'adult', x: tc(s.bed[0]), y: tc(s.bed[1]), bx: tc(s.bed[0]), by: tc(s.bed[1]), exit: s.exit, zmax, z: zmax,
      state: 'asleep', dir: DOWN, speed: (id === 'dad' ? 1.8 : 3.0) * T, cone: id === 'dad' ? 60 : 90, eye: 0, peak: 0, hitCd: 0, quiet: 0,
      hearCd: 0, path: null, plan: [], t: 0, cfg, hears: true, wokeByNoise: false, checks: 0, sofa: !!cfg.sofa });
  }

  spawnDreamCoins() {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const w = this.world;
    while (this.coins.length < 48) {
      const x = Math.floor(rnd() * w.W), y = Math.floor(rnd() * w.H);
      if (!w.walkable(x, y) || w.doorAt(x, y)) continue;
      this.coins.push({ x: tc(x + 0.5), y: tc(y + 0.5), v: 5 });
    }
    this.items.push({ id: 'donut', x: tc(6.5), y: tc(12.5), taken: false });
  }

  // ------------------------------------------------------------ light and cover
  isLit(x, y) {
    if (this.dream) return false;
    if (this.p.carry.includes('donut')) return true;
    const tx = x / T, ty = y / T;
    for (const l of LIGHTS) {
      if (l.kind === 'circle' && Math.hypot(tx - l.x, ty - l.y) <= l.r) return true;
      if (l.kind === 'rect' && tx >= l.x && tx <= l.x + l.w && ty >= l.y && ty <= l.y + l.h) return true;
    }
    const mk = this.npc('mika');
    if (mk && mk.state !== 'asleep' && this.world.doors.find(d => d.id === 'mika').open && tx >= 21 && tx <= 26 && ty >= 1 && ty <= 8) return true;
    if (this.fridge.open && this.fridge.byDad && tx >= 1 && tx <= 13 && ty >= 10 && ty <= 18) return true;
    if (this.fridge.open && ty >= 11 && ty <= 15) {
      const left = 11 - (ty - 11) * 0.7;
      if (tx >= left && tx <= 13) return true;
    }
    return false;
  }
  coverAt(x, y) {
    const dad = this.npc('dad');
    if (dad && this.snoreOn && dist(x, y, dad.x, dad.y) <= 6 * T) return true;
    return this.covers.some(c => this.time < c.until && dist(x, y, c.x, c.y) <= c.reach * T);
  }

  // ------------------------------------------------------------ noise
  // r is the ring size in tiles. o.by is the npc that made it (null means the player).
  noise(x, y, r, o = {}) {
    const mine = !o.by;
    if (o.muffle && this.muffArmed) {
      this.muffArmed = false; this.toast('Muffled!'); this.sfx('muffle');
      return false;
    }
    let rr = r;
    const covered = mine && this.coverAt(x, y);
    if (covered) rr -= 3;
    if (mine && this.cheat.ninja && o.kind === 'step') rr -= 1;
    let touched = false;
    if (rr > 0) {
      for (const n of this.npcs) {
        if (!n.hears || n === o.by) continue;
        const eff = rr - 3 * this.world.soundDoors(x, y, n.x, n.y);
        if (dist(x, y, n.x, n.y) / T > eff) continue;
        if (n.state === 'asleep') {
          if (n.hitCd > 0) continue;
          n.z -= r >= 5 ? 2 : 1; n.hitCd = 0.5; n.quiet = 0; n.noiseAt = { x, y }; touched = true;
          if (n.z <= 0) this.wake(n); else this.sfx('pop', n.x, n.y);
        } else if (n.kind === 'adult' && n.hearCd <= 0 && rr >= 2 && n.state !== 'rising' && !n.busy) {
          n.hearCd = 2; touched = true;
          this.investigate(n, x, y, 6);
        } else if (n.kind === 'dog' && (n.state === 'sniff' || n.state === 'alert') && rr >= 2) {
          n.noiseAt = { x, y }; n.path = this.world.path(...tileOf(n), Math.floor(x / T), Math.floor(y / T)); n.state = 'alert';
        }
      }
    }
    const col = r >= 5 ? '#FF5A4F' : touched ? '#FFE08A' : '#FFF6E5';
    this.rings.push({ x, y, r: Math.max(rr, 0.35) * T, t: 0, col, covered: covered && rr <= 0 });
    if (o.sfx) this.sfx(o.sfx, x, y);
    if (mine && r >= 5 && this.hooks.buzz) this.hooks.buzz(60);
    return true;
  }

  wake(n) {
    n.z = 0; n.eye = 0;
    this.stats.woke.add(n.id);
    if (n.kind === 'baby') { n.state = 'cry'; n.t = 10; n.cryTick = 0.3; this.toast('Baby Boo is awake!'); return; }
    n.state = 'rising'; n.t = 0.8;
    if (n.kind === 'adult') { n.wokeByNoise = true; this.sfx('huh', n.x, n.y); this.toast((n.id === 'mom' ? 'Mom' : 'Dad') + ' woke up!'); }
    else this.sfx('whine', n.x, n.y);
  }

  // send an awake adult to look at a spot, keeping the rest of the plan (bed check, going back to bed)
  investigate(n, x, y, secs) {
    const [tx, ty] = this.world.nearestWalkable(Math.floor(x / T), Math.floor(y / T));
    const rest = n.plan.filter(s => s.then === 'check' || s.then === 'sleep');
    if (!rest.some(s => s.then === 'sleep')) rest.push({ to: n.exit, then: 'sleep' });
    n.plan = [{ to: [tx, ty], then: 'look', t: secs }, ...rest];
    this.startStep(n);
  }

  // ------------------------------------------------------------ walkers (adults and Mika) follow a plan
  follow(n, dt) {
    if (!n.path || !n.path.length) return true;
    let step = n.speed * dt;
    while (step > 0 && n.path.length) {
      const [tx, ty] = n.path[0];
      const dr = this.world.doorAt(Math.floor(tx / T), Math.floor(ty / T));
      if (dr && !dr.open) { dr.open = true; dr.byNpc = true; this.sfx('door', n.x, n.y); }
      const d = dist(n.x, n.y, tx, ty);
      if (d <= step) { n.x = tx; n.y = ty; n.path.shift(); step -= d; }
      else { n.dir = Math.atan2(ty - n.y, tx - n.x); n.x += (tx - n.x) / d * step; n.y += (ty - n.y) / d * step; step = 0; }
    }
    return !n.path.length;
  }
  startStep(n) {
    const st = n.plan[0];
    if (!st) { n.state = n.kind === 'mika' ? 'idle' : 'asleep'; return; }
    if (st.to) {
      n.path = this.world.path(...tileOf(n), st.to[0], st.to[1]) || [];
      n.state = 'goto';
      if (!n.path.length) this.arrive(n);
    } else this.arrive(n);
  }
  arrive(n) {
    const st = n.plan[0];
    if (!st) return;
    if (st.face != null) n.dir = st.face;
    if (st.fx) st.fx();
    if (st.then === 'look') { n.state = 'look'; n.t = n.t0 = st.t; n.baseDir = n.dir; }
    else if (st.then === 'wait') { n.state = 'wait'; n.t = st.t; }
    else if (st.then === 'check') {
      n.state = 'wait'; n.t = st.t;
      n.dir = Math.atan2(tc(SPOTS.kidBed[1]) - n.y, tc(SPOTS.kidBed[0]) - n.x);
      if (!this.p.inBed && !this.dummy && !this.cheat.ghost) this.bust(n, 'bed');
      else if (!this.p.inBed) this.toast('Mom checked your bed. The dummy fooled her.');
    } else if (st.then === 'sleep') {
      if (n.kind === 'mika') { n.state = 'asleep'; n.plan = []; const d = this.world.doors.find(q => q.id === 'mika'); if (d) { d.open = false; d.byNpc = true; } return; }
      n.state = 'asleep'; n.x = n.bx; n.y = n.by; n.eye = 0; n.dir = DOWN; n.plan = []; n.busy = false;
      if (n.wokeByNoise) { n.zmax = Math.max(1, n.zmax - 1); n.wokeByNoise = false; }
      n.z = n.zmax; n.quiet = 0;
    } else if (st.then === 'idle') { n.state = 'idle'; n.plan = []; n.dir = DOWN; n.t = 26; }
  }
  endStep(n) {
    const st = n.plan.shift();
    if (st && st.done) st.done();
    this.startStep(n);
  }
  updWalker(n, dt) {
    n.hitCd -= dt; n.hearCd -= dt;
    if (n.state === 'rising') {
      n.t -= dt;
      if (n.t <= 0) {
        const at = n.noiseAt || { x: n.x, y: n.y };
        const [tx, ty] = this.world.nearestWalkable(Math.floor(at.x / T), Math.floor(at.y / T));
        n.x = tc(n.exit[0] + 0.5); n.y = tc(n.exit[1] + 0.5);
        n.plan = [{ to: [tx, ty], then: 'look', t: 8 }];
        if (n.id === 'mom' && n.cfg.bedCheck && (n.checks++ === 0 || Math.random() < 0.5)) n.plan.push({ to: SPOTS.bedCheck, then: 'check', t: 1.5 });
        n.plan.push({ to: n.exit, then: 'sleep' });
        this.startStep(n);
      }
    } else if (n.state === 'goto') { if (this.follow(n, dt)) this.arrive(n); }
    else if (n.state === 'look') {
      n.t -= dt; n.dir = n.baseDir + Math.sin((n.t0 - n.t) * 1.7) * 1.15;
      if (n.t <= 0) this.endStep(n);
    } else if (n.state === 'wait') { n.t -= dt; if (n.t <= 0) this.endStep(n); }
  }
  updAdult(n, dt) {
    if (n.state === 'asleep') {
      n.hitCd -= dt; n.quiet += dt;
      if (n.z < n.zmax && n.quiet >= 8) { n.z++; n.quiet = 0; }
      if (n.cfg.errand != null && !n.didErrand && this.hour() >= n.cfg.errand) { n.didErrand = true; this.startErrand(n); }
      if (n.cfg.boss && !n.bossOn && this.time >= 14) { n.bossOn = true; this.startBoss(n); }
      return;
    }
    this.updWalker(n, dt);
    if (n.state !== 'asleep' && n.state !== 'rising') this.see(n, dt);
  }
  startErrand(n) {
    this.toast('2:00. Mom is getting a glass of water.');
    n.x = tc(n.exit[0] + 0.5); n.y = tc(n.exit[1] + 0.5);
    n.plan = [
      { to: SPOTS.sinkStand, then: 'wait', t: 4, face: UP, fx: () => this.sfx('water', n.x, n.y) },
      { to: SPOTS.bathStand, then: 'wait', t: 3, face: UP, done: () => { this.covers.push({ x: n.x, y: n.y, reach: 5, until: this.time + 4 }); this.sfx('flush', n.x, n.y); } },
      { to: n.exit, then: 'sleep' },
    ];
    this.startStep(n);
  }
  // Boss night: Dad sneaks down for the cake, plates it, then turns his back to pour milk.
  startBoss(dad) {
    this.toast('Dad is up. He wants that cake too!', 4);
    dad.x = tc(dad.exit[0] + 0.5); dad.y = tc(dad.exit[1] + 0.5); dad.busy = true; dad.speed = 1.9 * T;
    const pour = { to: [4, 11], then: 'wait', t: 5.5, face: UP, fx: () => this.sfx('water', dad.x, dad.y) };
    const peek = { to: null, then: 'look', t: 2.6, face: 0.4 };
    dad.plan = [
      { to: [20, 7], then: 'look', t: 2.5 }, { to: [25, 11], then: 'look', t: 2.5 }, { to: [17, 13], then: 'look', t: 2 },
      { to: SPOTS.fridgeStand, then: 'wait', t: 2.5, face: UP, fx: () => { this.fridge.open = true; this.fridge.byDad = true; this.fridge.t = -999; this.sfx('fridge', dad.x, dad.y); } },
      { to: SPOTS.counterStand, then: 'wait', t: 1.6, face: UP, fx: () => { this.plate = { x: tc(8.5), y: tc(10.55), has: true }; this.toast('Dad put the last slice on a plate.'); } },
      pour, peek, { ...pour }, { ...peek }, { ...pour }, { ...peek }, { ...pour }, { ...peek },
      { to: SPOTS.counterStand, then: 'wait', t: 2, face: UP, fx: () => { if (this.plate && this.plate.has) { this.plate.has = false; this.toast('Too slow. Dad ate the cake!', 4); } } },
      { to: SPOTS.fridgeStand, then: 'wait', t: 1, face: UP, fx: () => { this.fridge.open = false; } },
      { to: dad.exit, then: 'sleep' },
    ];
    this.startStep(dad);
  }
  bossCakeTaken() {
    const mom = this.npc('mom'), dad = this.npc('dad');
    if (!mom || mom.bossOn) return;
    mom.bossOn = true;
    this.after(4, () => {
      if (mom.state !== 'asleep') return;
      this.toast('Uh oh. Mom is awake. Get back to bed!', 4);
      this.stats.bossMom = true;
      mom.x = tc(mom.exit[0] + 0.5); mom.y = tc(mom.exit[1] + 0.5); mom.busy = true;
      mom.plan = [
        { to: [10, 12], then: 'look', t: 3 },
        { to: [9, 11], then: 'wait', t: 7, face: UP, fx: () => {
          this.toast('Mom caught Dad with an empty plate.', 4);
          if (dad && dad.state !== 'asleep') { dad.plan = [{ to: null, then: 'wait', t: 7, fx: () => { this.fridge.open = false; } }, { to: dad.exit, then: 'sleep' }]; this.startStep(dad); }
        } },
        { to: SPOTS.bedCheck, then: 'check', t: 1.5 },
        { to: mom.exit, then: 'sleep' },
      ];
      this.startStep(mom);
    });
  }

  // ------------------------------------------------------------ sight
  see(n, dt) {
    const p = this.p;
    if (this.cheat.ghost || this.dream || p.inBed) { n.eye = Math.max(0, n.eye - dt * 1.5); return; }
    const d = dist(n.x, n.y, p.x, p.y), lit = this.isLit(p.x, p.y);
    const range = (lit ? 5 : 2) * T + 10;
    let seen = false;
    const hid = p.hidden && !(p.hidden.watchers && p.hidden.watchers.has(n.id));
    if (!hid && d <= range) {
      const da = Math.abs(angDiff(Math.atan2(p.y - n.y, p.x - n.x), n.dir));
      if (da <= (n.cone / 2) * Math.PI / 180 && this.world.los(n.x, n.y, p.x, p.y)) seen = true;
    }
    if (!hid && d < 0.7 * T) seen = true; // bumped right into them
    if (seen) {
      n.eye += dt * (lit ? 2 : 1);
      n.peak = Math.max(n.peak, n.eye);
      if (n.eye >= 1) { n.eye = 0; n.peak = 0; this.spotted(n); }
    } else if (n.eye > 0) {
      n.eye = Math.max(0, n.eye - dt * 0.8);
      if (n.eye === 0 && n.peak > 0.3) { this.stats.closeCalls++; this.float('Close call!', p.x, p.y - 70, '#FFE08A'); }
      if (n.eye === 0) n.peak = 0;
    }
  }
  spotted(n) {
    if (n.kind === 'adult') return this.bust(n, 'seen');
    if (n.kind === 'mika') {
      const p = this.p;
      if (p.carry.length) {
        const best = p.carry.slice().sort((a, b) => SNACKS[b].pts - SNACKS[a].pts)[0];
        p.carry.splice(p.carry.indexOf(best), 1);
        this.toast('Snack Tax! Mika took your ' + SNACKS[best].name + '.', 3.5);
        n.cool = 12; n.owed = 0; this.sfx('tax');
      } else if (n.owed <= 0) {
        n.owed = 60; n.cool = 5;
        this.toast('Mika: "Bring me a snack in 60 seconds, or I call Mom."', 4.5); this.sfx('tax');
      } else n.cool = 3;
    }
  }

  // ------------------------------------------------------------ Mika, Baby Boo, Biscuit, Dusty
  updMika(n, dt) {
    if (n.state === 'asleep') return;
    n.cool -= dt;
    if (n.owed > 0) {
      n.owed -= dt;
      if (n.owed <= 0) {
        this.toast('Mika called Mom!', 3.5);
        const mom = this.npc('mom');
        if (mom && mom.state === 'asleep') { mom.noiseAt = { x: n.x, y: n.y }; this.wake(mom); }
      }
    }
    if (this.hour() >= 2 && !n.bedtime) { n.bedtime = true; n.plan = [{ to: n.home, then: 'sleep' }]; this.startStep(n); this.toast('2:00. Mika went to sleep.'); }
    if (n.state === 'idle') {
      n.t -= dt; n.dir = DOWN + Math.sin(this.time * 0.5) * 0.25;
      if (n.t <= 0 && !n.bedtime) {
        n.plan = [{ to: SPOTS.bathStand, then: 'wait', t: 4, face: UP }, { to: n.home, then: 'idle' }];
        this.startStep(n);
      }
    } else this.updWalker(n, dt);
    if (n.cool <= 0 && n.state !== 'asleep') this.see(n, dt); else n.eye = 0;
  }
  updBaby(n, dt) {
    n.hitCd -= dt;
    if (n.state === 'asleep') { n.quiet += dt; if (n.z < n.zmax && n.quiet >= 8) { n.z++; n.quiet = 0; } return; }
    n.t -= dt; n.cryTick -= dt;
    if (n.cryTick <= 0) { n.cryTick = 1; this.noise(n.x, n.y, 6, { by: n, sfx: 'cry' }); }
    if (n.t <= 0) { n.state = 'asleep'; n.z = 1; n.quiet = 0; }
  }
  dogHome(n) { n.path = this.world.path(...tileOf(n), Math.floor(n.bx / T), Math.floor(n.by / T), { noDoors: true }) || []; n.state = 'home'; n.smelled = false; }
  dogTreat(n) {
    const tr = this.treats.find(t => dist(t.x, t.y, n.x, n.y) < 6 * T);
    if (!tr) return false;
    if (dist(tr.x, tr.y, n.x, n.y) < 0.5 * T) {
      this.treats.splice(this.treats.indexOf(tr), 1); n.state = 'eat'; n.t = 20; this.sfx('crunch', n.x, n.y); this.toast('Biscuit is busy eating. Good boy.');
      return true;
    }
    if (n.state !== 'totreat') { n.state = 'totreat'; n.path = this.world.path(...tileOf(n), Math.floor(tr.x / T), Math.floor(tr.y / T)) || []; n.path.push([tr.x, tr.y]); }
    this.follow(n, dt_());
    return true;
  }
  updDog(n, dt) {
    const p = this.p; n.hitCd -= dt; n.ignore -= dt; n.repath -= dt;
    lastDt = dt;
    const dP = dist(n.x, n.y, p.x, p.y);
    const canSee = !p.inBed && !p.hidden && !this.dream && dP < 3.2 * T && this.world.los(n.x, n.y, p.x, p.y);
    if (n.state === 'asleep') {
      n.quiet += dt; if (n.z < n.zmax && n.quiet >= 8) { n.z++; n.quiet = 0; }
      if (!this.cheat.easysnacks && p.carry.includes('pizza') && dP < 4 * T && !p.inBed) { n.smelled = true; n.noiseAt = { x: p.x, y: p.y }; this.wake(n); this.toast('Biscuit smells pizza!'); }
      return;
    }
    if (n.state === 'eat') { n.t -= dt; if (n.t <= 0) this.dogHome(n); return; }
    if (n.state === 'home') {
      if (this.follow(n, dt)) { n.state = 'asleep'; n.z = n.zmax; n.quiet = 0; n.x = n.bx; n.y = n.by; }
      return;
    }
    if (n.state === 'follow') {
      n.t -= dt;
      if (dP > 1.5 * T) this.dogChase(n, dt, p.x, p.y);
      if (n.t <= 0 || p.inBed) this.dogHome(n);
      return;
    }
    if (this.dogTreat(n)) return;
    if (n.state === 'rising') {
      n.t -= dt;
      if (n.t <= 0) {
        if (n.smelled || canSee) this.startBeg(n);
        else { const at = n.noiseAt || { x: n.x, y: n.y }; n.path = this.world.path(...tileOf(n), Math.floor(at.x / T), Math.floor(at.y / T)) || []; n.state = 'alert'; }
      }
      return;
    }
    if (n.state === 'beg') {
      if (dP > 1.2 * T) this.dogChase(n, dt, p.x, p.y);
      n.whine -= dt;
      if (n.whine <= 0) { this.noise(n.x, n.y, 8, { by: n, sfx: 'bark' }); n.whine = 2.6; this.stats.barks++; this.float('WOOF!', n.x, n.y - 50, '#FF5A4F'); }
      if (canSee) n.lost = 0; else { n.lost += dt; if (n.lost > 3.5 || p.inBed) this.dogHome(n); }
      return;
    }
    // alert, sniff, crumbs
    if (canSee && n.ignore <= 0) return this.startBeg(n);
    const cr = this.crumbs.find(c => dist(c.x, c.y, n.x, n.y) < 6 * T);
    if (cr) {
      if (dist(cr.x, cr.y, n.x, n.y) < 0.4 * T) { this.crumbs.splice(this.crumbs.indexOf(cr), 1); this.sfx('crunch', n.x, n.y); }
      else this.dogChase(n, dt, cr.x, cr.y);
      n.state = 'sniff'; n.t = 3;
      return;
    }
    if (n.state === 'alert') { if (this.follow(n, dt)) { n.state = 'sniff'; n.t = 4; } }
    else if (n.state === 'sniff') { n.t -= dt; if (n.t <= 0) this.dogHome(n); }
    else this.dogHome(n);
  }
  startBeg(n) { n.state = 'beg'; n.whine = 3; n.lost = 0; this.sfx('whine', n.x, n.y); this.toast('Biscuit found you. Pet him before he barks!'); }
  dogChase(n, dt, x, y) {
    if (n.repath <= 0 || !n.path) { n.repath = 0.4; n.path = this.world.path(...tileOf(n), Math.floor(x / T), Math.floor(y / T), { noDoors: true }) || []; }
    const bx = n.x, by = n.y;
    this.follow(n, dt);
    // claws click on hard floors
    n.stride += dist(bx, by, n.x, n.y);
    if (n.stride > 0.9 * T) { n.stride = 0; if (this.world.floorAt(n.x, n.y) !== 'c') this.noise(n.x, n.y, 2, { by: n }); }
  }
  updDusty(n, dt) {
    const p = this.p; n.bonkCd -= dt; n.angry -= dt;
    if (n.state === 'dock') { if (this.hour() >= n.from) { n.state = 'run'; this.toast('1:00. Dusty the robo-vac starts cleaning.'); } return; }
    if (n.pause > 0) { n.pause -= dt; return; }
    if (!n.path || !n.path.length) {
      n.ri = (n.ri + 1) % n.route.length;
      n.path = this.world.path(...tileOf(n), n.route[n.ri][0], n.route[n.ri][1], { noDoors: true }) || [];
    }
    const bx = n.x, by = n.y;
    this.follow(n, dt);
    const before = this.crumbs.length;
    this.crumbs = this.crumbs.filter(c => dist(c.x, c.y, n.x, n.y) > 0.6 * T);
    if (this.crumbs.length < before) this.sfx('crunch', n.x, n.y);
    if (p.riding === n) { p.x = n.x; p.y = n.y - 6; this.stats.rideDist += dist(bx, by, n.x, n.y); }
    else if (!p.inBed && !p.hidden && !this.dream && n.bonkCd <= 0 && dist(n.x, n.y, p.x, p.y) < 0.72 * T) {
      this.noise(n.x, n.y, 6, { by: n, sfx: 'bonk' });
      n.pause = 1.5; n.bonkCd = 3; n.angry = 1.6; n.path = null; n.ri = (n.ri + n.route.length - 2) % n.route.length;
      this.float('BONK!', n.x, n.y - 40, '#FF5A4F'); this.toast('"BONK. Obstacle detected."');
    }
  }

  // ------------------------------------------------------------ the raider
  updPlayer(dt, inp) {
    const p = this.p, w = this.world;
    if (p.stun > 0) { p.stun -= dt; p.mode = 'idle'; return; }
    if (this.shh) { p.mode = 'idle'; return; }
    let mag = inp.peek ? 0 : Math.hypot(inp.mx, inp.my);
    if (p.slide) return this.updSlide(dt);
    if (p.inBed) {
      if (p.bedLock) { if (mag < 0.2) p.bedLock = false; return; }
      if (mag > 0.35) this.leaveBed();
      return;
    }
    if (p.hidden || p.riding) { p.mode = 'idle'; return; }
    if (mag < 0.12) { p.mode = 'idle'; return; }
    if (mag > 1) mag = 1;
    let mode = mag < 0.4 ? 'tiptoe' : mag < 0.8 ? 'walk' : 'run';
    const dx = inp.mx / Math.hypot(inp.mx, inp.my), dy = inp.my / Math.hypot(inp.mx, inp.my);
    p.dir = Math.atan2(dy, dx);
    if (Math.abs(dx) > 0.2) p.face = dx > 0 ? 1 : -1;
    const sp = SPEED[mode] * (this.dream ? 1.25 : 1);
    const nx = p.x + dx * sp * dt, ny = p.y + dy * sp * dt;
    let moved = 0;
    if (!w.hits(nx, p.y, p.r)) { moved += Math.abs(nx - p.x); p.x = nx; }
    if (!w.hits(p.x, ny, p.r)) { moved += Math.abs(ny - p.y); p.y = ny; }
    p.mode = mode;
    if (moved <= 0) return;
    p.stride += moved;
    // Snore Surfer: only count steps taken near a snoring Dad
    const dad = this.npc('dad');
    if (dad && dad.state === 'asleep' && dist(p.x, p.y, dad.x, dad.y) <= 6 * T) { if (this.snoreOn) this.stats.snoreGood += moved; else this.stats.snoreBad += moved; }
    if (p.stride >= STRIDE[mode]) {
      p.stride = 0;
      const fl = w.floorAt(p.x, p.y);
      let r = RING[fl][mode];
      if (this.has('socks') && fl !== 'c') r -= 1;
      if (!this.cheat.easysnacks && p.carry.includes('chips') && mode !== 'tiptoe') r += 1;
      if (this.slots >= 5 && this.used() >= 4) r += 1; // the Pillowcase Sack rustles
      if (r > 0 && !this.dream) this.noise(p.x, p.y + 10, r, { kind: 'step', sfx: mode === 'run' ? 'stepRun' : 'step' });
      else if (!this.dream) this.sfx('stepSoft');
      if (!this.cheat.easysnacks && p.carry.includes('cookie') && mode === 'run') this.crumbs.push({ x: p.x, y: p.y + 12 });
    }
    this.enterTile();
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (dist(c.x, c.y, p.x, p.y) < 0.55 * T) { this.coins.splice(i, 1); this.stats.coinsFound += c.v; this.sfx('coin'); this.float('+' + c.v, c.x, c.y - 20, '#FFE08A'); }
    }
  }
  enterTile() {
    const p = this.p, [tx, ty] = tileOf(p), key = tx + ',' + ty;
    if (key === p.tile) return;
    p.tile = key;
    if (this.dream) return;
    const c = this.creaks.get(key);
    if (c && !c.oiled) {
      if (!c.known) { c.known = true; this.stats.newCreaks.push(key); }
      this.noise(p.x, p.y, 5, { sfx: 'creak' }); this.float('CREAK', p.x, p.y - 60, '#FFA630');
    }
    if (this.bricks.some(b => b.x === tx && b.y === ty) && !this.has('slippers')) {
      this.noise(p.x, p.y, 6, { sfx: 'ow' }); p.stun = 1; this.float('OW!', p.x, p.y - 60, '#FF5A4F');
      if (this.hooks.buzz) this.hooks.buzz(120);
    }
  }
  updSlide(dt) {
    const p = this.p, s = p.slide, step = 8 * T * dt;
    const nx = p.x + s.dx * step, ny = p.y + s.dy * step;
    if (this.world.hits(nx, ny, p.r)) {
      p.slide = null; p.stun = 0.6; this.stats.slideCrash = true;
      this.noise(p.x, p.y, 7, { sfx: 'crash' }); this.float('CRASH!', p.x, p.y - 60, '#FF5A4F');
      return;
    }
    p.x = nx; p.y = ny; s.left -= step; this.enterTile();
    if (s.left <= 0 || this.world.floorAt(p.x, p.y) === 'c') p.slide = null;
  }
  leaveBed() { const p = this.p; p.inBed = false; p.x = tc(SPOTS.kidExit[0] + 0.5); p.y = tc(SPOTS.kidExit[1] + 0.5); p.tile = ''; }
  enterBed() {
    const p = this.p, lv = this.lv;
    const snacks = p.carry.filter(id => !SNACKS[id].raw);
    if (snacks.length) {
      this.trips++;
      const want = [lv.craving, ...lv.extras];
      if (this.trips === 1 && want.every(id => snacks.includes(id))) this.stats.oneTrip = true;
      this.delivered.push(...snacks); this.sfx('stash');
      this.toast('Stashed ' + snacks.length + (snacks.length > 1 ? ' snacks' : ' snack') + ' under the bed.');
    }
    p.carry = p.carry.filter(id => SNACKS[id].raw); p.melt = 0; p.fizz = 0;
    p.inBed = true; p.bedLock = true; p.x = tc(SPOTS.kidBed[0]); p.y = tc(SPOTS.kidBed[1]); p.mode = 'idle';
  }
  hide(o) {
    const p = this.p;
    const watchers = new Set(this.npcs.filter(n => n.eye > 0.05).map(n => n.id));
    p.hidden = { obj: o, px: p.x, py: p.y, watchers };
    p.x = (o.x + o.w / 2) * T; p.y = (o.y + o.h / 2) * T; this.sfx('hide');
  }
  unhide() { const p = this.p; p.x = p.hidden.px; p.y = p.hidden.py; p.hidden = null; p.tile = ''; }
  hopOff() {
    const p = this.p, [tx, ty] = this.world.nearestWalkable(...tileOf(p.riding));
    p.riding = null; p.x = tc(tx + 0.5); p.y = tc(ty + 0.5); p.tile = '';
  }
  take(id) {
    const p = this.p;
    p.carry.push(id);
    if (id === 'icecream') p.melt = 45;
    this.sfx('grab');
    if (this.sleepers().some(n => dist(n.x, n.y, p.x, p.y) <= 2 * T)) this.stats.underNose = true;
  }
  lose(id, text, ring, sfx) {
    const p = this.p, i = p.carry.indexOf(id);
    if (i < 0) return;
    p.carry.splice(i, 1);
    this.toast(text, 3);
    this.puddles.push({ x: p.x, y: p.y + 10 });
    if (ring) this.noise(p.x, p.y, ring, { sfx, muffle: true });
  }
  carryTick(dt) {
    const p = this.p;
    if (this.cheat.easysnacks || p.inBed) return;
    if (p.carry.includes('soda')) {
      if (p.mode === 'run') { p.fizz += dt; if (p.fizz >= 3) { p.fizz = 0; this.lose('soda', 'The soda sprayed everywhere!', 5, 'spray'); } }
      else p.fizz = Math.max(0, p.fizz - dt * 0.5);
    }
    if ((p.carry.includes('jelly') || p.carry.includes('cereal')) && p.mode === 'run') {
      p.wob += dt;
      if (p.wob >= 0.4) { p.wob = 0; const id = p.carry.includes('jelly') ? 'jelly' : 'cereal'; this.lose(id, 'Splat. The ' + SNACKS[id].name.toLowerCase() + ' is gone.', 4, 'splat'); }
    } else p.wob = 0;
    if (p.carry.includes('icecream')) { p.melt -= dt; if (p.melt <= 0) this.lose('icecream', 'The ice cream melted.', 0); }
  }

  // ------------------------------------------------------------ context actions
  findContext() {
    const p = this.p, w = this.world, lv = this.lv;
    this.ctx = null; this.ctx2 = null;
    if (p.inBed) { this.ctx = { key: 'sleep', label: this.dream ? 'Wake up' : 'Sleep', run: () => this.finish('sleep') }; return; }
    if (p.hidden) { this.ctx = { key: 'unhide', label: 'Pop out', run: () => this.unhide() }; return; }
    if (p.riding) { this.ctx = { key: 'hopoff', label: 'Hop off', run: () => this.hopOff() }; return; }
    const cands = [];
    const add = (d, c) => cands.push([d, c]);
    const near = (x, y, r) => { const d = dist(p.x, p.y, x, y); return d <= r ? d : -1; };
    let d;
    const bed = w.obj('kidbed');
    if ((d = this.rectDist(bed)) < 0.75 * T) add(d - 20, { key: 'bed', label: p.carry.some(id => !SNACKS[id].raw) ? 'Stash and hop in' : 'Hop in', run: () => this.enterBed() });
    this.items.forEach((it, i) => {
      if (it.taken || (d = near(it.x, it.y, 1.4 * T)) < 0) return;
      const ok = this.room(it.id);
      add(d - 30, { key: 'item' + i, label: ok ? 'Grab ' + SNACKS[it.id].name : 'Hands full', run: () => { if (ok) { it.taken = true; this.take(it.id); } } });
    });
    if (this.jar.snacks.length && (d = near(tc(COUNTER.jar + 0.5), tc(10.6), 1.35 * T)) >= 0) {
      const ok = this.room(this.jar.snacks[0]);
      add(d - 30, { key: 'jar', label: ok ? 'Open the jar' : 'Hands full', run: () => { if (ok) this.startShh('sweep', { what: 'jar' }); } });
    }
    const fr = w.obj('fridge');
    if ((d = this.rectDist(fr)) < 0.8 * T) {
      if (!this.fridge.open) add(d - 25, { key: 'fridge', label: 'Open fridge', run: () => this.startShh('release', { what: 'fridge' }) });
      else {
        const next = this.fridge.snacks.find(id => this.room(id));
        const close = { key: 'fclose', label: 'Close fridge', run: () => { this.fridge.open = false; this.fridge.muted = false; this.sfx('fridge'); } };
        if (next) {
          add(d - 30, { key: 'fgrab', label: 'Grab ' + SNACKS[next].name, run: () => { this.fridge.snacks.splice(this.fridge.snacks.indexOf(next), 1); this.take(next); } });
          this.ctx2 = { ...close, label: 'Close' };
        } else add(d - 30, close);
      }
    }
    if (this.pantryBag && (d = this.rectDist(w.obj('pantry'))) < 0.8 * T) {
      const ok = this.room('popbag');
      add(d - 30, { key: 'pantry', label: ok ? 'Get the popcorn bag' : 'Hands full', run: () => { if (ok) { this.pantryBag = false; this.take('popbag'); } } });
    }
    if (p.carry.includes('popbag') && (d = near(tc(COUNTER.microwave + 0.5), tc(10.6), 1.35 * T)) >= 0)
      add(d - 30, { key: 'micro', label: 'Microwave it', run: () => this.startShh('micro', {}) });
    if (this.plate && this.plate.has && (d = near(this.plate.x, this.plate.y, 1.4 * T)) >= 0) {
      const ok = this.room('cake');
      add(d - 30, { key: 'plate', label: ok ? 'Swipe the cake' : 'Hands full', run: () => { if (ok) { this.plate.has = false; this.take('cake'); this.bossCakeTaken(); } } });
    }
    for (const o of w.objs) if (o.hide && (d = this.rectDist(o)) < 0.55 * T) add(d, { key: 'hide' + o.id, label: 'Hide', run: () => this.hide(o) });
    for (const dr of w.doors) {
      if ((d = near(tc(dr.x + 0.5), tc(dr.y + 0.5), 1.15 * T)) < 0) continue;
      const blocked = dist(p.x, p.y, tc(dr.x + 0.5), tc(dr.y + 0.5)) < 0.62 * T; // standing in the doorway
      if (blocked) continue;
      add(d + 10, { key: 'door' + dr.id, label: dr.open ? 'Close door' : 'Open door', sub: 'tap: fast, hold: quiet', hold: 0.55,
        run: () => this.toggleDoor(dr, true), tap: () => this.toggleDoor(dr, false) });
    }
    const baby = this.npc('baby');
    if (baby && baby.state === 'cry' && (d = this.rectDist(w.obj('crib'))) < 0.85 * T)
      add(d - 30, { key: 'crib', label: 'Rock the crib', hold: 3, run: () => { baby.state = 'asleep'; baby.z = baby.zmax; baby.quiet = 0; this.toast('Baby Boo is asleep again.'); this.sfx('lull'); } });
    const dog = this.npc('biscuit');
    if (dog && ['beg', 'alert', 'sniff'].includes(dog.state) && (d = near(dog.x, dog.y, 1.5 * T)) >= 0)
      add(d - 28, { key: 'pet', label: 'Pet Biscuit', hold: 1.6, run: () => { dog.state = 'follow'; dog.t = 12; dog.ignore = 20; this.toast('Biscuit is happy. He will follow you for a bit.'); this.sfx('pant'); } });
    const dusty = this.npc('dusty');
    if (dusty && dusty.state === 'run' && !p.carry.includes('cake') && (d = near(dusty.x, dusty.y, 1.25 * T)) >= 0)
      add(d - 10, { key: 'ride', label: 'Ride Dusty', run: () => { p.riding = dusty; dusty.bonkCd = 2; this.sfx('hide'); } });
    const mika = this.npc('mika');
    if (mika && mika.owed > 0 && p.carry.some(id => !SNACKS[id].raw) && (d = near(mika.x, mika.y, 1.7 * T)) >= 0)
      add(d - 28, { key: 'give', label: 'Give Mika a snack', run: () => {
        const low = p.carry.filter(id => !SNACKS[id].raw).sort((a, b) => SNACKS[a].pts - SNACKS[b].pts)[0];
        p.carry.splice(p.carry.indexOf(low), 1); mika.owed = 0; mika.cool = 25; this.stats.mikaPaid++;
        this.toast('Mika: "Fine. I saw nothing."', 3);
      } });
    const st = lv.stash && w.obj(lv.stash);
    if (st && !this.stats.wrapper && (d = this.rectDist(st)) < 0.8 * T)
      add(d - 5, { key: 'stash', label: 'Search', hold: 1.4, run: () => { this.stats.wrapper = true; this.sfx('wrapper'); this.toast('Secret Stash! You found a Golden Wrapper.', 3.5); this.float('Golden Wrapper!', p.x, p.y - 70, '#FFE08A'); } });
    const sofa = w.obj('sofa');
    if (!this.stats.cushions && !this.dream && lv.stash !== 'sofa' && (d = this.rectDist(sofa)) < 0.8 * T)
      add(d, { key: 'cushions', label: 'Search cushions', hold: 1.6, run: () => { this.stats.cushions = true; const c = 5 + Math.floor(Math.random() * 21); this.stats.coinsFound += c; this.sfx('coin'); this.float('+' + c + ' coins', p.x, p.y - 70, '#FFE08A'); } });
    if ((d = near(tc(1.5), tc(6.5), 0.95 * T)) >= 0)
      add(d, { key: 'chute', label: 'Slide down the chute', run: () => { p.x = tc(SPOTS.chuteOut[0] + 0.5); p.y = tc(SPOTS.chuteOut[1] + 0.5); p.tile = ''; this.sfx('whoosh'); this.noise(p.x, p.y, 2, {}); this.toast('Wheee. One way only.'); } });
    cands.sort((a, b) => a[0] - b[0]);
    this.ctx = cands.length ? cands[0][1] : null;
  }
  toggleDoor(dr, quiet) {
    dr.open = !dr.open; dr.byNpc = false;
    const r = dr.oiled ? 0 : quiet ? 1 : 4;
    if (r) this.noise(tc(dr.x + 0.5), tc(dr.y + 0.5), r, { sfx: quiet ? 'doorSoft' : 'door' }); else this.sfx('doorSoft');
  }
  handleAction(inp, dt) {
    if (this.shh) return this.updShh(dt, inp);
    const c = this.ctx;
    if (inp.action2Down && this.ctx2) this.ctx2.run();
    if (this.hold) {
      const h = this.hold;
      if (!inp.actionHeld || !c || c.key !== h.key) { this.hold = null; if (h.tap && c && c.key === h.key) h.tap(); return; }
      h.t += dt;
      if (h.t >= h.need) { this.hold = null; this.holdLock = true; h.run(); }
      return;
    }
    if (this.holdLock) { if (!inp.actionHeld) this.holdLock = false; return; }
    if (inp.actionDown && c) {
      if (c.hold) this.hold = { key: c.key, t: 0, need: c.hold, run: c.run, tap: c.tap };
      else { c.run(); this.holdLock = true; }
    }
  }

  // ------------------------------------------------------------ Shh Moments (one-button mini-games)
  startShh(type, data) { this.shh = { type, t: 0, p: 0, started: false, ...data }; this.hold = null; }
  updShh(dt, inp) {
    const s = this.shh; s.t += dt;
    if (s.type !== 'micro' && !s.started && Math.hypot(inp.mx, inp.my) > 0.7 && s.t > 0.3) { this.shh = null; return; }
    if (s.type === 'release') {
      if (inp.actionHeld && s.t > 0.15) { s.started = true; s.p = Math.min(1, s.p + dt / 1.7); if (s.p >= 1) this.endShh(false); }
      else if (s.started) {
        if (s.p >= 0.68 && s.p <= 0.92) this.endShh(true, s.p >= 0.77 && s.p <= 0.86);
        else if (s.p > 0.92) this.endShh(false);
        else { s.p = Math.max(0, s.p - dt * 1.6); if (s.p === 0) s.started = false; }
      }
    } else if (s.type === 'sweep') {
      const ph = (s.t / 1.3) % 2; s.p = ph < 1 ? ph : 2 - ph;
      if (inp.actionDown && s.t > 0.3) this.endShh(Math.abs(s.p - 0.5) <= 0.13, Math.abs(s.p - 0.5) <= 0.045);
    } else if (s.type === 'micro') {
      s.left = 10 - s.t;
      if (inp.actionDown && s.t > 0.4) { if (s.left <= 1) this.endShh(true, true); else if (s.left <= 3) this.endShh(true, false); else this.endShh('early'); }
      else if (s.left <= 0) this.endShh(false);
    }
  }
  endShh(ok, perfect) {
    const s = this.shh, p = this.p; this.shh = null; this.holdLock = true;
    if (s.what === 'fridge') {
      this.fridge.open = true; this.fridge.t = 0; this.fridge.beep = 0; this.fridge.muted = false; this.fridge.byDad = false;
      this.sfx('fridge');
      if (!ok) { this.noise(p.x, p.y, 3, { sfx: 'rattle', muffle: true }); this.float('Rattle!', p.x, p.y - 60, '#FFA630'); }
      else if (perfect) this.float('Perfect!', p.x, p.y - 60, '#4CCB7A');
    } else if (s.what === 'jar') {
      const id = this.jar.snacks.shift(); this.take(id);
      if (!ok) { this.noise(p.x, p.y, 3, { sfx: 'clink', muffle: true }); this.float('Clink!', p.x, p.y - 60, '#FFA630'); }
      else if (perfect) this.float('Perfect!', p.x, p.y - 60, '#4CCB7A');
    } else if (s.type === 'micro') {
      p.carry.splice(p.carry.indexOf('popbag'), 1);
      if (ok === 'early') { this.stats.halfPop = true; this.toast('Stopped too early. Half the corn did not pop.', 3); }
      if (perfect) { this.stats.microPerfect = true; this.float('0:01. Microwave Ninja!', p.x, p.y - 60, '#4CCB7A'); }
      if (ok === false) {
        if (this.muffArmed) { this.muffArmed = false; this.toast('Muffled!'); }
        else for (let i = 0; i < 3; i++) this.after(i * 0.5, () => { this.noise(tc(COUNTER.microwave + 0.5), tc(10.5), 7, { sfx: 'beep' }); this.float('BEEP!', tc(COUNTER.microwave + 0.5), tc(10.2), '#FF5A4F'); });
      }
      if (this.room('popcorn')) this.take('popcorn');
      else { this.items.push({ id: 'popcorn', x: tc(COUNTER.microwave + 0.5), y: tc(10.6), taken: false }); this.toast('Hands full. The popcorn is waiting in the microwave.'); }
    }
  }
  updFridge(dt) {
    const f = this.fridge;
    if (!f.open || f.byDad) return;
    f.t += dt;
    if (f.t >= 5 && !f.muted) {
      f.beep -= dt;
      if (f.beep <= 0) {
        f.beep = 1;
        if (this.muffArmed) { this.muffArmed = false; f.muted = true; this.toast('Fridge alarm muffled.'); }
        else { this.noise(tc(12), tc(10.6), 5, { sfx: 'beep' }); this.float('BEEP!', tc(12), tc(10.2), '#FF5A4F'); }
      }
    }
  }

  // ------------------------------------------------------------ gadgets
  useGadget(i) {
    const id = this.loadout[i], p = this.p;
    if (!id || this.shh || p.inBed && id !== 'dummy' || p.stun > 0) return;
    if (p.carry.includes('cake')) return this.toast('Cake needs both hands. No gadgets.');
    const g = GADGETS[id], free = this.cheat.gadgetgalore;
    const spend = () => { if (!free && g.uses) this.charges[id]--; this.stats.usedGadget = true; };
    if (g.uses && !free && this.charges[id] <= 0) return this.toast(g.name + ' is used up for tonight.');
    if (id === 'socks') {
      if (p.hidden || p.riding || p.slide) return;
      if (this.world.floorAt(p.x, p.y) === 'c') return this.toast('Socks only slide on wood and tile.');
      const lvl = (this.o.gadgets || {}).socks || 1;
      p.slide = { dx: Math.cos(p.dir), dy: Math.sin(p.dir), left: (4 + Math.floor((lvl - 1) / 2)) * T };
      this.stats.slides++; this.stats.usedGadget = true; this.sfx('whoosh');
    } else if (id === 'slippers') this.toast('Bunny Slippers are always on.');
    else if (id === 'oil') {
      const dr = this.world.doors.find(d => !d.oiled && dist(p.x, p.y, tc(d.x + 0.5), tc(d.y + 0.5)) < 1.3 * T);
      const ck = [...this.creaks.values()].find(c => !c.oiled && dist(p.x, p.y, tc(c.x + 0.5), tc(c.y + 0.5)) < 1.3 * T);
      if (dr) { dr.oiled = true; spend(); this.toast('Door oiled. It is silent now.'); this.sfx('oil'); }
      else if (ck) { ck.oiled = true; if (!ck.known) { ck.known = true; this.stats.newCreaks.push(ck.x + ',' + ck.y); } spend(); this.toast('Creaky board oiled.'); this.sfx('oil'); }
      else this.toast('Stand next to a door or a creaky board.');
    } else if (id === 'muffler') {
      if (this.muffArmed) return this.toast('The Pillow Muffler is already armed.');
      this.muffArmed = true; spend(); this.toast('Pillow Muffler armed. The next beep or spill is silent.');
    } else if (id === 'biscuits') {
      const dog = this.npc('biscuit');
      let x = p.x + Math.cos(p.dir) * T, y = p.y + Math.sin(p.dir) * T;
      if (dog && dist(dog.x, dog.y, p.x, p.y) < 7 * T) {
        const d = dist(dog.x, dog.y, p.x, p.y) || 1;
        x = dog.x + (p.x - dog.x) / d * 0.7 * T; y = dog.y + (p.y - dog.y) / d * 0.7 * T;
      }
      this.treats.push({ x, y }); spend(); this.sfx('throw');
    } else if (id === 'decoy') {
      let x = p.x, y = p.y;
      for (let k = 0; k < 6 * 4; k++) {
        const nx = x + Math.cos(p.dir) * T / 4, ny = y + Math.sin(p.dir) * T / 4;
        if (this.world.hits(nx, ny, 8)) break;
        x = nx; y = ny;
      }
      this.decoys.push({ x, y, t: 5, tick: 0.2 }); spend(); this.sfx('throw');
    } else if (id === 'goggles') {
      const lvl = (this.o.gadgets || {}).goggles || 1;
      this.goggles = 20 + 5 * (lvl - 1); spend(); this.sfx('goggles'); this.toast('Night Goggles on.');
    } else if (id === 'dummy') {
      if (this.dummy) return this.toast('The Pillow Dummy is already in your bed.');
      if (!p.inBed && this.rectDist(this.world.obj('kidbed')) > 1.6 * T) return this.toast('Use the Pillow Dummy at your bed.');
      this.dummy = true; spend(); this.toast('Pillow Dummy tucked in.'); this.sfx('hide');
    }
  }

  // ------------------------------------------------------------ the frame
  update(dt, inp) {
    if (this.state !== 'play') return;
    lastDt = dt;
    this.time += dt;
    if (this.time >= this.nightLen) return this.alarm();
    const dad = this.npc('dad');
    const was = this.snoreOn;
    this.snoreOn = !!dad && dad.state === 'asleep' && (this.time % 6) < 2;
    if (this.snoreOn && !was) this.sfx('snore', dad.x, dad.y);
    this.updPlayer(dt, inp);
    this.carryTick(dt);
    this.updFridge(dt);
    for (const n of this.npcs) {
      if (n.kind === 'adult') this.updAdult(n, dt);
      else if (n.kind === 'mika') this.updMika(n, dt);
      else if (n.kind === 'baby') this.updBaby(n, dt);
      else if (n.kind === 'dog') this.updDog(n, dt);
      else if (n.kind === 'dusty') this.updDusty(n, dt);
      if (this.state !== 'play') return;
    }
    for (const d of this.decoys) { d.t -= dt; d.tick -= dt; if (d.tick <= 0) { d.tick = 1; this.noise(d.x, d.y, 4, { by: d, sfx: 'squeak' }); } }
    this.decoys = this.decoys.filter(d => d.t > 0);
    for (const t of this.timers) t.t -= dt;
    const due = this.timers.filter(t => t.t <= 0); this.timers = this.timers.filter(t => t.t > 0);
    for (const t of due) t.fn();
    if (this.goggles > 0) this.goggles -= dt;
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter(r => r.t < 0.9);
    for (const t of this.toasts) t.t -= dt;
    this.toasts = this.toasts.filter(t => t.t > 0);
    for (const f of this.floaters) { f.t -= dt; f.y -= 26 * dt; }
    this.floaters = this.floaters.filter(f => f.t > 0);
    if (this.tip) { this.tip.t -= dt; if (this.tip.t <= 0) { this.tip = null; this.tipT = 1; } }
    else if (this.tips.length) { this.tipT -= dt; if (this.tipT <= 0) this.tip = { text: this.tips.shift(), t: 6.5 }; }
    this.findContext();
    this.handleAction(inp, dt);
    if (inp.gadget >= 0) this.useGadget(inp.gadget);
  }

  // ------------------------------------------------------------ endings
  alarm() {
    if (this.dream || this.p.inBed) return this.finish('alarm');
    this.sfx('alarm');
    this.bust(null, 'alarm');
  }
  bust(n, why) {
    if (this.state !== 'play') return;
    this.state = 'busted';
    this.bustInfo = { by: n ? n.id : 'alarm', why, excuse: pick(EXCUSES), canExcuse: !this.excuseUsed && why !== 'alarm' };
    this.sfx('busted'); if (this.hooks.buzz) this.hooks.buzz(300);
    if (this.hooks.onBusted) this.hooks.onBusted(this.bustInfo);
  }
  // an Excuse Card: walked back to bed, hands emptied, one game hour gone
  playExcuse() {
    if (this.state !== 'busted' || this.excuseUsed) return false;
    this.excuseUsed = true;
    const p = this.p;
    p.carry = []; p.hidden = null; p.riding = null; p.slide = null; p.melt = 0;
    p.inBed = true; p.bedLock = true; p.x = tc(SPOTS.kidBed[0]); p.y = tc(SPOTS.kidBed[1]);
    this.time = Math.min(this.nightLen - 5, this.time + this.hourLen);
    for (const n of this.npcs) if (n.kind === 'adult' && n.state !== 'asleep') { n.eye = 0; n.busy = false; n.plan = [{ to: n.exit, then: 'sleep' }]; this.startStep(n); }
    this.state = 'play';
    this.toast('Phew. Back to bed. You lost what you were holding, and an hour.', 4);
    return true;
  }
  giveUp() { if (this.state === 'busted') { this.state = 'lost'; this.end(this.results(false)); } }
  finish(kind) {
    if (this.state !== 'play') return;
    if (kind === 'sleep' && this.p.carry.some(id => !SNACKS[id].raw)) this.enterBed();
    this.state = 'won';
    this.end(this.results(true));
  }
  end(res) { if (this.hooks.onEnd) this.hooks.onEnd(res); }
  results(inBedAtEnd) {
    const lv = this.lv, st = this.stats;
    const got = id => this.delivered.includes(id);
    const res = { level: lv.n, dream: this.dream, busted: !inBedAtEnd, by: this.bustInfo ? this.bustInfo.by : null,
      newCreaks: st.newCreaks, wrapper: st.wrapper, looseCoins: st.coinsFound, delivered: this.delivered.slice(), lines: [], style: [],
      woke: [...st.woke], framedDog: false };
    if (this.dream) { res.win = true; res.points = 0; res.coins = st.coinsFound; res.crumbs = 30; res.stars = [false, false, false]; res.craving = true; return res; }
    const craving = got(lv.craving);
    res.craving = craving; res.win = inBedAtEnd && craving;
    res.extras = lv.extras.filter(got).length;
    if (!inBedAtEnd) { res.points = 0; res.coins = Math.floor(st.coinsFound / 2); res.crumbs = 10; res.stars = [false, false, false]; return res; }
    let pts = 0;
    const line = (name, v) => { if (v) { res.lines.push([name, v]); pts += v; } };
    let snackPts = 0;
    for (const id of this.delivered) snackPts += id === 'popcorn' && st.halfPop ? SNACKS[id].pts / 2 : SNACKS[id].pts;
    line('Snacks delivered', snackPts);
    if (craving) {
      line('Craving delivered', 500);
      line('Time left', Math.round(Math.max(0, this.nightLen - this.time)) * 5);
      const ghost = st.woke.size === 0;
      res.ghost = ghost;
      if (ghost) line('Ghost: nobody woke up', 1000);
      const evidence = (this.fridge.open && !this.fridge.byDad) || this.crumbs.length > 0 || this.puddles.length > 0 || this.world.doors.some(d => d.open !== d.init && !d.byNpc);
      res.clean = !evidence;
      if (!evidence) line('Clean Getaway', 500);
      const sty = (name, v, on) => { if (on) { res.style.push([name, v]); pts += v; } };
      sty('Snore Surfer', 100, st.snoreGood > 5 * T && st.snoreBad < 0.6 * T);
      sty('Close Call' + (st.closeCalls > 1 ? ' x' + Math.min(3, st.closeCalls) : ''), 50 * Math.min(3, st.closeCalls), st.closeCalls > 0);
      sty('Microwave Ninja', 150, st.microPerfect);
      sty('Sock Rocket', 50, st.slides >= 3 && !st.slideCrash);
      sty('Under the Nose', 100, st.underNose);
      sty('Vac Rider', 50, st.rideDist >= 10 * T);
      sty('One Trip Wonder', 200, st.oneTrip);
      sty('Bare Hands', 200, !st.usedGadget);
      const dog = this.npc('biscuit');
      res.framedDog = !!dog && this.crumbs.some(c => dist(c.x, c.y, dog.bx, dog.by) < 1.5 * T);
      sty('Frame the Dog', 150, res.framedDog);
    }
    res.points = pts;
    res.coins = Math.round(pts / 20) + st.coinsFound;
    res.crumbs = Math.round(pts / 10);
    res.stars = [craving, craving && res.extras === lv.extras.length, craving && st.woke.size === 0];
    return res;
  }
}

// dt for helpers called outside the main switch
let lastDt = 1 / 60;
function dt_() { return lastDt; }
