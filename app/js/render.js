// Snack Raid: canvas rendering. World first, then the HUD in 1280 x 720 screen space.
import { T, SNACKS, GADGETS, LIGHTS, COUNTER, SPOTS } from './data.js';
import { spr } from './gfx.js';
import { VIEW, BTN, JOY_R } from './input.js';

const NAVY = '#141A3C', MILK = '#FFF6E5', GLOW = '#FFE08A', MOON = '#7FB4FF', ORANGE = '#FFA630', RED = '#FF5A4F', GREEN = '#4CCB7A', PINK = '#FF7EB6';
const S = 0.34; // sprite scale for people
const TAU = Math.PI * 2;

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}
function fillStroke(c, fill, lw = 3) { c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = NAVY; c.stroke(); } }
// a chunky block seen from above and a little from the front
function block(c, x, y, w, h, top, front, fh = 12, r = 9) {
  rr(c, x, y, w, h, r); fillStroke(c, front);
  rr(c, x, y, w, h - fh, r); fillStroke(c, top, 2.5);
}
function txt(c, s, x, y, size, fill = MILK, align = 'center', weight = 600, outline = 0) {
  c.font = `${weight} ${size}px Fredoka, sans-serif`; c.textAlign = align; c.textBaseline = 'middle';
  if (outline) { c.lineWidth = outline; c.strokeStyle = NAVY; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = fill; c.fillText(s, x, y);
}

// ------------------------------------------------------------ static floor and walls
function buildStatic(game) {
  const w = game.world, cv = document.createElement('canvas');
  cv.width = w.W * T; cv.height = w.H * T;
  const c = cv.getContext('2d');
  c.fillStyle = '#0D1130'; c.fillRect(0, 0, cv.width, cv.height);
  const isWall = (x, y) => !w.inside(x, y) || w.grid[y][x] === '#';
  for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
    const ch = w.grid[y][x], px = x * T, py = y * T;
    if (ch === '#') continue;
    const fl = w.allCarpet ? 'c' : ch;
    if (fl === 'c') {
      c.fillStyle = w.allCarpet && ch !== 'c' ? '#3E3A8C' : '#373380'; c.fillRect(px, py, T, T);
      c.fillStyle = 'rgba(255,255,255,0.045)';
      c.fillRect(px + 12, py + 14, 5, 5); c.fillRect(px + 42, py + 40, 5, 5); c.fillRect(px + 44, py + 10, 4, 4); c.fillRect(px + 14, py + 46, 4, 4);
    } else if (fl === 'w') {
      c.fillStyle = '#4A3E7A'; c.fillRect(px, py, T, T);
      c.strokeStyle = '#3D3268'; c.lineWidth = 2; c.beginPath();
      for (let k = 0; k <= 4; k++) { c.moveTo(px, py + k * 16); c.lineTo(px + T, py + k * 16); }
      for (let k = 0; k < 4; k++) { const sx = px + ((x * 3 + k * 2 + y) % 4) * 16 + 8; c.moveTo(sx, py + k * 16); c.lineTo(sx, py + k * 16 + 16); }
      c.stroke();
    } else if (fl === 's') {
      for (let k = 0; k < 2; k++) {
        c.fillStyle = '#5A4C92'; c.fillRect(px, py + k * 32, T, 32);
        c.fillStyle = '#6E60AE'; c.fillRect(px, py + k * 32, T, 7);
        c.fillStyle = '#3D3268'; c.fillRect(px, py + k * 32 + 29, T, 3);
      }
    } else {
      c.fillStyle = (x + y) % 2 ? '#2C3B7B' : '#324389'; c.fillRect(px, py, T, T);
      c.strokeStyle = '#263470'; c.lineWidth = 2; c.strokeRect(px + 1, py + 1, T - 2, T - 2);
    }
  }
  // walls: a lit front face where the wall has floor below it, a dark top everywhere else
  for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
    if (w.grid[y][x] !== '#') continue;
    let touches = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!isWall(x + dx, y + dy)) touches = true;
    if (!touches) continue;
    const px = x * T, py = y * T;
    if (!isWall(x, y + 1)) {
      c.fillStyle = '#3B4096'; c.fillRect(px, py, T, T);
      c.fillStyle = '#4A50B0'; c.fillRect(px, py + T - 9, T, 9);
      c.fillStyle = '#1B2057'; c.fillRect(px, py, T, 12);
    } else { c.fillStyle = '#1B2057'; c.fillRect(px, py, T, T); c.fillStyle = '#232966'; c.fillRect(px + 5, py + 5, T - 10, T - 10); }
  }
  // outlines between wall and floor
  c.strokeStyle = NAVY; c.lineWidth = 4; c.beginPath();
  for (let y = 0; y < w.H; y++) for (let x = 0; x < w.W; x++) {
    if (w.grid[y][x] === '#') continue;
    const px = x * T, py = y * T;
    if (isWall(x, y - 1)) { c.moveTo(px, py); c.lineTo(px + T, py); }
    if (isWall(x, y + 1)) { c.moveTo(px, py + T); c.lineTo(px + T, py + T); }
    if (isWall(x - 1, y)) { c.moveTo(px, py); c.lineTo(px, py + T); }
    if (isWall(x + 1, y)) { c.moveTo(px + T, py); c.lineTo(px + T, py + T); }
  }
  c.stroke();
  // windows on the top walls
  for (const [wx, wy] of [[3, 0], [9, 0], [15, 0], [23, 0], [3, 9], [20, 9]]) {
    rr(c, wx * T + 8, wy * T + 16, T - 16, T - 30, 6); fillStroke(c, '#0C1030');
    c.fillStyle = GLOW; c.beginPath(); c.arc(wx * T + 40, wy * T + 30, 6, 0, TAU); c.fill();
    c.strokeStyle = '#4A50B0'; c.lineWidth = 3; c.beginPath(); c.moveTo(wx * T + 32, wy * T + 16); c.lineTo(wx * T + 32, wy * T + 50); c.stroke();
  }
  for (const o of w.objs) if (o.t === 'rug') {
    rr(c, o.x * T + 8, o.y * T + 8, o.w * T - 16, o.h * T - 16, 22); c.fillStyle = o.col; c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1;
    c.lineWidth = 3; c.strokeStyle = 'rgba(20,26,60,0.6)'; c.stroke();
    rr(c, o.x * T + 20, o.y * T + 20, o.w * T - 40, o.h * T - 40, 14); c.strokeStyle = 'rgba(255,246,229,0.35)'; c.lineWidth = 2; c.stroke();
  }
  return cv;
}

