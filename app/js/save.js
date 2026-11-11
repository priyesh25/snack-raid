// Snack Raid: the player's progress, kept in localStorage on this device only.
// Up to 4 raiders can share one device. Each has a name and a save of their own.
// A save code moves a raider to another device by copy and paste. Nothing is ever sent anywhere.
import { RANKS, GADGETS, UPGRADE_COST, LEVELS } from './data.js';

const KEY = 'snackraid.save.v1';            // raider p1 keeps the first key, so old saves just work
const PKEY = 'snackraid.profiles.v1';
const keyFor = id => (id === 'p1' ? KEY : KEY + '.' + id);
export const MAX_RAIDERS = 4;
const fresh = () => ({
  v: 1, name: '', coins: 0, wrappers: 0, crumbs: 0, cards: 1,
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

let prof = loadProfiles();
export let save = load(prof.active);

function loadProfiles() {
  try {
    const p = JSON.parse(localStorage.getItem(PKEY));
    if (p && Array.isArray(p.ids) && p.ids.length && p.ids.includes(p.active)) return p;
  } catch (e) { /* no storage, or nothing saved yet */ }
  return { active: 'p1', ids: ['p1'] };
}
function saveProfiles() { try { localStorage.setItem(PKEY, JSON.stringify(prof)); } catch (e) { /* ignore */ } }
function merge(old) { const s = fresh(); return { ...s, ...old, settings: { ...s.settings, ...(old.settings || {}) } }; }
function load(id) {
  try {
    const raw = localStorage.getItem(keyFor(id));
    if (raw) return merge(JSON.parse(raw));
  } catch (e) { /* no storage: play without saving */ }
  return fresh();
}
export function persist() { try { localStorage.setItem(keyFor(prof.active), JSON.stringify(save)); } catch (e) { /* ignore */ } }
export function resetSave() { const keep = save.settings, name = save.name; save = fresh(); save.settings = keep; save.name = name; persist(); }

export const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
const rankOf = s => { let r = 1; RANKS.forEach((k, i) => { if (s.crumbs >= k.need) r = i + 1; }); return r; };
const starsOf = s => LEVELS.reduce((t, l) => t + ((s.levels[l.n] || {}).stars || []).filter(Boolean).length, 0);
export function rank() { return rankOf(save); }
export function gadgetSlots() { const r = rank(); return save.bonusSlot || r >= 5 ? 3 : r >= 2 ? 2 : 1; }
export function carrySlots() { const r = rank(); const s = r >= 9 ? 5 : r >= 6 ? 4 : r >= 3 ? 3 : 2; return save.bonusPouch ? Math.max(3, s) : s; }
export function levelInfo(n) { return save.levels[n] || { stars: [false, false, false], wrapper: false, best: 0 }; }
export function totalStars() { return starsOf(save); }
export function worldWrappers() { return LEVELS.filter(l => levelInfo(l.n).wrapper).length; }

// ------------------------------------------------------------ raiders
// Names: letters, numbers, spaces, - and _. Up to 12 characters. A nickname is best.
export function cleanName(n) { return String(n || '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12); }
export function setName(n) { const c = cleanName(n); if (!c) return false; save.name = c; persist(); return true; }
export function raiders() {
  return prof.ids.map(id => {
    const s = id === prof.active ? save : load(id);
    return { id, name: s.name || 'Raider', rank: rankOf(s), stars: starsOf(s), pajama: s.pajama, active: id === prof.active };
  });
}
export function switchRaider(id) {
  if (!prof.ids.includes(id) || id === prof.active) return false;
  persist(); prof.active = id; saveProfiles(); save = load(id); return true;
}
// adds a raider with this save and makes it the one playing
function addRaider(data) {
  if (prof.ids.length >= MAX_RAIDERS) return false;
  let i = 1; while (prof.ids.includes('p' + i)) i++;
  persist(); prof.ids.push('p' + i); prof.active = 'p' + i; saveProfiles();
  save = data; persist(); return true;
}
export function newRaider(name) {
  const c = cleanName(name); if (!c) return false;
  const s = fresh(); s.settings = { ...save.settings }; s.name = c;
  return addRaider(s);
}
export function deleteRaider(id) {
  if (prof.ids.length <= 1 || !prof.ids.includes(id)) return false;
  try { localStorage.removeItem(keyFor(id)); } catch (e) { /* ignore */ }
  prof.ids = prof.ids.filter(x => x !== id);
  if (prof.active === id) { prof.active = prof.ids[0]; save = load(prof.active); }
  saveProfiles(); return true;
}

// ------------------------------------------------------------ save codes
// SNACK1-<the save in base64>-<check>. The check catches a code that lost some letters on the way.
const check = t => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h.toString(36).toUpperCase().padStart(7, '0').slice(-5); };
const toB64 = str => { let b = ''; new TextEncoder().encode(str).forEach(x => { b += String.fromCharCode(x); }); return btoa(b); };
const fromB64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64), ch => ch.charCodeAt(0)));
export function saveCode() {
  const { settings, ...rest } = save;   // settings belong to the device, not the raider
  const body = toB64(JSON.stringify(rest));
  return 'SNACK1-' + body + '-' + check(body);
}
// Loads a code as a new raider on this device. Returns { ok, msg }.
export function loadSaveCode(code) {
  const m = String(code || '').replace(/\s+/g, '').match(/^SNACK1-([A-Za-z0-9+/=]+)-([0-9A-Z]{5})$/);
  if (!m) return { ok: false, msg: 'That is not a save code. A save code starts with SNACK1.' };
  if (check(m[1]) !== m[2]) return { ok: false, msg: 'Part of the code is missing. Copy all of it and try again.' };
  let data;
  try { data = JSON.parse(fromB64(m[1])); } catch (e) { data = null; }
  if (!data || data.v !== 1 || typeof data.coins !== 'number' || typeof data.levels !== 'object') return { ok: false, msg: 'That code is broken. Copy it again.' };
  if (prof.ids.length >= MAX_RAIDERS) return { ok: false, msg: 'This device has 4 raiders already. Remove one first.' };
  const s = merge(data); s.settings = { ...save.settings }; s.name = cleanName(s.name) || 'Raider';
  addRaider(s);
  return { ok: true, msg: 'Welcome back, ' + s.name + '!' };
}

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
