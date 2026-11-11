// Snack Raid: touch, mouse and keyboard input. Everything is in logical pixels: the view is always
// 720 tall, and between 1100 and 1760 wide to fit the screen (main.js sets VIEW.w).
export const VIEW = { w: 1280, h: 720 };

// On-screen buttons. rx is the distance from the right edge, so they hug the corner on any screen width.
// Lefty mode mirrors everything except the two top buttons.
export const BTN = {
  action: { rx: 130, y: 588, r: 76 },
  action2: { rx: 264, y: 664, r: 42 },
  g0: { rx: 270, y: 548, r: 46 },
  g1: { rx: 228, y: 436, r: 46 },
  g2: { rx: 120, y: 410, r: 46 },
  peek: { rx: 152, y: 58, r: 32, fixed: true },
  pause: { rx: 68, y: 58, r: 32, fixed: true },
};
const JOY_R = 120; // big enough that a small phone still has room for a gentle tiptoe push

export class Input {
  constructor(canvas, toLogical) {
    this.canvas = canvas; this.toLogical = toLogical;
    this.lefty = false;
    this.joy = null;            // { id, ox, oy, x, y }
    this.keys = new Set();
    this.held = new Map();      // pointerId -> button name
    this.actionHeld = false; this.peekHeld = false;
    this.edge = { actionDown: false, actionUp: false, action2Down: false, gadget: -1 };
    this.onPause = null; this.enabled = false;
    const opt = { passive: false };
    canvas.addEventListener('pointerdown', e => this.down(e), opt);
    canvas.addEventListener('pointermove', e => this.move(e), opt);
    canvas.addEventListener('pointerup', e => this.up(e), opt);
    canvas.addEventListener('pointercancel', e => this.up(e), opt);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', e => this.key(e, true));
    window.addEventListener('keyup', e => this.key(e, false));
    window.addEventListener('blur', () => this.reset());
  }
  reset() {
    this.joy = null; this.keys.clear(); this.held.clear(); this.actionHeld = false; this.peekHeld = false;
    this.edge = { actionDown: false, actionUp: false, action2Down: false, gadget: -1 };
  }
  bx(b) { return this.lefty && !b.fixed ? b.rx : VIEW.w - b.rx; }
  hit(x, y) {
    for (const k of Object.keys(BTN)) { const b = BTN[k]; if (Math.hypot(x - this.bx(b), y - b.y) <= b.r + 10) return k; }
    return null;
  }
  press(name) {
    if (name === 'action') { this.actionHeld = true; this.edge.actionDown = true; }
    else if (name === 'action2') this.edge.action2Down = true;
    else if (name === 'peek') this.peekHeld = true;
    else if (name === 'pause') { if (this.onPause) this.onPause(); }
    else if (name[0] === 'g') this.edge.gadget = +name[1];
  }
  release(name) {
    if (name === 'action') { this.actionHeld = false; this.edge.actionUp = true; }
    else if (name === 'peek') this.peekHeld = false;
  }
  down(e) {
    if (!this.enabled) return;
    e.preventDefault();
    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
    const [x, y] = this.toLogical(e.clientX, e.clientY);
    const b = this.hit(x, y);
    if (b) { this.held.set(e.pointerId, b); this.press(b); return; }
    const joySide = this.lefty ? x > VIEW.w / 2 : x < VIEW.w / 2;
    if (joySide && !this.joy) this.joy = { id: e.pointerId, ox: x, oy: y, x, y };
  }
  move(e) {
    if (!this.enabled || !this.joy || this.joy.id !== e.pointerId) return;
    e.preventDefault();
    const [x, y] = this.toLogical(e.clientX, e.clientY);
    this.joy.x = x; this.joy.y = y;
  }
  up(e) {
    if (this.joy && this.joy.id === e.pointerId) this.joy = null;
    const b = this.held.get(e.pointerId);
    if (b) { this.held.delete(e.pointerId); this.release(b); }
  }
  key(e, on) {
    if (!this.enabled) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab'].includes(k)) e.preventDefault();
    if (e.repeat) return;
    if (on) this.keys.add(k); else this.keys.delete(k);
    if (k === 'e' || k === 'Enter' || k === 'f') { if (on) this.press('action'); else this.release('action'); }
    else if (k === 'q' && on) this.press('action2');
    else if ((k === '1' || k === '2' || k === '3') && on) this.edge.gadget = +k - 1;
    else if (k === 'm' || k === 'Tab') this.peekHeld = on;
    else if ((k === 'Escape' || k === 'p') && on) { if (this.onPause) this.onPause(); }
  }
  // joystick vector in -1..1 (length is how hard the stick is pushed)
  stick() {
    if (this.joy) {
      let dx = (this.joy.x - this.joy.ox) / JOY_R, dy = (this.joy.y - this.joy.oy) / JOY_R;
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      return [dx, dy];
    }
    const K = this.keys;
    let x = (K.has('d') || K.has('ArrowRight') ? 1 : 0) - (K.has('a') || K.has('ArrowLeft') ? 1 : 0);
    let y = (K.has('s') || K.has('ArrowDown') ? 1 : 0) - (K.has('w') || K.has('ArrowUp') ? 1 : 0);
    const m = Math.hypot(x, y);
    if (!m) return [0, 0];
    const push = K.has('Shift') ? 0.3 : K.has(' ') ? 1 : 0.6; // Shift tiptoes, Space runs
    return [x / m * push, y / m * push];
  }
  sample() {
    const [mx, my] = this.stick();
    const s = { mx, my, actionHeld: this.actionHeld, peek: this.peekHeld, ...this.edge };
    this.edge = { actionDown: false, actionUp: false, action2Down: false, gadget: -1 };
    return s;
  }
}
export { JOY_R };
