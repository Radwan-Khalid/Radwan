import admin from 'firebase-admin';

// تهيئة Firebase Admin SDK وتجنب إعادة التهيئة إذا كان شغال
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // معالجة السطور الجديدة في المفتاح السري (مهم جداً في Vercel)
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
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

  try {
    // استلام البيانات من التطبيق (التوكن الخاص بالجهاز، عنوان الإشعار، ونص الإشعار)
    const { token, title, body } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({ error: 'البيانات ناقصة (تحتاج token, title, body)' });
    }

    // إعداد رسالة الإشعار
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: token, // هذا هو التوكن الخاص بمتصفح الفني أو المدير
    };

    // إرسال الإشعار عبر سيرفرات Firebase مباشرة
    const response = await admin.messaging().send(message);

    // الرد بنجاح العملية
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء إرسال الإشعار' });
  }
}

