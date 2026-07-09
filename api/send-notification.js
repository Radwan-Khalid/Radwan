import admin from 'firebase-admin';

// تهيئة Firebase Admin SDK وتجنب إعادة التهيئة إذا كان شغال
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // معالجة السطور الجديدة في المفتاح السري (مهم جداً في Vercel)
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase initialization error', error.stack);
  }
}

export default async function handler(req, res) {
  // السماح بطلبات POST فقط
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'يجب استخدام طريقة POST' });
  }

  // لو فشلت التهيئة فوق (مثلاً متغيرات البيئة ناقصة)، نرجّع خطأ واضح
  // بدل ما نوصل لـ admin.messaging().send() ويطلع خطأ عام مبهم
  if (!admin.apps.length) {
    console.error('Firebase Admin لم يُهيّأ — تحقق من FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY في إعدادات السيرفر (Environment Variables)');
    return res.status(500).json({ error: 'السيرفر غير مهيّأ لإرسال الإشعارات (Firebase Admin)' });
  }

  try {
    // استلام البيانات من التطبيق (التوكن الخاص بالجهاز، عنوان الإشعار، ونص الإشعار)
    const { token, title, body } = req.body || {};

    if (!token || !title || !body) {
      return res.status(400).json({ error: 'البيانات ناقصة (تحتاج token, title, body)' });
    }

    // نرسل الرسالة كـ "data" فقط (بدون مفتاح notification العلوي) حتى
    // يتولى sw.js عرض الإشعار بنفسه بشكل موحّد سواء كان المتصفح مفتوح
    // بالخلفية أو حتى مقفل بالكامل (على الأجهزة اللي تدعم ذلك)
    const message = {
      data: {
        title: String(title),
        body: String(body),
      },
      token: token, // هذا هو التوكن الخاص بمتصفح الفني أو المدير
    };

    // إرسال الإشعار عبر سيرفرات Firebase مباشرة
    const response = await admin.messaging().send(message);

    // الرد بنجاح العملية
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    // details يفيدك وقت التطوير لمعرفة سبب الفشل بالضبط (مثلاً توكن منتهي)
    return res.status(500).json({ error: 'حدث خطأ أثناء إرسال الإشعار', details: error.message });
  }
}
