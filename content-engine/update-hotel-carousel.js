/**
 * update-hotel-carousel.js
 *
 * 1. Entfernt den "✈️ Beliebte Reiseziele" Abschnitt von allen 16 Länder-Hauptseiten.
 * 2. Fügt stattdessen einen GIATA® Hotel Carousel ein.
 *    → data-hotel-carousel="GR" → Komponente lädt top-8 dynamisch via API
 *
 * Idempotent: überspringt Seiten die bereits data-hotel-carousel enthalten.
 * Ausführen: node content-engine/update-hotel-carousel.js
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// Länderkonfiguration: ISO-2 Code, Datei, Ländername auf Deutsch, optionaler Stadt-Filter
const PAGES = [
  { cc:'GR', file:'griechenland/index.html', label:'Griechenland' },
  { cc:'TR', file:'tuerkei/index.html',      label:'Türkei'       },
  { cc:'ES', file:'spanien/index.html',      label:'Spanien'      },
  { cc:'IT', file:'italien/index.html',      label:'Italien'      },
  { cc:'PT', file:'portugal/index.html',     label:'Portugal'     },
  { cc:'HR', file:'kroatien/index.html',     label:'Kroatien'     },
  { cc:'FR', file:'frankreich/index.html',   label:'Frankreich'   },
  { cc:'EG', file:'aegypten/index.html',     label:'Ägypten'      },
  { cc:'AE', file:'dubai/index.html',        label:'Dubai'        },
  { cc:'BG', file:'bulgarien/index.html',    label:'Bulgarien'    },
  { cc:'MA', file:'marokko/index.html',      label:'Marokko'      },
  { cc:'TN', file:'tunesien/index.html',     label:'Tunesien'     },
  { cc:'JO', file:'jordanien/index.html',    label:'Jordanien'    },
  { cc:'MT', file:'malta/index.html',        label:'Malta'        },
  { cc:'CY', file:'zypern/index.html',       label:'Zypern'       },
  { cc:'CV', file:'kap-verde/index.html',    label:'Kap Verde'    },
];

/**
 * Findet den vollständigen "<div class="section">…</div>" Block
 * der das ✈️-Beliebte-Reiseziele-Element enthält.
 * Gibt { start, end } zurück (Indizes in `html`), oder null wenn nicht gefunden.
 */
function findReisezielSection(html) {
  const marker = '✈️ Beliebte';
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;

  // Rückwärts das öffnende <div class="section"> suchen
  const openTag = '<div class="section">';
  let start = html.lastIndexOf(openTag, markerIdx);
  if (start === -1) return null;

  // Vorwärts alle div-Ebenen zählen um das schließende </div> zu finden
  let depth = 0;
  let i = start;
  while (i < html.length) {
    const nextOpen  = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;  // past '<div'
    } else if (nextClose !== -1) {
      depth--;
      if (depth === 0) {
        const end = nextClose + 6; // past '</div>'
        return { start, end };
      }
      i = nextClose + 6;
    } else {
      break;
    }
  }
  return null;
}

/**
 * Erstellt den neuen Carousel-HTML-Block.
 */
function buildCarouselSection(cc, label) {
  return [
    '',
    '  <div class="section" id="giata-hotel-carousel">',
    '    <div class="container">',
    '      <h2 class="section-title">🏨 Top-Bewertete <span>GIATA® Hotels</span></h2>',
    '      <p style="color:var(--text-muted);margin-bottom:1.75rem;font-size:0.93rem;">',
    '        Die bestbewerteten Hotels in ' + label + ' – nach GIATA® Ausstattungs&shy;score gerankt.',
    '      </p>',
    '      <div data-hotel-carousel="' + cc + '"></div>',
    '    </div>',
    '  </div>',
    '  <script src="/components/hotel-carousel.js" defer></script>',
    '',
  ].join('\n');
}

let updated = 0, skipped = 0, missing = 0;

for (const { cc, file, label } of PAGES) {
  const filePath = path.join(ROOT, file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ FEHLT   : ${file}`);
    missing++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Idempotenz-Guard
  if (html.includes('data-hotel-carousel')) {
    console.log(`⏭  SKIP    : ${file}`);
    skipped++;
    continue;
  }

  const carouselSection = buildCarouselSection(cc, label);

  // Strategie 1: "✈️ Beliebte Reiseziele" Sektion komplett ersetzen
  const found = findReisezielSection(html);
  if (found) {
    html = html.slice(0, found.start) + carouselSection + html.slice(found.end);
    const scriptTag = '<script src="/components/hotel-carousel.js" defer></script>';
    const first  = html.indexOf(scriptTag);
    if (first !== -1) {
      const second = html.indexOf(scriptTag, first + 1);
      if (second !== -1) html = html.slice(0, second) + html.slice(second + scriptTag.length);
    }
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ UPDATE  : ${file} [${cc}] → Reiseziele ersetzt durch Carousel`);
    updated++;
    continue;
  }

  // Strategie 2: Kein Reiseziele-Block → Carousel vor dem Klima-Abschnitt einfügen
  const klimaMarker = '<div class="section-alt">';
  const klimaIdx = html.indexOf(klimaMarker, html.indexOf('☀️'));
  if (klimaIdx === -1) {
    // Fallback: direkt vor </main> oder vor erstem Footer-Element
    const fallbackMarker = '</main>';
    const fallbackIdx = html.indexOf(fallbackMarker);
    if (fallbackIdx === -1) {
      console.log(`⚠️  KEIN PUNKT : ${file}`);
      missing++;
      continue;
    }
    html = html.slice(0, fallbackIdx) + carouselSection + html.slice(fallbackIdx);
  } else {
    html = html.slice(0, klimaIdx) + carouselSection + html.slice(klimaIdx);
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ UPDATE  : ${file} [${cc}] → Carousel vor Klima eingefügt`);
  updated++;
}

console.log('\n──────────────────────────────────────────────────────');
console.log(`✅ Fertig. Aktualisiert: ${updated}  |  Übersprungen: ${skipped}  |  Fehler/Fehlt: ${missing}`);
