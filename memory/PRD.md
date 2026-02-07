# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points.

## Product Requirements
1. **Point System:** 1 point for every 60 seconds of total ad watch time
2. **Cheat Prevention:** Watch time only counted if ad is watched completely
3. **Variable Ad Duration:** Support ads of different lengths (15s, 30s, 60s, 90s)
4. **Login:** "Remember Me" option on login page
5. **UI/UX:** Slim timer bar at top, vertical progress bar for navigation
6. **Mobile Builds:** Android (.aab) and iOS (.ipa) production builds

## User's Preferred Language
Arabic (العربية)

---

## What's Been Implemented

### Completed Features ✅
- [x] Cheat-proof point system (1 point per 60 seconds of completed ad watch)
- [x] Ad Viewer with slim top bar timer
- [x] Vertical progress bar for ad navigation
- [x] Warning message for incomplete ads
- [x] Variable ad duration support
- [x] Remember Me feature on login
- [x] Mobile-optimized UI
- [x] Privacy Policy page (/privacy)
- [x] Android build (.aab) - Successfully uploaded
- [x] iOS build (.ipa) - Successfully uploaded to App Store Connect
- [x] App Store metadata and screenshots prepared
- [x] AdMob credentials configured (App ID: ca-app-pub-5132559433385403~6910358704)

### App Store Submission ✅ (February 7, 2026)
- iOS app submitted to App Store Connect
- App ID: 6758868843
- Version: 4.4.0
- Status: Waiting for Review

---

## Pending/Upcoming Tasks

### P0 - High Priority
- [ ] **AdMob Integration:** Requires MacBook to build with react-native-google-mobile-ads
  - iOS AdMob App ID: ca-app-pub-5132559433385403~6910358704
  - Rewarded Ad Unit ID: ca-app-pub-5132559433385403/2999033852
  - Blocked: CocoaPods requires Mac for iOS build

### P1 - Medium Priority
- [ ] Test AdMob integration after Mac build
- [ ] Submit Android app to Google Play Store

### P2 - Future
- [ ] Add more payment gateways (Tap, Tabby, Tamara need API keys)
- [ ] Implement Unity Ads as backup ad network

---

## Technical Architecture

### Frontend (Web)
- React with React Router
- Tailwind CSS + Shadcn UI
- Location: /app/frontend

### Backend
- FastAPI (Python)
- MongoDB database
- Location: /app/backend

### Mobile
- React Native with Expo
- EAS Build for production
- Location: /app/mobile

---

## Key Files
- `/app/frontend/src/components/AdViewer.jsx` - Web ad viewer
- `/app/mobile/src/screens/AdViewerScreen.js` - Mobile ad viewer
- `/app/backend/routes/rewarded_ads_routes.py` - Rewarded ads API
- `/app/frontend/src/pages/PrivacyPolicy.jsx` - Privacy policy page
- `/app/mobile/app.json` - Mobile app configuration with AdMob settings

---

## API Endpoints
- `GET /api/ads` - Fetch ads list
- `POST /api/ads/watch` - Record ad watch and earn points
- `POST /api/rewarded-ads/complete` - Complete rewarded ad view
- `GET /api/rewarded-ads/settings` - Get rewarded ads settings

---

## Credentials
- **Expo Account:** ziyad333 / Edcxswqaz123
- **Apple Developer:** sky-321@hotmail.com
- **Test User:** demo@saqr.com / demo123456
- **Admin:** sky-321@hotmail.com / Wsxzaq123

---

## Bug Fixes Applied
- Fixed double points issue (was giving 5 points instead of 1 per minute)
- Added tracking prevention for duplicate rewards in AdViewer

---

## Notes for Next Session
1. User will return with MacBook access
2. Need to build iOS and Android with AdMob enabled
3. Project zip available at: /app/frontend/public/mobile-project.zip
