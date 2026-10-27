/*
 * strips.js — the Streifentafel from Lukas's worksheet, interactive.
 * Choose strips, tap a mark: a line runs down through all strips and every strip that has a mark
 * there lights up: {1/2} = {2/4} = {3/6} = {4/8} = {5/10} … (the start of "gleichwertige Brüche").
 * Used as its own page and as the 📏 help during tasks.
 * Kapitel 2: "⚖️ Zwei Brüche vergleichen" – tap a mark for A (orange), then one for B (blue): both lines run
 * down, the info names the strip on which both lie (the common denominator) and the comparison.
 * A number line underneath shows the chosen fractions – equivalent ones are the same point.
 */
(function (root) {
  'use strict';
  var U = root.BB.ui, h = U.h, T = root.BB.text, F = root.BB.frac, D = root.BB.draw;
  var ALL = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 20, 21, 24, 25, 50, 100];
  var PRESETS = [
    { label: 'Halbe-Familie', ds: [2, 4, 6, 8, 10, 12] },
    { label: 'Drittel-Familie', ds: [3, 6, 9, 12, 15, 21, 24] },
    { label: 'Fünftel-Familie', ds: [5, 10, 15, 20, 25, 50, 100] },
    { label: 'Viertel & Sechstel', ds: [4, 6, 12, 24] },
    { label: 'Alle', ds: ALL }
  ];

  function tool(opts) {
    opts = opts || {};
    var shown = {}; (opts.ds || PRESETS[0].ds).forEach(function (d) { shown[d] = true; });
    var sel = opts.value || null, selB = null, cmp = !!opts.compare, nextB = false;
    var chips = h('div', { class: 'st-chips', role: 'group', 'aria-label': 'Streifen auswählen' });
    var presets = h('div', { class: 'st-presets' });
    var bars = h('div', { class: 'st-bars' }), line = h('div', { class: 'st-line', hidden: true }), lineB = h('div', { class: 'st-line b', hidden: true }), info = h('div', { class: 'st-info', 'aria-live': 'polite' });
    var nl = h('div', { class: 'st-numline' });
    bars.appendChild(line); bars.appendChild(lineB);
    var cmpBtn = h('button', { class: 'btn soft small st-cmp', type: 'button', 'aria-pressed': cmp ? 'true' : 'false', text: '⚖️ Zwei Brüche vergleichen', onclick: function () { cmp = !cmp; selB = null; nextB = false; cmpBtn.setAttribute('aria-pressed', cmp ? 'true' : 'false'); cmpBtn.classList.toggle('on', cmp); draw(); } });
    cmpBtn.classList.toggle('on', cmp);

    PRESETS.forEach(function (p) { presets.appendChild(h('button', { class: 'btn soft small', type: 'button', text: p.label, onclick: function () { shown = {}; p.ds.forEach(function (d) { shown[d] = true; }); draw(); } })); });
    ALL.forEach(function (d) {
      var c = h('button', { class: 'chip', type: 'button', 'data-d': d, 'aria-pressed': 'false', text: T.denomWord(d) });
      c.addEventListener('click', function () { shown[d] = !shown[d]; draw(); });
      chips.appendChild(c);
    });

    function draw() {
      [].slice.call(chips.children).forEach(function (c) { var on = !!shown[+c.getAttribute('data-d')]; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      [].slice.call(bars.querySelectorAll('.st-row')).forEach(function (r) { r.remove(); });
      var list = ALL.filter(function (d) { return shown[d]; }), matches = [], both = null;
      list.forEach(function (d) {
        var k = sel ? F.ofInt(sel, d) : null, match = k !== null && sel;
        var kb = cmp && selB ? F.ofInt(selB, d) : null, matchB = kb !== null && cmp && selB;
        if (match) matches.push('{' + k + '/' + d + '}');
        if (match && matchB && !both) both = { d: d, a: k, b: kb };
        var s = D.svg(1000, 60, 'st-svg'), P = D.pal('streifen');
        for (var i = 0; i < d; i++) {
          var x = i * 1000 / d, wd = 1000 / d, sk = d >= 50 ? '#9AA5B4' : P.line, sw = d >= 50 ? 1 : 2;
          if (cmp) {
            D.el('rect', { x: x, y: 4, width: wd, height: 20, fill: match && i < k ? '#F6B08F' : (i % 2 ? '#FFFFFF' : '#F7F3EC'), stroke: 'none' }, s);
            D.el('rect', { x: x, y: 24, width: wd, height: 20, fill: matchB && i < kb ? '#9CC0EA' : (i % 2 ? '#FFFFFF' : '#F7F3EC'), stroke: 'none' }, s);
            D.el('rect', { x: x, y: 4, width: wd, height: 40, fill: 'none', stroke: sk, 'stroke-width': sw }, s);
          } else D.el('rect', { x: x, y: 4, width: wd, height: 40, fill: match && i < k ? '#F6B08F' : (i % 2 ? '#FFFFFF' : '#F7F3EC'), stroke: sk, 'stroke-width': sw }, s);
        }
        D.el('rect', { x: 0, y: 4, width: 1000, height: 40, fill: 'none', stroke: '#2F5E95', 'stroke-width': 3 }, s);
        var aLeft = cmp && selB && sel ? F.cmp(sel, selB) <= 0 : false;     // smaller fraction's label left of its line
        if (match && k > 0 && k < d) { var t = D.el('text', { x: k * 1000 / d + (aLeft ? -8 : 8), y: 58, 'text-anchor': aLeft ? 'end' : 'start', 'font-size': 14, fill: '#A8492A', 'font-weight': 700 }, s); t.textContent = k + '/' + d; }
        if (matchB && kb > 0 && kb < d) { var t2 = D.el('text', { x: kb * 1000 / d + (aLeft ? 8 : -8), y: 58, 'text-anchor': aLeft ? 'start' : 'end', 'font-size': 14, fill: '#2F5E95', 'font-weight': 700 }, s); t2.textContent = kb + '/' + d; }
        var row = h('div', { class: 'st-row' + (match ? ' match' : '') + (matchB ? ' match-b' : '') }, [h('span', { class: 'st-name', text: T.denomWord(d) }), h('div', { class: 'st-bar' }, [s])]);
        s.addEventListener('click', function (e) {
          var r = s.getBoundingClientRect(), xx = (e.clientX - r.left) / r.width, kk = Math.round(xx * d);
          var f = kk <= 0 || kk >= d ? null : F.reduce(F.make(kk, d));
          if (cmp && nextB && sel) { selB = f; nextB = false; } else { sel = f; if (cmp) { nextB = true; selB = null; } }
          draw();
        });
        bars.appendChild(row);
      });
      lineB.hidden = !(cmp && selB);
      if (cmp && selB) lineB.style.setProperty('--x', String(F.value(selB)));
      info.innerHTML = '';
      if (cmp) {
        if (sel && selB) {
          var c = F.cmp(sel, selB), sg = c < 0 ? ' < ' : c > 0 ? ' > ' : ' = ';
          info.appendChild(T.rich('*A* ' + T.fm(sel) + sg + T.fm(selB) + ' *B*' + (both ? '.  Auf dem ' + T.stripName(both.d) + ': {' + both.a + '/' + both.d + '}' + sg + '{' + both.b + '/' + both.d + '} – gleich große Stücke, du kannst zählen!' : '.  Kein gezeigter Streifen hat beide Striche – zeige mehr Streifen.')));
        } else info.appendChild(T.rich(sel ? 'A ist ' + T.fm(sel) + '. Tippe jetzt einen Strich für *B* an.' : 'Tippe einen Strich für *A* an, dann einen für *B*.'));
      }
      if (sel) {
        line.hidden = false; line.style.setProperty('--x', String(F.value(sel)));
        if (!cmp) info.appendChild(T.rich(matches.length > 1 ? matches.join(' = ') + '  – gleich viel!' : matches[0] ? matches[0] + ': Kein anderer gezeigter Streifen hat hier einen Strich.' : 'Dieser Bruch liegt auf keinem gezeigten Streifen genau auf einem Strich.'));
      } else { line.hidden = true; if (!cmp) info.textContent = 'Tippe auf einen Strich in einem Streifen.'; }
      // number line: the chosen fraction(s); all matches are one point
      nl.innerHTML = '';
      if (sel) {
        var marks = [{ n: sel.n, d: sel.d, col: 0 }]; if (cmp && selB) marks.push({ n: selB.n, d: selB.d, col: 1, below: true });
        nl.appendChild(D.render({ type: 'numline', max: 1, ticks: list.length ? [Math.min.apply(null, list)] : [], marks: marks }));
        if (!cmp && matches.length > 1) nl.appendChild(h('p', { class: 'note', rich: 'Auf dem Zahlenstrahl sind ' + matches.join(', ') + ' *ein und derselbe Punkt*.' }));
      }
      if (opts.onSelect) opts.onSelect(sel);
    }
    var wrap = h('div', { class: 'streifentafel' }, [presets, h('div', { class: 'row' }, [cmpBtn]), chips, bars, info, nl]);
    draw();
    wrap.select = function (f, g) { sel = f ? F.reduce(f) : null; selB = g ? F.reduce(g) : null; nextB = !!(cmp && sel && !selB); draw(); };
    wrap.show = function (ds) { shown = {}; ds.forEach(function (d) { shown[d] = true; }); draw(); };
    return wrap;
  }

  // 📏 help during a task: opens the strips in a dialog, showing the families that fit the task's denominator.
  function help(d) {
    var ds = d ? ALL.filter(function (x) { return x % d === 0 || d % x === 0; }).slice(0, 8) : PRESETS[0].ds;
    if (ds.length < 3) ds = PRESETS[0].ds;
    U.modal('📏 Streifentafel', tool({ ds: ds }), { cls: 'modal-wide' });
  }

  root.BB.strips = { tool: tool, help: help, ALL: ALL, PRESETS: PRESETS };
})(typeof window !== 'undefined' ? window : globalThis);
