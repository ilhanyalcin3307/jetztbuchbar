/**
 * update-hotel-carousel-v2.js
 *
 * Ersetzt den bisherigen einzigen Carousel-Block (id="giata-hotel-carousel")
 * auf allen 16 Länder-Hauptseiten durch zwei kategoriespezifische Carousels:
 *   1. 👨‍👩‍👧‍👦  Familienurlaub  (data-hotel-carousel-type="family")
 *   2. 💎  Luxusurlaub     (data-hotel-carousel-type="luxury")
 *
 * Idempotent: überspringt Seiten die bereits "hotel-carousel-family" enthalten.
 * Ausführen: node content-engine/update-hotel-carousel-v2.js
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const PAGES = [
  { cc:'GR', file:'griechenland/index.html', label:'Griechenland' },
  { cc:'TR', file:'tuerkei/index.html',      label:'der Türkei'   },
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
 * Baut den neuen Dual-Carousel-HTML-Block.
 */
function buildDualCarousel(cc, label) {
  return [
    '',
    '  <!-- ① Familienurlaub Carousel -->',
    '  <div class="section" id="hotel-carousel-family">',
    '    <div class="container">',
    '      <h2 class="section-title">👨‍👩‍👧‍👦 Top-Bewertete Hotels für <span>Familienurlaub</span> in ' + label + '</h2>',
    '      <p style="color:var(--text-muted);margin-bottom:1.75rem;font-size:0.93rem;">',
    '        Die familienfreundlichsten Hotels – Kids Club, Kinderpool, Wasserpark &amp; Animation inklusive.',
    '      </p>',
    '      <div data-hotel-carousel="' + cc + '" data-hotel-carousel-type="family"></div>',
    '    </div>',
    '  </div>',
    '',
    '  <!-- ② Luxusurlaub Carousel -->',
    '  <div class="section" id="hotel-carousel-luxury" style="padding-top:2rem;">',
    '    <div class="container">',
    '      <h2 class="section-title">💎 Exklusive Highlights für <span>Luxusurlaub</span> in ' + label + '</h2>',
    '      <p style="color:var(--text-muted);margin-bottom:1.75rem;font-size:0.93rem;">',
    '        5-Sterne-Resorts &amp; Premium-Hideaways – Infinity-Pool, Spa und höchste Ausstattungsqualität.',
    '      </p>',
    '      <div data-hotel-carousel="' + cc + '" data-hotel-carousel-type="luxury"></div>',
    '    </div>',
    '  </div>',
    '  <script src="/components/hotel-carousel.js" defer></script>',
    '',
  ].join('\n');
}

let updated = 0, skipped = 0, errors = 0;

for (const { cc, file, label } of PAGES) {
  const filePath = path.join(ROOT, file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ FEHLT   : ${file}`);
    errors++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Idempotenz-Guard
  if (html.includes('id="hotel-carousel-family"')) {
    console.log(`⏭  SKIP    : ${file}`);
    skipped++;
    continue;
  }

  // ── Alten Block finden ────────────────────────────────────────────────────
  // Anker 1: der neue Block aus update-hotel-carousel.js
  const ANCHOR_START = 'id="giata-hotel-carousel"';
  // Anker 2: der Script-Tag der am Ende des Blocks steht
  const ANCHOR_END   = '<script src="/components/hotel-carousel.js" defer></script>';

  const blockStart = html.lastIndexOf('<div class="section"', html.indexOf(ANCHOR_START));
  const blockEnd   = html.indexOf(ANCHOR_END);

  if (blockStart === -1 || blockEnd === -1) {
    console.log(`⚠️  KEIN MATCH : ${file}`);
    errors++;
    continue;
  }

  const endIdx = blockEnd + ANCHOR_END.length;
  const newBlock = buildDualCarousel(cc, label);

  html = html.slice(0, blockStart) + newBlock + html.slice(endIdx);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ UPDATE  : ${file} [${cc}] → Dual-Carousel (family + luxury) eingefügt`);
  updated++;
}

console.log('\n──────────────────────────────────────────────────────────────');
console.log(`✅ Fertig. Aktualisiert: ${updated}  |  Übersprungen: ${skipped}  |  Fehler: ${errors}`);
