/*
 * strips.js — the Streifentafel from Lukas's worksheet, interactive.
 * Choose strips, tap a mark: a line runs down through all strips and every strip that has a mark
 * there lights up: {1/2} = {2/4} = {3/6} = {4/8} = {5/10} … (the start of "gleichwertige Brüche").
 * Used as its own page and as the 📏 help during tasks.
 */
(function (root) {
  'use strict';
  var U = root.BB.ui, h = U.h, T = root.BB.text, F = root.BB.frac, D = root.BB.draw;
  var ALL = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 20, 21, 24, 25, 50, 100];
  var PRESETS = [
    { label: 'Halbe-Familie', ds: [2, 4, 6, 8, 10, 12] },
    { label: 'Drittel-Familie', ds: [3, 6, 9, 12, 15, 21, 24] },
    { label: 'Fünftel-Familie', ds: [5, 10, 15, 20, 25, 50, 100] },
    { label: 'Alle', ds: ALL }
  ];

  function tool(opts) {
    opts = opts || {};
    var shown = {}; (opts.ds || PRESETS[0].ds).forEach(function (d) { shown[d] = true; });
    var sel = opts.value || null;
    var chips = h('div', { class: 'st-chips', role: 'group', 'aria-label': 'Streifen auswählen' });
    var presets = h('div', { class: 'st-presets' });
    var bars = h('div', { class: 'st-bars' }), line = h('div', { class: 'st-line', hidden: true }), info = h('div', { class: 'st-info', 'aria-live': 'polite' });
    bars.appendChild(line);

    PRESETS.forEach(function (p) { presets.appendChild(h('button', { class: 'btn soft small', type: 'button', text: p.label, onclick: function () { shown = {}; p.ds.forEach(function (d) { shown[d] = true; }); draw(); } })); });
    ALL.forEach(function (d) {
      var c = h('button', { class: 'chip', type: 'button', 'data-d': d, 'aria-pressed': 'false', text: T.denomWord(d) });
      c.addEventListener('click', function () { shown[d] = !shown[d]; draw(); });
      chips.appendChild(c);
    });

    function draw() {
      [].slice.call(chips.children).forEach(function (c) { var on = !!shown[+c.getAttribute('data-d')]; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      [].slice.call(bars.querySelectorAll('.st-row')).forEach(function (r) { r.remove(); });
      var list = ALL.filter(function (d) { return shown[d]; }), matches = [];
      list.forEach(function (d) {
        var k = sel ? F.ofInt(sel, d) : null, match = k !== null && sel;
        if (match) matches.push('{' + k + '/' + d + '}');
        var s = D.svg(1000, 60, 'st-svg'), P = D.pal('streifen');
        for (var i = 0; i < d; i++) {
          D.el('rect', { x: i * 1000 / d, y: 4, width: 1000 / d, height: 40, fill: match && i < k ? '#F6B08F' : (i % 2 ? '#FFFFFF' : '#F7F3EC'), stroke: d >= 50 ? '#9AA5B4' : P.line, 'stroke-width': d >= 50 ? 1 : 2 }, s);
        }
        D.el('rect', { x: 0, y: 4, width: 1000, height: 40, fill: 'none', stroke: '#2F5E95', 'stroke-width': 3 }, s);
        if (match && k > 0 && k < d) { var t = D.el('text', { x: k * 1000 / d + 8, y: 58, 'text-anchor': 'start', 'font-size': 14, fill: '#2A2530', 'font-weight': 700 }, s); t.textContent = k + '/' + d; }
        var row = h('div', { class: 'st-row' + (match ? ' match' : '') }, [h('span', { class: 'st-name', text: T.denomWord(d) }), h('div', { class: 'st-bar' }, [s])]);
        s.addEventListener('click', function (e) {
          var r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, kk = Math.round(x * d);
          sel = kk <= 0 || kk >= d ? null : F.reduce(F.make(kk, d)); draw();
        });
        bars.appendChild(row);
      });
      if (sel) {
        line.hidden = false; line.style.setProperty('--x', String(F.value(sel)));
        info.innerHTML = ''; info.appendChild(T.rich(matches.length > 1 ? matches.join(' = ') + '  – gleich viel!' : matches[0] ? matches[0] + ': Kein anderer gezeigter Streifen hat hier einen Strich.' : 'Dieser Bruch liegt auf keinem gezeigten Streifen genau auf einem Strich.'));
      } else { line.hidden = true; info.textContent = 'Tippe auf einen Strich in einem Streifen.'; }
      if (opts.onSelect) opts.onSelect(sel);
    }
    var wrap = h('div', { class: 'streifentafel' }, [presets, chips, bars, info]);
    draw();
    wrap.select = function (f) { sel = f ? F.reduce(f) : null; draw(); };
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
