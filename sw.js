const CACHE_NAME = 'vakansa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/vacancy.html',
  '/vacancies.html',
  '/favorites.html',
  '/manifest.json',
  '/style.css'
];

// Установка: кеширование основных файлов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// Активация: удаление старых кешей
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов: кеш первый, если нет — сеть
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        // Не кешируем динамические запросы к API
        if (event.request.url.includes('functions.yandexcloud.net')) {
          return response;
        }
        // Кешируем только GET-запросы
        if (event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Можно вернуть офлайн-страницу, если понадобится
        return new Response('Нет сети', { status: 503 });
      });
    })
  );
});
