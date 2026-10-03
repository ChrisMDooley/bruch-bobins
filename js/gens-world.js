/*
 * gens-world.js — task generators for E (gerecht verteilen) and the real-world quantities:
 * l/ml, kg/g, km/m, m/cm, €/ct, h/min, shopping. CONCRETE → VISUAL → MATHEMATICAL.
 */
(function (root) {
  'use strict';
  var F = root.BB.frac, T = root.BB.text, C = root.BB.ctx, G = root.BB.gens;
  var fm = T.fm, cap = T.cap, reg = G.reg, opt = G.opt, checkFrac = G.checkFrac, checkNum = G.checkNum, checkChoice = G.checkChoice;

  function people(i) { return C.PEOPLE[i]; }
  // "Vier Kinder teilen sich drei Pizzen gerecht."
  function shareSentence(a, b, it, pe) {
    var things = T.countAcc(a, it.g) + ' ' + (a === 1 ? it.sg : it.pl);
    return cap(T.word(b)) + ' ' + pe.pl + ' teilen sich ' + things + ' gerecht.';
  }
  // "3/4 einer Pizza" / "1 1/2 Äpfel" / "2 Pizzen"
  function amountPhrase(v, it) {
    if (F.isWhole(v)) { var w = v.n / v.d; return w + ' ' + (w === 1 ? it.sg : it.pl); }
    if (v.n > v.d) return fm(v, true) + ' ' + it.pl;
    return fm(v) + ' ' + it.gen;
  }

  // ================================================================ E – gerecht verteilen

  function shareParams(level, R, maxItems) {
    var ids = C.ITEM_IDS.filter(function (x) { return x !== 'blatt' || level > 1; });
    var it = R.pick(ids), b, a;
    if (level === 1) { b = R.int(2, 6); a = R.int(1, b - 1); }
    else if (level === 2) { b = R.int(2, 6); a = R.chance(0.5) ? R.int(b + 1, Math.min(maxItems || 9, 2 * b + 1)) : R.int(1, b - 1); }
    else { b = R.int(3, 12); a = R.int(1, Math.min(maxItems || 9, 2 * b)); if (a % b === 0) a += 1; }
    if (a % b === 0) a = Math.max(1, a - 1);
    return { it: it, a: a, b: b, pe: R.int(0, 2) };
  }
  function shareHints(p, it, pe) {
    return ['Wie viele ' + (p.a === 1 ? it.sg : it.pl) + ' werden verteilt?', 'Auf wie viele ' + pe.pl + ' werden sie verteilt?',
            'Schreibe die Aufgabe als Division: ' + p.a + ' : ' + p.b, 'Eine Division kannst du als Bruch schreiben: der Dividend nach oben, der Divisor nach unten.'];
  }
  function shareSolution(p, it, pe) {
    var v = F.make(p.a, p.b);
    var lines = [p.a + ' ' + (p.a === 1 ? it.sg + ' wird' : it.pl + ' werden') + ' auf ' + p.b + ' ' + pe.pl + ' verteilt:  ' + p.a + ' : ' + p.b + ' = ' + fm(v) + (p.a > p.b ? ' = ' + fm(v, true) : '')];
    if (!F.isLowest(v)) lines.push(fm(v) + ' ist dasselbe wie ' + fm(F.reduce(v)) + '.');
    lines.push(cap(pe.eachD) + ' bekommt ' + amountPhrase(v, it) + '.');
    return lines;
  }
  function shareCheck(p, it) {
    var v = F.make(p.a, p.b);
    return function (inp) { return checkFrac({ value: v, whole: 'optional', swapMsg: 'Fast. Überlege noch einmal: Wir *verteilen* ' + p.a + ' ' + (p.a === 1 ? it.sg : it.pl) + ' *auf* ' + p.b + '. Deshalb rechnen wir ' + p.a + ' : ' + p.b + '. Der Dividend wird zum Zähler und der Divisor zum Nenner.',
      detect: [function (f) { return (p.a > p.b && F.eq(f, F.make(p.a % p.b, p.b))) ? { ok: false, err: 'whole', msg: 'Da fehlt etwas: Jeder bekommt zuerst ganze ' + it.pl + '. ' + p.a + ' : ' + p.b + ' = ' + Math.floor(p.a / p.b) + ' Rest ' + p.a % p.b + '.' } : null; },
               function (f) { return F.eq(f, F.make(1, p.b)) && p.a > 1 ? { ok: false, err: 'arith', msg: '{1/' + p.b + '} wäre richtig, wenn nur *ein* Stück verteilt wird. Es sind aber ' + p.a + '.' } : null; }] }, inp); };
  }

  reg({ id: 'verteilen', skill: 'verteilen', tags: ['world', 'short'],
    params: function (level, R) { return shareParams(level, R); },
    build: function (p) {
      var it = C.ITEMS[p.it], pe = people(p.pe);
      return { prompt: shareSentence(p.a, p.b, it, pe), sub: 'Wie viel bekommt ' + pe.each + '?', unitText: it.sg,
        visual: { type: 'items', kind: it.kind, count: p.a },
        answer: { type: 'frac', whole: 'optional', after: p.a < p.b ? it.gen : it.pl, value: F.make(p.a, p.b) },
        check: shareCheck(p, it), hints: shareHints(p, it, pe), solution: shareSolution(p, it, pe),
        solutionVisual: { type: 'share', kind: it.kind, a: p.a, b: p.b }, why: 'div-warum' };
    }
  });

  // The cutting workshop: try different ways of cutting, then write the fraction.
  reg({ id: 'werkstatt', skill: 'verteilen', tags: ['world', 'visual'], levels: [1, 2],
    params: function (level, R) {
      var c = R.pick(level === 1 ? [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [2, 5]] : [[3, 4], [2, 3], [3, 2], [5, 4], [4, 3], [2, 6], [5, 6], [3, 5]]);
      return { it: R.pick(['pizza', 'kuchen', 'pfannkuchen', 'apfel', 'schokolade', 'baguette']), a: c[0], b: c[1], pe: R.int(0, 2) };
    },
    build: function (p) {
      var it = C.ITEMS[p.it], pe = people(p.pe);
      return { prompt: 'Robin braucht Hilfe: ' + shareSentence(p.a, p.b, it, pe), sub: 'Schneide ' + (p.a === 1 ? { m: 'den ', f: 'die ', n: 'das ' }[it.g] + it.sg : 'die ' + it.pl) + ' so, dass es gerecht wird. Probiere verschiedene Arten!',
        answer: { type: 'share', kind: it.kind, a: p.a, b: p.b, item: it, after: p.a < p.b ? it.gen : it.pl, each: pe.each, value: F.make(p.a, p.b) },
        check: shareCheck(p, it),
        hints: ['Tipp: Schneide jedes Stück in ' + p.b + ' Teile – so viele, wie es ' + pe.pl + ' gibt.', 'Oder: Gib jedem erst ein großes Stück (z. B. eine Hälfte) und teile den Rest.', 'Rechnung: ' + p.a + ' : ' + p.b, 'Eine Division kannst du als Bruch schreiben: der Dividend nach oben, der Divisor nach unten.'],
        solution: shareSolution(p, it, pe), solutionVisual: { type: 'share', kind: it.kind, a: p.a, b: p.b }, why: 'methoden' };
    }
  });

  reg({ id: 'div_kontext', skill: 'division', tags: ['world'],
    params: function (level, R) { return shareParams(level, R); },
    build: function (p) {
      var it = C.ITEMS[p.it], pe = people(p.pe), v = F.make(p.a, p.b);
      return { prompt: shareSentence(p.a, p.b, it, pe), sub: 'Schreibe erst die Rechnung, dann den Bruch.', visual: { type: 'items', kind: it.kind, count: p.a },
        answer: { type: 'steps', steps: [
          { label: 'Rechnung:', answer: { type: 'division', a: p.a, b: p.b }, check: function (inp) {
            if (!inp || inp.a == null || inp.b == null) return { incomplete: true, msg: 'Trage beide Zahlen ein.' };
            if (inp.a === p.a && inp.b === p.b) return { ok: true };
            if (inp.a === p.b && inp.b === p.a) return { ok: false, err: 'divrev', msg: 'Andersherum: Die ' + (p.a === 1 ? it.sg : it.pl) + ' werden geteilt – ' + p.a + ' kommt zuerst. ' + p.a + ' wird durch ' + p.b + ' geteilt.' };
            return { ok: false, err: 'arith', msg: 'Was wird verteilt – und auf wie viele?' }; } },
          { label: 'Als Bruch:', answer: { type: 'frac', whole: 'optional', after: p.a < p.b ? it.gen : it.pl, value: v }, check: shareCheck(p, it) } ] },
        hints: shareHints(p, it, pe), solution: shareSolution(p, it, pe), solutionVisual: { type: 'share', kind: it.kind, a: p.a, b: p.b }, why: 'div-warum' };
    }
  });

  // Liquids shared → litres: "6 l Saft auf 8 Personen" → 6/8 l = 3/4 l
  reg({ id: 'verteilen_liter', skill: 'verteilen', tags: ['world', 'short'],
    params: function (level, R) { var b = R.pick([2, 3, 4, 5, 6, 8, 10]); var a = level === 1 ? R.int(1, b - 1) : R.int(1, Math.min(12, 2 * b)); if (a % b === 0) a++; return { a: a, b: b, what: R.pick(['Saft', 'Milch', 'Wasser', 'Tee']) }; },
    build: function (p) {
      var v = F.make(p.a, p.b);
      return { prompt: '[' + p.a + ' l] ' + p.what + (p.a === 1 ? ' wird' : ' werden') + ' gleichmäßig auf [' + p.b + '] Personen verteilt.', sub: 'Wie viele Liter bekommt jede Person?',
        answer: { type: 'frac', whole: 'optional', after: 'l', value: v },
        check: function (inp) { return checkFrac({ value: v, whole: 'optional', swapMsg: 'Vertauscht: ' + p.a + ' l werden *auf* ' + p.b + ' Personen verteilt → ' + p.a + ' : ' + p.b + '.' }, inp); },
        hints: ['Wie viele Liter werden verteilt?', 'Auf wie viele Personen?', 'Rechnung: ' + p.a + ' : ' + p.b, 'Schreibe die Division als Bruch – in Litern.'],
        solution: [p.a + ' l : ' + p.b + ' = ' + fm(v) + ' l' + (p.a > p.b ? ' = ' + fm(v, true) + ' l' : '') + (F.isLowest(v) ? '' : ' = ' + fm(F.reduce(v), true) + ' l'),
                   F.ofInt(v, 1000) !== null ? 'Das sind ' + F.ofInt(v, 1000) + ' ml pro Person.' : ''].filter(Boolean), why: 'div-warum' };
    }
  });

  // ================================================================ Größen

  // Fractions of a big unit that give whole small units.
  function denomsFor(f) { return f === 1000 ? [2, 4, 5, 8, 10, 20, 25] : f === 100 ? [2, 4, 5, 10, 20, 25] : [2, 3, 4, 5, 6, 10, 12, 15, 20]; }
  function unitKeysFor(level) { return level === 1 ? ['kg', 'l', 'km', '€'] : ['kg', 'l', 'km', 'm', '€', 'h']; }

  reg({ id: 'umrechnen', skill: 'kg', tags: ['convert', 'short'],
    params: function (level, R, want) {
      var u = want && C.UNITS[want] ? want : R.pick(unitKeysFor(level)), U = C.UNITS[u];
      if (u === 'kg' && level >= 2 && R.chance(0.3)) return { u: u, pfund: R.pick(['g', 'kg-ganz', 'kg-halb']), k: R.int(2, 10) };
      var d = R.pick(level === 1 ? [2, 4].concat(U.f === 60 ? [] : [10]) : denomsFor(U.f)), n = level === 1 ? (d === 2 ? 1 : R.int(1, d - 1)) : R.int(1, d - 1);
      if (level === 3 && R.chance(0.5)) n += d * R.int(1, 2);
      return { u: u, n: n, d: d, dir: R.pick(level === 1 ? ['down'] : ['down', 'up']) };
    },
    build: function (p) {
      var U = C.UNITS[p.u];
      if (p.pfund) {
        var kgv = F.make(p.k, 2);
        if (p.pfund === 'g') return { skill: 'kg', prompt: '1 Pfund ist ein halbes Kilogramm. Wie viel Gramm sind [' + p.k + ' Pfund]?', answer: { type: 'num', post: 'g', value: p.k * 500 },
          check: function (inp) { return checkNum(p.k * 500, inp, [unitDet(p.k * 500)]); },
          hints: ['1 kg = 1000 g', '1 Pfund = {1/2} kg = 500 g', p.k + ' Pfund = ' + p.k + ' · 500 g', 'Rechne ' + p.k + ' · 500.'], solution: ['1 Pfund = 500 g', p.k + ' Pfund = ' + p.k + ' · 500 g = ' + p.k * 500 + ' g'] };
        return { skill: 'kg', prompt: 'Auf dem Einkaufszettel steht [' + p.k + ' Pfund] Kartoffeln. Wie viel Kilogramm sind das?', answer: { type: 'frac', whole: 'optional', after: 'kg', value: kgv },
          check: function (inp) { return checkFrac({ value: kgv, whole: 'optional', detect: [function (f) { return F.eq(f, F.make(p.k, 1)) ? { ok: false, err: 'unit', msg: 'Ein Pfund ist nur ein *halbes* Kilogramm (500 g).' } : null; }] }, inp); },
          hints: ['Ein Pfund ist ein halbes Kilogramm.', '2 Pfund = 1 kg', p.k + ' Pfund = ' + p.k + ' halbe kg = {' + p.k + '/2} kg', 'Du kannst es auch als ganze oder gemischte Zahl schreiben.'],
          solution: [p.k + ' Pfund = ' + p.k + ' · 500 g = ' + p.k * 500 + ' g = ' + fm(kgv, true) + ' kg'] };
      }
      var v = F.make(p.n, p.d), small = F.ofInt(v, U.f), Nm = T.denomWord(p.d);
      var one = U.f / p.d;
      if (p.dir === 'down') {
        return { skill: U.skill, prompt: fm(v, true) + ' ' + p.u + ' = ? ' + U.small, answer: { type: 'num', post: U.small, value: small },
          check: function (inp) { return checkNum(small, inp, [unitDet(small), function (x) { return x === p.n * 100 && U.f === 1000 || x === p.n * 10 && U.f === 100 ? { ok: false, err: 'unit', msg: 'Achtung: 1 ' + p.u + ' = ' + U.f + ' ' + U.small + '. Rechne zuerst {1/' + p.d + '} ' + p.u + ' = ' + U.f + ' : ' + p.d + '.' } : null; }]); },
          hints: ['Wie viele ' + U.smallW + ' hat 1 ' + U.bigW.replace(/n$/, '').replace(/Stunde$/, 'Stunde') + '?', '1 ' + p.u + ' = ' + U.f + ' ' + U.small + '. Ein ' + Nm.replace(/^Halbe$/, 'Halbes') + ' davon: ' + U.f + ' : ' + p.d + ' = ' + one + ' ' + U.small + '.',
                  fm(v) + ' sind ' + p.n + ' solche Teile.', p.n + ' · ' + one + ' = ?'],
          solution: ['1 ' + p.u + ' = ' + U.f + ' ' + U.small, '{1/' + p.d + '} ' + p.u + ' = ' + U.f + ' : ' + p.d + ' = ' + one + ' ' + U.small].concat(p.n === 1 ? [] : [fm(v, true) + ' ' + p.u + ' = ' + p.n + ' · ' + one + ' ' + U.small + ' = ' + small + ' ' + U.small]) };
      }
      return { skill: U.skill, prompt: small + ' ' + U.small + ' = ? ' + p.u, sub: 'Schreibe als Bruch' + (v.n > v.d ? ' oder gemischte Zahl' : '') + '.', answer: { type: 'frac', whole: 'optional', after: p.u, value: v },
        check: function (inp) { return checkFrac({ value: v, whole: 'optional', detect: [function (f) { return F.eq(f, F.make(small, 100)) && U.f !== 100 ? { ok: false, err: 'unit', msg: '1 ' + p.u + ' hat ' + U.f + ' ' + U.small + ', nicht 100.' } : null; }] }, inp); },
        hints: ['1 ' + p.u + ' = ' + U.f + ' ' + U.small + '.', small + ' ' + U.small + ' von ' + U.f + ' ' + U.small + ' – das ist der Bruch {' + small + '/' + U.f + '} ' + p.u + '.', 'Wie oft passt ' + small + ' in ' + U.f + '? Nutze bekannte Teile: ' + one + ' ' + U.small + ' = {1/' + p.d + '} ' + p.u + '.', small + ' : ' + one + ' = ' + (small / one) + ' → ' + (small / one) + ' ' + Nm + '.'],
        solution: ['{1/' + p.d + '} ' + p.u + ' = ' + one + ' ' + U.small, small + ' ' + U.small + ' = ' + (small / one) + ' · ' + one + ' ' + U.small + ' = ' + fm(v, true) + ' ' + p.u] };
    }
  });
  function unitDet(right) {
    return function (x) {
      if (x === right * 10 || x * 10 === right || x === right * 100 || x * 100 === right) return { ok: false, err: 'unit', msg: 'Die Ziffern stimmen fast – aber eine Null zu viel oder zu wenig. Prüfe die Umrechnung (1 kg = 1000 g, 1 € = 100 ct …).' };
      return null;
    };
  }

  // "3 kg : 4" — first into the smaller unit, then divide, then back as a fraction.
  function splitOK(u, Q, k) {
    var U = C.UNITS[u], s = Q * U.f;
    if (s % k) return false;
    var part = s / k;
    if (part < (u === 'h' ? 5 : u === '€' ? 5 : u === 'm' ? 5 : 20)) return false;
    return true;
  }
  reg({ id: 'einheit_teilen', skill: 'einheiten', tags: ['world', 'convert'],
    params: function (level, R) {
      for (var t = 0; t < 200; t++) {
        var u = R.pick(unitKeysFor(level)), Q = R.int(1, level === 1 ? 3 : 6), k = R.pick(level === 1 ? [2, 4, 5, 10] : level === 2 ? [3, 4, 5, 6, 8, 10, 20, 25] : [6, 8, 12, 15, 16, 20, 24, 40]);
        if (Q % k === 0 || !splitOK(u, Q, k)) continue;
        if (level === 1 && F.make(Q, k).n > F.make(Q, k).d) continue;
        return { u: u, Q: Q, k: k, story: level === 1 ? -1 : R.int(0, C.SPLITS[u].length - 1) };
      }
      return { u: 'kg', Q: 3, k: 4, story: -1 };
    },
    build: function (p) {
      var U = C.UNITS[p.u], s = p.Q * U.f, part = s / p.k, v = F.make(p.Q, p.k);
      var Qs = p.u === '€' ? p.Q + ' €' : p.Q + ' ' + p.u, st = p.story >= 0 ? C.SPLITS[p.u][p.story] : null;
      var prompt = st ? st.t.replace('{Q}', Qs).replace('{k}', p.k) : 'Berechne [' + Qs + ' : ' + p.k + '].';
      var easier = 'In ' + U.smallDat + ' geht es leichter: ' + s + ' : ' + p.k + ' geht ohne Rest.';
      return { skill: 'einheiten', prompt: prompt, sub: st ? st.ask : 'Wandle zuerst in eine kleinere Einheit um.',
        answer: { type: 'steps', steps: [
          { label: Qs + ' = ? ' + U.small, answer: { type: 'num', post: U.small, value: s }, check: function (inp) {
            var r = checkNum(s, inp, [unitDet(s)]);
            if (r.ok === false && r.err === 'arith') { r.err = 'unit'; r.msg = 'Denk an die Umrechnung: 1 ' + p.u + ' = ' + U.f + ' ' + U.small + '. Also ' + p.Q + ' · ' + U.f + '.'; }
            return r; } },
          { label: s + ' ' + U.small + ' : ' + p.k + ' = ? ' + U.small, answer: { type: 'num', post: U.small, value: part }, check: function (inp) { return checkNum(part, inp, [unitDet(part)]); } },
          { label: part + ' ' + U.small + ' = ? ' + p.u + '  (als Bruch)', answer: { type: 'frac', whole: 'optional', after: p.u, value: v },
            check: function (inp) { return checkFrac({ value: v, whole: 'optional', swapMsg: 'Vertauscht: ' + Qs + ' werden *durch* ' + p.k + ' geteilt → ' + p.Q + ' : ' + p.k + ' = {' + p.Q + '/' + p.k + '}.',
              detect: [function (f) { return F.eq(f, F.make(part, 1)) ? { ok: false, err: 'unitval', msg: part + ' ist in ' + U.small + '. Gefragt ist der Anteil von 1 ' + p.u + '.' } : null; }] }, inp); } } ] },
        hints: ['Wie viele ' + U.smallW + ' sind ' + Qs + '? (1 ' + p.u + ' = ' + U.f + ' ' + U.small + ')', easier, 'Teile jetzt: ' + s + ' : ' + p.k + '.', 'Als Bruch: ' + Qs + ' : ' + p.k + ' = {' + p.Q + '/' + p.k + '} ' + p.u + '. Das ist dasselbe wie ' + part + ' ' + U.small + '.'],
        solution: [Qs + ' = ' + s + ' ' + U.small, s + ' ' + U.small + ' : ' + p.k + ' = ' + part + ' ' + U.small, part + ' ' + U.small + ' = ' + fm(v) + ' ' + p.u + (F.isLowest(v) ? '' : ' = ' + fm(F.reduce(v)) + ' ' + p.u) + (v.n > v.d ? ' = ' + fm(F.reduce(v), true) + ' ' + p.u : ''), easier], why: 'einheit-warum' };
    }
  });

  // ---------------------------------------------------------------- Messbecher
  var JUG_TARGETS = {
    1: [[1, 2], [1, 4], [3, 4], [1, 10], [3, 10], [7, 10], [1, 5]],
    2: [[1, 4], [3, 4], [2, 5], [3, 5], [1, 5], [4, 5], [9, 10], [1, 20], [3, 20]],
    3: [[5, 4], [3, 2], [7, 4], [6, 5], [13, 10], [9, 5]]
  };
  function jugParams(level, R) {
    var f = R.pick(JUG_TARGETS[level]), ml = F.ofInt(F.make(f[0], f[1]), 1000);
    return { n: f[0], d: f[1], ml: ml, max: level === 3 ? 2000 : 1000, step: level === 1 ? 100 : 50, as: R.pick(level === 1 ? ['frac', 'ml'] : ['frac', 'ml', 'ml']) };
  }
  reg({ id: 'jug_mark', skill: 'liter', tags: ['visual'],
    params: jugParams,
    build: function (p) {
      var v = F.make(p.n, p.d), lab = p.as === 'ml' ? '[' + p.ml + ' ml]' : '[' + fm(v, true) + ' l]';
      return { prompt: 'Fülle den Messbecher bis ' + lab + '.', sub: 'Ziehe den Wasserstand an die richtige Stelle.',
        answer: { type: 'jug', max: p.max, step: p.step, target: p.ml },
        check: function (inp) {
          if (!inp || inp.ml == null || inp.ml === 0) return { incomplete: true, msg: 'Ziehe das Wasser nach oben.' };
          if (inp.ml === p.ml) return { ok: true };
          if (p.as === 'frac' && (inp.ml === p.n * 100 || inp.ml === p.n * 10)) return { ok: false, err: 'unit', msg: fm(v) + ' l sind nicht ' + inp.ml + ' ml. 1 l = 1000 ml → {1/' + p.d + '} l = ' + 1000 / p.d + ' ml.' };
          return { ok: false, err: 'arith', msg: 'Du hast ' + inp.ml + ' ml eingefüllt. Gesucht ' + (p.as === 'ml' ? 'sind ' + p.ml + ' ml.' : 'ist ' + fm(v, true) + ' l.') + ' Schau auf die Striche.' };
        },
        hints: ['1 l = 1000 ml', p.as === 'frac' ? '{1/' + p.d + '} l = 1000 ml : ' + p.d + ' = ' + 1000 / p.d + ' ml' : 'Jeder kleine Strich sind ' + p.step + ' ml.', p.as === 'frac' ? fm(v) + ' l = ' + p.n + ' · ' + 1000 / p.d + ' ml' : 'Zähle von unten die Striche.', 'Das sind ' + p.ml + ' ml.'],
        solution: [p.as === 'frac' ? fm(v, true) + ' l = ' + p.ml + ' ml' : p.ml + ' ml = ' + fm(v, true) + ' l'], solutionVisual: { type: 'jug', max: p.max, step: p.step, fill: p.ml } };
    }
  });
  reg({ id: 'jug_read', skill: 'liter', tags: ['visual', 'convert'],
    params: jugParams,
    build: function (p) {
      var v = F.make(p.n, p.d);
      return { prompt: 'Wie viel ist im Messbecher?', visual: { type: 'jug', max: p.max, step: p.step, fill: p.ml },
        answer: { type: 'steps', steps: [
          { label: 'In Millilitern:', answer: { type: 'num', post: 'ml', value: p.ml }, check: function (inp) { return checkNum(p.ml, inp, [unitDet(p.ml)]); } },
          { label: 'In Litern (als Bruch):', answer: { type: 'frac', whole: 'optional', after: 'l', value: v }, check: function (inp) { return checkFrac({ value: v, whole: 'optional', detect: [function (f) { return F.eq(f, F.make(p.ml, 100)) ? { ok: false, err: 'unit', msg: '1 l hat 1000 ml, nicht 100.' } : null; }] }, inp); } } ] },
        hints: ['Wie viel ml ist ein kleiner Strich? Schau auf die Beschriftung.', 'Zähle die Striche bis zum Wasserstand.', '1 l = 1000 ml', p.ml + ' ml von 1000 ml – welcher Bruch ist das?'],
        solution: [p.ml + ' ml = ' + fm(v, true) + ' l', '{1/' + p.d + '} l = ' + 1000 / p.d + ' ml'] };
    }
  });

  // ---------------------------------------------------------------- Geld
  reg({ id: 'anteil_von', skill: 'geld', tags: ['world', 'short'],
    params: function (level, R) {
      for (var t = 0; t < 100; t++) {
        var d = R.pick([2, 3, 4, 5, 10]), n = level === 1 ? 1 : R.int(1, d - 1), tot;
        if (level === 3) { tot = R.pick([5, 6, 7, 9, 10, 15, 25]) * 100; }
        else tot = d * R.int(1, 8) * 100;
        if ((tot * n) % d) continue;
        if (level < 3 && (tot / d) % 100) continue;
        return { n: n, d: d, ct: tot, ctx: R.int(0, 3) };
      }
      return { n: 3, d: 4, ct: 1200, ctx: 0 };
    },
    build: function (p) {
      var v = F.make(p.n, p.d), res = p.ct * p.n / p.d, euro = p.ct / 100;
      var ctx = ['', 'Lea hat ' + T.euro(p.ct) + ' gespart. Sie gibt ' + fm(v) + ' davon für ein Buch aus. ', 'Ein Spiel kostet ' + T.euro(p.ct) + '. Im Angebot zahlt man nur ' + fm(v) + ' des Preises. ', 'Tom bekommt ' + T.euro(p.ct) + ' Taschengeld. ' + cap(T.fracWords(p.n, p.d)) + ' davon spart er. '][p.ctx];
      var q = ctx ? ctx + 'Wie viel Euro sind das?' : 'Wie viel sind ' + fm(v) + ' von [' + T.euro(p.ct) + ']?';
      var oneP = p.ct / p.d;
      return { prompt: q, answer: { type: 'money', value: res },
        check: function (inp) {
          if (!inp || inp.ct == null) return { incomplete: true, msg: 'Trage einen Betrag ein, z. B. 2,50.' };
          if (inp.ct === res) return { ok: true };
          if (inp.ct === oneP && p.n > 1) return { ok: false, err: 'arith', msg: 'Das ist {1/' + p.d + '}. Für ' + fm(v) + ' brauchst du ' + p.n + '-mal so viel.' };
          if (inp.ct * 100 === res || inp.ct === res * 100) return { ok: false, err: 'unit', msg: 'Achte auf Euro und Cent: 1 € = 100 ct. Schreibe Cent nach dem Komma.' };
          return { ok: false, err: 'arith', msg: 'Rechne erst {1/' + p.d + '}: ' + T.euro(p.ct) + ' : ' + p.d + '.' };
        },
        hints: ['Teile zuerst durch den Nenner: ' + T.euro(p.ct) + ' : ' + p.d + '.', (p.ct % p.d === 0 && (p.ct / p.d) % 100 ? 'Tipp: In Cent geht es leichter: ' + p.ct + ' ct : ' + p.d + '.' : '{1/' + p.d + '} von ' + T.euro(p.ct) + ' = ' + T.euro(oneP)), fm(v) + ' ist ' + p.n + '-mal so viel wie {1/' + p.d + '}.', p.n + ' · ' + T.euro(oneP) + ' = ?'],
        solution: ['{1/' + p.d + '} von ' + T.euro(p.ct) + ' = ' + (oneP % 100 ? p.ct + ' ct : ' + p.d : T.euro(p.ct) + ' : ' + p.d) + ' = ' + T.euro(oneP)].concat(p.n === 1 ? [] : [fm(v) + ' = ' + p.n + ' · ' + T.euro(oneP) + ' = ' + T.euro(res)]) };
    }
  });

  // Shopping: big pack vs small packs (always whole numbers of small packs, prices in cents).
  var PACKS = [
    { what: 'Nudeln',      small: '500 g',     sv: 'kosten', big: 'die Familienpackung mit 2,5 kg', k: 5, p: [89, 99, 109, 119], dis: [0.7, 0.85, 1.05] },
    { what: 'Hundefutter', small: '1 Dose',    sv: 'kostet', big: 'das Paket mit 6 Dosen',          k: 6, p: [45, 49, 55, 59], dis: [0.8, 0.9, 1.1] },
    { what: 'Kartoffeln',  small: '1 kg',      sv: 'kostet', big: 'das Netz mit 5 kg',              k: 5, p: [89, 99, 119], dis: [0.7, 0.8, 0.95] },
    { what: 'Erdnüsse',    small: '250 g',     sv: 'kosten', big: 'die Tüte mit 1 kg',              k: 4, p: [99, 119, 129], dis: [0.75, 0.9, 1.1] },
    { what: 'Saft',        small: '1 l',       sv: 'kostet', big: 'die Kiste mit 6 l',              k: 6, p: [119, 129, 149], dis: [0.8, 0.9] },
    { what: 'Joghurt',     small: '1 Becher',  sv: 'kostet', big: 'der 4er-Pack',                   k: 4, p: [39, 45, 49, 55], dis: [0.8, 0.9, 1.1] }
  ];
  reg({ id: 'einkauf', skill: 'geld', tags: ['world', 'challenge'],
    params: function (level, R) {
      var i = R.int(0, PACKS.length - 1), P = PACKS[i], p = R.pick(P.p), big = Math.round(p * P.k * R.pick(P.dis) / 10) * 10 - 1;
      if (big === p * P.k) big -= 10;
      return { i: i, p: p, big: big };
    },
    build: function (p) {
      var P = PACKS[p.i], smallSum = p.p * P.k, bigCheaper = p.big < smallSum, save = Math.abs(smallSum - p.big);
      var o1 = opt('gross', cap(P.big)), o2 = opt('klein', P.k + '-mal ' + P.small + ' einzeln');
      return { skill: 'sach', prompt: 'Im Supermarkt: ' + P.what + ' – [' + P.small + '] ' + P.sv + ' ' + T.euro(p.p) + ', ' + P.big + ' kostet ' + T.euro(p.big) + '.',
        sub: 'In der großen Packung ist so viel wie in ' + P.k + ' kleinen.',
        answer: { type: 'steps', steps: [
          { label: P.k + '-mal ' + P.small + ' kosten zusammen:', answer: { type: 'money', value: smallSum }, check: function (inp) { return moneyCheck(smallSum, inp, P.k + ' · ' + T.euro(p.p)); } },
          { label: 'Was ist günstiger?', answer: { type: 'choice', options: [o1, o2], correct: bigCheaper ? 'gross' : 'klein' }, check: function (inp) { return checkChoice(bigCheaper ? 'gross' : 'klein', inp, bigCheaper ? { klein: { err: 'arith', msg: 'Vergleiche: ' + T.euro(smallSum) + ' für die kleinen, ' + T.euro(p.big) + ' für die große Packung.' } } : { gross: { err: 'arith', msg: 'Nicht immer ist groß billiger! ' + T.euro(smallSum) + ' < ' + T.euro(p.big) + '.' } }); } },
          { label: 'Wie viel spart man?', answer: { type: 'money', value: save }, check: function (inp) { return moneyCheck(save, inp, (bigCheaper ? T.euro(smallSum) + ' − ' + T.euro(p.big) : T.euro(p.big) + ' − ' + T.euro(smallSum))); } } ] },
        hints: ['Für den Vergleich braucht man gleich viel Ware: ' + P.k + '-mal ' + P.small + ' = ' + P.big.replace(/^(die|das|der) /, '') + '.', 'Rechne ' + P.k + ' · ' + T.euro(p.p) + '. Tipp: in Cent rechnen: ' + P.k + ' · ' + p.p + ' ct.', 'Vergleiche die beiden Preise.', 'Die Ersparnis ist der Unterschied: großer Preis minus kleiner Preis.'],
        solution: [P.k + ' · ' + T.euro(p.p) + ' = ' + T.euro(smallSum), (bigCheaper ? cap(P.big) + ' (' + T.euro(p.big) + ') ist günstiger.' : 'Einzeln ist es günstiger – nicht immer ist groß billiger!'), 'Ersparnis: ' + T.euro(save)] };
    }
  });
  function moneyCheck(ct, inp, how) {
    if (!inp || inp.ct == null) return { incomplete: true, msg: 'Trage einen Betrag ein, z. B. 2,45.' };
    if (inp.ct === ct) return { ok: true };
    if (inp.ct * 100 === ct || inp.ct === ct * 100) return { ok: false, err: 'unit', msg: 'Achte auf Euro und Cent: Schreibe z. B. ' + T.euro(ct).replace(' €', '') + ' für ' + T.euro(ct) + '.' };
    return { ok: false, err: 'arith', msg: 'Rechne noch einmal: ' + how + '.' };
  }

  // How many packs for a fraction amount? "4 1/2 kg Nudeln in 500-g-Packungen" → 9
  reg({ id: 'menge', skill: 'sach', tags: ['world', 'convert'],
    params: function (level, R) {
      var c = R.pick([{ u: 'kg', pk: 500, f: 1000, what: 'Nudeln', unitS: 'g' }, { u: 'kg', pk: 250, f: 1000, what: 'Erdnüsse', unitS: 'g' }, { u: 'l', pk: 250, f: 1000, what: 'Saft', unitS: 'ml', glass: true }, { u: 'l', pk: 200, f: 1000, what: 'Milch', unitS: 'ml', glass: true }, { u: 'kg', pk: 125, f: 1000, what: 'Butter', unitS: 'g' }]);
      var fr = R.pick(level === 1 ? [[1, 2], [3, 4], [1, 1], [2, 1]] : [[9, 2], [7, 4], [3, 2], [5, 4], [5, 2], [3, 4], [2, 5]]);
      var amount = F.ofInt(F.make(fr[0], fr[1]), c.f);
      if (amount % c.pk) { fr = [3, 2]; amount = 1500; if (amount % c.pk) { fr = [1, 1]; amount = 1000; } }
      return { c: c, n: fr[0], d: fr[1] };
    },
    build: function (p) {
      var c = p.c, v = F.make(p.n, p.d), amount = F.ofInt(v, c.f), k = amount / c.pk;
      var cont = c.glass ? 'Gläser mit je ' + c.pk + ' ml' : 'Packungen mit je ' + c.pk + ' g';
      return { skill: 'sach', prompt: c.glass ? 'Für ein Fest gibt es [' + fm(v, true) + ' ' + c.u + '] ' + c.what + '.' : 'Für ein Rezept braucht man [' + fm(v, true) + ' ' + c.u + '] ' + c.what + '.', sub: c.glass ? 'Wie viele ' + cont + ' kann man damit füllen?' : 'Wie viele ' + cont + ' braucht man?',
        answer: { type: 'num', post: c.glass ? 'Gläser' : 'Packungen', value: k },
        check: function (inp) { return checkNum(k, inp, [function (x) { return x * c.pk * 10 === amount || x * c.pk === amount * 10 ? { ok: false, err: 'unit', msg: 'Rechne zuerst in ' + c.unitS + ' um: ' + fm(v, true) + ' ' + c.u + ' = ' + amount + ' ' + c.unitS + '.' } : null; }]); },
        hints: ['Wandle in ' + c.unitS + ' um: 1 ' + c.u + ' = 1000 ' + c.unitS + '.', fm(v, true) + ' ' + c.u + ' = ' + amount + ' ' + c.unitS + '.', 'Wie oft passt ' + c.pk + ' in ' + amount + '?', amount + ' : ' + c.pk + ' = ?'],
        solution: [fm(v, true) + ' ' + c.u + ' = ' + amount + ' ' + c.unitS, amount + ' ' + c.unitS + ' : ' + c.pk + ' ' + c.unitS + ' = ' + k] };
    }
  });

  // Mixed real-life stories (Robin, recipes, walks, time).
  var STORIES = [
    function (R) { var d = R.pick([4, 5, 8, 10]), n = R.int(1, d - 1); return { skill: 'kg', q: 'Robin bekommt jeden Tag [' + T.fm(F.make(n, d)) + ' kg] Futter. Wie viel Gramm sind das?', post: 'g', ans: F.ofInt(F.make(n, d), 1000), sol: [T.fm(F.make(n, d)) + ' kg = ' + (n === 1 ? '' : n + ' · ' + 1000 / d + ' g = ') + F.ofInt(F.make(n, d), 1000) + ' g'], h: ['1 kg = 1000 g', '{1/' + d + '} kg = 1000 g : ' + d + ' = ' + 1000 / d + ' g', n + ' · ' + 1000 / d + ' g'] }; },
    function (R) { var day = R.pick([200, 250, 300, 500]), kg = R.pick([2, 3, 4, 6]); if ((kg * 1000) % day) { day = 250; } return { skill: 'sach', q: 'Robin frisst jeden Tag [' + day + ' g]. Wie viele Tage reicht ein Sack mit [' + kg + ' kg]?', post: 'Tage', ans: kg * 1000 / day, sol: [kg + ' kg = ' + kg * 1000 + ' g', kg * 1000 + ' g : ' + day + ' g = ' + kg * 1000 / day], h: ['Wandle die kg in g um.', kg + ' kg = ' + kg * 1000 + ' g', 'Wie oft passt ' + day + ' in ' + kg * 1000 + '?'] }; },
    function (R) { var f = R.pick([[1, 2], [3, 4], [1, 4], [2, 5]]), v = F.make(f[0], f[1]); return { skill: 'liter', q: 'Für Pfannkuchen braucht man [' + T.fm(v) + ' l] Milch. Wie viele Milliliter sind das?', post: 'ml', ans: F.ofInt(v, 1000), sol: [T.fm(v) + ' l = ' + F.ofInt(v, 1000) + ' ml'], h: ['1 l = 1000 ml', '{1/' + f[1] + '} l = ' + 1000 / f[1] + ' ml', f[0] + ' · ' + 1000 / f[1] + ' ml'] }; },
    function (R) { var f = R.pick([[3, 2], [5, 4], [7, 4], [5, 2], [9, 4]]), v = F.make(f[0], f[1]); return { skill: 'km', q: 'Lukas geht mit Robin [' + T.fm(v, true) + ' km] spazieren. Wie viele Meter sind das?', post: 'm', ans: F.ofInt(v, 1000), sol: [T.fm(v, true) + ' km = ' + F.ofInt(v, 1000) + ' m'], h: ['1 km = 1000 m', 'Die Ganzen: ' + Math.floor(f[0] / f[1]) + ' km = ' + Math.floor(f[0] / f[1]) * 1000 + ' m', 'Der Rest: {' + f[0] % f[1] + '/' + f[1] + '} km = ' + F.ofInt(F.make(f[0] % f[1], f[1]), 1000) + ' m'] }; },
    function (R) { var f = R.pick([[3, 4], [1, 2], [1, 4], [5, 4], [3, 2], [7, 4], [4, 3], [1, 3]]), v = F.make(f[0], f[1]); return { skill: 'zeit', q: 'Ein Film dauert [' + T.fm(v, true) + ' h]. Wie viele Minuten sind das?', post: 'min', ans: F.ofInt(v, 60), sol: ['1 h = 60 min', T.fm(v, true) + ' h = ' + F.ofInt(v, 60) + ' min'], h: ['1 h = 60 min', '{1/' + f[1] + '} h = 60 : ' + f[1] + ' = ' + 60 / f[1] + ' min', f[0] + ' · ' + 60 / f[1] + ' min'] }; },
    function (R) { var g = R.pick([250, 200, 125]), tot = R.pick([[3, 4], [1, 2], [3, 2]]), v = F.make(tot[0], tot[1]), ml = F.ofInt(v, 1000); if (ml % g) { g = 250; } return { skill: 'liter', q: 'Eine Flasche enthält [' + T.fm(v, true) + ' l] Saft. Wie viele Gläser mit je [' + g + ' ml] kann man füllen?', post: 'Gläser', ans: ml / g, sol: [T.fm(v, true) + ' l = ' + ml + ' ml', ml + ' ml : ' + g + ' ml = ' + ml / g], h: ['Wandle in ml um: 1 l = 1000 ml', T.fm(v, true) + ' l = ' + ml + ' ml', 'Wie oft passt ' + g + ' in ' + ml + '?'] }; }
  ];
  reg({ id: 'geschichte', skill: 'sach', tags: ['world', 'short'],
    params: function (level, R) { return { s: R.int(0, STORIES.length - 1), seed: R.int(1, 1e6) }; },
    build: function (p) {
      var st = STORIES[p.s](G.makeR(mulberry(p.seed)));
      return { skill: st.skill, prompt: st.q, answer: { type: 'num', post: st.post, value: st.ans },
        check: function (inp) { return checkNum(st.ans, inp, [unitDet(st.ans)]); },
        hints: st.h.concat(['Schreibe nur die Zahl, die Einheit steht schon da.']).slice(0, 4), solution: st.sol };
    }
  });
  // small seeded PRNG so stories rebuild exactly
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  root.BB.gensWorld = { STORIES: STORIES, PACKS: PACKS, JUG_TARGETS: JUG_TARGETS, splitOK: splitOK, mulberry: mulberry, amountPhrase: amountPhrase };
})(typeof window !== 'undefined' ? window : globalThis);
