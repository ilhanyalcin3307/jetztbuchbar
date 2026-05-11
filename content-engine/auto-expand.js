'use strict';

/**
 * AUTO-EXPAND ENGINE — JetztBuchbar Content Engine
 *
 * Daily runs (Railway cron 02:00):
 *   1. Reads seeds.js catalog (~80+ seeds)
 *   2. Picks next PAGES_PER_RUN seeds not yet generated
 *   3. Generates full HTML page per seed (Wikipedia + Unsplash + Climate + POIs)
 *   4. Injects a card into the parent destination page
 *   5. Commits & pushes everything to GitHub
 *
 * Standalone usage:
 *   GITHUB_TOKEN=xxx OPENTRIPMAP_KEY=xxx node auto-expand.js
 */

const fs       = require('fs');
const path     = require('path');
const simpleGit = require('simple-git');
const fetch    = require('node-fetch');

const {
  getWikipediaSummary,
  getTopPOIs,
  getClimateData,
  getUnsplashImage,
  COORDS,
} = require('./apis');

const {
  assemblePage,
  renderMap,
  renderClimateChart,
  renderPOIs,
  renderTips,
  renderFAQ,
  renderCTA,
  renderIntro,
  escapeHtml,
} = require('./templates');

const { ALL_SEEDS } = require('./seeds');

// ── Config ────────────────────────────────────────────────────────────────────

const PAGES_PER_RUN  = 10;
const ROOT_DIR       = path.join(__dirname, '..');
const TRACKER_FILE   = path.join(__dirname, 'expansion-tracker.json');
const REPO_OWNER     = process.env.REPO_OWNER || 'ilhanyalcin3307';
const REPO_NAME      = process.env.REPO_NAME  || 'jetztbuchbar';
const GITHUB_TOKEN   = process.env.GITHUB_TOKEN;

// Sentinel comments used for card injection in parent pages
const SENTINEL_START = '<!-- AUTO_SUBPAGES_START -->';
const SENTINEL_END   = '<!-- AUTO_SUBPAGES_END -->';

// ── Tracker helpers ───────────────────────────────────────────────────────────

function loadTracker() {
  try {
    if (fs.existsSync(TRACKER_FILE)) return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
  } catch (_) {}
  return {};
}

function saveTracker(t) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(t, null, 2), 'utf8');
}

// ── Template tips / FAQs (auto-generated per type) ───────────────────────────

function cityTips(nameDe, country) {
  return [
    `${nameDe} in ${country} ist von Wien, München und Zürich mit Direktflügen erreichbar – Flugzeit je nach Strecke 2–5 Stunden.`,
    `Die beste Reisezeit für ${nameDe} liegt zwischen Mai und Oktober: angenehme Temperaturen, wenig Regen, viel Sonne.`,
    `Frühzeitig buchen lohnt sich: Unterkünfte und Flüge nach ${nameDe} sind 3–4 Monate im Voraus deutlich günstiger.`,
    `Wechseln Sie Geld erst vor Ort – Wechselstuben in Touristenzentren bieten meist bessere Kurse als der Flughafen.`,
    `Abseits der Hauptsehenswürdigkeiten entdecken Sie in ${nameDe} die schönsten Ecken: Gassen, lokale Märkte und kleine Restaurants.`,
  ];
}

