// Progress, sessions, coins, adaptivity. Run: node tests/logic.test.js
const load = require('./load');
let pass = 0, fail = 0;
function ok(c, msg, info) { if (c) pass++; else { fail++; console.log('FAIL', msg, info !== undefined ? JSON.stringify(info).slice(0, 300) : ''); } }

function fresh() { const W = load(); return { W, BB: W.BB, pr: new W.BB.Progress('lukas', W.localStorage) }; }
const RIGHT = { firstTry: true, ok: true, tries: 1, hint: 0, secs: 20 };
const WRONG_CORR = { firstTry: false, ok: true, tries: 2, hint: 0, secs: 40, err: 'swap', corrected: true };
const SOL = { firstTry: false, ok: false, tries: 2, hint: 4, solution: true, secs: 60, err: 'arith' };

// ---- generator map
{
  const { BB } = fresh();
  Object.keys(BB.session.BY_SKILL).forEach(sk => {
    ok(BB.model.skill(sk), 'BY_SKILL key is a skill', sk);
    BB.session.BY_SKILL[sk].forEach(g => ok(BB.gens.byId[g[0]], 'generator exists', g[0]));
  });
  BB.model.SKILLS.forEach(s => ok(BB.session.BY_SKILL[s.id], 'every skill can be practised', s.id));
  BB.gens.list.forEach(g => ok(Object.values(BB.session.BY_SKILL).some(l => l.some(x => x[0] === g.id)), 'every generator is used by a skill', g.id));
}

// ---- Heute üben plan
{
  const { BB, pr } = fresh();
  const s = BB.session.create(pr, { mode: 'heute' }); const tasks = [];
  let t; while ((t = s.next())) { tasks.push(t); s.done(t, RIGHT); }
  ok(tasks.length === 10, 'Heute üben = 10 tasks', tasks.length);
  const tag = (t, x) => t.tags.indexOf(x) >= 0;
  ok(tag(tasks[2], 'visual') && tag(tasks[3], 'visual'), 'slots 3–4 visual', tasks.map(t => t.gen));
  ok(tag(tasks[4], 'convert') && tag(tasks[5], 'convert'), 'slots 5–6 conversion', tasks.map(t => t.gen));
  ok(tag(tasks[6], 'world') && tag(tasks[7], 'world'), 'slots 7–8 real world', tasks.map(t => t.gen));
  ok(tasks[8].tags.indexOf('why') >= 0, 'slot 9 Warum?', tasks[8].gen);
  const sum = s.finish();
  ok(sum.n === 10 && sum.first === 10, 'summary counts');
  ok(sum.total >= 15 && sum.total <= 25, 'a perfect Heute round ≈ 15–25 coins (like the Europa-Trainer)', sum.total);
  ok(sum.endBonus === 5, 'Heute bonus +5');
}

// ---- Schnelltraining / Bild / Sach filters, Prüfung blueprint
{
  const { BB, pr } = fresh();
  for (let r = 0; r < 30; r++) {
    const s = BB.session.create(pr, { mode: 'schnell' }); let t, n = 0;
    while ((t = s.next())) { n++; ok(t.tags.indexOf('short') >= 0 && !BB.session.HEAVY[t.gen] && t.answer.type !== 'steps' && t.answer.type !== 'share', 'Schnelltraining: short tasks only', t.gen); s.done(t, RIGHT); }
    ok(n === 8, 'Schnelltraining = 8');
  }
  for (let r = 0; r < 20; r++) { const s = BB.session.create(pr, { mode: 'bild' }); let t; while ((t = s.next())) { ok(t.followUp || t.tags.indexOf('visual') >= 0, 'Bildtraining: visual', t.gen); s.done(t, RIGHT); } }
  for (let r = 0; r < 20; r++) { const s = BB.session.create(pr, { mode: 'sach' }); let t; while ((t = s.next())) { ok(t.followUp || t.tags.indexOf('world') >= 0, 'Sachaufgaben: real world', t.gen); s.done(t, RIGHT); } }
  const s = BB.session.create(pr, { mode: 'pruefung' }); let t, n = 0, gens = new Set();
  while ((t = s.next())) { n++; gens.add(t.gen); ok(t.level >= 2, 'Prüfung at least level 2', [t.gen, t.level]); s.done(t, RIGHT); }
  ok(n === 12 && gens.size >= 11, 'Prüfung: 12 mixed tasks', [...gens]);
}

