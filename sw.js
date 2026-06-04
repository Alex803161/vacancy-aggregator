const CACHE_NAME = 'vakansa-v1';
const urlsToCache = [
  '/vacancy-aggregator/',
  '/vacancy-aggregator/index.html',
  '/vacancy-aggregator/vacancy.html',
  '/vacancy-aggregator/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
