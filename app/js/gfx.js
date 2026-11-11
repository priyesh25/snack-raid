// Snack Raid: sprite loading and cached drawing. Sprites are SVG strings in sprites.js.
import { SPRITES } from './sprites.js';

const bitmaps = new Map();
let dpr = 1;
export function setDpr(v) { if (v !== dpr) { dpr = v; bitmaps.clear(); } }

export function spriteUrl(name) {
  const s = SPRITES[name];
  return s ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.svg) : '';
}

export function loadSprites() {
  return Promise.all(Object.keys(SPRITES).map(k => new Promise(res => {
    const s = SPRITES[k], img = new Image();
    img.onload = () => { s.img = img; res(); };
    img.onerror = () => res();
    img.src = spriteUrl(k);
  })));
}

// a pre-rendered bitmap of the sprite at this scale (vector sprites are slow to redraw every frame)
function bitmap(name, scale) {
  const key = name + '@' + scale.toFixed(3);
  let b = bitmaps.get(key);
  if (b) return b;
  const s = SPRITES[name];
  if (!s || !s.img) return null;
  b = document.createElement('canvas');
  b.width = Math.max(1, Math.ceil(s.w * scale * dpr));
  b.height = Math.max(1, Math.ceil(s.h * scale * dpr));
  b.getContext('2d').drawImage(s.img, 0, 0, b.width, b.height);
  bitmaps.set(key, b);
  return b;
}

// draw a sprite with its anchor on (x, y). o: { flip, alpha, rot, top }.
// top draws only the top fraction of the sprite (a head on a pillow) and treats y as the top edge.
export function spr(ctx, name, x, y, scale = 1, o = {}) {
  const s = SPRITES[name], b = bitmap(name, scale);
  if (!b) return;
  const w = s.w * scale, h = s.h * scale;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.top) ctx.drawImage(b, 0, 0, b.width, b.height * o.top, -s.ax * scale, 0, w, h * o.top); // y is the top edge
  else ctx.drawImage(b, -s.ax * scale, -s.ay * scale, w, h);
  ctx.restore();
}

export function has(name) { return !!SPRITES[name]; }
