// ============================================
// sw.js — Service Worker для Suluu Business
// ============================================

const CACHE_NAME = 'suluu-business-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/state.js',
  './js/api.js',
  './js/utils.js',
  './js/core/engine.js',
  './js/core/router.js',
  './js/pages/auth.js',
  './js/pages/dashboard.js',
  './js/pages/bookings.js',
  './js/pages/masters.js',
  './js/pages/clients.js',
  './js/pages/services.js',
  './js/pages/finance.js',
  './js/pages/settings.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/tailwind.min.js',
  './js/morphdom.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Установка Service Worker и кэширование статики
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Активация и удаление старого кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов (Network-First стратегия для гарантированного обновления)
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Игнорируем запросы не по протоколам http/https (например, chrome-extension, data)
  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }

  // Запросы к Google Apps Script ВСЕГДА идут в сеть в обход кэша
  if (requestUrl.hostname === 'script.google.com' || requestUrl.pathname.includes('/macros/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Для остальных запросов используем стратегию Network-First
  // Сначала пытаемся получить самую свежую версию из сети, если не получается (офлайн) — берем из кэша
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Проверяем валидность ответа
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Если сеть недоступна, пытаемся отдать из кэша
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Офлайн-заглушка для HTML страниц
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
