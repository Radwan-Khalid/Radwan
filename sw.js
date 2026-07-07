const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './ic_launcher.png'
];

// تثبيت الـ Service Worker وحفظ الملفات في الكاش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// استدعاء الملفات من الكاش عند فتح التطبيق لتوفير الإنترنت
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
