'use strict';
// Rewrites all dest-cards in index.html with thumbnail images
const fs = require('fs');
const path = require('path');

const INDEX = path.join(__dirname, '..', 'index.html');

// Mapping: href → { img (short Unsplash URL), alt, flag, title, sub, badge }
const CARDS = {
  // === DESTINATIONS section (14 cards) ===
  'tuerkei.html':       { img:'https://images.unsplash.com/photo-1651160020454-e4e47579da6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Türkei Strand', flag:'🇹🇷', title:'Türkei', sub:'Antalya, Istanbul, Bodrum', badge:'Ab 299 €' },
  'spanien.html':       { img:'https://images.unsplash.com/photo-1509304890243-11f891c4270c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Spanien Meer', flag:'🇪🇸', title:'Spanien', sub:'Mallorca, Teneriffa, Barcelona', badge:'Ab 249 €' },
  'griechenland.html':  { img:'https://images.unsplash.com/photo-1622778859697-e9eec6e1743e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Griechenland Santorini', flag:'🇬🇷', title:'Griechenland', sub:'Kreta, Santorini, Rhodos', badge:'Ab 279 €' },
  'aegypten.html':      { img:'https://images.unsplash.com/photo-1618582240632-1937f4c91d7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Ägypten Rotes Meer', flag:'🇪🇬', title:'Ägypten', sub:'Hurghada, Sharm el-Sheikh', badge:'Ab 389 €' },
  'marokko.html':       { img:'https://images.unsplash.com/photo-1663167529628-4050fc9a15f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Marokko Landschaft', flag:'🇲🇦', title:'Marokko', sub:'Marrakesch, Agadir, Essaouira', badge:'Ab 349 €' },
  'dubai.html':         { img:'https://images.unsplash.com/photo-1647886056843-d2fc10e57cd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Dubai Skyline', flag:'🇦🇪', title:'Dubai', sub:'Burj Khalifa, JBR Beach, Wüste', badge:'Ab 549 €' },
  'kroatien.html':      { img:'https://images.unsplash.com/photo-1612621450155-a574ebb71f9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Kroatien Küste', flag:'🇭🇷', title:'Kroatien', sub:'Dubrovnik, Split, Hvar', badge:'Ab 329 €' },
  'portugal.html':      { img:'https://images.unsplash.com/photo-1630163263856-8652d9e78194?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Portugal Landschaft', flag:'🇵🇹', title:'Portugal', sub:'Lissabon, Algarve, Porto', badge:'Ab 299 €' },
  'tunesien.html':      { img:'https://images.unsplash.com/photo-1556011572-b9c800494766?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Tunesien Strand', flag:'🇹🇳', title:'Tunesien', sub:'Djerba, Hammamet, Sousse', badge:'Ab 279 €' },
  'bulgarien.html':     { img:'https://images.unsplash.com/photo-1683653417446-0c7009151621?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Bulgarien Strand', flag:'🇧🇬', title:'Bulgarien', sub:'Sonnenstrand, Sofia, Varna', badge:'Ab 199 €' },
  'malta.html':         { img:'https://images.unsplash.com/photo-1730190206154-66bf41958e62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Malta Mittelmeer', flag:'🇲🇹', title:'Malta', sub:'Valletta, Gozo, Blue Lagoon', badge:'Ab 319 €' },
  'zypern.html':        { img:'https://images.unsplash.com/photo-1664993118495-6647529d58d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Zypern Strand', flag:'🇨🇾', title:'Zypern', sub:'Paphos, Ayia Napa, Limassol', badge:'Ab 309 €' },
  'kap-verde.html':     { img:'https://images.unsplash.com/photo-1621944668311-7a97c80f0190?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Kap Verde Strand', flag:'🇨🇻', title:'Kap Verde', sub:'Sal, Boa Vista, Santiago', badge:'Ab 499 €' },
  'jordanien.html':     { img:'https://images.unsplash.com/photo-1662747974561-f2f5ea3825a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Jordanien Petra', flag:'🇯🇴', title:'Jordanien', sub:'Petra, Wadi Rum, Totes Meer', badge:'Ab 449 €' },

  // === STÄDTE section (8 cards) ===
  'antalya.html':       { img:'https://images.unsplash.com/photo-1648644769787-6e4f77f26703?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Antalya', flag:'🌊', title:'Antalya', sub:'Türkische Riviera', badge:'Strandurlaub' },
  'bodrum.html':        { img:'https://images.unsplash.com/photo-1591078314943-85c674b3789b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Bodrum', flag:'⛵', title:'Bodrum', sub:'Ägäis, Türkei', badge:'Exklusiv' },
  'kreta-urlaub.html':  { img:'https://images.unsplash.com/photo-1558870964-72e29d300edd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Kreta', flag:'🏔️', title:'Kreta', sub:'Heraklion, Chania, Elounda', badge:'Griechenland' },
  'santorini-urlaub.html':{ img:'https://images.unsplash.com/photo-1664112115778-0ed2f2da97e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Santorini', flag:'🌅', title:'Santorini', sub:'Oia, Fira, Perissa', badge:'Romantisch' },
  'algarve.html':       { img:'https://images.unsplash.com/photo-1658437192420-13cd43bbe2bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Algarve', flag:'🏖️', title:'Algarve', sub:'Lagos, Albufeira, Faro', badge:'Portugal' },
  'costa-brava.html':   { img:'https://images.unsplash.com/photo-1767622656415-e07aac72bda4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Costa Brava', flag:'🌞', title:'Costa Brava', sub:'Lloret, Tossa de Mar, Girona', badge:'Spanien' },
  'bodensee-region.html':{ img:'https://images.unsplash.com/photo-1767731415424-00a0eb1a7f18?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Bodensee', flag:'🏞️', title:'Bodensee', sub:'Konstanz, Lindau, Bregenz', badge:'Deutschland' },
  'amalfikueste.html':  { img:'https://images.unsplash.com/photo-1657920941055-75b08c891143?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Amalfiküste', flag:'🍋', title:'Amalfiküste', sub:'Positano, Amalfi, Ravello', badge:'Italien' },

  // === THEMEN section (4 cards) ===
  'last-minute-urlaub.html':    { img:'https://images.unsplash.com/photo-1724862473431-b811086538d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Last Minute Urlaub', flag:'⚡', title:'Last Minute', sub:'Spontan verreisen & sparen', badge:'Jetzt sparen' },
  'all-inclusive-urlaub.html':  { img:'https://images.unsplash.com/photo-1597172173960-b8da219af0ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'All Inclusive Hotel', flag:'🍹', title:'All Inclusive', sub:'Rundum-sorglos-Urlaub', badge:'Top Resorts' },
  'urlaub-mit-kindern.html':    { img:'https://images.unsplash.com/photo-1724862473431-b811086538d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Familienurlaub am Strand', flag:'👨‍👩‍👧‍👦', title:'Familienurlaub', sub:'Urlaub mit Kindern', badge:'Familientipps' },
  'flitterwochen.html':         { img:'https://images.unsplash.com/photo-1621944668311-7a97c80f0190?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Flitterwochen Strand', flag:'💑', title:'Flitterwochen', sub:'Romantische Traumziele', badge:'Traumreise' },

  // === REISEZEITEN section (8 cards) ===
  'beste-reisezeit-tuerkei.html':      { img:'https://images.unsplash.com/photo-1694712646806-ec213a1005af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reisezeit Türkei', flag:'🗓️', title:'Türkei', sub:'Beste Reisezeit', badge:'Reisezeit' },
  'beste-reisezeit-spanien.html':      { img:'https://images.unsplash.com/photo-1589667882371-a531d1db0987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reisezeit Spanien', flag:'🗓️', title:'Spanien', sub:'Beste Reisezeit', badge:'Reisezeit' },
  'beste-reisezeit-griechenland.html': { img:'https://images.unsplash.com/photo-1668691030690-ffa1bfb4ed6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reisezeit Griechenland', flag:'🗓️', title:'Griechenland', sub:'Beste Reisezeit', badge:'Reisezeit' },
  'beste-reisezeit-aegypten.html':     { img:'https://images.unsplash.com/photo-1639752652780-be701b9d8def?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reisezeit Ägypten', flag:'🗓️', title:'Ägypten', sub:'Beste Reisezeit', badge:'Reisezeit' },
  'beste-reisezeit-marokko.html':      { img:'https://images.unsplash.com/photo-1663167529628-4050fc9a15f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reisezeit Marokko', flag:'🗓️', title:'Marokko', sub:'Beste Reisezeit', badge:'Reisezeit' },
  'beste-reisezeit-dubai.html':        { img:'https://images.unsplash.com/photo-1647886056843-d2fc10e57cd4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reisezeit Dubai', flag:'🗓️', title:'Dubai', sub:'Beste Reisezeit', badge:'Reisezeit' },
  'beste-reisezeit-portugal.html':     { img:'https://images.unsplash.com/photo-1630163263856-8652d9e78194?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reisezeit Portugal', flag:'🗓️', title:'Portugal', sub:'Beste Reisezeit', badge:'Reisezeit' },
  'beste-reisezeit-malta.html':        { img:'https://images.unsplash.com/photo-1730190206154-66bf41958e62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reisezeit Malta', flag:'🗓️', title:'Malta', sub:'Beste Reisezeit', badge:'Reisezeit' },

  // === HOTELS section (5 cards) ===
  'hotels-antalya.html':   { img:'https://images.unsplash.com/photo-1730196568851-382fa149eaa3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Hotels Antalya', flag:'🏨', title:'Hotels Antalya', sub:'Bestbewertete Resorts', badge:'Türkei' },
  'hotels-dubai.html':     { img:'https://images.unsplash.com/photo-1597172173960-b8da219af0ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Hotels Dubai', flag:'🏨', title:'Hotels Dubai', sub:'Luxus am Persischen Golf', badge:'Luxus' },
  'hotels-kreta.html':     { img:'https://images.unsplash.com/photo-1663529472561-a6ea9e09369a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Hotels Kreta', flag:'🏨', title:'Hotels Kreta', sub:'Griechische Gastfreundschaft', badge:'Griechenland' },
  'hotels-mallorca.html':  { img:'https://images.unsplash.com/photo-1623068769255-923b5307dd7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Hotels Mallorca', flag:'🏨', title:'Hotels Mallorca', sub:'Strand & Komfort', badge:'Spanien' },
  'hotels-lissabon.html':  { img:'https://images.unsplash.com/photo-1531911120215-9f628dc6e9fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Hotels Lissabon', flag:'🏨', title:'Hotels Lissabon', sub:'Charme & Flair', badge:'Portugal' },

  // === AKTIVITÄTEN section (5 cards) ===
  'schnorcheln-kreta.html':    { img:'https://images.unsplash.com/photo-1467044705596-744699fa8931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Schnorcheln Kreta', flag:'🤿', title:'Schnorcheln Kreta', sub:'Kristallklares Wasser', badge:'Wassersport' },
  'tauchen-malta.html':        { img:'https://images.unsplash.com/photo-1730190206154-66bf41958e62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Tauchen Malta', flag:'🤿', title:'Tauchen Malta', sub:'Unterwasserwelten', badge:'Tauchen' },
  'wuestensafari-dubai.html':  { img:'https://images.unsplash.com/photo-1638024510305-c36fcc0bf3b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Wüstensafari Dubai', flag:'🐪', title:'Wüstensafari Dubai', sub:'Abenteuer in der Wüste', badge:'Abenteuer' },
  'wandern-kroatien.html':     { img:'https://images.unsplash.com/photo-1700571552167-49641e9e026e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Wandern Kroatien', flag:'🥾', title:'Wandern Kroatien', sub:'Nationalparks & Natur', badge:'Natur' },
  'surfen-kap-verde.html':     { img:'https://images.unsplash.com/photo-1651666990398-5585ad2c9eac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Surfen Kap Verde', flag:'🏄', title:'Surfen Kap Verde', sub:'Atlantische Wellen', badge:'Surfen' },

  // === REISETIPPS section (4 cards) ===
  'handgepaeck-regeln.html':         { img:'https://images.unsplash.com/photo-1506253413221-3a168cc7b3b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Handgepäck Regeln', flag:'🧳', title:'Handgepäck Regeln', sub:'Alles was erlaubt ist', badge:'Ratgeber' },
  'reiseversicherung-vergleich.html':{ img:'https://images.unsplash.com/photo-1565084247761-48f601e1b5ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Reiseversicherung', flag:'🛡️', title:'Reiseversicherung', sub:'Sicher unterwegs', badge:'Vergleich' },
  'packliste-sommerurlaub.html':     { img:'https://images.unsplash.com/photo-1712256663682-3287af4e920e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Packliste Sommerurlaub', flag:'📋', title:'Packliste', sub:'Sommerurlaub Checkliste', badge:'Checkliste' },
  'guenstig-fliegen-tipps.html':     { img:'https://images.unsplash.com/photo-1506253413221-3a168cc7b3b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Günstig fliegen', flag:'✈️', title:'Günstig fliegen', sub:'Spartipps für Flüge', badge:'Spartipps' },

  // === VERGLEICHE section (3 cards) ===
  'tuerkei-vs-aegypten.html': { img:'https://images.unsplash.com/photo-1651160020454-e4e47579da6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Türkei vs Ägypten', flag:'⚖️', title:'Türkei vs. Ägypten', sub:'Der große Vergleich', badge:'Vergleich' },
  'mallorca-vs-kreta.html':   { img:'https://images.unsplash.com/photo-1509304890243-11f891c4270c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Mallorca vs Kreta', flag:'⚖️', title:'Mallorca vs. Kreta', sub:'Mediterrane Inseln', badge:'Vergleich' },
  'dubai-vs-abu-dhabi.html':  { img:'https://images.unsplash.com/photo-1606138369267-ff17948d119c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=70', alt:'Dubai vs Abu Dhabi', flag:'⚖️', title:'Dubai vs. Abu Dhabi', sub:'Emirate im Vergleich', badge:'Vergleich' },
};

function makeCard(href, c) {
  if (c.img) {
    return `      <a href="${href}" class="dest-card">
        <div class="dest-thumb-wrap"><img class="dest-thumb" src="${c.img}" alt="${c.alt}" loading="lazy" /></div>
        <div class="dest-card-body">
          <span class="dest-flag">${c.flag}</span>
          <h3>${c.title}</h3>
          <p>${c.sub}</p>
          <span class="dest-badge">${c.badge}</span>
        </div>
      </a>`;
  } else {
    return `      <a href="${href}" class="dest-card">
        <div class="dest-thumb-fallback"><span class="dest-flag">${c.flag}</span></div>
        <div class="dest-card-body">
          <h3>${c.title}</h3>
          <p>${c.sub}</p>
          <span class="dest-badge">${c.badge}</span>
        </div>
      </a>`;
  }
}

let html = fs.readFileSync(INDEX, 'utf8');
let changed = 0;

for (const [href, card] of Object.entries(CARDS)) {
  const newCard = makeCard(href, card);
  
  // Match a dest-card link for this href with either old or new format
  const re = new RegExp(
    `      <a href="${href.replace('.','\\.')}" class="dest-card">(?:[\\s\\S]*?)<\\/a>`,
    ''
  );
  const match = html.match(re);
  if (match) {
    html = html.replace(match[0], newCard);
    changed++;
  } else {
    console.warn(`[WARN] Could not find card for ${href}`);
  }
}

fs.writeFileSync(INDEX, html, 'utf8');
console.log(`[done] Replaced ${changed} cards out of ${Object.keys(CARDS).length}`);
