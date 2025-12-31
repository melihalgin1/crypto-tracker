import React, { useState, useEffect } from 'react';
import './App.css'; 

function App() {
  const [coins, setCoins] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ---------------------------------------------------------
    // THE CHANGE: Fetching from our local Vercel API
    // This protects your API key and handles caching automatically.
    // ---------------------------------------------------------
    fetch('/api/prices')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch prices');
        }
        return response.json();
      })
      .then(data => {
        setCoins(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setError("Could not load crypto data. Please try again later.");
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setSearch(e.target.value);
  };

  // Filter coins based on search input
  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="coin-app">
      <div className="coin-search">
        <h1 className="coin-text">CryptoVault</h1>
        <form>
          <input
            type="text"
            placeholder="Search"
            className="coin-input"
            onChange={handleChange}
          />
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <h2>Loading live prices...</h2>
        </div>
      ) : (
        <div className="coin-container">
          {/* Header Row (Optional, for better UI) */}
          <div className="coin-row header">
            <div className="coin">
              <p className="coin-symbol">Sym</p>
              <p className="coin-name">Coin</p>
            </div>
            <div className="coin-data">
              <p className="coin-price">Price</p>
              <p className="coin-percent">24h</p>
              <p className="coin-marketcap">Mkt Cap</p>
            </div>
          </div>

          {/* Render the filtered list */}
          {filteredCoins.map(coin => {
            return (
              <div className="coin-row" key={coin.id}>
                <div className="coin">
                  <img src={coin.image} alt="crypto" />
                  <h1>{coin.name}</h1>
                  <p className="coin-symbol">{coin.symbol}</p>
                </div>
                <div className="coin-data">
                  <p className="coin-price">${coin.current_price.toLocaleString()}</p>
                  
                  {coin.price_change_percentage_24h < 0 ? (
                    <p className="coin-percent red">
                      {coin.price_change_percentage_24h.toFixed(2)}%
                    </p>
                  ) : (
                    <p className="coin-percent green">
                      +{coin.price_change_percentage_24h.toFixed(2)}%
                    </p>
                  )}
                  
                  <p className="coin-marketcap">
                    ${coin.market_cap.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;