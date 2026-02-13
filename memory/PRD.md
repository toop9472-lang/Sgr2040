# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points. Users watch ads, earn points (1 point per 60 seconds), and can withdraw earnings when they reach 500 points ($1).

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

### Security Features ✅ (February 13, 2026)
- [x] CORS policy configured with allowlist
- [x] Security headers middleware (X-Content-Type-Options, X-Frame-Options, etc.)
- [x] Rate limiting on login endpoint (5 attempts per 30 minutes)
- [x] Password strength validation (min 8 chars, uppercase, lowercase, digit)
- [x] JWT refresh token support
- [x] Account lockout after failed attempts

### UI/UX Improvements ✅ (February 13, 2026)
- [x] TikTok-style Bottom Tab Bar (cyan + red play button design)
- [x] Professional Ionicons throughout mobile app
- [x] Enhanced Profile Page with menu items (withdraw, history, password, support, share, privacy)
- [x] Change Password dialog with validation
- [x] Transaction history modal
- [x] Referral code display and copy
- [x] Guest mode with clear call-to-action

### Backend APIs ✅
- [x] POST /api/auth/change-password - Change user password
- [x] POST /api/auth/signin - Login with rate limiting
- [x] POST /api/auth/register - Register with password validation
- [x] POST /api/auth/refresh-token - Refresh access token
- [x] GET /api/payments/packages - Fetch advertisement packages

---

## App Versions
- **Current Version:** 4.9.0
- **iOS Build Number:** 13
- **Android Version Code:** 34

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
- `/app/frontend/src/components/BottomNav.jsx` - TikTok-style web nav
- `/app/mobile/src/components/BottomNav.js` - TikTok-style mobile nav
- `/app/frontend/src/components/ProfilePage.jsx` - Enhanced profile page
- `/app/mobile/src/screens/ProfileScreen.js` - Mobile profile with all features
- `/app/backend/routes/auth_routes.py` - Auth APIs with change password
- `/app/backend/auth/rate_limiter.py` - Login rate limiting
- `/app/backend/auth/password_utils.py` - Password validation

---

## API Endpoints
- `GET /api/ads` - Fetch ads list
- `POST /api/ads/watch` - Record ad watch and earn points
- `POST /api/rewarded-ads/complete` - Complete rewarded ad view
- `GET /api/rewarded-ads/settings` - Get rewarded ads settings
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/signin` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh-token` - Refresh token
- `GET /api/payments/packages` - Get ad packages

---

## Credentials
- **Test User:** demo@saqr.app / Demo123456
- **Guest Mode:** Click "تجربة التطبيق بدون حساب" button

---

## Pending/Upcoming Tasks

### P0 - Critical
- [ ] **Server Always-On:** User needs to upgrade Emergent hosting plan to prevent sleep mode (blocks Apple approval)

### P1 - High Priority
- [ ] Build new iOS version (v4.9.0, build 13) after all fixes
- [ ] Submit to Apple App Store with demo video

### P2 - Medium Priority
- [ ] Implement "Add Personal Ad/Packages" feature
- [ ] Address Android compatibility warnings
- [ ] Real-time transaction history from backend

### P3 - Future
- [ ] Update iOS SDK to version 26 (deadline: April 2026)
- [ ] Create "Terms of Use" page
- [ ] Dark Mode support
- [ ] Social interaction features (likes/comments)
- [ ] Sign in with Apple integration

---

## Environment Files
- `.env.example` files created for backend, frontend, and mobile
- `.gitignore` updated to exclude sensitive files
- CREDENTIALS.md removed from repository

---

## Testing
- **Test Reports:** /app/test_reports/iteration_9.json
- **Success Rate:** Backend 100%, Frontend 100%
- **Last Test Date:** February 13, 2026
