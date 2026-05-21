/**
 * update-tw-link.js
 * Fügt allen 16 Länderseiten einen statischen "→ AA prüfen"-Link
 * in die Auswärtiges-Amt-Karte ein (als stat-sub).
 *
 * Außerdem: Aktualisiert den Inline-JS-Block so, dass er bei Bedarf auch
 * den Link-Text auf "→ Offiziell prüfen ↗" setzt (mit kpi-tw-link id).
 *
 * Idempotent: überspringt Seiten, die bereits kpi-tw-link enthalten.
 *
 * Ausführen: node content-engine/update-tw-link.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// Direktlinks zu den offiziellen AA Reise- und Sicherheitshinweisen
const AA_URLS = {
  GR: 'https://www.auswaertiges-amt.de/de/service/laender/griechenland-node',
  TR: 'https://www.auswaertiges-amt.de/de/service/laender/tuerkei-node',
  ES: 'https://www.auswaertiges-amt.de/de/service/laender/spanien-node',
  IT: 'https://www.auswaertiges-amt.de/de/service/laender/italien-node',
  PT: 'https://www.auswaertiges-amt.de/de/service/laender/portugal-node',
  HR: 'https://www.auswaertiges-amt.de/de/service/laender/kroatien-node',
  FR: 'https://www.auswaertiges-amt.de/de/service/laender/frankreich-node',
  EG: 'https://www.auswaertiges-amt.de/de/service/laender/aegypten-node',
  AE: 'https://www.auswaertiges-amt.de/de/service/laender/vereinigtearabischeemirate-node',
  BG: 'https://www.auswaertiges-amt.de/de/service/laender/bulgarien-node',
  MA: 'https://www.auswaertiges-amt.de/de/service/laender/marokko-node',
  TN: 'https://www.auswaertiges-amt.de/de/service/laender/tunesien-node',
  JO: 'https://www.auswaertiges-amt.de/de/service/laender/jordanien-node',
  MT: 'https://www.auswaertiges-amt.de/de/service/laender/malta-node',
  CY: 'https://www.auswaertiges-amt.de/de/service/laender/zypern-node',
  CV: 'https://www.auswaertiges-amt.de/de/service/laender/kapverden-node',
};

const PAGES = [
  { code: 'GR', file: 'griechenland/index.html' },
  { code: 'TR', file: 'tuerkei/index.html'       },
  { code: 'ES', file: 'spanien/index.html'       },
  { code: 'IT', file: 'italien/index.html'       },
  { code: 'PT', file: 'portugal/index.html'      },
  { code: 'HR', file: 'kroatien/index.html'      },
  { code: 'FR', file: 'frankreich/index.html'    },
  { code: 'EG', file: 'aegypten/index.html'      },
  { code: 'AE', file: 'dubai/index.html'         },
  { code: 'BG', file: 'bulgarien/index.html'     },
  { code: 'MA', file: 'marokko/index.html'       },
  { code: 'TN', file: 'tunesien/index.html'      },
  { code: 'JO', file: 'jordanien/index.html'     },
  { code: 'MT', file: 'malta/index.html'         },
  { code: 'CY', file: 'zypern/index.html'        },
  { code: 'CV', file: 'kap-verde/index.html'     },
];

const ROOT = path.resolve(__dirname, '..');
let updated = 0, skipped = 0;

for (const { code, file } of PAGES) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ FEHLT  : ${file}`);
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Idempotenz-Guard
  if (html.includes('kpi-tw-link')) {
    console.log(`⏭  SKIP   : ${file}`);
    skipped++;
    continue;
  }

  const url = AA_URLS[code];
  if (!url) {
    console.log(`⚠️  KEINE URL für ${code}`);
    continue;
  }

  // 1) Den stat-sub-Link in die Travel-Warning-Karte einbauen
  //    Suche: </span>\n      </div>\n    </div>
  //    (das ist das Ende der kpi-travel-warning Karte)
  const twCardEnd = `        <span class="stat-value" id="kpi-tw-text">Prüfe …</span>
      </div>
    </div>`;

  const twCardWithLink = `        <span class="stat-value" id="kpi-tw-text">Prüfe …</span>
        <a href="${url}" id="kpi-tw-link" target="_blank" rel="noopener" class="stat-sub" style="color:var(--accent);text-decoration:none;font-size:0.68rem;">→ AA offiziell prüfen ↗</a>
      </div>
    </div>`;

  if (!html.includes(twCardEnd)) {
    console.log(`⚠️  KEIN MATCH für Travel-Warning-Karte in: ${file}`);
    continue;
  }

  html = html.replace(twCardEnd, twCardWithLink);

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ UPDATE : ${file} → ${url}`);
  updated++;
}

console.log(`\n──────────────────────────────────`);
console.log(`✅ Fertig. Aktualisiert: ${updated}  |  Übersprungen: ${skipped}`);
