/**
 * JetztBuchbar – Destinations Data
 * Alle Ziel-Profile für den Reiseziel-Vergleich (Vergleich-Engine)
 *
 * Scores: 1 (niedrig) – 5 (sehr hoch)
 * giataIds: null = noch nicht via GIATA-API befüllt (Platzhalter)
 * ctaCards: Links zur Hotel-Vergleich-Seite via /?hotels=id1,id2,id3,id4
 */

'use strict';

/* ─────────────────────────────────────────────────
   1. DESTINATION PROFILES
   ───────────────────────────────────────────────── */

var DESTINATIONS = {

  /* ── MALLORCA ── */
  mallorca: {
    id: 'mallorca',
    name: 'Mallorca',
    country: 'Spanien',
    flag: '🇪🇸',
    tagline: 'Sonnige Inselleben für jeden Geschmack',
    url: '/spanien/mallorca/',
    hotelUrl: '/spanien/hotels-mallorca/',
    heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',

    bestSeason: {
      label: 'Mai – Oktober',
      peak:  'Juli – August',
      score: 4,
      tip:   'Schulterzeit Mai/Juni und September ideal – weniger Betrieb, Top-Wetter.'
    },

    budget: {
      score:         3,
      label:         'Mittel',
      avgHotelNight: 95,   // EUR, 3–4 Sterne
      avgFlight:     89,   // EUR ab Deutschland (One-Way)
      note:          'Günstigere Hotels im Inselinneren, teurer in Strandnähe.'
    },

    beach: {
      score:      5,
      label:      'Traumstrände',
      type:       'Weißer Sandstrand & türkisfarbenes Wasser',
      highlights: ['Es Trenc', 'Cala Agulla', 'Playa de Muro', 'Cala Mondragó']
    },

    nature: {
      score:      4,
      label:      'Berge & Küste',
      highlights: ['Tramuntana-Gebirge (UNESCO)', 'Cuevas del Drach', 'Wanderwege', 'Weinberge']
    },

    activities: ['Wassersport', 'Nachtleben', 'Radfahren', 'Wandern', 'Segeln', 'Kulinarik', 'Golfen'],

    flightFromDE: {
      duration: '2:20',
      label:    'ca. 2h 20min'
    },

    scores: {
      family:    4,
      couple:    4,
      solo:      3,
      party:     5,
      culture:   3,
      nature:    4,
      beach:     5,
      adventure: 3
    },

    ctaCards: [
      {
        label:    'Die 4 besten Familienhotels auf Mallorca vergleichen',
        type:     'family',
        giataIds: ['574183', null, null, null]  // Hipotels Gran Playa de Palma + 3 via API
      },
      {
        label:    'Top Strandhotels auf Mallorca – direkt vergleichen',
        type:     'beach',
        giataIds: ['574183', null, null, null]
      },
      {
        label:    'Luxushotels auf Mallorca im Vergleich',
        type:     'luxury',
        giataIds: [null, null, null, null]       // via GIATA API zu befüllen
      }
    ]
  },

  /* ── KRETA ── */
  kreta: {
    id: 'kreta',
    name: 'Kreta',
    country: 'Griechenland',
    flag: '🇬🇷',
    tagline: 'Authentische Kultur, Natur und kristallklares Wasser',
    url: '/griechenland/kreta/',
    hotelUrl: '/griechenland/hotels-kreta/',
    heroImage: 'https://images.unsplash.com/photo-1612820971049-5af7dc440a1c?w=1200&q=80',

    bestSeason: {
      label: 'Mai – Oktober',
      peak:  'Juli – August',
      score: 4,
      tip:   'Mai–Juni & September: angenehmste Temperaturen, wenig Touristen.'
    },

    budget: {
      score:         2,
      label:         'Günstig–Mittel',
      avgHotelNight: 72,
      avgFlight:     89,
      note:          'Deutlich günstiger als Mallorca, besonders außerhalb Heraklions.'
    },

    beach: {
      score:      5,
      label:      'Kristallklares Wasser',
      type:       'Kiesstrand & Sandstrand',
      highlights: ['Balos Lagune', 'Elafonissi', 'Vai Palm Beach', 'Preveli']
    },

    nature: {
      score:      5,
      label:      'Wildromantische Natur',
      highlights: ['Samaria-Schlucht', 'Weiße Berge', 'Olivenhaine', 'Palmen-Strand Vai']
    },

    activities: ['Wandern', 'Schnorcheln', 'Tauchen', 'Kulinarik', 'Archäologie', 'Höhlen erkunden', 'Klettern'],

    flightFromDE: {
      duration: '3:20',
      label:    'ca. 3h 20min'
    },

    scores: {
      family:    5,
      couple:    4,
      solo:      4,
      party:     2,
      culture:   5,
      nature:    5,
      beach:     5,
      adventure: 4
    },

    ctaCards: [
      {
        label:    'Die 4 besten Familienhotels auf Kreta vergleichen',
        type:     'family',
        giataIds: ['10958', null, null, null]   // Georgioupolis Resort + 3 via API
      },
      {
        label:    'Top All-Inclusive Hotels auf Kreta im Vergleich',
        type:     'allinclusive',
        giataIds: ['10958', null, null, null]
      },
      {
        label:    'Strandhotels auf Kreta – 4 auf einen Blick vergleichen',
        type:     'beach',
        giataIds: [null, null, null, null]
      }
    ]
  },

  /* ── TÜRKEI (Antalya-Region / Türkische Riviera) ── */
  tuerkei: {
    id: 'tuerkei',
    name: 'Türkei',
    country: 'Türkei',
    flag: '🇹🇷',
    tagline: 'All-Inclusive-Paradies mit antiker Geschichte',
    url: '/tuerkei/',
    hotelUrl: '/tuerkei/hotels-antalya/',
    heroImage: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=80',

    bestSeason: {
      label: 'April – Oktober',
      peak:  'Juni – September',
      score: 5,
      tip:   'April/Mai & Oktober: angenehme Hitze, günstigere Preise.'
    },

    budget: {
      score:         2,
      label:         'Günstig',
      avgHotelNight: 65,
      avgFlight:     99,
      note:          'Bestes Preis-Leistungs-Verhältnis im Mittelmeerraum – besonders All-Inclusive.'
    },

    beach: {
      score:      4,
      label:      'Türkisfarbenes Meer',
      type:       'Feiner Sandstrand & Kieselbucht',
      highlights: ['Konyaaltı Strand', 'Kleopatra Strand', 'Ölüdeniz', 'Kaputaş']
    },

    nature: {
      score:      4,
      label:      'Taurus & Küste',
      highlights: ['Taurus-Gebirge', 'Düden-Wasserfälle', 'Pamukkale Travertine', 'Kapadokya']
    },

    activities: ['All-Inclusive-Urlaub', 'Wassersport', 'Antike Stätten', 'Bazaar-Shopping', 'Wüstensafari', 'Ballonfahrt Kapadokya'],

    flightFromDE: {
      duration: '3:30',
      label:    'ca. 3h 30min'
    },

    scores: {
      family:    5,
      couple:    4,
      solo:      3,
      party:     3,
      culture:   4,
      nature:    4,
      beach:     4,
      adventure: 3
    },

    ctaCards: [
      {
        label:    'Die 4 besten All-Inclusive Hotels in der Türkei vergleichen',
        type:     'allinclusive',
        giataIds: ['42194', '232017', null, null]  // Rixos + Maxx Royal + 2 via API
      },
      {
        label:    'Luxus-Resorts Türkei – direkt nebeneinander vergleichen',
        type:     'luxury',
        giataIds: ['42194', '232017', null, null]
      },
      {
        label:    'Familienhotels Türkei – Top 4 im Direktvergleich',
        type:     'family',
        giataIds: ['42194', null, null, null]
      }
    ]
  },

  /* ── ÄGYPTEN (Hurghada / Sharm el-Sheikh) ── */
  aegypten: {
    id: 'aegypten',
    name: 'Ägypten',
    country: 'Ägypten',
    flag: '🇪🇬',
    tagline: 'Rotes Meer, Korallenriffe und antike Wunder',
    url: '/aegypten/',
    hotelUrl: null,    // noch keine dedizierte Hotelseite
    heroImage: 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=1200&q=80',

    bestSeason: {
      label: 'Oktober – April',
      peak:  'November – März',
      score: 4,
      tip:   'Sommer meiden (40°C+). Ideal für Taucher: Herbst und Frühjahr.'
    },

    budget: {
      score:         1,
      label:         'Sehr günstig',
      avgHotelNight: 52,
      avgFlight:     119,
      note:          'Günstigstes Strandreiseziel aus Deutschland – All-Inclusive ab 35€/Nacht.'
    },

    beach: {
      score:      5,
      label:      'Korallenriff-Traumstrand',
      type:       'Korallensand & Rotes Meer',
      highlights: ['Mahmya Island', 'Abu Dabbab', 'Ras Mohammed NP', 'Sharm White Knight']
    },

    nature: {
      score:      3,
      label:      'Wüste & Rotes Meer',
      highlights: ['Sinai-Wüste', 'Rotes Meer Korallenriffe', 'Wadi Hammamat', 'Natrun-Tal']
    },

    activities: ['Tauchen', 'Schnorcheln', 'Wüstensafari (Quad)', 'Kamelreiten', 'Nilkreuzfahrt', 'Luxor & Karnak'],

    flightFromDE: {
      duration: '5:00',
      label:    'ca. 5h 00min'
    },

    scores: {
      family:    3,
      couple:    4,
      solo:      3,
      party:     1,
      culture:   4,
      nature:    3,
      beach:     5,
      adventure: 5
    },

    ctaCards: [
      {
        label:    'Top 4 All-Inclusive Hotels in Ägypten vergleichen',
        type:     'allinclusive',
        giataIds: [null, null, null, null]   // via GIATA API countryCode=EG
      },
      {
        label:    'Taucher-Hotels am Roten Meer – 4 im Vergleich',
        type:     'diving',
        giataIds: [null, null, null, null]
      }
    ]
  },

  /* ── DUBAI ── */
  dubai: {
    id: 'dubai',
    name: 'Dubai',
    country: 'Vereinigte Arabische Emirate',
    flag: '🇦🇪',
    tagline: 'Weltrekorde, Luxus und Wüstenmagie',
    url: '/dubai/',
    hotelUrl: '/dubai/hotels-dubai/',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',

    bestSeason: {
      label: 'Oktober – April',
      peak:  'Dezember – März',
      score: 3,
      tip:   'Sommer extrem heiß (46°C+). Außerhalb der Saison deutlich günstiger.'
    },

    budget: {
      score:         5,
      label:         'Premium',
      avgHotelNight: 195,
      avgFlight:     379,
      note:          'Teurer als europäische Ziele – dafür unvergessliches Erlebnis.'
    },

    beach: {
      score:      3,
      label:      'Künstliche Traumstrände',
      type:       'Angelegter Sandstrand',
      highlights: ['Jumeirah Beach', 'Kite Beach', 'JBR Beach', 'Palm Jumeirah']
    },

    nature: {
      score:      2,
      label:      'Wüste & Meer',
      highlights: ['Dubai Desert Conservation', 'Ras Al Khor Vogelschutzgebiet', 'Al Qudra Seen']
    },

    activities: ['Burj Khalifa', 'Shopping-Malls', 'Wüstensafari', 'Skydiving', 'Luxusrestaurants', 'Formel-1-Feeling (Autodrome)', 'Aquaventure Wasserpark'],

    flightFromDE: {
      duration: '6:30',
      label:    'ca. 6h 30min'
    },

    scores: {
      family:    4,
      couple:    5,
      solo:      3,
      party:     3,
      culture:   3,
      nature:    2,
      beach:     3,
      adventure: 4
    },

    ctaCards: [
      {
        label:    'Top 4 Luxushotels in Dubai – direkt nebeneinander vergleichen',
        type:     'luxury',
        giataIds: [null, null, null, null]   // via GIATA API countryCode=AE city=Dubai
      },
      {
        label:    'Strandhotels in Dubai – 4 im Direktvergleich',
        type:     'beach',
        giataIds: [null, null, null, null]
      }
    ]
  },

  /* ── ABU DHABI ── */
  abudhabi: {
    id: 'abudhabi',
    name: 'Abu Dhabi',
    country: 'Vereinigte Arabische Emirate',
    flag: '🇦🇪',
    tagline: 'Kultivierte Eleganz abseits des Trubels',
    url: '/dubai/',   // noch keine eigene Seite – auf Dubai-Seite zeigen
    hotelUrl: null,
    heroImage: 'https://images.unsplash.com/photo-1509041322357-8a3f9757a475?w=1200&q=80',

    bestSeason: {
      label: 'Oktober – April',
      peak:  'Dezember – März',
      score: 3,
      tip:   'Gleiche Empfehlung wie Dubai – Wintermonate ideal.'
    },

    budget: {
      score:         4,
      label:         'Gehoben',
      avgHotelNight: 155,
      avgFlight:     359,
      note:          'Etwas günstiger als Dubai, aber immer noch premium.'
    },

    beach: {
      score:      3,
      label:      'Ruhige Strandlagen',
      type:       'Weißer Sandstrand & ruhiges Wasser',
      highlights: ['Saadiyat Beach', 'Corniche Beach', 'Yas Beach', 'Al Reem Island']
    },

    nature: {
      score:      2,
      label:      'Wüste & Küste',
      highlights: ['Rub al Khali Wüste', 'Al Ain Oase (UNESCO)', 'Mangrove-Wälder', 'Liwa-Oase']
    },

    activities: ['Louvre Abu Dhabi', 'Sheikh-Zayed-Moschee', 'Ferrari World', 'Wüstensafari', 'Formel 1 (Yas Marina Circuit)', 'Warner Bros. World'],

    flightFromDE: {
      duration: '7:00',
      label:    'ca. 7h 00min'
    },

    scores: {
      family:    4,
      couple:    4,
      solo:      3,
      party:     2,
      culture:   5,
      nature:    2,
      beach:     3,
      adventure: 3
    },

    ctaCards: [
      {
        label:    'Luxushotels in Abu Dhabi – Top 4 im Vergleich',
        type:     'luxury',
        giataIds: [null, null, null, null]
      },
      {
        label:    'Familienhotels Abu Dhabi (Yas Island) vergleichen',
        type:     'family',
        giataIds: [null, null, null, null]
      }
    ]
  }

};


