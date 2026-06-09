#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INPUT_PATH = path.join(ROOT, 'data', 'alltours_feed.csv');
const GIATA_PATH = path.join(ROOT, 'api', 'giata-search-index.json');
const OVERRIDES_PATH = path.join(ROOT, 'data', 'alltours-overrides.json');
const REPORT_PATH = path.join(ROOT, 'data', 'alltours-unmatched-override-report.json');

const TARGET_PAGES = [
  'frankreich/index.html',
  'tuerkei/istanbul/index.html',
  'italien/rom/index.html',
  'portugal/hotels-lissabon/index.html'
];

const COUNTRY_CODE_BY_NAME = {
  'Türkei': 'TR',
  'Turkei': 'TR',
  'Griechenland': 'GR',
  'Spanien': 'ES',
  'Ägypten': 'EG',
  'Agypten': 'EG',
  'Portugal': 'PT',
  'Kroatien': 'HR',
  'Italien': 'IT',
  'Frankreich': 'FR',
  'Marokko': 'MA',
  'Malta': 'MT',
  'Tunesien': 'TN',
  'Bulgarien': 'BG',
  'Zypern': 'CY',
  'Jordanien': 'JO',
  'Vereinigte Arabische Emirate': 'AE',
  'Malediven': 'MV',
  'Kap Verde': 'CV'
};

const GENERIC_TOKENS = new Set([
  'adults', 'all', 'andalus', 'apart', 'apartment', 'apartments', 'aparthotel', 'beach',
  'by', 'club', 'creta', 'del', 'family', 'grand', 'hotel', 'hotels', 'iberostarselection',
  'inklusive', 'luxme', 'mare', 'only', 'park', 'palace', 'playa', 'residence', 'resort',
  'royal', 'selection', 'spa', 'suite', 'suitehotel', 'suites', 'the', 'village', 'waves'
]);

