// Snack Raid service worker: caches the whole game so it works offline after the first visit.
// Bump CACHE when you ship a new version.
const CACHE = 'snack-raid-v0.1.0';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/ui.js', './js/game.js', './js/world.js', './js/render.js', './js/input.js', './js/gfx.js',
  './js/audio.js', './js/save.js', './js/codes.js', './js/data.js', './js/sprites.js',
  './assets/fonts/fredoka-latin-400-normal.woff2', './assets/fonts/fredoka-latin-500-normal.woff2',
  './assets/fonts/fredoka-latin-600-normal.woff2', './assets/fonts/fredoka-latin-700-normal.woff2',
  './assets/fonts/baloo-2-latin-800-normal.woff2',
  './assets/img/keyart.jpg', './assets/img/icon-192.png', './assets/img/icon-512.png',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone();
    if (res.ok && new URL(e.request.url).origin === location.origin) caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match('./index.html'))));
});
