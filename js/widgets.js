/*
 * widgets.js — answer inputs. Each returns an element with:
 *   .value()   current input in the shape the task's check() expects
 *   .focus(), .lock() (after a right answer), .fill(input) (show the solution)
 * Typing is kept small: numeric keyboards, boxes laid out like a fraction, tapping wherever possible.
 */
(function (root) {
  'use strict';
  var U = root.BB.ui, h = U.h, T = root.BB.text, D = root.BB.draw;

  function numBox(cls, label, onEnter) {
    var i = h('input', { class: 'nbox ' + (cls || ''), type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': label, maxlength: 5, pattern: '[0-9]*' });
    i.addEventListener('input', function () { var v = i.value.replace(/[^0-9]/g, ''); if (v !== i.value) i.value = v; });
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } });
    return i;
  }
  function intOf(i) { return i.value === '' ? null : parseInt(i.value, 10); }

  // Fraction boxes; whole: 'none' | 'optional' | 'required'.
  // a.fixed {n} or {d}: that box is filled in and locked (missing-number tasks: {2/3} = {?/12}); a.before: markup in front.
  function frac(a, onEnter) {
    var w = numBox('nbox-w', 'Ganze', onEnter), n = numBox('nbox-n', 'Zähler', onEnter), d = numBox('nbox-d', 'Nenner', onEnter);
    var showW = a.whole === 'required' || a.whole === 'optional', fixed = a.fixed || {};
    function applyFixed() {
      fixed = a.fixed || {};
      [[n, 'n'], [d, 'd']].forEach(function (x) { var on = fixed[x[1]] != null; x[0].disabled = on; x[0].classList.toggle('given', on); if (on) x[0].value = fixed[x[1]]; });
    }
    var wrap = h('div', { class: 'ans-frac' + (a.whole === 'required' ? ' need-w' : '') + (a.before ? ' with-before' : '') }, [
      a.before ? h('span', { class: 'before', rich: a.before }) : null,
      showW ? h('label', { class: 'wbox' }, [w, h('span', { class: 'lab', text: a.whole === 'required' ? 'Ganze' : 'Ganze (wenn nötig)' })]) : null,
      h('div', { class: 'fbox' }, [n, h('span', { class: 'fline', 'aria-hidden': 'true' }), d]),
      a.after ? h('span', { class: 'after', rich: a.after }) : null]);
    applyFixed();
    wrap.value = function () { return { w: showW ? intOf(w) : null, n: intOf(n), d: intOf(d) }; };
    wrap.focus = function () { (a.whole === 'required' ? w : fixed.n != null ? d : n).focus(); };
    wrap.lock = function () { [w, n, d].forEach(function (x) { x.disabled = true; }); };
    wrap.clearInput = function () { [w, n, d].forEach(function (x) { x.value = ''; }); applyFixed(); };
    wrap.fill = function (k) { w.value = k.w == null ? '' : k.w; n.value = k.n == null ? '' : k.n; d.value = k.d == null ? '' : k.d; };
    return wrap;
  }

  // Table (Brüche in Tabellen erweitern/kürzen). a.heads: [{label} | {slot}], a.rows: [{start, cells: [{given} | {slot, fixed}]}], a.slots.
  function table(a, onEnter) {
    var inputs = [];   // per slot: {kind, el, get, set, boxes}
    function fracCell(slot) {
      var sl = a.slots[slot], n = numBox('nbox-n tn', 'Zähler', onEnter), d = numBox('nbox-d tn', 'Nenner', onEnter), fx0 = sl.fixed || {};
      if (fx0.n != null) { n.value = fx0.n; n.disabled = true; n.classList.add('given'); }
      if (fx0.d != null) { d.value = fx0.d; d.disabled = true; d.classList.add('given'); }
      var box = h('div', { class: 'fbox tbox', 'data-slot': slot }, [n, h('span', { class: 'fline', 'aria-hidden': 'true' }), d]);
      inputs[slot] = { kind: 'frac', el: box, boxes: [n, d], get: function () { return { n: intOf(n), d: intOf(d) }; }, set: function (k) { n.value = k.n; d.value = k.d; } };
      return box;
    }
    function numCell(slot, pre) {
      var x = numBox('nbox-x tn', 'Zahl', onEnter), box = h('span', { class: 'thead-in', 'data-slot': slot }, [h('span', { text: pre }), x]);
      inputs[slot] = { kind: 'num', el: box, boxes: [x], get: function () { return { x: intOf(x) }; }, set: function (k) { x.value = k.x; } };
      return box;
    }
    var op = a.rows.length && a.heads.some(function (hh) { return /^:/.test(hh.label || ''); }) ? ': ' : '· ';
    var thead = h('tr', {}, [h('th', { text: a.corner || 'Bruch' })].concat(a.heads.map(function (hh) { return h('th', { class: hh.vol ? 'vol' : '' }, [hh.slot != null ? numCell(hh.slot, op) : h('span', { text: hh.label })]); })));
    var body = a.rows.map(function (r) {
      return h('tr', {}, [h('th', { class: 'tstart', rich: '{' + r.start.n + '/' + r.start.d + '}' })].concat(r.cells.map(function (c) {
        return h('td', {}, [c.given ? h('span', { class: 'tgiven', rich: '{' + c.given.n + '/' + c.given.d + '}' }) : fracCell(c.slot)]);
      })));
    });
    var tbl = h('table', { class: 'ftable' }, [h('thead', {}, [thead]), h('tbody', {}, body)]);
    var wrap = h('div', { class: 'ans-table' }, [h('div', { class: 'ftable-scroll' }, [tbl])]);
    inputs.forEach(function (it) { it.boxes.forEach(function (b) { b.addEventListener('input', function () { it.el.classList.remove('bad'); }); }); });
    wrap.value = function () { return { cells: inputs.map(function (it) { return it.get(); }) }; };
    wrap.focus = function () { var f = wrap.querySelector('input:not([disabled])'); if (f) f.focus(); };
    wrap.lock = function () { inputs.forEach(function (it) { it.boxes.forEach(function (b) { b.disabled = true; }); }); };
    wrap.clearInput = function () { inputs.forEach(function (it) { it.boxes.forEach(function (b) { if (!b.classList.contains('given')) b.value = ''; }); }); };
    wrap.fill = function (k) { (k.cells || []).forEach(function (c, i) { if (inputs[i]) inputs[i].set(c); }); };
    wrap.markWrong = function (r) { inputs.forEach(function (it, i) { it.el.classList.toggle('bad', !!(r && r.bad && r.bad.indexOf(i) >= 0)); }); };
    return wrap;
  }

  // Ordering fraction cards: tap a card to put it in the next place, tap a placed card to take it back.
  // With a mouse, cards can also be dragged onto a place. Optional help: the cards as strips.
  function order(a) {
    var placed = [], N = a.cards.length, locked = false, dragFrom = null;
    var label = function (c) { return c.mix && c.n > c.d ? '{' + Math.floor(c.n / c.d) + ' ' + c.n % c.d + '/' + c.d + '}' : '{' + c.n + '/' + c.d + '}'; };
    var pool = h('div', { class: 'ord-pool', 'aria-label': 'Karten' }), row = h('ol', { class: 'ord-row', 'aria-label': a.dir === 'asc' ? 'vom kleinsten zum größten' : 'vom größten zum kleinsten' });
    var cards = a.cards.map(function (c, i) {
      var b = h('button', { class: 'ord-card', type: 'button', draggable: 'true', 'data-i': i, 'aria-label': 'Karte ' + T.plain(label(c)) }, [h('span', { rich: label(c) })]);
      b.addEventListener('click', function () { if (locked) return; var at = placed.indexOf(i); if (at >= 0) placed.splice(at, 1); else placed.push(i); draw(); });
      b.addEventListener('dragstart', function (e) { dragFrom = i; try { e.dataTransfer.setData('text/plain', String(i)); } catch (x) { /* ignore */ } });
      return b;
    });
    var slots = [];
    for (var k = 0; k < N; k++) (function (k) {
      var li = h('li', { class: 'ord-slot', 'data-k': k });
      li.addEventListener('dragover', function (e) { e.preventDefault(); });
      li.addEventListener('drop', function (e) { e.preventDefault(); if (locked || dragFrom == null) return; var at = placed.indexOf(dragFrom); if (at >= 0) placed.splice(at, 1); placed.splice(Math.min(k, placed.length), 0, dragFrom); dragFrom = null; draw(); });
      slots.push(li); row.appendChild(li);
    })(k);
    var ends = h('div', { class: 'ord-ends', 'aria-hidden': 'true' }, [h('span', { text: a.dir === 'asc' ? 'kleinster' : 'größter' }), h('span', { text: '➜' }), h('span', { text: a.dir === 'asc' ? 'größter' : 'kleinster' })]);
    var helpBox = h('div', { class: 'ord-help', hidden: true });
    var helpBtn = a.help ? h('button', { class: 'link small', type: 'button', text: '📏 Streifen zeigen (Hilfe)', onclick: function () { helpBox.hidden = !helpBox.hidden; if (!helpBox.firstChild) helpBox.appendChild(D.render(a.help)); helpBtn.textContent = helpBox.hidden ? '📏 Streifen zeigen (Hilfe)' : '📏 Streifen ausblenden'; } }) : null;
    var wrap = h('div', { class: 'ans-order' }, [ends, row, h('p', { class: 'note ord-note', text: 'Karten:' }), pool, h('div', { class: 'row' }, [h('button', { class: 'link small', type: 'button', text: '↺ alle zurück', onclick: function () { if (!locked) { placed = []; draw(); } } }), helpBtn]), helpBox]);
    function draw() {
      slots.forEach(function (li, k) { li.innerHTML = ''; li.classList.remove('bad'); if (placed[k] != null) li.appendChild(cards[placed[k]]); else li.appendChild(h('span', { class: 'ord-empty', text: String(k + 1) })); });
      cards.forEach(function (c, i) { if (placed.indexOf(i) < 0) pool.appendChild(c); c.classList.toggle('placed', placed.indexOf(i) >= 0); });
    }
    draw();
    wrap.value = function () { return { order: placed.slice() }; };
    wrap.focus = function () { if (cards[0]) cards[0].focus(); };
    wrap.lock = function () { locked = true; cards.forEach(function (c) { c.disabled = true; c.draggable = false; }); };
    wrap.clearInput = function () { placed = []; draw(); };
    wrap.fill = function (k) { placed = (k.order || []).slice(); draw(); };
    wrap.markWrong = function (r) { if (r && r.bad) r.bad.forEach(function (k) { if (slots[k]) slots[k].classList.add('bad'); }); };
    return wrap;
  }
  function division(a, onEnter) {
    var x = numBox('nbox-a', 'Dividend', onEnter), y = numBox('nbox-b', 'Divisor', onEnter);
    var wrap = h('div', { class: 'ans-div' }, [x, h('span', { class: 'divsign', text: ':' }), y]);
    wrap.value = function () { return { a: intOf(x), b: intOf(y) }; };
    wrap.focus = function () { x.focus(); }; wrap.lock = function () { x.disabled = y.disabled = true; };
    wrap.clearInput = function () { x.value = y.value = ''; };
    wrap.fill = function (k) { x.value = k.a; y.value = k.b; };
    return wrap;
  }
  function num(a, onEnter) {
    var i = numBox('nbox-x', 'Zahl', onEnter); i.setAttribute('maxlength', 6);
    var wrap = h('div', { class: 'ans-num' }, [a.pre ? h('span', { class: 'pre', rich: a.pre }) : null, i, a.post ? h('span', { class: 'after', rich: a.post }) : null]);
    wrap.value = function () { return { x: intOf(i) }; };
    wrap.focus = function () { i.focus(); }; wrap.lock = function () { i.disabled = true; };
    wrap.clearInput = function () { i.value = ''; };
    wrap.fill = function (k) { i.value = k.x; };
    return wrap;
  }
  // "2,50" / "2.5" / "2" → cents
  function parseEuro(s) {
    s = String(s || '').trim().replace(/\s|€/g, '').replace('.', ',');
    var m = /^(\d{1,4})(?:,(\d{1,2}))?$/.exec(s);
    if (!m) return null;
    return parseInt(m[1], 10) * 100 + (m[2] ? parseInt((m[2] + '0').slice(0, 2), 10) : 0);
  }
  function money(a, onEnter) {
    var i = h('input', { class: 'nbox nbox-eur', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Betrag in Euro', maxlength: 8 });
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } });
    i.addEventListener('input', function () { var v = i.value.replace(/[^0-9,.]/g, ''); if (v !== i.value) i.value = v; });
    var wrap = h('div', { class: 'ans-num' }, [i, h('span', { class: 'after', text: '€' })]);
    wrap.value = function () { return { ct: parseEuro(i.value), raw: i.value }; };
    wrap.focus = function () { i.focus(); }; wrap.lock = function () { i.disabled = true; };
    wrap.clearInput = function () { i.value = ''; };
    wrap.fill = function (k) { i.value = T.euro(k.ct).replace(' €', ''); };
    return wrap;
  }
  function choice(a) {
    var sel = a.multi ? {} : null, btns = [];
    var wrap = h('div', { class: 'ans-choice' + (a.pictures ? ' pictures' : '') + (a.long ? ' long' : '') + (a.multi ? ' multi' : '') + (a.signs ? ' signs' : ''), role: a.multi ? 'group' : 'radiogroup' });
    a.options.forEach(function (o) {
      var b = h('button', { class: 'opt', type: 'button', 'data-id': o.id, role: a.multi ? 'checkbox' : 'radio', 'aria-checked': 'false' },
        [o.visual ? D.render(o.visual) : null, o.label ? h('span', { class: 'opt-label', rich: o.label }) : null]);
      b.addEventListener('click', function () {
        if (b.disabled) return;
        if (a.multi) { sel[o.id] = !sel[o.id]; b.classList.toggle('chosen', sel[o.id]); b.setAttribute('aria-checked', sel[o.id] ? 'true' : 'false'); }
        else { sel = o.id; btns.forEach(function (x) { var on = x === b; x.classList.toggle('chosen', on); x.setAttribute('aria-checked', on ? 'true' : 'false'); }); if (wrap.onPick) wrap.onPick(); }
      });
      btns.push(b); wrap.appendChild(b);
    });
    wrap.value = function () { return a.multi ? { ids: Object.keys(sel).filter(function (k) { return sel[k]; }) } : { id: sel }; };
    wrap.focus = function () { if (btns[0]) btns[0].focus(); };
    wrap.lock = function () { btns.forEach(function (b) { b.disabled = true; }); };
    wrap.clearInput = function () { sel = a.multi ? {} : null; btns.forEach(function (b) { b.classList.remove('chosen', 'wrong'); b.setAttribute('aria-checked', 'false'); }); };
    wrap.markWrong = function () { btns.forEach(function (b) { if (b.classList.contains('chosen')) b.classList.add('wrong'); }); };
    if (a.signs) btns.forEach(function (b) { b.setAttribute('aria-label', { lt: 'kleiner als', gt: 'größer als', eq: 'gleich' }[b.getAttribute('data-id')] || b.textContent); });
    wrap.markRight = function (ids) { ids = [].concat(ids); btns.forEach(function (b) { if (ids.indexOf(b.getAttribute('data-id')) >= 0) b.classList.add('right'); }); };
    wrap.fill = function (k) { var ids = k.ids || [k.id]; btns.forEach(function (b) { var on = ids.indexOf(b.getAttribute('data-id')) >= 0; b.classList.toggle('chosen', on); if (on) b.classList.add('right'); }); sel = a.multi ? ids.reduce(function (m, x) { m[x] = true; return m; }, {}) : k.id; };
    return wrap;
  }
  function shade(a) {
    var pic = D.render(a.visual, { interactive: true });
    var wrap = h('div', { class: 'ans-shade' }, [pic, h('button', { class: 'link small', type: 'button', text: '↺ alles zurück', onclick: function () { pic.clear(); } })]);
    wrap.value = function () { return pic.value(); };
    wrap.focus = function () { var p = pic.querySelector('.tap'); if (p) p.focus(); };
    wrap.lock = function () { wrap.classList.add('locked'); };
    wrap.clearInput = function () { pic.clear(); };
    wrap.fill = function (k) { pic.clear(); pic.set.pieces.slice(0, k.count).forEach(function (p) { p.node.dispatchEvent(new MouseEvent('click')); }); };
    return wrap;
  }
  function jug(a) {
    var pic = D.render({ type: 'jug', max: a.max, step: a.step, fill: 0 }, { interactive: true });
    var wrap = h('div', { class: 'ans-jug' }, [pic]);
    wrap.value = function () { return pic.value(); };
    wrap.focus = function () { var b = pic.querySelector('.jug-plus'); if (b) b.focus(); };
    wrap.lock = function () { wrap.classList.add('locked'); };
    wrap.clearInput = function () { pic.setMl(0); };
    wrap.fill = function (k) { pic.setMl(k.ml); };
    return wrap;
  }

  // Correct input for an answer spec (used for "Lösung zeigen" and tests).
  function keyOf(a) {
    var F = root.BB.frac;
    switch (a.type) {
      case 'frac': case 'share': {
        var v = a.value;
        if (a.whole === 'required' && v.n >= v.d) { var m = F.toMixed(v); return m.n ? { w: m.w, n: m.n, d: m.d } : { w: m.w, n: null, d: null }; }
        return { w: null, n: v.n, d: v.d };
      }
      case 'num': return { x: a.value };
      case 'money': return { ct: a.value };
      case 'division': return { a: a.a, b: a.b };
      case 'choice': return Array.isArray(a.correct) ? { ids: a.correct } : { id: a.correct };
      case 'shade': return { count: a.need };
      case 'jug': return { ml: a.target };
      case 'table': return { cells: a.slots.map(function (sl) { return sl.kind === 'num' ? { x: sl.value } : { n: sl.value.n, d: sl.value.d }; }) };
      case 'order': return { order: a.correct.slice() };
    }
    return null;
  }

  function make(a, onEnter) {
    switch (a.type) {
      case 'frac': return frac(a, onEnter);
      case 'division': return division(a, onEnter);
      case 'num': return num(a, onEnter);
      case 'money': return money(a, onEnter);
      case 'choice': return choice(a);
      case 'shade': return shade(a);
      case 'jug': return jug(a);
      case 'share': return root.BB.share.workshop(a, onEnter);
      case 'table': return table(a, onEnter);
      case 'order': return order(a);
    }
    throw new Error('no widget for ' + a.type);
  }

  root.BB.widgets = { make: make, keyOf: keyOf, parseEuro: parseEuro, frac: frac };
})(typeof window !== 'undefined' ? window : globalThis);
