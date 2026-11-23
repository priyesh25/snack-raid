// Snack Raid sound. Real recorded effects (CC0, see docs/sound-credits.md) in assets/sfx, plus synthesized
// music, beeps and voices. If a recording has not loaded yet, a synthesized stand-in plays instead.
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
  loadSamples();
  return ac;
}

// ---------------------------------------------------------------- recorded sounds
const SAMPLE_NAMES = ['bark', 'woofwoof', 'snore', 'snort', 'cough', 'cry', 'creak', 'door', 'thump', 'glass', 'pssht', 'alarm',
  'flush', 'water', 'thunder', 'click', 'laugh', 'step', 'crickets', 'tick'];
const buf = {};
let loading = false;
function loadSamples() {
  if (loading) return; loading = true;
  for (const n of SAMPLE_NAMES) {
    fetch('assets/sfx/' + n + '.mp3').then(r => r.arrayBuffer()).then(b => ac.decodeAudioData(b)).then(d => { buf[n] = d; if (n === 'crickets' || n === 'tick') ambience(ambOn); }).catch(() => {});
  }
}
// play a recording: vol 0..1, rate = playback speed (pitch), lp/hp = optional filter cutoffs
function smp(name, vol = 1, o = {}) {
  const b = buf[name]; if (!b) return false;
  const t = ac.currentTime + (o.delay || 0), s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = b; s.playbackRate.value = (o.rate || 1) * (1 + (Math.random() - 0.5) * (o.vary ?? 0.08));
  g.gain.value = vol;
  let node = s;
  if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; node.connect(f); node = f; }
  if (o.hp) { const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp; node.connect(f); node = f; }
  node.connect(g); g.connect(o.dest || master); s.start(t);
  return true;
}
// Night ambience under everything: crickets outside and the kitchen clock ticking.
let ambGain = null, ambSrc = [], ambOn = false;
function ambience(on) {
  ambOn = on;
  if (!ac) return;
  for (const s of ambSrc) { try { s.stop(); } catch (e) { /* already stopped */ } }
  ambSrc = [];
  if (!on || !save.settings.sound) return;
  if (!ambGain) { ambGain = ac.createGain(); ambGain.gain.value = 0.9; ambGain.connect(master); }
  for (const [n, v, lp] of [['crickets', 0.10, 5000], ['tick', 0.07, 3000]]) {
    if (!buf[n]) continue;
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    s.buffer = buf[n]; s.loop = true; g.gain.value = v; f.type = 'lowpass'; f.frequency.value = lp;
    s.connect(f); f.connect(g); g.connect(ambGain); s.start(); ambSrc.push(s);
  }
}
// louder ambience when it storms, quieter when someone is awake (you hold your breath)
export function setAmbience(level) { if (ambGain) ambGain.gain.setTargetAtTime(level, ac.currentTime, 0.4); }

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
  chuckle: v => [0, 0.12, 0.24].forEach(d => tone('sawtooth', 160, 120, 0.09, 0.08 * v, d)),
  wakeDad: v => tone('sawtooth', 120, 190, 0.3, 0.2 * v),
  wakeMom: v => tone('triangle', 260, 360, 0.25, 0.15 * v),
  thunder: v => { hiss(2.2, 0.5 * v, 'lowpass', 400, 0, 80); tone('sine', 60, 35, 1.8, 0.35 * v); },
};

// Real recordings for the sounds that matter most. Each returns false if its recording is not loaded yet.
const REAL = {
  bark: v => smp('bark', 1.0 * v),
  whine: v => smp('woofwoof', 0.45 * v, { rate: 1.08, lp: 2500 }),
  snore: v => smp('snore', 0.75 * v, { rate: 0.95 }),
  wakeDad: v => smp('snort', 0.9 * v) && smp('cough', 0.6 * v, { rate: 0.85, delay: 0.35 }),
  wakeMom: v => smp('cough', 0.5 * v, { rate: 1.25, lp: 3000 }),
  huh: v => smp('cough', 0.5 * v, { rate: 1.1 }),
  cry: v => smp('cry', 0.8 * v),
  creak: v => smp('creak', 0.85 * v),
  door: v => smp('door', 0.7 * v),
  doorSoft: v => smp('door', 0.18 * v, { rate: 1.2, lp: 1500 }),
  bonk: v => smp('thump', 0.9 * v, { rate: 0.8 }) && (tone('square', 330, 330, 0.12, 0.08 * v, 0.05), true),
  ow: v => smp('thump', 0.9 * v),
  crash: v => smp('glass', 0.8 * v) && smp('thump', 0.7 * v, { rate: 0.7 }),
  spray: v => smp('pssht', 0.8 * v),
  alarm: v => smp('alarm', 0.8 * v, { vary: 0 }),
  flush: v => smp('flush', 0.7 * v),
  water: v => smp('water', 0.5 * v),
  thunder: v => smp('thunder', 1.0 * v, { rate: 0.9 }),
  switch: v => smp('click', 0.9 * v),
  chuckle: v => smp('laugh', 0.45 * v, { rate: 0.8, lp: 2500 }),
  fridge: v => smp('thump', 0.35 * v, { rate: 0.6, lp: 600 }),
  step_c: v => smp('step', 0.22 * v, { rate: 0.85, lp: 500 }),
  step_w: v => smp('step', 0.45 * v, { rate: 1.0, lp: 2200 }),
  step_t: v => smp('step', 0.4 * v, { rate: 1.35, hp: 900 }),
  stepRun_c: v => smp('step', 0.4 * v, { rate: 0.8, lp: 700 }),
  stepRun_w: v => smp('step', 0.8 * v, { rate: 0.95 }),
  stepRun_t: v => smp('step', 0.75 * v, { rate: 1.3, hp: 600 }),
  stepSoft: v => smp('step', 0.08 * v, { rate: 0.9, lp: 400 }),
};
export function play(name, vol = 1) {
  if (!save.settings.sound || !ctx() || ac.state !== 'running') return;
  if (REAL[name]) { try { if (REAL[name](vol)) return; } catch (e) { /* fall back to the synth */ } }
  const f = SFX[name];
  if (f) { try { f(vol); } catch (e) { /* audio hiccup: never break the game */ } }
}

