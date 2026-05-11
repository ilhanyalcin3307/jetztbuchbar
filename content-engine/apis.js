/**
 * API Wrappers — JetztBuchbar Content Engine
 * Wikipedia DE, OpenTripMap, Open-Meteo, Rest Countries
 */

'use strict';

const fetch = require('node-fetch');

// ── Helpers ──────────────────────────────────────────────────────────────────

async function safeFetch(url, label) {
  try {
    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[API] ${label} failed: ${err.message}`);
    return null;
  }
}

// ── Wikipedia DE ──────────────────────────────────────────────────────────────

/**
 * Fetches a short summary (2-3 sentences) from German Wikipedia.
 * Returns plain text or null on failure.
 */
async function getWikipediaSummary(searchTerm) {
  // First: search for the best matching article title
  const searchUrl = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
  const data = await safeFetch(searchUrl, `Wikipedia:${searchTerm}`);
  if (!data || !data.extract) return null;

  // Trim to max 3 sentences to avoid duplicate content risk
  const sentences = data.extract.split(/(?<=[.!?])\s+/);
  return sentences.slice(0, 3).join(' ');
}

// ── OpenTripMap ───────────────────────────────────────────────────────────────

const OPENTRIPMAP_KEY = process.env.OPENTRIPMAP_KEY || '';

/**
 * Returns top N POIs for a destination name.
 * Internally: geocode destination → fetch nearby POIs by radius.
 */
async function getTopPOIs(destinationName, limit = 5) {
  if (!OPENTRIPMAP_KEY) {
    console.warn('[API] OPENTRIPMAP_KEY not set, skipping POIs');
    return [];
  }

  // Step 1: Geocode
  const geoUrl = `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(destinationName)}&apikey=${OPENTRIPMAP_KEY}`;
  const geo = await safeFetch(geoUrl, `OTM-geo:${destinationName}`);
  if (!geo || !geo.lat || !geo.lon) return [];

  const { lat, lon } = geo;

  // Step 2: Fetch POIs (radius 20km, interesting_places category)
  const radius = 20000;
  const poisUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${lon}&lat=${lat}&kinds=interesting_places&limit=${limit}&format=json&apikey=${OPENTRIPMAP_KEY}`;
  const pois = await safeFetch(poisUrl, `OTM-pois:${destinationName}`);
  if (!Array.isArray(pois)) return [];

  // Return simplified list
  return pois
    .filter(p => p.name && p.name.trim())
    .map(p => ({
      name: p.name,
      kinds: p.kinds ? p.kinds.split(',')[0] : '',
      dist: p.dist ? Math.round(p.dist / 1000) : null,
    }));
}

// ── Open-Meteo ────────────────────────────────────────────────────────────────

