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
- ✅ السعر: **500 ريال سعودي/شهر** (مع خصومات للباقات الأطول)
- ✅ خيارات الدفع: تحويل بنكي، STC Pay، نقدي
- ✅ **تكامل بوابة دفع Stripe** (بطاقات ائتمان، Apple Pay، Google Pay)
- 🔲 تكامل بوابة دفع Tap (قيد التنفيذ)

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

### 7. تطبيق الموبايل
- 🔲 تحويل التطبيق إلى React Native (مطلوب من المستخدم)

---

## ما تم تنفيذه ✅

### الجلسة الحالية (يناير 2025)

#### إصلاحات حرجة
1. **إصلاح مشكلة CORS/Network** - كان هناك خطأ syntax في auth_routes.py يمنع بدء الـ backend
2. **إصلاح صفحة AdminDashboard** - كانت هناك escaped quotes خاطئة
3. **إصلاح MongoDB _id serialization** - إضافة `{'_id': 0}` في جميع الـ queries

#### الميزات الجديدة
1. **نظام مصادقة كامل** جديد (`oauth_routes.py`):
   - Google OAuth عبر Emergent Auth
   - تسجيل بالبريد الإلكتروني
   - تسجيل دخول بالبريد الإلكتروني
   - إدارة الجلسات عبر cookies

2. **صفحة AuthPage محدثة** - تدعم جميع طرق المصادقة

3. **AuthCallback component** - للتعامل مع Google OAuth redirect

4. **إنشاء مستخدم أدمن** - `admin@saqr.com` / `admin123`

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
│   ├── user_routes.py       # User API
│   ├── admin_auth_routes.py # Admin login
│   └── admin_dashboard_routes.py # Admin dashboard
├── models/
│   ├── user.py
│   ├── ad.py
│   ├── advertiser.py
│   ├── withdrawal.py
│   ├── admin.py
│   └── dashboard.py
└── server.py
```

### Frontend (React)
```
/app/frontend/src/
├── components/
│   ├── AuthPage.jsx         # Login page
│   ├── AuthCallback.jsx     # OAuth callback
│   ├── AdViewer.jsx         # Ad viewing
│   ├── ProfilePage.jsx      # User profile
│   ├── WithdrawPage.jsx     # Withdrawal form
│   ├── AdvertiserPage.jsx   # Advertiser form
│   ├── AdminLoginPage.jsx   # Admin login
│   ├── AdminDashboard.jsx   # Admin panel
│   └── BottomNav.jsx        # Navigation
└── App.js
```

### Database (MongoDB)
- **users**: معلومات المستخدمين والنقاط
- **user_sessions**: جلسات المستخدمين
- **ads**: الإعلانات النشطة
- **advertiser_ads**: طلبات الإعلانات من المعلنين
- **advertiser_payments**: مدفوعات المعلنين
- **withdrawals**: طلبات السحب
- **admins**: حسابات المشرفين

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
1. 🔲 تكامل بوابة دفع **Stripe** للمعلنين
2. 🔲 تكامل بوابة دفع **Tap** للمعلنين

### أولوية متوسطة (P2)
3. 🔲 تحويل التطبيق إلى **React Native**
4. 🔲 نظام الفواتير للمعلنين

### أولوية منخفضة (P3)
5. 🔲 إحصائيات مفصلة للمعلنين
6. 🔲 نظام إشعارات

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

### Advertiser
- `GET /api/advertiser/pricing` - Get pricing info
- `POST /api/advertiser/ads` - Create ad request
- `POST /api/advertiser/ads/{id}/payment` - Submit payment

### Withdrawals
- `POST /api/withdrawals` - Create withdrawal request
- `GET /api/withdrawals` - Get user withdrawals

### Admin
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard stats
- `GET /api/admin/dashboard/withdrawals/pending` - Pending withdrawals
- `GET /api/admin/dashboard/ads/pending` - Pending ads
- `PUT /api/admin/dashboard/withdrawals/{id}/approve` - Approve withdrawal
- `PUT /api/admin/dashboard/ads/{id}/approve` - Approve ad

---

## URLs

- **Frontend**: https://pointads.preview.emergentagent.com
- **Admin Panel**: https://pointads.preview.emergentagent.com/admin/login
- **API Base**: https://pointads.preview.emergentagent.com/api