function splitCsvLine(line) {
  return line
    .split(/;(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map(function(value) {
      return value.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
    });
}

function loadCsv(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  if (!lines.length) throw new Error('CSV ist leer: ' + filePath);
  const header = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(function(line) {
    const cols = splitCsvLine(line);
    const row = {};
    header.forEach(function(key, index) {
      row[key] = cols[index] || '';
    });
    return row;
  });
  return rows;
}

function loadGiataHotels(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(raw) ? raw : (raw.hotels || []);
}

function loadOverrides(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      matchByMerchantProductId: {},
      matchByAwProductId: {},
      excludeMerchantProductIds: [],
      excludeAwProductIds: []
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {};
  return {
    matchByMerchantProductId: raw.matchByMerchantProductId || {},
    matchByAwProductId: raw.matchByAwProductId || {},
    excludeMerchantProductIds: raw.excludeMerchantProductIds || [],
    excludeAwProductIds: raw.excludeAwProductIds || []
  };
}

function saveOverrides(filePath, overrides) {
  fs.writeFileSync(filePath, JSON.stringify(overrides, null, 2) + '\n', 'utf8');
}

function parsePrice(value) {
  const cleaned = String(value || '').replace(',', '.').replace(/[^\d.]+/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/iberostarselection/g, 'iberostar selection')
    .replace(/luxme/g, 'lux me')
    .replace(/playa del ingles/g, 'playa del ingles')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeHotelName(value) {
  return normalizeText(value)
    .split(' ')
    .filter(function(token) {
      return token && token.length > 1 && !GENERIC_TOKENS.has(token);
    });
}

function uniqueTokens(tokens) {
  return Array.from(new Set(tokens));
}

function starsDistance(offerStars, giataStars) {
  if (!Number.isFinite(offerStars) || !Number.isFinite(giataStars)) return 0;
  const diff = Math.abs(offerStars - giataStars);
  if (diff === 0) return 0.08;
  if (diff <= 0.5) return 0.05;
  if (diff <= 1) return 0.02;
  if (diff <= 1.5) return -0.03;
  return -0.08;
}

function buildGiataIndex(hotels) {
  const exactMap = new Map();
  const tokenMap = new Map();
  const prepared = hotels.map(function(hotel) {
    const normalizedName = normalizeText(hotel.name);
    const tokens = uniqueTokens(tokenizeHotelName(hotel.name));
    const preparedHotel = {
      giataId: String(hotel.giataId),
      name: hotel.name,
      city: hotel.city || '',
      country: hotel.country || '',
      stars: Number(hotel.stars) || 0,
      normalizedName: normalizedName,
      tokens: tokens
    };

    if (!exactMap.has(normalizedName)) exactMap.set(normalizedName, []);
    exactMap.get(normalizedName).push(preparedHotel);

    tokens.forEach(function(token) {
      if (!tokenMap.has(token)) tokenMap.set(token, []);
      tokenMap.get(token).push(preparedHotel);
    });

    return preparedHotel;
  });

  return { hotels: prepared, exactMap: exactMap, tokenMap: tokenMap };
}

function pickExactMatch(candidates, offerStars) {
  if (!candidates || !candidates.length) return null;
  let best = null;
  let bestDelta = Infinity;

  candidates.forEach(function(candidate) {
    const delta = Math.abs((Number.isFinite(offerStars) ? offerStars : candidate.stars) - candidate.stars);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  });

  return best;
}

function scoreCandidate(offer, candidate) {
  const offerTokenSet = new Set(offer.tokens);
  const candidateTokenSet = new Set(candidate.tokens);
  let overlap = 0;

  offerTokenSet.forEach(function(token) {
    if (candidateTokenSet.has(token)) overlap += 1;
  });

  if (!overlap) return null;

  const precision = overlap / Math.max(offerTokenSet.size, 1);
  const recall = overlap / Math.max(candidateTokenSet.size, 1);
  const substringBoost = (
    candidate.normalizedName.includes(offer.normalizedName) ||
    offer.normalizedName.includes(candidate.normalizedName)
  ) ? 0.08 : 0;

  const score = precision * 0.55 + recall * 0.35 + substringBoost + starsDistance(offer.stars, candidate.stars);
  return {
    candidate: candidate,
    overlap: overlap,
    score: score
  };
}

function findBestMatch(offer, giataIndex) {
  const exactCandidates = giataIndex.exactMap.get(offer.normalizedName);
  if (exactCandidates && exactCandidates.length) {
    return {
      type: 'exact',
      score: 1,
      candidate: pickExactMatch(exactCandidates, offer.stars)
    };
  }

  const candidateMap = new Map();
  offer.tokens.forEach(function(token) {
    const matches = giataIndex.tokenMap.get(token) || [];
    matches.forEach(function(candidate) {
      const key = candidate.giataId;
      if (!candidateMap.has(key)) candidateMap.set(key, candidate);
    });
  });

  let best = null;
  candidateMap.forEach(function(candidate) {
    const scored = scoreCandidate(offer, candidate);
    if (!scored) return;
    if (!best || scored.score > best.score) best = scored;
  });

  if (!best) return null;
  if (best.score >= 0.9 && best.overlap >= 2) {
    return { type: 'strong', score: best.score, candidate: best.candidate };
  }
  if (best.score >= 0.78 && best.overlap >= 2) {
    return { type: 'probable', score: best.score, candidate: best.candidate };
  }
  return null;
}

function findHotelByGiataId(giataIndex, giataId) {
  const id = String(giataId || '');
  return giataIndex.hotels.find(function(hotel) { return hotel.giataId === id; }) || null;
}

function applyOverride(offer, giataIndex, overrides) {
  const excludedMerchantIds = new Set((overrides.excludeMerchantProductIds || []).map(String));
  const excludedAwIds = new Set((overrides.excludeAwProductIds || []).map(String));
  if (excludedMerchantIds.has(String(offer.merchantProductId || '')) || excludedAwIds.has(String(offer.awProductId || ''))) {
    return { type: 'excluded', score: 0, candidate: null };
  }

  const forcedGiataId = overrides.matchByMerchantProductId[String(offer.merchantProductId || '')]
    || overrides.matchByAwProductId[String(offer.awProductId || '')]
    || null;

  if (!forcedGiataId) return null;

  const candidate = findHotelByGiataId(giataIndex, forcedGiataId);
  if (!candidate) {
    throw new Error('Override verweist auf unbekannte GIATA-ID: ' + forcedGiataId + ' fuer ' + (offer.merchantProductId || offer.awProductId || offer.productName));
  }

  return { type: 'override', score: 1.2, candidate: candidate };
}

function findDirectDeepLinkMatch(offer, giataIndex) {
  if (!offer.deepLinkHotelId) return null;
  const candidate = findHotelByGiataId(giataIndex, offer.deepLinkHotelId);
  if (!candidate) return null;
  return { type: 'deeplink', score: 2, candidate: candidate };
}

function parsePageCarousels(html) {
  const re = /<div[^>]*data-hotel-carousel="([^"]+)"([^>]*)>/g;
  const out = [];
  let match;

  while ((match = re.exec(html))) {
    const attrs = match[2] || '';
    const single = attrs.match(/data-carousel-city="([^"]+)"/);
    const multi = attrs.match(/data-carousel-cities="([^"]+)"/);
    out.push({
      countryCode: String(match[1] || '').trim(),
      cities: multi
        ? multi[1].split(',').map(function(city) { return city.trim(); }).filter(Boolean)
        : (single ? [single[1].trim()] : [])
    });
  }

  return out;
}

