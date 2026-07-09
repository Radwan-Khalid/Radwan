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

// ==========================================
// التعديل الجديد: استقبال الإشعارات والتطبيق مغلق
// ==========================================
self.addEventListener('push', event => {
  // بيانات افتراضية في حال لم يتم إرسال تفاصيل
  let data = { title: 'إشعار جديد', body: 'يوجد تحديث في التطبيق' };
  
  if (event.data) {
    try {
      data = event.data.json(); // محاولة تحويل البيانات القادمة إلى JSON
    } catch (e) {
      data.body = event.data.text(); // إذا كانت نص عادي
    }
  }

  const options = {
    body: data.body,
    icon: './ic_launcher.png',
    badge: './ic_launcher.png',
    dir: 'rtl' // لدعم اتجاه النصوص العربية
  };

  // إجبار المتصفح على عرض الإشعار
  event.waitUntil(
    self.registration.showNotification(data.title, options)
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
