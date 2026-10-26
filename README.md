# Pen Fight: Desk Brawl (কলম যুদ্ধ)

> **The definitive Bangladeshi school-life pen-fighting game with authentic stationery, 2D Matter.js physics, customizable tables, 8-ball pool charge flicking, Best-of-5 series play, and full-stack Neon PostgreSQL cloud saves. Packaged for Android & Google Play Store distribution via Capacitor.**

---

## 🛠️ Complete Project Audit & Upgrade Report

### Audit Summary
A comprehensive audit of the original repository revealed several critical areas requiring rebalancing and enhancement:
1. **Excessive Physics Power & Edge Instability**: Uncapped launch velocities (previously reaching up to ~39.04 world units) caused instant table clearings on 100% power shots. Edge detection eliminated pens prematurely when just a single corner grazed the boundary during spin.
2. **Hardcoded Match Starting Positions**: Pens started at static coordinates without allowing human tactical placement or randomized AI spawns.
3. **Multiplayer Name Handling**: Pass-and-play matches relied on generic player numbers without validated custom nicknames.
4. **Desktop Screen Space Utilization**: On large desktop screens, a 170px bottom panel compressed the table vertically into an artificially small view.
5. **Accidental Match Exit**: Quitting a match immediately dumped the player to the menu without confirmation or clean physics cleanup.
6. **Stat Persistence**: Saves were confined to browser `localStorage` without multi-device cloud synchronization or backend database storage.

### All Fixes & Upgrades Implemented
- **Phase 1 (Audit & Hygiene)**: Full audit conducted, clean architecture preserved, repository cache artifacts removed.
- **Phase 2 (Physics & Shot Power Balance)**:
  - Capped maximum velocity to **28 world units/step** (`MAX_SPEED = 28`).
  - Tuned power curve to progressive exponent: `speed = minLaunch + (baseMax - minLaunch) * (power / 100)^1.25 * sideMultiplier`.
  - Tested and calibrated at 10% (3.2–5.5), 25% (6.8–8.2), 50% (11.5–13.8), 75% (17.2–19.8), and 100% (22.8–26.88) launch speeds.
  - Calibrated attack sides: **Top Strike** (1.0x speed, dynamic spin factor), **Middle Push** (0.95x speed, direct linear push), and **Bottom Slam** (1.1x speed, heavy cap mass).
  - Custom strike impulse clamped with momentum preservation to prevent unrealistic catapulting.
  - Fair boundary detection requiring center-of-mass crossing or $\ge 2$ corners beyond desk edges in strict mode.
- **Phase 3 (Desktop & Mobile Responsiveness)**:
  - Dedicated desktop two-column layout (`w >= 1024px`) with a fixed 300px left control sidebar for power and attack sides, leaving the table full viewport prominence.
  - Synchronized coordinate transformation between canvas, mouse/touch input, aiming rays, and trajectory predictions.
  - Touch-friendly bottom HUD retained for mobile and tablet screens.
- **Phase 4 (Player Nicknames & Validation)**:
  - Player 1, 2, and 3 names prompt before Pass-and-Play.
  - Pure validation in `src/game/validation.ts` enforcing 1–18 trimmed characters, no control characters, and duplicate name prevention with inline warnings.
- **Phase 5 (Pen Placement Phase)**:
  - Interactive placement phase with dragging, angle rotation slider, table boundary safety margin (14px), and opponent pen collision checks.
  - Secret handover screen in Pass-and-Play to protect starting tactics.
  - Fair, randomized AI placement generated only after human placement is confirmed.
- **Phase 6 (Match Exit Confirmation)**:
  - Dedicated "Do you want to leave the match?" dialog with *Stay* and *Leave Match*.
  - Clean abandonment resetting physics without awarding coins/XP or corrupting completed series scores.
- **Phase 7 (Graphics & Visual Depth)**:
  - Rich wood-grain table textures, realistic shadows, edge teetering visual cues, collision rings, and victory confetti.
