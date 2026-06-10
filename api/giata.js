// Vercel Serverless Function – Giata Drive API Proxy
// API-Key: Vercel-Umgebungsvariable GIATA_API_KEY
// Docs: https://giatadrive.com/specs

const GIATA_BASE = 'https://giatadrive.com/api/v1';
const fs   = require('fs');
const path = require('path');
const ENABLE_LASTMINUTE = false;

// Google Places ratings (statik önbellek — content-engine/update-google-ratings.js ile güncellenir)
function loadGoogleRatings() {
  try {
    const p = path.join(__dirname, '..', 'data', 'google-ratings.json');
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (e) { return {}; }
}

function loadAlltoursOffers() {
  try {
    const p = path.join(__dirname, '..', 'data', 'alltours-offers.json');
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const hotels = Array.isArray(raw) ? raw : (raw.hotels || []);
    return hotels.reduce(function(map, hotel) {
      const gid = String(hotel.giataId || '');
      if (gid) map[gid] = hotel;
      return map;
    }, {});
  } catch (e) { return {}; }
}

function loadLidlOffers() {
  try {
    const p = path.join(__dirname, '..', 'data', 'lidlreisen-offers.json');
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const hotels = Array.isArray(raw) ? raw : (raw.hotels || []);
    return hotels.reduce(function(map, hotel) {
      const gid = String(hotel.giataId || '');
      if (gid) map[gid] = hotel;
      return map;
    }, {});
  } catch (e) { return {}; }
}

function loadLastminuteOffers() {
  try {
    const p = path.join(__dirname, '..', 'data', 'lastminute-offers.json');
    const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const hotels = Array.isArray(raw) ? raw : (raw.hotels || []);
    return hotels.reduce(function(map, hotel) {
      const gid = String(hotel.giataId || '');
      if (gid) map[gid] = hotel;
      return map;
    }, {});
  } catch (e) { return {}; }
}

const GOOGLE_RATINGS = loadGoogleRatings();
const ALLTOURS_OFFERS = loadAlltoursOffers();
const LIDL_OFFERS = loadLidlOffers();
const LASTMINUTE_OFFERS = ENABLE_LASTMINUTE ? loadLastminuteOffers() : {};

function getAffiliateProviderEntries(giataId) {
  const gid = String(giataId || '');
  const providers = [
    { provider: 'Alltours', entry: ALLTOURS_OFFERS[gid] || null },
    { provider: 'Lidl Reisen', entry: LIDL_OFFERS[gid] || null }
  ];

  if (ENABLE_LASTMINUTE) {
    providers.push({ provider: 'Lastminute', entry: LASTMINUTE_OFFERS[gid] || null });
  }

  return providers.filter(function(item) {
    return item.entry && item.entry.bestOffer;
  });
}

function getBestProviderOffer(giataId) {
  const candidates = getAffiliateProviderEntries(giataId)
    .map(function(item) {
      const best = item.entry.bestOffer;
      const deeplink = best.awDeepLink || best.merchantDeepLink || '';
      if (!deeplink) return null;
      return {
        provider: item.provider,
        entry: item.entry,
        bestOffer: best,
        deeplink: deeplink
      };
    })
    .filter(Boolean);

  if (!candidates.length) return null;

  candidates.sort(function(a, b) {
    const priceA = Number.isFinite(a.bestOffer.price) ? a.bestOffer.price : Number.MAX_SAFE_INTEGER;
    const priceB = Number.isFinite(b.bestOffer.price) ? b.bestOffer.price : Number.MAX_SAFE_INTEGER;
    if (priceA !== priceB) return priceA - priceB;
    return String(a.provider).localeCompare(String(b.provider));
  });

  return candidates[0];
}
// ── Single Source of Truth: jb-score.js ───────────────────────────────────────────
// Node.js'de jb-score.js, module.exports.JBScore olarak export eder (this fallback)
const JBScore = require('../components/jb-score.js').JBScore;
// Giata Fact-IDs für relevante Einrichtungen
// Verifiziert via https://giatadrive.com/api/v1/i18n/facts/de (2026-05-17)
const FACT_IDS = {
  pool:       [50, 58, 43, 696, 697, 614, 615], // Außenpool=50, Pool=58, Hallenbad=43, Dachpool=696, Infinity=697
  spa:        [197, 479, 529],                  // Spa=197, Wellness-Center=479
  beach:      [89],                             // Strand=89
  aquapark:   [588],                            // Wasserpark=588
  fitness:    [220],                            // Fitness-Studio=220
  restaurant: [65, 299],                        // Restaurant
  bar:        [14, 59, 288, 450, 575],          // Bar=14, Poolbar=59, Bar/Pub=288, Lobbybar=450, Bar/Lounge=575
  kidsclub:   [945, 946, 1, 7],                 // Kids Club=945, Teens Club=946, Kinderbetreuung=1, Miniclub=7
  wifi:       [88, 185, 44, 148],               // WiFi=88/185, Internetzugang=44/148
  parking:    [22, 568],                        // Parkplatz=22, Einparkservice=568
};

// Demo-Daten für den Fall, dass noch kein API-Key konfiguriert ist
const DEMO_HOTELS = [
  {
    giataId: 'demo-1',
    name: 'Rixos Premium Belek',
    city: 'Antalya', country: 'Türkei', stars: 5,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=70',
    facilities: { pool:true, spa:true, beach:true, aquapark:true, fitness:true, concept:'Ultra All Inclusive', rooms:750, restaurant:true, bar:true, kidsclub:true, wifi:true, parking:true },
    bookUrl: '/tuerkei/antalya/',
  },
  {
    giataId: 'demo-2',
    name: 'Aldemar Knossos Royal',
    city: 'Kreta', country: 'Griechenland', stars: 5,
    image: 'https://images.unsplash.com/photo-1558870964-72e29d300edd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=70',
    facilities: { pool:true, spa:true, beach:true, aquapark:false, fitness:true, concept:'All Inclusive', rooms:320, restaurant:true, bar:true, kidsclub:true, wifi:true, parking:false },
    bookUrl: '/griechenland/kreta/',
  },
  {
    giataId: 'demo-3',
    name: 'Meliá Atlantico Isla Canela',
    city: 'Isla Canela', country: 'Spanien', stars: 4,
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=70',
    facilities: { pool:true, spa:false, beach:true, aquapark:false, fitness:true, concept:'All Inclusive', rooms:252, restaurant:true, bar:true, kidsclub:false, wifi:true, parking:true },
    bookUrl: '/spanien/',
  },
];

module.exports = async function handler(req, res) {
  // Nur GET erlauben
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { action, q, id } = req.query;
  const apiKey = process.env.GIATA_API_KEY;

  // --- Ping: API-Status prüfen (immer verfügbar) ---
  if (action === 'ping') {
    const index = loadSearchIndex();
    return res.status(200).json({
      apiKey:      !!apiKey,
      searchIndex: !!index,
      indexSize:   index ? index.length : 0,
      alltoursOffers: Object.keys(ALLTOURS_OFFERS).length,
      lidlOffers: Object.keys(LIDL_OFFERS).length,
      lastminuteActive: ENABLE_LASTMINUTE,
      lastminuteOffers: Object.keys(LASTMINUTE_OFFERS).length,
    });
  }

  // --- Hotel-Anzahl pro Land (für Story-Grid Kartenbadges) ---
  // GET /api/giata?action=counts
  if (action === 'counts') {
    const index = loadSearchIndex();
    if (!index) return res.status(200).json({ counts: {} });
    const counts = {};
    index.forEach(h => { if (h.cc) counts[h.cc] = (counts[h.cc] || 0) + 1; });
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).json({ counts });
  }

  // --- Min-Preise pro Land/Stadt (für Story-Grid Preisbadges) ---
  // GET /api/giata?action=price-mins
  if (action === 'price-mins') {
    const byCountry = {};
    const byCity = {};

    const seen = new Set();

    getAffiliateOfferHotels().forEach(function(hotel) {
      const gid = String(hotel.giataId || '');
      if (!gid || seen.has(gid)) return;
      seen.add(gid);

      const best = hotel && hotel.bestOffer ? hotel.bestOffer : null;
      if (!best || !Number.isFinite(best.price) || best.price <= 0) return;

      const country = String(hotel.giataCountry || '').trim();
      const city = String(hotel.giataCity || '').trim();
      const price = Number(best.price);

      if (country && (!byCountry[country] || price < byCountry[country])) {
        byCountry[country] = price;
      }
      if (city && (!byCity[city] || price < byCity[city])) {
        byCity[city] = price;
      }
    });

    res.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600'); // 6h
    return res.status(200).json({ byCountry, byCity });
  }

  // Demo-Modus wenn kein API-Key gesetzt
  if (!apiKey) {
    if (action === 'search' && q) {
      const ql = q.toLowerCase();
      const results = DEMO_HOTELS
        .filter(h => h.name.toLowerCase().includes(ql) || h.city.toLowerCase().includes(ql))
        .map(({ giataId, name, city, country, stars }) => ({ giataId, name, city, country, stars }));
      return res.status(200).json({ results, demo: true });
    }
    if (action === 'property' && id) {
      const hotel = DEMO_HOTELS.find(h => h.giataId === id);
      return res.status(200).json(hotel || { error: 'Not found' });
    }
    return res.status(200).json({ error: 'API key not configured', demo: true });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
  };

  try {
    // --- Property Details ---
    if (action === 'property' && id) {
      const resp = await fetch(`${GIATA_BASE}/properties/${id}`, { headers });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        throw new Error(`Giata ${resp.status}: ${body.slice(0, 200)}`);
      }
      const data = await resp.json();
      return res.status(200).json(mapProperty(data));
    }

    // --- Detail: vollständige Daten für die Detailseite ---
    if (action === 'detail' && id) {
      const resp = await fetch(`${GIATA_BASE}/properties/${id}`, { headers });
      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        throw new Error(`Giata ${resp.status}: ${body.slice(0, 200)}`);
      }
      const data = await resp.json();
      return res.status(200).json(mapPropertyFull(data));
    }

    // --- Raw (debug): volle Giata-Antwort ohne Mapping ---
    if (action === 'raw' && id) {
      const resp = await fetch(`${GIATA_BASE}/properties/${id}`, { headers });
      if (!resp.ok) throw new Error(`Giata ${resp.status}`);
      const data = await resp.json();
      return res.status(200).json(data);
    }

    // --- Top N Hotels (für Carousel) ---
    // GET /api/giata?action=top&country=GR&limit=8&city=Antalya&category=family|luxury
    // country ist optional: ohne country → globaler Mix aus allen Ländern
    if (action === 'top') {
      const cc       = (req.query.country  || '').toUpperCase().trim();
      const limit    = Math.min(parseInt(req.query.limit, 10) || 8, 20);
      const city     = (req.query.city     || '').trim().toLowerCase();
      const category = (req.query.category || '').trim().toLowerCase(); // 'family' | 'luxury' | ''

      const index = loadSearchIndex();
      if (!index) {
        return res.status(200).json({ hotels: [], indexMissing: true });
      }

      // Filter by country code — wenn leer: globaler Mix aus allen Ländern
      let candidates = cc ? index.filter(h => h.cc === cc) : [...index];

      // Optional city filter — 'cities' (kommagetrennt) überschreibt 'city'
      const citiesList = (req.query.cities || '').trim().toLowerCase().split(',').map(c => c.trim()).filter(Boolean);
      if (citiesList.length) {
        candidates = candidates.filter(h => {
          const hc = (h.city || '').toLowerCase();
          const he = (h.cityEn || '').toLowerCase();
          return citiesList.some(c => hc.includes(c) || he.includes(c));
        });
      } else if (city) {
        candidates = candidates.filter(h =>
          (h.city || '').toLowerCase().includes(city) ||
          (h.cityEn || '').toLowerCase().includes(city)
        );
      }

      // ── Basis-Scoring: Single Source of Truth → /components/jb-score.js ────────
      candidates.forEach(h => { h._score = JBScore.calcScore(h); });

      // ── Kategorie-spezifisches Scoring & Filtering ────────────────────────────

      if (category === 'family') {
        // Familien-Scoring: Kinder- & Animations-Features werden stark gewichtet
        const FAM = {945:24,946:20,1:18,7:16,707:14,4:12,26:12,389:8,56:6,57:6,2:10,3:6,588:10,86:8,89:6,50:4,58:4};
        const FAM_REQUIRE = new Set([945,946,1,7,707,4,26,389,56,57]);
        // Nur Hotels mit mindestens einem Familien-Feature
        candidates = candidates.filter(h => {
          const ids = new Set((h.factIds||[]).map(Number));
          return [...FAM_REQUIRE].some(id => ids.has(id));
        });
        // Familien-Score berechnen
        candidates.forEach(h => {
          const ids = new Set((h.factIds||[]).map(Number));
          let fam = 0;
          for(const [id, pts] of Object.entries(FAM)) if(ids.has(Number(id))) fam += pts;
          h._catScore = fam + h._score * 0.4; // 40% Basisgewicht + Familien-Boost
        });
        candidates.sort((a,b) => b._catScore - a._catScore);

      } else if (category === 'luxury') {
        // Luxury-Scoring: 5★, Spa, Pool-Suiten, Strand, Adults-Only
        const LUX = {614:24,697:22,696:22,197:20,479:18,822:18,89:14,529:14,192:12,195:12,86:10,393:10,781:10,94:8,385:8,199:8,869:6,660:6,196:6,92:6};
        // Nur 4★+ Hotels
        candidates = candidates.filter(h => (h.stars||0) >= 4);
        // Luxury-Score berechnen
        candidates.forEach(h => {
          const st = h.stars||0;
          const ids = new Set((h.factIds||[]).map(Number));
          let lux = (st>=5?30:st>=4?18:0);
          for(const [id, pts] of Object.entries(LUX)) if(ids.has(Number(id))) lux += pts;
          h._catScore = lux + h._score * 0.35;
        });
        candidates.sort((a,b) => b._catScore - a._catScore);

      } else {
        // Standard: Basis-Score
        candidates.sort((a,b) => b._score!==a._score ? b._score-a._score : (b.stars||0)-(a.stars||0));
      }

      const top = candidates.slice(0, limit);

      // Return basic data (id + score) — frontend fetches images separately
      res.setHeader('Cache-Control', 'public, max-age=43200, s-maxage=43200'); // 12h
      return res.status(200).json({
        hotels: top.map(h => ({ giataId: h.giataId, name: h.name, city: h.city, cc: h.cc, country: h.country, stars: h.stars, score: h._score })),
        total: candidates.length,
        category: category || 'default',
      });
    }

    // --- Quiz: Personalisierte Hotel-Empfehlungen ---
    // GET /api/giata?action=quiz&countries=TR,GR&travel=couple&prio=beach&style=luxury&limit=3
    if (action === 'quiz') {
      const ccList = (req.query.countries||'').toUpperCase().split(',').map(s=>s.trim()).filter(Boolean);
      const travel = (req.query.travel||'solo').toLowerCase();
      const prio   = (req.query.prio||'beach').toLowerCase();
      const style  = (req.query.style||'relax').toLowerCase();
      const limit  = Math.min(parseInt(req.query.limit,10)||3, 8);

      const index = loadSearchIndex();
      if (!index) return res.status(200).json({ hotels:[], indexMissing:true });

      let cands = ccList.length ? index.filter(h => ccList.includes(h.cc)) : [...index];

      // Quiz-Scoring weights per answer
      const TW = {
        couple:  {393:25,781:20,385:15,197:12,479:10,614:8,697:6},
        family:  {945:25,946:20,1:18,7:15,707:12,4:10,26:10,389:8,588:8},
        friends: {31:20,49:15,24:12,588:15,86:12,94:10,2:10,3:8},
        solo:    {}
      };
      const PW = {
        beach:    {89:30,301:20,374:15,336:10,698:8,50:4,58:4},
        wellness: {197:30,479:25,529:20,192:15,195:12,822:12,660:8,196:8},
        food:     {94:25,92:20,65:15,299:15,101:12,14:8,450:6,575:6},
        activity: {236:20,240:15,219:15,593:12,249:10,220:8,250:8,209:6}
      };
      const SW = {
        luxury:  {614:20,697:18,197:12,385:12,393:10,529:8},
        active:  {219:20,236:18,593:15,240:12,249:10,220:10,250:8},
        relax:   {197:20,479:18,529:15,192:12,660:10,250:8,201:6},
        culture: {350:20,291:15,90:10,401:8,567:6}
      };

      function qSub(fids, W) {
        if (!W || !Object.keys(W).length) return 50;
        const ids = new Set(fids.map(Number));
        let pts=0, max=0;
        for (const [k,v] of Object.entries(W)) { max+=v; if(ids.has(+k)) pts+=v; }
        return max>0 ? Math.min(pts/max,1)*100 : 50;
      }

      // Simplified JB score for display
      const JB_W = {89:20,301:12,614:18,588:18,697:14,197:12,479:10,94:20,92:16,945:12,219:10,236:10,393:7,385:8};
      function qJb(fids, stars) {
        const ids = new Set(fids.map(Number));
        const st = stars||0;
        let pts = (st>=5?15:st>=4?12:st>=3?8:st>=2?4:1);
        let fac = 0;
        for (const [k,v] of Object.entries(JB_W)) { if(ids.has(+k)) fac+=v; }
        return Math.round(Math.min((pts + Math.min(fac,85))/100*100, 100));
      }

      const tw = TW[travel]||{}, pw = PW[prio]||{}, sw = SW[style]||{};
      cands.forEach(h => {
        const fids = h.factIds||[];
        let t = qSub(fids,tw), p = qSub(fids,pw), s = qSub(fids,sw);
        if (style==='luxury') { const sb=(h.stars||0)>=5?30:(h.stars||0)>=4?15:0; s=Math.min(s+sb,100); }
        h._qRaw = 0.30*t + 0.40*p + 0.30*s;
        h._qJb  = qJb(fids, h.stars);
      });

      cands.sort((a,b) => b._qRaw!==a._qRaw ? b._qRaw-a._qRaw : (b.stars||0)-(a.stars||0));
      const top = cands.slice(0, limit);

      res.setHeader('Cache-Control','public,max-age=1800,s-maxage=1800');
      return res.status(200).json({
        hotels: top.map((h,i) => ({
          giataId:  h.giataId,
          name:     h.name,
          city:     h.city,
          cc:       h.cc,
          country:  h.country,
          stars:    h.stars,
          matchPct: Math.round(65 + h._qRaw*0.35),
          jbScore:  h._qJb,
          factIds:  (h.factIds||[]).slice(0,40),
          rank:     i
        }))
      });
    }

    // --- Suche: Search-Index verwenden wenn vorhanden ---
    if (action === 'search' && q) {
      const index = loadSearchIndex();
      if (index) {
        const ql = q.toLowerCase();
        const results = index
          .filter(h => (h.name + ' ' + h.city + ' ' + h.country).toLowerCase().includes(ql))
          .slice(0, 10)
          .map(({ giataId, name, city, country, stars }) => ({ giataId, name, city, country, stars }));
        return res.status(200).json({ results });
      }
      // Index noch nicht erstellt – Demo-Fallback
      const ql = q.toLowerCase();
      const results = DEMO_HOTELS
        .filter(h => (h.name + ' ' + h.city).toLowerCase().includes(ql))
        .map(({ giataId, name, city, country, stars }) => ({ giataId, name, city, country, stars }));
      return res.status(200).json({ results, indexMissing: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('[giata proxy]', err.message);
    return res.status(500).json({ error: 'Upstream API error', detail: err.message });
  }
};

// Giata API-Antwort → Widget-Format
function mapProperty(d) {
  const name    = (d.names  || []).find(n => n.isDefault)?.value || d.names?.[0]?.value || '';
  const city    = (d.city?.names  || []).find(n => n.locale === 'de')?.value || d.city?.names?.[0]?.value || '';
  const country = (d.country?.names || []).find(n => n.locale === 'de')?.value || d.country?.names?.[0]?.value || '';
  const stars   = Math.round(parseFloat((d.ratings || []).find(r => r.isDefault)?.value || 0));

  // Hauptbild (erstes Bild, 800px)
  const heroImg = (d.images || []).find(i => i.heroImage) || d.images?.[0];
  const image   = heroImg?.sizes?.['800']?.href || heroImg?.sizes?.[800]?.href || '';

  // Galerie: bis zu 30 Bilder à 800px
  const images = (d.images || [])
    .map(img => img.sizes?.['800']?.href || img.sizes?.[800]?.href)
    .filter(Boolean)
    .slice(0, 30);

  // GPS-Koordinaten
  const geo = (d.geoCodes || [])[0];
  const lat = geo ? (geo.latitude  ?? null) : null;
  const lng = geo ? (geo.longitude ?? null) : null;

  // Beschreibungstexte (Deutsch → Englisch als Fallback)
  const sections = d.texts?.de?.sections || d.texts?.en?.sections || [];
  const description = sections
    .filter(s => s.para)
    .slice(0, 4)
    .map(s => ({ title: s.title || '', text: s.para || '' }));

  const facts = d.facts || {};
  const facilities = {};
  try {
    for (const [key, ids] of Object.entries(FACT_IDS)) {
      facilities[key] = ids.some(id => {
        const val = facts[String(id)];
        return val !== undefined && val !== null;
      });
    }
  } catch (e) { /* facts format unknown – skip */ }

  try { facilities.concept = extractConcept(d); } catch (e) {}
  try { facilities.rooms   = extractRoomCount(d); } catch (e) {}

  // Alle vorhandenen Fact-IDs für granulares Frontend-Scoring
  const factIds = Object.keys(d.facts || {}).map(Number).filter(n => !isNaN(n));

  // Google Places Rating (aus statischem Cache)
  const gid = String(d.giataId || d.id || '');
  const gr  = GOOGLE_RATINGS[gid] || {};
  const googleRating  = gr.rating      || null;
  const googleReviews = gr.reviewCount || 0;

  const affiliateOffers = buildAffiliateOffers(gid);
  const affiliateOffer = affiliateOffers[0] || null;

  return {
    giataId: gid,
    name,
    city,
    country,
    stars,
    image,
    images,
    lat,
    lng,
    facilities,
    factIds,
    description,
    bookUrl: affiliateOffer ? affiliateOffer.deeplink : '/',
    affiliateOffer,
    affiliateOffers,
    googleRating,
    googleReviews
  };
}

function parseDateRangeFromDeeplink(deeplink) {
  const url = String(deeplink || '').trim();
  if (!url) return { validFrom: '', validTo: '' };

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
  }

  try {
    const u = new URL(url);
    const dd = String(u.searchParams.get('dd') || '').trim();
    const rd = String(u.searchParams.get('rd') || '').trim();
    return {
      validFrom: isIsoDate(dd) ? dd : '',
      validTo: isIsoDate(rd) ? rd : ''
    };
  } catch (_) {
    const ddMatch = url.match(/[?&]dd=(\d{4}-\d{2}-\d{2})/);
    const rdMatch = url.match(/[?&]rd=(\d{4}-\d{2}-\d{2})/);
    return {
      validFrom: ddMatch ? ddMatch[1] : '',
      validTo: rdMatch ? rdMatch[1] : ''
    };
  }
}

