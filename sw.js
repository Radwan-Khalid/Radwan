// ============================================================================
// Service Worker — تخزين مؤقت (Offline Cache) + إشعارات Push عبر Firebase
// ============================================================================

// 0) معالج الضغط على الإشعار — لازم يتسجّل *قبل* استيراد مكتبات Firebase.
//    السبب: مكتبة Firebase تسجّل معالج notificationclick افتراضي خاص فيها،
//    ولو انسجّل قبل معالجنا فممكن يوقف تنفيذ معالجنا (موثّق رسمياً في
//    firebase.google.com/docs/cloud-messaging/web/receive-messages).
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});

// 1) استيراد Firebase (النسخ المتوافقة مع Service Worker)
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
const CACHE_NAME = 'my-app-v2'; // رفعت الإصدار حتى يتحدّث الكاش عند من فتح النسخة القديمة
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './ic_launcher.png'
  // ⚠️ مهم: هذا الملف كان فيه '/styles.css' و '/script.js' وهما غير
  // موجودين (كل الكود عندك داخل index.html نفسه). cache.addAll() تفشل
  // بالكامل لو أي ملف واحد بالقائمة يرجع 404 — وهذا كان يمنع تفعيل
  // الـ Service Worker من الأساس (لا كاش ولا إشعارات ولا شي).
  // لو عندك فعلاً ملفات css/js منفصلة على السيرفر، ضيفها هنا بمسار نسبي
  // (يبدأ بـ ./) بدل المسار المطلق اللي كان قبل.
];

// 2. التثبيت (Install): تخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // فرض التفعيل الفوري
});

// 3. التفعيل (Activate): تنظيف الكاش القديم
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
  self.clients.claim(); // السيطرة على الصفحات المفتوحة فوراً
});

// 4. المعالجة (Fetch): استراتيجية "Cache First, falling back to network"
self.addEventListener('fetch', (event) => {
  // لا نتدخل إلا في طلبات GET — طلبات POST (زي نداءاتنا لـ
  // /api/send-notification) لازم تروح للشبكة مباشرة بدون أي تدخل من الكاش.
  if (event.request.method !== 'GET') return;
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

// 5. استقبال إشعارات Firebase وقت ما التطبيق بالخلفية أو المتصفح شغال
//    بس بدون تبويب مفتوح. نستقبل payload من نوع "data" فقط (وليس
//    "notification") حتى نتحكم إحنا بشكل العرض دايماً بدل الاعتماد على
//    عرض Firebase التلقائي (اللي يختلف سلوكه بين الحالات).
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notificationTitle = data.title || 'إشعار جديد';
  const notificationOptions = {
    body: data.body || '',
    icon: './ic_launcher.png',
    badge: './ic_launcher.png',
    dir: 'rtl',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
