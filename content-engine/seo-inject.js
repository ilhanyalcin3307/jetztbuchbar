#!/usr/bin/env node
/**
 * SEO Inject — Phase 1 + 3
 * Adds to every HTML file:
 *  1. Canonical tag (if missing)
 *  2. Twitter Card meta tags (if missing)
 *  3. JSON-LD Schema (if missing) — TouristDestination / Article / CollectionPage / FAQPage / BreadcrumbList
 *
 * Run: node content-engine/seo-inject.js [--dry-run]
 */

const fs   = require('fs');
const path = require('path');

const BASE_URL   = 'https://jetztbuchbar.de';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80';
const DRY_RUN    = process.argv.includes('--dry-run');
const ROOT       = path.resolve(__dirname, '..');

// ── helpers ──────────────────────────────────────────────────────────────────

function getHtmlFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !f.startsWith('.') && f !== 'node_modules' && f !== 'content-engine') {
      getHtmlFiles(full, files);
    } else if (f.endsWith('.html')) {
      files.push(full);
    }
  });
  return files;
}

/** Clean canonical URL from file path */
function toCanonical(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return BASE_URL + '/';
  if (rel.endsWith('/index.html')) return BASE_URL + '/' + rel.replace('/index.html', '') + '/';
  return BASE_URL + '/' + rel.replace('.html', '');
}

/** Extract og: meta value from HTML */
function getMeta(html, prop) {
  const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m  = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'));
  return m ? m[1] : null;
}

/** Extract <title> */
function getTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].replace(/&amp;/g, '&').trim() : null;
}