/* ─────────────────────────────────────────────────
   2. PAIR DATA
   Paar-spezifische Metadaten: SEO + Default-KI-Fazit
   Schlüssel = "<destA-id>-vs-<destB-id>" (alphabetisch)
   ───────────────────────────────────────────────── */

var PAIRS = {

  'mallorca-vs-kreta': {
    destA: 'mallorca',
    destB: 'kreta',
    seoTitle:       'Mallorca oder Kreta 2026? Der ultimative Vergleich | JetztBuchbar',
    seoDescription: 'Mallorca vs. Kreta 2026: Preise, Strände, Aktivitäten und Reisezeit im direkten Vergleich – mit KI-Empfehlung für deinen Urlaubstyp.',
    default_ki_fazit: 'Mallorca begeistert mit lebhaftem Nachtleben und perfekt erschlossenen Stränden – Kreta punktet mit wildromantischer Natur, authentischer Küche und deutlich günstigeren Preisen. Wer Tiefe und Ursprünglichkeit sucht, liegt mit Kreta richtig.',
    h1:             'Mallorca oder Kreta?',
    h1Sub:          'Der direkte Vergleich für 2026',
    introText:      'Mallorca und Kreta gehören zu den beliebtesten Urlaubsinseln Europas – doch sie könnten kaum unterschiedlicher sein. Während Mallorca mit Party, Infrastruktur und Top-Service lockt, überzeugt Kreta mit Authentizität, Wanderparadiesen und unberührten Buchten.'
  },

  'dubai-vs-abudhabi': {
    destA: 'dubai',
    destB: 'abudhabi',
    seoTitle:       'Dubai oder Abu Dhabi 2026? Vergleich für Urlauber | JetztBuchbar',
    seoDescription: 'Dubai vs. Abu Dhabi 2026: Welche Emirate-Stadt passt besser zu dir? Preise, Aktivitäten und Atmosphäre im direkten Vergleich.',
    default_ki_fazit: 'Dubai zieht mit weltbekannten Attraktionen und pulsierendem Stadtleben – Abu Dhabi überrascht mit tieferer Kultur, dem Louvre und ruhigerer Atmosphäre. Für die erste VAE-Reise ist Dubai die klarere Wahl, für Wiederkehrer lohnt sich Abu Dhabi.',
    h1:             'Dubai oder Abu Dhabi?',
    h1Sub:          'Welche Emirate-Stadt passt zu dir?',
    introText:      'Beide Städte liegen nur 140 km auseinander und doch trennen sie Welten: Dubai ist Showman und Rekordbrecher, Abu Dhabi die kultivierte Hauptstadt mit echtem Kulturgewicht.'
  },

  'tuerkei-vs-aegypten': {
    destA: 'tuerkei',
    destB: 'aegypten',
    seoTitle:       'Türkei oder Ägypten 2026? Kompletter Vergleich | JetztBuchbar',
    seoDescription: 'Türkei vs. Ägypten 2026: Preise, Strände, Reisezeit und Aktivitäten im Vergleich – mit automatischer Empfehlung für deinen Urlaubstyp.',
    default_ki_fazit: 'Die Türkei bietet das vielfältigere Gesamtpaket mit Top-Infrastruktur und traumhafter Küstenlandschaft. Ägypten gewinnt beim Preis und beim Taucherlebnis – wer Unterwasser-Abenteuer sucht, hat in Ägypten die Nase vorn.',
    h1:             'Türkei oder Ägypten?',
    h1Sub:          'Welches Reiseziel passt 2026 besser zu dir?',
    introText:      'Türkei und Ägypten zählen zu den günstigsten Urlaubszielen aus Deutschland – aber welches ist das bessere? Der Vergleich zeigt: Es kommt ganz auf deinen Reisetyp an.'
  }

};


