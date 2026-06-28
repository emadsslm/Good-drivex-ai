# 📋 DriveX AI — سجل التغييرات (Changelog)

## الإصدار 3.0 — النسخة المتقدمة (V3 Advanced) 🚀

تاريخ الإصدار: الفرع `feature/v3-advanced`

### ✨ 8 ميزات جديدة

#### 🎥 كاميرا الطريق (Dashcam Mode)
- تسجيل فيديو مستمر من الكاميرا الخلفية عبر `MediaRecorder API`
- حلقات 60 ثانية تلقائية (loop recording)
- حفظ يدوي للمقاطع المهمة + تنزيلها كـ WebM
- يحفظ آخر 10 مقاطع في الذاكرة
- ملف: `src/components/drivex/DashcamRecorder.tsx`

#### 🚨 كشف الحوادث التلقائي (Auto-Crash Detection)
- يراقب تباطؤ السرعة (> 25 كم/س في الثانية)
- عند كشف فرملة شديدة من سرعة > 30 كم/س:
  - عداد 30 ثانية بصوت تحذيري
  - إن لم يُلغَه السائق → يفتح SOS تلقائيًا
- يُمكن إيقافه من الإعدادات
- ملفات: `src/hooks/use-crash-detection.ts` + `src/components/drivex/CrashDetectionOverlay.tsx`

#### 🅿️ تذكير مكان السيارة (Parking Spot Reminder)
- عند إيقاف القيادة: حفظ تلقائي للموقع
- إضافة صورة (الكاميرا الخلفية) + ملاحظة صوتية (ASR)
- زر "خذني لسيارتي" يفتح OSM Directions
- يحفظ مكانًا واحدًا نشطًا في localStorage
- ملف: `src/components/drivex/ParkingReminder.tsx`

#### 📡 تنبيه رادارات السرعة (Speed Camera Alerts)
- يجلب الرادارات الثابتة من OpenStreetMap (Overpass API)
- تحديث كل 5 دقائق حسب الموقع
- تنبيه صوتي عند الاقتراب (< 700م): *"تنبيه: رادار سرعة خلال 500 متر. الحد الأقصى 80 كم/س"*
- شارة ثابتة أعلى الشاشة أثناء الاقتراب
- ملفات: `src/app/api/speed-cameras/route.ts` + `src/hooks/use-speed-cameras.ts` + `src/components/drivex/SpeedCameraAlert.tsx`

#### 👨‍👩‍👧 مشاركة الرحلة المباشرة (Live Trip Sharing)
- **mini-service مستقل** بـ Bun native WebSocket (المنفذ 3003)
- بث الموقع + السرعة كل 5 ثوانٍ للمتابعين
- رمز 6 أحرف للمتابعة + رابط مشاركة
- يتوقف تلقائيًا عند إنهاء القيادة
- ملفات: `mini-services/live-trip/index.ts` + `src/components/drivex/LiveTripSharing.tsx`
- **دليل النشر:** `mini-services/live-trip/README.md` (Railway/Render/Fly.io)

#### 🤖 مدرب القيادة الذكي (AI Driving Coach)
- تحليل LLM لآخر 30 رحلة عبر `z-ai-web-dev-sdk`
- تقرير عربي قصير (3-5 جمل): تقييم عام + نقطة قوة + نصيحة تحسين
- نطق صوتي للتقرير بالعربية
- ملفات: `src/app/api/coach/route.ts` + `src/components/drivex/AICoach.tsx`

#### 🏪 البحث عن الخدمات القريبة (POI Finder)
- 7 فئات: وقود، مستشفى، مطعم، موقف، صيدلية، صراف، شحن كهربائي
- يجلب من OpenStreetMap (Overpass API)
- يعرض المسافة + زر اتجاهات (OSM Directions)
- ملفات: `src/app/api/poi/route.ts` + `src/components/drivex/POIFinder.tsx`

