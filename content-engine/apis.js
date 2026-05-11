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

  const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${coords.lat}&longitude=${coords.lon}&start_date=1991-01-01&end_date=2020-12-31&models=EC_Earth3P_HR&monthly=temperature_2m_mean,precipitation_sum`;
  const data = await safeFetch(url, `OpenMeteo:${destinationKey}`);
  if (!data || !data.monthly) return null;

  const temps = data.monthly.temperature_2m_mean || [];
  const precip = data.monthly.precipitation_sum || [];

  // Average across all years for each month (1–12)
  const monthly = MONTHS_DE.map((month, i) => {
    const monthTemps = [];
    const monthPrecip = [];
    // monthly array has entries for each month of each year
    for (let j = i; j < temps.length; j += 12) {
      if (temps[j] != null) monthTemps.push(temps[j]);
      if (precip[j] != null) monthPrecip.push(precip[j]);
    }
    const avgTemp = monthTemps.length
      ? Math.round(monthTemps.reduce((a, b) => a + b, 0) / monthTemps.length)
      : null;
    const avgPrecip = monthPrecip.length
      ? Math.round(monthPrecip.reduce((a, b) => a + b, 0) / monthPrecip.length)
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

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  getWikipediaSummary,
  getTopPOIs,
  getClimateData,
  getCountryInfo,
  COORDS,
  MONTHS_DE,
};