function cityFAQs(nameDe, country) {
  return [
    { q: `Wie lange dauert der Flug nach ${nameDe}?`,           a: `Von Wien, München oder Zürich dauert der Flug nach ${nameDe} je nach Fluggesellschaft und Route zwischen 2,5 und 5 Stunden. Direktflüge sind auf vielen Strecken verfügbar.` },
    { q: `Wann ist die beste Reisezeit für ${nameDe}?`,         a: `Die beste Reisezeit für ${nameDe} ist Mai bis Oktober. Frühling (April–Mai) und Herbst (September–Oktober) bieten angenehme Temperaturen ohne die extreme Sommerhitze.` },
    { q: `Brauche ich ein Visum für ${country}?`,               a: `Für EU-Bürger (Deutschland, Österreich) und Schweizer Reisende ist die Einreise nach ${country} in der Regel visumfrei oder per Visa on Arrival möglich. Bitte vor der Reise die aktuellen Einreisebedingungen prüfen.` },
    { q: `Ist ${nameDe} familienfreundlich?`,                   a: `Ja, ${nameDe} eignet sich gut für Familien mit Kindern. Es gibt viele familienfreundliche Hotels, Aktivitäten und Strände. Besonders All-Inclusive-Resorts bieten alles aus einer Hand.` },
    { q: `Wie teuer ist ein Urlaub in ${nameDe}?`,              a: `Die Kosten variieren stark nach Unterkunft und Reisestil. Budget-Reisende kommen mit ca. 50–80 €/Tag aus, All-Inclusive-Hotels bieten ab 80–150 €/Person/Nacht gute Pakete.` },
  ];
}

function regionTips(nameDe, country) {
  return [
    `Die Region ${nameDe} in ${country} begeistert mit einer Mischung aus Natur, Kultur und authentischen Erlebnissen.`,
    `Am besten erkundet man ${nameDe} mit einem Mietwagen – so sind auch abgelegene Strände und Dörfer erreichbar.`,
    `Beste Reisezeit: Mai bis Oktober für Badeurlaub, März bis Mai für Naturwanderungen ohne Sommerhitze.`,
    `Lokale Spezialitäten probieren: Die Küche in ${nameDe} spiegelt den Charakter der Region perfekt wider.`,
    `Hotels und Ferienwohnungen im Voraus buchen – besonders in der Hochsaison (Juli/August) ist die Auslastung sehr hoch.`,
  ];
}

function regionFAQs(nameDe, country) {
  return [
    { q: `Was macht ${nameDe} besonders?`,                      a: `${nameDe} in ${country} verbindet Naturschönheiten mit kulturellen Highlights. Die Region ist bekannt für ihre malerische Landschaft, lokale Kulinarik und freundliche Einheimische.` },
    { q: `Wie kommt man nach ${nameDe}?`,                       a: `Am besten fliegen Sie in die nächstgelegene Stadt und mieten dann ein Auto. ${nameDe} ist in der Regel innerhalb von 1–2 Stunden Fahrt vom nächsten Flughafen erreichbar.` },
    { q: `Welche Aktivitäten gibt es in ${nameDe}?`,            a: `In ${nameDe} können Sie wandern, schwimmen, Kulturdenkmäler besuchen und die lokale Küche genießen. Geführte Touren bieten zusätzlich exklusive Einblicke.` },
    { q: `Ist ${nameDe} für Familien geeignet?`,                a: `Ja, ${nameDe} ist familienfreundlich. Die ruhige Natur und die sicheren Strände machen die Region zu einem idealen Reiseziel für Familien mit Kindern.` },
    { q: `Wann ist die beste Reisezeit für ${nameDe}?`,         a: `Die beste Reisezeit für ${nameDe} ist Frühling (April–Mai) und Herbst (September–Oktober) für milde Temperaturen. Badeurlaub ist von Juni bis September ideal.` },
  ];
}

function aktivitaetTips(aktivitaet, nameDe, country) {
  return [
    `${aktivitaet} in ${nameDe} gehört zu den beliebtesten Aktivitäten für Urlauber in ${country}.`,
    `Buchen Sie ${aktivitaet}-Touren immer mindestens 2–3 Tage im Voraus – besonders in der Hochsaison sind die Plätze schnell vergriffen.`,
    `Seriöse Anbieter vor Ort bieten ${aktivitaet}-Erlebnisse mit professioneller Ausrüstung und erfahrenen Guides.`,
    `Für ${aktivitaet} empfehlen wir morgens früh zu starten – Temperaturen sind angenehmer und weniger Touristen unterwegs.`,
    `Schutzausrüstung und Sonnencrème nicht vergessen – besonders bei Outdoor-Aktivitäten in der Mittagssonne.`,
  ];
}

