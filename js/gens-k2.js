/*
 * gens-k2.js — Kapitel 2: Erweitern, Kürzen, gleichwertige Brüche, gleichnamig machen, vergleichen, ordnen.
 * Same contract as gens-core.js: params(level, R, want) → p, build(p) → task (deterministic).
 *
 * Exact arithmetic only (frac.js). Where the task asks for a particular FORM (erweitere mit 4, kürze
 * vollständig) the form is checked; where only the VALUE matters (Zahlenstrahl) equivalent answers count.
 * Every wrong answer is matched to a likely misconception (model.ERRORS) and explained without giving the
 * final answer away; many also carry a picture (r.demo / t.demo) that practice.js can show.
 *
 * New answer types:  frac with fixed:{n}|{d} and before (missing number) · table · order · choice with signs
 * New pictures:      bars (equal-width strips, optional finer subdivision) · numline · row
 */
(function (root) {
  'use strict';
  var F = root.BB.frac, T = root.BB.text, C = root.BB.ctx, G = root.BB.gens;
  var fm = T.fm, fx = T.fx, reg = G.reg, opt = G.opt, checkFrac = G.checkFrac, checkNum = G.checkNum, checkChoice = G.checkChoice, rot = G.rot;

  // ---------------------------------------------------------------- helpers
  function fq(f) { return '{' + f.n + '/' + f.d + '}'; }                       // always as a fraction (also 4/4)
  function fs(f, mix) { return mix && f.n > f.d ? fm(f, true) : fq(f); }
  function E(err, msg, extra) { var r = { ok: false, err: err, msg: msg }; for (var k in extra || {}) r[k] = extra[k]; return r; }
  function inc(msg) { return { incomplete: true, msg: msg || 'Trage Zähler und Nenner ein.' }; }
  function readND(inp) { return inp && inp.n != null && inp.d != null ? { n: inp.n, d: inp.d, w: inp.w } : null; }
  function lowest(R, ds) { var d = R.pick(ds), n; do { n = R.int(1, d - 1); } while (F.gcd(n, d) !== 1); return [n, d]; }
  function word(d) { return T.denomWord(d); }
  function sign(x) { return x < 0 ? -1 : x > 0 ? 1 : 0; }
  function sym(c) { return c < 0 ? '<' : c > 0 ? '>' : '='; }
  var SIGNS = [opt('lt', '<'), opt('gt', '>'), opt('eq', '=')];
  function signId(c) { return c < 0 ? 'lt' : c > 0 ? 'gt' : 'eq'; }
  function signOf(id) { return { lt: -1, gt: 1, eq: 0 }[id]; }
  function multiples(d, upto) { var a = []; for (var x = d; x <= upto; x += d) a.push(x); return a; }
  function name(i) { return C.NAMES[i % C.NAMES.length]; }

  // picture: equal-width strips. rows: [n, d, sub, colour]
  function bars(list, extra) {
    var v = { type: 'bars', rows: list.map(function (x, i) { return { n: x[0], d: x[1], sub: x[2] || 1, col: x[3] != null ? x[3] : i, label: x[4] }; }) };
    for (var k in extra || {}) v[k] = extra[k];
    return v;
  }
  function barsOK(list) { return list.every(function (x) { return x[1] * (x[2] || 1) <= 48 && x[0] <= 2 * x[1]; }); }
  // picture that shows two fractions made "gleichnamig": original strips with finer lines
  function compareDemo(a, b) {
    var L = F.lcm(a.d, b.d), list = [[a.n, a.d, L / a.d], [b.n, b.d, L / b.d]];
    if (barsOK(list)) return bars(list, { lines: true });
    return { type: 'numline', max: Math.max(1, Math.ceil(Math.max(F.value(a), F.value(b)))), marks: [{ n: a.n, d: a.d, col: 0 }, { n: b.n, d: b.d, col: 1, below: true }] };
  }

  // The usual wrong ways to expand (op '·') or reduce (op ':') f0 by k. g = what was typed {n, d}.
  function transformErr(f0, k, op, g) {
    var mul = op === '·', tn = mul ? f0.n * k : f0.n / k, td = mul ? f0.d * k : f0.d / k;
    var verb = mul ? 'mal' : 'geteilt durch', V = mul ? 'Erweitern' : 'Kürzen';
    if (g.n === tn && g.d === f0.d && tn !== f0.n) return E('nuroben', 'Du hast nur den *Zähler* ' + verb + ' ' + k + ' gerechnet. Beim ' + V + ' gehören Zähler *und* Nenner dazu – sonst ändert sich der Wert.');
    if (g.d === td && g.n === f0.n && td !== f0.d) return E('nuroben', 'Du hast nur den *Nenner* ' + verb + ' ' + k + ' gerechnet. Beim ' + V + ' gehören Zähler *und* Nenner dazu – sonst ändert sich der Wert.');
    if (mul && g.n === f0.n + k && g.d === f0.d + k) return E('addiert', 'Du hast ' + k + ' *addiert*. Erweitern heißt *mal* nehmen. Addieren ändert den Wert des Bruchs!');
    if (!mul && g.n === f0.n - k && g.d === f0.d - k) return E('addiert', 'Du hast ' + k + ' *abgezogen*. Kürzen heißt *teilen*. Abziehen ändert den Wert des Bruchs!');
    if (mul && f0.n % k === 0 && f0.d % k === 0 && g.n === f0.n / k && g.d === f0.d / k) return E('kuerzerw', 'Das ist *gekürzt* (geteilt). Erweitern heißt: Zähler und Nenner *mal* ' + k + '.');
    if (!mul && g.n === f0.n * k && g.d === f0.d * k) return E('kuerzerw', 'Das ist *erweitert* (mal genommen). Kürzen heißt: Zähler und Nenner *geteilt durch* ' + k + '.');
    if (g.n === tn && g.d !== td) {
      if (g.d > 0 && (mul ? g.d % f0.d === 0 : f0.d % g.d === 0) && g.d !== f0.d) return E('ungleich', 'Der Zähler stimmt. Beim Nenner hast du mit einer anderen Zahl gerechnet. Zähler und Nenner brauchen *dieselbe* Zahl.');
      return E('arith', 'Der Zähler stimmt! Rechne den Nenner noch einmal: ' + f0.d + (mul ? ' · ' : ' : ') + k + ' = ?');
    }
    if (g.d === td && g.n !== tn) {
      if (g.n > 0 && (mul ? g.n % f0.n === 0 : f0.n % g.n === 0) && g.n !== f0.n) return E('ungleich', 'Der Nenner stimmt. Beim Zähler hast du mit einer anderen Zahl gerechnet. Zähler und Nenner brauchen *dieselbe* Zahl.');
      return E('arith', 'Der Nenner stimmt! Rechne den Zähler noch einmal: ' + f0.n + (mul ? ' · ' : ' : ') + k + ' = ?');
    }
    return null;
  }

  // Wrong comparison sign → misconception, explained WITHOUT giving the final sign away.
  function cmpWrong(a, b, pid) {
    var c = F.cmp(a, b), p = signOf(pid), L = F.lcm(a.d, b.d), A = a.n * L / a.d, B = b.n * L / b.d, demo = compareDemo(a, b);
    var gl = a.d === b.d ? '' : ' Mache sie gleichnamig: ' + fq(a) + ' = {' + A + '/' + L + '} und ' + fq(b) + ' = {' + B + '/' + L + '}.';
    if (c === 0) {
      var ra = F.reduce(a);
      return E(a.n !== b.n && p === sign(a.n - b.n) ? 'zaehlervgl' : 'gleichwertig', 'Schau genau hin: Kürze beide Brüche vollständig. ' + fq(a) + ' = ' + fq(ra) + ' und ' + fq(b) + ' = ' + fq(F.reduce(b)) + '. Was fällt dir auf?', { demo: demo });
    }
    if (p === 0) return E('vergleich', 'Gleich viel sind die beiden nicht.' + gl + ' Welcher ist größer?', { demo: demo });
    if (a.d === b.d) return E('zeichen', 'Gleiche Nenner – gleich große Stücke. Dann zählt nur die Anzahl der Stücke (Zähler). Achte auf das Zeichen: Die *offene Seite* zeigt zum größeren Bruch.', { demo: demo });
    if (a.n === b.n) return E('nennergroesser', 'Achtung: Ein größerer Nenner heißt *kleinere* Stücke! Beide Male sind es ' + a.n + ' Stücke – aber wo sind die Stücke größer?', { demo: demo });
    if (p === sign(a.n - b.n)) return E('zaehlervgl', 'Du hast nur die Zähler verglichen. Die Stücke sind aber verschieden groß!' + gl + ' Vergleiche jetzt.', { demo: demo });
    if (p === sign(a.d - b.d)) return E('nennergroesser', 'Ein größerer Nenner heißt nicht „mehr“ – die Stücke werden kleiner.' + gl + ' Vergleiche jetzt.', { demo: demo });
    return E('zeichen', 'Fast! Prüfe die Richtung des Zeichens.' + gl + ' Die *offene Seite* zeigt zum größeren Bruch.', { demo: demo });
  }

  // ================================================================ I – Erweitern

  reg({ id: 'erw_mit', skill: 'erweitern', tags: ['convert', 'short'],
    params: function (level, R) {
      if (level === 1) { var a = lowest(R, [2, 3, 4, 5, 6]); return { n: a[0], d: a[1], k: R.pick([2, 3, 4, 5]) }; }
      if (level === 2) { var d = R.int(3, 12); return { n: R.int(1, d - 1), d: d, k: R.int(2, 10) }; }
      var r = R.int(0, 9);
      if (r < 4) { var d3 = R.int(2, 8), n3; do { n3 = R.int(d3 + 1, 3 * d3); } while (n3 % d3 === 0); return { n: n3, d: d3, k: R.int(2, 9) }; }
      if (r < 7) { var d4 = R.int(7, 15); return { n: R.int(1, d4 - 1), d: d4, k: R.int(6, 12) }; }
      var b = lowest(R, [2, 3, 4, 5, 6]); return { w: R.int(1, 4), n: b[0], d: b[1], k: R.int(2, 6) };
    },
    build: function (p) {
      var f0 = F.make(p.n, p.d), t = F.expand(f0, p.k), k = p.k;
      var shown = p.w ? '{' + p.w + ' ' + p.n + '/' + p.d + '}' : fq(f0);
      var pic = !p.w && barsOK([[p.n, p.d, k]]) ? bars([[p.n, p.d, k], [t.n, t.d]], { lines: true }) : null;
      var value = p.w ? F.make(p.w * t.d + t.n, t.d) : t;
      return { prompt: 'Erweitere ' + shown + ' mit [' + k + '].', visual: p.w || p.n > p.d || p.d * k > 24 ? null : bars([[p.n, p.d]]),
        answer: { type: 'frac', whole: p.w ? 'required' : 'none', value: value },
        check: function (inp) {
          var g = readND(inp); if (!g) return inc(p.w ? 'Trage die Ganzen und den Bruch ein.' : null);
          if (g.d === 0) return G.ZERO;
          if (p.w) {
            if (inp.w !== p.w) return E('faktor', inp.w === p.w * k ? 'Die *Ganzen* bleiben beim Erweitern, wie sie sind. Erweitert wird nur der Bruch ' + fq(f0) + '.' : 'Schreibe die Ganzen ([' + p.w + ']) wieder davor. Erweitert wird nur der Bruch ' + fq(f0) + '.');
          }
          if (g.n === t.n && g.d === t.d) return { ok: true };
          var x = transformErr(f0, k, '·', g); if (x) { x.demo = pic; return x; }
          if (g.d && F.eq(F.make(g.n, g.d), f0)) return E('faktor', 'Der Wert stimmt – aber gefragt war: mit [' + k + '] erweitern. Nimm Zähler und Nenner jeweils mal ' + k + '.');
          return E('arith', 'Das stimmt noch nicht. Rechne Zähler · ' + k + ' und Nenner · ' + k + '.', { demo: pic });
        },
        hints: ['Erweitern heißt: jedes Stück in ' + k + ' gleich große Teile schneiden.', 'Was passiert mit der Anzahl *aller* Stücke (Nenner)? Und mit deinen Stücken (Zähler)?',
                'Zähler: ' + p.n + ' · ' + k + ' = ?   Nenner: ' + p.d + ' · ' + k + ' = ?', 'Nimm Zähler *und* Nenner mal ' + k + ': ' + fx(p.n, '·', k, p.d)],
        solution: [(p.w ? '{' + p.w + ' ' + p.n + '/' + p.d + '} = ' + p.w + ' + ' : '') + fq(f0) + ' = ' + fx(p.n, '·', k, p.d) + ' = ' + fq(t) + (p.w ? '  →  {' + p.w + ' ' + t.n + '/' + t.d + '}' : ''),
                   'Der Wert bleibt gleich – die Stücke sind nur kleiner, dafür sind es mehr.'],
        solutionVisual: pic, demo: pic, lab: { mode: 'erweitern', n: p.n, d: p.d, k: k }, why: 'erw-gleich' };
    }
  });

  // missing number: {2/3} = {?/12}  or  {2/3} = {8/?}   (auch versteckt: {15/25} = {?/10})
  function lueckeParams(level, R, erw) {
    var v = level === 1 ? R.pick(['nenner', 'nenner', 'zaehler']) : level === 2 ? R.pick(['nenner', 'zaehler', 'nenner', 'zaehler', erw ? 'geht' : 'nenner'])
          : R.pick(['nenner', 'zaehler', 'versteckt', 'versteckt', erw ? 'geht' : 'zaehler']);
    var b = lowest(R, level === 1 ? [2, 3, 4, 5, 6] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
    if (level === 3 && R.chance(0.25) && v !== 'versteckt') { var dd = R.int(2, 6), nn; do { nn = R.int(dd + 1, 3 * dd); } while (F.gcd(nn, dd) !== 1); b = [nn, dd]; }
    var p = { v: v, a: b[0], b: b[1] };
    if (v === 'versteckt') {
      var ok = false;
      for (var tries = 0; tries < 30 && !ok; tries++) {
        var m = R.int(2, 5), j = R.int(2, 6), bb = lowest(R, [2, 3, 4, 5]);
        if (erw ? j > m : j < m) { var D0 = bb[1] * m, D = bb[1] * j; if (D % D0 && D0 % D) { ok = true; p.a = bb[0]; p.b = bb[1]; p.m = m; p.j = j; } }
      }
      if (!ok) p.v = 'nenner';
    }
    if (p.v === 'geht') { p.can = R.chance(0.5); p.D = p.can ? p.b * R.int(2, 6) : (function () { var x; do { x = R.int(p.b + 1, 4 * p.b); } while (x % p.b === 0); return x; })(); }
    if (p.v === 'nenner' || p.v === 'zaehler') {
      if (erw) { p.k = level === 1 ? R.int(2, 5) : R.int(2, 10); if (level >= 2 && R.chance(0.15) && 100 % p.b === 0 && p.b > 1) p.k = 100 / p.b; }
      else { p.k = level === 1 ? R.int(2, 5) : R.int(2, 9); p.j = level >= 2 && R.chance(0.4) ? R.int(2, 3) : 1; }   // kürzen: start a·k·j / b·k·j → a·j / b·j
    }
    return p;
  }
  function lueckeBuild(p, erw) {
    var f0, tgt;
    if (p.v === 'geht') {
      var base = F.make(p.a, p.b), k0 = p.D / p.b, opts = [opt('ja', 'Ja'), opt('nein', 'Nein')], corr = p.can ? 'ja' : 'nein';
      var wr = p.can ? { nein: { err: 'faktor', msg: 'Doch! Prüfe: Ist [' + p.D + '] ein Vielfaches von ' + p.b + '? Wie oft passt ' + p.b + ' in ' + p.D + '?' } }
                     : { ja: { err: 'faktor', msg: 'Prüfe: ' + p.D + ' : ' + p.b + ' – geht das ohne Rest? Beim Erweitern wird der Nenner *mal* einer ganzen Zahl genommen.' } };
      return { prompt: 'Kann man ' + fq(base) + ' so erweitern, dass der Nenner [' + p.D + '] wird?', answer: { type: 'choice', options: opts, correct: corr },
        check: function (inp) { return checkChoice(corr, inp, wr); },
        hints: ['Beim Erweitern wird der Nenner mit einer ganzen Zahl mal genommen.', 'Der neue Nenner muss also ein *Vielfaches* von ' + p.b + ' sein.', 'Vielfache von ' + p.b + ': ' + multiples(p.b, Math.max(p.D, 4 * p.b)).slice(0, 8).join(', ') + ' …', 'Ist [' + p.D + '] dabei?'],
        solution: [p.can ? 'Ja: ' + p.D + ' : ' + p.b + ' = ' + k0 + ', also ' + fq(base) + ' = ' + fx(p.a, '·', k0, p.b) + ' = {' + p.a * k0 + '/' + p.D + '}.' : 'Nein: ' + p.D + ' ist kein Vielfaches von ' + p.b + '. ' + p.D + ' : ' + p.b + ' geht nicht ohne Rest.'],
        why: 'erw-vielfach' };
    }
    if (p.v === 'versteckt') { f0 = F.make(p.a * p.m, p.b * p.m); tgt = F.make(p.a * p.j, p.b * p.j); }
    else if (erw) { f0 = F.make(p.a, p.b); tgt = F.expand(f0, p.k); }
    else { f0 = F.make(p.a * p.k * p.j, p.b * p.k * p.j); tgt = F.make(p.a * p.j, p.b * p.j); }
    var askN = p.v !== 'zaehler', want = askN ? tgt.n : tgt.d, fixed = askN ? { d: tgt.d } : { n: tgt.n };
    var k = askN ? (erw ? tgt.d / f0.d : f0.d / tgt.d) : (erw ? tgt.n / f0.n : f0.n / tgt.n);
    var op = erw ? '·' : ':', verb = erw ? 'Erweitere' : 'Kürze';
    var prompt = p.v === 'versteckt' ? 'Ergänze die fehlende Zahl.' : verb + ' ' + fq(f0) + ' auf den ' + (askN ? 'Nenner [' + tgt.d + ']' : 'Zähler [' + tgt.n + ']') + '.';
    var red = F.reduce(f0), pic = barsOK([[f0.n, f0.d], [tgt.n, tgt.d]]) ? bars([[f0.n, f0.d], [tgt.n, tgt.d]], { lines: true }) : null;
    var from = askN ? f0.d : f0.n, to = askN ? tgt.d : tgt.n, other = askN ? f0.n : f0.d, W = askN ? 'Zähler' : 'Nenner', W2 = askN ? 'Nenner' : 'Zähler';
    return { prompt: prompt, answer: { type: 'frac', whole: 'none', fixed: fixed, before: fq(f0) + ' =', value: tgt },
      check: function (inp) {
        var g = readND(inp); if (!g) return inc('Trage die fehlende Zahl ein.');
        if (g.d === 0) return G.ZERO;
        var x = askN ? g.n : g.d;
        if (x === want) return { ok: true };
        if (p.v === 'versteckt') {
          if (x === (askN ? f0.n + (tgt.d - f0.d) : f0.d + (tgt.n - f0.n))) return E('addiert', 'Du hast gleich viel dazugezählt bzw. abgezogen. Das ändert den Wert. Tipp: ' + fq(f0) + ' lässt sich zuerst kürzen.', { demo: pic });
          return E('faktor', 'Von ' + from + ' kommt man nicht mit einer ganzen Zahl auf ' + to + '. Tipp: Kürze ' + fq(f0) + ' zuerst vollständig – dann erweitere.', { demo: pic });
        }
        if (x === other) return E(erw ? 'nuroben' : 'nuroben', 'Der ' + W2 + ' wird von ' + from + ' zu ' + to + (erw ? ' – also *mal* ' + k : ' – also *geteilt durch* ' + k) + '. Der ' + W + ' muss mit derselben Zahl gerechnet werden.', { demo: pic });
        if (x === other + (to - from)) return E('addiert', 'Du hast ' + Math.abs(to - from) + (erw ? ' addiert' : ' abgezogen') + ', wie beim ' + W2 + '? Aber aus ' + from + ' wird ' + to + ' durch ' + (erw ? '*mal* ' : '*geteilt durch* ') + k + ' – nicht durch ' + (erw ? 'plus.' : 'minus.'), { demo: pic });
        if (x === k) return E('faktor', '[' + k + '] ist die ' + (erw ? 'Erweiterungszahl' : 'Kürzungszahl') + ' – richtig erkannt! Jetzt noch den ' + W + ' ' + (erw ? 'mal ' : 'durch ') + k + ' rechnen.');
        if (!erw && x === other * k) return E('kuerzerw', 'Du hast mal genommen. Beim Kürzen wird *geteilt*: ' + other + ' : ' + k + '.');
        return E('arith', 'Noch nicht. Wie wird aus ' + from + ' die ' + to + '? Mit derselben Rechnung kommt der ' + W + ' heraus.', { demo: pic });
      },
      hints: p.v === 'versteckt'
        ? ['Kann man von ' + f0.d + ' direkt auf ' + tgt.d + ' kommen – mit mal oder geteilt durch eine ganze Zahl?', 'Kürze ' + fq(f0) + ' zuerst vollständig: ' + fq(f0) + ' = ' + fq(red) + '.', 'Jetzt ' + (erw ? 'erweitere ' : 'erweitere ') + fq(red) + ': ' + (askN ? tgt.d + ' : ' + red.d : tgt.n + ' : ' + red.n) + ' = ' + (askN ? tgt.d / red.d : tgt.n / red.n) + '.', 'Rechne den ' + W + ' von ' + fq(red) + ' mal ' + (askN ? tgt.d / red.d : tgt.n / red.n) + '.']
        : ['Wie wird aus dem ' + W2 + ' ' + from + ' der ' + W2 + ' ' + to + '?', (erw ? to + ' : ' + from + ' = ' + k : from + ' : ' + to + ' = ' + k) + '. Das ist die ' + (erw ? 'Erweiterungszahl' : 'Kürzungszahl') + '.',
           'Der ' + W + ' muss mit *derselben* Zahl gerechnet werden.', other + (erw ? ' · ' : ' : ') + k + ' = ?'],
      solution: p.v === 'versteckt' ? [fq(f0) + ' = ' + fq(red) + ' (gekürzt)', fq(red) + ' = ' + fq(tgt) + ' (erweitert)', 'Also ' + fq(f0) + ' = ' + fq(tgt) + '.']
        : [fq(f0) + ' = ' + (erw ? fx(f0.n, op, k, f0.d) : fx(f0.n, op, k, f0.d)) + ' = ' + fq(tgt), (erw ? 'Erweiterungszahl ' : 'Kürzungszahl ') + k + ': Zähler und Nenner ' + (erw ? 'mal ' : 'geteilt durch ') + k + '.'],
      solutionVisual: pic, demo: pic, lab: { mode: 'erweitern', n: f0.n, d: f0.d } };
  }
  reg({ id: 'erw_luecke', skill: 'zielnenner', tags: ['convert', 'short'], params: function (level, R) { return lueckeParams(level, R, true); }, build: function (p) { return lueckeBuild(p, true); } });
  reg({ id: 'kuerz_luecke', skill: 'zielnenner', tags: ['convert', 'short'], params: function (level, R) { return lueckeParams(level, R, false); }, build: function (p) { return lueckeBuild(p, false); } });

  // {3/5} = {12/20}: Mit welcher Zahl wurde erweitert? / {18/30} = {3/5}: Durch welche Zahl wurde gekürzt?
  reg({ id: 'faktor_bestimmen', skill: 'faktor', tags: ['convert', 'short'],
    params: function (level, R) {
      var b = lowest(R, level === 1 ? [2, 3, 4, 5, 6] : level === 2 ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [3, 4, 5, 6, 7, 8, 9, 11, 12]);
      if (level === 3 && R.chance(0.3)) { var dd = R.int(2, 5), nn; do { nn = R.int(dd + 1, 3 * dd); } while (F.gcd(nn, dd) !== 1); b = [nn, dd]; }
      return { v: R.pick(['erw', 'kuerz']), a: b[0], b: b[1], k: level === 1 ? R.int(2, 5) : level === 2 ? R.int(2, 10) : R.int(6, 15) };
    },
    build: function (p) {
      var small = F.make(p.a, p.b), big = F.expand(small, p.k), erw = p.v === 'erw', f1 = erw ? small : big, f2 = erw ? big : small, k = p.k;
      var pic = barsOK([[f1.n, f1.d], [f2.n, f2.d]]) ? bars([[f1.n, f1.d], [f2.n, f2.d]], { lines: true }) : null;
      return { prompt: fq(f1) + ' = ' + fq(f2), sub: erw ? 'Mit welcher Zahl wurde *erweitert*?' : 'Durch welche Zahl wurde *gekürzt*?', visual: pic && p.b * k <= 24 ? pic : null,
        answer: { type: 'num', pre: erw ? 'erweitert mit' : 'gekürzt durch', value: k },
        check: function (inp) { return checkNum(k, inp, [function (x) {
          if (x === big.n - small.n || x === big.d - small.d) return E('addiert', 'Du hast die *Differenz* ausgerechnet. Aber ' + (erw ? 'Erweitern ist *mal*: ' + small.n + ' · ? = ' + big.n : 'Kürzen ist *geteilt*: ' + big.n + ' : ? = ' + small.n) + '.');
          if (x === 1) return E('faktor', (erw ? 'Mit 1 erweitern' : 'Durch 1 kürzen') + ' ändert gar nichts. Der Bruch hat sich aber verändert.');
          if (x > 1 && small.n * x !== big.n) return E('faktor', 'Prüfe: ' + (erw ? small.n + ' · ' + x + ' = ' + small.n * x + ' – das ist nicht ' + big.n + '.' : big.n + ' : ' + x + ' ist nicht ' + small.n + '.'), { demo: pic });
          return null; }]); },
        hints: [erw ? 'Erweitern: Zähler und Nenner wurden mit *derselben* Zahl mal genommen.' : 'Kürzen: Zähler und Nenner wurden durch *dieselbe* Zahl geteilt.',
                'Schau auf die Nenner: ' + (erw ? small.d + ' · ? = ' + big.d : big.d + ' : ? = ' + small.d), 'Rechne ' + big.d + ' : ' + small.d + '.', 'Prüfe mit den Zählern: ' + (erw ? small.n + ' · ' + k + ' = ' + big.n : big.n + ' : ' + k + ' = ' + small.n) + '?'],
        solution: [fq(f1) + ' = ' + fx(f1.n, erw ? '·' : ':', k, f1.d) + ' = ' + fq(f2), (erw ? 'Erweiterungszahl: ' : 'Kürzungszahl: ') + k],
        solutionVisual: pic, demo: pic, lab: { mode: 'erweitern', n: small.n, d: small.d } };
    }
  });

  // {4/6} → {8/12}: erweitert? gekürzt? Wert verändert?
  reg({ id: 'erw_oder_kuerz', skill: 'faktor', tags: ['concept', 'short'],
    params: function (level, R) {
      var b = lowest(R, [2, 3, 4, 5, 6, 7, 8]);
      return { kind: R.pick(level === 1 ? ['erw', 'kuerz'] : level === 2 ? ['erw', 'kuerz', 'add'] : ['erw', 'kuerz', 'add', 'nur']), a: b[0], b: b[1], k: R.int(2, level === 1 ? 4 : 6), o: R.int(0, 3) };
    },
    build: function (p) {
      var s = F.make(p.a, p.b), big = F.expand(s, p.k), f1, f2, correct, k = p.k, wr = {};
      if (p.kind === 'erw') { f1 = s; f2 = big; correct = 'erw'; }
      else if (p.kind === 'kuerz') { f1 = big; f2 = s; correct = 'kz'; }
      else if (p.kind === 'add') { f1 = s; f2 = F.make(p.a + k, p.b + k); correct = 'none'; }
      else { f1 = s; f2 = F.make(p.a * k, p.b); correct = 'none'; }
      var diff = Math.abs(f2.n - f1.n); if (diff <= 1 || diff === k) diff = k + 1;
      var opts = [opt('erw', 'mit ' + k + ' erweitert'), opt('kz', 'durch ' + k + ' gekürzt'), opt('diff', (f2.n > f1.n ? 'mit ' + diff + ' erweitert' : 'durch ' + diff + ' gekürzt')), opt('none', 'Der Wert hat sich verändert – weder erweitert noch gekürzt.')];
      opts = rot(opts, p.o);
      if (correct === 'erw') { wr.kz = { err: 'kuerzerw', msg: 'Zähler und Nenner sind *größer* geworden – das ist Erweitern (mal nehmen), nicht Kürzen.' }; wr.none = { err: 'gleichwertig', msg: 'Prüfe: ' + f1.n + ' · ' + k + ' und ' + f1.d + ' · ' + k + '. Beide mit derselben Zahl mal genommen – der Wert bleibt gleich.' }; }
      if (correct === 'kz') { wr.erw = { err: 'kuerzerw', msg: 'Zähler und Nenner sind *kleiner* geworden – das ist Kürzen (teilen), nicht Erweitern.' }; wr.none = { err: 'gleichwertig', msg: 'Prüfe: ' + f1.n + ' : ' + k + ' und ' + f1.d + ' : ' + k + '. Beide durch dieselbe Zahl geteilt – der Wert bleibt gleich.' }; }
      if (correct === 'none') {
        wr.erw = { err: p.kind === 'add' ? 'addiert' : 'nuroben', msg: p.kind === 'add' ? 'Hier wurde ' + k + ' *addiert*, nicht mal genommen: ' + f1.n + ' + ' + k + ' und ' + f1.d + ' + ' + k + '. Addieren ändert den Wert!' : 'Hier wurde nur der *Zähler* mal ' + k + ' genommen. Der Nenner ist gleich geblieben – der Wert hat sich verändert.' };
        wr.kz = { err: 'kuerzerw', msg: 'Die Zahlen sind größer geworden – gekürzt wurde also nicht. Wurde wirklich beides mit derselben Zahl mal genommen?' };
      }
      wr.diff = { err: 'addiert', msg: 'Das ist der *Unterschied* der Zähler. Beim Erweitern und Kürzen geht es um mal und geteilt, nicht um plus und minus.' };
      return { prompt: 'Was wurde hier gemacht?   ' + fq(f1) + ' → ' + fq(f2), answer: { type: 'choice', options: opts, correct: correct },
        check: function (inp) { return checkChoice(correct, inp, wr); },
        hints: ['Sind die Zahlen größer oder kleiner geworden?', 'Wurden Zähler und Nenner mit *derselben* Zahl mal genommen oder geteilt?', 'Prüfe den Zähler: ' + f1.n + ' → ' + f2.n + '. Prüfe den Nenner: ' + f1.d + ' → ' + f2.d + '.', 'Nur wenn beide mit derselben Zahl mal genommen (geteilt) werden, bleibt der Wert gleich.'],
        solution: [correct === 'erw' ? fq(f1) + ' = ' + fx(f1.n, '·', k, f1.d) + ' = ' + fq(f2) + ': mit ' + k + ' erweitert.' : correct === 'kz' ? fq(f1) + ' = ' + fx(f1.n, ':', k, f1.d) + ' = ' + fq(f2) + ': durch ' + k + ' gekürzt.'
                   : fq(f1) + ' und ' + fq(f2) + ' sind *nicht* gleich viel – ' + (p.kind === 'add' ? 'addieren' : 'nur den Zähler mal nehmen') + ' verändert den Wert.'],
        demo: barsOK([[f1.n, f1.d], [f2.n, f2.d]]) ? bars([[f1.n, f1.d], [f2.n, f2.d]], { lines: true }) : null };
    }
  });

  // ================================================================ J – Kürzen

  reg({ id: 'kuerzen_mit', skill: 'kuerzen', tags: ['convert', 'short'],
    params: function (level, R) {
      if (level === 1) { var a = lowest(R, [2, 3, 4, 5, 6]); return { a: a[0], b: a[1], k: R.int(2, 5) }; }
      if (level === 2) { var d = R.int(3, 10); return { a: R.int(1, d - 1), b: d, k: R.int(2, 9) }; }
      if (R.chance(0.4)) { var d3 = R.int(2, 6), n3; do { n3 = R.int(d3 + 1, 3 * d3); } while (n3 % d3 === 0); return { a: n3, b: d3, k: R.int(3, 12) }; }
      var b = lowest(R, [5, 6, 7, 8, 9, 10, 11, 12]); return { a: b[0], b: b[1], k: R.int(6, 15) };
    },
    build: function (p) {
      var t = F.make(p.a, p.b), f0 = F.expand(t, p.k), k = p.k;
      var pic = barsOK([[p.a, p.b, k]]) ? bars([[f0.n, f0.d], [p.a, p.b, k]], { lines: true }) : null;
      return { prompt: 'Kürze ' + fq(f0) + ' durch [' + k + '].', visual: f0.d <= 24 && f0.n <= f0.d ? bars([[f0.n, f0.d]]) : null,
        answer: { type: 'frac', whole: 'none', value: t },
        check: function (inp) {
          var g = readND(inp); if (!g) return inc(); if (g.d === 0) return G.ZERO;
          if (g.n === t.n && g.d === t.d) return { ok: true };
          var x = transformErr(f0, k, ':', g); if (x) { x.demo = pic; return x; }
          if (F.eq(F.make(g.n, g.d), f0)) return E('faktor', 'Der Wert stimmt – aber gefragt war: durch [' + k + '] kürzen. Teile Zähler und Nenner jeweils durch ' + k + '.');
          return E('arith', 'Noch nicht. Rechne ' + f0.n + ' : ' + k + ' und ' + f0.d + ' : ' + k + '.', { demo: pic });
        },
        hints: ['Kürzen heißt: immer ' + k + ' kleine Stücke zu einem großen Stück zusammenlegen.', 'Dann gibt es weniger Stücke – Zähler und Nenner werden kleiner.', 'Zähler: ' + f0.n + ' : ' + k + ' = ?   Nenner: ' + f0.d + ' : ' + k + ' = ?', 'Teile Zähler *und* Nenner durch ' + k + ': ' + fx(f0.n, ':', k, f0.d)],
        solution: [fq(f0) + ' = ' + fx(f0.n, ':', k, f0.d) + ' = ' + fq(t), 'Der Wert bleibt gleich – die Stücke sind nur größer, dafür sind es weniger.'],
        solutionVisual: pic, demo: pic, lab: { mode: 'erweitern', n: f0.n, d: f0.d }, why: 'kuerz-gleich' };
    }
  });

  // "Kürze {18/24}." – every correct reduction counts; a note says when one can reduce further
  reg({ id: 'kuerzen_frei', skill: 'kuerzen', tags: ['convert', 'short'],
    params: function (level, R) {
      var b = lowest(R, level === 1 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 7, 8, 9]);
      if (level === 3 && R.chance(0.3)) { var dd = R.int(2, 5), nn; do { nn = R.int(dd + 1, 3 * dd); } while (F.gcd(nn, dd) !== 1); b = [nn, dd]; }
      return { a: b[0], b: b[1], m: R.pick(level === 1 ? [2, 3, 5] : level === 2 ? [4, 6, 8, 9, 10, 12] : [6, 8, 12, 14, 15, 16, 18, 20]) };
    },
    build: function (p) {
      var t = F.make(p.a, p.b), f0 = F.expand(t, p.m);
      return { prompt: 'Kürze ' + fq(f0) + '.', sub: 'Du darfst durch jede passende Zahl kürzen.',
        answer: { type: 'frac', whole: 'none', value: t },
        check: function (inp) {
          var g = readND(inp); if (!g) return inc(); if (g.d === 0) return G.ZERO;
          var gf = F.make(g.n, g.d);
          if (F.same(gf, f0)) return E('faktor', 'Das ist noch derselbe Bruch. Suche eine Zahl, durch die ' + f0.n + ' *und* ' + f0.d + ' teilbar sind.');
          if (F.eq(gf, f0)) {
            if (g.d > f0.d) return E('kuerzerw', 'Das ist *erweitert* – die Zahlen sind größer geworden. Beim Kürzen werden sie kleiner.');
            var r = { ok: true }, q = f0.d / g.d;
            if (!F.isLowest(gf)) r.note = 'Richtig gekürzt (durch ' + q + ')! ' + fq(gf) + ' kann man sogar noch weiter kürzen: durch ' + F.gcd(g.n, g.d) + ' → ' + fq(t) + '.';
            return r;
          }
          if (g.d === f0.d && f0.n % g.n === 0) return E('nuroben', 'Du hast nur den *Zähler* geteilt. Der Nenner muss durch dieselbe Zahl geteilt werden.');
          if (g.n === f0.n && f0.d % g.d === 0) return E('nuroben', 'Du hast nur den *Nenner* geteilt. Der Zähler muss durch dieselbe Zahl geteilt werden.');
          if (f0.n - g.n === f0.d - g.d && g.n > 0) return E('addiert', 'Du hast von beiden gleich viel *abgezogen*. Kürzen heißt *teilen* – Abziehen ändert den Wert.');
          return E('arith', 'Das ist nicht gleich viel wie ' + fq(f0) + '. Teile Zähler und Nenner durch *dieselbe* Zahl.');
        },
        hints: ['Durch welche Zahl sind ' + f0.n + ' und ' + f0.d + ' beide teilbar?', 'Probiere kleine Zahlen: 2, 3, 5 …', 'Zum Beispiel ' + (F.commonDivisors(f0.n, f0.d)[1]) + ': ' + fx(f0.n, ':', F.commonDivisors(f0.n, f0.d)[1], f0.d), 'Am schnellsten geht es mit dem größten gemeinsamen Teiler: ' + p.m + '.'],
        solution: [fq(f0) + ' = ' + fx(f0.n, ':', p.m, f0.d) + ' = ' + fq(t), 'Auch schrittweise ist richtig – zum Beispiel erst durch ' + F.commonDivisors(f0.n, f0.d)[1] + '.'],
        lab: { mode: 'erweitern', n: f0.n, d: f0.d }, why: 'kuerz-gleich' };
    }
  });

  function vollCheck(f0, t, inp, allowMixed) {
    var g = readND(inp);
    if (!g && !(allowMixed && inp && inp.w != null && inp.n == null && inp.d == null)) return inc();
    if (g && g.d === 0) return G.ZERO;
    var val = g ? F.make((inp.w || 0) * g.d + g.n, g.d) : F.make(inp.w, 1), part = g ? F.make(g.n, g.d) : F.make(0, 1);
    if (!allowMixed && inp.w) return E('mixed', 'Schreibe das Ergebnis als Bruch (ohne Ganze davor).');
    if (F.eq(val, f0)) {
      if (g && g.n >= g.d && inp.w) return E('mixed', 'Im Bruchteil darf nur noch ein Rest stehen – der Zähler muss kleiner als der Nenner sein.');
      if (g && g.n && !F.isLowest(part)) { var c = F.gcd(g.n, g.d); return E('nichtvoll', 'Gut gekürzt! Aber noch nicht vollständig: ' + g.n + ' und ' + g.d + ' sind beide durch ' + c + ' teilbar.'); }
      return { ok: true };
    }
    if (g && g.d === f0.d && f0.n % (g.n || 1) === 0 && g.n !== f0.n && !inp.w) return E('nuroben', 'Du hast nur den *Zähler* geteilt. Der Nenner muss durch dieselbe Zahl geteilt werden.');
    if (g && g.n === f0.n && f0.d % g.d === 0 && !inp.w) return E('nuroben', 'Du hast nur den *Nenner* geteilt. Der Zähler muss durch dieselbe Zahl geteilt werden.');
    if (g && !inp.w && g.n > 0 && f0.n - g.n === f0.d - g.d) return E('addiert', 'Du hast von beiden gleich viel *abgezogen*. Kürzen heißt *teilen* – Abziehen ändert den Wert.');
    if (g && !inp.w && F.eq(F.make(g.d, g.n || 1), f0)) return E('swap', 'Zähler und Nenner sind vertauscht.');
    return E('arith', 'Das ist nicht gleich viel wie ' + fq(f0) + '. Teile Zähler und Nenner immer durch *dieselbe* Zahl.');
  }

  reg({ id: 'vollstaendig', skill: 'vollstaendig', tags: ['convert', 'short'],
    params: function (level, R) {
      if (level >= 2 && R.chance(0.3)) {
        var fsx = [], seen = {};
        while (fsx.length < 6) {
          var b = lowest(R, [3, 4, 5, 6, 7, 8, 9]), m = fsx.length < 3 ? 1 : R.int(2, 4), key = b[0] * m + '/' + b[1] * m;
          if (!seen[key]) { seen[key] = 1; fsx.push([b[0] * m, b[1] * m]); }
        }
        return { multi: true, fs: fsx, o: R.int(0, 5) };
      }
      var bb = lowest(R, level === 1 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 7, 8, 9]);
      if (level === 3 && R.chance(0.35)) { var dd = R.int(2, 6), nn; do { nn = R.int(dd + 1, 3 * dd); } while (F.gcd(nn, dd) !== 1); bb = [nn, dd]; }
      return { a: bb[0], b: bb[1], g: R.pick(level === 1 ? [2, 3, 4, 5] : level === 2 ? [4, 6, 8, 9, 10, 12] : [6, 8, 12, 14, 15, 16, 18, 20, 24]) };
    },
    build: function (p) {
      if (p.multi) {
        var opts = rot(p.fs.map(function (x, i) { return opt('f' + i, '{' + x[0] + '/' + x[1] + '}'); }), p.o);
        var correct = p.fs.map(function (x, i) { return F.gcd(x[0], x[1]) === 1 ? 'f' + i : null; }).filter(Boolean);
        return { prompt: 'Tippe *alle* Brüche an, die schon *vollständig gekürzt* sind.', answer: { type: 'choice', options: opts, multi: true, correct: correct },
          check: function (inp) { return checkChoice(correct, inp, { multi: function (ids) {
            var bad = (ids || []).filter(function (id) { return correct.indexOf(id) < 0; });
            if (bad.length) { var x = p.fs[+bad[0].slice(1)], c = F.gcd(x[0], x[1]); return E('nichtvoll', '{' + x[0] + '/' + x[1] + '} ist noch nicht fertig: ' + x[0] + ' und ' + x[1] + ' sind beide durch ' + c + ' teilbar.'); }
            return E('nichtvoll', 'Es fehlen noch Brüche. Prüfe bei jedem: Gibt es eine Zahl (größer als 1), durch die Zähler *und* Nenner teilbar sind?'); } }); },
          hints: ['Vollständig gekürzt heißt: Man kann nicht mehr weiter kürzen.', 'Prüfe bei jedem Bruch: Sind Zähler und Nenner beide durch 2 teilbar? Durch 3? Durch 5?', 'Gerade Zahl oben *und* unten? Dann geht es noch durch 2.', 'Wenn es keinen gemeinsamen Teiler außer 1 gibt, ist der Bruch fertig.'],
          solution: ['Vollständig gekürzt: ' + correct.map(function (id) { var x = p.fs[+id.slice(1)]; return '{' + x[0] + '/' + x[1] + '}'; }).join(', ')], why: 'voll-gekuerzt' };
      }
      var t = F.make(p.a, p.b), f0 = F.expand(t, p.g), mix = t.n > t.d;
      return { prompt: 'Kürze ' + fq(f0) + ' *vollständig*.', sub: mix ? 'Du kannst das Ergebnis auch als gemischte Zahl schreiben.' : null,
        answer: { type: 'frac', whole: mix ? 'optional' : 'none', value: t, lowest: true },
        check: function (inp) { return vollCheck(f0, t, inp, mix); },
        hints: ['Vollständig gekürzt heißt: Zähler und Nenner haben keinen gemeinsamen Teiler mehr (außer 1).', 'Du kannst schrittweise kürzen: erst durch 2, dann durch 3 …', 'Oder direkt durch den größten gemeinsamen Teiler (ggT) von ' + f0.n + ' und ' + f0.d + '.', 'Der ggT ist ' + p.g + ': ' + fx(f0.n, ':', p.g, f0.d)],
        solution: [fq(f0) + ' = ' + fx(f0.n, ':', p.g, f0.d) + ' = ' + fq(t) + (mix ? ' = ' + fm(t, true) : ''), p.a + ' und ' + p.b + ' haben keinen gemeinsamen Teiler mehr – fertig.'],
        lab: { mode: 'erweitern', n: f0.n, d: f0.d }, why: 'voll-gekuerzt' };
    }
  });

  reg({ id: 'ggt', skill: 'vollstaendig', tags: ['convert', 'challenge'],
    params: function (level, R) {
      var b = lowest(R, level === 1 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 7]);
      return { a: b[0], b: b[1], g: R.pick(level === 1 ? [2, 3, 4, 5, 6] : level === 2 ? [6, 8, 9, 10, 12] : [12, 14, 15, 16, 18, 20, 24]) };
    },
    build: function (p) {
      var t = F.make(p.a, p.b), f0 = F.expand(t, p.g), n = f0.n, d = f0.d;
      var dn = F.divisors(n), dd = F.divisors(d);
      return { prompt: 'Kürze ' + fq(f0) + ' in *einem* Schritt vollständig.', sub: 'Finde zuerst den größten gemeinsamen Teiler (ggT).',
        answer: { type: 'steps', steps: [
          { label: 'Der *ggT* von [' + n + '] und [' + d + '] ist:', answer: { type: 'num', value: p.g }, check: function (inp) { return checkNum(p.g, inp, [function (x) {
            if (x > 0 && n % x === 0 && d % x === 0) return E('nichtvoll', x + ' ist ein gemeinsamer Teiler – aber nicht der *größte*. Gibt es einen größeren?');
            if (x > 0 && x % n === 0 && x % d === 0) return E('concept', 'Das ist ein gemeinsames *Vielfaches*. Gesucht ist ein *Teiler*: eine Zahl, durch die man ' + n + ' und ' + d + ' teilen kann.');
            if (x > 0) return E('faktor', (n % x ? n : d) + ' ist nicht durch ' + x + ' teilbar.');
            return null; }]); } },
          { label: 'Kürze durch den ggT:', answer: { type: 'frac', whole: 'none', before: fq(f0) + ' =', value: t }, check: function (inp) {
            var g = readND(inp); if (!g) return inc(); if (g.d === 0) return G.ZERO;
            if (g.n === t.n && g.d === t.d) return { ok: true };
            var x = transformErr(f0, p.g, ':', g); if (x) return x;
            return vollCheck(f0, t, inp, false); } } ] },
        hints: ['Ein Teiler ist eine Zahl, durch die man ohne Rest teilen kann.', 'Teiler von ' + n + ': ' + dn.join(', '), 'Teiler von ' + d + ': ' + dd.join(', '), 'Welche Zahl steht in *beiden* Listen und ist am größten?'],
        solution: ['Teiler von ' + n + ': ' + dn.join(', '), 'Teiler von ' + d + ': ' + dd.join(', ') + '  →  ggT = ' + p.g, fq(f0) + ' = ' + fx(n, ':', p.g, d) + ' = ' + fq(t)],
        why: 'voll-gekuerzt' };
    }
  });

  var ANTEIL = [
    { t: 'Von [{T}] Kindern der Klasse 6b fahren [{P}] mit dem Rad zur Schule.', ask: 'Welcher Anteil der Klasse fährt mit dem Rad?' },
    { t: 'Robin war in den letzten [{T}] Tagen an [{P}] Tagen im Park.', ask: 'An welchem Anteil der Tage war Robin im Park?' },
    { t: 'Bei [{T}] Korbwürfen trifft {N} [{P}]-mal.', ask: 'Welcher Anteil der Würfe ist ein Treffer?' },
    { t: 'In einer Tüte sind [{T}] Gummibärchen. [{P}] davon sind rot.', ask: 'Welcher Anteil ist rot?' },
    { t: 'Ein Buch hat [{T}] Seiten. {N} hat schon [{P}] Seiten gelesen.', ask: 'Welchen Anteil des Buches hat {N} gelesen?' },
    { t: 'Eine Klassenfahrt kostet [{T} €]. {N} hat schon [{P} €] gespart.', ask: 'Welchen Anteil hat {N} schon gespart?' }
  ];
  reg({ id: 'anteil_kuerzen', skill: 'vollstaendig', tags: ['world', 'short'],
    params: function (level, R) {
      var b, m, T0;
      for (var i = 0; i < 40; i++) {
        b = lowest(R, level === 1 ? [2, 3, 4, 5] : level === 2 ? [3, 4, 5, 6, 8, 10] : [6, 7, 8, 9, 10, 12]);
        m = R.int(2, level === 1 ? 6 : 10); T0 = b[1] * m;
        if (T0 >= 8 && T0 <= (level === 1 ? 30 : level === 2 ? 60 : 120)) break;
      }
      return { a: b[0], b: b[1], m: m, s: R.int(0, ANTEIL.length - 1), who: R.int(0, 11) };
    },
    build: function (p) {
      var Tt = p.b * p.m, P = p.a * p.m, t = F.make(p.a, p.b), f0 = F.make(P, Tt), st = ANTEIL[p.s], N = name(p.who);
      var fill = function (s) { return s.replace('{T}', Tt).replace('{P}', P).replace(/\{N\}/g, N); };
      return { prompt: fill(st.t), sub: fill(st.ask) + ' Gib ihn *vollständig gekürzt* an.',
        answer: { type: 'frac', whole: 'none', value: t },
        check: function (inp) {
          var g = readND(inp); if (!g) return inc(); if (g.d === 0) return G.ZERO;
          if (g.d && F.eq(F.make(g.n, g.d), F.make(P, Tt - P)) && !F.eq(F.make(g.n, g.d), t)) return E('part', 'Du hast mit dem *Rest* verglichen (' + (Tt - P) + '). Der Anteil ist: ' + P + ' von *allen* ' + Tt + '.');
          if (g.d && F.eq(F.make(g.n, g.d), F.make(Tt, P)) && !F.eq(F.make(g.n, g.d), t)) return E('swap', 'Zähler und Nenner sind vertauscht: ' + P + ' von ' + Tt + ' → ' + P + ' oben, ' + Tt + ' unten.');
          var r = vollCheck(f0, t, inp, false);
          if (r.err === 'nichtvoll') r.msg = 'Der Anteil stimmt! ' + r.msg.replace('Gut gekürzt! ', '');
          return r;
        },
        hints: ['Wie viele sind es *insgesamt*? Das kommt in den Nenner.', 'Der Anteil ist ' + fq(f0) + ' – aber noch nicht gekürzt.', 'Durch welche Zahl sind ' + P + ' und ' + Tt + ' beide teilbar?', 'Kürze durch den ggT ' + p.m + '.'],
        solution: [P + ' von ' + Tt + ': ' + fq(f0) + ' = ' + fx(P, ':', p.m, Tt) + ' = ' + fq(t)] };
    }
  });

  // ================================================================ K – gleichwertige Brüche

  reg({ id: 'gleichwertig_wahl', skill: 'gleichwertig', tags: ['concept', 'short'],
    params: function (level, R) {
      var b = lowest(R, level === 1 ? [2, 3, 4, 5] : [2, 3, 4, 5, 6, 7, 8]);
      if (level >= 2 && R.chance(0.35)) {
        var eq = R.chance(0.5), j = R.int(2, 4), k; do { k = R.int(2, 6); } while (k === j);
        return { pair: true, a: b[0], b: b[1], j: j, k: k, eq: eq, o: R.int(0, 1) };
      }
      return { a: b[0], b: b[1], m: level === 3 ? R.int(2, 3) : 1, ks: R.shuffle([2, 3, 4, 5, 6]).slice(0, level === 1 ? 2 : 3), o: R.int(0, 5) };
    },
    build: function (p) {
      var base = F.make(p.a, p.b);
      if (p.pair) {
        var x = F.expand(base, p.j), y = p.eq ? F.expand(base, p.k) : F.make(p.a * p.k + 1, p.b * p.k);
        var corr = p.eq ? 'ja' : 'nein', opts = rot([opt('ja', 'Ja, gleich viel'), opt('nein', 'Nein, verschieden')], p.o), wr = {};
        if (p.eq) wr.nein = { err: 'gleichwertig', msg: 'Kürze beide vollständig: ' + fq(x) + ' = ? und ' + fq(y) + ' = ? Was kommt heraus?' };
        else wr.ja = { err: 'gleichwertig', msg: 'Prüfe genau: Kürze ' + fq(x) + ' vollständig. Lässt sich ' + fq(y) + ' genauso kürzen?' };
        return { prompt: 'Sind ' + fq(x) + ' und ' + fq(y) + ' gleichwertig?', answer: { type: 'choice', options: opts, correct: corr },
          check: function (inp) { return checkChoice(corr, inp, wr); },
          hints: ['Gleichwertig heißt: gleich viel, nur anders geschrieben.', 'Kürze beide Brüche vollständig.', fq(x) + ' = ' + fq(base) + '.', 'Kommt bei ' + fq(y) + ' auch ' + fq(base) + ' heraus?'],
          solution: [fq(x) + ' = ' + fq(F.reduce(x)) + ',  ' + fq(y) + ' = ' + fq(F.reduce(y)), p.eq ? 'Beide sind ' + fq(base) + ' – gleichwertig!' : 'Verschieden – also nicht gleichwertig.'],
          demo: barsOK([[x.n, x.d], [y.n, y.d]]) ? bars([[x.n, x.d], [y.n, y.d]], { lines: true }) : null, why: 'gleichwertig-warum' };
      }
      var shown = F.expand(base, p.m), trues = p.ks.map(function (k) { return F.expand(base, k * (p.m > 1 && k === p.ks[0] ? 1 : 1)); });
      if (p.m > 1) trues[0] = base;                       // the fully reduced form counts too
      var seen = {}, list = [];
      function add(f, kind) { var key = f.n + '/' + f.d; if (f.d < 2 || seen[key] || F.same(f, shown)) return; if (kind !== 'ok' && F.eq(f, base)) return; seen[key] = 1; list.push({ f: f, kind: kind }); }
      trues.forEach(function (f) { add(f, 'ok'); });
      [[F.make(p.a + 1, p.b + 1), 'add'], [F.make(p.a + 2, p.b + 2), 'add'], [F.make(p.a * 2, p.b), 'nur'], [F.make(p.a, p.b * 2), 'nur'], [F.make(p.a * 3 + 1, p.b * 3), 'fast'], [F.make(p.a * 2 + 1, p.b * 2 + 1), 'add']].forEach(function (x) { if (list.length < trues.length + 3) add(x[0], x[1]); });
      var opts = rot(list.map(function (x, i) { return opt('f' + i, fq(x.f)); }), p.o);
      var correct = list.map(function (x, i) { return x.kind === 'ok' ? 'f' + i : null; }).filter(Boolean);
      return { prompt: 'Tippe *alle* Brüche an, die genauso viel sind wie ' + fq(shown) + '.', answer: { type: 'choice', options: opts, multi: true, correct: correct },
        check: function (inp) { return checkChoice(correct, inp, { multi: function (ids) {
          var bad = (ids || []).filter(function (id) { return correct.indexOf(id) < 0; });
          if (bad.length) {
            var x = list[+bad[0].slice(1)], f = x.f;
            if (x.kind === 'add') return E('addiert', fq(f) + ': Hier wurde zu Zähler und Nenner etwas *addiert*. Das ändert den Wert – nur Malnehmen (Erweitern) behält ihn.');
            if (x.kind === 'nur') return E('nuroben', fq(f) + ': Hier wurde nur ' + (f.d === p.b ? 'der Zähler' : 'der Nenner') + ' verändert. Das ist nicht gleich viel.');
            return E('gleichwertig', fq(f) + ' sieht ähnlich aus – kürze ihn: Kommt ' + fq(base) + ' heraus?');
          }
          return E('gleichwertig', 'Es fehlen noch Brüche. Tipp: Kürze jeden Bruch vollständig – gleichwertige Brüche werden dann gleich.'); } }); },
        hints: ['Gleichwertig heißt: gleich viel, nur anders geschrieben.', 'Gleichwertige Brüche entstehen durch Erweitern oder Kürzen – Zähler und Nenner mit derselben Zahl mal oder geteilt.', 'Kürze jeden Bruch vollständig. Kommt ' + fq(base) + ' heraus?', 'Vorsicht bei Brüchen, bei denen etwas *addiert* wurde!'],
        solution: ['Gleich viel wie ' + fq(shown) + ': ' + correct.map(function (id) { return fq(list[+id.slice(1)].f); }).join(', '), 'Alle lassen sich zu ' + fq(base) + ' kürzen.'], why: 'gleichwertig-warum' };
    }
  });

  reg({ id: 'gleichwertig_bild', skill: 'gleichwertig', tags: ['visual', 'short'],
    params: function (level, R) {
      var v = R.pick(level === 1 ? ['gleich', 'welches'] : ['gleich', 'welches', 'faktor']);
      var b = lowest(R, level === 1 ? [2, 3, 4] : [2, 3, 4, 5, 6]), kmax = Math.floor(24 / b[1]);
      return { v: v, a: b[0], b: b[1], k: R.int(2, Math.max(2, Math.min(level === 1 ? 3 : 4, kmax))), eq: R.chance(0.5), pie: R.chance(0.4), erw: R.chance(0.6), o: R.int(0, 3), z: R.int(0, 1) };
    },
    build: function (p) {
      var base = F.make(p.a, p.b), big = F.expand(base, p.k), k = p.k;
      function pic(f, labels) { return p.pie ? { type: 'pie', kind: 'kreis', d: f.d, shaded: G.range(f.n) } : bars([[f.n, f.d]], { labels: !!labels }); }
      if (p.v === 'gleich') {
        var other = p.eq ? big : (p.z ? F.make(big.n + 1, big.d) : F.make(p.a + 1, p.b + 1));
        if (other.n >= other.d) other = F.make(big.n - 1, big.d);
        var corr = p.eq ? 'ja' : 'nein', wr = {};
        if (p.eq) wr.nein = { err: 'gleichwertig', msg: 'Schau genau: Jedes Stück links ist rechts in ' + k + ' kleinere Stücke geteilt. Ist die gefärbte Fläche gleich groß?' };
        else wr.ja = { err: 'gleichwertig', msg: 'Zähle nach: Wie viele Stücke hat jedes Bild, und wie viele sind gefärbt? Vergleiche die gefärbten Flächen genau.' };
        var vis = p.pie ? { type: 'row', items: [pic(base), pic(other)] } : bars([[base.n, base.d], [other.n, other.d]], { labels: false });
        return { prompt: 'Ist in beiden Bildern *gleich viel* gefärbt?', visual: vis, answer: { type: 'choice', options: [opt('ja', 'Ja, gleich viel'), opt('nein', 'Nein')], correct: corr },
          check: function (inp) { return checkChoice(corr, inp, wr); },
          hints: ['Welcher Bruch ist im ersten Bild gefärbt?', 'Welcher Bruch ist im zweiten Bild gefärbt?', 'Erstes Bild: ' + fq(base) + '. Zweites Bild: ' + fq(other) + '.', 'Erweitere ' + fq(base) + ' mit ' + k + ': Kommt ' + fq(other) + ' heraus?'],
          solution: ['Bild 1: ' + fq(base) + ', Bild 2: ' + fq(other) + '.', p.eq ? fq(base) + ' = ' + fx(p.a, '·', k, p.b) + ' = ' + fq(big) + ' – gleich viel!' : 'Nicht gleich viel: ' + fq(base) + ' erweitert mit ' + k + ' wäre ' + fq(big) + '.'],
          demo: bars([[base.n, base.d, other.d % base.d === 0 ? other.d / base.d : 1], [other.n, other.d]], { lines: true }), why: 'gleichwertig-warum' };
      }
      if (p.v === 'welches') {
        var cand = [['ok', big], ['add', F.make(p.a + 1, p.b + 1)], ['kom', F.make(big.d - big.n, big.d)], ['eins', F.make(big.n + 1, big.d)]];
        if (F.eq(cand[2][1], base)) cand[2][1] = F.make(big.n - 1, big.d);
        var opts = rot(cand.map(function (c) { return opt(c[0], '', { visual: pic(c[1]) }); }), p.o);
        var wr = { add: { err: 'addiert', msg: 'Hier ist ' + fq(cand[1][1]) + ' gefärbt – ein Stück mehr und ein Teil mehr. Das ist *nicht* gleich viel.' },
                   kom: { err: 'count', msg: 'Hier ist der *Rest* gefärbt (' + fq(cand[2][1]) + ').' },
                   eins: { err: 'count', msg: 'Fast: Hier ist ' + fq(cand[3][1]) + ' gefärbt – ein Stück zu viel.' } };
        return { prompt: 'Welches Bild zeigt genauso viel wie ' + fq(base) + '?', answer: { type: 'choice', options: opts, pictures: true, correct: 'ok' },
          check: function (inp) { return checkChoice('ok', inp, wr); },
          hints: ['Welcher Bruch ist in jedem Bild gefärbt? Zähle Stücke.', 'Gleich viel wie ' + fq(base) + ' – das kann auch ein erweiterter Bruch sein.', 'Erweitere ' + fq(base) + ' mit ' + k + '.', 'Gesucht: ein Bild mit ' + big.n + ' von ' + big.d + ' Stücken.'],
          solution: [fq(base) + ' = ' + fx(p.a, '·', k, p.b) + ' = ' + fq(big) + ': ' + big.n + ' von ' + big.d + ' Stücken.'],
          demo: bars([[base.n, base.d, k], [big.n, big.d]], { lines: true }) };
      }
      var top = p.erw ? base : big, bot = p.erw ? big : base;
      var vis2 = bars([[top.n, top.d, 1, 0, true], [bot.n, bot.d, 1, 1, false]], { labels: 'some' });
      return { prompt: 'Oben ist ' + fq(top) + ' gefärbt. Unten ist dasselbe Rechteck ' + (p.erw ? 'feiner' : 'gröber') + ' geteilt.', visual: vis2,
        sub: p.erw ? 'Mit welcher Zahl wurde *erweitert*?' : 'Durch welche Zahl wurde *gekürzt*?',
        answer: { type: 'num', pre: p.erw ? 'erweitert mit' : 'gekürzt durch', value: k },
        check: function (inp) { return checkNum(k, inp, [function (x) {
          if (x === big.d) return E('faktor', 'Das ist die Anzahl *aller* kleinen Stücke. Gefragt ist: Wie viele kleine Stücke ergeben *ein* großes Stück?');
          if (x === big.d - base.d || x === big.n - base.n) return E('addiert', 'Das ist ein Unterschied (minus). Beim ' + (p.erw ? 'Erweitern' : 'Kürzen') + ' geht es um *mal* und *geteilt*.');
          return E('faktor', 'Zähle: In wie viele kleine Stücke ist *ein* großes Stück geteilt?');
        }]); },
        hints: ['Vergleiche ein großes Stück mit den kleinen Stücken darunter.', 'Wie viele kleine Stücke passen in ein großes?', 'Oben ' + base.d + ' Stücke, unten ' + big.d + ' Stücke: ' + big.d + ' : ' + base.d + ' = ?', 'Das ist die ' + (p.erw ? 'Erweiterungszahl.' : 'Kürzungszahl.')],
        solution: [fq(top) + ' = ' + fx(top.n, p.erw ? '·' : ':', k, top.d) + ' = ' + fq(bot)], demo: bars([[base.n, base.d, k], [big.n, big.d]], { lines: true }) };
    }
  });

  reg({ id: 'zahlenstrahl', skill: 'gleichwertig', tags: ['visual', 'short'],
    params: function (level, R) {
      if (level >= 2 && R.chance(0.4)) { var b = lowest(R, [2, 3, 4, 5]), m = R.int(2, Math.floor(12 / b[1]) || 2); return { v: 'gleich', a: b[0], b: b[1], D: b[1] * Math.max(2, m) }; }
      var Tt = R.pick(level === 1 ? [2, 3, 4, 5, 6, 8] : level === 2 ? [6, 8, 9, 10, 12] : [3, 4, 5, 6]), max = level === 3 ? 2 : 1, k;
      do { k = R.int(1, Tt * max - 1); } while (k % Tt === 0);
      return { v: 'punkt', T: Tt, max: max, k: k };
    },
    build: function (p) {
      if (p.v === 'gleich') {
        var f = F.make(p.a, p.b), t = F.make(p.a * p.D / p.b, p.D);
        return { prompt: 'Welcher Bruch mit dem Nenner [' + p.D + '] liegt an derselben Stelle wie ' + fq(f) + '?',
          visual: { type: 'numline', max: 1, ticks: [p.b, p.D], marks: [{ n: f.n, d: f.d, col: 0 }] },
          answer: { type: 'frac', whole: 'none', fixed: { d: p.D }, before: fq(f) + ' =', value: t },
          check: function (inp) { var g = readND(inp); if (!g) return inc('Trage den Zähler ein.');
            if (g.n === t.n) return { ok: true };
            if (g.n === f.n) return E('nuroben', 'Der Nenner ist ' + p.D / p.b + '-mal so groß – also muss auch der Zähler ' + p.D / p.b + '-mal so groß sein.');
            if (g.n === f.n + p.D - p.b) return E('addiert', 'Du hast addiert. Zähle lieber die kleinen Abstände (' + word(p.D) + ') bis zum Punkt.');
            return E('count', 'Zähle unten die kleinen Abstände von 0 bis zum Punkt.'); },
          hints: ['Unten ist die Strecke von 0 bis 1 in ' + p.D + ' gleiche Teile geteilt.', 'Zähle die kleinen Abstände von 0 bis zum Punkt.', 'Oder: ' + p.D + ' : ' + p.b + ' = ' + p.D / p.b + ' – erweitere mit ' + p.D / p.b + '.', fx(p.a, '·', p.D / p.b, p.b)],
          solution: [fq(f) + ' = ' + fx(p.a, '·', p.D / p.b, p.b) + ' = ' + fq(t) + ' – derselbe Punkt auf dem Zahlenstrahl.'], why: 'gleichwertig-zahlenstrahl' };
      }
      var v = F.make(p.k, p.T);
      return { prompt: 'Welcher Bruch gehört zum Punkt?', sub: p.max > 1 ? 'Du kannst auch eine gemischte Zahl schreiben.' : null,
        visual: { type: 'numline', max: p.max, ticks: [p.T], point: { n: p.k, d: p.T } },
        answer: { type: 'frac', whole: 'optional', value: v },
        check: function (inp) { return checkFrac({ value: v, whole: 'optional', detect: [function (f, i) {
          if (v.n && F.eq(f, F.make(v.d, v.n))) return null;                 // swapped: the general message explains it
          if (i.d === p.T - 1 || i.d === p.T + 1) return E('count', 'Zähle die *Abstände* zwischen 0 und 1 – nicht die Striche. Das ist der Nenner.');
          if (p.max > 1 && i.d === p.T * p.max) return E('count', 'Von 0 bis *1* sind es ' + p.T + ' Abstände – der Nenner ist ' + p.T + '. Der Zahlenstrahl geht nur weiter bis 2.');
          return null; }] }, inp); },
        hints: ['In wie viele gleich große Abstände ist die Strecke von 0 bis 1 geteilt?', 'Das sind ' + word(p.T) + ' – der Nenner ist ' + p.T + '.', 'Zähle die Abstände von 0 bis zum Punkt.', 'Gleichwertige Brüche liegen an derselben Stelle – du darfst auch kürzen.'],
        solution: ['Von 0 bis 1: ' + p.T + ' Abstände. Bis zum Punkt: ' + p.k + (p.k === 1 ? ' Abstand → ' : ' Abstände → ') + fq(v) + (F.isLowest(v) ? '' : ' = ' + fq(F.reduce(v))) + (p.k > p.T ? ' = ' + fm(F.reduce(v), true) : '')] };
    }
  });

  // tables: rows = start fractions, columns = factors (some given, some to fill)
  function tableTask(p, erw) {
    var heads = [], rows = [], slots = [], op = erw ? '·' : ':';
    p.ks.forEach(function (k, c) {
      var vol = !erw && p.vol && c === p.ks.length - 1;
      if (p.hideCol === c) { heads.push({ slot: slots.length }); slots.push({ kind: 'num', value: k, col: c }); }
      else heads.push({ label: vol ? 'vollständig' : op + ' ' + k, vol: vol });
    });
    p.rows.forEach(function (r, ri) {
      var f0 = erw ? F.make(r[0], r[1]) : F.make(r[0] * p.M, r[1] * p.M), cells = [];
      p.ks.forEach(function (k, c) {
        var t = erw ? F.expand(f0, k) : F.make(f0.n / k, f0.d / k), kind = p.cells[ri][c];
        if (p.hideCol === c || kind === 'g') cells.push({ given: t });
        else { cells.push({ slot: slots.length, fixed: kind === 'n' ? { d: t.d } : kind === 'd' ? { n: t.n } : null }); slots.push({ kind: 'frac', value: t, fixed: kind === 'n' ? { d: t.d } : kind === 'd' ? { n: t.n } : null, row: ri, col: c, f0: f0, k: k }); }
      });
      rows.push({ start: f0, cells: cells });
    });
    var answer = { type: 'table', corner: 'Bruch', heads: heads, rows: rows, slots: slots };
    function check(inp) {
      var cs = (inp && inp.cells) || [];
      for (var i = 0; i < slots.length; i++) { var c = cs[i] || {}; if (slots[i].kind === 'num' ? c.x == null : c.n == null || c.d == null) return inc('Fülle alle leeren Felder aus.'); }
      var bad = [], first = null;
      slots.forEach(function (s, i) {
        var c = cs[i], r = null;
        if (s.kind === 'num') {
          if (c.x !== s.value) { var ex0 = rows[0].cells[s.col].given, st0 = rows[0].start;
            r = c.x === Math.abs(ex0.n - st0.n) ? E('addiert', 'Spalte ' + (s.col + 1) + ': Aus ' + fq(st0) + ' wird ' + fq(ex0) + ' – das ist ' + (erw ? '*mal*' : '*geteilt durch*') + ' eine Zahl, nicht ' + (erw ? 'plus.' : 'minus.'))
                : E('faktor', 'Spalte ' + (s.col + 1) + ': Aus ' + fq(st0) + ' wird ' + fq(ex0) + '. ' + (erw ? st0.n + ' · ? = ' + ex0.n : st0.n + ' : ? = ' + ex0.n)); }
        } else if (c.d === 0) r = G.ZERO;
        else if (!(c.n === s.value.n && c.d === s.value.d)) {
          var where = 'Bei ' + fq(s.f0) + (heads[s.col].vol ? ' (vollständig gekürzt)' : ' ' + op + ' ' + s.k) + ': ';
          var x = transformErr(s.f0, s.k, op, c);
          if (!x && heads[s.col].vol && F.eq(F.make(c.n, c.d), s.f0) && !F.isLowest(F.make(c.n, c.d))) x = E('nichtvoll', 'noch nicht vollständig – ' + c.n + ' und ' + c.d + ' sind beide durch ' + F.gcd(c.n, c.d) + ' teilbar.');
          if (!x) x = E('arith', 'rechne Zähler und Nenner ' + (erw ? 'mal ' : 'geteilt durch ') + s.k + '.');
          r = x; r.msg = where + r.msg.charAt(0).toLowerCase() + r.msg.slice(1);
        }
        if (r) { bad.push(i); if (!first) first = r; }
      });
      if (!bad.length) return { ok: true };
      var right = slots.length - bad.length;
      first.bad = bad; first.msg = (right ? right + ' von ' + slots.length + ' Feldern stimmen schon. ' : '') + first.msg;
      return first;
    }
    var f0s = rows[0].start, k0 = p.ks[0];
    return { prompt: erw ? 'Erweitere. Fülle die Tabelle aus.' : 'Kürze. Fülle die Tabelle aus.', sub: p.vol ? 'In der letzten Spalte: vollständig gekürzt.' : null,
      answer: answer, check: check,
      hints: [erw ? 'In jeder Spalte steht, womit erweitert wird: Zähler *und* Nenner mal diese Zahl.' : 'In jeder Spalte steht, wodurch gekürzt wird: Zähler *und* Nenner geteilt durch diese Zahl.',
              p.hideCol != null ? 'Für die Spalte mit dem leeren Kopf: Vergleiche einen Ausgangsbruch mit seinem Ergebnis.' : 'Fang mit der ersten Spalte an.',
              'Zum Beispiel: ' + fq(f0s) + ' ' + op + ' ' + k0 + ' → ' + fx(f0s.n, op, k0, f0s.d), 'Prüfe jedes Feld: Ist der neue Bruch gleich viel wie der Ausgangsbruch?'],
      solution: rows.map(function (r) { return fq(r.start) + ': ' + p.ks.map(function (k, c) { var t = erw ? F.expand(r.start, k) : F.make(r.start.n / k, r.start.d / k); return op + k + ' → ' + fq(t); }).join(',  '); }),
      lab: { mode: 'erweitern', n: f0s.n, d: f0s.d }, why: erw ? 'erw-gleich' : 'kuerz-gleich' };
  }
  function cellKinds(R, rows, cols, level) { var out = []; for (var r = 0; r < rows; r++) { var line = []; for (var c = 0; c < cols; c++) line.push(level === 1 ? 'f' : R.pick(level === 2 ? ['f', 'n', 'd'] : ['f', 'n', 'd', 'g'])); out.push(line); } return out; }
  reg({ id: 'tabelle_erw', skill: 'tabelle', tags: ['convert'],
    params: function (level, R) {
      var nr = level === 1 ? 1 : 2, rows = [], seen = {};
      while (rows.length < nr) { var b = lowest(R, level === 1 ? [2, 3, 4, 5, 6] : [2, 3, 4, 5, 6, 7, 8, 9]); if (!seen[b[1]]) { seen[b[1]] = 1; rows.push(b); } }
      var ks = R.shuffle(level === 3 ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6]).slice(0, 3).sort(function (a, b) { return a - b; });
      var p = { rows: rows, ks: ks, cells: cellKinds(R, nr, 3, level), hideCol: level === 3 && R.chance(0.6) ? R.int(0, 2) : null };
      if (!p.cells.some(function (l, ri) { return l.some(function (k, c) { return k !== 'g' && c !== p.hideCol; }); })) p.cells[0][p.hideCol === 0 ? 1 : 0] = 'f';
      return p;
    },
    build: function (p) { return tableTask(p, true); }
  });
  reg({ id: 'tabelle_kuerz', skill: 'tabelle', tags: ['convert'],
    params: function (level, R) {
      var M = R.pick(level === 1 ? [6, 12] : level === 2 ? [12, 18, 24] : [12, 18, 24, 30, 36]), nr = level === 1 ? 1 : 2, rows = [], seen = {};
      for (var i = 0; i < 60 && rows.length < nr; i++) { var b = lowest(R, [2, 3, 4, 5]); if (!seen[b[1]] && b[1] * M <= 120) { seen[b[1]] = 1; rows.push(b); } }
      while (rows.length < nr) rows.push([1, 2 + rows.length]);
      var divs = F.divisors(M).filter(function (x) { return x > 1 && x < M; });
      var vol = level >= 2, ks = R.shuffle(divs).slice(0, vol ? 2 : 3).sort(function (a, b) { return a - b; });
      if (vol) ks.push(M);
      var p = { M: M, rows: rows, ks: ks, vol: vol, cells: cellKinds(R, nr, ks.length, level), hideCol: level === 3 && R.chance(0.5) ? R.int(0, 1) : null };
      if (vol) p.cells.forEach(function (l) { l[ks.length - 1] = 'f'; });
      return p;
    },
    build: function (p) { return tableTask(p, false); }
  });

  // ================================================================ L – gleichnamig machen

  var PAIRS = { 1: [[2, 4], [3, 6], [2, 6], [4, 8], [2, 3], [3, 4], [2, 5], [5, 10]],
                2: [[4, 6], [6, 9], [6, 8], [8, 12], [10, 15], [4, 10], [6, 10], [9, 12], [3, 5], [4, 5], [3, 8]],
                3: [[12, 18], [14, 21], [15, 20], [18, 24], [12, 16], [10, 12], [9, 15], [6, 14]] };
  var TRIPLES = [[2, 3, 4], [3, 4, 6], [2, 4, 5], [4, 6, 8], [3, 5, 6], [6, 8, 12], [2, 3, 5]];
  function pairParams(level, R, three) {
    var ds = three ? R.pick(TRIPLES) : R.shuffle(R.pick(PAIRS[level]));
    var ns = ds.map(function (d) { var n; do { n = R.int(1, d - 1); } while (F.gcd(n, d) !== 1); return n; });
    return { ds: ds, ns: ns };
  }
  reg({ id: 'kgv_nenner', skill: 'gleichnamig', tags: ['convert', 'short'],
    params: function (level, R) { return pairParams(level, R, level === 3 && R.chance(0.4)); },
    build: function (p) {
      var L = F.lcmAll(p.ds), prod = p.ds.reduce(function (a, b) { return a * b; }, 1), big = Math.max.apply(null, p.ds);
      var list = p.ds.map(function (d, i) { return fq(F.make(p.ns[i], d)); });
      var lst = list.length === 2 ? list[0] + ' und ' + list[1] : list[0] + ', ' + list[1] + ' und ' + list[2];
      return { prompt: 'Finde den *kleinsten* gemeinsamen Nenner von ' + lst + '.', answer: { type: 'num', value: L },
        check: function (inp) { return checkNum(L, inp, [function (x) {
          var not = p.ds.filter(function (d) { return x % d; });
          if (x > 0 && not.length) return E('hauptnenner', x + ' ist nicht durch ' + not[0] + ' teilbar. Der gemeinsame Nenner muss durch *alle* Nenner teilbar sein.');
          if (x > L) return E('kgv', x + ' geht – es ist ein gemeinsamer Nenner! Aber es gibt einen *kleineren*. Schreibe die Vielfachen von ' + big + ' auf.');
          return null; }]); },
        hints: ['Der gemeinsame Nenner muss durch ' + p.ds.join(' und ') + ' teilbar sein.', 'Schreibe die Vielfachen des größten Nenners auf: ' + multiples(big, big * 6).join(', ') + ' …', 'Welches Vielfache ist auch durch ' + p.ds.filter(function (d) { return d !== big; }).join(' und ') + ' teilbar?', 'Nimm das *kleinste* davon. (Malnehmen der Nenner geht immer – ist aber oft nicht das kleinste.)'],
        solution: p.ds.map(function (d) { return 'Vielfache von ' + d + ': ' + multiples(d, L).join(', '); }).concat(['Kleinster gemeinsamer Nenner (kgV): ' + L + (prod !== L ? ' (nicht ' + prod + ')' : '')]), why: 'kgv-warum' };
    }
  });

  // steps: common denominator (any common multiple counts) → expand each fraction
  function sharedSteps(fr, state, demoFn) {
    var L = F.lcmAll(fr.map(function (f) { return f.d; }));
    state.D = L;
    var steps = [{ label: 'Finde einen *gemeinsamen Nenner* von ' + fr.map(function (f) { return '[' + f.d + ']'; }).join(fr.length === 2 ? ' und ' : ', ') + ':', answer: { type: 'num', value: L },
      check: function (inp) {
        var r = checkNum(L, inp, [function (x) {
          var not = fr.filter(function (f) { return x % f.d; });
          if (x > 0 && not.length) return E('hauptnenner', x + ' ist nicht durch ' + not[0].d + ' teilbar. Der gemeinsame Nenner muss durch *jeden* Nenner teilbar sein.');
          if (x > L) return { ok: true, note: 'Richtig – ' + x + ' ist ein gemeinsamer Nenner! (Mit ' + L + ' wären die Zahlen kleiner.)' };
          return null; }]);
        if (r.ok) { state.D = inp.x; for (var i = 1; i <= fr.length; i++) { var a = steps[i].answer, f = fr[i - 1]; a.fixed = { d: state.D }; a.value = F.make(f.n * state.D / f.d, state.D); } }
        return r;
      } }];
    fr.forEach(function (f) {
      steps.push({ label: 'Erweitere ' + fq(f) + ' auf diesen Nenner:', answer: { type: 'frac', whole: 'none', fixed: { d: L }, before: fq(f) + ' =', value: F.make(f.n * L / f.d, L) },
        check: function (inp) {
          var g = readND(inp); if (!g) return inc('Trage den Zähler ein.');
          var D = state.D, k = D / f.d, want = f.n * k;
          if (g.n === want) return { ok: true };
          if (g.n === f.n && k > 1) return E('hnzaehler', 'Der Nenner wurde von ' + f.d + ' auf ' + D + ' erweitert, also *mal* ' + k + '. Der Zähler muss auch mal ' + k + '.', { demo: demoFn && demoFn() });
          if (g.n === f.n + D - f.d) return E('hnzaehler', 'Du hast ' + (D - f.d) + ' addiert. Aber ' + f.d + ' → ' + D + ' ist *mal* ' + k + ' – also auch der Zähler mal ' + k + '.', { demo: demoFn && demoFn() });
          if (g.n === k) return E('hnzaehler', k + ' ist die Erweiterungszahl – gut! Jetzt: ' + f.n + ' · ' + k + ' = ?');
          return E('hnzaehler', 'Wie oft passt ' + f.d + ' in ' + D + '? Mit dieser Zahl nimmst du auch den Zähler ' + f.n + ' mal.', { demo: demoFn && demoFn() });
        } });
    });
    return steps;
  }
  reg({ id: 'gleichnamig', skill: 'gleichnamig', tags: ['convert'],
    params: function (level, R) { return pairParams(level, R, level === 3 && R.chance(0.35)); },
    build: function (p) {
      var fr = p.ds.map(function (d, i) { return F.make(p.ns[i], d); }), state = {}, L = F.lcmAll(p.ds);
      var demo = function () { var list = fr.map(function (f) { return [f.n, f.d, state.D / f.d]; }); return barsOK(list) ? bars(list, { lines: false }) : null; };
      var lst = fr.map(fq).join(fr.length === 2 ? ' und ' : ', ');
      var pic = barsOK(fr.map(function (f) { return [f.n, f.d, L / f.d]; })) ? bars(fr.map(function (f) { return [f.n, f.d, L / f.d]; })) : null;
      return { prompt: 'Mache ' + lst + ' gleichnamig.', sub: '*Gleichnamig* heißt: gleicher Nenner.', visual: p.ds.every(function (d) { return d <= 12; }) ? bars(fr.map(function (f) { return [f.n, f.d]; })) : null,
        answer: { type: 'steps', steps: sharedSteps(fr, state, demo) },
        hints: ['Der gemeinsame Nenner muss durch ' + p.ds.join(' und ') + ' teilbar sein.', 'Vielfache von ' + Math.max.apply(null, p.ds) + ': ' + multiples(Math.max.apply(null, p.ds), Math.max.apply(null, p.ds) * 5).join(', ') + ' …', 'Ein gemeinsamer Nenner ist ' + L + '.', 'Erweitere jeden Bruch: ' + fr.map(function (f) { return fq(f) + ' mit ' + L / f.d; }).join(', ') + '.'],
        solution: ['Gemeinsamer Nenner: ' + L].concat(fr.map(function (f) { return fq(f) + ' = ' + (L / f.d > 1 ? fx(f.n, '·', L / f.d, f.d) + ' = ' : '') + '{' + f.n * L / f.d + '/' + L + '}'; })),
        solutionVisual: pic, lab: { mode: 'vergleichen', a: [fr[0].n, fr[0].d], b: [fr[1].n, fr[1].d] }, why: 'gleichnamig-warum' };
    }
  });

  // ================================================================ M – vergleichen

  function cmpParams(level, R, want) {
    var kind = want || R.pick(level === 1 ? ['nenner', 'zaehler', 'vielfach'] : level === 2 ? ['verschieden', 'verschieden', 'gleich', 'zaehler', 'vielfach'] : ['verschieden', 'unecht', 'halb', 'knapp', 'gleich']);
    var a, b;
    for (var t = 0; t < 60; t++) {
      if (kind === 'nenner') { var d = R.int(3, 12), x = R.int(1, d - 1), y; do { y = R.int(1, d - 1); } while (y === x); a = [x, d]; b = [y, d]; }
      else if (kind === 'zaehler') { var n = R.int(1, level === 1 ? 4 : 7), d1 = R.int(n + 1, n + 8), d2; do { d2 = R.int(n + 1, n + 9); } while (d2 === d1); a = [n, d1]; b = [n, d2]; }
      else if (kind === 'vielfach') { var dd = R.int(2, 6), m = R.int(2, 3); a = lowest(R, [dd]); var D = dd * m, z; do { z = R.int(1, D - 1); } while (z * dd === a[0] * D); b = [z, D]; }
      else if (kind === 'gleich') { var bb = lowest(R, [2, 3, 4, 5, 6]), j = R.int(1, 3), k; do { k = R.int(2, 5); } while (k === j); a = [bb[0] * j, bb[1] * j]; b = [bb[0] * k, bb[1] * k]; }
      else if (kind === 'halb') { var p1 = R.pick([5, 7, 9, 11]), q1 = R.pick([7, 9, 11, 13].filter(function (q) { return q !== p1; })); a = [Math.floor(p1 / 2), p1]; b = [Math.ceil(q1 / 2), q1]; }
      else if (kind === 'knapp') { var e1 = R.int(4, 9), e2; do { e2 = R.int(4, 10); } while (e2 === e1); a = [e1 - 1, e1]; b = [e2 - 1, e2]; }
      else if (kind === 'unecht') { var u1 = R.int(2, 6), u2; do { u2 = R.int(2, 6); } while (u2 === u1); var w = R.int(1, 2); a = [w * u1 + R.int(1, u1 - 1), u1]; b = [w * u2 + R.int(1, u2 - 1), u2]; }
      else { var pr = R.pick(PAIRS[level === 3 ? 3 : 2]); a = lowest(R, [pr[0]]); b = lowest(R, [pr[1]]); }
      if (kind === 'gleich' || a[0] * b[1] !== b[0] * a[1]) if (kind !== 'verschieden' || a[0] !== b[0]) break;
    }
    var sw = R.chance(0.5);
    return { kind: kind, a: sw ? b : a, b: sw ? a : b, mix: kind === 'unecht' ? R.int(0, 2) : 0 };
  }
  function cmpHints(a, b, kind) {
    var L = F.lcm(a.d, b.d);
    if (a.d === b.d) return ['Beide Brüche haben denselben Nenner – die Stücke sind gleich groß.', 'Dann zählt nur, wie *viele* Stücke es sind.', 'Vergleiche die Zähler: ' + a.n + ' und ' + b.n + '.', 'Die *offene Seite* des Zeichens zeigt zum größeren Bruch.'];
    if (a.n === b.n) return ['Beide Male gleich viele Stücke – aber wie groß sind die Stücke?', 'Ein Ganzes in ' + a.d + ' Teile oder in ' + b.d + ' Teile: Wo sind die Stücke größer?', 'Je *kleiner* der Nenner, desto *größer* ist jedes Stück.', 'Der Bruch mit den größeren Stücken ist größer.'];
    if (kind === 'halb') return ['Tipp: Vergleiche beide mit der *Hälfte*.', 'Die Hälfte von ' + a.d + ' Stücken wären ' + a.d / 2 + ' Stücke. Ist ' + fq(a) + ' mehr oder weniger als {1/2}?', 'Und ' + fq(b) + '? Mehr oder weniger als {1/2}?', 'Oder ganz sicher: gemeinsamer Nenner ' + L + '.'];
    if (kind === 'knapp') return ['Wie viel fehlt jedem Bruch bis zum Ganzen?', fq(a) + ' fehlt {1/' + a.d + '}, ' + fq(b) + ' fehlt {1/' + b.d + '}.', 'Welches fehlende Stück ist kleiner?', 'Wem weniger fehlt, der ist größer.'];
    return ['Die Nenner sind verschieden – die Stücke sind verschieden groß. Direkt vergleichen geht nicht.', 'Mache die Brüche gleichnamig: Finde einen gemeinsamen Nenner von ' + a.d + ' und ' + b.d + '.',
            'Ein gemeinsamer Nenner ist ' + L + ': ' + fq(a) + ' = {' + a.n * L / a.d + '/' + L + '}, ' + fq(b) + ' = {' + b.n * L / b.d + '/' + L + '}.', 'Jetzt sind die Stücke gleich groß: Vergleiche die Zähler.'];
  }
  function cmpSolution(a, b) {
    var L = F.lcm(a.d, b.d), c = F.cmp(a, b), A = a.n * L / a.d, B = b.n * L / b.d, out = [];
    if (a.d === b.d) out.push('Gleiche Nenner: ' + a.n + ' ' + sym(c) + ' ' + b.n + ' Stücke.');
    else if (a.n === b.n) out.push('Gleiche Zähler: ' + (a.d < b.d ? word(a.d) : word(b.d)) + ' sind größer als ' + (a.d < b.d ? word(b.d) : word(a.d)) + '.');
    else out.push('Gleichnamig: ' + (a.d === L ? fq(a) : fq(a) + ' = {' + A + '/' + L + '}') + ',  ' + (b.d === L ? fq(b) : fq(b) + ' = {' + B + '/' + L + '}') + '  →  ' + A + ' ' + sym(c) + ' ' + B);
    out.push('Also: ' + fq(a) + ' ' + sym(c) + ' ' + fq(b));
    return out;
  }
  reg({ id: 'vergleich_wahl', skill: 'vergleichen', tags: ['concept', 'short'],
    params: function (level, R, want) { return cmpParams(level, R, want); },
    build: function (p) {
      var a = F.make(p.a[0], p.a[1]), b = F.make(p.b[0], p.b[1]), c = F.cmp(a, b), corr = signId(c);
      var sa = fs(a, p.mix === 1), sb = fs(b, p.mix === 2);
      var pic = ['nenner', 'zaehler', 'vielfach'].indexOf(p.kind) >= 0 && a.d <= 12 && b.d <= 12 ? bars([[a.n, a.d], [b.n, b.d]]) : null;
      return { prompt: 'Welches Zeichen passt?   ' + sa + ' ▢ ' + sb, visual: pic,
        answer: { type: 'choice', options: SIGNS, signs: true, correct: corr },
        check: function (inp) { if (!inp || inp.id == null) return { incomplete: true, msg: 'Wähle <, > oder =.' }; if (inp.id === corr) return { ok: true }; return cmpWrong(a, b, inp.id); },
        hints: cmpHints(a, b, p.kind), solution: cmpSolution(a, b), solutionVisual: compareDemo(a, b), demo: compareDemo(a, b),
        lab: { mode: 'vergleichen', a: p.a, b: p.b }, why: p.kind === 'zaehler' ? 'groesserer-nenner' : a.d === b.d ? null : 'gleichnamig-warum' };
    }
  });

  var REASON_OK = 'Nach dem Erweitern sind alle Stücke gleich groß. Dann zeigt der größere Zähler den größeren Bruch.';
  reg({ id: 'vergleich_schritte', skill: 'vergleichen', tags: ['convert'],
    params: function (level, R) {
      var p = cmpParams(level, R, level === 1 ? R.pick(['vielfach', 'verschieden']) : level === 2 ? 'verschieden' : R.pick(['verschieden', 'verschieden', 'unecht']));
      if (p.a[1] === p.b[1] || p.a[0] * p.b[1] === p.b[0] * p.a[1]) { p.a = [3, 4]; p.b = [5, 6]; }
      p.why = level >= 2 && R.chance(level === 2 ? 0.5 : 0.8); p.o = R.int(0, 2);
      return p;
    },
    build: function (p) {
      var a = F.make(p.a[0], p.a[1]), b = F.make(p.b[0], p.b[1]), c = F.cmp(a, b), corr = signId(c), state = {};
      var steps = sharedSteps([a, b], state, function () { return compareDemo(a, b); });
      steps.push({ label: 'Vergleiche:  ' + fq(a) + ' ▢ ' + fq(b), answer: { type: 'choice', options: SIGNS, signs: true, correct: corr },
        check: function (inp) {
          if (!inp || inp.id == null) return { incomplete: true, msg: 'Wähle <, > oder =.' };
          if (inp.id === corr) return { ok: true };
          var D = state.D, A = a.n * D / a.d, B = b.n * D / b.d, pp = signOf(inp.id);
          var dl = [[a.n, a.d, D / a.d], [b.n, b.d, D / b.d]], pic = barsOK(dl) ? bars(dl, { lines: true }) : compareDemo(a, b);
          if (pp === sign(a.n - b.n) && pp !== 0) return E('zaehlervgl', 'Schau auf die *erweiterten* Brüche: {' + A + '/' + D + '} und {' + B + '/' + D + '}. Nicht auf die alten Zähler!', { demo: pic });
          if (pp === sign(a.d - b.d) && pp !== 0) return E('nennergroesser', 'Der größere Nenner macht einen Bruch nicht größer. Vergleiche {' + A + '/' + D + '} und {' + B + '/' + D + '}.', { demo: pic });
          return E('zeichen', 'Du hast {' + A + '/' + D + '} und {' + B + '/' + D + '} – gleich große Stücke. Welcher Zähler ist größer? Die *offene Seite* zeigt zum Größeren.', { demo: pic });
        } });
      if (p.why) {
        var ro = rot([opt('ok', REASON_OK), opt('n', 'Weil der Bruch mit dem größeren Nenner immer größer ist.'), opt('z', 'Weil man bei Brüchen immer nur die Zähler vergleicht.')], p.o);
        var rw = { n: { err: 'reason', msg: 'Nein – ein größerer Nenner heißt *kleinere* Stücke. Wir haben erst gleichnamig gemacht, damit die Stücke gleich groß sind.' },
                   z: { err: 'reason', msg: 'Nur wenn die Nenner gleich sind! Deshalb haben wir zuerst gleichnamig gemacht.' } };
        steps.push({ label: 'Warum stimmt das?', answer: { type: 'choice', options: ro, long: true, correct: 'ok' }, check: function (inp) { return checkChoice('ok', inp, rw); } });
      }
      var L = F.lcm(a.d, b.d);
      return { prompt: 'Vergleiche ' + fq(a) + ' und ' + fq(b) + ' – Schritt für Schritt.', answer: { type: 'steps', steps: steps },
        hints: ['Die Nenner ' + a.d + ' und ' + b.d + ' sind verschieden. Erst gleichnamig machen!', 'Der gemeinsame Nenner muss durch ' + a.d + ' und durch ' + b.d + ' teilbar sein – zum Beispiel ' + L + '.', 'Erweitere: ' + fq(a) + ' mit ' + L / a.d + ', ' + fq(b) + ' mit ' + L / b.d + '.', 'Jetzt sind die Stücke gleich groß – vergleiche die Zähler.'],
        solution: cmpSolution(a, b).concat(p.why ? [REASON_OK] : []), solutionVisual: compareDemo(a, b), demo: compareDemo(a, b),
        lab: { mode: 'vergleichen', a: p.a, b: p.b }, why: 'gleichnamig-warum' };
    }
  });

  var STORIES = [
    { id: 'pizza', t: '{A} isst {a} einer Pizza. {B} isst {b} einer gleich großen Pizza.', ask: 'Wer hat mehr gegessen?', more: true },
    { id: 'schoko', t: '{A} hat {a} einer Tafel Schokolade. {B} hat {b} einer gleichen Tafel.', ask: 'Wer hat mehr Schokolade?', more: true },
    { id: 'saft', t: 'In der Flasche von {A} sind {a} l Saft, in der Flasche von {B} {b} l.', ask: 'Wer hat mehr Saft?', more: true },
    { id: 'weg', t: 'Der Schulweg von {A} ist {a} km lang, der von {B} {b} km.', ask: 'Wer hat den längeren Schulweg?', more: true },
    { id: 'kuchen', t: 'Vom Blechkuchen hat {A} {a} gegessen, {B} {b}.', ask: 'Wer hat *weniger* gegessen?', more: false },
    { id: 'spiele', t: 'Team {A} hat [{x}] von [{y}] Spielen gewonnen, Team {B} [{u}] von [{v}] Spielen.', ask: 'Welches Team hat den größeren Anteil gewonnen?', more: true, count: true, lv: 2 },
    { id: 'geld', t: '{A} bekommt {a} €, {B} bekommt {b} €.', ask: 'Wer bekommt mehr Geld?', more: true, lv: 2 },
    { id: 'rest', t: '{A} hat schon {a} der Hausaufgaben geschafft, {B} {b}.', ask: 'Wer muss *noch mehr* machen?', more: false, rest: true, lv: 3 }
  ];
  var TEAMS = ['Blau', 'Rot', 'Grün', 'Gelb'];
  reg({ id: 'vergleich_sach', skill: 'vergleichen', tags: ['world'],
    params: function (level, R) {
      var avail = STORIES.filter(function (s) { return (s.lv || 1) <= level; }), st = R.pick(avail);
      var p = cmpParams(level, R, R.pick(level === 1 ? ['nenner', 'zaehler', 'vielfach'] : level === 2 ? ['verschieden', 'vielfach', 'gleich'] : ['verschieden', 'halb', 'knapp', 'gleich']));
      if (st.id === 'geld') { p.a = R.pick([[3, 4], [1, 2], [1, 4], [3, 5], [2, 5], [4, 5]]); p.b = R.pick([[7, 10], [3, 10], [9, 20], [11, 20], [13, 20], [1, 5]]); if (p.a[0] * p.b[1] === p.b[0] * p.a[1]) p.b = [7, 10]; }
      var A = R.int(0, 11), B; do { B = R.int(0, 11); } while (B === A);
      p.s = STORIES.indexOf(st); p.A = A; p.B = B; p.m1 = R.int(1, 3); p.m2 = R.int(1, 3); p.ta = R.int(0, 3);
      return p;
    },
    build: function (p) {
      var st = STORIES[p.s], a = F.make(p.a[0], p.a[1]), b = F.make(p.b[0], p.b[1]);
      var nA = st.count ? TEAMS[p.ta] : name(p.A), nB = st.count ? TEAMS[(p.ta + 1) % 4] : name(p.B);
      var txt = st.t.replace('{A}', nA).replace('{B}', nB).replace('{a}', fq(a)).replace('{b}', fq(b))
        .replace('{x}', a.n * p.m1).replace('{y}', a.d * p.m1).replace('{u}', b.n * p.m2).replace('{v}', b.d * p.m2);
      var c = F.cmp(a, b), target = st.more ? c : -c, corr = target > 0 ? 'A' : target < 0 ? 'B' : 'eq';
      var opts = [opt('A', st.count ? 'Team ' + nA : nA), opt('B', st.count ? 'Team ' + nB : nB), opt('eq', 'Beide gleich viel')];
      var L = F.lcm(a.d, b.d), gl = 'Mache gleichnamig: ' + fq(a) + ' = {' + a.n * L / a.d + '/' + L + '}, ' + fq(b) + ' = {' + b.n * L / b.d + '/' + L + '}.';
      var ra = st.rest ? F.make(a.d - a.n, a.d) : null, rb = st.rest ? F.make(b.d - b.n, b.d) : null;
      return { prompt: txt, sub: st.ask, answer: { type: 'choice', options: opts, correct: corr },
        check: function (inp) {
          if (!inp || inp.id == null) return { incomplete: true, msg: 'Wähle eine Antwort.' };
          if (inp.id === corr) return { ok: true };
          var demo = compareDemo(a, b);
          if (st.rest) return E('vergleich', 'Achtung: Gefragt ist, wer *noch mehr* machen muss – also der größere *Rest*. Rest bei ' + nA + ': ' + fq(ra) + ', bei ' + nB + ': ' + fq(rb) + '.', { demo: demo });
          if (!st.more && c !== 0) return E('vergleich', 'Lies genau: Gefragt ist, wer *weniger* gegessen hat. ' + (a.d !== b.d ? gl : ''), { demo: demo });
          if (st.count) return E('vergleich', 'Es kommt nicht auf die Anzahl der Siege an, sondern auf den *Anteil*: ' + fq(F.make(a.n * p.m1, a.d * p.m1)) + ' und ' + fq(F.make(b.n * p.m2, b.d * p.m2)) + '. Kürze und mache gleichnamig.', { demo: demo });
          var pid = inp.id === 'eq' ? 'eq' : (inp.id === 'A') === st.more ? 'gt' : 'lt';
          var r = cmpWrong(a, b, pid); return r;
        },
        hints: (st.rest ? ['Wie viel fehlt jedem noch? Ein Ganzes sind alle Hausaufgaben.', nA + ': ' + fq(F.make(a.d, a.d)) + ' − ' + fq(a) + ' = ' + fq(ra) + '.', nB + ': noch ' + fq(rb) + '.', 'Vergleiche die Reste – wer hat den größeren Rest?'] : st.count ? ['Schreibe die Anteile als Brüche: gewonnene Spiele von allen Spielen.', 'Team ' + nA + ': ' + fq(F.make(a.n * p.m1, a.d * p.m1)) + ', Team ' + nB + ': ' + fq(F.make(b.n * p.m2, b.d * p.m2)) + '.', 'Kürze beide und mache sie gleichnamig.', 'Vergleiche jetzt.'] : cmpHints(a, b, p.kind)),
        solution: (st.count ? ['Anteile: Team ' + nA + ' ' + fq(F.make(a.n * p.m1, a.d * p.m1)) + ' = ' + fq(a) + ', Team ' + nB + ' ' + fq(F.make(b.n * p.m2, b.d * p.m2)) + ' = ' + fq(b) + '.'] : st.rest ? ['Rest: ' + nA + ' ' + fq(ra) + ', ' + nB + ' ' + fq(rb) + '.'] : []).concat(cmpSolution(a, b)).concat([corr === 'eq' ? 'Beide gleich viel.' : (corr === 'A' ? opts[0].label : opts[1].label) + '.']), demo: compareDemo(a, b), lab: { mode: 'vergleichen', a: p.a, b: p.b } };
    }
  });

  // ================================================================ N – ordnen

  reg({ id: 'ordnen', skill: 'ordnen', tags: ['concept', 'challenge'],
    params: function (level, R) {
      var dir = R.chance(level === 1 ? 0.3 : 0.5) ? 'desc' : 'asc', cards = [], seen = {};
      function add(n, d, mix) { var k = n + '/' + d; if (seen[k]) return false; seen[k] = 1; cards.push([n, d, mix ? 1 : 0]); return true; }
      if (level === 1) {
        if (R.chance(0.5)) { var d = R.int(5, 12); R.shuffle(G.range(d - 1)).slice(0, 3).forEach(function (x) { add(x + 1, d); }); }
        else { var n = R.int(1, 4); R.shuffle([n + 1, n + 2, n + 3, n + 4, n + 5, n + 7]).slice(0, 3).forEach(function (x) { add(n, x); }); }
      } else {
        var D = R.pick(level === 2 ? [6, 8, 10, 12, 15, 18, 20, 24] : [12, 18, 20, 24, 30, 36]), max = level === 3 ? 2 : 1, want = level === 2 ? 4 : 5;
        var nums = R.shuffle(G.range(D * max - 1).map(function (x) { return x + 1; }).filter(function (x) { return x % D; }));
        var pairEq = R.chance(level === 2 ? 0.35 : 0.55);
        for (var i = 0; i < nums.length && cards.length < want - (pairEq ? 1 : 0); i++) { var f = F.reduce(F.make(nums[i], D)); add(f.n, f.d, level === 3 && f.n > f.d && R.chance(0.5)); }
        if (pairEq) { var c0 = cards[0], k = R.int(2, 3); if (!add(c0[0] * k, c0[1] * k)) add(c0[0] * (k + 1), c0[1] * (k + 1)); }
        cards = R.shuffle(cards);
      }
      return { cards: cards, dir: dir };
    },
    build: function (p) {
      var fr = p.cards.map(function (c) { return F.make(c[0], c[1]); }), asc = p.dir === 'asc';
      var order = G.range(fr.length).sort(function (i, j) { return asc ? F.cmp(fr[i], fr[j]) || i - j : F.cmp(fr[j], fr[i]) || i - j; });
      var L = F.lcmAll(fr.map(function (f) { return f.d; }));
      function valid(o, up) { for (var i = 1; i < o.length; i++) { var c = F.cmp(fr[o[i - 1]], fr[o[i]]); if (up ? c > 0 : c < 0) return false; } return true; }
      function sortedBy(o, key, up) { for (var i = 1; i < o.length; i++) { var x = key(o[i - 1]), y = key(o[i]); if (up ? x > y : x < y) return false; } return true; }
      var pic = barsOK(fr.map(function (f) { return [f.n, f.d]; })) ? bars(fr.map(function (f, i) { return [f.n, f.d, 1, i % 4]; }), { lines: false }) : { type: 'numline', max: Math.ceil(Math.max.apply(null, fr.map(F.value))), marks: fr.map(function (f, i) { return { n: f.n, d: f.d, col: i % 4, below: i % 2 === 1 }; }) };
      return { prompt: 'Ordne die Brüche ' + (asc ? '*vom kleinsten zum größten*.' : '*vom größten zum kleinsten*.'), sub: 'Tippe die Karten nacheinander an. Gleich große Brüche dürfen in beliebiger Reihenfolge nebeneinander stehen.',
        answer: { type: 'order', cards: p.cards.map(function (c) { return { n: c[0], d: c[1], mix: !!c[2] }; }), dir: p.dir, correct: order, help: pic },
        check: function (inp) {
          var o = inp && inp.order;
          if (!o || o.length < fr.length) return { incomplete: true, msg: 'Lege alle Karten in die Reihe.' };
          if (valid(o, asc)) return { ok: true };
          if (valid(o, !asc)) return E('zeichen', 'Gut sortiert – aber andersherum! Gefragt ist ' + (asc ? 'vom *kleinsten* zum größten.' : 'vom *größten* zum kleinsten.'));
          for (var i = 0; i < o.length; i++) for (var j = i + 2; j < o.length; j++) if (F.eq(fr[o[i]], fr[o[j]])) {
            for (var m = i + 1; m < j; m++) if (!F.eq(fr[o[m]], fr[o[i]])) return E('gleichordnen', fq(fr[o[i]]) + ' und ' + fq(fr[o[j]]) + ' sind *gleich groß* – sie gehören direkt nebeneinander.', { bad: [i, j], demo: pic });
          }
          if (sortedBy(o, function (x) { return fr[x].n; }, asc) && fr.some(function (f) { return f.d !== fr[0].d; })) return E('zaehlervgl', 'Du hast nach den *Zählern* sortiert. Die Nenner sind aber verschieden – die Stücke verschieden groß. Tipp: gemeinsamer Nenner ' + L + '.', { demo: pic });
          if (sortedBy(o, function (x) { return fr[x].d; }, asc) && fr.some(function (f) { return f.d !== fr[0].d; })) return E('nennergroesser', 'Du hast nach den *Nennern* sortiert. Aber ein größerer Nenner heißt *kleinere* Stücke! Tipp: gemeinsamer Nenner ' + L + '.', { demo: pic });
          for (var q = 1; q < o.length; q++) { var cc = F.cmp(fr[o[q - 1]], fr[o[q]]); if (asc ? cc > 0 : cc < 0) return E('vergleich', 'Schau dir ' + fq(fr[o[q - 1]]) + ' und ' + fq(fr[o[q]]) + ' an (Platz ' + q + ' und ' + (q + 1) + '): Welcher ist größer? Tipp: gemeinsamer Nenner ' + L + '.', { bad: [q - 1, q], demo: pic }); }
          return E('vergleich', 'Noch nicht ganz richtig sortiert.');
        },
        hints: ['Die Nenner sind ' + (fr.every(function (f) { return f.d === fr[0].d; }) ? 'gleich – vergleiche nur die Zähler.' : fr.every(function (f) { return f.n === fr[0].n; }) ? 'verschieden, die Zähler gleich: Je kleiner der Nenner, desto größer das Stück.' : 'verschieden – mache alle Brüche gleichnamig.'),
                'Ein gemeinsamer Nenner für alle ist ' + L + '.', fr.map(function (f) { return f.d === L ? fq(f) : fq(f) + ' = {' + f.n * L / f.d + '/' + L + '}'; }).join(',  '), 'Jetzt kannst du die Zähler vergleichen. Gleich große Brüche kommen nebeneinander.'],
        solution: [fr.map(function (f) { return f.d === L ? fq(f) : fq(f) + ' = {' + f.n * L / f.d + '/' + L + '}'; }).join(',  '), order.map(function (i) { return fq(fr[i]); }).reduce(function (s, x, i) { if (!i) return x; var c = F.cmp(fr[order[i - 1]], fr[order[i]]); return s + ' ' + sym(c) + ' ' + x; }, '')],
        solutionVisual: pic, demo: pic, why: 'ordnen-gleich' };
    }
  });

  // ================================================================ Fehler finden ("Tom behauptet …")

  var CLAIMS = {
    nenner:   { lv: 1, right: false, err: 'nennergroesser' },
    mehr:     { lv: 1, right: false, err: 'zaehlervgl' },
    nuroben:  { lv: 1, right: false, err: 'nuroben' },
    rerw:     { lv: 1, right: true },
    zaehler:  { lv: 2, right: false, err: 'zaehlervgl' },
    addiert:  { lv: 2, right: false, err: 'addiert' },
    gleichn:  { lv: 2, right: false, err: 'hnzaehler' },
    rvgl:     { lv: 2, right: true },
    nichtvoll:{ lv: 3, right: false, err: 'nichtvoll' }
  };
  reg({ id: 'vgl_fehler', skill: 'vgl_warum', tags: ['why'],
    params: function (level, R) {
      var ids = Object.keys(CLAIMS).filter(function (k) { return CLAIMS[k].lv <= level; }), v = R.pick(ids), b = lowest(R, [3, 4, 5, 6]);
      var p = { v: v, who: R.int(0, 11), a: b[0], b: b[1], k: R.int(2, 4), o: R.int(0, 2), o2: R.int(0, 1) };
      if (v === 'zaehler' || v === 'rvgl') { var pr = R.pick([[[2, 3], [3, 5]], [[3, 4], [4, 7]], [[1, 2], [2, 5]], [[2, 3], [5, 9]], [[3, 5], [4, 9]], [[4, 5], [5, 8]]]); p.f1 = pr[0]; p.f2 = pr[1]; }
      if (v === 'gleichn') { var q = R.pick([[[2, 3], [3, 4]], [[1, 2], [2, 3]], [[3, 4], [1, 6]], [[2, 5], [1, 3]]]); p.f1 = q[0]; p.f2 = q[1]; }
      if (v === 'nenner') { p.n = R.int(1, 4); p.d1 = p.n + R.int(1, 3); p.d2 = p.d1 + R.int(1, 4); }
      return p;
    },
    build: function (p) {
      var N = name(p.who), s = F.make(p.a, p.b), k = p.k, claim, reasons, okR, why, hint;
      switch (p.v) {
        case 'nenner':
          claim = N + ' behauptet: {' + p.n + '/' + p.d2 + '} > {' + p.n + '/' + p.d1 + '}, weil ' + p.d2 + ' größer als ' + p.d1 + ' ist.';
          okR = 'Bei gleichem Zähler hat der Bruch mit dem *kleineren* Nenner die größeren Stücke. Also ist {' + p.n + '/' + p.d1 + '} größer.';
          reasons = [['Weil man Brüche mit verschiedenen Nennern gar nicht vergleichen kann.', 'Doch, das geht – gleiche Zähler, also hängt alles von der Stückgröße ab.'], ['Weil ' + p.d2 + ' eine ' + (p.d2 % 2 ? 'ungerade' : 'gerade') + ' Zahl ist.', 'Gerade oder ungerade spielt keine Rolle. Es geht um die Größe der Stücke.']];
          hint = 'Stell dir vor: ein Ganzes in ' + p.d1 + ' Teile oder in ' + p.d2 + ' Teile. Wo sind die Stücke größer?'; break;
        case 'mehr':
          var e = F.expand(s, k);
          claim = N + ' sagt: ' + fq(e) + ' ist mehr als ' + fq(s) + ', weil es mehr Stücke sind.';
          okR = 'Es sind mehr Stücke, aber jedes ist kleiner. ' + fq(e) + ' lässt sich zu ' + fq(s) + ' kürzen – gleich viel.';
          reasons = [['Weil ' + fq(e) + ' weniger ist – kleinere Stücke sind immer weniger.', 'Weniger ist es auch nicht: mehr Stücke, aber kleinere – genau gleich viel.'], ['Weil man Brüche nur mit gleichem Nenner vergleichen darf.', 'Man darf – man muss sie nur gleichnamig machen oder kürzen.']];
          hint = 'Kürze ' + fq(e) + ' vollständig.'; break;
        case 'nuroben':
          claim = N + ' erweitert ' + fq(s) + ' mit ' + k + ' und schreibt: ' + fq(s) + ' = {' + p.a * k + '/' + p.b + '}.';
          okR = 'Beim Erweitern muss auch der Nenner mal ' + k + ': ' + fq(s) + ' = {' + p.a * k + '/' + p.b * k + '}.';
          reasons = [['Weil man immer nur den Nenner erweitern darf.', 'Nein – Zähler *und* Nenner werden mit derselben Zahl mal genommen.'], ['Weil man mit ' + k + ' gar nicht erweitern darf.', 'Mit ' + k + ' darf man erweitern. Es fehlt nur der Nenner.']];
          hint = 'Was passiert beim Erweitern mit dem Nenner?'; break;
        case 'rerw':
          var e2 = F.expand(s, k);
          claim = N + ' schreibt: ' + fq(s) + ' = ' + fq(e2) + '. Zähler und Nenner hat ' + N + ' mit ' + k + ' mal genommen.';
          okR = 'Erweitern mit ' + k + ' ändert den Wert nicht – die Stücke werden nur feiner, dafür sind es mehr.';
          reasons = [['Weil ' + fq(e2) + ' mehr Stücke hat und deshalb mehr ist.', 'Mehr Stücke, aber kleinere – genau gleich viel.'], ['Weil man zu beiden Zahlen ' + k + ' addiert hat.', 'Es wurde mal genommen, nicht addiert. Addieren würde den Wert ändern!']];
          hint = 'Wurden Zähler und Nenner mit derselben Zahl mal genommen?'; break;
        case 'zaehler': case 'rvgl': {
          var f1 = F.make(p.f1[0], p.f1[1]), f2 = F.make(p.f2[0], p.f2[1]), L = F.lcm(f1.d, f2.d), A = f1.n * L / f1.d, B = f2.n * L / f2.d, c = F.cmp(f1, f2);
          if (p.v === 'zaehler') {
            claim = N + ' sagt: ' + fq(f1) + ' ' + sym(sign(f1.n - f2.n)) + ' ' + fq(f2) + ', weil ' + f1.n + ' ' + sym(sign(f1.n - f2.n)) + ' ' + f2.n + ' ist.';
            okR = 'Die Nenner sind verschieden. Gleichnamig: {' + A + '/' + L + '} ' + sym(c) + ' {' + B + '/' + L + '} – also stimmt es nicht.';
            reasons = [['Weil man nur Brüche mit gleichem Zähler vergleichen darf.', 'Das ist keine Regel. Bei verschiedenen Nennern macht man erst gleichnamig.'], ['Weil der Bruch mit dem größeren Nenner immer größer ist.', 'Ein größerer Nenner heißt kleinere Stücke – das ist auch kein Vergleich.']];
            hint = 'Sind die Stücke gleich groß? Mache die Brüche gleichnamig.';
            if (sign(f1.n - f2.n) === c) { claim = N + ' sagt: ' + fq(f1) + ' ' + sym(-c) + ' ' + fq(f2) + ', weil ' + f1.n + ' ' + sym(-c) + ' ' + f2.n + ' ist.'; }
          } else {
            claim = N + ' sagt: ' + fq(f1) + ' ' + sym(c) + ' ' + fq(f2) + ', weil {' + A + '/' + L + '} ' + sym(c) + ' {' + B + '/' + L + '} ist.';
            okR = 'Beide wurden richtig gleichnamig gemacht. Jetzt sind die Stücke gleich groß, und ' + A + ' ' + sym(c) + ' ' + B + '.';
            reasons = [['Weil der Nenner von ' + fq(f2) + ' größer ist.', 'Der Nenner allein entscheidet nicht. Entscheidend: gleichnamig gemacht, dann Zähler verglichen.'], ['Weil man immer nur die Zähler vergleicht.', 'Nur bei gleichen Nennern! Deshalb wurde erst gleichnamig gemacht.']];
            hint = 'Prüfe: Stimmen die erweiterten Brüche?';
          }
          break; }
        case 'addiert':
          claim = N + ' schreibt: ' + fq(s) + ' = {' + (p.a + k) + '/' + (p.b + k) + '}. ' + N + ' hat zu Zähler und Nenner ' + k + ' addiert.';
          okR = 'Addieren ändert den Wert. Beim Erweitern wird *mal* genommen: zum Beispiel ' + fq(s) + ' = {' + p.a * k + '/' + p.b * k + '}.';
          reasons = [['Weil man nur 1 addieren darf.', 'Auch 1 addieren ändert den Wert. Erweitern heißt mal nehmen.'], ['Weil ' + (p.b + k) + ' kein Vielfaches von ' + p.a + ' ist.', 'Das ist nicht der Grund. Der Fehler: Es wurde addiert statt mal genommen.']];
          hint = 'Erweitern heißt …?'; break;
        case 'gleichn': {
          var g1 = F.make(p.f1[0], p.f1[1]), g2 = F.make(p.f2[0], p.f2[1]), L2 = F.lcm(g1.d, g2.d);
          claim = N + ' macht ' + fq(g1) + ' und ' + fq(g2) + ' gleichnamig: {' + g1.n + '/' + L2 + '} und {' + g2.n + '/' + L2 + '}.';
          okR = 'Die Zähler müssen mit erweitert werden: {' + g1.n * L2 / g1.d + '/' + L2 + '} und {' + g2.n * L2 / g2.d + '/' + L2 + '}.';
          reasons = [['Weil ' + L2 + ' kein gemeinsamer Nenner ist.', L2 + ' ist ein gemeinsamer Nenner – der Fehler liegt bei den Zählern.'], ['Weil man die Nenner addieren muss: ' + (g1.d + g2.d) + '.', 'Nenner addieren ergibt keinen gemeinsamen Nenner. Hier fehlen die erweiterten Zähler.']];
          hint = 'Wurden auch die Zähler mal genommen?'; break; }
        default: {
          var big = F.expand(s, 4), mid = F.expand(s, 2);
          claim = N + ' sagt: ' + fq(big) + ' vollständig gekürzt ist ' + fq(mid) + '.';
          okR = mid.n + ' und ' + mid.d + ' sind noch beide durch 2 teilbar. Vollständig gekürzt ist ' + fq(s) + '.';
          reasons = [['Weil man nie durch 2 kürzen darf.', 'Durch 2 darf man kürzen – nur ist man danach noch nicht fertig.'], ['Weil ' + fq(mid) + ' größer ist als ' + fq(big) + '.', fq(mid) + ' und ' + fq(big) + ' sind gleich viel. Es fehlt nur noch ein Kürzungsschritt.']];
          hint = 'Haben ' + mid.n + ' und ' + mid.d + ' noch einen gemeinsamen Teiler?'; }
      }
      var spec = CLAIMS[p.v], corr1 = spec.right ? 'ja' : 'nein';
      var o1 = rot([opt('ja', 'Ja, ' + N + ' hat recht.'), opt('nein', 'Nein, ' + N + ' hat nicht recht.')], p.o2);
      var w1 = {}; w1[spec.right ? 'nein' : 'ja'] = { err: spec.right ? 'gleichwertig' : spec.err, msg: (spec.right ? 'Prüfe noch einmal genau. ' : 'Vorsicht! ') + hint };
      var o2 = rot([opt('ok', okR)].concat(reasons.map(function (r, i) { return opt('b' + i, r[0]); })), p.o);
      var w2 = {}; reasons.forEach(function (r, i) { w2['b' + i] = { err: 'reason', msg: r[1] }; });
      return { prompt: '🔎 ' + claim, answer: { type: 'steps', steps: [
          { label: 'Hat ' + N + ' recht?', answer: { type: 'choice', options: o1, correct: corr1 }, check: function (inp) { return checkChoice(corr1, inp, w1); } },
          { label: 'Erkläre: Warum?', answer: { type: 'choice', options: o2, long: true, correct: 'ok' }, check: function (inp) { return checkChoice('ok', inp, w2); } }] },
        hints: ['Lies die Behauptung genau. Was wurde gerechnet oder verglichen?', hint, 'Rechne selbst nach – mit Kürzen, Erweitern oder gleichnamig machen.', 'Eine gute Begründung sagt, *warum* es (nicht) stimmt – nicht nur das Ergebnis.'],
        solution: [(spec.right ? N + ' hat recht. ' : N + ' hat nicht recht. ') + okR] };
    }
  });

  root.BB.gensK2 = { transformErr: transformErr, cmpWrong: cmpWrong, compareDemo: compareDemo, bars: bars, SIGNS: SIGNS, PAIRS: PAIRS };
})(typeof window !== 'undefined' ? window : globalThis);
