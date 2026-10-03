# Bruch-Bobins 🍕

Lukas's fractions app (Klasse 6, Kapitel 1.4/1.5: *Bruch als Anteil – echte und unechte Brüche*,
*Bruch als Division*). It teaches first, then practises — always **concrete → picture → maths**:
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
| 🔁 Üben | any topic, or mixed (Robin picks what is needed) |
| ⚡ Schnelltraining | 8 short tasks; stopwatch only if he wants it |
| 🌍 Sachaufgaben / 🖼️ Bildtraining | only word problems / only pictures |
| 📝 Prüfungstraining | 12 mixed tasks, no help and no feedback until the end, then "Fehler verbessern" with help |
| 🎯 Fehlertraining | his own mistakes again (the exact task first, then similar ones) |
| 📏 Streifentafel | the worksheet's strip table, interactive: tap a mark → {1/2} = {2/4} = {3/6} … Also available as help inside tasks. |
| ✂️ Verteil-Werkstatt | cut pizzas/cakes/chocolate any way; see whether it is fair; different ways, same result |

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
Equivalent answers (6/8 for 3/4) count as right; Kürzen/Erweitern is not required yet (next chapter).

## Code

```
js/frac.js        exact fractions (integers only, 2/4 = 1/2 by cross-multiplication)
js/text.js        German number/fraction words for read-aloud, the {3/4} [3 kg] *bold* markup
js/model.js       16 skills, error types, modules        js/ctx.js     things, people, units, stories
js/gens-core.js   task generators A–D + answer checking  js/gens-world.js  sharing, units, jug, money, shopping
js/gens-why.js    "Warum stimmt das?" explanations       js/progress.js  mastery, levels, spaced repetition, coins
js/session.js     which task next (all modes)            js/practice.js  the task runner (hints, feedback)
js/draw.js        SVG pictures  js/share.js workshop  js/strips.js Streifentafel  js/widgets.js answer inputs
js/lessons.js     modules A–H   js/screens.js home, menus, parent page   js/app.js routing, coins
js/platform.js    the only contact with Robin's Bobins (family or guest)
rb-card.js        line on the Robin's Bobins card
```

Generators are reusable and validated: `build(params)` is deterministic (a task can be rebuilt exactly
for Fehlertraining), every task knows its right answer programmatically, and the tests generate
thousands of tasks per generator and level.

Tests: `node tests/gens.test.js` (≈200k checks) · `node tests/logic.test.js` (progress, sessions, coins,
a 14-day simulated learner) · `python3 tests/e2e.py <shots-dir> --with-platform ../robins-bobins`
(whole app in Chromium, desktop/phone/tablet, launched from Robin's Bobins and as a guest).

## Robin's Bobins

- Listed in `robins-bobins/apps/registry.js` (`url: '../bruch-bobins/'`, granted to Lukas once) and in
  `robins-bobins/shared/guest.js` for guests.
- **Robin-Münzen** on the same family balance (app `bruch`): 1 per task he gets to himself (also with
  hints), +1 for correcting a mistake himself, +1 per 5 right in a row, +5 Heute üben, +3 other rounds,
  +4 Fehlertraining, +3 per module (once), +5 when a topic becomes "sicher" (once). Never taken away.
  No farming: easy tasks of a topic that is already "sicher" pay nothing, and per-task coins are
  capped at 60 a day.
- Progress: `localStorage['bruch-bobins:<child>']`, on this device; included in the family backup.
- Parent page: practice time, tasks, % right at first try, corrected after mistakes, hints, streak,
  coins, state per topic ("sicher" only after enough tasks), recurring misconceptions, last 7 days,
  countdown date (default 19.10.2026 = Schulbeginn; set the Klassenarbeit date when known).
