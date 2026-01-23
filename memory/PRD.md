# صقر (Saqr) - PRD (Product Requirements Document)

## نظرة عامة على المنتج
تطبيق صقر هو منصة إعلانية شبيهة بـ Instagram، حيث يشاهد المستخدمون الإعلانات ويكسبون نقاط مقابل وقتهم.

## المتطلبات الأساسية

### 1. نظام النقاط
- ✅ المستخدم يكسب **1 نقطة لكل دقيقة** من مشاهدة الإعلان
- ✅ **500 نقطة = 1$** للسحب
- ✅ **حماية ضد الغش**: لا يمكن مشاهدة نفس الإعلان مرتين

### 2. المصادقة (Authentication)
- ✅ تسجيل دخول بـ **Google** (عبر Emergent Auth)
- ⚠️ تسجيل دخول بـ **Apple** (متاح فقط على iOS native apps)
- ✅ تسجيل دخول بـ **البريد الإلكتروني وكلمة المرور**
- ✅ وضع **الزائر** (تصفح بدون تسجيل)

### 3. عارض الإعلانات
- ✅ عرض الإعلانات بشكل عمودي (مثل Instagram Reels)
- ✅ تشغيل الفيديو تلقائياً
- ✅ عداد وقت المشاهدة
- ✅ احتساب النقاط تلقائياً

### 4. صفحة المعلنين
- ✅ نموذج إضافة إعلان جديد
- ✅ باقات متعددة:
  - 500 ريال/شهر
  - 1,350 ريال/3 أشهر (خصم 10%)
  - 2,400 ريال/6 أشهر (خصم 20%)
  - 4,200 ريال/سنة (خصم 30%)
- ✅ **تكامل Stripe** (بطاقات ائتمان، Apple Pay، Google Pay)
- ✅ **تكامل Tap** (جاهز - يحتاج TAP_API_KEY في .env)
- ✅ خيارات يدوية: تحويل بنكي، STC Pay

### 5. نظام السحب
- ✅ طلب سحب عبر PayPal
- ✅ طلب سحب عبر STC Pay
- ✅ طلب سحب عبر البنك المحلي
- ✅ الموافقة اليدوية من المشرف

### 6. لوحة تحكم المشرف
- ✅ تسجيل دخول المشرف
- ✅ عرض الإحصائيات (الإيرادات، المدفوعات، الأرباح، المستخدمين)
- ✅ إدارة طلبات السحب (موافقة/رفض)
- ✅ إدارة طلبات الإعلانات (موافقة/رفض)

### 8. تعدد اللغات (i18n)
- ✅ **العربية** (افتراضي)
- ✅ **الإنجليزية**
- ✅ زر تبديل سهل في جميع الصفحات
- ✅ حفظ تفضيل اللغة في localStorage

### 9. تطبيق الموبايل
- ✅ **React Native App** (Expo) - مُكتمل البنية الأساسية
  - تسجيل الدخول (Google, Email, Guest)
  - عرض الإعلانات (Instagram Reels style)
  - صفحة الملف الشخصي
  - صفحة السحب

---

## ما تم تنفيذه ✅

### الجلسة الحالية (يناير 2025)

#### إصلاحات حرجة
1. **إصلاح مشكلة CORS/Network** - كان هناك خطأ syntax يمنع بدء الـ backend
2. **إصلاح صفحة AdminDashboard** - كانت هناك escaped quotes خاطئة
3. **إصلاح MongoDB _id serialization** - إضافة `{'_id': 0}` في جميع الـ queries

#### الميزات الجديدة
1. **نظام مصادقة كامل** (`oauth_routes.py`):
   - Google OAuth عبر Emergent Auth
   - تسجيل بالبريد الإلكتروني
   - إدارة الجلسات عبر cookies

2. **تكامل Stripe** (`payment_routes.py`):
   - 4 باقات سعرية
   - Checkout sessions
   - Payment status polling
   - Webhook handling

