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

  // ── Scoring (identisch mit hotel-ranking.js) ────────────────────────────────
  var SCORING = {
    89:{s:20,cat:'L',l:'Strandlage'},301:{s:12,cat:'L',l:'Meeresnähe'},374:{s:7,cat:'L',l:'Strandblick'},
    90:{s:8,cat:'L',l:'Zentrale Lage'},91:{s:5,cat:'L',l:'Ruhige Lage'},291:{s:5,cat:'L',l:'Stadtzentrum'},
    295:{s:6,cat:'L',l:'Seelage'},562:{s:5,cat:'L',l:'Jachthafen'},350:{s:5,cat:'L',l:'Altstadt'},
    294:{s:4,cat:'L',l:'Golfplatznähe'},691:{s:4,cat:'L',l:'Kurort'},354:{s:4,cat:'L',l:'Buchtblick'},
    364:{s:4,cat:'L',l:'Seeblick'},349:{s:3,cat:'L',l:'Autofreie Lage'},293:{s:3,cat:'L',l:'Waldlage'},
    300:{s:3,cat:'L',l:'Flusslage'},365:{s:3,cat:'L',l:'Bergblick'},348:{s:2,cat:'L',l:'Belebte Lage'},
    22:{s:1,cat:'L',l:'Parkplatz'},568:{s:1,cat:'L',l:'Einparkservice'},
    614:{s:18,cat:'P',l:'Privater Pool'},588:{s:18,cat:'P',l:'Wasserpark'},697:{s:14,cat:'P',l:'Infinity-Pool'},
    696:{s:14,cat:'P',l:'Rooftop-Pool'},86:{s:12,cat:'P',l:'Wasserrutsche'},197:{s:12,cat:'P',l:'Spa'},
    479:{s:10,cat:'P',l:'Wellness-Center'},822:{s:10,cat:'P',l:'Thermalbecken'},
    529:{s:6,cat:'P',l:'Priv. Wellnessber.'},192:{s:8,cat:'P',l:'Hamam'},195:{s:8,cat:'P',l:'Massage'},
    199:{s:6,cat:'P',l:'Thalasso'},869:{s:6,cat:'P',l:'Tauchbecken'},196:{s:6,cat:'P',l:'Sauna'},
    660:{s:6,cat:'P',l:'Sauna'},43:{s:6,cat:'P',l:'Hallenbad'},698:{s:6,cat:'P',l:'Swim-up Bar'},
    189:{s:5,cat:'P',l:'Ayurveda'},794:{s:5,cat:'P',l:'Wasserspielber.'},201:{s:5,cat:'P',l:'Whirlpool'},
    58:{s:5,cat:'P',l:'Pool'},50:{s:5,cat:'P',l:'Außenpool'},190:{s:4,cat:'P',l:'Beautyfarm'},
    793:{s:4,cat:'P',l:'Bali Bett'},59:{s:4,cat:'P',l:'Poolbar'},198:{s:4,cat:'P',l:'Dampfbad'},
    336:{s:4,cat:'P',l:'Strandbar'},191:{s:3,cat:'P',l:'Schönheitssalon'},187:{s:3,cat:'P',l:'Akupunktur'},
    909:{s:3,cat:'P',l:'Ruheraum'},664:{s:3,cat:'P',l:'Personal Trainer'},74:{s:3,cat:'P',l:'Solarium'},
    76:{s:3,cat:'P',l:'Sonnenterrasse'},66:{s:3,cat:'P',l:'Zimmerservice'},567:{s:3,cat:'P',l:'Concierge'},
    820:{s:2,cat:'P',l:'Gesichtsbehandlung'},71:{s:2,cat:'P',l:'Shuttleservice'},81:{s:2,cat:'P',l:'Transferservice'},
    88:{s:1,cat:'P',l:'WLAN'},185:{s:1,cat:'P',l:'WLAN'},
    94:{s:20,cat:'F',l:'All Inclusive Plus'},92:{s:16,cat:'F',l:'All Inclusive'},
    101:{s:12,cat:'F',l:'Vollpension'},103:{s:8,cat:'F',l:'Halbpension'},
    65:{s:5,cat:'F',l:'Restaurant'},299:{s:5,cat:'F',l:'Restaurant'},14:{s:3,cat:'F',l:'Bar'},
    288:{s:3,cat:'F',l:'Bar/Pub'},450:{s:3,cat:'F',l:'Lobbybar'},575:{s:3,cat:'F',l:'Bar/Lounge'},
    20:{s:2,cat:'F',l:'Café'},73:{s:2,cat:'F',l:'Snackbar'},439:{s:1,cat:'F',l:'Strandkorb'},
    945:{s:12,cat:'A',l:'Kids Club'},219:{s:10,cat:'A',l:'Golf'},236:{s:10,cat:'A',l:'Tauchen'},
    946:{s:8,cat:'A',l:'Teens Club'},1:{s:8,cat:'A',l:'Kinderbetreuung'},7:{s:8,cat:'A',l:'Miniclub'},
    393:{s:7,cat:'A',l:'Flitterwochen'},593:{s:7,cat:'A',l:'Tennisplatz'},707:{s:6,cat:'A',l:'Kinder kostenlos'},
    220:{s:6,cat:'A',l:'Fitness-Studio'},4:{s:5,cat:'A',l:'Kinderprogramm'},26:{s:5,cat:'A',l:'Kinderpool'},
    240:{s:5,cat:'A',l:'Schnorcheln'},249:{s:5,cat:'A',l:'Windsurfen'},247:{s:5,cat:'A',l:'Wasserski'},
    2:{s:5,cat:'A',l:'Animation'},389:{s:4,cat:'A',l:'Familienfreundlich'},781:{s:4,cat:'A',l:'Für Paare'},
    385:{s:4,cat:'A',l:'Adults Only'},245:{s:4,cat:'A',l:'Tennis'},250:{s:3,cat:'A',l:'Yoga'},
    209:{s:3,cat:'A',l:'Beach-Volleyball'},401:{s:3,cat:'A',l:'Konferenzen'},3:{s:3,cat:'A',l:'Abendshows'},
    31:{s:3,cat:'A',l:'Disco'},56:{s:2,cat:'A',l:'Spielplatz'},57:{s:2,cat:'A',l:'Spielzimmer'},
    244:{s:2,cat:'A',l:'Tischtennis'},211:{s:2,cat:'A',l:'Billard'},49:{s:2,cat:'A',l:'Nachtclub'},
    24:{s:2,cat:'A',l:'Casino'},5:{s:1,cat:'A',l:'Live-Musik'},6:{s:1,cat:'A',l:'Mini-Disco'}
  };

  var FEAT_ICONS = {
    'Strandlage':'🏖️','Strandbar':'🍹','Strandkorb':'⛱️','Meeresnähe':'🌊','Strandblick':'🌅',
    'Infinity-Pool':'♾️','Rooftop-Pool':'🏙️','Swim-up Bar':'🍹','Wasserrutsche':'🌊',
    'Wasserpark':'🌊','Hallenbad':'🏊','Außenpool':'🏊','Pool':'🏊','Poolbar':'🍹',
    'Privater Pool':'🏊','Thermalbecken':'♨️','Thalasso':'💧','Tauchbecken':'🔵',
    'Spa':'💆','Wellness-Center':'💆','Massage':'💆','Sauna':'🌡️','Hamam':'🧖',
    'Dampfbad':'♨️','Whirlpool':'🛁','Priv. Wellnessber.':'🔒','Ayurveda':'🌿',
    'Wasserspielber.':'💦','Beautyfarm':'💅','Bali Bett':'🛏️','Schönheitssalon':'💇',
    'Akupunktur':'🪡','Ruheraum':'😌','Personal Trainer':'💪','Solarium':'☀️',
    'Sonnenterrasse':'🌞','Gesichtsbehandlung':'✨',
    'All Inclusive Plus':'⭐','All Inclusive':'🍽️','Vollpension':'🍽️','Halbpension':'🍳',
    'Restaurant':'🍽️','Bar':'🍷','Bar/Pub':'🍺','Lobbybar':'🥂','Bar/Lounge':'🍷',
    'Café':'☕','Snackbar':'🥪',
    'Kids Club':'👨‍👩‍👧','Teens Club':'🎮','Kinderbetreuung':'👶','Miniclub':'🎪',
    'Kinder kostenlos':'🎁','Kinderprogramm':'🎨','Kinderpool':'🏊','Spielplatz':'🛝','Spielzimmer':'🧸',
    'Golf':'⛳','Tauchen':'🤿','Tennisplatz':'🎾','Fitness-Studio':'💪',
    'Beach-Volleyball':'🏐','Schnorcheln':'🤿','Wasserski':'🎿','Windsurfen':'🏄',
    'Tennis':'🎾','Tischtennis':'🏓','Yoga':'🧘','Billard':'🎱',
    'Animation':'🎭','Abendshows':'🎭','Disco':'💃','Nachtclub':'🌙','Casino':'🎰',
    'Live-Musik':'🎵','Mini-Disco':'🎶','Flitterwochen':'💍','Adults Only':'🔞',
    'Familienfreundlich':'👨‍👩‍👧','Für Paare':'❤️','Zentrale Lage':'📍','Ruhige Lage':'🌿',
    'Stadtzentrum':'🏙️','Seelage':'🏞️','Jachthafen':'⛵','Altstadt':'🏛️',
    'Golfplatznähe':'⛳','Kurort':'💧','Buchtblick':'🌊','Seeblick':'🏞️',
    'Waldlage':'🌲','Bergblick':'⛰️','Zimmerservice':'🛎️','Concierge':'🤵',
    'WLAN':'📶','Parkplatz':'🅿️','Shuttleservice':'🚌','Transferservice':'🚐',
    'Konferenzen':'🏛️'
  };

  var SCORING_SORTED = Object.keys(SCORING).map(function(id) {
    return { id: Number(id), s: SCORING[id].s, l: SCORING[id].l, cat: SCORING[id].cat };
  }).sort(function(a,b){ return b.s - a.s; });

  var CAT_CAP = { L:35, P:35, F:20, A:15 };

  function calcScore(h) {
    var st = h.stars || 0;
    var stars = st>=5?15:st>=4?12:st>=3?8:st>=2?4:st>=1?1:0;
    var cats = {L:0,P:0,F:0,A:0};
    var idSet = {};
    (h.factIds||[]).forEach(function(id){ idSet[id]=true; });
    for(var i=0;i<SCORING_SORTED.length;i++){
      var e=SCORING_SORTED[i];
      if(idSet[e.id]) cats[e.cat]=(cats[e.cat]||0)+e.s;
    }
    return Math.round((stars+Math.min(cats.L,CAT_CAP.L)+Math.min(cats.P,CAT_CAP.P)+Math.min(cats.F,CAT_CAP.F)+Math.min(cats.A,CAT_CAP.A))/120*100);
  }

  function topFeatures(h, n) {
    var idSet = {};
    (h.factIds||[]).forEach(function(id){ idSet[id]=true; });
    var seen={}, out=[];
    for(var i=0;i<SCORING_SORTED.length && out.length<n;i++){
      var e=SCORING_SORTED[i];
      if(idSet[e.id] && !seen[e.l]){ seen[e.l]=true; out.push(e); }
    }
    return out;
  }

  function starsHtml(n) {
    var s=''; for(var i=0;i<5;i++) s+=i<n?'★':'☆'; return s;
  }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function scoreSealSVG(score) {
    var r = 24, c = 150.8;
    var offset = parseFloat((c * (1 - score / 100)).toFixed(2));
    return '<svg class="hc-score-seal" viewBox="0 0 56 56" width="44" height="44" aria-label="JB Score '+score+'/100" style="--jb-offset:'+offset+'">'
      +'<circle cx="28" cy="28" r="'+r+'" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="5"/>'
      +'<circle cx="28" cy="28" r="'+r+'" fill="none" stroke="#00c896" stroke-width="5" stroke-linecap="round"'
      +' stroke-dasharray="'+c+'" stroke-dashoffset="'+c+'" transform="rotate(-90 28 28)" class="jb-ring-anim"/>'
      +'<text x="28" y="23" text-anchor="middle" font-size="7" font-weight="900" fill="rgba(255,255,255,.5)" font-family="system-ui,-apple-system,sans-serif" letter-spacing="1">JB</text>'
      +'<text x="28" y="36" text-anchor="middle" font-size="12" font-weight="900" fill="#00c896" font-family="system-ui,-apple-system,sans-serif">'+score+'</text>'
      +'<text x="28" y="44" text-anchor="middle" font-size="5.5" fill="rgba(0,200,150,.7)" font-family="system-ui,-apple-system,sans-serif">/100</text>'
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
      '.hc-card{flex:0 0 calc((100% - 4.4rem)/4.18);scroll-snap-align:start;background:var(--bg-card,#121212);border:1px solid var(--border,#1e1e1e);border-radius:var(--radius,12px);overflow:hidden;transition:border-color .22s,transform .22s,box-shadow .22s;position:relative;display:flex;flex-direction:column}',
      '.hc-card:hover{border-color:rgba(0,200,150,.35);transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,.5)}',
      /* Image area */
      '.hc-img-wrap{position:relative;width:100%;aspect-ratio:16/10;overflow:hidden;background:#0d0d0d;flex-shrink:0}',
      '.hc-img-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .5s}',
      '.hc-img-wrap img.hc-img-hidden{opacity:0;pointer-events:none}',
      '.hc-img-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:4px;z-index:2}',
      '.hc-img-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.35);transition:background .25s,transform .25s}',
      '.hc-img-dot.active{background:#fff;transform:scale(1.3)}',
      /* Score seal (SVG) */
      '.hc-score-seal{position:absolute;top:8px;right:8px;z-index:3;filter:drop-shadow(0 2px 8px rgba(0,0,0,.65)) drop-shadow(0 0 6px rgba(0,200,150,.32));transition:filter .25s}',
      '.hc-card:hover .hc-score-seal{filter:drop-shadow(0 2px 8px rgba(0,0,0,.65)) drop-shadow(0 0 13px rgba(0,200,150,.6))}',
      /* Body */
      '.hc-body{padding:.85rem 1rem .95rem;display:flex;flex-direction:column;gap:.4rem;flex:1}',
      '.hc-name{font-size:.92rem;font-weight:800;color:var(--text,#f0f0f0);line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.hc-loc{font-size:.75rem;color:var(--text-muted,#888);display:flex;align-items:center;gap:.3rem;margin-top:.05rem}',
      '.hc-stars{color:#f59e0b;font-size:.75rem;letter-spacing:1.5px;margin-top:.1rem}',
      '.hc-badges{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:auto;padding-top:.55rem}',
      '.hc-badge{background:rgba(0,200,150,.07);border:1px solid rgba(0,200,150,.16);border-radius:7px;padding:.15rem .42rem;font-size:.7rem;color:var(--accent,#00c896);white-space:nowrap;line-height:1.4}',
      /* Arrows */
      '.hc-arrow{position:absolute;top:calc(50% - 1.5rem);z-index:10;width:2.5rem;height:2.5rem;border-radius:50%;background:rgba(18,18,18,.9);border:1px solid var(--border,#1e1e1e);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;transition:background .2s,border-color .2s;user-select:none}',
      '.hc-arrow:hover{background:rgba(0,200,150,.2);border-color:rgba(0,200,150,.5)}',
      '.hc-arrow.left{left:-1rem}',
      '.hc-arrow.right{right:-1rem}',
      '.hc-arrow[disabled]{opacity:.25;pointer-events:none}',
      /* Compare Checkbox */
      '.hc-cmp-chk{position:absolute;bottom:7px;left:8px;z-index:4;display:flex;align-items:center;gap:.3rem;background:rgba(0,0,0,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:.2rem .5rem .2rem .35rem;cursor:pointer;user-select:none;transition:background .2s,border-color .2s}',
      '.hc-cmp-chk:hover{background:rgba(0,0,0,.84);border-color:rgba(0,200,150,.55)}',
      '.hc-cmp-input{appearance:none;-webkit-appearance:none;width:13px;height:13px;border:1.5px solid rgba(255,255,255,.42);border-radius:3px;background:transparent;cursor:pointer;flex-shrink:0;transition:border-color .2s,background .2s;margin:0;position:relative}',
      '.hc-cmp-input:checked{background:var(--accent,#00c896);border-color:var(--accent,#00c896)}',
      '.hc-cmp-lbl{font-size:.63rem;font-weight:700;color:rgba(255,255,255,.8);white-space:nowrap;pointer-events:none}',
      '.hc-card--in-cmp{border-color:var(--accent,#00c896)!important;box-shadow:0 0 0 2px rgba(0,200,150,.25)!important}',
      /* Sticky Compare Bar */
      '#jb-cbar{position:fixed;bottom:0;left:0;right:0;z-index:9998;background:rgba(10,10,10,.92);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid rgba(0,200,150,.28);transform:translateY(100%);transition:transform .32s cubic-bezier(.22,.68,0,1.2);box-shadow:0 -4px 40px rgba(0,0,0,.7)}',
      '#jb-cbar.jb-cbar-open{transform:translateY(0)}',
      '.jb-cbar-inner{max-width:1260px;margin:0 auto;padding:.6rem clamp(1rem,4vw,2.5rem);display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}',
      '.jb-cbar-left{display:flex;align-items:center;gap:.65rem;flex:1;min-width:0;flex-wrap:wrap}',
      '.jb-cbar-title{font-size:.76rem;font-weight:700;color:var(--accent,#00c896);white-space:nowrap;letter-spacing:.02em}',
      '.jb-cbar-hotels{display:flex;gap:.45rem;flex-wrap:wrap;align-items:center}',
      '.jb-cbar-item{display:flex;align-items:center;gap:.35rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;padding:.22rem .45rem .22rem .35rem;font-size:.72rem;color:var(--text,#f0f0f0)}',
      '.jb-cbar-item img{width:22px;height:22px;border-radius:3px;object-fit:cover;flex-shrink:0}',
      '.jb-cbar-item-name{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.jb-cbar-item-rm{background:none;border:none;color:rgba(255,255,255,.38);cursor:pointer;font-size:.78rem;line-height:1;padding:0 2px;margin-left:.15rem;transition:color .2s}',
      '.jb-cbar-item-rm:hover{color:#e53e3e}',
      '.jb-cbar-actions{display:flex;gap:.45rem;align-items:center;flex-shrink:0}',
      '.jb-cbar-cmp{background:var(--accent,#00c896);color:#000;border:none;border-radius:8px;padding:.48rem 1.15rem;font-size:.8rem;font-weight:800;cursor:pointer;transition:background .2s,opacity .2s;white-space:nowrap}',
      '.jb-cbar-cmp:hover{background:#00e0ab}',
      '.jb-cbar-cmp:disabled{opacity:.4;cursor:default;pointer-events:none}',
      '.jb-cbar-clr{background:transparent;border:1px solid rgba(255,255,255,.14);color:rgba(255,255,255,.45);border-radius:8px;padding:.48rem .65rem;font-size:.76rem;cursor:pointer;transition:all .2s;white-space:nowrap}',
      '.jb-cbar-clr:hover{border-color:rgba(255,255,255,.32);color:rgba(255,255,255,.75)}',
      '@media(max-width:600px){.jb-cbar-item-name{max-width:75px}.jb-cbar-cmp{padding:.42rem .8rem;font-size:.75rem}}',
      /* Skeleton */
      '.hc-skel{flex:0 0 calc((100% - 4.4rem)/4.18);aspect-ratio:3/4;background:rgba(255,255,255,.04);border-radius:var(--radius,12px);animation:hc-pulse 1.4s ease-in-out infinite}',
      '.hc-skel:nth-child(2){animation-delay:.15s}.hc-skel:nth-child(3){animation-delay:.3s}.hc-skel:nth-child(4){animation-delay:.45s}',
      '@keyframes hc-pulse{0%,100%{opacity:.3}50%{opacity:.65}}',
      '@keyframes jb-ring-fill{to{stroke-dashoffset:var(--jb-offset,0)}}',
      '.jb-ring-anim{animation:jb-ring-fill 1.3s cubic-bezier(.22,.68,0,1.2) forwards}',
      /* Buttons */
      '.hc-btn-row{display:flex;gap:.45rem;margin-top:auto;padding-top:.65rem}',
      '.hc-btn{flex:1;padding:.42rem .35rem;border-radius:8px;font-size:.71rem;font-weight:700;cursor:pointer;text-align:center;text-decoration:none;line-height:1.3;transition:background .18s,border-color .18s,opacity .18s;display:flex;align-items:center;justify-content:center;white-space:nowrap;min-width:0}',
      '.hc-btn-details{background:transparent;border:1px solid rgba(255,255,255,.16);color:var(--text,#f0f0f0)}',
      '.hc-btn-details:hover{border-color:rgba(255,255,255,.44);background:rgba(255,255,255,.05)}',
      '.hc-btn-request{background:var(--accent,#00c896);border:1px solid var(--accent,#00c896);color:#000;font-weight:800}',
      '.hc-btn-request:hover{background:#00e0ab;border-color:#00e0ab}',
      /* Responsive */
      '@media(max-width:1024px){.hc-card,.hc-skel{flex-basis:calc((100% - 2.2rem)/2.8)}.hc-arrow{display:none}}',
      '@media(max-width:600px){.hc-card,.hc-skel{flex-basis:calc((100% - .55rem)/1.5)}.hc-arrow{display:none}}'
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
      var badges = feats.map(function(f){
        return '<span class="hc-badge">'+(FEAT_ICONS[f.l]||'')+' '+esc(f.l)+'</span>';
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
        +(badges?'<div class="hc-badges">'+badges+'</div>':'')
        +'<div class="hc-btn-row">'
        +'<a href="/hotel.html?id='+esc(h.giataId)+'&slug='+toSlug(h.name)+'" class="hc-btn hc-btn-details">Mehr Details</a>'
        +'<a href="#" class="hc-btn hc-btn-request" data-hotel-name="'+esc(h.name||'')+'">Sofort Anfragen</a>'
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

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  function init() {
    var containers = document.querySelectorAll('[data-hotel-carousel]');
    if(!containers.length) return;
    injectCSS();
    injectStickyBar();

    containers.forEach(function(container){
      var val  = (container.getAttribute('data-hotel-carousel')||'').trim();
      var city = (container.getAttribute('data-carousel-city')||'').trim();
      var type = (container.getAttribute('data-hotel-carousel-type')||'').trim();
      if(!val) return;

      var isGlobal = (val === '*');
      var isCountryCode = /^[A-Z]{2}$/.test(val);
      renderSkeleton(container, 8);

      if(isCountryCode || isGlobal) {
        // Fetch top hotels — mit Ländercode (Länder-Carousel) oder global (*)
        var url = '/api/giata?action=top&limit=8';
        if(isCountryCode) url+='&country='+encodeURIComponent(val);
        if(city) url+='&city='+encodeURIComponent(city);
        if(type) url+='&category='+encodeURIComponent(type);

        fetch(url)
          .then(function(r){ return r.ok?r.json():null; })
          .then(function(data){
            if(!data||!data.hotels||!data.hotels.length){
              container.innerHTML='<p style="color:var(--text-muted,#777);padding:2rem 0;text-align:center">Keine GIATA® Daten verfügbar.</p>';
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
                d._score = data.hotels[i].score != null ? data.hotels[i].score : calcScore(d);
                // cc aus Top-API übernehmen falls im Property-Objekt nicht vorhanden
                if(!d.cc && data.hotels[i].cc) d.cc = data.hotels[i].cc;
                return d;
              }).filter(Boolean);
              if(hotels.length) { renderHotels(container,hotels); updateStickyBar(); }
              else container.innerHTML='<p style="color:var(--text-muted,#777);padding:2rem 0;text-align:center">Keine Hotel-Daten verfügbar.</p>';
            });
          })
          .catch(function(){
            container.innerHTML='<p style="color:var(--text-muted,#777);padding:2rem 0;text-align:center">Fehler beim Laden der Hotels.</p>';
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
          valid.sort(function(a,b){ return b._score-a._score; });
          if(valid.length) { renderHotels(container,valid); updateStickyBar(); }
          else container.innerHTML='<p style="color:var(--text-muted,#777);padding:2rem 0;text-align:center">Keine Hotel-Daten verfügbar.</p>';
        });
      }
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else {
    init();
  }

  // Crisp-Chat öffnen wenn "Sofort Anfragen" geklickt wird
  document.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest ? e.target.closest('.hc-btn-request') : null;
    if (!btn) return;
    e.preventDefault();
    var name = btn.getAttribute('data-hotel-name') || '';
    if (window.$crisp) {
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