function geoMatch(giataHotel, target) {
  const hotelCode = COUNTRY_CODE_BY_NAME[giataHotel.country] || '';
  if (target.countryCode !== '*' && target.countryCode && hotelCode !== target.countryCode) return false;

  if (!target.cities.length) return true;

  const cityNorm = normalizeText(giataHotel.city || '');
  return target.cities.some(function(city) {
    const wanted = normalizeText(city);
    return cityNorm.includes(wanted) || wanted.includes(cityNorm);
  });
}

function buildTargetGiataIdSet(giataHotels, pages) {
  const ids = new Set();

  pages.forEach(function(pagePath) {
    if (!fs.existsSync(pagePath)) return;
    const html = fs.readFileSync(pagePath, 'utf8');
    const configs = parsePageCarousels(html);
    const uniqueConfigs = new Map();

    configs.forEach(function(cfg) {
      uniqueConfigs.set(cfg.countryCode + '|' + cfg.cities.join(','), cfg);
    });

    uniqueConfigs.forEach(function(cfg) {
      giataHotels.forEach(function(hotel) {
        if (geoMatch(hotel, cfg)) ids.add(String(hotel.giataId));
      });
    });
  });

  return ids;
}

function createOfferRecord(row) {
  const productName = row.product_name || row['Travel:hotel_name'] || '';
  const merchantDeepLink = row.merchant_deep_link || '';
  const deepLinkHotelIdMatch = merchantDeepLink.match(/\/hoteldetail\/(\d+)/);

  return {
    awProductId: row.aw_product_id || '',
    merchantProductId: row.merchant_product_id || '',
    productName: productName,
    normalizedName: normalizeText(productName),
    tokens: uniqueTokens(tokenizeHotelName(productName)),
    awDeepLink: row.aw_deep_link || '',
    merchantDeepLink: merchantDeepLink,
    deepLinkHotelId: deepLinkHotelIdMatch ? String(deepLinkHotelIdMatch[1]) : '',
    stars: parsePrice(row['Travel:hotel_stars'])
  };
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) throw new Error('Feed fehlt: ' + INPUT_PATH);
  if (!fs.existsSync(GIATA_PATH)) throw new Error('GIATA-Index fehlt: ' + GIATA_PATH);

  const rows = loadCsv(INPUT_PATH);
  const giataHotelsRaw = loadGiataHotels(GIATA_PATH);
  const giataIndex = buildGiataIndex(giataHotelsRaw);
  const overrides = loadOverrides(OVERRIDES_PATH);

  const absolutePages = TARGET_PAGES.map(function(relPath) {
    return path.join(ROOT, relPath);
  });

  const targetGiataIds = buildTargetGiataIdSet(giataHotelsRaw, absolutePages);
  const existingOverrideMerchantIds = new Set(Object.keys(overrides.matchByMerchantProductId || {}).map(String));

  const unmatchedForTarget = [];
  const newMappings = {};

  rows.forEach(function(row) {
    const offer = createOfferRecord(row);
    if (!offer.productName || !offer.awDeepLink) return;

    const overrideMatch = applyOverride(offer, giataIndex, overrides);
    if (overrideMatch && overrideMatch.type === 'excluded') return;
    const directMatch = overrideMatch ? null : findDirectDeepLinkMatch(offer, giataIndex);
    const fuzzyMatch = (!overrideMatch && !directMatch) ? findBestMatch(offer, giataIndex) : null;
    const isMatched = Boolean(overrideMatch || directMatch || fuzzyMatch);

    if (isMatched) return;
    if (!offer.deepLinkHotelId) return;

    const isInTargetRegion = targetGiataIds.has(offer.deepLinkHotelId);

    unmatchedForTarget.push({
      merchantProductId: offer.merchantProductId,
      awProductId: offer.awProductId,
      productName: offer.productName,
      deepLinkHotelId: offer.deepLinkHotelId,
      inTargetRegionByGiataId: isInTargetRegion
    });

    if (!isInTargetRegion) return;
    if (!offer.merchantProductId) return;
    if (existingOverrideMerchantIds.has(String(offer.merchantProductId))) return;
    newMappings[String(offer.merchantProductId)] = String(offer.deepLinkHotelId);
  });

  const beforeCount = Object.keys(overrides.matchByMerchantProductId || {}).length;
  const newPairs = Object.keys(newMappings).sort();

  newPairs.forEach(function(merchantProductId) {
    overrides.matchByMerchantProductId[merchantProductId] = newMappings[merchantProductId];
  });

  if (newPairs.length) {
    saveOverrides(OVERRIDES_PATH, overrides);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    targetPages: TARGET_PAGES,
    stats: {
      totalFeedRows: rows.length,
      targetGiataHotelIds: targetGiataIds.size,
      unmatchedRowsWithDeepLink: unmatchedForTarget.length,
      targetEligibleUnmatchedRows: unmatchedForTarget.filter(function(item) { return item.inTargetRegionByGiataId; }).length,
      uniqueNewOverrideMappings: newPairs.length,
      overridesBefore: beforeCount,
      overridesAfter: Object.keys(overrides.matchByMerchantProductId || {}).length
    },
    newMappings: newPairs.map(function(merchantProductId) {
      return {
        merchantProductId: merchantProductId,
        giataId: newMappings[merchantProductId]
      };
    }),
    unmatchedSample: unmatchedForTarget.slice(0, 100)
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('Unmatched-to-Override Pipeline abgeschlossen.');
  console.log('  Zielseiten: ' + TARGET_PAGES.join(', '));
  console.log('  GIATA-Target-IDs: ' + report.stats.targetGiataHotelIds);
  console.log('  Unmatched (mit DeepLink): ' + report.stats.unmatchedRowsWithDeepLink);
  console.log('  Region-eligible unmatched: ' + report.stats.targetEligibleUnmatchedRows);
  console.log('  Neue Override-Mappings: ' + report.stats.uniqueNewOverrideMappings);
  console.log('  Overrides: ' + report.stats.overridesBefore + ' -> ' + report.stats.overridesAfter);
  console.log('  Report: ' + REPORT_PATH);
  if (!newPairs.length) {
    console.log('  Hinweis: Keine neuen region-eligible DeepLink-ID-Matches im aktuellen GIATA-Index gefunden.');
  }
}

main();
