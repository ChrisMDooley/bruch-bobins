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

  // Fraction boxes; whole: 'none' | 'optional' | 'required'
  function frac(a, onEnter) {
    var w = numBox('nbox-w', 'Ganze', onEnter), n = numBox('nbox-n', 'Zähler', onEnter), d = numBox('nbox-d', 'Nenner', onEnter);
    var showW = a.whole === 'required' || a.whole === 'optional';
    var wrap = h('div', { class: 'ans-frac' + (a.whole === 'required' ? ' need-w' : '') }, [
      showW ? h('label', { class: 'wbox' }, [w, h('span', { class: 'lab', text: a.whole === 'required' ? 'Ganze' : 'Ganze (wenn nötig)' })]) : null,
      h('div', { class: 'fbox' }, [n, h('span', { class: 'fline', 'aria-hidden': 'true' }), d]),
      a.after ? h('span', { class: 'after', rich: a.after }) : null]);
    wrap.value = function () { return { w: showW ? intOf(w) : null, n: intOf(n), d: intOf(d) }; };
    wrap.focus = function () { (a.whole === 'required' ? w : n).focus(); };
    wrap.lock = function () { [w, n, d].forEach(function (x) { x.disabled = true; }); };
    wrap.clearInput = function () { [w, n, d].forEach(function (x) { x.value = ''; }); };
    wrap.fill = function (k) { w.value = k.w == null ? '' : k.w; n.value = k.n == null ? '' : k.n; d.value = k.d == null ? '' : k.d; };
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
    var wrap = h('div', { class: 'ans-choice' + (a.pictures ? ' pictures' : '') + (a.long ? ' long' : '') + (a.multi ? ' multi' : ''), role: a.multi ? 'group' : 'radiogroup' });
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
    }
    throw new Error('no widget for ' + a.type);
  }

  root.BB.widgets = { make: make, keyOf: keyOf, parseEuro: parseEuro, frac: frac };
})(typeof window !== 'undefined' ? window : globalThis);
