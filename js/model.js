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
    { id: 'warum',     label: 'Begründen („Warum stimmt das?“)',      group: 'Anwenden' },
    // ---- Kapitel 2: Erweitern, Kürzen, Vergleichen (bettermarks 26.10.2026)
    { id: 'erweitern',    label: 'Brüche erweitern',                              group: 'Erweitern & Kürzen', unit: 'k2' },
    { id: 'kuerzen',      label: 'Brüche kürzen',                                 group: 'Erweitern & Kürzen', unit: 'k2' },
    { id: 'vollstaendig', label: 'Vollständig kürzen (ggT)',                      group: 'Erweitern & Kürzen', unit: 'k2' },
    { id: 'faktor',       label: 'Erweiterungs- & Kürzungszahl bestimmen',        group: 'Erweitern & Kürzen', unit: 'k2' },
    { id: 'zielnenner',   label: 'Auf vorgegebenen Nenner/Zähler erweitern & kürzen', group: 'Erweitern & Kürzen', unit: 'k2' },
    { id: 'tabelle',      label: 'Brüche in Tabellen erweitern & kürzen',         group: 'Erweitern & Kürzen', unit: 'k2' },
    { id: 'gleichwertig', label: 'Gleichwertige Brüche erkennen (auch in Bildern)', group: 'Erweitern & Kürzen', unit: 'k2' },
    { id: 'gleichnamig',  label: 'Brüche gleichnamig machen',                     group: 'Brüche vergleichen', unit: 'k2' },
    { id: 'vergleichen',  label: 'Brüche vergleichen',                            group: 'Brüche vergleichen', unit: 'k2' },
    { id: 'ordnen',       label: 'Brüche ordnen',                                 group: 'Brüche vergleichen', unit: 'k2' },
    { id: 'vgl_warum',    label: 'Begründen & Fehler finden (Erweitern, Vergleichen)', group: 'Brüche vergleichen', unit: 'k2' }
  ];
  SKILLS.forEach(function (s) { s.unit = s.unit || 'k1'; });

  // Start weights from Lukas's bettermarks results (26.10.2026): a little more practice at first where a point
  // was lost (Tabellen erweitern 3/4, auf vorgegebenen Nenner/Zähler kürzen 16/18, kürzen 11/12) and for
  // comparing / reasoning (the priority). Used only while a skill has little data of its own (progress.weight),
  // so one bettermarks session never labels anything a weakness for good.
  var PRIORITY = { tabelle: 1.35, zielnenner: 1.35, kuerzen: 1.15, gleichnamig: 1.2, vergleichen: 1.45, ordnen: 1.2, vgl_warum: 1.35 };

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
    // Kapitel 2
    nuroben:   { label: 'nur Zähler oder nur Nenner verändert',     say: 'Beim Erweitern oder Kürzen wird manchmal nur der Zähler oder nur der Nenner verändert' },
    ungleich:  { label: 'Zähler und Nenner mit verschiedenen Zahlen', say: 'Zähler und Nenner werden manchmal mit verschiedenen Zahlen multipliziert oder geteilt' },
    addiert:   { label: 'addiert statt multipliziert',             say: 'Beim Erweitern oder Kürzen wird manchmal addiert oder subtrahiert statt multipliziert oder geteilt' },
    kuerzerw:  { label: 'Kürzen und Erweitern verwechselt',        say: 'Kürzen und Erweitern werden manchmal verwechselt' },
    nichtvoll: { label: 'nicht vollständig gekürzt',               say: 'Brüche werden manchmal nicht vollständig gekürzt (ein gemeinsamer Teiler bleibt übrig)' },
    faktor:    { label: 'falsche Erweiterungs- oder Kürzungszahl', say: 'Die Erweiterungs- oder Kürzungszahl wird manchmal falsch bestimmt' },
    gleichwertig: { label: 'gleichwertige Brüche nicht erkannt',   say: 'Gleichwertige Brüche werden manchmal nicht erkannt' },
    hauptnenner:  { label: 'kein gemeinsamer Nenner',              say: 'Als gemeinsamer Nenner wird manchmal eine Zahl gewählt, die nicht durch beide Nenner teilbar ist' },
    kgv:       { label: 'nicht der kleinste gemeinsame Nenner',    say: 'Statt des kleinsten gemeinsamen Nenners wird manchmal ein größerer gewählt' },
    hnzaehler: { label: 'gemeinsamer Nenner richtig, Zähler falsch', say: 'Der gemeinsame Nenner stimmt oft, aber die Zähler werden nicht passend mit erweitert' },
    nennergroesser: { label: 'größerer Nenner = größerer Bruch?',  say: 'Es wird manchmal angenommen, dass ein größerer Nenner einen größeren Bruch bedeutet' },
    zaehlervgl: { label: 'nur Zähler verglichen',                  say: 'Brüche werden manchmal nur über die Zähler verglichen, ohne sie gleichnamig zu machen' },
    zeichen:   { label: '< und > vertauscht',                      say: 'Die Zeichen < und > werden manchmal vertauscht' },
    gleichordnen: { label: 'gleich große Brüche beim Ordnen getrennt', say: 'Gleich große Brüche werden beim Ordnen manchmal nicht nebeneinander gestellt' },
    vergleich: { label: 'Brüche falsch verglichen',                say: 'Beim Vergleichen von Brüchen passieren Fehler' },
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
    { id: 'H', title: 'Geld & Einkaufen',             icon: '🛒', skills: ['geld', 'sach'] },
    // Kapitel 2 (the current topic at school)
    { id: 'I', title: 'Brüche erweitern',                 icon: '🍫', skills: ['erweitern', 'faktor'], unit: 'k2' },
    { id: 'J', title: 'Brüche kürzen',                    icon: '🧩', skills: ['kuerzen', 'vollstaendig', 'faktor'], unit: 'k2' },
    { id: 'K', title: 'Gleichwertige Brüche',             icon: '🟰', skills: ['gleichwertig', 'zielnenner', 'tabelle'], unit: 'k2' },
    { id: 'L', title: 'Gleichnamig machen',               icon: '📐', skills: ['gleichnamig'], unit: 'k2' },
    { id: 'M', title: 'Brüche vergleichen',               icon: '🆚', skills: ['vergleichen', 'vgl_warum'], unit: 'k2' },
    { id: 'N', title: 'Brüche ordnen',                    icon: '🪜', skills: ['ordnen'], unit: 'k2' }
  ];
  MODULES.forEach(function (m) { m.unit = m.unit || 'k1'; });
  var UNITS = {
    k1: { id: 'k1', title: 'Kapitel 1 · Brüche verstehen', short: 'Brüche verstehen (Kapitel 1)' },
    k2: { id: 'k2', title: 'Kapitel 2 · Erweitern, Kürzen, Vergleichen', short: 'Erweitern, Kürzen, Vergleichen (Kapitel 2)' }
  };

  var byId = {}; SKILLS.forEach(function (s) { byId[s.id] = s; });
  var modById = {}; MODULES.forEach(function (m) { modById[m.id] = m; });

  root.BB = root.BB || {};
  root.BB.model = { SKILLS: SKILLS, ERRORS: ERRORS, MODULES: MODULES, UNITS: UNITS, PRIORITY: PRIORITY,
    skill: function (id) { return byId[id]; }, module: function (id) { return modById[id]; },
    unitOf: function (id) { return (byId[id] || {}).unit || 'k1'; },
    skillsOf: function (unit) { return SKILLS.filter(function (s) { return s.unit === unit; }).map(function (s) { return s.id; }); } };
})(typeof window !== 'undefined' ? window : globalThis);
