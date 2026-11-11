// Snack Raid: every sound is synthesized with WebAudio, so there are no audio files to load.
import { save } from './save.js';

let ac = null, master = null, musicGain = null, noiseBuf = null, musicTimer = null, beat = 0, tense = 0;

function ctx() {
  if (ac) return ac;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ac = new AC();
  master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
  musicGain = ac.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ac;
}
// call from the first tap so the browser lets us make sound
export function unlockAudio() { const a = ctx(); if (a && a.state === 'suspended') a.resume(); }

function tone(type, f0, f1, dur, vol, delay = 0, dest = master) {
  const a = ac, t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.03);
}
function hiss(dur, vol, kind, freq, delay = 0, f1 = null) {
  const a = ac, t = a.currentTime + delay, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = kind; f.frequency.setValueAtTime(freq, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.03);
}

const SFX = {
  stepSoft: v => hiss(0.05, 0.03 * v, 'lowpass', 500),
  step: v => hiss(0.06, 0.10 * v, 'lowpass', 700),
  stepRun: v => { hiss(0.08, 0.2 * v, 'lowpass', 900); tone('sine', 110, 70, 0.08, 0.12 * v); },
  creak: v => { tone('sawtooth', 210, 120, 0.35, 0.16 * v); tone('sawtooth', 320, 180, 0.3, 0.07 * v, 0.03); },
  snore: v => { hiss(1.5, 0.22 * v, 'lowpass', 160, 0, 90); tone('sawtooth', 62, 48, 1.4, 0.10 * v); },
  pop: v => tone('sine', 760, 300, 0.09, 0.2 * v),
  beep: v => tone('square', 1040, 1040, 0.2, 0.22 * v),
  bark: v => { tone('sawtooth', 330, 190, 0.11, 0.3 * v); tone('sawtooth', 300, 170, 0.13, 0.3 * v, 0.16); },
  whine: v => tone('sine', 880, 1300, 0.45, 0.16 * v),
  pant: v => { for (let i = 0; i < 4; i++) hiss(0.07, 0.12 * v, 'bandpass', 1500, i * 0.14); },
  cry: v => { tone('triangle', 620, 820, 0.35, 0.22 * v); tone('triangle', 820, 560, 0.4, 0.22 * v, 0.35); },
  bonk: v => { tone('sine', 190, 70, 0.22, 0.4 * v); hiss(0.05, 0.2 * v, 'highpass', 2000); },
  door: v => { hiss(0.14, 0.3 * v, 'lowpass', 400); tone('sine', 120, 60, 0.16, 0.25 * v); },
  doorSoft: v => hiss(0.2, 0.06 * v, 'lowpass', 300),
  fridge: v => { tone('sine', 90, 60, 0.2, 0.3 * v); hiss(0.12, 0.08 * v, 'lowpass', 500); },
  grab: v => tone('sine', 620, 940, 0.09, 0.2 * v),
  stash: v => { tone('sine', 520, 520, 0.08, 0.2 * v); tone('sine', 780, 780, 0.12, 0.2 * v, 0.09); },
  coin: v => { tone('square', 988, 988, 0.07, 0.10 * v); tone('square', 1319, 1319, 0.16, 0.10 * v, 0.07); },
  wrapper: v => [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.18, 0.2 * v, i * 0.08)),
  star: v => { tone('triangle', 880, 880, 0.12, 0.2 * v); tone('triangle', 1319, 1319, 0.25, 0.2 * v, 0.1); },
  win: v => [392, 523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.22, 0.22 * v, i * 0.11)),
  busted: v => { tone('sawtooth', 420, 90, 0.7, 0.3 * v); hiss(0.3, 0.2 * v, 'lowpass', 800); },
  alarm: v => { for (let i = 0; i < 6; i++) tone('square', i % 2 ? 880 : 660, i % 2 ? 880 : 660, 0.12, 0.2 * v, i * 0.13); },
  ow: v => tone('sawtooth', 520, 240, 0.25, 0.25 * v),
  crash: v => { hiss(0.4, 0.45 * v, 'lowpass', 2500, 0, 300); tone('sine', 140, 50, 0.3, 0.3 * v); },
  rattle: v => { for (let i = 0; i < 4; i++) tone('triangle', 1500 + i * 180, 1400, 0.05, 0.14 * v, i * 0.05); },
  clink: v => tone('triangle', 2100, 1900, 0.15, 0.2 * v),
  spray: v => hiss(0.6, 0.35 * v, 'highpass', 3000),
  splat: v => { hiss(0.2, 0.3 * v, 'lowpass', 600); tone('sine', 160, 60, 0.2, 0.25 * v); },
  water: v => hiss(1.2, 0.08 * v, 'bandpass', 2200),
  flush: v => hiss(1.8, 0.25 * v, 'lowpass', 1800, 0, 250),
  huh: v => tone('sawtooth', 170, 260, 0.3, 0.2 * v),
  tax: v => { tone('square', 220, 220, 0.14, 0.14 * v); tone('square', 165, 165, 0.25, 0.14 * v, 0.15); },
  hide: v => hiss(0.18, 0.1 * v, 'bandpass', 900, 0, 300),
  whoosh: v => hiss(0.35, 0.2 * v, 'bandpass', 500, 0, 2400),
  throw: v => hiss(0.2, 0.14 * v, 'bandpass', 1200, 0, 2600),
  squeak: v => tone('sine', 1900, 2600, 0.12, 0.2 * v),
  crunch: v => { for (let i = 0; i < 3; i++) hiss(0.05, 0.2 * v, 'highpass', 1800, i * 0.09); },
  muffle: v => tone('sine', 110, 60, 0.2, 0.3 * v),
  goggles: v => tone('sine', 400, 1400, 0.3, 0.14 * v),
  oil: v => tone('sine', 700, 500, 0.1, 0.14 * v),
  lull: v => [784, 659, 523].forEach((f, i) => tone('sine', f, f, 0.3, 0.14 * v, i * 0.22)),
  click: v => tone('square', 660, 660, 0.04, 0.08 * v),
};

export function play(name, vol = 1) {
  if (!save.settings.sound || !ctx() || ac.state !== 'running') return;
  const f = SFX[name];
  if (f) { try { f(vol); } catch (e) { /* audio hiccup: never break the game */ } }
}

// A tiny sneaky loop: plucked bass, finger snaps and a tick that speeds up when someone is awake.
const BASS = [110, 0, 131, 0, 147, 0, 131, 98, 110, 0, 131, 0, 165, 147, 131, 0];
function step() {
  if (!ac || ac.state !== 'running' || !save.settings.music) return;
  const i = beat++ % 16, f = BASS[i];
  if (f) tone('triangle', f, f, 0.18, 0.5, 0, musicGain);
  if (i % 4 === 2) hiss(0.03, 0.05, 'highpass', 4000);
  if (tense > 0.5 && i % 2 === 1) tone('square', 880, 880, 0.03, 0.06, 0, musicGain);
  if (i === 14 && beat % 32 > 16) tone('sine', 440, 660, 0.12, 0.2, 0, musicGain);
}
export function music(on) {
  clearInterval(musicTimer); musicTimer = null;
  if (on && save.settings.music && ctx()) musicTimer = setInterval(step, tense > 0.5 ? 150 : 210);
}
export function setTense(v) { const was = tense > 0.5; tense = v; if (musicTimer && was !== (v > 0.5)) music(true); }
export function buzz(ms) { if (save.settings.haptics && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* no haptics */ } } }