// ---- mastery needs enough data; level up/down
{
  const { BB, pr } = fresh();
  const t = BB.gens.make('u2g', 1);
  for (let i = 0; i < 3; i++) pr.record(t, RIGHT);
  ok(pr.mastery('u2g').key === 'neu', '3 right answers are not enough to call it "sicher"', pr.mastery('u2g'));
  ok(pr.level('u2g') === 2, '3 right in a row → level 2', pr.level('u2g'));
  for (let i = 0; i < 6; i++) pr.record(BB.gens.make('u2g', 2), RIGHT);
  ok(pr.mastery('u2g').key === 'sicher', '9 right incl. level 2 → sicher', pr.mastery('u2g'));
  for (let i = 0; i < 6; i++) pr.record(BB.gens.make('u2g', pr.level('u2g')), SOL);
  ok(pr.mastery('u2g').key === 'uebung' && pr.level('u2g') < 3, 'many solution views → braucht Übung, level goes down', [pr.mastery('u2g'), pr.level('u2g')]);
  const s2 = pr.doc.skills.u2g; ok(s2.box === 0, 'spaced repetition box falls back');
}

// ---- spaced repetition: due again later
{
  const { BB, pr } = fresh();
  const t = BB.gens.make('g2u', 1); const t0 = Date.now();
  pr.record(t, RIGHT, t0); pr.record(t, RIGHT, t0 + 1000);
  ok(pr.due(t0 + 2000).indexOf('g2u') < 0, 'just practised → not due');
  ok(pr.due(t0 + 3 * 86400000).indexOf('g2u') >= 0, 'due again after some days');
}

// ---- Fehlertraining: the exact task comes back first; solved → removed
{
  const { BB, pr } = fresh();
  const t = BB.gens.make('verteilen', 1, { it: 'pizza', a: 3, b: 4, pe: 0 });
  pr.record(t, WRONG_CORR);
  ok(pr.doc.wrong.length === 1, 'mistake stored');
  const s = BB.session.create(pr, { mode: 'fehler' });
  const t1 = s.next();
  ok(t1.gen === 'verteilen' && t1.prompt === t.prompt && t1.fromMistake, 'Fehlertraining starts with the exact task', t1.prompt);
  const out = s.done(t1, RIGHT);
  ok(out.coins === 2, 'solving a former mistake: +1 task +1 correction', out);
  ok(pr.doc.wrong.length === 0, 'solved mistakes leave the list');
  const t2 = s.next(); ok(t2 && t2.gen === 'verteilen' && !t2.fromMistake, 'then a similar new task', t2 && t2.gen);
  s.done(t2, RIGHT);
  const sum = s.finish(); ok(sum.endBonus === 0 || sum.endBonus === 4, 'Fehlertraining bonus only for a real round', sum.endBonus);
}

// ---- coins: effort counts, corrections count, farming stops
{
  const { BB, pr } = fresh();
  const t = BB.gens.make('erkennen', 1);
  ok(pr.taskCoins(t, RIGHT) === 1, 'right → 1');
  ok(pr.taskCoins(t, WRONG_CORR) === 2, 'corrected by yourself → 2');
  ok(pr.taskCoins(t, { firstTry: false, ok: true, hint: 3 }) === 1, 'solved with hints → still 1 (effort)');
  ok(pr.taskCoins(t, SOL) === 0, 'solution shown → 0');
  // make "erkennen" sicher at level 3, then easy level-1 tasks pay nothing
  for (let i = 0; i < 12; i++) pr.record(BB.gens.make('erkennen', Math.min(3, pr.level('erkennen'))), RIGHT);
  ok(pr.mastery('erkennen').key === 'sicher' && pr.level('erkennen') === 3, 'erkennen sicher at level 3', [pr.mastery('erkennen'), pr.level('erkennen')]);
  ok(pr.taskCoins(BB.gens.make('erkennen', 1), RIGHT) === 0, 'easy tasks of a mastered skill pay nothing (no farming)');
  ok(pr.taskCoins(BB.gens.make('erkennen', 3), RIGHT) === 1, 'tasks at the current level still pay');
  // daily cap
  let got = 0; for (let i = 0; i < 200; i++) got += pr.taskCoins(BB.gens.make('g2u', 1), RIGHT);
  ok(got <= BB.progressUtil.DAILY_TASK_CAP, 'per-task coins capped per day', got);
  // mastery bonus once
  const { pr: pr2, BB: B2 } = fresh(); const s = B2.session.create(pr2, { mode: 'skill', skill: 'g2u' });
  let bonus = 0, mast = 0; for (let r = 0; r < 3; r++) { const ss = B2.session.create(pr2, { mode: 'skill', skill: 'g2u' }); let x; while ((x = ss.next())) { const o = ss.done(x, RIGHT); bonus += o.bonus; if (o.mastered) mast++; } }
  ok(mast === 1, 'mastery bonus (+5) only once per skill', mast);
}

