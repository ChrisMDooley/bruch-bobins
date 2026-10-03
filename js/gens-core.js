/*
 * gens-core.js — task generators: registry, helpers, answer checking, topics A–D.
 *
 * A generator = { id, skill, tags, levels, params(level, R) → p, build(p) → task }.
 * build() is deterministic, so a task can be rebuilt exactly from its params (Fehlertraining).
 *
 * Task (what build returns):
 *   prompt, sub        markup text (text.js), read aloud with 🔊
 *   visual             picture spec for draw.js (display), or null
 *   answer             { type: 'frac'|'division'|'num'|'money'|'choice'|'shade'|'jug'|'share'|'steps', … }
 *   check(input)       → { ok, err, msg, note, incomplete }   (steps: checkStep(i, input))
 *   hints              4 graduated hints (brief §11), then
 *   solution           lines (markup), solutionVisual
 *   why                optional id of a "Warum stimmt das?" question (gens-why.js)
 *
 * Tags: visual · convert · world · concept · why · short (fits Schnelltraining) · challenge
 */
(function (root) {
  'use strict';
  var F = root.BB.frac, T = root.BB.text, C = root.BB.ctx;
  var fm = T.fm, cap = T.cap;

  var LIST = [], BY = {};
  function reg(g) { g.levels = g.levels || [1, 2, 3]; LIST.push(g); BY[g.id] = g; }

  // ---------------------------------------------------------------- randomness
  function makeR(rand) {
    rand = rand || Math.random;
    var R = {
      int: function (a, b) { return a + Math.floor(rand() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(rand() * arr.length)]; },
      chance: function (p) { return rand() < p; },
      shuffle: function (arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
      sample: function (n, k) { return R.shuffle(range(n)).slice(0, k).sort(function (a, b) { return a - b; }); }
    };
    return R;
  }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

  // ---------------------------------------------------------------- answer checking
  // Fraction input from the widget: {w, n, d} (numbers or null).
  function readFrac(inp) {
    if (!inp) return null;
    var w = inp.w, n = inp.n, d = inp.d;
    if (n == null && d == null) return w != null ? F.make(w, 1) : null;
    if (n == null || d == null) return null;
    if (d === 0) return 'zero';
    return F.make((w || 0) * d + n, d);
  }
  var ZERO = { ok: false, err: 'concept', msg: 'Im Nenner darf nie 0 stehen – durch 0 kann man nicht teilen.' };

  // spec: { value, whole: 'none'|'optional'|'required', detect: [fn(f, inp) → result|null] }
  function checkFrac(spec, inp) {
    var f = readFrac(inp);
    if (f === null) return { incomplete: true, msg: spec.whole === 'required' ? 'Trage die Ganzen und den Bruch ein.' : 'Trage Zähler und Nenner ein.' };
    if (f === 'zero') return ZERO;
    var v = spec.value;
    if (F.eq(f, v)) {
      var hasW = inp.w != null && inp.w > 0;
      if (spec.whole === 'required' && v.n >= v.d) {
        if (!hasW && !F.isWhole(v)) return { ok: false, err: 'mixed', msg: 'Der Wert stimmt! Schreibe ihn jetzt als *gemischte Zahl*: erst die Ganzen, dann den Rest.' };
        if (inp.n != null && inp.d != null && inp.n >= inp.d) return { ok: false, err: 'mixed', msg: 'Fast! Im Bruchteil darf nur noch ein Rest stehen – der Zähler muss kleiner als der Nenner sein.' };
      }
      if (spec.whole === 'none' && hasW) return { ok: false, err: 'mixed', msg: 'Der Wert stimmt! Schreibe ihn jetzt als *unechten Bruch* – ohne Ganze davor.' };
      var r = { ok: true };
      var shown = inp.w ? F.make(inp.n || 0, inp.d || 1) : f;
      if (!F.isLowest(shown) && shown.n > 0 && !spec.noNote) r.note = 'Richtig! ' + fm(shown) + ' ist dasselbe wie ' + fm(F.reduce(shown)) + ' – gleich viel, nur anders geschrieben.';
      return r;
    }
    var dets = (spec.detect || []).concat([detSwap]);
    for (var i = 0; i < dets.length; i++) { var x = dets[i](f, inp, spec); if (x) return x; }
    return { ok: false, err: spec.defaultErr || 'arith', msg: spec.wrongMsg || 'Das stimmt noch nicht. Schau dir die Aufgabe noch einmal genau an.' };
  }
  function detSwap(f, inp, spec) {
    var v = spec.value;
    if (v.n && F.eq(f, F.make(v.d, v.n)) && !F.eq(f, v)) return { ok: false, err: 'swap', msg: spec.swapMsg || 'Fast! Du hast Zähler und Nenner vertauscht. Der *Nenner* (unten) sagt, in wie viele Teile geteilt wird. Der *Zähler* (oben) zählt die Teile.' };
    return null;
  }
  function checkNum(value, inp, detect) {
    if (!inp || inp.x == null || isNaN(inp.x)) return { incomplete: true, msg: 'Trage eine Zahl ein.' };
    if (inp.x === value) return { ok: true };
    for (var i = 0; i < (detect || []).length; i++) { var x = detect[i](inp.x); if (x) return x; }
    return { ok: false, err: 'arith', msg: 'Das stimmt noch nicht. Rechne noch einmal nach.' };
  }
  function checkChoice(correct, inp, wrongs) {
    if (!inp || (inp.id == null && !inp.ids)) return { incomplete: true, msg: 'Wähle eine Antwort.' };
    if (Array.isArray(correct)) {
      var got = (inp.ids || []).slice().sort().join(','), want = correct.slice().sort().join(',');
      if (got === want) return { ok: true };
      return (wrongs && wrongs.multi && wrongs.multi(inp.ids)) || { ok: false, err: 'other', msg: 'Noch nicht ganz.' };
    }
    if (inp.id === correct) return { ok: true };
    var w = wrongs && wrongs[inp.id];
    return w ? { ok: false, err: w.err, msg: w.msg } : { ok: false, err: 'other', msg: 'Das stimmt noch nicht.' };
  }
  function opt(id, label, extra) { var o = { id: id, label: label }; for (var k in extra || {}) o[k] = extra[k]; return o; }

  // Picture of a fraction as wholes (circles/bars): value n/d → as many shapes as needed.
  function wholesVisual(f, kind) { return { type: 'wholes', kind: kind || 'kreis', d: f.d, count: f.n, wholes: Math.max(1, Math.ceil(f.n / f.d)) }; }

  // ================================================================ A – Was ist ein Bruch?

  reg({ id: 'zn_begriffe', skill: 'zn', tags: ['concept', 'short'],
    params: function (level, R) {
      var vs = level === 1 ? ['oben', 'unten', 'nenner', 'zaehler'] : level === 2 ? ['nenner', 'zaehler', 'strich', 'stamm'] : ['stamm', 'nenner', 'zaehler', 'gleich'];
      var d = R.pick([3, 4, 5, 6, 8, 10, 12]); return { v: R.pick(vs), n: R.int(1, d - 1), d: d, o: R.int(0, 99) };
    },
    build: function (p) {
      var f = '{' + p.n + '/' + p.d + '}', q, opts, correct, wr = {};
      var N = T.denomWord(p.d);
      var tipp = 'Merktrick: Der *Nenner* nennt, wie die Teile heißen (' + N + '). Der *Zähler* zählt, wie viele Teile man hat.';
      if (p.v === 'oben' || p.v === 'unten') {
        q = 'Wie heißt die Zahl ' + (p.v === 'oben' ? '*über*' : '*unter*') + ' dem Bruchstrich?';
        opts = [opt('z', 'Zähler'), opt('n', 'Nenner'), opt('b', 'Bruchstrich')]; correct = p.v === 'oben' ? 'z' : 'n';
        wr[p.v === 'oben' ? 'n' : 'z'] = { err: 'concept', msg: 'Andersherum: Der *Zähler* steht oben, der *Nenner* unten.' };
        wr.b = { err: 'concept', msg: 'Der Bruchstrich ist der Strich in der Mitte. Gefragt ist die Zahl ' + (p.v === 'oben' ? 'darüber' : 'darunter') + '.' };
      } else if (p.v === 'nenner') {
        q = 'Im Bruch ' + f + ': Was sagt der Nenner [' + p.d + ']?';
        opts = [opt('a', 'In wie viele gleich große Teile das Ganze geteilt ist.'), opt('b', 'Wie viele Teile man hat.'), opt('c', 'Wie viele Ganze es sind.')]; correct = 'a';
        wr.b = { err: 'concept', msg: 'Das macht der *Zähler*. Der Nenner sagt, in wie viele gleich große Teile geteilt wurde.' };
        wr.c = { err: 'concept', msg: 'Nein – ' + f + ' ist kleiner als ein Ganzes. Der Nenner sagt, in wie viele Teile geteilt wurde.' };
      } else if (p.v === 'zaehler') {
        q = 'Im Bruch ' + f + ': Was sagt der Zähler [' + p.n + ']?';
        opts = [opt('a', 'Wie viele dieser Teile man hat.'), opt('b', 'In wie viele Teile geteilt wurde.'), opt('c', 'Wie groß ein Teil ist.')]; correct = 'a';
        wr.b = { err: 'concept', msg: 'Das macht der *Nenner*. Der Zähler zählt, wie viele Teile man hat.' };
        wr.c = { err: 'concept', msg: 'Wie groß ein Teil ist, hängt vom Nenner ab. Der Zähler zählt die Teile.' };
      } else if (p.v === 'strich') {
        q = 'Wofür steht der Bruchstrich in ' + f + '?';
        opts = [opt('a', 'Für „geteilt durch“: ' + f + ' = ' + p.n + ' : ' + p.d), opt('b', 'Für „minus“'), opt('c', 'Für „mal“')]; correct = 'a';
        wr.b = wr.c = { err: 'concept', msg: 'Der Bruchstrich steht für das Divisionszeichen: ' + f + ' bedeutet ' + p.n + ' : ' + p.d + '.' };
      } else if (p.v === 'stamm') {
        q = 'Brüche mit dem Zähler 1, z. B. {1/' + p.d + '}, heißen …';
        opts = [opt('a', 'Stammbrüche'), opt('b', 'unechte Brüche'), opt('c', 'gemischte Zahlen')]; correct = 'a';
        wr.b = { err: 'concept', msg: '{1/' + p.d + '} ist kleiner als ein Ganzes – also kein unechter Bruch. Brüche mit Zähler 1 heißen *Stammbrüche*.' };
        wr.c = { err: 'concept', msg: 'Eine gemischte Zahl hat Ganze davor (z. B. {2 1/4}). Brüche mit Zähler 1 heißen *Stammbrüche*.' };
      } else {
        q = 'Ein Kuchen wird in 4 Stücke geschnitten – zwei große und zwei kleine. Ist ein Stück dann {1/4} des Kuchens?';
        opts = [opt('a', 'Nein – bei Brüchen müssen alle Teile gleich groß sein.'), opt('b', 'Ja – es sind ja 4 Stücke.')]; correct = 'a';
        wr.b = { err: 'equal', msg: 'Ein Viertel heißt: 4 *gleich große* Teile. Sind die Stücke verschieden groß, ist ein Stück kein Viertel.' };
      }
      opts = rot(opts, p.o);
      return { prompt: q, answer: { type: 'choice', options: opts, correct: correct },
        check: function (inp) { return checkChoice(correct, inp, wr); },
        hints: ['Denk an eine Pizza: In wie viele Stücke wird sie geschnitten – und wie viele davon isst du?',
                'In ' + f + ' steht ' + p.n + ' oben und ' + p.d + ' unten.', tipp, 'Bei Brüchen sind alle Teile gleich groß, und der Bruchstrich bedeutet „geteilt durch“.'],
        solution: [label(opts, correct), tipp] };
    }
  });
  function rot(arr, k) { k = k % arr.length; return arr.slice(k).concat(arr.slice(0, k)); }
  function label(opts, id) { for (var i = 0; i < opts.length; i++) if (opts[i].id === id) return 'Richtig ist: *' + opts[i].label + '*'; return ''; }

  // A shape cut into d equal pieces, k of them coloured.
  var SHAPES1 = [{ kind: 'pizza', type: 'pie' }, { kind: 'kreis', type: 'pie' }, { kind: 'kuchen', type: 'pie' }, { kind: 'rechteck', type: 'bar' }, { kind: 'streifen', type: 'bar' }];
  function shapeFor(p) {
    if (p.shape === 'tri') return { type: 'tri', k: p.tk, shaded: p.sh };
    if (p.shape === 'bar') return { type: 'bar', kind: p.kind, rows: p.rows, cols: p.cols, shaded: p.sh };
    return { type: 'pie', kind: p.kind, d: p.d, shaded: p.sh };
  }
  function shapeParams(level, R, d) {
    var p = {};
    if (level >= 2 && R.chance(0.25)) { p.shape = 'tri'; p.tk = R.pick([2, 3]); p.d = p.tk * p.tk; }
    else if (level >= 2 && R.chance(0.5)) {
      var g = R.pick([[2, 3], [2, 4], [3, 4], [2, 5], [3, 3], [2, 6], [4, 4], [3, 5]]);
      p.shape = 'bar'; p.kind = R.pick(['schokolade', 'rechteck']); p.rows = g[0]; p.cols = g[1]; p.d = g[0] * g[1];
    } else {
      var s = R.pick(SHAPES1); p.d = d || R.pick(level === 1 ? [2, 3, 4, 5, 6, 8] : [5, 6, 7, 8, 9, 10, 12]);
      if (s.type === 'bar') { p.shape = 'bar'; p.kind = s.kind; p.rows = 1; p.cols = p.d; } else { p.shape = 'pie'; p.kind = s.kind; }
    }
    return p;
  }

  reg({ id: 'erkennen', skill: 'erkennen', tags: ['visual', 'short'],
    params: function (level, R) {
      if (level === 3 && R.chance(0.5)) {
        var d = R.pick([2, 3, 4, 6, 8]), w = R.int(1, 2), r = R.int(1, d - 1);
        return { multi: true, d: d, n: w * d + r, kind: R.pick(['pizza', 'kreis', 'kuchen']) };
      }
      var p = shapeParams(level, R); p.k = R.int(1, p.d - 1); p.sh = R.sample(p.d, p.k); return p;
    },
    build: function (p) {
      if (p.multi) {
        var v = F.make(p.n, p.d), N = T.denomWord(p.d);
        return { prompt: 'Welcher Bruch ist gefärbt? Jede Figur ist ein Ganzes.', sub: 'Zähle alle gefärbten ' + N + '.',
          visual: wholesVisual(v, p.kind), answer: { type: 'frac', whole: 'optional', value: v },
          check: function (inp) { return checkFrac({ value: v, whole: 'optional', noNote: true, detect: [function (f) {
            var m = F.toMixed(v); if (F.eq(f, F.make(m.n, p.d))) return { ok: false, err: 'whole', msg: 'Du hast nur das letzte Stück gezählt. Die ganzen Figuren gehören auch dazu: jede hat ' + p.d + ' ' + N + '.' }; return null; }] }, inp); },
          hints: ['In wie viele gleich große Teile ist *eine* Figur geteilt?', 'Jede Figur hat ' + p.d + ' Teile – das sind ' + N + '. Wie viele Teile sind insgesamt gefärbt?',
                  'Zähle alle gefärbten Teile in allen Figuren zusammen.', 'Gefärbte ' + N + ' oben, ' + p.d + ' unten. Du kannst es auch als gemischte Zahl schreiben.'],
          solution: ['Jede Figur hat ' + p.d + ' gleich große Teile (' + N + ').', 'Gefärbt sind ' + p.n + ' ' + N + ': ' + fm(v) + ' = ' + fm(v, true) + '.'], why: 'unecht-mehr' };
      }
      var val = F.make(p.k, p.d);
      return { prompt: 'Welcher Bruch ist gefärbt?', visual: shapeFor(p), answer: { type: 'frac', whole: 'none', value: val },
        check: function (inp) { return checkFrac({ value: val, whole: 'none', noNote: true, detect: [function (f) {
          if (p.d - p.k > 0 && F.eq(f, F.make(p.k, p.d - p.k)) && !F.eq(f, val)) return { ok: false, err: 'part', msg: 'Fast! Du hast die gefärbten Teile mit den *ungefärbten* verglichen. Unten steht die Zahl *aller* Teile: ' + p.d + '.' };
          if (F.eq(f, F.make(p.d - p.k, p.d))) return { ok: false, err: 'count', msg: 'Du hast die *weißen* Teile gezählt. Gefragt ist der gefärbte Anteil.' };
          if (f.d !== p.d && f.n === p.k) return { ok: false, err: 'count', msg: 'Der Zähler stimmt. Zähle noch einmal *alle* Teile der Figur – das ist der Nenner.' };
          return null; }] }, inp); },
        hints: ['In wie viele gleich große Teile ist die Figur geteilt?', 'Wie viele Teile sind gefärbt?', 'Der Nenner (unten) zählt *alle* Teile, der Zähler (oben) die *gefärbten*.', 'Schreibe: gefärbte Teile über den Bruchstrich, alle Teile darunter.'],
        solution: ['Die Figur hat ' + p.d + ' gleich große Teile.', p.k + (p.k === 1 ? ' davon ist gefärbt.' : ' davon sind gefärbt.'), 'Also ist ' + fm(val) + ' gefärbt.'] };
    }
  });

  reg({ id: 'erkennen_wahl', skill: 'erkennen', tags: ['visual', 'short'],
    params: function (level, R) {
      var d = R.pick(level === 1 ? [3, 4, 5, 6] : [4, 5, 6, 8]), k = R.int(1, d - 1);
      if (k * 2 === d) k = Math.max(1, k - 1);
      return { d: d, k: k, kind: R.pick(['pie', 'bar']), o: R.int(0, 3), u: R.int(0, 99) };
    },
    build: function (p) {
      var v = F.make(p.k, p.d), kd = p.kind === 'pie' ? 'kreis' : 'rechteck';
      function vis(d, sh) { return p.kind === 'pie' ? { type: 'pie', kind: kd, d: d, shaded: sh } : { type: 'bar', kind: kd, rows: 1, cols: d, shaded: sh }; }
      var first = range(p.k), opts = [
        opt('ok', '', { visual: vis(p.d, first) }),
        opt('part', '', { visual: vis(p.d + p.k, first) }),
        opt('comp', '', { visual: vis(p.d, range(p.d - p.k)) }),
        opt('uneq', '', { visual: { type: 'unequal', kind: p.kind, d: p.d, shaded: first, seed: p.u } })
      ];
      opts = rot(opts, p.o);
      var wr = { part: { err: 'part', msg: 'Hier sind ' + p.k + ' Teile gefärbt und ' + p.d + ' *weiß* – zusammen ' + (p.d + p.k) + ' Teile. Der Nenner zählt alle Teile.' },
                 comp: { err: 'count', msg: 'Hier sind ' + (p.d - p.k) + ' von ' + p.d + ' Teilen gefärbt – das ist ' + fm(F.make(p.d - p.k, p.d)) + '.' },
                 uneq: { err: 'equal', msg: 'Achtung: Hier sind die Teile *nicht gleich groß*. Bei Brüchen müssen alle Teile gleich groß sein.' } };
      return { prompt: 'Welches Bild zeigt ' + fm(v) + '?', answer: { type: 'choice', options: opts, pictures: true, correct: 'ok' },
        check: function (inp) { return checkChoice('ok', inp, wr); },
        hints: ['Wie viele gleich große Teile braucht ein Bild für ' + fm(v) + '?', 'Es müssen ' + p.d + ' *gleich große* Teile sein.', 'Davon müssen ' + p.k + ' gefärbt sein.', 'Prüfe bei jedem Bild: Sind alle Teile gleich groß? Wie viele sind es insgesamt?'],
        solution: ['Für ' + fm(v) + ' braucht man ' + p.d + ' gleich große Teile, von denen ' + p.k + (p.k === 1 ? ' gefärbt ist.' : ' gefärbt sind.')] };
    }
  });

  reg({ id: 'zeichnen', skill: 'zeichnen', tags: ['visual', 'short'],
    params: function (level, R) {
      if (level === 3 && R.chance(0.5)) { var d = R.pick([2, 3, 4, 6]); return { multi: true, d: d, n: R.int(d + 1, 2 * d - 1), kind: R.pick(['pizza', 'kreis']) }; }
      if (level >= 2 && R.chance(0.6)) {
        // more pieces than the denominator: 3/4 of a 12-piece chocolate bar
        var c = R.pick([[2, 1, 4], [3, 2, 4], [1, 2, 3], [2, 2, 3], [1, 2, 6], [3, 3, 4], [1, 2, 4], [2, 3, 5], [3, 2, 5]]);
        var dd = c[2], kk = R.int(1, dd - 1), rows = c[0], cols = c[1] * dd;
        if (rows * cols > 24) { rows = 1; }
        return { k: kk, d: dd, shape: 'bar', kind: 'schokolade', rows: rows, cols: cols };
      }
      var p = shapeParams(1, R); p.k = R.int(1, p.d - 1); return p;
    },
    build: function (p) {
      if (p.multi) {
        var v = F.make(p.n, p.d), N = T.denomWord(p.d);
        return { prompt: 'Markiere ' + fm(v) + '. Jeder Kreis ist ein Ganzes.', sub: 'Tippe die Stücke an.',
          answer: { type: 'shade', visual: { type: 'wholes', kind: p.kind, d: p.d, count: 0, wholes: 2 }, need: p.n },
          check: function (inp) { return shadeCheck(inp, p.n, p.d * 2, v, p.d); },
          hints: ['Wie viele ' + N + ' hat ein ganzer Kreis?', fm(v) + ' sind ' + p.n + ' ' + N + ' – das ist mehr als ein Ganzes.', 'Färbe zuerst einen ganzen Kreis (' + p.d + ' Stücke).', 'Dann noch ' + (p.n - p.d) + ' Stücke im zweiten Kreis.'],
          solution: [fm(v) + ' = ' + p.n + ' ' + N + ' = ' + fm(v, true) + ': ein ganzer Kreis und ' + (p.n - p.d) + ' ' + N + '.'], solutionVisual: wholesVisual(v, p.kind), why: 'unecht-mehr' };
      }
      var vis = shapeFor(p); vis.shaded = []; var total = p.shape === 'bar' ? p.rows * p.cols : p.d;
      var val = F.make(p.k, p.d), need = F.ofInt(val, total), what = { pizza: 'der Pizza', kuchen: 'des Kuchens', kreis: 'des Kreises', schokolade: 'der Schokolade', rechteck: 'des Rechtecks', streifen: 'des Streifens' }[p.kind] || 'der Figur';
      if (p.shape === 'tri') what = 'des Dreiecks';
      var more = total !== p.d;
      return { prompt: 'Markiere ' + fm(val) + ' ' + what + '.', sub: 'Tippe die Stücke an, um sie zu färben.',
        answer: { type: 'shade', visual: vis, need: need },
        check: function (inp) { return shadeCheck(inp, need, total, val, p.d); },
        hints: more ? ['Wie viele Stücke hat die Tafel insgesamt?', 'Es sind ' + total + ' Stücke. Teile sie in ' + p.d + ' gleich große Gruppen: ' + total + ' : ' + p.d + ' = ' + total / p.d + '.', 'Ein ' + T.denomWord(p.d).replace(/e$/, '') + ' sind also ' + total / p.d + ' Stücke.', fm(val) + ' sind ' + p.k + ' solche Gruppen.']
                    : ['In wie viele Teile ist die Figur geteilt?', 'Der Nenner ist ' + p.d + ' – passt.', 'Der Zähler sagt, wie viele Teile du färben sollst.', 'Färbe ' + p.k + ' Teile.'],
        solution: more ? ['Die Tafel hat ' + total + ' Stücke. ' + total + ' : ' + p.d + ' = ' + total / p.d + ' Stücke sind {1/' + p.d + '}.', fm(val) + ' sind ' + p.k + ' · ' + total / p.d + ' = ' + need + ' Stücke.']
                       : [fm(val) + ': Von ' + p.d + ' gleich großen Teilen ' + (p.k === 1 ? 'wird 1' : 'werden ' + p.k) + ' gefärbt.'] };
    }
  });
  function shadeCheck(inp, need, total, val, d) {
    if (!inp || inp.count == null || inp.count === 0) return { incomplete: true, msg: 'Tippe Stücke an, um sie zu färben.' };
    if (inp.count === need) return { ok: true };
    if (inp.count === total - need) return { ok: false, err: 'count', msg: 'Du hast den *Rest* gefärbt. Färbe genau die Teile für ' + fm(val) + '.' };
    if (total !== d && inp.count === val.n) return { ok: false, err: 'count', msg: 'Achtung: Die Figur hat ' + total + ' Stücke, nicht ' + d + '. ' + fm(val) + ' von ' + total + ' Stücken sind ' + need + ' Stücke.' };
    return { ok: false, err: 'count', msg: 'Es sind ' + inp.count + ' Stücke gefärbt. Für ' + fm(val) + ' brauchst du ' + (inp.count < need ? 'mehr' : 'weniger') + '.' };
  }

  // ================================================================ B – echte / unechte Brüche, natürliche Zahlen

  reg({ id: 'echt_wahl', skill: 'echt', tags: ['concept', 'short'],
    params: function (level, R) {
      if (level === 3 && R.chance(0.6)) {
        var fs = [], seen = {};
        while (fs.length < 6) { var d = R.int(2, 12), n = R.pick([R.int(1, d - 1), R.int(d, 3 * d), d]); var k = n + '/' + d; if (!seen[k]) { seen[k] = 1; fs.push([n, d]); } }
        if (!fs.some(function (x) { return x[0] >= x[1]; })) fs[0] = [fs[0][1] + 1, fs[0][1]];
        if (!fs.some(function (x) { return x[0] < x[1]; })) fs[1] = [1, fs[1][1] + 1];
        return { multi: true, fs: fs };
      }
      var dd = R.int(2, level === 1 ? 8 : 12), kind = R.pick(level === 1 ? ['echt', 'unecht'] : ['echt', 'unecht', 'gleich']);
      var nn = kind === 'echt' ? R.int(1, dd - 1) : kind === 'gleich' ? dd : R.int(dd + 1, dd * 3);
      return { n: nn, d: dd };
    },
    build: function (p) {
      if (p.multi) {
        var opts = p.fs.map(function (x, i) { return opt('f' + i, '{' + x[0] + '/' + x[1] + '}'); });
        var correct = p.fs.map(function (x, i) { return x[0] >= x[1] ? 'f' + i : null; }).filter(Boolean);
        return { prompt: 'Tippe *alle unechten* Brüche an.', answer: { type: 'choice', options: opts, multi: true, correct: correct },
          check: function (inp) { return checkChoice(correct, inp, { multi: function (ids) {
            var bad = (ids || []).filter(function (id) { return correct.indexOf(id) < 0; });
            return { ok: false, err: 'echt', msg: bad.length ? 'Nicht alle stimmen: ' + bad.map(function (id) { var x = p.fs[+id.slice(1)]; return '{' + x[0] + '/' + x[1] + '}'; }).join(', ') + ' ist echt – der Zähler ist kleiner als der Nenner.' : 'Es fehlen noch unechte Brüche. Achte auch auf Brüche, bei denen Zähler und Nenner gleich sind.' }; } }); },
          hints: ['Vergleiche bei jedem Bruch Zähler (oben) und Nenner (unten).', 'Ist der Zähler kleiner, ist der Bruch kleiner als ein Ganzes.', 'Unecht heißt: Zähler *gleich oder größer* als der Nenner.', 'Brüche wie {5/5} sind auch unecht – sie sind genau ein Ganzes.'],
          solution: ['Unecht (Zähler ≥ Nenner): ' + correct.map(function (id) { var x = p.fs[+id.slice(1)]; return '{' + x[0] + '/' + x[1] + '}'; }).join(', ')], why: 'unecht-def' };
      }
      var v = F.make(p.n, p.d), unecht = p.n >= p.d;
      var opts2 = [opt('echt', 'echter Bruch'), opt('unecht', 'unechter Bruch')];
      var wr = {}; wr[unecht ? 'echt' : 'unecht'] = { err: 'echt', msg: unecht ? 'Bei ' + fm(v) + ' ist der Zähler ' + (p.n === p.d ? '*gleich*' : '*größer als*') + ' der Nenner. Das ist ' + (p.n === p.d ? 'genau ein Ganzes' : 'mehr als ein Ganzes') + ' – also unecht.'
                                                                              : 'Bei ' + fm(v) + ' ist der Zähler kleiner als der Nenner. Das ist weniger als ein Ganzes – also echt.' };
      return { prompt: 'Ist ' + fm(v) + ' ein echter oder ein unechter Bruch?', answer: { type: 'choice', options: opts2, correct: unecht ? 'unecht' : 'echt' },
        check: function (inp) { return checkChoice(unecht ? 'unecht' : 'echt', inp, wr); },
        hints: ['Vergleiche Zähler und Nenner: ' + p.n + ' und ' + p.d + '.', 'Ist ' + fm(v) + ' weniger als ein Ganzes?', 'Echt: Zähler kleiner als Nenner. Unecht: Zähler gleich oder größer.', 'Ein Ganzes sind {' + p.d + '/' + p.d + '}.'],
        solution: [fm(v) + ' ist ' + (unecht ? 'ein *unechter* Bruch: ' + p.n + (p.n === p.d ? ' = ' : ' > ') + p.d + '.' : 'ein *echter* Bruch: ' + p.n + ' < ' + p.d + '.')],
        solutionVisual: wholesVisual(v, 'kreis'), why: unecht ? 'unecht-def' : null };
    }
  });

  reg({ id: 'natuerlich', skill: 'echt', tags: ['concept', 'short'],
    params: function (level, R) {
      var v = R.pick(level === 1 ? ['ganz', 'null', 'eins'] : level === 2 ? ['ganz', 'reihe', 'eins'] : ['reihe', 'ganz', 'durch1']);
      var d = R.int(2, 12), w = R.int(2, level === 1 ? 4 : 8);
      return { v: v, d: d, w: w };
    },
    build: function (p) {
      var d = p.d, w = p.w;
      if (p.v === 'reihe') {
        return { prompt: 'Setze die Reihe fort: {0/' + d + '} = 0;  {' + d + '/' + d + '} = 1;  {' + 2 * d + '/' + d + '} = 2; …', sub: 'Welcher Bruch mit Nenner ' + d + ' ergibt ' + w + '? Trage den Zähler ein.',
          answer: { type: 'num', pre: '', post: '/ ' + d + ' = ' + w, value: w * d },
          check: function (inp) { return checkNum(w * d, inp, [function (x) { return x === w + d ? { ok: false, err: 'mixed', msg: 'Du hast addiert. Jedes Ganze hat ' + d + ' ' + T.denomWord(d) + ' – also ' + w + ' · ' + d + '.' } : null; }]); },
          hints: ['Wie viele ' + T.denomWord(d) + ' sind ein Ganzes?', 'Mit jedem Schritt kommt ein Ganzes dazu – also ' + d + ' mehr im Zähler.', 'Für ' + w + ' Ganze brauchst du ' + w + ' · ' + d + ' ' + T.denomWord(d) + '.', w + ' · ' + d + ' = ?'],
          solution: ['{' + w * d + '/' + d + '} = ' + w + ', weil ' + w * d + ' : ' + d + ' = ' + w + '.', 'Der Zähler ist ein *Vielfaches* des Nenners – so entsteht eine natürliche Zahl.'], why: 'natuerlich' };
      }
      var n = p.v === 'null' ? 0 : p.v === 'eins' ? d : p.v === 'durch1' ? w : w * d, dd = p.v === 'durch1' ? 1 : d, res = n / dd;
      return { prompt: 'Welche Zahl ist ' + '{' + n + '/' + dd + '}?', answer: { type: 'num', value: res },
        check: function (inp) { return checkNum(res, inp, [function (x) { return (n === 0 && x === dd) ? { ok: false, err: 'concept', msg: '0 Teile von ' + dd + ' sind gar nichts – also 0.' } : null; }]); },
        hints: ['Ein Bruch ist eine Division: ' + '{' + n + '/' + dd + '} = ' + n + ' : ' + dd + '.', n === 0 ? 'Wie viel hast du, wenn du 0 Teile nimmst?' : 'Wie oft passt ' + dd + ' in ' + n + '?', 'Rechne ' + n + ' : ' + dd + '.', 'Das Ergebnis ist eine natürliche Zahl.'],
        solution: ['{' + n + '/' + dd + '} = ' + n + ' : ' + dd + ' = ' + res], why: n === 0 ? null : 'natuerlich' };
    }
  });

  // ================================================================ C – gemischte Zahlen

  function u2gParams(level, R) {
    var d = R.pick(level === 1 ? [2, 3, 4] : level === 2 ? [3, 4, 5, 6, 8, 10] : [5, 6, 7, 8, 9, 10, 12]);
    var w = R.int(1, level === 1 ? 3 : level === 2 ? 4 : 6), r = (level === 3 && R.chance(0.15)) ? 0 : R.int(1, d - 1);
    return { d: d, n: w * d + r };
  }
  reg({ id: 'u2g', skill: 'u2g', tags: ['convert', 'short'], params: u2gParams,
    build: function (p) {
      var v = F.make(p.n, p.d), m = F.toMixed(v), N = T.denomWord(p.d);
      return { prompt: 'Schreibe ' + fm(v) + ' als gemischte Zahl.', answer: { type: 'frac', whole: 'required', value: v },
        check: function (inp) {
          var r = checkFrac({ value: v, whole: 'required', noNote: true, detect: [function (f, i) {
            if (i.w === m.w && i.d === p.d && i.n !== m.n) return { ok: false, err: 'mixed', msg: 'Die Ganzen stimmen! Prüfe den Rest: ' + p.n + ' : ' + p.d + ' = ' + m.w + ' Rest ?' };
            if ((i.w || 0) === 0 && i.n === m.n && i.d === p.d) return { ok: false, err: 'whole', msg: 'Der Rest stimmt, aber die *Ganzen* fehlen. Wie oft passt ' + p.d + ' in ' + p.n + '?' };
            if (i.w != null && i.w !== m.w) return { ok: false, err: 'mixed', msg: 'Prüfe die Ganzen: Wie oft passt ' + p.d + ' ganz in ' + p.n + '? (' + p.d + ' ' + N + ' = 1 Ganzes)' };
            return null; }] }, inp);
          if (r.ok && m.n === 0 && inp.n) r.note = 'Richtig! ' + fm(v) + ' ist sogar genau ' + m.w + ' – eine natürliche Zahl.';
          return r;
        },
        hints: ['Wie viele ' + N + ' sind ein Ganzes?', 'Wie oft passt ' + p.d + ' in ' + p.n + '?', p.n + ' : ' + p.d + ' = ' + m.w + ' Rest ' + m.n, 'Die ' + m.w + ' sind die Ganzen. Der Rest ' + m.n + ' bleibt im Zähler, der Nenner bleibt ' + p.d + '.'],
        solution: [p.d + ' ' + N + ' sind ein Ganzes.', p.n + ' : ' + p.d + ' = ' + m.w + ' Rest ' + m.n + ' →  ' + fm(v) + ' = ' + (m.n ? m.w + ' + {' + m.n + '/' + p.d + '} = ' + fm(v, true) : m.w)],
        solutionVisual: wholesVisual(v, 'kreis'), why: 'gemischt-warum' };
    }
  });

  reg({ id: 'g2u', skill: 'g2u', tags: ['convert', 'short'],
    params: function (level, R) { var p = u2gParams(level, R); if (p.n % p.d === 0) p.n += 1; return p; },
    build: function (p) {
      var v = F.make(p.n, p.d), m = F.toMixed(v), N = T.denomWord(p.d);
      return { prompt: 'Schreibe ' + fm(v, true) + ' als unechten Bruch.', answer: { type: 'frac', whole: 'none', value: v },
        check: function (inp) { return checkFrac({ value: v, whole: 'none', noNote: true, detect: [function (f) {
          if (F.eq(f, F.make(m.w + m.n, p.d))) return { ok: false, err: 'mixed', msg: 'Du hast ' + m.w + ' + ' + m.n + ' gerechnet. Aber ein Ganzes sind ' + p.d + ' ' + N + ': ' + m.w + ' Ganze = ' + m.w + ' · ' + p.d + ' = ' + m.w * p.d + ' ' + N + '.' };
          if (F.eq(f, F.make(m.w * m.n + p.d, p.d)) || F.eq(f, F.make(m.w * m.n, p.d))) return { ok: false, err: 'mixed', msg: 'Nimm die Ganzen mal den *Nenner* (nicht mal den Zähler): ' + m.w + ' · ' + p.d + ' = ' + m.w * p.d + '.' };
          if (F.eq(f, F.make(m.w * p.d, p.d))) return { ok: false, err: 'mixed', msg: 'Die Ganzen hast du richtig umgewandelt! Jetzt fehlt noch der Rest: + ' + m.n + ' ' + N + '.' };
          if (F.eq(f, F.make(m.n, p.d))) return { ok: false, err: 'whole', msg: 'Die ' + m.w + ' Ganzen fehlen. Jedes Ganze hat ' + p.d + ' ' + N + '.' };
          return null; }] }, inp); },
        hints: ['Wie viele ' + N + ' hat ein Ganzes?', 'Wie viele ' + N + ' sind ' + m.w + ' Ganze?', m.w + ' · ' + p.d + ' = ' + m.w * p.d + ' ' + N, 'Zähle den Rest dazu: ' + m.w * p.d + ' + ' + m.n + '.'],
        solution: [(m.w === 1 ? '1 Ganzes = ' + p.d : m.w + ' Ganze = ' + m.w + ' · ' + p.d + ' = ' + m.w * p.d) + ' ' + N + '.', m.w * p.d + ' + ' + m.n + ' = ' + p.n + '  →  ' + fm(v, true) + ' = ' + fm(v)],
        solutionVisual: wholesVisual(v, 'kreis'), why: 'gemischt-warum' };
    }
  });

  reg({ id: 'gemischt_bild', skill: 'u2g', tags: ['visual', 'convert'],
    params: function (level, R) { var p = u2gParams(Math.min(level, 2), R); if (p.n % p.d === 0) p.n += 1; p.kind = R.pick(['pizza', 'kreis', 'kuchen']); return p; },
    build: function (p) {
      var v = F.make(p.n, p.d), m = F.toMixed(v), N = T.denomWord(p.d);
      return { prompt: 'Jede Figur ist ein Ganzes. Wie viel ist gefärbt?', visual: wholesVisual(v, p.kind),
        answer: { type: 'steps', steps: [
          { label: 'Als *gemischte Zahl*:', answer: { type: 'frac', whole: 'required', value: v }, check: function (inp) { return checkFrac({ value: v, whole: 'required', noNote: true }, inp); } },
          { label: 'Als *unechter Bruch*:', answer: { type: 'frac', whole: 'none', value: v }, check: function (inp) { return checkFrac({ value: v, whole: 'none', noNote: true, detect: [function (f) { return F.eq(f, F.make(m.w + m.n, p.d)) ? { ok: false, err: 'mixed', msg: 'Zähle *alle* gefärbten ' + N + ': ' + m.w + ' ganze Figuren haben je ' + p.d + ' Stücke.' } : null; }] }, inp); } } ] },
        hints: ['Wie viele Figuren sind ganz gefärbt?', 'Das sind die Ganzen: ' + m.w + '. Welcher Teil der letzten Figur ist gefärbt?', 'Jede Figur hat ' + p.d + ' Stücke (' + N + ').', 'Zähle für den unechten Bruch alle gefärbten Stücke.'],
        solution: [(m.w === 1 ? '1 Ganzes' : m.w + ' Ganze') + ' und {' + m.n + '/' + p.d + '}: ' + fm(v, true), 'Alle Stücke: ' + m.w + ' · ' + p.d + ' + ' + m.n + ' = ' + p.n + ' ' + N + ' = ' + fm(v)] };
    }
  });

  // ================================================================ D – Bruch als Division

  reg({ id: 'div_bruch', skill: 'division', tags: ['convert', 'short'],
    params: function (level, R) {
      if (level >= 2 && R.chance(0.12)) return { a: R.int(1, 9), b: 0 };
      var b = R.int(2, 12), a = level === 1 ? R.int(1, b - 1) : R.chance(0.5) ? R.int(b + 1, 3 * b) : R.int(1, b - 1);
      if (level === 3 && R.chance(0.3)) { b = R.int(2, 9); a = b * R.int(2, 6); }
      return { a: a, b: b };
    },
    build: function (p) {
      if (p.b === 0) {
        var opts = [opt('nm', 'Das geht nicht – durch 0 kann man nicht teilen.'), opt('0', '0'), opt('a', String(p.a))];
        return { prompt: 'Schreibe als Bruch: ' + p.a + ' : 0', answer: { type: 'choice', options: opts, correct: 'nm' },
          check: function (inp) { return checkChoice('nm', inp, { '0': { err: 'concept', msg: 'Durch 0 teilen geht nicht: Auf 0 Kinder kann man nichts verteilen. Deshalb darf im Nenner nie 0 stehen.' }, a: { err: 'concept', msg: p.a + ' : 1 wäre ' + p.a + '. Aber durch 0 kann man nicht teilen.' } }); },
          hints: ['Stell dir vor: ' + p.a + ' Pizzen werden auf 0 Kinder verteilt.', 'Wie viel bekommt jedes Kind – wenn es gar keine Kinder gibt?', 'Teilen durch 0 hat kein Ergebnis.', 'Deshalb darf im Nenner niemals 0 stehen.'],
          solution: [p.a + ' : 0 ist nicht möglich. Im Nenner darf niemals 0 stehen.'], why: 'nenner-null' };
      }
      var v = F.make(p.a, p.b);
      return { prompt: 'Schreibe als Bruch:  ' + p.a + ' : ' + p.b, answer: { type: 'frac', whole: 'optional', value: v },
        check: function (inp) { return checkFrac({ value: v, whole: 'optional', swapMsg: 'Vertauscht! Bei ' + p.a + ' : ' + p.b + ' wird der *Dividend* ' + p.a + ' zum Zähler (oben) und der *Divisor* ' + p.b + ' zum Nenner (unten).' }, inp); },
        hints: ['Ein Bruchstrich bedeutet „geteilt durch“.', 'Welche Zahl wird geteilt? Das ist der Dividend.', 'Der Dividend kommt nach oben in den Zähler.', 'Der Divisor (die Zahl nach dem :) kommt nach unten.'],
        solution: [p.a + ' : ' + p.b + ' = ' + fm(v) + (p.a >= p.b && p.a % p.b ? ' = ' + fm(v, true) : p.a % p.b === 0 ? ' = ' + p.a / p.b : '')], why: 'div-warum' };
    }
  });

  reg({ id: 'bruch_div', skill: 'division', tags: ['convert', 'short'],
    params: function (level, R) { var b = R.int(2, 12); return { a: level === 1 ? R.int(1, b - 1) : R.int(1, 3 * b), b: b }; },
    build: function (p) {
      var v = F.make(p.a, p.b);
      return { prompt: 'Schreibe den Bruch als Division:  ' + fm(v) + ' = ? : ?', answer: { type: 'division', a: p.a, b: p.b },
        check: function (inp) {
          if (!inp || inp.a == null || inp.b == null) return { incomplete: true, msg: 'Trage beide Zahlen ein.' };
          if (inp.a === p.a && inp.b === p.b) return { ok: true };
          if (inp.b === 0) return ZERO;
          if (inp.a === p.b && inp.b === p.a) return { ok: false, err: 'divrev', msg: 'Andersherum: Der *Zähler* ' + p.a + ' wird geteilt – er kommt vor das „:“.' };
          if (F.eq(F.make(inp.a, inp.b), v)) return { ok: true, note: 'Richtig – ' + inp.a + ' : ' + inp.b + ' ergibt dasselbe wie ' + p.a + ' : ' + p.b + '.' };
          return { ok: false, err: 'concept', msg: 'Der Bruchstrich ist das „:“. Zähler : Nenner.' };
        },
        hints: ['Der Bruchstrich steht für das Divisionszeichen.', 'Welche Zahl steht oben?', 'Oben = Dividend (wird geteilt), unten = Divisor.', 'Schreibe: Zähler : Nenner.'],
        solution: [fm(v) + ' = ' + p.a + ' : ' + p.b] };
    }
  });

  reg({ id: 'div_begriffe', skill: 'division', tags: ['concept', 'short'],
    params: function (level, R) { var a = R.int(2, 9) * 2, b = 2; return { v: R.pick(level === 1 ? ['dividend', 'divisor', 'quotient'] : ['dividend', 'divisor', 'quotient', 'eins-oben', 'eins-unten', 'strich']), a: a * R.int(1, 3), b: R.pick([2, 3, 4]), n: R.int(2, 9), o: R.int(0, 99) }; },
    build: function (p) {
      var a = p.b * Math.max(2, Math.round(p.a / p.b)), q = a / p.b, prompt, opts, correct, wr = {};
      if (p.v === 'dividend' || p.v === 'divisor' || p.v === 'quotient') {
        var which = { dividend: a, divisor: p.b, quotient: q }[p.v];
        prompt = 'In ' + a + ' : ' + p.b + ' = ' + q + ' – wie heißt die Zahl ' + which + '?';
        if (a === q || p.b === q) prompt = 'In ' + a + ' : ' + p.b + ' = ' + q + ' – wie heißt die Zahl ' + (p.v === 'dividend' ? 'vor dem „:“' : p.v === 'divisor' ? 'nach dem „:“' : 'nach dem „=“') + '?';
        opts = [opt('dividend', 'Dividend'), opt('divisor', 'Divisor'), opt('quotient', 'Quotient')]; correct = p.v;
        ['dividend', 'divisor', 'quotient'].forEach(function (k) { if (k !== p.v) wr[k] = { err: 'concept', msg: 'Dividend : Divisor = Quotient. Die Zahl, die geteilt wird, ist der *Dividend*; durch den *Divisor* wird geteilt; das Ergebnis ist der *Quotient*.' }; });
      } else if (p.v === 'eins-oben') {
        prompt = 'Setzt man 1 als *Dividend* ein, z. B. 1 : ' + p.n + ', entsteht …';
        opts = [opt('stamm', 'ein Stammbruch: {1/' + p.n + '}'), opt('nat', 'eine natürliche Zahl'), opt('unecht', 'ein unechter Bruch')]; correct = 'stamm';
        wr.nat = { err: 'concept', msg: '1 : ' + p.n + ' ist kleiner als 1 – also keine natürliche Zahl, sondern {1/' + p.n + '}, ein Stammbruch.' };
        wr.unecht = { err: 'concept', msg: 'Bei {1/' + p.n + '} ist der Zähler kleiner als der Nenner – also echt. Brüche mit Zähler 1 heißen Stammbrüche.' };
      } else if (p.v === 'eins-unten') {
        prompt = 'Setzt man 1 als *Divisor* ein, z. B. ' + p.n + ' : 1, entsteht …';
        opts = [opt('nat', 'eine natürliche Zahl: {' + p.n + '/1} = ' + p.n), opt('stamm', 'ein Stammbruch'), opt('null', 'immer 1')]; correct = 'nat';
        wr.stamm = { err: 'concept', msg: 'Ein Stammbruch hat 1 im *Zähler*. Hier steht 1 im Nenner: ' + p.n + ' : 1 = ' + p.n + '.' };
        wr.null = { err: 'concept', msg: 'Durch 1 teilen ändert nichts: ' + p.n + ' : 1 = ' + p.n + '.' };
      } else {
        prompt = 'Wofür steht der Bruchstrich?';
        opts = [opt('div', 'für das Divisionszeichen „:“'), opt('mal', 'für „mal“'), opt('minus', 'für „minus“')]; correct = 'div';
        wr.mal = wr.minus = { err: 'concept', msg: 'Ein Bruch ist eine andere Schreibweise für eine Division: {3/4} = 3 : 4.' };
      }
      opts = rot(opts, p.o);
      return { prompt: prompt, answer: { type: 'choice', options: opts, correct: correct }, check: function (inp) { return checkChoice(correct, inp, wr); },
        hints: ['Merksatz: Dividend : Divisor = Quotient.', 'Der Dividend wird geteilt. Er steht beim Bruch oben (Zähler).', 'Der Divisor steht beim Bruch unten (Nenner).', 'Ein Bruch mit Zähler 1 ist ein Stammbruch. Durch 1 teilen ändert nichts.'],
        solution: [label(opts, correct), 'Dividend : Divisor = Quotient  →  Zähler / Nenner'] };
    }
  });

  root.BB.gens = {
    reg: reg, list: LIST, byId: BY, makeR: makeR, range: range, rot: rot, label: label, opt: opt,
    readFrac: readFrac, checkFrac: checkFrac, checkNum: checkNum, checkChoice: checkChoice, shadeCheck: shadeCheck, wholesVisual: wholesVisual, ZERO: ZERO,
    // Build a task from a generator id (params optional → new random task)
    make: function (id, level, params, rand, want) {
      var g = BY[id]; if (!g) throw new Error('unknown generator ' + id);
      var lv = Math.max(g.levels[0], Math.min(level || 1, g.levels[g.levels.length - 1]));
      var p = params || g.params(lv, makeR(rand), want);
      var t = g.build(p);
      t.gen = id; t.skill = t.skill || g.skill; t.level = lv; t.params = p; t.tags = g.tags;
      return t;
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
