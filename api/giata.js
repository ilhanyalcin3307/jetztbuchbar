// Vercel Serverless Function – Giata Drive API Proxy
// API-Key: Vercel-Umgebungsvariable GIATA_API_KEY
// Docs: https://giatadrive.com/specs

const GIATA_BASE = 'https://giatadrive.com/api/v1';
const fs   = require('fs');
const path = require('path');

// Giata Fact-IDs für relevante Einrichtungen
// Genaue IDs via https://giatadrive.com/api/v1/i18n/facts/de prüfen
const FACT_IDS = {
  pool:       [60, 61, 180],
  spa:        [22, 23, 178],
  beach:      [45, 46],
  aquapark:   [62, 179],
  fitness:    [26, 27],
  restaurant: [15, 16],
  bar:        [17, 18],
  kidsclub:   [90, 91],
  wifi:       [7, 8],
  parking:    [10, 11],
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
  const heroImg = (d.images || []).find(i => i.heroImage) || d.images?.[0];
  const image   = heroImg?.sizes?.[800]?.href || heroImg?.sizes?.[400]?.href || '';
  const facts   = d.facts || {};

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

  return { giataId: String(d.giataId || d.id || ''), name, city, country, stars, image, facilities, bookUrl: '/' };
}

function extractConcept(d) {
  const sections = d.texts?.de?.sections || d.texts?.en?.sections || [];
  for (const s of sections) {
    const t = (s.title || '').toLowerCase();
    if (t.includes('verpflegung') || t.includes('konzept') || t.includes('board')) {
      return s.para?.split(/[.\n]/)[0]?.trim() || null;
    }
  }
  return null;
}

function extractRoomCount(d) {
  for (const instances of Object.values(d.facts || {})) {
    const arr = Array.isArray(instances) ? instances : (instances ? [instances] : []);
    for (const inst of arr) {
      for (const attr of (inst.attributes || [])) {
        const v = parseInt(attr.value, 10);
        if (!isNaN(v) && v >= 20 && v <= 5000) return v;
      }
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
