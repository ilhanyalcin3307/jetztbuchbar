#!/usr/bin/env node
// content-engine/add-city-story-cards.js
// Fügt stadtspezifische Story-Karten auf Länderseiten ein (unterhalb der Klima-Sektion)

'use strict';
const fs   = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

// ── Story-Grid CSS ────────────────────────────────────────────────────────────
const STORY_CSS = `
/* City Story-Grid */
.story-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:.7rem}
.story-card{aspect-ratio:9/16;border-radius:18px;overflow:hidden;position:relative;display:block;text-decoration:none;background:var(--bg-card)}
.story-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .55s cubic-bezier(.25,.46,.45,.94)}
.story-card:hover .story-img{transform:scale(1.06)}
.story-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.35) 42%,transparent 72%)}
.story-top{position:absolute;top:.65rem;left:.65rem;display:flex;align-items:center;gap:.4rem;z-index:2}
.story-flag{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.75);display:flex;align-items:center;justify-content:center;font-size:1rem;background:rgba(0,0,0,.22);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);flex-shrink:0;line-height:1}
.story-name{color:#fff;font-size:.68rem;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,.85);white-space:nowrap}
.story-bottom{position:absolute;bottom:.7rem;left:.65rem;right:.65rem;display:flex;align-items:flex-end;justify-content:space-between;gap:.3rem;z-index:2}
.story-count{color:rgba(255,255,255,.78);font-size:.61rem;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.85)}
.story-btn{background:rgba(255,255,255,.12);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.28);border-radius:99px;padding:.22rem .6rem;color:#fff;font-size:.6rem;font-weight:700;white-space:nowrap;transition:background .2s,border-color .2s;line-height:1.4}
.story-card:hover .story-btn{background:rgba(255,255,255,.26);border-color:rgba(255,255,255,.6)}
@media(max-width:1100px){.story-grid{grid-template-columns:repeat(4,1fr)}}
@media(max-width:720px){.story-grid{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;gap:.6rem;padding-bottom:.5rem;scrollbar-width:none}.story-grid::-webkit-scrollbar{display:none}.story-card{flex:0 0 clamp(130px,40vw,200px);scroll-snap-align:start;border-radius:14px}}`;

// ── Hilfsfunktion: Unsplash-URL ───────────────────────────────────────────────
function img(photoId) {
  return `https://images.unsplash.com/${photoId}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=75`;
}

