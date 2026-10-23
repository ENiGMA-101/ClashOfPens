# Pen Fight: Desk Brawl (কলম যুদ্ধ)

> **The definitive Bangladeshi school-life pen-fighting game with authentic stationery, 2D Matter.js physics, customizable tables, 8-ball pool charge flicking, and Best-of-5 series play. Packaged for Android & Google Play Store distribution via Capacitor.**

---

## 🎮 Overview & Core Upgrades

### 1. 🖊️ Authentic Bangladeshi Pen Collection
- **Matador Pin-Point (Default & Free)**: The undisputed national classroom legend of Bangladesh with slim cylindrical barrel, translucent ink reservoir tube, fine 0.5mm tungsten needle tip, and pinpoint trajectory control. Immediately equipped on first launch without coins or registration.
- **Matador All-Time (Permanently Free)**: The dependable examination hall companion with hexagonal faceted translucent body, longitudinal grip ridges, and balanced center-of-gravity.
- **Authentic Matador Stationery Catalog**:
  - **Matador i-Teen**: Sporty two-tone accents and textured finger ribs with 0.7mm smooth ball.
  - **Matador i-Teen Rio**: Festive carnival yellow-green energy with high spin momentum.
  - **Matador Hi-School**: Board exam workhorse with crisp racing band and stable desk slide.
  - **Matador Glory Crystal**: Diamond-faceted transparent barrel with 0.5mm micro needle point.
  - **Matador Envoy Premium**: Weighted brass center-of-gravity, matte black barrel, and gold-plated clip.
  - **Matador Radiant**: Shimmering metallic pastel finish with ultra-smooth glide.
  - **Matador Woodmark**: Teak wood-grain camouflage pattern with natural roll balance.
  - **Matador Orbit**: Soft-touch rubberized barrel with dual orbital traction rings.
  - **Matador Smoothy**: Zero-friction low-viscosity ink with neon shock-absorbing grip.
- **Original Collectible Skins**: Fictional game editions labeled as original designs (*Neon Pulse*, *Thunder Strike*, *Golden Champion*, *Midnight Blue*, *Cosmic Ink*, *Ember Flame*, *Crystal Frost*, *Legendary Dragon*).

### 2. 🪑 Selectable Table Shapes & Sizes
- **Large Rectangle Table (Default)**: Spacious classroom desk (1040 × 640 px) with visible wood grain, scratches, and long runways for bank shots.
- **Square Table**: Genuinely square 1:1 battleground (780 × 780 px) with equal distance to all four edges and symmetrical starting positions.
- **Small Practice Table**: Compact bench arena (620 × 520 px) with high roll-off danger requiring precision touch.
- **Championship Table**: Lacquered mahogany tournament arena (1160 × 720 px) with gold-inlaid borders and tournament-grade slickness.
- **Custom Dimensions Desk**: Player-adjustable width (550–1200 px), height (500–1000 px), and live aspect ratio validation.

### 3. 🎱 8 Ball Pool Shot-Power System
- **Hold-to-Charge & Release-to-Shoot**: Press-and-hold the vertical cue power meter beside the desk to charge power smoothly from 5% to 100% over ~1.6s. Releasing executes the flick.
- **Max Power Lock (No Auto-Fire)**: Reaching 100% does *not* prematurely fire the shot. It locks at MAX with visual pulsing until the player releases their finger.
- **Attack Side Integration**:
  - **Side 1 — Top Strike (শীর্ষ আঘাত)**: Striking nib end generates dynamic angular spin to curve around obstacles.
  - **Side 2 — Middle Push (সরাসরি ধাক্কা)**: Dead-center linear strike with 98% momentum transfer on impact.
  - **Side 3 — Bottom Slam (ভারী আঘাত)**: Heavy bulldozing attack striking the pen cap with 1.85x mass density.

### 4. 🏆 Best-of-5 Series (Bo5) System
- **First to 3 Wins**: Compete in a best-of-5 tournament series with 5 distinct match slots.
- **Draw Replay Rule**: Drawn matches award no points to either side and trigger an immediate draw-replay in that match slot.
- **Idempotent Match Tracking**: Every match gets a unique instance ID to ensure scores never double-count during re-renders or page refreshes.
- **Live Series Scoreboard**: Complete visual indicators showing match slots (M1–M5), current series leader, and pending draw-replays.

### 5. 🤖 12 School-Life Bot Personalities
- **Backbench Boss** (Heavy Bulldozer), **Class Captain** (Discipline Enforcer), **Exam Ninja** (0.5mm Needle Master), **Desk Destroyer** (100% Power Slogger), **Last-Bencher Legend** (Veteran Pen Fighter), **Ink Master** (Trajectory Scholar), **Pencil Box Pro** (Stationery Connoisseur), **Silent Striker** (First-Bench Tactician), **Turbo Tip** (Rapid Flick Prodigy), **Matador Master** (Golden Champion), **Topper Bhai** (Physics Rank #1), and **The Comeback Kid** (Edge Reversal Specialist).
- Fully voiced with iconic Bengali and English classroom quips.

---

## 🚀 Running the Web Game Locally

```bash
# 1. Install dependencies
npm install

# 2. Run unit test suite (14/14 tests covering physics, table geometry & Bo5 rules)
npm test

# 3. Start local development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 📱 Android Studio & Google Play Release Workflow

### Prerequisites
- Node.js (v18+)
- Android Studio Ladybug / Meerkat (or newer)
- Android SDK 36 installed via Android Studio SDK Manager

### 1. Build Production Bundle & Sync Capacitor
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

### 3. Build Debug APK (For Testing on Physical Phone)
```bash
cd android
./gradlew assembleDebug
# Output APK: android/app/build/outputs/apk/debug/app-debug.apk
```
Connect your Android phone with USB debugging enabled:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 4. Create Release Keystore for Google Play
```bash
keytool -genkey -v -keystore penfight-release-key.jks \
  -alias penfight \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 5. Build Android App Bundle (.aab) for Google Play Console
```bash
cd android
./gradlew bundleRelease
# Output AAB: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🔒 100% Offline-First Architecture
- Audio synthesized via Web Audio API oscillators and noise buffers — no external MP3 dependencies.
- Vector Canvas pen renderer renders genuine Matador needle tips, fluted barrels, clips, and grips at native device pixel ratio.
- Zero telemetry, zero external fonts or CDN dependencies required for offline play.
