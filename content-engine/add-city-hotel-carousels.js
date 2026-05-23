#!/usr/bin/env node
// content-engine/add-city-hotel-carousels.js
// Ersetzt "Entdecken & Erleben" / "Aktivitäten & Highlights" Block
// durch Dual-Carousel (Family + Luxury) mit Stadt-spezifischem Filter

'use strict';
const fs   = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

// ── Städte-Daten ──────────────────────────────────────────────────────────────
// city:    API-Parameter für data-carousel-city (GIATA Fuzzy-Match)
// cityDE:  Deutscher Stadtname für Heading-Text
// prep:    Präposition auf Deutsch (in/auf)
const CITIES = [
  // ── Türkei ──
  { folder:'tuerkei/istanbul',    cc:'TR', city:'Istanbul',    cityDE:'Istanbul',    prep:'in' },
  { folder:'tuerkei/antalya',     cc:'TR', city:'Antalya',     cityDE:'Antalya',     prep:'in' },
  { folder:'tuerkei/bodrum',      cc:'TR', city:'Bodrum',      cityDE:'Bodrum',      prep:'in' },
  { folder:'tuerkei/alanya',      cc:'TR', city:'Alanya',      cityDE:'Alanya',      prep:'in' },
  { folder:'tuerkei/kappadokien', cc:'TR', city:'Goreme',      cityDE:'Kappadokien', prep:'in' },
  { folder:'tuerkei/marmaris',    cc:'TR', city:'Marmaris',    cityDE:'Marmaris',    prep:'in' },
  { folder:'tuerkei/fethiye',     cc:'TR', city:'Fethiye',     cityDE:'Fethiye',     prep:'in' },
  { folder:'tuerkei/kusadasi',    cc:'TR', city:'Kusadasi',    cityDE:'Kuşadası',    prep:'in' },
  { folder:'tuerkei/side',        cc:'TR', city:'Side',        cityDE:'Side',        prep:'in' },
  { folder:'tuerkei/izmir',       cc:'TR', city:'Izmir',       cityDE:'İzmir',       prep:'in' },
  { folder:'tuerkei/cesme',       cc:'TR', city:'Cesme',       cityDE:'Çeşme',       prep:'in' },
  { folder:'tuerkei/pamukkale',   cc:'TR', city:'Denizli',     cityDE:'Pamukkale',   prep:'in' },
  // ── Griechenland ──
  { folder:'griechenland/santorini', cc:'GR', city:'Santorini', cityDE:'Santorini', prep:'auf' },
  { folder:'griechenland/mykonos',   cc:'GR', city:'Mykonos',   cityDE:'Mykonos',   prep:'auf' },
  { folder:'griechenland/kreta',     cc:'GR', city:'Kreta',     cityDE:'Kreta',     prep:'auf' },
  { folder:'griechenland/rhodos',    cc:'GR', city:'Rhodos',    cityDE:'Rhodos',    prep:'auf' },
  { folder:'griechenland/korfu',     cc:'GR', city:'Korfu',     cityDE:'Korfu',     prep:'auf' },
  { folder:'griechenland/zakynthos', cc:'GR', city:'Zakynthos', cityDE:'Zakynthos', prep:'auf' },
  // ── Spanien ──
  { folder:'spanien/barcelona',   cc:'ES', city:'Barcelona',  cityDE:'Barcelona',   prep:'in' },
  { folder:'spanien/mallorca',    cc:'ES', city:'Mallorca',   cityDE:'Mallorca',    prep:'auf' },
  { folder:'spanien/ibiza',       cc:'ES', city:'Ibiza',      cityDE:'Ibiza',       prep:'auf' },
  { folder:'spanien/teneriffa',   cc:'ES', city:'Teneriffa',  cityDE:'Teneriffa',   prep:'auf' },
  { folder:'spanien/costa-brava', cc:'ES', city:'',           cityDE:'Costa Brava', prep:'an der' },
  // ── Italien ──
  { folder:'italien/rom',          cc:'IT', city:'Rom',     cityDE:'Rom',         prep:'in' },
  { folder:'italien/venedig',      cc:'IT', city:'Venedig', cityDE:'Venedig',     prep:'in' },
  { folder:'italien/florenz',      cc:'IT', city:'Florenz', cityDE:'Florenz',     prep:'in' },
  { folder:'italien/amalfikueste', cc:'IT', city:'Amalfi',  cityDE:'Amalfiküste', prep:'an der' },
  { folder:'italien/sizilien',     cc:'IT', city:'',        cityDE:'Sizilien',    prep:'auf' },
  // ── Portugal ──
  { folder:'portugal/algarve',        cc:'PT', city:'',         cityDE:'Algarve',  prep:'an der' },
  { folder:'portugal/porto',          cc:'PT', city:'Porto',    cityDE:'Porto',    prep:'in' },
  { folder:'portugal/madeira',        cc:'PT', city:'Madeira',  cityDE:'Madeira',  prep:'auf' },
  { folder:'portugal/hotels-lissabon',cc:'PT', city:'Lisbon',   cityDE:'Lissabon', prep:'in' },
  // ── Dubai ──
  { folder:'dubai/wuestensafari', cc:'AE', city:'Dubai', cityDE:'Dubai', prep:'in' },
  { folder:'dubai/hotels-dubai',  cc:'AE', city:'Dubai', cityDE:'Dubai', prep:'in' },
  // ── Malta ──
  { folder:'malta/tauchen', cc:'MT', city:'', cityDE:'Malta', prep:'auf' },
  // ── Kap Verde ──
  { folder:'kap-verde/surfen', cc:'CV', city:'', cityDE:'Kap Verde', prep:'auf' },
  // ── Kroatien ──
  { folder:'kroatien/wandern', cc:'HR', city:'', cityDE:'Kroatien', prep:'in' },
  // ── Griechenland Themen ──
  { folder:'griechenland/schnorcheln-kreta', cc:'GR', city:'Kreta', cityDE:'Kreta', prep:'auf' },
  { folder:'griechenland/hotels-kreta',      cc:'GR', city:'Kreta', cityDE:'Kreta', prep:'auf' },
  // ── Spanien Themen ──
  { folder:'spanien/hotels-mallorca', cc:'ES', city:'Mallorca', cityDE:'Mallorca', prep:'auf' },
  // ── Türkei Themen ──
  { folder:'tuerkei/hotels-antalya', cc:'TR', city:'Antalya', cityDE:'Antalya', prep:'in' },
];