// ------------------------------------------------------------ furniture
function drawObj(c, o, g, t) {
  const x = o.x * T + 4, y = o.y * T + 4, w = o.w * T - 8, h = o.h * T - 8, cx = x + w / 2;
  const p = g.p;
  switch (o.t) {
    case 'kidbed': case 'bed': case 'bigbed': {
      const kid = o.t === 'kidbed', big = o.t === 'bigbed';
      block(c, x, y, w, h, '#A9773F', '#6B4423', 10);
      rr(c, x + 6, y + 6, w - 12, h - 22, 8); fillStroke(c, MILK, 2.5);
      const pillows = big ? [x + w * 0.27, x + w * 0.73] : [cx];
      for (const px of pillows) { rr(c, px - 30, y + 10, 60, 30, 10); fillStroke(c, 'white', 2.5); }
      if (kid) {
        if (p.inBed) spr(c, g.o.sprite || 'kid_dino', cx, y + 2, 0.36, { top: 0.6 });
        else if (g.dummy) { c.beginPath(); c.ellipse(cx, y + 30, 22, 17, 0, 0, TAU); fillStroke(c, MILK, 2.5); c.fillStyle = NAVY; c.fillRect(cx - 9, y + 26, 4, 4); c.fillRect(cx + 5, y + 26, 4, 4); c.beginPath(); c.arc(cx, y + 32, 7, 0.2, Math.PI - 0.2); c.lineWidth = 2; c.stroke(); }
      }
      if (big) for (const id of ['mom', 'dad']) {
        const n = g.npc(id);
        if (n && n.state === 'asleep' && !n.sofa) spr(c, id === 'mom' ? 'mom_asleep' : 'dad', n.x, y - 4, 0.34, { top: 0.455 });
      }
      const by = y + (kid && p.inBed ? 54 : 48), col = kid ? '#4CCB7A' : big ? '#6C7BD9' : (o.col || MOON);
      rr(c, x + 4, by, w - 8, y + h - 12 - by, 10); fillStroke(c, col, 2.5);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 12, by + 10); c.lineTo(x + w - 12, by + 10); c.stroke();
      if (kid && g.dummy && p.inBed) txt(c, '+ dummy', cx, y + h - 26, 13, NAVY);
      break;
    }
    case 'crib': {
      block(c, x, y, w, h, '#FFF6E5', '#C9D1E4', 10);
      const n = g.npc('baby');
      if (n) spr(c, n.state === 'cry' ? 'baby_cry' : 'baby_asleep', n.x, y - 6, 0.36, { top: 0.66 });
      c.strokeStyle = NAVY; c.lineWidth = 2.5; c.beginPath();
      for (let k = 1; k < 8; k++) { const bx = x + w * k / 8; c.moveTo(bx, y + h - 26); c.lineTo(bx, y + h - 6); }
      c.stroke();
      break;
    }
    case 'toychest': block(c, x, y, w, h, '#FF7B6E', '#C93B32'); c.fillStyle = GLOW; c.beginPath(); c.arc(cx, y + h - 20, 5, 0, TAU); c.fill(); break;
    case 'desk': block(c, x, y, w, h, '#A9773F', '#6B4423'); rr(c, x + 10, y + 8, 22, 16, 3); fillStroke(c, MOON, 2); break;
    case 'nightstand': block(c, x, y, w, h, '#A9773F', '#6B4423'); c.beginPath(); c.arc(cx - 12, y + 18, 9, 0, TAU); fillStroke(c, '#59607A', 2); break;
    case 'armchair': block(c, x, y, w, h, o.col || PINK, 'rgba(20,26,60,0.55)', 12, 14); rr(c, x + 8, y + 16, w - 16, h - 34, 8); fillStroke(c, 'rgba(255,255,255,0.18)', 2); break;
    case 'shelf': case 'bookshelf': {
      block(c, x, y, w, h, '#8B5E3C', '#5A3A22', 8, 6);
      const cols = [RED, GLOW, GREEN, MOON, PINK, ORANGE];
      for (let k = 0, bx = x + 8; bx < x + w - 12; k++, bx += 10) { c.fillStyle = cols[k % 6]; c.fillRect(bx, y + 12 + (k % 3) * 2, 8, h - 34 - (k % 3) * 2); }
      c.strokeStyle = NAVY; c.lineWidth = 2; c.strokeRect(x + 6, y + 10, w - 12, h - 30);
      break;
    }
    case 'wardrobe': case 'pantry': {
      block(c, x, y, w, h, o.t === 'pantry' ? '#6B73A6' : '#8B5E3C', o.t === 'pantry' ? '#3B4096' : '#5A3A22', 8, 6);
      c.strokeStyle = NAVY; c.lineWidth = 2; c.beginPath();
      if (o.w > o.h) { c.moveTo(cx, y + 4); c.lineTo(cx, y + h - 10); } else { c.moveTo(x + 4, y + h / 2); c.lineTo(x + w - 4, y + h / 2); }
      c.stroke();
      c.fillStyle = GLOW; c.beginPath(); c.arc(cx + (o.w > o.h ? 8 : 0), y + h / 2 + (o.w > o.h ? 0 : 10), 3.5, 0, TAU); c.fill();
      break;
    }
    case 'dresser': block(c, x, y, w, h, '#A9773F', '#6B4423'); c.strokeStyle = NAVY; c.lineWidth = 2; c.beginPath(); for (let k = 1; k < 3; k++) { c.moveTo(x + 6, y + h * k / 3); c.lineTo(x + w - 6, y + h * k / 3); } c.stroke(); break;
    case 'sink': block(c, x, y, w, h, MILK, '#C9D1E4'); c.beginPath(); c.ellipse(cx, y + h / 2 - 6, 16, 11, 0, 0, TAU); fillStroke(c, MOON, 2); break;
    case 'toilet': block(c, x + 8, y, w - 16, 22, MILK, '#C9D1E4', 6, 5); c.beginPath(); c.ellipse(cx, y + 36, 17, 15, 0, 0, TAU); fillStroke(c, MILK); c.beginPath(); c.ellipse(cx, y + 36, 9, 8, 0, 0, TAU); fillStroke(c, MOON, 2); break;
    case 'tub': block(c, x, y, w, h, MILK, '#C9D1E4', 10, 16); rr(c, x + 8, y + 8, w - 16, h - 28, 12); fillStroke(c, MOON, 2); break;
    case 'chute': rr(c, x + 6, y + 6, w - 12, h - 12, 10); fillStroke(c, '#0C1030'); txt(c, 'CHUTE', cx, y + h / 2 - 8, 12, MOON, 'center', 700); txt(c, '↓', cx, y + h / 2 + 10, 22, MOON, 'center', 700); break;
    case 'basket': rr(c, x + 6, y + 14, w - 12, h - 18, 10); fillStroke(c, '#C99A62'); c.beginPath(); c.ellipse(cx, y + 16, w / 2 - 6, 11, 0, 0, TAU); fillStroke(c, '#8B5E3C'); c.beginPath(); c.ellipse(cx - 6, y + 12, 14, 9, 0, 0, TAU); fillStroke(c, PINK, 2); break;
    case 'plant': rr(c, x + 14, y + 30, w - 28, h - 34, 6); fillStroke(c, '#C9703C'); for (const [dx, dy, r] of [[0, 14, 17], [-13, 24, 12], [13, 24, 12]]) { c.beginPath(); c.arc(cx + dx, y + dy, r, 0, TAU); fillStroke(c, '#3FAE5A', 2.5); } break;
    case 'curtain': rr(c, x + 2, y - 26, w - 4, h + 22, 8); fillStroke(c, '#B93F7E'); c.strokeStyle = 'rgba(20,26,60,0.5)'; c.lineWidth = 2; c.beginPath(); for (let k = 1; k < 5; k++) { c.moveTo(x + w * k / 5, y - 20); c.lineTo(x + w * k / 5, y + h - 10); } c.stroke(); break;
    case 'dock': rr(c, x + 6, y + 30, w - 12, h - 34, 6); fillStroke(c, '#59607A'); c.fillStyle = GREEN; c.fillRect(cx - 4, y + 38, 8, 4); break;
    case 'sofa': {
      block(c, x, y, w, h, '#7B61FF', '#4A38B0', 12, 14);
      rr(c, x + 6, y + 4, w - 12, 18, 8); fillStroke(c, '#9483FF', 2);
      c.strokeStyle = NAVY; c.lineWidth = 2; c.beginPath(); for (let k = 1; k < o.w; k++) { c.moveTo(x + w * k / o.w, y + 22); c.lineTo(x + w * k / o.w, y + h - 14); } c.stroke();
      for (const n of g.npcs) if (n.sofa && n.state === 'asleep') { // Dad dozing in front of the TV
        spr(c, 'dad', n.x, y - 22, 0.34, { top: 0.455 });
        rr(c, n.x - 46, y + 28, 92, h - 44, 8); fillStroke(c, '#8FB8FF', 2.5);
      }
      break;
    }
    case 'coffee': block(c, x + 4, y + 8, w - 8, h - 14, '#A9773F', '#6B4423', 9); break;
    case 'tv': block(c, x, y + 12, w, h - 12, '#59607A', '#2C3050', 9); rr(c, x + w * 0.2, y - 18, w * 0.6, 44, 6); fillStroke(c, '#0C1030'); c.fillStyle = 'rgba(127,180,255,0.25)'; c.fillRect(x + w * 0.2 + 8, y - 12, 26, 6); break;
    case 'table': {
      block(c, x + 2, y + 4, w - 4, h - 10, '#B98448', '#6B4423', 16, 16);
      rr(c, x + w * 0.2, y + 12, w * 0.6, h - 44, 8); fillStroke(c, 'rgba(255,246,229,0.5)', 2);
      break;
    }
    case 'counter': {
      block(c, x, y, w, h, '#7C84B8', '#3B4096', 22, 6);
      c.strokeStyle = NAVY; c.lineWidth = 2; c.beginPath(); for (let k = 1; k < o.w; k++) { c.moveTo(x + w * k / o.w, y + h - 20); c.lineTo(x + w * k / o.w, y + h - 2); } c.stroke();
      const sx = (COUNTER.sink + 0.5) * T; c.beginPath(); c.ellipse(sx, y + 18, 20, 11, 0, 0, TAU); fillStroke(c, '#C9D1E4', 2);
      c.strokeStyle = NAVY; c.lineWidth = 4; c.beginPath(); c.moveTo(sx, y + 4); c.lineTo(sx, y + 14); c.stroke();
      spr(c, 'jar', (COUNTER.jar + 0.5) * T, y + 34, g.jar.snacks.length ? 0.42 : 0.42, { alpha: g.jar.snacks.length ? 1 : 0.45 });
      spr(c, 'microwave', (COUNTER.microwave + 0.5) * T - 30, y + 34, 0.36);
      if (g.shh && g.shh.type === 'micro') txt(c, '0:' + String(Math.max(0, Math.ceil(g.shh.left ?? 10))).padStart(2, '0'), (COUNTER.microwave + 0.5) * T + 21, y + 7, 9, '#4DE1B0', 'center', 700);
      break;
    }
    case 'fridge': spr(c, g.fridge.open ? 'fridge_open' : 'fridge', o.x * T + 2, (o.y + 1) * T - 4, 0.52); break;
    case 'trash': rr(c, x + 10, y + 14, w - 20, h - 18, 8); fillStroke(c, '#8E9AAF'); c.beginPath(); c.ellipse(cx, y + 16, w / 2 - 9, 9, 0, 0, TAU); fillStroke(c, '#59607A'); break;
    case 'washer': block(c, x, y, w, h, MILK, '#C9D1E4'); c.beginPath(); c.arc(cx, y + h / 2 - 2, 15, 0, TAU); fillStroke(c, MOON, 2.5); break;
  }
  if (p.hidden && p.hidden.obj === o) { // two eyes peeking out
    const ey = o.y * T + o.h * T / 2;
    for (const dx of [-9, 9]) { c.beginPath(); c.ellipse(cx + dx, ey, 6, 7, 0, 0, TAU); fillStroke(c, 'white', 2); c.fillStyle = NAVY; c.beginPath(); c.arc(cx + dx + Math.sin(t * 2) * 2, ey + 1, 3, 0, TAU); c.fill(); }
  }
}

