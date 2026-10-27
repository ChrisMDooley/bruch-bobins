/*
 * gens-why.js — "Warum stimmt das?" (brief §13). Chosen explanations, no typing:
 * one good reason, plausible half-reasons. Each wrong choice gets its own answer.
 * Several come straight from Lukas's worksheets (Nenner 0, Oskar the dog, "vier Drittel aller Schüler").
 */
(function (root) {
  'use strict';
  var G = root.BB.gens, opt = G.opt, checkChoice = G.checkChoice;

  // { id, q, ok, bad: [[text, answer], …], why (shown after) , tags }
  var BANK = [
    { id: 'nenner-null', q: 'Warum darf im Nenner niemals 0 stehen?',
      ok: 'Der Nenner ist der Divisor – und durch 0 kann man nicht teilen. Man kann nichts auf 0 Kinder verteilen.',
      bad: [['Weil 0 nichts wert ist und der Bruch dann 0 wäre.', 'Ein Bruch ist 0, wenn der *Zähler* 0 ist ({0/5} = 0). Im Nenner geht 0 gar nicht, weil man nicht durch 0 teilen kann.'],
            ['Weil es sonst keinen Bruch geben würde.', 'Das stimmt, sagt aber nicht *warum*. Der Grund: Der Bruchstrich bedeutet „geteilt durch“, und durch 0 kann man nicht teilen.']] },
    { id: 'unecht-def', q: 'Warum ist {7/4} ein unechter Bruch?',
      ok: 'Weil der Zähler größer als der Nenner ist: 7 Viertel sind mehr als ein Ganzes ({4/4}).',
      bad: [['Weil der Nenner gerade ist.', 'Ob gerade oder ungerade, spielt keine Rolle. Es kommt darauf an, ob der Zähler mindestens so groß wie der Nenner ist.'],
            ['Weil man ihn nicht kürzen kann.', 'Kürzen hat damit nichts zu tun. {7/4} ist unecht, weil 7 Viertel mehr als ein Ganzes sind.']] },
    { id: 'unecht-mehr', q: 'Warum kann ein unechter Bruch wie {5/4} nicht in *einen* Kreis passen?',
      ok: 'Ein Kreis hat nur 4 Viertel. Für 5 Viertel braucht man einen zweiten Kreis – {5/4} ist mehr als ein Ganzes.',
      bad: [['Weil 5 eine ungerade Zahl ist.', 'Es geht um Zähler und Nenner: 5 Viertel sind mehr als die 4 Viertel eines Kreises.'],
            ['Weil man Kreise nicht in Viertel teilen kann.', 'Doch, das geht (wie eine Uhr). Aber ein Kreis hat eben nur 4 Viertel – 5 passen nicht hinein.']] },
    { id: 'div-warum', q: 'Warum ist 3 : 5 dasselbe wie {3/5}?',
      ok: 'Teilt man 3 Ganze auf 5 gleich auf, bekommt jeder 3 Fünftel. Der Bruchstrich ist nur eine andere Schreibweise für „:“.',
      bad: [['Weil man die Zahlen einfach übereinander schreiben darf.', 'Das „Darf“ hat einen Grund: Jeder bekommt von jedem der 3 Ganzen ein Fünftel – zusammen {3/5}.'],
            ['Weil 3 kleiner als 5 ist.', 'Das gilt auch für 7 : 5 = {7/5}. Der Grund ist das Verteilen: 3 Ganze auf 5 aufgeteilt ergibt 3 Fünftel.']] },
    { id: 'gemischt-warum', q: 'Warum kann man {9/4} als {2 1/4} schreiben?',
      ok: 'Je 4 Viertel ergeben ein Ganzes. In 9 Vierteln stecken 2 Ganze (8 Viertel) und 1 Viertel bleibt übrig: 9 : 4 = 2 Rest 1.',
      bad: [['Weil 9 − 4 − 4 = 1 ist und man die Viertel einfach weglässt.', 'Die Viertel werden nicht weggelassen – 8 Viertel werden zu 2 Ganzen zusammengefasst.'],
            ['Weil 2 + 1 + 4 = 7 ist.', 'Das passt nicht. Richtig: 2 Ganze = 8 Viertel, dazu 1 Viertel = 9 Viertel.']] },
    { id: 'alle-unecht', q: 'Kann man *jeden* unechten Bruch als gemischte Zahl schreiben?',
      ok: 'Ja – außer wenn der Zähler ein Vielfaches des Nenners ist. Dann bleibt kein Rest und es ist eine natürliche Zahl, z. B. {8/4} = 2.',
      bad: [['Ja, immer – man schneidet ihn einfach in 2 Teile.', 'Man schneidet nicht in 2 Teile, man fasst Ganze zusammen. Und ohne Rest (z. B. {8/4}) ist es einfach eine natürliche Zahl.'],
            ['Nein, nur wenn der Nenner 2 ist.', 'Das geht mit jedem Nenner: {7/3} = {2 1/3}, {11/5} = {2 1/5} …']] },
    { id: 'natuerlich', q: 'Welche Brüche sind natürliche Zahlen?',
      ok: 'Brüche, bei denen der Zähler ein Vielfaches des Nenners ist, z. B. {12/4} = 3 oder {10/1} = 10.',
      bad: [['Alle unechten Brüche.', '{7/4} ist unecht, aber keine natürliche Zahl ({1 3/4}). Nur ohne Rest: {8/4} = 2.'],
            ['Brüche mit einer 1 im Zähler.', 'Das sind Stammbrüche wie {1/5} – kleiner als 1, also keine natürliche Zahl.']] },
    { id: 'methoden', q: 'Robin teilt 3 Pizzen auf 4 Kinder: einmal jede Pizza in Viertel, einmal erst jedem eine Hälfte und den Rest in Viertel. Warum bekommt jedes Kind beide Male gleich viel?',
      ok: 'Weil {3/4} und {1/2} + {1/4} gleich viel sind. Die Stücke sehen anders aus, aber die Menge ist dieselbe.',
      bad: [['Weil es bei der zweiten Methode weniger Stücke gibt.', 'Weniger Stücke heißt nicht weniger Pizza: {1/2} + {1/4} ist genauso viel wie {3/4}.'],
            ['Das stimmt nicht – große Stücke sind mehr.', 'Ein großes Stück ({1/2}) und ein kleines ({1/4}) sind zusammen genau {3/4} – wie drei Viertelstücke.']] },
    { id: 'oskar', q: 'Hund Oskar denkt: „Hoffentlich schneiden sie meinen Kuchen in 8 Stücke statt in 4 – dann bekomme ich mehr!“ Hat er recht, wenn er die Hälfte bekommt?',
      ok: 'Nein. {4/8} und {2/4} sind gleich viel – die Stücke sind nur kleiner. Es ist beide Male die Hälfte.',
      bad: [['Ja, 8 Stücke sind mehr als 4.', 'Mehr Stücke – aber jedes ist halb so groß. {4/8} = {2/4} = {1/2}.'],
            ['Ja, weil der Nenner größer ist.', 'Ein größerer Nenner heißt *kleinere* Stücke. Die Hälfte bleibt die Hälfte.']] },
    { id: 'vier-drittel', q: 'Stimmt der Satz: „Vier Drittel aller Schüler haben Schwierigkeiten bei Brüchen.“?',
      ok: 'Nein. Alle Schüler sind {3/3}. {4/3} wäre mehr als alle – das kann es nicht geben.',
      bad: [['Ja, {4/3} ist ein ganz normaler Bruch.', 'Als Zahl schon – aber mehr als *alle* Schüler kann es nicht geben. Alle sind {3/3}.'],
            ['Ja, wenn die Klasse groß genug ist.', 'Auch in einer großen Klasse sind alle Schüler nur {3/3}. {4/3} wäre mehr als alle.']] },
    { id: 'zwei-drittel-drei-halbe', q: 'Was ist der Unterschied zwischen {2/3} und {3/2}?',
      ok: '{2/3} ist weniger als ein Ganzes (2 von 3 Teilen). {3/2} ist mehr als ein Ganzes (3 Hälften = {1 1/2}).',
      bad: [['Es gibt keinen – es sind dieselben Zahlen.', 'Die Zahlen sind gleich, aber vertauscht. {2/3} < 1, {3/2} > 1.'],
            ['{3/2} ist kleiner, weil der Nenner kleiner ist.', 'Ein kleiner Nenner heißt *große* Stücke: 3 Hälften sind {1 1/2}, mehr als {2/3}.']] },
    { id: 'einheit-warum', q: 'Warum rechnet man 3 kg : 4 besser in Gramm?',
      ok: '3 : 4 geht nicht ohne Rest. 3000 g : 4 = 750 g geht glatt – in der kleineren Einheit wird es eine ganze Zahl.',
      bad: [['Weil Gramm genauer sind als Kilogramm.', 'Das Gewicht ist gleich – 3 kg sind 3000 g. Der Vorteil: 3000 lässt sich ohne Rest durch 4 teilen.'],
            ['Weil man kg nicht teilen darf.', 'Man darf: 3 kg : 4 = {3/4} kg. In Gramm sieht man nur leichter, wie viel das ist: 750 g.']] },
    { id: 'gleich-viel', q: 'Warum ist {6/8} l genauso viel wie {3/4} l?',
      ok: 'Beides sind 750 ml. Auf der Streifentafel liegen {6/8} und {3/4} genau an derselben Stelle.',
      bad: [['Weil 6 + 8 = 14 und 3 + 4 = 7 ist.', 'Zähler und Nenner werden nicht addiert. Aber: {6/8} l = 750 ml und {3/4} l = 750 ml.'],
            ['Ist es nicht – {6/8} ist mehr, weil die Zahlen größer sind.', 'Größere Zahlen, aber kleinere Stücke: 6 Achtel = 3 Viertel = 750 ml.']] },
    { id: 'gleich-gross', q: 'Ein Brot wird in 4 Stücke geschnitten, aber die Stücke sind verschieden groß. Ist ein Stück dann {1/4}?',
      ok: 'Nein. Ein Viertel heißt: das Ganze in 4 *gleich große* Teile teilen.',
      bad: [['Ja, es sind ja 4 Stücke.', 'Die Anzahl allein reicht nicht – die Teile müssen gleich groß sein.'],
            ['Nur das größte Stück ist {1/4}.', 'Keins der Stücke ist genau {1/4}, weil sie nicht gleich groß sind.']] },
    { id: 'eins-dividend', q: 'Warum ergibt 1 : 7 einen Stammbruch?',
      ok: 'Der Dividend 1 wird zum Zähler: 1 : 7 = {1/7}. Brüche mit Zähler 1 heißen Stammbrüche.',
      bad: [['Weil 7 eine Primzahl ist.', 'Das spielt keine Rolle: 1 : 8 = {1/8} ist auch ein Stammbruch.'],
            ['Weil das Ergebnis 7 ist.', '1 : 7 ist nicht 7, sondern {1/7} – kleiner als 1.']] }
  ];
  // Kapitel 2: Erweitern, Kürzen, Vergleichen (skill vgl_warum)
  var BANK2 = [
    { id: 'erw-gleich', q: 'Du hast {3/5} mit 3 erweitert: {9/15}. Warum hat sich der Wert *nicht* verändert?',
      ok: 'Jedes Fünftel wurde in 3 gleich große Stücke geschnitten. Es sind dreimal so viele Stücke, aber jedes ist nur ein Drittel so groß – zusammen gleich viel.',
      bad: [['Weil 9 und 15 größere Zahlen sind.', 'Größere Zahlen heißen nicht mehr Wert: mehr Stücke, aber kleinere.'],
            ['Er hat sich verändert – {9/15} ist mehr als {3/5}.', 'Lege beide übereinander (Streifentafel): Sie enden an derselben Stelle. Gleich viel!']] },
    { id: 'erw-vielfach', q: 'Warum kann man {2/3} *nicht* auf den Nenner 10 erweitern?',
      ok: 'Beim Erweitern wird der Nenner mit einer ganzen Zahl mal genommen. 10 ist aber kein Vielfaches von 3 – 3 · ? = 10 geht nicht.',
      bad: [['Weil 10 eine gerade Zahl ist.', 'Auf 6 oder 12 (auch gerade) kann man erweitern. Es kommt darauf an, ob 10 ein Vielfaches von 3 ist.'],
            ['Weil man nur mit 2 erweitern darf.', 'Man darf mit jeder natürlichen Zahl erweitern (außer 0). Nur: 3 · ? = 10 hat keine ganze Lösung.']] },
    { id: 'kuerz-gleich', q: 'Warum bleibt der Wert beim Kürzen gleich?',
      ok: 'Beim Kürzen werden immer gleich viele kleine Stücke zu einem großen zusammengelegt. Es kommt nichts weg und nichts dazu.',
      bad: [['Weil die Zahlen kleiner werden.', 'Kleinere Zahlen – aber größere Stücke. Deshalb bleibt der Wert gleich.'],
            ['Er bleibt nicht gleich, der Bruch wird kleiner.', 'Der Bruch sieht kleiner aus, ist aber gleich viel: {6/8} = {3/4}.']] },
    { id: 'voll-gekuerzt', q: 'Woran erkennst du, dass ein Bruch *vollständig gekürzt* ist?',
      ok: 'Zähler und Nenner haben keinen gemeinsamen Teiler mehr außer 1 – man kann nicht weiter kürzen.',
      bad: [['Wenn der Zähler 1 ist.', '{2/3} ist auch vollständig gekürzt. Es kommt auf gemeinsame Teiler an.'],
            ['Wenn man einmal gekürzt hat.', 'Nach einem Schritt kann noch ein gemeinsamer Teiler übrig sein: {12/18} → {6/9} → {2/3}.']] },
    { id: 'nur-zaehler', q: 'Warum darf man beim Erweitern nicht *nur* den Zähler mal nehmen?',
      ok: 'Dann hätte man mehr Stücke, aber die Stücke wären gleich groß geblieben – der Wert wird größer. Nur wenn auch der Nenner mitwächst, werden die Stücke kleiner.',
      bad: [['Weil der Zähler sonst zu groß wird.', 'Große Zähler sind erlaubt. Das Problem: Der Wert ändert sich.'],
            ['Man darf das – Hauptsache, man nimmt mal.', '{2/3} → {4/3} ist doppelt so viel! Zähler *und* Nenner gehören zusammen.']] },
    { id: 'addieren', q: 'Warum ist {2/3} nicht dasselbe wie {3/4}, obwohl man zu Zähler und Nenner 1 addiert hat?',
      ok: 'Addieren verändert den Wert: {2/3} fehlt {1/3} bis zum Ganzen, {3/4} nur {1/4}. Gleichwertig bleibt ein Bruch nur beim Mal- oder Geteiltrechnen.',
      bad: [['Es ist dasselbe – man hat ja bei beiden 1 addiert.', 'Lege {2/3} und {3/4} auf der Streifentafel übereinander: Sie enden an verschiedenen Stellen.'],
            ['Weil 3 und 4 keine Vielfachen sind.', 'Das klingt richtig, erklärt es aber nicht. Der Grund: Addieren ändert den Wert.']] },
    { id: 'gleichwertig-warum', q: 'Warum sind {6/9} und {8/12} gleichwertig?',
      ok: 'Beide lassen sich zu {2/3} kürzen. Sie sind also gleich viel, nur anders geschrieben.',
      bad: [['Weil 6 + 3 = 9 und 8 + 4 = 12 ist.', 'Plus-Rechnungen sagen nichts über den Wert. Kürze beide: Es kommt {2/3} heraus.'],
            ['Weil beide gerade Zahlen haben.', '{6/9} hat die 9 – das ist ungerade. Der Grund ist: Beide sind {2/3}.']] },
    { id: 'gleichwertig-zahlenstrahl', q: 'Warum liegen {1/2}, {2/4} und {4/8} auf dem Zahlenstrahl an derselben Stelle?',
      ok: 'Sie sind gleich viel. Nur die Strecke von 0 bis 1 ist feiner eingeteilt – der Punkt bleibt, wo er ist.',
      bad: [['Weil alle Nenner gerade sind.', 'Auch {3/6} liegt dort. Der Grund: Alle sind die Hälfte.'],
            ['Das stimmt nicht, {4/8} liegt weiter rechts.', 'Zähle nach: 4 von 8 Abständen ist genau die Mitte – wie 1 von 2.']] },
    { id: 'kgv-warum', q: 'Warum ist 12 ein gemeinsamer Nenner von {3/4} und {5/6}, aber 10 nicht?',
      ok: '12 ist durch 4 *und* durch 6 teilbar. 10 ist nicht durch 4 und nicht durch 6 teilbar – darauf kann man nicht erweitern.',
      bad: [['Weil 4 + 6 = 10 nicht erlaubt ist.', 'Addieren hilft beim gemeinsamen Nenner nie. Er muss durch beide Nenner teilbar sein.'],
            ['Weil 12 größer ist als 10.', 'Größer allein reicht nicht – 14 geht auch nicht. Entscheidend: teilbar durch 4 und durch 6.']] },
    { id: 'gleichnamig-warum', q: 'Warum macht man Brüche gleichnamig, bevor man sie vergleicht?',
      ok: 'Dann sind alle Stücke gleich groß. Erst dann kann man einfach zählen: Wer mehr Stücke hat, hat mehr.',
      bad: [['Weil es schöner aussieht.', 'Es hat einen Grund: Mit gleichen Nennern sind die Stücke gleich groß.'],
            ['Weil man sonst die Nenner vergleichen müsste.', 'Nenner allein sagen nur, wie groß die Stücke sind. Man braucht gleich große Stücke, um zu zählen.']] },
    { id: 'groesserer-nenner', q: 'Warum ist {3/4} größer als {3/7}, obwohl 7 größer als 4 ist?',
      ok: 'Teilt man ein Ganzes in weniger Teile, wird jedes Teil größer. Viertel sind größer als Siebtel – 3 große Stücke sind mehr als 3 kleine.',
      bad: [['Weil man bei Brüchen immer die kleinere Zahl nimmt.', 'Das ist keine Regel. Der Grund ist die Stückgröße.'],
            ['Das stimmt nicht – {3/7} ist größer.', 'Ein Siebtel ist kleiner als ein Viertel. 3 Siebtel sind also weniger als 3 Viertel.']] },
    { id: 'ordnen-gleich', q: 'Beim Ordnen kommen {2/3} und {4/6} vor. Wohin gehören sie?',
      ok: 'Direkt nebeneinander – sie sind gleich groß ({4/6} = {2/3}). Die Reihenfolge der beiden ist egal.',
      bad: [['{4/6} ganz nach hinten, weil 6 der größte Nenner ist.', 'Ein großer Nenner heißt nicht „groß“. {4/6} = {2/3} – gleicher Platz.'],
            ['Einer muss weg, man darf nur einen nehmen.', 'Beide bleiben – sie stehen einfach nebeneinander.']] },
    { id: 'hn-teilbar', q: 'Robin macht {1/2} und {1/3} gleichnamig. Warum schneidet er beide in Sechstel?',
      ok: 'Halbe lassen sich in 3 Sechstel schneiden und Drittel in 2 Sechstel. 6 ist durch 2 und durch 3 teilbar.',
      bad: [['Weil 2 + 3 + 1 = 6 ist.', 'Das ist Zufall. Wichtig: 6 ist ein Vielfaches von 2 *und* von 3.'],
            ['Weil Sechstel die kleinsten Stücke sind.', 'Zwölftel wären noch kleiner und gingen auch. 6 ist der *kleinste* gemeinsame Nenner.']] },
    { id: 'zaehler-vergleich', q: 'Lea sagt: „{2/3} < {3/5}, weil 2 < 3.“ Was ist falsch daran?',
      ok: 'Drittel und Fünftel sind verschieden groß. Gleichnamig: {10/15} > {9/15} – also ist {2/3} größer.',
      bad: [['Nichts, Lea hat recht.', 'Mache gleichnamig: {2/3} = {10/15}, {3/5} = {9/15}.'],
            ['Man darf {2/3} und {3/5} gar nicht vergleichen.', 'Doch, das geht – mit einem gemeinsamen Nenner.']] }
  ];
  var BY = {}; BANK.forEach(function (b) { BY[b.id] = b; });
  var BY2 = {}; BANK2.forEach(function (b) { BY2[b.id] = b; BY[b.id] = b; });

  function build(p) {
    var b = BY[p.id], opts = [opt('ok', b.ok)].concat(b.bad.map(function (x, i) { return opt('b' + i, x[0]); }));
    opts = G.rot(opts, p.o || 0);
    var wr = {}; b.bad.forEach(function (x, i) { wr['b' + i] = { err: 'reason', msg: x[1] }; });
    return { skill: BY2[p.id] ? 'vgl_warum' : 'warum', prompt: '🤔 ' + b.q, answer: { type: 'choice', options: opts, long: true, correct: 'ok' },
      check: function (inp) { return checkChoice('ok', inp, wr); },
      hints: ['Lies jede Antwort genau. Welche erklärt wirklich *warum*?', 'Eine gute Begründung nennt den Grund, nicht nur das Ergebnis.', 'Stell es dir mit Pizza oder einem Messbecher vor.', 'Achte auf Wörter wie „gleich groß“, „geteilt durch“, „Ganzes“.'],
      solution: [b.ok] };
  }
  G.reg({ id: 'warum', skill: 'warum', tags: ['why', 'short'],
    params: function (level, R, want) { return { id: want && BY[want] ? want : R.pick(BANK).id, o: R.int(0, 2) }; },
    build: build });
  G.reg({ id: 'warum2', skill: 'vgl_warum', tags: ['why', 'short'],
    params: function (level, R, want) { return { id: want && BY2[want] ? want : R.pick(BANK2).id, o: R.int(0, 2) }; },
    build: build });

  root.BB.why = { BANK: BANK, BANK2: BANK2, byId: BY, make: function (id, rand) { return G.make(BY2[id] ? 'warum2' : 'warum', 1, { id: id, o: Math.floor((rand || Math.random)() * 3) }); } };
})(typeof window !== 'undefined' ? window : globalThis);
