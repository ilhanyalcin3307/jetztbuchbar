/**
 * jb-score.js — JetztBuchbar JB-Score Engine (Single Source of Truth)
 * v2.0: Aquapark A-boost · Uçuş süresi bonus · Reisewarnung penalty
 *
 * Exposes: window.JBScore
 * Usage:   <script src="/components/jb-score.js"></script>
 *
 * calcScore(h, opts)          → number 0-100  (sync, includes flight bonus)
 * fetchWarningPenalty(country) → Promise<number>  (async, cached 1 session)
 * topFeatures(h, n)           → [{id, s, cat, l}]
 * scoreLabel(score)           → {text, color}
 */
(function (global) {
  'use strict';

  // ── Scoring table ─────────────────────────────────────────────────────────
  // Categories: L=Lage, P=Pool/Wellness, F=Verpflegung, A=Familie/Aktivitäten
  var SCORING = {
    // LAGE (L) – cap 35
    89:{s:20,cat:'L',l:'Strandlage'}, 301:{s:12,cat:'L',l:'Meeresnähe'}, 374:{s:7,cat:'L',l:'Strandblick'},
    90:{s:8,cat:'L',l:'Zentrale Lage'}, 91:{s:5,cat:'L',l:'Ruhige Lage'}, 291:{s:5,cat:'L',l:'Stadtzentrum'},
    295:{s:6,cat:'L',l:'Seelage'}, 562:{s:5,cat:'L',l:'Jachthafen'}, 350:{s:5,cat:'L',l:'Altstadt'},
    294:{s:4,cat:'L',l:'Golfplatznähe'}, 691:{s:4,cat:'L',l:'Kurort'},
    354:{s:4,cat:'L',l:'Buchtblick'}, 364:{s:4,cat:'L',l:'Seeblick'},
    349:{s:3,cat:'L',l:'Autofreie Lage'}, 293:{s:3,cat:'L',l:'Waldlage'}, 300:{s:3,cat:'L',l:'Flusslage'},
    365:{s:3,cat:'L',l:'Bergblick'}, 348:{s:2,cat:'L',l:'Belebte Lage'},
    22:{s:1,cat:'L',l:'Parkplatz'}, 568:{s:1,cat:'L',l:'Einparkservice'},
    // POOL & WELLNESS (P) – cap 35
    614:{s:18,cat:'P',l:'Privater Pool'}, 588:{s:18,cat:'P',l:'Wasserpark'}, 697:{s:14,cat:'P',l:'Infinity-Pool'},
    696:{s:14,cat:'P',l:'Rooftop-Pool'}, 86:{s:12,cat:'P',l:'Wasserrutsche'}, 197:{s:12,cat:'P',l:'Spa'},
    479:{s:10,cat:'P',l:'Wellness-Center'}, 822:{s:10,cat:'P',l:'Thermalbecken'},
    529:{s:6,cat:'P',l:'Privater Wellnessbereich'}, 192:{s:8,cat:'P',l:'Hamam'}, 195:{s:8,cat:'P',l:'Massage'},
    199:{s:6,cat:'P',l:'Thalasso'}, 869:{s:6,cat:'P',l:'Tauchbecken'},
    196:{s:6,cat:'P',l:'Sauna'}, 660:{s:6,cat:'P',l:'Sauna'}, 43:{s:6,cat:'P',l:'Hallenbad'},
    698:{s:6,cat:'P',l:'Swim-up Bar'}, 189:{s:5,cat:'P',l:'Ayurveda'},
    794:{s:5,cat:'P',l:'Wasserspielbereich'}, 201:{s:5,cat:'P',l:'Whirlpool'},
    58:{s:5,cat:'P',l:'Pool'}, 50:{s:5,cat:'P',l:'Außenpool'},
    190:{s:4,cat:'P',l:'Beautyfarm'}, 793:{s:4,cat:'P',l:'Bali Bett'},
    59:{s:4,cat:'P',l:'Poolbar'}, 198:{s:4,cat:'P',l:'Dampfbad'}, 336:{s:4,cat:'P',l:'Strandbar'},
    191:{s:3,cat:'P',l:'Schönheitssalon'}, 187:{s:3,cat:'P',l:'Akupunktur'},
    909:{s:3,cat:'P',l:'Ruheraum'}, 664:{s:3,cat:'P',l:'Personal Trainer'},
    74:{s:3,cat:'P',l:'Solarium'}, 76:{s:3,cat:'P',l:'Sonnenterrasse'},
    66:{s:3,cat:'P',l:'Zimmerservice'}, 567:{s:3,cat:'P',l:'Concierge'},
    820:{s:2,cat:'P',l:'Gesichtsbehandlung'},
    71:{s:2,cat:'P',l:'Shuttleservice'}, 81:{s:2,cat:'P',l:'Transferservice'},
    88:{s:1,cat:'P',l:'WLAN'}, 185:{s:1,cat:'P',l:'WLAN'},
    // VERPFLEGUNG (F) – cap 20
    94:{s:20,cat:'F',l:'All Inclusive Plus'}, 92:{s:16,cat:'F',l:'All Inclusive'},
    101:{s:12,cat:'F',l:'Vollpension'}, 103:{s:8,cat:'F',l:'Halbpension'},
    65:{s:5,cat:'F',l:'Restaurant'}, 299:{s:5,cat:'F',l:'Restaurant'},
    14:{s:3,cat:'F',l:'Bar'}, 288:{s:3,cat:'F',l:'Bar/Pub'}, 450:{s:3,cat:'F',l:'Lobbybar'},
    575:{s:3,cat:'F',l:'Bar/Lounge'}, 20:{s:2,cat:'F',l:'Café'}, 73:{s:2,cat:'F',l:'Snackbar'},
    439:{s:1,cat:'F',l:'Strandkorb'},
    // FAMILIE & AKTIVITÄTEN (A) – cap 20 (vorher 15; erhöht für Aquapark-Dual-Boost)
    945:{s:12,cat:'A',l:'Kids Club'}, 219:{s:10,cat:'A',l:'Golf'}, 236:{s:10,cat:'A',l:'Tauchen'},
    946:{s:8,cat:'A',l:'Teens Club'}, 1:{s:8,cat:'A',l:'Kinderbetreuung'}, 7:{s:8,cat:'A',l:'Miniclub'},
    393:{s:7,cat:'A',l:'Für Flitterwochen'}, 593:{s:7,cat:'A',l:'Tennisplatz'},
    707:{s:6,cat:'A',l:'Kinder kostenlos'}, 220:{s:6,cat:'A',l:'Fitness-Studio'},
    4:{s:5,cat:'A',l:'Kinderprogramm'}, 26:{s:5,cat:'A',l:'Kinderpool'},
    240:{s:5,cat:'A',l:'Schnorcheln'}, 249:{s:5,cat:'A',l:'Windsurfen'},
    247:{s:5,cat:'A',l:'Wasserski'}, 2:{s:5,cat:'A',l:'Animationsprogramm'},
    389:{s:4,cat:'A',l:'Familienfreundlich'}, 781:{s:4,cat:'A',l:'Für Paare'},
    385:{s:4,cat:'A',l:'Adults Only'}, 245:{s:4,cat:'A',l:'Tennis'},
    250:{s:3,cat:'A',l:'Yoga'}, 209:{s:3,cat:'A',l:'Beach-Volleyball'},
    401:{s:3,cat:'A',l:'Konferenzeinrichtungen'}, 3:{s:3,cat:'A',l:'Abendunterhaltung'},
    31:{s:3,cat:'A',l:'Disco'}, 56:{s:2,cat:'A',l:'Spielplatz'}, 57:{s:2,cat:'A',l:'Spielzimmer'},
    244:{s:2,cat:'A',l:'Tischtennis'}, 211:{s:2,cat:'A',l:'Billard'},
    49:{s:2,cat:'A',l:'Nachtclub'}, 24:{s:2,cat:'A',l:'Casino'},
    5:{s:1,cat:'A',l:'Live-Musik'}, 6:{s:1,cat:'A',l:'Mini-Disco'}
  };

  // Aquapark/Wasserpark (588) zählt ZUSÄTZLICH im A-Bereich (family-hotel boost).
  // Ist schon in P (s:18). Hier separat verarbeitet → kein Objekt-Key-Konflikt.
  var SCORING_DUAL = [
    { id: 588, s: 12, cat: 'A', l: 'Aquapark' }
  ];

  var FEAT_ICONS = {
    'Strandlage':'🏖️','Strandbar':'🍹','Strandkorb':'⛱️',
    'Infinity-Pool':'♾️','Rooftop-Pool':'🏙️','Swim-up Bar':'🍹',
    'Wasserrutsche':'🌊','Wasserpark':'💦','Aquapark':'💦','Hallenbad':'🏊',
    'Außenpool':'🏊','Pool':'🏊','Poolbar':'🍹','Privater Pool':'🏊',
    'Spa':'💆','Wellness-Center':'💆','Massage':'💆','Sauna':'🌡️',
    'Hamam':'🧖','Dampfbad':'♨️','Whirlpool':'🛁',
    'All Inclusive Plus':'⭐','All Inclusive':'🍽️','Vollpension':'🍽️','Halbpension':'🍳',
    'Restaurant':'🍽️','Bar':'🍷','Bar/Pub':'🍺','Lobbybar':'🥂','Bar/Lounge':'🍷',
    'Café':'☕','Snackbar':'🥪',
    'Kids Club':'👨‍👩‍👧','Teens Club':'🎮','Kinderbetreuung':'👶','Miniclub':'🎪',
    'Kinder kostenlos':'🎁','Kinderprogramm':'🎨','Kinderpool':'🏊','Spielplatz':'🛝','Spielzimmer':'🧸',
    'Golf':'⛳','Tauchen':'🤿','Tennisplatz':'🎾','Fitness-Studio':'💪',
    'Beach-Volleyball':'🏐','Schnorcheln':'🤿','Wasserski':'🎿','Windsurfen':'🏄',
    'Tennis':'🎾','Tischtennis':'🏓','Yoga':'🧘','Billard':'🎱',
    'Animationsprogramm':'🎭','Abendunterhaltung':'🎭','Disco':'💃','Nachtclub':'🌙',
    'Casino':'🎰','Live-Musik':'🎵','Mini-Disco':'🎶',
    'Zimmerservice':'🛎️','Shuttleservice':'🚌','Transferservice':'🚐','Concierge':'🤵',
    'WLAN':'📶','Einparkservice':'🅿️','Parkplatz':'🅿️',
    'Meeresnähe':'🌊','Strandblick':'🌅','Zentrale Lage':'📍','Ruhige Lage':'🌿','Stadtzentrum':'🏙️',
    'Seelage':'🏞️','Jachthafen':'⛵','Altstadt':'🏛️','Golfplatznähe':'⛳','Kurort':'💧',
    'Buchtblick':'🌊','Seeblick':'🏞️','Autofreie Lage':'🚶','Waldlage':'🌲','Flusslage':'🏞️',
    'Bergblick':'⛰️','Belebte Lage':'🏙️',
    'Privater Wellnessbereich':'🔒','Thermalbecken':'♨️','Thalasso':'💧','Tauchbecken':'🔵',
    'Ayurveda':'🌿','Wasserspielbereich':'💦','Beautyfarm':'💅','Bali Bett':'🛏️',
    'Schönheitssalon':'💇','Akupunktur':'🪡','Ruheraum':'😌','Personal Trainer':'💪','Solarium':'☀️',
    'Sonnenterrasse':'🌞','Gesichtsbehandlung':'✨',
    'Für Flitterwochen':'💍','Konferenzeinrichtungen':'🏛️','Adults Only':'🔞',
    'Familienfreundlich':'👨‍👩‍👧','Für Paare':'❤️'
  };

  var SCORING_SORTED = Object.keys(SCORING).map(function (id) {
    return { id: Number(id), s: SCORING[id].s, l: SCORING[id].l, cat: SCORING[id].cat };
  }).sort(function (a, b) { return b.s - a.s; });

  // Caps: Stars=15, L=35, P=35, F=20, A=20  →  MAX_RAW=125
  var CAT_CAP = { L: 35, P: 35, F: 20, A: 20 };
  var MAX_RAW = 125;

  // ── Country → ISO2 ────────────────────────────────────────────────────────
  var COUNTRY_ISO = {
    'Türkei':'TR', 'Griechenland':'GR', 'Spanien':'ES', 'Italien':'IT',
    'Portugal':'PT', 'Kroatien':'HR', 'Frankreich':'FR', 'Ägypten':'EG',
    'Vereinigte Arabische Emirate':'AE', 'Dubai':'AE',
    'Bulgarien':'BG', 'Marokko':'MA', 'Tunesien':'TN', 'Jordanien':'JO',
    'Malta':'MT', 'Zypern':'CY', 'Kap Verde':'CV', 'Deutschland':'DE'
  };

  // ── Uçuş süresi ab Deutschland (gerundete Richtwerte) ────────────────────
  // ≤4h → +3pt  |  4–7h → 0pt  |  >7h → -2pt
  var FLIGHT_H = {
    TR:3.5, GR:3, ES:3, IT:2, PT:3.5, HR:2.5, FR:2, MT:2.5,
    CY:4, BG:3, MA:3.5, TN:3, DE:0, EG:5.5, AE:7, JO:5, CV:6
  };

  function countryToIso(name) {
    if (!name) return '';
    if (/^[A-Z]{2}$/.test(name)) return name;
    return COUNTRY_ISO[name] || '';
  }

  function _flightBonus(iso) {
    var h = FLIGHT_H[iso];
    if (h === undefined) return 0;
    return h <= 4 ? 3 : h <= 7 ? 0 : -2;
  }

  // ── Core Score (sync) ─────────────────────────────────────────────────────
  // opts.warningPenalty: 0 | 5 | 10 | 15  (vom fetchWarningPenalty Promise)
  function calcScore(h, opts) {
    opts = opts || {};
    var warningPenalty = opts.warningPenalty || 0;
    var st = h.stars || 0;
    var stars = st >= 5 ? 15 : st >= 4 ? 12 : st >= 3 ? 8 : st >= 2 ? 4 : st >= 1 ? 1 : 0;
    var cats = { L: 0, P: 0, F: 0, A: 0 };
    var idSet = {};
    (h.factIds || []).forEach(function (id) { idSet[id] = true; });
    // Main scoring loop
    for (var i = 0; i < SCORING_SORTED.length; i++) {
      var e = SCORING_SORTED[i];
      if (idSet[e.id]) cats[e.cat] = (cats[e.cat] || 0) + e.s;
    }
    // Dual-category facts (Aquapark: contributes to both P and A)
    for (var j = 0; j < SCORING_DUAL.length; j++) {
      var d = SCORING_DUAL[j];
      if (idSet[d.id]) cats[d.cat] = (cats[d.cat] || 0) + d.s;
    }
    var raw = stars
      + Math.min(cats.L, CAT_CAP.L)
      + Math.min(cats.P, CAT_CAP.P)
      + Math.min(cats.F, CAT_CAP.F)
      + Math.min(cats.A, CAT_CAP.A);
    var iso = countryToIso(h.country || '');
    var base = Math.round(raw / MAX_RAW * 100);
    return Math.max(1, Math.min(100, base + _flightBonus(iso) - warningPenalty));
  }

  // ── Score Detail (sync) – returns raw category breakdown ─────────────────
  function calcScoreDetail(h, opts) {
    opts = opts || {};
    var warningPenalty = opts.warningPenalty || 0;
    var st = h.stars || 0;
    var stars = st >= 5 ? 15 : st >= 4 ? 12 : st >= 3 ? 8 : st >= 2 ? 4 : st >= 1 ? 1 : 0;
    var cats = { L: 0, P: 0, F: 0, A: 0 };
    var idSet = {};
    (h.factIds || []).forEach(function (id) { idSet[id] = true; });
    for (var i = 0; i < SCORING_SORTED.length; i++) {
      var e = SCORING_SORTED[i];
      if (idSet[e.id]) cats[e.cat] = (cats[e.cat] || 0) + e.s;
    }
    for (var j = 0; j < SCORING_DUAL.length; j++) {
      var d = SCORING_DUAL[j];
      if (idSet[d.id]) cats[d.cat] = (cats[d.cat] || 0) + d.s;
    }
    var L = Math.min(cats.L, CAT_CAP.L);
    var P = Math.min(cats.P, CAT_CAP.P);
    var F = Math.min(cats.F, CAT_CAP.F);
    var A = Math.min(cats.A, CAT_CAP.A);
    var raw = stars + L + P + F + A;
    var iso = countryToIso(h.country || '');
    var flightBonus = _flightBonus(iso);
    var base = Math.round(raw / MAX_RAW * 100);
    var score = Math.max(1, Math.min(100, base + flightBonus - warningPenalty));
    return {
      score: score,
      stars: stars, starsMax: 15,
      L: L, Lmax: CAT_CAP.L,
      P: P, Pmax: CAT_CAP.P,
      F: F, Fmax: CAT_CAP.F,
      A: A, Amax: CAT_CAP.A,
      flightBonus: flightBonus,
      warningPenalty: warningPenalty
    };
  }

  // ── Async: Reisewarnung penalty ───────────────────────────────────────────
  // Gibt penalty-Punkte zurück: level 0→0, 1→5, 2→10, 3→15
  // Session-gecacht: gleiche ISO → kein zweiter API-Call
  var _warnCache = {};
  function fetchWarningPenalty(countryName) {
    var iso = countryToIso(countryName) || String(countryName || '').toUpperCase().slice(0, 2);
    if (_warnCache[iso] !== undefined) return Promise.resolve(_warnCache[iso]);
    return fetch('/api/travel-warning?country=' + encodeURIComponent(iso))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var p = (d.level || 0) * 5;
        _warnCache[iso] = p;
        return p;
      })
      .catch(function () { _warnCache[iso] = 0; return 0; });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function topFeatures(h, n) {
    var idSet = {};
    (h.factIds || []).forEach(function (id) { idSet[id] = true; });
    var seen = {}, out = [];
    for (var i = 0; i < SCORING_SORTED.length && out.length < n; i++) {
      var e = SCORING_SORTED[i];
      if (idSet[e.id] && !seen[e.l]) { seen[e.l] = true; out.push(e); }
    }
    return out;
  }

  function scoreLabel(score) {
    if (score >= 90) return { text: 'Herausragend',   color: '#00c896' };
    if (score >= 80) return { text: 'Sehr gut',       color: '#00c896' };
    if (score >= 70) return { text: 'Empfehlenswert', color: '#7dd3b0' };
    if (score >= 60) return { text: 'Gut',            color: '#7dd3b0' };
    return                  { text: 'Solide',          color: '#777'    };
  }

  // ── Export ────────────────────────────────────────────────────────────────
  global.JBScore = {
    SCORING:             SCORING,
    SCORING_SORTED:      SCORING_SORTED,
    CAT_CAP:             CAT_CAP,
    FEAT_ICONS:          FEAT_ICONS,
    countryToIso:        countryToIso,
    calcScore:           calcScore,
    calcScoreDetail:     calcScoreDetail,
    fetchWarningPenalty: fetchWarningPenalty,
    topFeatures:         topFeatures,
    scoreLabel:          scoreLabel
  };

})(typeof window !== 'undefined' ? window : this);
