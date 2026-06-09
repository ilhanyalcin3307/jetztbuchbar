/**
 * jb-score.js — JetztBuchbar JB-Score Engine (Single Source of Truth)
 * v4.0: Google Places bonus · Kalibre edilmiş puan değerleri · Genişletilmiş skor aralığı
 *
 * Değişiklikler v3→v4:
 *  1. Baskın feature skorları azaltıldı (Strandlage 20→17, Wasserpark/Priv.Pool 18→14,
 *     AI Plus 20→17, AI 16→13, Kids Club 12→10, Golf/Tauchen 10→8)
 *  2. MAX_CAT: 90 → 112  (normalizer büyüdü → üst oda açıldı, 100 artık zor)
 *  3. googleBonus() eklendi: h.googleRating + h.googleReviews → 0-12 ek puan
 *     (Google Places rating, content-engine/update-google-ratings.js ile aylık güncellenir)
 *  4. calcScore() artık googleBonus'u da hesaba katar
 *  5. Geriye dönük uyum korundu (calcScoreDetail warningPenalty:0 döndürür)
 *
 * Exposes: window.JBScore
 * Usage:   <script src="/components/jb-score.js"></script>
 *
 * calcScore(h [,opts])         → number 1-100  (sync)
 * calcScoreDetail(h [,opts])   → { score, L, P, F, A, starMult, flightBonus, googleBonus, ... }
 * googleBonus(rating, reviews) → number 0-12
 * fetchWarningLevel(country)   → Promise<{level,icon,text,color,bg}>  (UI only)
 * fetchWarningPenalty(country) → Promise<0>  (backward compat, her zaman 0)
 * topFeatures(h, n)            → [{id, s, cat, l}]
 * scoreLabel(score)            → {text, color}
 */
