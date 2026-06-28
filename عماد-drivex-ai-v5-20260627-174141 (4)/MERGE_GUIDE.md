# 🔀 دليل دمج الميزات الاحترافية (Pull Request Guide)

دليل خطوة بخطوة لدمج ميزات النسخة الاحترافية (كاشف الكاميرا، سجل الرحلات، تنبيه النعاس، الطقس، Eco Score، SOS) على تطبيقك المنشور **بدون توقف**.

---

## 🎯 الخطوة 1: نزّل النسخة الاحترافية

من مجلد `download/` نزّل الملف:
- **`drivex-ai-pro.zip`** (565 KB) — يحتوي كل الميزات الاحترافية + الأساسية

---

## 🎯 الخطوة 2: اختر طريقة الدمج

لديك 3 خيارات حسب حالتك:

### الخيار A: مشروعك على GitHub يستخدم الفرع `main` فقط (الأكثر شيوعًا)

```bash
# 1. فك ضغط النسخة الاحترافية
unzip drivex-ai-pro.zip -d drivex-ai-pro
cd drivex-ai-pro

# 2. اربط بمستودعك الحالي (استبدل USERNAME)
git init
git remote add origin https://github.com/USERNAME/drivex-ai.git
git fetch origin

# 3. أنشئ فرع للميزات الجديدة
git checkout -b feature/pro-features origin/main

# 4. أضف كل الملفات وارفعها
git add .
git commit -m "feat: add pro features - camera alert, trip log, rest reminder, weather, eco score, SOS, Arabic TTS"
git push -u origin feature/pro-features
```

### الخيار B: لديك بالفعل المشروع على جهازك وتريد تحديثه

```bash
# 1. انسخ الملفات الجديدة فوق مشروعك الحالي
cp -r drivex-ai-pro/src/components/drivex/* your-project/src/components/drivex/
cp -r drivex-ai-pro/src/hooks/* your-project/src/hooks/
cp -r drivex-ai-pro/src/app/api/weather your-project/src/app/api/
cp drivex-ai-pro/src/lib/store.ts your-project/src/lib/store.ts
cp drivex-ai-pro/src/hooks/use-speech.ts your-project/src/hooks/use-speech.ts
cp drivex-ai-pro/src/app/page.tsx your-project/src/app/page.tsx
cp drivex-ai-pro/src/components/drivex/BottomNav.tsx your-project/src/components/drivex/BottomNav.tsx
cp drivex-ai-pro/src/components/drivex/DriveScreen.tsx your-project/src/components/drivex/DriveScreen.tsx
cp drivex-ai-pro/src/components/drivex/SettingsPanel.tsx your-project/src/components/drivex/SettingsPanel.tsx

# 2. اختبر محليًا
cd your-project
bun install   # أو npm install (لا حزم جديدة مطلوبة)
bun run dev   # اختبر كل الميزات على http://localhost:3000

# 3. إذا كل شيء تمام، ارفعها
git checkout -b feature/pro-features
git add .
git commit -m "feat: add pro features"
git push -u origin feature/pro-features
```

### الخيار C: دمج مباشر على `main` (الأسرع، لكن أقل أمانًا)

```bash
cd your-project
# انسخ الملفات كما في الخيار B
bun run lint   # تأكد لا أخطاء
git add .
git commit -m "feat: add pro features"
git push origin main
# Vercel ينشر تلقائيًا — التطبيق المثبّت على هاتفك يتحدّث
```

---

## 🎯 الخطوة 3: افتح Pull Request على GitHub

1. اذهب إلى: `https://github.com/USERNAME/drivex-ai`
2. سترى banner أصفر: **"Compare & pull request"** بجانب فرع `feature/pro-features`
3. اضغطه
4. اكتب عنوانًا: `feat: النسخة الاحترافية - كاشف كاميرا + سجل رحلات + طقس + SOS`
5. في الوصف، الصق:

```markdown
## الميزات المضافة
- 📷 كاشف المسافة الأمامية بالكاميرا
- 🧾 سجل الرحلات التلقائي
- ⏰ تنبيه الاستراحة (مكافحة النعاس)
- 🌦️ حالة الطقس (Open-Meteo)
- 🌿 نقاط القيادة الاقتصادية
- 🆘 زر طوارئ SOS
- 🌙 الوضع الليلي التلقائي
- 🔊 نطق عربي حصري

## الاختبار
- ✅ bun run lint — 0 أخطاء
- ✅ تم اختبار كل الميزات بالكامل
- ✅ لم تُلمس ملفات أساسية (next.config, vercel.json, package.json, prisma)
```

6. اضغط **"Create pull request"**
7. إذا فعّلت GitHub Actions، انتظر فحص الـ checks
8. اضغط **"Merge pull request"** → **"Confirm merge"**

---

## 🎯 الخطوة 4: Vercel ينشر تلقائيًا

