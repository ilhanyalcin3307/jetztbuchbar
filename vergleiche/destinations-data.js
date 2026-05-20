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
    heroImage: 'https://images.unsplash.com/photo-1517670660212-61ed0b4fe8f9?w=1200&q=80',

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
        giataIds: ['96636', '41437', '574183', '574182']  // Zoëtry, Zafiro, Hipotels Gran Playa, Hipotels Palace
      },
      {
        label:    'Top Strandhotels auf Mallorca – direkt vergleichen',
        type:     'beach',
        giataIds: ['96636', '41437', '574183', '574182']
      },
      {
        label:    'Luxushotels auf Mallorca im Vergleich',
        type:     'luxury',
        giataIds: ['96636', '41437', '574183', '574182']
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
    heroImage: 'https://images.unsplash.com/photo-1558870964-72e29d300edd?w=1200&q=80',

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
        giataIds: ['10958', '69354', '1370666', '90067']  // Georgioupolis, Cook's Club, Chania Hotel, Grecotel
      },
      {
        label:    'Top All-Inclusive Hotels auf Kreta im Vergleich',
        type:     'allinclusive',
        giataIds: ['10958', '69354', '1370666', '90067']
      },
      {
        label:    'Strandhotels auf Kreta – 4 auf einen Blick vergleichen',
        type:     'beach',
        giataIds: ['10958', '69354', '1370666', '90067']
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
    heroImage: 'https://images.unsplash.com/photo-1648644769787-6e4f77f26703?w=1200&q=80',

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
        giataIds: ['42194', '232017', '78826', '247666']  // Rixos, Maxx Royal, Adam & Eve, Armas Life Belek
      },
      {
        label:    'Luxus-Resorts Türkei – direkt nebeneinander vergleichen',
        type:     'luxury',
        giataIds: ['42194', '232017', '78826', '247666']
      },
      {
        label:    'Familienhotels Türkei – Top 4 im Direktvergleich',
        type:     'family',
        giataIds: ['42194', '232017', '78826', '247666']
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
    heroImage: 'https://images.unsplash.com/photo-1761159948642-a08717c17560?w=1200&q=80',

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
    heroImage: 'https://images.unsplash.com/photo-1647886056843-d2fc10e57cd4?w=1200&q=80',

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

  /* ── GRIECHENLAND (Griechische Inseln) ── */
  griechenland: {
    id: 'griechenland',
    name: 'Griechenland',
    country: 'Griechenland',
    flag: '🇬🇷',
    tagline: 'Trauminseln, antike Geschichte und kulinarische Wunder',
    url: '/griechenland/',
    hotelUrl: null,
    heroImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80',
    bestSeason: {
      label: 'Mai – Oktober',
      peak:  'Juli – August',
      score: 4,
      tip:   'Mai und September: Top-Wetter, deutlich weniger Touristen auf den Inseln.'
    },
    budget: {
      score:         2,
      label:         'Günstig–Mittel',
      avgHotelNight: 80,
      avgFlight:     95,
      note:          'Santorini und Mykonos deutlich teurer als Kreta oder Rhodos.'
    },
    beach: {
      score:      5,
      label:      'Ikonische Traumstrände',
      type:       'Vulkansand & Kieselbucht',
      highlights: ['Red Beach (Santorini)', 'Psarou (Mykonos)', 'Navagio (Zakynthos)', 'Myrtos (Kefalonia)']
    },
    nature: {
      score:      4,
      label:      'Inseln & Vulkane',
      highlights: ['Santorini Caldera', 'Olymp-Nationalpark', 'Zakynthos Meeresschildkröten', 'Meteora-Felsen']
    },
    activities: ['Inselhüpfen', 'Wassersport', 'Antike Ausgrabungen', 'Weinverkostung', 'Bootstouren', 'Kulinarik', 'Wandern'],
    flightFromDE: {
      duration: '3:00',
      label:    'ca. 3h 00min'
    },
    scores: {
      family:    4,
      couple:    5,
      solo:      4,
      party:     4,
      culture:   5,
      nature:    4,
      beach:     5,
      adventure: 3
    },
    ctaCards: [
      { label: 'Top Strandhotels in Griechenland vergleichen', type: 'beach', giataIds: [null, null, null, null] },
      { label: 'Romantische Pärchen-Hotels in Griechenland',   type: 'couple', giataIds: [null, null, null, null] }
    ]
  },

  /* ── KROATIEN ── */
  kroatien: {
    id: 'kroatien',
    name: 'Kroatien',
    country: 'Kroatien',
    flag: '🇭🇷',
    tagline: 'Kristallklares Adriatisches Meer und UNESCO-Altstädte',
    url: '/kroatien/',
    hotelUrl: null,
    heroImage: 'https://images.unsplash.com/photo-1612621450155-a574ebb71f9e?w=1200&q=80',
    bestSeason: {
      label: 'Juni – September',
      peak:  'Juli – August',
      score: 4,
      tip:   'Juni und September: Ideales Wetter ohne die August-Massen. Plitvicer Seen am schönsten im Frühjahr.'
    },
    budget: {
      score:         3,
      label:         'Mittel',
      avgHotelNight: 88,
      avgFlight:     89,
      note:          'Dubrovnik teurer als Split oder Zadar. Im Inselbereich günstiger.'
    },
    beach: {
      score:      5,
      label:      'Klarster Strand Europas',
      type:       'Kieselstrand & Felsbucht',
      highlights: ['Zlatni Rat (Brač)', 'Stiniva (Vis)', 'Punta Rata (Brela)', 'Sakarun (Dugi Otok)']
    },
    nature: {
      score:      5,
      label:      'Nationalparks & Inseln',
      highlights: ['Plitvicer Seen (UNESCO)', 'Krka-Wasserfälle', '1.200 Inseln', 'Paklenica-Nationalpark']
    },
    activities: ['Inselhüpfen', 'Kajakfahren', 'Wandern', 'Tauchen', 'Historische Altstädte', 'Segeltouren', 'Wassersport'],
    flightFromDE: {
      duration: '1:50',
      label:    'ca. 1h 50min'
    },
    scores: {
      family:    4,
      couple:    4,
      solo:      4,
      party:     3,
      culture:   4,
      nature:    5,
      beach:     5,
      adventure: 5
    },
    ctaCards: [
      { label: 'Top Strandhotels in Kroatien vergleichen',    type: 'beach',     giataIds: [null, null, null, null] },
      { label: 'Abenteuer-Hotels in Kroatien vergleichen',    type: 'adventure',  giataIds: [null, null, null, null] }
    ]
  },

  /* ── PORTUGAL ── */
  portugal: {
    id: 'portugal',
    name: 'Portugal',
    country: 'Portugal',
    flag: '🇵🇹',
    tagline: 'Atlantische Küsten, Surfer-Paradiese und Fado-Feeling',
    url: '/portugal/',
    hotelUrl: null,
    heroImage: 'https://images.unsplash.com/photo-1630163263856-8652d9e78194?w=1200&q=80',
    bestSeason: {
      label: 'Mai – Oktober',
      peak:  'Juli – August',
      score: 4,
      tip:   'Algarve: Jun–Sep ideal. Lissabon und Porto ganzjährig angenehm. Mai besonders grün.'
    },
    budget: {
      score:         2,
      label:         'Günstig–Mittel',
      avgHotelNight: 79,
      avgFlight:     72,
      note:          'Günstiger als Spanien, besonders abseits von Lissabon und Lagos.'
    },
    beach: {
      score:      4,
      label:      'Atlantik-Traumstrände',
      type:       'Goldgelber Sandstrand & Klippen',
      highlights: ['Praia da Marinha', 'Benagil-Grotte', 'Praia da Arrifana', 'Sagres']
    },
    nature: {
      score:      4,
      label:      'Klippen & Weinberge',
      highlights: ['Douro-Tal (UNESCO)', 'Algarve-Klippen', 'Serra da Arrábida', 'Azoren-Inseln']
    },
    activities: ['Surfen', 'Wandern', 'Weintouren', 'Kultur & Museen', 'Bootstouren', 'Fado erleben', 'Golfurlaub'],
    flightFromDE: {
      duration: '2:40',
      label:    'ca. 2h 40min'
    },
    scores: {
      family:    4,
      couple:    5,
      solo:      5,
      party:     3,
      culture:   5,
      nature:    4,
      beach:     4,
      adventure: 4
    },
    ctaCards: [
      { label: 'Top Hotels in Portugal vergleichen',             type: 'beach',  giataIds: [null, null, null, null] },
      { label: 'Romantische Hotels Portugal – Direktvergleich',  type: 'couple', giataIds: [null, null, null, null] }
    ]
  },

  /* ── MAROKKO ── */
  marokko: {
    id: 'marokko',
    name: 'Marokko',
    country: 'Marokko',
    flag: '🇲🇦',
    tagline: '1001 Nacht: Medinas, Sahara und atlantische Surfwellen',
    url: '/marokko/',
    hotelUrl: null,
    heroImage: 'https://images.unsplash.com/photo-1663167529628-4050fc9a15f7?w=1200&q=80',
    bestSeason: {
      label: 'März – Mai & Sep – Nov',
      peak:  'April',
      score: 3,
      tip:   'Sommer in Marrakesch bis 44°C – meiden! Küstenorte Agadir und Essaouira auch im Sommer erträglich.'
    },
    budget: {
      score:         1,
      label:         'Sehr günstig',
      avgHotelNight: 45,
      avgFlight:     89,
      note:          'Eines der günstigsten Reiseziele. Riad-Hotels bieten außergewöhnliches Preis-Leistungs-Verhältnis.'
    },
    beach: {
      score:      3,
      label:      'Atlantische Surfer-Strände',
      type:       'Atlantiksandstrand',
      highlights: ['Agadir Strand', 'Essaouira', 'Legzira Bögen', 'Taghazout (Surfen)']
    },
    nature: {
      score:      5,
      label:      'Sahara, Atlas & Küste',
      highlights: ['Sahara-Dünen (Merzouga)', 'Atlas-Gebirge', 'Dades-Schlucht', 'Draa-Tal mit Dattelpalmen']
    },
    activities: ['Medina-Erkundung', 'Sahara-Kameltour', 'Hammam & Spa', 'Surfen', 'Wandern (Atlas)', 'Souk-Shopping', 'Kochkurs'],
    flightFromDE: {
      duration: '3:30',
      label:    'ca. 3h 30min'
    },
    scores: {
      family:    3,
      couple:    5,
      solo:      5,
      party:     1,
      culture:   5,
      nature:    5,
      beach:     3,
      adventure: 5
    },
    ctaCards: [
      { label: 'Top Riad-Hotels in Marokko vergleichen',   type: 'culture', giataIds: [null, null, null, null] },
      { label: 'Strandhotels Agadir – Direktvergleich',    type: 'beach',   giataIds: [null, null, null, null] }
    ]
  },

  /* ── ZYPERN ── */
  zypern: {
    id: 'zypern',
    name: 'Zypern',
    country: 'Zypern',
    flag: '🇨🇾',
    tagline: 'Aphrodites Insel – 350 Sonnentage und antike Götter',
    url: '/zypern/',
    hotelUrl: null,
    heroImage: 'https://images.unsplash.com/photo-1664993118495-6647529d58d5?w=1200&q=80',
    bestSeason: {
      label: 'April – November',
      peak:  'Juli – August',
      score: 5,
      tip:   'April–Juni: Blühende Landschaft, angenehme Temperaturen. Oktober: Warm zum Tauchen.'
    },
    budget: {
      score:         3,
      label:         'Mittel',
      avgHotelNight: 82,
      avgFlight:     112,
      note:          'Limassol ist teurer. Paphos und Ayia Napa bieten günstigere Optionen.'
    },
    beach: {
      score:      5,
      label:      'Traumstrände & Klares Wasser',
      type:       'Feiner Sandstrand & Felsküste',
      highlights: ['Nissi Beach (Ayia Napa)', 'Blue Lagoon (Akamas)', 'Coral Bay (Paphos)', 'Aphrodite Hills Beach']
    },
    nature: {
      score:      3,
      label:      'Berge & Mittelmeer',
      highlights: ['Troodos-Gebirge', 'Akamas-Nationalpark', 'Aphrodite-Felsen', 'Zederntal']
    },
    activities: ['Tauchen & Schnorcheln', 'Antike Stätten (Paphos UNESCO)', 'Nachtleben Ayia Napa', 'Wandern (Troodos)', 'Weinverkostung', 'Jeep-Safari'],
    flightFromDE: {
      duration: '3:50',
      label:    'ca. 3h 50min'
    },
    scores: {
      family:    4,
      couple:    4,
      solo:      3,
      party:     4,
      culture:   4,
      nature:    3,
      beach:     5,
      adventure: 3
    },
    ctaCards: [
      { label: 'Top Strandhotels auf Zypern vergleichen', type: 'beach',  giataIds: [null, null, null, null] },
      { label: 'Luxushotels Zypern – Direktvergleich',    type: 'luxury', giataIds: [null, null, null, null] }
    ]
  },

  /* ── MALTA ── */
  malta: {
    id: 'malta',
    name: 'Malta',
    country: 'Malta',
    flag: '🇲🇹',
    tagline: 'Ritterfestungen, Blaue Lagune und antike Megalithtempel',
    url: '/malta/',
    hotelUrl: null,
    heroImage: 'https://images.unsplash.com/photo-1730190206154-66bf41958e62?w=1200&q=80',
    bestSeason: {
      label: 'April – Oktober',
      peak:  'Juni – September',
      score: 4,
      tip:   'April–Juni: Mild, günstigere Preise. Sep–Okt: Warmes Meer, wenige Touristen.'
    },
    budget: {
      score:         3,
      label:         'Mittel',
      avgHotelNight: 85,
      avgFlight:     109,
      note:          "St. Julian's ist teurer. Außerhalb der Hochsaison deutlich günstiger."
    },
    beach: {
      score:      4,
      label:      'Türkises Mittelmeerwasser',
      type:       'Felsbuchten & Sandstrände',
      highlights: ["Blue Lagoon (Comino)", 'Golden Bay', 'Mellieħa Bay', "St. Peter's Pool"]
    },
    nature: {
      score:      3,
      label:      'Klippen & Buchten',
      highlights: ['Comino Insel', 'Dingli Cliffs', 'Gnejna Bay', 'Popeye Village']
    },
    activities: ['Tauchen (weltbekannte Wracks)', 'Valletta UNESCO-Altstadt', 'Bootstouren', 'Sprachreise', 'Nachtleben (Paceville)', 'Segeln', 'Historische Tempel'],
    flightFromDE: {
      duration: '2:30',
      label:    'ca. 2h 30min'
    },
    scores: {
      family:    3,
      couple:    4,
      solo:      5,
      party:     4,
      culture:   5,
      nature:    3,
      beach:     4,
      adventure: 4
    },
    ctaCards: [
      { label: 'Top Hotels auf Malta vergleichen',    type: 'culture', giataIds: [null, null, null, null] },
      { label: 'Strandhotels Malta – Direktvergleich', type: 'beach',   giataIds: [null, null, null, null] }
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
  },

  'griechenland-vs-kroatien': {
    destA: 'griechenland',
    destB: 'kroatien',
    seoTitle:       'Griechenland oder Kroatien 2026? Der ultimative Vergleich | JetztBuchbar',
    seoDescription: 'Griechenland vs. Kroatien 2026: Strände, Preise, Natur und Aktivitäten im direkten Vergleich – mit KI-Empfehlung für deinen Urlaubstyp.',
    default_ki_fazit: 'Griechenland überzeugt mit ikonischen Sonnenuntergängen, antikem Erbe und malerischen weißen Dörfern. Kroatien punktet mit dem kristallklarsten Meerwasser Europas, spektakulären Nationalparks und kürzerem Flug. Naturliebhaber wählen Kroatien – Romantikreisende Griechenland.',
    h1:             'Griechenland oder Kroatien?',
    h1Sub:          'Mittelmeer-Duell 2026',
    introText:      'Beide Länder locken mit traumhaften Küsten und reicher Geschichte – doch der Charakter ist grundverschieden. Griechenland begeistert mit ikonischen Inseln und antikem Erbe, Kroatien mit Nationalparks, Wasserfällen und dem klarsten Meerwasser Europas.'
  },

  'portugal-vs-marokko': {
    destA: 'portugal',
    destB: 'marokko',
    seoTitle:       'Portugal oder Marokko 2026? Vergleich für Urlauber | JetztBuchbar',
    seoDescription: 'Portugal vs. Marokko 2026: Atlantikküsten vs. 1001-Nacht-Erlebnis – Preise, Strände und Kultur im direkten Vergleich.',
    default_ki_fazit: 'Portugal bietet entspannten Atlantik-Lifestyle mit Top-Surfspots und lebendigen Städten. Marokko entführt in eine fremde Welt aus Souks, Sahara-Dünen und aromatischer Küche. Beide liegen nur wenige Flugstunden auseinander – aber der Unterschied könnte kaum größer sein.',
    h1:             'Portugal oder Marokko?',
    h1Sub:          'Atlantik trifft Nordafrika – 2026',
    introText:      'Portugal und Marokko trennt nur die Meerenge von Gibraltar – und doch sind die Welten völlig verschieden. Während Portugal mit Fado, Pastéis de Nata und sanften Klippen lockt, wartet Marokko mit Medinas, Kamelkarawanen und der endlosen Sahara.'
  },

  'zypern-vs-malta': {
    destA: 'zypern',
    destB: 'malta',
    seoTitle:       'Zypern oder Malta 2026? Vergleich der Inselperlen | JetztBuchbar',
    seoDescription: 'Zypern vs. Malta 2026: Zwei Inselstaaten im Direktvergleich – Strände, Geschichte, Preise und Reisezeit.',
    default_ki_fazit: 'Zypern begeistert mit 350 Sonnentagen, mehr Platz und längeren Strandtagen. Malta überpunktet bei Kulturtiefe, weltberühmtem Tauchen und dem einzigartigen Flair seiner UNESCO-Weltstädte. Für Strandurlaub: Zypern – für Kultur & Tauchen: Malta.',
    h1:             'Zypern oder Malta?',
    h1Sub:          'Welche Mittelmeers-Insel 2026?',
    introText:      'Zypern und Malta – zwei kleine Inselstaaten im östlichen Mittelmeer, oft verwechselt, aber grundverschieden. Zypern bietet Platz für alles: Berge, Strände und Städte. Malta beeindruckt mit einer Dichte an Geschichte, die ihresgleichen sucht.'
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
