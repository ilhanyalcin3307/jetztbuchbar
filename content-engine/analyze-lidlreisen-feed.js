#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'data', 'lidlreisen-feed.csv');
const GIATA_PATH = path.join(__dirname, '..', 'api', 'giata-search-index.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'lidlreisen-offers.json');
const REPORT_PATH = path.join(__dirname, '..', 'data', 'lidlreisen-match-report.json');

function detectDelimiter(line) {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return commaCount >= semicolonCount ? ',' : ';';
}

function splitCsvLine(line, delimiter) {
  const escapedDelimiter = delimiter === ';' ? ';' : ',';
  return line
    .split(new RegExp(escapedDelimiter + '(?=(?:[^"]*"[^"]*")*[^"]*$)'))
    .map(function(value) {
      return value.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
    });
}

function loadCsv(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error('CSV ist leer: ' + filePath);
  const delimiter = detectDelimiter(lines[0]);
  const header = splitCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map(function(line) {
    const cols = splitCsvLine(line, delimiter);
    const row = {};
    header.forEach(function(key, index) {
      row[key] = cols[index] || '';
    });
    return row;
  });
  return { header: header, rows: rows };
}

function loadGiataHotels(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(raw) ? raw : (raw.hotels || []);
}

function parsePrice(value) {
  const cleaned = String(value || '').replace(',', '.').replace(/[^\d.]+/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDuration(value) {
  const cleaned = String(value || '').trim();
  if (!cleaned) return null;
  const match = cleaned.match(/(\d+(?:[\.,]\d+)?)/);
  if (!match) return null;
  const parsed = parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractGiataId(merchantProductId) {
  const match = String(merchantProductId || '').match(/^[A-Z]+-(\d+)$/);
  return match ? String(match[1]) : '';
}

function createOfferRecord(row) {
  return {
    awProductId: row.aw_product_id || '',
    merchantProductId: row.merchant_product_id || '',
    productName: row.product_name || '',
    awDeepLink: row.aw_deep_link || '',
    merchantDeepLink: row.merchant_deep_link || '',
    image: row.merchant_image_url || row.aw_image_url || '',
    description: row.description || '',
    boardBasis: row['Travel:board_basis'] || '',
    duration: parseDuration(row['Travel:duration']),
    stars: parsePrice(row['Travel:hotel_stars']),
    price: parsePrice(row.search_price),
    currency: row.currency || 'EUR',
    displayPrice: row.display_price || '',
    merchantName: row.merchant_name || 'Lidl Reisen',
    merchantCategory: row.merchant_category || '',
    categoryName: row.category_name || '',
    giataId: extractGiataId(row.merchant_product_id),
    validFrom: row.valid_from || '',
    validTo: row.valid_to || '',
    inStock: row.in_stock === '1' || row.stock_status === 'in stock' || row.is_for_sale === '1'
  };
}

function buildGiataMap(hotels) {
  return hotels.reduce(function(map, hotel) {
    const giataId = String(hotel.giataId || '');
    if (giataId) map.set(giataId, hotel);
    return map;
  }, new Map());
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) throw new Error('Feed fehlt: ' + INPUT_PATH);
  if (!fs.existsSync(GIATA_PATH)) throw new Error('GIATA-Index fehlt: ' + GIATA_PATH);

  const csv = loadCsv(INPUT_PATH);
  const giataHotels = loadGiataHotels(GIATA_PATH);
  const giataMap = buildGiataMap(giataHotels);
  const grouped = new Map();
  const unmatched = [];
  const stats = {
    totalOffers: 0,
    prefixPatternOffers: 0,
    validGiataIdOffers: 0,
    liveEligibleOffers: 0,
    unmatchedOffers: 0,
    invalidGiataIdOffers: 0,
    skippedWithoutLink: 0,
    skippedWithoutPrice: 0
  };

  csv.rows.forEach(function(row) {
    const offer = createOfferRecord(row);
    if (!offer.productName) return;

    stats.totalOffers += 1;
    if (!offer.awDeepLink && !offer.merchantDeepLink) {
      stats.skippedWithoutLink += 1;
      return;
    }
    if (!Number.isFinite(offer.price) || offer.price <= 0) {
      stats.skippedWithoutPrice += 1;
      return;
    }
    if (offer.giataId) stats.prefixPatternOffers += 1;

    const hotel = offer.giataId ? giataMap.get(offer.giataId) : null;
    if (!hotel) {
      stats.unmatchedOffers += 1;
      if (offer.giataId) stats.invalidGiataIdOffers += 1;
      if (unmatched.length < 250) {
        unmatched.push({
          productName: offer.productName,
          merchantProductId: offer.merchantProductId,
          awProductId: offer.awProductId,
          price: offer.price,
          categoryName: offer.categoryName,
          merchantCategory: offer.merchantCategory
        });
      }
      return;
    }

    stats.validGiataIdOffers += 1;
    stats.liveEligibleOffers += 1;

    const giataId = String(hotel.giataId || '');
    if (!grouped.has(giataId)) {
      grouped.set(giataId, {
        giataId: giataId,
        giataName: hotel.name,
        giataCity: hotel.city || '',
        giataCountry: hotel.country || '',
        giataStars: Number(hotel.stars) || 0,
        bestOffer: null,
        offers: []
      });
    }

    const entry = grouped.get(giataId);
    const matchedOffer = {
      awProductId: offer.awProductId,
      merchantProductId: offer.merchantProductId,
      productName: offer.productName,
      boardBasis: offer.boardBasis,
      duration: offer.duration,
      stars: offer.stars,
      price: offer.price,
      currency: offer.currency,
      displayPrice: offer.displayPrice,
      awDeepLink: offer.awDeepLink,
      merchantDeepLink: offer.merchantDeepLink,
      image: offer.image,
      merchantCategory: offer.merchantCategory,
      categoryName: offer.categoryName,
      matchType: 'merchantProductIdSuffix',
      matchScore: 1,
      validFrom: offer.validFrom,
      validTo: offer.validTo,
      inStock: offer.inStock
    };

    entry.offers.push(matchedOffer);
    if (!entry.bestOffer || matchedOffer.price < entry.bestOffer.price) {
      entry.bestOffer = matchedOffer;
    }
  });

  const hotels = Array.from(grouped.values())
    .map(function(entry) {
      entry.offers.sort(function(a, b) {
        return a.price - b.price;
      });
      entry.offerCount = entry.offers.length;
      return entry;
    })
    .sort(function(a, b) {
      return a.bestOffer.price - b.bestOffer.price;
    });

  const output = {
    generatedAt: new Date().toISOString(),
    source: path.basename(INPUT_PATH),
    provider: 'Lidl Reisen',
    stats: Object.assign({}, stats, {
      matchedHotels: hotels.length,
      validGiataRate: stats.totalOffers ? Number(((stats.validGiataIdOffers / stats.totalOffers) * 100).toFixed(2)) : 0,
      liveMatchRate: stats.totalOffers ? Number(((stats.liveEligibleOffers / stats.totalOffers) * 100).toFixed(2)) : 0
    }),
    hotels: hotels
  };

  const report = {
    generatedAt: output.generatedAt,
    source: output.source,
    provider: output.provider,
    stats: output.stats,
    notes: [
      'Primaeres Match-Signal ist merchant_product_id im Format AC-<giataId> oder PA-<giataId>.',
      'Travel:-Felder sind im gelieferten Feed weitgehend leer und werden nicht fuer das Live-Matching benoetigt.',
      'Live-Output uebernimmt nur Angebote, deren merchant_product_id-Suffix als GIATA-ID im lokalen Index existiert.',
      'aw_deep_link wird spaeter im API-Layer als bevorzugter Deeplink genutzt.'
    ],
    unmatchedSamples: unmatched
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('Lidl-Reisen-Analyse abgeschlossen.');
  console.log('  Angebote: ' + output.stats.totalOffers);
  console.log('  Prefix-Pattern: ' + output.stats.prefixPatternOffers);
  console.log('  Gueltige GIATA-ID-Angebote: ' + output.stats.validGiataIdOffers + ' (' + output.stats.validGiataRate + '%)');
  console.log('  Live-eligible Angebote: ' + output.stats.liveEligibleOffers + ' (' + output.stats.liveMatchRate + '%)');
  console.log('  Gematchte Hotels: ' + output.stats.matchedHotels);
  console.log('  Output: ' + OUTPUT_PATH);
  console.log('  Report: ' + REPORT_PATH);
}

main();