/*
 * lab.js — 🔬 Bruch-Labor (Kapitel 2). Two experiments, each concrete → picture → maths:
 *
 *   Erweitern & Kürzen: start with a fraction, cut every piece finer (tap the strip or a button) or join pieces.
 *     The strip, the equation chain {2/3} = {4/6} = {12/18} and the number line update together –
 *     the point on the number line never moves: the value stays the same.
 *   Vergleichen: two fractions as strips and on the number line; "Gleich große Stücke machen" cuts both into the
 *     common denominator, then the numerators can simply be counted.
 *
 * Own page (#/labor) and help during tasks (task.lab = {mode, n, d} or {mode:'vergleichen', a:[n,d], b:[n,d]}).
 */
(function (root) {
  'use strict';
  var BB = root.BB, U = BB.ui, h = U.h, T = BB.text, F = BB.frac, D = BB.draw;
  var MAXD = 48;

  function fq(f) { return '{' + f.n + '/' + f.d + '}'; }
  function stepper(label, get, set, min, max, redraw) {
    var val = h('b', { class: 'stp-v', text: String(get()) });
    return h('div', { class: 'stepper' }, [h('span', { text: label }),
      h('button', { class: 'btn soft small', type: 'button', text: '−', 'aria-label': label + ' kleiner', onclick: function () { if (get() > min()) { set(get() - 1); redraw(); } } }), val,
      h('button', { class: 'btn soft small', type: 'button', text: '+', 'aria-label': label + ' größer', onclick: function () { if (get() < max()) { set(get() + 1); redraw(); } } })]);
  }

  // ---------------------------------------------------------------- Erweitern & Kürzen
  function expandPane(opts) {
    var start = F.make(opts.n || 2, opts.d || 3);
    if (start.d > 24) start = F.reduce(start);
    if (start.d > 24 || start.n > 2 * start.d) start = F.make(2, 3);
    var cur = start, chain = [{ f: start }];
    var pane = h('div', { class: 'lab-pane', 'data-lab': 'erweitern' });
    function cut(k) { if (cur.d * k > MAXD) return; cur = F.expand(cur, k); chain.push({ f: cur, op: '·', k: k }); draw(); }
    function join(k) { var x = F.shrink(cur, k); if (!x) return; cur = x; chain.push({ f: cur, op: ':', k: k }); draw(); }
    function draw() {
      pane.innerHTML = '';
      if (chain.length === 1) {
        pane.appendChild(h('div', { class: 'ws-setup' }, [
          stepper('Zähler', function () { return start.n; }, function (x) { start = F.make(x, start.d); cur = start; chain = [{ f: start }]; }, function () { return 1; }, function () { return start.d * 2; }, draw),
          stepper('Nenner', function () { return start.d; }, function (x) { start = F.make(Math.min(start.n, 2 * x), x); cur = start; chain = [{ f: start }]; }, function () { return 2; }, function () { return 12; }, draw)]));
      } else pane.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn soft small', type: 'button', text: '↺ Neu beginnen', onclick: function () { cur = start; chain = [{ f: start }]; draw(); } })]));
      // picture: the start and now, one above the other – same length, same coloured part
      var rows = [[start.n, start.d, 1, 0, true], [cur.n, cur.d, 1, 1, true]];
      var pic = D.render({ type: 'bars', rows: rows.map(function (r) { return { n: r[0], d: r[1], sub: 1, col: r[3], label: true }; }), lines: true });
      pic.classList.add('lab-tap'); pic.setAttribute('title', 'Tippen: jedes Stück halbieren');
      pic.addEventListener('click', function () { cut(2); });
      pane.appendChild(h('p', { class: 'note', text: 'Oben: so hast du angefangen. Unten: jetzt. Tippe auf die Streifen, um jedes Stück zu halbieren.' }));
      pane.appendChild(pic);
      // the equation chain, last step written out
      var line = chain.map(function (c) { return fq(c.f); }).join(' = '), last = chain[chain.length - 1], prev = chain[chain.length - 2];
      pane.appendChild(h('p', { class: 'lab-chain', rich: line }));
      if (prev) pane.appendChild(h('p', { class: 'lab-step', rich: (last.op === '·' ? 'Erweitert mit ' + last.k + ': ' : 'Gekürzt durch ' + last.k + ': ') + fq(prev.f) + ' = ' + T.fx(prev.f.n, last.op, last.k, prev.f.d) + ' = ' + fq(last.f) +
        (last.op === '·' ? '  – jedes Stück in ' + last.k + ' Teile geschnitten.' : '  – immer ' + last.k + ' Stücke zusammengelegt.') }));
      // actions
      pane.appendChild(h('div', { class: 'lab-actions' }, [h('span', { class: 'lab-lab', text: 'Jedes Stück teilen in' })].concat([2, 3, 4, 5].map(function (k) {
        return h('button', { class: 'btn soft small', type: 'button', 'data-cut': k, text: k + ' Teile', disabled: cur.d * k > MAXD ? true : null, onclick: function () { cut(k); } }); }))));
      var cds = F.commonDivisors(cur.n, cur.d).filter(function (x) { return x > 1; }).slice(0, 5);
      pane.appendChild(h('div', { class: 'lab-actions' }, [h('span', { class: 'lab-lab', text: 'Stücke zusammenlegen (kürzen)' })].concat(cds.length ? cds.map(function (k) {
        return h('button', { class: 'btn soft small', type: 'button', 'data-join': k, text: 'je ' + k, onclick: function () { join(k); } }); }) : [h('span', { class: 'note', text: '– geht nicht mehr: ' + T.plain(fq(cur)) + ' ist vollständig gekürzt.' })])));
      // number line: the point does not move
      pane.appendChild(D.render({ type: 'numline', max: Math.max(1, Math.ceil(F.value(cur))), ticks: [cur.d], marks: [{ n: start.n, d: start.d, col: 0 }, { n: cur.n, d: cur.d, col: 1, below: true }] }));
      pane.appendChild(h('p', { class: 'lab-msg', rich: chain.length > 1 ? 'Der Punkt auf dem Zahlenstrahl bleibt an *derselben Stelle*: ' + fq(start) + ' und ' + fq(cur) + ' sind gleich viel.' : 'Probiere: Teile die Stücke feiner – oder lege Stücke zusammen.' }));
    }
    draw();
    return pane;
  }

  // ---------------------------------------------------------------- Vergleichen
  function comparePane(opts) {
    var a = opts.a ? F.make(opts.a[0], opts.a[1]) : F.make(3, 4), b = opts.b ? F.make(opts.b[0], opts.b[1]) : F.make(5, 6), same = false;
    var pane = h('div', { class: 'lab-pane', 'data-lab': 'vergleichen' });
    function draw() {
      pane.innerHTML = '';
      var L = F.lcm(a.d, b.d), A = a.n * L / a.d, B = b.n * L / b.d, c = F.cmp(a, b), canCut = L <= MAXD && Math.max(F.value(a), F.value(b)) <= 2;
      function set(which, key) { return function (x) { var f = which === 'a' ? a : b, g = key === 'n' ? F.make(x, f.d) : F.make(Math.min(f.n, 2 * x), x); if (which === 'a') a = g; else b = g; same = false; }; }
      pane.appendChild(h('div', { class: 'ws-setup lab-two' }, [
        h('div', { class: 'lab-frac a' }, [h('b', { text: 'Bruch A' }), stepper('Zähler', function () { return a.n; }, set('a', 'n'), function () { return 1; }, function () { return 2 * a.d; }, draw), stepper('Nenner', function () { return a.d; }, set('a', 'd'), function () { return 2; }, function () { return 12; }, draw)]),
        h('div', { class: 'lab-frac b' }, [h('b', { text: 'Bruch B' }), stepper('Zähler', function () { return b.n; }, set('b', 'n'), function () { return 1; }, function () { return 2 * b.d; }, draw), stepper('Nenner', function () { return b.d; }, set('b', 'd'), function () { return 2; }, function () { return 12; }, draw)])]));
      if (canCut || !same) pane.appendChild(D.render({ type: 'bars', rows: [{ n: a.n, d: a.d, sub: same ? L / a.d : 1, col: 0 }, { n: b.n, d: b.d, sub: same ? L / b.d : 1, col: 1 }], lines: true }));
      pane.appendChild(D.render({ type: 'numline', max: Math.max(1, Math.ceil(Math.max(F.value(a), F.value(b)))), ticks: same ? [a.d, b.d] : [], marks: [{ n: a.n, d: a.d, col: 0 }, { n: b.n, d: b.d, col: 1, below: true }] }));
      pane.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary small', type: 'button', 'data-same': '1', text: same ? 'Wieder wie vorher' : '✂️ Gleich große Stücke machen', onclick: function () { same = !same; draw(); } })]));
      var msg;
      if (!same) msg = a.d === b.d ? 'Gleiche Nenner: Die Stücke sind schon gleich groß. Zähle die Stücke!' : 'Die Stücke sind verschieden groß (' + T.denomWord(a.d) + ' und ' + T.denomWord(b.d) + '). Welcher Bruch ist größer?';
      else msg = (a.d === b.d ? '' : 'Gemeinsamer Nenner ' + L + ': ' + fq(a) + ' = {' + A + '/' + L + '},  ' + fq(b) + ' = {' + B + '/' + L + '}.  ') + 'Jetzt sind alle Stücke gleich groß: ' + A + ' ' + (c < 0 ? '<' : c > 0 ? '>' : '=') + ' ' + B + ', also *' + fq(a) + ' ' + (c < 0 ? '<' : c > 0 ? '>' : '=') + ' ' + fq(b) + '*.';
      pane.appendChild(h('p', { class: 'lab-msg', 'aria-live': 'polite', rich: msg }));
    }
    draw();
    return pane;
  }

  function tool(opts) {
    opts = opts || {};
    var mode = opts.mode === 'vergleichen' ? 'vergleichen' : 'erweitern';
    var tabs = h('div', { class: 'lab-tabs', role: 'tablist' }), body = h('div', { class: 'lab-body' });
    var defs = [['erweitern', '✂️ Erweitern & Kürzen'], ['vergleichen', '⚖️ Vergleichen']];
    function show(m) {
      mode = m; body.innerHTML = '';
      [].slice.call(tabs.children).forEach(function (b) { var on = b.getAttribute('data-tab') === m; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
      body.appendChild(m === 'erweitern' ? expandPane(opts) : comparePane(opts));
    }
    defs.forEach(function (d) { tabs.appendChild(h('button', { class: 'chip', type: 'button', role: 'tab', 'data-tab': d[0], text: d[1], onclick: function () { show(d[0]); } })); });
    var wrap = h('div', { class: 'bruch-labor' }, [tabs, body]);
    show(mode);
    return wrap;
  }
  function help(opts) { U.modal('🔬 Bruch-Labor', tool(opts), { cls: 'modal-wide' }); }

  root.BB.lab = { tool: tool, help: help };
})(typeof window !== 'undefined' ? window : globalThis);
