'use strict';

/**
 * One-time bulk run: generates ALL pending pages and pushes in a single commit.
 * Usage: GITHUB_TOKEN=xxx OPENTRIPMAP_KEY=xxx node run-all.js
 */

const fs = require('fs');
const path = require('path');
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
  renderIntro,
  escapeHtml,
} = require('./templates');

const { ALL_PAGES, DESTINATION_PAGES, CITY_PAGES, REISEZEIT_PAGES, THEMA_PAGES,
  HOTEL_PAGES, AKTIVITAET_PAGES, REGION_PAGES, REISETIPPS_PAGES, VERGLEICH_PAGES } = require('./pages');

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
        ${renderIntro(wiki, page.intro)}
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

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
}

async function generateCityPage(page) {
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
        ${renderIntro(wiki, page.intro)}
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

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
}

async function generateReisezeitPage(page) {
  const [climateRes, imageRes] = await Promise.allSettled([
    getClimateData(page.nameDe.toLowerCase()),
    getUnsplashImage(page.nameDe.toLowerCase()),
  ]);
  const climate = climateRes.status === 'fulfilled' ? climateRes.value : null;
  const coords  = COORDS[page.nameDe.toLowerCase()] || null;
  const imgR = imageRes.status === 'fulfilled' ? imageRes.value : null;
  const heroImage  = imgR ? imgR.url : null;
  const heroCredit = imgR ? { name: imgR.creditName, link: imgR.creditLink } : null;
  const months  = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const bestIdx = [3, 4, 8, 9];
  const seasonTable = `
    <div style="overflow-x:auto;">
      <table class="season-table">
        <thead><tr><th>Monat</th><th>Eignung</th><th>Hinweis</th></tr></thead>
        <tbody>
          ${months.map((m, i) => {
            const best = bestIdx.includes(i);
            const hot  = i >= 5 && i <= 7;
            const off  = i === 11 || i <= 1;
            const rating = best ? '⭐⭐⭐⭐⭐ Ideal' : hot ? '⭐⭐⭐⭐ Hochsaison' : off ? '⭐⭐ Nebensaison' : '⭐⭐⭐ Gut';
            const note   = best ? 'Beste Kombination aus Wetter & Preis' : hot ? 'Hochsaison – höchste Preise' : off ? 'Ruhig & günstig' : 'Angenehme Temperaturen';
            return `<tr${best ? ' class="best-month"' : ''}><td>${escapeHtml(m)}</td><td>${rating}</td><td>${escapeHtml(note)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  const breadcrumbRz = page.parentFile ? `
    <nav class="breadcrumb">
      <a href="/index.html">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(page.parentFile)}">${escapeHtml(page.nameDe)}</a> &rsaquo;
      <span>Beste Reisezeit</span>
    </nav>` : '';

  const content = `
    ${breadcrumbRz}
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
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">Alle Infos, Regionen und Angebote für ${escapeHtml(page.nameDe)}:</p>
        <a href="/${escapeHtml(page.destFile)}" class="dest-link-btn">${escapeHtml(page.icon)} ${escapeHtml(page.nameDe)} – Kompletter Reiseguide &rarr;</a>
      </div>
    </div>

    ${renderCTA(page.nameDe)}`;

  return assemblePage({ title: page.title, description: page.description, h1Parts: ['Beste Reisezeit', page.nameDe], heroSub: `Monat für Monat erklärt: wann lohnt sich eine Reise nach ${page.nameDe}?`, icon: page.icon, content, heroImage, heroCredit });
}

async function generateThemaPage(page) {
  const imgRes = await getUnsplashImage(page.themaQuery || 'travel vacation beach').catch(() => null);
  const heroImage  = imgRes ? imgRes.url : null;
  const heroCredit = imgRes ? { name: imgRes.creditName, link: imgRes.creditLink } : null;
  const destLinks = page.destinations.map(d => {
    const slug = d.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/\s+/g,'-');
    return `<a href="/${escapeHtml(slug)}/" class="dest-tag">${escapeHtml(d)}</a>`;
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

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
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

  const breadcrumb = page.parent ? `
    <nav class="breadcrumb">
      <a href="/index.html">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(page.parentFile)}">${escapeHtml(page.parent)}</a> &rsaquo;
      <span>${escapeHtml(page.nameDe)}</span>
    </nav>` : '';

  const content = `
    ${breadcrumb}
    <div class="section">
      <div class="container-narrow">
        <div class="wiki-intro">In ${escapeHtml(page.nameDe)} warten Unterkünfte für jeden Anspruch – von Budgethotels bis zu 5-Sterne-Resorts. Unsere Auswahl hilft Ihnen, das perfekte Hotel zu finden.</div>
      </div>
    </div>

    ${coords ? renderMap(coords.lat, coords.lon, page.nameDe) : ''}

    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}

    ${climateData ? renderClimateChart(climateData, page.nameDe) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">✅ Hotel<span>tipps</span></h2>
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

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
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

  const breadcrumbAkt = page.parent ? `
    <nav class="breadcrumb">
      <a href="/index.html">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(page.parentFile)}">${escapeHtml(page.parent)}</a> &rsaquo;
      <span>${escapeHtml(page.nameDe)}</span>
    </nav>` : '';

  const content = `
    ${breadcrumbAkt}
    <div class="section">
      <div class="container-narrow">
        <div class="wiki-intro">${escapeHtml(page.aktivitaet)} in ${escapeHtml(page.nameDe)} ist ein Erlebnis der Extraklasse. Wir zeigen Ihnen die besten Spots, Tipps und alles was Sie für Ihren Aktivurlaub wissen müssen.</div>
      </div>
    </div>

    ${coords ? renderMap(coords.lat, coords.lon, page.nameDe) : ''}

    ${poisData.length > 0 ? renderPOIs(poisData, page.nameDe) : ''}

    ${climateData ? renderClimateChart(climateData, page.nameDe) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">✅ Unsere <span>Tipps</span></h2>
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

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
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

  const breadcrumbReg = page.parent ? `
    <nav class="breadcrumb">
      <a href="/index.html">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(page.parentFile)}">${escapeHtml(page.parent)}</a> &rsaquo;
      <span>${escapeHtml(page.nameDe)}</span>
    </nav>` : '';

  const content = `
    ${breadcrumbReg}
    <div class="section">
      <div class="container-narrow">
        ${wikiText ? `<div class="wiki-intro">${escapeHtml(wikiText)}</div>` : ''}
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

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
}

async function generateReisetippsPage(page) {
  const imgRes = await getUnsplashImage(page.id || page.thema || 'travel').catch(() => null);
  const heroImage  = imgRes ? imgRes.url : null;
  const heroCredit = imgRes ? { name: imgRes.creditName, link: imgRes.creditLink } : null;
  const content = `
    <div class="section">
      <div class="container-narrow">
        <div class="wiki-intro">Gut informiert verreist besser. Hier finden Sie alle wichtigen Informationen zu: <strong>${escapeHtml(page.thema)}</strong>.</div>
      </div>
    </div>

    <div class="section-alt">
      <div class="container-narrow">
        <h2 class="section-title">✅ Die wichtigsten <span>Tipps</span></h2>
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
        <h2 class="section-title">🌍 Beliebte <span>Reiseziele</span></h2>
        <div class="dest-tags">
          <a href="/tuerkei/" class="dest-tag">🇹🇷 Türkei</a>
          <a href="/spanien/" class="dest-tag">🇪🇸 Spanien</a>
          <a href="/griechenland/" class="dest-tag">🇬🇷 Griechenland</a>
          <a href="/portugal/" class="dest-tag">🇵🇹 Portugal</a>
          <a href="/kroatien/" class="dest-tag">🇭🇷 Kroatien</a>
          <a href="/dubai/" class="dest-tag">🇦🇪 Dubai</a>
          <a href="/marokko/" class="dest-tag">🇲🇦 Marokko</a>
          <a href="/aegypten/" class="dest-tag">🇪🇬 Ägypten</a>
        </div>
      </div>
    </div>

    ${renderCTA('Ihrem Traumurlaub')}`;

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
}

async function generateVergleichPage(page) {
  const [c1, c2, imageRes] = await Promise.allSettled([
    getClimateData(page.dest1.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')),
    getClimateData(page.dest2.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')),
    getUnsplashImage(page.id || page.dest1.toLowerCase()),
  ]);
  const climate1 = c1.status === 'fulfilled' ? c1.value : null;
  const img = imageRes.status === 'fulfilled' ? imageRes.value : null;
  const heroImage  = img ? img.url : null;
  const heroCredit = img ? { name: img.creditName, link: img.creditLink } : null;

  const slug1 = page.dest1.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/\s+/g,'-');
  const slug2 = page.dest2.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/\s+/g,'-');

  const content = `
    <div class="section">
      <div class="container-narrow">
        <div class="wiki-intro">Wir vergleichen <strong>${escapeHtml(page.dest1)}</strong> und <strong>${escapeHtml(page.dest2)}</strong> direkt – damit Sie die beste Entscheidung für Ihren nächsten Urlaub treffen können.</div>
      </div>
    </div>

    <div class="section-alt">
      <div class="container">
        <h2 class="section-title">⚖️ Der direkte <span>Vergleich</span></h2>
        <div class="stat-grid">
          <div class="stat-card">
            <span class="stat-icon">✈️</span>
            <span class="stat-label">Flugzeit</span>
            <span class="stat-value">${escapeHtml(page.dest1)}: kürzer</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">💶</span>
            <span class="stat-label">Preis</span>
            <span class="stat-value">Ähnliches Niveau</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">☀️</span>
            <span class="stat-label">Klima</span>
            <span class="stat-value">Beide sunny</span>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🏖️</span>
            <span class="stat-label">Strand</span>
            <span class="stat-value">Beide top</span>
          </div>
        </div>
      </div>
    </div>

    ${climate1 ? renderClimateChart(climate1, page.dest1) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">✅ Unsere <span>Empfehlungen</span></h2>
        ${renderTips(page.tips)}
      </div>
    </div>

    <div class="section-alt">
      <div class="container-narrow">
        <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
        ${renderFAQ(page.faqs)}
      </div>
    </div>

    <div class="section">
      <div class="container">
        <h2 class="section-title">🌍 Direkt zur <span>Destination</span></h2>
        <div class="dest-tags">
          <a href="/${escapeHtml(slug1)}/" class="dest-tag">→ ${escapeHtml(page.dest1)} entdecken</a>
          <a href="/${escapeHtml(slug2)}/" class="dest-tag">→ ${escapeHtml(page.dest2)} entdecken</a>
        </div>
      </div>
    </div>

    ${renderCTA(`${page.dest1} oder ${page.dest2}`)}`;

  return assemblePage({ title: page.title, description: page.description, h1Parts: page.h1Parts, heroSub: page.heroSub, icon: page.icon, content, heroImage, heroCredit });
}

function getType(page) {
  if (DESTINATION_PAGES.includes(page))  return 'destination';
  if (CITY_PAGES.includes(page))         return 'city';
  if (REISEZEIT_PAGES.includes(page))    return 'reisezeit';
  if (THEMA_PAGES.includes(page))        return 'thema';
  if (HOTEL_PAGES.includes(page))        return 'hotel';
  if (AKTIVITAET_PAGES.includes(page))   return 'aktivitaet';
  if (REGION_PAGES.includes(page))       return 'region';
  if (REISETIPPS_PAGES.includes(page))   return 'reisetipps';
  if (VERGLEICH_PAGES.includes(page))    return 'vergleich';
  return page.type || null;
}

async function generatePage(page) {
  const type = getType(page);
  switch (type) {
    case 'destination': return generateDestinationPage(page);
    case 'city':        return generateCityPage(page);
    case 'reisezeit':   return generateReisezeitPage(page);
    case 'thema':       return generateThemaPage(page);
    case 'hotel':       return generateHotelPage(page);
    case 'aktivitaet':  return generateAktivitaetPage(page);
    case 'region':      return generateRegionPage(page);
    case 'reisetipps':  return generateReisetippsPage(page);
    case 'vergleich':   return generateVergleichPage(page);
    default: throw new Error(`Unknown type for ${page.file}`);
  }
}

// ── Sitemap generator ─────────────────────────────────────────────────────────

function generateSitemap() {
  const BASE = 'https://www.jetztbuchbar.de';
  const today = new Date().toISOString().split('T')[0];

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', freq: 'weekly' },
    { url: '/ueber-uns.html', priority: '0.4', freq: 'monthly' },
    { url: '/impressum.html', priority: '0.2', freq: 'monthly' },
    { url: '/datenschutz.html', priority: '0.2', freq: 'monthly' },
  ];

  // Recursive HTML file scanner
  function collectHtmlFiles(dir, baseDir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
      if (entry.isDirectory() && !['content-engine', '.git', 'node_modules'].includes(entry.name)) {
        files = files.concat(collectHtmlFiles(path.join(dir, entry.name), baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(path.relative(baseDir, path.join(dir, entry.name)).replace(/\\/g, '/'));
      }
    }
    return files;
  }

  // Normalize path to URL: foo/bar/index.html → /foo/bar/  (trailing slash)
  function toUrl(rel) {
    if (rel === 'index.html') return '/';
    if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
    return '/' + rel;
  }

  const allHtmlFiles = collectHtmlFiles(ROOT_DIR, ROOT_DIR)
    .filter(f => !['index.html','ueber-uns.html','impressum.html','datenschutz.html'].includes(f))
    .sort();

  const priorityMap = {
    'tuerkei/index.html': '0.9', 'spanien/index.html': '0.9', 'griechenland/index.html': '0.9',
    'aegypten/index.html': '0.9', 'marokko/index.html': '0.9', 'dubai/index.html': '0.9',
    'kroatien/index.html': '0.9', 'portugal/index.html': '0.9', 'tunesien/index.html': '0.9',
    'bulgarien/index.html': '0.9', 'malta/index.html': '0.9', 'zypern/index.html': '0.9',
    'kap-verde/index.html': '0.9', 'jordanien/index.html': '0.9',
  };

  function getPriority(rel) {
    if (priorityMap[rel]) return priorityMap[rel];
    const parts = rel.split('/');
    if (parts.length === 3 && parts[2] === 'index.html') {
      if (['themen','tipps','vergleiche'].includes(parts[0])) return '0.75';
      if (parts[1] === 'reisezeit') return '0.80';
      if (parts[1].startsWith('hotels-') || parts[1] === 'hotels') return '0.80';
      return '0.85'; // city / aktivitaet / region
    }
    return '0.70';
  }

  const urls = [
    ...staticPages.map(p => `  <url>\n    <loc>${BASE}${p.url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`),
    ...allHtmlFiles.map(f => { const url = toUrl(f); return `  <url>\n    <loc>${BASE}${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${getPriority(f)}</priority>\n  </url>`; }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  const outPath = path.join(ROOT_DIR, 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`[sitemap] Written: ${urls.length} URLs → sitemap.xml`);
  return outPath;
}

async function pingGoogle() {
  const sitemapUrl = 'https://www.jetztbuchbar.de/sitemap.xml';
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    console.log(`[ping] Google ping → HTTP ${res.status}`);
  } catch (err) {
    console.warn(`[ping] Google ping failed: ${err.message}`);
  }
}

// ── Refresh schedule (days until a page is regenerated by cron) ───────────────

const REFRESH_DAYS = {
  destination: 30,
  city:        30,
  hotel:       30,
  region:      30,
  reisezeit:   90,
  thema:       90,
  aktivitaet:  90,
  // reisetipps + vergleich: static evergreen → never refresh automatically
};

function needsRefresh(page, tracker) {
  const entry = tracker[page.id];
  if (!entry) return true;                          // never generated
  const days = REFRESH_DAYS[page.type];
  if (!days) return false;                          // static type, skip
  const ageInDays = (Date.now() - new Date(entry.generatedAt).getTime()) / 86_400_000;
  return ageInDays > days;
}

// ── Bulk run ──────────────────────────────────────────────────────────────────

async function bulkRun() {
  const tracker = loadTracker();
  const pending = ALL_PAGES.filter(p => needsRefresh(p, tracker));
  console.log(`[bulk] ${pending.length} pages to generate (new or due for refresh).`);

  const generatedFiles = [];

  for (const page of pending) {
    try {
      console.log(`[gen] ${page.file}`);
      const html = await generatePage(page);
      const outPath = path.join(ROOT_DIR, page.file);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html, 'utf8');
      const wasRefresh = !!tracker[page.id];
      tracker[page.id] = { generatedAt: new Date().toISOString(), file: page.file };
      saveTracker(tracker);
      generatedFiles.push(page.file);
      console.log(`[ok]  ${page.file}${wasRefresh ? ' (refreshed)' : ' (new)'}`);
    } catch (err) {
      console.error(`[err] ${page.file}: ${err.message}`);
    }
  }

  if (generatedFiles.length === 0) {
    // Still regenerate sitemap in case pages were added manually
    const sitemapPath = generateSitemap();
    await pingGoogle();
    console.log('[bulk] No new pages, but sitemap refreshed.');
    if (GITHUB_TOKEN) {
      const git = simpleGit(ROOT_DIR);
      const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
      await git.remote(['set-url', 'origin', remoteUrl]);
      await git.add('sitemap.xml');
      const today = new Date().toISOString().split('T')[0];
      await git.commit(`chore: refresh sitemap.xml ${today}`).catch(() => {});
      await git.push('origin', 'main').catch(() => {});
    }
    return;
  }

  if (!GITHUB_TOKEN) {
    console.warn('[git] No GITHUB_TOKEN – skipping push.');
    return;
  }

  console.log(`\n[git] Committing ${generatedFiles.length} files...`);

  // Generate sitemap before committing
  const sitemapPath = generateSitemap();
  await pingGoogle();

  const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
  const git = simpleGit(ROOT_DIR);
  try {
    await git.remote(['set-url', 'origin', remoteUrl]);
    for (const f of generatedFiles) await git.add(f);
    await git.add('sitemap.xml');
    await git.add('content-engine/generated-pages.json');
    const today = new Date().toISOString().split('T')[0];
    await git.commit(`content: bulk generate ${generatedFiles.length} SEO pages ${today}`);
    await git.push('origin', 'main');
    console.log('[git] Pushed successfully!');
  } catch (err) {
    console.error('[git] Push failed:', err.message);
  }
}

bulkRun()
  .then(() => {
    // After bulk refresh, run the auto-expand engine (10 new seeds/day)
    const { expandRun } = require('./auto-expand');
    return expandRun();
  })
  .catch(err => { console.error('[bulk] Fatal:', err.message); process.exit(1); });
