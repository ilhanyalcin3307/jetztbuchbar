#!/usr/bin/env node
/**
 * FAQ Schema Injector — Phase 3b
 * Liest die echten FAQ-Fragen und Antworten aus den Vergleichsseiten
 * und injiziert FAQPage JSON-LD Schema.
 *
 * Run: node content-engine/seo-faq-schema.js
 */

const fs   = require('fs');
const path = require('path');

const BASE_URL = 'https://jetztbuchbar.de';
const ROOT     = path.resolve(__dirname, '..');

// Pages to process (comparison pages + tipps with FAQ sections)
const TARGETS = [
  'vergleiche/mallorca-vs-kreta/index.html',
  'vergleiche/tuerkei-vs-aegypten/index.html',
  'vergleiche/dubai-vs-abu-dhabi/index.html',
  'vergleiche/griechenland-vs-kroatien/index.html',
  'vergleiche/portugal-vs-marokko/index.html',
  'vergleiche/zypern-vs-malta/index.html',
  'tipps/guenstig-fliegen/index.html',
  'tipps/handgepaeck/index.html',
  'tipps/packliste/index.html',
  'tipps/reiseversicherung/index.html',
];

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x[0-9a-fA-F]+;/g, '').replace(/&[a-z]+;/g, '').trim();
}

function extractFAQs(html) {
  const faqs = [];
  // Extract all faq-q and faq-a in document order, then pair them
  const qRe = /class="faq-q"[^>]*>([\s\S]*?)<\/div>/g;
  const aRe = /class="faq-a"[^>]*>([\s\S]*?)<\/div>/g;
  const qs = [], as = [];
  let m;
  while ((m = qRe.exec(html)) !== null) qs.push(stripHtml(m[1]));
  while ((m = aRe.exec(html)) !== null) as.push(stripHtml(m[1]));
  const len = Math.min(qs.length, as.length);
  for (let i = 0; i < len; i++) {
    if (qs[i] && as[i]) faqs.push({ q: qs[i], a: as[i] });
  }
  return faqs;
}

let updated = 0;

for (const rel of TARGETS) {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) {
    console.log('[SKIP] nicht gefunden:', rel);
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already has FAQPage schema
  if (html.includes('FAQPage')) {
    console.log('[SKIP] hat bereits FAQPage:', rel);
    continue;
  }

  const faqs = extractFAQs(html);
  if (faqs.length === 0) {
    console.log('[SKIP] keine FAQs gefunden:', rel);
    continue;
  }

  const canonical = html.match(/rel="canonical"\s+href="([^"]+)"/);
  const pageUrl = canonical ? canonical[1] : BASE_URL + '/' + rel.replace('/index.html', '/');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'url': pageUrl,
    'mainEntity': faqs.map(function(faq) {
      return {
        '@type': 'Question',
        'name': faq.q,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.a
        }
      };
    })
  };

  const schemaTag = '\n  <script type="application/ld+json">\n' +
    JSON.stringify(schema, null, 2) +
    '\n  </script>';

  html = html.replace(/(<\/head>)/i, schemaTag + '\n$1');
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('[UPDATED] ' + rel + ' (' + faqs.length + ' FAQs)');
  updated++;
}

console.log('\nFAQPage Schema injiziert auf ' + updated + ' Seiten.');