// Static coordinates for known destinations (Open-Meteo needs lat/lon)
const COORDS = {
  // Türkei
  antalya:        { lat: 36.89, lon: 30.71 },
  bodrum:         { lat: 37.03, lon: 27.43 },
  side:           { lat: 36.77, lon: 31.39 },
  alanya:         { lat: 36.54, lon: 32.00 },
  kusadasi:       { lat: 37.86, lon: 27.26 },
  istanbul:       { lat: 41.01, lon: 28.95 },
  izmir:          { lat: 38.42, lon: 27.14 },
  // Spanien
  mallorca:       { lat: 39.57, lon: 2.65 },
  teneriffa:      { lat: 28.29, lon: -16.63 },
  'gran canaria': { lat: 27.92, lon: -15.54 },
  ibiza:          { lat: 38.91, lon: 1.43 },
  lanzarote:      { lat: 28.96, lon: -13.55 },
  barcelona:      { lat: 41.39, lon: 2.17 },
  madrid:         { lat: 40.42, lon: -3.70 },
  // Griechenland
  kreta:          { lat: 35.24, lon: 25.09 },
  santorini:      { lat: 36.39, lon: 25.46 },
  rhodos:         { lat: 36.44, lon: 28.22 },
  korfu:          { lat: 39.62, lon: 19.92 },
  mykonos:        { lat: 37.45, lon: 25.33 },
  thessaloniki:   { lat: 40.64, lon: 22.94 },
  // Ägypten
  hurghada:       { lat: 27.26, lon: 33.81 },
  'sharm el-sheikh': { lat: 27.92, lon: 34.33 },
  'marsa alam':   { lat: 25.07, lon: 34.89 },
  luxor:          { lat: 25.69, lon: 32.64 },
  kairo:          { lat: 30.06, lon: 31.25 },
  // Hauptländer (für Reisezeit-Seiten)
  tuerkei:        { lat: 39.00, lon: 35.24 },
  türkei:         { lat: 39.00, lon: 35.24 },
  spanien:        { lat: 40.42, lon: -3.70 },
  griechenland:   { lat: 39.07, lon: 21.82 },
  ägypten:        { lat: 26.82, lon: 30.80 },
  aegypten:       { lat: 26.82, lon: 30.80 },
  // Neue Destinationen
  marokko:        { lat: 31.79, lon: -7.09 },
  marrakesch:     { lat: 31.63, lon: -8.00 },
  agadir:         { lat: 30.42, lon: -9.60 },
  tunesien:       { lat: 33.89, lon: 9.54 },
  djerba:         { lat: 33.87, lon: 10.85 },
  dubai:          { lat: 25.20, lon: 55.27 },
  abu_dhabi:      { lat: 24.45, lon: 54.37 },
  kroatien:       { lat: 45.10, lon: 15.20 },
  dubrovnik:      { lat: 42.65, lon: 18.09 },
  split:          { lat: 43.51, lon: 16.44 },
  portugal:       { lat: 39.40, lon: -8.22 },
  lissabon:       { lat: 38.72, lon: -9.14 },
  algarve:        { lat: 37.02, lon: -8.01 },
  bulgarien:      { lat: 42.73, lon: 25.49 },
  sonnenstrand:   { lat: 42.69, lon: 27.71 },
  malta:          { lat: 35.90, lon: 14.51 },
  zypern:         { lat: 35.13, lon: 33.43 },
  'kap verde':    { lat: 16.00, lon: -24.00 },
  jordanien:      { lat: 31.24, lon: 36.51 },
  petra:          { lat: 30.33, lon: 35.44 },
  // Extra für neue Seiten
  münchen:        { lat: 48.14, lon: 11.58 },
  neapel:         { lat: 40.85, lon: 14.27 },
  'costa brava':  { lat: 41.90, lon: 3.10 },
  bodensee:       { lat: 47.64, lon: 9.32 },
  amalfi:         { lat: 40.63, lon: 14.60 },
};

const MONTHS_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/**
 * Returns monthly average temperature + precipitation for a destination.
 * Uses Open-Meteo Climate API (historical normals).
 */
async function getClimateData(destinationKey) {
  const key = destinationKey.toLowerCase();
  const coords = COORDS[key];
  if (!coords) {
    console.warn(`[API] No coords for: ${destinationKey}`);
    return null;
  }

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=2018-01-01&end_date=2022-12-31&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
  const data = await safeFetch(url, `OpenMeteo:${destinationKey}`);
  if (!data || !data.daily) return null;

  const times = data.daily.time || [];
  const temps = data.daily.temperature_2m_mean || [];
  const precip = data.daily.precipitation_sum || [];

  // Group daily values by month index (0–11)
  const monthlyTemps = Array.from({ length: 12 }, () => []);
  const monthlyPrecip = Array.from({ length: 12 }, () => []);

  times.forEach((dateStr, i) => {
    const m = parseInt(dateStr.split('-')[1], 10) - 1;
    if (temps[i] != null) monthlyTemps[m].push(temps[i]);
    if (precip[i] != null) monthlyPrecip[m].push(precip[i]);
  });

  const monthly = MONTHS_DE.map((month, i) => {
    const avgTemp = monthlyTemps[i].length
      ? Math.round(monthlyTemps[i].reduce((a, b) => a + b, 0) / monthlyTemps[i].length * 10) / 10
      : null;
    // Sum per month / number of years = avg monthly precipitation
    const avgPrecip = monthlyPrecip[i].length
      ? Math.round(monthlyPrecip[i].reduce((a, b) => a + b, 0) / 5)
      : null;
    return { month, temp: avgTemp, precip: avgPrecip };
  });

  return monthly;
}

// ── Rest Countries ────────────────────────────────────────────────────────────

/**
 * Returns basic country info: currency, capital, language, region.
 * Uses country name (German) — maps to English for the API.
 */
const COUNTRY_MAP = {
  'türkei':    'turkey',
  'spanien':   'spain',
  'griechenland': 'greece',
  'ägypten':   'egypt',
  'marokko':   'morocco',
  'tunesien':  'tunisia',
  'dubai':     'united arab emirates',
  'kroatien':  'croatia',
  'portugal':  'portugal',
  'bulgarien': 'bulgaria',
  'malta':     'malta',
  'zypern':    'cyprus',
  'kap verde': 'cabo verde',
  'jordanien': 'jordan',
};

