/**
 * hotel-carousel.js — JetztBuchbar GIATA® Hotel Carousel
 *
 * Usage:
 *   <div data-hotel-carousel="GR"></div>          ← Ländercode → top-8 via API
 *   <div data-hotel-carousel="GR" data-carousel-city="Antalya"></div>  ← Stadt-Filter
 *   <script src="/components/hotel-carousel.js" defer></script>
 *
 * Design: Horizontaler CSS-Snap-Scroll, 4 Karten + 5. Karte halb sichtbar (Desktop),
 *         1,5 Karten (Mobil). Jede Karte: Bild-Galerie, Score-Badge, Name, Ort, Badges.
 */

// ── JB Compare Store (global, localStorage-basiert) ─────────────────────────
if (!window.JB_COMPARE) {
  (function () {
    var MAX = 3, KEY = 'jb_cmp_v1';
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
    function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
    var _cbs = [];
    window.JB_COMPARE = {
      items: load(),
      has: function (id) { id = String(id); return this.items.some(function (x) { return x.id === id; }); },
      add: function (id, name, img) {
        id = String(id);
        if (this.has(id) || this.items.length >= MAX) return false;
        this.items.push({ id: id, name: String(name || ''), img: String(img || '') });
        save(this.items); _notify(); return true;
      },
      remove: function (id) {
        id = String(id);
        this.items = this.items.filter(function (x) { return x.id !== id; });
        save(this.items); _notify();
      },
      clear: function () { this.items = []; save(this.items); _notify(); },
      onChange: function (fn) { _cbs.push(fn); }
    };
    function _notify() { _cbs.forEach(function (fn) { fn(); }); }
  })();
}

