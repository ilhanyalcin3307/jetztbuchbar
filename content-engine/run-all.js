'use strict';

/**
 * One-time bulk run: generates ALL pending pages and pushes in a single commit.
 * Usage: GITHUB_TOKEN=xxx OPENTRIPMAP_KEY=xxx node run-all.js
 */

const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');

const {
  getWikipediaSummary,
  getTopPOIs,
  getClimateData,
  getCountryInfo,
} = require('./apis');

const {
  assemblePage,
  renderClimateTable,
  renderPOIs,
  renderCountryInfo,
  renderTips,
  renderFAQ,
  renderCTA,
  escapeHtml,
} = require('./templates');

const { ALL_PAGES, DESTINATION_PAGES, CITY_PAGES, REISEZEIT_PAGES, THEMA_PAGES } = require('./pages');

const ROOT_DIR = path.join(__dirname, '..');
const TRACKER_FILE = path.join(__dirname, 'generated-pages.json');
const REPO_OWNER = process.env.REPO_OWNER || 'ilhanyalcin3307';
const REPO_NAME  = process.env.REPO_NAME  || 'jetztbuchbar';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function loadTracker() {
  try { if (fs.existsSync(TRACKER_FILE)) return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8')); }
  catch (_) {}
  return {};
}
function saveTracker(t) { fs.writeFileSync(TRACKER_FILE, JSON.stringify(t, null, 2), 'utf8'); }

// ── Page generators (same logic as server.js) ─────────────────────────────────

async function generateDestinationPage(page) {
  const [wikiSummary, pois, climate, country] = await Promise.allSettled([
    getWikipediaSummary(page.wikiSearch),
    getTopPOIs(page.poiSearch, 5),
    getClimateData(page.climateKey),
    getCountryInfo(page.countryKey),
  ]);
  const wiki = wikiSummary.status === 'fulfilled' ? wikiSummary.value : '';
  const poisData = pois.status === 'fulfilled' ? pois.value : [];
  const climateData = climate.status === 'fulfilled' ? climate.value : null;
  const countryData = country.status === 'fulfilled' ? country.value : null;

  const content = `
    <section class="country-intro"><div class="container">
      <h2>${escapeHtml(page.icon)} ${escapeHtml(page.nameDe)} im Überblick</h2>
      ${countryData ? renderCountryInfo(countryData) : ''}
      ${wiki ? `<p class="wiki-summary">${escapeHtml(wiki)}</p>` : ''}
    </div></section>
    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}
    ${climateData ? `<section class="climate-section"><div class="container">
      <h2>Klima &amp; Beste Reisezeit</h2>
      <p>Durchschnittliche Monatswerte für ${escapeHtml(page.nameDe)}:</p>
      ${renderClimateTable(climateData)}
    </div></section>` : ''}
    <section class="tips-section"><div class="container">
      <h2>Reisetipps für ${escapeHtml(page.nameDe)}</h2>${renderTips(page.tips)}
    </div></section>
    <section class="faq-section"><div class="container">
      <h2>Häufige Fragen zu ${escapeHtml(page.nameDe)}</h2>${renderFAQ(page.faqs)}
    </div></section>
    ${renderCTA(page.nameDe)}`;

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content });
}

async function generateCityPage(page) {
  const [wikiSummary, pois, climate] = await Promise.allSettled([
    getWikipediaSummary(page.wikiSearch),
    getTopPOIs(page.poiSearch, 5),
    getClimateData(page.climateKey),
  ]);
  const wiki = wikiSummary.status === 'fulfilled' ? wikiSummary.value : '';
  const poisData = pois.status === 'fulfilled' ? pois.value : [];
  const climateData = climate.status === 'fulfilled' ? climate.value : null;

  const content = `
    <nav class="breadcrumb" aria-label="Breadcrumb"><div class="container">
      <a href="/index.html">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(page.parentFile)}">${escapeHtml(page.parent)}</a> &rsaquo;
      <span>${escapeHtml(page.nameDe)}</span>
    </div></nav>
    <section class="city-intro"><div class="container">
      <h2>${escapeHtml(page.icon)} ${escapeHtml(page.nameDe)}</h2>
      ${wiki ? `<p class="wiki-summary">${escapeHtml(wiki)}</p>` : ''}
    </div></section>
    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}
    ${climateData ? `<section class="climate-section"><div class="container">
      <h2>Klima in ${escapeHtml(page.nameDe)}</h2>${renderClimateTable(climateData)}
    </div></section>` : ''}
    <section class="tips-section"><div class="container">
      <h2>Tipps für ${escapeHtml(page.nameDe)}</h2>${renderTips(page.tips)}
    </div></section>
    <section class="faq-section"><div class="container">
      <h2>FAQ: ${escapeHtml(page.nameDe)}</h2>${renderFAQ(page.faqs)}
    </div></section>
    ${renderCTA(page.nameDe)}`;

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content });
}

