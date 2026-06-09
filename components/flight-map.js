/**
 * flight-map.js — JetztBuchbar Animated Flight Map Component
 *
 * Usage: <div data-flight-map="GR"></div>
 *        <script src="/components/flight-map.js" defer></script>
 *
 * Supports all 15 GIATA countries + Turkey (TR).
 * Auto-generates animated SVG with bezier flight paths + stats cards.
 */
(function () {
  'use strict';

  // ── Projection helpers ──────────────────────────────────────────────────────
  // europe.svg (1000×684): x = 13.028*lon + 400.2 · y = −17.593*lat + 1281.5
  // world.svg  (2000×857): x = (lon+180)/360*2000 · y = (90−lat)/180*857

  function toEurope(lon, lat) {
    return { x: Math.round(13.028 * lon + 400.2), y: Math.round(-17.593 * lat + 1281.5) };
  }
  function toWorld(lon, lat) {
    return { x: Math.round((lon + 180) / 360 * 2000), y: Math.round((90 - lat) / 180 * 857) };
  }

  // ── Source cities ───────────────────────────────────────────────────────────
  var SRC = {
    FRA: { label: '🇩🇪 Frankfurt', flag: '🇩🇪', name: 'Frankfurt', e: toEurope(8.68, 50.11),  w: toWorld(8.68, 50.11)  },
    VIE: { label: '🇦🇹 Wien',       flag: '🇦🇹', name: 'Wien',       e: toEurope(16.37, 48.21), w: toWorld(16.37, 48.21) },
    ZRH: { label: '🇨🇭 Zürich',     flag: '🇨🇭', name: 'Zürich',     e: toEurope(8.55, 47.37),  w: toWorld(8.55, 47.37)  },
  };

  // ── Country config ──────────────────────────────────────────────────────────
  // bg: 'europe' or 'world'
  // viewBox: SVG viewport to frame source + destination
  // dest: destination city coordinates + label
  // routes: [{ code:'FRA'|'VIE'|'ZRH', time:'Xh Ymin', km:N }]
  var CONFIG = {
    TR: {
      bg: 'europe', viewBox: '230 150 900 500',
      dest: { c: toEurope(30.70, 36.89), label: '🇹🇷 Antalya', name: 'Antalya', flag: '🇹🇷' },
      routes: [
        { code: 'FRA', time: '3h 45min', km: 2630 },
        { code: 'VIE', time: '2h 15min', km: 1710 },
        { code: 'ZRH', time: '3h 00min', km: 2340 },
      ],
    },
    GR: {
      bg: 'europe', viewBox: '200 200 700 440',
      dest: { c: toEurope(23.73, 37.98), label: '🇬🇷 Athen', name: 'Athen', flag: '🇬🇷' },
      routes: [
        { code: 'FRA', time: '3h 00min', km: 2250 },
        { code: 'VIE', time: '2h 30min', km: 1540 },
        { code: 'ZRH', time: '2h 40min', km: 2000 },
      ],
    },
    ES: {
      bg: 'europe', viewBox: '50 180 720 450',
      dest: { c: toEurope(2.65, 39.57), label: '🇪🇸 Mallorca', name: 'Mallorca', flag: '🇪🇸' },
      routes: [
        { code: 'FRA', time: '2h 20min', km: 1700 },
        { code: 'VIE', time: '3h 00min', km: 2050 },
        { code: 'ZRH', time: '1h 50min', km: 1290 },
      ],
    },
    PT: {
      bg: 'europe', viewBox: '-50 180 820 480',
      dest: { c: toEurope(-9.14, 38.72), label: '🇵🇹 Lissabon', name: 'Lissabon', flag: '🇵🇹' },
      routes: [
        { code: 'FRA', time: '2h 55min', km: 2080 },
        { code: 'VIE', time: '3h 45min', km: 2700 },
        { code: 'ZRH', time: '2h 40min', km: 1925 },
      ],
    },
    HR: {
      bg: 'europe', viewBox: '230 220 590 370',
      dest: { c: toEurope(18.09, 42.65), label: '🇭🇷 Dubrovnik', name: 'Dubrovnik', flag: '🇭🇷' },
      routes: [
        { code: 'FRA', time: '2h 05min', km: 1460 },
        { code: 'VIE', time: '1h 10min', km: 740 },
        { code: 'ZRH', time: '1h 45min', km: 1160 },
      ],
    },
    IT: {
      bg: 'europe', viewBox: '200 220 590 370',
      dest: { c: toEurope(12.49, 41.90), label: '🇮🇹 Rom', name: 'Rom', flag: '🇮🇹' },
      routes: [
        { code: 'FRA', time: '2h 00min', km: 1360 },
        { code: 'VIE', time: '1h 45min', km: 1130 },
        { code: 'ZRH', time: '1h 30min', km: 1010 },
      ],
    },
    FR: {
      bg: 'europe', viewBox: '150 180 590 370',
      dest: { c: toEurope(7.27, 43.71), label: '🇫🇷 Nizza', name: 'Nizza', flag: '🇫🇷' },
      routes: [
        { code: 'FRA', time: '1h 35min', km: 870 },
        { code: 'VIE', time: '2h 00min', km: 1260 },
        { code: 'ZRH', time: '1h 05min', km: 560 },
      ],
    },
    BG: {
      bg: 'europe', viewBox: '280 200 690 400',
      dest: { c: toEurope(27.91, 43.21), label: '🇧🇬 Varna', name: 'Varna', flag: '🇧🇬' },
      routes: [
        { code: 'FRA', time: '3h 00min', km: 2000 },
        { code: 'VIE', time: '2h 00min', km: 1250 },
        { code: 'ZRH', time: '2h 45min', km: 1820 },
      ],
    },
    MT: {
      bg: 'europe', viewBox: '200 210 690 490',
      dest: { c: toEurope(14.51, 35.90), label: '🇲🇹 Malta', name: 'Malta', flag: '🇲🇹' },
      routes: [
        { code: 'FRA', time: '2h 40min', km: 1930 },
        { code: 'VIE', time: '2h 20min', km: 1680 },
        { code: 'ZRH', time: '2h 15min', km: 1640 },
      ],
    },
    CY: {
      bg: 'europe', viewBox: '250 200 790 490',
      dest: { c: toEurope(33.62, 34.92), label: '🇨🇾 Zypern', name: 'Zypern', flag: '🇨🇾' },
      routes: [
        { code: 'FRA', time: '4h 30min', km: 3200 },
        { code: 'VIE', time: '3h 30min', km: 2500 },
        { code: 'ZRH', time: '4h 00min', km: 2950 },
      ],
    },
    EG: {
      bg: 'world', viewBox: '850 90 510 360',
      dest: { c: toWorld(33.82, 27.26), label: '🇪🇬 Hurghada', name: 'Hurghada', flag: '🇪🇬' },
      routes: [
        { code: 'FRA', time: '5h 30min', km: 3950 },
        { code: 'VIE', time: '4h 45min', km: 3270 },
        { code: 'ZRH', time: '5h 15min', km: 3700 },
      ],
    },
    MA: {
      bg: 'world', viewBox: '700 90 560 360',
      dest: { c: toWorld(-7.99, 31.63), label: '🇲🇦 Marrakesch', name: 'Marrakesch', flag: '🇲🇦' },
      routes: [
        { code: 'FRA', time: '3h 30min', km: 2460 },
        { code: 'VIE', time: '4h 15min', km: 3000 },
        { code: 'ZRH', time: '3h 10min', km: 2250 },
      ],
    },
    TN: {
      bg: 'world', viewBox: '850 90 400 290',
      dest: { c: toWorld(10.17, 36.82), label: '🇹🇳 Tunis', name: 'Tunis', flag: '🇹🇳' },
      routes: [
        { code: 'FRA', time: '2h 30min', km: 1750 },
        { code: 'VIE', time: '2h 50min', km: 2050 },
        { code: 'ZRH', time: '2h 10min', km: 1540 },
      ],
    },
    JO: {
      bg: 'world', viewBox: '900 90 510 360',
      dest: { c: toWorld(35.93, 31.96), label: '🇯🇴 Amman', name: 'Amman', flag: '🇯🇴' },
      routes: [
        { code: 'FRA', time: '5h 00min', km: 3850 },
        { code: 'VIE', time: '4h 00min', km: 3000 },
        { code: 'ZRH', time: '4h 45min', km: 3600 },
      ],
    },
    AE: {
      bg: 'world', viewBox: '900 90 610 360',
      dest: { c: toWorld(55.37, 25.07), label: '🇦🇪 Dubai', name: 'Dubai', flag: '🇦🇪' },
      routes: [
        { code: 'FRA', time: '7h 00min', km: 5625 },
        { code: 'VIE', time: '6h 10min', km: 4905 },
        { code: 'ZRH', time: '6h 45min', km: 5380 },
      ],
    },
    MV: {
      bg: 'world', viewBox: '900 80 720 460',
      dest: { c: toWorld(73.51, 4.18), label: '🇲🇻 Malediven', name: 'Malediven', flag: '🇲🇻' },
      routes: [
        { code: 'FRA', time: '10h 30min', km: 8050 },
        { code: 'VIE', time: '10h 00min', km: 7900 },
        { code: 'ZRH', time: '10h 15min', km: 8000 },
      ],
    },
    CV: {
      bg: 'world', viewBox: '600 90 600 410',
      dest: { c: toWorld(-23.51, 14.93), label: '🇨🇻 Kap Verde', name: 'Kap Verde', flag: '🇨🇻' },
      routes: [
        { code: 'FRA', time: '5h 45min', km: 4200 },
        { code: 'VIE', time: '6h 30min', km: 4800 },
        { code: 'ZRH', time: '5h 30min', km: 4050 },
      ],
    },
  };

  // ── Bezier path helpers ─────────────────────────────────────────────────────
  function makePath(sx, sy, dx, dy) {
    var dist = Math.sqrt((dx - sx) * (dx - sx) + (dy - sy) * (dy - sy));
    var cpx  = Math.round((sx + dx) / 2);
    var cpy  = Math.round(Math.min(sy, dy) - dist * 0.48);
    return 'M ' + sx + ',' + sy + ' Q ' + cpx + ',' + cpy + ' ' + dx + ',' + dy;
  }

  // Punkt auf quadratischer Bezier bei t=0.5 (für Label-Positionierung)
  function arcPeak(sx, sy, dx, dy) {
    var dist = Math.sqrt((dx - sx) * (dx - sx) + (dy - sy) * (dy - sy));
    var cpx  = (sx + dx) / 2;
    var cpy  = Math.min(sy, dy) - dist * 0.48;
    return {
      x: Math.round(0.25 * sx + 0.5 * cpx + 0.25 * dx),
      y: Math.round(0.25 * sy + 0.5 * cpy + 0.25 * dy),
    };
  }

  // Flugrouten-Dauer in Sekunden (Animation) aus "Xh Ymin"
  function timeToSecs(t) {
    var h = 0, m = 0;
    var mh = t.match(/(\d+)h/); if (mh) h = parseInt(mh[1]);
    var mm = t.match(/(\d+)min/); if (mm) m = parseInt(mm[1]);
    var total = h * 60 + m;
    // Auf 1.5s–4s normalisieren
    return Math.max(1.5, Math.min(4.0, total / 60 * 2.2));
  }

  // ── CSS (einmalig injizieren) ───────────────────────────────────────────────
  var _cssInjected = false;
  function injectCSS() {
    if (_cssInjected) return;
    _cssInjected = true;
    var s = document.createElement('style');
    s.textContent = [
      '.flm-section{background:var(--bg);}',
      '.flm-intro{font-size:1rem;color:var(--text-muted);margin-bottom:1.75rem;max-width:660px;}',
      '.flm-wrap{border-radius:var(--radius,14px);overflow:hidden;border:1px solid var(--border,#1e1e1e);background:#0a0a0a;line-height:0;}',
      '.flm-wrap svg{display:block;width:100%;height:auto;max-height:420px;}',
      '.flm-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-top:1.25rem;}',
      '@media(max-width:600px){.flm-stats{grid-template-columns:1fr;}}',
      '.flm-stat{background:var(--bg-card,#111);border:1px solid var(--border,#1e1e1e);border-radius:8px;padding:.9rem 1.1rem;display:flex;align-items:center;gap:.75rem;}',
      '.flm-stat-icon{font-size:1.4rem;flex-shrink:0;}',
      '.flm-stat-body{display:flex;flex-direction:column;gap:.1rem;}',
      '.flm-stat-route{font-size:.8rem;font-weight:700;color:var(--text,#f0f0f0);}',
      '.flm-stat-time{font-size:.75rem;color:var(--accent,#00c896);font-weight:700;}',
      '.flm-stat-detail{font-size:.7rem;color:var(--text-muted,#777);}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── SVG-String erstellen ────────────────────────────────────────────────────
  function buildSVG(cc, cfg) {
    var isEurope = cfg.bg === 'europe';
    var bgSrc    = isEurope ? '/images/europe.svg' : '/images/world.svg';
    var bgW      = isEurope ? 1000 : 2000;
    var bgH      = isEurope ? 684  : 857;

    var dx = cfg.dest.c.x, dy = cfg.dest.c.y;

    var defs = '';
    var paths = '';
    var planes = '';
    var labels = '';
    var srcDots = '';

    var begins = [0.2, 1.1, 2.0];

    cfg.routes.forEach(function (r, i) {
      var src = SRC[r.code];
      var sc  = isEurope ? src.e : src.w;
      var sx  = sc.x, sy  = sc.y;
      var pid = 'fmp-' + cc + '-' + r.code.toLowerCase();
      var d   = makePath(sx, sy, dx, dy);
      var dur = timeToSecs(r.time);
      var beg = begins[i];
      var pk  = arcPeak(sx, sy, dx, dy);

      // Pfad-Definition
      defs += '<path id="' + pid + '" d="' + d + '"/>';

      // Animierter Flugpfad
      paths += '<use href="#' + pid + '" fill="none" stroke="#00c896" stroke-width="1.8"' +
        ' stroke-linecap="round" stroke-dasharray="1000" pathLength="1000" opacity="0.85">' +
        '<animate attributeName="stroke-dashoffset" from="1000" to="0"' +
        ' dur="' + dur.toFixed(1) + 's" begin="' + beg + 's" repeatCount="indefinite" calcMode="linear"/>' +
        '</use>';

      // Flugzeug-Icon
      planes += '<g><animateMotion dur="' + dur.toFixed(1) + 's" begin="' + beg + 's" repeatCount="indefinite" rotate="auto">' +
        '<mpath href="#' + pid + '"/></animateMotion>' +
        '<text x="-8" y="5" font-size="13" style="font-family:system-ui,sans-serif;user-select:none">✈</text>' +
        '</g>';

      // Flugzeit-Label am Bogenpeak
      labels += '<g text-anchor="middle">' +
        '<rect x="' + (pk.x - 54) + '" y="' + (pk.y - 13) + '" width="108" height="20" rx="10"' +
        ' fill="rgba(0,0,0,0.80)" stroke="rgba(0,200,150,0.4)" stroke-width="0.8"/>' +
        '<text x="' + pk.x + '" y="' + (pk.y + 1) + '" fill="#00c896" font-size="10"' +
        ' font-weight="700" font-family="system-ui,sans-serif">✈ ' + r.time + ' · ' + r.code + '</text>' +
        '</g>';

      // Quellstadt-Punkt
      srcDots += '<circle cx="' + sx + '" cy="' + sy + '" r="5" fill="#00c896" stroke="#0a0a0a" stroke-width="2"/>';
      srcDots += '<text x="' + (sx + 6) + '" y="' + (sy - 7) + '" fill="#fff" font-size="10"' +
        ' font-weight="700" font-family="system-ui,sans-serif">' + src.label + '</text>';
    });

    // Zielstadt-Punkt (pulsierend)
    var destDot = '<circle cx="' + dx + '" cy="' + dy + '" r="10" fill="rgba(0,200,150,0.18)" stroke="#00c896" stroke-width="2">' +
      '<animate attributeName="r" values="9;13;9" dur="2s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>' +
      '</circle>' +
      '<circle cx="' + dx + '" cy="' + dy + '" r="6" fill="#00c896" stroke="#0a0a0a" stroke-width="2"/>' +
      '<text x="' + (dx + 10) + '" y="' + (dy - 7) + '" fill="#00c896" font-size="11"' +
      ' font-weight="900" font-family="system-ui,sans-serif">' + cfg.dest.label + '</text>';

    return '<svg viewBox="' + cfg.viewBox + '" xmlns="http://www.w3.org/2000/svg"' +
      ' preserveAspectRatio="xMidYMid meet"' +
      ' role="img" aria-label="Flugkarte nach ' + cfg.dest.name + '">' +
      '<defs>' + defs + '</defs>' +
      '<rect x="-500" y="-500" width="5000" height="5000" fill="#0a0a0a"/>' +
      '<image href="' + bgSrc + '" x="0" y="0" width="' + bgW + '" height="' + bgH + '"' +
      ' preserveAspectRatio="xMidYMid meet"' +
      ' style="filter:brightness(0.28) saturate(0);"/>' +
      paths + planes + labels + srcDots + destDot +
      '</svg>';
  }

  // ── Stats-HTML erstellen ────────────────────────────────────────────────────
  function buildStats(cfg) {
    return cfg.routes.map(function (r) {
      var src = SRC[r.code];
      return '<div class="flm-stat">' +
        '<span class="flm-stat-icon">' + src.flag + '</span>' +
        '<div class="flm-stat-body">' +
        '<span class="flm-stat-route">' + src.name + ' → ' + cfg.dest.name + '</span>' +
        '<span class="flm-stat-time">✈ ' + r.time + ' Direktflug</span>' +
        '<span class="flm-stat-detail">ca. ' + r.km.toLocaleString('de-DE') + ' km Luftlinie</span>' +
        '</div></div>';
    }).join('');
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────────
  function init() {
    var containers = document.querySelectorAll('[data-flight-map]');
    if (!containers.length) return;
    injectCSS();
    containers.forEach(function (el) {
      var cc = (el.getAttribute('data-flight-map') || '').toUpperCase().trim();
      var cfg = CONFIG[cc];
      if (!cfg) return;
      el.innerHTML =
        '<div class="flm-wrap">' + buildSVG(cc, cfg) + '</div>' +
        '<div class="flm-stats">' + buildStats(cfg) + '</div>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