// ── Länder-Daten ──────────────────────────────────────────────────────────────
const COUNTRIES = [
  {
    folder: 'tuerkei',
    heading: '📍 Städte &amp; Regionen in der <span>Türkei</span>',
    subtitle: 'Von der Ägäis bis Kappadokien – die schönsten Städte und Regionen der Türkei.',
    cities: [
      { href:'/tuerkei/istanbul/',    emoji:'🕌', name:'Istanbul',    img:img('photo-1687706297190-735fe2872d9f') },
      { href:'/tuerkei/antalya/',     emoji:'⛱️', name:'Antalya',     img:img('photo-1648644769787-6e4f77f26703') },
      { href:'/tuerkei/bodrum/',      emoji:'⚓',  name:'Bodrum',      img:img('photo-1591078314943-85c674b3789b') },
      { href:'/tuerkei/kappadokien/', emoji:'🎈', name:'Kappadokien', img:img('photo-1569530593439-c5a3adda5204') },
      { href:'/tuerkei/alanya/',      emoji:'🏰', name:'Alanya',      img:img('photo-1725636989466-84eceb9e19f8') },
      { href:'/tuerkei/fethiye/',     emoji:'🏔️', name:'Fethiye',     img:img('photo-1698304679207-d0d94e497f75') },
      { href:'/tuerkei/marmaris/',    emoji:'⛵', name:'Marmaris',    img:img('photo-1538584797384-59551a9e38be') },
      { href:'/tuerkei/izmir/',       emoji:'🏛️', name:'İzmir',       img:img('photo-1719688549472-5cda1b187ff8') },
      { href:'/tuerkei/side/',        emoji:'🏺', name:'Side',        img:img('photo-1663574629085-c89823932a4e') },
      { href:'/tuerkei/kusadasi/',    emoji:'🚢', name:'Kuşadası',    img:img('photo-1600867049939-2880a2e8c7ee') },
      { href:'/tuerkei/pamukkale/',   emoji:'🌿', name:'Pamukkale',   img:img('photo-1708251089716-0475506e1873') },
      { href:'/tuerkei/cesme/',       emoji:'🌅', name:'Çeşme',       img:img('photo-1564403526882-db54feee2d09') },
    ],
  },
  {
    folder: 'griechenland',
    heading: '📍 Inseln &amp; Regionen in <span>Griechenland</span>',
    subtitle: 'Traumhafte Inseln, azurblaues Meer und antike Geschichte – die besten Reiseziele in Griechenland.',
    cities: [
      { href:'/griechenland/santorini/', emoji:'🌅', name:'Santorini',  img:img('photo-1664112115778-0ed2f2da97e2') },
      { href:'/griechenland/mykonos/',   emoji:'🏛️', name:'Mykonos',    img:img('photo-1601581875309-fafbf2d3ed3a') },
      { href:'/griechenland/kreta/',     emoji:'🫒', name:'Kreta',      img:img('photo-1558870964-72e29d300edd') },
      { href:'/griechenland/rhodos/',    emoji:'🌺', name:'Rhodos',     img:img('photo-1651313442275-ba7418be7471') },
      { href:'/griechenland/korfu/',     emoji:'🌿', name:'Korfu',      img:img('photo-1567884896242-9f2f2d535341') },
      { href:'/griechenland/zakynthos/', emoji:'🐢', name:'Zakynthos',  img:img('photo-1563789031959-4c02bcb41319') },
    ],
  },
  {
    folder: 'spanien',
    heading: '📍 Städte &amp; Regionen in <span>Spanien</span>',
    subtitle: 'Lebendige Städte, sonnige Inseln und malerische Küsten – die schönsten Reiseziele in Spanien.',
    cities: [
      { href:'/spanien/barcelona/',   emoji:'🎨', name:'Barcelona',   img:img('photo-1643304044908-2eece59334a5') },
      { href:'/spanien/mallorca/',    emoji:'🌴', name:'Mallorca',    img:img('photo-1719306128284-d36b8f4d7a7a') },
      { href:'/spanien/ibiza/',       emoji:'🎵', name:'Ibiza',       img:img('photo-1581949318227-b232241eec76') },
      { href:'/spanien/teneriffa/',   emoji:'🌋', name:'Teneriffa',   img:img('photo-1762110341498-59a612f1bddb') },
      { href:'/spanien/costa-brava/', emoji:'🪸', name:'Costa Brava', img:img('photo-1767622656415-e07aac72bda4') },
    ],
  },
  {
    folder: 'italien',
    heading: '📍 Städte &amp; Regionen in <span>Italien</span>',
    subtitle: 'Romantische Städte, traumhafte Küsten und weltberühmte Kultur – die schönsten Reiseziele in Italien.',
    cities: [
      { href:'/italien/rom/',          emoji:'🏛️', name:'Rom',          img:img('photo-1764586119002-e4739d37cf98') },
      { href:'/italien/venedig/',      emoji:'🛶', name:'Venedig',      img:img('photo-1767564272518-875ef88de331') },
      { href:'/italien/florenz/',      emoji:'🎭', name:'Florenz',      img:img('photo-1685001446569-de8e0c22788c') },
      { href:'/italien/amalfikueste/', emoji:'🍋', name:'Amalfiküste',  img:img('photo-1507525428034-b723cf961d3e') },
      { href:'/italien/sizilien/',     emoji:'🌋', name:'Sizilien',     img:img('photo-1773148374284-a04199fd9f4a') },
    ],
  },
  {
    folder: 'portugal',
    heading: '📍 Städte &amp; Regionen in <span>Portugal</span>',
    subtitle: 'Atlantikküste, Azulejos und goldene Strände – die schönsten Reiseziele in Portugal.',
    cities: [
      { href:'/portugal/algarve/', emoji:'🌊', name:'Algarve', img:img('photo-1658437192420-13cd43bbe2bd') },
      { href:'/portugal/porto/',   emoji:'🍷', name:'Porto',   img:img('photo-1652552096262-c430cc36f869') },
      { href:'/portugal/madeira/', emoji:'🌺', name:'Madeira', img:img('photo-1771967595511-b7ad140ed5c6') },
    ],
  },
  {
    folder: 'dubai',
    heading: '📍 Highlights &amp; <span>Erlebnisse in Dubai</span>',
    subtitle: 'Wolkenkratzer, Wüste und Luxus – die besten Erlebnisse in Dubai.',
    cities: [
      { href:'/dubai/hotels-dubai/',  emoji:'🏙️', name:'Hotels Dubai',  img:img('photo-1597172173960-b8da219af0ba') },
      { href:'/dubai/wuestensafari/', emoji:'🐪', name:'Wüstensafari',  img:img('photo-1638024510305-c36fcc0bf3b1') },
    ],
  },
];

