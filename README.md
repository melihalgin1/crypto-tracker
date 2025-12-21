# CryptoVault - Real-Time Crypto Portfolio Tracker

**Live Demo:** [Insert Vercel Link Here]  
**Repository:** [Insert GitHub Link Here]

## 🚀 Overview

CryptoVault is a robust, real-time cryptocurrency dashboard that allows users to track market prices, manage a personal portfolio, and visualize price trends. Unlike standard tracker tutorials, this application features **production-grade resilience**, handling API rate limits gracefully, sanitizing user inputs automatically, and persisting state across devices using Firebase Cloud Firestore.

Built with **React (Vite)** and **Firebase**, it solves the common "stale data" problem by syncing user portfolios in real-time while minimizing API usage to stay within free-tier limits.

## ✨ Key Features

* **Real-Time Market Data:** Live pricing updates via the CoinGecko API with auto-refresh intervals.
* **Persistent Portfolio:** Users can log in via **Google Auth** to save their watchlist and holdings to the cloud (Firestore).
* **Interactive Charts:** Dynamic area charts (Recharts) that visualize price history (24h, 7d, 30d) and color-code based on profit/loss trends.
* **Smart Input Sanitization:** Automatically detects and fixes common ID errors (e.g., typing `shiba` auto-corrects to `shiba-inu`, `bnb` to `binancecoin`).
* **Precision Formatting:** "Smart Decimal" logic automatically expands precision for micro-cap coins (like Pepe at $0.000009) while keeping large cap coins clean ($90,000.00).
* **Account Management:** Dedicated settings to reset portfolio data or permanently delete user accounts and data (GDPR compliant).
* **Responsive Design:** Fully mobile-optimized interface with a collapsible header and adaptive grid layout.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite
* **Styling:** Tailwind CSS
* **Authentication:** Firebase Auth (Google Provider)
* **Database:** Cloud Firestore (NoSQL)
* **Visualization:** Recharts
* **API:** CoinGecko Public API

## 🧩 Technical Highlights & Challenges Solved

### 1. Robust API Rate Limit Handling
The CoinGecko free tier is strict (approx. 10-15 calls/minute).
* **Solution:** Implemented a centralized fetch logic with error trapping. If a `429 Rate Limit` error occurs, the UI degrades gracefully, showing a specific "Wait 60s" warning rather than crashing or showing a white screen.
* **Optimization:** The app cleans user inputs *before* fetching to prevent wasted API calls on invalid IDs.

### 2. "Self-Healing" Data Integrity
Users often misspell Coin IDs (e.g., "shib" instead of "shiba-inu").
* **Solution:** I built a **Client-Side Sanitizer** that intercepts user input. If a known alias is detected, it is swapped for the valid API ID instantly.
* **Database Repair:** On application load, the system scans the user's Firestore document. If it finds deprecated or broken IDs from previous sessions, it silently repairs the database in the background without user intervention.

### 3. Infinite Reload Protection
A common issue in React apps with database dependencies is "Render Loops" (Fetch -> Update State -> Re-render -> Fetch).
* **Solution:** Implemented **Debounced Auto-Saving**. When a user types a quantity, the app waits 2 seconds for inactivity before writing to Firestore. This reduces database writes by ~90% and prevents UI stutter.

## 🚀 How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/cryptovault.git](https://github.com/yourusername/cryptovault.git)
    cd cryptovault
    ```

2.  **Install Dependencies:**
    You can install everything via `npm install`, or manually add the required libraries:
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

## 🔮 Future Improvements

* **Server-Side Caching:** Implementing a simple backend (Node/Express) to cache CoinGecko responses, allowing the app to scale to thousands of users without hitting API limits.
* **Price Alerts:** Browser notifications when a target price is hit.
* **Dark Mode:** A toggle for night-time viewing.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).