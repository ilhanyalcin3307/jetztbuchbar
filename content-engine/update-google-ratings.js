#!/usr/bin/env node
/**
 * update-google-ratings.js
 * Google Places (New) API üzerinden her otelin rating + review sayısını çeker
 * ve data/google-ratings.json dosyasını günceller.
 *
 * Kullanım:
 *   node content-engine/update-google-ratings.js              # tüm oteller
 *   node content-engine/update-google-ratings.js --new-only   # sadece placeId'siz olanlar
 *   node content-engine/update-google-ratings.js --dry-run    # API çağrısı yapmaz, log basar
 *
 * Gerekli environment değişkeni:
 *   GOOGLE_PLACES_API_KEY=...
 *   (dosya konumu: proje kökündeki .env.local veya Vercel dashboard)
 *
 * Maliyet tahmini (2025 Google Places fiyatları):
 *   - Text Search (placeId bulmak):  $0.032 / istek  (sadece yeni otellerden)
 *   - Place Details (rating almak):  $0.017 / istek  (her güncelleme turunda)
 *   - 300 otel × $0.017 = $5.10/ay  →  $200 aylık ücretsiz kredit içinde
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// .env.local dosyasını manuel yükle (dotenv paketi olmadan)
try {
  const envFile = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
    }
  }
} catch (e) { /* ignore */ }

const API_KEY  = process.env.GOOGLE_PLACES_API_KEY;
const DRY_RUN  = process.argv.includes('--dry-run');
const NEW_ONLY = process.argv.includes('--new-only');

if (!API_KEY && !DRY_RUN) {
  console.error('HATA: GOOGLE_PLACES_API_KEY ortam değişkeni eksik.');
  console.error('  → .env.local dosyasına ekle: GOOGLE_PLACES_API_KEY=AIzaSy...');
  process.exit(1);
}

const INDEX_PATH   = path.join(__dirname, '..', 'api', 'giata-search-index.json');
const RATINGS_PATH = path.join(__dirname, '..', 'data', 'google-ratings.json');
const DELAY_MS     = 120; // Google API rate limit için bekleme süresi (ms)

// ── Yardımcı fonksiyonlar ──────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch (e) { return null; }
}

/**
 * Google Places Text Search (legacy) ile otel adı + şehir kullanarak placeId bul.
 * Referans: https://developers.google.com/maps/documentation/places/web-service/text-search
 */
async function findPlaceId(hotelName, city, country) {
  if (DRY_RUN) return `DRYRUN_PLACE_${Math.random().toString(36).slice(2, 8)}`;

  const query = encodeURIComponent(`${hotelName} ${city} ${country}`);
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&type=lodging&key=${API_KEY}`;

  const resp = await fetch(url);

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Text Search ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Text Search ${data.status}: ${data.error_message || ''}`);
  }

  const place = (data.results || [])[0];
  if (!place) return null;

  return {
    placeId:     place.place_id,
    rating:      place.rating             || null,
    reviewCount: place.user_ratings_total || 0,
  };
}

/**
 * Google Places Details (legacy) ile mevcut placeId'den güncel rating al.
 * Referans: https://developers.google.com/maps/documentation/places/web-service/place-details
 */
async function fetchPlaceDetails(placeId) {
  if (DRY_RUN) {
    return {
      rating:      (3.5 + Math.random() * 1.5).toFixed(1) * 1,
      reviewCount: Math.floor(100 + Math.random() * 3000),
    };
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${API_KEY}`;
  const resp = await fetch(url, {
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Place Details ${resp.status}: ${body.slice(0, 200)}`);
  }

  const data = await resp.json();
  if (data.status !== 'OK') {
    throw new Error(`Place Details ${data.status}: ${data.error_message || ''}`);
  }
  return {
    rating:      data.result?.rating             || null,
    reviewCount: data.result?.user_ratings_total || 0,
  };
}

