const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const src = path.join(ROOT, 'data', 'wearetravel-feed.csv');
const out = path.join(ROOT, 'data', 'wearetravel-offers.json');

const PLACEHOLDER_HASHES = new Set([
  // Common "No image available" asset returned by the feed CDN
  '664709703d7c90bb27f9aa0b68033e947967fecf',
]);

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cur += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      out.push(cur);
      cur = '';
      i += 1;
      continue;
    }
    cur += ch;
    i += 1;
  }
  out.push(cur);
  return out;
}

function parseCsv(content) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = parseCsvLine(line);
    const row = {};
    for (let i = 0; i < headers.length; i += 1) row[headers[i]] = (vals[i] || '').trim();
    return row;
  });
}

function slugify(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'gutschein';
}

function toNum(v) {
  const s = String(v || '')
    .replace(/eur/gi, '')
    .replace(/€/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const rows = parseCsv(fs.readFileSync(src, 'utf8'));
  const dedup = new Map();

  for (const r of rows) {
    const link = (r.aw_deep_link || '').trim();
    const name = (r.product_name || '').trim();
    const imagePrimary = (r.aw_image_url || '').trim();
    const imageFallback = (r.merchant_image_url || '').trim();
    if (!link || !name || !(imagePrimary || imageFallback)) continue;

    const item = {
      id: String(r.merchant_product_id || r.aw_product_id || slugify(name)).trim(),
      name,
      description: (r.description || '').trim(),
      image: imagePrimary || imageFallback,
      imageFallback,
      url: link,
      price: toNum(r.search_price) ?? toNum(r.display_price) ?? toNum(r.store_price),
      displayPrice: (r.display_price || '').trim(),
      currency: (r.currency || 'EUR').trim(),
      merchant: (r.merchant_name || 'We-are.travel DE/AT').trim(),
      category: (r.merchant_category || r.category_name || '').trim(),
      updatedAt: (r.last_updated || '').trim(),
    };

    const key = item.name.toLowerCase();
    if (!dedup.has(key)) {
      dedup.set(key, item);
    } else {
      const prev = dedup.get(key);
      const prevPrice = Number.isFinite(prev.price) ? prev.price : Number.POSITIVE_INFINITY;
      const curPrice = Number.isFinite(item.price) ? item.price : Number.POSITIVE_INFINITY;
      if (curPrice < prevPrice) dedup.set(key, item);
    }
  }

  const offers = Array.from(dedup.values()).sort((a, b) => {
    const pa = Number.isFinite(a.price) ? a.price : Number.POSITIVE_INFINITY;
    const pb = Number.isFinite(b.price) ? b.price : Number.POSITIVE_INFINITY;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, 'de');
  });

  const imgCache = new Map();
  async function isUsableImage(url) {
    if (!url) return false;
    if (imgCache.has(url)) return imgCache.get(url);

    let ok = false;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; JetztBuchbarBot/1.0)' },
        signal: controller.signal,
      });
      clearTimeout(t);

      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const sha1 = crypto.createHash('sha1').update(buf).digest('hex');
        const isPlaceholder = PLACEHOLDER_HASHES.has(sha1);
        const isTinyProductserve = /images2\.productserve\.com/i.test(url) && buf.length <= 1200;
        ok = !isPlaceholder && !isTinyProductserve;
      }
    } catch (_) {
      ok = false;
    }

    imgCache.set(url, ok);
    return ok;
  }

  const curated = [];
  let removedNoImage = 0;
  for (const base of offers) {
    if (curated.length >= 120) break;

    const candidatePrimary = (base.image || '').trim();
    const candidateFallback = (base.imageFallback || '').trim();
    const primaryOk = await isUsableImage(candidatePrimary);
    const fallbackOk = candidateFallback ? await isUsableImage(candidateFallback) : false;

    let image = '';
    let imageFallback = '';

    if (primaryOk) {
      image = candidatePrimary;
      imageFallback = fallbackOk ? candidateFallback : '';
    } else if (fallbackOk) {
      image = candidateFallback;
    }

    if (!image) {
      removedNoImage += 1;
      continue;
    }

    curated.push({
      ...base,
      image,
      imageFallback,
    });
  }

  const payload = {
    operator: 'we_are_travel',
    productType: 'shorttrip_voucher',
    generatedAt: new Date().toISOString(),
    count: offers.length,
    offers: curated,
  };

  fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('wearetravel offers written:', payload.offers.length, 'of', offers.length, '| removed_no_real_image:', removedNoImage);
}

main().catch((err) => {
  console.error('update-wearetravel-offers failed:', err && err.message ? err.message : err);
  process.exit(1);
});
