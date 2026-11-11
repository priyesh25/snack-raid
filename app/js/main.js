// Snack Raid: boot, the frame loop, and the glue between the menus and a night of play.
import { LEVELS, PAJAMAS, VERSION } from './data.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input, VIEW } from './input.js';
import { loadSprites, setDpr } from './gfx.js';
import { save, persist, applyResult, carrySlots } from './save.js';
import { UI } from './ui.js';
import { play, music, setTense, buzz, unlockAudio } from './audio.js';
import { isApp, checkUpdate } from './native.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let scale = 1, dpr = 1;
let game = null, level = null, mode = 'menu'; // menu | play | paused | busted | results
let last = 0, clock = 0;

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  // the view is 720 tall and as wide as the screen allows, so wide phones are filled edge to edge
  VIEW.w = Math.max(1100, Math.min(1760, Math.round(VIEW.h * window.innerWidth / Math.max(1, window.innerHeight))));
  scale = Math.min(window.innerWidth / VIEW.w, window.innerHeight / VIEW.h);
  canvas.style.width = Math.round(VIEW.w * scale) + 'px';
  canvas.style.height = Math.round(VIEW.h * scale) + 'px';
  canvas.width = Math.round(VIEW.w * scale * dpr);
  canvas.height = Math.round(VIEW.h * scale * dpr);
  setDpr(dpr * Math.max(1, scale));
}
const toLogical = (cx, cy) => { const r = canvas.getBoundingClientRect(); return [(cx - r.left) / scale, (cy - r.top) / scale]; };

const input = new Input(canvas, toLogical);
const renderer = new Renderer(canvas);

function startNight(n) {
  level = LEVELS[n - 1];
  const pj = PAJAMAS.find(p => p.id === save.pajama) || PAJAMAS[0];
  game = new Game(level, {
    loadout: save.loadout.slice(), gadgets: save.gadgets, cheats: save.cheats, carrySlots: carrySlots(),
    knownCreaks: save.creaks[n] || [], sprite: pj.sprite,
    hooks: { sfx: play, buzz, onBusted, onEnd },
  });
  mode = 'play';
  input.reset(); input.enabled = true; input.lefty = save.settings.lefty;
  UI.hide();
  music(true);
}
function onBusted(info) { mode = 'busted'; input.enabled = false; music(false); UI.overlay('busted', info); }
function onEnd(res) {
  input.enabled = false; music(false);
  const out = applyResult(res);
  if (res.busted) return;          // the Busted screen decides where to go next
  mode = 'results';
  play(res.win || res.dream ? 'win' : 'tax');
  UI.overlay('results', { res, out, level });
}
function leaveNight() { game = null; mode = 'menu'; input.enabled = false; music(false); }

UI.init({
  onStart: startNight,
  onResume: () => { mode = 'play'; input.reset(); input.enabled = true; UI.hide(); music(true); },
  onRestart: () => startNight(level.n),
  onQuit: () => { leaveNight(); UI.show('hub'); },
  onLeaveNight: leaveNight,
  onExcuse: () => {
    if (save.cards > 0 && game.playExcuse()) { save.cards--; persist(); mode = 'play'; input.reset(); input.enabled = true; UI.hide(); music(true); }
  },
  onRetry: () => { game.giveUp(); startNight(level.n); },
  onGiveUp: () => { game.giveUp(); leaveNight(); UI.show('hub'); },
  onSettings: () => { input.lefty = save.settings.lefty; if (!save.settings.music) music(false); },
});
input.onPause = () => { if (mode === 'play') { mode = 'paused'; input.enabled = false; music(false); UI.overlay('pause'); } };
// Android Back: pause a night, or go back one menu. 'exit' sends the app to the background.
window.snackRaidBack = () => {
  if (mode === 'play') { input.onPause(); return 'ok'; }
  return UI.back() ? 'ok' : 'exit';
};
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') input.onPause(); });
window.addEventListener('resize', resize);
window.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('keydown', unlockAudio);

function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts; clock += dt;
  if (game) {
    let inp = null;
    if (mode === 'play') {
      inp = input.sample();
      // big frames are split so fast walkers cannot skip through thin things
      const steps = dt > 0.025 ? 2 : 1;
      for (let i = 0; i < steps && mode === 'play'; i++) {
        game.update(dt / steps, i === 0 ? inp : { ...inp, actionDown: false, actionUp: false, action2Down: false, gadget: -1 });
      }
      setTense(game.npcs.some(n => (n.kind === 'adult' && n.state !== 'asleep') || n.state === 'cry' || n.state === 'beg') ? 1 : 0);
    }
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    renderer.frame(game, input, clock, { peek: mode === 'play' && inp && inp.peek, hideControls: mode !== 'play' });
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0D1130'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}

async function boot() {
  resize();
  try { await Promise.all([loadSprites(), document.fonts ? document.fonts.load('700 20px Fredoka') : null, document.fonts ? document.fonts.load('800 20px "Baloo 2"') : null]); } catch (e) { /* keep going with fallbacks */ }
  document.getElementById('boot').remove();
  UI.show('title');
  requestAnimationFrame(frame);
  // offline support on real hosting (not on localhost, so development never fights a stale cache)
  // The Android app carries its own files, so it needs no cache. It asks GitHub for a newer version instead.
  if (isApp()) checkUpdate().then(() => UI.updated());
  else if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();

// a small handle for tests and for curious kids with a console
window.snackRaid = { get game() { return game; }, get mode() { return mode; }, get save() { return save; }, startNight, version: VERSION };
