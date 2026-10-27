# Bruch-Bobins 🍕

Lukas's fractions app (Klasse 6). Kapitel 1 (book 1.4/1.5: *Bruch als Anteil – echte und unechte Brüche*,
*Bruch als Division*) and Kapitel 2 (*Erweitern, Kürzen, gleichwertige Brüche, gleichnamig machen, vergleichen,
ordnen* – from his bettermarks assignments of 26.10.2026). It teaches first, then practises — always **concrete → picture → maths**:
3 pizzas for 4 children → cut them → 3 : 4 → {3/4} → "Jedes Kind bekommt 3/4 einer Pizza".

Part of the **Robin's Bobins** family, but its own app: own code, own tests, own site.

- Live: https://chrismdooley.github.io/bruch-bobins/ (from Robin's Bobins: Lukas → Bruch-Bobins;
  for a classmate: the guest start page `…/robins-bobins/gast/?name=<Name>`)
- Runs on its own too: `python3 -m http.server` in the folder above and open `bruch-bobins/`.

## What Lukas can do

| | |
|---|---|
| ▶ **Heute üben** | 10 tasks (~10–15 min): 2 review · 2 pictures · 2 converting · 2 real-world · 1 "Warum?" · 1 challenge. Spaced repetition brings difficult topics back on later days. |
| 📘 **Lernen** A–H | Was ist ein Bruch? · Echte & unechte Brüche · Gemischte Zahlen · Bruch als Division · Gerecht verteilen · Größen (erst umwandeln, dann teilen) · Messbecher · Geld & Einkaufen. Each: Erklärung → Beispiel → geführte Aufgabe (Robin-Tipp shown) → selbst → Wiederholung. |
| 📘 **Lernen** I–N (Kapitel 2) | Brüche erweitern · Brüche kürzen (schrittweise/direkt, vollständig, ggT) · Gleichwertige Brüche (Bilder, Zahlenstrahl, Tabellen, auf vorgegebenen Nenner/Zähler, versteckt gleichwertig) · Gleichnamig machen (Nenner malnehmen / kgV) · Brüche vergleichen (gleiche Nenner, gleiche Zähler, verschiedene Nenner, Hälfte als Schätzhilfe, > 1) · Brüche ordnen. Worked examples step by step (one step per tap, the picture follows), a short recap at the end. |
| 🔁 Üben | any topic, or mixed (Robin picks what is needed) |
| ⚡ Schnelltraining | 8 short tasks; stopwatch only if he wants it |
| 🌍 Sachaufgaben / 🖼️ Bildtraining | only word problems / only pictures |
| 📝 Prüfungstraining | 12 mixed tasks, no help and no feedback until the end, then "Fehler verbessern" with help |
| 🎯 Fehlertraining | his own mistakes again (the exact task first, then similar ones) |
| 📏 Streifentafel | the worksheet's strip table, interactive: tap a mark → {1/2} = {2/4} = {3/6} … Also available as help inside tasks. |
| ✂️ Verteil-Werkstatt | cut pizzas/cakes/chocolate any way; see whether it is fair; different ways, same result |
| 🔬 Bruch-Labor | *Erweitern & Kürzen*: cut every piece finer (tap the strip) or join pieces; the equation chain {2/3} = {4/6} = {12/18} grows and the point on the number line does not move. *Vergleichen*: two fractions as strips and on the number line, "Gleich große Stücke machen" cuts both to the common denominator. Also as help inside tasks. |

The Streifentafel also has a **compare mode** (tap A, then B: both lines, the strip on which both lie, A < B) and a
number line underneath (equivalent fractions are one point).

Answers by tapping wherever possible: shade pieces, cut and share, fill the measuring jug, fraction /
mixed-number / division boxes, multiple choice (incl. pictures), number with unit, euro amounts.

**Hilf mir** gives 4 graduated hints (a question first, never the answer), then the full solution.
**Wrong answers** are explained by the likely misconception (Zähler/Nenner vertauscht, Ganze vergessen,
Einheit nicht umgewandelt, gefärbt mit ungefärbt verglichen, ungleiche Teile …) and tracked separately.

## Curriculum

From Lukas's book (S. 14–17) and worksheets ("Brüche als Division", "echte & unechte Brüche,
gemischte Schreibweise", "Die Streifentafel"); original tasks, nothing copied. Includes what the material
adds beyond the brief: Stammbruch, natürliche Zahlen als Brüche, 4 : 0 geht nicht, Dividend/Divisor/Quotient,
Pfund, Stunden/Minuten, "Vier Drittel aller Schüler …", Hund Oskar (4 vs 8 Stücke), 2/3 vs 3/2.
Equivalent answers (6/8 for 3/4) count as right wherever only the value is asked; where a form is asked
("erweitere mit 4", "kürze vollständig", a given denominator) the form is checked.

