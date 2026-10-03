/*
 * lessons.js — LERNEN: modules A–H. Each topic: Erklärung → Beispiel → geführte Aufgabe →
 * selbstständige Aufgaben → Wiederholung (the skills come back in "Heute üben").
 * Always CONCRETE → VISUAL → MATHEMATICAL. Short lines, important numbers highlighted.
 *
 * Step types:  { t: 'explain'|'example'|'rule', title, lines: [markup], visual: draw spec, robin }
 *              { t: 'guided', task: {gen, level, params?, want?} }      first tip shown automatically
 *              { t: 'self', tasks: [{gen, level, want?}, …] }
 *              { t: 'review' }
 */
(function (root) {
  'use strict';
  var BB = root.BB, U = BB.ui, h = U.h, D = BB.draw, T = BB.text, F = BB.frac;

  var L = {
    A: [
      { t: 'explain', title: 'Ein Ganzes teilen', robin: 'Robin hat eine Pizza. Er teilt sie in *4 gleich große* Stücke.',
        lines: ['Ein Stück ist ein *Viertel* der Pizza.', 'Man schreibt: {1/4}'], visual: { type: 'pie', kind: 'pizza', d: 4, shaded: [0] } },
      { t: 'explain', title: 'Zähler und Nenner',
        lines: ['Robin isst *3* von *4* Stücken: {3/4} der Pizza.', '*Zähler* (oben): zählt die Stücke → 3', '*Nenner* (unten): nennt die Stücke → Viertel, also 4 gleich große Teile', 'Der Strich dazwischen heißt *Bruchstrich*.'],
        visual: { type: 'pie', kind: 'pizza', d: 4, shaded: [0, 1, 2] } },
      { t: 'rule', title: 'Merke', lines: ['Der *Nenner* nennt, in wie viele *gleich große* Teile das Ganze geteilt ist.', 'Der *Zähler* zählt, wie viele Teile man nimmt.'] },
      { t: 'explain', title: 'Gleich groß!', lines: ['Links: 4 Teile, aber *nicht* gleich groß – das sind keine Viertel.', 'Rechts: 4 gleich große Teile – jedes ist {1/4}.'],
        visuals: [{ type: 'unequal', kind: 'bar', d: 4, shaded: [0], seed: 11 }, { type: 'bar', kind: 'rechteck', rows: 1, cols: 4, shaded: [0] }] },
      { t: 'example', title: 'Mehr Stücke als der Nenner', lines: ['Markiere {3/4} der Schokolade. Die Tafel hat [8] Stücke.', '8 Stücke in 4 gleiche Gruppen: 8 : 4 = 2 Stücke sind {1/4}.', '{3/4} sind 3 · 2 = [6] Stücke.'],
        visual: { type: 'bar', kind: 'schokolade', rows: 2, cols: 4, shaded: [0, 1, 2, 4, 5, 6] } },
      { t: 'explain', title: 'Stammbrüche', lines: ['Brüche mit dem Zähler *1* heißen *Stammbrüche*: {1/2}, {1/3}, {1/4}, {1/5} …', 'Je größer der Nenner, desto kleiner das Stück!'],
        visuals: [{ type: 'bar', kind: 'streifen', rows: 1, cols: 2, shaded: [0] }, { type: 'bar', kind: 'streifen', rows: 1, cols: 4, shaded: [0] }, { type: 'bar', kind: 'streifen', rows: 1, cols: 8, shaded: [0] }] },
      { t: 'guided', task: { gen: 'erkennen', level: 1 } },
      { t: 'guided', task: { gen: 'zeichnen', level: 1 } },
      { t: 'self', tasks: [{ gen: 'erkennen_wahl', level: 1 }, { gen: 'zn_begriffe', level: 1 }, { gen: 'zeichnen', level: 2 }, { gen: 'erkennen', level: 2 }] },
      { t: 'review' }
    ],
    B: [
      { t: 'explain', title: 'Weniger als ein Ganzes', lines: ['{3/4}: 3 von 4 Vierteln.', 'Das ist *weniger* als eine ganze Pizza.', 'Hier ist der Zähler *kleiner* als der Nenner: 3 < 4.', 'So ein Bruch heißt *echter Bruch*.'],
        visual: { type: 'wholes', kind: 'pizza', d: 4, count: 3, wholes: 1 } },
      { t: 'explain', title: 'Mehr als ein Ganzes', lines: ['{7/4}: 7 Viertel.', 'Eine Pizza hat nur 4 Viertel. Für 7 Viertel braucht man eine *zweite* Pizza.', '{7/4} ist *mehr* als ein Ganzes: der Zähler ist *größer* als der Nenner.', 'So ein Bruch heißt *unechter Bruch*.'],
        visual: { type: 'wholes', kind: 'pizza', d: 4, count: 7, wholes: 2 } },
      { t: 'explain', title: 'Genau ein Ganzes – und mehr Ganze', lines: ['{4/4} = 1 (eine ganze Pizza). Auch das ist ein unechter Bruch.', '{8/4} = 2,  {12/4} = 3: Ist der Zähler ein *Vielfaches* des Nenners, kommt eine *natürliche Zahl* heraus.', '{0/5} = 0: Null Stücke sind nichts.'],
        visual: { type: 'wholes', kind: 'kreis', d: 4, count: 8, wholes: 2 } },
      { t: 'rule', title: 'Merke', lines: ['*echter Bruch*: Zähler < Nenner → weniger als ein Ganzes', '*unechter Bruch*: Zähler ≥ Nenner → ein Ganzes oder mehr'] },
      { t: 'guided', task: { gen: 'echt_wahl', level: 1 } },
      { t: 'self', tasks: [{ gen: 'echt_wahl', level: 2 }, { gen: 'natuerlich', level: 1 }, { gen: 'natuerlich', level: 2 }, { gen: 'echt_wahl', level: 3 }, { gen: 'warum', level: 1, params: { id: 'vier-drittel', o: 1 } }] },
      { t: 'review' }
    ],
    C: [
      { t: 'explain', title: 'Ganze zusammenfassen', lines: ['{9/4}: 9 Viertel.', '4 Viertel = 1 Ganzes. 8 Viertel = 2 Ganze.', 'Es bleibt *1 Viertel* übrig.', '{9/4} = 2 + {1/4} = {2 1/4}'],
        visual: { type: 'wholes', kind: 'pizza', d: 4, count: 9, wholes: 3 } },
      { t: 'rule', title: 'Rechnen statt zählen', lines: ['Unechter Bruch → gemischte Zahl: *Zähler : Nenner*', '9 : 4 = *2* Rest *1*', '→ 2 Ganze, Rest 1 bleibt im Zähler: {2 1/4}'] },
      { t: 'explain', title: 'Und zurück', lines: ['{2 1/2}: Wie viele Halbe sind das?', '2 Ganze = 2 · 2 = 4 Halbe.', 'Dazu 1 Halbe: 4 + 1 = 5 Halbe.', '{2 1/2} = {5/2}'],
        visual: { type: 'wholes', kind: 'kreis', d: 2, count: 5, wholes: 3 } },
      { t: 'rule', title: 'Merke', lines: ['Gemischte Zahl → unechter Bruch: *Ganze · Nenner + Zähler*', '{3 3/4}: 3 · 4 + 3 = 15 → {15/4}'] },
      { t: 'guided', task: { gen: 'u2g', level: 1 } },
      { t: 'guided', task: { gen: 'g2u', level: 1 } },
      { t: 'self', tasks: [{ gen: 'gemischt_bild', level: 1 }, { gen: 'u2g', level: 2 }, { gen: 'g2u', level: 2 }, { gen: 'warum', level: 1, params: { id: 'gemischt-warum', o: 2 } }] },
      { t: 'review' }
    ],
    D: [
      { t: 'explain', title: 'Drei Pizzen, vier Kinder', robin: 'Robin braucht Hilfe: *3 Pizzen* sollen gerecht auf *4 Kinder* verteilt werden.',
        lines: ['Jedes Kind bekommt weniger als eine ganze Pizza – aber wie viel?', 'Wir *verteilen*, also rechnen wir *geteilt durch*: [3 : 4]'], visual: { type: 'items', kind: 'pizza', count: 3 } },
      { t: 'explain', title: 'So kann man schneiden', lines: ['Jede Pizza in *4* Stücke schneiden.', 'Jedes Kind bekommt aus jeder Pizza ein Stück: 3 Stücke à {1/4}.', '3 · {1/4} = {3/4}'], visual: { type: 'share', kind: 'pizza', a: 3, b: 4 } },
      { t: 'rule', title: 'Merke', lines: ['Ein Bruch ist eine andere Schreibweise für eine Division.', '3 : 4 = {3/4}      5 : 6 = {5/6}      7 : 3 = {7/3}', 'Der *Dividend* wird zum Zähler, der *Divisor* zum Nenner.'] },
      { t: 'explain', title: 'Ein anderer Weg – dasselbe Ergebnis', lines: ['2 Pizzen halbieren: jedes Kind bekommt {1/2}.', 'Die 3. Pizza vierteln: jedes Kind bekommt noch {1/4}.', '{1/2} + {1/4} = {3/4} – genauso viel!'], visual: { type: 'bar', kind: 'streifen', rows: 1, cols: 4, shaded: [0, 1, 2] } },
      { t: 'rule', title: 'Achtung', lines: ['Im Nenner steht *nie* 0: durch 0 kann man nicht teilen.', '8 : 1 = {8/1} = 8 (Divisor 1 → natürliche Zahl)', '1 : 7 = {1/7} (Dividend 1 → Stammbruch)'] },
      { t: 'guided', task: { gen: 'werkstatt', level: 1, params: { it: 'pizza', a: 3, b: 4, pe: 0 } } },
      { t: 'guided', task: { gen: 'div_bruch', level: 1 } },
      { t: 'self', tasks: [{ gen: 'div_kontext', level: 1 }, { gen: 'bruch_div', level: 1 }, { gen: 'div_begriffe', level: 2 }, { gen: 'div_bruch', level: 2 }, { gen: 'warum', level: 1, params: { id: 'nenner-null', o: 1 } }] },
      { t: 'review' }
    ],
    E: [
      { t: 'rule', title: 'So gehst du vor', lines: ['1. *Schätzen:* Mehr oder weniger als ein Ganzes?', '2. *Vorstellen oder zeichnen:* Wie kann man schneiden?', '3. *Division* aufschreiben: Was wird verteilt : auf wie viele?', '4. *Bruch* schreiben.', '5. Wenn es geht: als *gemischte Zahl* schreiben.'] },
      { t: 'example', title: 'Drei Kinder, vier Pfannkuchen', lines: ['Schätzen: Mehr Pfannkuchen als Kinder → jeder bekommt *mehr* als einen.', 'Division: 4 : 3', 'Bruch: {4/3} = {1 1/3}', 'Jedes Kind bekommt *einen ganzen* Pfannkuchen und {1/3} von einem.'], visual: { type: 'share', kind: 'pfannkuchen', a: 4, b: 3 } },
      { t: 'example', title: 'Flüssiges teilen', lines: ['[6 l] Saft auf [8] Personen: 6 : 8 = {6/8} l.', '{6/8} l ist dasselbe wie {3/4} l – das sind 750 ml.'], visual: { type: 'jug', max: 1000, step: 50, fill: 750 } },
      { t: 'guided', task: { gen: 'werkstatt', level: 2 } },
      { t: 'self', tasks: [{ gen: 'verteilen', level: 1 }, { gen: 'verteilen', level: 2 }, { gen: 'verteilen_liter', level: 1 }, { gen: 'warum', level: 1, params: { id: 'methoden', o: 0 } }] },
      { t: 'review' }
    ],
    F: [
      { t: 'rule', title: 'Diese Umrechnungen brauchst du', lines: ['1 kg = [1000 g]      1 Pfund = [500 g] = {1/2} kg', '1 l = [1000 ml]      1 km = [1000 m]      1 m = [100 cm]', '1 € = [100 ct]      1 h = [60 min]'] },
      { t: 'explain', title: 'Erst umwandeln, dann teilen', robin: 'Robins Futtersack wiegt *3 kg*. Er reicht für *4* Wochen. Wie viel ist das pro Woche?',
        lines: ['3 kg : 4 – das geht nicht glatt.', 'In Gramm: 3 kg = [3000 g].', '3000 g : 4 = [750 g] – das geht glatt!', '750 g = {3/4} kg'] },
      { t: 'example', title: 'Noch zwei Beispiele', lines: ['5 € : 20 = 500 ct : 20 = [25 ct] = {1/4} €', '6 km : 40 = 6000 m : 40 = [150 m] = {3/20} km'] },
      { t: 'rule', title: 'Merke', lines: ['Geht die Division in der großen Einheit nicht glatt, nimm die *kleinere* Einheit.', 'Brüche von Größen: {3/4} kg = 3 · 250 g = 750 g,  {1 1/2} kg = 1500 g,  {1/4} h = 15 min'] },
      { t: 'guided', task: { gen: 'einheit_teilen', level: 1, params: { u: 'kg', Q: 3, k: 4, story: -1 } } },
      { t: 'self', tasks: [{ gen: 'umrechnen', level: 1, want: 'kg' }, { gen: 'einheit_teilen', level: 2 }, { gen: 'umrechnen', level: 2, want: 'h' }, { gen: 'geschichte', level: 1 }, { gen: 'warum', level: 1, params: { id: 'einheit-warum', o: 2 } }] },
      { t: 'review' }
    ],
    G: [
      { t: 'explain', title: 'Der Messbecher', lines: ['1 l = [1000 ml]', '{1/2} l = 500 ml,  {1/4} l = 250 ml,  {3/4} l = 750 ml', 'Hier sind {3/4} l im Becher.'], visual: { type: 'jug', max: 1000, step: 50, fill: 750 } },
      { t: 'explain', title: 'Fünftel und mehr als ein Liter', lines: ['{1/5} l = 1000 ml : 5 = 200 ml, also {2/5} l = [400 ml].', '{1 1/4} l = 1000 ml + 250 ml = [1250 ml].'], visual: { type: 'jug', max: 2000, step: 50, fill: 1250 } },
      { t: 'guided', task: { gen: 'jug_mark', level: 1 } },
      { t: 'self', tasks: [{ gen: 'jug_read', level: 1 }, { gen: 'jug_mark', level: 2 }, { gen: 'umrechnen', level: 2, want: 'l' }, { gen: 'jug_mark', level: 3 }, { gen: 'warum', level: 1, params: { id: 'gleich-viel', o: 1 } }] },
      { t: 'review' }
    ],
    H: [
      { t: 'explain', title: 'Bruchteile von Geld', lines: ['{3/4} von [12 €]:', 'Erst {1/4}: 12 € : 4 = 3 €.', 'Dann {3/4}: 3 · 3 € = [9 €].'] },
      { t: 'explain', title: 'Geld teilen', lines: ['[5 €] auf [20] Kinder:', '5 € = 500 ct.  500 ct : 20 = [25 ct].', '25 ct = {1/4} €.'] },
      { t: 'explain', title: 'Einkaufen: Was ist günstiger?', lines: ['500 g Nudeln kosten 0,98 €. Die Packung mit 2,5 kg kostet 3,99 €.', 'Gleiche Menge vergleichen: 2,5 kg = 5 · 500 g.', '5 · 0,98 € = 4,90 €. Die große Packung spart [0,91 €].', 'Aber Achtung: Groß ist nicht *immer* billiger!'] },
      { t: 'guided', task: { gen: 'anteil_von', level: 1 } },
      { t: 'self', tasks: [{ gen: 'anteil_von', level: 2 }, { gen: 'einkauf', level: 1 }, { gen: 'menge', level: 2 }, { gen: 'anteil_von', level: 3 }] },
      { t: 'review' }
    ]
  };

  function play(app, id, from) {
    var mod = BB.model.module(id), steps = L[id], i = from || 0;
    function render() {
      var st = steps[i];
      if (st.t === 'guided' || st.t === 'self') return runTasks(st);
      var dots = h('div', { class: 'dots', 'aria-hidden': 'true' }, steps.map(function (_, k) { return h('span', { class: 'dot' + (k < i ? ' done' : k === i ? ' now' : '') }); }));
      var card = h('article', { class: 'lesson card ' + st.t });
      if (st.t === 'review') {
        BB.model.module(id).skills.forEach(function (sk) { var s = app.progress.stat(sk); if (s.n) { s.due = Date.now() + 20 * 3600000; } });
        app.progress.save();
        app.progress.setModuleDone(id);
        var first = app.progress.claimModule(id), coins = first ? app.bonus(3, 'Modul ' + id + ' geschafft') : 0;
        card.appendChild(h('div', { class: 'end-hero' }, [app.robin('celebrating', 90), h('div', {}, [h('h2', { text: 'Modul geschafft!' }),
          h('p', { text: 'Wiederholung: Diese Themen kommen ab morgen in „Heute üben“ wieder dran – so bleiben sie im Kopf.' }),
          coins ? h('p', { class: 'end-coins' }, [U.coin(24), '+' + coins + ' Robin-Münzen']) : null])]));
        card.appendChild(h('div', { class: 'row' }, [h('button', { class: 'btn primary', type: 'button', text: 'Zu den Modulen', onclick: function () { app.go('lernen'); } }),
          h('button', { class: 'btn soft', type: 'button', text: 'Zum Start', onclick: function () { app.go('home'); } })]));
        return app.setView(h('section', { class: 'lesson-wrap' }, [h('h1', { class: 'screen-h', text: mod.icon + ' ' + mod.title }), dots, card]), { back: true });
      }
      var label = { explain: 'Erklärung', example: 'Beispiel', rule: 'Merke' }[st.t];
      card.appendChild(h('p', { class: 'kicker', text: label }));
      card.appendChild(h('div', { class: 'lesson-top' }, [h('h2', { text: st.title }), U.readButton(function () { return (st.robin ? st.robin + '. ' : '') + st.lines.join('. '); })]));
      if (st.robin) card.appendChild(U.robinSays(app.robin('normal', 56), st.robin));
      var pics = st.visuals || (st.visual ? [st.visual] : []);
      var content = h('div', { class: 'lesson-body' + (pics.length ? ' with-pic' : '') }, [
        h('div', { class: 'lesson-lines' }, st.lines.map(function (l) { return h('p', { rich: l }); })),
        pics.length ? h('div', { class: 'lesson-pics' }, pics.map(function (v) { return D.render(v); })) : null]);
      card.appendChild(content);
      var nav = h('div', { class: 'row lesson-nav' }, [
        i > 0 ? h('button', { class: 'btn soft', type: 'button', text: '‹ Zurück', onclick: function () { i--; render(); } }) : null,
        h('button', { class: 'btn primary', type: 'button', text: 'Weiter ›', onclick: function () { i++; render(); } })]);
      card.appendChild(nav);
      app.setView(h('section', { class: 'lesson-wrap' }, [h('h1', { class: 'screen-h', text: mod.icon + ' ' + mod.title }), dots, card]), { back: true });
      setTimeout(function () { var b = nav.querySelector('.btn.primary'); if (b) b.focus({ preventScroll: true }); }, 50);
    }
    function runTasks(st) {
      var list = st.t === 'guided' ? [st.task] : st.tasks;
      var s = BB.session.create(app.progress, { mode: 'lernen', tasks: list });
      BB.practice.run(app, s, { title: mod.icon + ' ' + (st.t === 'guided' ? 'Geführte Aufgabe' : 'Jetzt du!'), guided: st.t === 'guided', after: function () { i++; render(); } });
    }
    render();
  }

  root.BB.lessons = { L: L, play: play };
})(typeof window !== 'undefined' ? window : globalThis);
