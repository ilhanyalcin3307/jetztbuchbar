(function() {
  'use strict';

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtPrice(value) {
    if (!Number.isFinite(value)) return '';
    return Number(value).toLocaleString('de-DE');
  }

  function injectScopedCss() {
    if (document.getElementById('tdc-scoped-styles')) return;
    var style = document.createElement('style');
    style.id = 'tdc-scoped-styles';
    style.textContent = [
      '[data-touridat-carousel] .hc-card[data-deal-id] .hc-price{display:block;min-height:auto;padding:.62rem .68rem}',
      '[data-touridat-carousel] .hc-card[data-deal-id] .hc-price-kicker{display:block;margin-bottom:.2rem}',
      '[data-touridat-carousel] .hc-card[data-deal-id] .hc-price strong{display:block;white-space:normal}',
      '[data-touridat-carousel] .hc-card[data-deal-id] .hc-price-meta{display:block;margin-top:.14rem}',
      '[data-touridat-carousel] .hc-card[data-deal-id] .hc-price-note{display:block;margin-top:.12rem;line-height:1.32;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
    ].join('');
    document.head.appendChild(style);
  }

  function renderError(container, msg) {
    container.innerHTML = '<p style="color:var(--text-muted,#777);padding:2rem 0;text-align:center">' + esc(msg) + '</p>';
  }

  function renderSkeleton(container, n) {
    var html = '<div class="hc-outer"><div class="hc-track">';
    for (var i = 0; i < n; i += 1) html += '<div class="hc-skel"></div>';
    html += '</div></div>';
    container.innerHTML = html;
  }

  function renderDeals(container, deals) {
    var html = '<div class="hc-outer">'
      + '<button class="hc-arrow left" aria-label="Zurueck" disabled>‹</button>'
      + '<div class="hc-track">';

    deals.forEach(function(d) {
      var description = esc(d.shortDescription || 'Ausgewaehltes Kurzurlaub-Paket von touriDat.');
      var location = esc(d.location || 'Kurzurlaub & Deal');
      var badgeText = esc(d.merchantName || 'touriDat DE');
      var price = Number(d.price);

      html += '<article class="hc-card" data-deal-id="' + esc(d.id) + '">'
        + '<div class="hc-img-wrap">'
        + '<img src="' + esc(d.image || d.thumbImage || '') + '" alt="' + esc(d.title) + '" loading="lazy">'
        + '</div>'
        + '<div class="hc-body">'
        + '<div class="hc-stars">⭐ Kurzurlaub Deal</div>'
        + '<div class="hc-name">' + esc(d.title) + '</div>'
        + '<div class="hc-loc">📍 ' + location + '</div>'
        + '<div class="hc-price">'
        + '<span class="hc-price-kicker">' + badgeText + '</span>'
        + '<strong><span class="hc-price-prefix">ab p.P.</span> ' + fmtPrice(price) + ' €</strong>'
        + '<div class="hc-price-meta"><span>Gutschein-/Paketangebot</span></div>'
        + '<span class="hc-price-note">' + description + '</span>'
        + '</div>'
        + '<div class="hc-btn-row hc-btn-row--no-book">'
        + '<a href="/deals/index.html?id=' + encodeURIComponent(d.id) + '" class="hc-btn hc-btn-details hc-btn--details">Mehr Details</a>'
        + '</div>'
        + '</div>'
        + '</article>';
    });

    html += '</div>'
      + '<button class="hc-arrow right" aria-label="Weiter">›</button>'
      + '</div>';

    container.innerHTML = html;

    var track = container.querySelector('.hc-track');
    var btnL = container.querySelector('.hc-arrow.left');
    var btnR = container.querySelector('.hc-arrow.right');

    function scrollByCards(dir) {
      var card = track.querySelector('.hc-card');
      var cardW = card ? card.offsetWidth : 280;
      track.scrollBy({ left: dir * (cardW + 18), behavior: 'smooth' });
    }

    if (btnL) btnL.addEventListener('click', function() { scrollByCards(-1); });
    if (btnR) btnR.addEventListener('click', function() { scrollByCards(1); });

    function syncArrows() {
      if (!btnL || !btnR) return;
      btnL.disabled = track.scrollLeft < 8;
      btnR.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
    }

    track.addEventListener('scroll', syncArrows, { passive: true });
    syncArrows();

    var drag = { active: false, startX: 0, scrollX: 0 };
    track.addEventListener('mousedown', function(e) {
      drag.active = true;
      drag.startX = e.pageX;
      drag.scrollX = track.scrollLeft;
      track.classList.add('dragging');
    });
    document.addEventListener('mousemove', function(e) {
      if (!drag.active) return;
      track.scrollLeft = drag.scrollX - (e.pageX - drag.startX);
    });
    document.addEventListener('mouseup', function() {
      drag.active = false;
      track.classList.remove('dragging');
    });
  }

  function init() {
    var container = document.querySelector('[data-touridat-carousel]');
    if (!container) return;

    injectScopedCss();

    renderSkeleton(container, 8);

    fetch('/api/touridat-deals?action=list&limit=10')
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (!data || !Array.isArray(data.deals) || !data.deals.length) {
          renderError(container, 'Derzeit keine Deals verfuegbar.');
          return;
        }
        renderDeals(container, data.deals);
      })
      .catch(function() {
        renderError(container, 'Fehler beim Laden der Deals.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