// ── Carousel-HTML Generator ──────────────────────────────────────────────────
function buildCarousels(c) {
  const prepCity  = `${c.prep} ${c.cityDE}`;
  const cityAttr  = c.city ? ` data-carousel-city="${c.city}"` : '';

  return `  <!-- ① Familienurlaub Carousel -->
  <div class="section" id="hotel-carousel-family">
    <div class="container">
      <h2 class="section-title">👨‍👩‍👧‍👦 Top-Bewertete Hotels für <span>Familienurlaub</span> ${prepCity}</h2>
      <p style="color:var(--text-muted);margin-bottom:1.25rem;font-size:0.93rem;">Die bestbewerteten familienfreundlichen Hotels ${prepCity} – Kids Club, Kinderpool und mehr.</p>
      <div data-hotel-carousel="${c.cc}"${cityAttr} data-hotel-carousel-type="family"></div>
    </div>
  </div>
  <!-- ② Luxusurlaub Carousel -->
  <div class="section" id="hotel-carousel-luxury" style="padding-top:2rem;">
    <div class="container">
      <h2 class="section-title">💎 Exklusive Highlights für <span>Luxusurlaub</span> ${prepCity}</h2>
      <p style="color:var(--text-muted);margin-bottom:1.25rem;font-size:0.93rem;">Fünf-Sterne-Hotels und Luxusresorts ${prepCity} – für unvergesslichen Luxus.</p>
      <div data-hotel-carousel="${c.cc}"${cityAttr} data-hotel-carousel-type="luxury"></div>
    </div>
  </div>
`;
}

