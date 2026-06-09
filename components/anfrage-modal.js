/**
 * JetztBuchbar – Anfrage Modal (shared component)
 * Injects the modal CSS, HTML and EmailJS logic into any page.
 * Trigger: any element with [data-anfrage] attribute.
 *   data-name  → destination / hotel name shown in modal
 *   data-stars → optional star string (e.g. "4 ★")
 * Also exposes window.openAnfrageModal(name, stars) for programmatic use.
 */
(function () {
  'use strict';

  /* ── 1. CSS ──────────────────────────────────────────────────────── */
  var css = [
    '.hdam-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem}',
    '.hdam-box{background:#1a1a1a;border:1px solid var(--accent,#00c896);border-radius:16px;padding:1.75rem 1.5rem;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;position:relative}',
    '.hdam-close{position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--text-muted,rgba(255,255,255,.5));font-size:1.5rem;cursor:pointer;line-height:1;padding:.1rem .4rem}',
    '.hdam-close:hover{color:var(--text,#f0f0f0)}',
    '.hdam-title{font-size:1.15rem;font-weight:800;color:var(--accent,#00c896);margin-bottom:.3rem}',
    '.hdam-hotel-lbl{font-size:.82rem;color:var(--text-muted,rgba(255,255,255,.5));margin-bottom:1.2rem;padding-bottom:1rem;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.hdam-row{margin-bottom:.9rem}',
    '.hdam-row label{display:block;font-size:.72rem;color:var(--text-muted,rgba(255,255,255,.5));margin-bottom:.3rem;font-weight:600;letter-spacing:.3px}',
    '.hdam-row input,.hdam-row select{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:.6rem .8rem;color:var(--text,#f0f0f0);font-size:.88rem;transition:border-color .2s;box-sizing:border-box}',
    '.hdam-row input:focus,.hdam-row select:focus{outline:none;border-color:var(--accent,#00c896)}',
    '.hdam-row select option{background:#1a1a1a}',
    '.hdam-row-2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}',
    '.hdam-row-2>div input{width:100%}',
    '.hdam-submit{width:100%;background:var(--accent,#00c896);color:#0a0a0a;border:none;border-radius:10px;padding:.85rem;font-weight:800;font-size:.95rem;cursor:pointer;transition:opacity .2s;margin-top:.4rem}',
    '.hdam-submit:hover{opacity:.88}',
    '.hdam-submit:disabled{opacity:.5;cursor:not-allowed}',
    '.hdam-success{text-align:center;padding:1.5rem 0}',
    '.hdam-success-icon{font-size:2.5rem;margin-bottom:.75rem}',
    '.hdam-success h4{font-size:1.1rem;color:var(--accent,#00c896);margin-bottom:.5rem}',
    '.hdam-success p{font-size:.85rem;color:var(--text-muted,rgba(255,255,255,.5));line-height:1.5}',
    '.hdam-error{background:rgba(255,80,80,.1);border:1px solid rgba(255,80,80,.3);border-radius:8px;padding:.7rem;font-size:.78rem;color:#ff8888;margin-top:.5rem}',
    '.hdam-section-lbl{font-size:.68rem;font-weight:700;color:var(--accent,#00c896);text-transform:uppercase;letter-spacing:.9px;margin:1.1rem 0 .65rem;padding-top:.9rem;border-top:1px solid rgba(255,255,255,.07)}',
    '.hdam-section-lbl:first-child{margin-top:0;border-top:none;padding-top:0}',
    '.hdam-ages-grid{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.5rem}',
    '.hdam-ages-grid input{width:68px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:.55rem .5rem;color:var(--text,#f0f0f0);font-size:.88rem;text-align:center;box-sizing:border-box}',
    '.hdam-ages-grid input:focus{outline:none;border-color:var(--accent,#00c896)}',
    '.hdam-ages-hint{font-size:.7rem;color:var(--text-muted,rgba(255,255,255,.5));margin-bottom:.7rem}',
    '.hdam-radio-row{display:flex;gap:1rem;margin-top:.25rem;flex-wrap:wrap}',
    '.hdam-radio-lbl{display:flex;align-items:center;gap:.4rem;font-size:.88rem;color:var(--text,#f0f0f0);cursor:pointer;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.5rem .85rem;transition:border-color .2s}',
    '.hdam-radio-lbl:has(input:checked){border-color:var(--accent,#00c896);color:var(--accent,#00c896)}',
    '.hdam-radio-lbl input[type=radio]{accent-color:var(--accent,#00c896)}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── 2. Modal HTML ───────────────────────────────────────────────── */
  var tpl = [
    '<div id="jb-anfrage-modal" class="hdam-overlay" style="display:none" role="dialog" aria-modal="true" aria-labelledby="jbam-title">',
    '<div class="hdam-box">',
    '<button class="hdam-close" id="jbam-close" aria-label="Schlie\u00dfen">\u00d7</button>',
    '<h3 class="hdam-title" id="jbam-title">Kostenloses Angebot anfordern</h3>',
    '<p class="hdam-hotel-lbl" id="jbam-lbl"></p>',
    '<form id="jbam-form" novalidate>',
    '<div class="hdam-section-lbl">\ud83d\udcc5 Reisedaten</div>',
    '<div class="hdam-row hdam-row-2">',
    '<div><label for="jbam-checkin">Check-in *</label><input type="date" id="jbam-checkin" required></div>',
    '<div><label for="jbam-checkout">Check-out *</label><input type="date" id="jbam-checkout" required></div>',
    '</div>',
    '<div class="hdam-section-lbl">\ud83d\udc65 Reisende</div>',
    '<div class="hdam-row hdam-row-2">',
    '<div><label for="jbam-adults">Erwachsene *</label><select id="jbam-adults" required>',
    '<option value="1">1 Erwachsener</option><option value="2" selected>2 Erwachsene</option>',
    '<option value="3">3 Erwachsene</option><option value="4">4 Erwachsene</option>',
    '<option value="5">5 Erwachsene</option><option value="6">6 Erwachsene</option>',
    '</select></div>',
    '<div><label for="jbam-children">Kinder (unter 18)</label><select id="jbam-children">',
    '<option value="0" selected>Keine</option><option value="1">1 Kind</option>',
    '<option value="2">2 Kinder</option><option value="3">3 Kinder</option><option value="4">4 Kinder</option>',
    '</select></div>',
    '</div>',
    '<div id="jbam-ages-wrap" style="display:none">',
    '<p class="hdam-ages-hint">Alter der Kinder bei Reiseantritt (0\u201317\u00a0Jahre)</p>',
    '<div class="hdam-ages-grid" id="jbam-ages-grid"></div>',
    '</div>',
    '<div class="hdam-section-lbl">\u2708\ufe0f Flug</div>',
    '<div class="hdam-row"><label>Flug gew\u00fcnscht?</label>',
    '<div class="hdam-radio-row">',
    '<label class="hdam-radio-lbl"><input type="radio" name="jbam-flight" value="nein" checked> Nur Hotel</label>',
    '<label class="hdam-radio-lbl"><input type="radio" name="jbam-flight" value="ja"> Mit Flug</label>',
    '</div></div>',
    '<div id="jbam-airport-wrap" class="hdam-row" style="display:none">',
    '<label for="jbam-airport">Abflughafen</label>',
    '<input type="text" id="jbam-airport" placeholder="z.\u00a0B. Frankfurt, M\u00fcnchen, Wien\u00a0\u2026">',
    '</div>',
    '<div class="hdam-section-lbl">\ud83d\udce7 Kontaktdaten</div>',
    '<div class="hdam-row"><label for="jbam-name">Name *</label>',
    '<input type="text" id="jbam-name" required placeholder="Ihr Name" autocomplete="name"></div>',
    '<div class="hdam-row"><label for="jbam-email">E-Mail *</label>',
    '<input type="email" id="jbam-email" required placeholder="ihre@email.de" autocomplete="email"></div>',
    '<div id="jbam-err" class="hdam-error" style="display:none"></div>',
    '<button type="submit" class="hdam-submit" id="jbam-submit">Angebot anfordern \u2192</button>',
    '</form>',
    '<div id="jbam-success" style="display:none" class="hdam-success">',
    '<div class="hdam-success-icon">\u2705</div>',
    '<h4>Anfrage gesendet!</h4>',
    '<p>Wir melden uns innerhalb von 24\u00a0Stunden mit einem pers\u00f6nlichen Angebot bei Ihnen.</p>',
    '</div>',
    '</div></div>'
  ].join('');

  var wrapper = document.createElement('div');
  wrapper.innerHTML = tpl;
  document.body.appendChild(wrapper.firstChild);

  /* ── 3. Refs ─────────────────────────────────────────────────────── */
  var modal    = document.getElementById('jb-anfrage-modal');
  var form     = document.getElementById('jbam-form');
  var btnClose = document.getElementById('jbam-close');
  var btnSub   = document.getElementById('jbam-submit');
  var errEl    = document.getElementById('jbam-err');
  var success  = document.getElementById('jbam-success');
  var lbl      = document.getElementById('jbam-lbl');

  /* ── 4. EmailJS ──────────────────────────────────────────────────── */
  var EJS_KEY    = 'rJZMY5EEUvbFNQH6t';
  var EJS_SVC    = 'service_s34phfh';
  var EJS_NOTIFY = 'template_nfdnxi4';
  var EJS_REPLY  = 'template_69aohml';

  function ensureEmailJS(cb) {
    if (typeof emailjs !== 'undefined') {
      emailjs.init(EJS_KEY);
      cb();
      return;
    }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = function () { emailjs.init(EJS_KEY); cb(); };
    document.head.appendChild(s);
  }

  ensureEmailJS(function () { /* ready */ });

  /* ── 5. Open / Close ─────────────────────────────────────────────── */
  var todayStr = new Date().toISOString().split('T')[0];

  function resetForm() {
    form.reset();
    form.style.display = '';
    success.style.display = 'none';
    errEl.style.display = 'none';
    btnSub.disabled = false;
    btnSub.textContent = 'Angebot anfordern \u2192';
    document.getElementById('jbam-checkin').min  = todayStr;
    document.getElementById('jbam-checkout').min = todayStr;
    document.getElementById('jbam-ages-wrap').style.display = 'none';
    document.getElementById('jbam-ages-grid').innerHTML = '';
    document.getElementById('jbam-airport-wrap').style.display = 'none';
    var radios = document.querySelectorAll('input[name="jbam-flight"]');
    if (radios.length) radios[0].checked = true;
    document.getElementById('jbam-children').value = '0';
    document.getElementById('jbam-adults').value   = '2';
  }

  window.openAnfrageModal = function (name, stars) {
    resetForm();
    lbl.textContent = stars ? name + ' \u2022 ' + stars : name;
    modal._jbName  = name  || '';
    modal._jbStars = stars || '';
    modal.style.display = '';
    document.body.style.overflow = 'hidden';
    document.getElementById('jbam-checkin').focus();
  };

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  btnClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.style.display !== 'none') closeModal(); });

  /* ── 6. Dynamic interactions ─────────────────────────────────────── */
  document.getElementById('jbam-checkin').addEventListener('change', function () {
    document.getElementById('jbam-checkout').min = this.value || todayStr;
  });

  document.getElementById('jbam-children').addEventListener('change', function () {
    var n    = parseInt(this.value, 10);
    var wrap = document.getElementById('jbam-ages-wrap');
    var grid = document.getElementById('jbam-ages-grid');
    grid.innerHTML = '';
    if (n > 0) {
      for (var i = 1; i <= n; i++) {
        var inp = document.createElement('input');
        inp.type = 'number'; inp.min = '0'; inp.max = '17';
        inp.placeholder = 'Kind ' + i;
        inp.id = 'jbam-age-' + i;
        inp.setAttribute('aria-label', 'Alter Kind ' + i);
        grid.appendChild(inp);
      }
      wrap.style.display = '';
    } else {
      wrap.style.display = 'none';
    }
  });

  document.querySelectorAll('input[name="jbam-flight"]').forEach(function (r) {
    r.addEventListener('change', function () {
      document.getElementById('jbam-airport-wrap').style.display =
        this.value === 'ja' ? '' : 'none';
    });
  });

  /* ── 7. Delegation – [data-anfrage] clicks ───────────────────────── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-anfrage]');
    if (!el) return;
    e.preventDefault();
    var name  = el.getAttribute('data-name')  || document.title.split('|')[0].trim();
    var stars = el.getAttribute('data-stars') || '';
    window.openAnfrageModal(name, stars);
  });

  /* ── 8. Submit ───────────────────────────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name     = document.getElementById('jbam-name').value.trim();
    var email    = document.getElementById('jbam-email').value.trim();
    var checkin  = document.getElementById('jbam-checkin').value;
    var checkout = document.getElementById('jbam-checkout').value;
    var adults   = document.getElementById('jbam-adults').value;
    var childN   = parseInt(document.getElementById('jbam-children').value, 10);

    if (!name || !email || !checkin || !checkout) {
      errEl.textContent = 'Bitte alle Pflichtfelder (*) ausf\u00fcllen.';
      errEl.style.display = '';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'Bitte eine g\u00fcltige E-Mail-Adresse eingeben.';
      errEl.style.display = '';
      return;
    }
    errEl.style.display = 'none';

    // Personen-String
    var personsStr = adults + (adults === '1' ? ' Erwachsener' : ' Erwachsene');
    if (childN > 0) {
      var ages = [];
      for (var i = 1; i <= childN; i++) {
        var ageEl = document.getElementById('jbam-age-' + i);
        if (ageEl && ageEl.value !== '') ages.push(ageEl.value + ' J.');
      }
      personsStr += ', ' + childN + (childN === 1 ? ' Kind' : ' Kinder');
      if (ages.length) personsStr += ' (Alter: ' + ages.join(', ') + ')';
    }

    // Flug-String
    var flightVal = document.querySelector('input[name="jbam-flight"]:checked').value;
    var flightStr = flightVal === 'ja'
      ? '\u2708 Ja, ab ' + (document.getElementById('jbam-airport').value.trim() || '\u2013')
      : 'Kein Flug gew\u00fcnscht';

    var params = {
      hotel_name:  modal._jbName  || '',
      hotel_stars: modal._jbStars || '\u2013',
      hotel_url:   window.location.href,
      user_name:   name,
      user_email:  email,
      user_phone:  flightStr,
      checkin:     checkin,
      checkout:    checkout,
      persons:     personsStr
    };

    btnSub.disabled = true;
    btnSub.textContent = 'Wird gesendet \u2026';

    function doSend() {
      Promise.all([
        emailjs.send(EJS_SVC, EJS_NOTIFY, params),
        emailjs.send(EJS_SVC, EJS_REPLY,  params)
      ]).then(function () {
        form.style.display = 'none';
        success.style.display = '';
        setTimeout(closeModal, 6000);
      }).catch(function () {
        errEl.textContent = 'Fehler beim Senden. Bitte schreib uns direkt: sales@jetztbuchbar.de';
        errEl.style.display = '';
        btnSub.disabled = false;
        btnSub.textContent = 'Angebot anfordern \u2192';
      });
    }

    if (typeof emailjs === 'undefined') {
      ensureEmailJS(doSend);
    } else {
      doSend();
    }
  });
})();
