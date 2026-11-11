// Snack Raid: the player's progress, kept in localStorage on this device only.
import { RANKS, GADGETS, UPGRADE_COST, LEVELS } from './data.js';

const KEY = 'snackraid.save.v1';
const fresh = () => ({
  v: 1, coins: 0, wrappers: 0, crumbs: 0, cards: 1,
  gadgets: {},          // id -> level (1..5)
  loadout: [],
  levels: {},           // n -> { stars: [bool, bool, bool], wrapper, best }
  creaks: {},           // n -> ['x,y', ...] creaky boards already found
  pajama: 'dino', pajamas: ['dino', 'star'],
  promos: [], cheats: {}, cheatsFound: [],
  doubleNights: 0, bonusSlot: false, bonusPouch: false, unlockAll: false, bossKey: false,
  lastDay: '', streak: 0, streakDay: '',
  seen: {},             // one-time popups already shown
  settings: { sound: true, music: true, haptics: true, lefty: false },
});

export let save = load();

function load() {
  let s = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const old = JSON.parse(raw); s = { ...s, ...old, settings: { ...s.settings, ...(old.settings || {}) } }; }
  } catch (e) { /* no storage: play without saving */ }
  return s;
}
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
export function resetSave() { const keep = save.settings; save = fresh(); save.settings = keep; persist(); }

export const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
export function rank() { let r = 1; RANKS.forEach((k, i) => { if (save.crumbs >= k.need) r = i + 1; }); return r; }
export function gadgetSlots() { const r = rank(); return save.bonusSlot || r >= 5 ? 3 : r >= 2 ? 2 : 1; }
export function carrySlots() { const r = rank(); const s = r >= 9 ? 5 : r >= 6 ? 4 : r >= 3 ? 3 : 2; return save.bonusPouch ? Math.max(3, s) : s; }
export function levelInfo(n) { return save.levels[n] || { stars: [false, false, false], wrapper: false, best: 0 }; }
export function totalStars() { return LEVELS.reduce((s, l) => s + levelInfo(l.n).stars.filter(Boolean).length, 0); }
export function worldWrappers() { return LEVELS.filter(l => levelInfo(l.n).wrapper).length; }

// Is a night open? Night 9 needs 4 Golden Wrappers. The boss needs 15 stars.
export function unlocked(n) {
  if (n === 1 || save.unlockAll) return true;
  if (n === 9) return worldWrappers() >= 4;
  if (n === 10) return save.bossKey || totalStars() >= 15;
  return levelInfo(n - 1).stars[0];
}
export function lockReason(n) {
  if (n === 9) return 'Find 4 Golden Wrappers (' + worldWrappers() + '/4)';
  if (n === 10) return 'Earn 15 stars (' + totalStars() + '/15)';
  return 'Finish Night ' + (n - 1);
}

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
// prize boxes: earned only, never sold
export function openBox(kind) {
  const out = { kind, coins: 0, cards: 0, wrappers: 0 };
  if (kind === 'Brown Bag') out.coins = rnd(50, 100);
  else if (kind === 'Lunchbox') { out.coins = rnd(150, 300); out.cards = 1; }
  else if (kind === 'Cooler') { out.coins = rnd(400, 600); out.cards = 2; }
  else { out.coins = 1000; out.wrappers = 2; if (!save.pajamas.includes('dino_gold')) save.pajamas.push('dino_gold'); out.pajama = 'Golden Dino'; }
  save.coins += out.coins; save.cards = Math.min(9, save.cards + out.cards); save.wrappers += out.wrappers;
  return out;
}

