# Pen Fight: Desk Brawl (কলম যুদ্ধ)

> **The classic back-bench pen-fighting mobile game, crafted with HTML5 Canvas, Matter.js 2D physics, and packaged for Android & Google Play Store distribution via Capacitor.**

---

## 🎮 Overview & Game Features

- **Realistic Physics & Attack-Side Mechanics**:
  - **Side 1 — Top Strike (শীর্ষ আঘাত)**: Hits the nib/tip. Rotates in an arc, sweeping around obstacle pens to clip targets.
  - **Side 2 — Middle Push (সরাসরি ধাক্কা)**: Dead-center linear strike with zero spin. Maximum momentum transfer on direct impact.
  - **Side 3 — Bottom Slam (ভারী আঘাত)**: Heavy bulldozing attack striking the pen cap with 1.85x mass density.
- **Game Modes**:
  - **Quick Match**: Instant 2-player or 3-player battle.
  - **AI Battle**: Play against Easy, Normal, or Sharp bot intelligence.
  - **Pass-and-Play**: Local multiplayer sharing one smartphone with private turn transitions.
  - **Practice Range**: Unlimited test flicks with predictive trajectory guides.
  - **Challenge Mode**: 6 trick-shot missions with coin & XP rewards.
  - **Championship Tournament**: 3-round bracket cup against iconic back-bench champions to win trophies.
- **Pen Locker & Collectibles**:
  - **Classics**: Classic Blue, Exam Black, Red Ink, Green Ink, Purple Ink.
  - **Hero Squad**: Ember Tiger, Monsoon, Thunder Rani, Shapla Guard, Night Kite, Jute Titan.
  - **Legendary**: Gold Champion, Neon Pulse, Cosmic Pen.
- **Wooden Desk Arenas**:
  - Classic Classroom, Examination Hall (low friction), Art Room Workbench, Science Lab Slate (rough high friction), Midnight Study Desk, Golden Championship Table.
- **100% Offline-First**: Zero required internet connections or telemetry. Audio synthesized client-side via Web Audio API.

---

## 🚀 Running the Web Game Locally

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser:
# http://localhost:3000
```

---

## 📱 Android Studio & Google Play Release Workflow

### Prerequisites
- Node.js (v18+)
- Android Studio Ladybug / Meerkat (or newer)
- Android SDK 36 (Android 16) installed via Android Studio SDK Manager

### 1. Build and Sync Capacitor Native Android Assets
```bash
# Build the production web bundle
npm run build

# Sync assets and plugins into the Android project
npx cap sync android
```

### 2. Open in Android Studio
```bash
npx cap open android
```
Alternatively, open the `/android` directory directly in Android Studio.

### 3. Build Debug APK (For Testing on Physical Phone)
```bash
cd android
./gradlew assembleDebug
# The output APK will be at:
# android/app/build/outputs/apk/debug/app-debug.apk
```
Connect your Android device with USB debugging enabled, then run:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 4. Create Release Keystore for Google Play
Run this command once in your terminal to create a 2048-bit RSA release signing key:
```bash
keytool -genkey -v -keystore penfight-release-key.jks \
  -alias penfight \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
> ⚠️ **Important Security Note**: Never commit `penfight-release-key.jks` or passwords to git repository. Store it in a safe, backed-up location.

### 5. Build Android App Bundle (.aab) for Google Play Console
```bash
cd android
./gradlew bundleRelease
# Output AAB is located at:
# android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📋 Google Play Store Listing & Compliance Guide

- **Target SDK**: Android 16 (API Level 36) — fully compliant with Google Play's latest requirements.
- **Package ID**: `com.penfight.deskbrawl`
- **Short Description (under 80 characters)**:
  `Flick your pen, knock rivals off the wooden desk, and claim the championship!`
- **Bangla Tagline**:
  `কলম যুদ্ধ (Pen Fight) &middot; ব্যাকবেঞ্চের নস্টালজিক খেলা`
- **Category**: Arcade / Sports / Board Game
- **Content Rating**: Everyone (No violence, cartoon physical motion).
- **Data Safety**: No personal data collected, stored, or shared.
- **Closed Testing Requirement (Post-Nov 2023 Personal Accounts)**:
  - If your Google Play Console personal account was created after Nov 13, 2023, you must run a closed test with at least **12 testers opted in continuously for 14 days** before applying for production access.

---

## 🧪 Testing & Verification

Run the automated physics logic unit tests:
```bash
npm run test # or npx tsx --test src/game/physics.test.ts
```