(function (global) {
  'use strict';

  // ── Scoring table ─────────────────────────────────────────────────────────
  // Categories: L=Lage, P=Pool/Wellness, F=Verpflegung, A=Familie/Aktivitäten
  var SCORING = {
    // LAGE (L) – cap 30
    89:{s:17,cat:'L',l:'Strandlage'}, 301:{s:12,cat:'L',l:'Meeresnähe'}, 374:{s:7,cat:'L',l:'Strandblick'},
    90:{s:8,cat:'L',l:'Zentrale Lage'}, 91:{s:5,cat:'L',l:'Ruhige Lage'}, 291:{s:5,cat:'L',l:'Stadtzentrum'},
    295:{s:6,cat:'L',l:'Seelage'}, 562:{s:5,cat:'L',l:'Jachthafen'}, 350:{s:5,cat:'L',l:'Altstadt'},
    294:{s:4,cat:'L',l:'Golfplatznähe'}, 691:{s:4,cat:'L',l:'Kurort'},
    354:{s:4,cat:'L',l:'Buchtblick'}, 364:{s:4,cat:'L',l:'Seeblick'},
    349:{s:3,cat:'L',l:'Autofreie Lage'}, 293:{s:3,cat:'L',l:'Waldlage'}, 300:{s:3,cat:'L',l:'Flusslage'},
    365:{s:3,cat:'L',l:'Bergblick'}, 348:{s:2,cat:'L',l:'Belebte Lage'},
    22:{s:1,cat:'L',l:'Parkplatz'}, 568:{s:1,cat:'L',l:'Einparkservice'},
    // POOL & WELLNESS (P) – cap 25
    614:{s:14,cat:'P',l:'Privater Pool'}, 588:{s:14,cat:'P',l:'Wasserpark'}, 697:{s:14,cat:'P',l:'Infinity-Pool'},
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
    // fPension:true → bu 4 tip mutually exclusive; _calcCats() sadece en yükseği alır
    94:{s:17,cat:'F',l:'All Inclusive Plus',fP:true}, 92:{s:13,cat:'F',l:'All Inclusive',fP:true},
    101:{s:12,cat:'F',l:'Vollpension',fP:true}, 103:{s:8,cat:'F',l:'Halbpension',fP:true},
    65:{s:5,cat:'F',l:'Restaurant'}, 299:{s:5,cat:'F',l:'Restaurant'},
    14:{s:3,cat:'F',l:'Bar'}, 288:{s:3,cat:'F',l:'Bar/Pub'}, 450:{s:3,cat:'F',l:'Lobbybar'},
    575:{s:3,cat:'F',l:'Bar/Lounge'}, 20:{s:2,cat:'F',l:'Café'}, 73:{s:2,cat:'F',l:'Snackbar'},
    439:{s:1,cat:'F',l:'Strandkorb'},
    // FAMILIE & AKTIVITÄTEN (A) – cap 15
    // Adults Only (385): s=0, sadece mutex trigger — kendi puanı yok
    945:{s:10,cat:'A',l:'Kids Club'}, 219:{s:8,cat:'A',l:'Golf'}, 236:{s:8,cat:'A',l:'Tauchen'},
    946:{s:7,cat:'A',l:'Teens Club'}, 1:{s:7,cat:'A',l:'Kinderbetreuung'}, 7:{s:7,cat:'A',l:'Miniclub'},
    393:{s:7,cat:'A',l:'Für Flitterwochen'}, 593:{s:7,cat:'A',l:'Tennisplatz'},
    707:{s:6,cat:'A',l:'Kinder kostenlos'}, 220:{s:6,cat:'A',l:'Fitness-Studio'},
    4:{s:5,cat:'A',l:'Kinderprogramm'}, 26:{s:5,cat:'A',l:'Kinderpool'},
    240:{s:5,cat:'A',l:'Schnorcheln'}, 249:{s:5,cat:'A',l:'Windsurfen'},
    247:{s:5,cat:'A',l:'Wasserski'}, 2:{s:5,cat:'A',l:'Animationsprogramm'},
    389:{s:4,cat:'A',l:'Familienfreundlich'}, 781:{s:4,cat:'A',l:'Für Paare'},
    385:{s:0,cat:'A',l:'Adults Only'}, 245:{s:4,cat:'A',l:'Tennis'},
    250:{s:3,cat:'A',l:'Yoga'}, 209:{s:3,cat:'A',l:'Beach-Volleyball'},
    401:{s:3,cat:'A',l:'Konferenzeinrichtungen'}, 3:{s:3,cat:'A',l:'Abendunterhaltung'},
    31:{s:3,cat:'A',l:'Disco'}, 56:{s:2,cat:'A',l:'Spielplatz'}, 57:{s:2,cat:'A',l:'Spielzimmer'},
    244:{s:2,cat:'A',l:'Tischtennis'}, 211:{s:2,cat:'A',l:'Billard'},
    49:{s:2,cat:'A',l:'Nachtclub'}, 24:{s:2,cat:'A',l:'Casino'},
    5:{s:1,cat:'A',l:'Live-Musik'}, 6:{s:1,cat:'A',l:'Mini-Disco'}
  };

  // Aquapark/Wasserpark (588) → P'de s:14 zaten var; A'ya ek dual-boost
  var SCORING_DUAL = [
    { id: 588, s: 6, cat: 'A', l: 'Aquapark' }
  ];

  // ── v3 Sabitler ───────────────────────────────────────────────────────────
  // Verpflegung: pansiyon tipi — mutually exclusive (winner takes all)
  var PENSION_IDS = { 94: 1, 92: 1, 101: 1, 103: 1 };

  // Adults Only mutex: bu ID varsa aşağıdaki çocuk fact'leri sıfırlanır
  var ADULTS_ONLY_ID = 385;
  var KIDS_FACT_IDS  = { 945: 1, 946: 1, 1: 1, 7: 1, 707: 1, 4: 1, 26: 1, 56: 1, 57: 1 };

  // Yıldız çarpanı — 4★ baseline (×1.00), 5★ hafif artı, ≤3★ hafif eksi
  // index = yıldız sayısı (0–5)
  var STAR_MULT = [0.88, 0.90, 0.93, 0.97, 1.00, 1.08];

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

  // v5: CAT_CAP aynı; MAX_CAT = tüm cap'lerin toplamı (Tesis normalizer: 30+25+20+15=90)
  var CAT_CAP = { L: 30, P: 25, F: 20, A: 15 };
  var MAX_CAT = 90;

  // ── Ülke & Güvenlik: Destinasyon Temel Puanı (0–100) ─────────────────────
  // Baseline-Werte: Reisewarnung-Penalty noch NICHT enthalten → wird dynamisch addiert
  var COUNTRY_SCORE = {
    GR: 92, ES: 91, IT: 90, HR: 88, PT: 90, FR: 88, MT: 86, CY: 85,
    BG: 80, TR: 84, MA: 77, TN: 75, EG: 73, JO: 76, AE: 84, CV: 74, DE: 82
  };
  var COUNTRY_SCORE_DEFAULT = 74;

  // Ülke Güvenlik Cezası — AA Reisewarnung Level (0–3) → ulke puanına eklenir (negatif)
  var WARNING_ULKE_PENALTY = { 0: 0, 1: -5, 2: -12, 3: -25 };

  // ── Kategori & Erişim: Yıldız Puanı (0–5 → 0–100) ───────────────────────
  var STAR_SCORE = [60, 30, 48, 65, 82, 100]; // index = yıldız sayısı

  // ── v5 Ağırlıklar: 4 Kalem ────────────────────────────────────────────────
  // deneyim null ise ağırlığı 0 yapılır, geri kalanına orantılı dağıtılır
  var BASE_WEIGHTS = { tesis: 0.55, ulke: 0.15, deneyim: 0.20, kategori: 0.10 };

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

  // ── Kategori hesabı (internal helper) ───────────────────────────────────
  // Pension hiyerarşisi + Adults Only mutex burada uygulanır.
  function _calcCats(h) {
    var idSet = {};
    (h.factIds || []).forEach(function (id) { idSet[id] = true; });

    // Adults Only mutex: ID 385 varsa çocuk fact'leri idSet'ten çıkar
    var adultsOnly = !!idSet[ADULTS_ONLY_ID];
    if (adultsOnly) {
      var kIds = Object.keys(KIDS_FACT_IDS);
      for (var k = 0; k < kIds.length; k++) { delete idSet[Number(kIds[k])]; }
    }

    var raw = { L: 0, P: 0, A: 0 };
    var pensionBest = 0; // F: sadece en yüksek pansiyon tipi
    var fAdditive   = 0; // F: restoran/bar additive

    var ids = Object.keys(SCORING);
    for (var i = 0; i < ids.length; i++) {
      var id  = Number(ids[i]);
      if (!idSet[id]) continue;
      var ent = SCORING[id];
      if (ent.cat === 'F') {
        if (PENSION_IDS[id]) {
          if (ent.s > pensionBest) pensionBest = ent.s; // winner takes all
        } else {
          fAdditive += ent.s;
        }
      } else {
        raw[ent.cat] = (raw[ent.cat] || 0) + ent.s;
      }
    }

    // Aquapark dual-boost: A kategorisine ek katkı
    for (var j = 0; j < SCORING_DUAL.length; j++) {
      var d = SCORING_DUAL[j];
      if (idSet[d.id]) raw[d.cat] = (raw[d.cat] || 0) + d.s;
    }

    return {
      L:          Math.min(raw.L,                   CAT_CAP.L),
      P:          Math.min(raw.P,                   CAT_CAP.P),
      F:          Math.min(pensionBest + fAdditive, CAT_CAP.F),
      A:          Math.min(raw.A,                   CAT_CAP.A),
      adultsOnly: adultsOnly
    };
  }

  // ── Google Places Bonus (0-12 puan) ──────────────────────────────────────
  // rating: Google Places ortalama puanı (1.0-5.0)
  // reviews: yorum sayısı (güvenilirlik ağırlığı için)
  // Veri yoksa 0 döner (cezalandırmaz)
  function googleBonus(rating, reviews) {
    if (!rating || rating <= 0) return 0;
    // Yorum sayısına göre güvenilirlik çarpanı (min 0.3, max 1.0)
    var weight = Math.min(1.0, Math.max(0.3, (reviews || 0) / 400));
    var pts;
    if      (rating >= 4.9) pts = 12;
    else if (rating >= 4.7) pts = 10;
    else if (rating >= 4.5) pts = 8;
    else if (rating >= 4.3) pts = 6;
    else if (rating >= 4.0) pts = 4;
    else if (rating >= 3.7) pts = 2;
    else if (rating >= 3.5) pts = 0;
    else                    pts = -3; // Kötü Google yorumları ceza verir
    return Math.round(pts * weight);
  }

  // ── v5 Yardımcılar ────────────────────────────────────────────────────────
  // Misafir Deneyimi: Google rating → 0–100
  // Şart: min 200 yorum — altındaysa null döner (ağırlık diğerlerine dağıtılır)
  function _deneyimScore(rating, reviews) {
    if (!rating || rating <= 0 || (reviews || 0) < 200) return null;
    if (rating >= 4.9) return 95;
    if (rating >= 4.7) return 82;
    if (rating >= 4.5) return 68;
    if (rating >= 4.3) return 54;
    if (rating >= 4.0) return 40;
    if (rating >= 3.7) return 25;
    if (rating >= 3.5) return 12;
    return 5;
  }

  // deneyim null ise ağırlığını diğer 3 kaleme orantılı dağıt
  function _resolveWeights(hasDeneyim) {
    if (hasDeneyim) return { tesis: 0.55, ulke: 0.15, deneyim: 0.20, kategori: 0.10 };
    var sum = 0.80; // 0.55 + 0.15 + 0.10
    return { tesis: 0.55 / sum, ulke: 0.15 / sum, deneyim: 0, kategori: 0.10 / sum };
  }

  // Ana hesaplama — her kalem 0-100, ağırlıklı final skora döner
  function _calcDetail(h, opts) {
    var cats     = _calcCats(h);
    var tesis    = Math.min(100, Math.round((cats.L + cats.P + cats.F + cats.A) / MAX_CAT * 100));
    var iso      = countryToIso(h.country || '');
    var ulkeBase = COUNTRY_SCORE[iso] !== undefined ? COUNTRY_SCORE[iso] : COUNTRY_SCORE_DEFAULT;
    var warnLvl  = (opts && opts.warningLevel != null) ? Number(opts.warningLevel) : 0;
    var penalty  = WARNING_ULKE_PENALTY[warnLvl] !== undefined ? WARNING_ULKE_PENALTY[warnLvl] : 0;
    var ulke     = Math.max(0, ulkeBase + penalty);
    var deneyim  = _deneyimScore(h.googleRating || 0, h.googleReviews || 0);
    var st       = Math.max(0, Math.min(5, Math.round(h.stars || 0)));
    var kategori = STAR_SCORE[st];
    var ws       = _resolveWeights(deneyim !== null);
    var raw      = ws.tesis * tesis + ws.ulke * ulke + ws.kategori * kategori
                   + (deneyim !== null ? ws.deneyim * deneyim : 0);
    return {
      score:     Math.max(1, Math.min(100, Math.round(raw))),
      breakdown: { tesis: tesis, ulke: ulke, deneyim: deneyim, kategori: kategori },
      weights:   ws,
      meta: {
        stars:         st,
        country:       h.country || '',
        iso:           iso,
        googleRating:  h.googleRating  || null,
        googleReviews: h.googleReviews || 0,
        adultsOnly:    cats.adultsOnly,
        flightBonus:   _flightBonus(iso),  // bilgi amaçlı, skora dahil değil
        warningPenalty: penalty              // aktif AA-Penalty
      }
    };
  }

  // ── Core Score (sync) ─────────────────────────────────────────────────────
  // opts yoksayılır (backward compat) — number döndürür, hiçbir şey bozulmaz
  function calcScore(h, opts) {
    return _calcDetail(h, opts).score;
  }

  // ── Score Detail (sync) — v5: 4 Kalem Breakdown ──────────────────────────
  // Döndürür: { score, breakdown:{tesis,ulke,deneyim,kategori}, weights, meta }
  function calcScoreDetail(h, opts) {
    return _calcDetail(h, opts);
  }

  // ── Reisewarnung (UI only — v3'te skora dahil değil) ─────────────────────
  // Döndürdüğü nesne: { level, icon, text, color, bg }
  var _warnCache = {};
  function fetchWarningLevel(countryName) {
    var iso = countryToIso(countryName) || String(countryName || '').toUpperCase().slice(0, 2);
    if (!iso) return Promise.resolve(null);
    if (_warnCache[iso] !== undefined) return Promise.resolve(_warnCache[iso]);
    return fetch('/api/travel-warning?country=' + encodeURIComponent(iso))
      .then(function (r) { return r.json(); })
      .then(function (d) { _warnCache[iso] = d; return d; })
      .catch(function () {
        var fb = { level: 0, icon: '🟢', text: 'Keine Reisewarnung', color: '#00c896', bg: 'rgba(0,200,150,0.08)' };
        _warnCache[iso] = fb;
        return fb;
      });
  }

  // Backward compat: alter Code ruft fetchWarningPenalty auf → gibt immer 0 zurück
  // Neu: fetchWarningLevel(country) für UI-Badge verwenden
  function fetchWarningPenalty(countryName) {
    fetchWarningLevel(countryName); // Cache wärmen, aber Ergebnis ignorieren
    return Promise.resolve(0);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function topFeatures(h, n) {
    var idSet = {};
    (h.factIds || []).forEach(function (id) { idSet[id] = true; });
    var seen = {}, out = [];
    for (var i = 0; i < SCORING_SORTED.length && out.length < n; i++) {
      var e = SCORING_SORTED[i];
      if (e.s > 0 && idSet[e.id] && !seen[e.l]) { seen[e.l] = true; out.push(e); }
    }
    return out;
  }

  function scoreLabel(score) {
    if (score >= 93) return { text: 'Außergewöhnlich', color: '#00c896' };
    if (score >= 85) return { text: 'Herausragend',    color: '#00c896' };
    if (score >= 75) return { text: 'Sehr gut',        color: '#00c896' };
    if (score >= 65) return { text: 'Empfehlenswert',  color: '#7dd3b0' };
    if (score >= 55) return { text: 'Gut',             color: '#7dd3b0' };
    if (score >= 40) return { text: 'Solide',          color: '#777'    };
    return                  { text: 'Einfach',          color: '#666'    };
  }

  // ── Export ────────────────────────────────────────────────────────────────
  global.JBScore = {
    SCORING:             SCORING,
    SCORING_SORTED:      SCORING_SORTED,
    CAT_CAP:             CAT_CAP,
    FEAT_ICONS:          FEAT_ICONS,
    STAR_MULT:           STAR_MULT,           // backward compat
    COUNTRY_SCORE:       COUNTRY_SCORE,
    STAR_SCORE:          STAR_SCORE,
    BASE_WEIGHTS:        BASE_WEIGHTS,
    countryToIso:        countryToIso,
    calcScore:           calcScore,           // → number (backward compat)
    calcScoreDetail:     calcScoreDetail,     // → { score, breakdown, weights, meta }
    googleBonus:         googleBonus,         // public API (backward compat)
    fetchWarningLevel:   fetchWarningLevel,
    fetchWarningPenalty: fetchWarningPenalty, // backward compat, returns 0
    topFeatures:         topFeatures,
    scoreLabel:          scoreLabel
  };

})(typeof window !== 'undefined' ? window : this);
