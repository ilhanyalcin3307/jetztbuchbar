#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'data', 'alltours_feed.csv');
const GIATA_PATH = path.join(__dirname, '..', 'api', 'giata-search-index.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'alltours-offers.json');
const REPORT_PATH = path.join(__dirname, '..', 'data', 'alltours-match-report.json');
const OVERRIDES_PATH = path.join(__dirname, '..', 'data', 'alltours-overrides.json');

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
  return { header: header, rows: rows };
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
    precision: precision,
    recall: recall,
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

function createOfferRecord(row) {
  const productName = row.product_name || row['Travel:hotel_name'] || '';
  const boardBasis = row['Travel:board_basis'] || '';
  const stars = parsePrice(row['Travel:hotel_stars']);
  const price = parsePrice(row.search_price);
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
    image: row.merchant_image_url || row.aw_image_url || '',
    description: row.description || '',
    boardBasis: boardBasis,
    stars: stars,
    price: price,
    currency: row.currency || 'EUR',
    displayPrice: row.display_price || '',
    merchantName: row.merchant_name || '',
    validFrom: row.valid_from || '',
    validTo: row.valid_to || '',
    inStock: row.in_stock === '1'
  };
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

function main() {
  if (!fs.existsSync(INPUT_PATH)) throw new Error('Feed fehlt: ' + INPUT_PATH);
  if (!fs.existsSync(GIATA_PATH)) throw new Error('GIATA-Index fehlt: ' + GIATA_PATH);

  const csv = loadCsv(INPUT_PATH);
  const giataHotels = loadGiataHotels(GIATA_PATH);
  const giataIndex = buildGiataIndex(giataHotels);
  const overrides = loadOverrides(OVERRIDES_PATH);

  const grouped = new Map();
  const probable = [];
  const unmatched = [];
  const stats = {
    totalOffers: 0,
    candidateMatches: 0,
    liveEligibleOffers: 0,
    deeplinkMatches: 0,
    overrideMatches: 0,
    exactMatches: 0,
    strongMatches: 0,
    probableMatches: 0,
    excludedOffers: 0,
    unmatchedOffers: 0
  };

  csv.rows.forEach(function(row) {
    const offer = createOfferRecord(row);
    if (!offer.productName || !offer.awDeepLink) return;

    stats.totalOffers += 1;
    const overrideMatch = applyOverride(offer, giataIndex, overrides);
    if (overrideMatch && overrideMatch.type === 'excluded') {
      stats.excludedOffers += 1;
      return;
    }
    const directMatch = overrideMatch ? null : findDirectDeepLinkMatch(offer, giataIndex);
    const match = overrideMatch || directMatch || findBestMatch(offer, giataIndex);

    if (!match) {
      stats.unmatchedOffers += 1;
      if (unmatched.length < 250) {
        unmatched.push({
          productName: offer.productName,
          stars: offer.stars,
          boardBasis: offer.boardBasis,
          price: offer.price,
          merchantProductId: offer.merchantProductId
        });
      }
      return;
    }

    stats.candidateMatches += 1;
  if (match.type === 'deeplink') stats.deeplinkMatches += 1;
    if (match.type === 'override') stats.overrideMatches += 1;
    if (match.type === 'exact') stats.exactMatches += 1;
    if (match.type === 'strong') stats.strongMatches += 1;
    if (match.type === 'probable') {
      stats.probableMatches += 1;
      if (probable.length < 250) {
        probable.push({
          giataId: match.candidate.giataId,
          giataName: match.candidate.name,
          productName: offer.productName,
          score: Number(match.score.toFixed(4)),
          giataStars: match.candidate.stars,
          offerStars: offer.stars,
          merchantProductId: offer.merchantProductId
        });
      }
      return;
    }

    stats.liveEligibleOffers += 1;

    const giataId = match.candidate.giataId;
    if (!grouped.has(giataId)) {
      grouped.set(giataId, {
        giataId: giataId,
        giataName: match.candidate.name,
        giataCity: match.candidate.city,
        giataCountry: match.candidate.country,
        giataStars: match.candidate.stars,
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
      stars: offer.stars,
      price: offer.price,
      currency: offer.currency,
      displayPrice: offer.displayPrice,
      awDeepLink: offer.awDeepLink,
      merchantDeepLink: offer.merchantDeepLink,
      image: offer.image,
      matchType: match.type,
      matchScore: Number(match.score.toFixed(4)),
      validFrom: offer.validFrom,
      validTo: offer.validTo,
      inStock: offer.inStock
    };

    entry.offers.push(matchedOffer);
    if (!entry.bestOffer || (Number.isFinite(offer.price) && offer.price < entry.bestOffer.price)) {
      entry.bestOffer = matchedOffer;
    }
  });

  const hotels = Array.from(grouped.values())
    .map(function(entry) {
      entry.offers.sort(function(a, b) {
        const priceA = Number.isFinite(a.price) ? a.price : Number.MAX_SAFE_INTEGER;
        const priceB = Number.isFinite(b.price) ? b.price : Number.MAX_SAFE_INTEGER;
        return priceA - priceB;
      });
      entry.offerCount = entry.offers.length;
      return entry;
    })
    .sort(function(a, b) {
      return (a.bestOffer.price || Number.MAX_SAFE_INTEGER) - (b.bestOffer.price || Number.MAX_SAFE_INTEGER);
    });

  const output = {
    generatedAt: new Date().toISOString(),
    source: path.basename(INPUT_PATH),
    stats: Object.assign({}, stats, {
      matchedHotels: hotels.length,
      candidateMatchRate: stats.totalOffers ? Number(((stats.candidateMatches / stats.totalOffers) * 100).toFixed(2)) : 0,
      liveMatchRate: stats.totalOffers ? Number(((stats.liveEligibleOffers / stats.totalOffers) * 100).toFixed(2)) : 0
    }),
    hotels: hotels
  };

  const report = {
    generatedAt: output.generatedAt,
    source: output.source,
    stats: output.stats,
    notes: [
      'Travel:destination_city und Travel:destination_country sind im gelieferten Feed leer.',
      'Primaeres Match-Signal ist merchant_deep_link -> hoteldetail/<id>, falls die ID als GIATA-Hotel existiert.',
      'Probable-Matches werden nicht in den Live-Output uebernommen und sollten per Override freigeschaltet werden.',
      'Manuelle Regeln koennen in data/alltours-overrides.json hinterlegt werden.'
    ],
    overridesSummary: {
      matchByMerchantProductId: Object.keys(overrides.matchByMerchantProductId || {}).length,
      matchByAwProductId: Object.keys(overrides.matchByAwProductId || {}).length,
      excludeMerchantProductIds: (overrides.excludeMerchantProductIds || []).length,
      excludeAwProductIds: (overrides.excludeAwProductIds || []).length
    },
    probableReviewQueue: probable,
    unmatchedSamples: unmatched
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('Alltours-Analyse abgeschlossen.');
  console.log('  Angebote: ' + output.stats.totalOffers);
  console.log('  Kandidaten gesamt: ' + output.stats.candidateMatches + ' (' + output.stats.candidateMatchRate + '%)');
  console.log('  Live-eligible Angebote: ' + output.stats.liveEligibleOffers + ' (' + output.stats.liveMatchRate + '%)');
  console.log('  Deeplink: ' + output.stats.deeplinkMatches + ', Override: ' + output.stats.overrideMatches + ', Exact: ' + output.stats.exactMatches + ', Strong: ' + output.stats.strongMatches + ', Probable: ' + output.stats.probableMatches);
  console.log('  Excluded: ' + output.stats.excludedOffers);
  console.log('  Gematchte Hotels: ' + output.stats.matchedHotels);
  console.log('  Output: ' + OUTPUT_PATH);
  console.log('  Report: ' + REPORT_PATH);
}

main();