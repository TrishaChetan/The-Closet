// service-worker.js — minimal offline cache so the app opens without a connection.
// Photos/data themselves live in IndexedDB, not the cache — this just caches the app shell.

const CACHE_NAME = 'closet-app-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  './js/colorDetect.js',
  './js/bgRemoval.js',
  './js/manualCutout.js',
  './js/styleProfiles.js',
  './js/matcher.js',
  './js/mannequin.js',
  './js/ai.js',
  './js/ui.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Never cache calls to the Anthropic API — always go to the network for those.
  if (event.request.url.includes('api.anthropic.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