// ---- misconceptions: not from little data; context-aware sentence
{
  const { BB, pr } = fresh();
  const vt = BB.gens.make('verteilen', 1);
  for (let i = 0; i < 4; i++) pr.record(vt, Object.assign({}, WRONG_CORR, { err: 'swap' }));
  ok(pr.misconceptions().length === 0, 'no statements from 4 tasks');
  for (let i = 0; i < 10; i++) pr.record(BB.gens.make('u2g', 1), RIGHT);
  const mc = pr.misconceptions();
  ok(mc.length === 1 && mc[0].err === 'swap' && /vertauscht/.test(mc[0].text) && /Sachaufgaben/.test(mc[0].text), 'swap in Sachaufgaben recognised', mc);
  const st = pr.stats(); ok(st.tasks === 14 && st.corrected === 4 && st.firstPct === 71, 'stats', st);
}

// ---- simulated learner: weak skills get more practice, mastery grows
{
  const { BB, pr } = fresh(); pr.setSetting('focus', 'alle');
  const ability = { verteilen: 0.35, einheiten: 0.4 };   // these two are hard for him at first
  const count = {}; let day0 = Date.now();
  for (let day = 0; day < 14; day++) {
    const s = BB.session.create(pr, { mode: 'heute' }); let t;
    while ((t = s.next())) {
      count[t.skill] = (count[t.skill] || 0) + 1;
      const a = Math.min(0.95, (ability[t.skill] || 0.8) + day * 0.04);
      s.done(t, Math.random() < a ? RIGHT : WRONG_CORR);
    }
    s.finish();
  }
  const total = Object.values(count).reduce((a, b) => a + b, 0);
  ok(total >= 130, '14 days of Heute üben', total);
  ok((count.verteilen || 0) + (count.einheiten || 0) >= 18, 'weak skills come back often', count);
  const seen = BB.model.SKILLS.filter(s => (pr.doc.skills[s.id] || {}).n).length;
  ok(seen >= 13, 'after two weeks almost every skill was practised', seen);
}

// ---- countdown to the 19th (school starts again)
{
  const { pr } = fresh();
  ok(pr.settings().goalDate === '2026-10-19' && pr.settings().goalLabel === 'Schulbeginn', 'goal: back to school on 19 Oct');
  ok(typeof pr.daysToGoal() === 'number', 'days to goal');
}

// ================================================================ Kapitel 2

// ---- saved progress from before the update loads unchanged
{
  const W = load(), BB = W.BB;
  const old = { v: 1, created: 1, skills: { u2g: { n: 9, first: 9, m: 0.95, level: 2, box: 3, due: 0, last: 5, hints: 0, corrected: 0, errs: {}, streak: 2 } },
    log: [{ ts: Date.now(), skill: 'u2g', gen: 'u2g', level: 2, ok: true, first: true, tries: 1, hint: 0, sol: false, secs: 20, err: null, corr: false, mode: 'heute' }],
    wrong: [{ key: 'g2u:{"n":9,"d":4}', gen: 'g2u', params: { n: 9, d: 4 }, level: 1, skill: 'g2u', err: 'mixed', ts: 1, n: 1 }], modules: { A: 1 }, sessions: [],
    coins: { log: [{ ts: 1, amount: 20, reason: 'heute' }], days: {}, mastery: { u2g: 1 }, modules: { A: 1 } },
    settings: { goalDate: '2026-10-19', goalLabel: 'Schulbeginn', timer: false, font: 'dyslexic', voice: '', slowRate: 0.8 } };
  W.localStorage.setItem('bruch-bobins:lukas', JSON.stringify(old));
  const pr = new BB.Progress('lukas', W.localStorage);
  ok(pr.mastery('u2g').key === 'sicher' && pr.moduleDone('A') && pr.doc.coins.mastery.u2g && pr.settings().font === 'dyslexic', 'old progress, modules, coins and settings kept', pr.doc);
  ok(pr.settings().focus === 'k2', 'new setting "focus" gets its default (Kapitel 2)');
  ok(pr.overview().length === 27 && pr.overview().filter(o => BB.model.unitOf(o.id) === 'k2').every(o => o.n === 0), 'new skills appear empty next to the old ones');
  const s = BB.session.create(pr, { mode: 'fehler' }); const t = s.next();
  ok(t && t.gen === 'g2u' && t.fromMistake, 'old mistakes still come back in Fehlertraining', t && t.gen);
  pr.save(); const again = new BB.Progress('lukas', W.localStorage);
  ok(again.mastery('u2g').key === 'sicher' && again.doc.log.length === 1, 'saved again and reloaded');
}

