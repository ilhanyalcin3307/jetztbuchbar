#!/usr/bin/env node
/**
 * build-giata-index.js
 * Wird automatisch beim Vercel-Build ausgeführt (npm run build).
 * Benötigt: GIATA_API_KEY als Umgebungsvariable (Vercel Production Env).
 * Ausgabe: ../api/giata-search-index.json
 *
 * Lokale Nutzung:
 *   GIATA_API_KEY=your_key node content-engine/build-giata-index.js
 */

const fs   = require('fs');
const path = require('path');

const API_KEY = process.env.GIATA_API_KEY;
if (!API_KEY) {
  console.log('ℹ️  GIATA_API_KEY nicht gesetzt – Search-Index-Build übersprungen.');
  process.exit(0); // Build nicht fehlschlagen
}

const BASE        = 'https://giatadrive.com/api/v1';
const HEADERS     = { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' };
const OUTPUT      = path.join(__dirname, '..', 'api', 'giata-search-index.json');
const BATCH_SIZE  = 15;   // gleichzeitige Anfragen
const DELAY_MS    = 200;  // Pause zwischen Batches
const SAMPLE_SIZE = 40;   // Hotels pro Land (evenly sampled)

// Beliebte Urlaubsländer (ISO 3166-1 Alpha-2)
const COUNTRIES = ['TR','GR','ES','EG','PT','HR','IT','MA','MT','TN','BG','CY','JO','AE','MV'];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url) {
  const resp = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/** Giata property-URLs für ein Land laden (gibt {urls:[...]} zurück) */
async function fetchUrls(countryCode) {
  const data = await fetchJson(`${BASE}/properties?countryCode=${countryCode}`);
  // Echtes Format: { "urls": ["https://giatadrive.com/api/v1/properties/12345", ...] }
  return data.urls || data.properties || (Array.isArray(data) ? data : []);
}

/** giataId aus URL extrahieren */
function idFromUrl(url) {
  const m = String(url.href || url).match(/\/properties\/(\d+)$/);
  return m ? m[1] : null;
}

/** Gleichmäßige Stichprobe: N aus Array wählen */
function sample(arr, n) {
  if (arr.length <= n) return arr;
  const step = arr.length / n;
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)]);
}

/** Kompakte Hotel-Info aus Giata-Property extrahieren */
function extractInfo(d) {
  const name    = (d.names  || []).find(n => n.isDefault)?.value || (d.names || [])[0]?.value || '';
  const city    = (d.city?.names || []).find(n => n.locale === 'de')?.value
                  || (d.city?.names || [])[0]?.value || d.city?.name || '';
  const country = (d.country?.names || []).find(n => n.locale === 'de')?.value
                  || (d.country?.names || [])[0]?.value || d.country?.name || '';
  const stars   = Math.round(parseFloat(
    (d.ratings || []).find(r => r.isDefault)?.value || (d.ratings || [])[0]?.value || 0
  ));
  if (!name) return null;
  return { giataId: String(d.giataId || d.id), name, city, country, stars };
}

async function main() {
  console.log('🏗  Giata Search-Index wird aufgebaut …');
  const index = [];

  for (const cc of COUNTRIES) {
    process.stdout.write(`  ${cc} – URLs laden … `);
    let urls;
    try {
      urls = await fetchUrls(cc);
    } catch (e) {
      console.log(`⚠️  ${e.message} – übersprungen`);
      continue;
    }
    console.log(`${urls.length} gefunden, Sample: ${Math.min(SAMPLE_SIZE, urls.length)}`);

    const sampled = sample(urls, SAMPLE_SIZE);
    const ids     = sampled.map(idFromUrl).filter(Boolean);

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async gId => {
        try {
          const d    = await fetchJson(`${BASE}/properties/${gId}`);
          const info = extractInfo(d);
          if (info) index.push(info);
        } catch { /* einzelne Fehler ignorieren */ }
      }));
      await sleep(DELAY_MS);
    }
    console.log(`  ✅ ${index.length} Hotels im Index`);
  }

  index.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  fs.writeFileSync(OUTPUT, JSON.stringify(index), 'utf8');
  console.log(`\n✅ Index gespeichert (${index.length} Hotels): ${OUTPUT}`);
}

main().catch(e => {
  console.error('❌ Build-Index Fehler:', e.message);
  process.exit(0); // Build trotzdem erfolgreich beenden
});


const fs   = require('fs');
const path = require('path');

// .env im Projekt-Root laden (optional)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m) process.env[m[1]] = m[2].trim();
  });
}

const API_KEY = process.env.GIATA_API_KEY;
if (!API_KEY) {
  console.error('❌  GIATA_API_KEY nicht gesetzt. Abbruch.');
  process.exit(1);
}

// CLI-Parameter parsen
const args = process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc[a.slice(2)] = arr[i + 1];
  return acc;
}, {});