/** Extract <meta name="description"> */
function getDesc(html) {
  const m = html.match(/<meta\s+name=["']description["'][^>]+content=["']([^"']+)["']/i)
         || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  return m ? m[1] : null;
}

// ── schema builders ───────────────────────────────────────────────────────────

/** BreadcrumbList JSON-LD */
function buildBreadcrumb(canonicalUrl) {
  const url  = canonicalUrl.replace(/\/$/, '');
  const segs = url.replace(BASE_URL, '').split('/').filter(Boolean);
  if (segs.length === 0) return null; // home page – no breadcrumb needed

  const labels = {
    'tuerkei':       'Türkei', 'griechenland': 'Griechenland', 'spanien':    'Spanien',
    'italien':       'Italien', 'portugal':   'Portugal',      'frankreich': 'Frankreich',
    'kroatien':      'Kroatien', 'bulgarien': 'Bulgarien',     'aegypten':   'Ägypten',
    'dubai':         'Dubai',    'jordanien': 'Jordanien',     'marokko':    'Marokko',
    'tunesien':      'Tunesien', 'kap-verde': 'Kap Verde',     'malta':      'Malta',
    'zypern':        'Zypern',   'deutschland': 'Deutschland', 'vergleiche': 'Vergleiche',
    'themen':        'Themen',   'tipps':     'Tipps',         'fluege':     'Flüge',
    'booking':       'Buchung',  'hotel':     'Hotel',
    'all-inclusive': 'All Inclusive', 'flitterwochen': 'Flitterwochen',
    'last-minute':   'Last Minute',   'tickets':       'Tickets',
    'urlaub-mit-kindern': 'Urlaub mit Kindern',
    'guenstig-fliegen': 'Günstig Fliegen', 'handgepaeck': 'Handgepäck',
    'packliste':     'Packliste',  'reiseversicherung': 'Reiseversicherung',
    'mallorca-vs-kreta':   'Mallorca vs. Kreta',
    'tuerkei-vs-aegypten': 'Türkei vs. Ägypten',
    'dubai-vs-abu-dhabi':  'Dubai vs. Abu Dhabi',
    'griechenland-vs-kroatien': 'Griechenland vs. Kroatien',
    'portugal-vs-marokko': 'Portugal vs. Marokko',
    'zypern-vs-malta':     'Zypern vs. Malta',
    'reisezeit': 'Reisezeit', 'hotels-mallorca': 'Hotels Mallorca',
    'hotels-kreta': 'Hotels Kreta', 'hotels-antalya': 'Hotels Antalya',
    'hotels-lissabon': 'Hotels Lissabon', 'hotels-dubai': 'Hotels Dubai',
    'mallorca': 'Mallorca', 'kreta': 'Kreta', 'rhodos': 'Rhodos',
    'mykonos': 'Mykonos', 'santorini': 'Santorini', 'korfu': 'Korfu',
    'zakynthos': 'Zakynthos', 'ibiza': 'Ibiza', 'teneriffa': 'Teneriffa',
    'barcelona': 'Barcelona', 'costa-brava': 'Costa Brava',
    'alanya': 'Alanya', 'antalya': 'Antalya', 'bodrum': 'Bodrum',
    'fethiye': 'Fethiye', 'istanbul': 'Istanbul', 'izmir': 'Izmir',
    'kappadokien': 'Kappadokien', 'kusadasi': 'Kusadasi', 'marmaris': 'Marmaris',
    'pamukkale': 'Pamukkale', 'side': 'Side', 'cesme': 'Çeşme',
    'algarve': 'Algarve', 'amalfikueste': 'Amalfiküste',
    'wuestensafari': 'Wüstensafari', 'surfen': 'Surfen', 'wandern': 'Wandern',
    'tauchen': 'Tauchen', 'schnorcheln-kreta': 'Schnorcheln Kreta',
    'bodensee': 'Bodensee',
  };

  const items = [{ name: 'Startseite', url: BASE_URL + '/' }];
  let currentUrl = BASE_URL;
  for (const seg of segs) {
    currentUrl += '/' + seg;
    const name = labels[seg] || seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    items.push({ name, url: currentUrl + '/' });
  }

  const listElements = items.map((item, i) => ({
    '@type':    'ListItem',
    'position': i + 1,
    'name':     item.name,
    'item':     item.url,
  }));

  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': listElements }, null, 2);
}

/** Determine schema type based on path segments */
function buildPageSchema(filePath, canonicalUrl, title, description, ogImage) {
  const rel  = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const segs = rel.split('/').filter(s => s && s !== 'index.html');
  const img  = ogImage || FALLBACK_IMAGE;

  // Root
  if (segs.length === 0) return null; // already has WebSite + Organization schema

  // Vergleiche (Article)
  if (segs[0] === 'vergleiche' && segs.length > 1) {
    const [a, b] = segs[1].replace('.html','').split('-vs-');
    const destA = labels[a] || a;
    const destB = labels[b] || b;
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': title,
      'description': description || '',
      'image': img,
      'url': canonicalUrl,
      'dateModified': new Date().toISOString().split('T')[0],
      'author': { '@type': 'Organization', 'name': 'JetztBuchbar.de' },
      'publisher': {
        '@type': 'Organization', 'name': 'JetztBuchbar.de',
        'url': BASE_URL,
        'logo': { '@type': 'ImageObject', 'url': BASE_URL + '/logo.png' }
      },
    }, null, 2);
  }

  // Hub / Collection pages (vergleiche/index, themen/*, tipps/*)
  if (segs.length === 1 && (segs[0] === 'vergleiche' || segs[0] === 'themen' || segs[0] === 'tipps')) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': title,
      'description': description || '',
      'url': canonicalUrl,
      'publisher': { '@type': 'Organization', 'name': 'JetztBuchbar.de', 'url': BASE_URL },
    }, null, 2);
  }

  // Themen subpages (all-inclusive, flitterwochen, last-minute etc.)
  if (segs[0] === 'themen' && segs.length > 1) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': title,
      'description': description || '',
      'image': img,
      'url': canonicalUrl,
      'dateModified': new Date().toISOString().split('T')[0],
      'author': { '@type': 'Organization', 'name': 'JetztBuchbar.de' },
      'publisher': { '@type': 'Organization', 'name': 'JetztBuchbar.de', 'url': BASE_URL },
    }, null, 2);
  }

  // Tipps / Ratgeber — FAQPage + Article
  if (segs[0] === 'tipps' && segs.length > 1) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          'headline': title,
          'description': description || '',
          'image': img,
          'url': canonicalUrl,
          'dateModified': new Date().toISOString().split('T')[0],
          'author': { '@type': 'Organization', 'name': 'JetztBuchbar.de' },
          'publisher': { '@type': 'Organization', 'name': 'JetztBuchbar.de', 'url': BASE_URL },
        },
        {
          '@type': 'FAQPage',
          'mainEntity': [
            {
              '@type': 'Question',
              'name': title + ' – häufige Fragen',
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': description || 'Alle Infos zu ' + title + ' auf JetztBuchbar.de.'
              }
            }
          ]
        }
      ]
    }, null, 2);
  }

  // Datenschutz / Impressum / 404 / Hotel / Booking / Fluege — minimal WebPage
  const utilPages = ['datenschutz', 'impressum', '404', 'hotel', 'booking', 'fluege', 'ueber-uns', 'kontakt', 'changelog'];
  if (segs.length === 1 && utilPages.some(p => segs[0].startsWith(p))) {
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': title,
      'url': canonicalUrl,
      'publisher': { '@type': 'Organization', 'name': 'JetztBuchbar.de', 'url': BASE_URL },
    }, null, 2);
  }

  return null; // all others already have schema (TouristDestination etc.)
}

const labels = {
  'tuerkei': 'Türkei', 'griechenland': 'Griechenland', 'spanien': 'Spanien',
  'aegypten': 'Ägypten', 'abu-dhabi': 'Abu Dhabi',
};

