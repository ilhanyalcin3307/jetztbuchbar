/**
 * JetztBuchbar – Shared Header Component
 * Usage: <script src="/components/header.js"></script>
 * Injects: CSS, <header>, mobile-nav overlay, and nav JS logic.
 * Edit this file once to update the header on ALL pages.
 */
(function () {
  'use strict';

  /* ── 1. CSS ── */
  if (!document.getElementById('jb-header-css')) {
    var s = document.createElement('style');
    s.id = 'jb-header-css';
    s.textContent =
      '@keyframes jb-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(1.25)}}' +
      '.logo{font-size:1.35rem;font-weight:800;letter-spacing:-.5px;color:var(--accent,#00c896);display:inline-flex;align-items:center;gap:.4rem;}' +
      '.logo svg{flex-shrink:0;}' +
      'nav{display:flex;align-items:center;gap:2rem;}' +
      'nav a{font-size:.9rem;font-weight:500;color:var(--text-muted,#777);transition:color .2s;}' +
      'nav a:hover{color:var(--accent,#00c896);}' +
      'nav a svg{width:16px;height:16px;display:block;}' +
      '.nav-dropdown{position:relative;}' +
      '.nav-dropdown>button{font-size:.9rem;font-weight:500;color:var(--text-muted,#777);background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:.35rem;padding:0;transition:color .2s;font-family:inherit;}' +
      '.nav-dropdown>button:hover,.nav-dropdown.open>button{color:var(--accent,#00c896);}' +
      '.nav-dropdown>button .dd-chevron{transition:transform .2s;}' +
      '.nav-dropdown.open>button .dd-chevron{transform:rotate(180deg);}' +
      '.mega-menu{display:none;position:absolute;top:calc(100% + 20px);left:50%;transform:translateX(-50%);background:var(--bg-card,#111);border:1px solid var(--border,#1e1e1e);border-radius:var(--radius,14px);padding:1.5rem;gap:1.75rem;min-width:700px;box-shadow:0 24px 64px rgba(0,0,0,.7);z-index:300;}' +
      '.nav-dropdown.open .mega-menu{display:grid;grid-template-columns:repeat(4,1fr);}' +
      '.mega-col h4{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent,#00c896);margin-bottom:.6rem;padding-bottom:.4rem;border-bottom:1px solid var(--border,#1e1e1e);}' +
      '.mega-col h4.mt{margin-top:1.1rem;}' +
      '.mega-col a{display:block;font-size:.85rem;color:var(--text-muted,#777);padding:.28rem 0;transition:color .2s;}' +
      '.mega-col a:hover{color:var(--accent,#00c896);}' +
      '.mega-col a.country-link{font-weight:600;color:var(--text,#f0f0f0);margin-bottom:.15rem;}' +
      '.mega-col a.sub-link{padding-left:.65rem;font-size:.82rem;}' +
      '.nav-hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:.3rem;}' +
      '.nav-hamburger span{display:block;width:22px;height:2px;background:var(--text-muted,#777);border-radius:2px;transition:all .25s;}' +
      '.nav-hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg);}' +
      '.nav-hamburger.open span:nth-child(2){opacity:0;}' +
      '.nav-hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg);}' +
      '.mobile-nav{display:none;position:fixed;inset:64px 0 0 0;background:var(--bg-card,#111);z-index:199;overflow-y:auto;padding:1.5rem clamp(1.25rem,5vw,2rem) 3rem;border-top:1px solid var(--border,#1e1e1e);}' +
      '.mobile-nav.open{display:block;}' +
      '.mobile-nav-section{margin-bottom:1.75rem;}' +
      '.mobile-nav-section h4{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent,#00c896);margin-bottom:.5rem;}' +
      '.mobile-nav-section a{display:block;font-size:.92rem;color:var(--text-muted,#777);padding:.5rem 0;border-bottom:1px solid var(--border,#1e1e1e);transition:color .2s;}' +
      '.mobile-nav-section a:last-child{border-bottom:none;}' +
      '.mobile-nav-section a:hover{color:var(--accent,#00c896);}' +
      '.mobile-nav-section a.country-link{font-weight:600;color:var(--text,#f0f0f0);}' +
      '.mobile-nav-section a.sub-link{padding-left:1rem;font-size:.85rem;color:#777;}' +
      '@media(max-width:768px){.nav-desktop{display:none!important;}.nav-hamburger{display:flex;}}';
    document.head.appendChild(s);
  }

  /* ── 2. HTML ── */
  var headerHTML =
    '<header>' +
    '<div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">' +
    '<a href="/" class="logo">' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>' +
    'JetztBuchbar</a>' +
    '<span style="display:flex;align-items:center;gap:6px;flex-shrink:0;">' +
    '<span style="border-left:1px solid rgba(255,255,255,.15);height:16px;margin:0 4px;display:inline-block;"></span>' +
    '<span style="width:7px;height:7px;border-radius:50%;background:#00c896;flex-shrink:0;animation:jb-pulse 2s ease-in-out infinite;"></span>' +
    '<span style="font-size:13px;font-weight:500;color:rgba(255,255,255,.7);white-space:nowrap;">GIATA® Verifizierte Daten</span>' +
    '</span></div>' +
    '<nav>' +
    '<div class="nav-desktop" style="display:flex;align-items:center;gap:2rem">' +
    '<div class="nav-dropdown">' +
    '<button aria-haspopup="true" aria-expanded="false">Reiseziele ' +
    '<svg class="dd-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>' +
    '</button>' +
    '<div class="mega-menu" role="region" aria-label="Reiseziele">' +

    '<div class="mega-col">' +
    '<h4>T\u00fcrkei</h4>' +
    '<a href="/tuerkei/" class="country-link">Alle T\u00fcrkei-Reisen</a>' +
    '<a href="/tuerkei/istanbul/" class="sub-link">Istanbul</a>' +
    '<a href="/tuerkei/antalya/" class="sub-link">Antalya</a>' +
    '<a href="/tuerkei/bodrum/" class="sub-link">Bodrum</a>' +
    '<a href="/tuerkei/alanya/" class="sub-link">Alanya</a>' +
    '<a href="/tuerkei/side/" class="sub-link">Side</a>' +
    '<a href="/tuerkei/marmaris/" class="sub-link">Marmaris</a>' +
    '<a href="/tuerkei/fethiye/" class="sub-link">Fethiye</a>' +
    '<a href="/tuerkei/kusadasi/" class="sub-link">Kusadas\u0131</a>' +
    '<a href="/tuerkei/kappadokien/" class="sub-link">Kappadokien</a>' +
    '<a href="/tuerkei/pamukkale/" class="sub-link">Pamukkale</a>' +
    '</div>' +

    '<div class="mega-col">' +
    '<h4>Griechenland</h4>' +
    '<a href="/griechenland/" class="country-link">Alle Griechenland-Reisen</a>' +
    '<a href="/griechenland/kreta/" class="sub-link">Kreta</a>' +
    '<a href="/griechenland/rhodos/" class="sub-link">Rhodos</a>' +
    '<a href="/griechenland/mykonos/" class="sub-link">Mykonos</a>' +
    '<a href="/griechenland/santorini/" class="sub-link">Santorini</a>' +
    '<a href="/griechenland/korfu/" class="sub-link">Korfu</a>' +
    '<a href="/griechenland/zakynthos/" class="sub-link">Zakynthos</a>' +
    '</div>' +

    '<div class="mega-col">' +
    '<h4>Spanien</h4>' +
    '<a href="/spanien/" class="country-link">Alle Spanien-Reisen</a>' +
    '<a href="/spanien/mallorca/" class="sub-link">Mallorca</a>' +
    '<a href="/spanien/barcelona/" class="sub-link">Barcelona</a>' +
    '<a href="/spanien/ibiza/" class="sub-link">Ibiza</a>' +
    '<a href="/spanien/teneriffa/" class="sub-link">Teneriffa</a>' +
    '<a href="/spanien/costa-brava/" class="sub-link">Costa Brava</a>' +
    '<h4 class="mt">Dubai</h4>' +
    '<a href="/dubai/" class="country-link">Dubai</a>' +
    '<a href="/dubai/wuestensafari/" class="sub-link">W\u00fcstensafari</a>' +
    '<h4 class="mt">Portugal</h4>' +
    '<a href="/portugal/" class="country-link">Portugal</a>' +
    '<a href="/portugal/algarve/" class="sub-link">Algarve</a>' +
    '</div>' +

    '<div class="mega-col">' +
    '<h4>Weitere Ziele</h4>' +
    '<a href="/aegypten/">\u00c4gypten</a>' +
    '<a href="/italien/">Italien</a>' +
    '<a href="/kroatien/">Kroatien</a>' +
    '<a href="/malta/">Malta</a>' +
    '<a href="/marokko/">Marokko</a>' +
    '<a href="/tunesien/">Tunesien</a>' +
    '<a href="/bulgarien/">Bulgarien</a>' +
    '<a href="/kap-verde/">Kap Verde</a>' +
    '<a href="/jordanien/">Jordanien</a>' +
    '<a href="/zypern/">Zypern</a>' +
    '<a href="/frankreich/">Frankreich</a>' +
    '</div>' +

    '</div>' + /* .mega-menu */
    '</div>' + /* .nav-dropdown */
    '<a href="/ueber-uns.html">\u00dcber uns</a>' +
    '<a href="/kontakt.html">Kontakt</a>' +
    '<a href="https://www.instagram.com/jetztbuchbar.de/" target="_blank" rel="noopener" aria-label="Instagram"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a>' +
    '<a href="https://www.facebook.com/jetztbuchbar/" target="_blank" rel="noopener" aria-label="Facebook"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>' +
    '</div>' + /* .nav-desktop */
    '<button class="nav-hamburger" aria-label="Men\u00fc \u00f6ffnen" aria-expanded="false"><span></span><span></span><span></span></button>' +
    '</nav>' +
    '</header>' +

    /* Mobile Nav Overlay */
    '<div class="mobile-nav" id="mobile-nav" role="dialog" aria-label="Navigation">' +
    '<div class="mobile-nav-section"><h4>T\u00fcrkei</h4>' +
    '<a href="/tuerkei/" class="country-link">Alle T\u00fcrkei-Reisen</a>' +
    '<a href="/tuerkei/istanbul/" class="sub-link">Istanbul</a>' +
    '<a href="/tuerkei/antalya/" class="sub-link">Antalya</a>' +
    '<a href="/tuerkei/bodrum/" class="sub-link">Bodrum</a>' +
    '<a href="/tuerkei/alanya/" class="sub-link">Alanya</a>' +
    '<a href="/tuerkei/side/" class="sub-link">Side</a>' +
    '<a href="/tuerkei/marmaris/" class="sub-link">Marmaris</a>' +
    '<a href="/tuerkei/fethiye/" class="sub-link">Fethiye</a>' +
    '<a href="/tuerkei/kusadasi/" class="sub-link">Kusadas\u0131</a>' +
    '<a href="/tuerkei/kappadokien/" class="sub-link">Kappadokien</a>' +
    '<a href="/tuerkei/pamukkale/" class="sub-link">Pamukkale</a>' +
    '</div>' +
    '<div class="mobile-nav-section"><h4>Griechenland</h4>' +
    '<a href="/griechenland/" class="country-link">Alle Griechenland-Reisen</a>' +
    '<a href="/griechenland/kreta/" class="sub-link">Kreta</a>' +
    '<a href="/griechenland/rhodos/" class="sub-link">Rhodos</a>' +
    '<a href="/griechenland/mykonos/" class="sub-link">Mykonos</a>' +
    '<a href="/griechenland/santorini/" class="sub-link">Santorini</a>' +
    '<a href="/griechenland/korfu/" class="sub-link">Korfu</a>' +
    '<a href="/griechenland/zakynthos/" class="sub-link">Zakynthos</a>' +
    '</div>' +
    '<div class="mobile-nav-section"><h4>Spanien</h4>' +
    '<a href="/spanien/" class="country-link">Alle Spanien-Reisen</a>' +
    '<a href="/spanien/mallorca/" class="sub-link">Mallorca</a>' +
    '<a href="/spanien/barcelona/" class="sub-link">Barcelona</a>' +
    '<a href="/spanien/ibiza/" class="sub-link">Ibiza</a>' +
    '<a href="/spanien/teneriffa/" class="sub-link">Teneriffa</a>' +
    '<a href="/spanien/costa-brava/" class="sub-link">Costa Brava</a>' +
    '</div>' +
    '<div class="mobile-nav-section"><h4>Dubai &amp; Portugal</h4>' +
    '<a href="/dubai/" class="country-link">Dubai</a>' +
    '<a href="/dubai/wuestensafari/" class="sub-link">W\u00fcstensafari</a>' +
    '<a href="/portugal/" class="country-link">Portugal</a>' +
    '<a href="/portugal/algarve/" class="sub-link">Algarve</a>' +
    '</div>' +
    '<div class="mobile-nav-section"><h4>Weitere Ziele</h4>' +
    '<a href="/aegypten/">\u00c4gypten</a>' +
    '<a href="/italien/">Italien</a>' +
    '<a href="/kroatien/">Kroatien</a>' +
    '<a href="/malta/">Malta</a>' +
    '<a href="/marokko/">Marokko</a>' +
    '<a href="/tunesien/">Tunesien</a>' +
    '<a href="/bulgarien/">Bulgarien</a>' +
    '<a href="/kap-verde/">Kap Verde</a>' +
    '<a href="/jordanien/">Jordanien</a>' +
    '<a href="/zypern/">Zypern</a>' +
    '<a href="/frankreich/">Frankreich</a>' +
    '</div>' +
    '<div class="mobile-nav-section"><h4>Seiten</h4>' +
    '<a href="/ueber-uns.html">\u00dcber uns</a>' +
    '<a href="/kontakt.html">Kontakt</a>' +
    '</div>' +
    '</div>'; /* .mobile-nav */

  document.currentScript.insertAdjacentHTML('afterend', headerHTML);

  /* ── 3. Nav JS ── */
  document.addEventListener('DOMContentLoaded', function () {
    var dropdown  = document.querySelector('.nav-dropdown');
    if (!dropdown) return;
    var dropBtn   = dropdown.querySelector('button');
    var hamburger = document.querySelector('.nav-hamburger');
    var mobileNav = document.getElementById('mobile-nav');

    dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dropdown.classList.toggle('open');
      dropBtn.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
      dropBtn.setAttribute('aria-expanded', 'false');
    });

    dropdown.querySelector('.mega-menu').addEventListener('click', function (e) {
      e.stopPropagation();
    });

    hamburger.addEventListener('click', function () {
      var open = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  });
})();