function buildAffiliateOffers(giataId) {
  return getAffiliateProviderEntries(giataId)
    .map(function(item) {
      const entry = item.entry;
      const best = entry.bestOffer;
      const deeplink = best.awDeepLink || best.merchantDeepLink || '';
      if (!deeplink || !Number.isFinite(best.price) || best.price <= 0) return null;
      const awDates = parseDateRangeFromDeeplink(best.awDeepLink || '');
      const merchantDates = parseDateRangeFromDeeplink(best.merchantDeepLink || '');

      return {
        provider: item.provider,
        deeplink,
        merchantProductId: best.merchantProductId || '',
        awProductId: best.awProductId || '',
        price: Number.isFinite(best.price) ? best.price : null,
        currency: best.currency || 'EUR',
        displayPrice: best.displayPrice || '',
        boardBasis: best.boardBasis || '',
        validFrom: best.validFrom || awDates.validFrom || merchantDates.validFrom || '',
        validTo: best.validTo || awDates.validTo || merchantDates.validTo || '',
        offerCount: entry.offerCount || (entry.offers ? entry.offers.length : 1),
        matchType: best.matchType || 'exact',
        matchScore: best.matchScore || null
      };
    })
    .filter(Boolean)
    .sort(function(a, b) {
      const priceA = Number.isFinite(a.price) ? a.price : Number.MAX_SAFE_INTEGER;
      const priceB = Number.isFinite(b.price) ? b.price : Number.MAX_SAFE_INTEGER;
      if (priceA !== priceB) return priceA - priceB;
      return String(a.provider).localeCompare(String(b.provider));
    });
}