/* ─────────────────────────────────────────────────
   3. SCORE-LABEL MAP
   ───────────────────────────────────────────────── */

var TRAVEL_TYPES = [
  { key: 'family',    label: 'Familie',  icon: '👨‍👩‍👧' },
  { key: 'couple',    label: 'Pärchen',  icon: '💑' },
  { key: 'beach',     label: 'Strand',   icon: '🏖️' },
  { key: 'culture',   label: 'Kultur',   icon: '🏛️' },
  { key: 'adventure', label: 'Abenteuer',icon: '🧗' },
  { key: 'nature',    label: 'Natur',    icon: '🌿' },
  { key: 'party',     label: 'Party',    icon: '🎉' }
];

var SCORE_LABELS = {
  1: 'Gering',
  2: 'Unter Mittel',
  3: 'Mittel',
  4: 'Gut',
  5: 'Hervorragend'
};

var BUDGET_LABELS = {
  1: { label: 'Sehr günstig',  desc: 'Ideal für Budgetreisende' },
  2: { label: 'Günstig',       desc: 'Gutes Preis-Leistungs-Verhältnis' },
  3: { label: 'Mittel',        desc: 'Durchschnittliches Preisniveau' },
  4: { label: 'Gehoben',       desc: 'Etwas teurer, dafür mehr Komfort' },
  5: { label: 'Premium',       desc: 'Luxussegment – für besondere Anlässe' }
};