function aktivitaetFAQs(aktivitaet, nameDe, country) {
  return [
    { q: `Was kostet ${aktivitaet} in ${nameDe}?`,              a: `Die Preise variieren je nach Anbieter und Dauer. Einfache ${aktivitaet}-Touren starten bei ca. 30–60 € pro Person, Premium-Packages kosten 80–150 €.` },
    { q: `Ist ${aktivitaet} in ${nameDe} sicher?`,              a: `Ja, bei seriösen Anbietern mit zertifizierten Guides ist ${aktivitaet} in ${nameDe} sicher. Immer auf Sicherheitsausrüstung und Zertifizierungen achten.` },
    { q: `Ab welchem Alter ist ${aktivitaet} möglich?`,         a: `Die meisten ${aktivitaet}-Angebote sind für Personen ab 8–12 Jahren geeignet. Für Kinder gibt es spezielle Anfängerkurse. Bitte beim Anbieter nachfragen.` },
    { q: `Wann ist die beste Zeit für ${aktivitaet} in ${nameDe}?`, a: `Die beste Saison für ${aktivitaet} in ${nameDe} ist von Mai bis Oktober, wenn das Wetter stabil und die Bedingungen optimal sind.` },
    { q: `Was sollte ich für ${aktivitaet} mitbringen?`,        a: `Sonnencrème, Wasser, bequeme Kleidung und geschlossene Schuhe. Die meiste spezifische Ausrüstung wird vom Anbieter gestellt.` },
  ];
}

// ── Page generators ───────────────────────────────────────────────────────────

async function generateExpandCityPage(seed) {
  const [wikiRes, poisRes, climateRes, imageRes] = await Promise.allSettled([
    getWikipediaSummary(seed.wikiSearch),
    getTopPOIs(seed.poiSearch, 5),
    getClimateData(seed.climateKey),
    getUnsplashImage(seed.unsplashQuery),
  ]);

  const wiki    = wikiRes.status    === 'fulfilled' ? wikiRes.value    : '';
  const pois    = poisRes.status    === 'fulfilled' ? poisRes.value    : [];
  const climate = climateRes.status === 'fulfilled' ? climateRes.value : null;
  const img     = imageRes.status   === 'fulfilled' ? imageRes.value   : null;
  const coords  = COORDS[seed.climateKey] || COORDS[seed.nameDe.toLowerCase()] || null;

  const tips = cityTips(seed.nameDe, seed.parent);
  const faqs = cityFAQs(seed.nameDe, seed.parent);

  const content = `
    <nav class="breadcrumb">
      <a href="/">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(seed.parentFile)}">${escapeHtml(seed.parent)}</a> &rsaquo;
      <span>${escapeHtml(seed.nameDe)}</span>
    </nav>

    <div class="section">
      <div class="container-narrow">
        ${renderIntro(wiki)}
      </div>
    </div>

    ${coords ? renderMap(coords.lat, coords.lon, seed.nameDe) : ''}
    ${pois.length > 0 ? renderPOIs(pois, seed.nameDe) : ''}
    ${climate ? renderClimateChart(climate, seed.nameDe) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">✅ Tipps für <span>${escapeHtml(seed.nameDe)}</span></h2>
        ${renderTips(tips)}
      </div>
    </div>

    <div class="section-alt">
      <div class="container-narrow">
        <h2 class="section-title">❓ FAQ: <span>${escapeHtml(seed.nameDe)}</span></h2>
        ${renderFAQ(faqs)}
      </div>
    </div>

    ${renderCTA(seed.nameDe)}`;

  return {
    html: assemblePage({
      title:       `${seed.nameDe} Urlaub 2026 – Tipps, Sehenswürdigkeiten & Hotels | JetztBuchbar.de`,
      description: `${seed.nameDe} Urlaub 2026 günstig buchen: Beste Reisezeit, Sehenswürdigkeiten, Hotels und Insider-Tipps für DACH-Reisende.`,
      h1Parts:     ['Urlaub in', seed.nameDe],
      heroSub:     `${seed.nameDe} in ${seed.parent} – entdecken Sie die schönsten Strände, Sehenswürdigkeiten und Reisetipps für Ihren unvergesslichen Urlaub.`,
      icon:        seed.icon,
      content,
      heroImage:   img ? img.url : null,
      heroCredit:  img ? { name: img.creditName, link: img.creditLink } : null,
    }),
    cardImageUrl: img ? img.url : null,
  };
}

