// Every generator, every level, many times: the task is well-formed, the right answer is accepted,
// wrong answers are not, the text has no broken markup, the 4 hints and a solution are there.
// Run: node tests/gens.test.js [--show]
const load = require('./load');
const W = load(), BB = W.BB, F = BB.frac, G = BB.gens;
let pass = 0, fail = 0; const fails = {};
function ok(c, msg, info) { if (c) pass++; else { fail++; fails[msg] = (fails[msg] || 0) + 1; if (fails[msg] <= 3) console.log('FAIL', msg, info !== undefined ? JSON.stringify(info).slice(0, 400) : ''); } }

// ---- frac.js
ok(F.eq(F.make(2, 4), F.make(1, 2)) && F.eq(F.make(3, 6), F.make(1, 2)), 'equivalent fractions equal');
ok(!F.eq(F.make(2, 3), F.make(3, 4)), 'different fractions differ');
const m = F.toMixed(F.make(9, 4)); ok(m.w === 2 && m.n === 1 && m.d === 4, '9/4 = 2 1/4');
ok(F.eq(F.fromMixed(3, 3, 4), F.make(15, 4)), '3 3/4 = 15/4');
ok(F.ofInt(F.make(3, 4), 1000) === 750 && F.ofInt(F.make(1, 3), 1000) === null, '3/4 of 1000');
ok(F.str(F.reduce(F.make(6, 8))) === '3/4', 'reduce 6/8');
ok(F.parse('2 1/4') && F.eq(F.parse('2 1/4'), F.make(9, 4)) && F.parse('3 / 0') === null, 'parse');
ok(BB.text.fracWords(3, 4) === 'drei Viertel' && BB.text.fracWords(1, 2) === 'ein halb' && BB.text.fracWords(7, 20) === 'sieben Zwanzigstel' && BB.text.denomWord(21) === 'Einundzwanzigstel' && BB.text.denomWord(100) === 'Hundertstel', 'German fraction words');
ok(BB.text.say('{3/4} kg = 750 g') === 'drei Viertel Kilogramm = 750 Gramm', 'speech text', BB.text.say('{3/4} kg = 750 g'));
ok(BB.text.say('3 : 4') === '3 geteilt durch 4', 'speech division');