function drawDoor(c, d) {
  const x = d.x * T, y = d.y * T;
  if (!d.open) {
    rr(c, x + 5, y + 4, T - 10, T - 6, 5); fillStroke(c, '#A9773F');
    rr(c, x + 13, y + 12, T - 26, T - 26, 4); c.strokeStyle = 'rgba(20,26,60,0.45)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = GLOW; c.beginPath(); c.arc(x + T - 16, y + T / 2 + 4, 4, 0, TAU); c.fill();
  } else { rr(c, x + 1, y + 6, 10, T + 10, 4); fillStroke(c, '#A9773F'); }
  if (d.oiled) txt(c, 'oiled', x + T / 2, y - 6, 12, GREEN, 'center', 700, 3);
}

// ------------------------------------------------------------ effects on the floor
function visionPoly(g, n, range) {
  const w = g.world, half = (n.cone / 2) * Math.PI / 180, pts = [[n.x, n.y]];
  for (let i = 0; i <= 20; i++) {
    const a = n.dir - half + (2 * half) * i / 20, dx = Math.cos(a), dy = Math.sin(a);
    let d = 0;
    for (; d < range; d += 8) {
      const tx = Math.floor((n.x + dx * (d + 8)) / T), ty = Math.floor((n.y + dy * (d + 8)) / T);
      if (!w.inside(tx, ty) || w.tall[ty][tx]) break;
      const dr = w.doorAt(tx, ty); if (dr && !dr.open) break;
    }
    pts.push([n.x + dx * d, n.y + dy * d]);
  }
  return pts;
}
function poly(c, pts) { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); }

