// Snack Raid: every sound is synthesized with WebAudio, so there are no audio files to load.
import { save } from './save.js';

let ac = null, master = null, musicGain = null, noiseBuf = null, musicTimer = null, beat = 0, tense = 0;

function ctx() {
  if (ac) return ac;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ac = new AC();
  // master -> compressor -> speakers, with a small 'bedroom at night' reverb on the side
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(ac.destination);
  master = ac.createGain(); master.gain.value = 0.9; master.connect(comp);
  const rev = ac.createConvolver(), len = Math.floor(ac.sampleRate * 1.4), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  rev.buffer = ir; const wet = ac.createGain(); wet.gain.value = 0.18; master.connect(rev); rev.connect(wet); wet.connect(comp);
  musicGain = ac.createGain(); musicGain.gain.value = 0.2; musicGain.connect(master);
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
// a plucked note: bright at the start, then the filter closes (sounds like a pizzicato string)
function pluck(f, dur, vol, delay = 0, dest = master, type = 'sawtooth', cut = 2400) {
  const a = ac, t = a.currentTime + delay, o = a.createOscillator(), fl = a.createBiquadFilter(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); fl.frequency.exponentialRampToValueAtTime(Math.max(120, f * 1.2), t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl); fl.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
// a soft held chord note with a slow swell
function pad(f, dur, vol, delay = 0) {
  const a = ac, t = a.currentTime + delay, fl = a.createBiquadFilter(), g = a.createGain();
  fl.type = 'lowpass'; fl.frequency.value = 900;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
  for (const det of [-6, 6]) { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(fl); o.start(t); o.stop(t + dur + 0.05); }
  fl.connect(g); g.connect(musicGain);
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
  step_c: v => hiss(0.07, 0.07 * v, 'lowpass', 420),
  step_w: v => { hiss(0.05, 0.09 * v, 'bandpass', 900); tone('triangle', 180 + Math.random() * 40, 150, 0.06, 0.06 * v); },
  step_t: v => { hiss(0.03, 0.10 * v, 'highpass', 2500); tone('sine', 900, 600, 0.03, 0.05 * v); },
  stepRun_c: v => { hiss(0.08, 0.14 * v, 'lowpass', 500); tone('sine', 90, 60, 0.08, 0.12 * v); },
  stepRun_w: v => { hiss(0.08, 0.2 * v, 'bandpass', 800); tone('sine', 120, 70, 0.09, 0.2 * v); },
  stepRun_t: v => { hiss(0.06, 0.2 * v, 'highpass', 2000); tone('square', 700, 400, 0.04, 0.08 * v); },
  phew: v => { hiss(0.5, 0.12 * v, 'bandpass', 1200, 0, 500); tone('sine', 700, 350, 0.45, 0.1 * v); },
  switch: v => { tone('square', 1500, 1500, 0.02, 0.12 * v); tone('square', 900, 900, 0.03, 0.1 * v, 0.05); },
  sparkle: v => [1568, 2093, 2637].forEach((f, i) => tone('sine', f, f, 0.12, 0.08 * v, i * 0.05)),
  step: v => hiss(0.06, 0.10 * v, 'lowpass', 700),
  stepRun: v => { hiss(0.08, 0.2 * v, 'lowpass', 900); tone('sine', 110, 70, 0.08, 0.12 * v); },
  creak: v => { tone('sawtooth', 210, 120, 0.35, 0.16 * v); tone('sawtooth', 320, 180, 0.3, 0.07 * v, 0.03); },
  snore: v => { hiss(1.2, 0.24 * v, 'lowpass', 160, 0, 90); tone('sawtooth', 62, 48, 1.2, 0.11 * v); tone('sine', 1400, 1900, 0.5, 0.03 * v, 1.2); },
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
  grab: v => { tone('sine', 620, 940, 0.09, 0.2 * v); [1568, 2093].forEach((f, i) => tone('sine', f, f, 0.1, 0.05 * v, 0.06 + i * 0.05)); },
  stash: v => { [523, 659, 784, 1047].forEach((f, i) => pluck(f, 0.25, 0.18 * v, i * 0.06, master, 'triangle')); hiss(0.25, 0.05 * v, 'highpass', 5000, 0.2); },
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
  thunder: v => { hiss(2.2, 0.5 * v, 'lowpass', 400, 0, 80); tone('sine', 60, 35, 1.8, 0.35 * v); },
};

export function play(name, vol = 1) {
  if (!save.settings.sound || !ctx() || ac.state !== 'running') return;
  const f = SFX[name];
  if (f) { try { f(vol); } catch (e) { /* audio hiccup: never break the game */ } }
}

// A tiny sneaky loop: plucked bass, finger snaps and a tick that speeds up when someone is awake.
// Music: D minor, 4 bars of 8 steps. Calm = bass, pad, snaps and a tiptoe tune. Tense = faster, ticking and a higher tune.
const CHORDS = [[147, 175, 220], [117, 147, 175], [98, 117, 147], [110, 139, 165]];   // Dm, Bb, Gm, A
const BASSL = [73, 0, 73, 110, 58, 0, 58, 87, 49, 0, 49, 73, 55, 0, 55, 69];
const TUNE = [587, 0, 698, 0, 659, 587, 0, 523, 466, 0, 587, 0, 554, 0, 440, 0, 587, 698, 880, 0, 784, 698, 659, 0, 622, 0, 587, 0, 554, 0, 0, 0];
function step() {
  if (!ac || ac.state !== 'running' || !save.settings.music) return;
  const i = beat++ % 32, bar = Math.floor(i / 8), hot = tense > 0.5;
  if (i % 8 === 0) for (const f of CHORDS[bar]) pad(f, hot ? 1.3 : 1.8, hot ? 0.05 : 0.04);
  const b = BASSL[(i >> 1) % 16];
  if (i % 2 === 0 && b) pluck(b, 0.3, 0.45, 0, musicGain, 'triangle', 600);
  const n = TUNE[i];
  if (n && (i % 2 === 0 || hot)) pluck(n * (hot ? 2 : 1), 0.22, hot ? 0.12 : 0.16, 0, musicGain, 'triangle', 3000);
  if (i % 4 === 2) hiss(0.04, 0.05, 'bandpass', 2500);                       // finger snap
  if (hot) { hiss(0.02, 0.03, 'highpass', 7000); if (i % 8 === 4) tone('sine', 60, 40, 0.2, 0.25, 0, musicGain); }   // tick, thump
}
export function music(on) {
  clearInterval(musicTimer); musicTimer = null;
  if (on && save.settings.music && ctx()) musicTimer = setInterval(step, tense > 0.5 ? 125 : 190);
}
export function setTense(v) { const was = tense > 0.5; tense = v; if (musicTimer && was !== (v > 0.5)) music(true); }

// Voices: no real words. Each speech bubble gets a little babble, pitched to the speaker.
const VOICE = { dad: [95, 140, 'sawtooth'], mom: [210, 290, 'triangle'], mika: [260, 340, 'triangle'], baby: [420, 560, 'sine'], biscuit: [500, 700, 'sine'] };
export function voice(who, text, vol = 1) {
  if (!save.settings.sound || !ctx() || ac.state !== 'running' || vol < 0.05) return;
  const [lo, hi, type] = VOICE[who] || [200, 300, 'triangle'];
  const n = Math.min(9, Math.max(2, Math.round(String(text).length / 4)));
  for (let k = 0; k < n; k++) {
    const t = ac.currentTime + k * 0.085, f = lo + Math.random() * (hi - lo);
    const o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (k === n - 1 ? 0.8 : 1.08), t + 0.07);
    bp.type = 'bandpass'; bp.frequency.value = 700 + Math.random() * 900; bp.Q.value = 2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
    o.connect(bp); bp.connect(g); g.connect(master); o.start(t); o.stop(t + 0.09);
  }
}
export function buzz(ms) { if (save.settings.haptics && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* no haptics */ } } }
