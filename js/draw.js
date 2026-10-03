/*
 * draw.js — SVG pictures for fractions. Every picture can be display-only or interactive (tap pieces).
 *
 *   BB.draw.render(spec, { interactive, onChange }) → element with .value() (e.g. {count}) for answers
 *
 * spec.type: pie · bar · tri · wholes · unequal · items · share · jug
 */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', F = root.BB.frac;

  function svg(w, h, cls) { var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 ' + w + ' ' + h); s.setAttribute('class', 'pic ' + (cls || '')); s.setAttribute('role', 'img'); return s; }
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  // Palettes: base (empty piece), on (coloured piece), line, rim
  var PAL = {
    pizza:       { base: '#F6DFA8', on: '#E0673B', line: '#B9772F', rim: '#D99A4E' },
    kuchen:      { base: '#F3DDC2', on: '#9C5B34', line: '#7A4524', rim: '#B9835A' },
    pfannkuchen: { base: '#FAEBC4', on: '#E3A21A', line: '#B98222', rim: '#E8C77E' },
    apfel:       { base: '#E4F2D2', on: '#5FA34A', line: '#3E7A33', rim: '#7DB55F' },
    birne:       { base: '#F1F3C9', on: '#B7C043', line: '#7F8A2A', rim: '#C8CF6B' },
    waffel:      { base: '#F7E3B6', on: '#D68A1C', line: '#A86A15', rim: '#DDAA5C' },
    kreis:       { base: '#FFFFFF', on: '#4C83C7', line: '#2F5E95', rim: '#2F5E95' },
    rechteck:    { base: '#FFFFFF', on: '#4C83C7', line: '#2F5E95', rim: '#2F5E95' },
    streifen:    { base: '#FFFFFF', on: '#4C83C7', line: '#2F5E95', rim: '#2F5E95' },
    schokolade:  { base: '#E9D3C2', on: '#6B3E26', line: '#4E2A18', rim: '#4E2A18' },
    blatt:       { base: '#FFFFFF', on: '#8DB8E8', line: '#6C7A8C', rim: '#6C7A8C' },
    baguette:    { base: '#F4DDB0', on: '#C9873A', line: '#9B6528', rim: '#B9772F' },
    broetchen:   { base: '#F4DDB0', on: '#C9873A', line: '#9B6528', rim: '#B9772F' },
    dreieck:     { base: '#FFFFFF', on: '#4C83C7', line: '#2F5E95', rim: '#2F5E95' }
  };
  var KIDS = ['#E0673B', '#2F6DB5', '#2F8F5B', '#8E5BB5', '#D68A1C', '#C2417A', '#1F8A99', '#7A6A2E', '#5A6AD8', '#B5452F', '#3E9E8E', '#A77B10'];
  var PIE_KINDS = { pizza: 1, kuchen: 1, pfannkuchen: 1, apfel: 1, birne: 1, waffel: 1, kreis: 1 };

  function pal(kind) { return PAL[kind] || PAL.kreis; }
  function wedge(cx, cy, r, a0, a1) {
    if (a1 - a0 >= Math.PI * 2 - 1e-6) return 'M' + (cx - r) + ',' + cy + 'a' + r + ',' + r + ' 0 1,0 ' + 2 * r + ',0a' + r + ',' + r + ' 0 1,0 ' + (-2 * r) + ',0Z';
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return 'M' + cx + ',' + cy + 'L' + x0.toFixed(2) + ',' + y0.toFixed(2) + 'A' + r + ',' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ',1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) + 'Z';
  }

  // A set of pieces that can be tapped. Each piece: {node, on}
  function pieceSet(opts) {
    var pieces = [], listeners = [];
    function paint(p) { p.node.setAttribute('fill', p.on ? (p.colOn || opts.pal.on) : (p.colOff || opts.pal.base)); p.node.classList.toggle('on', !!p.on); }
    return {
      add: function (node, on, extra) {
        var p = { node: node, on: !!on }; for (var k in extra || {}) p[k] = extra[k];
        pieces.push(p); paint(p);
        if (opts.interactive) {
          node.classList.add('tap'); node.setAttribute('tabindex', '0'); node.setAttribute('role', 'button');
          node.setAttribute('aria-pressed', p.on ? 'true' : 'false'); node.setAttribute('aria-label', 'Stück ' + pieces.length);
          var toggle = function (e) { e.preventDefault(); p.on = !p.on; paint(p); node.setAttribute('aria-pressed', p.on ? 'true' : 'false'); listeners.forEach(function (f) { f(); }); };
          node.addEventListener('click', toggle);
          node.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') toggle(e); });
        }
        return p;
      },
      count: function () { return pieces.filter(function (p) { return p.on; }).length; },
      total: function () { return pieces.length; },
      onChange: function (f) { listeners.push(f); },
      clear: function () { pieces.forEach(function (p) { p.on = false; paint(p); }); listeners.forEach(function (f) { f(); }); },
      pieces: pieces
    };
  }

  function drawPie(g, cx, cy, r, d, isOn, set, kind) {
    var P = pal(kind);
    if (kind === 'pizza') el('circle', { cx: cx, cy: cy, r: r + 5, fill: P.rim }, g);
    if (kind === 'apfel' || kind === 'birne') el('path', { d: 'M' + cx + ',' + (cy - r) + 'q4,-14 12,-16', stroke: '#6B4A2A', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, g);
    for (var i = 0; i < d; i++) {
      var a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
      var path = el('path', { d: wedge(cx, cy, r, a0, a1), stroke: P.line, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
      set.add(path, isOn(i));
    }
    el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: P.rim, 'stroke-width': 2.5 }, g);
  }
  function drawBar(g, x, y, w, h, rows, cols, isOn, set, kind) {
    var P = pal(kind), cw = w / cols, ch = h / rows, rx = kind === 'baguette' || kind === 'broetchen' ? Math.min(h / 2, 30) : kind === 'schokolade' ? 6 : 3;
    var clipId = 'c' + Math.random().toString(36).slice(2, 8);
    var cp = el('clipPath', { id: clipId }, g); el('rect', { x: x, y: y, width: w, height: h, rx: rx }, cp);
    var gg = el('g', { 'clip-path': 'url(#' + clipId + ')' }, g);
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var i = r * cols + c, inset = kind === 'schokolade' ? 2.5 : 0;
      var rect = el('rect', { x: x + c * cw + inset, y: y + r * ch + inset, width: cw - 2 * inset, height: ch - 2 * inset, rx: kind === 'schokolade' ? 3 : 0, stroke: P.line, 'stroke-width': kind === 'schokolade' ? 1.2 : 2 }, gg);
      set.add(rect, isOn(i));
    }
    el('rect', { x: x, y: y, width: w, height: h, rx: rx, fill: 'none', stroke: P.rim, 'stroke-width': 2.5 }, g);
  }
  // Equilateral triangle cut into k² small triangles (row r from the top has 2r+1 of them).
  function drawTri(g, x, y, side, k, isOn, set) {
    var P = pal('dreieck'), s = side / k, sh = s * Math.sqrt(3) / 2, i = 0;
    function pt(p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }
    for (var r = 0; r < k; r++) {
      var top = y + r * sh, xb = x + side / 2 - (r + 1) * s / 2, xt = x + side / 2 - r * s / 2;
      for (var j = 0; j <= 2 * r; j++) {
        var m = Math.floor(j / 2), pts = j % 2 === 0
          ? [[xb + m * s, top + sh], [xb + m * s + s / 2, top], [xb + (m + 1) * s, top + sh]]
          : [[xt + m * s, top], [xt + (m + 1) * s, top], [xt + m * s + s / 2, top + sh]];
        var poly = el('polygon', { points: pts.map(pt).join(' '), stroke: P.line, 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
        set.add(poly, isOn(i)); i++;
      }
    }
  }

  function render(spec, opts) {
    opts = opts || {};
    var interactive = !!opts.interactive, kind = spec.kind || 'kreis', set = pieceSet({ pal: pal(kind), interactive: interactive });
    var wrap = document.createElement('div'); wrap.className = 'pic-wrap pic-' + spec.type + (interactive ? ' interactive' : '');
    var s, g, on = function (list) { var m = {}; (list || []).forEach(function (i) { m[i] = 1; }); return function (i) { return !!m[i]; }; };
    if (spec.type === 'pie') {
      s = svg(220, 220); g = el('g', {}, s); drawPie(g, 110, 112, 96, spec.d, on(spec.shaded), set, kind);
    } else if (spec.type === 'bar') {
      var cols = spec.cols, rows = spec.rows || 1, cell = Math.min(52, 340 / cols), W = cols * cell, H = rows === 1 ? (kind === 'baguette' ? 60 : 74) : rows * cell;
      if (kind === 'baguette') { W = Math.max(W, 340); }
      s = svg(W + 12, H + 12); g = el('g', {}, s); drawBar(g, 6, 6, W, H, rows, cols, on(spec.shaded), set, kind);
    } else if (spec.type === 'tri') {
      s = svg(240, 215); g = el('g', {}, s); drawTri(g, 10, 6, 220, spec.k, on(spec.shaded), set);
    } else if (spec.type === 'wholes') {
      var n = spec.wholes, isPie = PIE_KINDS[kind] !== undefined, cw2 = isPie ? 150 : 300;
      var per = Math.min(n, isPie ? 4 : 1), rowsN = Math.ceil(n / per);
      s = svg(per * cw2, rowsN * (isPie ? 150 : 70)); g = el('g', {}, s);
      for (var wi = 0; wi < n; wi++) {
        var gx = (wi % per) * cw2, gy = Math.floor(wi / per) * (isPie ? 150 : 70);
        var base = wi * spec.d, cnt = spec.count;
        var fn = function (b) { return function (i) { return b + i < cnt; }; }(base);
        if (isPie) drawPie(el('g', {}, g), gx + 75, gy + 76, 62, spec.d, fn, set, kind);
        else drawBar(el('g', {}, g), gx + 6, gy + 6, cw2 - 12, 56, 1, spec.d, fn, set, kind);
      }
    } else if (spec.type === 'unequal') {
      var R0 = mulberry(spec.seed || 7), parts = [], tot = 0;
      for (var u = 0; u < spec.d; u++) { var wv = 0.45 + R0() * 1.4; parts.push(wv); tot += wv; }
      parts = parts.map(function (x) { return x / tot; });
      if (spec.kind === 'pie') {
        s = svg(220, 220); g = el('g', {}, s); var a = -Math.PI / 2, P1 = pal('kreis');
        parts.forEach(function (fr, i) { var p = el('path', { d: wedge(110, 112, 96, a, a + fr * 2 * Math.PI), stroke: P1.line, 'stroke-width': 2 }, g); set.add(p, (spec.shaded || []).indexOf(i) >= 0); a += fr * 2 * Math.PI; });
      } else {
        s = svg(352, 86); g = el('g', {}, s); var x0 = 6, P2 = pal('rechteck');
        parts.forEach(function (fr, i) { var r = el('rect', { x: x0, y: 6, width: fr * 340, height: 74, stroke: P2.line, 'stroke-width': 2 }, g); set.add(r, (spec.shaded || []).indexOf(i) >= 0); x0 += fr * 340; });
      }
    } else if (spec.type === 'items') {
      var cnt2 = spec.count, isPie2 = PIE_KINDS[kind] !== undefined, per2 = Math.min(cnt2, isPie2 ? 6 : 3), w2 = isPie2 ? 110 : 160, h2 = isPie2 ? 110 : 70;
      s = svg(per2 * w2, Math.ceil(cnt2 / per2) * h2); g = el('g', {}, s);
      for (var ii = 0; ii < cnt2; ii++) {
        var x2 = (ii % per2) * w2, y2 = Math.floor(ii / per2) * h2;
        if (isPie2) drawPie(el('g', {}, g), x2 + 55, y2 + 57, 44, 1, function () { return false; }, set, kind);
        else drawBar(el('g', {}, g), x2 + 8, y2 + 8, w2 - 16, h2 - 16, kind === 'schokolade' ? 2 : 1, kind === 'schokolade' ? 4 : 1, function () { return false; }, set, kind);
      }
    } else if (spec.type === 'share') {
      return shareView(spec);
    } else if (spec.type === 'jug') {
      return jug(spec, opts);
    }
    wrap.appendChild(s);
    wrap.value = function () { return { count: set.count(), total: set.total() }; };
    wrap.clear = function () { set.clear(); };
    wrap.set = set;
    if (interactive) {
      var cntEl = document.createElement('p'); cntEl.className = 'pic-count'; cntEl.setAttribute('aria-live', 'polite');
      var upd = function () { var c = set.count(); cntEl.textContent = c ? c + (c === 1 ? ' Stück gefärbt' : ' Stücke gefärbt') : '\u00a0'; if (opts.onChange) opts.onChange(wrap.value()); };
      set.onChange(upd); upd(); wrap.appendChild(cntEl);
    }
    return wrap;
  }

  // Solution picture for sharing: method 1 — every item cut into b pieces, child i gets piece i.
  function shareView(spec) {
    var wrap = document.createElement('div'); wrap.className = 'pic-wrap pic-share';
    var kind = spec.kind, isPie = PIE_KINDS[kind] !== undefined, a = spec.a, b = spec.b, per = Math.min(a, isPie ? 4 : 2), w = isPie ? 120 : 200, h = isPie ? 120 : 70;
    var s = svg(per * w, Math.ceil(a / per) * h), g = el('g', {}, s), set = pieceSet({ pal: pal(kind) });
    for (var i = 0; i < a; i++) {
      var x = (i % per) * w, y = Math.floor(i / per) * h, gi = el('g', {}, g);
      if (isPie) drawPie(gi, x + 60, y + 62, 50, b, function () { return true; }, set, kind);
      else drawBar(gi, x + 8, y + 8, w - 16, h - 16, 1, b, function () { return true; }, set, kind);
    }
    set.pieces.forEach(function (p, idx) { p.node.setAttribute('fill', KIDS[(idx % b) % KIDS.length]); p.node.setAttribute('fill-opacity', '0.85'); });
    wrap.appendChild(s);
    var leg = document.createElement('p'); leg.className = 'pic-legend';
    leg.textContent = 'Jede Farbe = ein Kind. Jedes bekommt aus jedem Stück ein Teil: ' + a + ' · {1/' + b + '} = {' + a + '/' + b + '}';
    leg.textContent = ''; leg.appendChild(root.BB.text.rich('Jede Farbe ist ein Kind. Jedes bekommt von jedem Stück {1/' + b + '} – zusammen ' + a + ' · {1/' + b + '} = {' + a + '/' + b + '}.'));
    wrap.appendChild(leg);
    return wrap;
  }

  // Measuring jug. spec: {max, step, fill}; interactive → drag/tap the water level, ± buttons.
  function jug(spec, opts) {
    var max = spec.max, step = spec.step, ml = spec.fill || 0;
    var wrap = document.createElement('div'); wrap.className = 'pic-wrap pic-jug' + (opts.interactive ? ' interactive' : '');
    var H = 300, top = 30, bottom = top + H, x0 = 60, x1 = 200;
    var s = svg(300, bottom + 20, 'jug');
    el('path', { d: 'M' + (x1) + ',' + (top + 30) + ' q55,10 50,70 q-4,55 -50,60', fill: 'none', stroke: '#9DB3C8', 'stroke-width': 10, 'stroke-linecap': 'round' }, s);   // handle
    var water = el('rect', { x: x0 + 3, y: bottom, width: x1 - x0 - 6, height: 0, fill: '#7FB2E0', 'fill-opacity': 0.8 }, s);
    var surf = el('line', { x1: x0 + 3, x2: x1 - 3, y1: bottom, y2: bottom, stroke: '#2F6DB5', 'stroke-width': 3 }, s);
    el('path', { d: 'M' + x0 + ',' + (top - 10) + ' L' + x0 + ',' + (bottom - 12) + ' q0,12 12,12 L' + (x1 - 12) + ',' + bottom + ' q12,0 12,-12 L' + x1 + ',' + (top - 10), fill: 'rgba(220,235,248,.25)', stroke: '#5E7A96', 'stroke-width': 3 }, s);
    var big = max >= 2000 ? 500 : step >= 100 ? 100 : 250;          // labelled ticks
    for (var v = step; v <= max; v += step) {
      var y = bottom - v / max * H, major = v % big === 0, mid = v % 100 === 0;
      el('line', { x1: x0, x2: x0 + (major ? 34 : mid ? 24 : 14), y1: y, y2: y, stroke: '#3E556C', 'stroke-width': major ? 2.5 : 1.5 }, s);
      if (major) { var t = el('text', { x: x0 + 40, y: y + 5, 'font-size': 15, fill: '#2A2530' }, s); t.textContent = v % 1000 === 0 ? v / 1000 + ' l' : v + ' ml'; }
    }
    function setMl(x) {
      ml = Math.max(0, Math.min(max, Math.round(x / step) * step));
      var y = bottom - ml / max * H;
      water.setAttribute('y', y); water.setAttribute('height', bottom - y); surf.setAttribute('y1', y); surf.setAttribute('y2', y);
      surf.style.display = ml ? '' : 'none';
      if (opts.onChange) opts.onChange({ ml: ml });
    }
    setMl(ml);
    wrap.appendChild(s);
    if (opts.interactive) {
      var drag = false;
      function at(e) { var r = s.getBoundingClientRect(), sc = (bottom + 20) / r.height, y = (e.clientY - r.top) * sc; setMl((bottom - y) / H * max); }
      s.addEventListener('pointerdown', function (e) { drag = true; s.setPointerCapture(e.pointerId); at(e); });
      s.addEventListener('pointermove', function (e) { if (drag) at(e); });
      s.addEventListener('pointerup', function () { drag = false; });
      s.style.touchAction = 'none';
      var row = document.createElement('div'); row.className = 'jug-btns';
      [['−', -step], ['+', step]].forEach(function (b) {
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn soft jug-' + (b[1] > 0 ? 'plus' : 'minus'); btn.textContent = b[0] + ' ' + step + ' ml';
        btn.addEventListener('click', function () { setMl(ml + b[1]); }); row.appendChild(btn);
      });
      wrap.appendChild(row);
    }
    wrap.value = function () { return { ml: ml }; };
    wrap.setMl = setMl;
    return wrap;
  }

  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  root.BB.draw = { render: render, PAL: PAL, KIDS: KIDS, PIE_KINDS: PIE_KINDS, svg: svg, el: el, wedge: wedge, drawPie: drawPie, drawBar: drawBar, pieceSet: pieceSet, pal: pal };
})(typeof window !== 'undefined' ? window : globalThis);
