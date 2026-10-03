/*
 * app.js — routing, header, Robin-Münzen. Loaded last.
 */
(function (root) {
  'use strict';
  var BB = root.BB, U = BB.ui, h = U.h, P = BB.platform, S = BB.screens;

  var progress = new BB.Progress(P.childId);
  var main = document.getElementById('main');
  var backBtn = document.getElementById('back'), appsLink = document.getElementById('apps-link');
  if (P.homeUrl) { appsLink.href = P.homeUrl; if (P.guest) appsLink.textContent = '‹ Start'; } else appsLink.hidden = true;
  U.useSettings(function () { return progress.settings(); });

  var onLeave = null;
  var app = {
    progress: progress, platform: P, parentOk: false,
    robin: function (pose, size) { return P.robin(pose, size); },
    setView: function (node, opts) {
      opts = opts || {};
      if (onLeave) { try { onLeave(); } catch (e) { /* ignore */ } }
      onLeave = opts.onBack || null;
      main.innerHTML = ''; main.appendChild(node);
      backBtn.hidden = !opts.back;
      window.scrollTo(0, 0);
    },
    go: function (route) { if (location.hash !== '#/' + route) location.hash = '#/' + route; else render(); },
    start: start,
    applySettings: applySettings
  };
  BB.app = app;

  function applySettings() { document.documentElement.classList.toggle('font-dyslexic', progress.settings().font === 'dyslexic'); }
  applySettings();
  backBtn.addEventListener('click', function () { BB.speech.stop(); app.go('home'); });

  // ---------------------------------------------------------------- Robin-Münzen
  var pill = document.getElementById('coin-pill'), coinsEl = document.getElementById('coins');
  function showCoins(bump) {
    if (!P.coins.available) return;
    pill.hidden = false; coinsEl.textContent = P.coins.balance();
    if (bump) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  }
  showCoins();
  app.coinsOn = function () { return P.coins.available; };
  // end of a round: one entry on the family balance, one activity (streaks)
  app.reward = function (sum) {
    var n = sum.total ? P.coins.add(sum.total, { heute: 'Heute geübt', pruefung: 'Prüfungstraining', fehler: 'Fehler verbessert', schnell: 'Schnelltraining', lernen: 'Gelernt' }[sum.mode] || 'Brüche geübt') : 0;
    if (n) progress.logCoins(n, sum.mode);
    if (sum.n) P.recordActivity({ mode: sum.mode, total: sum.n, right: sum.first, startedAt: sum.startedAt, endedAt: sum.endedAt });
    showCoins(!!n);
    return n;
  };
  app.bonus = function (amount, reason) { var n = P.coins.add(amount, reason); if (n) { progress.logCoins(n, reason); showCoins(true); } return n; };

  // ---------------------------------------------------------------- rounds
  var TITLES = { heute: '▶ Heute üben', ueben: '🔁 Üben', schnell: '⚡ Schnelltraining', sach: '🌍 Sachaufgaben', bild: '🖼️ Bildtraining',
                 pruefung: '📝 Prüfungstraining', fehler: '🎯 Fehlertraining', skill: '🔁 Üben' };
  function start(mode, opts) {
    opts = opts || {};
    if (mode === 'fehler' && !progress.doc.wrong.length) {
      return app.setView(h('section', { class: 'menu narrow' }, [h('h1', { class: 'screen-h', text: '🎯 Fehlertraining' }), U.robinSays(app.robin('happy', 64), 'Gerade gibt es keine Fehler zum Verbessern. Super!'),
        h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: 'Heute üben', onclick: function () { start('heute'); } })])]), { back: true });
    }
    var s = BB.session.create(progress, { mode: mode, skill: opts.skill });
    history.replaceState(null, '', '#/runde');
    var title = TITLES[mode] || '';
    if (mode === 'skill') title = '🔁 ' + BB.model.skill(opts.skill).label;
    BB.practice.run(app, s, { title: title, timer: !!opts.timer, again: opts });
  }

  // ---------------------------------------------------------------- router
  function render() {
    var r = (location.hash || '').replace(/^#\/?/, '');
    BB.speech.stop();
    if (!r || r === 'home') return S.home(app);
    if (r === 'lernen') return S.lernen(app);
    if (/^lernen\/[A-H]$/.test(r)) return BB.lessons.play(app, r.slice(-1));
    if (r === 'ueben') return S.ueben(app);
    if (r === 'schnell') return S.schnell(app);
    if (/^start\//.test(r)) return start(r.slice(6));
    if (r === 'streifen') return S.streifen(app);
    if (r === 'werkstatt') return S.werkstatt(app);
    if (r === 'eltern') return S.parent(app);
    if (r === 'runde') return S.home(app);           // a reload during a round → start page
    S.home(app);
  }
  window.addEventListener('hashchange', render);
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
})(typeof window !== 'undefined' ? window : globalThis);