async function generateExpandRegionPage(seed) {
  const [wikiRes, poisRes, climateRes, imageRes] = await Promise.allSettled([
    getWikipediaSummary(seed.wikiSearch),
    getTopPOIs(seed.poiSearch, 5),
    getClimateData(seed.climateKey),
    getUnsplashImage(seed.unsplashQuery),
  ]);

  const wiki    = wikiRes.status    === 'fulfilled' ? wikiRes.value    : '';
  const pois    = poisRes.status    === 'fulfilled' ? poisRes.value    : [];
  const climate = climateRes.status === 'fulfilled' ? climateRes.value : null;
  const img     = imageRes.status   === 'fulfilled' ? imageRes.value   : null;
  const coords  = COORDS[seed.climateKey] || COORDS[seed.nameDe.toLowerCase()] || null;

  const tips = regionTips(seed.nameDe, seed.parent);
  const faqs = regionFAQs(seed.nameDe, seed.parent);

  const content = `
    <nav class="breadcrumb">
      <a href="/">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(seed.parentFile)}">${escapeHtml(seed.parent)}</a> &rsaquo;
      <span>${escapeHtml(seed.nameDe)}</span>
    </nav>

    <div class="section">
      <div class="container-narrow">
        ${renderIntro(wiki)}
      </div>
    </div>

    ${coords ? renderMap(coords.lat, coords.lon, seed.nameDe) : ''}
    ${pois.length > 0 ? renderPOIs(pois, seed.nameDe) : ''}
    ${climate ? renderClimateChart(climate, seed.nameDe) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">✅ Reise<span>tipps</span></h2>
        ${renderTips(tips)}
      </div>
    </div>

    <div class="section-alt">
      <div class="container-narrow">
        <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
        ${renderFAQ(faqs)}
      </div>
    </div>

    ${renderCTA(seed.nameDe)}`;

  return {
    html: assemblePage({
      title:       `${seed.nameDe} Reiseführer 2026 – Tipps & Sehenswürdigkeiten | JetztBuchbar.de`,
      description: `${seed.nameDe} entdecken: die schönsten Orte, besten Tipps und Insider-Informationen für Ihren Urlaub in ${seed.parent}.`,
      h1Parts:     [seed.nameDe, 'entdecken'],
      heroSub:     `${seed.nameDe} – eine der schönsten Regionen in ${seed.parent} mit einzigartiger Natur, Kultur und unvergesslichen Erlebnissen.`,
      icon:        seed.icon,
      content,
      heroImage:   img ? img.url : null,
      heroCredit:  img ? { name: img.creditName, link: img.creditLink } : null,
    }),
    cardImageUrl: img ? img.url : null,
  };
}

