'use strict';
// content-engine/update-kpis.js
// Extends the stat-grid on all 16 main country pages with 4 new KPI cards:
//   🔌 Steckdose  💸 Trinkgeld  📅 Beste Reisezeit  🛡️ Auswärt. Amt (live)
//
// Usage:  node content-engine/update-kpis.js
//         node content-engine/update-kpis.js --dry-run

const fs   = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const ROOT    = path.resolve(__dirname, '..');

// ─── Static data per ISO-2 country code ─────────────────────────────────────
const COUNTRY_DATA = {
  GR: { outlet: 'Typ C/F · 230V/50Hz', outletAdapter: false, tipping: '5–10 %',        bestTime: 'Mai–Oktober',        reisezeitUrl: '/griechenland/reisezeit/' },
  TR: { outlet: 'Typ F · 230V/50Hz',   outletAdapter: false, tipping: '10–15 %',        bestTime: 'Apr–Jun / Sep–Okt',  reisezeitUrl: '/tuerkei/reisezeit/'     },
  ES: { outlet: 'Typ C/F · 230V/50Hz', outletAdapter: false, tipping: 'Aufrunden',       bestTime: 'Apr–Jun / Sep–Okt',  reisezeitUrl: '/spanien/reisezeit/'     },
  IT: { outlet: 'Typ C/F · 230V/50Hz', outletAdapter: false, tipping: '5–10 %',         bestTime: 'Mai–September',      reisezeitUrl: null                       },
  PT: { outlet: 'Typ C/F · 230V/50Hz', outletAdapter: false, tipping: '5–10 %',         bestTime: 'Apr–Oktober',        reisezeitUrl: '/portugal/reisezeit/'    },
  HR: { outlet: 'Typ C/F · 230V/50Hz', outletAdapter: false, tipping: '5–10 %',         bestTime: 'Jun–September',      reisezeitUrl: null                       },
  FR: { outlet: 'Typ C/E · 230V/50Hz', outletAdapter: false, tipping: '5–10 %',         bestTime: 'Jun–September',      reisezeitUrl: null                       },
  EG: { outlet: 'Typ C/F · 220V/50Hz', outletAdapter: false, tipping: '10–15 %',        bestTime: 'Oktober–April',      reisezeitUrl: '/aegypten/reisezeit/'    },
  AE: { outlet: 'Typ G · 230V/50Hz',   outletAdapter: true,  tipping: '10–15 %',        bestTime: 'November–April',     reisezeitUrl: '/dubai/reisezeit/'       },
  BG: { outlet: 'Typ C/F · 230V/50Hz', outletAdapter: false, tipping: '5–10 %',         bestTime: 'Jun–September',      reisezeitUrl: null                       },
  MA: { outlet: 'Typ C/E · 220V/50Hz', outletAdapter: false, tipping: '10–15 %',        bestTime: 'Sep–Nov / Mär–Mai',  reisezeitUrl: '/marokko/reisezeit/'     },
  TN: { outlet: 'Typ C/E · 230V/50Hz', outletAdapter: false, tipping: '5–10 %',         bestTime: 'Apr–Jun / Sep–Nov',  reisezeitUrl: null                       },
  JO: { outlet: 'Typ B/C/G · 230V',    outletAdapter: true,  tipping: '10–15 %',        bestTime: 'Mär–Mai / Sep–Nov',  reisezeitUrl: null                       },
  MT: { outlet: 'Typ G · 230V/50Hz',   outletAdapter: true,  tipping: '5–10 %',         bestTime: 'Mai–Oktober',        reisezeitUrl: '/malta/reisezeit/'       },
  CY: { outlet: 'Typ G · 230V/50Hz',   outletAdapter: true,  tipping: '5–10 %',         bestTime: 'Apr–Jun / Sep–Nov',  reisezeitUrl: null                       },
  CV: { outlet: 'Typ C/F · 220V/50Hz', outletAdapter: false, tipping: '5–10 %',         bestTime: 'November–Juli',      reisezeitUrl: null                       },
};

// ─── Country pages to update ─────────────────────────────────────────────────
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

// ─── CSS snippets ─────────────────────────────────────────────────────────────
// Existing nth-child(4) line – used as anchor for insertion
const OLD_NTH4 = '  .stat-card:nth-child(4) { border-left-color: #38bdf8; background: linear-gradient(135deg, rgba(56,189,248,0.08) 0%, var(--bg-card) 65%); }';
const NEW_NTH4_PLUS = `  .stat-card:nth-child(4) { border-left-color: #38bdf8; background: linear-gradient(135deg, rgba(56,189,248,0.08) 0%, var(--bg-card) 65%); }
  .stat-card:nth-child(5) { border-left-color: #fb923c; background: linear-gradient(135deg, rgba(251,146,60,0.08) 0%, var(--bg-card) 65%); }
  .stat-card:nth-child(6) { border-left-color: #34d399; background: linear-gradient(135deg, rgba(52,211,153,0.08) 0%, var(--bg-card) 65%); }
  .stat-card:nth-child(7) { border-left-color: #f472b6; background: linear-gradient(135deg, rgba(244,114,182,0.08) 0%, var(--bg-card) 65%); }
  .stat-card:nth-child(8) { border-left-color: #6b7280; background: linear-gradient(135deg, rgba(107,114,128,0.06) 0%, var(--bg-card) 65%); }`;

