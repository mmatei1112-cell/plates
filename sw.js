/* Plates service worker: network first (so updates show up straight away), cache as offline fallback */
const CACHE = 'plates-1.0.1-flat';
const SHELL = [
  './', 'index.html', 'app.js?v=1.0.1', 'data.js?v=1.0.1', 'manifest.webmanifest',
  'icon-180.png', 'icon-192.png', 'icon-512.png',
  'big-shoulders-display-latin-wght-normal.woff2', 'big-shoulders-display-latin-ext-wght-normal.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: false }).then(r => r || caches.match(req, { ignoreSearch: true })).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