3. **تكامل Tap Payments** (`tap_routes.py`):
   - جاهز للعمل فور إضافة TAP_API_KEY
   - يدعم mada, Visa, Mastercard, Apple Pay

4. **تطبيق React Native** (`/app/mobile`):
   - 4 شاشات رئيسية
   - نظام تنقل
   - اتصال بالـ API

---

## الهيكل التقني

### Backend (FastAPI)
```
/app/backend/
├── routes/
│   ├── oauth_routes.py      # Google OAuth + Email auth
│   ├── ad_routes.py         # Ads API
│   ├── advertiser_routes.py # Advertiser API
│   ├── withdrawal_routes.py # Withdrawal API
│   ├── payment_routes.py    # Stripe payments
│   ├── tap_routes.py        # Tap payments
│   ├── admin_auth_routes.py # Admin login
│   └── admin_dashboard_routes.py # Admin dashboard
└── server.py
```

### Frontend (React)
```
/app/frontend/src/
├── components/
│   ├── AuthPage.jsx
│   ├── AuthCallback.jsx
│   ├── AdViewer.jsx
│   ├── ProfilePage.jsx
│   ├── WithdrawPage.jsx
│   ├── AdvertiserPage.jsx (with Stripe + Tap)
│   ├── AdminLoginPage.jsx
│   ├── AdminDashboard.jsx
│   ├── PaymentSuccess.jsx
│   └── PaymentCancel.jsx
└── App.js
```

### Mobile (React Native/Expo)
```
/app/mobile/
├── App.js
├── src/
│   ├── screens/
│   │   ├── AuthScreen.js
│   │   ├── HomeScreen.js
│   │   ├── ProfileScreen.js
│   │   └── WithdrawScreen.js
│   ├── context/AuthContext.js
│   ├── navigation/AppNavigator.js
│   └── services/api.js
└── package.json
```

---

## بيانات الاختبار

### مستخدم اختبار
- Email: `test@saqr.com`
- Password: `test123456`

### حساب المشرف
- Email: `admin@saqr.com`
- Password: `admin123`

---

## المهام القادمة (Upcoming)

### أولوية عالية (P1)
1. 🔲 إضافة **TAP_API_KEY** لتفعيل Tap Payments
2. 🔲 نشر تطبيق الموبايل على App Store و Google Play

### أولوية متوسطة (P2)
3. 🔲 نظام الفواتير للمعلنين
4. 🔲 Push Notifications

### أولوية منخفضة (P3)
5. 🔲 Dark Mode
6. 🔲 إحصائيات مفصلة للمعلنين

---

## API Endpoints

### Authentication
- `POST /api/auth/session` - Process Google OAuth session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Email registration
- `POST /api/auth/login/email` - Email login

### Ads
- `GET /api/ads` - Get all active ads
- `POST /api/ads/watch` - Record ad watch

### Payments (Stripe)
- `GET /api/payments/packages` - Get pricing packages
- `POST /api/payments/checkout` - Create Stripe checkout
- `GET /api/payments/status/{session_id}` - Check payment status

### Payments (Tap)
- `GET /api/tap/status` - Check Tap availability
- `POST /api/tap/checkout` - Create Tap checkout
- `GET /api/tap/status/{charge_id}` - Check Tap payment status

### Withdrawals
- `POST /api/withdrawals` - Create withdrawal request
- `GET /api/withdrawals` - Get user withdrawals

### Admin
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard stats
- `GET /api/admin/dashboard/withdrawals/pending` - Pending withdrawals
- `GET /api/admin/dashboard/ads/pending` - Pending ads

---

## URLs

- **Frontend**: https://pointads.preview.emergentagent.com
- **Admin Panel**: https://pointads.preview.emergentagent.com/admin/login
- **API Base**: https://pointads.preview.emergentagent.com/api

---

## لتفعيل Tap Payments

أضف المفتاح في `/app/backend/.env`:
```
TAP_API_KEY=sk_live_xxxxx
```

احصل على المفتاح من: https://dashboard.tap.company/settings/api-keys