// Existing stat-value CSS line – used as anchor for stat-sub insertion
const OLD_STAT_VALUE = '  .stat-value { font-size: 0.97rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }';
const NEW_STAT_VALUE_PLUS = `  .stat-value { font-size: 0.97rem; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .stat-sub { font-size: 0.72rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 0.05rem; }`;

// ─── Build new stat-grid HTML ─────────────────────────────────────────────────
function buildStatGrid(existingValues, isoCode) {
  const d = COUNTRY_DATA[isoCode];
  const [capital, currency, language, population] = existingValues;

  const adapterTag = d.outletAdapter
    ? '\n        <span class="stat-sub">⚠️ Adapter nötig</span>'
    : '';

  const bestTimeValue = d.reisezeitUrl
    ? `<a href="${d.reisezeitUrl}" style="color:inherit;text-decoration:none;">${d.bestTime} →</a>`
    : d.bestTime;

  return `<div class="stat-grid">
    <div class="stat-card">
      <span class="stat-icon">🏙️</span>
      <div class="stat-info">
        <span class="stat-label">Hauptstadt</span>
        <span class="stat-value">${capital}</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">💱</span>
      <div class="stat-info">
        <span class="stat-label">Währung</span>
        <span class="stat-value">${currency}</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">🗣️</span>
      <div class="stat-info">
        <span class="stat-label">Sprache</span>
        <span class="stat-value">${language}</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">👥</span>
      <div class="stat-info">
        <span class="stat-label">Einwohner</span>
        <span class="stat-value">${population}</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">🔌</span>
      <div class="stat-info">
        <span class="stat-label">Steckdose</span>
        <span class="stat-value">${d.outlet}</span>${adapterTag}
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">💸</span>
      <div class="stat-info">
        <span class="stat-label">Trinkgeld</span>
        <span class="stat-value">${d.tipping}</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">📅</span>
      <div class="stat-info">
        <span class="stat-label">Beste Reisezeit</span>
        <span class="stat-value">${bestTimeValue}</span>
      </div>
    </div>
    <div class="stat-card" id="kpi-travel-warning">
      <span class="stat-icon" id="kpi-tw-icon">🛡️</span>
      <div class="stat-info">
        <span class="stat-label">Auswärt. Amt</span>
        <span class="stat-value" id="kpi-tw-text">Prüfe …</span>
      </div>
    </div></div>
<script>
(function(){
  fetch('/api/travel-warning?country=${isoCode}')
    .then(function(r){return r.json();})
    .then(function(d){
      var card=document.getElementById('kpi-travel-warning');
      var icon=document.getElementById('kpi-tw-icon');
      var text=document.getElementById('kpi-tw-text');
      if(!card)return;
      text.textContent=d.text;
      icon.textContent=d.icon;
      card.style.borderLeftColor=d.color;
      card.style.background='linear-gradient(135deg,'+d.bg+' 0%,var(--bg-card) 65%)';
    })
    .catch(function(){
      var text=document.getElementById('kpi-tw-text');
      if(text)text.textContent='Nicht verfügbar';
    });
})();
</script>`;
}

// ─── Process a single file ────────────────────────────────────────────────────
function processFile(relPath, isoCode) {
  const filePath = path.join(ROOT, relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`[MISS] ${relPath} – file not found`);
    return false;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already updated
  if (html.includes('.stat-card:nth-child(5)')) {
    console.log(`[SKIP] ${relPath} – already updated`);
    return false;
  }

  // ── Extract existing 4 stat-values ─────────────────────────────────────────
  const gridMatch = html.match(/<div class="stat-grid">([\s\S]+?)<\/div><\/div>/);
  if (!gridMatch) {
    console.log(`[WARN] ${relPath} – stat-grid not found`);
    return false;
  }

  const gridHtml = gridMatch[1];
  const values = [];
  const valueRe = /<span class="stat-value">([^<]+)<\/span>/g;
  let m;
  while ((m = valueRe.exec(gridHtml)) !== null) {
    values.push(m[1]);
  }

  if (values.length < 4) {
    console.log(`[WARN] ${relPath} – only ${values.length} stat-value(s) found, expected 4`);
    return false;
  }

  // ── CSS updates ─────────────────────────────────────────────────────────────
  if (!html.includes(OLD_NTH4)) {
    console.log(`[WARN] ${relPath} – nth-child(4) CSS anchor not found`);
    return false;
  }
  html = html.replace(OLD_NTH4, NEW_NTH4_PLUS);
  html = html.replace(OLD_STAT_VALUE, NEW_STAT_VALUE_PLUS);

  // ── Replace stat-grid HTML ──────────────────────────────────────────────────
  const newGrid = buildStatGrid(values, isoCode);
  html = html.replace(/<div class="stat-grid">[\s\S]+?<\/div><\/div>/, newGrid);

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, html, 'utf8');
  }

  console.log(`[OK${DRY_RUN ? ' DRY' : ''}] ${relPath} (${isoCode}) — ${values.join(' | ')}`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
let updated = 0;
let skipped = 0;

for (const [relPath, isoCode] of COUNTRY_PAGES) {
  const result = processFile(relPath, isoCode);
  if (result) updated++;
  else skipped++;
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped/warned.${DRY_RUN ? ' (DRY RUN – no files written)' : ''}`);