// ---- correct input for an answer spec
function keyInput(a) {
  switch (a.type) {
    case 'frac': case 'share': {
      const v = a.value;
      if (a.whole === 'required' && v.n >= v.d) { const mm = F.toMixed(v); return mm.n ? { w: mm.w, n: mm.n, d: mm.d } : { w: mm.w, n: null, d: null }; }
      return { w: null, n: v.n, d: v.d };
    }
    case 'num': return { x: a.value };
    case 'money': return { ct: a.value };
    case 'division': return { a: a.a, b: a.b };
    case 'choice': return Array.isArray(a.correct) ? { ids: a.correct.slice() } : { id: a.correct };
    case 'shade': return { count: a.need };
    case 'jug': return { ml: a.target };
  }
  throw new Error('no key for ' + a.type);
}
function wrongInput(a) {
  switch (a.type) {
    case 'frac': case 'share': { const k = keyInput(a); return Object.assign({}, k, k.n != null ? { n: k.n + 1 } : { w: k.w + 1 }); }
    case 'num': return { x: a.value + 1 };
    case 'money': return { ct: a.value + 10 };
    case 'division': return { a: a.a + 1, b: a.b };
    case 'choice': { if (Array.isArray(a.correct)) return { ids: a.correct.slice(1) }; const o = a.options.find(x => x.id !== a.correct); return { id: o.id }; }
    case 'shade': return { count: a.need + 1 };
    case 'jug': return { ml: a.target + 50 };
  }
}
function texts(t) {
  const out = [t.prompt, t.sub || ''].concat(t.hints || [], t.solution || []);
  if (t.answer.options) t.answer.options.forEach(o => out.push(o.label || ''));
  (t.answer.steps || []).forEach(s => { out.push(s.label); (s.answer.options || []).forEach(o => out.push(o.label)); });
  return out;
}
function markupOK(s) {
  if (/undefined|NaN|null|\[object/.test(s)) return false;
  const c = ch => (s.match(new RegExp('\\' + ch, 'g')) || []).length;
  if (c('{') !== c('}') || c('[') !== c(']') || c('*') % 2) return false;
  if (/\{\d+\/0\}/.test(s)) return false;
  return true;
}

const N = +(process.argv.find(a => /^--n=/.test(a)) || '--n=400').slice(4);
const show = process.argv.includes('--show');
G.list.forEach(g => {
  g.levels.forEach(level => {
    for (let i = 0; i < N; i++) {
      let t; try { t = G.make(g.id, level); } catch (e) { ok(false, g.id + ' L' + level + ' builds', e.message); continue; }
      if (show && i < 2) console.log('\n[' + g.id + ' L' + level + '] ' + BB.text.plain(t.prompt) + (t.sub ? ' | ' + BB.text.plain(t.sub) : '') + '\n   Lösung: ' + (t.solution || []).map(BB.text.plain).join(' / '));
      ok(BB.model.skill(t.skill), g.id + ' has a known skill', t.skill);
      ok(t.hints && t.hints.length === 4 && t.hints.every(h => h && h.length > 3), g.id + ' L' + level + ' has 4 hints', t.hints);
      ok(t.solution && t.solution.length > 0, g.id + ' has a solution');
      texts(t).forEach(s => ok(markupOK(String(s)), g.id + ' L' + level + ' text ok', s));
      ok(BB.text.say(t.prompt).indexOf('{') < 0, g.id + ' speech has no markup', BB.text.say(t.prompt));
      // rebuild from params gives the same task
      const t2 = G.make(g.id, level, JSON.parse(JSON.stringify(t.params)));
      ok(t2.prompt === t.prompt, g.id + ' rebuilds from params');
      if (t.answer.type === 'steps') {
        t.answer.steps.forEach((s, si) => {
          const r = s.check(keyInput(s.answer)); ok(r.ok === true, g.id + ' L' + level + ' step ' + si + ' accepts the right answer', { p: t.params, r, k: keyInput(s.answer) });
          const w = s.check(wrongInput(s.answer)); ok(w.ok === false && w.msg, g.id + ' step ' + si + ' rejects a wrong answer with a message', { p: t.params, w });
          ok(s.check({}).incomplete || s.check({}).ok === false, g.id + ' step empty input is not right');
        });
      } else {
        const r = t.check(keyInput(t.answer)); ok(r.ok === true, g.id + ' L' + level + ' accepts the right answer', { p: t.params, r, k: keyInput(t.answer) });
        const w = t.check(wrongInput(t.answer)); ok(w.ok === false && !!w.msg, g.id + ' L' + level + ' rejects a wrong answer with a message', { p: t.params, w });
        if (w.ok === false) ok(BB.model.ERRORS[w.err], g.id + ' error type known', w.err);
        ok(t.check({}).incomplete || t.check({}).ok === false, g.id + ' empty input is not right');
        // fractions: an equivalent (unreduced) answer is accepted where any form is allowed
        if ((t.answer.type === 'frac' || t.answer.type === 'share') && t.answer.whole === 'optional') {
          const v = t.answer.value; const r2 = t.check({ w: null, n: v.n * 2, d: v.d * 2 });
          ok(r2.ok === true, g.id + ' accepts an equivalent fraction', { v, r2 });
          if (v.n && v.n !== v.d && !F.eq(F.make(v.d, v.n), v)) { const sw = t.check({ w: null, n: v.d, d: v.n }); ok(sw.ok === false && (sw.err === 'swap' || sw.err === 'part'), g.id + ' recognises swapped numerator/denominator', { v, sw }); }
          const r3 = v.n >= v.d && v.n % v.d ? t.check(keyInput({ type: 'frac', whole: 'required', value: v })) : { ok: true };
          ok(r3.ok === true, g.id + ' accepts the mixed number too', { v, r3 });
        }
      }
    }
  });
});

// ---- specific misconceptions (brief §12)
const vt = G.make('verteilen', 1, { it: 'pizza', a: 3, b: 4, pe: 0 });
ok(/Kinder teilen sich drei Pizzen/.test(vt.prompt), 'verteilen sentence', vt.prompt);
const sw = vt.check({ w: null, n: 4, d: 3 }); ok(sw.err === 'swap' && /verteilen/i.test(sw.msg) && /Dividend wird zum Zähler/.test(sw.msg), '4/3 for 3 pizzas / 4 children → explained swap', sw);
ok(vt.check({ w: null, n: 6, d: 8 }).ok && /dasselbe/.test(vt.check({ w: null, n: 6, d: 8 }).note), '6/8 accepted with equivalence note');
const ug = G.make('u2g', 1, { n: 9, d: 4 });
ok(ug.check({ w: 2, n: 1, d: 4 }).ok, '9/4 = 2 1/4');
ok(ug.check({ w: null, n: 1, d: 4 }).err === 'whole', '9/4 → 1/4 is "Ganze vergessen"');
ok(ug.check({ w: null, n: 9, d: 4 }).ok === false && /gemischte Zahl/.test(ug.check({ w: null, n: 9, d: 4 }).msg), '9/4 typed again → asked for mixed form');
const gu = G.make('g2u', 1, { n: 9, d: 4 });
ok(gu.check({ n: 9, d: 4 }).ok, '2 1/4 → 9/4');
ok(gu.check({ n: 3, d: 4 }).err === 'mixed' && /2 \+ 1/.test(gu.check({ n: 3, d: 4 }).msg), '2 1/4 → 3/4 (added) explained');
const er = G.make('erkennen', 1, { shape: 'pie', kind: 'pizza', d: 8, k: 5, sh: [0, 1, 2, 3, 4] });
ok(er.check({ n: 5, d: 3 }).err === 'part', '5 of 8 → 5/3 is part-to-part');
ok(er.check({ n: 8, d: 5 }).err === 'swap', '5 of 8 → 8/5 is swapped');
ok(er.check({ n: 3, d: 8 }).err === 'count', '5 of 8 → 3/8 counted the white ones');
const ze = G.make('zeichnen', 2, { k: 3, d: 4, shape: 'bar', kind: 'schokolade', rows: 2, cols: 4 });
ok(ze.answer.need === 6 && ze.check({ count: 6 }).ok && ze.check({ count: 3 }).err === 'count' && /nicht 4/.test(ze.check({ count: 3 }).msg), 'mark 3/4 of an 8-piece bar = 6 pieces; 3 pieces explained');
const ein = G.make('einheit_teilen', 2, { u: 'kg', Q: 3, k: 4, story: -1 });
ok(ein.answer.steps[0].check({ x: 3000 }).ok && ein.answer.steps[1].check({ x: 750 }).ok && ein.answer.steps[2].check({ n: 3, d: 4 }).ok, '3 kg : 4 = 3000 g : 4 = 750 g = 3/4 kg');
ok(ein.answer.steps[0].check({ x: 300 }).err === 'unit', '3 kg = 300 g → unit error');
ok(ein.answer.steps[2].check({ n: 750, d: 1 }).err === 'unitval', '750 as kg → wrong unit');
const geld = G.make('einheit_teilen', 2, { u: '€', Q: 5, k: 20, story: -1 });
ok(geld.answer.steps[0].answer.value === 500 && geld.answer.steps[1].answer.value === 25 && F.eq(geld.answer.steps[2].answer.value, F.make(1, 4)), '5 € : 20 = 500 ct : 20 = 25 ct = 1/4 €');
const km = G.make('einheit_teilen', 3, { u: 'km', Q: 6, k: 40, story: -1 });
ok(km.answer.steps[1].answer.value === 150 && km.answer.steps[2].check({ n: 3, d: 20 }).ok, '6 km : 40 = 150 m = 3/20 km');
const z = G.make('div_bruch', 2, { a: 4, b: 0 }); ok(z.answer.type === 'choice' && z.check({ id: 'nm' }).ok, '4 : 0 → nicht möglich');
ok(G.make('div_bruch', 1, { a: 3, b: 4 }).check({ n: 4, d: 0 }).err === 'concept', 'denominator 0 is never accepted');

// ---- every unit split story is sensible (no "0,375 Tüten", parts not tiny)
const WW = BB.gensWorld;
let splits = 0; ['kg', 'l', 'km', 'm', '€', 'h'].forEach(u => { for (let Q = 1; Q <= 6; Q++) [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 25, 40].forEach(k => { if (WW.splitOK(u, Q, k)) { splits++; const part = Q * BB.ctx.UNITS[u].f / k; ok(Number.isInteger(part) && part >= 5, 'split part integer', [u, Q, k]); } }); });
ok(splits > 60, 'enough unit-split variety', splits);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log(Object.entries(fails).map(([k, v]) => '  ' + v + '× ' + k).join('\n')); process.exit(1); }
