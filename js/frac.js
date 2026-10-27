/*
 * frac.js — exact fraction arithmetic. Integers only, never floating point for equality.
 *
 *   var F = BB.frac;
 *   F.make(6, 8)            → {n: 6, d: 8}   (kept as given; use F.reduce for lowest terms)
 *   F.eq(F.make(2,4), F.make(1,2)) → true   (cross-multiplication)
 *   F.toMixed(F.make(9,4))  → {w: 2, n: 1, d: 4}
 *   F.fromMixed(2, 1, 4)    → {n: 9, d: 4}
 */
(function (root) {
  'use strict';

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function isInt(x) { return typeof x === 'number' && isFinite(x) && Math.floor(x) === x; }

  function make(n, d) {
    if (!isInt(n) || !isInt(d)) throw new Error('Bruch braucht ganze Zahlen: ' + n + '/' + d);
    if (d === 0) throw new Error('Nenner 0');
    if (d < 0) { n = -n; d = -d; }
    return { n: n, d: d };
  }
  function reduce(f) { var g = gcd(f.n, f.d) || 1; return make(f.n / g, f.d / g); }
  function eq(a, b) { return a.n * b.d === b.n * a.d; }
  function cmp(a, b) { var x = a.n * b.d - b.n * a.d; return x < 0 ? -1 : x > 0 ? 1 : 0; }
  function add(a, b) { return reduce(make(a.n * b.d + b.n * a.d, a.d * b.d)); }
  function sub(a, b) { return reduce(make(a.n * b.d - b.n * a.d, a.d * b.d)); }
  function mulInt(a, k) { return reduce(make(a.n * k, a.d)); }
  function divInt(a, k) { return reduce(make(a.n, a.d * k)); }
  function isLowest(f) { return gcd(f.n, f.d) === 1; }
  function isProper(f) { return Math.abs(f.n) < f.d; }        // echter Bruch: Zähler < Nenner
  function isWhole(f) { return f.n % f.d === 0; }              // natürliche Zahl (bei n ≥ 0)
  function value(f) { return f.n / f.d; }                      // only for display/sorting, never for equality

  // 9/4 → {w:2, n:1, d:4}; 8/4 → {w:2, n:0, d:4}; 3/4 → {w:0, n:3, d:4}
  function toMixed(f) { return { w: Math.floor(f.n / f.d), n: f.n % f.d, d: f.d }; }
  function fromMixed(w, n, d) { return make(w * d + n, d); }

  // integer times fraction must be whole: e.g. 3/4 of 1000 → 750 (else null)
  function ofInt(f, k) { var x = f.n * k; return x % f.d === 0 ? x / f.d : null; }

  // all divisors of n (n ≥ 1), ascending; common divisors of a and b
  function divisors(n) { n = Math.abs(n); var out = []; for (var i = 1; i <= n; i++) if (n % i === 0) out.push(i); return out; }
  function commonDivisors(a, b) { return divisors(gcd(a, b)); }
  function lcmAll(list) { return list.reduce(function (m, x) { return lcm(m, x); }, 1); }
  // expand by k / reduce by k, keeping the given form (no auto-reduction)
  function expand(f, k) { return make(f.n * k, f.d * k); }
  function shrink(f, k) { if (f.n % k || f.d % k) return null; return make(f.n / k, f.d / k); }
  function same(a, b) { return a.n === b.n && a.d === b.d; }                // same notation, not only same value

  function str(f) { return f.n + '/' + f.d; }
  function mixedStr(f) { var m = toMixed(f); return m.w ? (m.n ? m.w + ' ' + m.n + '/' + m.d : String(m.w)) : m.n + '/' + m.d; }

  // Parse what a child typed: "3/4", "2 1/4", "3", " 3 / 4 ". Returns a fraction or null.
  function parse(s) {
    s = String(s || '').trim().replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/');
    var m;
    if ((m = /^(\d+)$/.exec(s))) return make(+m[1], 1);
    if ((m = /^(\d+)\/(\d+)$/.exec(s))) return +m[2] ? make(+m[1], +m[2]) : null;
    if ((m = /^(\d+) (\d+)\/(\d+)$/.exec(s))) return +m[3] ? fromMixed(+m[1], +m[2], +m[3]) : null;
    return null;
  }

  root.BB = root.BB || {};
  root.BB.frac = { gcd: gcd, lcm: lcm, make: make, reduce: reduce, eq: eq, cmp: cmp, add: add, sub: sub, mulInt: mulInt, divInt: divInt,
                   isLowest: isLowest, isProper: isProper, isWhole: isWhole, value: value, toMixed: toMixed, fromMixed: fromMixed,
                   ofInt: ofInt, divisors: divisors, commonDivisors: commonDivisors, lcmAll: lcmAll, expand: expand, shrink: shrink, same: same, str: str, mixedStr: mixedStr, parse: parse };
})(typeof window !== 'undefined' ? window : globalThis);
