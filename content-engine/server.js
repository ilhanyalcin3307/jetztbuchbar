'use strict';

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
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

const {
  DESTINATION_PAGES,
  CITY_PAGES,
  REISEZEIT_PAGES,
  THEMA_PAGES,
  ALL_PAGES,
} = require('./pages');

// ── Config ────────────────────────────────────────────────────────────────────

const ROOT_DIR = path.join(__dirname, '..');
const TRACKER_FILE = path.join(__dirname, 'generated-pages.json');
const DAILY_LIMIT = 10;
const REPO_OWNER = process.env.REPO_OWNER || 'ilhanyalcin3307';
const REPO_NAME = process.env.REPO_NAME || 'jetztbuchbar';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// ── Tracker helpers ───────────────────────────────────────────────────────────

function loadTracker() {
  try {
    if (fs.existsSync(TRACKER_FILE)) {
      return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
    }
  } catch (_) {}
  return {};
}

function saveTracker(tracker) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2), 'utf8');
}

// ── Git helper ────────────────────────────────────────────────────────────────

async function gitPush(filename, commitMsg) {
  if (!GITHUB_TOKEN) {
    console.warn('[git] GITHUB_TOKEN not set – skipping push.');
    return;
  }
  const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
  const git = simpleGit(ROOT_DIR);
  try {
    await git.remote(['set-url', 'origin', remoteUrl]);
    await git.add(filename);
    await git.commit(commitMsg);
    await git.push('origin', 'main');
    console.log(`[git] Pushed: ${commitMsg}`);
  } catch (err) {
    console.error(`[git] Push failed for ${filename}:`, err.message);
  }
}

// ── Page generators ───────────────────────────────────────────────────────────