function buildAffiliateOffer(giataId) {
  return buildAffiliateOffers(giataId)[0] || null;
}

function getAffiliateOfferHotels() {
  const hotels = Object.values(ALLTOURS_OFFERS || {})
    .concat(Object.values(LIDL_OFFERS || {}));

  if (ENABLE_LASTMINUTE) {
    return hotels.concat(Object.values(LASTMINUTE_OFFERS || {}));
  }

  return hotels;
}

// Vollständige Daten für die Detailseite (alle Bilder, alle Texte, Zimmertypen)
function mapPropertyFull(d) {
  const base = mapProperty(d);

  // Alle Bilder: 1080px bevorzugt, sonst 800px
  const allImages = (d.images || [])
    .map(img => img.sizes?.['1080']?.href || img.sizes?.['800']?.href)
    .filter(Boolean);

  // Alle Beschreibungsabschnitte (keine Begrenzung)
  const sections = d.texts?.de?.sections || d.texts?.en?.sections || [];
  const allSections = sections
    .filter(s => s.para)
    .map(s => ({ title: s.title || '', text: s.para || '' }));

  // Bild-Map für schnellen Lookup (id → sizes)
  const imgMap = {};
  (d.images || []).forEach(img => { if (img && img.id) imgMap[img.id] = img; });

  // ── Per-Zimmer Daten aus facts[].appliesTo ────────────────────────
  const PER_ROOM_LABELS = {
    '124':'Bademantel','168':'Hausschuhe','163':'Safe',
    '663':'Espressomaschine','816':'Badewanne & Dusche',
    '126':'Badewanne','166':'Dusche','552':'Bodengl. Dusche',
    '123':'Balkon','173':'Terrasse','341':'Balkon/Terrasse',
    '120':'Klimaanlage','156':'Minibar','172':'Kaffee/Tee',
    '185':'WiFi','80':'Badetücher','182':'Rollstuhlgerecht',
  };
  const variantSqm = {};
  const variantFeatures = {};
  Object.entries(d.facts || {}).forEach(([fid, entries]) => {
    if (!Array.isArray(entries)) return;
    entries.forEach(entry => {
      const targets = entry.appliesTo;
      if (!targets || !targets.length) return;
      if (fid === '167') {
        const v = entry.attributes?.['44']?.value || entry.attributes?.['64']?.value;
        if (v) targets.forEach(vid => { variantSqm[vid] = parseInt(v, 10) || null; });
      } else if (PER_ROOM_LABELS[fid]) {
        targets.forEach(vid => {
          if (!variantFeatures[vid]) variantFeatures[vid] = [];
          const lbl = PER_ROOM_LABELS[fid];
          if (!variantFeatures[vid].includes(lbl)) variantFeatures[vid].push(lbl);
        });
      }
    });
  });

  // ── Hotel-weite Zimmerausstattung (facts ohne appliesTo) ──────────
  const HOTEL_AMENITY_MAP = [
    [149,'🛏','Kingsize-Bett'],[161,'🛏','Queensize-Bett'],[137,'🛏','Doppelbett'],
    [611,'🛏','Twin-Betten'],[700,'🛏','Einzelbett'],[131,'👶','Kinderbett'],
    [793,'🛏','Bali-Bett'],[816,'🛁','Badewanne & Dusche'],[126,'🛁','Badewanne'],
    [552,'🚿','Bodengl. Dusche'],[166,'🚿','Dusche'],[341,'🌅','Balkon/Terrasse'],
    [123,'🌅','Balkon'],[173,'🌅','Terrasse'],[120,'❄️','Klimaanlage'],
    [185,'📶','WiFi'],[172,'☕','Kaffee/Tee'],[156,'🍾','Minibar'],
    [163,'🔒','Safe'],[124,'🩺','Bademantel'],[80,'🛁','Badetücher'],
    [168,'🩴','Hausschuhe'],[183,'♿','Barrierefrei'],
  ];
  const factsObj = d.facts || {};
  const roomAmenities = HOTEL_AMENITY_MAP
    .filter(([id]) => {
      const entries = factsObj[String(id)];
      if (!entries) return false;
      if (!Array.isArray(entries)) return true;
      return entries.some(e => !e.appliesTo || !e.appliesTo.length);
    })
    .map(([, icon, label]) => ({ icon, label }));

  // Zimmertypen aus roomTypes[]
  const rooms = (d.roomTypes || []).map(rt => ({
    name: rt.name || '',
    type: rt.type || '',
    category: rt.category || '',
    view: rt.view || '',
    sqm: variantSqm[rt.variantId] || null,
    features: variantFeatures[rt.variantId] || [],
    images: (rt.imageRelations || [])
      .map(iid => {
        const img = imgMap[iid];
        if (!img) return '';
        return img.sizes?.['800']?.href || img.sizes?.['320']?.href || '';
      })
      .filter(Boolean),
  }));

  return { ...base, allImages, allSections, rooms, roomAmenities };
}

