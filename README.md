# StayReady

StayReady is a disaster-readiness app for Singapore. It shows **nearby hazards** (flash floods, haze/PM2.5, dengue clusters, strong wind, heat), a **live map**, **local emergency contacts**, **preparedness guides**, and **smart notifications**. It also includes a **personal preparedness checklist** and **gamified learning—play quizzes**, take the **daily challenge**, **bookmark** tricky questions, earn XP and **badges**, and redeem points for real-world **rewards**.

> **Disclaimer:** This project is for learning and community use. Data can lag behind official sources. Always follow instructions from Singapore authorities and emergency services.

---

## ✨ Features

- **Early warnings** for common hazards with severity badges and detail pages
- **Interactive map** (Leaflet) with overlays (rain, PM2.5, wind, temperature, dengue)
- **Preparedness guides** (before/during/after) + external resources
- **Gamification**
    * Quizzes by topic + Daily Challenge
    * Earn XP and unlock badges/milestones
    * Bookmark & review questions you want to revisit
- **Rewards Catalog** — earn points from learning & actions and **redeem for real-world rewards**
- **Notifications**: “All” (Warning + Danger) or “Danger-only”
- **SOS & contacts**: 995 (SCDF Ambulance/Fire), 999 (Police), plus quick-dial
- **Chatbot** (optional, OpenRouter) with SG-first tips and resource deep-links
- **i18n**: English, 中文, Bahasa Melayu, தமிழ்
- **Light/Dark themes**

---

## 🔧 Tech Stack

- **React Native** via **Expo SDK 52**
- **Expo Go** client app (must be **v52**)
- **Leaflet** (inside a WebView) for the map
- **expo-notifications**, **AsyncStorage**
- **react-i18next** for translations

---

## 🧰 Prerequisites

- **Node 18+** (LTS recommended)
- **npm** or **pnpm/yarn**
- **Expo CLI** (comes with `npx expo`)
- **Expo Go** app **version 52** on your device:
  - Android: [Expo Go SDK 52](https://expo.dev/go?sdkVersion=52&platform=android&device=true](https://expo.dev/go?sdkVersion=52&platform=android&device=true))

> **Why Expo 52?** The local toolchain (SDK 52) and the Expo Go app must match major versions to run the project.

---

## 🚀 Getting Started

1. **Download the project** (from Git or ZIP) into your machine.

2. **Open a terminal** in the project folder and install dependencies: `npm install`

3. **Start the project**: `npm start`

4. **Run on device**: Scan the QR with the **Expo Go (v52)** app to launch on your phone.

> If you change `.env`, restart Metro (`r`) or stop/start `npm start`.

---

## 🔐Configuration (Envionment Variables)

Create a `.env` file at the project root (do **NOT** commit secrets):

```bash
# Chatbot (OpenRouter)
EXPO_PUBLIC_OPENROUTER_ENDPOINT=https://openrouter.ai/api/v1/chat/completions
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-...your_key...
```

* If these are **missing**, the chatbot UI will stay functional but replies will be **disabled** (the app shows a friendly message).

* **Keys must not be public.** If you push a real key to GitHub, it can be auto-revoked by the provider.

### Getting an OpenRouter API key

Modal Usage: `mistralai/mistral-7b-instruct:free` (changeable in code).

1. Create an account at [OpenRouter](https://openrouter.ai/sign-in?redirect_url=https%3A%2F%2Fopenrouter.ai%2Fsettings%2Fpreferences) and [generate a key](https://openrouter.ai/settings/keys).

2. Put the key into `.env` as `EXPO_PUBLIC_OPENROUTER_API_KEY`.

3. Keep `EXPO_PUBLIC_OPENROUTER_ENDPOINT` as shown above.

4. Restart `npm start`.

> The app’s default model is a small instruct model for fast, low-cost testing. You can change it in code later if needed.

---

## 🗺️ OneMap Integration (Reverse Geocoding)

Recent OneMap Terms require a **token** for certain endpoints. This project:

* Requests a token via `POST /api/auth/post/getToken` with app credentials.

* **Caches** the token in AsyncStorage with an **early refresh window** (~2.5 days) because tokens typically expire in ~3 days.

* Injects the token when calling the reverse-geocode endpoint.

**Important notes:**

* The sample project includes credentials for coursework/demo. **Do not hardcode** production credentials into a public repo. Move them to a secure store (server function or build-time env).

* Token and expiry are stored under `onemap:token` / `onemap:tokenExp`. When near expiry, the app refreshes automatically.

* If reverse geocoding fails, the app falls back to a **heuristic region classifier** (North/East/West/Central/South).

---

## 🌤️ Data Sources

This app uses Singapore government open data:

* **Real-time weather** (rainfall, wind speed, air temperature, relative humidity, PM2.5) via **[data.gov.sg](https://data.gov.sg/) real-time APIs** (new “open” API host).

* **[Dengue clusters (GeoJSON)](https://data.gov.sg/datasets/d_dbfabf16158d1b0e1c420627c0819168/view)** via **Public Datasets API** (poll-download workflow).

* **[CHAS Clinics (GeoJSON)](https://data.gov.sg/datasets/d_548c33ea2d99e29ec63a7cc9edcccedc/view)** via **Public Datasets API**.

In code you’ll see:

* Base (real-time): `https://api-open.data.gov.sg/v2/real-time/api`

    * Endpoints used: `/rainfall`, `/wind-speed`, `/air-temperature`, `/relative-humidity`, `/pm25`

* Base (datasets): `https://api-open.data.gov.sg/v1/public/api`

    * Example: `GET /datasets/{id}/poll-download` → returns a **temporary URL**, then fetch that URL for raw GeoJSON

    * Dengue dataset id used: `d_dbfabf16158d1b0e1c420627c0819168`

    * CHAS clinics dataset id used: `d_548c33ea2d99e29ec63a7cc9edcccedc`

The app includes a small cache layer (`AsyncStorage`) with:

* **Fresh-while-revalidate** for fast UI

* **Stale-if-error** fallback up to a hard TTL so the app can still render during short outages

> If your environment enforces API keys or strict rate limits, you may need to add an API key header (`X-Api-Key`) where the code already accepts an optional `{ apiKey }` parameter. See `utils/api.js`.

---

## 🔔 Notifications

* **All hazard notifications** toggle in Settings:

    * **On** → receive **Warning & Danger** alerts

    * **Off** → receive **Danger-only** alerts

* Uses `expo-notifications`. The app asks for OS permission when enabling.

* You can review a simple in-app log (stored in `AsyncStorage`) and mark all as read.

Troubleshooting:

* If notifications don’t show: ensure OS permission is **granted**, and Android has a **channel** (the app creates a “default” channel).

* Turning notifications **off** clears scheduled notifications.

---