function drawZs(c, x, y, z, t) {
  for (let i = 0; i < z; i++) {
    const s = 15 + i * 3.5, ox = 14 + i * 13 + Math.sin(t * 1.5 + i) * 2, oy = -i * 17 + Math.cos(t * 1.3 + i) * 2;
    txt(c, 'Z', x + ox, y + oy, s, MILK, 'center', 700, 4);
  }
}
function drawEye(c, x, y, v) {
  c.beginPath(); c.arc(x, y, 15, 0, TAU); c.fillStyle = 'rgba(20,26,60,0.85)'; c.fill();
  c.beginPath(); c.moveTo(x, y); c.arc(x, y, 15, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, v)); c.closePath(); c.fillStyle = v > 0.6 ? RED : GLOW; c.fill();
  c.beginPath(); c.ellipse(x, y, 9, 6, 0, 0, TAU); c.fillStyle = 'white'; c.fill(); c.lineWidth = 2; c.strokeStyle = NAVY; c.stroke();
  c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fillStyle = NAVY; c.fill();
}

// ------------------------------------------------------------ the renderer
export class Renderer {
  constructor(canvas) { this.cv = canvas; this.c = canvas.getContext('2d'); this.static = null; this.forGame = null; this.cam = { x: 0, y: 0, z: 1 }; }

  frame(g, inp, t, extra = {}) {
    const c = this.c;
    if (this.forGame !== g) { this.static = buildStatic(g); this.forGame = g; this.cam.z = 1; }
    const W = VIEW.w, H = VIEW.h, w = g.world, p = g.p;
    const mapW = w.W * T, mapH = w.H * T;
    const peek = extra.peek;
    const zTarget = peek ? Math.min(W / mapW, H / mapH) : 1;
    this.cam.z += (zTarget - this.cam.z) * 0.2;
    const z = this.cam.z, vw = W / z, vh = H / z;
    let cx = p.x - vw / 2, cy = p.y - vh / 2;
    cx = vw >= mapW ? (mapW - vw) / 2 : Math.max(0, Math.min(mapW - vw, cx));
    cy = vh >= mapH ? (mapH - vh) / 2 : Math.max(0, Math.min(mapH - vh, cy));
    this.cam.x += (cx - this.cam.x) * (peek ? 1 : 0.18); this.cam.y += (cy - this.cam.y) * (peek ? 1 : 0.18);
    if (Math.abs(cx - this.cam.x) > 400) { this.cam.x = cx; this.cam.y = cy; }
    c.fillStyle = '#0D1130'; c.fillRect(0, 0, W, H);
    c.save(); c.scale(z, z); c.translate(-this.cam.x, -this.cam.y);
    c.drawImage(this.static, 0, 0);
    this.floorFx(c, g, t);
    this.sorted(c, g, t);
    this.overlays(c, g, t);
    c.restore();
    // cool night tint and vignette
    const vg = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, 'rgba(10,13,38,0)'); vg.addColorStop(1, 'rgba(10,13,38,0.55)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    this.hud(c, g, inp, t, extra);
  }

