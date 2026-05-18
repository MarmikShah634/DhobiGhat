# DhobiGhat Washerman App — Setup Guide

This document covers everything **you need to configure** before building or distributing the Washerman app. The app is built with **Expo SDK ~53** and **React Navigation**.

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| npm / yarn | latest | bundled with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |
| Xcode (iOS) | 15+ | Mac App Store |
| Android Studio (Android) | latest | https://developer.android.com/studio |

---

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | What to put |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of your backend (e.g. `https://api.yourdomain.com` or `http://192.168.x.x:3000` for local dev) |
| `EXPO_PUBLIC_APP_ENV` | `development`, `staging`, or `production` |

> **Note:** Expo only exposes variables prefixed with `EXPO_PUBLIC_` to the app bundle. Never put secrets here.

---

## 3. Firebase Setup (Push Notifications)

Push notifications use **Firebase Cloud Messaging (FCM)**. The washerman app needs its own Firebase app entries (or can share the same Firebase project as the customer app with separate app registrations).

### 3a. Create / Reuse a Firebase Project

1. Go to https://console.firebase.google.com
2. Use the same project as the customer app, or create a new one

### 3b. Add Android App

1. Firebase console → **Project Settings** → **Add app** → Android
2. Package name: `com.yourcompany.dhobighat.washerman` (must match `app.json → android.package`)
3. Download `google-services.json`
4. Place it at: `washerman/google-services.json`

### 3c. Add iOS App

1. Firebase console → **Project Settings** → **Add app** → iOS
2. Bundle ID: `com.yourcompany.dhobighat.washerman` (must match `app.json → ios.bundleIdentifier`)
3. Download `GoogleService-Info.plist`
4. Place it at: `washerman/GoogleService-Info.plist`

### 3d. Get the FCM Server Key

Same key as customer app if sharing a Firebase project. Add it to your backend's `.env` as `FCM_SERVER_KEY`.

### 3e. iOS APNs Setup (required for iOS push notifications)

1. Go to https://developer.apple.com → Certificates, Identifiers & Profiles
2. Create a separate **APNs Authentication Key** for the washerman app's bundle ID
3. Upload it in Firebase console → Project Settings → Cloud Messaging → iOS app

---

## 4. Bundle ID / Package Name

Update `app.json` with your actual company identifier:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.dhobighat.washerman"
    },
    "android": {
      "package": "com.yourcompany.dhobighat.washerman"
    }
  }
}
```

> Both apps must have **different** bundle IDs / package names so they can coexist on a device.

---

## 5. App Icon & Splash Screen

Replace the placeholder assets in `assets/`:

| File | Size | Purpose |
|---|---|---|
| `assets/icon.png` | 1024×1024 px | App icon (all platforms) |
| `assets/adaptive-icon.png` | 1024×1024 px | Android adaptive icon foreground |
| `assets/splash.png` | 1284×2778 px | Splash screen |
| `assets/favicon.png` | 48×48 px | Web (if needed) |

Use a distinct icon/splash so washermen can visually tell the two apps apart on their device.

---

## 6. Install Dependencies

```bash
cd washerman
npm install
```

---

## 7. Run Locally

### iOS Simulator
```bash
npx expo start --ios
```

### Android Emulator
```bash
npx expo start --android
```

### Physical Device (Expo Go)
```bash
npx expo start
# Scan the QR code with Expo Go app
```

> **Note:** Push notifications require a real device and a development build (not Expo Go).

---

## 8. Development Build (for Push Notifications)

Expo Go does not support native modules like notifications. Use EAS Build:

```bash
# Login to Expo account
eas login

# Configure project (first time)
eas build:configure

# Build for simulator (iOS) or device (Android)
eas build --profile development --platform ios
eas build --profile development --platform android
```

---

## 9. EAS Build (Production)

### 9a. Create an Expo Account

Sign up at https://expo.dev

### 9b. Link Project

```bash
eas init
```

This creates a project on expo.dev and adds `extra.eas.projectId` to `app.json`. Use a **different project** than the customer app.

### 9c. Configure `eas.json`

Create `eas.json` in the `washerman/` folder:

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### 9d. Build for Production

```bash
eas build --platform all --profile production
```

---

## 10. App Store Submission

### iOS (App Store Connect)
1. Create a **separate app listing** at https://appstoreconnect.apple.com (distinct from the customer app)
2. Run `eas submit --platform ios`

### Android (Google Play Console)
1. Create a **separate app listing** at https://play.google.com/console
2. Run `eas submit --platform android`

> The washerman app should be listed separately (e.g. "DhobiGhat — For Washermen") so customers don't accidentally install it.

---

## 11. Backend Connection Checklist

Make sure your backend has these endpoints (all documented in `backend/`):

- `POST /auth/otp/request` — request OTP (role: washerman)
- `POST /auth/otp/verify` — verify OTP, returns JWT
- `POST /washermen/register` — register new washerman
- `GET /washermen/me` — get my profile
- `PATCH /washermen/me` — update profile / availability
- `GET /orders` — list orders for this washerman
- `PATCH /orders/:id/accept` — accept order
- `PATCH /orders/:id/decline` — decline order
- `PATCH /orders/:id/start-collecting` — start collecting
- `PATCH /orders/:id/mark-in-progress`
- `PATCH /orders/:id/mark-ready`
- `PATCH /orders/:id/mark-delivered`
- `PATCH /orders/:id/mark-paid`
- `GET /pricing/wash-types` — list wash types
- `POST /pricing/wash-types` — create wash type
- `DELETE /pricing/wash-types/:id`
- `GET /pricing/items` — list items
- `POST /pricing/items` — create item
- `DELETE /pricing/items/:id`
- `GET /pricing/grid` — get price grid
- `POST /pricing/grid` — upsert prices
- `GET /accounting/summary` — earnings summary
- `GET /reviews/washerman/me` — my reviews
- `GET /notifications` — list notifications

---

## 12. Unique Code Flow

When a washerman registers, the backend returns a `unique_code` (e.g. `RMLW4K`). This is displayed prominently in the **Profile** tab. Washermen share this code with their customers so customers can link to them in the customer app. No action is needed from you — this is handled automatically by the backend.

---

## 13. Checklist Summary

- [ ] `.env` filled in with API URL
- [ ] `google-services.json` placed in `washerman/`
- [ ] `GoogleService-Info.plist` placed in `washerman/`
- [ ] Bundle ID / package name updated in `app.json` (different from customer app)
- [ ] App icon and splash screen replaced (distinct from customer app)
- [ ] `npm install` run
- [ ] Expo account created and `eas init` run
- [ ] Backend deployed and `EXPO_PUBLIC_API_URL` pointing to it
- [ ] APNs key uploaded to Firebase (iOS push notifications)
- [ ] Separate App Store / Play Store listing created for washerman app

---

## Support

For Expo-specific issues: https://docs.expo.dev  
For React Navigation: https://reactnavigation.org  
For EAS Build: https://docs.expo.dev/build/introduction
