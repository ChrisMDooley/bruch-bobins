/*
 * lessons.js — LERNEN: modules A–H. Each topic: Erklärung → Beispiel → geführte Aufgabe →
 * selbstständige Aufgaben → Wiederholung (the skills come back in "Heute üben").
 * Always CONCRETE → VISUAL → MATHEMATICAL. Short lines, important numbers highlighted.
 *
 * Step types:  { t: 'explain'|'example'|'rule', title, lines: [markup], visual: draw spec, robin }
 *              { t: 'guided', task: {gen, level, params?, want?} }      first tip shown automatically
 *              { t: 'self', tasks: [{gen, level, want?}, …] }
 *              { t: 'walk', title, robin, steps: [{ line, visual }] }   worked example, one step per tap (Kapitel 2)
 *              { t: 'review' }
 */
(function (root) {
  'use strict';
  var BB = root.BB, U = BB.ui, h = U.h, D = BB.draw, T = BB.text, F = BB.frac;
  // strips: [n, d, sub] … (equal width, same scale)
  function B(list, extra) { var v = { type: 'bars', rows: list.map(function (x, i) { return { n: x[0], d: x[1], sub: x[2] || 1, col: x[3] != null ? x[3] : i }; }) }; for (var k in extra || {}) v[k] = extra[k]; return v; }
  function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }

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
    ],

    // ================================================================ Kapitel 2
    I: [
      { t: 'explain', title: 'Feiner schneiden', robin: 'Mia hat {2/3} einer Pizza. Papa schneidet *jedes* Stück noch einmal in *4* gleich große Stücke.',
        lines: ['Vorher: 3 Stücke, Mia hat 2 davon → {2/3}', 'Nachher: 3 · 4 = [12] Stücke, Mia hat 2 · 4 = [8] davon → {8/12}', 'Mia hat *genauso viel Pizza* wie vorher – nur in kleineren Stücken.'],
        visuals: [{ type: 'pie', kind: 'pizza', d: 3, shaded: [0, 1] }, { type: 'pie', kind: 'pizza', d: 12, shaded: range(8) }] },
      { t: 'walk', title: 'Erweitern – Schritt für Schritt', steps: [
        { line: 'Hier ist {2/3}: 3 gleich große Stücke, 2 davon gefärbt.', visual: B([[2, 3]]) },
        { line: 'Wir schneiden *jedes* Drittel in [4] gleich große Teile.', visual: B([[2, 3, 4]]) },
        { line: 'Zähle: Jetzt gibt es 3 · 4 = [12] Teile (Nenner). Gefärbt sind 2 · 4 = [8] (Zähler).', visual: B([[8, 12]]) },
        { line: 'Aufgeschrieben: {2/3} = {2 · 4/3 · 4} = {8/12}', visual: B([[2, 3], [8, 12]], { lines: true }) },
        { line: 'Die gefärbte Fläche ist *gleich groß* geblieben: Der Wert hat sich nicht verändert.', visual: B([[2, 3], [8, 12]], { lines: true }) }] },
      { t: 'rule', title: 'Merke: Erweitern', lines: ['Beim *Erweitern* multiplizierst du den Zähler *und* den Nenner mit derselben Zahl.', 'Der Wert des Bruchs bleibt gleich.', 'Die Zahl heißt *Erweiterungszahl*.', 'Die Stücke werden kleiner – dafür sind es mehr.'] },
      { t: 'explain', title: 'Vorsicht, Falle!', lines: ['Nur den Zähler mal nehmen: {2/3} → {8/3}. Das ist viel *mehr*! ✗', 'Etwas addieren: {2/3} → {3/4}. Das ist ein *anderer* Wert! ✗', 'Richtig: oben *und* unten mit derselben Zahl mal nehmen. ✓'],
        visual: B([[2, 3], [3, 4]], { lines: true }) },
      { t: 'guided', task: { gen: 'erw_mit', level: 1, params: { n: 3, d: 5, k: 3 } } },
      { t: 'guided', task: { gen: 'warum2', level: 1, params: { id: 'erw-gleich', o: 2 } } },
      { t: 'example', title: 'Auf einen bestimmten Nenner erweitern', lines: ['{3/4} = {?/20}', 'Wie wird aus 4 die 20?  20 : 4 = [5] – das ist die Erweiterungszahl.', 'Zähler: 3 · 5 = [15]  →  {3/4} = {15/20}'], visual: B([[3, 4, 5], [15, 20]], { lines: true }) },
      { t: 'self', tasks: [{ gen: 'erw_mit', level: 1 }, { gen: 'erw_luecke', level: 1 }, { gen: 'faktor_bestimmen', level: 1, params: { v: 'erw', a: 2, b: 5, k: 3 } }, { gen: 'gleichwertig_bild', level: 1 }, { gen: 'erw_oder_kuerz', level: 1 }, { gen: 'erw_luecke', level: 2 }] },
      { t: 'rule', title: 'Kurz gemerkt', lines: ['Erweitern = jedes Stück feiner schneiden.', '{2/3} = {2 · 5/3 · 5} = {10/15}', 'Zähler *und* Nenner mal *dieselbe* Zahl – der Wert bleibt gleich.'] },
      { t: 'review' }
    ],
    J: [
      { t: 'explain', title: 'Stücke zusammenlegen', robin: 'Ben hat *12* von *18* Stücken einer Schokolade: {12/18}.',
        lines: ['Wir legen immer *6* kleine Stücke zu einem großen zusammen.', 'Dann gibt es 18 : 6 = [3] große Stücke. Ben hat 12 : 6 = [2] davon.', '{12/18} = {2/3} – genauso viel Schokolade!'],
        visual: B([[12, 18], [2, 3, 6]]) },
      { t: 'walk', title: 'Kürzen – Schritt für Schritt', steps: [
        { line: '{12/18}: 18 gleich große Stücke, 12 davon gefärbt.', visual: B([[12, 18]]) },
        { line: 'Immer [6] Stücke gehören zusammen (gestrichelt).', visual: B([[2, 3, 6]]) },
        { line: 'Jetzt sind es nur noch 3 große Stücke, 2 davon gefärbt: {2/3}.', visual: B([[2, 3]]) },
        { line: 'Aufgeschrieben: {12/18} = {12 : 6/18 : 6} = {2/3}', visual: B([[12, 18], [2, 3]], { lines: true }) }] },
      { t: 'rule', title: 'Merke: Kürzen', lines: ['Beim *Kürzen* teilst du den Zähler *und* den Nenner durch dieselbe Zahl.', 'Der Wert des Bruchs bleibt gleich.', 'Die Zahl heißt *Kürzungszahl*.', 'Die Stücke werden größer – dafür sind es weniger.'] },
      { t: 'explain', title: 'Schrittweise oder direkt', lines: ['{12/18} → {6/9} → {2/3}   (erst durch 2, dann durch 3)', '{12/18} → {2/3}   (gleich durch 6)', '*Beide Wege sind richtig.* Das Ergebnis ist dasselbe.'],
        visual: B([[12, 18], [6, 9], [2, 3]], { lines: true }) },
      { t: 'explain', title: 'Vollständig gekürzt', lines: ['Ein Bruch ist *vollständig gekürzt*, wenn Zähler und Nenner keinen gemeinsamen Teiler mehr haben (außer 1).', '{6/9}: 6 und 9 sind beide durch 3 teilbar → noch nicht fertig.', '{2/3}: 2 und 3 haben keinen gemeinsamen Teiler → fertig! ✓'] },
      { t: 'explain', title: 'Der ggT – die größte Kürzungszahl', lines: ['Teiler von 12: 1, 2, 3, 4, *6*, 12', 'Teiler von 18: 1, 2, 3, *6*, 9, 18', 'Der *größte gemeinsame Teiler* (ggT) ist [6].', 'Kürzt du durch den ggT, bist du in einem Schritt fertig. Du musst ihn nicht immer suchen – schrittweise geht auch.'] },
      { t: 'guided', task: { gen: 'kuerzen_mit', level: 1, params: { a: 2, b: 3, k: 4 } } },
      { t: 'guided', task: { gen: 'warum2', level: 1, params: { id: 'kuerz-gleich', o: 1 } } },
      { t: 'self', tasks: [{ gen: 'kuerzen_mit', level: 1 }, { gen: 'kuerzen_frei', level: 1 }, { gen: 'vollstaendig', level: 1 }, { gen: 'faktor_bestimmen', level: 1, params: { v: 'kuerz', a: 3, b: 5, k: 3 } }, { gen: 'kuerz_luecke', level: 1 }, { gen: 'anteil_kuerzen', level: 1 }, { gen: 'vollstaendig', level: 2 }] },
      { t: 'rule', title: 'Kurz gemerkt', lines: ['Kürzen = Stücke zusammenlegen.', '{12/18} = {12 : 6/18 : 6} = {2/3}', 'Vollständig gekürzt: kein gemeinsamer Teiler mehr. Am schnellsten mit dem ggT.'] },
      { t: 'review' }
    ],
    K: [
      { t: 'explain', title: 'Gleich viel – verschieden geschrieben', lines: ['{2/3} = {4/6} = {6/9} = {8/12}', 'Alle Streifen sind bis zur *selben Stelle* gefärbt.', 'Solche Brüche heißen *gleichwertig*.'],
        visual: B([[2, 3], [4, 6], [6, 9], [8, 12]], { lines: true }) },
      { t: 'explain', title: 'Auf dem Zahlenstrahl', lines: ['Gleichwertige Brüche sind *ein und derselbe Punkt* auf dem Zahlenstrahl.', 'Oben ist in Drittel eingeteilt, unten in Sechstel – der Punkt bleibt, wo er ist.'],
        visual: { type: 'numline', max: 1, ticks: [3, 6], marks: [{ n: 2, d: 3, col: 0 }, { n: 4, d: 6, col: 1, below: true }] } },
      { t: 'explain', title: 'Gleichwertig – ja oder nein?', lines: ['Sind {6/9} und {8/12} gleichwertig?', 'Kürze beide vollständig: {6/9} = {2/3} und {8/12} = {2/3}.', 'Gleiches Ergebnis → *gleichwertig*! ✓', '{2/3} und {3/4}? Verschieden → *nicht* gleichwertig.'] },
      { t: 'example', title: 'Auf einen bestimmten Zähler kürzen', lines: ['{18/24} = {3/?}', 'Wie wird aus 18 die 3?  18 : 3 = [6] – das ist die Kürzungszahl.', 'Nenner: 24 : 6 = [4]  →  {18/24} = {3/4}'] },
      { t: 'example', title: 'Tabellen', lines: ['{2/5} erweitert mit 2, 3 und 4:', '{2/5} → {4/10},  {6/15},  {8/20}', 'In jeder Spalte: Zähler *und* Nenner mit der Zahl oben mal nehmen.', 'Beim Kürzen: durch die Zahl oben teilen.'] },
      { t: 'explain', title: 'Versteckt gleichwertig', lines: ['{15/25} = {?/10}?', 'Von 25 kommt man nicht direkt auf 10.', 'Erst kürzen: {15/25} = {3/5}. Dann erweitern: {3/5} = {6/10}.', 'Also {15/25} = {6/10}.'], visual: B([[15, 25], [3, 5], [6, 10]], { lines: true }) },
      { t: 'guided', task: { gen: 'erw_luecke', level: 1 } },
      { t: 'guided', task: { gen: 'tabelle_erw', level: 1 } },
      { t: 'self', tasks: [{ gen: 'kuerz_luecke', level: 1 }, { gen: 'gleichwertig_wahl', level: 1 }, { gen: 'gleichwertig_bild', level: 2 }, { gen: 'zahlenstrahl', level: 1 }, { gen: 'tabelle_kuerz', level: 1 }, { gen: 'tabelle_erw', level: 2 }, { gen: 'warum2', level: 1, params: { id: 'gleichwertig-warum', o: 0 } }] },
      { t: 'rule', title: 'Kurz gemerkt', lines: ['Gleichwertig = gleich viel, nur anders geschrieben.', 'Prüfen: beide vollständig kürzen.', 'Auf einen Nenner oder Zähler: erst die Erweiterungs- oder Kürzungszahl finden, dann den anderen Teil damit rechnen.'] },
      { t: 'review' }
    ],
    L: [
      { t: 'explain', title: 'Halbe und Drittel', robin: 'Mia hat {1/2} Pizza, Ben hat {1/3}. Robin fragt: „Wer hat mehr – und wie viel?“',
        lines: ['Halbe und Drittel sind *verschieden große* Stücke. So kann man schlecht zählen.', 'Wir schneiden *beide* in *Sechstel*: {1/2} = {3/6} und {1/3} = {2/6}.', 'Jetzt sind alle Stücke gleich groß: Mia hat 3 Sechstel, Ben 2 Sechstel.'],
        visual: B([[1, 2, 3], [1, 3, 2]]) },
      { t: 'rule', title: 'Gleichnamig machen', lines: ['*Gleichnamig* heißt: gleicher Nenner.', 'Der gemeinsame Nenner muss durch *beide* Nenner teilbar sein.', 'Dann wird jeder Bruch auf diesen Nenner erweitert.'] },
      { t: 'example', title: 'Weg 1: Nenner malnehmen', lines: ['{2/3} und {3/5}', '3 · 5 = [15] – das geht immer.', '{2/3} = {2 · 5/3 · 5} = {10/15}', '{3/5} = {3 · 3/5 · 3} = {9/15}'], visual: B([[2, 3, 5], [3, 5, 3]]) },
      { t: 'walk', title: 'Weg 2: das kleinste gemeinsame Vielfache (kgV)', steps: [
        { line: '{5/6} und {7/9}: 6 · 9 = 54 – das geht, aber die Zahlen werden groß.' },
        { line: 'Vielfache von 9: 9, *18*, 27, 36 …' },
        { line: 'Ist 18 auch durch 6 teilbar?  18 : 6 = 3 ✓' },
        { line: '18 ist das *kleinste gemeinsame Vielfache* (kgV) von 6 und 9 – der kleinste gemeinsame Nenner.' },
        { line: '{5/6} = {5 · 3/6 · 3} = {15/18}   und   {7/9} = {7 · 2/9 · 2} = {14/18}', visual: B([[5, 6, 3], [7, 9, 2]]) }] },
      { t: 'explain', title: 'Tipp: Ein Nenner passt schon', lines: ['{3/4} und {5/8}: 8 ist durch 4 teilbar.', 'Nur {3/4} wird erweitert: {3/4} = {6/8}.', '{5/8} bleibt, wie es ist.'], visual: B([[3, 4, 2], [5, 8]]) },
      { t: 'rule', title: 'Welcher Weg?', lines: ['Nenner malnehmen klappt *immer*.', 'Mit dem kgV werden die Zahlen oft kleiner.', 'Am Anfang zählt: *verstehen*, nicht Tempo.'] },
      { t: 'guided', task: { gen: 'gleichnamig', level: 1, params: { ds: [2, 3], ns: [1, 1] } } },
      { t: 'self', tasks: [{ gen: 'kgv_nenner', level: 1 }, { gen: 'gleichnamig', level: 1 }, { gen: 'gleichnamig', level: 2 }, { gen: 'kgv_nenner', level: 2 }, { gen: 'warum2', level: 1, params: { id: 'hn-teilbar', o: 1 } }, { gen: 'warum2', level: 1, params: { id: 'kgv-warum', o: 2 } }] },
      { t: 'rule', title: 'Kurz gemerkt', lines: ['Gemeinsamer Nenner = durch *alle* Nenner teilbar.', 'Sicher: Nenner malnehmen. Geschickt: kgV.', 'Zähler *mit* erweitern – sonst ändert sich der Wert!'] },
      { t: 'review' }
    ],
    M: [
      { t: 'explain', title: 'Gleiche Nenner', lines: ['{3/8} und {5/8}: Beide sind Achtel – die Stücke sind *gleich groß*.', '5 Stücke sind mehr als 3 Stücke.', '{3/8} < {5/8}', 'Bei gleichen Nennern ist der Bruch mit dem *größeren Zähler* größer.'], visual: B([[3, 8], [5, 8]], { lines: true }) },
      { t: 'explain', title: 'Gleiche Zähler', lines: ['{3/4} und {3/7}: Beide Male *3 Stücke*.', 'Ein Ganzes in 4 Teile → große Stücke. In 7 Teile → kleine Stücke.', 'Je *weniger* Teile, desto *größer* ist jedes Stück.', '{3/4} > {3/7} – obwohl 7 größer ist als 4!'], visual: B([[3, 4], [3, 7]], { lines: true }) },
      { t: 'rule', title: 'Das Zeichen', lines: ['< heißt „ist kleiner als“, > heißt „ist größer als“.', 'Die *offene Seite* zeigt immer zum *größeren* Bruch.', '{3/8} < {5/8}      {3/4} > {3/7}'] },
      { t: 'walk', title: 'Verschiedene Nenner: {3/4} oder {5/6}?', steps: [
        { line: '1. Schau auf die Nenner: 4 und 6. Viertel und Sechstel sind *verschieden groß* – direkt vergleichen geht nicht.', visual: B([[3, 4], [5, 6]]) },
        { line: '2. Finde einen gemeinsamen Nenner: [12] ist durch 4 *und* durch 6 teilbar.', visual: B([[3, 4], [5, 6]]) },
        { line: '3. Erweitere {3/4}: {3/4} = {3 · 3/4 · 3} = {9/12}', visual: B([[3, 4, 3], [5, 6]]) },
        { line: '4. Erweitere {5/6}: {5/6} = {5 · 2/6 · 2} = {10/12}', visual: B([[3, 4, 3], [5, 6, 2]]) },
        { line: '5. Vergleiche: {9/12} < {10/12} – 9 gleich große Stücke sind weniger als 10.', visual: B([[9, 12], [10, 12]], { lines: true }) },
        { line: '6. Also: {3/4} < {5/6}', visual: B([[3, 4, 3], [5, 6, 2]], { lines: true }) }] },
      { t: 'rule', title: 'Warum klappt das?', lines: ['Nach dem Erweitern sind *alle Stücke gleich groß*.', 'Deshalb können wir die Zähler direkt vergleichen.', 'Und der Wert der Brüche hat sich beim Erweitern nicht verändert.'] },
      { t: 'explain', title: 'Schätzen mit der Hälfte', lines: ['{3/7} oder {5/9}?', '{3/7}: Die Hälfte von 7 Stücken wären 3½ – 3 ist *weniger* → {3/7} < {1/2}.', '{5/9}: Die Hälfte von 9 Stücken wären 4½ – 5 ist *mehr* → {5/9} > {1/2}.', 'Also {3/7} < {5/9}. So prüfst du, ob dein Ergebnis stimmen kann.'],
        visual: { type: 'numline', max: 1, ticks: [2], marks: [{ n: 3, d: 7, col: 0 }, { n: 5, d: 9, col: 1, below: true }] } },
      { t: 'explain', title: 'Mehr als ein Ganzes', lines: ['{7/4} oder {5/3}? Beide sind mehr als 1.', '{7/4} = {1 3/4} und {5/3} = {1 2/3}. Die Ganzen sind gleich.', 'Vergleiche die Reste: {3/4} = {9/12} und {2/3} = {8/12}.', 'Also {7/4} > {5/3}.'],
        visual: { type: 'numline', max: 2, ticks: [12], marks: [{ n: 7, d: 4, col: 0 }, { n: 5, d: 3, col: 1, below: true }] } },
      { t: 'guided', task: { gen: 'vergleich_schritte', level: 1, params: { kind: 'verschieden', a: [3, 4], b: [5, 6], mix: 0, why: true, o: 1 } } },
      { t: 'self', tasks: [{ gen: 'vergleich_wahl', level: 1, want: 'nenner' }, { gen: 'vergleich_wahl', level: 1, want: 'zaehler' }, { gen: 'vergleich_schritte', level: 2 }, { gen: 'vergleich_sach', level: 1 },
        { gen: 'vgl_fehler', level: 1, params: { v: 'nenner', who: 3, a: 2, b: 3, k: 2, o: 0, o2: 0, n: 3, d1: 4, d2: 5 } }, { gen: 'vergleich_wahl', level: 2 }, { gen: 'warum2', level: 1, params: { id: 'groesserer-nenner', o: 1 } }] },
      { t: 'rule', title: 'Kurz gemerkt', lines: ['Gleiche Nenner → Zähler vergleichen.', 'Gleiche Zähler → kleinerer Nenner = größere Stücke = größerer Bruch.', 'Sonst → erst *gleichnamig* machen, dann Zähler vergleichen.'] },
      { t: 'review' }
    ],
    N: [
      { t: 'explain', title: 'Von klein nach groß', lines: ['Ordne: {1/2}, {3/4}, {2/3}, {5/6}', 'Gemeinsamer Nenner: [12].', '{6/12},  {9/12},  {8/12},  {10/12}', 'Nach den Zählern ordnen: 6 < 8 < 9 < 10', '→ {1/2} < {2/3} < {3/4} < {5/6}'],
        visual: B([[1, 2], [2, 3], [3, 4], [5, 6]]) },
      { t: 'explain', title: 'Gleich große Brüche', lines: ['{1/4}, {2/4}, {1/2}, {3/4}', '{2/4} und {1/2} sind *gleich groß*. Sie stehen direkt nebeneinander:', '{1/4} < {2/4} = {1/2} < {3/4}'], visual: B([[1, 4], [2, 4], [1, 2], [3, 4]]) },
      { t: 'rule', title: 'Aufsteigend & absteigend', lines: ['*aufsteigend*: vom kleinsten zum größten – mit <', '*absteigend*: vom größten zum kleinsten – mit >', 'Tipp: Prüfe am Ende jedes Paar, das nebeneinandersteht.'] },
      { t: 'guided', task: { gen: 'ordnen', level: 1 } },
      { t: 'self', tasks: [{ gen: 'ordnen', level: 1 }, { gen: 'ordnen', level: 2 }, { gen: 'zahlenstrahl', level: 2 }, { gen: 'ordnen', level: 2 }, { gen: 'warum2', level: 1, params: { id: 'ordnen-gleich', o: 2 } }] },
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
      if (st.t === 'walk') return walk(st, dots);
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
    // worked example: one step per tap, the picture follows the step
    function walk(st, dots) {
      var j = 0, card = h('article', { class: 'lesson card walk' });
      card.appendChild(h('p', { class: 'kicker', text: 'Beispiel – Schritt für Schritt' }));
      card.appendChild(h('div', { class: 'lesson-top' }, [h('h2', { rich: st.title }), U.readButton(function () { return st.steps.slice(0, j + 1).map(function (x) { return x.line; }).join('. '); })]));
      if (st.robin) card.appendChild(U.robinSays(app.robin('normal', 56), st.robin));
      var list = h('ol', { class: 'walk-lines' }), pic = h('div', { class: 'lesson-pics walk-pic' }), nav = h('div', { class: 'row lesson-nav' });
      card.appendChild(h('div', { class: 'lesson-body with-pic' }, [list, pic]));
      card.appendChild(nav);
      function show() {
        list.innerHTML = '';
        st.steps.slice(0, j + 1).forEach(function (x, k) { list.appendChild(h('li', { class: k === j ? 'now' : 'done', rich: x.line })); });
        var v = null; for (var k = j; k >= 0 && !v; k--) v = st.steps[k].visual;
        pic.innerHTML = ''; if (v) pic.appendChild(D.render(v)); pic.hidden = !v;
        nav.innerHTML = '';
        if (i > 0 || j > 0) nav.appendChild(h('button', { class: 'btn soft', type: 'button', text: '‹ Zurück', onclick: function () { if (j > 0) { j--; show(); } else { i--; render(); } } }));
        var more = j < st.steps.length - 1;
        var nb = h('button', { class: 'btn primary', type: 'button', text: more ? 'Nächster Schritt ›' : 'Weiter ›', onclick: function () { if (more) { j++; show(); } else { i++; render(); } } });
        nav.appendChild(nb);
        setTimeout(function () { try { nb.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 40);
      }
      app.setView(h('section', { class: 'lesson-wrap' }, [h('h1', { class: 'screen-h', text: mod.icon + ' ' + mod.title }), dots, card]), { back: true });
      show();
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