// ---- every skill and module of Kapitel 2 exists; lessons point at real generators
{
  const W = load(['js/ui.js', 'js/draw.js', 'js/lessons.js'].filter(() => false)), BB = W.BB, M = BB.model;
  ok(M.skillsOf('k2').length === 11 && M.MODULES.filter(m => m.unit === 'k2').map(m => m.id).join('') === 'IJKLMN', 'Kapitel 2: 11 skills, modules I–N');
  M.MODULES.forEach(m => m.skills.forEach(sk => ok(M.skill(sk), 'module skill exists', [m.id, sk])));
  ['nuroben', 'ungleich', 'addiert', 'kuerzerw', 'nichtvoll', 'faktor', 'nennergroesser', 'zaehlervgl', 'hnzaehler', 'zeichen', 'gleichordnen'].forEach(e => ok(M.ERRORS[e] && M.ERRORS[e].say, 'misconception tracked separately', e));
}

// ---- focus on Kapitel 2: Heute üben compares every day, exam = Klassenarbeit topic
{
  const { BB, pr } = fresh(); let k2 = 0, n = 0, cmpDays = 0;
  for (let d = 0; d < 20; d++) {
    const s = BB.session.create(pr, { mode: 'heute' }); let t, cmp = false;
    while ((t = s.next())) { n++; if (BB.model.unitOf(t.skill) === 'k2') k2++; if (t.skill === 'vergleichen' || t.skill === 'gleichnamig') cmp = true; s.done(t, RIGHT); }
    if (cmp) cmpDays++; s.finish();
  }
  ok(k2 / n >= 0.5, 'Heute üben: most tasks from the current chapter', [k2, n]);
  ok(k2 / n <= 0.95, 'Heute üben: Kapitel 1 is still reviewed', [k2, n]);
  ok(cmpDays === 20, 'every Heute round has a comparing / gleichnamig task', cmpDays);
  const ex = BB.session.create(pr, { mode: 'pruefung' }); let t, gens = [];
  while ((t = ex.next())) { gens.push(t.gen); ok(BB.model.unitOf(t.skill) === 'k2' && t.level >= 2, 'exam: Kapitel 2 at level ≥ 2', [t.gen, t.level]); ex.done(t, RIGHT); }
  ok(gens.length === 12 && new Set(gens).size === 12, 'exam: 12 different Kapitel-2 tasks', gens);
  ok(gens.indexOf('vergleich_schritte') >= 0 && gens.indexOf('ordnen') >= 0 && gens.indexOf('vgl_fehler') >= 0, 'exam includes comparing step by step, ordering, finding the mistake', gens);
  pr.setSetting('focus', 'k1');
  const ex1 = BB.session.create(pr, { mode: 'pruefung' }); const g1 = []; while ((t = ex1.next())) { g1.push(t.gen); ex1.done(t, RIGHT); }
  ok(g1.join() === BB.session.EXAM.k1.join(), 'focus Kapitel 1 → the old exam', g1);
  const h1 = BB.session.create(pr, { mode: 'heute' }); let warumSlot = null, i = 0; while ((t = h1.next())) { if (++i === 9) warumSlot = t.gen; h1.done(t, RIGHT); }
  ok(warumSlot === 'warum', 'focus Kapitel 1 → slot 9 as before', warumSlot);
}

