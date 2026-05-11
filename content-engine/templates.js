'use strict';

const { MONTHS_DE } = require('./apis');

// ── Shared CSS ────────────────────────────────────────────────────────────────

const SHARED_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0a0a0a; --bg-card: #111; --bg-card-hover: #161616; --bg-alt: #0d0d0d;
    --accent: #00c896; --accent-dark: #00a87e; --accent-glow: rgba(0,200,150,0.15);
    --text: #f0f0f0; --text-muted: #777; --text-soft: #aaa;
    --border: #1e1e1e; --border-soft: #252525; --radius: 14px; --radius-sm: 8px;
  }
  html { scroll-behavior: smooth; }
  body { background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.7; -webkit-font-smoothing: antialiased; }
  a { color: inherit; text-decoration: none; }
  img { max-width: 100%; }

  /* Header */
  header { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(1.25rem, 5vw, 3rem); height: 64px; background: rgba(10,10,10,0.9); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
  .logo { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.5px; color: var(--accent); }
  nav { display: flex; gap: 2rem; }
  nav a { font-size: 0.88rem; font-weight: 500; color: var(--text-muted); transition: color 0.2s; }
  nav a:hover { color: var(--accent); }

  /* Hero */
  .hero { padding: clamp(4rem, 10vw, 7rem) clamp(1.25rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem); text-align: center; background: radial-gradient(ellipse 90% 60% at 50% -5%, rgba(0,200,150,0.14) 0%, transparent 65%), var(--bg); position: relative; overflow: hidden; }
  .hero::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle 1px at 20% 40%, rgba(0,200,150,0.4) 0%, transparent 100%), radial-gradient(circle 1px at 80% 60%, rgba(0,200,150,0.3) 0%, transparent 100%); pointer-events: none; }
  .hero-icon { font-size: 4rem; display: block; margin-bottom: 1.25rem; filter: drop-shadow(0 0 20px rgba(0,200,150,0.3)); }
  h1 { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 900; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 1.25rem; }
  h1 span { color: var(--accent); }
  .hero-sub { font-size: clamp(0.95rem, 1.8vw, 1.15rem); color: var(--text-soft); max-width: 640px; margin: 0 auto 2rem; line-height: 1.65; }

  /* Container */
  .container { max-width: 1100px; margin: 0 auto; }
  .container-narrow { max-width: 780px; margin: 0 auto; }

  /* Sections */
  .section { padding: clamp(3rem, 7vw, 5rem) clamp(1.25rem, 5vw, 3rem); }
  .section-alt { background: var(--bg-alt); padding: clamp(3rem, 7vw, 5rem) clamp(1.25rem, 5vw, 3rem); }
  .section-title { font-size: clamp(1.5rem, 3vw, 2.1rem); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 2rem; }
  .section-title span { color: var(--accent); }

  /* Breadcrumb */
  .breadcrumb { padding: 0.85rem clamp(1.25rem, 5vw, 3rem); background: var(--bg-alt); border-bottom: 1px solid var(--border); font-size: 0.83rem; color: var(--text-muted); }
  .breadcrumb a { color: var(--text-muted); transition: color 0.2s; }
  .breadcrumb a:hover { color: var(--accent); }
  .breadcrumb span { color: var(--text-soft); }

  /* Wiki intro */
  .wiki-intro { background: linear-gradient(135deg, rgba(0,200,150,0.06), rgba(0,200,150,0.02)); border-left: 3px solid var(--accent); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 1.5rem 1.75rem; font-size: 1.02rem; color: var(--text-soft); line-height: 1.8; margin-bottom: 2rem; }

  /* Country stat grid */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.3rem; transition: border-color 0.2s; }
  .stat-card:hover { border-color: var(--accent); }
  .stat-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .stat-value { font-size: 1.15rem; font-weight: 700; color: var(--text); }
  .stat-icon { font-size: 1.5rem; margin-bottom: 0.25rem; }

  /* Map */
  .map-wrapper { border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); margin-top: 1.5rem; }
  .map-wrapper iframe { display: block; width: 100%; height: 400px; border: none; }

  /* Climate chart */
  .climate-wrap { overflow-x: auto; padding-bottom: 0.5rem; }
  .climate-chart { display: flex; gap: 6px; align-items: flex-end; min-height: 200px; height: 200px; padding: 1rem 0 0; min-width: 600px; }
  .climate-month { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .climate-bar-wrap { flex: 1; width: 100%; display: flex; align-items: flex-end; }
  .climate-bar { width: 100%; border-radius: 4px 4px 0 0; background: linear-gradient(to top, var(--accent), rgba(0,200,150,0.4)); min-height: 4px; transition: opacity 0.2s; }
  .climate-month:hover .climate-bar { opacity: 0.8; }
  .climate-temp { font-size: 0.7rem; font-weight: 700; color: var(--accent); }
  .climate-precip { font-size: 0.62rem; color: var(--text-muted); }
  .climate-label { font-size: 0.68rem; color: var(--text-muted); font-weight: 600; }
  .climate-legend { display: flex; gap: 1.5rem; margin-top: 1rem; font-size: 0.8rem; color: var(--text-muted); }
  .climate-legend span { display: flex; align-items: center; gap: 0.4rem; }
  .climate-legend .dot { width: 10px; height: 10px; border-radius: 2px; background: var(--accent); }

  /* POI cards */
  .poi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
  .poi-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.4rem 1.5rem; transition: border-color 0.25s, transform 0.2s, box-shadow 0.2s; }
  .poi-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 6px 24px rgba(0,200,150,0.1); }
  .poi-icon { font-size: 1.75rem; margin-bottom: 0.6rem; display: block; }
  .poi-name { font-size: 0.97rem; font-weight: 700; margin-bottom: 0.3rem; }
  .poi-meta { font-size: 0.8rem; color: var(--text-muted); }

  /* Numbered tips */
  .tips-grid { display: flex; flex-direction: column; gap: 0.85rem; }
  .tip-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.1rem 1.4rem; display: flex; gap: 1.1rem; align-items: flex-start; transition: border-color 0.2s; }
  .tip-card:hover { border-color: var(--border-soft); }
  .tip-num { width: 32px; height: 32px; min-width: 32px; background: var(--accent-glow); border: 1px solid rgba(0,200,150,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800; color: var(--accent); }
  .tip-text { font-size: 0.92rem; color: var(--text-soft); line-height: 1.65; padding-top: 0.15rem; }

  /* FAQ */
  .faq-list { display: flex; flex-direction: column; gap: 0.85rem; }
  .faq-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color 0.2s; }
  .faq-item:hover { border-color: var(--border-soft); }
  .faq-q { padding: 1.1rem 1.5rem; font-size: 0.97rem; font-weight: 700; display: flex; gap: 0.85rem; align-items: flex-start; }
  .faq-q::before { content: "?"; color: var(--accent); font-size: 1rem; font-weight: 900; flex-shrink: 0; margin-top: 0.05rem; }
  .faq-a { padding: 0 1.5rem 1.1rem 3rem; font-size: 0.88rem; color: var(--text-muted); line-height: 1.7; border-top: 1px solid var(--border); padding-top: 0.85rem; margin-top: 0; }

  /* Season table */
  .season-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  .season-table th { background: var(--bg-card); color: var(--text-muted); font-weight: 600; text-align: left; padding: 0.7rem 1rem; border-bottom: 1px solid var(--border); }
  .season-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); color: var(--text-soft); }
  .season-table .best-month td { background: rgba(0,200,150,0.06); color: var(--text); }
  .season-table .best-month td:first-child { border-left: 3px solid var(--accent); }

  /* Dest tags */
  .dest-tags { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 1rem; }
  .dest-tag { background: var(--bg-card); border: 1px solid var(--border); border-radius: 50px; padding: 0.45rem 1.1rem; font-size: 0.85rem; color: var(--text-muted); transition: border-color 0.2s, color 0.2s, background 0.2s; }
  .dest-tag:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }

  /* CTA */
  .cta-box { background: linear-gradient(135deg, rgba(0,200,150,0.08), rgba(0,200,150,0.03)); border: 1px solid rgba(0,200,150,0.2); border-radius: var(--radius); padding: clamp(2.5rem, 5vw, 4rem) clamp(1.5rem, 5vw, 3rem); text-align: center; }
  .cta-box h2 { font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800; letter-spacing: -0.5px; margin-bottom: 0.85rem; }
  .cta-box p { color: var(--text-muted); margin-bottom: 2rem; max-width: 460px; margin-left: auto; margin-right: auto; }
  .btn-primary { display: inline-block; padding: 0.9rem 2.4rem; background: var(--accent); color: #000; font-weight: 700; font-size: 1rem; border-radius: 50px; cursor: pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; box-shadow: 0 0 28px rgba(0,200,150,0.35); }
  .btn-primary:hover { background: var(--accent-dark); transform: translateY(-2px); box-shadow: 0 0 40px rgba(0,200,150,0.5); }
  .btn-secondary { display: inline-block; padding: 0.75rem 1.75rem; margin-top: 1rem; border: 1px solid var(--border); color: var(--text-muted); font-size: 0.9rem; border-radius: 50px; transition: border-color 0.2s, color 0.2s; }
  .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

  /* Dest link */
  .dest-link-btn { display: inline-flex; align-items: center; gap: 0.6rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.75rem; font-weight: 600; font-size: 0.95rem; margin-top: 1rem; transition: border-color 0.2s, background 0.2s; }
  .dest-link-btn:hover { border-color: var(--accent); background: var(--accent-glow); color: var(--accent); }

  /* Footer */
  footer { border-top: 1px solid var(--border); padding: 1.75rem clamp(1.25rem, 5vw, 3rem); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem; }
  .footer-left { display: flex; flex-wrap: wrap; align-items: center; gap: 1.25rem; }
  .footer-left span, .footer-left a { font-size: 0.85rem; color: var(--text-muted); transition: color 0.2s; }
  .footer-left a:hover { color: var(--accent); }
  .footer-social { display: flex; gap: 0.75rem; }
  .social-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); background: var(--bg-card); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; color: var(--text-muted); transition: border-color 0.2s, color 0.2s, background 0.2s; }
  .social-icon:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }

  /* Unsplash attribution */
  .photo-credit { text-align: right; font-size: 0.72rem; color: var(--text-muted); padding: 0.3rem clamp(1.25rem, 5vw, 3rem) 0; opacity: 0.7; }
  .photo-credit a { color: inherit; text-decoration: underline; }
  .photo-credit a:hover { color: var(--accent); }

  @media (max-width: 640px) {
    nav { gap: 1.25rem; }
    footer { flex-direction: column; align-items: flex-start; }
    .hero-icon { font-size: 3rem; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;

// ── Shared partials ───────────────────────────────────────────────────────────

function renderHeader() {
  return `
  <header>
    <a href="/index.html" class="logo">JetztBuchbar</a>
    <nav>
      <a href="/index.html#angebote">Angebote</a>
      <a href="/index.html#destinationen">Destinationen</a>
      <a href="/ueber-uns.html">Über uns</a>
      <a href="/index.html#kontakt">Kontakt</a>
    </nav>
  </header>`;
}

function renderFooter() {
  return `
  <footer>
    <div class="footer-left">
      <span>© ${new Date().getFullYear()} JetztBuchbar.de</span>
      <a href="/impressum.html">Impressum</a>
      <a href="/datenschutz.html">Datenschutz</a>
      <a href="mailto:sales@jetztbuchbar.de">sales@jetztbuchbar.de</a>
      <span>Wien, Österreich</span>
    </div>
    <div class="footer-social">
      <a href="https://www.instagram.com/jetztbuchbar.de/" target="_blank" rel="noopener" class="social-icon" aria-label="Instagram">&#x1F4F7;</a>
      <a href="https://www.facebook.com/jetztbuchbar/" target="_blank" rel="noopener" class="social-icon" aria-label="Facebook">&#x1F310;</a>
    </div>
  </footer>`;
}

// ── OpenStreetMap embed ───────────────────────────────────────────────────────

function renderMap(lat, lon, name) {
  if (!lat || !lon) return '';
  const delta = 1.8;
  const bbox  = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  return `
  <div class="section">
    <div class="container">
      <h2 class="section-title">📍 ${escapeHtml(name)} auf der <span>Karte</span></h2>
      <div class="map-wrapper">
        <iframe
          src="${osmUrl}"
          loading="lazy"
          title="Karte ${escapeHtml(name)}"
          aria-label="OpenStreetMap Karte von ${escapeHtml(name)}">
        </iframe>
      </div>
    </div>
  </div>`;
}

// ── Climate chart (visual CSS bars) ──────────────────────────────────────────

function renderClimateChart(climateData, destinationName) {
  if (!climateData || !climateData.length) return '';

  const temps = climateData.map(d => d.temp).filter(t => t != null);
  if (!temps.length) return renderClimateTable(climateData);

  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const range   = maxTemp - minTemp || 1;

  const bars = climateData.map(d => {
    const heightPct = d.temp != null ? Math.max(8, Math.round(((d.temp - minTemp) / range) * 85 + 8)) : 8;
    // Color: cool = blue-ish accent, hot = full accent
    const warmth = d.temp != null ? Math.round(((d.temp - minTemp) / range) * 100) : 50;
    return `
      <div class="climate-month">
        <div class="climate-bar-wrap">
          <div class="climate-bar" style="height:${heightPct}%;opacity:${0.45 + warmth / 200};"></div>
        </div>
        <span class="climate-temp">${d.temp != null ? d.temp + '°' : '–'}</span>
        <span class="climate-precip">${d.precip != null ? d.precip + 'mm' : ''}</span>
        <span class="climate-label">${escapeHtml(d.month)}</span>
      </div>`;
  }).join('');

  return `
  <div class="section-alt">
    <div class="container">
      <h2 class="section-title">☀️ Klima &amp; <span>Beste Reisezeit</span></h2>
      <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:0.93rem;">Monatliche Durchschnittstemperaturen in ${escapeHtml(destinationName || '')} (Ø 2018–2022)</p>
      <div class="climate-wrap">
        <div class="climate-chart">${bars}</div>
      </div>
      <div class="climate-legend">
        <span><span class="dot"></span> Temperatur (°C)</span>
        <span style="color:var(--text-muted);font-size:0.77rem;">Niederschlag (mm) unter den Balken</span>
      </div>
    </div>
  </div>`;
}

// Keep old table version as fallback
function renderClimateTable(climateData) {
  if (!climateData || !climateData.length) return '';
  const rows = climateData.map(d =>
    `<tr><td>${escapeHtml(d.month)}</td><td>${d.temp != null ? d.temp + ' °C' : '–'}</td><td>${d.precip != null ? d.precip + ' mm' : '–'}</td></tr>`
  ).join('');
  return `
  <div style="overflow-x:auto;">
    <table style="width:100%;max-width:640px;border-collapse:collapse;font-size:0.88rem;">
      <thead><tr style="background:var(--bg-card);">
        <th style="padding:0.6rem 1rem;text-align:left;border-bottom:1px solid var(--border);color:var(--text-muted);">Monat</th>
        <th style="padding:0.6rem 1rem;text-align:center;border-bottom:1px solid var(--border);color:var(--accent);">Temperatur</th>
        <th style="padding:0.6rem 1rem;text-align:center;border-bottom:1px solid var(--border);color:var(--accent);">Niederschlag</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// ── POI section ───────────────────────────────────────────────────────────────

const POI_ICONS = {
  historic:   '🏛️', churches: '⛪', natural: '🌿', museums: '🖼️',
  restaurants: '🍽️', viewpoints: '👁️', parks: '🌳', beaches: '🏖️',
  default: '📍',
};

function renderPOIs(pois, destinationName) {
  if (!pois || !pois.length) return '';
  const cards = pois.map(poi => {
    const iconKey = Object.keys(POI_ICONS).find(k => (poi.kinds || '').includes(k)) || 'default';
    const icon = POI_ICONS[iconKey];
    return `
    <div class="poi-card">
      <span class="poi-icon">${icon}</span>
      <div class="poi-name">${escapeHtml(poi.name)}</div>
      <div class="poi-meta">${poi.dist != null ? `ca. ${poi.dist} km vom Zentrum` : 'Beliebtes Ausflugsziel'}</div>
    </div>`;
  }).join('');

  return `
  <div class="section">
    <div class="container">
      <h2 class="section-title">🗺️ Top <span>Sehenswürdigkeiten</span></h2>
      <div class="poi-grid">${cards}</div>
    </div>
  </div>`;
}

// ── Country info stat cards ───────────────────────────────────────────────────

const STAT_META = {
  capital:    { icon: '🏙️', label: 'Hauptstadt' },
  currency:   { icon: '💱', label: 'Währung' },
  language:   { icon: '🗣️', label: 'Sprache' },
  population: { icon: '👥', label: 'Einwohner' },
};

function renderCountryInfo(info) {
  if (!info) return '';
  const keys = ['capital', 'currency', 'language', 'population'];
  const cards = keys.filter(k => info[k]).map(k => {
    const m = STAT_META[k];
    return `
    <div class="stat-card">
      <span class="stat-icon">${m.icon}</span>
      <span class="stat-label">${m.label}</span>
      <span class="stat-value">${escapeHtml(info[k])}</span>
    </div>`;
  }).join('');
  if (!cards) return '';
  return `<div class="stat-grid">${cards}</div>`;
}

// ── Tips (numbered cards) ─────────────────────────────────────────────────────

function renderTips(tips) {
  if (!tips || !tips.length) return '';
  const items = tips.map((t, i) => `
    <div class="tip-card">
      <div class="tip-num">${i + 1}</div>
      <div class="tip-text">${escapeHtml(t)}</div>
    </div>`).join('');
  return `<div class="tips-grid">${items}</div>`;
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

function renderFAQ(faqs) {
  if (!faqs || !faqs.length) return '';
  const items = faqs.map(f => `
    <div class="faq-item">
      <div class="faq-q">${escapeHtml(f.q)}</div>
      <div class="faq-a">${escapeHtml(f.a)}</div>
    </div>`).join('');
  return `<div class="faq-list">${items}</div>`;
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function renderCTA(destinationName) {
  return `
  <div class="section">
    <div class="container-narrow">
      <div class="cta-box">
        <h2>${escapeHtml(destinationName)}-Urlaub <span style="color:var(--accent)">jetzt anfragen</span></h2>
        <p>Unser Team findet die besten Angebote für deinen Traumurlaub – kostenlos und unverbindlich.</p>
        <a href="mailto:sales@jetztbuchbar.de?subject=Anfrage ${encodeURIComponent(destinationName)}" class="btn-primary">✉️ Angebot anfragen</a>
        <br />
        <a href="/index.html" class="btn-secondary">← Zurück zur Startseite</a>
      </div>
    </div>
  </div>`;
}

// ── Page assembler ────────────────────────────────────────────────────────────

function assemblePage(opts) {
  const { title, description, h1Parts, icon, heroSub = '', content = '',
          heroImage = null, heroCredit = null } = opts;

  let h1Html = '';
  if (h1Parts && h1Parts.length) {
    h1Html = h1Parts.length >= 2
      ? `${escapeHtml(h1Parts[0])} <span>${escapeHtml(h1Parts[1])}</span>`
      : escapeHtml(h1Parts[0]);
  }

  const heroStyle = heroImage
    ? ` style="background-image:linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.55)),url('${heroImage}');background-size:cover;background-position:center;"`
    : '';

  const creditNote = heroCredit
    ? `<p class="photo-credit">Foto: <a href="${heroCredit.link}" target="_blank" rel="noopener noreferrer">${escapeHtml(heroCredit.name)}</a> auf <a href="https://unsplash.com?utm_source=jetztbuchbar&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  ${heroImage ? `<meta property="og:image" content="${heroImage}" />` : ''}
  <meta property="og:type" content="website" />
  <style>${SHARED_CSS}</style>
</head>
<body>
  ${renderHeader()}
  <div class="hero"${heroStyle}>
    <span class="hero-icon">${icon || ''}</span>
    <h1>${h1Html}</h1>
    <p class="hero-sub">${escapeHtml(heroSub)}</p>
  </div>
  ${creditNote}
  ${content}
  ${renderFooter()}
</body>
</html>`;
}

// ── Utility ───────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  assemblePage,
  renderMap,
  renderClimateChart,
  renderClimateTable,
  renderPOIs,
  renderCountryInfo,
  renderTips,
  renderFAQ,
  renderCTA,
  escapeHtml,
};


