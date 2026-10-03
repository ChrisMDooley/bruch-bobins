/*
 * share.js — the cutting workshop (Modul D/E): a things shared by b people.
 * Each thing can be cut into its own number of pieces. The pieces are handed out fairly
 * (biggest pieces first, always to whoever has least so far), so different cutting ideas can be tried:
 *   3 pizzas, 4 children: all in quarters → 3 × 1/4 each; or 2 in halves + 1 in quarters → 1/2 + 1/4 each.
 * Then the child writes how much each gets (the task checks that answer).
 */
(function (root) {
  'use strict';
  var U = root.BB.ui, h = U.h, T = root.BB.text, F = root.BB.frac, D = root.BB.draw;
  var PIE = D.PIE_KINDS;

  // pieces: [{item, size(F)}] → assignment and sums per person
  function distribute(cuts, b) {
    var pieces = [];
    cuts.forEach(function (c, i) { for (var k = 0; k < c; k++) pieces.push({ item: i, k: k, size: F.make(1, c) }); });
    var order = pieces.slice().sort(function (x, y) { return F.cmp(y.size, x.size) || x.item - y.item || x.k - y.k; });
    var sums = []; for (var j = 0; j < b; j++) sums.push(F.make(0, 1));
    var got = []; for (j = 0; j < b; j++) got.push([]);
    order.forEach(function (p) {
      var best = 0; for (var q = 1; q < b; q++) if (F.cmp(sums[q], sums[best]) < 0) best = q;
      p.kid = best; sums[best] = F.add(sums[best], p.size); got[best].push(p.size);
    });
    var fair = sums.every(function (s) { return F.eq(s, sums[0]); });
    return { pieces: pieces, sums: sums, got: got, fair: fair };
  }
  // "2 Stücke à {1/2} + 1 Stück à {1/4}"; whole things: "1 ganze Pizza"
  function describe(list, item) {
    var by = {}, keys = [];
    list.forEach(function (f) { var k = f.d; if (!by[k]) { by[k] = 0; keys.push(k); } by[k]++; });
    keys.sort(function (a, b) { return a - b; });
    return keys.map(function (d) {
      if (d === 1) return by[d] + ' ' + (by[d] === 1 ? (item ? { m: 'ganzer ', f: 'ganze ', n: 'ganzes ' }[item.g] + item.sg : 'Ganzes') : (item ? 'ganze ' + item.pl : 'Ganze'));
      return by[d] + (by[d] === 1 ? ' Stück' : ' Stücke') + ' à {1/' + d + '}';
    }).join(' + ') || 'nichts';
  }

  function workshop(a, onEnter) {
    var b = a.b, cuts = []; for (var i = 0; i < a.a; i++) cuts.push(1);
    var tried = {}, fairWays = 0;
    var itemsEl = h('div', { class: 'ws-items' }), kidsEl = h('div', { class: 'ws-kids' }), status = h('p', { class: 'ws-status', 'aria-live': 'polite' });
    var allBtns = h('div', { class: 'ws-quick' }, [
      h('span', { class: 'note', text: 'Alle auf einmal:' }),
      h('button', { class: 'btn soft small', type: 'button', text: 'halbieren', onclick: function () { setAll(2); } }),
      b !== 2 ? h('button', { class: 'btn soft small', type: 'button', text: 'in ' + b + ' Teile', onclick: function () { setAll(b); } }) : null,
      h('button', { class: 'btn soft small', type: 'button', text: '↺ ganz', onclick: function () { setAll(1); } })]);
    function setAll(n) { for (var i = 0; i < cuts.length; i++) cuts[i] = n; draw(); }
    var answer = root.BB.widgets.frac({ whole: 'optional', after: a.after }, onEnter);

    function draw() {
      var res = distribute(cuts, b);
      itemsEl.innerHTML = '';
      cuts.forEach(function (c, i) {
        var isPie = PIE[a.kind] !== undefined, s = D.svg(isPie ? 130 : 200, isPie ? 130 : 74), g = D.el('g', {}, s), set = D.pieceSet({ pal: D.pal(a.kind) });
        if (isPie) D.drawPie(g, 65, 67, 56, c, function () { return true; }, set, a.kind);
        else D.drawBar(g, 6, 6, 188, 62, 1, c, function () { return true; }, set, a.kind);
        var mine = res.pieces.filter(function (p) { return p.item === i; });
        set.pieces.forEach(function (p, k) { var kid = mine[k] ? mine[k].kid : 0; p.node.setAttribute('fill', c === 1 && b > 1 && !res.fair ? D.pal(a.kind).base : D.KIDS[kid % D.KIDS.length]); p.node.setAttribute('fill-opacity', '0.85'); });
        var lab = h('span', { class: 'ws-n', text: c === 1 ? 'ganz' : c + ' Teile' });
        itemsEl.appendChild(h('div', { class: 'ws-item' }, [s, h('div', { class: 'ws-ctrl' }, [
          h('button', { class: 'btn soft small', type: 'button', 'aria-label': 'weniger Teile', text: '−', onclick: function () { if (cuts[i] > 1) { cuts[i]--; draw(); } } }), lab,
          h('button', { class: 'btn soft small', type: 'button', 'aria-label': 'mehr Teile', text: '+', onclick: function () { if (cuts[i] < 12) { cuts[i]++; draw(); } } })])]));
      });
      kidsEl.innerHTML = '';
      res.got.forEach(function (list, k) {
        kidsEl.appendChild(h('div', { class: 'ws-kid' }, [h('span', { class: 'ws-dot', style: 'background:' + D.KIDS[k % D.KIDS.length] }),
          h('span', { class: 'ws-who', text: (a.each && /Person/.test(a.each) ? 'Person ' : a.each === 'jeder' ? 'Freund ' : 'Kind ') + (k + 1) + ':' }), h('span', { class: 'ws-got', rich: describe(list, a.item) })]));
      });
      var key = cuts.slice().sort().join('-');
      if (res.fair) {
        if (!tried[key]) { tried[key] = 1; fairWays++; }
        status.className = 'ws-status fair';
        status.textContent = fairWays >= 2 ? '✓ Gerecht! Und schon ' + fairWays + ' verschiedene Wege – alle gerecht.' : '✓ Gerecht! Alle bekommen gleich viel.';
      } else {
        status.className = 'ws-status';
        status.textContent = cuts.every(function (c) { return c === 1; }) ? 'Noch nicht geschnitten. Tippe auf + bei ' + (a.item.g === 'f' ? 'einer ' : 'einem ') + a.item.sg.replace(/^Tafel Schokolade$/, 'Tafel') + '.' : 'Noch nicht gerecht – manche bekommen mehr als andere.';
      }
      wrap.fair = res.fair; wrap.ways = fairWays;
    }
    var wrap = h('div', { class: 'ans-share' }, [allBtns, itemsEl, kidsEl, status,
      h('div', { class: 'ws-answer' }, [h('p', { class: 'ws-q', text: 'Wie viel bekommt ' + (a.each || 'jedes Kind') + '?' }), answer])]);
    draw();
    wrap.value = function () { return answer.value(); };
    wrap.focus = function () { var bt = itemsEl.querySelector('button'); if (bt) bt.focus(); };
    wrap.lock = function () { answer.lock(); wrap.classList.add('locked'); };
    wrap.clearInput = function () { answer.clearInput(); };
    wrap.fill = function (k) { setAll(b); answer.fill(k); };
    wrap.cuts = cuts; wrap.redraw = draw;
    return wrap;
  }

  root.BB.share = { workshop: workshop, distribute: distribute, describe: describe };
})(typeof window !== 'undefined' ? window : globalThis);