async function generateExpandAktivitaetPage(seed) {
  const [poisRes, climateRes, imageRes] = await Promise.allSettled([
    getTopPOIs(seed.poiSearch, 4),
    getClimateData(seed.climateKey),
    getUnsplashImage(seed.unsplashQuery),
  ]);

  const pois    = poisRes.status    === 'fulfilled' ? poisRes.value    : [];
  const climate = climateRes.status === 'fulfilled' ? climateRes.value : null;
  const img     = imageRes.status   === 'fulfilled' ? imageRes.value   : null;
  const coords  = COORDS[seed.climateKey] || COORDS[seed.nameDe.toLowerCase()] || null;

  const tips = aktivitaetTips(seed.aktivitaet, seed.nameDe, seed.parent);
  const faqs = aktivitaetFAQs(seed.aktivitaet, seed.nameDe, seed.parent);

  const content = `
    <nav class="breadcrumb">
      <a href="/">Startseite</a> &rsaquo;
      <a href="/${escapeHtml(seed.parentFile)}">${escapeHtml(seed.parent)}</a> &rsaquo;
      <span>${escapeHtml(seed.aktivitaet)} ${escapeHtml(seed.nameDe)}</span>
    </nav>

    <div class="section">
      <div class="container-narrow">
        <div class="wiki-intro">${escapeHtml(seed.aktivitaet)} in ${escapeHtml(seed.nameDe)} ist ein Erlebnis der Extraklasse. Wir zeigen Ihnen die besten Anbieter, Spots und alles was Sie für Ihren Aktivurlaub wissen müssen.</div>
      </div>
    </div>

    ${coords ? renderMap(coords.lat, coords.lon, seed.nameDe) : ''}
    ${pois.length > 0 ? renderPOIs(pois, seed.nameDe) : ''}
    ${climate ? renderClimateChart(climate, seed.nameDe) : ''}

    <div class="section">
      <div class="container-narrow">
        <h2 class="section-title">✅ Unsere <span>Tipps</span></h2>
        ${renderTips(tips)}
      </div>
    </div>

    <div class="section-alt">
      <div class="container-narrow">
        <h2 class="section-title">❓ Häufige <span>Fragen</span></h2>
        ${renderFAQ(faqs)}
      </div>
    </div>

    ${renderCTA(seed.nameDe)}`;

  return {
    html: assemblePage({
      title:       `${seed.aktivitaet} in ${seed.nameDe} 2026 – Tipps & Anbieter | JetztBuchbar.de`,
      description: `${seed.aktivitaet} in ${seed.nameDe}: die besten Anbieter, Preise und Insider-Tipps für Ihren Aktivurlaub in ${seed.parent}.`,
      h1Parts:     [seed.aktivitaet + ' in', seed.nameDe],
      heroSub:     `${seed.aktivitaet} in ${seed.nameDe} – unvergessliche Abenteuer, professionelle Guides und die besten Spots für Ihren Aktivurlaub.`,
      icon:        seed.icon,
      content,
      heroImage:   img ? img.url : null,
      heroCredit:  img ? { name: img.creditName, link: img.creditLink } : null,
    }),
    cardImageUrl: img ? img.url : null,
  };
}

// ── Card HTML for parent page injection ───────────────────────────────────────

function buildCardHtml(seed, cardImageUrl) {
  const href    = '/' + seed.file.replace('index.html', '');
  const altText = escapeHtml(seed.nameDe);
  const thumb   = cardImageUrl
    ? `<img class="dest-thumb" src="${cardImageUrl}" alt="${altText}" loading="lazy" />`
    : `<img class="dest-thumb" src="https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=400&q=70" alt="${altText}" loading="lazy" />`;

  return `      <a href="${href}" class="dest-card">
        <div class="dest-thumb-wrap">${thumb}</div>
        <div class="dest-card-body">
          <span class="dest-flag">${seed.icon}</span>
          <h3>${escapeHtml(seed.nameDe)}</h3>
          <p>${escapeHtml(seed.cardDesc)}</p>
          <span class="dest-badge">${escapeHtml(seed.cardBadge)}</span>
        </div>
      </a>`;
}

// ── Inject card into parent destination page ──────────────────────────────────

