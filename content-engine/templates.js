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
  /* Intro editorial text */
  .intro-text { font-size: 1rem; color: var(--text-soft); line-height: 1.85; margin-bottom: 1.5rem; }
  .intro-text p { margin-bottom: 1rem; }
  .intro-text p:last-child { margin-bottom: 0; }
  .intro-highlights { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.85rem; margin: 1.5rem 0 2rem; }
  .intro-highlight { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.9rem 1.1rem; font-size: 0.88rem; color: var(--text-soft); display: flex; gap: 0.65rem; align-items: flex-start; transition: border-color 0.2s; }
  .intro-highlight:hover { border-color: var(--accent); }
  .intro-highlight .ih-icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 0.05rem; }

  /* Country stat grid */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.3rem; transition: border-color 0.2s; }
  .stat-card:hover { border-color: var(--accent); }
  .stat-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .stat-value { font-size: 1.15rem; font-weight: 700; color: var(--text); }
  .stat-icon { font-size: 1.5rem; margin-bottom: 0.25rem; }

  /* Map */
  .map-wrapper { border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); margin-top: 1.5rem; position: relative; }
  .map-wrapper iframe { display: block; width: 100%; height: 400px; border: none; pointer-events: none; }
  .map-wrapper.active iframe { pointer-events: auto; }
  .map-overlay { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.0); cursor: pointer; transition: background 0.2s; }
  .map-overlay-hint { background: rgba(10,10,10,0.82); backdrop-filter: blur(6px); color: #fff; padding: 0.55rem 1.25rem; border-radius: 50px; font-size: 0.82rem; font-weight: 600; pointer-events: none; opacity: 0; transition: opacity 0.25s; border: 1px solid rgba(255,255,255,0.12); }
  .map-wrapper:not(.active):hover .map-overlay-hint { opacity: 1; }
  .map-wrapper.active .map-overlay { display: none; }

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

  /* POI cards — rich design */
  .poi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
  .poi-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: border-color 0.3s, transform 0.2s, box-shadow 0.3s; display: flex; flex-direction: column; }
  .poi-card:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
  .poi-visual { height: 180px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; flex-shrink: 0; }
  .poi-visual img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s ease; }
  .poi-card:hover .poi-visual img { transform: scale(1.06); }
  .poi-visual-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%); pointer-events: none; }
  .poi-visual-fallback { height: 148px; }
  .poi-visual-fallback::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 65%), repeating-linear-gradient(45deg, transparent, transparent 18px, rgba(255,255,255,0.025) 18px, rgba(255,255,255,0.025) 19px); }
  .poi-visual-icon { font-size: 3.2rem; filter: drop-shadow(0 3px 14px rgba(0,0,0,0.45)); z-index: 1; line-height: 1; }
  .poi-img-credit { position: absolute; bottom: 0.3rem; right: 0.5rem; font-size: 0.6rem; color: rgba(255,255,255,0.45); z-index: 2; }
  .poi-body { padding: 1.15rem 1.35rem; flex: 1; display: flex; flex-direction: column; gap: 0.55rem; }
  .poi-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .poi-tag { font-size: 0.67rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 50px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.1); }
  .poi-name { font-size: 1.08rem; font-weight: 800; line-height: 1.25; color: var(--text); }
  .poi-desc { font-size: 0.84rem; color: var(--text-muted); line-height: 1.65; flex: 1; }
  .poi-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 0.85rem; margin-top: auto; border-top: 1px solid var(--border); }
  .poi-dist { font-size: 0.77rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem; }
  .poi-links { display: flex; gap: 0.45rem; }
  .poi-link { font-size: 0.73rem; font-weight: 600; padding: 0.28rem 0.7rem; border-radius: 50px; border: 1px solid var(--border-soft); color: var(--text-muted); transition: border-color 0.2s, color 0.2s, background 0.2s; white-space: nowrap; }
  .poi-link:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }

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
  const mapId  = `map-${Math.random().toString(36).slice(2,8)}`;
  return `
  <div class="section">
    <div class="container">
      <h2 class="section-title">📍 ${escapeHtml(name)} auf der <span>Karte</span></h2>
      <div class="map-wrapper" id="${mapId}">
        <div class="map-overlay" onclick="(function(el){el.closest('.map-wrapper').classList.add('active');})(this)">
          <span class="map-overlay-hint">Klicken zum Aktivieren · Strg+Scroll zum Zoomen</span>
        </div>
        <iframe
          src="${osmUrl}"
          loading="lazy"
          title="Karte ${escapeHtml(name)}"
          aria-label="OpenStreetMap Karte von ${escapeHtml(name)}">
        </iframe>
      </div>
      <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem;">Karte anklicken zum Aktivieren. Außerhalb klicken zum Deaktivieren.</p>
      <script>
      (function(){
        var w = document.getElementById('${mapId}');
        if(!w) return;
        document.addEventListener('click', function(e){ if(!w.contains(e.target)) w.classList.remove('active'); });
      })();
      <\/script>
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

// Category config: gradient background + icon per category
const POI_CAT = {
  beaches:      { icon: '🏖️', gradient: 'linear-gradient(135deg,#005f73 0%,#0a9396 55%,#94d2bd 100%)', tags: ['Strand','Schwimmen','Küste'] },
  viewpoints:   { icon: '🔭', gradient: 'linear-gradient(135deg,#3a0ca3 0%,#7209b7 55%,#f72585 100%)', tags: ['Aussichtspunkt','Panorama'] },
  museums:      { icon: '🖼️', gradient: 'linear-gradient(135deg,#1a237e 0%,#283593 50%,#3f51b5 100%)', tags: ['Museum','Ausstellung'] },
  natural:      { icon: '🌿', gradient: 'linear-gradient(135deg,#1b4332 0%,#2d6a4f 50%,#52b788 100%)', tags: ['Natur','Landschaft'] },
  parks:        { icon: '🌳', gradient: 'linear-gradient(135deg,#1e3a1f 0%,#2e7d32 55%,#66bb6a 100%)', tags: ['Park','Erholung'] },
  churches:     { icon: '⛪', gradient: 'linear-gradient(135deg,#2c0060 0%,#6a0572 55%,#9b5de5 100%)', tags: ['Kirche','Architektur'] },
  religion:     { icon: '🕌', gradient: 'linear-gradient(135deg,#1a3a4a 0%,#1565c0 55%,#42a5f5 100%)', tags: ['Religiös','Kulturdenkmal'] },
  historic:     { icon: '🏛️', gradient: 'linear-gradient(135deg,#6b3a2a 0%,#b05b2c 50%,#e08a4a 100%)', tags: ['Historisch','Denkmal'] },
  architecture: { icon: '🏗️', gradient: 'linear-gradient(135deg,#1c2340 0%,#2e3f7c 55%,#5c73c4 100%)', tags: ['Architektur','Kulturgut'] },
  restaurants:  { icon: '🍽️', gradient: 'linear-gradient(135deg,#7a0000 0%,#b71c1c 55%,#e53935 100%)', tags: ['Gastronomie','Küche'] },
  amusements:   { icon: '🎢', gradient: 'linear-gradient(135deg,#1a1a2e 0%,#e94560 55%,#f5a623 100%)', tags: ['Freizeit','Unterhaltung'] },
  default:      { icon: '📍', gradient: 'linear-gradient(135deg,#003d32 0%,#00796b 55%,#00c896 100%)', tags: ['Sehenswürdigkeit'] },
};

const POI_DESC = {
  beaches:      'Traumhafter Strand mit kristallklarem Wasser – perfekt für Entspannung, Schnorcheln und Wassersport unter der Sonne.',
  viewpoints:   'Spektakulärer Aussichtspunkt mit atemberaubendem Panoramablick – für Fotografen und Naturliebhaber ein absolutes Highlight.',
  museums:      'Faszinierendes Museum mit umfangreichen Sammlungen zu lokaler Geschichte, Kunst und Kultur – ein Pflichtbesuch für Kulturinteressierte.',
  natural:      'Beeindruckende Naturlandschaft – ein Paradies für Wanderer, Naturliebhaber und alle, die die Seele baumeln lassen möchten.',
  parks:        'Weitläufige Parkanlage, beliebt bei Einheimischen und Touristen gleichermaßen – ideal für Spaziergänge und Picknicks.',
  churches:     'Prachtvolles Gotteshaus mit beeindruckender Architektur, jahrhundertealter Geschichte und bedeutenden Kunstschätzen im Inneren.',
  religion:     'Bedeutendes religiöses Bauwerk mit einzigartiger Atmosphäre, reich verzierten Details und tiefer kultureller Bedeutung.',
  historic:     'Historisches Kulturdenkmal von nationaler Bedeutung – ein fesselndes Zeugnis vergangener Epochen und Zivilisationen.',
  architecture: 'Architektonisches Meisterwerk, das die Geschichte und den Charakter der Region auf eindrucksvolle Weise verkörpert.',
  restaurants:  'Kulinarisches Highlight der Region: Hier treffen authentische Aromen auf einladende Atmosphäre und gastfreundlicher Service.',
  amusements:   'Beliebtes Freizeitzentrum – hier ist Spaß und Unterhaltung für die ganze Familie garantiert.',
  default:      'Eines der meistbesuchten Ausflugsziele der Region mit einer Geschichte, die Besucher aus aller Welt begeistert.',
};

// Human-readable tag labels from kinds string
const KIND_TAG_MAP = [
  ['beach',         'Strand'],
  ['viewpoint',     'Aussichtspunkt'],
  ['museum',        'Museum'],
  ['natural',       'Natur'],
  ['park',          'Park'],
  ['church',        'Kirche'],
  ['cathedral',     'Kathedrale'],
  ['mosque',        'Moschee'],
  ['islamic',       'Islamisch'],
  ['religion',      'Religiös'],
  ['historic',      'Historisch'],
  ['monument',      'Denkmal'],
  ['fortress',      'Festung'],
  ['fort',          'Festung'],
  ['palace',        'Palast'],
  ['castle',        'Burg'],
  ['tower',         'Turm'],
  ['architecture',  'Architektur'],
  ['cultural',      'Kultur'],
  ['garden',        'Garten'],
  ['landscape',     'Landschaft'],
  ['amusement',     'Freizeit'],
];

function getPOICat(kinds) {
  const k = (kinds || '').toLowerCase();
  if (k.includes('beach'))        return 'beaches';
  if (k.includes('viewpoint'))    return 'viewpoints';
  if (k.includes('museum'))       return 'museums';
  if (k.includes('park'))         return 'parks';
  if (k.includes('church') || k.includes('cathedral')) return 'churches';
  if (k.includes('mosque') || k.includes('islamic') || k.includes('religion')) return 'religion';
  if (k.includes('natural') || k.includes('landscape')) return 'natural';
  if (k.includes('historic') || k.includes('monument') || k.includes('fort') || k.includes('castle') || k.includes('tower') || k.includes('palace')) return 'historic';
  if (k.includes('architect'))    return 'architecture';
  if (k.includes('restaurant'))   return 'restaurants';
  if (k.includes('amusement'))    return 'amusements';
  return 'default';
}

function getPOITags(kinds) {
  const k = (kinds || '').toLowerCase();
  const found = [];
  for (const [key, label] of KIND_TAG_MAP) {
    if (k.includes(key) && !found.includes(label)) found.push(label);
    if (found.length >= 3) break;
  }
  return found;
}

function renderPOIs(pois, destinationName) {
  if (!pois || !pois.length) return '';
  const cards = pois.map(poi => {
    const catKey  = getPOICat(poi.kinds);
    const cat     = POI_CAT[catKey];
    const desc    = POI_DESC[catKey];
    const tags    = getPOITags(poi.kinds);
    if (!tags.length) tags.push(...cat.tags.slice(0, 2));
    const distText = poi.dist != null && poi.dist > 0
      ? `${poi.dist} km entfernt`
      : 'Zentrum';
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(poi.name + ' ' + destinationName)}`;
    const wikiUrl = `https://de.wikipedia.org/w/index.php?search=${encodeURIComponent(poi.name)}`;
    const tagsHtml = tags.map(t => `<span class="poi-tag">${escapeHtml(t)}</span>`).join('');

    const visualHtml = poi.image
      ? `<div class="poi-visual">
          <img src="${poi.image}" alt="${escapeHtml(poi.name)}" loading="lazy" />
          <div class="poi-visual-overlay"></div>
          <span class="poi-img-credit">© Wikimedia Commons</span>
        </div>`
      : `<div class="poi-visual poi-visual-fallback" style="background:${cat.gradient}">
          <span class="poi-visual-icon">${cat.icon}</span>
        </div>`;
    return `
    <div class="poi-card">
      ${visualHtml}
      <div class="poi-body">
        <div class="poi-tags">${tagsHtml}</div>
        <div class="poi-name">${escapeHtml(poi.name)}</div>
        <div class="poi-desc">${desc}</div>
        <div class="poi-footer">
          <span class="poi-dist">📍 ${distText}</span>
          <div class="poi-links">
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="poi-link">🗺 Maps</a>
            <a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="poi-link">📖 Wiki</a>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="section">
    <div class="container">
      <h2 class="section-title">🗺️ Top <span>Sehenswürdigkeiten</span></h2>
      <p style="color:var(--text-muted);margin-bottom:1.75rem;font-size:0.93rem;">Die beliebtesten Sehenswürdigkeiten und Ausflugsziele in ${escapeHtml(destinationName)}.</p>
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

// ── Intro section (wiki + optional editorial paragraphs) ─────────────────────

function renderIntro(wikiText, introParas) {
  // introParas: array of strings (optional, from page.intro)
  const wikiBlock = wikiText
    ? `<div class="wiki-intro">${escapeHtml(wikiText)}</div>`
    : '';

  if (!introParas || !introParas.length) return wikiBlock;

  const parasHtml = introParas.map(p => `<p>${escapeHtml(p)}</p>`).join('');
  return `
  ${wikiBlock}
  <div class="intro-text">${parasHtml}</div>`;
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
  renderIntro,
  escapeHtml,
};