// ── Suchanker ──────────────────────────────────────────────────────────────────
const KLIMA_H2    = '☀️ Klima &amp; <span>Beste Reisezeit</span>';
// Alle bekannten Tipps-Varianten (erste gefundene wird verwendet)
const TIPPS_VARIANTS = [
  '✅ Reise<span>tipps</span>',
  '✅ Unsere <span>Tipps</span>',
  '✅ Hotel<span>tipps</span>',
  '✅ Tipps für ',
];
const SECTION_PAT = '<div class="section';   // matcht sowohl section als auch section-alt
const POI_GRID    = 'class="poi-grid"';
const CAROUSEL_JS = '<script src="/components/hotel-carousel.js" defer></script>';

// ── Hauptlogik ────────────────────────────────────────────────────────────────
let processed = 0;
let skipped   = 0;

for (const c of CITIES) {
  const filePath = path.join(BASE, c.folder, 'index.html');

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Nicht gefunden: ${c.folder}/index.html`);
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Idempotenz-Check
  if (html.includes('id="hotel-carousel-family"')) {
    console.log(`⏭️  Bereits vorhanden: ${c.folder}`);
    skipped++;
    continue;
  }

  const carouselHtml = buildCarousels(c);
  let replaced = false;

  // ── Strategie 1: poi-grid VOR Klima → poi-Section durch Carousel ersetzen ─
  const klimaH2Idx = html.indexOf(KLIMA_H2);
  if (klimaH2Idx !== -1) {
    const klimaSectionIdx = html.lastIndexOf(SECTION_PAT, klimaH2Idx);
    const poiGridIdx      = klimaSectionIdx !== -1 ? html.lastIndexOf(POI_GRID, klimaSectionIdx) : -1;
    const poiSectionIdx   = poiGridIdx      !== -1 ? html.lastIndexOf(SECTION_PAT, poiGridIdx)   : -1;

    if (poiSectionIdx !== -1 && klimaSectionIdx !== -1) {
      // POI-Block ersetzen, Klima-Section bleibt
      html = html.substring(0, poiSectionIdx) + carouselHtml + html.substring(klimaSectionIdx);
      replaced = true;
    } else if (klimaSectionIdx !== -1) {
      // Strategie 2: Kein poi-grid → Carousel VOR Klima einsetzen
      html = html.substring(0, klimaSectionIdx) + carouselHtml + html.substring(klimaSectionIdx);
      replaced = true;
    }
  }

  // ── Strategie 3: Kein Klima → poi-grid finden + vor Tipps ersetzen ────────
  if (!replaced) {
    // Ersten verfügbaren Tipps-Anker finden
    let tippsH2Idx = -1;
    for (const v of TIPPS_VARIANTS) {
      tippsH2Idx = html.indexOf(v);
      if (tippsH2Idx !== -1) break;
    }
    const tippsSectionIdx = tippsH2Idx !== -1 ? html.lastIndexOf(SECTION_PAT, tippsH2Idx) : -1;
    const poiGridIdx      = tippsSectionIdx !== -1 ? html.lastIndexOf(POI_GRID, tippsSectionIdx) : -1;
    const poiSectionIdx   = poiGridIdx     !== -1 ? html.lastIndexOf(SECTION_PAT, poiGridIdx)    : -1;

    if (poiSectionIdx !== -1 && tippsSectionIdx !== -1) {
      // POI-Block ersetzen, Tipps-Section bleibt
      html = html.substring(0, poiSectionIdx) + carouselHtml + html.substring(tippsSectionIdx);
      replaced = true;
    } else if (tippsSectionIdx !== -1) {
      // Strategie 3b: Kein poi-grid → Carousel VOR Tipps einsetzen
      html = html.substring(0, tippsSectionIdx) + carouselHtml + html.substring(tippsSectionIdx);
      replaced = true;
    }
  }

  if (!replaced) {
    console.warn(`⚠️  Kein Einfügepunkt gefunden: ${c.folder}`);
    continue;
  }

  // ── hotel-carousel.js Script hinzufügen (falls noch nicht vorhanden) ──────
  if (!html.includes(CAROUSEL_JS)) {
    html = html.replace('</body>', `  ${CAROUSEL_JS}\n</body>`);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅  ${c.folder}  (cc=${c.cc}${c.city ? ', city='+c.city : ''})`);
  processed++;
}

console.log(`\n✨ Fertig! ${processed} Seiten aktualisiert, ${skipped} übersprungen.`);
