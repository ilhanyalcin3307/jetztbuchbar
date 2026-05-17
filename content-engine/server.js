'use strict';

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const simpleGit = require('simple-git');
const fetch = require('node-fetch');

const {
  getWikipediaSummary,
  getTopPOIs,
  getClimateData,
  getCountryInfo,
  getUnsplashImage,
  COORDS,
} = require('./apis');

const {
  assemblePage,
  renderMap,
  renderClimateChart,
  renderPOIs,
  renderCountryInfo,
  renderTips,
  renderFAQ,
  renderCTA,
  escapeHtml,
} = require('./templates');

const { ALL_PAGES, DESTINATION_PAGES, CITY_PAGES, REISEZEIT_PAGES, THEMA_PAGES,
  HOTEL_PAGES, AKTIVITAET_PAGES, REGION_PAGES, REISETIPPS_PAGES, VERGLEICH_PAGES } = require('./pages');

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

// ── Sitemap + Google ping ─────────────────────────────────────────────────────

function generateSitemap() {
  const BASE = 'https://www.jetztbuchbar.de';
  const today = new Date().toISOString().split('T')[0];
  const staticPages = [
    { url: '/', priority: '1.0', freq: 'weekly' },
    { url: '/ueber-uns.html', priority: '0.4', freq: 'monthly' },
    { url: '/impressum.html', priority: '0.2', freq: 'monthly' },
    { url: '/datenschutz.html', priority: '0.2', freq: 'monthly' },
  ];
  const htmlFiles = fs.readdirSync(ROOT_DIR)
    .filter(f => f.endsWith('.html') && !['index.html','ueber-uns.html','impressum.html','datenschutz.html'].includes(f))
    .sort();
  const priorityMap = {
    tuerkei:'0.9', spanien:'0.9', griechenland:'0.9', aegypten:'0.9',
    marokko:'0.9', dubai:'0.9', kroatien:'0.9', portugal:'0.9',
    tunesien:'0.9', bulgarien:'0.9', malta:'0.9', zypern:'0.9',
    'kap-verde':'0.9', jordanien:'0.9',
    antalya:'0.85', bodrum:'0.85', 'kreta-urlaub':'0.85', 'santorini-urlaub':'0.85',
    'beste-reisezeit':'0.8', 'hotels-':'0.75', default:'0.7',
  };
  function getPriority(file) {
    const slug = file.replace('.html','');
    if (priorityMap[slug]) return priorityMap[slug];
    for (const k of Object.keys(priorityMap)) { if (slug.startsWith(k)) return priorityMap[k]; }
    return priorityMap.default;
  }
  const urls = [
    ...staticPages.map(p => `  <url>\n    <loc>${BASE}${p.url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`),
    ...htmlFiles.map(f => `  <url>\n    <loc>${BASE}/${f}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${getPriority(f)}</priority>\n  </url>`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), xml, 'utf8');
  console.log(`[sitemap] ${urls.length} URLs written.`);
}

