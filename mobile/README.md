# 📱 دليل تطبيق صقر للموبايل

## نظرة عامة
تطبيق صقر للموبايل مبني باستخدام React Native و Expo SDK 51.

---

## 🧪 اختبار التطبيق على جهازك

### الطريقة 1: استخدام Expo Go (الأسرع)

1. **حمّل تطبيق Expo Go** على جهازك:
   - 📱 iPhone: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - 🤖 Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **شغّل التطبيق محلياً:**
   ```bash
   cd /app/mobile
   npx expo start
   ```

3. **امسح QR Code** الظاهر في Terminal بتطبيق Expo Go

### الطريقة 2: بناء APK للاختبار (Android)

```bash
cd /app/mobile

# تثبيت EAS CLI
npm install -g eas-cli

# تسجيل الدخول
eas login

# بناء APK للاختبار
eas build -p android --profile preview
```

---

## 🚀 النشر على المتاجر

### متطلبات النشر

#### Apple App Store:
- حساب Apple Developer ($99/سنة)
- شهادات التوقيع (Certificates)
- ملف Provisioning Profile
- Mac لرفع التطبيق (أو استخدام EAS Submit)

#### Google Play Store:
- حساب Google Play Developer ($25 مرة واحدة)
- ملف Service Account JSON
- أيقونات ولقطات شاشة

### خطوات النشر

#### 1. إعداد الحسابات

**Apple:**
```bash
# سجّل في https://developer.apple.com
# أنشئ App ID في Apple Developer Portal
# أنشئ Provisioning Profile
```

**Google:**
```bash
# سجّل في https://play.google.com/console
# أنشئ تطبيق جديد
# أنشئ Service Account وحمّل JSON key
```

#### 2. تحديث إعدادات التطبيق

عدّل `app.json`:
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.saqr"
    },
    "android": {
      "package": "com.yourcompany.saqr"
    },
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id"
      }
    }
  }
}
```

عدّل `eas.json`:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-real-apple-id@example.com",
        "ascAppId": "your-app-store-connect-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path-to-your-service-account.json"
      }
    }
  }
}
```

#### 3. بناء نسخة الإنتاج

```bash
# iOS
eas build -p ios --profile production

# Android
eas build -p android --profile production
```

#### 4. رفع للمتاجر

```bash
# iOS - رفع لـ App Store Connect
eas submit -p ios

# Android - رفع لـ Google Play Console
eas submit -p android
```

---

## 📁 هيكل المشروع

```
/app/mobile/
├── App.js                 # نقطة الدخول
├── app.json               # إعدادات Expo
├── eas.json               # إعدادات EAS Build
├── package.json           # المكتبات
├── assets/                # الأيقونات والصور
│   ├── icon.png          # أيقونة التطبيق (1024x1024)
│   ├── splash.png        # شاشة البداية (1242x2688)
│   └── adaptive-icon.png # أيقونة Android (1024x1024)
└── src/
    ├── components/        # المكونات المشتركة
    ├── context/
    │   └── AuthContext.js # إدارة حالة المصادقة
    ├── hooks/             # Custom Hooks
    ├── navigation/
    │   └── AppNavigator.js # التنقل
    ├── screens/
    │   ├── AuthScreen.js           # تسجيل الدخول
    │   ├── HomeScreen.js           # عرض الإعلانات
    │   ├── ProfileScreen.js        # الملف الشخصي
    │   ├── WithdrawScreen.js       # طلب السحب
    │   ├── WithdrawalHistoryScreen.js # سجل السحوبات
    │   ├── NotificationsScreen.js  # الإشعارات
    │   └── AdvertiserScreen.js     # للمعلنين
    └── services/
        └── api.js         # خدمات API
```

---

## 🎨 إنشاء الأيقونات

### أيقونة التطبيق (icon.png)
- الحجم: 1024x1024 بكسل
- بدون شفافية
- PNG format

### شاشة البداية (splash.png)
- الحجم: 1242x2688 بكسل (iPhone) أو 1920x1080 (Android)
- PNG format

### أداة مفيدة:
استخدم [Expo Icon Builder](https://buildicon.netlify.app/) لإنشاء جميع الأحجام المطلوبة.

---

## ⚙️ إعدادات Google و Apple OAuth

### Google OAuth:
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ OAuth 2.0 Client ID
3. أضف Bundle ID لـ iOS و Package Name لـ Android
4. أضف Client ID في لوحة إعدادات صقر

### Apple Sign In:
1. اذهب إلى [Apple Developer Portal](https://developer.apple.com)
2. فعّل Sign In with Apple في App ID
3. أنشئ Service ID إذا لزم الأمر
4. أضف الإعدادات في لوحة صقر

---

## 🔔 إعداد Push Notifications

التطبيق يدعم Expo Push Notifications. للتفعيل:

1. احصل على Expo Push Token من الجهاز
2. سجّل Token في الـ Backend
3. استخدم Firebase Cloud Messaging (FCM) لـ Android
4. استخدم APNs لـ iOS

---

## 📞 الدعم والمساعدة

- **الموقع:** https://saqr-ads-1.preview.emergentagent.com
- **API Docs:** https://saqr-ads-1.preview.emergentagent.com/docs

---

## 🔄 التحديثات (OTA Updates)

بعد النشر، يمكنك إرسال تحديثات بدون إعادة رفع التطبيق:

```bash
# نشر تحديث OTA
eas update --branch production --message "إصلاح مشكلة..."
```

---

## ✅ قائمة التحقق قبل النشر

- [ ] تحديث رقم الإصدار في app.json
- [ ] اختبار جميع الشاشات
- [ ] التأكد من عمل API
- [ ] إنشاء أيقونات بالأحجام الصحيحة
- [ ] كتابة وصف التطبيق للمتاجر
- [ ] تجهيز لقطات شاشة (Screenshots)
- [ ] مراجعة سياسة الخصوصية
- [ ] التأكد من إعدادات OAuth