function injectCardIntoParent(seed, cardHtml) {
  const parentPath = path.join(ROOT_DIR, seed.parentFile, 'index.html');
  if (!fs.existsSync(parentPath)) {
    console.warn(`[inject] Parent not found: ${parentPath} — skipping`);
    return false;
  }

  let html = fs.readFileSync(parentPath, 'utf8');

  // Check for duplicate (card href already present)
  const href = '/' + seed.file.replace('index.html', '');
  if (html.includes(`href="${href}"`)) {
    console.log(`[inject] Card already present in ${seed.parentFile}index.html`);
    return false;
  }

  if (!html.includes(SENTINEL_START)) {
    // Add "Mehr entdecken" section with sentinels before </body>
    const section = `
  <!-- Mehr entdecken: Auto-generated by expand engine -->
  <section class="section" id="mehr-entdecken">
    <div class="container">
      <h2 class="section-title">Mehr <span>entdecken</span></h2>
      <div class="destinations-grid">
        ${SENTINEL_START}
        ${SENTINEL_END}
      </div>
    </div>
  </section>
`;
    html = html.replace('</body>', section + '</body>');
  }

  // Insert card before SENTINEL_END
  html = html.replace(SENTINEL_END, cardHtml + '\n        ' + SENTINEL_END);

  fs.writeFileSync(parentPath, html, 'utf8');
  console.log(`[inject] Card added to ${seed.parentFile}index.html`);
  return true;
}

// ── Main expand run ───────────────────────────────────────────────────────────

async function expandRun() {
  const tracker = loadTracker();

  // Filter seeds not yet expanded
  const pending = ALL_SEEDS.filter(s => !tracker[s.id]);

  if (pending.length === 0) {
    console.log('[expand] All seeds already generated — nothing to do.');
    return;
  }

  const batch = pending.slice(0, PAGES_PER_RUN);
  console.log(`[expand] ${batch.length} seeds to generate (${pending.length} total pending).`);

  const generatedFiles = [];
  const modifiedParents = new Set();

  for (const seed of batch) {
    try {
      console.log(`[gen] ${seed.file} (${seed.type})`);

      // Generate page HTML
      let result;
      if (seed.type === 'city')        result = await generateExpandCityPage(seed);
      else if (seed.type === 'region') result = await generateExpandRegionPage(seed);
      else if (seed.type === 'aktivitaet') result = await generateExpandAktivitaetPage(seed);
      else {
        console.warn(`[expand] Unknown seed type "${seed.type}" for ${seed.id} — skipping`);
        continue;
      }

      // Write HTML file
      const outPath = path.join(ROOT_DIR, seed.file);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, result.html, 'utf8');
      console.log(`[ok]  ${seed.file} (new)`);

      // Inject card into parent page
      const cardHtml = buildCardHtml(seed, result.cardImageUrl);
      const injected = injectCardIntoParent(seed, cardHtml);
      if (injected) {
        modifiedParents.add(path.join(seed.parentFile, 'index.html'));
      }

      // Update tracker
      tracker[seed.id] = {
        generatedAt: new Date().toISOString(),
        file: seed.file,
        type: seed.type,
        parent: seed.parentFile,
      };
      saveTracker(tracker);

      generatedFiles.push(seed.file);
    } catch (err) {
      console.error(`[err] ${seed.file}: ${err.message}`);
    }
  }

  if (generatedFiles.length === 0) {
    console.log('[expand] No pages generated — exiting.');
    return;
  }

  if (!GITHUB_TOKEN) {
    console.warn('[git] No GITHUB_TOKEN — skipping push.');
    return;
  }

  // Commit & push
  console.log(`\n[git] Committing ${generatedFiles.length} new pages + ${modifiedParents.size} updated parents...`);

  const git = simpleGit(ROOT_DIR);
  const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;

  try {
    await git.remote(['set-url', 'origin', remoteUrl]);

    for (const f of generatedFiles)   await git.add(f);
    for (const p of modifiedParents)  await git.add(p);
    await git.add('content-engine/expansion-tracker.json');

    const today = new Date().toISOString().split('T')[0];
    await git.commit(`content: auto-expand +${generatedFiles.length} pages ${today}`);
    await git.push('origin', 'main');
    console.log('[git] Pushed successfully!');
  } catch (err) {
    console.error('[git] Push failed:', err.message);
  }
}

module.exports = { expandRun };

// Standalone invocation (node auto-expand.js)
if (require.main === module) {
  expandRun().catch(err => {
    console.error('[expand] Fatal:', err.message);
    process.exit(1);
  });
}
