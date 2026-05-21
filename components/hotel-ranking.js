/**
 * hotel-ranking.js — JetztBuchbar Top-Hotel-Ranking Component
 * Nutzt dasselbe Bewertungssystem wie index.html (SCORING via factDefIds).
 * Usage: <div data-hotel-ranking="id1,id2,id3,id4,id5"></div>
 *        <script src="/components/hotel-ranking.js" defer></script>
 */
(function () {
  'use strict';

  // ── Scoring-System – kategorisiert (L=Lage, P=Pool/Wellness, F=Verpflegung, A=Familie/Aktiv) ──
  var SCORING = {
    // LAGE (L) – max 35
    89:{s:20,cat:'L',l:'Strandlage'}, 301:{s:12,cat:'L',l:'Meeresnähe'}, 374:{s:7,cat:'L',l:'Strandblick'},
    90:{s:8,cat:'L',l:'Zentrale Lage'}, 91:{s:5,cat:'L',l:'Ruhige Lage'}, 291:{s:5,cat:'L',l:'Stadtzentrum'},
    295:{s:6,cat:'L',l:'Seelage'}, 562:{s:5,cat:'L',l:'Jachthafen'}, 350:{s:5,cat:'L',l:'Altstadt'},
    294:{s:4,cat:'L',l:'Golfplatznähe'}, 691:{s:4,cat:'L',l:'Kurort'},
    354:{s:4,cat:'L',l:'Buchtblick'}, 364:{s:4,cat:'L',l:'Seeblick'},
    349:{s:3,cat:'L',l:'Autofreie Lage'}, 293:{s:3,cat:'L',l:'Waldlage'}, 300:{s:3,cat:'L',l:'Flusslage'},
    365:{s:3,cat:'L',l:'Bergblick'}, 348:{s:2,cat:'L',l:'Belebte Lage'},
    22:{s:1,cat:'L',l:'Parkplatz'}, 568:{s:1,cat:'L',l:'Einparkservice'},
    // POOL & WELLNESS (P) – max 35
    614:{s:18,cat:'P',l:'Privater Pool'}, 588:{s:18,cat:'P',l:'Wasserpark'}, 697:{s:14,cat:'P',l:'Infinity-Pool'},
    696:{s:14,cat:'P',l:'Rooftop-Pool'}, 86:{s:12,cat:'P',l:'Wasserrutsche'}, 197:{s:12,cat:'P',l:'Spa'},
    479:{s:10,cat:'P',l:'Wellness-Center'}, 822:{s:10,cat:'P',l:'Thermalbecken'},
    529:{s:6,cat:'P',l:'Privater Wellnessbereich'}, 192:{s:8,cat:'P',l:'Hamam'}, 195:{s:8,cat:'P',l:'Massage'},
    199:{s:6,cat:'P',l:'Thalasso'}, 869:{s:6,cat:'P',l:'Tauchbecken'},
    196:{s:6,cat:'P',l:'Sauna'}, 660:{s:6,cat:'P',l:'Sauna'}, 43:{s:6,cat:'P',l:'Hallenbad'},
    698:{s:6,cat:'P',l:'Swim-up Bar'}, 189:{s:5,cat:'P',l:'Ayurveda'},
    794:{s:5,cat:'P',l:'Wasserspielbereich'}, 201:{s:5,cat:'P',l:'Whirlpool'},
    58:{s:5,cat:'P',l:'Pool'}, 50:{s:5,cat:'P',l:'Außenpool'},
    190:{s:4,cat:'P',l:'Beautyfarm'}, 793:{s:4,cat:'P',l:'Bali Bett'},
    59:{s:4,cat:'P',l:'Poolbar'}, 198:{s:4,cat:'P',l:'Dampfbad'}, 336:{s:4,cat:'P',l:'Strandbar'},
    191:{s:3,cat:'P',l:'Schönheitssalon'}, 187:{s:3,cat:'P',l:'Akupunktur'},
    909:{s:3,cat:'P',l:'Ruheraum'}, 664:{s:3,cat:'P',l:'Personal Trainer'},
    74:{s:3,cat:'P',l:'Solarium'}, 76:{s:3,cat:'P',l:'Sonnenterrasse'},
    66:{s:3,cat:'P',l:'Zimmerservice'}, 567:{s:3,cat:'P',l:'Concierge'},
    820:{s:2,cat:'P',l:'Gesichtsbehandlung'},
    71:{s:2,cat:'P',l:'Shuttleservice'}, 81:{s:2,cat:'P',l:'Transferservice'},
    88:{s:1,cat:'P',l:'WLAN'}, 185:{s:1,cat:'P',l:'WLAN'},
    // VERPFLEGUNG (F) – max 20
    94:{s:20,cat:'F',l:'All Inclusive Plus'}, 92:{s:16,cat:'F',l:'All Inclusive'},
    101:{s:12,cat:'F',l:'Vollpension'}, 103:{s:8,cat:'F',l:'Halbpension'},
    65:{s:5,cat:'F',l:'Restaurant'}, 299:{s:5,cat:'F',l:'Restaurant'},
    14:{s:3,cat:'F',l:'Bar'}, 288:{s:3,cat:'F',l:'Bar/Pub'}, 450:{s:3,cat:'F',l:'Lobbybar'},
    575:{s:3,cat:'F',l:'Bar/Lounge'}, 20:{s:2,cat:'F',l:'Café'}, 73:{s:2,cat:'F',l:'Snackbar'},
    439:{s:1,cat:'F',l:'Strandkorb'},
    // FAMILIE & AKTIVITÄTEN (A) – max 15
    945:{s:12,cat:'A',l:'Kids Club'}, 219:{s:10,cat:'A',l:'Golf'}, 236:{s:10,cat:'A',l:'Tauchen'},
    946:{s:8,cat:'A',l:'Teens Club'}, 1:{s:8,cat:'A',l:'Kinderbetreuung'}, 7:{s:8,cat:'A',l:'Miniclub'},
    393:{s:7,cat:'A',l:'Für Flitterwochen'}, 593:{s:7,cat:'A',l:'Tennisplatz'},
    707:{s:6,cat:'A',l:'Kinder kostenlos'}, 220:{s:6,cat:'A',l:'Fitness-Studio'},
    4:{s:5,cat:'A',l:'Kinderprogramm'}, 26:{s:5,cat:'A',l:'Kinderpool'},
    240:{s:5,cat:'A',l:'Schnorcheln'}, 249:{s:5,cat:'A',l:'Windsurfen'},
    247:{s:5,cat:'A',l:'Wasserski'}, 2:{s:5,cat:'A',l:'Animationsprogramm'},
    389:{s:4,cat:'A',l:'Familienfreundlich'}, 781:{s:4,cat:'A',l:'Für Paare'},
    385:{s:4,cat:'A',l:'Adults Only'}, 245:{s:4,cat:'A',l:'Tennis'},
    250:{s:3,cat:'A',l:'Yoga'}, 209:{s:3,cat:'A',l:'Beach-Volleyball'},
    401:{s:3,cat:'A',l:'Konferenzeinrichtungen'}, 3:{s:3,cat:'A',l:'Abendunterhaltung'},
    31:{s:3,cat:'A',l:'Disco'}, 56:{s:2,cat:'A',l:'Spielplatz'}, 57:{s:2,cat:'A',l:'Spielzimmer'},
    244:{s:2,cat:'A',l:'Tischtennis'}, 211:{s:2,cat:'A',l:'Billard'},
    49:{s:2,cat:'A',l:'Nachtclub'}, 24:{s:2,cat:'A',l:'Casino'},
    5:{s:1,cat:'A',l:'Live-Musik'}, 6:{s:1,cat:'A',l:'Mini-Disco'}
  };

  var FEAT_ICONS = {
    'Strandlage':'🏖️','Strandbar':'🍹','Strandkorb':'⛱️',
    'Infinity-Pool':'♾️','Rooftop-Pool':'🏙️','Swim-up Bar':'🍹',
    'Wasserrutsche':'🌊','Wasserpark':'🌊','Hallenbad':'🏊',
    'Außenpool':'🏊','Pool':'🏊','Poolbar':'🍹',
    'Spa':'💆','Wellness-Center':'💆','Massage':'💆','Sauna':'🌡️',
    'Hamam':'🧖','Dampfbad':'♨️','Whirlpool':'🛁',
    'All Inclusive Plus':'⭐','All Inclusive':'🍽️','Vollpension':'🍽️','Halbpension':'🍳',
    'Restaurant':'🍽️','Bar':'🍷','Bar/Pub':'🍺','Lobbybar':'🥂','Bar/Lounge':'🍷',
    'Café':'☕','Snackbar':'🥪',
    'Kids Club':'👨‍👩‍👧','Teens Club':'🎮','Kinderbetreuung':'👶','Miniclub':'🎪',
    'Kinder kostenlos':'🎁','Kinderprogramm':'🎨','Kinderpool':'🏊','Spielplatz':'🛝','Spielzimmer':'🧸',
    'Golf':'⛳','Tauchen':'🤿','Tennisplatz':'🎾','Fitness-Studio':'💪',
    'Beach-Volleyball':'🏐','Schnorcheln':'🤿','Wasserski':'🎿','Windsurfen':'🏄',
    'Tennis':'🎾','Tischtennis':'🏓','Yoga':'🧘','Billard':'🎱',
    'Animationsprogramm':'🎭','Abendunterhaltung':'🎭','Disco':'💃','Nachtclub':'🌙',
    'Casino':'🎰','Live-Musik':'🎵','Mini-Disco':'🎶',
    'Zimmerservice':'🛎️','Shuttleservice':'🚌','Transferservice':'🚐','Concierge':'🤵',
    'WLAN':'📶','Einparkservice':'🅿️','Parkplatz':'🅿️',
    'Meeresnähe':'🌊','Strandblick':'🌅','Zentrale Lage':'📍','Ruhige Lage':'🌿','Stadtzentrum':'🏙️',
    'Seelage':'🏞️','Jachthafen':'⛵','Altstadt':'🏛️','Golfplatznähe':'⛳','Kurort':'💧',
    'Buchtblick':'🌊','Seeblick':'🏞️','Autofreie Lage':'🚶','Waldlage':'🌲','Flusslage':'🏞️',
    'Bergblick':'⛰️','Belebte Lage':'🏙️',
    'Privater Pool':'🏊','Thermalbecken':'♨️','Thalasso':'💧','Tauchbecken':'🔵',
    'Privater Wellnessbereich':'🔒','Ayurveda':'🌿','Wasserspielbereich':'💦',
    'Beautyfarm':'💅','Bali Bett':'🛏️','Schönheitssalon':'💇','Akupunktur':'🪡',
    'Ruheraum':'😌','Personal Trainer':'💪','Solarium':'☀️','Sonnenterrasse':'🌞',
    'Gesichtsbehandlung':'✨',
    'Für Flitterwochen':'💍','Konferenzeinrichtungen':'🏛️',
    'Adults Only':'🔞','Familienfreundlich':'👨‍👩‍👧','Für Paare':'❤️'
  };

  var SCORING_SORTED = Object.keys(SCORING).map(function (id) {
    return { id: Number(id), s: SCORING[id].s, l: SCORING[id].l, cat: SCORING[id].cat };
  }).sort(function (a, b) { return b.s - a.s; });

  // Kategorien-Caps: L≤35, P≤35, F≤20, A≤15, Stars≤15 → Gesamt max ~120
  var CAT_CAP = { L: 35, P: 35, F: 20, A: 15 };

  // ── Scoring helpers ────────────────────────────────────────────────────
  function calcScore(h) {
    var st = h.stars || 0;
    var stars = st >= 5 ? 15 : st >= 4 ? 12 : st >= 3 ? 8 : st >= 2 ? 4 : st >= 1 ? 1 : 0;
    var cats = { L: 0, P: 0, F: 0, A: 0 };
    var idSet = {};
    (h.factIds || []).forEach(function (id) { idSet[id] = true; });
    for (var i = 0; i < SCORING_SORTED.length; i++) {
      var e = SCORING_SORTED[i];
      if (idSet[e.id]) cats[e.cat] = (cats[e.cat] || 0) + e.s;
    }
    var raw = stars
      + Math.min(cats.L, CAT_CAP.L)
      + Math.min(cats.P, CAT_CAP.P)
      + Math.min(cats.F, CAT_CAP.F)
      + Math.min(cats.A, CAT_CAP.A);
    return Math.round(raw / 120 * 100);
  }

  function scoreLabel(score) {
    if (score >= 90) return { text: 'Herausragend', color: '#00c896' };
    if (score >= 80) return { text: 'Sehr gut',     color: '#00c896' };
    if (score >= 70) return { text: 'Empfehlenswert', color: '#7dd3b0' };
    if (score >= 60) return { text: 'Gut',          color: '#7dd3b0' };
    return                  { text: 'Solide',        color: '#777' };
  }

  function topFeatures(h, n) {
    var idSet = {};
    (h.factIds || []).forEach(function (id) { idSet[id] = true; });
    var seen = {}, out = [];
    for (var i = 0; i < SCORING_SORTED.length && out.length < n; i++) {
      var e = SCORING_SORTED[i];
      if (idSet[e.id] && !seen[e.l]) { seen[e.l] = true; out.push(e); }
    }
    return out;
  }

  function starsHtml(n) {
    var s = '';
    for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆';
    return s;
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── CSS injection ────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('hr-styles')) return;
    var style = document.createElement('style');
    style.id = 'hr-styles';
    style.textContent = [
      '.hr-list{display:flex;flex-direction:column;gap:.9rem}',
      '.hr-card{display:flex;align-items:stretch;background:var(--bg-card,#111);border:1px solid var(--border,#1e1e1e);border-radius:var(--radius,14px);overflow:hidden;transition:border-color .2s,transform .2s}',
      '.hr-card:hover{border-color:rgba(0,200,150,.3);transform:translateY(-2px)}',
      '.hr-rank-col{display:flex;align-items:center;justify-content:center;min-width:3rem;padding:0 .5rem;background:rgba(255,255,255,.02);border-right:1px solid var(--border,#1e1e1e);flex-shrink:0}',
      '.hr-rank-num{font-size:1.35rem;font-weight:900;color:var(--text-muted,#777)}',
      '.hr-rank-num.r1{color:#f59e0b}.hr-rank-num.r2{color:#9ca3af}.hr-rank-num.r3{color:#cd7f32}',
      '.hr-img-wrap{width:160px;min-width:160px;flex-shrink:0;overflow:hidden;background:rgba(255,255,255,.03)}',
      '.hr-img-wrap img{width:100%;height:100%;object-fit:cover;display:block}',
      '.hr-img-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:rgba(255,255,255,.15)}',
      '.hr-body{flex:1;padding:1rem 1.25rem;display:flex;flex-direction:column;justify-content:center;gap:.25rem;min-width:0}',
      '.hr-name{font-size:1rem;font-weight:700;color:var(--text,#f0f0f0);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hr-meta{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap}',
      '.hr-stars{color:#f59e0b;font-size:.82rem;letter-spacing:1px;flex-shrink:0}',
      '.hr-loc{font-size:.8rem;color:var(--text-muted,#777)}',
      '.hr-badges{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.4rem}',
      '.hr-badge{background:rgba(0,200,150,.08);border:1px solid rgba(0,200,150,.18);border-radius:6px;padding:.15rem .45rem;font-size:.74rem;color:var(--accent,#00c896);white-space:nowrap}',
      '.hr-score-row{margin-top:.55rem;display:flex;align-items:center;gap:.7rem}',
      '.hr-score-bar-outer{flex:1;height:5px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden}',
      '.hr-score-bar-inner{height:100%;background:var(--accent,#00c896);border-radius:3px;width:0;transition:width 1s ease .2s}',
      '.hr-score-label{font-size:.78rem;font-weight:700;color:var(--accent,#00c896);white-space:nowrap}',
      '.hr-skeleton{background:rgba(255,255,255,.04);border-radius:var(--radius,14px);height:90px;animation:hr-pulse 1.4s ease-in-out infinite}',
      '.hr-skeleton+.hr-skeleton{animation-delay:.2s}.hr-skeleton+.hr-skeleton+.hr-skeleton{animation-delay:.4s}',
      '@keyframes hr-pulse{0%,100%{opacity:.35}50%{opacity:.7}}',
      '@media(max-width:580px){.hr-img-wrap{width:90px;min-width:90px}.hr-rank-col{min-width:2.25rem}.hr-body{padding:.7rem .85rem}.hr-name{font-size:.88rem}}'
    ].join('');
    document.head.appendChild(style);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function renderSkeleton(container, count) {
    var html = '<div class="hr-list">';
    for (var i = 0; i < count; i++) html += '<div class="hr-skeleton"></div>';
    html += '</div>';
    container.innerHTML = html;
  }

  function renderHotels(container, hotels) {
    var maxScore = Math.max.apply(null, hotels.map(function (h) { return h._score; }));
    var html = '<div class="hr-list">';

    hotels.forEach(function (h, idx) {
      var rank = idx + 1;
      var rankClass = rank <= 3 ? 'r' + rank : '';
      var feats = topFeatures(h, 4);
      var badges = feats.map(function (f) {
        return '<span class="hr-badge">' + (FEAT_ICONS[f.l] || '') + ' ' + esc(f.l) + '</span>';
      }).join('');
      var lbl = scoreLabel(h._score);
      var img = h.image
        ? '<img src="' + esc(h.image) + '" alt="' + esc(h.name) + '" loading="lazy" />'
        : '<div class="hr-img-placeholder">🏨</div>';

      html += '<div class="hr-card">'
        + '<div class="hr-rank-col"><span class="hr-rank-num ' + rankClass + '">#' + rank + '</span></div>'
        + '<div class="hr-img-wrap">' + img + '</div>'
        + '<div class="hr-body">'
        + '<div class="hr-name">' + esc(h.name) + '</div>'
        + '<div class="hr-meta"><span class="hr-stars">' + starsHtml(h.stars || 0) + '</span>'
        + '<span class="hr-loc">📍 ' + esc(h.city) + ' · ' + esc(h.country) + '</span></div>'
        + (badges ? '<div class="hr-badges">' + badges + '</div>' : '')
        + '<div class="hr-score-row">'
        + '<div class="hr-score-bar-outer"><div class="hr-score-bar-inner" data-pct="' + h._score + '"></div></div>'
        + '<span class="hr-score-label" style="color:' + lbl.color + '">' + h._score + ' <span style="font-weight:500;font-size:.72rem;opacity:.85">' + lbl.text + '</span></span>'
        + '</div>'
        + '</div></div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // Animate score bars after paint
    requestAnimationFrame(function () {
      setTimeout(function () {
        container.querySelectorAll('.hr-score-bar-inner').forEach(function (bar) {
          bar.style.width = (bar.dataset.pct || 0) + '%';
        });
      }, 80);
    });
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  function init() {
    var containers = document.querySelectorAll('[data-hotel-ranking]');
    if (!containers.length) return;
    injectCSS();

    containers.forEach(function (container) {
      var ids = (container.getAttribute('data-hotel-ranking') || '')
        .split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!ids.length) return;

      renderSkeleton(container, ids.length);

      Promise.all(ids.map(function (id) {
        return fetch('/api/giata?action=property&id=' + encodeURIComponent(id))
          .then(function (r) { return r.ok ? r.json() : null; })
          .catch(function () { return null; });
      })).then(function (results) {
        var valid = results.filter(function (h) { return h && h.giataId && !h.error; });
        valid.forEach(function (h) { h._score = calcScore(h); });
        valid = valid.filter(function (h) { return h._score >= 50; });
        valid.sort(function (a, b) {
          if (b._score !== a._score) return b._score - a._score;
          return (b.stars || 0) - (a.stars || 0);
        });
        if (valid.length) {
          renderHotels(container, valid);
        } else {
          container.innerHTML = '<p style="color:var(--text-muted,#777);text-align:center;padding:2rem 0;">Keine Hotel-Daten verfügbar.</p>';
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
