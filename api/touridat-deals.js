const fs = require('fs');
const path = require('path');

const FEED_PATH = path.join(__dirname, '..', 'data', 'touridat-feed.csv');
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = {
  loadedAt: 0,
  mtimeMs: 0,
  dealsById: new Map(),
  topDeals: []
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += c;
      }
      i += 1;
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (c === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }

    if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }

    if (c === '\r') {
      i += 1;
      continue;
    }

    field += c;
    i += 1;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parsePrice(value) {
  const cleaned = String(value || '').replace(',', '.').replace(/[^\d.]+/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value) {
  const d = new Date(String(value || '').trim());
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

function extractLocation(title) {
  const normalized = normSpace(title);
  if (!normalized) return '';
  const m = normalized.match(/\sin\s+(.+?)(?:\s+mit\s+|\s+inkl|\s+inklusive|\s+ab\s+|\s+fuer\s+|\s+für\s+|\s+bei\s+|$)/i);
  return m ? normSpace(m[1]) : '';
}

function shortText(value, maxLen) {
  const clean = normSpace(value);
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1).trimEnd() + '…';
}

function readFeed() {
  if (!fs.existsSync(FEED_PATH)) {
    return { dealsById: new Map(), topDeals: [] };
  }

  const stat = fs.statSync(FEED_PATH);
  const now = Date.now();
  const cacheIsFresh = cache.loadedAt && (now - cache.loadedAt) < CACHE_TTL_MS && cache.mtimeMs === stat.mtimeMs;
  if (cacheIsFresh) {
    return { dealsById: cache.dealsById, topDeals: cache.topDeals };
  }

  const raw = fs.readFileSync(FEED_PATH, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(raw);
  if (!rows.length) {
    return { dealsById: new Map(), topDeals: [] };
  }

  const header = rows[0];
  const body = rows.slice(1);

  const byMerchantProduct = new Map();
  const dealsById = new Map();

  body.forEach(function(cols) {
    const rec = {};
    header.forEach(function(key, idx) {
      rec[key] = cols[idx] || '';
    });

    const id = String(rec.aw_product_id || '').trim();
    const merchantProductId = String(rec.merchant_product_id || '').trim();
    const title = normSpace(rec.product_name || '');
    const deepLink = String(rec.aw_deep_link || '').trim();
    const price = parsePrice(rec.search_price);
    const image = String(rec.merchant_image_url || rec.aw_image_url || '').trim();
    if (!id || !merchantProductId || !title || !deepLink || !image || !Number.isFinite(price)) return;

    const deal = {
      id: id,
      awProductId: id,
      merchantProductId: merchantProductId,
      title: title,
      location: extractLocation(title),
      description: normSpace(rec.description || ''),
      shortDescription: shortText(rec.description || '', 190),
      price: price,
      currency: String(rec.currency || 'EUR').trim() || 'EUR',
      merchantName: normSpace(rec.merchant_name || 'touriDat DE'),
      merchantDeepLink: String(rec.merchant_deep_link || '').trim(),
      awDeepLink: deepLink,
      image: image,
      thumbImage: String(rec.aw_image_url || '').trim() || image,
      lastUpdated: String(rec.last_updated || '').trim(),
      lastUpdatedTs: parseDate(rec.last_updated || ''),
      displayPrice: String(rec.display_price || '').trim()
    };

    const prev = byMerchantProduct.get(merchantProductId);
    if (!prev) {
      byMerchantProduct.set(merchantProductId, deal);
      return;
    }

    if (deal.price < prev.price || (deal.price === prev.price && deal.lastUpdatedTs > prev.lastUpdatedTs)) {
      byMerchantProduct.set(merchantProductId, deal);
    }
  });

  const dedupedDeals = Array.from(byMerchantProduct.values());

  dedupedDeals.sort(function(a, b) {
    if (a.price !== b.price) return a.price - b.price;
    return b.lastUpdatedTs - a.lastUpdatedTs;
  });

  dedupedDeals.forEach(function(deal) {
    dealsById.set(deal.id, deal);
  });

  cache = {
    loadedAt: now,
    mtimeMs: stat.mtimeMs,
    dealsById: dealsById,
    topDeals: dedupedDeals.slice(0, 50)
  };

  return { dealsById: cache.dealsById, topDeals: cache.topDeals };
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const action = String(req.query.action || 'list').trim().toLowerCase();
  const { dealsById, topDeals } = readFeed();

  if (action === 'detail') {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const deal = dealsById.get(id);
    if (!deal) return res.status(404).json({ error: 'Deal not found' });

    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
    return res.status(200).json({ deal: deal });
  }

  const limitRaw = Number.parseInt(String(req.query.limit || '10'), 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 20)) : 10;

  const deals = topDeals.slice(0, limit).map(function(deal) {
    return {
      id: deal.id,
      title: deal.title,
      location: deal.location,
      shortDescription: deal.shortDescription,
      price: deal.price,
      currency: deal.currency,
      image: deal.image,
      thumbImage: deal.thumbImage,
      merchantName: deal.merchantName,
      lastUpdated: deal.lastUpdated
    };
  });

  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
  return res.status(200).json({
    total: deals.length,
    source: 'touridat-feed.csv',
    deals: deals
  });
};