**Kapitel 2** (js/gens-k2.js, 23 generators, 11 skills): erweitern mit k · auf Nenner/Zähler erweitern bzw. kürzen
(also "versteckt": {15/25} = ?/10) · Erweiterungs-/Kürzungszahl bestimmen · erweitert, gekürzt oder Wert verändert? ·
kürzen durch k / frei (every correct reduction counts, a note says when one can go on) · vollständig kürzen, ggT in two
steps, Anteile aus Sachsituationen · gleichwertige Brüche wählen, in Bildern, auf dem Zahlenstrahl · Tabellen erweitern
und kürzen (missing cells, missing column factor, "vollständig" column) · kleinster gemeinsamer Nenner · gleichnamig
machen (any common multiple counts, the next steps adapt to it; a note when the kgV would be smaller) · vergleichen
(< > =), Schritt für Schritt (Nenner → Zähler → Zeichen → Begründung, each step checked on its own), in Sachaufgaben
(Pizza, Schokolade, Saft, Schulweg, Geld, Spiele, Hausaufgaben-Rest) · ordnen (tap cards; drag with a mouse; equal
fractions next to each other in any order; optional strips as help) · "Tom behauptet …" (Hat er recht? Warum?) ·
Warum-Fragen. Three levels each; the level follows mastery, not the number of tasks.

Misconceptions tracked separately (parent page): nur Zähler/Nenner verändert · verschiedene Zahlen oben und unten ·
addiert statt mal genommen · Kürzen/Erweitern verwechselt · nicht vollständig gekürzt · falsche Erweiterungs-/Kürzungszahl ·
kein gemeinsamer Nenner / nicht der kleinste · gemeinsamer Nenner richtig, Zähler falsch · größerer Nenner = größer? ·
nur Zähler verglichen · < und > vertauscht · gleich große Brüche beim Ordnen getrennt. Feedback explains the step
without giving the answer away, many mistakes come with "👀 Zeig es mir im Bild"; after a mistake a similar task
comes later in the same round (max. 2), and Fehlertraining brings the exact task back.

**Schwerpunkt** (parent page, default Kapitel 2): its skills come twice as often in Heute üben (one slot always
compares or makes gleichnamig), Prüfungstraining uses the Kapitel-2 blueprint (12 tasks like a Klassenarbeit);
Kapitel 1 keeps being reviewed. Start weights from the bettermarks results (Tabellen erweitern 3/4, auf vorgegebenen
Nenner/Zähler kürzen 16/18, kürzen 11/12; comparing and reasoning as the priority) fade out after 12 own tasks per skill.

## Code

```
js/frac.js        exact fractions (integers only, 2/4 = 1/2 by cross-multiplication)
js/text.js        German number/fraction words for read-aloud, the {3/4} [3 kg] *bold* markup
js/model.js       27 skills (k1/k2), error types, modules A–N, bettermarks start weights   js/ctx.js  things, people, units
js/gens-k2.js     Kapitel 2 generators + misconception detectors (transformErr, cmpWrong)   js/lab.js  Bruch-Labor
js/gens-core.js   task generators A–D + answer checking  js/gens-world.js  sharing, units, jug, money, shopping
js/gens-why.js    "Warum stimmt das?" explanations       js/progress.js  mastery, levels, spaced repetition, coins
js/session.js     which task next (all modes)            js/practice.js  the task runner (hints, feedback)
js/draw.js        SVG pictures (+ equal-width strips, number line)  js/share.js workshop  js/strips.js Streifentafel
js/widgets.js     answer inputs (+ missing-number boxes, tables, ordering cards)
js/lessons.js     modules A–N (+ step-by-step worked examples)   js/screens.js home, menus, parent page   js/app.js routing, coins
js/platform.js    the only contact with Robin's Bobins (family or guest)
rb-card.js        line on the Robin's Bobins card
```

Generators are reusable and validated: `build(params)` is deterministic (a task can be rebuilt exactly
for Fehlertraining), every task knows its right answer programmatically, and the tests generate
thousands of tasks per generator and level.

Tests: `node tests/gens.test.js` (≈860k checks, incl. each misconception and cross-checks of every comparison,
common denominator and missing number) · `node tests/logic.test.js` (progress, sessions, coins, old saved data,
focus, exam blueprint, check-back tasks, a 14-day and a 21-day simulated learner) · `python3 tests/e2e.py <shots-dir> --with-platform ../robins-bobins`
(whole app in Chromium, desktop/phone/tablet, launched from Robin's Bobins and as a guest).

## Robin's Bobins

- Listed in `robins-bobins/apps/registry.js` (`url: '../bruch-bobins/'`, granted to Lukas once) and in
  `robins-bobins/shared/guest.js` for guests.
- **Robin-Münzen** on the same family balance (app `bruch`): 1 per task he gets to himself (also with
  hints), +1 for correcting a mistake himself, +1 per 5 right in a row, +5 Heute üben, +3 other rounds,
  +4 Fehlertraining, +3 per module (once, also I–N), +5 when a topic becomes "sicher" (once). Never taken away.
  No farming: easy tasks of a topic that is already "sicher" pay nothing, and per-task coins are
  capped at 60 a day.
- Progress: `localStorage['bruch-bobins:<child>']`, on this device; included in the family backup.
- Parent page: practice time, tasks, % right at first try, corrected after mistakes, hints, streak,
  coins, state per topic ("sicher" only after enough tasks), recurring misconceptions, last 7 days,
  countdown date (default 19.10.2026 = Schulbeginn; set the Klassenarbeit date when known).