#### 🛣️ ذاكرة الطرق المتكررة (Frequent Routes Memory)
- يتعلّم الطرق المتكررة من سجل الرحلات
- يطابق الإحداثيات (ضمن ~100م) لتجميع الرحلات
- يعرض: عدد المرات، متوسط المدة، آخر استخدام
- زر اتجاهات سريع لكل طريق
- ملفات: `src/hooks/use-frequent-routes.ts` + `src/components/drivex/FrequentRoutes.tsx`

### 🏗️ البنية التقنية الجديدة

#### Mini-Service (Bun native WebSocket)
```
mini-services/live-trip/
├─ index.ts          ← WebSocket server (Bun.serve)
├─ package.json      ← مشروع مستقل (bun --hot)
└─ README.md         ← دليل النشر الكامل
```

#### APIs جديدة (3 routes)
- `POST /api/coach` — تحليل رحلات عبر LLM
- `GET /api/poi?lat&lng&category` — خدمات قريبة من OpenStreetMap
- `GET /api/speed-cameras?lat&lng` — رادارات من OpenStreetMap

#### Hooks جديدة (3 hooks)
- `useCrashDetection` — مراقبة التباطؤ + عداد SOS
- `useSpeedCameras` — جلب الرادارات + تنبيه صوتي
- `useFrequentRoutes` — تعلّم الطرق المتكررة

#### Store موسّع (+8 شرائح حالة)
dashcam, crash detection, parking, speed cameras, live trip, frequent routes, POI

### 🛡️ الأمان والامتثال

- ✅ **0 أخطاء في `bun run lint`**
- ✅ لم يُلمس `next.config.ts` أو `vercel.json` أو `package.json` أو `prisma/schema.prisma`
- ✅ لا حزم خارجية جديدة (WebSocket أصلي + MediaRecorder أصلي)
- ✅ كل التطوير على فرع منفصل `feature/v3-advanced`
- ✅ mini-service مستقل بـ package.json خاص

### 📊 إحصائيات الإصدار

| المقياس | القيمة |
|---------|--------|
| ميزات جديدة | 8 ميزات |
| ملفات جديدة | 16 ملف |
| APIs جديدة | 3 routes |
| Hooks جديدة | 3 hooks |
| mini-service | 1 (WebSocket) |
| أخطاء lint | 0 |
| حزم جديدة | 0 |
| حجم ZIP | 600 KB |

---

## الإصدار 2.0 — النسخة الاحترافية (Pro)

تاريخ الإصدار: الفرع `feature/pro-features`

### المميزات المضافة (8 ميزات)
- 📷 كاشف المسافة الأمامية بالكاميرا
- 🧾 سجل الرحلات التلقائي
- ⏰ تنبيه الاستراحة (مكافحة النعاس)
- 🌦️ حالة الطقس (Open-Meteo)
- 🌿 نقاط القيادة الاقتصادية
- 🆘 زر طوارئ SOS
- 🌙 الوضع الليلي التلقائي
- 🔊 نطق عربي حصري

---

## الإصدار 1.0 — النسخة الأساسية

تاريخ الإصدار: الفرع `main`

### المميزات الأساسية (8 ميزات)
- 🧠 مساعد ذكاء اصطناعي (z-ai-web-dev-sdk)
- 🎤 تحكم صوتي (Web Speech API)
- 🗺️ خرائط OpenStreetMap + Leaflet
- 📊 عدّاد سرعة + كشف قيادة تلقائي (15 كم/س)
- 🎵 راديو إنترنت (SomaFM)
- 📱 PWA قابل للتثبيت
- 🎨 تصميم Tesla / Android Auto (أسود + أزرق)

---

## 📈 ملخص تراكمي

| الإصدار | الميزات التراكمية | الملفات |
|---------|-------------------|---------|
| V1 | 8 | ~84 |
| V2 | 16 (+8) | ~125 |
| V3 | 24 (+8) | ~141 |

**إجمالي الميزات في التطبيق:** 24 ميزة + 3 APIs + 1 mini-service = **28 عنصر وظيفي**
