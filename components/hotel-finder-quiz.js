/**
 * hotel-finder-quiz.js — JetztBuchbar Hotel-Finder Quiz
 *
 * Usage: <div id="hotel-finder-quiz"></div>
 * Inject: <script src="/components/hotel-finder-quiz.js" defer></script>
 *
 * Flow: 4 Fragen → Loading → 3 Hotel-Empfehlungen → "Jetzt vergleichen" CTA
 */
(function () {
  'use strict';

  var ROOT_ID = 'hotel-finder-quiz';

  // ── Questions ──────────────────────────────────────────────────────────────
  var QUESTIONS = [
    {
      id: 'flight',
      title: 'Wie lange möchtest du fliegen?',
      options: [
        { value: 'short',  icon: '✈️', label: 'Bis 2,5 Std.',    sub: 'Mallorca, Kreta & mehr' },
        { value: 'medium', icon: '✈️', label: '2,5 – 4 Std.',    sub: 'Türkei, Zypern, Kreta' },
        { value: 'long',   icon: '✈️', label: '4 – 6 Std.',      sub: 'Ägypten, Dubai' },
        { value: 'any',    icon: '✈️', label: 'Egal / Flexibel', sub: 'Alle Ziele weltweit' }
      ]
    },
    {
      id: 'travel',
      title: 'Mit wem reist du?',
      options: [
        { value: 'couple',  icon: '👫',         label: 'Zu zweit',  sub: 'Romantik & Ruhe' },
        { value: 'family',  icon: '👨‍👩‍👧‍👦', label: 'Familie',   sub: 'Für alle Altersgruppen' },
        { value: 'friends', icon: '🎉',         label: 'Freunde',   sub: 'Party & gemeinsam erleben' },
        { value: 'solo',    icon: '🧘',         label: 'Solo',      sub: 'Mein eigener Rhythmus' }
      ]
    },
    {
      id: 'prio',
      title: 'Was ist dir am wichtigsten?',
      options: [
        { value: 'beach',    icon: '🏖️', label: 'Strand & Meer',  sub: 'Sonne, Sand, Wasser' },
        { value: 'wellness', icon: '🧖', label: 'Wellness & Spa', sub: 'Entspannung & Erholung' },
        { value: 'food',     icon: '🍽️', label: 'Gastronomie',   sub: 'Kulinarik & Drinks' },
        { value: 'activity', icon: '🎯', label: 'Aktivitäten',   sub: 'Sport & Entdecken' }
      ]
    },
    {
      id: 'style',
      title: 'Wie ist dein Stil?',
      options: [
        { value: 'luxury',  icon: '💎', label: 'Luxus pur',          sub: '5★ & exklusiv' },
        { value: 'active',  icon: '⚡', label: 'Aktiv & Erlebnis',   sub: 'Immer in Bewegung' },
        { value: 'relax',   icon: '🌅', label: 'Entspannung',        sub: 'Einfach abschalten' },
        { value: 'culture', icon: '🏛️', label: 'Kultur & Authentik', sub: 'Echte Eindrücke erleben' }
      ]
    }
  ];

  // ── Country code mapping ───────────────────────────────────────────────────
  var FLIGHT_CC = {
    short:  'ES,GR',
    medium: 'TR,CY,GR',
    long:   'EG,AE',
    any:    'ES,GR,TR,CY,EG,AE,MA,PT,HR,MT,CV,JO,TN,BG,IT,FR'
  };

  // ── Feature labels & icons (for result card badges) ────────────────────────
  var FEAT = [
    [89,'🏖️','Strandlage'],[301,'🌊','Meeresnähe'],[374,'🌅','Strandblick'],
    [614,'🏊','Privater Pool'],[588,'🌊','Wasserpark'],[697,'♾️','Infinity-Pool'],
    [696,'🏙️','Rooftop-Pool'],[86,'🌊','Wasserrutsche'],[698,'🍹','Swim-up Bar'],
    [197,'💆','Spa'],[479,'💆','Wellness-Center'],[529,'🔒','Priv. Wellnessber.'],
    [192,'🧖','Hamam'],[195,'💆','Massage'],[822,'♨️','Thermalbecken'],
    [199,'💧','Thalasso'],[660,'🌡️','Sauna'],[192,'🧖','Hamam'],[201,'🛁','Whirlpool'],
    [94,'⭐','All Inclusive Plus'],[92,'🍽️','All Inclusive'],[101,'🍽️','Vollpension'],
    [65,'🍽️','Restaurant'],[14,'🍷','Bar'],[450,'🥂','Lobbybar'],
    [945,'👨‍👩‍👧','Kids Club'],[946,'🎮','Teens Club'],[1,'👶','Kinderbetreuung'],
    [707,'🎁','Kinder kostenlos'],[26,'🏊','Kinderpool'],[389,'👨‍👩‍👧','Familienfreundlich'],
    [219,'⛳','Golf'],[236,'🤿','Tauchen'],[593,'🎾','Tennisplatz'],
    [240,'🤿','Schnorcheln'],[220,'💪','Fitness-Studio'],[250,'🧘','Yoga'],
    [209,'🏐','Beach-Volleyball'],[249,'🏄','Windsurfen'],
    [393,'💍','Flitterwochen'],[385,'🔞','Adults Only'],[781,'❤️','Für Paare'],
    [90,'📍','Zentrale Lage'],[91,'🌿','Ruhige Lage'],[350,'🏛️','Altstadt'],
    [291,'🏙️','Stadtzentrum'],[58,'🏊','Pool'],[50,'🏊','Außenpool'],
    [2,'🎭','Animation'],[3,'🎭','Abendshows'],[31,'💃','Disco']
  ];

  // Deduplicate FEAT by factId
  var _featSeen = {};
  var FEAT_DEDUP = [];
  for (var fi = 0; fi < FEAT.length; fi++) {
    if (!_featSeen[FEAT[fi][0]]) { _featSeen[FEAT[fi][0]] = true; FEAT_DEDUP.push(FEAT[fi]); }
  }

  function topFeatures(factIds, n) {
    var idSet = {};
    (factIds||[]).forEach(function(id){ idSet[Number(id)] = true; });
    var out = [];
    for (var i = 0; i < FEAT_DEDUP.length && out.length < n; i++) {
      if (idSet[FEAT_DEDUP[i][0]]) out.push(FEAT_DEDUP[i]);
    }
    return out;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  function starsHtml(n) {
    var s = ''; for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆'; return s;
  }

  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function toSlug(name) {
    return String(name||'')
      .toLowerCase()
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
      .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  }

  // ── JB Seal SVG (quiz variant, prefix qz) ─────────────────────────────────
  var _qzUid = 0;
  function qzSealSVG(score) {
    var u = ++_qzUid;
    return '<svg width="56" height="56" viewBox="0 0 680 520" xmlns="http://www.w3.org/2000/svg" aria-label="JB Score '+score+'/100" style="flex-shrink:0">'
      +'<defs>'
      +'<radialGradient id="qzGR'+u+'" cx="50%" cy="40%" r="55%">'
      +'<stop offset="0%" stop-color="#00E0A8"/>'
      +'<stop offset="50%" stop-color="#00C896"/>'
      +'<stop offset="100%" stop-color="#00956E"/>'
      +'</radialGradient>'
      +'<radialGradient id="qzDB'+u+'" cx="50%" cy="35%" r="60%">'
      +'<stop offset="0%" stop-color="#1a1a1a"/>'
      +'<stop offset="100%" stop-color="#0a0a0a"/>'
      +'</radialGradient>'
      +'<radialGradient id="qzCB'+u+'" cx="50%" cy="40%" r="60%">'
      +'<stop offset="0%" stop-color="#FF7A5A"/>'
      +'<stop offset="100%" stop-color="#E85535"/>'
      +'</radialGradient>'
      +'</defs>'
      +'<circle cx="340" cy="265" r="195" fill="url(#qzGR'+u+')"/>'
      +'<circle cx="340" cy="265" r="178" fill="url(#qzDB'+u+')"/>'
      +'<text x="340" y="318" text-anchor="middle" font-size="148" font-weight="700" font-family="Georgia,serif" fill="#00C896">'+score+'</text>'
      +'<path d="M205,365 L475,365 L458,415 L380,438 L340,448 L300,438 L222,415 Z" fill="url(#qzCB'+u+')"/>'
      +'<rect x="205" y="363" width="270" height="46" fill="url(#qzCB'+u+')"/>'
      +'<text x="340" y="393" text-anchor="middle" font-size="19" font-weight="700" font-family="Georgia,serif" fill="#fff" letter-spacing="5">SCORE</text>'
      +'<text x="340" y="430" text-anchor="middle" font-size="16" fill="#fff">&#9733; &#9733; &#9733; &#9733; &#9733;</text>'
      +'<circle cx="340" cy="80" r="36" fill="url(#qzGR'+u+')"/>'
      +'<circle cx="340" cy="80" r="30" fill="url(#qzDB'+u+')"/>'
      +'<text x="340" y="87" text-anchor="middle" font-size="17" font-weight="700" font-family="Georgia,serif" fill="#00C896">JB</text>'
      +'</svg>';
  }

  // ── State ──────────────────────────────────────────────────────────────────
  var state = { step: 0, answers: {}, results: [] };
  // step: 0-3 = questions, 4 = loading, 5 = results, 6 = error

  // ── CSS ────────────────────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('hfq-styles')) return;
    var s = document.createElement('style');
    s.id = 'hfq-styles';
    s.textContent = [
      /* Section wrapper */
      '.hfq-section{padding:clamp(3rem,6vw,5rem) clamp(1.25rem,5vw,3rem);background:#0a0a0a;border-top:1px solid #1e1e1e}',
      '.hfq-inner{max-width:700px;margin:0 auto}',
      /* Header */
      '.hfq-eyebrow{display:inline-block;font-size:.72rem;font-weight:700;color:#00c896;letter-spacing:.1em;text-transform:uppercase;margin-bottom:.65rem}',
      '.hfq-title{font-size:clamp(1.45rem,3vw,2rem);font-weight:800;letter-spacing:-.5px;margin-bottom:.35rem;line-height:1.15}',
      '.hfq-title span{color:#00c896}',
      '.hfq-subtitle{font-size:.9rem;color:#888;margin-bottom:1.75rem;line-height:1.5}',
      /* Progress */
      '.hfq-progress-wrap{height:4px;background:rgba(255,255,255,.08);border-radius:99px;margin-bottom:1.8rem;overflow:hidden}',
      '.hfq-progress-bar{height:100%;background:#00c896;border-radius:99px;transition:width .45s cubic-bezier(.4,0,.2,1)}',
      /* Step animations */
      '.hfq-step{animation:hfq-in .28s ease both}',
      '.hfq-step.hfq-exit{animation:hfq-out .2s ease both}',
      '@keyframes hfq-in{from{opacity:0;transform:translateX(22px)}to{opacity:1;transform:translateX(0)}}',
      '@keyframes hfq-out{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-22px)}}',
      /* Question */
      '.hfq-q-title{font-size:1.15rem;font-weight:700;margin-bottom:1.1rem;color:#f0f0f0}',
      '.hfq-q-num{font-size:.72rem;color:#888;margin-bottom:.4rem;letter-spacing:.06em}',
      /* Options grid */
      '.hfq-options{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}',
      '.hfq-option{background:#121212;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:1rem 1rem;cursor:pointer;display:flex;align-items:center;gap:.7rem;transition:border-color .16s,background .16s,transform .12s;user-select:none}',
      '.hfq-option:hover{border-color:rgba(0,200,150,.45);background:rgba(0,200,150,.04)}',
      '.hfq-option.hfq-selected{border-color:#00c896;background:rgba(0,200,150,.1);transform:scale(.975)}',
      '.hfq-opt-icon{font-size:1.7rem;line-height:1;flex-shrink:0}',
      '.hfq-opt-text{}',
      '.hfq-opt-label{font-weight:700;font-size:.88rem;color:#f0f0f0;line-height:1.2}',
      '.hfq-opt-sub{font-size:.7rem;color:#888;margin-top:.15rem}',
      /* Loading */
      '.hfq-loading{text-align:center;padding:3rem 0}',
      '.hfq-spinner{width:38px;height:38px;border:3px solid rgba(0,200,150,.18);border-top-color:#00c896;border-radius:50%;animation:hfq-spin .65s linear infinite;margin:0 auto}',
      '@keyframes hfq-spin{to{transform:rotate(360deg)}}',
      '.hfq-loading-label{font-size:.9rem;color:#888;margin-top:.85rem}',
      '.hfq-loading-dots span{animation:hfq-blink 1.2s infinite;opacity:0}',
      '.hfq-loading-dots span:nth-child(2){animation-delay:.2s}',
      '.hfq-loading-dots span:nth-child(3){animation-delay:.4s}',
      '@keyframes hfq-blink{0%,80%,100%{opacity:0}40%{opacity:1}}',
      /* Results header */
      '.hfq-res-header{text-align:center;margin-bottom:1.5rem}',
      '.hfq-res-title{font-size:1.3rem;font-weight:800;margin-bottom:.3rem}',
      '.hfq-res-sub{font-size:.85rem;color:#888}',
      /* Cards grid */
      '.hfq-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:.85rem;margin-bottom:1.5rem}',
      /* Single card */
      '.hfq-card{background:#121212;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;position:relative;transition:border-color .2s,transform .2s;animation:hfq-fade-up .4s ease both;display:flex;flex-direction:column}',
      '.hfq-card:nth-child(2){animation-delay:.1s}.hfq-card:nth-child(3){animation-delay:.2s}',
      '@keyframes hfq-fade-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}',
      '.hfq-card:hover{border-color:rgba(0,200,150,.3);transform:translateY(-3px)}',
      '.hfq-card--best{border-color:#00c896!important;box-shadow:0 0 0 1px rgba(0,200,150,.2)!important}',
      /* Card image */
      '.hfq-img-wrap{width:100%;aspect-ratio:16/10;overflow:hidden;background:#0d0d0d;position:relative;flex-shrink:0}',
      '.hfq-img-wrap img{width:100%;height:100%;object-fit:cover;display:block}',
      '.hfq-img-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a2e 0%,#0d1117 100%);font-size:2rem}',
      /* Badges on image */
      '.hfq-match-badge{position:absolute;top:8px;left:8px;background:rgba(0,200,150,.92);color:#000;font-size:.62rem;font-weight:800;padding:.2rem .52rem;border-radius:20px;backdrop-filter:blur(6px);z-index:2;letter-spacing:.02em}',
      '.hfq-best-badge{position:absolute;top:8px;right:8px;background:#00c896;color:#000;font-size:.58rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:.18rem .45rem;border-radius:6px;z-index:2}',
      /* Card body */
      '.hfq-card-body{padding:.8rem .9rem 1rem;flex:1;display:flex;flex-direction:column}',
      '.hfq-card-stars{font-size:.68rem;color:#f59e0b;letter-spacing:1.5px;margin-bottom:.3rem}',
      '.hfq-card-seal-row{display:flex;align-items:flex-start;gap:.5rem;margin-bottom:.45rem}',
      '.hfq-card-info{flex:1;min-width:0}',
      '.hfq-card-name{font-size:.88rem;font-weight:800;color:#f0f0f0;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.hfq-card-loc{font-size:.7rem;color:#888;margin-top:.15rem}',
      '.hfq-card-badges{display:flex;flex-wrap:wrap;gap:.25rem;margin-top:auto;padding-top:.55rem}',
      '.hfq-card-badge{background:rgba(0,200,150,.07);border:1px solid rgba(0,200,150,.16);border-radius:7px;padding:.1rem .36rem;font-size:.63rem;color:#00c896;white-space:nowrap;line-height:1.5}',
      '.hfq-btn-details{display:block;text-align:center;margin-top:.7rem;padding:.42rem;border-radius:8px;font-size:.76rem;font-weight:700;text-decoration:none;border:1px solid rgba(255,255,255,.14);color:#f0f0f0;transition:border-color .16s,background .16s}',
      '.hfq-btn-details:hover{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.05)}',
      /* CTA area */
      '.hfq-cta-wrap{text-align:center;margin-top:.25rem}',
      '.hfq-btn-cmp{display:inline-block;background:#00c896;color:#000;font-size:1rem;font-weight:800;padding:.85rem 2.2rem;border-radius:12px;text-decoration:none;transition:background .18s,transform .12s;letter-spacing:-.2px}',
      '.hfq-btn-cmp:hover{background:#00e0ab;transform:translateY(-2px)}',
      '.hfq-restart{display:block;margin-top:.85rem;font-size:.78rem;color:#666;cursor:pointer;background:none;border:none;font-family:inherit;transition:color .15s}',
      '.hfq-restart:hover{color:#00c896}',
      /* Error */
      '.hfq-error{text-align:center;padding:2rem 0;color:#888}',
      '.hfq-error p{margin-bottom:.75rem}',
      '.hfq-err-btn{background:none;border:1px solid rgba(255,255,255,.16);color:#888;border-radius:8px;padding:.5rem 1.2rem;cursor:pointer;font-family:inherit;font-size:.85rem;transition:border-color .15s,color .15s}',
      '.hfq-err-btn:hover{border-color:rgba(0,200,150,.5);color:#00c896}',
      /* Responsive */
      '@media(max-width:680px){.hfq-cards{grid-template-columns:1fr}.hfq-options{grid-template-columns:1fr}}'
    ].join('');
    document.head.appendChild(s);
  }

  // ── Render helpers ─────────────────────────────────────────────────────────
  function renderHeader() {
    return '<h2 class="hfq-title">Welches Hotel passt <span>zu dir?</span></h2>';
  }

  function renderProgress(step) {
    var pct = Math.round(((step) / 4) * 100);
    return '<div class="hfq-progress-wrap"><div class="hfq-progress-bar" style="width:' + pct + '%"></div></div>';
  }

  function renderQuestionStep(stepIdx) {
    var q = QUESTIONS[stepIdx];
    var opts = q.options.map(function(o) {
      return '<div class="hfq-option" data-q="' + esc(q.id) + '" data-val="' + esc(o.value) + '" role="button" tabindex="0">'
        + '<span class="hfq-opt-icon">' + o.icon + '</span>'
        + '<span class="hfq-opt-text">'
        + '<span class="hfq-opt-label">' + esc(o.label) + '</span>'
        + '<span class="hfq-opt-sub">' + esc(o.sub) + '</span>'
        + '</span>'
        + '</div>';
    }).join('');

    return '<div class="hfq-step" id="hfq-step-' + stepIdx + '">'
      + '<p class="hfq-q-num">Frage ' + (stepIdx + 1) + ' von 4</p>'
      + '<p class="hfq-q-title">' + esc(q.title) + '</p>'
      + '<div class="hfq-options">' + opts + '</div>'
      + '</div>';
  }

  function renderLoading() {
    return '<div class="hfq-step">'
      + '<div class="hfq-loading">'
      + '<div class="hfq-spinner"></div>'
      + '<p class="hfq-loading-label">Analysiere dein Reiseprofil<span class="hfq-loading-dots"><span>.</span><span>.</span><span>.</span></span></p>'
      + '</div>'
      + '</div>';
  }

  function renderResultCards(hotels) {
    return hotels.map(function(h, i) {
      var isBest = i === 0;
      var feats  = topFeatures(h.factIds || [], 3);
      var badges = feats.map(function(f) {
        return '<span class="hfq-card-badge">' + f[1] + ' ' + esc(f[2]) + '</span>';
      }).join('');
      var imgHtml = h.image
        ? '<img src="' + esc(h.image) + '" alt="' + esc(h.name) + '" loading="lazy">'
        : '<div class="hfq-img-ph">🏨</div>';

      return '<div class="hfq-card' + (isBest ? ' hfq-card--best' : '') + '">'
        + '<div class="hfq-img-wrap">'
        + imgHtml
        + '<span class="hfq-match-badge">' + h.matchPct + '% Match</span>'
        + (isBest ? '<span class="hfq-best-badge">Beste Wahl</span>' : '')
        + '</div>'
        + '<div class="hfq-card-body">'
        + '<div class="hfq-card-stars">' + starsHtml(h.stars||0) + '</div>'
        + '<div class="hfq-card-seal-row">'
        + qzSealSVG(h.jbScore || 0)
        + '<div class="hfq-card-info">'
        + '<div class="hfq-card-name">' + esc(h.name) + '</div>'
        + '<div class="hfq-card-loc">📍 ' + esc(h.city||'') + (h.country ? ' · ' + esc(h.country) : '') + '</div>'
        + '</div>'
        + '</div>'
        + (badges ? '<div class="hfq-card-badges">' + badges + '</div>' : '')
        + '<a href="/hotel.html?id=' + esc(h.giataId) + '&slug=' + toSlug(h.name) + '" class="hfq-btn-details">Mehr Details</a>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function renderResults() {
    if (!state.results.length) {
      return '<div class="hfq-step">'
        + '<div class="hfq-error">'
        + '<p>Keine passenden Hotels gefunden.</p>'
        + '<button class="hfq-err-btn" id="hfq-retry">↺ Neu starten</button>'
        + '</div>'
        + '</div>';
    }

    var ids = state.results.map(function(h) { return h.giataId; });
    var cmpUrl = '/vergleich.html?hotels=' + ids.join(',');

    return '<div class="hfq-step">'
      + '<div class="hfq-res-header">'
      + '<p class="hfq-res-title">🎯 Deine Top-Empfehlungen</p>'
      + '<p class="hfq-res-sub">Basierend auf deinem Reiseprofil – ' + state.results[0].matchPct + '% Match mit deinen Antworten</p>'
      + '</div>'
      + '<div class="hfq-cards">' + renderResultCards(state.results) + '</div>'
      + '<div class="hfq-cta-wrap">'
      + '<a href="' + esc(cmpUrl) + '" class="hfq-btn-cmp">Alle 3 Hotels vergleichen →</a>'
      + '<button class="hfq-restart" id="hfq-restart">↺ Quiz neu starten</button>'
      + '</div>'
      + '</div>';
  }

  function renderError() {
    return '<div class="hfq-step">'
      + '<div class="hfq-error">'
      + '<p>Ups – da ist etwas schiefgelaufen. Bitte versuche es erneut.</p>'
      + '<button class="hfq-err-btn" id="hfq-retry">↺ Neu starten</button>'
      + '</div>'
      + '</div>';
  }

  // ── Main render ────────────────────────────────────────────────────────────
  function render() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;

    var content;
    if (state.step <= 3) {
      content = renderProgress(state.step) + renderQuestionStep(state.step);
    } else if (state.step === 4) {
      content = renderProgress(4) + renderLoading();
    } else if (state.step === 5) {
      content = renderProgress(4) + renderResults();
    } else {
      content = renderProgress(state.step === 6 ? 0 : 4) + renderError();
    }

    root.innerHTML = '<section class="hfq-section"><div class="hfq-inner">'
      + renderHeader()
      + content
      + '</div></section>';

    bindEvents(root);
  }

  // ── Event binding ──────────────────────────────────────────────────────────
  function bindEvents(root) {
    // Option click
    root.querySelectorAll('.hfq-option').forEach(function(el) {
      el.addEventListener('click', function() {
        var qId = el.getAttribute('data-q');
        var val = el.getAttribute('data-val');
        if (!qId || !val) return;
        handleSelect(qId, val, el);
      });
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });

    // Restart buttons
    var restartBtn = root.querySelector('#hfq-restart, #hfq-retry');
    if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        state.step = 0;
        state.answers = {};
        state.results = [];
        render();
      });
    }
  }

  // ── Option selection ───────────────────────────────────────────────────────
  function handleSelect(qId, val, el) {
    // Prevent double-click
    if (el.classList.contains('hfq-selected')) return;

    state.answers[qId] = val;

    // Highlight selected
    var opts = document.querySelectorAll('.hfq-option[data-q="' + qId + '"]');
    opts.forEach(function(o) { o.classList.remove('hfq-selected'); });
    el.classList.add('hfq-selected');

    // Auto-advance after 300ms
    setTimeout(function() {
      if (state.step < 3) {
        advance();
      } else {
        startLoading();
      }
    }, 300);
  }

  function advance() {
    var stepEl = document.querySelector('#hfq-step-' + state.step);
    if (stepEl) {
      stepEl.classList.add('hfq-exit');
      setTimeout(function() { state.step++; render(); }, 200);
    } else {
      state.step++;
      render();
    }
  }

  function startLoading() {
    var stepEl = document.querySelector('#hfq-step-' + state.step);
    if (stepEl) {
      stepEl.classList.add('hfq-exit');
      setTimeout(function() { state.step = 4; render(); fetchResults(); }, 200);
    } else {
      state.step = 4;
      render();
      fetchResults();
    }
  }

  // ── API fetch ──────────────────────────────────────────────────────────────
  function fetchResults() {
    var countries = FLIGHT_CC[state.answers.flight] || 'ES,GR,TR,CY,EG,AE';
    var url = '/api/giata?action=quiz'
      + '&countries=' + encodeURIComponent(countries)
      + '&travel='    + encodeURIComponent(state.answers.travel  || 'solo')
      + '&prio='      + encodeURIComponent(state.answers.prio    || 'beach')
      + '&style='     + encodeURIComponent(state.answers.style   || 'relax')
      + '&limit=3';

    fetch(url)
      .then(function(r) { return r.ok ? r.json() : Promise.reject('API error'); })
      .then(function(data) {
        if (!data || !data.hotels || !data.hotels.length) return Promise.reject('No results');
        var basics = data.hotels.slice(0, 3);

        // Fetch property details (images) in parallel for all 3
        return Promise.all(basics.map(function(h) {
          return fetch('/api/giata?action=property&id=' + encodeURIComponent(h.giataId))
            .then(function(r) { return r.ok ? r.json() : null; })
            .catch(function() { return null; })
            .then(function(detail) {
              return Object.assign({}, h, detail && !detail.error ? { image: detail.image } : {});
            });
        }));
      })
      .then(function(hotels) {
        state.results = hotels.filter(Boolean);
        state.step = 5;
        render();
      })
      .catch(function() {
        state.step = 6;
        render();
      });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    if (!document.getElementById(ROOT_ID)) return;
    injectCSS();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
