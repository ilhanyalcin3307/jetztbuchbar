'use strict';

/**
 * Seed loader — reads from seed-catalog.json.
 * To add new pages: edit seed-catalog.json and push.
 * The auto-expand engine will pick up new entries on the next nightly run.
 *
 * JSON schema per seed:
 * {
 *   "id":           string  — unique slug (e.g. "istanbul")
 *   "type":         "city" | "region" | "aktivitaet"
 *   "nameDe":       string  — German display name (e.g. "Istanbul")
 *   "parentId":     string  — parent destination id (e.g. "tuerkei")
 *   "parent":       string  — parent display name (e.g. "Türkei")
 *   "parentFile":   string  — parent path with trailing slash (e.g. "tuerkei/")
 *   "file":         string  — output file path (e.g. "tuerkei/istanbul/index.html")
 *   "wikiSearch":   string  — German Wikipedia search term
 *   "climateKey":   string  — key into COORDS / climate lookup (lowercase)
 *   "poiSearch":    string  — OpenTripMap search term (usually English)
 *   "unsplashQuery":string  — Unsplash search query
 *   "icon":         string  — emoji flag or icon
 *   "cardDesc":     string  — short description shown on parent card (e.g. "Bosporus & Kultur")
 *   "cardBadge":    string  — badge label on parent card (e.g. "Türkei")
 *   "aktivitaet":   string  — [aktivitaet only] activity name (e.g. "Jeep-Safari")
 * }
 */

const path = require('path');
const fs   = require('fs');

const CATALOG_FILE = path.join(__dirname, 'seed-catalog.json');

function loadSeeds() {
  try {
    const raw = fs.readFileSync(CATALOG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[seeds] Failed to load seed-catalog.json:', err.message);
    return [];
  }
}

const ALL_SEEDS        = loadSeeds();
const CITY_SEEDS       = ALL_SEEDS.filter(s => s.type === 'city');
const REGION_SEEDS     = ALL_SEEDS.filter(s => s.type === 'region');
const AKTIVITAET_SEEDS = ALL_SEEDS.filter(s => s.type === 'aktivitaet');

module.exports = { ALL_SEEDS, CITY_SEEDS, REGION_SEEDS, AKTIVITAET_SEEDS, CATALOG_FILE };
