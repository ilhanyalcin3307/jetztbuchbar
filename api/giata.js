// Vercel Serverless Function – Giata Drive API Proxy
// API-Key: Vercel-Umgebungsvariable GIATA_API_KEY
// Docs: https://giatadrive.com/specs

const GIATA_BASE = 'https://giatadrive.com/api/v1';
const fs   = require('fs');
const path = require('path');

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
    });
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

    // --- Top N Hotels für ein Land (für Carousel) ---
    // GET /api/giata?action=top&country=GR&limit=8&city=Antalya (city optional)
    if (action === 'top') {
      const cc    = (req.query.country || '').toUpperCase().trim();
      const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);
      const city  = (req.query.city || '').trim().toLowerCase();

      if (!cc) return res.status(400).json({ error: 'country param required' });

      const index = loadSearchIndex();
      if (!index) {
        return res.status(200).json({ hotels: [], indexMissing: true });
      }

      // Filter by country code
      let candidates = index.filter(h => h.cc === cc);

      // Optional city filter (fuzzy)
      if (city) {
        candidates = candidates.filter(h =>
          (h.city || '').toLowerCase().includes(city) ||
          (h.cityEn || '').toLowerCase().includes(city)
        );
      }

      // Inline-Scoring (same weights as hotel-ranking.js)
      const SCORING_TOP = {
        89:20,301:12,374:7,90:8,91:5,291:5,295:6,562:5,350:5,294:4,691:4,354:4,364:4,349:3,293:3,300:3,365:3,348:2,22:1,568:1,
        614:18,588:18,697:14,696:14,86:12,197:12,479:10,822:10,529:6,192:8,195:8,199:6,869:6,196:6,660:6,43:6,698:6,189:5,794:5,201:5,58:5,50:5,190:4,793:4,59:4,198:4,336:4,191:3,187:3,909:3,664:3,74:3,76:3,66:3,567:3,820:2,71:2,81:2,88:1,185:1,
        94:20,92:16,101:12,103:8,65:5,299:5,14:3,288:3,450:3,575:3,20:2,73:2,439:1,
        945:12,219:10,236:10,946:8,1:8,7:8,393:7,593:7,707:6,220:6,4:5,26:5,240:5,249:5,247:5,2:5,389:4,781:4,385:4,245:4,250:3,209:3,401:3,3:3,31:3,56:2,57:2,244:2,211:2,49:2,24:2,5:1,6:1
      };
      const CAT_SCORE_TOP = {L:[89,301,374,90,91,291,295,562,350,294,691,354,364,349,293,300,365,348,22,568],P:[614,588,697,696,86,197,479,822,529,192,195,199,869,196,660,43,698,189,794,201,58,50,190,793,59,198,336,191,187,909,664,74,76,66,567,820,71,81,88,185],F:[94,92,101,103,65,299,14,288,450,575,20,73,439],A:[945,219,236,946,1,7,393,593,707,220,4,26,240,249,247,2,389,781,385,245,250,209,401,3,31,56,57,244,211,49,24,5,6]};
      const CAP = {L:35,P:35,F:20,A:15};

      candidates.forEach(h => {
        const st = h.stars || 0;
        const starPts = st>=5?15:st>=4?12:st>=3?8:st>=2?4:st>=1?1:0;
        const ids = new Set((h.factIds||[]).map(Number));
        const cats = {L:0,P:0,F:0,A:0};
        for(const [cat, catIds] of Object.entries(CAT_SCORE_TOP)){
          for(const id of catIds){
            if(ids.has(id)) cats[cat] = (cats[cat]||0) + (SCORING_TOP[id]||0);
          }
        }
        h._score = Math.round((starPts + Math.min(cats.L,CAP.L) + Math.min(cats.P,CAP.P) + Math.min(cats.F,CAP.F) + Math.min(cats.A,CAP.A)) / 120 * 100);
      });

      candidates.sort((a,b) => b._score!==a._score ? b._score-a._score : (b.stars||0)-(a.stars||0));
      const top = candidates.slice(0, limit);

      // Return basic data (id + score) — frontend fetches images separately
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).json({
        hotels: top.map(h => ({ giataId: h.giataId, name: h.name, city: h.city, country: h.country, stars: h.stars, score: h._score })),
        total: candidates.length,
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

  // Galerie: bis zu 8 Bilder à 800px
  const images = (d.images || [])
    .map(img => img.sizes?.['800']?.href || img.sizes?.[800]?.href)
    .filter(Boolean)
    .slice(0, 8);

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

  return { giataId: String(d.giataId || d.id || ''), name, city, country, stars, image, images, lat, lng, facilities, factIds, description, bookUrl: '/' };
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

  // Zimmertypen aus roomTypes[]
  const rooms = (d.roomTypes || []).map(rt => ({
    name: rt.name || '',
    type: rt.type || '',
    category: rt.category || '',
    view: rt.view || '',
  }));

  return { ...base, allImages, allSections, rooms };
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
function loadSearchIndex() {
  try {
    const indexPath = path.join(__dirname, 'giata-search-index.json');
    return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (e) {
    return null;
  }
}