async function generateDestinationPage(page) {
  console.log(`[gen] destination → ${page.file}`);

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

  const contentSections = `
    <section class="country-intro">
      <div class="container">
        <h2>${escapeHtml(page.icon)} ${escapeHtml(page.nameDe)} im Überblick</h2>
        ${countryData ? renderCountryInfo(countryData) : ''}
        ${wiki ? `<p class="wiki-summary">${escapeHtml(wiki)}</p>` : ''}
      </div>
    </section>

    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}

    ${climateData ? `
    <section class="climate-section">
      <div class="container">
        <h2>Klima &amp; Beste Reisezeit</h2>
        <p>Die folgende Tabelle zeigt die monatlichen Durchschnittstemperaturen und Niederschlagswerte für ${escapeHtml(page.nameDe)}:</p>
        ${renderClimateTable(climateData)}
      </div>
    </section>` : ''}

    <section class="tips-section">
      <div class="container">
        <h2>Reisetipps für ${escapeHtml(page.nameDe)}</h2>
        ${renderTips(page.tips)}
      </div>
    </section>

    <section class="faq-section">
      <div class="container">
        <h2>Häufige Fragen zu ${escapeHtml(page.nameDe)}</h2>
        ${renderFAQ(page.faqs)}
      </div>
    </section>

    ${renderCTA(page.nameDe)}
  `;

  const html = assemblePage({
    title: page.title,
    description: page.description,
    h1Parts: page.h1Parts,
    heroSub: page.heroSub,
    icon: page.icon,
    content: contentSections,
  });

  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateCityPage(page) {
  console.log(`[gen] city → ${page.file}`);

  const [wikiSummary, pois, climate] = await Promise.allSettled([
    getWikipediaSummary(page.wikiSearch),
    getTopPOIs(page.poiSearch, 5),
    getClimateData(page.climateKey),
  ]);

  const wiki = wikiSummary.status === 'fulfilled' ? wikiSummary.value : '';
  const poisData = pois.status === 'fulfilled' ? pois.value : [];
  const climateData = climate.status === 'fulfilled' ? climate.value : null;

  const breadcrumb = `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <div class="container">
        <a href="/index.html">Startseite</a> &rsaquo;
        <a href="/${escapeHtml(page.parentFile)}">${escapeHtml(page.parent)}</a> &rsaquo;
        <span>${escapeHtml(page.nameDe)}</span>
      </div>
    </nav>`;

  const contentSections = `
    ${breadcrumb}

    <section class="city-intro">
      <div class="container">
        <h2>${escapeHtml(page.icon)} ${escapeHtml(page.nameDe)} – ${escapeHtml(page.parent)}</h2>
        ${wiki ? `<p class="wiki-summary">${escapeHtml(wiki)}</p>` : ''}
      </div>
    </section>

    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}

    ${climateData ? `
    <section class="climate-section">
      <div class="container">
        <h2>Klima in ${escapeHtml(page.nameDe)}</h2>
        ${renderClimateTable(climateData)}
      </div>
    </section>` : ''}

    <section class="tips-section">
      <div class="container">
        <h2>Tipps für ${escapeHtml(page.nameDe)}</h2>
        ${renderTips(page.tips)}
      </div>
    </section>

    <section class="faq-section">
      <div class="container">
        <h2>FAQ: ${escapeHtml(page.nameDe)}</h2>
        ${renderFAQ(page.faqs)}
      </div>
    </section>

    ${renderCTA(page.nameDe)}
  `;

  const html = assemblePage({
    title: page.title,
    description: page.description,
    h1Parts: page.h1Parts,
    heroSub: page.heroSub,
    icon: page.icon,
    content: contentSections,
  });

  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateReisezeitPage(page) {
  console.log(`[gen] reisezeit → ${page.file}`);

  const climate = await getClimateData(page.nameDe.toLowerCase()).catch(() => null);

  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ];
  const bestMonths = [3, 4, 8, 9]; // April, Mai, September, Oktober (0-indexed)

  const seasonTable = `
    <table class="season-table">
      <thead>
        <tr>
          <th>Monat</th>
          <th>Eignung</th>
          <th>Besonderheit</th>
        </tr>
      </thead>
      <tbody>
        ${months.map((m, i) => {
          const isBest = bestMonths.includes(i);
          const isSummer = i >= 5 && i <= 7;
          const isWinter = i === 11 || i === 0 || i === 1;
          let rating = isBest ? '⭐⭐⭐⭐⭐ Ideal' : isSummer ? '⭐⭐⭐⭐ Heiße Saison' : isWinter ? '⭐⭐ Nebensaison' : '⭐⭐⭐ Gut';
          let note = isBest ? 'Beste Kombination aus Wetter und Preis' : isSummer ? 'Hochsaison, höchste Preise' : isWinter ? 'Kühl, ruhig, sehr günstig' : 'Angenehme Temperaturen';
          return `<tr class="${isBest ? 'best-month' : ''}"><td>${escapeHtml(m)}</td><td>${rating}</td><td>${escapeHtml(note)}</td></tr>`;
        }).join('')}
      </tbody>
    </table>`;

  const contentSections = `
    <section class="reisezeit-intro">
      <div class="container">
        <h2>Wann ist die beste Reisezeit für ${escapeHtml(page.nameDe)}?</h2>
        <p>Die beste Reisezeit für ${escapeHtml(page.nameDe)} hängt davon ab, was Sie suchen: Badesaison, Kulturreise, günstige Preise oder wenig Touristenmassen. Diese Übersicht hilft Ihnen bei der Entscheidung.</p>
        ${seasonTable}
      </div>
    </section>

    ${climate ? `
    <section class="climate-section">
      <div class="container">
        <h2>Klimatabelle ${escapeHtml(page.nameDe)}</h2>
        <p>Monatliche Durchschnittstemperaturen und Niederschlag (Klimanormalwerte 1991–2020):</p>
        ${renderClimateTable(climate)}
      </div>
    </section>` : ''}

    <section class="dest-link-section">
      <div class="container">
        <h2>Mehr über ${escapeHtml(page.nameDe)}</h2>
        <p>Alle Informationen, Regionen, Tipps und Angebote für ${escapeHtml(page.nameDe)} finden Sie auf unserer Hauptseite:</p>
        <a href="/${escapeHtml(page.destFile)}" class="btn-primary">${escapeHtml(page.icon)} ${escapeHtml(page.nameDe)} – Reiseguide &rarr;</a>
      </div>
    </section>

    ${renderCTA(page.nameDe)}
  `;

  const html = assemblePage({
    title: page.title,
    description: page.description,
    h1Parts: ['Beste Reisezeit', page.nameDe],
    heroSub: `Wann lohnt sich eine Reise nach ${page.nameDe}? Wir zeigen Monat für Monat, was Sie erwartet.`,
    icon: page.icon,
    content: contentSections,
  });

  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateThemaPage(page) {
  console.log(`[gen] thema → ${page.file}`);

  const destLinks = page.destinations.map(d => {
    const slug = d.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/\s+/g, '-');
    return `<a href="/${escapeHtml(slug)}.html" class="dest-tag">${escapeHtml(d)}</a>`;
  }).join('');

  const contentSections = `
    <section class="thema-intro">
      <div class="container">
        <h2>${escapeHtml(page.icon)} ${escapeHtml(page.h1Parts.join(' '))}</h2>
        <p>${escapeHtml(page.intro)}</p>
      </div>
    </section>

    <section class="tips-section">
      <div class="container">
        <h2>Unsere Top-Tipps</h2>
        ${renderTips(page.tips)}
      </div>
    </section>

    <section class="faq-section">
      <div class="container">
        <h2>Häufige Fragen</h2>
        ${renderFAQ(page.faqs)}
      </div>
    </section>

    <section class="related-dests">
      <div class="container">
        <h2>Empfohlene Reiseziele</h2>
        <div class="dest-tags">${destLinks}</div>
      </div>
    </section>

    ${renderCTA(page.h1Parts.join(' '))}
  `;

  const html = assemblePage({
    title: page.title,
    description: page.description,
    h1Parts: page.h1Parts,
    heroSub: page.heroSub,
    icon: page.icon,
    content: contentSections,
  });

  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

async function generatePage(page) {
  switch (page.type) {
    case 'destination': return generateDestinationPage(page);
    case 'city':        return generateCityPage(page);
    case 'reisezeit':   return generateReisezeitPage(page);
    case 'thema':       return generateThemaPage(page);
    default:
      console.warn(`[gen] Unknown type "${page.type}" for ${page.file}`);
      return null;
  }
}

// ── Assign types to pages that lack them ─────────────────────────────────────

function normalizePages(pages) {
  return pages.map(p => {
    if (p.type) return p;
    if (DESTINATION_PAGES.includes(p)) return { ...p, type: 'destination' };
    if (CITY_PAGES.includes(p))        return { ...p, type: 'city' };
    if (REISEZEIT_PAGES.includes(p))   return { ...p, type: 'reisezeit' };
    if (THEMA_PAGES.includes(p))       return { ...p, type: 'thema' };
    return p;
  });
}

// ── Main run function ─────────────────────────────────────────────────────────

async function runContentEngine() {
  console.log(`[engine] Starting run at ${new Date().toISOString()}`);

  const tracker = loadTracker();
  const allPages = normalizePages(ALL_PAGES);
  const pending = allPages.filter(p => !tracker[p.id]);

  if (pending.length === 0) {
    console.log('[engine] All pages already generated. Nothing to do.');
    return;
  }

  const batch = pending.slice(0, DAILY_LIMIT);
  console.log(`[engine] ${pending.length} pages pending. Generating ${batch.length} this run.`);

  const today = new Date().toISOString().split('T')[0];

  for (const page of batch) {
    try {
      const outPath = await generatePage(page);
      if (!outPath) continue;

      tracker[page.id] = { generatedAt: new Date().toISOString(), file: page.file };
      saveTracker(tracker);

      const relPath = path.relative(ROOT_DIR, outPath);
      await gitPush(relPath, `content: auto-generated ${page.file} ${today}`);
    } catch (err) {
      console.error(`[engine] Error generating ${page.file}:`, err.message);
    }
  }

  console.log(`[engine] Run complete. ${batch.length} pages processed.`);
}

// ── Schedule ──────────────────────────────────────────────────────────────────

// Run daily at 02:00
cron.schedule('0 2 * * *', () => {
  runContentEngine().catch(err => console.error('[cron] Unhandled error:', err.message));
});

console.log('[engine] Content engine started. Scheduled for 02:00 daily.');
console.log('[engine] Run immediately on startup...');

// Also run immediately on startup (Railway restarts at deploy)
runContentEngine().catch(err => console.error('[engine] Startup run error:', err.message));
