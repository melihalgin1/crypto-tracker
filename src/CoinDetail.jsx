import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const CoinDetail = ({ coinId, currency, onBack }) => {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(7);
  const [status, setStatus] = useState('loading'); 
  const [errorMessage, setErrorMessage] = useState('');
  
  // Refs for manual width calculation
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);

  const currencySymbols = {
    usd: '$',
    eur: '€',
    try: '₺',
    gbp: '£',
    jpy: '¥'
  };
  const symbol = currencySymbols[currency] || '$';

  // 1. Measure Container Width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setChartWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    const fetchHistory = async () => {
      setStatus('loading');
      setErrorMessage('');
      
      try {
        const API_KEY = import.meta.env.VITE_CG_API_KEY; 

        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&x_cg_demo_api_key=${API_KEY}`
        );
        
        if (!response.ok) {
          if (response.status === 429) throw new Error("Rate Limit (429). Wait 1 min.");
          throw new Error(`API Error: ${response.status}`);
        }
        
        const json = await response.json();
        
        if (!json.prices || json.prices.length === 0) {
          throw new Error("No data available.");
        }

        const formattedData = json.prices
          .filter(item => item[1] !== null)
          .map(([timestamp, price]) => ({
            date: timestamp,
            price: price
          }));

        setData(formattedData);
        setStatus('success');

      } catch (err) {
        console.error("Fetch Error:", err);
        setErrorMessage(err.message);
        setStatus('error');
      }
    };

    fetchHistory();
  }, [coinId, days, currency]);

  // Helper: Determine Trend Color
  const isProfit = data.length > 0 && data[data.length - 1].price >= data[0].price;
  const color = isProfit ? "#16a34a" : "#dc2626"; 

  return (
    <div className="w-full">
      <button 
        onClick={onBack} 
        className="mb-4 text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
      >
        ← Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold capitalize">{coinId}</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">Price History ({currency.toUpperCase()})</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isProfit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {days === 1 ? '24H' : days} Trend: {isProfit ? '▲ Up' : '▼ Down'}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                days === d 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {d === 1 ? '24H' : d === 30 ? '30D' : '7D'}
            </button>
          ))}
        </div>
      </div>

      {/* CHART CONTAINER */}
      <div 
        ref={containerRef}
        className="bg-white border rounded-2xl shadow-sm p-4 h-[450px] relative w-full"
      >
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-400 text-sm font-medium">Loading Chart...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20 text-center px-4">
            <p className="text-red-500 font-bold mb-1">Chart Unavailable</p>
            <p className="text-gray-500 text-sm mb-4">{errorMessage}</p>
            <button onClick={() => setDays(days)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium">
              Retry
            </button>
          </div>
        )}

        {status === 'success' && chartWidth > 0 && (
           <div className="w-full h-full flex items-center justify-center">
              <AreaChart 
                width={chartWidth - 32} 
                height={400} 
                data={data}
              >
                <defs>
                  <linearGradient id={"colorPrice-" + coinId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(tick) => {
                     const date = new Date(tick);
                     return days === 1 ? format(date, 'p') : format(date, 'MMM d');
                  }}
                  minTickGap={40}
                  tick={{fontSize: 12, fill: '#9ca3af'}}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                
                {/* FIX: Smart Y-Axis formatting for small numbers */}
                <YAxis 
                  domain={['auto', 'auto']} 
                  hide={false} 
                  tick={{fontSize: 12, fill: '#9ca3af'}}
                  width={60}
                  tickFormatter={(val) => {
                    // If price is tiny (like Pepe), show decimals instead of 0
                    if (val < 1) return `${symbol}${val.toFixed(6)}`;
                    return `${symbol}${val.toLocaleString(undefined, { notation: "compact" })}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                
                {/* FIX: Smart Tooltip formatting for max precision */}
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(label) => format(new Date(label), 'PP pp')}
                  formatter={(value) => [
                    `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 10 })}`, 
                    'Price'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={color} 
                  fillOpacity={1} 
                  fill={"url(#colorPrice-" + coinId + ")"} 
                  strokeWidth={2}
                  animationDuration={500}
                />
              </AreaChart>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinDetail;