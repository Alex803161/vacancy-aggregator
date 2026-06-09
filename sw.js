// sw.js
const CACHE_NAME = 'vakansa-v3';
const STATIC_ASSETS = [
  '/vacancy-aggregator/',
  '/vacancy-aggregator/index.html',
  '/vacancy-aggregator/style.css',
  '/vacancy-aggregator/common.js',
  '/vacancy-aggregator/manifest.json',
  '/vacancy-aggregator/icons/icon.svg',
  '/vacancy-aggregator/vacancy.html',
  '/vacancy-aggregator/favorites.html',
  '/vacancy-aggregator/vacancies.html',
  '/vacancy-aggregator/admin.html',
  '/vacancy-aggregator/post-job.html',
  '/vacancy-aggregator/privacy.html',
  '/vacancy-aggregator/terms.html',
  '/vacancy-aggregator/contacts.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/webfonts/fa-brands-400.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Кеширование статических ресурсов');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Не удалось закешировать все ресурсы', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // API-запросы пропускаем без кеширования (или networkFirst)
  if (url.href.includes('api.hh.ru') || url.href.includes('functions.yandexcloud.net')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Навигация (HTML-страницы) — всегда пытаемся загрузить свежую версию,
  // при неудаче отдаём закешированную.
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Статические ресурсы (стили, скрипты, шрифты) — cacheFirst.
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Изображения — staleWhileRevalidate.
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Всё остальное — networkFirst.
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return caches.match('/vacancy-aggregator/index.html');
    }
    return new Response('Нет соединения', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  }).catch(() => cached);
  return cached || fetchPromise;
}