/* ─────────────────────────────────────────────────
   4. HELPER: CTA URL BUILDER
   Baut den /?hotels=... Link für den Hotel-Vergleich
   ───────────────────────────────────────────────── */

function buildHotelCompareUrl(giataIds) {
  var validIds = (giataIds || []).filter(function (id) { return id !== null; });
  if (validIds.length === 0) return '/#panel-vergleich';
  return '/?hotels=' + validIds.join(',');
}


/* ─────────────────────────────────────────────────
   5. EXPORTS (kompatibel mit Browser-<script> und Node.js)
   ───────────────────────────────────────────────── */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DESTINATIONS: DESTINATIONS, PAIRS: PAIRS, TRAVEL_TYPES: TRAVEL_TYPES, SCORE_LABELS: SCORE_LABELS, BUDGET_LABELS: BUDGET_LABELS, buildHotelCompareUrl: buildHotelCompareUrl };
} else {
  window.JB = window.JB || {};
  window.JB.DESTINATIONS        = DESTINATIONS;
  window.JB.PAIRS               = PAIRS;
  window.JB.TRAVEL_TYPES        = TRAVEL_TYPES;
  window.JB.SCORE_LABELS        = SCORE_LABELS;
  window.JB.BUDGET_LABELS       = BUDGET_LABELS;
  window.JB.buildHotelCompareUrl = buildHotelCompareUrl;
}
