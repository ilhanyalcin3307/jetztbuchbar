/**
 * hotel-ranking.js — JetztBuchbar Top-Hotel-Ranking Component
 * Scoring-Engine: window.JBScore (aus /components/jb-score.js, wird auto-geladen)
 * Usage: <div data-hotel-ranking="id1,id2,id3,id4,id5"></div>
 *        <script src="/components/hotel-ranking.js" defer></script>
 */
(function () {
  'use strict';

  // Auto-load jb-score.js wenn noch nicht vorhanden, dann init aufrufen
  function withJBScore(cb) {
    if (window.JBScore) return cb();
    var s = document.createElement('script');
    s.src = '/components/jb-score.js';
    s.onload = cb;
    s.onerror = cb; // Graceful: render ohne penalty wenn Skript nicht lädt
    document.head.appendChild(s);
  }

  // topFeatures / scoreLabel / FEAT_ICONS kommen jetzt aus window.JBScore

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
      '.hr-img-wrap{width:160px;min-width:160px;flex-shrink:0;overflow:hidden;background:rgba(255,255,255,.03);position:relative}',
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
      '@media(max-width:580px){.hr-img-wrap{width:90px;min-width:90px}.hr-rank-col{min-width:2.25rem}.hr-body{padding:.7rem .85rem}.hr-name{font-size:.88rem}}',
      '.jb-views{font-size:.71rem;color:var(--text-muted,#777);margin-top:.15rem;min-height:.85rem;line-height:1.3}',
      '.hr-breakdown{margin-top:.55rem;display:flex;flex-direction:column;gap:.22rem}',
      '.hr-bd-row{display:flex;align-items:center;gap:.45rem}',
      '.hr-bd-label{font-size:.69rem;color:var(--text-muted,#777);width:8.5rem;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hr-bd-bar-outer{flex:1;height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;min-width:2rem}',
      '.hr-bd-bar-inner{height:100%;border-radius:2px;width:0;transition:width 1s ease .35s}',
      '.hr-bd-score{font-size:.7rem;font-weight:700;min-width:1.8rem;text-align:right;flex-shrink:0}',
      /* ── Image Carousel ── */
      '.hr-img-carousel{position:relative;width:100%;height:100%;overflow:hidden}',
      '.hr-img-strip{display:flex;width:100%;height:100%;transition:transform .35s ease}',
      '.hr-img-strip img{width:100%;height:100%;object-fit:cover;display:block;flex-shrink:0}',
      '.hr-img-dots{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:center;gap:4px;padding:4px 0;background:linear-gradient(transparent,rgba(0,0,0,.55));z-index:4}',
      '.hr-img-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.35);border:none;padding:0;cursor:pointer;transition:background .2s,transform .2s;flex-shrink:0}',
      '.hr-img-dot.active{background:#fff;transform:scale(1.25)}',
      '.hr-img-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:5;background:rgba(0,0,0,.45);border:none;color:#fff;width:22px;height:28px;border-radius:4px;font-size:1rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;padding:0}',
      '.hr-img-carousel:hover .hr-img-nav{opacity:1}',
      '.hr-img-prev{left:3px}.hr-img-next{right:3px}',
      /* ── JB Score Badge ── */
      '.hr-score-badge{position:absolute;top:7px;right:7px;width:56px;height:56px;border-radius:50%;border:2.5px solid var(--badge-c,#00c896);background:rgba(8,8,8,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:4;box-shadow:0 0 0 1px rgba(0,200,150,.25),0 3px 12px rgba(0,0,0,.6);overflow:hidden;gap:0}',
      '.hr-score-badge-num{font-size:1.25rem;font-weight:900;line-height:1;margin-top:1px}',
      '.hr-score-badge-band{background:#c0603a;width:100%;text-align:center;font-size:.46rem;font-weight:800;letter-spacing:.1em;color:#fff;padding:1px 0;margin-top:2px;text-transform:uppercase}',
      '.hr-score-badge-stars{font-size:.4rem;color:#f59e0b;letter-spacing:1px;margin-top:1px;line-height:1}',
      /* ── Sofort Anfragen Button ── */
      '.hr-anfrage-btn{margin-top:.65rem;width:100%;padding:.5rem .75rem;background:rgba(0,200,150,.1);border:1px solid rgba(0,200,150,.3);border-radius:8px;color:var(--accent,#00c896);font-size:.8rem;font-weight:700;cursor:pointer;transition:background .2s,border-color .2s;text-align:center}',
      '.hr-anfrage-btn:hover{background:rgba(0,200,150,.2);border-color:var(--accent,#00c896)}',
      '@media(max-width:580px){.hr-img-nav{display:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  // ── Image Carousel Handler ───────────────────────────────────────────────────
  function attachCarouselHandlers(listEl) {
    listEl.addEventListener('click', function (e) {
      var dot  = e.target.closest ? e.target.closest('.hr-img-dot')  : null;
      var prev = e.target.closest ? e.target.closest('.hr-img-prev') : null;
      var next = e.target.closest ? e.target.closest('.hr-img-next') : null;
      var wrap, targetIdx = -1, delta = 0;
      if (dot)  { wrap = dot.closest('.hr-img-wrap');  targetIdx = parseInt(dot.dataset.idx, 10); }
      else if (prev) { wrap = prev.closest('.hr-img-wrap'); delta = -1; }
      else if (next) { wrap = next.closest('.hr-img-wrap'); delta =  1; }
      if (!wrap) return;
      var dots  = wrap.querySelectorAll('.hr-img-dot');
      var count = dots.length;
      if (!count) return;
      var cur = 0;
      dots.forEach(function (d, i) { if (d.classList.contains('active')) cur = i; });
      if (targetIdx < 0) targetIdx = (cur + delta + count) % count;
      targetIdx = Math.max(0, Math.min(count - 1, targetIdx));
      var strip = wrap.querySelector('.hr-img-strip');
      if (strip) strip.style.transform = 'translateX(-' + (targetIdx * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === targetIdx); });
      e.stopPropagation();
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function renderSkeleton(container, count) {
    var html = '<div class="hr-list">';
    for (var i = 0; i < count; i++) html += '<div class="hr-skeleton"></div>';
    html += '</div>';
    container.innerHTML = html;
  }

  function renderBreakdown(detail) {
    if (!detail || !detail.breakdown) return '';
    var bd = detail.breakdown;
    var rows = [
      { key: 'tesis',    label: 'Anlage & Ausstattung',  color: '#00c896' },
      { key: 'ulke',     label: 'Land & Sicherheit',     color: '#60a5fa' },
      { key: 'deneyim',  label: 'Gästeerlebnis',         color: '#f59e0b' },
      { key: 'kategori', label: 'Kategorie & Lage',      color: '#a78bfa' }
    ];
    var html = '<div class="hr-breakdown">';
    rows.forEach(function (row) {
      var score = bd[row.key];
      var pct   = score != null ? score : 0;
      var txt   = score != null ? String(score) : '—';
      html += '<div class="hr-bd-row">'
        + '<span class="hr-bd-label">' + row.label + '</span>'
        + '<div class="hr-bd-bar-outer"><div class="hr-bd-bar-inner" data-pct="' + pct
        + '" style="background:' + row.color + '"></div></div>'
        + '<span class="hr-bd-score" style="color:' + row.color + '">' + txt + '</span>'
        + '</div>';
    });
    html += '</div>';
    return html;
  }

  function renderHotels(container, hotels) {
    var maxScore = Math.max.apply(null, hotels.map(function (h) { return h._score; }));
    var html = '<div class="hr-list">';

    hotels.forEach(function (h, idx) {
      var rank = idx + 1;
      var rankClass = rank <= 3 ? 'r' + rank : '';
      var JBS = window.JBScore || {};
      var feats = JBS.topFeatures ? JBS.topFeatures(h, 4) : [];
      var FEAT_ICONS = JBS.FEAT_ICONS || {};
      var badges = feats.map(function (f) {
        return '<span class="hr-badge">' + (FEAT_ICONS[f.l] || '') + ' ' + esc(f.l) + '</span>';
      }).join('');
      var lbl = JBS.scoreLabel ? JBS.scoreLabel(h._score) : { text: '', color: '#00c896' };

      // ── Bild-Carousel ───────────────────────────────────────────────
      var imgList = (h.images && h.images.length > 1) ? h.images.slice(0, 4) : (h.image ? [h.image] : []);
      var imgHtml;
      if (imgList.length === 0) {
        imgHtml = '<div class="hr-img-placeholder">🏨</div>';
      } else if (imgList.length === 1) {
        imgHtml = '<img src="' + esc(imgList[0]) + '" alt="' + esc(h.name) + '" loading="lazy" />';
      } else {
        var stripImgs = imgList.map(function (url, i) {
          return '<img src="' + esc(url) + '" alt="' + esc(h.name) + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '" />';
        }).join('');
        var dots = imgList.map(function (_, i) {
          return '<button class="hr-img-dot' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '" aria-label="Bild ' + (i + 1) + '"></button>';
        }).join('');
        imgHtml = '<div class="hr-img-carousel">'
          + '<button class="hr-img-nav hr-img-prev" aria-label="Vorheriges Bild">&#8249;</button>'
          + '<div class="hr-img-strip">' + stripImgs + '</div>'
          + '<button class="hr-img-nav hr-img-next" aria-label="N&#228;chstes Bild">&#8250;</button>'
          + '<div class="hr-img-dots">' + dots + '</div>'
          + '</div>';
      }

      // ── Score Badge ─────────────────────────────────────────────────
      var scoreBadge = '<div class="hr-score-badge" style="--badge-c:' + lbl.color + '">'
        + '<span class="hr-score-badge-num" style="color:' + lbl.color + '">' + h._score + '</span>'
        + '<span class="hr-score-badge-band">Score</span>'
        + '<span class="hr-score-badge-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>'
        + '</div>';

      html += '<div class="hr-card" data-hotel-id="' + esc(h.giataId) + '">'
        + '<div class="hr-rank-col"><span class="hr-rank-num ' + rankClass + '">#' + rank + '</span></div>'
        + '<div class="hr-img-wrap">' + imgHtml + scoreBadge + '</div>'
        + '<div class="hr-body">'
        + '<div class="hr-name">' + esc(h.name) + '</div>'
        + '<div class="hr-meta"><span class="hr-stars">' + starsHtml(h.stars || 0) + '</span>'
        + '<span class="hr-loc">📍 ' + esc(h.city) + ' · ' + esc(h.country) + '</span></div>'
        + '<div class="jb-views">👁 …</div>'
        + (badges ? '<div class="hr-badges">' + badges + '</div>' : '')
        + '<div class="hr-score-row">'
        + '<div class="hr-score-bar-outer"><div class="hr-score-bar-inner" data-pct="' + h._score + '"></div></div>'
        + '<span class="hr-score-label" style="color:' + lbl.color + '">' + h._score + ' <span style="font-weight:500;font-size:.72rem;opacity:.85">' + lbl.text + '</span></span>'
        + '</div>'        + renderBreakdown(h._detail)
        + '<button class="hr-anfrage-btn" data-anfrage data-name="' + esc(h.name) + '">✉️ Sofort anfragen</button>'
        + '</div></div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // Carousel-Navigation initialisieren
    var listEl = container.querySelector('.hr-list');
    if (listEl) attachCarouselHandlers(listEl);

    // Animate score bars after paint
    requestAnimationFrame(function () {
      setTimeout(function () {
        container.querySelectorAll('.hr-score-bar-inner, .hr-bd-bar-inner').forEach(function (bar) {
          bar.style.width = (bar.dataset.pct || 0) + '%';
        });
      }, 80);
    });
  }
  // ── View Counter ─────────────────────────────────────────────────────────────────────────
  function jbFmtViews(n) {
    return Number(n).toLocaleString('de-DE');
  }

  function jbLoadViews(container) {
    container.querySelectorAll('[data-hotel-id]').forEach(function(card) {
      var id    = card.getAttribute('data-hotel-id');
      var badge = card.querySelector('.jb-views');
      if (!id || !badge) return;
      var sk = 'jb_v_' + id;
      var cached = null;
      try { cached = sessionStorage.getItem(sk); } catch(e) {}
      if (cached !== null) {
        badge.textContent = '👁 ' + jbFmtViews(Number(cached)) + ' Mal angesehen';
        return;
      }
      fetch('/api/views?id=' + encodeURIComponent(id), { method: 'POST' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(d) {
          var c = d && d.count != null ? d.count : 0;
          try { sessionStorage.setItem(sk, String(c)); } catch(e) {}
          badge.textContent = '👁 ' + jbFmtViews(c) + ' Mal angesehen';
        })
        .catch(function() { badge.textContent = ''; });
    });
  }
  // ── Bootstrap ────────────────────────────────────────────────────────────────
  function init() {
    var containers = document.querySelectorAll('[data-hotel-ranking]');
    if (!containers.length) return;
    injectCSS();
    var JBS = window.JBScore || {};
    var _calcScore = JBS.calcScore || function(h) { return 60; };
    var _fetchWarnLevel = JBS.fetchWarningLevel || function() { return Promise.resolve({ level: 0 }); };

    containers.forEach(function (container) {
      var val = (container.getAttribute('data-hotel-ranking') || '').trim();
      if (!val) return;

      var isCountryCode = /^[A-Z]{2}$/.test(val);

      function fetchAndRenderByIds(ids) {
        renderSkeleton(container, ids.length);
        return Promise.all(ids.map(function (id) {
          return fetch('/api/giata?action=property&id=' + encodeURIComponent(id))
            .then(function (r) { return r.ok ? r.json() : null; })
            .catch(function () { return null; });
        })).then(function (results) {
        var valid = results.filter(function (h) { return h && h.giataId && !h.error; });
        // Reisewarnung für alle eindeutigen Länder abrufen (gecacht)
        return Promise.all(valid.map(function (h) {
          return _fetchWarnLevel(h.country || '').then(function (w) { h._warningLevel = (w && w.level != null) ? w.level : 0; });
        })).then(function () { return valid; });
      }).then(function (valid) {
        var JBS2 = window.JBScore || {};
        var _detail2 = JBS2.calcScoreDetail || function(h) { return { score: 60, breakdown: null, weights: {}, meta: {} }; };
        valid.forEach(function (h) {
          var det   = _detail2(h, { warningLevel: h._warningLevel || 0 });
          h._score  = det.score;
          h._detail = det;
        });
        valid = valid.filter(function (h) { return h._score >= 50; });
        valid.sort(function (a, b) {
          if (b._score !== a._score) return b._score - a._score;
          return (b.stars || 0) - (a.stars || 0);
        });
        if (valid.length) {
          renderHotels(container, valid);
          jbLoadViews(container);
        } else {
          container.innerHTML = '<p style="color:var(--text-muted,#777);text-align:center;padding:2rem 0;">Keine Hotel-Daten verfügbar.</p>';
        }
      });
      }

      if (isCountryCode) {
        // Dynamisch: Top-Hotels per Länderkode via API laden
        var city  = (container.getAttribute('data-ranking-city')  || '').trim();
        var limit = parseInt(container.getAttribute('data-ranking-limit') || '5', 10);
        var url = '/api/giata?action=top&country=' + encodeURIComponent(val) + '&limit=' + limit;
        if (city) url += '&city=' + encodeURIComponent(city);
        renderSkeleton(container, limit);
        fetch(url)
          .then(function (r) { return r.ok ? r.json() : { hotels: [] }; })
          .catch(function () { return { hotels: [] }; })
          .then(function (data) {
            var ids = (data.hotels || []).map(function (h) { return h.giataId; }).filter(Boolean);
            if (!ids.length) {
              container.innerHTML = '<p style="color:var(--text-muted,#777);text-align:center;padding:2rem 0;">Keine Hotel-Daten verfügbar.</p>';
              return;
            }
            fetchAndRenderByIds(ids);
          });
      } else {
        // Statisch: kommagetrennte GIATA-IDs
        var ids = val.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!ids.length) return;
        fetchAndRenderByIds(ids);
      }
    });
  }

  function bootstrap() {
    withJBScore(function () {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    });
  }

  bootstrap();
})();
