# تطبيق صقر - React Native

## 📱 نسخة الموبايل لتطبيق صقر

تطبيق إعلانات مع نظام نقاط ومكافآت - نسخة React Native للأجهزة المحمولة (iOS & Android)

## 🚀 المتطلبات الأساسية

### لنظام التشغيل:
- Node.js 18+
- React Native CLI
- Android Studio (للأندرويد)
- Xcode (للآيفون - Mac فقط)

### تثبيت React Native CLI:
```bash
npm install -g react-native-cli
```

## 📦 التثبيت

```bash
cd /app/mobile

# تثبيت المكتبات
yarn install

# للأندرويد
cd android
./gradlew clean
cd ..

# للآيفون (Mac فقط)
cd ios
pod install
cd ..
```

## 🏃 تشغيل التطبيق

### على Android:
```bash
# تشغيل Metro Bundler
yarn start

# في terminal آخر، تشغيل التطبيق
yarn android
```

### على iOS (Mac فقط):
```bash
# تشغيل Metro Bundler
yarn start

# في terminal آخر، تشغيل التطبيق
yarn ios
```

## 📱 التطبيق على Emulator

### Android Emulator:
1. افتح Android Studio
2. Tools > AVD Manager
3. إنشاء أو تشغيل Virtual Device
4. شغل `yarn android`

### iOS Simulator (Mac):
1. افتح Xcode
2. Xcode > Preferences > Locations
3. تأكد من Command Line Tools
4. شغل `yarn ios`

## 🔧 إعدادات Backend

عدّل ملف `/app/mobile/src/services/api.js`:
```javascript
const BACKEND_URL = 'https://your-backend-url.com';
```

## 📁 هيكل المشروع

```
mobile/
├── src/
│   ├── screens/          # شاشات التطبيق
│   │   ├── AuthScreen.js
│   │   ├── AdViewerScreen.js
│   │   └── ProfileScreen.js
│   ├── navigation/       # التنقل
│   │   └── MainNavigator.js
│   ├── services/         # APIs
│   │   ├── api.js
│   │   └── mockData.js
│   └── assets/           # الصور والأيقونات
├── android/              # مجلد الأندرويد
├── ios/                  # مجلد iOS
├── App.js                # الملف الرئيسي
└── package.json
```

## ✨ الميزات

- ✅ شاشة تسجيل دخول (Google/Apple/زائر)
- ✅ عرض إعلانات بنمط Reels
- ✅ نظام نقاط (1 نقطة/دقيقة)
- ✅ منع الغش (كل إعلان مرة واحدة)
- ✅ صفحة ملف شخصي
- ✅ وضع الزائر

## 🎨 التخصيص

### تغيير الألوان:
الألوان الرئيسية في كل ملف:
- Primary: `#4F46E5` (Indigo)
- Secondary: `#7C3AED` (Purple)

### تغيير الشعار:
استبدل emoji 🦅 في:
- AuthScreen.js
- ProfileScreen.js

## 📦 بناء التطبيق للنشر

### Android (APK):
```bash
cd android
./gradlew assembleRelease
# الملف: android/app/build/outputs/apk/release/app-release.apk
```

### iOS (IPA):
1. افتح `ios/SaqrApp.xcworkspace` في Xcode
2. Product > Archive
3. Distribute App

## 🔐 إعدادات Google/Apple OAuth

### Google:
1. اذهب إلى Google Cloud Console
2. إنشاء OAuth 2.0 Client ID
3. أضف SHA-1 fingerprint للأندرويد
4. أضف Bundle ID للآيفون

### Apple:
1. Apple Developer Account مطلوب
2. إعداد Sign In with Apple
3. إضافة Capability في Xcode

## ⚠️ ملاحظات مهمة

1. **CORS**: تأكد من إعدادات CORS في Backend
2. **API URL**: غيّر URL في api.js للنشر
3. **Permissions**: راجع AndroidManifest.xml و Info.plist
4. **Video**: التطبيق يستخدم react-native-video

## 🐛 حل المشاكل

### Metro Bundler لا يعمل:
```bash
yarn start --reset-cache
```

### الأندرويد لا يتعرف على الجهاز:
```bash
adb devices
adb reverse tcp:8081 tcp:8081
```

### خطأ في iOS Pods:
```bash
cd ios
rm -rf Pods
pod deintegrate
pod install
```

## 📞 الدعم

للمزيد من المساعدة، راجع:
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

---

**تم التطوير بواسطة Emergent AI** 🦅
