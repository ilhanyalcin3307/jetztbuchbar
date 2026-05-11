'use strict';
// Fetches Unsplash images for pages missing og:image and patches them
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const KEY = process.env.UNSPLASH_ACCESS_KEY;
const ROOT = path.join(__dirname, '..');

const QUERIES = {
  'tuerkei':     'Turkey Antalya beach travel',
  'spanien':     'Spain Mallorca Mediterranean travel',
  'griechenland':'Greece island Santorini travel',
  'aegypten':    'Egypt Hurghada Red Sea travel',
  'amalfikueste':'Amalfi Coast Italy cliffs sea',
};

async function fetchImage(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const photo = data.results && data.results[0];
  if (!photo) return null;
  return {
    url: photo.urls.regular,
    creditName: photo.user.name,
    creditLink: `${photo.user.links.html}?utm_source=jetztbuchbar&utm_medium=referral`,
  };
}

async function patchFile(slug, img) {
  const file = path.join(ROOT, `${slug}.html`);
  if (!fs.existsSync(file)) { console.log(`[skip] ${slug}.html not found`); return; }
  let html = fs.readFileSync(file, 'utf8');

  // 1. Add og:image if missing
  if (!html.includes('og:image')) {
    html = html.replace(
      /<meta property="og:type"/,
      `<meta property="og:image" content="${img.url}" />\n  <meta property="og:type"`
    );
    console.log(`[og:image] ${slug}`);
  }

  // 2. Add hero background image if missing
  if (!html.includes('background-image') && html.includes('<div class="hero"')) {
    const heroStyle = `background-image:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.55)),url('${img.url}');background-size:cover;background-position:center;`;
    html = html.replace('<div class="hero">', `<div class="hero" style="${heroStyle}">`);
    console.log(`[hero-bg] ${slug}`);
  }

  // 3. Add photo-credit if missing
  if (!html.includes('photo-credit') && html.includes('<div class="hero"')) {
    // Add CSS
    if (!html.includes('.photo-credit')) {
      html = html.replace(
        '@media (max-width: 640px)',
        `.photo-credit { text-align: right; font-size: 0.72rem; color: var(--text-muted); padding: 0.3rem clamp(1.25rem, 5vw, 3rem) 0; opacity: 0.7; }
  .photo-credit a { color: inherit; text-decoration: underline; }
  .photo-credit a:hover { color: var(--accent); }
  @media (max-width: 640px)`
      );
    }
    const creditHtml = `\n  <p class="photo-credit">Foto: <a href="${img.creditLink}" target="_blank" rel="noopener noreferrer">${img.creditName}</a> auf <a href="https://unsplash.com?utm_source=jetztbuchbar&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></p>`;
    html = html.replace(/<\/section>\s*\n\s*<!-- ──.*(BREADCRUMB|FEATURES|SECTION|section)/, (m) => creditHtml + '\n  ' + m);
    // simpler: insert after closing </div> of hero
    html = html.replace(/(<div class="hero"[^>]*>[\s\S]*?<\/section>)/, (m) => {
      if (m.includes('photo-credit')) return m;
      return m.replace(/(<\/section>)/, creditHtml + '\n  $1');
    });
    console.log(`[credit] ${slug}`);
  }

  fs.writeFileSync(file, html, 'utf8');
}

(async () => {
  if (!KEY) { console.error('UNSPLASH_ACCESS_KEY not set'); process.exit(1); }
  const results = {};
  for (const [slug, query] of Object.entries(QUERIES)) {
    console.log(`[fetch] ${slug} — "${query}"`);
    const img = await fetchImage(query);
    if (!img) { console.warn(`[warn] No image for ${slug}`); continue; }
    console.log(`  → ${img.url.substring(0, 60)}...`);
    results[slug] = img;
    await patchFile(slug, img);
    await new Promise(r => setTimeout(r, 400)); // rate limit breathing room
  }
  // Output JSON for use in index.html
  console.log('\n[result]');
  for (const [slug, img] of Object.entries(results)) {
    console.log(`${slug}: ${img.url}`);
  }
})();
