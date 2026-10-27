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
    case 'table': return { cells: a.slots.map(sl => sl.kind === 'num' ? { x: sl.value } : { n: sl.value.n, d: sl.value.d }) };
    case 'order': return { order: a.correct.slice() };
  }
  throw new Error('no key for ' + a.type);
}
function wrongInput(a) {
  switch (a.type) {
    case 'frac': case 'share': { const k = keyInput(a); if (a.fixed && a.fixed.n != null) return Object.assign({}, k, { d: k.d + 1 }); return Object.assign({}, k, k.n != null ? { n: k.n + 1 } : { w: k.w + 1 }); }
    case 'table': { const k = keyInput(a), c = k.cells[0]; if (c.x != null) c.x += 1; else if (a.slots[0].fixed && a.slots[0].fixed.n != null) c.d += 1; else c.n += 1; return k; }
    case 'order': return { order: a.correct.slice().reverse() };
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
  if (t.answer.before) out.push(t.answer.before);
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
          if (t.answer.lowest) ok(r2.ok === false && r2.err === 'nichtvoll', g.id + ' asks for lowest terms when told to', { v, r2 });
          else ok(r2.ok === true, g.id + ' accepts an equivalent fraction', { v, r2 });
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

// ================================================================ Kapitel 2: the misconceptions of the brief (§7)
const K = (gen, lv, params) => G.make(gen, lv, params);
const em = K('erw_mit', 1, { n: 2, d: 3, k: 4 });
ok(em.check({ n: 8, d: 12 }).ok, '2/3 · 4 = 8/12');
ok(em.check({ n: 8, d: 3 }).err === 'nuroben', 'only the numerator multiplied → nuroben', em.check({ n: 8, d: 3 }));
ok(em.check({ n: 2, d: 12 }).err === 'nuroben', 'only the denominator multiplied → nuroben');
ok(em.check({ n: 8, d: 9 }).err === 'ungleich', 'numerator ·4, denominator ·3 → different numbers', em.check({ n: 8, d: 9 }));
ok(em.check({ n: 6, d: 7 }).err === 'addiert', '2+4 / 3+4 → added instead of multiplied');
ok(em.check({ n: 4, d: 6 }).err === 'faktor' && /mit \[4\]/.test(em.check({ n: 4, d: 6 }).msg), 'right value, wrong factor (4/6 instead of 8/12) → explained', em.check({ n: 4, d: 6 }));
ok(!/8\/12|\{8\/12\}/.test(em.check({ n: 8, d: 3 }).msg), 'feedback does not give the answer away');
ok(K('erw_mit', 1, { n: 4, d: 6, k: 2 }).check({ n: 2, d: 3 }).err === 'kuerzerw', 'erweitern ↔ kürzen confused (divided instead)');
const kmt = K('kuerzen_mit', 1, { a: 2, b: 3, k: 4 });
ok(/8\/12/.test(kmt.prompt) && kmt.check({ n: 2, d: 3 }).ok, 'kürze 8/12 durch 4 = 2/3', kmt.prompt);
ok(kmt.check({ n: 8, d: 3 }).err === 'nuroben', 'only the denominator divided → nuroben', kmt.check({ n: 8, d: 3 }));
ok(kmt.check({ n: 32, d: 48 }).err === 'kuerzerw', 'kürzen ↔ erweitern confused (multiplied)');
ok(kmt.check({ n: 4, d: 8 }).err === 'addiert', 'subtracted instead of divided');
const vs = K('vollstaendig', 2, { a: 2, b: 3, g: 6 });
ok(vs.check({ n: 2, d: 3 }).ok && vs.check({ n: 6, d: 9 }).err === 'nichtvoll' && /durch 3/.test(vs.check({ n: 6, d: 9 }).msg), '12/18 → 6/9 is not fully reduced (still ÷3)', vs.check({ n: 6, d: 9 }));
const kf = K('kuerzen_frei', 2, { a: 3, b: 4, m: 6 });
ok(kf.check({ n: 9, d: 12 }).ok && /weiter kürzen/.test(kf.check({ n: 9, d: 12 }).note), 'Kürze 18/24: 9/12 is a correct reduction (stepwise), note says one can go on');
ok(kf.check({ n: 3, d: 4 }).ok && !kf.check({ n: 3, d: 4 }).note, 'direct reduction 3/4 accepted without note');
ok(kf.check({ n: 18, d: 24 }).ok === false && kf.check({ n: 36, d: 48 }).err === 'kuerzerw', 'same fraction / expanded instead → not accepted');
const fb = K('faktor_bestimmen', 1, { v: 'erw', a: 3, b: 5, k: 4 });
ok(fb.check({ x: 4 }).ok && fb.check({ x: 9 }).err === 'addiert' && fb.check({ x: 15 }).err === 'addiert', '3/5 = 12/20: factor 4; differences 9 or 15 → added', fb.check({ x: 9 }));
ok(fb.check({ x: 3 }).err === 'faktor', 'invalid factor → explained');
const gk = K('ggt', 2, { a: 2, b: 3, g: 6 });
ok(gk.answer.steps[0].check({ x: 3 }).err === 'nichtvoll' && gk.answer.steps[0].check({ x: 4 }).err === 'faktor' && gk.answer.steps[0].check({ x: 36 }).err === 'concept', 'ggT: smaller common divisor / not a divisor / a multiple → three different explanations');
const el = K('erw_luecke', 1, { v: 'nenner', a: 2, b: 3, k: 4 });
ok(el.answer.fixed.d === 12 && el.check({ n: 8, d: 12 }).ok, '2/3 = ?/12 → 8');
ok(el.check({ n: 2, d: 12 }).err === 'nuroben' && el.check({ n: 11, d: 12 }).err === 'addiert' && el.check({ n: 4, d: 12 }).err === 'faktor', '?/12: unchanged 2 / added 9 / typed the factor 4 → explained');
const kl = K('kuerz_luecke', 1, { v: 'zaehler', a: 3, b: 4, k: 6, j: 1 });
ok(kl.answer.fixed.n === 3 && kl.check({ n: 3, d: 4 }).ok && kl.check({ n: 3, d: 9 }).err === 'addiert', '18/24 = 3/? → 4; 24 − 15 = 9 → subtracted', kl.check({ n: 3, d: 9 }));
const hid = K('erw_luecke', 3, { v: 'versteckt', a: 3, b: 5, m: 5, j: 2 });
ok(/15\/25/.test(hid.answer.before) && hid.check({ n: 6, d: 10 }).ok && hid.check({ n: 0, d: 10 }).err === 'addiert', 'hidden equivalence 15/25 = ?/10 → 6 (kürzen, then erweitern)', [hid.answer.before, hid.check({ n: 0, d: 10 })]);
// comparing
const cw = (a, b, kind) => K('vergleich_wahl', 2, { kind: kind || 'verschieden', a: a, b: b, mix: 0 });
const c1 = cw([3, 4], [3, 7], 'zaehler');
ok(c1.check({ id: 'gt' }).ok && c1.check({ id: 'lt' }).err === 'nennergroesser', '3/4 > 3/7; "<" → bigger denominator = bigger fraction?', c1.check({ id: 'lt' }));
const c2 = cw([2, 3], [3, 5]);
ok(c2.check({ id: 'gt' }).ok && c2.check({ id: 'lt' }).err === 'zaehlervgl' && /10\/15/.test(c2.check({ id: 'lt' }).msg), '2/3 > 3/5; "<" → compared numerators only, shows 10/15', c2.check({ id: 'lt' }));
ok(!/Also|>/.test(c2.check({ id: 'lt' }).msg.replace(/\{[^}]+\}/g, '')), 'comparison feedback does not reveal the sign');
const c3 = cw([3, 8], [5, 8], 'nenner');
ok(c3.check({ id: 'lt' }).ok && c3.check({ id: 'gt' }).err === 'zeichen', '3/8 < 5/8; ">" → sign reversed', c3.check({ id: 'gt' }));
const c4 = cw([6, 8], [3, 4], 'gleich');
ok(c4.check({ id: 'eq' }).ok && c4.check({ id: 'gt' }).err === 'zaehlervgl', '6/8 = 3/4; ">" (more pieces) → explained', c4.check({ id: 'gt' }));
ok(c2.check({ id: 'lt' }).demo && c2.check({ id: 'lt' }).demo.type === 'bars' && c2.check({ id: 'lt' }).demo.rows[0].sub === 5, 'wrong comparison comes with a picture: both strips cut into fifteenths');
// step by step: common denominator any common multiple, numerators checked against it
const vsch = K('vergleich_schritte', 2, { kind: 'verschieden', a: [3, 4], b: [5, 6], mix: 0, why: true, o: 0 });
const st = vsch.answer.steps;
ok(st.length === 5, 'Stage E: common denominator, two numerators, sign, reason');
ok(st[0].check({ x: 10 }).err === 'hauptnenner' && /nicht durch 4/.test(st[0].check({ x: 10 }).msg), '10 is no common denominator of 4 and 6');
const r24 = st[0].check({ x: 24 });
ok(r24.ok && /12/.test(r24.note) && st[1].answer.fixed.d === 24 && st[1].answer.value.n === 18, 'any common multiple (24) is accepted, later steps adapt to it', [r24, st[1].answer]);
ok(st[1].check({ n: 18, d: 24 }).ok && st[1].check({ n: 3, d: 24 }).err === 'hnzaehler' && st[2].check({ n: 20, d: 24 }).ok, 'numerators checked for the chosen denominator; 3/24 → numerator not expanded');
ok(st[3].check({ id: 'lt' }).ok && st[3].check({ id: 'gt' }).err === 'zeichen' && st[4].check({ id: 'ok' }).ok && st[4].check({ id: 'n' }).err === 'reason', 'each step is validated on its own (sign, reason)');
const gn = K('gleichnamig', 2, { ds: [6, 9], ns: [5, 7] }).answer.steps;
ok(gn[0].check({ x: 18 }).ok && !gn[0].check({ x: 18 }).note && gn[0].check({ x: 54 }).ok && /18/.test(gn[0].check({ x: 54 }).note), '5/6 and 7/9: 18 (kgV) and 54 (product) both work, 54 gets a note');
const kv = K('kgv_nenner', 2, { ds: [6, 9], ns: [5, 7] });
ok(kv.check({ x: 18 }).ok && kv.check({ x: 54 }).err === 'kgv' && kv.check({ x: 15 }).err === 'hauptnenner', 'smallest common denominator asked: 54 → not the smallest, 15 → not common');
// ordering
const od = K('ordnen', 2, { cards: [[1, 4, 0], [1, 2, 0], [3, 4, 0], [2, 4, 0]], dir: 'asc' });
ok(od.check({ order: [0, 1, 3, 2] }).ok && od.check({ order: [0, 3, 1, 2] }).ok, 'equivalent fractions (1/2, 2/4) in either order');
ok(od.check({ order: [0, 1, 2, 3] }).err === 'gleichordnen', 'equivalent fractions separated → explained', od.check({ order: [0, 1, 2, 3] }));
ok(od.check({ order: [2, 1, 3, 0] }).err === 'zeichen', 'sorted the wrong way round → explained');
const od2 = K('ordnen', 2, { cards: [[2, 3, 0], [3, 5, 0], [1, 2, 0]], dir: 'asc' });
ok(od2.check({ order: [2, 0, 1] }).err === 'zaehlervgl', 'sorted by numerators → explained', od2.check({ order: [2, 0, 1] }));
ok(od2.check({ order: [2, 0, 1] }).demo, 'ordering mistake comes with a picture');
// tables: wrong cells are named, not the whole table
const tb = K('tabelle_erw', 1, { rows: [[2, 5]], ks: [2, 3, 4], cells: [['f', 'f', 'f']], hideCol: null });
ok(tb.check({ cells: [{ n: 4, d: 10 }, { n: 6, d: 15 }, { n: 8, d: 20 }] }).ok, 'table 2/5 · 2, 3, 4');
const tbw = tb.check({ cells: [{ n: 4, d: 10 }, { n: 6, d: 5 }, { n: 8, d: 20 }] });
ok(tbw.ok === false && tbw.bad.join() === '1' && tbw.err === 'nuroben' && /2 von 3/.test(tbw.msg), 'one wrong cell: marked, explained, "2 von 3 Feldern stimmen"', tbw);
const tk = K('tabelle_kuerz', 2, { M: 12, rows: [[1, 2], [2, 3]], ks: [2, 3, 12], vol: true, cells: [['f', 'f', 'f'], ['f', 'f', 'f']], hideCol: null });
const tkk = keyInput(tk.answer); tkk.cells[2] = { n: 3, d: 6 };
ok(tk.check(keyInput(tk.answer)).ok && tk.check(tkk).err === 'nichtvoll', 'kürzen table, last column "vollständig": 3/6 → not fully reduced', tk.check(tkk));
// Zahlenstrahl: equivalent answers count; Tom's claim
const zs = K('zahlenstrahl', 1, { v: 'punkt', T: 4, max: 1, k: 2 });
ok(zs.check({ n: 2, d: 4 }).ok && zs.check({ n: 1, d: 2 }).ok && zs.check({ n: 2, d: 5 }).err === 'count', 'number line: 2/4 and 1/2 both right; counting ticks instead of gaps explained');
const tom = K('vgl_fehler', 1, { v: 'nenner', who: 3, a: 2, b: 3, k: 2, o: 0, o2: 0, n: 3, d1: 4, d2: 5 });
ok(/Tom behauptet: \{3\/5\} > \{3\/4\}, weil 5 größer als 4 ist/.test(tom.prompt) && tom.answer.steps[0].check({ id: 'nein' }).ok && tom.answer.steps[0].check({ id: 'ja' }).err === 'nennergroesser', '„Tom behauptet: 3/5 > 3/4 …“ → Hat Tom recht? Erkläre.', tom.prompt);

// ---- mathematical cross-checks over many random tasks
for (let i = 0; i < 3000; i++) {
  const lv = 1 + (i % 3);
  const v = G.make('vergleich_wahl', lv), a = F.make(v.params.a[0], v.params.a[1]), b = F.make(v.params.b[0], v.params.b[1]);
  const dec = a.n / a.d - b.n / b.d, want = Math.abs(dec) < 1e-12 ? 'eq' : dec < 0 ? 'lt' : 'gt';
  ok(v.answer.correct === want, 'comparison sign agrees with decimal values', [v.params, v.answer.correct]);
  ok(a.d > 0 && b.d > 0, 'no zero denominators');
  const g2 = G.make('gleichnamig', lv), L = g2.answer.steps[0].answer.value;
  ok(g2.params.ds.every(d => L % d === 0) && g2.params.ds.every(d => g2.params.ds.every(e => e === d || true)) && !Array.from({ length: L - 1 }, (_, x) => x + 1).some(x => g2.params.ds.every(d => x % d === 0)), 'common denominator = smallest common multiple', g2.params);
  ok(new Set(g2.params.ds).size === g2.params.ds.length, 'gleichnamig: denominators differ');
  for (const id of ['erw_luecke', 'kuerz_luecke']) {
    const t = G.make(id, lv); if (t.answer.type !== 'frac') continue;
    const m = /\{(\d+)\/(\d+)\}/.exec(t.answer.before), f0 = F.make(+m[1], +m[2]), val = t.answer.value;
    ok(F.eq(f0, val), id + ': the completed fraction equals the given one', [t.params, val]);
    const fixed = t.answer.fixed, missing = fixed.d != null ? f0.n * fixed.d / f0.d : f0.d * fixed.n / f0.n;
    ok(Number.isInteger(missing) && missing > 0 && missing === (fixed.d != null ? val.n : val.d), id + ': missing number is a unique whole number', [t.params, missing]);
  }
  const o = G.make('ordnen', lv), fr = o.answer.cards.map(c => c.n / c.d), ord = o.answer.correct.map(k => fr[k]);
  ok(ord.every((x, k) => !k || (o.answer.dir === 'asc' ? ord[k - 1] <= x + 1e-12 : ord[k - 1] >= x - 1e-12)), 'ordering key is sorted', o.params);
  ok(new Set(o.answer.cards.map(c => c.n + '/' + c.d)).size === o.answer.cards.length && new Set(fr.map(x => x.toFixed(9))).size >= 2, 'ordering cards distinct, at least two values', o.params);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) { console.log(Object.entries(fails).map(([k, v]) => '  ' + v + '× ' + k).join('\n')); process.exit(1); }
