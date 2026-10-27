# ClashOfPens — Pen Fight: Desk Brawl (কলম যুদ্ধ)

> **The definitive Bangladeshi school-life pen-fighting arcade game with authentic stationery, 2D Matter.js physics, customizable tables, 8-ball pool charge flicking, Best-of-5 series play, and full-stack Neon PostgreSQL cloud saves. Packaged for Android, Windows (x64/x86), and Linux (x64).**

---

## 🚀 Multi-Platform Release Architecture

ClashOfPens is packaged and distributed across three major platforms:

| Platform | Target Architecture | Distribution Packages | Output Location |
| :--- | :--- | :--- | :--- |
| **Android** | arm64-v8a, armeabi-v7a, x86_64 | Debug APK, Release APK, Play Store AAB | `release-builds/ClashOfPens-Android-*.{apk,aab}` |
| **Windows** | x64, ia32 (x86) | NSIS Installer (`.exe`), Portable (`.exe`) | `release-builds/ClashOfPens-Windows-*.exe` |
| **Linux** | x64 | AppImage (`.AppImage`), Debian Package (`.deb`) | `release-builds/ClashOfPens-Linux-x64.{AppImage,deb}` |
| **Web** | Modern Browsers | Production SPA + Express Backend | `dist/` |

---

## 📦 Local Build Commands

All release targets have explicit, reproducible npm scripts:

### 1. Web Production Build
```bash
npm run build:web
```
Compiles optimized static assets with relative paths into the `dist/` folder.

### 2. Android Build (via Capacitor 8)
Prerequisites: JDK 21 and Android SDK installed locally.
```bash
# Sync web build to native Android project
npm run build:android:sync

# Build Debug APK (installs on any test device without custom signing keys)
npm run build:android:debug
# Generated file: release-builds/ClashOfPens-Android-debug.apk

# Build Signed Release APK (for direct sideload / web downloads)
npm run build:android:release
# Generated file: release-builds/ClashOfPens-Android-release.apk

# Build Google Play Console App Bundle (.aab)
npm run build:android:aab
# Generated file: release-builds/ClashOfPens-Android-release.aab
```

### 3. Windows Desktop Build (via Electron & electron-builder)
Runs on Windows host (or via Wine/Cross-build where supported):
```bash
# Windows x64 Installer & Portable executable
npm run build:desktop:win:x64
# Generated: release-builds/ClashOfPens-Windows-x64-Setup.exe
# Generated: release-builds/ClashOfPens-Windows-x64-Portable.exe

# Windows x86 (ia32) Installer
npm run build:desktop:win:x86
# Generated: release-builds/ClashOfPens-Windows-ia32-Setup.exe
```

### 4. Linux Desktop Build
Runs on Linux host (or Ubuntu GitHub Actions runner):
```bash
# Linux x64 AppImage and .deb package
npm run build:desktop:linux:x64
# Generated: release-builds/ClashOfPens-Linux-x64.AppImage
# Generated: release-builds/ClashOfPens-Linux-x64.deb
```

### 5. Multi-Platform All Targets
```bash
npm run build:desktop:all
```

---

## 🤖 Automated GitHub Actions Release Pipeline

The repository includes a production-grade automated release workflow at `.github/workflows/release.yml`.

### How to Trigger a Release:
1. **Automated Version Tag Release:**
   Push a Git tag starting with `v` (e.g. `v1.0.1`):
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
2. **Manual Workflow Execution:**
   Go to your GitHub repository -> **Actions** -> **ClashOfPens Multi-Platform Release** -> **Run workflow**. Check `create_release: true` if you want it published as a formal GitHub Release.

### Workflow Stages:
- **`build-android` (Ubuntu runner)**: Builds web assets, syncs Capacitor, and generates `ClashOfPens-Android-debug.apk`. If Android signing secrets are present, it signs and packages `ClashOfPens-Android-release.apk` and `ClashOfPens-Android-release.aab`.
- **`build-windows` (Windows runner)**: Compiles `ClashOfPens-Windows-x64-Setup.exe`, `ClashOfPens-Windows-x64-Portable.exe`, and `ClashOfPens-Windows-ia32-Setup.exe`.
- **`build-linux` (Ubuntu runner)**: Compiles `ClashOfPens-Linux-x64.AppImage` and `ClashOfPens-Linux-x64.deb`.
- **`publish-release`**: Downloads all build artifacts, consolidates them, and publishes a tagged GitHub Release with release notes and downloadable binaries attached.

---

## 🔐 Android Keystore & Production Signing Setup

Never commit keystores or passwords to Git. For automated release signing in GitHub Actions, configure these **Repository Secrets** (Settings -> Secrets and variables -> Actions):

1. **Generate your upload keystore locally:**
   ```bash
   keytool -genkey -v -keystore release.keystore -alias clashofpens -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Encode the keystore file to base64:**
   - On Linux/macOS: `base64 -w 0 release.keystore > keystore_base64.txt`
   - On Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Out-File -Encoding ASCII keystore_base64.txt`
3. **Add the following GitHub Secrets:**
   - `ANDROID_KEYSTORE_BASE64`: Paste the entire base64 string from `keystore_base64.txt`.
   - `ANDROID_KEYSTORE_PASSWORD`: Keystore password chosen during keytool generation.
   - `ANDROID_KEY_ALIAS`: Keystore alias (e.g., `clashofpens`).
   - `ANDROID_KEY_PASSWORD`: Key password chosen during generation.

*Note: If these secrets are not configured, the pipeline safely generates the debug APK for manual testing and issues a warning.*

---

## 🌐 Offline Mode & Backend Compatibility

ClashOfPens is designed with an **offline-first** architecture:
- **Core Game Launches Offline**: All pen physics, tables, bot AI, sounds, and local save progression function without internet connectivity.
- **Packaged App API Resolution**: In packaged Android (Capacitor) and desktop (Electron) applications where the app loads from `capacitor://localhost` or `file://`, network requests automatically target the configured production cloud backend (`https://clash-of-pens.vercel.app` or custom `VITE_API_BASE_URL`).
- **Graceful Error Handling**: Cloud sync and Google Sign-In gracefully report an offline/server unavailable state without throwing uncaught exceptions, locking controls, or claiming false saves.
- **Credential Protection**: Database passwords (`DATABASE_URL`), session keys (`SESSION_SECRET`), and private credentials remain strictly server-side and are never bundled into client apps.

---

## 🧪 Testing & Verification

Run the automated test suite verifying physics, timer countdown, placement algorithms, Best-of-5 series state, and player validation:
```bash
npm test
```
All 36 unit tests execute locally with zero external dependencies.

Check TypeScript compilation:
```bash
npm run lint
```
