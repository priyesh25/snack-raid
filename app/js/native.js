// Snack Raid: the few things that differ when the game runs inside the Android app.
// New versions are GitHub releases of this repo. The app asks GitHub for the newest one.
import { VERSION } from './data.js';

const REPO = 'priyesh25/snack-raid';
export const APK_URL = `https://github.com/${REPO}/releases/latest/download/snack-raid.apk`;

// Capacitor adds window.Capacitor inside the app. In a browser it is not there.
export const isApp = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
export const isAndroidBrowser = () => !isApp() && /Android/i.test(navigator.userAgent || '');

// "0.2.0" is newer than "0.1.9"
export function isNewer(a, b) {
  const x = String(a).split('.').map(n => parseInt(n, 10) || 0), y = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}

let update = null;
export const pendingUpdate = () => update;

// Returns { ok, update } where update is null or { version, notes }.
export async function checkUpdate() {
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (r.status === 404) { update = null; return { ok: true, update }; }   // no release yet
    if (!r.ok) return { ok: false, update };
    const j = await r.json(), v = String(j.tag_name || '').replace(/^v/, '');
    update = v && isNewer(v, VERSION) ? { version: v, notes: String(j.body || '').split('\n').map(s => s.replace(/^[#*\-\s]+/, '').trim()).find(Boolean) || '' } : null;
    return { ok: true, update };
  } catch (e) {
    return { ok: false, update };
  }
}

// The app hands GitHub links to the phone's browser, which downloads the APK and offers to install it.
export function getUpdate() { location.href = APK_URL; }
