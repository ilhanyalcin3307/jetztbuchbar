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
      var JBS = window.JBScore || {};
      var feats = JBS.topFeatures ? JBS.topFeatures(h, 4) : [];
      var FEAT_ICONS = JBS.FEAT_ICONS || {};
      var badges = feats.map(function (f) {
        return '<span class="hr-badge">' + (FEAT_ICONS[f.l] || '') + ' ' + esc(f.l) + '</span>';
      }).join('');
      var lbl = JBS.scoreLabel ? JBS.scoreLabel(h._score) : { text: '', color: '#00c896' };
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
    var JBS = window.JBScore || {};
    var _calcScore = JBS.calcScore || function(h) { return 60; };
    var _fetchWarn = JBS.fetchWarningPenalty || function() { return Promise.resolve(0); };

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
        // Reisewarnung für alle eindeutigen Länder abrufen (gecacht)
        return Promise.all(valid.map(function (h) {
          return _fetchWarn(h.country || '').then(function (p) { h._warningPenalty = p; });
        })).then(function () { return valid; });
      }).then(function (valid) {
        var JBS2 = window.JBScore || {};
        var _calc2 = JBS2.calcScore || function(h) { return 60; };
        valid.forEach(function (h) {
          h._score = _calc2(h, { warningPenalty: h._warningPenalty || 0 });
        });
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
