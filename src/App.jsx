import { useState, useEffect } from 'react'
import './App.css'
// Firebase Imports
import { auth, googleProvider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

function App() {
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState(null)          // Current logged-in user
  const [coins, setCoins] = useState({})          // Coin data from API
  const [loading, setLoading] = useState(true)    // Loading status
  const [watchlist, setWatchlist] = useState(['bitcoin', 'ethereum', 'solana']) // Default coins
  const [inputVal, setInputVal] = useState('')    // Search bar input

  // --- 1. AUTHENTICATION MONITOR ---
  // Checks if user is logged in when app starts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        // User found: Load their saved list from Firebase
        const docRef = doc(db, "users", currentUser.uid)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setWatchlist(docSnap.data().watchlist)
        } else {
          // New user: Save the default list to Firebase
          await setDoc(docRef, { watchlist: ['bitcoin', 'ethereum', 'solana'] })
        }
      }
    })
    return () => unsubscribe()
  }, [])

  // --- 2. DATA FETCHER (API) ---
  // Runs whenever the 'watchlist' changes
  useEffect(() => {
    if (watchlist.length === 0) return

    const fetchPrices = async () => {
      setLoading(true)
      try {
        const ids = watchlist.join(',')
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        )
        const data = await response.json()
        setCoins(data)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 60000) // Auto-refresh every 60s
    return () => clearInterval(interval)
  }, [watchlist])

  // --- 3. ACTIONS: ADD COIN ---
  const handleAddCoin = async () => {
    if (!inputVal.trim()) return
    const newCoin = inputVal.toLowerCase()
    
    if (!watchlist.includes(newCoin)) {
      const newList = [...watchlist, newCoin]
      setWatchlist(newList) // Update UI instantly
      setInputVal('')
      
      // Save to Database if logged in
      if (user) {
        await setDoc(doc(db, "users", user.uid), { watchlist: newList })
      }
    }
  }

  // --- 4. ACTIONS: REMOVE COIN ---
  const removeCoin = async (coinId) => {
    const newList = watchlist.filter(id => id !== coinId)
    setWatchlist(newList)
    
    // Update Database if logged in
    if (user) {
      await setDoc(doc(db, "users", user.uid), { watchlist: newList })
    }
  }

  // --- 5. ACTIONS: LOGIN ---
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  // --- RENDER ---
  return (
    <>
      {/* --- A. FIXED HEADER (Outside Container) --- */}
      {/* This ensures the button stays in the top-right corner */}
      <div className="auth-header">
        {user ? (
          <div className="user-info">
            {user.photoURL && (
              <img src={user.photoURL} alt="User" />
            )}
            <button onClick={() => signOut(auth)}>
              Logout
            </button>
          </div>
        ) : (
          <button onClick={handleGoogleLogin}>Sign in</button>
        )}
      </div>

      {/* --- B. MAIN APP (Centered) --- */}
      <div className="container">
        {/* Title with Rocket Emoji separated */}
        <h1>
          🚀 <span className="title-text">Crypto Tracker</span>
        </h1>

        {/* Search Bar */}
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Add a coin (e.g. dogecoin)..." 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCoin()}
          />
          <button onClick={handleAddCoin}>Add Coin</button>
        </div>
        
        {loading && <p>Loading prices...</p>}

        {/* Coin Grid */}
        <div className="grid">
          {watchlist.map((coinId) => {
            const coinData = coins[coinId]
            if (!coinData) return null 

            return (
              <div className="card" key={coinId}>
                {/* Delete Button (X) */}
                <div 
                  onClick={() => {
    if (window.confirm("This box will be gone unless you add back manually.Are you sure you want to delete it?")) {
      handleDelete(box.id);
    }
  }}
                  style={{ 
                    position: 'absolute', top: 15, right: 15, cursor: 'pointer', 
                    fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)', zIndex: 10 
                  }}
                >
                  &times;
                </div>

                <h2>{coinId.charAt(0).toUpperCase() + coinId.slice(1)}</h2>
                <p className="price">${coinData.usd}</p>
                <p className="change" style={{ color: coinData.usd_24h_change > 0 ? '#00f260' : '#ff4d4d' }}>
                  {coinData.usd_24h_change?.toFixed(2)}%
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default App