// Vercel Serverless Function – Auswärtiges Amt Travel Warning Proxy
// Usage: GET /api/travel-warning?country=GR
// Public API, no API-Key required.
// Docs: https://www.auswaertiges-amt.de/opendata/travelwarning

const AA_URL = 'https://www.auswaertiges-amt.de/opendata/travelwarning';

// ---------------------------------------------------------------------------
// MANUELLE OVERRIDES
// Das AA-OpenData kann gegenüber der Website zurückhinken.
// Hier werden bekannte Abweichungen manuell korrigiert.
// Format: ISO-2 Code → Mindest-Level (wird nur angewendet wenn API-Level TIEFER ist)
// Letzte Prüfung: 2026-05-21 gegen https://www.auswaertiges-amt.de/de/service/laender/[land]-node
// ---------------------------------------------------------------------------
const MANUAL_OVERRIDES = {
  // JORDANIEN: AA-Website sagt "Von Reisen nach Jordanien wird dringend abgeraten"
  // (Aktuelles-Sektion, Stand 30.04.2026 wegen regionaler Volatilität nach US/Israel-Iran-Konflikt)
  // API-Flags sind jedoch alle false – bekannter Lag im OpenData-System des AA.
  JO: { level: 1, icon: '🟠', text: 'Sicherheitshinweis', color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
};

// ---------------------------------------------------------------------------
// DIREKTE LINKS zur AA-Länderseite (Reise- und Sicherheitshinweise)
// ---------------------------------------------------------------------------
const AA_COUNTRY_URLS = {
  GR: 'https://www.auswaertiges-amt.de/de/service/laender/griechenland-node',
  TR: 'https://www.auswaertiges-amt.de/de/service/laender/tuerkei-node',
  ES: 'https://www.auswaertiges-amt.de/de/service/laender/spanien-node',
  IT: 'https://www.auswaertiges-amt.de/de/service/laender/italien-node',
  PT: 'https://www.auswaertiges-amt.de/de/service/laender/portugal-node',
  HR: 'https://www.auswaertiges-amt.de/de/service/laender/kroatien-node',
  FR: 'https://www.auswaertiges-amt.de/de/service/laender/frankreich-node',
  EG: 'https://www.auswaertiges-amt.de/de/service/laender/aegypten-node',
  AE: 'https://www.auswaertiges-amt.de/de/service/laender/vereinigtearabischeemirate-node',
  BG: 'https://www.auswaertiges-amt.de/de/service/laender/bulgarien-node',
  MA: 'https://www.auswaertiges-amt.de/de/service/laender/marokko-node',
  TN: 'https://www.auswaertiges-amt.de/de/service/laender/tunesien-node',
  JO: 'https://www.auswaertiges-amt.de/de/service/laender/jordanien-node',
  MT: 'https://www.auswaertiges-amt.de/de/service/laender/malta-node',
  CY: 'https://www.auswaertiges-amt.de/de/service/laender/zypern-node',
  CV: 'https://www.auswaertiges-amt.de/de/service/laender/kapverden-node',
};

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

    // Manuelle Overrides anwenden: nur wenn API-Level NIEDRIGER als Override-Level
    const override = MANUAL_OVERRIDES[country];
    if (override && level < override.level) {
      level  = override.level;
      icon   = override.icon;
      text   = override.text;
      color  = override.color;
      bg     = override.bg;
    }

    return res.status(200).json({
      level,
      icon,
      text,
      color,
      bg,
      country: entry.countryName || country,
      lastModified: entry.lastModified || null,
      aaUrl: AA_COUNTRY_URLS[country] || 'https://www.auswaertiges-amt.de/de/reiseundsicherheit',
      manualOverride: override && level === override.level,
    });

  } catch (err) {
    console.error('[travel-warning] API error:', err.message);
    return res.status(200).json({
      level: 0,
      icon: '🟢',
      text: 'Keine Reisewarnung',
      color: '#00c896',
      bg: 'rgba(0,200,150,0.08)',
      aaUrl: AA_COUNTRY_URLS[country] || 'https://www.auswaertiges-amt.de/de/reiseundsicherheit',
      manualOverride: false,
    });
  }
};