// Bank the result of a night. Returns what to show on the Morning After screen.
export function applyResult(res) {
  const n = res.level, before = rank(), info = { ...levelInfo(n), stars: levelInfo(n).stars.slice() };
  const out = { coins: res.coins, notes: [], boxes: [], rankUp: null };
  let mult = 1;
  if (res.win || res.dream) {
    if (save.lastDay !== today()) { save.lastDay = today(); mult *= 2; out.notes.push('First raid of the day: double coins'); }
    if (save.doubleNights > 0) { save.doubleNights--; mult *= 2; out.notes.push('DOUBLECOINS promo: double coins (' + save.doubleNights + ' nights left)'); }
  }
  out.coins = res.coins * mult;
  let newStars = 0;
  res.stars.forEach((s, i) => { if (s && !info.stars[i]) { info.stars[i] = true; newStars++; } });
  if (newStars) { out.coins += 25 * newStars; out.notes.push(newStars + ' new star' + (newStars > 1 ? 's' : '') + ': +' + 25 * newStars + ' coins'); }
  const had3 = levelInfo(n).stars.every(Boolean);
  if (!had3 && info.stars.every(Boolean)) out.boxes.push(openBox('Brown Bag'));
  if (res.wrapper && !info.wrapper) { info.wrapper = true; save.wrappers++; out.notes.push('Golden Wrapper found'); }
  else if (res.wrapper) out.coins += 10;
  const firstClear = (res.win || res.dream) && !levelInfo(n).cleared;
  if (res.win || res.dream) info.cleared = true;
  if (firstClear && res.dream) out.boxes.push(openBox('Lunchbox'));
  if (firstClear && n === 10) { out.boxes.push(openBox('Cooler')); save.wrappers += 3; out.notes.push('Boss beaten: +3 Golden Wrappers'); }
  info.best = Math.max(info.best || 0, res.points || 0);
  save.levels[n] = info;
  if (res.newCreaks && res.newCreaks.length) save.creaks[n] = [...new Set([...(save.creaks[n] || []), ...res.newCreaks])];
  save.coins += out.coins;
  save.crumbs += res.crumbs || 0;
  const after = rank();
  if (after > before) {
    out.rankUp = { rank: after, title: RANKS[after - 1].title, rewards: [] };
    for (let r = before + 1; r <= after; r++) {
      out.rankUp.rewards.push(RANKS[r - 1].reward);
      if (r === 4 || r === 7) out.boxes.push(openBox('Lunchbox'));
      if (r === 8) out.boxes.push(openBox('Cooler'));
      if (r === 10) out.boxes.push(openBox('Golden Picnic Basket'));
    }
  }
  persist();
  return out;
}

// The 7 day Snack Streak. It pauses when you miss a day. It never resets.
const STREAK = ['50 coins', 'Excuse Card', 'Brown Bag', '100 coins', '75 coins', 'Lunchbox', 'Golden Wrapper'];
export function claimDaily() {
  if (save.streakDay === today()) return null;
  save.streakDay = today();
  const day = save.streak % 7; save.streak++;
  let text = STREAK[day];
  if (day === 0) save.coins += 50; else if (day === 1) save.cards = Math.min(9, save.cards + 1);
  else if (day === 2) text = 'Brown Bag: ' + openBox('Brown Bag').coins + ' coins';
  else if (day === 3) save.coins += 100; else if (day === 4) save.coins += 75;
  else if (day === 5) { const b = openBox('Lunchbox'); text = 'Lunchbox: ' + b.coins + ' coins and an Excuse Card'; }
  else save.wrappers++;
  persist();
  return { day: day + 1, text, next: STREAK[(day + 1) % 7] };
}

// gadgets
export function ownGadget(id) { return !!save.gadgets[id]; }
export function giveGadget(id) {
  if (!save.gadgets[id]) save.gadgets[id] = 1;
  if (!save.loadout.includes(id) && save.loadout.length < gadgetSlots()) save.loadout.push(id);
  persist();
}
export function buyGadget(id) {
  const g = GADGETS[id];
  if (ownGadget(id) || !g.ready || save.coins < g.price) return false;
  save.coins -= g.price; giveGadget(id); return true;
}
export function upgradeCost(id) { const l = save.gadgets[id] || 0; return l >= 1 && l < 5 ? UPGRADE_COST[l] : null; }
export function upgradeGadget(id) {
  const c = upgradeCost(id);
  if (c == null || save.coins < c) return false;
  save.coins -= c; save.gadgets[id]++; persist(); return true;
}
export function toggleLoadout(id) {
  const i = save.loadout.indexOf(id);
  if (i >= 0) save.loadout.splice(i, 1);
  else { if (save.loadout.length >= gadgetSlots()) save.loadout.shift(); save.loadout.push(id); }
  persist();
}
