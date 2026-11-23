"""Cut CC0 clips from the ESC-50 dataset into short game sounds.

Put the ESC-50 .wav clips named below into raw/, then run from the repo root:
    python3 tools/cut-sounds.py
Writes app/assets/sfx/<name>.mp3. Credits are in docs/sound-credits.md. Needs numpy, scipy and ffmpeg.
"""
import json, subprocess, numpy as np, scipy.io.wavfile as wf, scipy.signal as ss
# name: (clip, start, end, kind)  kind: 'shot' trims to the event, 'loop' keeps the window and crossfades
SPEC = {
  'bark':     ('1-100032-A-0.wav', 2.1, 2.75, 'shot'),
  'woofwoof': ('2-118964-A-0.wav', 0.05, 1.1, 'shot'),
  'snore':    ('3-151557-A-28.wav', 1.8, 3.15, 'shot'),
  'snort':    ('2-52001-A-28.wav', 1.5, 1.9, 'shot'),
  'cough':    ('2-98676-A-24.wav', 0.0, 0.7, 'shot'),
  'cry':      ('3-151081-B-20.wav', 0.95, 1.8, 'shot'),
  'creak':    ('1-51805-C-33.wav', 0.05, 1.2, 'shot'),
  'door':     ('1-51805-A-33.wav', 0.75, 1.75, 'shot'),
  'thump':    ('1-103999-A-30.wav', 0.0, 0.21, 'shot'),
  'glass':    ('3-203371-A-39.wav', 0.0, 1.2, 'shot'),
  'pssht':    ('2-144031-A-34.wav', 0.1, 1.2, 'shot'),
  'alarm':    ('1-72195-B-37.wav', 0.0, 2.05, 'shot'),
  'flush':    ('3-112356-A-18.wav', 0.7, 3.6, 'shot'),
  'water':    ('1-51436-A-17.wav', 1.0, 3.0, 'shot'),
  'thunder':  ('3-144891-B-19.wav', 0.8, 4.8, 'shot'),
  'click':    ('1-81851-A-31.wav', 1.05, 1.35, 'shot'),
  'laugh':    ('4-167571-A-26.wav', 0.05, 1.4, 'shot'),
  'step':     ('1-51147-A-25.wav', 0.0, 0.4, 'shot'),
  'crickets': ('4-163697-A-13.wav', 0.0, 5.0, 'loop'),
  'tick':     ('2-141584-A-38.wav', 0.0, 5.0, 'loop'),
}
SR = 22050
for name, (f, a, b, kind) in SPEC.items():
    sr, d = wf.read('raw/' + f); d = d.astype(np.float64) / 32768
    d = ss.sosfilt(ss.butter(2, 70, 'hp', fs=sr, output='sos'), d)
    seg = d[int(a * sr):int(b * sr)]
    if kind == 'shot':
        env = np.sqrt(np.convolve(seg ** 2, np.ones(220) / 220, 'same'))
        on = np.argmax(env > env.max() * 0.08); on = max(0, on - int(0.008 * sr))
        last = len(env) - np.argmax(env[::-1] > env.max() * 0.03)
        seg = seg[on:min(len(seg), last + int(0.06 * sr))]
        fi, fo = int(0.004 * sr), min(len(seg) // 3, int(0.08 * sr))
        seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
    else:
        x = int(0.4 * sr); body = seg[:-x].copy(); tail = seg[-x:]
        body[:x] = body[:x] * np.linspace(0, 1, x) + tail * np.linspace(1, 0, x)
        seg = body
    seg = seg / (np.abs(seg).max() + 1e-9) * 0.89
    seg = ss.resample_poly(seg, SR, sr)
    wf.write('tmp.wav', SR, (seg * 32767).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'tmp.wav', '-ac', '1', '-b:a', '64k', f'app/assets/sfx/{name}.mp3'], check=True)
    print(f'{name:9s} {len(seg)/SR:4.2f}s')