// Standardmäßig beliebte Urlaubsländer
const COUNTRIES = (args.countries || 'TR,GR,ES,EG,PT,HR,IT,MA,MT,TN,BG,CY,JO,AE,DE,FR,MV').split(',');
const MIN_STARS = parseInt(args.stars || '0', 10);
const LIMIT_PER_COUNTRY = parseInt(args.limit || '200', 10);
const BATCH_SIZE = 10; // gleichzeitige Anfragen
const DELAY_MS   = 300; // Pause zwischen Batches (Rate-Limiting)

const BASE = 'https://giatadrive.com/api/v1';
const HEADERS = { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' };

const OUTPUT = path.join(__dirname, '..', 'giata-search-index.json');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url) {
  const resp = await fetch(url, { headers: HEADERS });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} für ${url}`);
  return resp.json();
}

/**
 * Giata Properties-Liste für ein Land abrufen.
 * Gibt Array von giataId-Strings zurück.
 */
async function fetchPropertyIds(countryCode) {
  const ids = [];
  let page = 1;
  while (ids.length < LIMIT_PER_COUNTRY) {
    let data;
    try {
      // Versuche paginierte Abfrage
      data = await fetchJson(`${BASE}/properties?countryCode=${countryCode}&page=${page}&pageSize=100`);
    } catch (e) {
      // Fallback: URL-Liste ohne Paginierung
      try {
        data = await fetchJson(`${BASE}/properties?countryCode=${countryCode}`);
      } catch (e2) {
        console.warn(`  ⚠️  Konnte Properties für ${countryCode} nicht laden: ${e2.message}`);
        break;
      }
    }

    // Giata gibt entweder { properties: [{giataId, href}] } oder { data: [...] } zurück
    const list = data.properties || data.data || data.content || (Array.isArray(data) ? data : []);
    if (!list.length) break;

    list.forEach(item => {
      const gId = item.giataId || item.id || (item.href && item.href.split('/').pop());
      if (gId) ids.push(String(gId));
    });

    // Paginierung: weiter wenn `nextPage` vorhanden oder pageSize voll ausgeschöpft
    if (list.length < 100 || !data.nextPage) break;
    page++;
  }
  return ids.slice(0, LIMIT_PER_COUNTRY);
}

/**
 * Kompakte Hotel-Info aus Property-Details extrahieren.
 */
function extractHotelInfo(d, countryCode) {
  const name    = (d.names  || []).find(n => n.isDefault)?.value
                  || (d.names  || [])[0]?.value || '';
  const city    = (d.city?.names  || []).find(n => n.locale === 'de')?.value
                  || (d.city?.names  || [])[0]?.value
                  || d.city?.name || '';
  const country = (d.country?.names || []).find(n => n.locale === 'de')?.value
                  || (d.country?.names || [])[0]?.value
                  || d.country?.name || countryCode;
  const stars   = Math.round(parseFloat((d.ratings || []).find(r => r.isDefault)?.value || d.stars || 0));

  if (!name) return null;
  return { giataId: String(d.giataId || d.id), name, city, country, stars };
}

async function main() {
  console.log('🏗  Giata Search-Index wird aufgebaut…');
  console.log(`   Länder: ${COUNTRIES.join(', ')}`);
  console.log(`   Min. Sterne: ${MIN_STARS}, Limit/Land: ${LIMIT_PER_COUNTRY}`);
  console.log('');

  const index = [];
  const seen  = new Set();

  for (const cc of COUNTRIES) {
    process.stdout.write(`🌍  ${cc} – IDs abrufen… `);
    let ids;
    try {
      ids = await fetchPropertyIds(cc);
    } catch (e) {
      console.log(`Fehler: ${e.message}`);
      continue;
    }
    console.log(`${ids.length} gefunden`);

    // Batches
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async gId => {
        if (seen.has(gId)) return;
        seen.add(gId);
        try {
          const d    = await fetchJson(`${BASE}/properties/${gId}`);
          const info = extractHotelInfo(d, cc);
          if (info && info.stars >= MIN_STARS) index.push(info);
        } catch (e) {
          // Einzelne Fehler ignorieren
        }
      }));
      process.stdout.write(`\r   ${Math.min(i + BATCH_SIZE, ids.length)}/${ids.length} verarbeitet…`);
      await sleep(DELAY_MS);
    }
    console.log(`\r   ✅  ${index.length} Hotels bisher im Index`);
  }

  // Alphabetisch sortieren
  index.sort((a, b) => a.name.localeCompare(b.name, 'de'));

  fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2), 'utf8');
  console.log('');
  console.log(`✅  Index gespeichert: ${OUTPUT}`);
  console.log(`   ${index.length} Hotels im Index`);
  console.log('');
  console.log('Nächster Schritt: Index committen und deployen:');
  console.log('  git add ../giata-search-index.json && git commit -m "data: update giata search index" && git push');
  console.log('  vercel --prod');
}

main().catch(e => {
  console.error('❌ Fehler:', e.message);
  process.exit(1);
});
