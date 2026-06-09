#!/usr/bin/env node
/**
 * build-giata-index.js
 * Wird automatisch beim Vercel-Build ausgefuehrt (npm run build).
 * Benoetigt: GIATA_API_KEY als Umgebungsvariable (Vercel Production Env).
 * Ausgabe: ../api/giata-search-index.json
 */

const fs   = require('fs');
const path = require('path');

// .env.local dosyasını yükle (update-google-ratings.js ile aynı pattern)
try {
  const envFile = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
} catch (e) { /* ignore */ }

const API_KEY = process.env.GIATA_API_KEY;
if (!API_KEY) {
  console.log('INFO: GIATA_API_KEY nicht gesetzt - Build uebersprungen.');
  process.exit(0);
}

const BASE        = 'https://giatadrive.com/api/v1';
const HEADERS     = { Authorization: 'Bearer ' + API_KEY, Accept: 'application/json' };
const OUTPUT      = path.join(__dirname, '..', 'api', 'giata-search-index.json');
const BATCH_SIZE  = 20;
const DELAY_MS    = 150;
const SAMPLE_SIZE = 500;
const COUNTRIES   = ['TR','GR','ES','EG','PT','HR','IT','FR','MA','MT','TN','BG','CY','JO','AE','MV'];

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(function() { controller.abort(); }, 12000);
  try {
    const resp = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return resp.json();
  } catch(e) {
    clearTimeout(timer);
    throw e;
  }
}

async function fetchUrls(cc) {
  const data = await fetchJson(BASE + '/properties?countryCode=' + cc);
  return data.urls || data.properties || (Array.isArray(data) ? data : []);
}

function idFromUrl(u) {
  var m = String(u.href || u).match(/\/properties\/(\d+)$/);
  return m ? m[1] : null;
}

function sample(arr, n) {
  if (arr.length <= n) return arr;
  var step = arr.length / n;
  return Array.from({ length: n }, function(_, i) { return arr[Math.floor(i * step)]; });
}

function extractInfo(d, cc) {
  var names   = d.names || [];
  var name    = (names.find(function(n) { return n.isDefault; }) || names[0] || {}).value || '';
  var cityNm  = d.city && d.city.names || [];
  var city    = (cityNm.find(function(n) { return n.locale === 'de'; }) || cityNm[0] || {}).value || (d.city && d.city.name) || '';
  var cityEn  = (cityNm.find(function(n) { return n.locale === 'en'; }) || {}).value || city;
  var ctryNm  = d.country && d.country.names || [];
  var country = (ctryNm.find(function(n) { return n.locale === 'de'; }) || ctryNm[0] || {}).value || (d.country && d.country.name) || '';
  var ratings = d.ratings || [];
  var stars   = Math.round(parseFloat((ratings.find(function(r) { return r.isDefault; }) || ratings[0] || {}).value || 0));
  var factIds = Object.keys(d.facts || {}).map(Number).filter(function(n) { return !isNaN(n) && n > 0; });
  if (!name) return null;
  return { giataId: String(d.giataId || d.id), name: name, city: city, cityEn: cityEn, cc: cc || '', country: country, stars: stars, factIds: factIds };
}

const MAX_INDEX_AGE_DAYS = 7; // Index nur neu bauen wenn älter als 7 Tage

async function main() {
  // ── Früher Ausstieg wenn Index aktuell genug ist ────────────────────────────
  if (fs.existsSync(OUTPUT)) {
    try {
      var existing = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
      var ts = existing._generatedAt || null;
      if (ts) {
        var ageDays = (Date.now() - new Date(ts).getTime()) / (1000 * 86400);
        if (ageDays < MAX_INDEX_AGE_DAYS) {
          console.log('INFO: Giata index is ' + ageDays.toFixed(1) + ' days old (< ' + MAX_INDEX_AGE_DAYS + ' days). Skipping rebuild.');
          process.exit(0);
        }
        console.log('INFO: Giata index is ' + ageDays.toFixed(1) + ' days old. Rebuilding...');
      }
    } catch(e) { /* Index unlesbar – neu bauen */ }
  }

  console.log('Building Giata search index...');
  var index = [];

  for (var i = 0; i < COUNTRIES.length; i++) {
    var cc = COUNTRIES[i];
    process.stdout.write('  ' + cc + ' loading... ');
    var urls;
    try {
      urls = await fetchUrls(cc);
    } catch(e) {
      console.log('SKIP (' + e.message + ')');
      continue;
    }
    console.log(urls.length + ' urls, sampling ' + Math.min(SAMPLE_SIZE, urls.length));

    var sampled = sample(urls, SAMPLE_SIZE);
    var ids     = sampled.map(idFromUrl).filter(Boolean);

    for (var j = 0; j < ids.length; j += BATCH_SIZE) {
      var batch = ids.slice(j, j + BATCH_SIZE);
      await Promise.all(batch.map(async function(gId) {
        try {
          var d    = await fetchJson(BASE + '/properties/' + gId);
          var info = extractInfo(d, cc);
          if (info) index.push(info);
        } catch(e) { /* ignore */ }
      }));
      await sleep(DELAY_MS);
    }
    console.log('  Total so far: ' + index.length);
  }

  index.sort(function(a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });

  if (index.length === 0) {
    console.log('WARNING: 0 hotels found (GIATA API may be down). Keeping existing file.');
    process.exit(0);
  }

  // Timestamp mitspeichern damit der nächste Build weiß wie alt der Index ist
  var output = { _generatedAt: new Date().toISOString(), hotels: index };
  fs.writeFileSync(OUTPUT, JSON.stringify(output), 'utf8');
  console.log('Done! ' + index.length + ' hotels saved to ' + OUTPUT + ' (generated: ' + output._generatedAt + ')');
}

main().catch(function(e) {
  console.error('Build-index error:', e.message);
  process.exit(0);
});
