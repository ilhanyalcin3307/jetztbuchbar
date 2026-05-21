#!/usr/bin/env node
/**
 * patch-hotel-ranking.js
 * Liest api/giata-search-index.json (gebaut von build-giata-index.js),
 * berechnet für jede Länder-/Stadtseite die Top-5-Hotels per Score
 * und aktualisiert das data-hotel-ranking-Attribut in den HTML-Dateien.
 *
 * Wird nach build-giata-index.js im Build-Prozess ausgeführt.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..');
const INDEX_FILE = path.join(ROOT, 'api', 'giata-search-index.json');

// ── Scoring-Tabelle (identisch mit components/hotel-ranking.js) ──────────────
// Kategorien: L=Lage(max35) P=Pool/Wellness(max35) F=Verpflegung(max20) A=Familie/Aktivitäten(max15) Stars(max15) → Gesamt max ~120
const SCORING = {
  // LAGE (L) – max 35
  89:{s:20,cat:'L'}, 301:{s:12,cat:'L'}, 374:{s:7,cat:'L'},
  90:{s:8,cat:'L'}, 91:{s:5,cat:'L'}, 291:{s:5,cat:'L'},
  295:{s:6,cat:'L'}, 562:{s:5,cat:'L'}, 350:{s:5,cat:'L'},
  294:{s:4,cat:'L'}, 691:{s:4,cat:'L'},
  354:{s:4,cat:'L'}, 364:{s:4,cat:'L'},
  349:{s:3,cat:'L'}, 293:{s:3,cat:'L'}, 300:{s:3,cat:'L'},
  365:{s:3,cat:'L'}, 348:{s:2,cat:'L'},
  22:{s:1,cat:'L'}, 568:{s:1,cat:'L'},
  // POOL & WELLNESS (P) – max 35
  614:{s:18,cat:'P'}, 588:{s:18,cat:'P'}, 697:{s:14,cat:'P'},
  696:{s:14,cat:'P'}, 86:{s:12,cat:'P'}, 197:{s:12,cat:'P'},
  479:{s:10,cat:'P'}, 822:{s:10,cat:'P'},
  529:{s:6,cat:'P'}, 192:{s:8,cat:'P'}, 195:{s:8,cat:'P'},
  199:{s:6,cat:'P'}, 869:{s:6,cat:'P'},
  196:{s:6,cat:'P'}, 660:{s:6,cat:'P'}, 43:{s:6,cat:'P'}, 698:{s:6,cat:'P'},
  189:{s:5,cat:'P'}, 794:{s:5,cat:'P'}, 201:{s:5,cat:'P'}, 58:{s:5,cat:'P'}, 50:{s:5,cat:'P'},
  190:{s:4,cat:'P'}, 793:{s:4,cat:'P'}, 59:{s:4,cat:'P'}, 198:{s:4,cat:'P'}, 336:{s:4,cat:'P'},
  191:{s:3,cat:'P'}, 187:{s:3,cat:'P'}, 909:{s:3,cat:'P'}, 664:{s:3,cat:'P'},
  74:{s:3,cat:'P'}, 76:{s:3,cat:'P'}, 66:{s:3,cat:'P'}, 567:{s:3,cat:'P'},
  820:{s:2,cat:'P'}, 71:{s:2,cat:'P'}, 81:{s:2,cat:'P'},
  88:{s:1,cat:'P'}, 185:{s:1,cat:'P'},
  // VERPFLEGUNG (F) – max 20
  94:{s:20,cat:'F'}, 92:{s:16,cat:'F'}, 101:{s:12,cat:'F'}, 103:{s:8,cat:'F'},
  65:{s:5,cat:'F'}, 299:{s:5,cat:'F'}, 14:{s:3,cat:'F'}, 288:{s:3,cat:'F'},
  450:{s:3,cat:'F'}, 575:{s:3,cat:'F'}, 20:{s:2,cat:'F'}, 73:{s:2,cat:'F'}, 439:{s:1,cat:'F'},
  // FAMILIE & AKTIVITÄTEN (A) – max 15
  945:{s:12,cat:'A'}, 219:{s:10,cat:'A'}, 236:{s:10,cat:'A'}, 946:{s:8,cat:'A'},
  1:{s:8,cat:'A'}, 7:{s:8,cat:'A'}, 393:{s:7,cat:'A'}, 593:{s:7,cat:'A'},
  707:{s:6,cat:'A'}, 220:{s:6,cat:'A'}, 4:{s:5,cat:'A'}, 26:{s:5,cat:'A'},
  240:{s:5,cat:'A'}, 249:{s:5,cat:'A'}, 247:{s:5,cat:'A'}, 2:{s:5,cat:'A'},
  389:{s:4,cat:'A'}, 781:{s:4,cat:'A'}, 385:{s:4,cat:'A'}, 245:{s:4,cat:'A'},
  250:{s:3,cat:'A'}, 209:{s:3,cat:'A'}, 401:{s:3,cat:'A'}, 3:{s:3,cat:'A'},
  31:{s:3,cat:'A'}, 56:{s:2,cat:'A'}, 57:{s:2,cat:'A'}, 244:{s:2,cat:'A'},
  211:{s:2,cat:'A'}, 49:{s:2,cat:'A'}, 24:{s:2,cat:'A'}, 5:{s:1,cat:'A'}, 6:{s:1,cat:'A'}
};

// Kategorien-Caps: L≤35, P≤35, F≤20, A≤15, Stars≤15 → max ~120
const CAT_CAP = { L: 35, P: 35, F: 20, A: 15 };

function calcScore(h) {
  var st = h.stars || 0;
  var stars = st >= 5 ? 15 : st >= 4 ? 12 : st >= 3 ? 8 : st >= 2 ? 4 : st >= 1 ? 1 : 0;
  var cats = { L: 0, P: 0, F: 0, A: 0 };
  var idSet = {};
  (h.factIds || []).forEach(function(id) { idSet[String(id)] = true; });
  for (var id in SCORING) {
    if (idSet[id]) {
      var e = SCORING[id];
      cats[e.cat] = (cats[e.cat] || 0) + e.s;
    }
  }
  var raw = stars
    + Math.min(cats.L, CAT_CAP.L)
    + Math.min(cats.P, CAT_CAP.P)
    + Math.min(cats.F, CAT_CAP.F)
    + Math.min(cats.A, CAT_CAP.A);
  return Math.round(raw / 120 * 100);
}

// Normalisierung für unscharfen Stadtnamens-Vergleich
function norm(s) {
  return (s || '').toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/[^a-z0-9]/g, '');
}

function cityMatches(hotelCity, hotelCityEn, targets) {
  if (!targets || !targets.length) return true; // kein Filter = alle Städte
  var nc  = norm(hotelCity);
  var nce = norm(hotelCityEn || '');
  return targets.some(function(t) {
    var nt = norm(t);
    return nc === nt || nce === nt || nc.includes(nt) || nt.includes(nc) || nce.includes(nt) || nt.includes(nce);
  });
}

// ── Seiten-Mapping: HTML-Datei → { cc, cities[] } ────────────────────────────
// cc       = GIATA-Ländercode (muss in COUNTRIES von build-giata-index.js stehen)
// cities   = mögliche GIATA-Stadtbezeichnungen (null = alle Städte des Landes)
const PAGE_MAP = [
  // Länderhaupt-Seiten
  { file: 'tuerkei/index.html',           cc: 'TR', cities: null },
  { file: 'griechenland/index.html',      cc: 'GR', cities: null },
  { file: 'spanien/index.html',           cc: 'ES', cities: null },
  { file: 'aegypten/index.html',          cc: 'EG', cities: null },
  { file: 'portugal/index.html',          cc: 'PT', cities: null },
  { file: 'kroatien/index.html',          cc: 'HR', cities: null },
  { file: 'italien/index.html',           cc: 'IT', cities: null },
  { file: 'frankreich/index.html',        cc: 'FR', cities: null },
  { file: 'marokko/index.html',           cc: 'MA', cities: null },
  { file: 'malta/index.html',             cc: 'MT', cities: null },
  { file: 'tunesien/index.html',          cc: 'TN', cities: null },
  { file: 'bulgarien/index.html',         cc: 'BG', cities: null },
  { file: 'zypern/index.html',            cc: 'CY', cities: null },
  { file: 'jordanien/index.html',         cc: 'JO', cities: null },
  { file: 'dubai/index.html',             cc: 'AE', cities: null },

  // Türkei – Städte
  { file: 'tuerkei/istanbul/index.html',        cc: 'TR', cities: ['Istanbul', 'İstanbul'] },
  { file: 'tuerkei/antalya/index.html',         cc: 'TR', cities: ['Antalya'] },
  { file: 'tuerkei/hotels-antalya/index.html',  cc: 'TR', cities: ['Antalya'] },
  { file: 'tuerkei/bodrum/index.html',          cc: 'TR', cities: ['Bodrum'] },
  { file: 'tuerkei/fethiye/index.html',         cc: 'TR', cities: ['Fethiye'] },
  { file: 'tuerkei/marmaris/index.html',        cc: 'TR', cities: ['Marmaris'] },
  { file: 'tuerkei/alanya/index.html',          cc: 'TR', cities: ['Alanya'] },
  { file: 'tuerkei/izmir/index.html',           cc: 'TR', cities: ['Izmir', 'İzmir'] },
  { file: 'tuerkei/kusadasi/index.html',        cc: 'TR', cities: ['Kusadasi', 'Kuşadası'] },
  { file: 'tuerkei/side/index.html',            cc: 'TR', cities: ['Side', 'Manavgat'] },
  { file: 'tuerkei/cesme/index.html',           cc: 'TR', cities: ['Cesme', 'Çeşme'] },
  { file: 'tuerkei/pamukkale/index.html',       cc: 'TR', cities: ['Pamukkale', 'Denizli'] },
  { file: 'tuerkei/kappadokien/index.html',     cc: 'TR', cities: ['Nevsehir', 'Nevşehir', 'Göreme', 'Goreme', 'Urgup', 'Ürgüp', 'Cappadocia'] },

  // Griechenland – Inseln / Städte
  { file: 'griechenland/kreta/index.html',          cc: 'GR', cities: ['Heraklion', 'Chania', 'Rethymno', 'Crete', 'Kreta', 'Iraklion', 'Agios Nikolaos'] },
  { file: 'griechenland/hotels-kreta/index.html',   cc: 'GR', cities: ['Heraklion', 'Chania', 'Rethymno', 'Crete', 'Kreta', 'Iraklion', 'Agios Nikolaos'] },
  { file: 'griechenland/rhodos/index.html',         cc: 'GR', cities: ['Rhodes', 'Rhodos', 'Lindos'] },
  { file: 'griechenland/mykonos/index.html',        cc: 'GR', cities: ['Mykonos'] },
  { file: 'griechenland/santorini/index.html',      cc: 'GR', cities: ['Santorini', 'Thera', 'Thira', 'Fira', 'Oia'] },
  { file: 'griechenland/korfu/index.html',          cc: 'GR', cities: ['Corfu', 'Kerkyra', 'Korfu'] },
  { file: 'griechenland/zakynthos/index.html',      cc: 'GR', cities: ['Zakynthos', 'Zante', 'Zakinthos'] },

  // Spanien – Städte / Regionen
  { file: 'spanien/barcelona/index.html',       cc: 'ES', cities: ['Barcelona'] },
  { file: 'spanien/ibiza/index.html',           cc: 'ES', cities: ['Ibiza', 'Eivissa'] },
  { file: 'spanien/mallorca/index.html',        cc: 'ES', cities: ['Palma', 'Mallorca', 'Palma de Mallorca', 'Alcudia', 'Cala d\'Or'] },
  { file: 'spanien/hotels-mallorca/index.html', cc: 'ES', cities: ['Palma', 'Mallorca', 'Palma de Mallorca', 'Alcudia'] },
  { file: 'spanien/teneriffa/index.html',       cc: 'ES', cities: ['Tenerife', 'Teneriffa', 'Santa Cruz de Tenerife', 'Adeje', 'Los Cristianos'] },
  { file: 'spanien/costa-brava/index.html',     cc: 'ES', cities: ['Girona', 'Lloret de Mar', 'Platja d\'Aro', 'Blanes', 'Tossa de Mar'] },

  // Portugal – Städte / Regionen
  { file: 'portugal/algarve/index.html',         cc: 'PT', cities: ['Albufeira', 'Faro', 'Portimao', 'Portimão', 'Lagos', 'Vilamoura', 'Tavira', 'Armacao de Pera'] },
  { file: 'portugal/hotels-lissabon/index.html', cc: 'PT', cities: ['Lisbon', 'Lisboa', 'Lissabon'] },
  { file: 'portugal/porto/index.html',           cc: 'PT', cities: ['Porto', 'Oporto', 'Vila Nova de Gaia'] },
  { file: 'portugal/madeira/index.html',         cc: 'PT', cities: ['Funchal', 'Madeira'] },

  // Italien – Städte / Regionen
  { file: 'italien/rom/index.html',          cc: 'IT', cities: ['Rome', 'Roma', 'Rom'] },
  { file: 'italien/venedig/index.html',      cc: 'IT', cities: ['Venice', 'Venezia', 'Venedig', 'Mestre'] },
  { file: 'italien/florenz/index.html',      cc: 'IT', cities: ['Florence', 'Firenze', 'Florenz'] },
  { file: 'italien/sizilien/index.html',     cc: 'IT', cities: ['Palermo', 'Catania', 'Taormina', 'Siracusa', 'Agrigento', 'Trapani', 'Messina'] },
  { file: 'italien/amalfikueste/index.html', cc: 'IT', cities: ['Amalfi', 'Positano', 'Ravello', 'Salerno', 'Sorrento', 'Praiano'] },

  // Dubai – Stadtseiten
  { file: 'dubai/hotels-dubai/index.html',   cc: 'AE', cities: ['Dubai'] },
  { file: 'dubai/wuestensafari/index.html',  cc: 'AE', cities: null },
];

// ── Hauptprogramm ─────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.log('INFO: giata-search-index.json nicht gefunden – Patch übersprungen.');
    console.log('      (Wird bei nächstem Vercel-Build mit API-Key automatisch erstellt.)');
    return;
  }

  var index;
  try {
    index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch(e) {
    console.error('ERROR: Index konnte nicht gelesen werden:', e.message);
    return;
  }

  var hasFacts = index.length > 0 && Array.isArray(index[0].factIds) && index[0].factIds.length > 0;
  var hasCC    = index.length > 0 && index[0].cc;
  console.log('Index: ' + index.length + ' Hotels | factIds: ' + hasFacts + ' | cc: ' + hasCC);

  if (!hasCC) {
    console.log('WARN: Index hat keine cc-Felder – Patch übersprungen. Bitte build-giata-index.js neu ausführen.');
    return;
  }

  var patched = 0, skipped = 0, noMatch = 0;

  for (var i = 0; i < PAGE_MAP.length; i++) {
    var entry   = PAGE_MAP[i];
    var htmlFile = path.join(ROOT, entry.file);

    if (!fs.existsSync(htmlFile)) {
      skipped++;
      continue;
    }

    // Hotels für diese Seite filtern
    var candidates = index.filter(function(h) {
      if (h.cc !== entry.cc) return false;
      return cityMatches(h.city, h.cityEn, entry.cities);
    });

    if (candidates.length === 0) {
      noMatch++;
      console.log('  NOMATCH: ' + entry.file + ' (cc=' + entry.cc + ', cities=' + (entry.cities ? entry.cities.join('|') : 'ALL') + ')');
      continue;
    }

    // Scoring + Sortierung
    candidates.forEach(function(h) { h._score = calcScore(h); });
    candidates.sort(function(a, b) {
      if (b._score !== a._score) return b._score - a._score;
      return (b.stars || 0) - (a.stars || 0);
    });

    // Top 5 IDs
    var top5 = candidates.slice(0, 5).map(function(h) { return h.giataId; });

    // HTML patchen
    var html = fs.readFileSync(htmlFile, 'utf8');
    if (!html.includes('data-hotel-ranking=')) {
      skipped++;
      continue;
    }

    var newHtml = html.replace(/data-hotel-ranking="[^"]*"/, 'data-hotel-ranking="' + top5.join(',') + '"');

    if (newHtml !== html) {
      fs.writeFileSync(htmlFile, newHtml, 'utf8');
      var top1 = candidates[0];
      console.log('  PATCHED: ' + entry.file +
        ' ← ' + candidates.length + ' Kandidaten | #1: ' + top1.name + ' (' + (top1.stars || '?') + '★, ' + top1._score + ' Pkt.)');
      patched++;
    } else {
      skipped++;
    }
  }

  console.log('\nFertig: ' + patched + ' gepatcht | ' + skipped + ' unverändert | ' + noMatch + ' keine Kandidaten.');
}

main();
