// استيراد Firebase (النسخ المتوافقة مع Service Worker)
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js');

// --- إعدادات Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAmxdtkiZ7hMx0xb7LpEDg7G4-SXJ2u9mk",
  authDomain: "hivc-be880.firebaseapp.com",
  projectId: "hivc-be880",
  storageBucket: "hivc-be880.firebasestorage.app",
  messagingSenderId: "659425177244",
  appId: "1:659425177244:web:6fbff146cfb99aa5cc8759"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// --- إعدادات التخزين المؤقت (Caching) ---
const CACHE_NAME = 'my-app-v1'; // قم بتغيير الإصدار عند تحديث ملفاتك
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/ic_launcher.png'
  // أضف أي ملفات تحتاجها لتعمل دون إنترنت
];

// 1. التثبيت (Install): تخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // فرض التفعيل الفوري
});

// 2. التفعيل (Activate): تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // السيطرة على المتصفح فوراً
});

// 3. المعالجة (Fetch): استراتيجية "Cache First, falling back to network"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا وجدنا الملف في الكاش، نعيده
      if (cachedResponse) {
        return cachedResponse;
      }
      // إذا لم نجده، نجلبه من الشبكة
      return fetch(event.request).catch(() => {
        // إذا فشل الاتصال، يمكن هنا عرض صفحة "خطأ في الاتصال"
      });
    })
  );
});

// 4. Firebase Background Messaging
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './ic_launcher.png',
    badge: './ic_launcher.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
Window) return clients.openWindow('./index.html');
    })
  );
});
