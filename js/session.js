/*
 * session.js — which tasks come next. No DOM.
 *
 *   var s = BB.session.create(progress, { mode: 'heute' | 'ueben' | 'schnell' | 'sach' | 'bild' | 'pruefung' | 'fehler' | 'skill', skill })
 *   s.next()              → task or null when the round is over
 *   s.done(task, result)  → records it, returns { coins, bonus, levelUp, mastered }
 *   s.finish()            → summary incl. coins for the round
 *
 * Adaptive: skills are chosen by need (low mastery, due for review, recent errors), the level per skill
 * follows the learner (progress.js). Heute üben follows the brief: 2 review, 2 visual, 2 conversion,
 * 2 real-world, 1 "Warum?", 1 challenge.
 */
(function (root) {
  'use strict';
  var G = root.BB.gens, M = root.BB.model;

  // skill → [generator, weight, want]
  var BY_SKILL = {
    zn:        [['zn_begriffe', 1]],
    erkennen:  [['erkennen', 2], ['erkennen_wahl', 1]],
    zeichnen:  [['zeichnen', 1]],
    echt:      [['echt_wahl', 2], ['natuerlich', 1]],
    u2g:       [['u2g', 2], ['gemischt_bild', 1]],
    g2u:       [['g2u', 1]],
    division:  [['div_bruch', 2], ['bruch_div', 1], ['div_begriffe', 1], ['div_kontext', 1]],
    verteilen: [['verteilen', 2], ['werkstatt', 1], ['verteilen_liter', 1]],
    einheiten: [['einheit_teilen', 1]],
    liter:     [['jug_mark', 1], ['jug_read', 1], ['umrechnen', 1, 'l']],
    kg:        [['umrechnen', 1, 'kg']],
    km:        [['umrechnen', 1, 'km'], ['umrechnen', 1, 'm']],
    geld:      [['anteil_von', 2], ['umrechnen', 1, '€']],
    zeit:      [['umrechnen', 1, 'h']],
    sach:      [['einkauf', 1], ['menge', 1], ['geschichte', 2]],
    warum:     [['warum', 1]]
  };
  function tagsOf(id) { return G.byId[id].tags; }
  function hasTag(id, tag) { return tagsOf(id).indexOf(tag) >= 0; }
  var HEAVY = { werkstatt: 1, einkauf: 1, einheit_teilen: 1, jug_mark: 1, jug_read: 1, gemischt_bild: 1, div_kontext: 1 };   // not for Schnelltraining

  function create(pr, opts) {
    opts = opts || {};
    var mode = opts.mode || 'ueben', rand = opts.rand || Math.random, R = G.makeR(rand);
    var queue = [], done = [], lastGen = null, coins = 0, bonus = 0, streak = 0, extraWhy = 0, mastered = [], started = Date.now();
    var limit = { heute: 10, ueben: 10, schnell: 8, sach: 6, bild: 6, pruefung: 12, fehler: 8, skill: 8 }[mode] || 10;

    function weighted(items, wfn) {
      var tot = 0, ws = items.map(function (x) { var w = Math.max(0, wfn(x)); tot += w; return w; });
      if (!tot) return items[Math.floor(rand() * items.length)];
      var r = rand() * tot;
      for (var i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
      return items[items.length - 1];
    }
    // choose a generator for a skill, optionally restricted by a filter on generator ids
    function genFor(skill, filter) {
      var list = BY_SKILL[skill].filter(function (x) { return !filter || filter(x[0]); });
      if (!list.length) return null;
      var alt = list.filter(function (x) { return x[0] !== lastGen; });
      return weighted(alt.length ? alt : list, function (x) { return x[1]; });
    }
    function skillsWith(filter) { return Object.keys(BY_SKILL).filter(function (sk) { return BY_SKILL[sk].some(function (x) { return !filter || filter(x[0]); }); }); }
    function task(skill, filter, levelShift) {
      var g = genFor(skill, filter); if (!g) return null;
      var lv = Math.max(1, Math.min(3, pr.level(skill) + (levelShift || 0)));
      if (mode === 'pruefung') lv = Math.max(2, lv);
      var t = G.make(g[0], lv, null, rand, g[2]);
      lastGen = g[0];
      return t;
    }
    function pick(filter, levelShift, pool) {
      var sk = weighted(pool || skillsWith(filter), function (id) { return pr.weight(id); });
      return task(sk, filter, levelShift);
    }

    // ---- build the plan
    if (mode === 'heute') {
      var due = pr.due().sort(function (a, b) { return pr.weight(b) - pr.weight(a); });
      queue.push(function () { return due[0] ? task(due[0]) : pick(); });
      queue.push(function () { return due[1] ? task(due[1]) : pick(); });
      queue.push(function () { return pick(function (g) { return hasTag(g, 'visual'); }); });
      queue.push(function () { return pick(function (g) { return hasTag(g, 'visual'); }); });
      queue.push(function () { return pick(function (g) { return hasTag(g, 'convert'); }); });
      queue.push(function () { return pick(function (g) { return hasTag(g, 'convert'); }); });
      queue.push(function () { return pick(function (g) { return hasTag(g, 'world'); }); });
      queue.push(function () { return pick(function (g) { return hasTag(g, 'world'); }); });
      queue.push(function () { return task('warum'); });
      queue.push(function () {   // challenge: a stronger skill one level up, or a multi-step task
        var seen = Object.keys(BY_SKILL).filter(function (id) { return (pr.doc.skills[id] || {}).n; });
        var strong = seen.sort(function (a, b) { return pr.doc.skills[b].m - pr.doc.skills[a].m; })[0];
        return strong && rand() < 0.5 ? task(strong, null, 1) : pick(function (g) { return hasTag(g, 'challenge') || g === 'einheit_teilen' || g === 'werkstatt'; }, 1);
      });
    } else if (mode === 'pruefung') {
      ['erkennen', 'zeichnen', 'echt_wahl', 'u2g', 'g2u', 'div_bruch', 'verteilen', 'verteilen_liter', 'einheit_teilen', 'umrechnen', 'jug_read', 'warum'].forEach(function (g) {
        queue.push(function () { var sk = G.byId[g].skill; lastGen = g; return G.make(g, Math.max(2, pr.level(sk)), null, rand, g === 'umrechnen' ? R.pick(['kg', 'l', 'km', '€']) : null); });
      });
    } else if (opts.tasks) {     // given tasks: "Fehler verbessern" after Prüfungstraining, or the tasks of a lesson
      opts.tasks.forEach(function (x) { queue.push(function () { var t = G.make(x.gen, x.level || 1, x.params || null, rand, x.want); if (mode === 'fehler') t.fromMistake = true; return t; }); });
      limit = queue.length;
    } else if (mode === 'fehler') {
      var wrong = pr.doc.wrong.slice().reverse().slice(0, 6);
      wrong.forEach(function (w) { queue.push(function () { var t = G.make(w.gen, w.level, w.params); t.fromMistake = true; lastGen = w.gen; return t; }); });
      var gens = wrong.map(function (w) { return w; });
      for (var i = queue.length; i < Math.min(limit, wrong.length * 2); i++) {
        (function (w) { queue.push(function () { lastGen = w.gen; return G.make(w.gen, w.level, null, rand); }); })(gens[i % gens.length]);
      }
      limit = queue.length;
    } else {
      var filter = { schnell: function (g) { return hasTag(g, 'short') && !HEAVY[g]; }, sach: function (g) { return hasTag(g, 'world'); }, bild: function (g) { return hasTag(g, 'visual'); } }[mode] || null;
      for (var k = 0; k < limit; k++) queue.push(mode === 'skill' ? function () { return task(opts.skill, null); } : function () { return pick(filter); });
    }

    var s = {
      mode: mode, limit: limit, started: started,
      get count() { return done.length; },
      next: function () {
        if (!queue.length) return null;
        var f = queue.shift(), t = null;
        for (var tries = 0; tries < 5 && !t; tries++) t = f();
        if (!t) return s.next();
        t.no = done.length + 1;
        s.current = t;
        return t;
      },
      // result: { firstTry, ok, tries, hint, solution, secs, err, corrected }
      done: function (t, r) {
        r.mode = mode;
        var rec = pr.record(t, r), out = { levelUp: rec.levelUp, mastered: false, coins: 0, bonus: 0 };
        out.coins = mode === 'pruefung' ? (r.firstTry && !r.hint ? pr.taskCoins(t, r) : 0) : pr.taskCoins(t, r);
        if (t.fromMistake && r.ok && !r.solution && !r.corrected) { out.coins += 1; }          // a former mistake, now solved
        if (r.firstTry && !r.hint) { streak++; if (streak % 5 === 0) { out.bonus += 1; out.streakBonus = streak; } } else streak = 0;
        if (rec.mastered && pr.claimMastery(t.skill)) { out.bonus += 5; out.mastered = true; mastered.push(t.skill); }
        coins += out.coins; bonus += out.bonus;
        done.push({ t: t, r: r });
        // a "Warum stimmt das?" after a right answer, now and then (not in exam/Schnelltraining)
        if (t.why && r.ok && !r.solution && extraWhy < 1 && mode !== 'pruefung' && mode !== 'schnell' && mode !== 'heute' && mode !== 'fehler' && rand() < 0.35) {
          extraWhy++; queue.unshift(function () { var w = root.BB.why.make(t.why, rand); w.followUp = true; return w; });
        }
        return out;
      },
      finish: function () {
        var n = done.length, first = done.filter(function (d) { return d.r.firstTry && !d.r.hint; }).length;
        var end = 0;
        if (n >= Math.min(5, limit) && mode !== 'lernen') end = { heute: 5, fehler: 4, pruefung: 3 }[mode] || 3;
        var secs = Math.round((Date.now() - started) / 1000);
        var sum = { mode: mode, n: n, first: first, corrected: done.filter(function (d) { return d.r.corrected; }).length,
                    hints: done.filter(function (d) { return d.r.hint; }).length, coins: coins, bonus: bonus + end, endBonus: end, total: coins + bonus + end,
                    secs: secs, mastered: mastered.slice(), startedAt: started, endedAt: Date.now(), done: done };
        pr.addSession({ mode: mode, n: n, first: first, secs: secs, coins: sum.total, ts: started });
        return sum;
      }
    };
    return s;
  }

  root.BB.session = { create: create, BY_SKILL: BY_SKILL, HEAVY: HEAVY };
})(typeof window !== 'undefined' ? window : globalThis);
