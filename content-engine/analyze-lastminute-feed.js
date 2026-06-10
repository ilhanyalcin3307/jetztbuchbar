#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'data', 'lastminute-feed.csv');
const GIATA_PATH = path.join(__dirname, '..', 'api', 'giata-search-index.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'lastminute-offers.json');
const REPORT_PATH = path.join(__dirname, '..', 'data', 'lastminute-match-report.json');
const IBE_MAP_PATH = path.join(__dirname, '..', 'data', 'lastminute-ibe-giata-map.json');
const IBE_MAP_CSV_PATH = path.join(__dirname, '..', 'data', 'lastminute-ibe-giata-map.csv');
const OVERRIDES_PATH = path.join(__dirname, '..', 'data', 'lastminute-overrides.json');

const GENERIC_TOKENS = new Set([
  'adults', 'air', 'all', 'and', 'apartment', 'apartments', 'beach', 'bei', 'by', 'city',
  'club', 'de', 'del', 'der', 'des', 'die', 'dos', 'el', 'for', 'from', 'hotel', 'hotels',
  'inkl', 'inklusive', 'le', 'los', 'mit', 'nur', 'oder', 'package', 'palace', 'park',
  'plus', 'residence', 'resort', 'room', 'rooms', 'spa', 'suite', 'suites', 'the', 'und',
  'urlaub', 'village', 'with'
]);

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

function loadOverrides(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      matchByIbeId: {},
      matchByMerchantProductId: {},
      excludeIbeIds: [],
      excludeMerchantProductIds: []
    };
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {};
  return {
    matchByIbeId: raw.matchByIbeId || {},
    matchByMerchantProductId: raw.matchByMerchantProductId || {},
    excludeIbeIds: raw.excludeIbeIds || [],
    excludeMerchantProductIds: raw.excludeMerchantProductIds || []
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
    .replace(/&/g, ' and ')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCity(value) {
  let v = normalizeText(value);
  if (!v) return '';
  v = v.split(',')[0].trim();
  return v;
}

function tokenize(value) {
  return normalizeText(value)
    .split(' ')
    .filter(function(token) {
      return token && token.length > 1 && !GENERIC_TOKENS.has(token);
    });
}

function uniqueTokens(tokens) {
  return Array.from(new Set(tokens));
}

function extractIbeIdFromLink(url) {
  const m = String(url || '').match(/\/tsx\/(\d+)/);
  return m ? String(m[1]) : '';
}

function extractLikelyHotelName(productName) {
  const raw = String(productName || '').trim();
  if (!raw) return '';
  const parts = raw.split(' - ').map(function(s) { return s.trim(); }).filter(Boolean);
  if (!parts.length) return raw;
  return parts[parts.length - 1];
}

function createOfferRecord(row) {
  const productName = row.product_name || '';
  const hotelName = extractLikelyHotelName(productName);
  const destinationCity = row['Travel:destination_city'] || '';
  const merchantDeepLink = row.merchant_deep_link || row.aw_deep_link || '';
  const ibeId = extractIbeIdFromLink(merchantDeepLink);

  return {
    awProductId: row.aw_product_id || '',
    merchantProductId: row.merchant_product_id || '',
    productName: productName,
    hotelName: hotelName,
    normalizedName: normalizeText(hotelName),
    tokens: uniqueTokens(tokenize(hotelName)),
    destinationCity: destinationCity,
    normalizedCity: normalizeCity(destinationCity),
    awDeepLink: row.aw_deep_link || '',
    merchantDeepLink: row.merchant_deep_link || '',
    ibeId: ibeId,
    image: row.merchant_image_url || row.aw_image_url || '',
    description: row.description || '',
    boardBasis: row['Travel:board_basis'] || '',
    stars: parsePrice(row['Travel:hotel_stars']),
    price: parsePrice(row.search_price),
    currency: row.currency || 'EUR',
    displayPrice: row.display_price || '',
    merchantName: row.merchant_name || 'Lastminute',
    validFrom: row.valid_from || row['Travel:check_in_date'] || row['Travel:departure_date'] || '',
    validTo: row.valid_to || row['Travel:check_out_date'] || row['Travel:return_date'] || '',
    inStock: row.in_stock === '1' || row.stock_status === 'in stock' || row.is_for_sale === '1'
  };
}

function buildGiataIndex(hotels) {
  const exactMap = new Map();
  const tokenMap = new Map();
  const cityTokenMap = new Map();

  const prepared = hotels
    .filter(function(hotel) { return hotel && hotel.giataId != null; })
    .map(function(hotel) {
      const name = String(hotel.name || '');
      const city = String(hotel.city || '');
      const normalizedName = normalizeText(name);
      const tokens = uniqueTokens(tokenize(name));
      const normalizedCity = normalizeCity(city);

      const preparedHotel = {
        giataId: String(hotel.giataId),
        name: name,
        city: city,
        country: hotel.country || '',
        stars: Number(hotel.stars) || 0,
        normalizedName: normalizedName,
        normalizedCity: normalizedCity,
        tokens: tokens
      };

      if (!exactMap.has(normalizedName)) exactMap.set(normalizedName, []);
      exactMap.get(normalizedName).push(preparedHotel);

      tokens.forEach(function(token) {
        if (!tokenMap.has(token)) tokenMap.set(token, []);
        tokenMap.get(token).push(preparedHotel);
      });

      if (normalizedCity) {
        if (!cityTokenMap.has(normalizedCity)) cityTokenMap.set(normalizedCity, []);
        cityTokenMap.get(normalizedCity).push(preparedHotel);
      }

      return preparedHotel;
    });

  return { hotels: prepared, exactMap: exactMap, tokenMap: tokenMap, cityTokenMap: cityTokenMap };
}

function findHotelByGiataId(giataIndex, giataId) {
  const id = String(giataId || '');
  return giataIndex.hotels.find(function(hotel) { return hotel.giataId === id; }) || null;
}

function applyOverride(offer, giataIndex, overrides) {
  const excludedIbeIds = new Set((overrides.excludeIbeIds || []).map(String));
  const excludedMerchantIds = new Set((overrides.excludeMerchantProductIds || []).map(String));
  if (excludedIbeIds.has(String(offer.ibeId || '')) || excludedMerchantIds.has(String(offer.merchantProductId || ''))) {
    return { type: 'excluded', score: 0, candidate: null };
  }

  const forcedGiataId = overrides.matchByIbeId[String(offer.ibeId || '')]
    || overrides.matchByMerchantProductId[String(offer.merchantProductId || '')]
    || null;

  if (!forcedGiataId) return null;

  const candidate = findHotelByGiataId(giataIndex, forcedGiataId);
  if (!candidate) {
    throw new Error('Override verweist auf unbekannte GIATA-ID: ' + forcedGiataId + ' fuer ' + (offer.ibeId || offer.merchantProductId || offer.productName));
  }

  return { type: 'override', score: 1.2, candidate: candidate };
}

function scoreCandidate(offer, candidate) {
  const offerTokens = new Set(offer.tokens);
  const candidateTokens = new Set(candidate.tokens);

  let overlap = 0;
  offerTokens.forEach(function(token) {
    if (candidateTokens.has(token)) overlap += 1;
  });

  if (!overlap) return null;

  const precision = overlap / Math.max(offerTokens.size, 1);
  const recall = overlap / Math.max(candidateTokens.size, 1);

  const cityMatch = offer.normalizedCity && candidate.normalizedCity &&
    (offer.normalizedCity === candidate.normalizedCity ||
      candidate.normalizedCity.includes(offer.normalizedCity) ||
      offer.normalizedCity.includes(candidate.normalizedCity));

  const cityBoost = cityMatch ? 0.12 : 0;
  const substringBoost = (
    candidate.normalizedName.includes(offer.normalizedName) ||
    offer.normalizedName.includes(candidate.normalizedName)
  ) ? 0.08 : 0;

  const score = precision * 0.55 + recall * 0.35 + cityBoost + substringBoost;

  return {
    candidate: candidate,
    overlap: overlap,
    precision: precision,
    recall: recall,
    score: score,
    cityMatch: cityMatch
  };
}

function findSafeDirectIdMatch(offer, giataById) {
  if (!offer.ibeId) return null;
  const candidate = giataById.get(String(offer.ibeId));
  if (!candidate) return null;

  const scored = scoreCandidate(offer, candidate);
  if (!scored) return null;

  // Guard against IBE/GIATA numeric collisions. Require both strong text overlap and city consistency.
  if (scored.overlap >= 2 && scored.score >= 0.9 && scored.cityMatch) {
    return { type: 'directGiataId', score: 2, candidate: candidate };
  }
  return null;
}

function getBestScoredCandidate(offer, giataIndex) {
  if (!offer.normalizedName || offer.tokens.length < 2) return null;

  const candidateMap = new Map();

  if (offer.normalizedCity) {
    (giataIndex.cityTokenMap.get(offer.normalizedCity) || []).forEach(function(candidate) {
      candidateMap.set(candidate.giataId, candidate);
    });
  }

  offer.tokens.forEach(function(token) {
    (giataIndex.tokenMap.get(token) || []).forEach(function(candidate) {
      if (!candidateMap.has(candidate.giataId)) candidateMap.set(candidate.giataId, candidate);
    });
  });

  let best = null;
  candidateMap.forEach(function(candidate) {
    const scored = scoreCandidate(offer, candidate);
    if (!scored) return;
    if (!best || scored.score > best.score) best = scored;
  });

  return best;
}

function findBestMatch(offer, giataIndex) {
  if (!offer.normalizedName || offer.tokens.length < 2) return null;

  const exactCandidates = giataIndex.exactMap.get(offer.normalizedName) || [];
  if (exactCandidates.length === 1) {
    return { type: 'exact', score: 1, candidate: exactCandidates[0] };
  }

  const best = getBestScoredCandidate(offer, giataIndex);

  if (!best) return null;
  if (best.score >= 0.93 && best.overlap >= 2) {
    return { type: 'strong', score: best.score, candidate: best.candidate };
  }
  if (best.score >= 0.82 && best.overlap >= 2) {
    return { type: 'probable', score: best.score, candidate: best.candidate };
  }
  return null;
}

function pickMostCommon(mapObj) {
  let bestKey = '';
  let bestCount = -1;
  Object.keys(mapObj || {}).forEach(function(key) {
    const count = mapObj[key] || 0;
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  });
  return bestKey;
}

function incrementMap(obj, key) {
  if (!key) return;
  obj[key] = (obj[key] || 0) + 1;
}

function csvEscape(value) {
  const s = String(value == null ? '' : value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildIbeMappingRows(ibeGroups, giataIndex, giataById, overrides) {
  const rows = [];

  Array.from(ibeGroups.values()).forEach(function(group) {
    const ibeId = group.ibeId;
    const forcedGiataId = overrides.matchByIbeId[String(ibeId || '')] || null;
    if (forcedGiataId) {
      const hotel = giataById.get(String(forcedGiataId));
      rows.push({
        ibeId: ibeId,
        giataId: hotel ? hotel.giataId : String(forcedGiataId),
        giataName: hotel ? hotel.name : '',
        giataCity: hotel ? hotel.city : '',
        status: 'override',
        confidence: 1,
        score: 1.2,
        offerCount: group.offerCount,
        sampleHotelName: pickMostCommon(group.hotelNameCounts),
        sampleDestinationCity: pickMostCommon(group.destinationCityCounts)
      });
      return;
    }

    const sampleHotelName = pickMostCommon(group.hotelNameCounts);
    const sampleDestinationCity = pickMostCommon(group.destinationCityCounts);
    const offerLike = {
      normalizedName: normalizeText(sampleHotelName),
      normalizedCity: normalizeCity(sampleDestinationCity),
      tokens: uniqueTokens(tokenize(sampleHotelName))
    };

    const exactCandidates = giataIndex.exactMap.get(offerLike.normalizedName) || [];
    if (exactCandidates.length === 1) {
      rows.push({
        ibeId: ibeId,
        giataId: exactCandidates[0].giataId,
        giataName: exactCandidates[0].name,
        giataCity: exactCandidates[0].city,
        status: 'exact',
        confidence: 1,
        score: 1,
        offerCount: group.offerCount,
        sampleHotelName: sampleHotelName,
        sampleDestinationCity: sampleDestinationCity
      });
      return;
    }

    const best = getBestScoredCandidate(offerLike, giataIndex);
    if (!best) {
      rows.push({
        ibeId: ibeId,
        giataId: '',
        giataName: '',
        giataCity: '',
        status: 'unmatched',
        confidence: 0,
        score: 0,
        offerCount: group.offerCount,
        sampleHotelName: sampleHotelName,
        sampleDestinationCity: sampleDestinationCity
      });
      return;
    }

    let status = 'weak';
    let confidence = 0.45;
    if (best.score >= 0.93 && best.overlap >= 2 && best.cityMatch) {
      status = 'strong';
      confidence = 0.95;
    } else if (best.score >= 0.82 && best.overlap >= 2) {
      status = 'probable';
      confidence = 0.75;
    }

    rows.push({
      ibeId: ibeId,
      giataId: best.candidate.giataId,
      giataName: best.candidate.name,
      giataCity: best.candidate.city,
      status: status,
      confidence: confidence,
      score: Number(best.score.toFixed(4)),
      offerCount: group.offerCount,
      sampleHotelName: sampleHotelName,
      sampleDestinationCity: sampleDestinationCity
    });
  });

  rows.sort(function(a, b) {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return String(a.ibeId).localeCompare(String(b.ibeId));
  });

  return rows;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) throw new Error('Feed fehlt: ' + INPUT_PATH);
  if (!fs.existsSync(GIATA_PATH)) throw new Error('GIATA-Index fehlt: ' + GIATA_PATH);

  const csv = loadCsv(INPUT_PATH);
  const giataHotels = loadGiataHotels(GIATA_PATH);
  const giataIndex = buildGiataIndex(giataHotels);
  const giataById = new Map(giataIndex.hotels.map(function(h) { return [h.giataId, h]; }));
  const overrides = loadOverrides(OVERRIDES_PATH);

  const grouped = new Map();
  const probable = [];
  const unmatched = [];
  const ibeGroups = new Map();

  const stats = {
    totalOffers: 0,
    offersWithIbeId: 0,
    candidateMatches: 0,
    liveEligibleOffers: 0,
    directGiataIdMatches: 0,
    overrideMatches: 0,
    exactMatches: 0,
    strongMatches: 0,
    probableMatches: 0,
    excludedOffers: 0,
    unmatchedOffers: 0,
    skippedWithoutLink: 0,
    skippedWithoutPrice: 0,
    skippedWithoutHotelName: 0
  };

  csv.rows.forEach(function(row) {
    const offer = createOfferRecord(row);

    if (!offer.awDeepLink && !offer.merchantDeepLink) {
      stats.skippedWithoutLink += 1;
      return;
    }
    if (!Number.isFinite(offer.price) || offer.price <= 0) {
      stats.skippedWithoutPrice += 1;
      return;
    }
    if (!offer.hotelName) {
      stats.skippedWithoutHotelName += 1;
      return;
    }

    stats.totalOffers += 1;
    if (offer.ibeId) stats.offersWithIbeId += 1;

    if (offer.ibeId) {
      if (!ibeGroups.has(offer.ibeId)) {
        ibeGroups.set(offer.ibeId, {
          ibeId: offer.ibeId,
          offerCount: 0,
          hotelNameCounts: {},
          destinationCityCounts: {}
        });
      }
      const g = ibeGroups.get(offer.ibeId);
      g.offerCount += 1;
      incrementMap(g.hotelNameCounts, offer.hotelName);
      incrementMap(g.destinationCityCounts, offer.destinationCity);
    }

    const overrideMatch = applyOverride(offer, giataIndex, overrides);
    if (overrideMatch && overrideMatch.type === 'excluded') {
      stats.excludedOffers += 1;
      return;
    }

    const directMatch = overrideMatch ? null : findSafeDirectIdMatch(offer, giataById);

    const match = overrideMatch || directMatch || findBestMatch(offer, giataIndex);

    if (!match) {
      stats.unmatchedOffers += 1;
      if (unmatched.length < 500) {
        unmatched.push({
          ibeId: offer.ibeId,
          productName: offer.productName,
          hotelName: offer.hotelName,
          destinationCity: offer.destinationCity,
          merchantProductId: offer.merchantProductId,
          price: offer.price
        });
      }
      return;
    }

    stats.candidateMatches += 1;
    if (match.type === 'directGiataId') stats.directGiataIdMatches += 1;
    if (match.type === 'override') stats.overrideMatches += 1;
    if (match.type === 'exact') stats.exactMatches += 1;
    if (match.type === 'strong') stats.strongMatches += 1;

    if (match.type === 'probable') {
      stats.probableMatches += 1;
      if (probable.length < 500) {
        probable.push({
          ibeId: offer.ibeId,
          giataId: match.candidate.giataId,
          giataName: match.candidate.name,
          giataCity: match.candidate.city,
          productName: offer.productName,
          hotelName: offer.hotelName,
          destinationCity: offer.destinationCity,
          score: Number(match.score.toFixed(4)),
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
        externalIds: {
          lastminuteIbeIds: []
        },
        bestOffer: null,
        offers: []
      });
    }

    const entry = grouped.get(giataId);
    if (offer.ibeId && !entry.externalIds.lastminuteIbeIds.includes(offer.ibeId)) {
      entry.externalIds.lastminuteIbeIds.push(offer.ibeId);
    }

    const matchedOffer = {
      awProductId: offer.awProductId,
      merchantProductId: offer.merchantProductId,
      ibeId: offer.ibeId,
      productName: offer.productName,
      hotelName: offer.hotelName,
      destinationCity: offer.destinationCity,
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
    if (!entry.bestOffer || matchedOffer.price < entry.bestOffer.price) {
      entry.bestOffer = matchedOffer;
    }
  });

  const hotels = Array.from(grouped.values())
    .map(function(entry) {
      entry.offers.sort(function(a, b) { return a.price - b.price; });
      entry.externalIds.lastminuteIbeIds.sort();
      entry.offerCount = entry.offers.length;
      return entry;
    })
    .sort(function(a, b) {
      return a.bestOffer.price - b.bestOffer.price;
    });

  const output = {
    generatedAt: new Date().toISOString(),
    source: path.basename(INPUT_PATH),
    provider: 'Lastminute',
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
    provider: output.provider,
    stats: output.stats,
    notes: [
      'Lastminute-IBE-ID wird aus merchant_deep_link /tsx/<id> extrahiert.',
      'Travel:-Felder wie hotel_name, hotel_stars und destination_country sind im Feed meist leer.',
      'Live-Output uebernimmt directGiataId/exact/strong/override, probable bleibt in Review-Queue.',
      'Manuelle Zuordnung kann in data/lastminute-overrides.json gepflegt werden (matchByIbeId).'
    ],
    overridesSummary: {
      matchByIbeId: Object.keys(overrides.matchByIbeId || {}).length,
      matchByMerchantProductId: Object.keys(overrides.matchByMerchantProductId || {}).length,
      excludeIbeIds: (overrides.excludeIbeIds || []).length,
      excludeMerchantProductIds: (overrides.excludeMerchantProductIds || []).length
    },
    probableReviewQueue: probable,
    unmatchedSamples: unmatched
  };

  const ibeMapRows = buildIbeMappingRows(ibeGroups, giataIndex, giataById, overrides);
  const ibeMapStats = ibeMapRows.reduce(function(acc, row) {
    acc.total += 1;
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, { total: 0 });

  const ibeMapOutput = {
    generatedAt: output.generatedAt,
    source: output.source,
    provider: output.provider,
    stats: ibeMapStats,
    rows: ibeMapRows
  };

  const csvHeader = [
    'ibeId', 'giataId', 'giataName', 'giataCity', 'status', 'confidence', 'score', 'offerCount', 'sampleHotelName', 'sampleDestinationCity'
  ];
  const csvLines = [csvHeader.join(',')].concat(ibeMapRows.map(function(row) {
    return [
      row.ibeId,
      row.giataId,
      row.giataName,
      row.giataCity,
      row.status,
      row.confidence,
      row.score,
      row.offerCount,
      row.sampleHotelName,
      row.sampleDestinationCity
    ].map(csvEscape).join(',');
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');
  fs.writeFileSync(IBE_MAP_PATH, JSON.stringify(ibeMapOutput, null, 2) + '\n', 'utf8');
  fs.writeFileSync(IBE_MAP_CSV_PATH, csvLines.join('\n') + '\n', 'utf8');

  console.log('Lastminute-Analyse abgeschlossen.');
  console.log('  Angebote: ' + output.stats.totalOffers);
  console.log('  Mit IBE-ID: ' + output.stats.offersWithIbeId);
  console.log('  Kandidaten gesamt: ' + output.stats.candidateMatches + ' (' + output.stats.candidateMatchRate + '%)');
  console.log('  Live-eligible Angebote: ' + output.stats.liveEligibleOffers + ' (' + output.stats.liveMatchRate + '%)');
  console.log('  directGiataId: ' + output.stats.directGiataIdMatches + ', override: ' + output.stats.overrideMatches + ', exact: ' + output.stats.exactMatches + ', strong: ' + output.stats.strongMatches + ', probable: ' + output.stats.probableMatches);
  console.log('  Unmatched: ' + output.stats.unmatchedOffers + ', Excluded: ' + output.stats.excludedOffers);
  console.log('  Gematchte Hotels: ' + output.stats.matchedHotels);
  console.log('  Output: ' + OUTPUT_PATH);
  console.log('  Report: ' + REPORT_PATH);
  console.log('  IBE Map (JSON): ' + IBE_MAP_PATH);
  console.log('  IBE Map (CSV): ' + IBE_MAP_CSV_PATH);
}

main();