// A tiny sneaky loop: plucked bass, finger snaps and a tick that speeds up when someone is awake.
// Music. Calm: a slow, soft night tune (warm pad, a few bell notes, low heartbeat bass) over the crickets.
// Tense (someone is awake): the sneaky pizzicato chase, faster, with a ticking hat and a thump.
const CHORDS = [[147, 175, 220], [117, 147, 175], [98, 117, 147], [110, 139, 165]];   // Dm, Bb, Gm, A
const BASSL = [73, 0, 73, 110, 58, 0, 58, 87, 49, 0, 49, 73, 55, 0, 55, 69];
const TUNE = [587, 0, 698, 0, 659, 587, 0, 523, 466, 0, 587, 0, 554, 0, 440, 0, 587, 698, 880, 0, 784, 698, 659, 0, 622, 0, 587, 0, 554, 0, 0, 0];
const NIGHT = [880, 0, 0, 0, 698, 0, 0, 0, 0, 0, 784, 0, 0, 0, 0, 0, 659, 0, 0, 0, 587, 0, 0, 0, 0, 0, 554, 0, 0, 0, 0, 0];
function bell(f, vol, delay = 0) {   // a soft music-box note: sine plus a quiet octave, long decay
  tone('sine', f, f, 1.6, vol, delay, musicGain); tone('sine', f * 2, f * 2, 0.8, vol * 0.25, delay, musicGain);
}
function step() {
  if (!ac || ac.state !== 'running' || !save.settings.music) return;
  const i = beat++ % 32, bar = Math.floor(i / 8), hot = tense > 0.5;
  if (!hot) {
    if (i % 8 === 0) for (const f of CHORDS[bar]) pad(f, 2.6, 0.035);
    if (i % 8 === 0) tone('sine', CHORDS[bar][0] / 2, CHORDS[bar][0] / 2.05, 0.5, 0.35, 0, musicGain);
    if (i % 8 === 3) tone('sine', CHORDS[bar][0] / 2, CHORDS[bar][0] / 2.05, 0.4, 0.2, 0, musicGain);
    if (NIGHT[i] && Math.random() < 0.85) bell(NIGHT[i], 0.09);
    return;
  }
  if (i % 8 === 0) for (const f of CHORDS[bar]) pad(f, 1.3, 0.05);
  const b = BASSL[(i >> 1) % 16];
  if (i % 2 === 0 && b) pluck(b, 0.3, 0.45, 0, musicGain, 'triangle', 600);
  const n = TUNE[i];
  if (n) pluck(n * 2, 0.22, 0.12, 0, musicGain, 'triangle', 3000);
  if (i % 4 === 2) hiss(0.04, 0.05, 'bandpass', 2500);
  hiss(0.02, 0.03, 'highpass', 7000); if (i % 8 === 4) tone('sine', 60, 40, 0.2, 0.25, 0, musicGain);
}
export function music(on) {
  clearInterval(musicTimer); musicTimer = null;
  if (on && ctx()) ambience(true); else ambience(false);
  if (on && save.settings.music && ctx()) musicTimer = setInterval(step, tense > 0.5 ? 125 : 230);
}
export function setTense(v) { const was = tense > 0.5; tense = v; if (musicTimer && was !== (v > 0.5)) music(true); setAmbience(v > 0.5 ? 0.45 : 0.9); }

// Voices: no real words. Each speech bubble gets a little babble, pitched to the speaker.
// [low Hz, high Hz, wave, filter Hz, loudness]: grown-ups mumble low and soft, like someone half asleep
const VOICE = { dad: [78, 105, 'sawtooth', 520, 0.32], mom: [165, 215, 'sawtooth', 900, 0.24], mika: [230, 290, 'triangle', 1400, 0.2], baby: [420, 560, 'sine', 3000, 0.2], biscuit: [500, 700, 'sine', 3000, 0.2] };
export function voice(who, text, vol = 1) {
  if (!save.settings.sound || !ctx() || ac.state !== 'running' || vol < 0.05) return;
  const [lo, hi, type, cut, loud] = VOICE[who] || [200, 300, 'triangle', 1200, 0.2];
  const n = Math.min(9, Math.max(2, Math.round(String(text).length / 4)));
  for (let k = 0; k < n; k++) {
    const t = ac.currentTime + k * 0.11, f = lo + Math.random() * (hi - lo);
    const o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (k === n - 1 ? 0.82 : 1.04), t + 0.1);
    bp.type = 'lowpass'; bp.frequency.value = cut * (0.8 + Math.random() * 0.4); bp.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(loud * vol, t + 0.025); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(bp); bp.connect(g); g.connect(master); o.start(t); o.stop(t + 0.12);
  }
}
export function buzz(ms) { if (save.settings.haptics && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* no haptics */ } } }
