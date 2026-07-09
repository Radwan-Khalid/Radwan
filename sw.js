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

// استدعاء الملفات: نجلب التحديث الجديد من النت أولاً، وإذا لم يوجد إنترنت نستخدم الكاش
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // إذا نجح الاتصال بالنت، نقوم بتحديث الكاش بالنسخة الجديدة
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // إذا فشل الاتصال بالنت، نستخدم النسخة المحفوظة في الكاش
        return caches.match(event.request);
      })
  );
});

// لما المستخدم يضغط على إشعار (بلاغ جديد / تكليف بمهمة)، نفتحله التطبيق
// أو نرجعه للتبويب المفتوح أصلاً بدل ما يفتح نسخة جديدة
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});
