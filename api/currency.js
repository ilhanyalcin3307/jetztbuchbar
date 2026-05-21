// Vercel Serverless Function – ECB Exchange Rate Proxy
// Usage: GET /api/currency?currency=TRY
// Source: https://open.er-api.com/v6/latest/EUR (free, no API key)
// Base: EUR — returns how many units of target currency = 1 EUR

const ER_URL = 'https://open.er-api.com/v6/latest/EUR';

// Module-level cache (survives warm Vercel invocations)
let cache   = null;
let cacheAt = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600');

  const currency = (req.query && req.query.currency || '').toUpperCase().trim();

  if (!currency) {
    return res.status(400).json({ error: 'currency parameter required (e.g. ?currency=TRY)' });
  }

  try {
    const now = Date.now();

    if (!cache || now - cacheAt > CACHE_TTL_MS) {
      const response = await fetch(ER_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JetztBuchbar/1.0 (+https://jetztbuchbar.de)',
        },
      });

      if (!response.ok) throw new Error(`Exchange Rate API returned HTTP ${response.status}`);

      const json = await response.json();
      if (json.result !== 'success') throw new Error('Exchange Rate API: result not success');

      cache   = json.rates || {};
      cacheAt = now;
    }

    const rate = cache[currency];

    if (!rate) {
      return res.status(200).json({ rate: null, text: null });
    }

    // Format: 2 decimal places for most currencies; 0 for large values (CVE, IDR…)
    const formatted = rate >= 100
      ? rate.toFixed(0)
      : rate < 1
        ? rate.toFixed(3)
        : rate.toFixed(2);

    return res.status(200).json({
      rate,
      formatted,
      text: `1 EUR = ${formatted} ${currency}`,
      base: 'EUR',
      updatedAt: cacheAt,
    });

  } catch (err) {
    console.error('[currency] API error:', err.message);
    return res.status(200).json({ rate: null, text: null });
  }
};
