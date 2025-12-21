import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { auth, googleProvider, db } from './firebase'; 
import CoinDetail from './CoinDetail';
import ManageAccount from './ManageAccount'; 
import './App.css';

const DEFAULT_COINS = ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin', 'ripple'];

const ID_FIXES = {
  'shiba': 'shiba-inu', 'shib': 'shiba-inu', 'shiba inu': 'shiba-inu',
  'bnb': 'binancecoin', 'binance': 'binancecoin',
  'matic': 'matic-network', 'polygon': 'matic-network',
  'pepe': 'pepe', 'pepecoin': 'pepe', 
  'doge': 'dogecoin', 'dot': 'polkadot', 'link': 'chainlink',
  'uni': 'uniswap', 'ltc': 'litecoin', 'avax': 'avalanche-2',
  'usdt': 'tether', 'xrp': 'ripple'
};

function App() {
  const [user, setUser] = useState(null);
  const [coins, setCoins] = useState({});
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [showAccount, setShowAccount] = useState(false); 
  const [holdings, setHoldings] = useState({});
  const [currency, setCurrency] = useState('usd');
  
  const [watchedCoins, setWatchedCoins] = useState(DEFAULT_COINS);
  const [newCoinId, setNewCoinId] = useState('');
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const currencyConfig = {
    usd: { label: 'USD', symbol: '$' },
    eur: { label: 'EUR', symbol: '€' },
    try: { label: 'TRY', symbol: '₺' },
    gbp: { label: 'GBP', symbol: '£' },
    jpy: { label: 'JPY', symbol: '¥' }
  };

  // 1. AUTH & DB
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const rawList = data.watchedCoins || DEFAULT_COINS;
            const cleanList = rawList.map(id => ID_FIXES[id] || id);
            
            setHoldings(data.holdings || {});
            setWatchedCoins(cleanList);
            
            if (JSON.stringify(rawList) !== JSON.stringify(cleanList)) {
              await setDoc(docRef, { watchedCoins: cleanList }, { merge: true });
            }
          } else {
            await setDoc(docRef, { holdings: {}, watchedCoins: DEFAULT_COINS });
          }
        } catch (err) {
          console.error("Error loading user data:", err);
        }
      } else {
        setSelectedCoin(null);
        setShowAccount(false);
        setHoldings({});
        setWatchedCoins(DEFAULT_COINS);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. AUTO-SAVE
  useEffect(() => {
    if (!user) return; 
    const saveToDb = setTimeout(async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { holdings, watchedCoins }, { merge: true }); 
      } catch (err) { console.error("Error saving data:", err); }
    }, 2000); 
    return () => clearTimeout(saveToDb);
  }, [holdings, watchedCoins, user]);

  // 3. FETCH
  const fetchCoins = async () => {
    if (watchedCoins.length === 0) { setCoins({}); return; }
    if (error) return; 
    if (Object.keys(coins).length === 0) setLoading(true);
    
    try {
      const ids = watchedCoins.join(',');
      const API_KEY = import.meta.env.VITE_CG_API_KEY; 

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,eur,try,gbp,jpy&include_24hr_change=true&x_cg_demo_api_key=${API_KEY}`
      );
      
      if (!response.ok) {
        if (response.status === 429) { setError("Rate Limit Hit. Wait 60s."); return; }
        throw new Error("Failed to fetch data.");
      }
      const data = await response.json();
      setCoins(data);
      setError(null); 
    } catch (err) {
      if (!error) setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCoins();
    const interval = setInterval(fetchCoins, 60000); 
    return () => clearInterval(interval);
  }, [watchedCoins]); 

  // --- HANDLERS ---
  const handleGoogleSignIn = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error) { console.error("Error signing in:", error); }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); } 
    catch (error) { console.error("Error signing out:", error); }
  };

  const executeAddCoin = () => {
    let cleanId = newCoinId.trim().toLowerCase();
    if (!cleanId) return;
    if (ID_FIXES[cleanId]) cleanId = ID_FIXES[cleanId];
    if (!watchedCoins.includes(cleanId)) setWatchedCoins([...watchedCoins, cleanId]);
    setNewCoinId(''); 
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') executeAddCoin(); };

  const handleRemoveCoin = (e, coinId) => {
    e.stopPropagation(); 
    const updatedList = watchedCoins.filter(id => id !== coinId);
    setWatchedCoins(updatedList);
    const updatedData = { ...coins };
    delete updatedData[coinId];
    setCoins(updatedData);
    setError(null); 
  };

  const updateHolding = (coinId, value) => setHoldings(prev => ({ ...prev, [coinId]: value }));

  const handleCoinClick = (coinId) => {
    if (user) { setSelectedCoin(coinId); } 
    else { if (window.confirm("Sign in to view charts?")) handleGoogleSignIn(); }
  };

  // --- RENDER LOGIC ---
  
  const renderContent = () => {
    if (showAccount && user) {
      return <ManageAccount user={user} onBack={() => setShowAccount(false)} />;
    }

    if (selectedCoin && user) {
      return <CoinDetail coinId={selectedCoin} currency={currency} onBack={() => setSelectedCoin(null)} />;
    }

    return (
      <>
        <div className="mb-8 px-2 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            {/* Responsive Text Sizes for Mobile */}
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">Market Overview</h2>
            <p className="text-blue-100 mt-2 text-lg md:text-xl">
              {user ? "Manage your customized portfolio." : "Customize your dashboard."}
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input 
              type="text" placeholder="Coin ID (e.g. shiba)"
              className="px-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 w-full md:w-64"
              value={newCoinId} onChange={(e) => setNewCoinId(e.target.value)} onKeyDown={handleKeyDown} 
            />
            <button onClick={executeAddCoin} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-lg">Add</button>
          </div>
        </div>

        {error && (
           <div className="p-10 text-center flex flex-col items-center justify-center gap-4">
             <div className="text-red-400 text-lg font-medium bg-red-900/20 px-6 py-4 rounded-lg border border-red-500/30">⚠️ {error}</div>
             <button onClick={() => { setError(null); fetchCoins(); }} className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors">Retry Connection</button>
           </div>
        )}

        {!error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
            {watchedCoins.map(id => {
              const coin = { id, ...coins[id] };
              const hasData = coin[currency] !== undefined;
              const currentPrice = hasData ? coin[currency] : 0;
              const userAmount = parseFloat(holdings[coin.id] || "0") || 0;
              const userValue = userAmount * currentPrice;
              const { symbol } = currencyConfig[currency];

              if (loading && Object.keys(coins).length === 0) return null;

              return (
                <div key={coin.id} onClick={() => handleCoinClick(coin.id)} className="bg-white p-8 rounded-xl shadow-lg border border-white/20 hover:shadow-2xl cursor-pointer transition-all relative overflow-hidden group hover:-translate-y-1 hover:scale-[1.01] flex flex-col h-auto min-h-[260px]">
                  {!user && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-medium">🔒 Sign in to view</div>}
                  <button onClick={(e) => handleRemoveCoin(e, coin.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors z-10 p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  
                  <div className="flex justify-between items-center mb-6 pr-8">
                    <div className="flex flex-col overflow-hidden">
                      <h2 className="text-3xl font-bold capitalize text-gray-900 truncate">{coin.id}</h2>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">ID: {coin.id}</span>
                    </div>
                    {hasData && <span className={`text-lg font-medium px-3 py-1 rounded-full shrink-0 ${coin.usd_24h_change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{coin.usd_24h_change?.toFixed(2)}%</span>}
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-5xl font-bold text-gray-800 tracking-tight break-all">
                      {hasData ? `${symbol}${currentPrice.toLocaleString(undefined, { minimumFractionDigits: currentPrice < 1 ? 2 : 2, maximumFractionDigits: currentPrice < 1 ? 8 : 2 })}` : <span className="text-lg text-red-400 font-medium bg-red-50 px-2 py-1 rounded">Loading...</span>}
                    </div>
                  </div>

                  {user && (
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col"><label className="text-xs text-gray-400 font-semibold uppercase">Quantity</label><input type="number" min="0" step="any" placeholder="0.00" className="w-32 border border-gray-300 rounded px-2 py-1 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" value={holdings[coin.id] || ''} onChange={(e) => updateHolding(coin.id, e.target.value)} /></div>
                      {userValue > 0 && <div className="text-right"><label className="text-xs text-gray-400 font-semibold uppercase">Equity ({currency.toUpperCase()})</label><div className="text-lg font-bold text-blue-900 truncate max-w-[150px]">{symbol}{userValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: userValue < 1 ? 6 : 2 })}</div></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {loading && Object.keys(coins).length === 0 && <div className="p-10 text-center text-white animate-pulse">Loading live market data...</div>}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col w-full relative">
      {/* RESPONSIVE HEADER START */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-white/20 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm w-full">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Title adjusts size based on screen */}
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900" onClick={() => {setShowAccount(false); setSelectedCoin(null)}} style={{cursor:'pointer'}}>CryptoVault</h1>
            
            {/* Guest Badge: Hidden on mobile to save space */}
            {!user && <span className="hidden sm:inline-block text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-medium">Guest Mode</span>}
          </div>
          
          <div className="h-6 md:h-8 border-l border-gray-300 mx-1 md:mx-2"></div>
          
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-gray-100 text-gray-800 text-xs md:text-sm font-bold py-1 px-2 md:px-3 rounded-md border-none focus:ring-2 focus:ring-black cursor-pointer outline-none hover:bg-gray-200 transition-colors">
            <option value="usd">USD</option><option value="eur">EUR</option><option value="gbp">GBP</option><option value="jpy">JPY</option><option value="try">TRY</option>
          </select>
        </div>
        
        <div>
          {user ? (
            <div className="flex items-center gap-2 md:gap-4">
              {/* Profile Pic: slightly smaller on mobile */}
              <button onClick={() => setShowAccount(true)} className="focus:outline-none hover:opacity-80 transition-opacity">
                <img 
                  src={user.photoURL || "https://ui-avatars.com/api/?name=" + user.displayName} 
                  alt="Profile" 
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-gray-300 shadow-sm object-cover"
                  title="Manage Account"
                />
              </button>
              {/* Sign Out: smaller padding on mobile */}
              <button onClick={handleSignOut} className="text-xs md:text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-gray-700 transition-colors font-medium">Sign Out</button>
            </div>
          ) : (
            <button onClick={handleGoogleSignIn} className="bg-black text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg">Sign In</button>
          )}
        </div>
      </nav>
      {/* RESPONSIVE HEADER END */}

      <main className="flex-grow w-full px-4 md:px-6 py-6 md:py-8">
        {selectedCoin && user ? (
          <div className="max-w-7xl mx-auto mt-4 px-2 md:px-4 bg-white rounded-xl p-4 md:p-6 shadow-2xl">
            {renderContent()} 
          </div>
        ) : (
           showAccount && user ? (
             <div className="max-w-7xl mx-auto mt-4 px-2 md:px-4">
                {renderContent()}
             </div>
           ) : (
              renderContent()
           )
        )}
      </main>
    </div>
  );
}

export default App;