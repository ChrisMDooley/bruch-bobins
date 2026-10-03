/*
 * model.js — skills, error types, learning modules. No DOM.
 */
(function (root) {
  'use strict';

  // Skills are tracked separately (brief §15). "group" orders them on the parent page.
  var SKILLS = [
    { id: 'zn',        label: 'Zähler & Nenner',                      group: 'Was ist ein Bruch?' },
    { id: 'erkennen',  label: 'Bruch im Bild erkennen',               group: 'Was ist ein Bruch?' },
    { id: 'zeichnen',  label: 'Bruch im Bild markieren',              group: 'Was ist ein Bruch?' },
    { id: 'echt',      label: 'Echte & unechte Brüche',               group: 'Echte & unechte Brüche' },
    { id: 'u2g',       label: 'Unechter Bruch → gemischte Zahl',      group: 'Gemischte Zahlen' },
    { id: 'g2u',       label: 'Gemischte Zahl → unechter Bruch',      group: 'Gemischte Zahlen' },
    { id: 'division',  label: 'Bruch als Division',                   group: 'Bruch als Division' },
    { id: 'verteilen', label: 'Gerecht verteilen',                    group: 'Bruch als Division' },
    { id: 'einheiten', label: 'Einheiten umwandeln vor dem Teilen',   group: 'Größen' },
    { id: 'liter',     label: 'Liter & Milliliter',                   group: 'Größen' },
    { id: 'kg',        label: 'Kilogramm & Gramm',                    group: 'Größen' },
    { id: 'km',        label: 'Längen (km, m, cm)',                   group: 'Größen' },
    { id: 'geld',      label: 'Euro & Cent',                          group: 'Größen' },
    { id: 'zeit',      label: 'Stunden & Minuten',                    group: 'Größen' },
    { id: 'sach',      label: 'Sachaufgaben',                         group: 'Anwenden' },
    { id: 'warum',     label: 'Begründen („Warum stimmt das?“)',      group: 'Anwenden' }
  ];

  // Error types (brief §12). "say" is the parent-page sentence; {ctx} is filled in.
  var ERRORS = {
    swap:    { label: 'Zähler und Nenner vertauscht',            say: 'Zähler und Nenner werden gelegentlich vertauscht' },
    part:    { label: 'gefärbte mit ungefärbten Teilen verglichen', say: 'Beim Ablesen werden manchmal gefärbte mit ungefärbten Teilen verglichen statt mit allen Teilen' },
    count:   { label: 'Teile falsch gezählt',                    say: 'Beim Markieren stimmt die Anzahl der Teile manchmal nicht' },
    equal:   { label: 'ungleiche Teile nicht bemerkt',           say: 'Dass alle Teile gleich groß sein müssen, wird manchmal übersehen' },
    whole:   { label: 'Ganze vergessen',                         say: 'Bei gemischten Zahlen werden manchmal die Ganzen vergessen' },
    mixed:   { label: 'Fehler beim Umwandeln (gemischte Zahl)',  say: 'Beim Umwandeln zwischen unechten Brüchen und gemischten Zahlen passieren Fehler' },
    echt:    { label: 'echt / unecht verwechselt',               say: 'Echte und unechte Brüche werden manchmal verwechselt' },
    divrev:  { label: 'Division vertauscht',                     say: 'Bei Divisionen wird manchmal Dividend und Divisor vertauscht' },
    unit:    { label: 'Einheit nicht (richtig) umgewandelt',     say: 'Beim Umwandeln von Einheiten (z. B. 1 kg = 1000 g) passieren Fehler' },
    unitval: { label: 'richtige Zahl, falsche Einheit',          say: 'Die Zahl stimmt oft, aber die Einheit passt nicht' },
    arith:   { label: 'Rechenfehler',                            say: 'Kleine Rechenfehler beim Teilen oder Malnehmen' },
    concept: { label: 'Begriff verwechselt',                     say: 'Begriffe (Zähler, Nenner, Dividend, Divisor …) werden manchmal verwechselt' },
    reason:  { label: 'Begründung nicht getroffen',              say: 'Begründungen („Warum?“) fallen noch schwer' },
    other:   { label: 'anderer Fehler',                          say: 'Verschiedene andere Fehler' }
  };

  // Learning modules ("Lernen"). Content in lessons.js.
  var MODULES = [
    { id: 'A', title: 'Was ist ein Bruch?',           icon: '🍕', skills: ['zn', 'erkennen', 'zeichnen'] },
    { id: 'B', title: 'Echte & unechte Brüche',       icon: '⚖️', skills: ['echt'] },
    { id: 'C', title: 'Gemischte Zahlen',             icon: '🔄', skills: ['u2g', 'g2u'] },
    { id: 'D', title: 'Bruch als Division',           icon: '➗', skills: ['division'] },
    { id: 'E', title: 'Gerecht verteilen',            icon: '🤝', skills: ['verteilen'] },
    { id: 'F', title: 'Größen: erst umwandeln, dann teilen', icon: '⚖️', skills: ['einheiten', 'kg', 'km', 'zeit'] },
    { id: 'G', title: 'Der Messbecher',               icon: '🧪', skills: ['liter'] },
    { id: 'H', title: 'Geld & Einkaufen',             icon: '🛒', skills: ['geld', 'sach'] }
  ];

  var byId = {}; SKILLS.forEach(function (s) { byId[s.id] = s; });
  var modById = {}; MODULES.forEach(function (m) { modById[m.id] = m; });

  root.BB = root.BB || {};
  root.BB.model = { SKILLS: SKILLS, ERRORS: ERRORS, MODULES: MODULES, skill: function (id) { return byId[id]; }, module: function (id) { return modById[id]; } };
})(typeof window !== 'undefined' ? window : globalThis);