بعد الدمج:
1. اذهب إلى [vercel.com/dashboard](https://vercel.com/dashboard)
2. ستجد deploy جديد بدأ تلقائيًا
3. انتظر 1-2 دقيقة → الحالة: **✅ Ready**
4. رابطك نفسه (`https://drivex-ai-xxx.vercel.app`) أصبح يحتوي الميزات الجديدة

---

## 🎯 الخطوة 5: حدّث التطبيق على هاتفك

التطبيق المثبّت كـ PWA على هاتفك سيتحدّث تلقائيًا عند فتحه (خلال ساعة). للتأكد فورًا:

### على أندرويد (Chrome):
1. افتح التطبيق
2. إذا لم تتحدّث: قائمة Chrome ⋮ → **"Reload"** أو امسح cache التطبيق

### على iPhone (Safari):
1. اضغط مطولًا على أيقونة DriveX AI
2. **"Edit Home Screen"** → احذف الأيقونة القديمة
3. افتح الرابط في Safari → **Share** → **Add to Home Screen** من جديد

---

## 🛡️ ماذا لو فشل الدمج؟

### الحالة 1: فشل البناء على Vercel
- **التطبيق الحالي لا يتوقف** — Vercel يُبقي النسخة العاملة
- اذهب لـ Vercel → Deployments → ستجد ❌ Error
- اضغط الـ deploy الفاشل → **Build Logs** لرؤية الخطأ
- أصلحه محليًا → `git push` مرة أخرى → Vercel يعيد المحاولة

### الحالة 2: تعارض في الكود (Merge Conflict)
إذا عدّلت ملفات على `main` بعد النسخة الأولى:
```bash
# على جهازك
git checkout main
git pull origin main
git checkout feature/pro-features
git merge main
# حل التعارضات يدويًا في المحرر
git add .
git commit -m "merge: resolve conflicts"
git push
```

### الحالة 3: الرجوع للنسخة القديمة
على Vercel → Deployments → اختر أي deploy قديم **✅ Ready** → اضغط **⋮** → **"Promote to Production"**

---

## ✅ قائمة تحقق قبل الدمج

- [ ] نزّلت `drivex-ai-pro.zip` من مجلد `download/`
- [ ] نسخت الملفات لمشروعك / رفعتها لفرع `feature/pro-features`
- [ ] شغّلت `bun install` (لا حزم جديدة، فقط تأكيد)
- [ ] شغّلت `bun run lint` → **0 أخطاء**
- [ ] شغّلت `bun run dev` → اختبرت الميزات على localhost:3000
- [ ] رفعت الفرع لـ GitHub
- [ ] فتحت Pull Request
- [ ] دمجته مع `main`
- [ ] Vercel نشره بنجاح (✅ Ready)
- [ ] فتحت التطبيق على هاتفك → تأكدت من التحديث

---

## 📞 الميزات التي ستظهر بعد التحديث

عند فتح التطبيق على هاتفك بعد الدمج:

1. **شريط تنقل جديد** بـ 5 تبويبات (الرئيسية، المساعد، الخريطة، الرحلات، المزيد)
2. **زر SOS أحمر** طافٍ في يمين الشاشة
3. **شاشة "المزيد"** فيها كل الميزات الجديدة قابلة للتفعيل
4. **في الإعدادات**: حقل جهة اتصال SOS + مفاتيح الكاميرا والاستراحة
5. **أثناء القيادة**: widgets الطقس وEco Score تظهر تحت عدّاد السرعة
6. **كاشف الكاميرا**: يُفعّل من "المزيد" أو الإعدادات
7. **سجل الرحلات**: يُسجّل تلقائيًا، تراه في تبويب "الرحلات"

---

## 🎓 نصائح احترافية

### تفعيل تدريجي للميزات
لا تفعّل كل الميزات دفعة واحدة على هاتفك. جرّبها واحدًا تلو الآخر:
1. أولًا: سجل الرحلات + Eco Score (بلا أذونات إضافية)
2. ثانيًا: الطقس (يحتاج GPS فقط)
3. ثالثًا: تنبيه الاستراحة (بلا أذونات)
4. رابعًا: SOS (أضف رقم جهة اتصال)
5. أخيرًا: كاشف الكاميرا (يحتاج إذن كاميرا + يستهلك بطارية)

### مراقبة الأداء
كاشف الكاميرا يستهلك بطارية أكثر. فعّله فقط في رحلات طويلة على الطرق السريعة، وأوقفه في المدينة.

### النسخ الاحتياطي للرحلات
رحلاتك محفوظة في localStorage. إذا حذفت التطبيق، تُفقد. للحفاظ عليها:
- افتح تبويب "الرحلات" → سجّل المسافات يدويًا في ملاحظاتك أسبوعيًا
- (ميزة تصدير CSV ستُضاف في إصدار مستقبلي)

---

**🚗 قيادة آمنة مع DriveX AI Pro!**
