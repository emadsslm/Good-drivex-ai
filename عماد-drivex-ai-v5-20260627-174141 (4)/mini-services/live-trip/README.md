# 🛰️ DriveX Live Trip — Mini-Service

خدمة WebSocket مستقلة لبث موقع السائق مباشرة لمتابعيه. مكتوبة بـ **Bun native WebSocket** (بلا أي حزم خارجية).

---

## 📋 الوصف

عندما يشارك السائق رحلته، يبث موقعه وسرعته إلى هذه الخدمة عبر WebSocket. كل من يملك الرمز (`tripCode`) يمكنه فتح الرابط ومتابعة الرحلة مباشرة على الخريطة.

**المنفذ:** `3003` (ثابت)

---

## 🚀 التشغيل محليًا (تطوير)

```bash
cd mini-services/live-trip
bun run dev    # bun --hot index.ts — إعادة تشغيل تلقائية
```

سيعمل على `http://localhost:3003`. تحقق:
```bash
curl http://localhost:3003/
# → {"service":"DriveX Live Trip","port":3003,"status":"ok"}
```

---

## ☁️ النشر للإنتاج

عند نشر التطبيق الرئيسي على Vercel، هذه الخدمة تحتاج استضافة منفصلة (Vercel يدعم HTTP serverless فقط، لا WebSockets طويلة الأمد). إليك 3 خيارات:

### الخيار 1: Railway (الأسهل — موصى به) 🏆

Railway يدعم WebSockets وBun بشكل مثالي.

1. أنشئ حسابًا على [railway.app](https://railway.app)
2. **New Project → Deploy from GitHub repo**
3. ارفع مجلد `mini-services/live-trip` كمستودع منفصل، أو استخدم monorepo وحدّد المسار
4. إعدادات Railway:
   - **Build Command:** `bun install` (أو اتركها فارغة — لا حزم)
   - **Start Command:** `bun index.ts`
   - **Port:** `3003` (أو استخدم متغير `PORT`)
5. ستحصل على رابط مثل: `wss://drivex-live-trip.up.railway.app`
6. **حدّث التطبيق:** في `src/components/drivex/LiveTripSharing.tsx`، غيّر:
   ```typescript
   // قبل:
   const url = `${proto}://${host}/?XTransformPort=${PORT}`;
   // بعد:
   const url = `wss://drivex-live-trip.up.railway.app`;
   ```

> 💰 **التكلفة:** Railway لديه خطة مجانية (500 ساعة/شهر) كافية للاستخدام الشخصي.

### الخيار 2: Render

1. أنشئ خدمة على [render.com](https://render.com)
2. **New → Web Service → Build from GitHub**
3. إعدادات:
   - **Environment:** `Bun`
   - **Build Command:** `bun install`
   - **Start Command:** `bun index.ts`
4. ستحصل على رابط: `wss://drivex-live-trip.onrender.com`
5. حدّث `LiveTripSharing.tsx` كما في الخيار 1.

> 💰 **التكلفة:** خطة مجانية متاحة (خدمة تنام بعد 15 دقيقة من الخمول).

### الخيار 3: Fly.io (للأداء العالي)

1. ثبّت `flyctl`: `curl -L https://fly.io/install.sh | sh`
2. من مجلد `mini-services/live-trip`:
   ```bash
   fly launch        # أنشئ التطبيق
   fly deploy        # انشر
   ```
3. ستحصل على: `wss://drivex-live-trip.fly.dev`
4. حدّث `LiveTripSharing.tsx`.

> 💰 **التكلفة:** خطة مجانية سخية (3 أجهزة صغيرة).

---

## 🔧 تعديل التطبيق للإنتاج

بعد نشر الخدمة، عدّل ملف `src/components/drivex/LiveTripSharing.tsx`:

### الكود الحالي (للتطوير عبر gateway):
```typescript
const proto = window.location.protocol === "https:" ? "wss" : "ws";
const host = window.location.host;
const url = `${proto}://${host}/?XTransformPort=${PORT}`;
```

### الكود للإنتاج (خدمة منفصلة):
```typescript
// استبدل بـ:
const LIVE_TRIP_URL = "wss://drivex-live-trip.up.railway.app";
// أو استخدم متغير بيئة:
const url = process.env.NEXT_PUBLIC_LIVE_TRIP_URL || "wss://drivex-live-trip.up.railway.app";
```

ثم أضف على Vercel:
- **Settings → Environment Variables**
- Key: `NEXT_PUBLIC_LIVE_TRIP_URL`
- Value: `wss://drivex-live-trip.up.railway.app`

---

## 📡 بروتوكول WebSocket

الرسائل بصيغة JSON:

### من العميل → الخادم:
| النوع | الوصف | الحقول |
|------|-------|--------|
| `subscribe` | اشتراك متابع | `code` |
| `broadcast` | بث السائق | `code`, `payload` (`coords`, `speed`, `ts`) |
| `end` | إنهاء البث | `code` |

### من الخادم → العميل:
| النوع | الوصف | الحقول |
|------|-------|--------|
| `update` | موقع محدّث | `payload` (`coords`, `speed`, `ts`) |
| `ended` | انتهت الرحلة | — |
| `viewers-ping` | ping لعدّ المتابعين | — |

---

## 🧪 اختبار الخدمة

### اختبار سريع بـ wscat:
```bash
npm i -g wscat
# اشترك كـ متابع:
wscat -c ws://localhost:3003 -x '{"type":"subscribe","code":"ABC123"}'

# في نافذة أخرى، ابثث كـ سائق:
wscat -c ws://localhost:3003 -x '{"type":"broadcast","code":"ABC123","payload":{"coords":{"lat":24.71,"lng":46.68},"speed":80,"ts":1234567890}}'
```

### اختبار HTTP:
```bash
curl http://localhost:3003/
# → {"service":"DriveX Live Trip","port":3003,"status":"ok"}
```

---

## ⚠️ ملاحظات

- **لا تخزين دائم:** المواقع تُبث فقط للحظة، لا تُحفظ على الخادم.
- **لا مصادقة:** الرمز (`tripCode`) هو الحماية الوحيدة. اجعله 6 أحرف عشوائية.
- **الذاكرة:** كل اتصال نشط يستهلك ذاكرة. الخدمة الحالية تتعامل مع عشرات المتصلين دون مشاكل.
- **الأمان في الإنتاج:** فكّر في إضافة rate limiting + مصادقة JWT إذا توسّع الاستخدام.

---

## 🔄 بديل: Vercel Serverless Functions + Pusher

إن لم ترد استضافة منفصلة، بديل بلا WebSocket:

1. استخدم [Pusher](https://pusher.com) (مجاني حتى 200k رسالة/يوم)
2. استبدل منطق WebSocket بـ Pusher channels
3. الـ payload يُرسل من السائق عبر Next.js API route
4. المتابعون يشتركون في Pusher channel بالرمز

هذا أبسط للنشر لكن يتطلب حسابًا خارجيًا. الـ mini-service الحالي أبسط وتحت تحكمك الكامل.

---

## 📞 الدعم

إن واجهت مشاكل في النشر:
1. تأكد أن المنفذ مفتوح (Railway/Render يكشفونه تلقائيًا)
2. تحقق من logs الخدمة
3. اختبر WebSocket عبر `wscat` أولًا
4. تأكد أن رابط `wss://` صحيح (ليس `ws://` للإنتاج)
