# CryptoVault - Real-Time Crypto Portfolio Tracker

**Live Demo:** https://crypto-dashboard-three-tau.vercel.app
## 🚀 Overview

CryptoVault is a robust, real-time cryptocurrency dashboard that allows users to track market prices, manage a personal portfolio, and visualize price trends. Designed with international users in mind, it features a **fully bilingual interface (English/Turkish)** and production-grade resilience against API limits.

Built with **React (Vite)** and **Firebase**, it solves the common "stale data" problem by syncing user portfolios in real-time while minimizing API usage to stay within free-tier limits.

## ✨ Key Features

* **🌍 Multi-Language Support:** Instant switching between **English** and **Turkish**, handled via a custom lightweight state management system (no heavy external libraries).
* **📈 Real-Time Market Data:** Live pricing updates via the CoinGecko API with auto-refresh intervals.
* **☁️ Persistent Portfolio:** Users can log in via **Google Auth** to save their watchlist and holdings to the cloud (Firestore).
* **📊 Interactive Charts:** Dynamic area charts (Recharts) that visualize price history (24h, 7d, 30d) and color-code based on profit/loss trends.
* **🛡️ Smart Input Sanitization:** Automatically detects and fixes common ID errors (e.g., typing `shiba` auto-corrects to `shiba-inu`).
* **🔢 Precision Formatting:** "Smart Decimal" logic automatically expands precision for micro-cap coins (e.g., Pepe at $0.000009) while keeping large cap coins clean.
* **⚙️ Account Management:** Dedicated settings to reset portfolio data or permanently delete user accounts and data (GDPR compliant).

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite
* **Styling:** Tailwind CSS
* **Authentication:** Firebase Auth (Google Provider)
* **Database:** Cloud Firestore (NoSQL)
* **Visualization:** Recharts
* **Internationalization:** Custom State-based I18n
* **API:** CoinGecko Public API

## 🧩 Technical Highlights & Challenges Solved

### 1. Custom Lightweight Localization
Instead of using heavy libraries like `i18next`, I implemented a performant, state-driven translation engine.
* **Solution:** A centralized dictionary object (`translations.js`) is accessed dynamically based on a `lang` state. This keeps bundle size small and allows for instant UI switching without page reloads.

### 2. Robust API Rate Limit Handling
The CoinGecko free tier is strict (approx. 10-15 calls/minute).
* **Solution:** Implemented centralized fetch logic with error trapping. If a `429 Rate Limit` error occurs, the UI degrades gracefully, showing a specific "Wait 60s" warning rather than crashing.

### 3. "Self-Healing" Data Integrity
Users often misspell Coin IDs (e.g., "shib" instead of "shiba-inu").
* **Solution:** I built a **Client-Side Sanitizer** that intercepts user input. If a known alias is detected, it is swapped for the valid API ID instantly. On application load, the system also scans the database and silently repairs any broken IDs from previous sessions.

## 🚀 How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/cryptovault.git](https://github.com/yourusername/cryptovault.git)
    cd cryptovault
    ```

2.  **Install Dependencies:**
    ```bash
    npm install firebase recharts date-fns
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add your keys:
    ```env
    VITE_CG_API_KEY=your_coingecko_key
    
    # Firebase Configuration
    VITE_FIREBASE_API_KEY=your_firebase_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the App:**
    ```bash
    npm run dev
    ```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