async function pingGoogle() {
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent('https://www.jetztbuchbar.de/sitemap.xml')}`);
    console.log(`[ping] Google ping → HTTP ${res.status}`);
  } catch (err) {
    console.warn(`[ping] Google ping failed: ${err.message}`);
  }
}

// ── Git helper ────────────────────────────────────────────────────────────────

async function gitPush(filename, commitMsg) {
  if (!GITHUB_TOKEN) {
    console.warn('[git] GITHUB_TOKEN not set – skipping push.');
    return;
  }
  generateSitemap();
  await pingGoogle();
  const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
  const git = simpleGit(ROOT_DIR);
  try {
    await git.remote(['set-url', 'origin', remoteUrl]);
    await git.add(filename);
    await git.add('sitemap.xml');
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

  const [wikiSummary, pois, climate, country, image] = await Promise.allSettled([
    getWikipediaSummary(page.wikiSearch),
    getTopPOIs(page.poiSearch, 5),
    getClimateData(page.climateKey),
    getCountryInfo(page.countryKey),
    getUnsplashImage(page.climateKey || page.nameDe.toLowerCase()),
  ]);

  const wiki = wikiSummary.status === 'fulfilled' ? wikiSummary.value : '';
  const poisData = pois.status === 'fulfilled' ? pois.value : [];
  const climateData = climate.status === 'fulfilled' ? climate.value : null;
  const countryData = country.status === 'fulfilled' ? country.value : null;
  const coords = COORDS[page.climateKey] || COORDS[page.nameDe.toLowerCase()] || null;
  const img = image.status === 'fulfilled' ? image.value : null;
  const heroImage  = img ? img.url : null;
  const heroCredit = img ? { name: img.creditName, link: img.creditLink } : null;

  const content = `
    <div class="section">
      <div class="container">
        ${wiki ? `<div class="wiki-intro">${escapeHtml(wiki)}</div>` : ''}
        ${countryData ? renderCountryInfo(countryData) : ''}
      </div>
    </div>

    ${coords ? renderMap(coords.lat, coords.lon, page.nameDe) : ''}

    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}

    ${climateData ? renderClimateChart(climateData, page.nameDe) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">✅ Reise<span>tipps</span></h2>
        ${renderTips(page.tips)}
      </div>
    </div>

    <div class="section-alt">
      <div class="container-narrow">
        <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
        ${renderFAQ(page.faqs)}
      </div>
    </div>

    ${renderCTA(page.nameDe)}`;

  const html = assemblePage({
    title: page.title,
    description: page.description,
    h1Parts: page.h1Parts,
    heroSub: page.heroSub,
    icon: page.icon,
    content,
    heroImage,
    heroCredit,
  });

  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateCityPage(page) {
  console.log(`[gen] city → ${page.file}`);

  const [wikiSummary, pois, climate, image] = await Promise.allSettled([
    getWikipediaSummary(page.wikiSearch),
    getTopPOIs(page.poiSearch, 5),
    getClimateData(page.climateKey),
    getUnsplashImage(page.climateKey || page.nameDe.toLowerCase()),
  ]);

  const wiki = wikiSummary.status === 'fulfilled' ? wikiSummary.value : '';
  const poisData = pois.status === 'fulfilled' ? pois.value : [];
  const climateData = climate.status === 'fulfilled' ? climate.value : null;
  const coords = COORDS[page.climateKey] || COORDS[page.nameDe.toLowerCase()] || null;
  const img = image.status === 'fulfilled' ? image.value : null;
  const heroImage  = img ? img.url : null;
  const heroCredit = img ? { name: img.creditName, link: img.creditLink } : null;

  const content = `
    <nav class="breadcrumb">
      <a href="/index.html">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(page.parentFile)}">${escapeHtml(page.parent)}</a> &rsaquo;
      <span>${escapeHtml(page.nameDe)}</span>
    </nav>

    <div class="section">
      <div class="container-narrow">
        ${wiki ? `<div class="wiki-intro">${escapeHtml(wiki)}</div>` : ''}
      </div>
    </div>

    ${coords ? renderMap(coords.lat, coords.lon, page.nameDe) : ''}

    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}

    ${climateData ? renderClimateChart(climateData, page.nameDe) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">✅ Tipps für <span>${escapeHtml(page.nameDe)}</span></h2>
        ${renderTips(page.tips)}
      </div>
    </div>

    <div class="section-alt">
      <div class="container-narrow">
        <h2 class="section-title">❓ FAQ: <span>${escapeHtml(page.nameDe)}</span></h2>
        ${renderFAQ(page.faqs)}
      </div>
    </div>

    ${renderCTA(page.nameDe)}`;

  const html = assemblePage({
    title: page.title,
    description: page.description,
    h1Parts: page.h1Parts,
    heroSub: page.heroSub,
    icon: page.icon,
    content,
    heroImage,
    heroCredit,
  });

  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateReisezeitPage(page) {
  console.log(`[gen] reisezeit → ${page.file}`);

  const [climateRes, imageRes] = await Promise.allSettled([
    getClimateData(page.nameDe.toLowerCase()),
    getUnsplashImage(page.nameDe.toLowerCase()),
  ]);
  const climate = climateRes.status === 'fulfilled' ? climateRes.value : null;
  const imgR = imageRes.status === 'fulfilled' ? imageRes.value : null;
  const heroImage  = imgR ? imgR.url : null;
  const heroCredit = imgR ? { name: imgR.creditName, link: imgR.creditLink } : null;

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

  const coords = COORDS[page.nameDe.toLowerCase()] || null;

  const content = `
    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">📅 Reisezeit <span>Monat für Monat</span></h2>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">Ob Badesaison, Kulturreise oder günstige Preise – hier die optimale Reisezeit für ${escapeHtml(page.nameDe)}.</p>
        ${seasonTable}
      </div>
    </div>

    ${climate ? renderClimateChart(climate, page.nameDe) : ''}

    ${coords ? renderMap(coords.lat, coords.lon, page.nameDe) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">Mehr über <span>${escapeHtml(page.nameDe)}</span></h2>
        <a href="/${escapeHtml(page.destFile)}" class="dest-link-btn">${escapeHtml(page.icon)} ${escapeHtml(page.nameDe)} – Kompletter Reiseguide &rarr;</a>
      </div>
    </div>

    ${renderCTA(page.nameDe)}`;

  const html = assemblePage({
    title: page.title,
    description: page.description,
    h1Parts: ['Beste Reisezeit', page.nameDe],
    heroSub: `Monat für Monat erklärt: wann lohnt sich eine Reise nach ${page.nameDe}?`,
    icon: page.icon,
    content,
    heroImage,
    heroCredit,
  });

  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateThemaPage(page) {
  console.log(`[gen] thema → ${page.file}`);

  const imgRes = await getUnsplashImage(page.themaQuery || 'travel vacation beach').catch(() => null);
  const heroImage  = imgRes ? imgRes.url : null;
  const heroCredit = imgRes ? { name: imgRes.creditName, link: imgRes.creditLink } : null;

  const destLinks = page.destinations.map(d => {
    const slug = d.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/\s+/g, '-');
    return `<a href="/${escapeHtml(slug)}.html" class="dest-tag">${escapeHtml(d)}</a>`;
  }).join('');

  const content = `
    <div class="section">
      <div class="container-narrow">
        <div class="wiki-intro">${escapeHtml(page.intro)}</div>
      </div>
    </div>

    <div class="section-alt">
      <div class="container-narrow">
        <h2 class="section-title">✅ Unsere <span>Top-Tipps</span></h2>
        ${renderTips(page.tips)}
      </div>
    </div>

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
        ${renderFAQ(page.faqs)}
      </div>
    </div>

    <div class="section-alt">
      <div class="container">
        <h2 class="section-title">🌍 Empfohlene <span>Reiseziele</span></h2>
        <div class="dest-tags">${destLinks}</div>
      </div>
    </div>

    ${renderCTA(page.h1Parts.join(' '))}`;

  const html = assemblePage({
    title: page.title,
    description: page.description,
    h1Parts: page.h1Parts,
    heroSub: page.heroSub,
    icon: page.icon,
    content,
    heroImage,
    heroCredit,
  });

  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateHotelPage(page) {
  const [pois, climate, image] = await Promise.allSettled([
    getTopPOIs(page.nameDe, 4),
    getClimateData(page.climateKey),
    getUnsplashImage(page.id || page.nameDe.toLowerCase()),
  ]);
  const poisData = pois.status === 'fulfilled' ? pois.value : [];
  const climateData = climate.status === 'fulfilled' ? climate.value : null;
  const coords = COORDS[page.climateKey] || COORDS[page.nameDe.toLowerCase()] || null;
  const img = image.status === 'fulfilled' ? image.value : null;
  const heroImage  = img ? img.url : null;
  const heroCredit = img ? { name: img.creditName, link: img.creditLink } : null;

  const content = `
    <div class="section"><div class="container-narrow">
      <div class="wiki-intro">In ${escapeHtml(page.nameDe)} warten Unterkünfte für jeden Anspruch – von Budgethotels bis zu 5-Sterne-Resorts.</div>
    </div></div>
    ${coords ? renderMap(coords.lat, coords.lon, page.nameDe) : ''}
    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}
    ${climateData ? renderClimateChart(climateData, page.nameDe) : ''}
    <div class="section"><div class="container-narrow">
      <h2 class="section-title">✅ Hotel<span>tipps</span></h2>
      ${renderTips(page.tips)}
    </div></div>
    <div class="section-alt"><div class="container-narrow">
      <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
      ${renderFAQ(page.faqs)}
    </div></div>
    ${renderCTA(page.nameDe)}`;

  const html = assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateAktivitaetPage(page) {
  const [pois, climate, image] = await Promise.allSettled([
    getTopPOIs(page.nameDe, 4),
    getClimateData(page.climateKey),
    getUnsplashImage(page.id || page.nameDe.toLowerCase()),
  ]);
  const poisData = pois.status === 'fulfilled' ? pois.value : [];
  const climateData = climate.status === 'fulfilled' ? climate.value : null;
  const coords = COORDS[page.climateKey] || COORDS[page.nameDe.toLowerCase()] || null;
  const img = image.status === 'fulfilled' ? image.value : null;
  const heroImage  = img ? img.url : null;
  const heroCredit = img ? { name: img.creditName, link: img.creditLink } : null;

  const content = `
    <div class="section"><div class="container-narrow">
      <div class="wiki-intro">${escapeHtml(page.aktivitaet)} in ${escapeHtml(page.nameDe)} ist ein Erlebnis der Extraklasse.</div>
    </div></div>
    ${coords ? renderMap(coords.lat, coords.lon, page.nameDe) : ''}
    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}
    ${climateData ? renderClimateChart(climateData, page.nameDe) : ''}
    <div class="section"><div class="container-narrow">
      <h2 class="section-title">✅ Unsere <span>Tipps</span></h2>
      ${renderTips(page.tips)}
    </div></div>
    <div class="section-alt"><div class="container-narrow">
      <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
      ${renderFAQ(page.faqs)}
    </div></div>
    ${renderCTA(page.nameDe)}`;

  const html = assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateRegionPage(page) {
  const [wiki, pois, climate, image] = await Promise.allSettled([
    getWikipediaSummary(page.nameDe),
    getTopPOIs(page.nameDe, 5),
    getClimateData(page.climateKey),
    getUnsplashImage(page.id || page.nameDe.toLowerCase()),
  ]);
  const wikiText = wiki.status === 'fulfilled' ? wiki.value : '';
  const poisData = pois.status === 'fulfilled' ? pois.value : [];
  const climateData = climate.status === 'fulfilled' ? climate.value : null;
  const coords = COORDS[page.climateKey] || COORDS[page.nameDe.toLowerCase()] || null;
  const img = image.status === 'fulfilled' ? image.value : null;
  const heroImage  = img ? img.url : null;
  const heroCredit = img ? { name: img.creditName, link: img.creditLink } : null;

  const content = `
    <div class="section"><div class="container-narrow">
      ${wikiText ? `<div class="wiki-intro">${escapeHtml(wikiText)}</div>` : ''}
    </div></div>
    ${coords ? renderMap(coords.lat, coords.lon, page.nameDe) : ''}
    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}
    ${climateData ? renderClimateChart(climateData, page.nameDe) : ''}
    <div class="section"><div class="container-narrow">
      <h2 class="section-title">✅ Reise<span>tipps</span></h2>
      ${renderTips(page.tips)}
    </div></div>
    <div class="section-alt"><div class="container-narrow">
      <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
      ${renderFAQ(page.faqs)}
    </div></div>
    ${renderCTA(page.nameDe)}`;

  const html = assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateReisetippsPage(page) {
  const imgRes = await getUnsplashImage(page.id || page.thema || 'travel').catch(() => null);
  const heroImage  = imgRes ? imgRes.url : null;
  const heroCredit = imgRes ? { name: imgRes.creditName, link: imgRes.creditLink } : null;
  const content = `
    <div class="section"><div class="container-narrow">
      <div class="wiki-intro">Gut informiert verreist besser. Hier finden Sie alle wichtigen Informationen zu: <strong>${escapeHtml(page.thema)}</strong>.</div>
    </div></div>
    <div class="section-alt"><div class="container-narrow">
      <h2 class="section-title">✅ Die wichtigsten <span>Tipps</span></h2>
      ${renderTips(page.tips)}
    </div></div>
    <div class="section"><div class="container-narrow">
      <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
      ${renderFAQ(page.faqs)}
    </div></div>
    ${renderCTA('Ihrem Traumurlaub')}`;

  const html = assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

async function generateVergleichPage(page) {
  const [c1, imageRes] = await Promise.allSettled([
    getClimateData(page.dest1.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')),
    getUnsplashImage(page.id || page.dest1.toLowerCase()),
  ]);
  const climate1 = c1.status === 'fulfilled' ? c1.value : null;
  const img = imageRes.status === 'fulfilled' ? imageRes.value : null;
  const heroImage  = img ? img.url : null;
  const heroCredit = img ? { name: img.creditName, link: img.creditLink } : null;
  const slug1 = page.dest1.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/\s+/g,'-');
  const slug2 = page.dest2.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/\s+/g,'-');

  const content = `
    <div class="section"><div class="container-narrow">
      <div class="wiki-intro">Wir vergleichen <strong>${escapeHtml(page.dest1)}</strong> und <strong>${escapeHtml(page.dest2)}</strong> direkt – damit Sie die beste Entscheidung treffen können.</div>
    </div></div>
    ${climate1 ? renderClimateChart(climate1, page.dest1) : ''}
    <div class="section"><div class="container-narrow">
      <h2 class="section-title">✅ Unsere <span>Empfehlungen</span></h2>
      ${renderTips(page.tips)}
    </div></div>
    <div class="section-alt"><div class="container-narrow">
      <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
      ${renderFAQ(page.faqs)}
    </div></div>
    <div class="section"><div class="container">
      <h2 class="section-title">🌍 Direkt zur <span>Destination</span></h2>
      <div class="dest-tags">
        <a href="/${escapeHtml(slug1)}.html" class="dest-tag">→ ${escapeHtml(page.dest1)} entdecken</a>
        <a href="/${escapeHtml(slug2)}.html" class="dest-tag">→ ${escapeHtml(page.dest2)} entdecken</a>
      </div>
    </div></div>
    ${renderCTA(`${page.dest1} oder ${page.dest2}`)}`;

  const html = assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
  const outPath = path.join(ROOT_DIR, page.file);
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

async function generatePage(page) {
  fs.mkdirSync(path.dirname(path.join(ROOT_DIR, page.file)), { recursive: true });
  switch (page.type) {
    case 'destination': return generateDestinationPage(page);
    case 'city':        return generateCityPage(page);
    case 'reisezeit':   return generateReisezeitPage(page);
    case 'thema':       return generateThemaPage(page);
    case 'hotel':       return generateHotelPage(page);
    case 'aktivitaet':  return generateAktivitaetPage(page);
    case 'region':      return generateRegionPage(page);
    case 'reisetipps':  return generateReisetippsPage(page);
    case 'vergleich':   return generateVergleichPage(page);
    default:
      console.warn(`[gen] Unknown type "${page.type}" for ${page.file}`);
      return null;
  }
}

// ── Assign types to pages that lack them ─────────────────────────────────────

function normalizePages(pages) {
  return pages.map(p => {
    if (p.type) return p;
    if (DESTINATION_PAGES.includes(p))  return { ...p, type: 'destination' };
    if (CITY_PAGES.includes(p))         return { ...p, type: 'city' };
    if (REISEZEIT_PAGES.includes(p))    return { ...p, type: 'reisezeit' };
    if (THEMA_PAGES.includes(p))        return { ...p, type: 'thema' };
    if (HOTEL_PAGES.includes(p))        return { ...p, type: 'hotel' };
    if (AKTIVITAET_PAGES.includes(p))   return { ...p, type: 'aktivitaet' };
    if (REGION_PAGES.includes(p))       return { ...p, type: 'region' };
    if (REISETIPPS_PAGES.includes(p))   return { ...p, type: 'reisetipps' };
    if (VERGLEICH_PAGES.includes(p))    return { ...p, type: 'vergleich' };
    // Fallback: infer type from file path for pages added without explicit type
    if (p.file) {
      if (p.file.includes('/reisezeit/'))   return { ...p, type: 'reisezeit' };
      if (p.file.startsWith('themen/'))     return { ...p, type: 'thema' };
      if (p.file.startsWith('tipps/'))      return { ...p, type: 'reisetipps' };
      if (p.file.startsWith('vergleiche/')) return { ...p, type: 'vergleich' };
      if (p.file.includes('/hotels-'))      return { ...p, type: 'hotel' };
      return { ...p, type: 'city' };
    }
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

// ── Schedule / Entry Point ────────────────────────────────────────────────────

if (process.env.RUN_ONCE === '1') {
  // GitHub Actions mode: run once and exit
  console.log('[engine] RUN_ONCE mode – generating batch and exiting.');
  runContentEngine()
    .then(() => { console.log('[engine] Done.'); process.exit(0); })
    .catch(err => { console.error('[engine] Fatal:', err.message); process.exit(1); });
} else {
  // Railway/persistent mode: cron DISABLED – manual trigger only
  // cron.schedule('0 2 * * *', () => {
  //   runContentEngine().catch(err => console.error('[cron] Unhandled error:', err.message));
  // });
  console.log('[engine] Content engine started. Auto-cron is DISABLED (manual trigger only).');
}