(function () {
  'use strict';

  // ── JB Score: Single Source of Truth → /components/jb-score.js ─────────────
  // Auto-load jb-score.js wenn noch nicht vorhanden, dann Callback aufrufen
  function withJBScore(cb) {
    if (window.JBScore) return cb();
    var s = document.createElement('script');
    s.src = '/components/jb-score.js';
    s.onload = cb;
    s.onerror = cb; // Graceful: render ohne Scoring wenn Skript nicht lädt
    document.head.appendChild(s);
  }

  function calcScore(h) {
    return window.JBScore ? window.JBScore.calcScore(h) : 60;
  }
  function topFeatures(h, n) {
    return window.JBScore ? window.JBScore.topFeatures(h, n) : [];
  }
  function getFeatIcons() {
    return (window.JBScore && window.JBScore.FEAT_ICONS) || {};
  }

  function starsHtml(n) {
    var s=''; for(var i=0;i<5;i++) s+=i<n?'★':'☆'; return s;
  }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatPriceDE(value) {
    if (!Number.isFinite(value)) return '';
    return Number(value).toLocaleString('de-DE');
  }

  function providerLogoHtml(provider) {
    var value = String(provider || '').toLowerCase();
    var src = value.indexOf('lidl') !== -1 ? '/images/lidlreisenlogo.png' : '/images/alltourslogo.png';
    var alt = value.indexOf('lidl') !== -1 ? 'Lidl Reisen' : 'Alltours';
    return '<span class="hc-price-provider"><img src="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" /></span>';
  }

  function badgeLabel(label) {
    var map = {
      'Strandlage': 'Strand',
      'All Inclusive Plus': 'AI Plus',
      'All Inclusive': 'AI',
      'Wasserpark': 'Aqua',
      'Wasserrutsche': 'Rutsche',
      'Privater Pool': 'Priv. Pool',
      'Privater Strand': 'Priv. Strand',
      'Familienfreundlich': 'Familie',
      'Kinderclub': 'Kids',
      'Wellness': 'Spa',
      'Direkte Strandlage': 'Strand'
    };
    return map[label] || label;
  }

  function displayPriceValue(offer) {
    var price = Number(offer && offer.price);
    if (!Number.isFinite(price) || price <= 0) return null;
    var duration = Number(offer && offer.duration);
    if (Number.isFinite(duration) && duration > 0) return Math.round(price / duration);
    return Math.round(price);
  }

  function getLiveAffiliateOffers(hotel) {
    var offers = Array.isArray(hotel && hotel.affiliateOffers) ? hotel.affiliateOffers : [];
    offers = offers.filter(function(offer) {
      return offer && offer.deeplink && Number.isFinite(Number(offer.price)) && Number(offer.price) > 0;
    });

    if (!offers.length && hotel && hotel.affiliateOffer && hotel.affiliateOffer.deeplink && Number.isFinite(Number(hotel.affiliateOffer.price)) && Number(hotel.affiliateOffer.price) > 0) {
      offers = [hotel.affiliateOffer];
    }

    var seen = {};
    return offers.filter(function(offer) {
      var key = String(offer.provider || '').toLowerCase();
      if (!key) key = 'unknown';
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    }).sort(function(a, b) {
      var priceA = Number.isFinite(Number(a.price)) ? Number(a.price) : Number.MAX_SAFE_INTEGER;
      var priceB = Number.isFinite(Number(b.price)) ? Number(b.price) : Number.MAX_SAFE_INTEGER;
      if (priceA !== priceB) return priceA - priceB;
      return String(a.provider || '').localeCompare(String(b.provider || ''));
    }).slice(0, 2);
  }

  function hasBothLiveAffiliatePrices(hotel) {
    var offers = getLiveAffiliateOffers(hotel);
    var hasAlltours = offers.some(function(offer) {
      return String(offer.provider || '').toLowerCase().indexOf('alltours') !== -1;
    });
    var hasLidl = offers.some(function(offer) {
      return String(offer.provider || '').toLowerCase().indexOf('lidl') !== -1;
    });
    return hasAlltours && hasLidl;
  }

  function normalizeThemeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function toFactSet(hotel) {
    return new Set((hotel && hotel.factIds ? hotel.factIds : []).map(Number));
  }

  function includeByTheme(hotel, themeType) {
    var t = normalizeThemeText(themeType);
    var fac = (hotel && hotel.facilities) || {};
    var facts = toFactSet(hotel);
    var concept = normalizeThemeText(fac.concept || '');

    if (t === 'allinclusive' || t === 'all inclusive') {
      return concept.indexOf('all inclusive') !== -1 || concept.indexOf('inklusive') !== -1 || facts.has(86) || facts.has(94);
    }

    if (t === 'honeymoon' || t === 'flitterwochen') {
      var isAdults = facts.has(393) || facts.has(781);
      var luxuryCore = fac.spa || facts.has(197) || facts.has(479) || facts.has(529);
      var romanticSpot = fac.beach || facts.has(89) || facts.has(385) || facts.has(192) || facts.has(195);
      var stars = Number(hotel.stars || 0);
      return (stars >= 4 && luxuryCore && romanticSpot) || (isAdults && (luxuryCore || romanticSpot));
    }

    if (t === 'family' || t === 'kinder' || t === 'urlaub mit kindern') {
      return !!fac.kidsclub || facts.has(945) || facts.has(946) || facts.has(1) || facts.has(7) || facts.has(707) || facts.has(588);
    }

    return true;
  }

  function themeScore(hotel, themeType) {
    var t = normalizeThemeText(themeType);
    var fac = (hotel && hotel.facilities) || {};
    var facts = toFactSet(hotel);
    var stars = Number(hotel.stars || 0);
    var score = Number(hotel._score || 0) * 0.35 + stars * 8;

    if (t === 'allinclusive' || t === 'all inclusive') {
      var concept = normalizeThemeText(fac.concept || '');
      if (concept.indexOf('ultra all inclusive') !== -1) score += 34;
      else if (concept.indexOf('all inclusive') !== -1 || concept.indexOf('inklusive') !== -1) score += 24;
      if (facts.has(86) || facts.has(94)) score += 12;
      if (fac.beach) score += 6;
      if (fac.aquapark) score += 8;
      if (fac.kidsclub) score += 8;
    } else if (t === 'honeymoon' || t === 'flitterwochen') {
      if (facts.has(393) || facts.has(781)) score += 26;
      if (fac.spa || facts.has(197) || facts.has(479) || facts.has(529)) score += 18;
      if (fac.beach || facts.has(89)) score += 10;
      if (facts.has(385) || facts.has(192) || facts.has(195)) score += 8;
      if (fac.kidsclub) score -= 8;
    } else if (t === 'family' || t === 'kinder' || t === 'urlaub mit kindern') {
      if (fac.kidsclub || facts.has(945) || facts.has(946) || facts.has(1) || facts.has(7)) score += 24;
      if (fac.aquapark || facts.has(588)) score += 16;
      if (fac.beach || facts.has(89)) score += 6;
      if (fac.pool) score += 6;
    }

    return score;
  }

  function applyThemeSelection(hotels, themeType) {
    var t = normalizeThemeText(themeType);
    if (!t) return hotels;

    var filtered = hotels.filter(function(h) { return includeByTheme(h, t); });
    if (!filtered.length) return hotels;

    filtered.forEach(function(h) { h._themeScore = themeScore(h, t); });
    filtered.sort(function(a, b) { return (b._themeScore || 0) - (a._themeScore || 0); });
    return filtered;
  }

  function parseOfferDate(value) {
    var raw = String(value || '').trim();
    if (!raw) return null;

    var iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return { y: Number(iso[1]), m: Number(iso[2]), d: Number(iso[3]) };

    var dmy = raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
    if (dmy) {
      var year = Number(dmy[3]);
      if (year < 100) year += 2000;
      return { y: year, m: Number(dmy[2]), d: Number(dmy[1]) };
    }

    var dt = new Date(raw);
    if (!isNaN(dt.getTime())) {
      return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
    }

    return null;
  }

  function formatDateDE(parts) {
    if (!parts) return '';
    var dd = String(parts.d).padStart(2, '0');
    var mm = String(parts.m).padStart(2, '0');
    return dd + '.' + mm + '.' + parts.y;
  }

  function getTravelWindowLabel(validFrom, validTo) {
    var from = parseOfferDate(validFrom);
    var to = parseOfferDate(validTo);
    if (from && to) return formatDateDE(from) + ' - ' + formatDateDE(to);
    if (from) return formatDateDE(from);
    if (to) return formatDateDE(to);
    return 'Reisezeitraum im Partnerangebot waehlbar';
  }

  var _jbUid = 0;
  function scoreSealSVG(score) {
    var u = ++_jbUid;
    return '<svg class="hc-score-seal" width="52" height="52" viewBox="0 0 680 520" xmlns="http://www.w3.org/2000/svg" aria-label="JB Score '+score+'/100">'
      +'<defs>'
      +'<radialGradient id="jbGR'+u+'" cx="50%" cy="40%" r="55%">'
      +'<stop offset="0%" stop-color="#00E0A8"/>'
      +'<stop offset="50%" stop-color="#00C896"/>'
      +'<stop offset="100%" stop-color="#00956E"/>'
      +'</radialGradient>'
      +'<radialGradient id="jbDB'+u+'" cx="50%" cy="35%" r="60%">'
      +'<stop offset="0%" stop-color="#1a1a1a"/>'
      +'<stop offset="100%" stop-color="#0a0a0a"/>'
      +'</radialGradient>'
      +'<radialGradient id="jbCB'+u+'" cx="50%" cy="40%" r="60%">'
      +'<stop offset="0%" stop-color="#FF7A5A"/>'
      +'<stop offset="100%" stop-color="#E85535"/>'
      +'</radialGradient>'
      +'</defs>'
      +'<circle cx="340" cy="265" r="195" fill="url(#jbGR'+u+')"/>'
      +'<circle cx="340" cy="265" r="178" fill="url(#jbDB'+u+')"/>'
      +'<text x="340" y="318" text-anchor="middle" font-size="148" font-weight="700" font-family="Georgia,serif" fill="#00C896">'+score+'</text>'
      +'<path d="M205,365 L475,365 L458,415 L380,438 L340,448 L300,438 L222,415 Z" fill="url(#jbCB'+u+')"/>'
      +'<rect x="205" y="363" width="270" height="46" fill="url(#jbCB'+u+')"/>'
      +'<text x="340" y="393" text-anchor="middle" font-size="19" font-weight="700" font-family="Georgia,serif" fill="#fff" letter-spacing="5">SCORE</text>'
      +'<text x="340" y="430" text-anchor="middle" font-size="16" fill="#fff">&#9733; &#9733; &#9733; &#9733; &#9733;</text>'
      +'<circle cx="340" cy="80" r="36" fill="url(#jbGR'+u+')"/>'
      +'<circle cx="340" cy="80" r="30" fill="url(#jbDB'+u+')"/>'
      +'<text x="340" y="87" text-anchor="middle" font-size="17" font-weight="700" font-family="Georgia,serif" fill="#00C896">JB</text>'
      +'</svg>';
  }

  function toSlug(name) {
    return String(name||'')
      .toLowerCase()
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-+|-+$/g,'');
  }

  // Länderkürzel → Deutscher Ländername (für globale Carousels)
  var CC_NAMES = {
    TR:'Türkei',GR:'Griechenland',ES:'Spanien',IT:'Italien',PT:'Portugal',
    HR:'Kroatien',FR:'Frankreich',EG:'Ägypten',AE:'Dubai',BG:'Bulgarien',
    MA:'Marokko',TN:'Tunesien',JO:'Jordanien',MT:'Malta',CY:'Zypern',CV:'Kap Verde'
  };

  // ── CSS ─────────────────────────────────────────────────────────────────────
  function injectCSS() {
    if(document.getElementById('hc-styles')) return;
    var s = document.createElement('style');
    s.id = 'hc-styles';
    s.textContent = [
      /* Wrapper */
      '.hc-outer{position:relative}',
      /* Track */
      '.hc-track{display:flex;gap:1.1rem;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:0.25rem 0 1rem;cursor:grab}',
      '.hc-track::-webkit-scrollbar{display:none}',
      '.hc-track.dragging{cursor:grabbing;scroll-behavior:auto}',
      /* Cards – Desktop: 4 + 5th peek */
      '.hc-card{flex:0 0 calc((100% - 4.4rem)/4.18);scroll-snap-align:start;background:linear-gradient(180deg,rgba(18,29,26,.96),rgba(11,18,16,.98));border:1px solid rgba(255,255,255,.07);border-radius:22px;overflow:hidden;transition:border-color .22s,transform .22s,box-shadow .22s;position:relative;display:flex;flex-direction:column;box-shadow:0 16px 38px rgba(0,0,0,.18)}',
      '.hc-card:hover{border-color:rgba(45,212,170,.28);transform:translateY(-4px);box-shadow:0 22px 42px rgba(0,0,0,.28)}',
      /* Image area */
      '.hc-img-wrap{position:relative;width:100%;aspect-ratio:16/10;overflow:hidden;background:linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.42)),#0d0d0d;flex-shrink:0}',
      '.hc-img-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .5s}',
      '.hc-img-wrap img.hc-img-hidden{opacity:0;pointer-events:none}',
      '.hc-img-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:4px;z-index:2}',
      '.hc-img-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.35);transition:background .25s,transform .25s}',
      '.hc-img-dot.active{background:#2dd4aa;transform:scale(1.3)}',
      /* Score seal (SVG) */
      '.hc-score-seal{position:absolute;top:12px;right:12px;z-index:3;filter:drop-shadow(0 2px 10px rgba(0,0,0,.7)) drop-shadow(0 0 8px rgba(45,212,170,.35));transition:filter .25s}',
      '.hc-card:hover .hc-score-seal{filter:drop-shadow(0 2px 10px rgba(0,0,0,.7)) drop-shadow(0 0 16px rgba(45,212,170,.65))}',
      '.hc-img-wrap{position:relative}',  /* ensure position:relative on container */
      /* Body */
      '.hc-body{padding:.88rem .95rem .95rem;display:flex;flex-direction:column;gap:.3rem;flex:1}',
      '.hc-name{font-size:.92rem;font-weight:800;color:#f3f6f4;line-height:1.18;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.35em;letter-spacing:-.02em}',
      '.hc-loc{font-size:.72rem;color:#9aa8a1;line-height:1.2;margin-top:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;min-height:2.2em}',
      '.hc-stars{color:#f59e0b;font-size:.7rem;letter-spacing:1.2px;margin-top:0}',
      '.hc-price-stack{display:flex;flex-direction:column;gap:.34rem;margin-top:.18rem}',
      '.hc-price{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.66rem .72rem;border:1px solid rgba(45,212,170,.22);border-radius:14px;background:linear-gradient(180deg,rgba(45,212,170,.12),rgba(45,212,170,.04));box-shadow:inset 0 1px 0 rgba(255,255,255,.04);text-decoration:none;transition:border-color .2s ease,transform .2s ease,background .2s ease;min-height:42px}',
      '.hc-price:hover{border-color:rgba(45,212,170,.42);transform:translateY(-1px);background:linear-gradient(180deg,rgba(45,212,170,.16),rgba(45,212,170,.06))}',
      '.hc-price--fallback{border-color:rgba(255,255,255,.09);background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02))}',
      '.hc-price-info{display:flex;flex-direction:column;align-items:flex-start;gap:.12rem;min-width:0;flex:1}',
      '.hc-price-copy{display:flex;align-items:baseline;gap:.28rem;min-width:0}',
      '.hc-price strong{display:block;font-size:1.08rem;line-height:1.05;color:#f3f6f4;font-weight:900;white-space:nowrap}',
      '.hc-price-prefix{font-size:.78rem;font-weight:800;opacity:.92;color:#f3f6f4;white-space:nowrap}',
      '.hc-price-date{display:block;font-size:.64rem;line-height:1.25;color:#9aa8a1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
      '.hc-price-provider{display:inline-flex;align-items:center;justify-content:center;width:58px;height:16px;flex:0 0 auto}',
      '.hc-price-provider img{display:block;width:100%;height:100%;object-fit:contain}',
      '.hc-badges{display:flex;flex-wrap:nowrap;gap:.18rem;margin-top:auto;padding-top:.32rem;min-height:28px;align-items:center;overflow:hidden}',
      '.hc-badge{background:rgba(45,212,170,.08);border:1px solid rgba(45,212,170,.16);border-radius:999px;padding:.1rem .34rem;font-size:.53rem;color:#2dd4aa;white-space:nowrap;line-height:1.1;max-width:none;overflow:hidden;text-overflow:clip;flex:0 0 auto;letter-spacing:-.01em}',
      /* Arrows */
      '.hc-arrow{position:absolute;top:calc(50% - 1.5rem);z-index:10;width:2.5rem;height:2.5rem;border-radius:50%;background:rgba(10,18,16,.9);border:1px solid rgba(255,255,255,.08);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;transition:background .2s,border-color .2s;user-select:none}',
      '.hc-arrow:hover{background:rgba(45,212,170,.18);border-color:rgba(45,212,170,.45)}',
      '.hc-arrow.left{left:-1rem}',
      '.hc-arrow.right{right:-1rem}',
      '.hc-arrow[disabled]{opacity:.25;pointer-events:none}',
      /* Compare Checkbox */
      '.hc-cmp-chk{position:absolute;bottom:7px;left:8px;z-index:4;display:flex;align-items:center;gap:.3rem;background:rgba(8,16,14,.66);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:.2rem .5rem .2rem .35rem;cursor:pointer;user-select:none;transition:background .2s,border-color .2s}',
      '.hc-cmp-chk:hover{background:rgba(8,16,14,.86);border-color:rgba(45,212,170,.55)}',
      '.hc-cmp-input{appearance:none;-webkit-appearance:none;width:13px;height:13px;border:1.5px solid rgba(255,255,255,.42);border-radius:3px;background:transparent;cursor:pointer;flex-shrink:0;transition:border-color .2s,background .2s;margin:0;position:relative}',
      '.hc-cmp-input:checked{background:#2dd4aa;border-color:#2dd4aa}',
      '.hc-cmp-lbl{font-size:.63rem;font-weight:700;color:rgba(255,255,255,.8);white-space:nowrap;pointer-events:none}',
      '.hc-card--in-cmp{border-color:#2dd4aa!important;box-shadow:0 0 0 2px rgba(45,212,170,.22)!important}',
      /* Sticky Compare Bar */
      '#jb-cbar{position:fixed;bottom:0;left:0;right:0;z-index:9998;background:rgba(8,16,14,.9);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid rgba(45,212,170,.24);transform:translateY(100%);transition:transform .32s cubic-bezier(.22,.68,0,1.2);box-shadow:0 -4px 40px rgba(0,0,0,.7)}',
      '#jb-cbar.jb-cbar-open{transform:translateY(0)}',
      '.jb-cbar-inner{max-width:1260px;margin:0 auto;padding:.6rem clamp(1rem,4vw,2.5rem);display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}',
      '.jb-cbar-left{display:flex;align-items:center;gap:.65rem;flex:1;min-width:0;flex-wrap:wrap}',
      '.jb-cbar-title{font-size:.76rem;font-weight:700;color:#2dd4aa;white-space:nowrap;letter-spacing:.02em}',
      '.jb-cbar-hotels{display:flex;gap:.45rem;flex-wrap:wrap;align-items:center}',
      '.jb-cbar-item{display:flex;align-items:center;gap:.35rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:10px;padding:.24rem .48rem .24rem .38rem;font-size:.72rem;color:#f3f6f4}',
      '.jb-cbar-item img{width:22px;height:22px;border-radius:3px;object-fit:cover;flex-shrink:0}',
      '.jb-cbar-item-name{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.jb-cbar-item-rm{background:none;border:none;color:rgba(255,255,255,.38);cursor:pointer;font-size:.78rem;line-height:1;padding:0 2px;margin-left:.15rem;transition:color .2s}',
      '.jb-cbar-item-rm:hover{color:#e53e3e}',
      '.jb-cbar-actions{display:flex;gap:.45rem;align-items:center;flex-shrink:0}',
      '.jb-cbar-cmp{background:linear-gradient(135deg,#2dd4aa,#7cf0cf);color:#04110d;border:none;border-radius:10px;padding:.48rem 1.15rem;font-size:.8rem;font-weight:800;cursor:pointer;transition:background .2s,opacity .2s;white-space:nowrap}',
      '.jb-cbar-cmp:hover{background:linear-gradient(135deg,#38e2b8,#8ef5dc)}',
      '.jb-cbar-cmp:disabled{opacity:.4;cursor:default;pointer-events:none}',
      '.jb-cbar-clr{background:transparent;border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.45);border-radius:8px;padding:.48rem .65rem;font-size:.76rem;cursor:pointer;transition:all .2s;white-space:nowrap}',
      '.jb-cbar-clr:hover{border-color:rgba(255,255,255,.32);color:rgba(255,255,255,.75)}',
      '@media(max-width:600px){.jb-cbar-item-name{max-width:75px}.jb-cbar-cmp{padding:.42rem .8rem;font-size:.75rem}}',
      /* Skeleton */
      '.hc-skel{flex:0 0 calc((100% - 4.4rem)/4.18);aspect-ratio:3/4;background:rgba(255,255,255,.04);border-radius:22px;animation:hc-pulse 1.4s ease-in-out infinite}',
      '.hc-skel:nth-child(2){animation-delay:.15s}.hc-skel:nth-child(3){animation-delay:.3s}.hc-skel:nth-child(4){animation-delay:.45s}',
      '@keyframes hc-pulse{0%,100%{opacity:.3}50%{opacity:.65}}',
      '@keyframes jb-ring-fill{to{stroke-dashoffset:var(--jb-offset,0)}}',
      '.jb-ring-anim{animation:jb-ring-fill 1.3s cubic-bezier(.22,.68,0,1.2) forwards}',
      /* Buttons */
      '.hc-btn-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.28rem;margin-top:auto;padding-top:.42rem}',
      '.hc-btn{padding:.35rem .38rem;border-radius:10px;font-size:.66rem;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;line-height:1.1;letter-spacing:.01em;transition:background .18s,border-color .18s,color .18s,transform .16s,box-shadow .2s;display:flex;align-items:center;justify-content:center;white-space:normal;text-wrap:balance;min-width:0;min-height:31px}',
      '.hc-btn--details{grid-column:1 / -1}',
      '.hc-btn-row--no-book .hc-btn-request{grid-column:1 / -1}',
      '.hc-btn:active{transform:translateY(1px)}',
      '.hc-btn-details{background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01));border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.92)}',
      '.hc-btn-details:hover{border-color:rgba(255,255,255,.42);background:rgba(255,255,255,.07)}',
      '.hc-btn-book{background:linear-gradient(135deg,#e8fff8,#baf7e6);border:1px solid #dffcf1;color:#07110f;font-weight:800;box-shadow:0 1px 0 rgba(255,255,255,.25) inset}',
      '.hc-btn-book:hover{background:linear-gradient(135deg,#f3fffb,#d9fff2);border-color:#f3fffb}',
      '.hc-btn-request{background:linear-gradient(135deg,#2dd4aa,#7cf0cf);border:1px solid rgba(45,212,170,.2);color:#04110d;font-weight:800;box-shadow:0 1px 0 rgba(255,255,255,.25) inset}',
      '.hc-btn-request:hover{background:linear-gradient(135deg,#38e2b8,#8ef5dc);border-color:#38e2b8}',
      /* Responsive */
      '@media(max-width:1024px){.hc-card,.hc-skel{flex-basis:calc((100% - 2.2rem)/2.8)}.hc-arrow{display:none}}',
      '@media(max-width:600px){.hc-card,.hc-skel{flex-basis:calc((100% - .55rem)/1.5)}.hc-arrow{display:none}.hc-body{padding:.68rem .78rem .74rem}.hc-name{font-size:.84rem}.hc-loc{font-size:.7rem}.hc-badge{font-size:.5rem}.hc-price strong{font-size:1.02rem}.hc-price-provider{width:52px;height:14px}}',
      '.jb-views{font-size:.67rem;color:#9aa8a1;margin-top:.1rem;min-height:.82rem;line-height:1.3}'
    ].join('');
    document.head.appendChild(s);
  }

  // ── Render Skeletons ─────────────────────────────────────────────────────────
  function renderSkeleton(container, n) {
    var h='<div class="hc-outer"><div class="hc-track">';
    for(var i=0;i<n;i++) h+='<div class="hc-skel"></div>';
    h+='</div></div>';
    container.innerHTML=h;
  }

  // ── Render Hotels ────────────────────────────────────────────────────────────
  function renderHotels(container, hotels) {
    var html='<div class="hc-outer">'
      +'<button class="hc-arrow left" aria-label="Zurück" disabled>‹</button>'
      +'<div class="hc-track">';

    hotels.forEach(function(h) {
      var score = h._score != null ? h._score : calcScore(h);
      var feats = topFeatures(h, 3);
      var FEAT_ICONS = getFeatIcons();
      var badges = feats.map(function(f){
        return '<span class="hc-badge">'+(FEAT_ICONS[f.l]||'')+' '+esc(badgeLabel(f.l))+'</span>';
      }).join('');

      var imgs = (h.images && h.images.length) ? h.images.slice(0,5) : (h.image ? [h.image] : []);
      var imgHtml='';
      imgs.forEach(function(src,i){
        imgHtml+='<img src="'+esc(src)+'" alt="'+esc(h.name)+'" loading="lazy" class="'+(i===0?'':'hc-img-hidden')+'" />';
      });
      var dots='';
      if(imgs.length>1){
        dots='<div class="hc-img-dots">';
        imgs.forEach(function(_,i){ dots+='<div class="hc-img-dot'+(i===0?' active':'')+'" data-img="'+i+'"></div>'; });
        dots+='</div>';
      }
      var firstImg = imgs.length ? imgs[0] : '';
      var inCmp = window.JB_COMPARE && window.JB_COMPARE.has(h.giataId);
      var offers = getLiveAffiliateOffers(h);
      var priceHtml = '';
      if (offers.length) {
        var offerCards = offers.map(function(offer) {
          var nightlyAmount = displayPriceValue(offer);
          var dateLabel = getTravelWindowLabel(offer.validFrom, offer.validTo);
          return '<a href="' + esc(offer.deeplink) + '" class="hc-price" target="_blank" rel="nofollow sponsored noopener">'
            + '<span class="hc-price-info"><span class="hc-price-copy"><span class="hc-price-prefix">ab p.P.</span><strong>' + (nightlyAmount != null ? formatPriceDE(nightlyAmount) + ' €' : 'Preis') + '</strong></span><span class="hc-price-date">' + esc(dateLabel) + '</span></span>'
            + providerLogoHtml(offer.provider || 'Anbieter')
            + '</a>';
        }).join('');
        priceHtml = '<div class="hc-price-stack">' + offerCards + '</div>';
      } else {
        priceHtml = '<div class="hc-price-stack"><div class="hc-price hc-price--fallback"><span class="hc-price-copy"><strong>Auf Anfrage</strong></span></div></div>';
      }

      var btnRowClass = 'hc-btn-row hc-btn-row--no-book';

      html+='<div class="hc-card'+(inCmp?' hc-card--in-cmp':'')+'" data-hotel-id="'+esc(h.giataId)+'">'
        +'<div class="hc-img-wrap">'
        +imgHtml
        +(score>=50?scoreSealSVG(score):'')
        +dots
        +'<label class="hc-cmp-chk" title="Zum Vergleich hinzufügen">'
        +'<input type="checkbox" class="hc-cmp-input"'+(inCmp?' checked':'')+' data-cmp-id="'+esc(h.giataId)+'" data-cmp-name="'+esc(h.name)+'" data-cmp-img="'+esc(firstImg)+'">'
        +'<span class="hc-cmp-lbl">Vergleichen</span>'
        +'</label>'
        +'</div>'
        +'<div class="hc-body">'
        +'<div class="hc-stars">'+starsHtml(h.stars||0)+'</div>'
        +'<div class="hc-name">'+esc(h.name)+'</div>'
        +'<div class="hc-loc">📍 '+esc(h.city||'')+((h.country||CC_NAMES[h.cc])?' · '+esc(h.country||CC_NAMES[h.cc]||''):'')+'</div>'
        +'<div class="jb-views">👁 …</div>'
        +priceHtml
        +(badges?'<div class="hc-badges">'+badges+'</div>':'')
        +'<div class="'+btnRowClass+'">'
        +'<a href="/hotel.html?id='+esc(h.giataId)+'&slug='+toSlug(h.name)+'" class="hc-btn hc-btn-details hc-btn--details">Mehr Details</a>'
        +'</div>'
        +'</div>'
        +'</div>';
    });

    html+='</div>'
      +'<button class="hc-arrow right" aria-label="Weiter">›</button>'
      +'</div>';

    container.innerHTML=html;

    var outer  = container.querySelector('.hc-outer');
    var track  = container.querySelector('.hc-track');
    var btnL   = container.querySelector('.hc-arrow.left');
    var btnR   = container.querySelector('.hc-arrow.right');

    // Arrow navigation
    function scrollByCards(dir) {
      var cardW = (track.querySelector('.hc-card')||{}).offsetWidth || 280;
      track.scrollBy({ left: dir*(cardW+18), behavior:'smooth' });
    }
    if(btnL) btnL.addEventListener('click', function(){ scrollByCards(-1); });
    if(btnR) btnR.addEventListener('click', function(){ scrollByCards(1); });

    function syncArrows() {
      if(!btnL||!btnR) return;
      btnL.disabled = track.scrollLeft < 8;
      btnR.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 8;
    }
    track.addEventListener('scroll', syncArrows, {passive:true});
    syncArrows();

    // Drag-to-scroll (Desktop)
    var drag = {active:false, startX:0, scrollX:0};
    track.addEventListener('mousedown', function(e){
      drag.active=true; drag.startX=e.pageX; drag.scrollX=track.scrollLeft;
      track.classList.add('dragging');
    });
    document.addEventListener('mousemove', function(e){
      if(!drag.active) return;
      track.scrollLeft = drag.scrollX-(e.pageX-drag.startX);
    });
    document.addEventListener('mouseup', function(){
      drag.active=false; track.classList.remove('dragging');
    });

    // Image gallery cycling (hover/touch)
    container.querySelectorAll('.hc-card').forEach(function(card){
      var imgEls = card.querySelectorAll('.hc-img-wrap img');
      var dots   = card.querySelectorAll('.hc-img-dot');
      if(imgEls.length<2) return;
      var cur=0, timer=null;

      function showImg(i){
        imgEls[cur].classList.add('hc-img-hidden');
        dots[cur] && dots[cur].classList.remove('active');
        cur=i;
        imgEls[cur].classList.remove('hc-img-hidden');
        dots[cur] && dots[cur].classList.add('active');
      }

      function startCycle(){
        if(timer) return;
        timer=setInterval(function(){ showImg((cur+1)%imgEls.length); },2000);
      }
      function stopCycle(){
        clearInterval(timer); timer=null;
      }

      card.addEventListener('mouseenter', startCycle);
      card.addEventListener('mouseleave', function(){ stopCycle(); showImg(0); });

      // Dot clicks
      dots.forEach(function(dot,i){
        dot.addEventListener('click', function(e){
          e.stopPropagation(); stopCycle(); showImg(i);
        });
      });
    });
  }

  // ── Compare Bar ─────────────────────────────────────────────────────────────
  function injectStickyBar() {
    if (document.getElementById('jb-cbar')) return;
    var bar = document.createElement('div');
    bar.id = 'jb-cbar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Hotelvergleich');
    bar.innerHTML =
      '<div class="jb-cbar-inner">'
      + '<div class="jb-cbar-left">'
      + '<span class="jb-cbar-title">⇄ Vergleichsliste</span>'
      + '<div class="jb-cbar-hotels" id="jb-cbar-hotels"></div>'
      + '</div>'
      + '<div class="jb-cbar-actions">'
      + '<button class="jb-cbar-cmp" id="jb-cbar-cmp" disabled>Jetzt Vergleichen</button>'
      + '<button class="jb-cbar-clr" id="jb-cbar-clr">✕ Leeren</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(bar);

    document.getElementById('jb-cbar-cmp').addEventListener('click', function () {
      var ids = window.JB_COMPARE.items.map(function (x) { return encodeURIComponent(x.id); }).join(',');
      window.location.href = '/vergleich.html?hotels=' + ids;
    });
    document.getElementById('jb-cbar-clr').addEventListener('click', function () {
      window.JB_COMPARE.clear();
      updateStickyBar();
    });
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.jb-cbar-item-rm') : null;
      if (!btn) return;
      var id = btn.getAttribute('data-rm');
      if (id) { window.JB_COMPARE.remove(id); updateStickyBar(); }
    });
    window.JB_COMPARE.onChange(updateStickyBar);
  }

  function updateStickyBar() {
    var bar = document.getElementById('jb-cbar');
    if (!bar) return;
    var items = window.JB_COMPARE.items;
    bar.classList.toggle('jb-cbar-open', items.length > 0);
    var hotelsEl = document.getElementById('jb-cbar-hotels');
    var cmpBtn   = document.getElementById('jb-cbar-cmp');
    if (hotelsEl) {
      hotelsEl.innerHTML = items.map(function (h) {
        return '<div class="jb-cbar-item">'
          + (h.img ? '<img src="' + esc(h.img) + '" alt="" onerror="this.style.display=\'none\'">' : '')
          + '<span class="jb-cbar-item-name">' + esc(h.name) + '</span>'
          + '<button class="jb-cbar-item-rm" data-rm="' + esc(h.id) + '" aria-label="Entfernen">×</button>'
          + '</div>';
      }).join('');
    }
    if (cmpBtn) cmpBtn.disabled = items.length < 2;
    // Sync card checkboxes
    document.querySelectorAll('.hc-card[data-hotel-id]').forEach(function (card) {
      var id  = card.getAttribute('data-hotel-id');
      var chk = card.querySelector('.hc-cmp-input');
      if (chk && id) {
        var inList = window.JB_COMPARE.has(id);
        chk.checked = inList;
        card.classList.toggle('hc-card--in-cmp', inList);
      }
    });
  }
  // ── View Counter ────────────────────────────────────────────────────────────────────────
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
    var containers = document.querySelectorAll('[data-hotel-carousel]');
    if(!containers.length) return;
    injectCSS();
    injectStickyBar();

    containers.forEach(function(container){
      var val  = (container.getAttribute('data-hotel-carousel')||'').trim();
      var city  = (container.getAttribute('data-carousel-city') ||'').trim();
      var cities = (container.getAttribute('data-carousel-cities')||'').trim();
      var type = (container.getAttribute('data-hotel-carousel-type')||'').trim();
      var priceOnly = true;
      if(!val) return;

      var isGlobal = (val === '*');
      var isCountryCode = /^[A-Z]{2}$/.test(val);
      renderSkeleton(container, 8);

      if(isCountryCode || isGlobal) {
        // Fetch top hotels — mit Ländercode (Länder-Carousel) oder global (*)
        var fetchLimit = priceOnly ? 24 : 8;
        var url = '/api/giata?action=top&limit=' + fetchLimit;
        if(isCountryCode) url+='&country='+encodeURIComponent(val);
        if(cities) url+='&cities='+encodeURIComponent(cities);
        else if(city) url+='&city='+encodeURIComponent(city);
        if(type) url+='&category='+encodeURIComponent(type);

        fetch(url)
          .then(function(r){ return r.ok?r.json():null; })
          .then(function(data){
            if(!data||!data.hotels||!data.hotels.length){
              container.innerHTML='<p style="color:#9aa8a1;padding:2rem 0;text-align:center">Keine GIATA® Daten verfügbar.</p>';
              return;
            }
            // Fetch full hotel details (images, factIds) in parallel
            return Promise.all(data.hotels.map(function(h){
              return fetch('/api/giata?action=property&id='+encodeURIComponent(h.giataId))
                .then(function(r){ return r.ok?r.json():null; })
                .catch(function(){ return null; });
            })).then(function(details){
              var hotels = details.map(function(d,i){
                if(!d||d.error) return null;
                d._score = calcScore(d); // Immer aus Property-Daten neu berechnen (wie hotel.html)
                // cc aus Top-API übernehmen falls im Property-Objekt nicht vorhanden
                if(!d.cc && data.hotels[i].cc) d.cc = data.hotels[i].cc;
                return d;
              }).filter(Boolean);

              hotels = applyThemeSelection(hotels, type);

              if (priceOnly) {
                hotels = hotels.filter(hasBothLiveAffiliatePrices).slice(0, 8);
                if (!hotels.length) {
                  container.innerHTML='<p style="color:#9aa8a1;padding:2rem 0;text-align:center">Derzeit keine Hotels mit Alltours- und Lidl-Reisen-Preisen verfuegbar. Wir aktualisieren diese Auswahl laufend.</p>';
                  return;
                }
              }

              if(hotels.length) { renderHotels(container,hotels); updateStickyBar(); jbLoadViews(container); }
              else container.innerHTML='<p style="color:#9aa8a1;padding:2rem 0;text-align:center">Keine Hotel-Daten verfügbar.</p>';
            });
          })
          .catch(function(){
            container.innerHTML='<p style="color:#9aa8a1;padding:2rem 0;text-align:center">Fehler beim Laden der Hotels.</p>';
          });
      } else {
        // Fallback: comma-separated IDs (legacy format)
        var ids = val.split(',').map(function(s){return s.trim();}).filter(Boolean);
        Promise.all(ids.map(function(id){
          return fetch('/api/giata?action=property&id='+encodeURIComponent(id))
            .then(function(r){ return r.ok?r.json():null; })
            .catch(function(){ return null; });
        })).then(function(results){
          var valid = results.filter(function(h){ return h&&h.giataId&&!h.error; });
          valid.forEach(function(h){ h._score=calcScore(h); });
          valid = applyThemeSelection(valid, type);
          valid.sort(function(a,b){ return b._score-a._score; });
          if (priceOnly) {
            valid = valid.filter(hasBothLiveAffiliatePrices).slice(0, 8);
            if (!valid.length) {
              container.innerHTML='<p style="color:#9aa8a1;padding:2rem 0;text-align:center">Derzeit keine Hotels mit Alltours- und Lidl-Reisen-Preisen verfuegbar. Wir aktualisieren diese Auswahl laufend.</p>';
              return;
            }
          }
          if(valid.length) { renderHotels(container,valid); updateStickyBar(); jbLoadViews(container); }
          else container.innerHTML='<p style="color:#9aa8a1;padding:2rem 0;text-align:center">Keine Hotel-Daten verfügbar.</p>';
        });
      }
    });
  }

  withJBScore(function() {
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',init);
    } else {
      init();
    }
  });

  // Anfrage-Modal öffnen wenn "Sofort Anfragen" geklickt wird
  document.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.hc-btn-request') : null;
    if (!btn) return;
    e.preventDefault();
    var name = btn.getAttribute('data-hotel-name') || '';
    if (window.openAnfrageModal) {
      window.openAnfrageModal(name);
    } else if (window.$crisp) {
      try { if (name) window.$crisp.push(['set', 'session:data', [[['Hotel', name]]]]); } catch(_) {}
      try { window.$crisp.push(['do', 'chat:open']); } catch(_) {}
    }
  });

  // Compare Checkbox: Vergleichen-Häkchen auf Karten
  document.addEventListener('change', function (e) {
    var chk = e.target;
    if (!chk || !chk.classList || !chk.classList.contains('hc-cmp-input')) return;
    var id   = chk.getAttribute('data-cmp-id');
    var name = chk.getAttribute('data-cmp-name');
    var img  = chk.getAttribute('data-cmp-img');
    if (chk.checked) {
      var ok = window.JB_COMPARE.add(id, name, img);
      if (!ok) {
        chk.checked = false;
        // Zeige kurzen Hinweis statt alert
        var card = chk.closest('.hc-card');
        if (card) {
          var hint = document.createElement('div');
          hint.style.cssText = 'position:absolute;bottom:36px;left:8px;background:rgba(0,0,0,.85);color:#fff;font-size:.68rem;font-weight:600;padding:.25rem .55rem;border-radius:5px;z-index:5;white-space:nowrap;pointer-events:none';
          hint.textContent = 'Max. 3 Hotels';
          card.querySelector('.hc-img-wrap').appendChild(hint);
          setTimeout(function(){ if(hint.parentNode) hint.parentNode.removeChild(hint); }, 2000);
        }
        return;
      }
    } else {
      window.JB_COMPARE.remove(id);
    }
    updateStickyBar();
  });
})();
