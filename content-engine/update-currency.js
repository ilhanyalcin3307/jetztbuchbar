'use strict';
// content-engine/update-currency.js
// Extends the Währung stat-card on all 16 country pages:
//   - Euro countries  → static sub-text "Euro-Zone"
//   - Non-Euro        → dynamic sub-text via /api/currency (live ECB rate)
//
// Usage: node content-engine/update-currency.js
//        node content-engine/update-currency.js --dry-run

const fs   = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT    = path.resolve(__dirname, '..');

// ─── Currency codes per ISO-2 country ────────────────────────────────────────
const EURO_COUNTRIES = new Set(['GR', 'ES', 'IT', 'PT', 'HR', 'FR', 'MT', 'CY']);

const CURRENCY_CODE = {
  TR: 'TRY',
  EG: 'EGP',
  AE: 'AED',
  BG: 'BGN',
  MA: 'MAD',
  TN: 'TND',
  JO: 'JOD',
  CV: 'CVE',
};

// ─── Pages ───────────────────────────────────────────────────────────────────
const COUNTRY_PAGES = [
  ['griechenland/index.html', 'GR'],
  ['tuerkei/index.html',      'TR'],
  ['spanien/index.html',      'ES'],
  ['italien/index.html',      'IT'],
  ['portugal/index.html',     'PT'],
  ['kroatien/index.html',     'HR'],
  ['frankreich/index.html',   'FR'],
  ['aegypten/index.html',     'EG'],
  ['dubai/index.html',        'AE'],
  ['bulgarien/index.html',    'BG'],
  ['marokko/index.html',      'MA'],
  ['tunesien/index.html',     'TN'],
  ['jordanien/index.html',    'JO'],
  ['malta/index.html',        'MT'],
  ['zypern/index.html',       'CY'],
  ['kap-verde/index.html',    'CV'],
];

// ─── Process a single file ────────────────────────────────────────────────────
function processFile(relPath, isoCode) {
  const filePath = path.join(ROOT, relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`[MISS] ${relPath} – file not found`);
    return false;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already updated
  if (html.includes('kpi-currency-rate') || html.includes('Euro-Zone')) {
    console.log(`[SKIP] ${relPath} – already updated`);
    return false;
  }

  const isEuro    = EURO_COUNTRIES.has(isoCode);
  const currCode  = CURRENCY_CODE[isoCode];

  // ── 1. Add stat-sub to Währung card ────────────────────────────────────────
  // Matches: <span class="stat-label">Währung</span>\n        <span class="stat-value">...</span>\n      </div>
  const waehrungRe = /(<span class="stat-label">Währung<\/span>\n        <span class="stat-value">[^<]+<\/span>)(\n      <\/div>)/;

  if (!waehrungRe.test(html)) {
    console.log(`[WARN] ${relPath} – Währung card pattern not found`);
    return false;
  }

  if (isEuro) {
    // Static: Euro-Zone
    html = html.replace(
      waehrungRe,
      `$1\n        <span class="stat-sub">Euro-Zone</span>$2`
    );
  } else {
    // Dynamic placeholder
    html = html.replace(
      waehrungRe,
      `$1\n        <span class="stat-sub" id="kpi-currency-rate">Kurs wird geladen …</span>$2`
    );
  }

  // ── 2. Inject currency fetch into existing <script> block (non-Euro only) ──
  if (!isEuro) {
    // Anchor: the end of the travel-warning catch block, right before </script>
    const scriptAnchor = `      if(text)text.textContent='Nicht verfügbar';\n    });\n})();\n</script>`;
    const currencyIife = `\n(function(){\n  fetch('/api/currency?currency=${currCode}')\n    .then(function(r){return r.json();})\n    .then(function(d){\n      var el=document.getElementById('kpi-currency-rate');\n      if(el&&d.text)el.textContent=d.text;\n      else if(el)el.style.display='none';\n    })\n    .catch(function(){\n      var el=document.getElementById('kpi-currency-rate');\n      if(el)el.style.display='none';\n    });\n})();`;

    if (!html.includes(scriptAnchor)) {
      console.log(`[WARN] ${relPath} – script anchor not found`);
      return false;
    }

    html = html.replace(
      scriptAnchor,
      `      if(text)text.textContent='Nicht verfügbar';\n    });\n})();${currencyIife}\n</script>`
    );
  }

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, html, 'utf8');
  }

  const tag = isEuro ? 'Euro-Zone' : `live ${currCode}`;
  console.log(`[OK${DRY_RUN ? ' DRY' : ''}] ${relPath} (${isoCode}) – ${tag}`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let updated = 0;
let skipped = 0;

for (const [relPath, isoCode] of COUNTRY_PAGES) {
  if (processFile(relPath, isoCode)) updated++;
  else skipped++;
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped/warned.${DRY_RUN ? ' (DRY RUN)' : ''}`);
