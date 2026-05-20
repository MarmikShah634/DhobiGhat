# DhobiGhat Customer App — Setup Guide

This document covers everything **you need to configure** before building or distributing the Customer app. The app is built with **Expo SDK ~53** and **React Navigation**.

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

Push notifications use **Firebase Cloud Messaging (FCM)**.

### 3a. Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it (e.g. `DhobiGhat`)
3. Enable **Google Analytics** (optional)

### 3b. Add Android App

1. In Firebase console → **Project Settings** → **Add app** → Android
2. Package name: `com.yourcompany.dhobighat.customer` (must match `app.json → android.package`)
3. Download `google-services.json`
4. Place it at: `customer/google-services.json`

### 3c. Add iOS App

1. In Firebase console → **Project Settings** → **Add app** → iOS
2. Bundle ID: `com.yourcompany.dhobighat.customer` (must match `app.json → ios.bundleIdentifier`)
3. Download `GoogleService-Info.plist`
4. Place it at: `customer/GoogleService-Info.plist`

### 3d. Get the FCM Server Key

1. Firebase console → **Project Settings** → **Cloud Messaging** tab
2. Copy the **Server key** (legacy) or create a **Service Account key** (recommended)
3. Add it to your backend's `.env` as `FCM_SERVER_KEY`

### 3e. iOS APNs Setup (required for iOS push notifications)

1. Go to https://developer.apple.com → Certificates, Identifiers & Profiles
2. Create an **APNs Authentication Key** (.p8 file)
3. In Firebase console → Project Settings → Cloud Messaging → iOS app → upload the `.p8` key

---

## 4. Bundle ID / Package Name

Update `app.json` if you want a different bundle/package identifier:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.dhobighat.customer"
    },
    "android": {
      "package": "com.yourcompany.dhobighat.customer"
    }
  }
}
```

---

## 5. App Icon & Splash Screen

Replace the placeholder assets in `assets/`:

| File | Size | Purpose |
|---|---|---|
| `assets/icon.png` | 1024×1024 px | App icon (all platforms) |
| `assets/adaptive-icon.png` | 1024×1024 px | Android adaptive icon foreground |
| `assets/splash.png` | 1284×2778 px | Splash screen |
| `assets/favicon.png` | 48×48 px | Web (if needed) |

---

## 6. Install Dependencies

```bash
cd customer
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

This creates a project on expo.dev and adds `extra.eas.projectId` to `app.json`.

### 9c. Configure `eas.json`

Create `eas.json` in the `customer/` folder:

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
1. Create app at https://appstoreconnect.apple.com
2. Run `eas submit --platform ios`
3. EAS will upload the `.ipa` automatically

### Android (Google Play Console)
1. Create app at https://play.google.com/console
2. Run `eas submit --platform android`
3. EAS will upload the `.aab` automatically

---

## 11. Backend Connection Checklist

Make sure your backend has these endpoints (all documented in `backend/`):

- `POST /auth/otp/request` — request OTP
- `POST /auth/otp/verify` — verify OTP, returns JWT
- `POST /customers/register` — register new customer
- `GET /customers/me` — get profile
- `GET /washermen` — browse washermen
- `GET /washermen/:id` — washerman profile + pricing
- `GET /orders` — list orders
- `POST /orders` — create order
- `GET /notifications` — list notifications

---

## 12. Checklist Summary

- [ ] `.env` filled in with API URL
- [ ] `google-services.json` placed in `customer/`
- [ ] `GoogleService-Info.plist` placed in `customer/`
- [ ] Bundle ID / package name updated in `app.json`
- [ ] App icon and splash screen replaced
- [ ] `npm install` run
- [ ] Expo account created and `eas init` run
- [ ] Backend deployed and `EXPO_PUBLIC_API_URL` pointing to it
- [ ] APNs key uploaded to Firebase (iOS push notifications)

---

## Support

For Expo-specific issues: https://docs.expo.dev  
For React Navigation: https://reactnavigation.org  
For EAS Build: https://docs.expo.dev/build/introduction
