/* sw.js — Bruch-Bobins offline cache. Network first (updates arrive), cache as fallback.
   Bump VERSION on every release. */
const VERSION = 'bruch-v1.1.0';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/bruch.css', 'icons/icon.svg',
  'js/speech.js', 'js/frac.js', 'js/text.js', 'js/model.js', 'js/ctx.js', 'js/gens-core.js', 'js/gens-world.js', 'js/gens-k2.js', 'js/gens-why.js',
  'js/progress.js', 'js/session.js', 'js/platform.js', 'js/ui.js', 'js/draw.js', 'js/share.js', 'js/strips.js', 'js/lab.js', 'js/widgets.js',
  'js/practice.js', 'js/lessons.js', 'js/screens.js', 'js/app.js',
  'fonts/atkinson-hyperlegible-latin-400-normal.woff2', 'fonts/atkinson-hyperlegible-latin-700-normal.woff2',
  'fonts/OpenDyslexic-Regular.woff', 'fonts/OpenDyslexic-Bold.woff'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSION).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
