/*
 * screens.js — home, Lernen (module list), Üben (topic chooser), Werkstatt, Streifentafel, Eltern.
 */
(function (root) {
  'use strict';
  var BB = root.BB, U = BB.ui, h = U.h, T = BB.text, M = BB.model, F = BB.frac;

  var MODES = [
    { id: 'ueben',    icon: '🔁', title: 'Üben',              sub: 'Thema wählen oder gemischt' },
    { id: 'schnell',  icon: '⚡', title: 'Schnelltraining',   sub: '8 kurze Aufgaben' },
    { id: 'sach',     icon: '🌍', title: 'Sachaufgaben',      sub: 'Pizza, Geld, Liter, Kilometer …' },
    { id: 'bild',     icon: '🖼️', title: 'Bildtraining',      sub: 'Brüche sehen und markieren' },
    { id: 'pruefung', icon: '📝', title: 'Prüfungstraining',  sub: '12 gemischte Aufgaben, Hilfe erst danach' },
    { id: 'fehler',   icon: '🎯', title: 'Fehlertraining',    sub: 'Deine Fehler – jetzt richtig' }
  ];

  function home(app) {
    var pr = app.progress, P = app.platform, days = pr.daysToGoal(), st = pr.settings();
    var today = pr.todayCount(), wrongN = pr.doc.wrong.length;
    var countdown = days == null ? '' : days > 1 ? 'Noch ' + days + ' Tage bis ' + goalPhrase(st) + '.' : days === 1 ? 'Morgen ist ' + st.goalLabel + '!' : days === 0 ? 'Heute ist ' + st.goalLabel + ' – viel Erfolg!' : '';
    var line = today ? 'Heute schon ' + today + (today === 1 ? ' Aufgabe' : ' Aufgaben') + ' geschafft. Stark!' : 'Für heute: ca. 10–15 Minuten.';
    var v = h('section', { class: 'home' }, [
      h('div', { class: 'hero' }, [app.robin(today ? 'happy' : 'normal', 92), h('div', {}, [
        h('h1', { text: 'Hallo ' + P.childName + '!' }),
        countdown ? h('p', { class: 'countdown', text: '📅 ' + countdown }) : null,
        h('p', { class: 'hero-line', text: line })])]),
      h('button', { class: 'today-btn', type: 'button', 'data-menu': 'heute', onclick: function () { app.start('heute'); } }, [
        h('span', { class: 'tb-icon', text: '▶' }),
        h('span', { class: 'tb-text' }, [h('span', { class: 'tb-title', text: 'Heute üben' }), h('span', { class: 'tb-sub', text: '10 Aufgaben: Wiederholen · Bilder · Umwandeln · Sachaufgaben · Warum?' })])]),
      wrongN >= 3 ? h('button', { class: 'problem-card', type: 'button', 'data-menu': 'fehler-card', onclick: function () { app.start('fehler'); } }, [
        h('span', { class: 'pc-icon', text: '🎯' }), h('span', {}, [h('b', { text: 'Fehlertraining' }), h('span', { class: 'note', text: ' – ' + wrongN + ' Aufgaben, die du jetzt verbessern kannst' })])]) : null,
      h('h2', { class: 'group-h', text: '📘 Lernen' }),
      h('div', { class: 'tiles modules' }, M.MODULES.map(function (m) {
        var done = pr.moduleDone(m.id), mast = m.skills.map(function (s) { var x = pr.doc.skills[s] || {}; return (x.m || 0) * Math.min(1, (x.n || 0) / 8); }), avg = mast.reduce(function (a, b) { return a + b; }, 0) / mast.length;
        return h('button', { class: 'tile module' + (done ? ' done' : ''), type: 'button', 'data-module': m.id, onclick: function () { app.go('lernen/' + m.id); } }, [
          h('span', { class: 'tile-icon', text: m.icon }), h('span', { class: 'tile-title', text: m.id + ' · ' + m.title }),
          h('span', { class: 'tile-sub' }, [done ? h('span', { class: 'tag ok', text: '✓ gelernt' }) : h('span', { class: 'tag', text: 'neu' }), U.bar(avg)])]);
      })),
      h('h2', { class: 'group-h', text: '✏️ Üben' }),
      h('div', { class: 'tiles' }, MODES.map(function (m) {
        return h('button', { class: 'tile', type: 'button', 'data-menu': m.id, onclick: function () { app.go(m.id === 'ueben' ? 'ueben' : m.id === 'schnell' ? 'schnell' : 'start/' + m.id); } }, [
          h('span', { class: 'tile-icon', text: m.icon }), h('span', { class: 'tile-title', text: m.title }), h('span', { class: 'tile-sub', text: m.id === 'fehler' ? (wrongN ? wrongN + ' Aufgaben' : 'gerade keine Fehler') : m.sub })]);
      })),
      h('h2', { class: 'group-h', text: '🧰 Werkzeuge' }),
      h('div', { class: 'tiles' }, [
        h('button', { class: 'tile', type: 'button', 'data-menu': 'streifen', onclick: function () { app.go('streifen'); } }, [h('span', { class: 'tile-icon', text: '📏' }), h('span', { class: 'tile-title', text: 'Streifentafel' }), h('span', { class: 'tile-sub', text: 'Welche Brüche sind gleich groß?' })]),
        h('button', { class: 'tile', type: 'button', 'data-menu': 'werkstatt', onclick: function () { app.go('werkstatt'); } }, [h('span', { class: 'tile-icon', text: '✂️' }), h('span', { class: 'tile-title', text: 'Verteil-Werkstatt' }), h('span', { class: 'tile-sub', text: 'Pizzen, Kuchen, Schokolade gerecht schneiden' })])])
    ]);
    app.setView(v);
  }
  function goalPhrase(st) { return st.goalLabel === 'Schulbeginn' ? 'zum Schulbeginn' : 'zur ' + st.goalLabel; }

  function lernen(app) {
    var pr = app.progress;
    app.setView(h('section', { class: 'menu' }, [h('h1', { class: 'screen-h', text: '📘 Lernen' }), h('p', { class: 'screen-sub', text: 'Jedes Modul: Erklärung, Beispiel, eine Aufgabe mit Robin – dann du.' }),
      h('div', { class: 'list' }, M.MODULES.map(function (m) {
        return h('button', { class: 'list-item', type: 'button', 'data-module': m.id, onclick: function () { app.go('lernen/' + m.id); } }, [h('span', { class: 'li-icon', text: m.icon }),
          h('span', { class: 'li-text' }, [h('b', { text: m.id + ' · ' + m.title }), h('span', { class: 'note', text: m.skills.map(function (s) { return M.skill(s).label; }).join(' · ') })]),
          pr.moduleDone(m.id) ? h('span', { class: 'tag ok', text: '✓' }) : null]);
      }))]), { back: true });
  }

  function ueben(app) {
    var pr = app.progress, groups = {};
    pr.overview().forEach(function (o) { (groups[o.group] = groups[o.group] || []).push(o); });
    var v = h('section', { class: 'menu' }, [h('h1', { class: 'screen-h', text: '🔁 Üben' }),
      h('button', { class: 'today-btn small', type: 'button', 'data-menu': 'gemischt', onclick: function () { app.start('ueben'); } }, [h('span', { class: 'tb-icon', text: '🎲' }),
        h('span', { class: 'tb-text' }, [h('span', { class: 'tb-title', text: 'Gemischt' }), h('span', { class: 'tb-sub', text: 'Robin wählt, was du gerade brauchst' })])])]);
    Object.keys(groups).forEach(function (g) {
      v.appendChild(h('h2', { class: 'group-h', text: g }));
      v.appendChild(h('div', { class: 'list' }, groups[g].map(function (o) {
        return h('button', { class: 'list-item skill', type: 'button', 'data-skill': o.id, onclick: function () { app.start('skill', { skill: o.id }); } }, [
          h('span', { class: 'li-text' }, [h('b', { text: o.label }), h('span', { class: 'note', text: o.mastery.label + (o.n ? ' · ' + o.n + ' Aufgaben' : '') })]), U.bar(o.bar)]);
      })));
    });
    app.setView(v, { back: true });
  }

  function schnell(app) {
    var st = app.progress.settings();
    app.setView(h('section', { class: 'menu narrow' }, [h('h1', { class: 'screen-h', text: '⚡ Schnelltraining' }), h('p', { class: 'screen-sub', text: '8 kurze Aufgaben. Ohne Zeitdruck – die Stoppuhr ist freiwillig.' }),
      h('div', { class: 'row' }, [
        h('button', { class: 'btn primary', type: 'button', 'data-menu': 'schnell-ohne', text: 'Los – ohne Zeit', onclick: function () { app.progress.setSetting('timer', false); app.start('schnell', { timer: false }); } }),
        h('button', { class: 'btn soft', type: 'button', 'data-menu': 'schnell-mit', text: '⏱️ Mit Stoppuhr', onclick: function () { app.progress.setSetting('timer', true); app.start('schnell', { timer: true }); } })]),
      st.best_schnell ? h('p', { class: 'note', text: 'Deine Bestzeit (alles richtig): ' + Math.floor(st.best_schnell / 60) + ':' + ('0' + st.best_schnell % 60).slice(-2) }) : null]), { back: true });
  }

  function werkstatt(app) {
    var a = 3, b = 4, it = 'pizza', box = h('div', { class: 'ws-free' }), fb = h('div', { class: 'feedback' });
    var ITEMS = ['pizza', 'kuchen', 'pfannkuchen', 'apfel', 'schokolade', 'baguette'];
    function stepper(label, get, set, min, max) {
      var val = h('b', { class: 'stp-v', text: String(get()) });
      return h('div', { class: 'stepper' }, [h('span', { text: label }), h('button', { class: 'btn soft small', type: 'button', text: '−', 'aria-label': label + ' weniger', onclick: function () { if (get() > min) { set(get() - 1); build(); } } }), val,
        h('button', { class: 'btn soft small', type: 'button', text: '+', 'aria-label': label + ' mehr', onclick: function () { if (get() < max) { set(get() + 1); build(); } } })]);
    }
    var ctrl = h('div', { class: 'ws-setup' });
    function build() {
      ctrl.innerHTML = ''; box.innerHTML = ''; fb.innerHTML = '';
      var I = BB.ctx.ITEMS[it];
      ctrl.appendChild(h('div', { class: 'chips' }, ITEMS.map(function (x) { return h('button', { class: 'chip' + (x === it ? ' on' : ''), type: 'button', text: BB.ctx.ITEMS[x].pl, onclick: function () { it = x; build(); } }); })));
      ctrl.appendChild(stepper(I.pl + ':', function () { return a; }, function (x) { a = x; }, 1, 8));
      ctrl.appendChild(stepper('Kinder:', function () { return b; }, function (x) { b = x; }, 2, 12));
      var t = BB.gens.make('werkstatt', 1, { it: it, a: a, b: b, pe: 0 });
      box.appendChild(h('p', { class: 'prompt-small', rich: t.prompt.replace('Robin braucht Hilfe: ', '') }));
      var w = BB.widgets.make(t.answer, function () { chk.click(); });
      box.appendChild(w);
      var chk = h('button', { class: 'btn primary', type: 'button', text: 'Prüfen', onclick: function () {
        var r = t.check(w.value()); fb.innerHTML = '';
        fb.appendChild(h('div', { class: 'fb-box ' + (r.incomplete ? 'info' : r.ok ? 'ok' : 'no') }, [h('p', { class: 'fb-main', rich: r.incomplete ? r.msg : r.ok ? (r.note || '✓ Stimmt! ' + t.solution[0]) : r.msg })]));
      } });
      box.appendChild(h('div', { class: 'row' }, [chk]));
    }
    build();
    app.setView(h('section', { class: 'menu' }, [h('h1', { class: 'screen-h', text: '✂️ Verteil-Werkstatt' }), h('p', { class: 'screen-sub', text: 'Wähle selbst: Was wird geteilt, und wie viele Kinder? Schneide auf verschiedene Arten.' }), ctrl, box, fb]), { back: true });
  }

  function streifen(app) {
    app.setView(h('section', { class: 'menu' }, [h('h1', { class: 'screen-h', text: '📏 Streifentafel' }),
      h('p', { class: 'screen-sub', rich: 'Wie auf deinem Arbeitsblatt. Tippe auf einen Strich: Alle Streifen mit einem Strich an derselben Stelle leuchten – diese Brüche sind *gleich groß*.' }),
      BB.strips.tool({})]), { back: true });
  }

  // ---------------------------------------------------------------- parent page
  function parent(app) {
    var pr = app.progress, P = app.platform;
    if (P.parentHasPin() && !app.parentOk) {
      var inp = h('input', { type: 'password', inputmode: 'numeric', class: 'nbox pin', 'aria-label': 'Eltern-PIN', maxlength: 8 });
      var m = h('p', { class: 'hint' });
      var go = function () { if (P.parentCheck(inp.value)) { app.parentOk = true; parent(app); } else { m.textContent = 'Die PIN stimmt nicht.'; inp.value = ''; } };
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
      app.setView(h('section', { class: 'pin-screen menu narrow' }, [h('h1', { class: 'screen-h', text: 'Elternbereich' }), h('p', { text: P.guest ? 'Bitte die Eltern-PIN eingeben.' : 'Bitte die Eltern-PIN von Robin’s Bobins eingeben.' }),
        h('div', { class: 'row' }, [inp, h('button', { class: 'btn primary', type: 'button', text: 'Öffnen', onclick: go })]), m]), { back: true });
      return setTimeout(function () { inp.focus(); }, 30);
    }
    var s = pr.stats(), st = pr.settings(), mc = pr.misconceptions(), recent = pr.recent(7), ov = pr.overview();
    var statRow = function (label, val) { return h('div', { class: 'pstat' }, [h('b', { text: val }), h('span', { text: label })]); };
    var groups = {}; ov.forEach(function (o) { (groups[o.group] = groups[o.group] || []).push(o); });
    var mastery = h('div', { class: 'mastery' });
    Object.keys(groups).forEach(function (g) {
      mastery.appendChild(h('h3', { text: g }));
      groups[g].forEach(function (o) {
        mastery.appendChild(h('div', { class: 'mrow m-' + o.mastery.key }, [h('span', { class: 'mlabel', text: o.label }), U.bar(o.bar),
          h('span', { class: 'mstate', text: o.mastery.label + (o.n ? ' (' + o.n + ')' : '') })]));
      });
    });
    var maxN = Math.max.apply(null, recent.map(function (r) { return r.n; }).concat([1]));
    var week = h('div', { class: 'week' }, recent.map(function (r) {
      var d = new Date(r.day + 'T12:00:00');
      return h('div', { class: 'wday', title: r.n + ' Aufgaben, ' + r.first + ' gleich richtig' }, [h('span', { class: 'wbar', style: 'height:' + Math.round(r.n / maxN * 60) + 'px' }, [h('span', { class: 'wbar-ok', style: 'height:' + (r.n ? Math.round(r.first / r.n * 100) : 0) + '%' })]),
        h('span', { class: 'wlab', text: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getDay()] }), h('span', { class: 'wn', text: String(r.n) })]);
    }));
    var goal = h('input', { type: 'date', value: st.goalDate || '', 'aria-label': 'Zieldatum' });
    goal.addEventListener('change', function () { pr.setSetting('goalDate', goal.value); });
    var goalLab = h('select', { 'aria-label': 'Was ist an dem Tag?' }, ['Schulbeginn', 'Klassenarbeit', 'Lernkontrolle', 'Test'].map(function (x) { var o = h('option', { value: x, text: x }); if (x === st.goalLabel) o.selected = true; return o; }));
    goalLab.addEventListener('change', function () { pr.setSetting('goalLabel', goalLab.value); });
    var font = h('input', { type: 'checkbox' }); font.checked = st.font === 'dyslexic';
    font.addEventListener('change', function () { pr.setSetting('font', font.checked ? 'dyslexic' : ''); app.applySettings(); });
    var rate = h('select', { 'aria-label': 'Vorlesetempo' }, [['0.65', 'langsam'], ['0.8', 'ruhig'], ['1', 'normal']].map(function (x) { var o = h('option', { value: x[0], text: x[1] }); if (String(st.slowRate) === x[0]) o.selected = true; return o; }));
    rate.addEventListener('change', function () { pr.setSetting('slowRate', parseFloat(rate.value)); });
    var resetArmed = false, resetBtn = h('button', { class: 'btn soft', type: 'button', text: 'Lernstand zurücksetzen' });
    resetBtn.addEventListener('click', function () { if (!resetArmed) { resetArmed = true; resetBtn.textContent = 'Wirklich? Nochmal tippen zum Löschen'; return; } pr.reset(); app.go('home'); });

    app.setView(h('section', { class: 'parent menu' }, [
      h('h1', { class: 'screen-h', text: '👤 Elternbereich – ' + P.childName }),
      h('div', { class: 'card' }, [h('h2', { text: 'Überblick' }), h('div', { class: 'pstats' }, [
        statRow('Übungszeit', s.seconds && s.minutes < 1 ? '< 1 min' : s.minutes + ' min'), statRow('Aufgaben', String(s.tasks)), statRow('gleich richtig', s.firstPct == null ? '–' : s.firstPct + ' %'),
        statRow('nach Fehler selbst verbessert', String(s.corrected)), statRow('mit Tipps gelöst', String(s.hintTasks)), statRow('Lösung angesehen', String(s.solutions)),
        statRow('Tage in Folge', String(s.streak)), statRow('Robin-Münzen hier verdient', String(s.coins))]),
        h('p', { class: 'note', text: '„Gleich richtig“ = beim ersten Versuch ohne Tipp. Bei wenigen Aufgaben sind die Zahlen noch wenig aussagekräftig.' })]),
      h('div', { class: 'card' }, [h('h2', { text: 'Stand nach Thema' }), mastery,
        h('p', { class: 'note', text: '„Sicher“ erst nach mindestens 8 Aufgaben, mit zuletzt fast nur Treffern auf mittlerer oder höherer Stufe.' })]),
      h('div', { class: 'card' }, [h('h2', { text: 'Wiederkehrende Fehler' }),
        mc.length ? h('ul', { class: 'mc' }, mc.map(function (x) { return h('li', { text: x.text }); })) : h('p', { class: 'note', text: s.tasks < 10 ? 'Noch zu wenige Aufgaben für eine Aussage.' : 'Keine wiederkehrenden Fehler – prima.' })]),
      h('div', { class: 'card' }, [h('h2', { text: 'Letzte 7 Tage' }), week, h('p', { class: 'note', text: 'Balkenhöhe = Aufgaben, grün = davon gleich richtig.' })]),
      h('div', { class: 'card settings' }, [h('h2', { text: 'Einstellungen' }),
        h('label', { class: 'set' }, [h('span', { text: 'Countdown bis' }), goalLab, goal]),
        h('label', { class: 'set' }, [font, h('span', { text: 'Schrift OpenDyslexic' })]),
        h('label', { class: 'set' }, [h('span', { text: 'Vorlesen' }), rate]),
        h('p', { class: 'note', text: 'Lernstand und Münzen liegen nur auf diesem Gerät (in diesem Browser).' }),
        resetBtn, h('p', { class: 'note', text: 'Löscht den Lernstand in Bruch-Bobins. Einstellungen und Robin-Münzen bleiben.' })])
    ]), { back: true });
  }

  root.BB.screens = { home: home, lernen: lernen, ueben: ueben, schnell: schnell, werkstatt: werkstatt, streifen: streifen, parent: parent, MODES: MODES };
})(typeof window !== 'undefined' ? window : globalThis);