  floorFx(c, g, t) {
    const w = g.world, see = g.goggles > 0 || g.cheat.xray;
    // light zones
    if (!g.dream) {
      for (const l of LIGHTS) {
        c.fillStyle = l.col === '#FFA630' ? 'rgba(255,166,48,0.20)' : 'rgba(127,180,255,0.16)';
        if (l.kind === 'circle') { c.beginPath(); c.arc(l.x * T, l.y * T, l.r * T, 0, TAU); c.fill(); c.beginPath(); c.arc(l.x * T, l.y * T, l.r * T * 0.55, 0, TAU); c.fill(); }
        else { rr(c, l.x * T, l.y * T, l.w * T, l.h * T, 18); c.fill(); }
      }
      const mk = g.npc('mika');
      if (mk && mk.state !== 'asleep' && w.doors.find(d => d.id === 'mika').open) { c.fillStyle = 'rgba(255,224,138,0.18)'; rr(c, 21 * T, T, 5 * T, 4 * T, 10); c.fill(); rr(c, 21.6 * T, 5 * T, 3.8 * T, 3 * T, 30); c.fill(); }
      if (g.fridge.open) {
        c.fillStyle = 'rgba(255,224,138,0.30)';
        poly(c, [[11 * T, 11 * T], [13 * T, 11 * T], [13 * T, 15 * T], [8.2 * T, 15 * T]]); c.fill();
        if (g.fridge.byDad) { c.fillStyle = 'rgba(255,224,138,0.12)'; c.fillRect(T, 10 * T, 12 * T, 8 * T); }
      }
    }
    // creaky boards you know about
    for (const k of g.creaks.values()) {
      if (!k.known && !see) continue;
      const x = k.x * T, y = k.y * T;
      c.strokeStyle = k.oiled ? 'rgba(76,203,122,0.9)' : k.known ? 'rgba(255,166,48,0.95)' : 'rgba(255,166,48,0.55)'; c.lineWidth = 3; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(x + 12, y + 18); c.lineTo(x + 26, y + 30); c.lineTo(x + 20, y + 38); c.lineTo(x + 40, y + 46); c.lineTo(x + 52, y + 40); c.stroke();
    }
    for (const q of g.puddles) { c.beginPath(); c.ellipse(q.x, q.y, 22, 13, 0, 0, TAU); c.fillStyle = 'rgba(255,126,182,0.55)'; c.fill(); }
    c.fillStyle = '#D9A066'; for (const q of g.crumbs) { c.fillRect(q.x - 5, q.y - 2, 4, 4); c.fillRect(q.x + 2, q.y + 2, 4, 4); c.fillRect(q.x - 1, q.y - 6, 3, 3); }
    for (const q of g.treats) spr(c, 'gad_biscuits', q.x, q.y, 0.22);
    for (const q of g.coins) spr(c, 'ui_coin', q.x, q.y + Math.sin(t * 4 + q.x) * 3, 0.3);
    for (const q of g.decoys) spr(c, 'gad_decoy', q.x + Math.sin(t * 30) * 2, q.y, 0.3);
    // the secret stash sparkles through the goggles
    const st = g.lv.stash && w.obj(g.lv.stash);
    if (st && see && !g.stats.wrapper) { const sx = (st.x + st.w / 2) * T, sy = (st.y + st.h / 2) * T; spr(c, 'ui_wrapper', sx, sy - 30 + Math.sin(t * 4) * 4, 0.3); }
    // cover sound: Dad's snore
    const dad = g.npc('dad');
    if (dad && g.snoreOn) {
      const ph = (g.time % 6) / 2;
      c.beginPath(); c.arc(dad.x, dad.y, 6 * T, 0, TAU); c.fillStyle = `rgba(127,180,255,${0.10 * (1 - ph * 0.5)})`; c.fill();
      for (const f of [0.35, 0.7, 1]) { c.beginPath(); c.arc(dad.x, dad.y, 6 * T * Math.min(1, ph * 1.2) * f, 0, TAU); c.strokeStyle = `rgba(127,180,255,${0.5 * (1 - ph)})`; c.lineWidth = 4; c.stroke(); }
    }
    for (const cv of g.covers) if (g.time < cv.until) { c.beginPath(); c.arc(cv.x, cv.y, cv.reach * T, 0, TAU); c.fillStyle = 'rgba(127,180,255,0.10)'; c.fill(); }
    // vision cones
    for (const n of g.npcs) {
      if (n.cone == null || n.state === 'asleep' || n.state === 'rising') continue;
      if (n.kind === 'mika' && n.cool > 0) continue;
      const hot = n.eye > 0 ? Math.min(1, n.eye) : 0;
      const col = hot ? `255,${Math.round(224 - 134 * hot)},${Math.round(138 - 59 * hot)}` : '255,224,138';
      poly(c, visionPoly(g, n, 5 * T)); c.fillStyle = `rgba(${col},0.10)`; c.fill();
      poly(c, visionPoly(g, n, 2 * T)); c.fillStyle = `rgba(${col},${0.22 + hot * 0.2})`; c.fill(); c.strokeStyle = `rgba(${col},0.55)`; c.lineWidth = 2; c.stroke();
    }
    // noise rings
    for (const r of g.rings) {
      const k = Math.min(1, r.t / 0.45), rad = r.r * (1 - (1 - k) * (1 - k));
      c.beginPath(); c.ellipse(r.x, r.y, rad, rad * 0.86, 0, 0, TAU);
      c.strokeStyle = r.covered ? MOON : r.col; c.globalAlpha = Math.max(0, 1 - r.t / 0.9) * (r.covered ? 0.6 : 0.9); c.lineWidth = r.col === '#FF5A4F' ? 6 : 4; c.stroke(); c.globalAlpha = 1;
    }
  }

  sorted(c, g, t) {
    const list = [], p = g.p, w = g.world;
    for (const o of w.objs) if (o.t !== 'rug') list.push([o.t === 'chute' || o.t === 'dock' ? 0 : (o.y + o.h) * T - 2, () => drawObj(c, o, g, t)]);
    for (const d of w.doors) list.push([(d.y + 1) * T - 1, () => drawDoor(c, d)]);
    for (const b of g.bricks) list.push([(b.y + 1) * T - 24, () => spr(c, 'brick_' + b.col, (b.x + 0.5) * T, (b.y + 0.5) * T + 14, 0.62)]);
    g.items.forEach(it => { if (!it.taken) list.push([it.y + 2 * T + 40, () => { const bob = Math.sin(t * 3 + it.x) * 2; if (it.id === 'donut') { c.beginPath(); c.arc(it.x, it.y, 30, 0, TAU); c.fillStyle = 'rgba(255,224,138,0.3)'; c.fill(); } spr(c, 'snack_' + it.id, it.x, it.y - 6 + bob, 0.36); }]); });
    if (g.plate) list.push([g.plate.y + 2 * T + 40, () => { c.beginPath(); c.ellipse(g.plate.x, g.plate.y + 4, 24, 10, 0, 0, TAU); fillStroke(c, 'white', 2.5); if (g.plate.has) spr(c, 'snack_cake', g.plate.x, g.plate.y - 8, 0.34); }]);
    for (const n of g.npcs) list.push([n.y + 16, () => this.npc(c, g, n, t)]);
    if (!p.inBed && !p.hidden) list.push([p.y + 16 + (p.riding ? 6 : 0), () => this.kid(c, g, t)]);
    list.sort((a, b) => a[0] - b[0]);
    for (const [, fn] of list) fn();
  }