// ---- after a mistake: a similar task later in the same round (checks understanding), only twice per round
{
  const { BB, pr } = fresh();
  const s = BB.session.create(pr, { mode: 'skill', skill: 'vergleichen' }); let t, n = 0, cb = 0, gensWrong = [], gensBack = [];
  while ((t = s.next())) { if (t.followUp) { s.done(t, RIGHT); continue; } n++; if (t.checkBack) { cb++; gensBack.push(t.gen); } const r = n <= 3 ? WRONG_CORR : RIGHT; if (n <= 3 && !t.checkBack) gensWrong.push(t.gen); const o = s.done(t, r); }
  ok(cb === 2 && n === 10, 'two check-back tasks added to the round', [cb, n]);
  ok(gensBack.every(g => gensWrong.indexOf(g) >= 0), 'check-back = same kind of task', [gensWrong, gensBack]);
  const ex = BB.session.create(pr, { mode: 'pruefung' }); let m = 0; while ((t = ex.next())) { m++; ex.done(t, WRONG_CORR); }
  ok(m === 12, 'no check-back tasks in the exam', m);
}

// ---- bettermarks start weights: a little more at first, fading with his own data (no permanent label)
{
  const { BB, pr } = fresh();
  ok(pr.weight('vergleichen') > pr.weight('erweitern') && pr.weight('tabelle') > pr.weight('erweitern'), 'comparing / tables start with more weight', [pr.weight('vergleichen'), pr.weight('erweitern')]);
  for (let i = 0; i < 12; i++) { pr.record(BB.gens.make('vergleich_wahl', 1), RIGHT); pr.record(BB.gens.make('erw_mit', 1), RIGHT); }
  ok(Math.abs(pr.weight('vergleichen') - pr.weight('erweitern')) < 1e-9, 'after 12 own tasks the start weight is gone', [pr.weight('vergleichen'), pr.weight('erweitern')]);
  ok(pr.mastery('tabelle').key === 'neu', 'nothing is labelled weak from bettermarks alone');
}

// ---- coins: no farming with easy Kapitel-2 tasks
{
  const { BB, pr } = fresh();
  for (let i = 0; i < 12; i++) pr.record(BB.gens.make('erw_mit', Math.min(3, pr.level('erweitern'))), RIGHT);
  ok(pr.mastery('erweitern').key === 'sicher' && pr.level('erweitern') === 3, 'erweitern sicher at level 3');
  ok(pr.taskCoins(BB.gens.make('erw_mit', 1), RIGHT) === 0 && pr.taskCoins(BB.gens.make('erw_mit', 3), RIGHT) === 1, 'easy tasks of a mastered Kapitel-2 skill pay nothing');
  const s = BB.session.create(pr, { mode: 'skill', skill: 'ordnen' }); let t, coins = 0; while ((t = s.next())) { coins += s.done(t, RIGHT).coins; }
  ok(coins >= 8 && coins <= 10, 'a normal round still pays', coins);
}

// ---- parent page sentences for the new misconceptions
{
  const { BB, pr } = fresh();
  const t = BB.gens.make('kuerzen_mit', 1);
  for (let i = 0; i < 4; i++) pr.record(t, Object.assign({}, WRONG_CORR, { err: 'nuroben' }));
  for (let i = 0; i < 8; i++) pr.record(BB.gens.make('erw_mit', 1), RIGHT);
  const mc = pr.misconceptions();
  ok(mc.length === 1 && /nur der Zähler oder nur der Nenner/.test(mc[0].text) && /beim Kürzen/.test(mc[0].text), 'misconception sentence with context', mc);
  const ov = pr.overview(); ok(ov.some(o => o.group === 'Brüche vergleichen') && ov.some(o => o.group === 'Erweitern & Kürzen'), 'parent page groups for Kapitel 2');
}

// ---- simulated learner, 21 days, Kapitel 2 in focus: comparing is hard at first
{
  const { BB, pr } = fresh();
  const ability = { vergleichen: 0.35, gleichnamig: 0.45, ordnen: 0.4, vgl_warum: 0.45 }; const count = {};
  for (let day = 0; day < 21; day++) {
    const s = BB.session.create(pr, { mode: 'heute' }); let t;
    while ((t = s.next())) { count[t.skill] = (count[t.skill] || 0) + 1; const a = Math.min(0.95, (ability[t.skill] || 0.8) + day * 0.03); s.done(t, Math.random() < a ? RIGHT : WRONG_CORR); }
    s.finish();
  }
  const k2seen = BB.model.skillsOf('k2').filter(id => (pr.doc.skills[id] || {}).n);
  ok(k2seen.length >= 10, 'three weeks: (almost) every Kapitel-2 skill practised', k2seen);
  ok((count.vergleichen || 0) >= 20, 'comparing (weak at first) comes back very often', count.vergleichen);
  ok((pr.doc.skills.vergleichen || {}).m > 0.55, 'mastery for comparing grows', (pr.doc.skills.vergleichen || {}).m);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