// ── HTML-Generator ────────────────────────────────────────────────────────────
function buildCitySection(country) {
  const cards = country.cities.map(c => `      <a href="${c.href}" class="story-card">
        <img src="${c.img}" alt="${c.name}" loading="lazy" class="story-img">
        <div class="story-overlay"></div>
        <div class="story-top">
          <div class="story-flag">${c.emoji}</div>
          <span class="story-name">${c.name}</span>
        </div>
        <div class="story-bottom">
          <span class="story-count"></span>
          <span class="story-btn">Entdecken →</span>
        </div>
      </a>`).join('\n');

  return `
  <!-- ── STÄDTE & REGIONEN ── -->
  <div class="section" id="city-story-grid">
    <div class="container">
      <h2 class="section-title">${country.heading}</h2>
      <p style="color:var(--text-muted);margin-bottom:1.75rem;font-size:0.93rem;">
        ${country.subtitle}
      </p>
      <div class="story-grid">
${cards}
      </div>
    </div>
  </div>
`;
}

// ── Insertion-Anker ────────────────────────────────────────────────────────────
// Wir suchen nach dem Reisetipps-Block und fügen DAVOR die City-Section ein
const TIPPS_ANCHOR = `\n    <div class="section">\n      <div class="container-narrow">\n        <h2 class="section-title">✅ Reise<span>tipps</span></h2>`;

// ── Hauptlogik ────────────────────────────────────────────────────────────────
let processed = 0;

for (const country of COUNTRIES) {
  const filePath = path.join(BASE, country.folder, 'index.html');

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Datei nicht gefunden: ${filePath}`);
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Idempotenz-Check
  if (html.includes('id="city-story-grid"')) {
    console.log(`⏭️  Bereits vorhanden: ${country.folder}/index.html`);
    continue;
  }

  // 1) Story-Grid CSS injizieren (vor </style>)
  if (!html.includes('/* City Story-Grid */')) {
    html = html.replace('</style>', STORY_CSS + '\n</style>');
  }

  // 2) City-Section vor Reisetipps-Block einfügen
  if (!html.includes(TIPPS_ANCHOR)) {
    console.warn(`⚠️  Reisetipps-Anker nicht gefunden in ${country.folder}/index.html – überspringe`);
    continue;
  }

  const citySection = buildCitySection(country);
  html = html.replace(TIPPS_ANCHOR, citySection + TIPPS_ANCHOR);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅  ${country.folder}/index.html (${country.cities.length} Karten)`);
  processed++;
}

console.log(`\n✨ Fertig! ${processed} Seiten aktualisiert.`);