  kid(c, g, t) {
    const p = g.p, moving = p.mode !== 'idle' || p.slide;
    const f = p.slide ? 0 : p.mode === 'run' ? 19 : p.mode === 'walk' ? 12 : 7;
    const bob = moving ? Math.abs(Math.sin(t * f)) * (p.mode === 'tiptoe' ? -3 : -5) : 0;
    const rot = p.slide ? 0.28 * p.face : moving ? Math.sin(t * f) * 0.07 : p.stun > 0 ? Math.sin(t * 40) * 0.12 : 0;
    spr(c, g.o.sprite || 'kid_dino', p.x, p.y + 18 + bob, S, { flip: p.face < 0, rot });
    const n = p.carry.length;
    p.carry.forEach((id, i) => spr(c, 'snack_' + id, p.x + (i - (n - 1) / 2) * 34, p.y - 96 + bob + Math.sin(t * 5 + i) * 2, 0.3));
  }

  npc(c, g, n, t) {
    if (n.kind === 'adult') { if (n.state !== 'asleep') spr(c, n.id === 'dad' ? 'dad_awake' : 'mom', n.x, n.y + 18 + (n.state === 'goto' ? Math.abs(Math.sin(t * 9)) * -4 : 0), S, { flip: Math.cos(n.dir) < -0.2 }); }
    else if (n.kind === 'mika') {
      if (n.state === 'asleep') return;
      c.beginPath(); c.arc(n.x + 12, n.y - 30, 34, 0, TAU); c.fillStyle = 'rgba(159,216,255,0.16)'; c.fill();
      spr(c, 'mika', n.x, n.y + 18 + (n.state === 'goto' ? Math.abs(Math.sin(t * 9)) * -4 : 0), S, { flip: Math.cos(n.dir) < -0.2 });
    } else if (n.kind === 'dog') {
      if (n.state === 'asleep') { c.beginPath(); c.ellipse(n.x, n.y + 10, 44, 20, 0, 0, TAU); fillStroke(c, '#B93F7E'); spr(c, 'biscuit_sleep', n.x, n.y + 16, 0.36); }
      else { const hop = n.state === 'beg' ? Math.abs(Math.sin(t * 10)) * -6 : n.state === 'eat' ? Math.sin(t * 14) * 1.5 : 0; spr(c, 'biscuit', n.x, n.y + 16 + hop, 0.33, { flip: Math.cos(n.dir) < -0.2 }); }
    } else if (n.kind === 'dusty') {
      spr(c, n.angry > 0 ? 'dusty_angry' : 'dusty', n.x + (n.state === 'run' && n.pause <= 0 ? Math.sin(t * 40) * 0.8 : 0), n.y + 14, 0.46);
      if (g.p.riding === n) this.kid(c, g, t);
    }
  }

  overlays(c, g, t) {
    const p = g.p;
    for (const n of g.npcs) {
      if (n.kind === 'dusty') continue;
      const hx = n.x, hy = n.y - (n.kind === 'dog' ? 40 : n.kind === 'baby' ? 50 : n.state === 'asleep' ? 50 : 100);
      if (n.z != null && n.state === 'asleep') {
        if (n.z === 1) txt(c, '?', hx - 4, hy - 4, 30, ORANGE, 'center', 700, 5);
        drawZs(c, hx, hy, n.z, t);
      } else if (n.state === 'cry') txt(c, 'WAAH!', hx, hy - 8 + Math.sin(t * 20) * 2, 20, RED, 'center', 700, 5);
      else if (n.state === 'eat') txt(c, 'nom nom', hx, hy, 15, MILK, 'center', 600, 4);
      else if (n.kind === 'dog' && n.state === 'beg') { c.fillStyle = 'rgba(20,26,60,0.8)'; rr(c, hx - 30, hy - 26, 60, 12, 6); c.fill(); c.fillStyle = RED; rr(c, hx - 28, hy - 24, 56 * Math.max(0, 1 - n.whine / 3), 8, 4); c.fill(); }
      else if (n.kind === 'dog' && n.state === 'follow') txt(c, '♥', hx, hy - 6, 22, PINK, 'center', 700, 4);
      else if (n.kind === 'adult' || n.kind === 'mika') {
        if (n.kind === 'mika' && n.state === 'asleep') continue;
        if (n.eye > 0) drawEye(c, hx, hy - 12, n.eye);
        else if (n.kind === 'adult') txt(c, n.state === 'rising' ? '!?' : n.state === 'look' ? '?' : '!', hx, hy - 10, 30, n.state === 'look' ? ORANGE : RED, 'center', 700, 5);
        if (n.kind === 'mika' && n.owed > 0) txt(c, 'snack! ' + Math.ceil(n.owed) + 's', hx, hy - 38, 15, GLOW, 'center', 700, 4);
      }
    }
    // melt and fizz meters over the raider
    if (!p.inBed && !p.hidden) {
      let my = p.y - 122;
      const bar = (v, col, label) => { c.fillStyle = 'rgba(20,26,60,0.85)'; rr(c, p.x - 34, my, 68, 11, 5); c.fill(); c.fillStyle = col; rr(c, p.x - 32, my + 2, 64 * Math.max(0, Math.min(1, v)), 7, 3); c.fill(); txt(c, label, p.x, my - 9, 12, MILK, 'center', 600, 3); my -= 26; };
      if (p.carry.includes('icecream') && !g.cheat.easysnacks) bar(p.melt / 45, MOON, 'melting');
      if (p.carry.includes('soda') && p.fizz > 0.1) bar(p.fizz / 3, RED, 'fizz');
    }
    for (const f of g.floaters) txt(c, f.text, f.x, f.y, 20, f.col, 'center', 700, 5);
  }

