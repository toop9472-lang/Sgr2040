# Saqr Rewards App - PRD

## Original Problem Statement
Build an application for watching rewarded video ads where users earn points. Users watch ads, earn points (1 point per 60 seconds), and can withdraw earnings when they reach 500 points ($1).

## User's Preferred Language
Arabic (العربية)

---

## What's Been Implemented

### Core Features ✅
- [x] Cheat-proof point system (1 point per 60 seconds)
- [x] Ad Viewer with timer
- [x] Guest mode
- [x] Remember Me feature
- [x] Mobile-optimized UI
- [x] Privacy Policy page

### Mobile Builds ✅
- [x] Android build (.aab)
- [x] iOS build (.ipa)
- [x] AdMob configured

### Security Features ✅
- [x] CORS policy with allowlist
- [x] Security headers middleware
- [x] Rate limiting on login
- [x] Password strength validation
- [x] JWT refresh tokens
- [x] Account lockout
- [x] Change password API

### NEW FEATURES (February 13, 2026) ✅

#### 1. Support Tickets System
- [x] POST /api/support/tickets - Create ticket
- [x] GET /api/support/tickets - Get user tickets
- [x] GET /api/support/tickets/{id} - Get ticket details
- [x] POST /api/support/tickets/{id}/reply - Reply to ticket
- [x] POST /api/support/tickets/{id}/close - Close ticket
- [x] SupportTicketsPage.jsx component

#### 2. Two-Factor Authentication (2FA)
- [x] POST /api/2fa/enable - Enable 2FA
- [x] POST /api/2fa/verify - Verify and activate
- [x] POST /api/2fa/disable - Disable 2FA
- [x] POST /api/2fa/send-code - Send login code
- [x] POST /api/2fa/validate - Validate code
- [x] GET /api/2fa/status - Check status
- [x] Backup codes support
- [x] TwoFactorSettings.jsx component

#### 3. Comments System (Social)
- [x] POST /api/comments/ - Create comment
- [x] GET /api/comments/ad/{id} - Get ad comments
- [x] POST /api/comments/like - Like/unlike comment
- [x] DELETE /api/comments/{id} - Delete comment
- [x] Replies support
- [x] CommentsSection.jsx component

#### 4. Dark Mode
- [x] ThemeContext.js with dark/light/system modes
- [x] CSS variables for theming
- [x] Persistent preference in localStorage

#### 5. Multi-Language Support
- [x] Arabic (ar) - RTL
- [x] English (en)
- [x] French (fr)
- [x] Turkish (tr)
- [x] Updated translations.js
- [x] Language selector in settings

#### 6. Settings Page
- [x] SettingsPage.jsx component
- [x] Language selection
- [x] Theme selection
- [x] 2FA settings link
- [x] Notifications settings

### UI/UX Updates ✅
- [x] Slim Bottom Tab Bar
- [x] Professional icons (Lucide/Ionicons)
- [x] Clean toasts without emojis
- [x] Git cleanup completed

---

## App Versions
- **Current Version:** 5.0.0
- **iOS Build Number:** 14
- **Android Version Code:** 35

---

## Technical Architecture

### Frontend (Web)
- React + Tailwind CSS + Shadcn UI
- ThemeContext for dark/light modes
- LanguageContext for i18n

### Backend
- FastAPI (Python) + MongoDB
- New routes: support, 2fa, comments

### Mobile
- React Native + Expo
- Ionicons

---

## New API Endpoints (v5.0.0)

### Support
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/tickets` - List tickets
- `POST /api/support/tickets/{id}/reply` - Reply

### 2FA
- `POST /api/2fa/enable` - Enable
- `POST /api/2fa/verify` - Verify
- `GET /api/2fa/status` - Status

### Comments
- `POST /api/comments/` - Create
- `GET /api/comments/ad/{ad_id}` - List
- `POST /api/comments/like` - Like

---

## Pending Tasks

### P0 - Critical
- [ ] **Server Always-On:** Upgrade hosting plan

### P1 - High Priority  
- [ ] Build new iOS version (v5.0.0, build 14)
- [ ] Submit to Apple App Store
- [ ] Build new Android version

### P2 - Medium Priority
- [ ] "Add Personal Ad/Packages" feature
- [ ] Email notifications for 2FA
- [ ] Analytics dashboard

### P3 - Future
- [ ] Update iOS SDK to v26
- [ ] Terms of Use page

---

## Files Created/Modified

### New Files
- `/app/backend/routes/support_routes.py`
- `/app/backend/routes/two_factor_routes.py`
- `/app/backend/routes/comments_routes.py`
- `/app/frontend/src/context/ThemeContext.js`
- `/app/frontend/src/components/SupportTicketsPage.jsx`
- `/app/frontend/src/components/TwoFactorSettings.jsx`
- `/app/frontend/src/components/CommentsSection.jsx`
- `/app/frontend/src/components/SettingsPage.jsx`

### Modified Files
- `/app/backend/server.py` - Added new routers
- `/app/frontend/src/i18n/translations.js` - 4 languages
- `/app/frontend/src/i18n/LanguageContext.js` - Multi-lang support
- `/app/mobile/app.json` - Version bump to 5.0.0

---

## Credentials
- **Test User:** demo@saqr.app / Demo123456
- **Guest Mode:** Click "تجربة التطبيق بدون حساب"

---

## Testing Status
- Backend APIs: Working
- Frontend Components: Created
- Mobile: Ready for build