// ── main loop ─────────────────────────────────────────────────────────────────

const htmlFiles = getHtmlFiles(ROOT);
let stats = { canonical: 0, twitter: 0, schema: 0, ogImage: 0, total: 0 };

for (const filePath of htmlFiles) {
  let html     = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const canonical   = toCanonical(filePath);
  const title       = getTitle(html) || 'JetztBuchbar.de';
  const description = getDesc(html)  || '';
  const ogTitle     = getMeta(html, 'og:title')       || title;
  const ogDesc      = getMeta(html, 'og:description') || description;
  let   ogImage     = getMeta(html, 'og:image');
  const rel         = path.relative(ROOT, filePath);

  // ── 1. Canonical ─────────────────────────────────────────────────────────
  if (!html.includes('rel="canonical"')) {
    const tag = `  <link rel="canonical" href="${canonical}" />\n`;
    html = html.replace(/(<meta[^>]+viewport[^>]+>)/i, `$1\n${tag}`);
    modified = true;
    stats.canonical++;
  }

  // ── 2. og:image Fallback ──────────────────────────────────────────────────
  if (!ogImage) {
    ogImage = FALLBACK_IMAGE;
    // Only inject og:image if there's already other og: tags (avoid polluting pure-util pages)
    if (html.includes('og:title') && !html.includes('og:image')) {
      const tag = `  <meta property="og:image" content="${FALLBACK_IMAGE}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />\n`;
      html = html.replace(/(<meta property="og:type"[^>]*>)/i, `${tag}  $1`);
      modified = true;
      stats.ogImage++;
    }
  }

  // ── 3. Twitter Cards ─────────────────────────────────────────────────────
  if (!html.includes('twitter:card')) {
    const imgSrc = ogImage || FALLBACK_IMAGE;
    const twitterBlock = [
      `  <meta name="twitter:card" content="summary_large_image" />`,
      `  <meta name="twitter:title" content="${ogTitle.replace(/"/g, '&quot;')}" />`,
      `  <meta name="twitter:description" content="${ogDesc.replace(/"/g, '&quot;')}" />`,
      `  <meta name="twitter:image" content="${imgSrc}" />`,
      `  <meta name="twitter:site" content="@jetztbuchbar" />`,
    ].join('\n') + '\n';

    // Insert after the last og: meta tag
    html = html.replace(/((?:<meta property="og:[^>]+"[^>]*>\s*)+)/i, (match) => {
      return match.trimEnd() + '\n\n' + twitterBlock;
    });
    modified = true;
    stats.twitter++;
  }

  // ── 4. JSON-LD Schema (only for pages that are missing it) ───────────────
  if (!html.includes('application/ld+json')) {
    const breadcrumb = buildBreadcrumb(canonical);
    const pageSchema = buildPageSchema(filePath, canonical, title, description, ogImage);

    if (pageSchema || breadcrumb) {
      let schemaBlock = '';
      if (pageSchema) {
        schemaBlock += `\n  <script type="application/ld+json">\n${pageSchema}\n  </script>`;
      }
      if (breadcrumb) {
        schemaBlock += `\n  <script type="application/ld+json">\n${breadcrumb}\n  </script>`;
      }
      html = html.replace(/(<\/head>)/i, `${schemaBlock}\n$1`);
      modified = true;
      stats.schema++;
    }
  } else if (html.includes('application/ld+json')) {
    // Page already has schema — but may be missing BreadcrumbList
    const rel2 = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const segs = rel2.split('/').filter(s => s && s !== 'index.html');
    if (segs.length >= 1 && !html.includes('BreadcrumbList')) {
      const breadcrumb = buildBreadcrumb(canonical);
      if (breadcrumb) {
        html = html.replace(/(<\/head>)/i, `\n  <script type="application/ld+json">\n${breadcrumb}\n  </script>\n$1`);
        modified = true;
      }
    }
  }

  // ── Write ─────────────────────────────────────────────────────────────────
  stats.total++;
  if (modified && !DRY_RUN) {
    fs.writeFileSync(filePath, html, 'utf8');
  }
  if (modified) {
    console.log('[UPDATED]', rel);
  }
}

console.log('\n=== SEO INJECT RESULTS ===');
console.log(`Dateien gesamt    : ${stats.total}`);
console.log(`Canonical ergänzt : ${stats.canonical}`);
console.log(`og:image ergänzt  : ${stats.ogImage}`);
console.log(`Twitter Cards     : ${stats.twitter}`);
console.log(`Schema ergänzt    : ${stats.schema}`);
if (DRY_RUN) console.log('\n⚠  DRY RUN — keine Dateien wurden geändert');