  // ------------------------------------------------------------ HUD
  hud(c, g, inp, t, extra) {
    const W = VIEW.w, H = VIEW.h, p = g.p, lv = g.lv;
    // clock
    rr(c, 18, 16, 236, 76, 22); c.fillStyle = 'rgba(15,20,51,0.9)'; c.fill(); c.lineWidth = 3; c.strokeStyle = NAVY; c.stroke();
    c.beginPath(); c.arc(54, 46, 17, 0, TAU); c.fillStyle = GLOW; c.fill(); c.beginPath(); c.arc(62, 40, 14, 0, TAU); c.fillStyle = 'rgba(15,20,51,1)'; c.fill();
    txt(c, g.clock(), 86, 43, 34, MILK, 'left', 700);
    const k = Math.min(1, g.time / g.nightLen);
    rr(c, 86, 68, 150, 9, 4); c.fillStyle = '#2B2F77'; c.fill(); rr(c, 86, 68, Math.max(6, 150 * k), 9, 4); c.fillStyle = k > 0.8 ? RED : GLOW; c.fill();
    // craving list
    if (!g.dream) {
      const want = [lv.craving, ...lv.extras], cw = 76, x0 = W / 2 - (want.length * cw) / 2;
      rr(c, x0 - 14, 12, want.length * cw + 28, 84, 22); c.fillStyle = 'rgba(15,20,51,0.9)'; c.fill(); c.lineWidth = 3; c.strokeStyle = NAVY; c.stroke();
      want.forEach((id, i) => {
        const x = x0 + i * cw + cw / 2, y = 54, done = g.delivered.includes(id), held = p.carry.includes(id);
        c.beginPath(); c.arc(x, y, 30, 0, TAU); c.fillStyle = done ? 'rgba(76,203,122,0.35)' : '#232863'; c.fill(); c.lineWidth = 3; c.strokeStyle = i === 0 ? GLOW : held ? MILK : '#4A4FA8'; c.stroke();
        spr(c, 'snack_' + id, x, y, 0.4, { alpha: done || held ? 1 : 0.75 });
        if (done) { c.beginPath(); c.arc(x + 20, y + 20, 11, 0, TAU); c.fillStyle = GREEN; c.fill(); c.lineWidth = 2.5; c.strokeStyle = NAVY; c.stroke(); txt(c, '✓', x + 20, y + 21, 14, NAVY, 'center', 700); }
        if (i === 0) txt(c, 'CRAVING', x, 20, 11, GLOW, 'center', 700, 3);
      });
    } else txt(c, 'SUGAR DREAM  ·  coins: ' + g.stats.coinsFound, W / 2, 46, 28, GLOW, 'center', 700, 6);
    // toasts and the tip banner
    let ty = 118;
    if (g.tip) { c.font = '600 21px Fredoka, sans-serif'; const tw = Math.min(900, c.measureText(g.tip.text).width + 44); rr(c, W / 2 - tw / 2, ty - 18, tw, 38, 19); c.fillStyle = 'rgba(127,180,255,0.94)'; c.fill(); txt(c, g.tip.text, W / 2, ty + 1, tw >= 900 ? 17 : 21, NAVY, 'center', 600); ty += 46; }
    for (const q of g.toasts) { c.globalAlpha = Math.min(1, q.t * 2); c.font = '600 20px Fredoka, sans-serif'; const tw = c.measureText(q.text).width + 40; rr(c, W / 2 - tw / 2, ty - 17, tw, 36, 18); c.fillStyle = 'rgba(255,246,229,0.95)'; c.fill(); txt(c, q.text, W / 2, ty + 1, 20, NAVY, 'center', 600); c.globalAlpha = 1; ty += 42; }
    // carry slots
    const sw = 58, sx0 = W / 2 - (g.slots * sw) / 2; let used = 0;
    for (let i = 0; i < g.slots; i++) { rr(c, sx0 + i * sw + 4, H - 66, sw - 8, 50, 14); c.fillStyle = 'rgba(15,20,51,0.8)'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#4A4FA8'; c.stroke(); }
    for (const id of p.carry) { const n = SNACKS[id].slots; spr(c, 'snack_' + id, sx0 + used * sw + (n * sw) / 2, H - 41, 0.36); used += n; }
    // gadget state strip
    const notes = [];
    if (g.muffArmed) notes.push('muffler armed'); if (g.dummy) notes.push('dummy in bed'); if (g.goggles > 0) notes.push('goggles ' + Math.ceil(g.goggles) + 's');
    if (notes.length) txt(c, notes.join('  ·  '), W / 2, H - 80, 15, GREEN, 'center', 600, 4);
    // edge arrows to anyone awake
    for (const n of g.npcs) {
      if (n.kind !== 'adult' || n.state === 'asleep') continue;
      const sx = (n.x - this.cam.x) * this.cam.z, sy = (n.y - this.cam.y) * this.cam.z;
      if (sx > 30 && sx < W - 30 && sy > 100 && sy < H - 30) continue;
      const a = Math.atan2(sy - H / 2, sx - W / 2), ex = Math.max(60, Math.min(W - 60, W / 2 + Math.cos(a) * 560)), ey = Math.max(130, Math.min(H - 110, H / 2 + Math.sin(a) * 300));
      c.save(); c.translate(ex, ey); c.rotate(a); c.beginPath(); c.moveTo(22, 0); c.lineTo(-8, -14); c.lineTo(-8, 14); c.closePath(); fillStroke(c, RED); c.restore();
      txt(c, n.id === 'mom' ? 'MOM' : 'DAD', ex - Math.cos(a) * 34, ey - Math.sin(a) * 34, 14, RED, 'center', 700, 4);
    }
    if (extra.hideControls) return;
    const bx = b => inp.bx(b);
    // joystick
    const j = inp.joy, jx = j ? j.ox : (inp.lefty ? W - 150 : 150), jy = j ? j.oy : H - 150;
    c.globalAlpha = j ? 0.9 : 0.35;
    c.beginPath(); c.arc(jx, jy, JOY_R, 0, TAU); c.fillStyle = 'rgba(255,246,229,0.10)'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,246,229,0.6)'; c.stroke();
    c.beginPath(); c.arc(jx, jy, JOY_R * 0.4, 0, TAU); c.strokeStyle = 'rgba(76,203,122,0.8)'; c.setLineDash([6, 6]); c.stroke();
    c.beginPath(); c.arc(jx, jy, JOY_R * 0.8, 0, TAU); c.strokeStyle = 'rgba(255,166,48,0.8)'; c.stroke(); c.setLineDash([]);
    let kx = jx, ky = jy; if (j) { const dx = j.x - j.ox, dy = j.y - j.oy, m = Math.hypot(dx, dy), q = m > JOY_R ? JOY_R / m : 1; kx += dx * q; ky += dy * q; }
    c.beginPath(); c.arc(kx, ky, 34, 0, TAU); c.fillStyle = 'rgba(255,246,229,0.9)'; c.fill(); c.lineWidth = 3; c.strokeStyle = NAVY; c.stroke(); c.globalAlpha = 1;
    if (p.mode !== 'idle' && !g.dream) txt(c, p.mode.toUpperCase(), jx, jy - JOY_R - 18, 17, p.mode === 'tiptoe' ? GREEN : p.mode === 'walk' ? ORANGE : RED, 'center', 700, 4);
    // action button
    const a = BTN.action, ax = bx(a), ctx = g.shh ? { label: g.shh.type === 'micro' ? 'STOP' : g.shh.type === 'sweep' ? 'TAP' : 'HOLD' } : g.ctx;
    c.beginPath(); c.arc(ax, a.y, a.r, 0, TAU); c.fillStyle = ctx ? GREEN : 'rgba(76,203,122,0.25)'; c.fill(); c.lineWidth = 5; c.strokeStyle = NAVY; c.stroke();
    if (ctx) {
      const words = ctx.label.split(' '), lines = []; let cur = '';
      for (const wd of words) { if ((cur + ' ' + wd).trim().length > 9 && cur) { lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); }
      lines.push(cur);
      const fs = lines.length > 2 ? 17 : 21;
      lines.forEach((ln, i) => txt(c, ln, ax, a.y + (i - (lines.length - 1) / 2) * (fs + 2), fs, NAVY, 'center', 700));
      if (ctx.sub) txt(c, ctx.sub, ax, a.y - a.r - 14, 14, MILK, 'center', 600, 4);
    }
    if (g.hold) { c.beginPath(); c.arc(ax, a.y, a.r + 8, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, g.hold.t / g.hold.need)); c.lineWidth = 8; c.strokeStyle = GLOW; c.stroke(); }
    if (g.ctx2 && !g.shh) { const b = BTN.action2; c.beginPath(); c.arc(bx(b), b.y, b.r, 0, TAU); c.fillStyle = ORANGE; c.fill(); c.lineWidth = 4; c.strokeStyle = NAVY; c.stroke(); txt(c, g.ctx2.label, bx(b), b.y, 17, NAVY, 'center', 700); }
    // gadget buttons
    g.loadout.forEach((id, i) => {
      const b = BTN['g' + i], x = bx(b), gd = GADGETS[id], n = g.charges[id], dead = gd.uses && n <= 0 && !g.cheat.gadgetgalore || p.carry.includes('cake');
      c.beginPath(); c.arc(x, b.y, b.r, 0, TAU); c.fillStyle = dead ? 'rgba(35,40,99,0.6)' : '#232863'; c.fill(); c.lineWidth = 4; c.strokeStyle = id === 'muffler' && g.muffArmed || id === 'dummy' && g.dummy ? GREEN : MILK; c.stroke();
      spr(c, 'gad_' + id, x, b.y, 0.5, { alpha: dead ? 0.35 : 1 });
      if (gd.uses) { c.beginPath(); c.arc(x + 32, b.y - 32, 14, 0, TAU); c.fillStyle = dead ? '#59607A' : GLOW; c.fill(); c.lineWidth = 3; c.strokeStyle = NAVY; c.stroke(); txt(c, g.cheat.gadgetgalore ? '∞' : String(Math.max(0, n)), x + 32, b.y - 31, 16, NAVY, 'center', 700); }
    });
    // peek and pause
    for (const [key, sym] of [['peek', 'MAP'], ['pause', 'II']]) { const b = BTN[key]; c.beginPath(); c.arc(bx(b), b.y, b.r, 0, TAU); c.fillStyle = 'rgba(15,20,51,0.9)'; c.fill(); c.lineWidth = 3; c.strokeStyle = MILK; c.stroke(); txt(c, sym, bx(b), b.y + 1, key === 'peek' ? 15 : 20, MILK, 'center', 700); }
    if (extra.peek) txt(c, 'Peeking. You cannot move.', W / 2, H - 110, 20, MILK, 'center', 600, 5);
    if (g.shh) this.shh(c, g, t);
  }

  shh(c, g, t) {
    const s = g.shh, W = VIEW.w, x = W / 2 - 260, y = 470, w = 520;
    rr(c, x - 24, y - 70, w + 48, 150, 26); c.fillStyle = 'rgba(15,20,51,0.94)'; c.fill(); c.lineWidth = 4; c.strokeStyle = GLOW; c.stroke();
    const zone = (a, b, col) => { c.fillStyle = col; rr(c, x + w * a, y, w * (b - a), 34, 8); c.fill(); };
    if (s.type === 'release') {
      txt(c, 'Shh. Hold to ease the fridge open. Let go in the green.', W / 2, y - 38, 20, MILK);
      rr(c, x, y, w, 34, 10); c.fillStyle = '#232863'; c.fill(); zone(0.68, 0.92, 'rgba(76,203,122,0.55)'); zone(0.77, 0.86, GREEN); zone(0.92, 1, 'rgba(255,90,79,0.7)');
      rr(c, x, y, Math.max(8, w * s.p), 34, 10); c.fillStyle = 'rgba(255,246,229,0.85)'; c.fill();
    } else if (s.type === 'sweep') {
      txt(c, 'Shh. Lift the lid. Tap when the marker is in the green.', W / 2, y - 38, 20, MILK);
      rr(c, x, y, w, 34, 10); c.fillStyle = '#232863'; c.fill(); zone(0.37, 0.63, 'rgba(76,203,122,0.55)'); zone(0.455, 0.545, GREEN);
      c.fillStyle = MILK; rr(c, x + w * s.p - 6, y - 8, 12, 50, 6); c.fill(); c.lineWidth = 3; c.strokeStyle = NAVY; c.stroke();
    } else {
      const left = Math.max(0, Math.ceil(s.left ?? 10));
      txt(c, 'Popcorn! Tap STOP at exactly 0:01.', W / 2, y - 38, 20, MILK);
      txt(c, '0:' + String(left).padStart(2, '0'), W / 2, y + 22, 64, left <= 1 ? GREEN : left <= 3 ? GLOW : '#4DE1B0', 'center', 700, 8);
    }
  }
}