async function getCountryInfo(destinationDE) {
  const key = destinationDE.toLowerCase();
  const engName = COUNTRY_MAP[key];
  if (!engName) return null;

  const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(engName)}?fields=name,capital,currencies,languages,region,population`;
  const data = await safeFetch(url, `RestCountries:${destinationDE}`);
  if (!Array.isArray(data) || !data[0]) return null;

  const c = data[0];
  const currency = c.currencies ? Object.values(c.currencies)[0] : null;
  const language = c.languages ? Object.values(c.languages)[0] : null;

  return {
    capital: c.capital?.[0] || null,
    currency: currency ? `${currency.name} (${currency.symbol || '–'})` : null,
    language: language || null,
    region: c.region || null,
    population: c.population ? (c.population / 1e6).toFixed(1) + ' Mio.' : null,
  };
}

// ── Unsplash ──────────────────────────────────────────────────────────────────

// German → English mapping for better Unsplash search results
const UNSPLASH_QUERY_MAP = {
  'marokko':       'Morocco travel landscape',
  'tunesien':      'Tunisia travel beach',
  'dubai':         'Dubai skyline travel',
  'kroatien':      'Croatia coast travel',
  'portugal':      'Portugal travel landscape',
  'bulgarien':     'Bulgaria Black Sea beach',
  'malta':         'Malta Mediterranean travel',
  'zypern':        'Cyprus travel beach',
  'kap-verde':     'Cape Verde beach travel',
  'kap verde':     'Cape Verde beach travel',
  'jordanien':     'Jordan Petra travel',
  'antalya':       'Antalya Turkey beach',
  'bodrum':        'Bodrum Turkey travel',
  'kreta':         'Crete Greece travel',
  'santorini':     'Santorini Greece island',
  'türkei':        'Turkey travel landscape',
  'tuerkei':       'Turkey travel landscape',
  'spanien':       'Spain travel landscape',
  'griechenland':  'Greece travel landscape',
  'ägypten':       'Egypt travel landscape',
  'aegypten':      'Egypt travel landscape',
  'mallorca':      'Mallorca Spain travel',
  'lissabon':      'Lisbon Portugal travel',
  'algarve':       'Algarve Portugal cliffs',
  'costa brava':   'Costa Brava Spain travel',
  'bodensee':      'Lake Constance Germany travel',
  'amalfiküste':   'Amalfi Coast Italy travel',
  'amalfi':        'Amalfi Coast Italy travel',
  'neapel':        'Naples Italy travel',
  'münchen':       'Bavaria Germany travel',
  'barcelona':     'Barcelona Spain travel',
  'hotels-antalya':'Antalya Turkey resort hotel',
  'hotels-dubai':  'Dubai luxury hotel',
  'hotels-kreta':  'Crete Greece resort',
  'hotels-mallorca':'Mallorca hotel resort',
  'hotels-lissabon':'Lisbon Portugal boutique hotel',
  'schnorcheln-kreta': 'Crete snorkeling underwater',
  'tauchen-malta': 'Malta diving underwater',
  'wuestensafari-dubai': 'Dubai desert safari dunes',
  'wandern-kroatien': 'Croatia hiking nature',
  'surfen-kap-verde': 'Cape Verde kitesurfing',
  'handgepaeck':   'airport travel luggage',
  'reiseversicherung': 'travel insurance trip',
  'packliste':     'travel packing suitcase',
  'fliegen':       'airplane travel flight',
  'türkei-ägypten': 'Turkey Egypt travel comparison',
  'mallorca-kreta': 'Mediterranean island travel',
  'dubai-abu-dhabi': 'UAE skyline travel',
};

/**
 * Fetches a travel photo from Unsplash for a given destination/topic.
 * Returns { url, creditName, creditLink } or null on failure.
 */
async function getUnsplashImage(queryKey) {
  const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
  if (!UNSPLASH_KEY) {
    console.warn('[API] UNSPLASH_ACCESS_KEY not set, skipping image');
    return null;
  }

  const key = (queryKey || '').toLowerCase();
  const query = UNSPLASH_QUERY_MAP[key] || `${queryKey} travel landscape`;

  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_KEY}`;

  try {
    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const photo = data.results && data.results[0];
    if (!photo) return null;
    return {
      url:         photo.urls.regular,
      creditName:  photo.user.name,
      creditLink:  photo.user.links.html + '?utm_source=jetztbuchbar&utm_medium=referral',
    };
  } catch (err) {
    console.error(`[API] Unsplash:${queryKey} failed: ${err.message}`);
    return null;
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getWikipediaSummary,
  getTopPOIs,
  getClimateData,
  getCountryInfo,
  getUnsplashImage,
  COORDS,
  MONTHS_DE,
};
