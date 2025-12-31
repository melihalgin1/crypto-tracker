// api/prices.js
export default async function handler(req, res) {
  try {
    // 1. Fetch from CoinGecko using native fetch
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false"
    );
    
    const data = await response.json();

    // 2. Add Caching Headers
    // This tells Vercel: "Cache this result for 60 seconds."
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    // 3. Send back to frontend
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
}