async function generateReisezeitPage(page) {
  const climate = await getClimateData(page.nameDe.toLowerCase()).catch(() => null);
  const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const bestIdx = [3, 4, 8, 9];
  const seasonTable = `<table class="season-table"><thead><tr><th>Monat</th><th>Eignung</th><th>Hinweis</th></tr></thead><tbody>
    ${months.map((m, i) => {
      const best = bestIdx.includes(i);
      const hot  = i >= 5 && i <= 7;
      const off  = i === 11 || i <= 1;
      const rating = best ? '⭐⭐⭐⭐⭐ Ideal' : hot ? '⭐⭐⭐⭐ Hochsaison' : off ? '⭐⭐ Nebensaison' : '⭐⭐⭐ Gut';
      const note   = best ? 'Beste Kombination aus Wetter und Preis' : hot ? 'Hochsaison, höchste Preise' : off ? 'Ruhig und günstig' : 'Angenehme Temperaturen';
      return `<tr${best ? ' class="best-month"' : ''}><td>${escapeHtml(m)}</td><td>${rating}</td><td>${escapeHtml(note)}</td></tr>`;
    }).join('')}
  </tbody></table>`;

  const content = `
    <section class="reisezeit-intro"><div class="container">
      <h2>Wann ist die beste Reisezeit für ${escapeHtml(page.nameDe)}?</h2>
      <p>Ob Badesaison, Kulturreise oder günstige Preise – hier finden Sie die optimale Reisezeit für ${escapeHtml(page.nameDe)}.</p>
      ${seasonTable}
    </div></section>
    ${climate ? `<section class="climate-section"><div class="container">
      <h2>Klimatabelle ${escapeHtml(page.nameDe)}</h2>
      <p>Monatliche Durchschnittswerte (2018–2022):</p>
      ${renderClimateTable(climate)}
    </div></section>` : ''}
    <section class="dest-link-section"><div class="container">
      <h2>Mehr über ${escapeHtml(page.nameDe)}</h2>
      <a href="/${escapeHtml(page.destFile)}" class="btn-primary">${escapeHtml(page.icon)} ${escapeHtml(page.nameDe)} – Reiseguide &rarr;</a>
    </div></section>
    ${renderCTA(page.nameDe)}`;

  return assemblePage({ title: page.title, description: page.description, h1Parts: ['Beste Reisezeit', page.nameDe], heroSub: `Monat für Monat erklärt: wann lohnt sich eine Reise nach ${page.nameDe}?`, icon: page.icon, content });
}

async function generateThemaPage(page) {
  const destLinks = page.destinations.map(d => {
    const slug = d.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/\s+/g,'-');
    return `<a href="/${escapeHtml(slug)}.html" class="dest-tag">${escapeHtml(d)}</a>`;
  }).join('');

  const content = `
    <section class="thema-intro"><div class="container">
      <h2>${escapeHtml(page.icon)} ${escapeHtml(page.h1Parts.join(' '))}</h2>
      <p>${escapeHtml(page.intro)}</p>
    </div></section>
    <section class="tips-section"><div class="container">
      <h2>Unsere Top-Tipps</h2>${renderTips(page.tips)}
    </div></section>
    <section class="faq-section"><div class="container">
      <h2>Häufige Fragen</h2>${renderFAQ(page.faqs)}
    </div></section>
    <section class="related-dests"><div class="container">
      <h2>Empfohlene Reiseziele</h2>
      <div class="dest-tags">${destLinks}</div>
    </div></section>
    ${renderCTA(page.h1Parts.join(' '))}`;

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content });
}

function getType(page) {
  if (DESTINATION_PAGES.includes(page)) return 'destination';
  if (CITY_PAGES.includes(page))        return 'city';
  if (REISEZEIT_PAGES.includes(page))   return 'reisezeit';
  if (THEMA_PAGES.includes(page))       return 'thema';
  return page.type || null;
}

async function generatePage(page) {
  const type = getType(page);
  switch (type) {
    case 'destination': return generateDestinationPage(page);
    case 'city':        return generateCityPage(page);
    case 'reisezeit':   return generateReisezeitPage(page);
    case 'thema':       return generateThemaPage(page);
    default: throw new Error(`Unknown type for ${page.file}`);
  }
}

// ── Bulk run ──────────────────────────────────────────────────────────────────

async function bulkRun() {
  const tracker = loadTracker();
  const pending = ALL_PAGES.filter(p => !tracker[p.id]);
  console.log(`[bulk] ${pending.length} pages to generate.`);

  const generatedFiles = [];

  for (const page of pending) {
    try {
      console.log(`[gen] ${page.file}`);
      const html = await generatePage(page);
      const outPath = path.join(ROOT_DIR, page.file);
      fs.writeFileSync(outPath, html, 'utf8');
      tracker[page.id] = { generatedAt: new Date().toISOString(), file: page.file };
      saveTracker(tracker);
      generatedFiles.push(page.file);
      console.log(`[ok]  ${page.file}`);
    } catch (err) {
      console.error(`[err] ${page.file}: ${err.message}`);
    }
  }

  if (generatedFiles.length === 0) {
    console.log('[bulk] Nothing to push.');
    return;
  }

  if (!GITHUB_TOKEN) {
    console.warn('[git] No GITHUB_TOKEN – skipping push.');
    return;
  }

  console.log(`\n[git] Committing ${generatedFiles.length} files...`);
  const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
  const git = simpleGit(ROOT_DIR);
  try {
    await git.remote(['set-url', 'origin', remoteUrl]);
    for (const f of generatedFiles) await git.add(f);
    await git.add('content-engine/generated-pages.json');
    const today = new Date().toISOString().split('T')[0];
    await git.commit(`content: bulk generate ${generatedFiles.length} SEO pages ${today}`);
    await git.push('origin', 'main');
    console.log('[git] Pushed successfully!');
  } catch (err) {
    console.error('[git] Push failed:', err.message);
  }
}

bulkRun().catch(err => { console.error('[bulk] Fatal:', err.message); process.exit(1); });
