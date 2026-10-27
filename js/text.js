/*
 * text.js — German words for numbers and fractions, and the little markup used in all task texts.
 *
 * Markup (task texts are plain strings, rendered by BB.text.rich, read aloud via BB.text.say):
 *   {3/4}      a fraction, shown stacked            → "drei Viertel"
 *   {2 1/4}    a mixed number                       → "zwei ein Viertel"
 *   [3 kg]     an important number/unit (highlight) → "3 Kilogramm"
 *   *Wort*     bold
 *   3 : 4      division                             → "3 geteilt durch 4"
 *   {2 · 4/3 · 4}  a fraction with a calculation in Zähler and Nenner (Erweitern/Kürzen), shown stacked
 *   <  >       "ist kleiner als" / "ist größer als" when read aloud
 */
(function (root) {
  'use strict';

  var ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
              'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  var TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

  // Cardinal number word (0 … 9999). word(1) = 'eins'; use article() for "ein/eine".
  function word(n) {
    if (n < 20) return ONES[n];
    if (n < 100) { var o = n % 10, t = TENS[Math.floor(n / 10)]; return o ? (o === 1 ? 'ein' : ONES[o]) + 'und' + t : t; }
    if (n < 1000) { var h = Math.floor(n / 100), r = n % 100; return (h === 1 ? 'ein' : ONES[h]) + 'hundert' + (r ? word(r) : ''); }
    var th = Math.floor(n / 1000), rr = n % 1000;
    return (th === 1 ? 'ein' : word(th)) + 'tausend' + (rr ? word(rr) : '');
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  // "ein Kind / eine Pizza / drei Pizzen" — g = 'm' | 'f' | 'n'
  function count(n, g) { return n === 1 ? (g === 'f' ? 'eine' : 'ein') : word(n); }
  // accusative: "teilen sich einen Apfel / eine Pizza / ein Brötchen"
  function countAcc(n, g) { return n === 1 ? (g === 'f' ? 'eine' : g === 'm' ? 'einen' : 'ein') : word(n); }

  // Denominator noun: 2 → 'Halbe', 3 → 'Drittel', 4 → 'Viertel', 20 → 'Zwanzigstel', 100 → 'Hundertstel'
  function denomWord(d) {
    if (d === 2) return 'Halbe';
    if (d === 3) return 'Drittel';
    if (d === 7) return 'Siebtel';
    if (d === 8) return 'Achtel';
    if (d === 16) return 'Sechzehntel';
    if (d === 17) return 'Siebzehntel';
    if (d < 20) return cap(word(d)) + 'tel';
    if (d === 100) return 'Hundertstel';
    if (d === 1000) return 'Tausendstel';
    return cap(word(d)) + 'stel';
  }
  // "drei Viertel", "ein halb", "ein Drittel", "fünf Halbe"
  function fracWords(n, d) {
    if (d === 1) return word(n);
    if (d === 2 && n === 1) return 'ein halb';
    return (n === 1 ? 'ein' : word(n)) + ' ' + denomWord(d);
  }
  function mixedWords(w, n, d) { return n ? word(w) + ' ' + fracWords(n, d) : word(w); }
  // "Viertel-Streifen", "Halbe-Streifen"
  function stripName(d) { return denomWord(d) + '-Streifen'; }

  var UNIT_SAY = { 'kg': 'Kilogramm', 'g': 'Gramm', 'l': 'Liter', 'ml': 'Milliliter', 'km': 'Kilometer', 'm': 'Meter', 'cm': 'Zentimeter',
                   '€': 'Euro', 'ct': 'Cent', 'h': 'Stunden', 'min': 'Minuten', 'Pfd.': 'Pfund' };

  // Text for the speech engine.
  function opWord(o) { return o === '·' ? ' mal ' : ' geteilt durch '; }
  function say(s) {
    return String(s)
      .replace(/\{(\d+) ([·:]) (\d+)\/(\d+) ([·:]) (\d+)\}/g, function (_, a, o, k, b, o2, k2) { return 'Zähler ' + a + opWord(o) + k + ', Nenner ' + b + opWord(o2) + k2 + ','; })
      .replace(/\{(\d+) (\d+)\/(\d+)\}/g, function (_, w, n, d) { return mixedWords(+w, +n, +d); })
      .replace(/\{(\d+)\/(\d+)\}/g, function (_, n, d) { return fracWords(+n, +d); })
      .replace(/[\[\]*]/g, '')
      .replace(/(\d)\s*:\s*(\d)/g, '$1 geteilt durch $2')
      .replace(/(\d)\s*·\s*(\d)/g, '$1 mal $2')
      .replace(/\s<\s/g, ' ist kleiner als ').replace(/\s>\s/g, ' ist größer als ').replace(/\s▢\s/g, ' … ')
      .replace(/(\d+(?:,\d+)?)\s*(kg|ml|km|cm|ct|min|Pfd\.|g|l|m|€|h)(?![a-zäöüß])/g, function (_, x, u) { return x + ' ' + UNIT_SAY[u]; })
      .replace(/(Viertel|Halbe|Drittel|tel|stel|halb)\s*(kg|ml|km|cm|ct|min|g|l|m|€|h)(?![a-zäöüß])/g, function (_, x, u) { return x + ' ' + UNIT_SAY[u]; })
      .replace(/\s+/g, ' ').trim();
  }

  // Stacked fraction element.
  function fracEl(n, d, w) {
    var doc = root.document, wrap = doc.createElement('span');
    wrap.className = 'fr' + (w ? ' fr-mixed' : '');
    if (w) { var we = doc.createElement('span'); we.className = 'fr-w'; we.textContent = w; wrap.appendChild(we); }
    var st = doc.createElement('span'); st.className = 'fr-st';
    var a = doc.createElement('span'); a.className = 'fr-n'; a.textContent = n;
    var b = doc.createElement('span'); b.className = 'fr-d'; b.textContent = d;
    st.appendChild(a); st.appendChild(b); wrap.appendChild(st);
    wrap.setAttribute('aria-label', w ? mixedWords(+w, +n, +d) : isNaN(+n) || isNaN(+d) ? n + ' durch ' + d : fracWords(+n, +d));
    if (isNaN(+n) || isNaN(+d)) wrap.className += ' fr-calc';
    return wrap;
  }

  // Render markup into a DOM fragment (all text escaped — built with text nodes only).
  function rich(s, into) {
    var doc = root.document, frag = into || doc.createDocumentFragment();
    var re = /\{(\d+ [·:] \d+)\/(\d+ [·:] \d+)\}|\{(\d+) (\d+)\/(\d+)\}|\{(\d+)\/(\d+)\}|\[([^\]]+)\]|\*([^*]+)\*/g, last = 0, m;
    s = String(s);
    while ((m = re.exec(s))) {
      if (m.index > last) frag.appendChild(doc.createTextNode(s.slice(last, m.index)));
      if (m[1]) frag.appendChild(fracEl(m[1], m[2]));
      else if (m[3]) frag.appendChild(fracEl(m[4], m[5], m[3]));
      else if (m[6]) frag.appendChild(fracEl(m[6], m[7]));
      else if (m[8]) { var q = doc.createElement('span'); q.className = 'qty'; rich(m[8], q); frag.appendChild(q); }
      else { var b = doc.createElement('b'); rich(m[9], b); frag.appendChild(b); }
      last = re.lastIndex;
    }
    if (last < s.length) frag.appendChild(doc.createTextNode(s.slice(last)));
    return frag;
  }
  // Markup for a fraction value {n/d} or mixed {w n/d} (mixed=true shows improper fractions as mixed numbers)
  function fm(f, mixed) {
    if (f.d === 1) return String(f.n);
    if (mixed && f.n >= f.d) { var w = Math.floor(f.n / f.d), r = f.n % f.d; return r ? '{' + w + ' ' + r + '/' + f.d + '}' : String(w); }
    return '{' + f.n + '/' + f.d + '}';
  }
  // 1234 → "1234", money: 125 ct → "1,25 €"
  function euro(ct) { var e = Math.floor(ct / 100), c = ct % 100; return c ? e + ',' + (c < 10 ? '0' : '') + c + ' €' : e + ' €'; }
  // {2 · 4/3 · 4}: the calculation stacked like a fraction
  function fx(n, op, k, d) { return '{' + n + ' ' + op + ' ' + k + '/' + d + ' ' + op + ' ' + k + '}'; }
  function plain(s) { return String(s).replace(/\{(\d+ [·:] \d+)\/(\d+ [·:] \d+)\}/g, '($1)/($2)').replace(/\{(\d+) (\d+)\/(\d+)\}/g, '$1 $2/$3').replace(/\{(\d+)\/(\d+)\}/g, '$1/$2').replace(/[\[\]*]/g, ''); }

  root.BB = root.BB || {};
  root.BB.text = { word: word, count: count, countAcc: countAcc, cap: cap, denomWord: denomWord, fracWords: fracWords, mixedWords: mixedWords, stripName: stripName,
                   say: say, rich: rich, fracEl: fracEl, fm: fm, fx: fx, euro: euro, plain: plain };
})(typeof window !== 'undefined' ? window : globalThis);