// ── Ana fonksiyon ──────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(' JetztBuchbar — Google Ratings Updater');
  if (DRY_RUN)  console.log(' ⚠️  DRY RUN — hiçbir API çağrısı yapılmaz');
  if (NEW_ONLY) console.log(' 🔍  NEW ONLY — sadece placeId\'siz oteller güncellenir');
  console.log('='.repeat(70));

  // 1. Mevcut rating verilerini yükle
  const ratings = loadJson(RATINGS_PATH) || {};
  console.log(`\nMevcut kayıt: ${Object.keys(ratings).length} otel`);

  // 2. GIATA arama indeksini yükle
  const index = loadJson(INDEX_PATH);
  if (!index) {
    console.error('\nHATA: giata-search-index.json bulunamadı.');
    console.error('  → Önce: node content-engine/build-giata-index.js');
    process.exit(1);
  }
  console.log(`GIATA indeksi: ${index.length} otel`);

  // 3. Hangi otellerin güncelleneceğini belirle
  const toProcess = NEW_ONLY
    ? index.filter(h => !ratings[h.giataId] || !ratings[h.giataId].placeId)
    : index;

  console.log(`\nİşlenecek: ${toProcess.length} otel`);

  if (toProcess.length === 0) {
    console.log('Güncellenecek otel yok. Çıkılıyor.\n');
    return;
  }

  // 4. Maliyet tahmini
  const needSearch  = toProcess.filter(h => !ratings[h.giataId]?.placeId).length;
  const needDetails = toProcess.filter(h =>  ratings[h.giataId]?.placeId).length;
  const estimatedCost = (needSearch * 0.032 + needDetails * 0.017).toFixed(2);
  console.log(`Tahmini maliyet: $${estimatedCost} (Text Search: ${needSearch}, Place Details: ${needDetails})`);
  console.log('(Google $200/ay ücretsiz kredit dahilinde)\n');

  // 5. Her otel için rating çek
  let updated = 0, failed = 0, skipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const h = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    try {
      const existing = ratings[h.giataId];

      if (existing?.placeId) {
        // placeId zaten var → sadece rating güncelle (Place Details)
        process.stdout.write(`${progress} ${h.name} (${h.city}) → güncelleniyor... `);
        const detail = await fetchPlaceDetails(existing.placeId);
        ratings[h.giataId] = {
          ...existing,
          rating:      detail.rating,
          reviewCount: detail.reviewCount,
          updatedAt:   new Date().toISOString().slice(0, 10),
        };
        process.stdout.write(`⭐ ${detail.rating} (${detail.reviewCount} yorum)\n`);
      } else {
        // placeId yok → Text Search ile bul
        process.stdout.write(`${progress} ${h.name} (${h.city}) → aranıyor... `);
        const result = await findPlaceId(
          h.name,
          h.city    || '',
          h.country || ''
        );

        if (!result) {
          process.stdout.write('bulunamadı ⚠️\n');
          skipped++;
          await sleep(DELAY_MS);
          continue;
        }

        ratings[h.giataId] = {
          placeId:     result.placeId,
          rating:      result.rating,
          reviewCount: result.reviewCount,
          updatedAt:   new Date().toISOString().slice(0, 10),
        };
        process.stdout.write(`⭐ ${result.rating} (${result.reviewCount} yorum)\n`);
      }

      updated++;

      // Her 10 otelde bir ara kaydet (crash durumuna karşı)
      if (updated % 10 === 0 && !DRY_RUN) {
        fs.writeFileSync(RATINGS_PATH, JSON.stringify(ratings, null, 2), 'utf-8');
        console.log(`  → Ara kayıt: ${updated} otel yazıldı`);
      }

    } catch (err) {
      process.stdout.write(`HATA: ${err.message}\n`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  // 6. Son kayıt
  if (!DRY_RUN) {
    fs.writeFileSync(RATINGS_PATH, JSON.stringify(ratings, null, 2), 'utf-8');
  }

  // 7. Özet
  console.log('\n' + '='.repeat(70));
  console.log(` Tamamlandı: ${updated} güncellendi | ${skipped} bulunamadı | ${failed} hata`);
  console.log(` Toplam kayıt: ${Object.keys(ratings).length} otel`);
  if (DRY_RUN) console.log(' (DRY RUN — dosya yazılmadı)');
  else         console.log(` Dosya: ${RATINGS_PATH}`);
  console.log('='.repeat(70) + '\n');
}

main().catch(err => {
  console.error('Beklenmeyen hata:', err);
  process.exit(1);
});
