/**
 * update-health.js
 * Ersetzt die EINWOHNER-Karte (👥) durch eine GESUNDHEIT & WASSER-Karte (💉)
 * auf allen 16 Länderseiten.
 *
 * Datenquelle: RKI / Auswärtiges Amt Reisemedizin (statisch, ändert sich sehr selten)
 * Idempotent: überspringt Seiten, die bereits die 💉-Karte haben.
 *
 * Ausführen: node content-engine/update-health.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Statische Gesundheits- und Wasserdaten pro Land (ISO-2 Code)
// Quellen: RKI Reisemedizin, Auswärtiges Amt Gesundheitsseiten
// ---------------------------------------------------------------------------
const HEALTH_DATA = {
  // ── EU-Länder: EHIC gültig, Leitungswasser trinkbar ───────────────────────
  GR: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },
  ES: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },
  IT: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },
  HR: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },
  PT: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },
  MT: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },
  FR: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },
  BG: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },
  CY: { vacNote: 'EHIC gültig',                    water: 'Leitungswasser trinkbar'      },

  // ── Nicht-EU, Vorsicht beim Wasser ─────────────────────────────────────────
  TR: { vacNote: 'Hep. A + Tetanus empf.',          water: 'Flaschenwasser empfohlen'     },
  TN: { vacNote: 'Hep. A + Tetanus empf.',          water: 'Flaschenwasser empfohlen'     },
  MA: { vacNote: 'Hep. A + Tetanus empf.',          water: 'Flaschenwasser empfohlen'     },
  CV: { vacNote: 'Hep. A + Tetanus empf.',          water: 'Flaschenwasser empfohlen'     },
  JO: { vacNote: 'Hep. A + Tetanus empf.',          water: 'Flaschenwasser empfohlen'     },

  // ── Ägypten: stärkste Hinweise ─────────────────────────────────────────────
  EG: { vacNote: 'Hep. A/B + Tollwut empf.',        water: '⚠ Nicht trinkbar!'            },

  // ── UAE / Dubai: moderne Versorgung, Entsalzung ────────────────────────────
  AE: { vacNote: 'Mod. Versorgung vor Ort',         water: 'Flaschenwasser bevorzugt'     },
};

// ---------------------------------------------------------------------------
// Seitenzuordnung: ISO-Code → HTML-Pfad (relativ zu Projekt-Root)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Regex: findet die komplette EINWOHNER-Karte (👥-Icon + Einwohner-Label)
// ---------------------------------------------------------------------------
const EINWOHNER_REGEX = /<div class="stat-card">\s*<span class="stat-icon">👥<\/span>\s*<div class="stat-info">\s*<span class="stat-label">Einwohner<\/span>\s*<span class="stat-value">[^<]*<\/span>\s*<\/div>\s*<\/div>/;

const ROOT = path.resolve(__dirname, '..');
let updated = 0;
let skipped = 0;

for (const { code, file } of PAGES) {
  const filePath = path.join(ROOT, file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ FEHLT  : ${file}`);
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Idempotenz-Guard: bereits aktualisiert?
  if (html.includes('stat-icon">💉')) {
    console.log(`⏭  SKIP   : ${file} (bereits aktualisiert)`);
    skipped++;
    continue;
  }

  const data = HEALTH_DATA[code];
  if (!data) {
    console.log(`⚠️  KEINE DATEN für ${code}: ${file}`);
    continue;
  }

  if (!EINWOHNER_REGEX.test(html)) {
    console.log(`⚠️  KEIN MATCH für Einwohner-Karte in: ${file}`);
    continue;
  }

  // Neue Karte: Gesundheit & Wasser (3-zeilig: Wert + 2x stat-sub)
  const healthCard = `<div class="stat-card">
      <span class="stat-icon">💉</span>
      <div class="stat-info">
        <span class="stat-label">Gesundheit &amp; Wasser</span>
        <span class="stat-value">Keine Pflichtimpfungen</span>
        <span class="stat-sub">${data.vacNote}</span>
        <span class="stat-sub">💧 ${data.water}</span>
      </div>
    </div>`;

  html = html.replace(EINWOHNER_REGEX, healthCard);
  fs.writeFileSync(filePath, html, 'utf8');

  console.log(`✅ UPDATE : ${file}`);
  console.log(`           💉 ${data.vacNote}`);
  console.log(`           💧 ${data.water}`);
  updated++;
}

console.log(`\n──────────────────────────────────`);
console.log(`✅ Fertig. Aktualisiert: ${updated}  |  Übersprungen: ${skipped}`);