function extractConcept(d) {
  // Konzept aus Mahlzeiten-Facts ableiten:
  // 96=Frühstück, 100=Abendessen, 105=Mittagessen, 324=Getränke inklusive
  const facts = d.facts || {};
  const has = id => !!facts[String(id)];
  if (has(96) && has(100) && has(105) && has(324)) return 'All Inclusive';
  if (has(96) && has(100) && has(105))              return 'Vollpension';
  if (has(96) && has(100))                          return 'Halbpension';
  if (has(96))                                      return 'Nur Frühstück';
  return null;
}

function extractRoomCount(d) {
  // Fact 316 = "Anzahl der Zimmer (gesamt)", Attribute 49 = numerischer Wert
  const fact316 = (d.facts || {})['316'];
  if (fact316 && fact316[0] && fact316[0].attributes) {
    const attr49 = fact316[0].attributes['49'];
    if (attr49 && attr49.value) {
      const n = parseInt(attr49.value, 10);
      if (!isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

// Search-Index aus dem /api-Verzeichnis laden (wird beim Build generiert)
// Unterstützt altes Array-Format und neues { _generatedAt, hotels } Format
function loadSearchIndex() {
  try {
    const indexPath = path.join(__dirname, 'giata-search-index.json');
    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    // Neues Format: { _generatedAt: '...', hotels: [...] }
    if (parsed && parsed.hotels && Array.isArray(parsed.hotels)) return parsed.hotels;
    // Altes Format: direkt ein Array
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch (e) {
    return null;
  }
}
