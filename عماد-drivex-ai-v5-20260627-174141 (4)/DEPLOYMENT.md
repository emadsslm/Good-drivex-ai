# 🚀 DriveX AI — دليل النشر الكامل

دليل خطوة بخطوة لنشر **DriveX AI** على Vercel وفتحه على هاتفك كتطبيق PWA حقيقي.

---

## 📋 المتطلبات الأساسية

- حساب **GitHub** (مجاني) → [github.com](https://github.com)
- حساب **Vercel** (مجاني، سجّل بـ GitHub) → [vercel.com](https://vercel.com)
- أداة **Git** مُثبّتة على جهازك → [git-scm.com](https://git-scm.com)

---

## 1️⃣ رفع المشروع إلى GitHub

### أ) أنشئ مستودعًا جديدًا على GitHub

1. اذهب إلى [github.com/new](https://github.com/new)
2. **Repository name**: `drivex-ai`
3. اختر **Public** (موصى به — يسهّل النشر على Vercel المجاني)
4. **لا تُفعّل** "Add a README" أو "Add .gitignore" (المشروع يحتويهما بالفعل)
5. اضغط **Create repository**

انسخ رابط المستودع — سيكون مثل:
```
https://github.com/USERNAME/drivex-ai.git
```

### ب) ارفع المشروع من جهازك

في Terminal (داخل مجلد المشروع الذي نزّلته):

```bash
# إذا لم يكن Git مُهيّأ بعد
git init
git branch -M main

# أضف كل الملفات
git add .

# أول commit
git commit -m "feat: DriveX AI - Smart Driving Assistant PWA"

# اربط بمستودع GitHub (استبدل USERNAME باسمك)
git remote add origin https://github.com/USERNAME/drivex-ai.git

# ارفع الكود
git push -u origin main
```

> 🔑 إذا طلب GitHub بيانات الدخول:
> - أنشئ Personal Access Token من [github.com/settings/tokens](https://github.com/settings/tokens) (صلاحية `repo`)
> - استخدمه ككلمة مرور عند الـ push.

---

## 2️⃣ النشر على Vercel

### أ) استورد المشروع

1. اذهب إلى [vercel.com/new](https://vercel.com/new)
2. سجّل دخولك بـ **GitHub** (أو اربط حسابك)
3. اضغط **"Add New…"** → **"Project"**
4. ابحث عن `drivex-ai` في قائمة مستودعاتك واضغط **"Import"**

### ب) تأكيد الإعدادات (Vercel يكتشف Next.js تلقائيًا)

| الإعداد | القيمة المتوقعة |
|---------|----------------|
| Framework Preset | `Next.js` ✅ |
| Build Command | `bun run build` (أو `npm run build`) |
| Output Directory | `.next` (تلقائي) |
| Install Command | `bun install` (أو `npm install`) |

> ✅ ملف `vercel.json` المُضمّن يضبط هذه القيم تلقائيًا — لا تحتاج تغيير شيء.

### ج) متغيرات البيئة (اختياري)

التطبيق لا يحتاج أي مفاتيح API خارجية — `z-ai-web-dev-sdk` يعمل بمصادقة داخلية.

إن أردت تعطيل رسائل التحذير فقط:
- **Settings → Environment Variables → Add**
- Key: `DATABASE_URL`
- Value: `file:./db/custom.db` (أو اتركها فارغة)

### د) اضغط **"Deploy"** 🚀

- انتظر 1-2 دقيقة حتى ينتهي البناء.
- ستحصل على رابط مثل: `https://drivex-ai-xxx.vercel.app`
- افتحه للتأكد أن التطبيق يعمل على المتصفح.

### رابط مخصص (اختياري)
- **Settings → Domains → Add** → اكتب اسم نطاقك واتبع تعليمات DNS.

---

## 3️⃣ تثبيت التطبيق على الهاتف

### 📱 على أندرويد (Chrome):

1. افتح **Chrome** على هاتفك.
2. اذهب إلى رابط Vercel: `https://drivex-ai-xxx.vercel.app`
3. سيظهر banner **"تثبيت التطبيق"** — اضغط **Install**.
   - إن لم يظهر: قائمة Chrome ⋮ → **"تثبيت التطبيق"** / **"Add to Home screen"**.
4. ستجد أيقونة **DriveX AI** على شاشتك الرئيسية.
5. افتحها → تعمل **ملء الشاشة** (بدون شريط المتصفح).

### 🍎 على iPhone / iPad (Safari — ضروري):

1. افتح **Safari** (Chrome لا يدعم PWA على iOS).
2. اذهب إلى رابط Vercel.
3. اضغط زر **Share** ↗️ (المربع بسهم لأعلى).
4. اختر **"إضافة إلى الشاشة الرئيسية"** / **"Add to Home Screen"**.
5. اضغط **"Add"** → ستظهر الأيقونة على الشاشة الرئيسية.
6. افتحها → تعمل **standalone** بدون شريط المتصفح.

---

## 4️⃣ فعّل الأذونات (أول مرة فقط)

عند فتح التطبيق أول مرة، سيطلب إذنين ضروريين:

| الإذن | السبب | متى يُطلب |
|-------|-------|-----------|
| 📍 **الموقع** | الخرائط + كشف السرعة + تفعيل القيادة تلقائيًا | فور فتح التطبيق |
| 🎤 **الميكروفون** | الأوامر الصوتية + المساعد الذكي | عند ضغط زر الميكروفون |

اضغط **"السماح"** / **"Allow"** لكليهما.

### تعديل الأذونات لاحقًا:
- **أندرويد**: الإعدادات → التطبيقات → Chrome → الأذونات
- **iOS**: الإعدادات → Safari → الموقع/الميكروفون

---

## 5️⃣ تحديثات لاحقة

عند تعديل الكود محليًا، ارفع التحديثات:

```bash
git add .
git commit -m "update: وصف التعديل"
git push
```

Vercel سيعيد البناء تلقائيًا وينشر التحديث على نفس الرابط. ✨

---

## 🛠️ استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `git push` يفشل بالـ 403 | أنشئ Personal Access Token من إعدادات GitHub واستخدمه بدل كلمة المرور |
| البناء يفشل على Vercel | تأكد أن `package.json` موجود في جذر المستودع، وأن `bun.lock` مرفوع |
| الخريطة فارغة | اسمح بإذن الموقع + تأكد أنك على HTTPS (Vercel يوفّره تلقائيًا) |
| الميكروفون لا يعمل على iOS | استخدم Safari فقط، وأفعّل الإذن من الإعدادات |
| لا يظهر زر التثبيت | افتح التطبيق مرتين خلال دقائق، أو استخدم قائمة المتصفح |
| التطبيق لا يحدّث بعد push | Hard refresh: امسح cache التطبيق أو احذفه وأعد تثبيته |

---

## 📞 مسار سريع (TL;DR)

```bash
# على جهازك
git init && git branch -M main
git add . && git commit -m "DriveX AI"
git remote add origin https://github.com/USERNAME/drivex-ai.git
git push -u origin main

# على Vercel.com
# → Add New Project → اختر drivex-ai → Deploy

# على الهاتف
# → افتح رابط Vercel في Chrome/Safari → تثبيت التطبيق → اسمح بالموقع + الميكروفون
# → اضغط "ابدأ القيادة" 🚗
```

---

## 🌐 روابط مفيدة

- [GitHub Docs](https://docs.github.com/en/get-started)
- [Vercel Deployment Guide](https://vercel.com/docs/getting-started)
- [PWA Installation Guide](https://web.dev/articles/install-criteria)
- [Web Speech API Browser Support](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

**قيادة آمنة! 🚗💨**
