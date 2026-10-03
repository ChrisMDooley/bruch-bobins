/*
 * ctx.js — the real things in the tasks: what is shared, who shares it, quantities with units.
 * Grammar is stored with each word so sentences come out right ("3/4 einer Pizza", "1 1/2 Äpfel").
 */
(function (root) {
  'use strict';

  // kind = how it is drawn (draw.js): pies are cut into wedges, bars into slices.
  var ITEMS = {
    pizza:       { sg: 'Pizza',            pl: 'Pizzen',            g: 'f', gen: 'einer Pizza',         kind: 'pizza' },
    kuchen:      { sg: 'Kuchen',           pl: 'Kuchen',            g: 'm', gen: 'eines Kuchens',       kind: 'kuchen' },
    pfannkuchen: { sg: 'Pfannkuchen',      pl: 'Pfannkuchen',       g: 'm', gen: 'eines Pfannkuchens',  kind: 'pfannkuchen' },
    apfel:       { sg: 'Apfel',            pl: 'Äpfel',             g: 'm', gen: 'eines Apfels',        kind: 'apfel' },
    birne:       { sg: 'Birne',            pl: 'Birnen',            g: 'f', gen: 'einer Birne',         kind: 'birne' },
    broetchen:   { sg: 'Brötchen',         pl: 'Brötchen',          g: 'n', gen: 'eines Brötchens',     kind: 'broetchen' },
    baguette:    { sg: 'Baguette',         pl: 'Baguettes',         g: 'n', gen: 'eines Baguettes',     kind: 'baguette' },
    schokolade:  { sg: 'Tafel Schokolade', pl: 'Tafeln Schokolade', g: 'f', gen: 'einer Tafel',         kind: 'schokolade' },
    blatt:       { sg: 'Blatt Papier',     pl: 'Blätter Papier',    g: 'n', gen: 'eines Blattes',       kind: 'blatt' },
    waffel:      { sg: 'Waffel',           pl: 'Waffeln',           g: 'f', gen: 'einer Waffel',        kind: 'waffel' }
  };
  var ITEM_IDS = Object.keys(ITEMS);
  var PIE = { pizza: 1, kuchen: 1, pfannkuchen: 1, apfel: 1, birne: 1, waffel: 1, kreis: 1 };

  var PEOPLE = [
    { pl: 'Kinder',   each: 'jedes Kind',    eachD: 'jedes Kind' },
    { pl: 'Freunde',  each: 'jeder',         eachD: 'jeder Freund' },
    { pl: 'Personen', each: 'jede Person',   eachD: 'jede Person' }
  ];
  // A few names for stories (fictional, not classmates).
  var NAMES = ['Mia', 'Ben', 'Lea', 'Tom', 'Emma', 'Paul', 'Lina', 'Jonas', 'Sophie', 'Finn', 'Nele', 'Max'];

  // Units: factor = how many small units are one big unit.
  var UNITS = {
    kg: { big: 'kg', small: 'g',  f: 1000, skill: 'kg',    bigW: 'Kilogramm', smallW: 'Gramm', smallDat: 'Gramm' },
    l:  { big: 'l',  small: 'ml', f: 1000, skill: 'liter', bigW: 'Liter',     smallW: 'Milliliter', smallDat: 'Millilitern' },
    km: { big: 'km', small: 'm',  f: 1000, skill: 'km',    bigW: 'Kilometer', smallW: 'Meter', smallDat: 'Metern' },
    m:  { big: 'm',  small: 'cm', f: 100,  skill: 'km',    bigW: 'Meter',     smallW: 'Zentimeter', smallDat: 'Zentimetern' },
    '€':{ big: '€',  small: 'ct', f: 100,  skill: 'geld',  bigW: 'Euro',      smallW: 'Cent', smallDat: 'Cent' },
    h:  { big: 'h',  small: 'min',f: 60,   skill: 'zeit',  bigW: 'Stunden',   smallW: 'Minuten', smallDat: 'Minuten' }
  };

  // Stories for "Größe : Anzahl" (einheit_teilen). {Q} big quantity with unit, {k} the number of parts.
  // ask: what one part is called. All checked for sensible sizes in tests.
  var SPLITS = {
    kg: [
      { t: '[{Q}] Kartoffeln werden gleichmäßig in [{k}] Tüten gefüllt.', ask: 'Wie schwer ist eine Tüte?', part: 'Tüte' },
      { t: 'Ein Sack Hundefutter wiegt [{Q}]. Er reicht für Robin genau [{k}] Tage.', ask: 'Wie viel frisst Robin an einem Tag?', part: 'Tag' },
      { t: '[{Q}] Nüsse werden gerecht auf [{k}] Kinder verteilt.', ask: 'Wie viel bekommt jedes Kind?', part: 'Kind' },
      { t: '[{Q}] Mehl werden auf [{k}] gleiche Kuchen verteilt.', ask: 'Wie viel Mehl kommt in einen Kuchen?', part: 'Kuchen' }
    ],
    l: [
      { t: '[{Q}] Saft werden gleichmäßig auf [{k}] Gläser verteilt.', ask: 'Wie viel kommt in ein Glas?', part: 'Glas' },
      { t: 'In einer Flasche sind [{Q}] Badezusatz. Das reicht für [{k}] Schaumbäder.', ask: 'Wie viel nimmt man für ein Bad?', part: 'Bad' },
      { t: '[{Q}] Milch reichen für [{k}] gleich große Portionen Pfannkuchenteig.', ask: 'Wie viel Milch ist in einer Portion?', part: 'Portion' },
      { t: '[{Q}] Wasser werden gerecht auf [{k}] Trinkflaschen verteilt.', ask: 'Wie viel kommt in eine Flasche?', part: 'Flasche' }
    ],
    km: [
      { t: 'Der Schulweg ist [{Q}] lang. Er wird in [{k}] gleich lange Abschnitte geteilt.', ask: 'Wie lang ist ein Abschnitt?', part: 'Abschnitt' },
      { t: 'Robin und Papa laufen [{Q}]. Sie machen [{k}] gleich lange Runden.', ask: 'Wie lang ist eine Runde?', part: 'Runde' },
      { t: 'Eine Radtour von [{Q}] hat [{k}] gleich lange Etappen.', ask: 'Wie lang ist eine Etappe?', part: 'Etappe' }
    ],
    m: [
      { t: '[{Q}] Geschenkband werden in [{k}] gleich lange Stücke geschnitten.', ask: 'Wie lang ist ein Stück?', part: 'Stück' },
      { t: 'Ein Regal ist [{Q}] breit und hat [{k}] gleich breite Fächer.', ask: 'Wie breit ist ein Fach?', part: 'Fach' }
    ],
    '€': [
      { t: '[{Q}] werden gerecht auf [{k}] Kinder verteilt.', ask: 'Wie viel bekommt jedes Kind?', part: 'Kind' },
      { t: 'Für ein Geschenk legen [{k}] Kinder zusammen. Es kostet [{Q}].', ask: 'Wie viel zahlt jedes Kind?', part: 'Kind' }
    ],
    h: [
      { t: 'Ein Ausflug dauert [{Q}]. Er hat [{k}] gleich lange Abschnitte.', ask: 'Wie lang dauert ein Abschnitt?', part: 'Abschnitt' },
      { t: 'In [{Q}] werden [{k}] gleich lange Spiele gespielt.', ask: 'Wie lange dauert ein Spiel?', part: 'Spiel' }
    ]
  };

  root.BB = root.BB || {};
  root.BB.ctx = { ITEMS: ITEMS, ITEM_IDS: ITEM_IDS, PIE: PIE, PEOPLE: PEOPLE, NAMES: NAMES, UNITS: UNITS, SPLITS: SPLITS };
})(typeof window !== 'undefined' ? window : globalThis);
