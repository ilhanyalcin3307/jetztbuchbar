// Vercel Serverless Function – Auswärtiges Amt Travel Warning Proxy
// Usage: GET /api/travel-warning?country=GR
// Public API, no API-Key required.
// Docs: https://www.auswaertiges-amt.de/opendata/travelwarning

const AA_URL = 'https://www.auswaertiges-amt.de/opendata/travelwarning';

// Cached response (module-level, survives warm invocations)
let cache = null;
let cacheAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

module.exports = async (req, res) => {
  // CORS headers for browser fetch
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  const country = (req.query && req.query.country || '').toUpperCase().trim();

  if (!country) {
    return res.status(400).json({ error: 'country query parameter required (ISO-2 code, e.g. ?country=GR)' });
  }

  try {
    // Refresh module-level cache if stale
    const now = Date.now();
    if (!cache || now - cacheAt > CACHE_TTL_MS) {
      const response = await fetch(AA_URL, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'JetztBuchbar/1.0 (+https://jetztbuchbar.de)',
        },
      });

      if (!response.ok) {
        throw new Error(`Auswärtiges Amt API returned HTTP ${response.status}`);
      }

      const json = await response.json();
      // Response shape: { "response": { "199124": {countryCode:"GR",...}, "212622": {countryCode:"EG",...}, ... } }
      cache = json.response || json;
      cacheAt = now;
    }

    // API keys are numeric IDs – find by countryCode field
    const entry = Object.values(cache).find(v => v.countryCode === country);

    if (!entry) {
      return res.status(200).json({
        level: 0,
        icon: '🟢',
        text: 'Keine Reisewarnung',
        color: '#00c896',
        bg: 'rgba(0,200,150,0.08)',
      });
    }

    let level, icon, text, color, bg;

    if (entry.warning) {
      level = 3;
      icon = '🔴';
      text = 'Reisewarnung';
      color = '#ef4444';
      bg = 'rgba(239,68,68,0.08)';
    } else if (entry.partialWarning) {
      level = 2;
      icon = '🟡';
      text = 'Teilwarnung';
      color = '#f59e0b';
      bg = 'rgba(245,158,11,0.08)';
    } else if (entry.situationWarning || entry.situationPartWarning) {
      level = 1;
      icon = '🟠';
      text = 'Sicherheitshinweis';
      color = '#f97316';
      bg = 'rgba(249,115,22,0.08)';
    } else {
      level = 0;
      icon = '🟢';
      text = 'Keine Reisewarnung';
      color = '#00c896';
      bg = 'rgba(0,200,150,0.08)';
    }

    return res.status(200).json({
      level,
      icon,
      text,
      color,
      bg,
      country: entry.countryName || country,
      lastModified: entry.lastModified || null,
    });

  } catch (err) {
    console.error('[travel-warning] API error:', err.message);
    return res.status(200).json({
      level: 0,
      icon: '🟢',
      text: 'Keine Reisewarnung',
      color: '#00c896',
      bg: 'rgba(0,200,150,0.08)',
    });
  }
};