- **Phase 8 (Neon PostgreSQL & Google Auth)**:
  - Versioned PostgreSQL schema in `migrations/001_init.sql` (`users`, `player_saves`, `match_history`, `achievements`).
  - Server-side Express API (`/api/me`, `/api/auth/google`, `/api/auth/logout`, `/api/save`, `/api/matches`, `/api/account`).
  - Connection pooling with SSL and offline-first fallback.
  - Account and Cloud Save modal with real sync status, manual sync triggers, and account deletion.
- **Phases 9 & 10 (Testing & Build Verification)**:
  - 29/29 automated unit tests passing (`npm test`).
  - Strict TypeScript compilation (`npx tsc --noEmit`) and production bundling (`npm run build`) verified clean.

---

## 🎮 Core Game Features

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
- **Original Collectible Skins**: *Neon Pulse*, *Thunder Strike*, *Golden Champion*, *Midnight Blue*, *Cosmic Ink*, *Ember Flame*, *Crystal Frost*, *Legendary Dragon*.

### 2. 🪑 Selectable Table Shapes & Sizes
- **Large Rectangle Table (Default)**: Spacious classroom desk (1040 × 640 px) with visible wood grain and long runways for bank shots.
- **Square Table**: Genuinely square 1:1 battleground (780 × 780 px) with equal distance to all four edges.
- **Small Practice Table**: Compact bench arena (620 × 520 px) with high roll-off danger requiring precision touch.
- **Championship Table**: Lacquered mahogany tournament arena (1160 × 720 px) with gold-inlaid borders.
- **Custom Dimensions Desk**: Player-adjustable width (550–1200 px) and height (500–1000 px).

### 3. 🎯 Calibrated Attack Sides
- **Top Strike (শীর্ষ আঘাত)**: Striking the nib end generates dynamic angular spin to curve around obstacles (`1.0x` speed multiplier).
- **Middle Push (সরাসরি ধাক্কা)**: Dead-center linear strike with direct momentum transfer (`0.95x` speed multiplier).
- **Bottom Slam (ভারী আঘাত)**: Heavy bulldozing attack striking the pen cap with higher mass density (`1.1x` speed multiplier).

### 4. 🏆 Best-of-5 Series (Bo5) System
- **First to 3 Wins**: Compete in a best-of-5 tournament series with 5 distinct match slots.
- **Draw Replay Rule**: Drawn matches award no points and trigger an immediate draw-replay in that slot.
- **Idempotent Match Tracking**: Every match gets a unique instance ID to ensure scores never double-count.

---

## 🚀 Running the Full-Stack App Locally

### 1. Environment Setup
Copy `.env.example` to `.env` and provide your Neon PostgreSQL credentials:
```bash
cp .env.example .env
```

`.env` configuration:
```env
# Server Port
PORT=3000

# Neon PostgreSQL Connection URL
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Session JWT Secret
SESSION_SECRET="your_long_random_session_secret"

# Optional: Google OAuth Client ID for Google Sign-In
GOOGLE_CLIENT_ID=""
```

### 2. Database Migration
To apply the Neon schema to your PostgreSQL database:
```bash
# Using psql:
psql "$DATABASE_URL" -f migrations/001_init.sql
```

### 3. Development Server
```bash
# Install dependencies
npm install

# Run automated tests
npm test

# Start full-stack server (Express + Vite middlewares on port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📱 Android Studio & Google Play Release Workflow

### Prerequisites
- Node.js (v18+)
- Android Studio Ladybug / Meerkat (or newer)
- Android SDK 36 installed via Android Studio SDK Manager

### 1. Build Production Bundle & Sync Capacitor
```bash
# Build production web bundle
npm run build

# Sync assets and plugins into the Android project
npx cap sync android
```

### 2. Open in Android Studio
```bash
npx cap open android
```

### 3. Build Debug APK
```bash
cd android
./gradlew assembleDebug
# Output APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🧪 Automated Test Suite

Run the full test suite verifying physics calculations, placement boundary algorithms, Best-of-5 series state, and participant name validation:
```bash
npm test
```

All 29 tests will execute with zero external network dependencies.
