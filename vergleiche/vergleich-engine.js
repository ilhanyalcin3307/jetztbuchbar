/**
 * JetztBuchbar – Vergleich Engine
 * Rendert den kompletten Reiseziel-Vergleich (Tabelle, KI-Fazit, CTAs)
 * Voraussetzung: destinations-data.js muss vorher geladen sein (window.JB)
 *
 * Aufruf im Shell-HTML:
 *   <script src="/vergleiche/destinations-data.js"></script>
 *   <script src="/vergleiche/vergleich-engine.js"></script>
 *   <script>JB.initVergleich('mallorca-vs-kreta');</script>
 */

'use strict';

(function (global) {

  /* ── Guard ── */
  var JB = global.JB;
  if (!JB || !JB.DESTINATIONS) {
    console.error('[VergleichEngine] destinations-data.js muss zuerst geladen werden.');
    return;
  }

  /* ─────────────────────────────────────────────────
     CSS INJECTION
     Nur einmal eingebunden (guard via data-Attribut)
     ───────────────────────────────────────────────── */
  function injectCSS() {
    if (document.querySelector('style[data-vg-engine]')) return;
    var style = document.createElement('style');
    style.setAttribute('data-vg-engine', '1');
    style.textContent = [
      /* ── Travel-Type Selector ── */
      '.vg-tt-wrap{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.75rem}',
      '.vg-tt-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.1rem;font-size:.83rem;font-weight:600;font-family:inherit;color:var(--text-muted);background:var(--bg-card);border:1px solid var(--border);border-radius:50px;cursor:pointer;transition:all .2s}',
      '.vg-tt-btn:hover{border-color:var(--accent);color:var(--accent)}',
      '.vg-tt-btn.active{background:var(--accent);border-color:var(--accent);color:#0a0a0a}',

      /* ── KI-Fazit ── */
      '.vg-ki-fazit{background:linear-gradient(135deg,rgba(0,200,150,.09),rgba(0,200,150,.03));border-left:3px solid var(--accent);border-radius:0 var(--radius-sm,8px) var(--radius-sm,8px) 0;padding:1.25rem 1.5rem;margin-bottom:1.5rem}',
      '.vg-ki-label{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);margin-bottom:.55rem;display:flex;align-items:center;gap:.4rem}',
      '.vg-ki-text{font-size:1rem;line-height:1.75;color:var(--text-soft,#aaa)}',

      /* ── Comparison Table ── */
      '.vg-table-wrap{border:1px solid var(--border);border-radius:var(--radius,14px);overflow:hidden}',
      '.vg-table-header{display:grid;grid-template-columns:220px 1fr 1fr;background:rgba(0,200,150,.06);border-bottom:2px solid var(--accent)}',
      '.vg-th-criterion{padding:.85rem 1.1rem;font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}',
      '.vg-th-dest{padding:.85rem 1.1rem;font-size:.95rem;font-weight:800;color:var(--text);border-left:1px solid var(--border);display:flex;align-items:center;gap:.45rem}',
      '.vg-dest-flag{font-size:1.2rem}',
      '.vg-row{display:grid;grid-template-columns:220px 1fr 1fr;border-bottom:1px solid var(--border)}',
      '.vg-row:last-child{border-bottom:none}',
      '.vg-row:hover{background:rgba(255,255,255,.02)}',
      '.vg-row-label{padding:.85rem 1.1rem;font-size:.85rem;font-weight:600;color:var(--text-muted);display:flex;align-items:flex-start;gap:.5rem}',
      '.vg-row-icon{font-size:1rem;flex-shrink:0;margin-top:.05rem}',
      '.vg-row-cell{padding:.85rem 1.1rem;font-size:.88rem;color:var(--text-soft,#aaa);border-left:1px solid var(--border);line-height:1.6}',
      '.vg-row-cell small{font-size:.77rem;color:var(--text-muted);display:block;margin-top:.2rem}',
      '.vg-row-cell.vg-winner{background:rgba(0,200,150,.06)}',
      '.vg-row-cell.vg-winner::before{content:"✓ ";color:var(--accent);font-weight:700}',

      /* ── Stars & Budget ── */
      '.vg-star,.vg-euro{color:var(--border);font-size:1rem}',
      '.vg-star.filled{color:#fbbf24}',
      '.vg-euro.filled{color:var(--accent)}',

      /* ── Activity Tags ── */
      '.vg-tag{display:inline-block;padding:.2rem .6rem;font-size:.75rem;background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:50px;margin:.15rem .1rem;color:var(--text-muted)}',

      /* ── CTA Grid ── */
      '.vg-cta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.85rem}',
      '.vg-cta-card{display:flex;align-items:center;gap:.75rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius,14px);padding:1rem 1.25rem;transition:border-color .2s,background .2s;cursor:pointer}',
      '.vg-cta-card:hover{border-color:var(--accent);background:rgba(0,200,150,.05)}',
      '.vg-cta-flag{font-size:1.5rem;flex-shrink:0}',
      '.vg-cta-label{flex:1;font-size:.88rem;font-weight:600;color:var(--text);line-height:1.4}',
      '.vg-cta-arrow{color:var(--accent);font-size:1.1rem;flex-shrink:0;transition:transform .2s}',
      '.vg-cta-card:hover .vg-cta-arrow{transform:translateX(4px)}',

      /* ── Responsive ── */
      '@media(max-width:640px){',
        '.vg-table-header,.vg-row{grid-template-columns:120px 1fr 1fr}',
        '.vg-row-label,.vg-th-criterion{font-size:.75rem;padding:.65rem .75rem}',
        '.vg-row-cell,.vg-th-dest{font-size:.82rem;padding:.65rem .75rem}',
        '.vg-cta-grid{grid-template-columns:1fr}',
        '.vg-tt-btn{font-size:.78rem;padding:.45rem .9rem}',
      '}'
    ].join('');
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────────────
     HELPERS
     ───────────────────────────────────────────────── */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStars(score) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<span class="vg-star' + (i <= score ? ' filled' : '') + '">★</span>';
    }
    return out;
  }

  function renderBudget(score) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<span class="vg-euro' + (i <= score ? ' filled' : '') + '">€</span>';
    }
    return out;
  }

  function renderTags(arr) {
    return arr.map(function (a) {
      return '<span class="vg-tag">' + esc(a) + '</span>';
    }).join('');
  }

  /* Wer hat den höheren Score? → 'a' | 'b' | 'tie' */
  function winner(scoreA, scoreB) {
    return scoreA > scoreB ? 'a' : scoreB > scoreA ? 'b' : 'tie';
  }

  /* ─────────────────────────────────────────────────
     KI-FAZIT: DYNAMISCHE TEMPLATES
     ───────────────────────────────────────────────── */

  var FAZIT = {
    family: function (w, l) {
      return w.name + ' ist die bessere Wahl für Familien mit Kindern – ' +
        (w.scores.family >= 5
          ? 'mit ausgezeichneter Kinderinfrastruktur, familienfreundlichen Stränden und vielfältiger Unterhaltung für alle Altersgruppen.'
          : 'mit guten Familienhotels und Aktivitäten für Groß und Klein.');
    },
    couple: function (w, l) {
      return w.name + ' bietet die romantischere Atmosphäre für Paare – ' +
        (w.beach.score >= 4
          ? 'traumhafte Sonnenuntergänge, intime Buchten und ein unvergessliches Flair.'
          : 'elegante Hotels, exzellente Gastronomie und besondere Erlebnisse zu zweit.');
    },
    beach: function (w, l) {
      return 'Als Strandparadies führt ' + w.name + ' deutlich – ' +
        w.beach.label + ' (' + w.beach.type + ') macht jeden Strandtag perfekt.';
    },
    culture: function (w, l) {
      return 'Kulturinteressierte kommen in ' + w.name + ' auf ihre Kosten – ' +
        (w.nature.highlights && w.nature.highlights.length
          ? 'von ' + w.nature.highlights.slice(0, 2).join(' bis ') + ' gibt es viel zu entdecken.'
          : 'Geschichte, Architektur und lokale Traditionen sind hier besonders reichhaltig.');
    },
    adventure: function (w, l) {
      return 'Abenteuerlustige sind in ' + w.name + ' besser aufgehoben – ' +
        (w.activities && w.activities.length
          ? w.activities.slice(0, 3).join(', ') + ' warten auf dich.'
          : 'Outdoor-Aktivitäten und aufregende Erlebnisse erwarten dich.');
    },
    nature: function (w, l) {
      return w.name + ' begeistert Naturliebhaber – ' + w.nature.label +
        (w.nature.highlights && w.nature.highlights.length
          ? ': ' + w.nature.highlights.slice(0, 2).join(', ') + ' sind unvergessliche Erlebnisse.'
          : ' – landschaftlich kaum zu überbieten.');
    },
    party: function (w, l) {
      return 'Für Partygänger ist ' + w.name + ' die klarere Wahl – ' +
        (w.scores.party >= 4
          ? 'lebhaftes Nachtleben, Clubs und Bars bis in die frühen Morgenstunden.'
          : 'eine solide Ausgehszene für gesellige Abende und gute Musik.');
    }
  };

  function generateFazit(destA, destB, travelType) {
    var sA = destA.scores[travelType] || 0;
    var sB = destB.scores[travelType] || 0;
    var w  = sA >= sB ? destA : destB;
    var l  = w === destA ? destB : destA;
    var fn = FAZIT[travelType];
    return fn ? fn(w, l) : null;
  }

  /* ─────────────────────────────────────────────────
     RENDER: KI-FAZIT BOX
     ───────────────────────────────────────────────── */

  function renderKiFazit(text, container) {
    container.innerHTML =
      '<div class="vg-ki-fazit">' +
        '<div class="vg-ki-label"><span>🤖</span> JetztBuchbar KI-Empfehlung</div>' +
        '<p class="vg-ki-text">' + esc(text) + '</p>' +
      '</div>';
  }

  /* ─────────────────────────────────────────────────
     RENDER: TRAVEL-TYPE SELECTOR
     ───────────────────────────────────────────────── */

  function renderTravelTypes(pair, destA, destB, fazitEl) {
    var el = document.getElementById('vg-travel-types');
    if (!el) return;

    var html = '<div class="vg-tt-wrap">';
    JB.TRAVEL_TYPES.forEach(function (tt) {
      html += '<button class="vg-tt-btn" data-type="' + tt.key + '">' +
        tt.icon + ' ' + esc(tt.label) + '</button>';
    });
    html += '</div>';
    el.innerHTML = html;

    el.querySelectorAll('.vg-tt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        el.querySelectorAll('.vg-tt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var text = generateFazit(destA, destB, btn.dataset.type) || pair.default_ki_fazit;
        renderKiFazit(text, fazitEl);
      });
    });
  }

  /* ─────────────────────────────────────────────────
     RENDER: COMPARISON TABLE
     ───────────────────────────────────────────────── */

  function renderTable(destA, destB, container) {
    var rows = [
      {
        icon: '📅', label: 'Beste Reisezeit',
        a: esc(destA.bestSeason.label) + '<br><small>' + esc(destA.bestSeason.tip) + '</small>',
        b: esc(destB.bestSeason.label) + '<br><small>' + esc(destB.bestSeason.tip) + '</small>',
        win: winner(destA.bestSeason.score, destB.bestSeason.score)
      },
      {
        icon: '💶', label: 'Budget-Index',
        a: renderBudget(destA.budget.score) +
           '<br><small>∅ ' + destA.budget.avgHotelNight + '€/Nacht · Flug ab ' + destA.budget.avgFlight + '€</small>' +
           '<br><small>' + esc(destA.budget.note) + '</small>',
        b: renderBudget(destB.budget.score) +
           '<br><small>∅ ' + destB.budget.avgHotelNight + '€/Nacht · Flug ab ' + destB.budget.avgFlight + '€</small>' +
           '<br><small>' + esc(destB.budget.note) + '</small>',
        win: winner(6 - destA.budget.score, 6 - destB.budget.score) // niedriger Score = günstiger = besser
      },
      {
        icon: '🏖️', label: 'Strandqualität',
        a: renderStars(destA.beach.score) + '<br><small>' + esc(destA.beach.label) + '</small>',
        b: renderStars(destB.beach.score) + '<br><small>' + esc(destB.beach.label) + '</small>',
        win: winner(destA.beach.score, destB.beach.score)
      },
      {
        icon: '🌿', label: 'Natur & Landschaft',
        a: renderStars(destA.nature.score) + '<br><small>' + esc(destA.nature.label) + '</small>',
        b: renderStars(destB.nature.score) + '<br><small>' + esc(destB.nature.label) + '</small>',
        win: winner(destA.nature.score, destB.nature.score)
      },
      {
        icon: '🎯', label: 'Top-Aktivitäten',
        a: renderTags(destA.activities.slice(0, 4)),
        b: renderTags(destB.activities.slice(0, 4)),
        win: 'tie'
      },
      {
        icon: '✈️', label: 'Flugzeit ab DE',
        a: '<strong>' + esc(destA.flightFromDE.label) + '</strong>',
        b: '<strong>' + esc(destB.flightFromDE.label) + '</strong>',
        // Kürzere Flugzeit = besser → Zeiten als float vergleichen
        win: winner(
          parseFloat(destB.flightFromDE.duration.replace(':', '.')),
          parseFloat(destA.flightFromDE.duration.replace(':', '.'))
        )
      },
      {
        icon: '👨‍👩‍👧', label: 'Familienfreundlichkeit',
        a: renderStars(destA.scores.family),
        b: renderStars(destB.scores.family),
        win: winner(destA.scores.family, destB.scores.family)
      },
      {
        icon: '💑', label: 'Für Pärchen',
        a: renderStars(destA.scores.couple),
        b: renderStars(destB.scores.couple),
        win: winner(destA.scores.couple, destB.scores.couple)
      },
      {
        icon: '🏛️', label: 'Kultur & Geschichte',
        a: renderStars(destA.scores.culture),
        b: renderStars(destB.scores.culture),
        win: winner(destA.scores.culture, destB.scores.culture)
      },
      {
        icon: '🧗', label: 'Abenteuer & Sport',
        a: renderStars(destA.scores.adventure),
        b: renderStars(destB.scores.adventure),
        win: winner(destA.scores.adventure, destB.scores.adventure)
      }
    ];

    var html = '<div class="vg-table-wrap">';

    // Header
    html += '<div class="vg-table-header">';
    html += '<div class="vg-th-criterion">Kriterium</div>';
    html += '<div class="vg-th-dest"><span class="vg-dest-flag">' + destA.flag + '</span> ' + esc(destA.name) + '</div>';
    html += '<div class="vg-th-dest"><span class="vg-dest-flag">' + destB.flag + '</span> ' + esc(destB.name) + '</div>';
    html += '</div>';

    // Rows
    rows.forEach(function (row) {
      html += '<div class="vg-row">';
      html += '<div class="vg-row-label"><span class="vg-row-icon">' + row.icon + '</span>' + esc(row.label) + '</div>';
      html += '<div class="vg-row-cell' + (row.win === 'a' ? ' vg-winner' : '') + '">' + row.a + '</div>';
      html += '<div class="vg-row-cell' + (row.win === 'b' ? ' vg-winner' : '') + '">' + row.b + '</div>';
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  /* ─────────────────────────────────────────────────
     RENDER: CTA CARDS
     ───────────────────────────────────────────────── */

  function renderCtaCards(destA, destB, container) {
    if (!container) return;

    // Interleave A/B cards, max 4
    var cards = [];
    var maxLen = Math.max(destA.ctaCards.length, destB.ctaCards.length);
    for (var i = 0; i < maxLen && cards.length < 4; i++) {
      if (destA.ctaCards[i] && cards.length < 4) cards.push({ card: destA.ctaCards[i], dest: destA });
      if (destB.ctaCards[i] && cards.length < 4) cards.push({ card: destB.ctaCards[i], dest: destB });
    }

    var html = '<div class="vg-cta-grid">';
    cards.forEach(function (item) {
      var url = JB.buildHotelCompareUrl(item.card.giataIds);
      html += '<a href="' + esc(url) + '" class="vg-cta-card">';
      html += '<span class="vg-cta-flag">' + item.dest.flag + '</span>';
      html += '<span class="vg-cta-label">' + esc(item.card.label) + '</span>';
      html += '<span class="vg-cta-arrow">→</span>';
      html += '</a>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  /* ─────────────────────────────────────────────────
     MAIN: initVergleich(pairKey)
     ───────────────────────────────────────────────── */

  function initVergleich(pairKey) {
    injectCSS();

    var pair = JB.PAIRS[pairKey];
    if (!pair) {
      console.error('[VergleichEngine] Unbekanntes Paar:', pairKey);
      return;
    }

    var destA = JB.DESTINATIONS[pair.destA];
    var destB = JB.DESTINATIONS[pair.destB];
    if (!destA || !destB) {
      console.error('[VergleichEngine] Unbekanntes Ziel:', pair.destA, pair.destB);
      return;
    }

    // ── SEO (dynamisch, ergänzend zu den hardcoded Static-Tags im Shell-HTML) ──
    if (!document.title || document.title === 'JetztBuchbar') {
      document.title = pair.seoTitle;
    }
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && !metaDesc.getAttribute('content')) {
      metaDesc.setAttribute('content', pair.seoDescription);
    }

    // ── Dynamische Text-Platzhalter befüllen ──
    document.querySelectorAll('[data-dest-a]').forEach(function (el) { el.textContent = destA.name; });
    document.querySelectorAll('[data-dest-b]').forEach(function (el) { el.textContent = destB.name; });
    document.querySelectorAll('[data-dest-a-flag]').forEach(function (el) { el.textContent = destA.flag; });
    document.querySelectorAll('[data-dest-b-flag]').forEach(function (el) { el.textContent = destB.flag; });
    document.querySelectorAll('[data-dest-a-tagline]').forEach(function (el) { el.textContent = destA.tagline; });
    document.querySelectorAll('[data-dest-b-tagline]').forEach(function (el) { el.textContent = destB.tagline; });

    // ── KI-Fazit (Default beim Laden) ──
    var fazitEl = document.getElementById('vg-ki-fazit');
    if (fazitEl) renderKiFazit(pair.default_ki_fazit, fazitEl);

    // ── Travel-Type Selector ──
    if (fazitEl) renderTravelTypes(pair, destA, destB, fazitEl);

    // ── Comparison Table ──
    var tableEl = document.getElementById('vg-table');
    if (tableEl) renderTable(destA, destB, tableEl);

    // ── CTA Cards ──
    var ctaEl = document.getElementById('vg-cta');
    if (ctaEl) renderCtaCards(destA, destB, ctaEl);
  }

  /* ── Export ── */
  JB.initVergleich = initVergleich;

})(window);
