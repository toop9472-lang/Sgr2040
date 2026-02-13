# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points. Users watch ads, earn points (1 point per 60 seconds), and can withdraw earnings when they reach 500 points ($1).

## User's Preferred Language
Arabic (العربية)

---

## What's Been Implemented

### Core Features ✅
- [x] Cheat-proof point system (1 point per 60 seconds of completed ad watch)
- [x] Ad Viewer with slim top bar timer
- [x] Vertical progress bar for ad navigation
- [x] Warning message for incomplete ads
- [x] Variable ad duration support
- [x] Remember Me feature on login
- [x] Mobile-optimized UI
- [x] Privacy Policy page (/privacy)

### Mobile Builds ✅
- [x] Android build (.aab) - Successfully uploaded
- [x] iOS build (.ipa) - Successfully uploaded to App Store Connect
- [x] AdMob credentials configured (App ID: ca-app-pub-5132559433385403~6910358704)

### Security Features ✅
- [x] CORS policy configured with allowlist
- [x] Security headers middleware
- [x] Rate limiting on login endpoint
- [x] Password strength validation
- [x] JWT refresh token support
- [x] Account lockout after failed attempts
- [x] POST /api/auth/change-password endpoint

### UI/UX Updates ✅ (February 13, 2026)
- [x] **Slim Bottom Tab Bar** - Clean, minimal design (48px height)
- [x] **Professional Icons** - All emojis replaced with Lucide/Ionicons
- [x] **Enhanced Profile Page** - Menu items, referral code, transaction history
- [x] **Clean Toasts** - Removed all emojis from toast messages
- [x] **Git Cleanup** - Removed temp files (.gitconfig, test_result.md, mobile_backup/)

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
- Lucide React icons
- Location: /app/frontend

### Backend
- FastAPI (Python)
- MongoDB database
- Location: /app/backend

### Mobile
- React Native with Expo
- Ionicons for icons
- EAS Build for production
- Location: /app/mobile

---

## Key Files
- `/app/frontend/src/components/BottomNav.jsx` - Slim web nav
- `/app/mobile/src/components/BottomNav.js` - Slim mobile nav
- `/app/frontend/src/components/ProfilePage.jsx` - Enhanced profile
- `/app/backend/routes/auth_routes.py` - Auth APIs
- `/app/.gitignore` - Updated to exclude temp files

---

## API Endpoints
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/signin` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh-token` - Refresh token
- `GET /api/payments/packages` - Get ad packages
- `POST /api/ads/watch` - Record ad watch

---

## Credentials
- **Test User:** demo@saqr.app / Demo123456
- **Guest Mode:** Click "تجربة التطبيق بدون حساب"

---

## Pending Tasks

### P0 - Critical
- [ ] **Server Always-On:** Upgrade Emergent hosting plan to prevent sleep mode

### P1 - High Priority
- [ ] Build new iOS version (v4.9.0, build 13)
- [ ] Submit to Apple App Store

### P2 - Medium Priority
- [ ] Implement "Add Personal Ad/Packages" feature
- [ ] Address Android compatibility warnings

### P3 - Future
- [ ] Update iOS SDK to version 26 (deadline: April 2026)
- [ ] Create "Terms of Use" page
- [ ] Dark Mode support
- [ ] Social interaction features
- [ ] Sign in with Apple integration

---

## Recent Changes (February 13, 2026)
1. Reverted Bottom Tab Bar from TikTok-style to slim clean design
2. Replaced all UI emojis with professional Lucide/Ionicons
3. Cleaned git repository from temporary files
4. Updated .gitignore to prevent junk files

---

## Testing
- **Last Test Date:** February 13, 2026
- **Test Reports:** /app/test_reports/iteration_9.json
