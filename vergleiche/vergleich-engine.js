/**
 * JetztBuchbar – Vergleich Engine v2 (Premium Dashboard)
 * Renders Split-Hero, Criteria Cards, Progress Bars, Hotel Tabs, FAQ Accordion
 *
 *  <script src="/vergleiche/destinations-data.js"></script>
 *  <script src="/vergleiche/vergleich-engine.js"></script>
 *  <script>JB.initVergleich('mallorca-vs-kreta');</script>
 */
'use strict';

(function (global) {

  var JB = global.JB;
  if (!JB || !JB.DESTINATIONS) {
    console.error('[VergleichEngine] destinations-data.js muss zuerst geladen werden.');
    return;
  }

  /* ═══════════════════════════════════════════════
     CSS INJECTION
  ═══════════════════════════════════════════════ */
  function injectCSS() {
    if (document.querySelector('style[data-vg-engine]')) return;
    var s = document.createElement('style');
    s.setAttribute('data-vg-engine', '2');
    s.textContent = [
      /* Travel-Type Selector */
      '.vg-tt-wrap{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.25rem}',
      '.vg-tt-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.15rem;font-size:.83rem;font-weight:600;font-family:inherit;color:var(--text-muted);background:var(--bg-card);border:1px solid var(--border);border-radius:50px;cursor:pointer;transition:all .2s}',
      '.vg-tt-btn:hover{border-color:var(--accent);color:var(--accent)}',
      '.vg-tt-btn.active{background:var(--accent);border-color:var(--accent);color:#0a0a0a;box-shadow:0 0 16px rgba(0,200,150,.35)}',
      /* KI Fazit Glassmorphism */
      '.vg-ki-fazit{position:relative;overflow:hidden;background:rgba(0,200,150,.06);border:1px solid rgba(0,200,150,.25);border-radius:var(--radius,14px);padding:1.5rem 1.75rem;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}',
      '.vg-ki-fazit::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 50%,rgba(0,200,150,.08),transparent);pointer-events:none}',
      '.vg-ki-label{font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:.6rem;display:flex;align-items:center;gap:.4rem}',
      '.vg-ki-text{font-size:1rem;line-height:1.78;color:var(--text-soft,#aaa);position:relative}',
      '.vg-ki-fazit.vg-fade{animation:vg-fade-in .35s ease}',
      '@keyframes vg-fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
      /* Criteria Pair-Cards Grid */
      '.vg-cc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem}',
      '.vg-cc-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius,14px);overflow:hidden;transition:border-color .2s}',
      '.vg-cc-card:hover{border-color:var(--border-soft,#252525)}',
      '.vg-cc-label{display:flex;align-items:center;gap:.5rem;padding:.58rem 1rem;font-size:.73rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);background:rgba(255,255,255,.03);border-bottom:1px solid var(--border)}',
      '.vg-cc-sides{display:grid;grid-template-columns:1fr 1fr}',
      '.vg-cc-side{padding:.8rem 1rem;position:relative;transition:background .2s}',
      '.vg-cc-side+.vg-cc-side{border-left:1px solid var(--border)}',
      '.vg-cc-side.winner{background:rgba(0,200,150,.07)}',
      '.vg-cc-dname{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--accent);margin-bottom:.35rem;display:flex;align-items:center;gap:.3rem}',
      '.vg-cc-val{font-size:.85rem;color:var(--text-soft);line-height:1.5}',
      '.vg-cc-val small{font-size:.74rem;color:var(--text-muted);display:block;margin-top:.2rem}',
      '.vg-cc-win{position:absolute;top:.5rem;right:.5rem;font-size:.58rem;font-weight:800;padding:.15rem .45rem;border-radius:50px;letter-spacing:.04em;line-height:1.4}',
      '.vg-cc-win.vg-win-badge{background:var(--accent);color:#000}',
      '.vg-cc-win.vg-match-badge{background:rgba(255,255,255,.08);color:var(--text-muted);border:1px solid rgba(255,255,255,.12)}',
      /* Tug-of-War Arena */
      '.vg-tow-grid{display:flex;flex-direction:column;gap:.85rem}',
      '.vg-tow-row{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius,14px);padding:1rem 1.25rem;transition:border-color .35s,box-shadow .35s,opacity .35s}',
      '.vg-tow-row.vg-tow-dim{opacity:.35}',
      '.vg-tow-row.vg-tow-highlight{border-color:var(--accent);box-shadow:0 0 0 1px rgba(0,200,150,.2),0 4px 28px rgba(0,200,150,.1);opacity:1}',
      '.vg-tow-hd{display:flex;align-items:center;gap:.5rem;font-size:.82rem;font-weight:700;color:var(--text-muted);margin-bottom:.85rem}',
      '.vg-tow-arena{display:flex;align-items:center;gap:.7rem}',
      '.vg-tow-lbl{font-size:.7rem;font-weight:600;white-space:nowrap;min-width:72px;line-height:1.3;color:var(--text-muted)}',
      '.vg-tow-lbl-a{text-align:right}',
      '.vg-tow-lbl-b{text-align:left}',
      '.vg-tow-bar-wrap{flex:1;position:relative;padding:6px 0}',
      '.vg-tow-bar{position:relative;height:8px;background:rgba(255,255,255,.06);border-radius:4px}',
      '.vg-tow-fill-a{position:absolute;left:0;top:0;height:100%;background:linear-gradient(90deg,#007a5e,#00c896);border-radius:4px 0 0 4px;transition:width .7s cubic-bezier(.4,0,.2,1)}',
      '.vg-tow-fill-b{position:absolute;right:0;top:0;height:100%;background:linear-gradient(270deg,#1d4ed8,#60a5fa);border-radius:0 4px 4px 0;transition:width .7s cubic-bezier(.4,0,.2,1)}',
      '.vg-tow-knot{position:absolute;top:50%;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid var(--bg,#0a0a0a);box-shadow:0 0 12px rgba(0,200,150,.75);transform:translate(-50%,-50%);transition:left .7s cubic-bezier(.4,0,.2,1);z-index:2;pointer-events:none}',
      /* Budget Visual */
      '.vg-bv-wrap{padding:.55rem 1rem .65rem;border-top:1px solid var(--border)}',
      '.vg-bv-bar-row{display:flex;align-items:center;gap:.5rem;font-size:.64rem;color:var(--text-muted);margin-bottom:.25rem}',
      '.vg-bv-track{position:relative;flex:1;height:2px;background:rgba(255,255,255,.1);border-radius:2px;margin:8px 0}',
      '.vg-bv-dot{position:absolute;top:50%;width:11px;height:11px;border-radius:50%;transform:translate(-50%,-50%)}',
      '.vg-bv-dot-a{background:var(--accent);box-shadow:0 0 8px rgba(0,200,150,.7)}',
      '.vg-bv-dot-b{background:#60a5fa;box-shadow:0 0 8px rgba(96,165,250,.7)}',
      '.vg-bv-legend{display:flex;justify-content:space-between;font-size:.61rem;color:var(--text-muted);opacity:.7}',
      /* Season Strip */
      '.vg-season-strip{display:flex;gap:2px;margin-top:.45rem;flex-wrap:nowrap}',
      '.vg-sm{width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:700;border-radius:3px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.18);flex-shrink:0}',
      '.vg-sm.on{background:rgba(0,200,150,.18);color:var(--accent);outline:1px solid rgba(0,200,150,.3)}',
      /* Flight Route */
      '.vg-flight-route{display:flex;align-items:center;gap:.22rem;margin-top:.45rem;font-size:.7rem;line-height:1}',
      '.vg-flight-dashes{letter-spacing:.5px;color:rgba(255,255,255,.22);overflow:hidden;white-space:nowrap;flex-shrink:0}',
      /* Hotel Tabs */
      '.vg-htabs{display:flex;flex-wrap:wrap;gap:.55rem;margin-bottom:1.25rem}',
      '.vg-htab{display:inline-flex;align-items:center;gap:.45rem;padding:.55rem 1rem;background:var(--bg-card);border:1px solid var(--border);border-radius:50px;font-size:.82rem;font-weight:600;color:var(--text-muted);cursor:pointer;transition:all .2s;font-family:inherit}',
      '.vg-htab:hover,.vg-htab.active{border-color:var(--accent);color:var(--accent);background:rgba(0,200,150,.07)}',
      '.vg-htab.active{box-shadow:0 0 12px rgba(0,200,150,.25)}',
      /* Responsive */
      '@media(max-width:768px){.vg-cc-grid{grid-template-columns:1fr}}',
      '@media(max-width:480px){.vg-cc-sides{grid-template-columns:1fr}.vg-cc-side+.vg-cc-side{border-left:none;border-top:1px solid var(--border)}.vg-tt-btn{font-size:.78rem;padding:.45rem .9rem}.vg-tow-lbl{min-width:52px;font-size:.64rem}.vg-tow-arena{gap:.4rem}.vg-sm{width:15px;height:15px;font-size:.52rem}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ═══════════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════════ */
  function esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function renderStars(score) {
    var o=''; for(var i=1;i<=5;i++) o+='<span style="color:'+(i<=score?'#fbbf24':'rgba(255,255,255,.12)')+'">&#9733;</span>'; return o;
  }
  function renderBudget(score) {
    var o=''; for(var i=1;i<=5;i++) o+='<span style="color:'+(i<=score?'var(--accent)':'rgba(255,255,255,.12)')+'">&#8364;</span>'; return o;
  }
  function renderTags(arr) {
    return arr.map(function(a){return '<span style="display:inline-block;padding:.18rem .55rem;font-size:.74rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:50px;margin:.12rem .08rem;color:var(--text-muted)">'+esc(a)+'</span>';}).join('');
  }
  function winner(sA,sB){return sA>sB?'a':sB>sA?'b':'tie';}

  /* ── Micro-UI Helpers ── */
  var MONTH_MAP={'Januar':1,'Februar':2,'März':3,'April':4,'Mai':5,'Juni':6,'Juli':7,'August':8,'September':9,'Oktober':10,'November':11,'Dezember':12};
  var MONTH_LETTERS=['J','F','M','A','M','J','J','A','S','O','N','D'];
  function renderSeasonStrip(label){
    var s=0,e=11;
    if(label){
      var pts=label.split(/\s*[–\-\/]\s*/);
      if(pts.length>=2){var ms=MONTH_MAP[pts[0].trim()],me=MONTH_MAP[pts[1].trim()];if(ms)s=ms-1;if(me)e=me-1;}
    }
    var h='<div class="vg-season-strip">';
    for(var i=0;i<12;i++){
      var on=(s<=e)?(i>=s&&i<=e):(i>=s||i<=e);
      h+='<span class="vg-sm'+(on?' on':'')+'">'+MONTH_LETTERS[i]+'</span>';
    }
    return h+'</div>';
  }
  function renderBudgetVis(pA,pB,flagA,nameA,flagB,nameB){
    var lo=Math.min(pA,pB),hi=Math.max(pA,pB),rng=hi-lo||1;
    var posA=pA===pB?50:8+((pA-lo)/rng)*84;
    var posB=pA===pB?50:8+((pB-lo)/rng)*84;
    var cheapFlag=pA<pB?flagA:flagB,expFlag=pA<pB?flagB:flagA;
    return '<div class="vg-bv-wrap">'+
      '<div class="vg-bv-bar-row"><span>'+esc(cheapFlag)+' günstiger</span><div class="vg-bv-track">'+
      '<div class="vg-bv-dot vg-bv-dot-a" style="left:'+posA.toFixed(0)+'%" title="'+esc(nameA)+': '+pA+'€"></div>'+
      '<div class="vg-bv-dot vg-bv-dot-b" style="left:'+posB.toFixed(0)+'%" title="'+esc(nameB)+': '+pB+'€"></div>'+
      '</div><span>'+esc(expFlag)+' teurer</span></div>'+
      '</div>';
  }
  function renderFlightVis(duration){
    var pts=(duration||'0:0').split(':');
    var mins=parseInt(pts[0]||0)*60+parseInt(pts[1]||0);
    var cnt=Math.max(4,Math.min(13,Math.round(mins/18)));
    var d='';
    for(var i=0;i<cnt;i++)d+='─';
    return '<div class="vg-flight-route">'+
      '<span style="font-size:.67rem;font-weight:700;color:var(--text)">DE</span>'+
      '<span class="vg-flight-dashes"> '+d+' </span>'+
      '<span style="font-size:.85rem">✈</span>'+
      '<span style="color:rgba(255,255,255,.28);font-size:.7rem">►</span></div>';
  }

  /* ═══════════════════════════════════════════════
     KI-FAZIT TEMPLATES
  ═══════════════════════════════════════════════ */
  var FAZIT={
    family:function(w){return w.name+' ist die bessere Wahl f\u00fcr Familien \u2013 mit ausgezeichneter Kinderinfrastruktur, familienfreundlichen Str\u00e4nden und vielf\u00e4ltiger Unterhaltung f\u00fcr alle Altersgruppen.';},
    couple:function(w){return w.name+' bietet die romantischere Atmosph\u00e4re f\u00fcr P\u00e4rchen \u2013 traumhafte Sonnenunterg\u00e4nge, intime Buchten und unverg\u00e4ngliches Flair zu zweit.';},
    beach:function(w){return 'Als Strandparadies f\u00fchrt '+w.name+' deutlich \u2013 '+(w.beach?w.beach.label:'erstklassige Str\u00e4nde')+' machen jeden Strandtag perfekt.';},
    culture:function(w){return 'Kulturinteressierte kommen in '+w.name+' am meisten auf ihre Kosten \u2013 Geschichte, Architektur und lokale Traditionen sind hier besonders reichhaltig.';},
    adventure:function(w){return 'Abenteuerlustige sind in '+w.name+' besser aufgehoben \u2013 '+(w.activities&&w.activities.length?w.activities.slice(0,3).join(', ')+' warten auf dich.':'Outdoor-Aktivit\u00e4ten und spannende Erlebnisse erwarten dich.');},
    nature:function(w){return w.name+' begeistert Naturliebhaber \u2013 '+(w.nature?w.nature.label:'atemberaubende Landschaften')+(w.nature&&w.nature.highlights&&w.nature.highlights.length?': '+w.nature.highlights.slice(0,2).join(', ')+'.':'.');},
    party:function(w){return 'F\u00fcr Partygänger ist '+w.name+' die klarere Wahl \u2013 lebhaftes Nachtleben, Clubs und Bars bis in die fr\u00fchen Morgenstunden.';}
  };
  function generateFazit(destA,destB,travelType,pair){
    var sA=destA.scores[travelType]||0,sB=destB.scores[travelType]||0,w=sA>=sB?destA:destB;
    var fn=FAZIT[travelType]; return fn?fn(w):(pair?pair.default_ki_fazit:'');
  }

  /* ═══════════════════════════════════════════════
     RENDER: KI-FAZIT
  ═══════════════════════════════════════════════ */
  function renderKiFazit(text,container){
    container.innerHTML='<div class="vg-ki-fazit"><div class="vg-ki-label">&#x1F916; JetztBuchbar KI-Empfehlung</div><p class="vg-ki-text">'+esc(text)+'</p></div>';
  }
  function animateKiFazit(text,container){
    var box=container.querySelector('.vg-ki-fazit');
    if(!box){renderKiFazit(text,container);return;}
    box.classList.remove('vg-fade'); void box.offsetWidth;
    box.querySelector('.vg-ki-text').textContent=text;
    box.classList.add('vg-fade');
  }

  /* ═══════════════════════════════════════════════
     RENDER: TRAVEL-TYPE SELECTOR
  ═══════════════════════════════════════════════ */
  function renderTravelTypes(pair,destA,destB,fazitEl,scoresEl){
    var el=document.getElementById('vg-travel-types'); if(!el)return;
    var html='<div class="vg-tt-wrap">';
    JB.TRAVEL_TYPES.forEach(function(tt){html+='<button class="vg-tt-btn" data-type="'+tt.key+'">'+tt.icon+' '+esc(tt.label)+'</button>';});
    html+='</div>'; el.innerHTML=html;
    el.querySelectorAll('.vg-tt-btn').forEach(function(btn){
      btn.addEventListener('click',function(){
        el.querySelectorAll('.vg-tt-btn').forEach(function(b){b.classList.remove('active');}); btn.classList.add('active');
        var type=btn.dataset.type;
        animateKiFazit(generateFazit(destA,destB,type,pair),fazitEl);
        if(scoresEl) scoresEl.querySelectorAll('.vg-tow-row').forEach(function(row){var on=row.dataset.scoreKey===type;row.classList.toggle('vg-tow-highlight',on);row.classList.toggle('vg-tow-dim',!on);});
      });
    });
  }

  /* ═══════════════════════════════════════════════
     RENDER: CRITERIA PAIR-CARDS
  ═══════════════════════════════════════════════ */
  function renderCriteriaCards(destA,destB,container){
    var criteria=[
      {icon:'&#x1F4C5;',label:'Beste Reisezeit',
       a:esc(destA.bestSeason.label)+'<small>'+esc(destA.bestSeason.tip)+'</small>'+renderSeasonStrip(destA.bestSeason.label),
       b:esc(destB.bestSeason.label)+'<small>'+esc(destB.bestSeason.tip)+'</small>'+renderSeasonStrip(destB.bestSeason.label),
       win:winner(destA.bestSeason.score,destB.bestSeason.score)},
      {icon:'&#x1F4B6;',label:'Budget',
       a:renderBudget(destA.budget.score)+'<small>&#8709; '+destA.budget.avgHotelNight+'&#8364;/Nacht &middot; Flug ab '+destA.budget.avgFlight+'&#8364;</small>',
       b:renderBudget(destB.budget.score)+'<small>&#8709; '+destB.budget.avgHotelNight+'&#8364;/Nacht &middot; Flug ab '+destB.budget.avgFlight+'&#8364;</small>',
       win:winner(6-destA.budget.score,6-destB.budget.score),
       footer:renderBudgetVis(destA.budget.avgHotelNight,destB.budget.avgHotelNight,destA.flag,destA.name,destB.flag,destB.name)},
      {icon:'&#x1F3D6;&#xFE0F;',label:'Strandqualit\u00e4t',
       a:renderStars(destA.beach.score)+'<small>'+esc(destA.beach.label)+'</small>',
       b:renderStars(destB.beach.score)+'<small>'+esc(destB.beach.label)+'</small>',
       win:winner(destA.beach.score,destB.beach.score)},
      {icon:'&#x1F333;',label:'Natur &amp; Landschaft',
       a:renderStars(destA.nature.score)+'<small>'+esc(destA.nature.label)+'</small>',
       b:renderStars(destB.nature.score)+'<small>'+esc(destB.nature.label)+'</small>',
       win:winner(destA.nature.score,destB.nature.score)},
      {icon:'&#x2708;&#xFE0F;',label:'Flugzeit ab DE',
       a:'<strong style="color:var(--text)">'+esc(destA.flightFromDE.label)+'</strong>'+renderFlightVis(destA.flightFromDE.duration),
       b:'<strong style="color:var(--text)">'+esc(destB.flightFromDE.label)+'</strong>'+renderFlightVis(destB.flightFromDE.duration),
       win:winner(parseFloat(destB.flightFromDE.duration.replace(':','.')),parseFloat(destA.flightFromDE.duration.replace(':','.')))},
      {icon:'&#x1F3AF;',label:'Top-Aktivit\u00e4ten',
       a:renderTags(destA.activities.slice(0,3)),b:renderTags(destB.activities.slice(0,3)),win:'tie'},
      {icon:'&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;',label:'Familienfreundlich',
       a:renderStars(destA.scores.family),b:renderStars(destB.scores.family),
       win:winner(destA.scores.family,destB.scores.family)},
      {icon:'&#x1F491;',label:'F\u00fcr P\u00e4rchen',
       a:renderStars(destA.scores.couple),b:renderStars(destB.scores.couple),
       win:winner(destA.scores.couple,destB.scores.couple)}
    ];
    var html='<div class="vg-cc-grid">';
    criteria.forEach(function(crit){
      var wA=crit.win==='a',wB=crit.win==='b',tie=crit.win==='tie';
      var clsA=wA?' winner':'',clsB=wB?' winner':'';
      html+='<div class="vg-cc-card">';
      html+='<div class="vg-cc-label">'+crit.icon+' '+crit.label+'</div>';
      html+='<div class="vg-cc-sides">';
      html+='<div class="vg-cc-side'+clsA+'">';
      html+='<div class="vg-cc-dname">'+esc(destA.flag)+' '+esc(destA.name)+'</div>';
      html+='<div class="vg-cc-val">'+crit.a+'</div>';
      if(wA)html+='<span class="vg-cc-win vg-win-badge">Top &#x2713;</span>';
      else if(tie)html+='<span class="vg-cc-win vg-match-badge">Match</span>';
      html+='</div>';
      html+='<div class="vg-cc-side'+clsB+'">';
      html+='<div class="vg-cc-dname">'+esc(destB.flag)+' '+esc(destB.name)+'</div>';
      html+='<div class="vg-cc-val">'+crit.b+'</div>';
      if(wB)html+='<span class="vg-cc-win vg-win-badge">Top &#x2713;</span>';
      else if(tie)html+='<span class="vg-cc-win vg-match-badge">Match</span>';
      html+='</div>';
      html+='</div>';
      if(crit.footer)html+=crit.footer;
      html+='</div>';
    });
    html+='</div>'; container.innerHTML=html;
  }

  /* ═══════════════════════════════════════════════
     RENDER: TUG-OF-WAR SCORE ARENA
  ═══════════════════════════════════════════════ */
  function renderTugOfWar(destA,destB,container){
    if(!container)return;
    var html='<div class="vg-tow-grid">';
    JB.TRAVEL_TYPES.forEach(function(tt){
      var sA=destA.scores[tt.key]||0,sB=destB.scores[tt.key]||0;
      var total=sA+sB||1;
      var pA=(sA/total*100).toFixed(1),pB=(sB/total*100).toFixed(1);
      var lA=(JB.SCORE_LABELS&&JB.SCORE_LABELS[sA])||sA+'/5';
      var lB=(JB.SCORE_LABELS&&JB.SCORE_LABELS[sB])||sB+'/5';
      html+='<div class="vg-tow-row" data-score-key="'+tt.key+'">';
      html+='<div class="vg-tow-hd">'+tt.icon+' '+esc(tt.label)+'</div>';
      html+='<div class="vg-tow-arena">';
      html+='<div class="vg-tow-lbl vg-tow-lbl-a">'+esc(destA.flag)+'<br>'+esc(lA)+'</div>';
      html+='<div class="vg-tow-bar-wrap"><div class="vg-tow-bar">';
      html+='<div class="vg-tow-fill-a" style="width:0%" data-w="'+pA+'%"></div>';
      html+='<div class="vg-tow-fill-b" style="width:0%" data-w="'+pB+'%"></div>';
      html+='<div class="vg-tow-knot" style="left:50%" data-left="'+pA+'%"></div>';
      html+='</div></div>';
      html+='<div class="vg-tow-lbl vg-tow-lbl-b">'+esc(destB.flag)+'<br>'+esc(lB)+'</div>';
      html+='</div></div>';
    });
    html+='</div>'; container.innerHTML=html;
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      container.querySelectorAll('.vg-tow-fill-a').forEach(function(el){el.style.width=el.dataset.w;});
      container.querySelectorAll('.vg-tow-fill-b').forEach(function(el){el.style.width=el.dataset.w;});
      container.querySelectorAll('.vg-tow-knot').forEach(function(el){el.style.left=el.dataset.left;});
    });});
  }

  /* ═══════════════════════════════════════════════
     RENDER: HOTEL TABS
  ═══════════════════════════════════════════════ */
  function renderHotelTabs(destA,destB,container){
    if(!container)return;
    var tabs=[];
    var maxLen=Math.max(destA.ctaCards.length,destB.ctaCards.length);
    for(var i=0;i<maxLen&&tabs.length<4;i++){
      if(destA.ctaCards[i]&&tabs.length<4) tabs.push({card:destA.ctaCards[i],dest:destA});
      if(destB.ctaCards[i]&&tabs.length<4) tabs.push({card:destB.ctaCards[i],dest:destB});
    }
    var html='<div class="vg-htabs">';
    tabs.forEach(function(item,idx){
      var ids=JSON.stringify(item.card.giataIds.filter(function(id){return id;}));
      html+='<button class="vg-htab'+(idx===0?' active':'')+'" data-ids=\''+esc(ids)+'\' onclick="(function(btn,ids){document.querySelectorAll(\'.vg-htab\').forEach(function(b){b.classList.remove(\'active\')});btn.classList.add(\'active\');if(window.hcLoadPreset)window.hcLoadPreset(ids);})(this,'+esc(ids)+')">';
      html+=esc(item.dest.flag)+' '+esc(item.card.label);
      html+='</button>';
    });
    html+='</div>'; container.innerHTML=html;
    if(tabs.length>0){
      var firstIds=tabs[0].card.giataIds.filter(function(id){return id;});
      setTimeout(function(){if(window.hcLoadPreset)window.hcLoadPreset(firstIds);},200);
    }
  }

  /* ═══════════════════════════════════════════════
     INIT: FAQ ACCORDION
  ═══════════════════════════════════════════════ */
  function initFaqAccordion(){
    document.querySelectorAll('.faq-item').forEach(function(item){
      var q=item.querySelector('.faq-q'),a=item.querySelector('.faq-a');
      if(!q||!a)return;
      q.addEventListener('click',function(){
        var isOpen=item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function(i){i.classList.remove('open');});
        if(!isOpen)item.classList.add('open');
      });
    });
  }

  /* ═══════════════════════════════════════════════
     INIT: HERO IMAGES
  ═══════════════════════════════════════════════ */
  function setHeroImages(destA,destB){
    var imgA=document.querySelector('[data-vg-hero-a]');
    var imgB=document.querySelector('[data-vg-hero-b]');
    if(imgA&&destA.heroImage)imgA.src=destA.heroImage;
    if(imgB&&destB.heroImage)imgB.src=destB.heroImage;
  }

  /* ═══════════════════════════════════════════════
     MAIN: initVergleich(pairKey)
  ═══════════════════════════════════════════════ */
  function initVergleich(pairKey){
    injectCSS();
    var pair=JB.PAIRS[pairKey];
    if(!pair){console.error('[VergleichEngine] Unbekanntes Paar:',pairKey);return;}
    var destA=JB.DESTINATIONS[pair.destA],destB=JB.DESTINATIONS[pair.destB];
    if(!destA||!destB){console.error('[VergleichEngine] Unbekanntes Ziel:',pair.destA,pair.destB);return;}

    setHeroImages(destA,destB);
    document.querySelectorAll('[data-dest-a]').forEach(function(el){el.textContent=destA.name;});
    document.querySelectorAll('[data-dest-b]').forEach(function(el){el.textContent=destB.name;});
    document.querySelectorAll('[data-dest-a-flag]').forEach(function(el){el.textContent=destA.flag;});
    document.querySelectorAll('[data-dest-b-flag]').forEach(function(el){el.textContent=destB.flag;});
    document.querySelectorAll('[data-dest-a-tagline]').forEach(function(el){el.textContent=destA.tagline;});
    document.querySelectorAll('[data-dest-b-tagline]').forEach(function(el){el.textContent=destB.tagline;});

    var fazitEl=document.getElementById('vg-ki-fazit');
    if(fazitEl)renderKiFazit(pair.default_ki_fazit,fazitEl);

    var scoresEl=document.getElementById('vg-scores');
    if(scoresEl)renderTugOfWar(destA,destB,scoresEl);

    if(fazitEl)renderTravelTypes(pair,destA,destB,fazitEl,scoresEl);

    var tableEl=document.getElementById('vg-table');
    if(tableEl)renderCriteriaCards(destA,destB,tableEl);

    var ctaEl=document.getElementById('vg-cta');
    if(ctaEl)renderHotelTabs(destA,destB,ctaEl);

    initFaqAccordion();
  }

  JB.initVergleich=initVergleich;

})(window);
