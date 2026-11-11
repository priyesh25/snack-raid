// Snack Raid: the house grid. Collision, line of sight and pathfinding. No DOM in here.
import { T, buildHouse, OBJECTS, DOORS, ROOMS } from './data.js';

export class World {
  constructor(level) {
    this.grid = buildHouse();
    this.H = this.grid.length;
    this.W = this.grid[0].length;
    this.allCarpet = !!level.allCarpet;
    this.objs = OBJECTS.map(o => ({ ...o }));
    this.doors = DOORS.map(d => {
      const open = (level.doorsOpen || []).includes(d.id);
      return { ...d, open, init: open, oiled: false };
    });
    this.solid = Array.from({ length: this.H }, (_, y) => this.grid[y].map(c => c === '#'));
    this.tall = Array.from({ length: this.H }, (_, y) => this.grid[y].map(c => c === '#'));
    for (const o of this.objs) {
      for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) {
        if (o.solid) this.solid[y][x] = true;
        if (o.tall) this.tall[y][x] = true;
      }
    }
  }
  obj(id) { return this.objs.find(o => o.id === id); }
  inside(tx, ty) { return tx >= 0 && ty >= 0 && tx < this.W && ty < this.H; }
  doorAt(tx, ty) { return this.doors.find(d => d.x === tx && d.y === ty); }
  // floor type under a pixel: c carpet, w wood, t tile
  floorAt(px, py) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    if (!this.inside(tx, ty)) return 'c';
    const ch = this.grid[ty][tx];
    if (ch === '#') return 'c';
    if (this.allCarpet) return 'c';
    return ch === 's' ? 'w' : ch;
  }
  // can something stand on this tile (closed doors count as open for walkers that open them)
  walkable(tx, ty) { return this.inside(tx, ty) && !this.solid[ty][tx]; }
  blockedForPlayer(tx, ty) {
    if (!this.inside(tx, ty) || this.solid[ty][tx]) return true;
    const d = this.doorAt(tx, ty);
    return !!(d && !d.open);
  }
  // circle against the grid
  hits(px, py, r) {
    const x0 = Math.floor((px - r) / T), x1 = Math.floor((px + r) / T);
    const y0 = Math.floor((py - r) / T), y1 = Math.floor((py + r) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!this.blockedForPlayer(tx, ty)) continue;
      const cx = Math.max(tx * T, Math.min(px, tx * T + T)), cy = Math.max(ty * T, Math.min(py, ty * T + T));
      if ((px - cx) ** 2 + (py - cy) ** 2 < r * r) return true;
    }
    return false;
  }
  // sight: walls, closed doors and tall furniture block it
  los(x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 10));
    for (let i = 1; i < n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      const tx = Math.floor(x / T), ty = Math.floor(y / T);
      if (!this.inside(tx, ty) || this.tall[ty][tx]) return false;
      const dr = this.doorAt(tx, ty);
      if (dr && !dr.open) return false;
    }
    return true;
  }
  roomOf(px, py) {
    const tx = px / T, ty = py / T;
    return ROOMS.find(r => tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) || null;
  }
  // sound: how many closed doors a noise has to get through. Bedrooms are closed boxes, so a noise
  // leaving one bedroom or entering another passes that room's door.
  soundDoors(x0, y0, x1, y1) {
    const a = this.roomOf(x0, y0), b = this.roomOf(x1, y1);
    if (a === b) return 0;
    let n = 0;
    for (const r of [a, b]) if (r) { const d = this.doors.find(q => q.id === r.door); if (d && !d.open) n++; }
    return n;
  }
  // nearest tile a walker can stand on
  nearestWalkable(tx, ty) {
    if (this.walkable(tx, ty)) return [tx, ty];
    for (let r = 1; r < 6; r++) {
      let best = null, bd = 1e9;
      for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) {
        if (!this.walkable(x, y)) continue;
        const d = (x - tx) ** 2 + (y - ty) ** 2;
        if (d < bd) { bd = d; best = [x, y]; }
      }
      if (best) return best;
    }
    return [tx, ty];
  }
  // breadth-first path between tiles. Returns pixel waypoints (tile centers), or null.
  path(fx, fy, tx, ty, opts = {}) {
    [tx, ty] = this.nearestWalkable(tx, ty);
    [fx, fy] = this.nearestWalkable(fx, fy);
    if (fx === tx && fy === ty) return [];
    const W = this.W, H = this.H, prev = new Int32Array(W * H).fill(-1);
    const start = fy * W + fx, goal = ty * W + tx;
    const q = [start]; prev[start] = start;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi];
      if (cur === goal) break;
      const cx = cur % W, cy = (cur - cx) / W;
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (!this.walkable(nx, ny)) continue;
        if (opts.noDoors) { const d = this.doorAt(nx, ny); if (d && !d.open) continue; }
        const ni = ny * W + nx;
        if (prev[ni] !== -1) continue;
        prev[ni] = cur; q.push(ni);
      }
    }
    if (prev[goal] === -1) return null;
    const out = [];
    for (let c = goal; c !== start; c = prev[c]) {
      const x = c % W, y = (c - x) / W;
      out.push([x * T + T / 2, y * T + T / 2]);
    }
    return out.reverse();
  }
}
