// Checks every promo code and cheat code against the shipped hash table. Run: node tools/codes-test.mjs
import { redeem } from '../app/js/codes.js';
import { save } from '../app/js/save.js';

const PROMO = ['SNACKRAID', 'COOKIEJAR', 'MIDNIGHT', 'GOLDENDONUT', 'LAVADINO', 'GOLDENPJS', 'STARLIGHT', 'TOYCHEST', 'SQUEAK', 'BUNNYHOP',
  'BIGPOCKETS', 'GADGETBELT', 'DOUBLECOINS', 'LEVELUP', 'LUNCHBOX', 'BOSSKEY'];
const CHEAT = ['OPENSESAME', 'PIGGYBANK', 'SLEEPYHEADS', 'NINJAFEET', 'SLOWCLOCK', 'XRAYEYES', 'DEEPPOCKETS', 'GHOSTMODE', 'EASYSNACKS', 'GADGETGALORE'];
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m); } };
for (const c of PROMO) { const r = redeem(c); ok(r.ok && r.kind === 'promo', c + ' -> ' + r.msg); console.log(c.padEnd(12), r.msg); const again = redeem(c.toLowerCase()); ok(!again.ok, c + ' should be one-time'); }
for (const c of CHEAT) { const r = redeem(' ' + c.toLowerCase() + ' '); ok(r.ok && r.kind === 'cheat', c + ' -> ' + r.msg); console.log(c.padEnd(12), r.title, r.msg); }
ok(!redeem('NOPE').ok, 'unknown code is refused');
ok(save.coins >= 6500 && save.wrappers >= 5 && save.cards >= 4 && save.unlockAll && save.bossKey && save.bonusSlot && save.bonusPouch, 'effects landed');
ok(save.pajamas.includes('dino_lava') && save.pajamas.includes('dino_gold') && save.pajamas.includes('star_midnight'), 'pajamas unlocked');
ok(save.gadgets.goggles >= 1 && save.gadgets.decoy >= 1 && save.gadgets.slippers >= 1, 'gadgets unlocked');
ok(Object.values(save.cheats).filter(Boolean).length === 8, '8 toggle cheats on');
console.log(fails ? fails + ' FAILED' : 'all 26 codes good');
process.exit(fails ? 1 : 0);
