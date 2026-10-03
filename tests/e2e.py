"""
Bruch-Bobins in a real browser (headless Chromium): lessons, all practice modes, hints, misconception
feedback, picture/jug/workshop answers, Streifentafel, Prüfungstraining, Fehlertraining, coins, parent page,
phone layout; with --with-platform also the launch from Robin's Bobins and Nuka's guest start page.

  python3 tests/e2e.py <shots-dir> [--with-platform ../robins-bobins]
  (set BB_GUEST_PIN to also check the guest parent PIN)
"""
import http.server, threading, functools, os, sys, re
from playwright.sync_api import sync_playwright

args = [a for a in sys.argv[1:] if not a.startswith('--')]
OUT = args[0] if args else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots')
os.makedirs(OUT, exist_ok=True)
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
platform = '--with-platform' in sys.argv
ROOT = os.path.dirname(APP)                      # serve the parent: /bruch-bobins/ next to /robins-bobins/

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
threading.Thread(target=srv.serve_forever, daemon=True).start()
PORT = srv.server_address[1]
URL = 'http://127.0.0.1:%d/%s/index.html' % (PORT, os.path.basename(APP))
UNLOCK = "try { localStorage.setItem('rb:gate', 'c623d5d8fdd2353ef1861b66169370d4a168aeb62f94cf63e08da88cddb06639'); } catch (e) {}"
MOCK_SPEECH = """
  window.__spoken = [];
  (function () {
    var fake = { getVoices: function () { return [{ name: 'Anna', lang: 'de-DE', localService: true }]; }, speak: function (u) { window.__spoken.push(u.text); setTimeout(function () { u.onend && u.onend(); }, 5); }, cancel: function () {}, speaking: false, addEventListener: function () {} };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  })();
"""
passed, failed, errors = 0, 0, []
def check(cond, msg, info=''):
    global passed, failed
    if cond: passed += 1
    else: failed += 1; print('  FAIL', msg, ' → ', str(info)[:300])

def cur(pg):
    return pg.evaluate("""() => { const s = window.__bbTest && window.__bbTest(); if (!s) return null;
      const st = s.task.answer.type === 'steps' ? s.task.answer.steps[s.step].answer : s.task.answer;
      return { gen: s.task.gen, skill: s.task.skill, type: st.type, step: s.step, steps: s.steps, prompt: s.task.prompt, level: s.task.level }; }""")
def fill_right(pg):
    pg.evaluate("""() => { const s = window.__bbTest(); const st = s.task.answer.type === 'steps' ? s.task.answer.steps[s.step].answer : s.task.answer;
      s.widget.fill(BB.widgets.keyOf(st)); }""")
def fill_wrong(pg):
    pg.evaluate("""() => { const s = window.__bbTest(); const st = s.task.answer.type === 'steps' ? s.task.answer.steps[s.step].answer : s.task.answer;
      const k = BB.widgets.keyOf(st), w = JSON.parse(JSON.stringify(k));
      if (st.type === 'choice') { if (k.ids) w.ids = k.ids.slice(1); else w.id = st.options.find(o => o.id !== k.id).id; }
      else if ('n' in w && w.n != null) w.n = w.n + 1; else if ('w' in w && w.w != null) w.w = w.w + 1;
      else if ('x' in w) w.x = w.x + 1; else if ('ct' in w) w.ct = w.ct + 10; else if ('a' in w) w.a = w.a + 1;
      else if ('count' in w) w.count = w.count + 1; else if ('ml' in w) w.ml = w.ml + 50;
      s.widget.clearInput && s.widget.clearInput(); s.widget.fill(w); }""")
def solve(pg, how='right'):
    """Answer the current task (all steps). Returns the feedback class of the last check."""
    for _ in range(8):
        c = cur(pg)
        if not c: return 'done'
        if how == 'wrong-first':
            fill_wrong(pg); pg.click('.task .check'); pg.wait_for_timeout(120); how = 'right'
            pg.wait_for_timeout(950 if c['type'] == 'choice' else 50)
        fill_right(pg); pg.click('.task .check'); pg.wait_for_timeout(120)
        if pg.locator('.task .next').count(): return 'ok'
    return 'stuck'
def nxt(pg):
    if pg.locator('.task .next').count(): pg.click('.task .next'); pg.wait_for_timeout(150)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1200, 'height': 900})
    ctx.add_init_script(MOCK_SPEECH); ctx.add_init_script(UNLOCK)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.on('response', lambda r: r.status >= 400 and not (not platform and '/robins-bobins/' in r.url) and errors.append('HTTP %d %s' % (r.status, r.url)))

    # ---------------- home
    pg.goto(URL + '?child=lukas'); pg.wait_for_timeout(500)
    home = pg.inner_text('main')
    check('home greets Lukas', 'Hallo Lukas!' in home, home[:200])
    check('countdown to the 19th (Schulbeginn)', re.search(r'Noch \d+ Tage? bis zum Schulbeginn|Morgen ist|Heute ist', home) or '2026-10-19' < '2026-10-03', home[:300])
    check('8 learning modules A–H', pg.locator('.tile.module').count() == 8)
    for m in ['heute', 'ueben', 'schnell', 'sach', 'bild', 'pruefung', 'fehler', 'streifen', 'werkstatt']:
        check('menu entry ' + m, pg.locator('[data-menu=%s]' % m).count() >= 1)
    pg.screenshot(path=OUT + '/b01-home.png', full_page=True)

    # ---------------- lesson A, start to end
    pg.click('[data-module=A]'); pg.wait_for_timeout(300)
    check('lesson starts with an explanation and a picture', 'Erklärung'.upper() in pg.inner_text('.lesson').upper() and pg.locator('.lesson .pic').count() >= 1)
    pg.screenshot(path=OUT + '/b02-lesson.png', full_page=True)
    pg.click('.lesson .btn.primary'); pg.wait_for_timeout(150)
    check('Zähler and Nenner explained', 'Zähler' in pg.inner_text('.lesson') and 'Nenner' in pg.inner_text('.lesson'))
    pg.click('[aria-label="Aufgabe vorlesen"]'); pg.wait_for_timeout(100)
    spoken = pg.evaluate('window.__spoken.slice(-1)[0] || ""')
    check('read aloud: fractions are spoken as words', 'drei Viertel' in spoken, spoken)
    guided = False
    for i in range(30):
        if pg.locator('.lesson .btn.primary').count() and not pg.locator('.lesson .end-hero').count():
            pg.click('.lesson .btn.primary'); pg.wait_for_timeout(120); continue
        c = cur(pg)
        if c:
            if not guided:
                pg.wait_for_timeout(250)
                check('geführte Aufgabe shows the first Robin-Tipp at once', pg.locator('.hints .robin-says').count() == 1, pg.inner_text('.task')[:200])
                pg.screenshot(path=OUT + '/b03-guided.png', full_page=True); guided = True
            solve(pg); nxt(pg); continue
        if pg.locator('.lesson .end-hero').count(): break
    check('lesson A finished', pg.locator('.lesson .end-hero').count() == 1 and 'Modul geschafft' in pg.inner_text('main'))
    check('module coins (+3) once', '+3 Robin-Münzen' in pg.inner_text('main') if platform else True, pg.inner_text('main')[:300])
    check('module marked as done', pg.evaluate("BB.app.progress.moduleDone('A')"))
    pg.screenshot(path=OUT + '/b04-lesson-done.png', full_page=True)

    # ---------------- Heute üben: wrong-then-right, hints, solution, misconception messages
    pg.goto(URL + '?child=lukas#/'); pg.wait_for_timeout(300)
    pg.click('[data-menu=heute]'); pg.wait_for_timeout(300)
    n, kinds = 0, []
    for i in range(14):
        c = cur(pg)
        if not c: break
        n += 1; kinds.append(c['gen'])
        if n == 1:
            fill_wrong(pg); pg.click('.task .check'); pg.wait_for_timeout(150)
            fb = pg.inner_text('.feedback')
            check('wrong answer: explained, never just "falsch"', len(fb) > 25 and 'Versuch es noch einmal' in fb and 'Falsch' not in fb, fb)
            pg.screenshot(path=OUT + '/b05-wrong.png', full_page=True)
            pg.wait_for_timeout(950)
            fill_right(pg); pg.click('.task .check'); pg.wait_for_timeout(150)
            while not pg.locator('.task .next').count() and cur(pg): fill_right(pg); pg.click('.task .check'); pg.wait_for_timeout(120)
            check('corrected → "Gut verbessert"', 'verbessert' in pg.inner_text('.feedback'), pg.inner_text('.feedback'))
        elif n == 2:
            for h in range(4):
                pg.click('.task .help'); pg.wait_for_timeout(80)
            check('Hilf mir: 4 graduated tips', 'Robin-Tipp 4' in pg.inner_text('.hints') and 'Lösung ansehen' in pg.inner_text('.task .help'), pg.inner_text('.hints'))
            pg.screenshot(path=OUT + '/b06-hints.png', full_page=True)
            solve(pg)
        elif n == 3:
            for h in range(5):
                if pg.locator('.task .help:visible').count(): pg.click('.task .help'); pg.wait_for_timeout(60)
            check('after 4 tips the solution is shown', pg.locator('.fb-box.sol').count() == 1 and 'So geht es' in pg.inner_text('.feedback'), pg.inner_text('.feedback'))
            pg.screenshot(path=OUT + '/b07-solution.png', full_page=True)
        else:
            check('task %d solvable (%s)' % (n, c['gen']), solve(pg) == 'ok', c)
        nxt(pg)
    check('Heute üben: 10 tasks', n == 10, kinds)
    check('Heute üben: end screen', pg.locator('.end').count() == 1 and 'Geschafft für heute' in pg.inner_text('.end'))
    if platform:
        check('coins shown on the end screen', 'Robin-Münzen' in pg.inner_text('.end'), pg.inner_text('.end'))
    pg.screenshot(path=OUT + '/b08-end.png', full_page=True)
    log = pg.evaluate("BB.app.progress.doc.log.slice(-10).map(l => [l.first, l.corr, l.hint, l.sol])")
    check('learning history: corrected, hints and solution recorded', log[0][1] is True and log[1][2] == 4 and log[2][3] is True, log)

    # ---------------- specific misconception: 4/3 for 3 pizzas / 4 children
    pg.evaluate("""() => { const s = BB.session.create(BB.app.progress, {mode:'lernen', tasks:[{gen:'verteilen', level:1, params:{it:'pizza', a:3, b:4, pe:0}}]}); BB.practice.run(BB.app, s, {title:'T'}); }""")
    pg.wait_for_timeout(200)
    pg.evaluate("() => window.__bbTest().widget.fill({w:null, n:4, d:3})"); pg.click('.task .check'); pg.wait_for_timeout(120)
    fb = pg.inner_text('.feedback')
    check('4/3 → "Wir verteilen 3 Pizzen auf 4 … Dividend wird zum Zähler"', 'verteilen' in fb and 'Dividend wird zum Zähler' in fb, fb)
    pg.evaluate("() => window.__bbTest().widget.fill({w:null, n:6, d:8})"); pg.click('.task .check'); pg.wait_for_timeout(120)
    check('6/8 accepted, equal to 3/4', 'dasselbe' in pg.inner_text('.feedback') or 'gleich viel' in pg.inner_text('.feedback'), pg.inner_text('.feedback'))

    # ---------------- picture answer: tap pieces
    pg.evaluate("""() => { const s = BB.session.create(BB.app.progress, {mode:'lernen', tasks:[{gen:'zeichnen', level:2, params:{k:3, d:4, shape:'bar', kind:'schokolade', rows:2, cols:4}}]}); BB.practice.run(BB.app, s, {title:'T'}); }""")
    pg.wait_for_timeout(200)
    taps = pg.locator('.ans-shade .tap')
    check('8 pieces to tap', taps.count() == 8, taps.count())
    for i in range(3): taps.nth(i).click()
    pg.click('.task .check'); pg.wait_for_timeout(120)
    check('3 of 8 for 3/4 → explained (8 pieces, not 4)', 'nicht 4' in pg.inner_text('.feedback'), pg.inner_text('.feedback'))
    for i in range(3, 6): taps.nth(i).click()
    pg.click('.task .check'); pg.wait_for_timeout(120)
    check('6 of 8 pieces = 3/4 ✓', pg.locator('.fb-box.ok').count() == 1)
    pg.screenshot(path=OUT + '/b09-shade.png', full_page=True)

    # ---------------- measuring jug: drag + buttons
    pg.evaluate("""() => { const s = BB.session.create(BB.app.progress, {mode:'lernen', tasks:[{gen:'jug_mark', level:1, params:{n:3, d:4, ml:750, max:1000, step:100, as:'frac'}}]}); BB.practice.run(BB.app, s, {title:'T'}); }""")
    pg.wait_for_timeout(200)
    box = pg.locator('.ans-jug svg').bounding_box()
    pg.mouse.click(box['x'] + box['width'] * 0.4, box['y'] + box['height'] * 0.5); pg.wait_for_timeout(80)
    ml = pg.evaluate("window.__bbTest().widget.value().ml")
    check('tapping the jug sets a level', 300 <= ml <= 700, ml)
    while pg.evaluate("window.__bbTest().widget.value().ml") < 750: pg.click('.jug-plus')
    while pg.evaluate("window.__bbTest().widget.value().ml") > 750: pg.click('.jug-minus')
    pg.click('.task .check'); pg.wait_for_timeout(120)
    check('3/4 l = 750 ml marked ✓', pg.locator('.fb-box.ok').count() == 1, pg.inner_text('.feedback'))
    pg.screenshot(path=OUT + '/b10-jug.png', full_page=True)

    # ---------------- workshop: two fair ways, then the fraction
    pg.evaluate("""() => { const s = BB.session.create(BB.app.progress, {mode:'lernen', tasks:[{gen:'werkstatt', level:1, params:{it:'pizza', a:3, b:4, pe:0}}]}); BB.practice.run(BB.app, s, {title:'T'}); }""")
    pg.wait_for_timeout(200)
    check('workshop: not fair while uncut', 'Noch nicht' in pg.inner_text('.ws-status'))
    pg.click('.ws-quick >> text=in 4 Teile'); pg.wait_for_timeout(80)
    check('all in quarters → fair, 3 pieces each', 'Gerecht' in pg.inner_text('.ws-status') and '3 Stücke à' in pg.inner_text('.ws-kids'), pg.inner_text('.ws-kids'))
    plus = pg.locator('.ws-item').nth(0).locator('button[aria-label="weniger Teile"]')
    plus.click(); plus.click()
    pg.locator('.ws-item').nth(1).locator('button[aria-label="weniger Teile"]').click(); pg.locator('.ws-item').nth(1).locator('button[aria-label="weniger Teile"]').click()
    pg.wait_for_timeout(80)
    st = pg.inner_text('.ws-status'); kids = pg.inner_text('.ws-kids')
    check('two halves + quarters → also fair: ½ + ¼ each, 2 ways found', 'Gerecht' in st and '2 verschiedene Wege' in st and 'à' in kids, (st, kids))
    pg.screenshot(path=OUT + '/b11-workshop.png', full_page=True)
    pg.evaluate("() => window.__bbTest().widget.fill({w:null, n:3, d:4})"); pg.click('.task .check'); pg.wait_for_timeout(120)
    check('workshop answer 3/4 ✓', pg.locator('.fb-box.ok').count() == 1)

    # ---------------- unit chain 3 kg : 4
    pg.evaluate("""() => { const s = BB.session.create(BB.app.progress, {mode:'lernen', tasks:[{gen:'einheit_teilen', level:2, params:{u:'kg', Q:3, k:4, story:0}}]}); BB.practice.run(BB.app, s, {title:'T'}); }""")
    pg.wait_for_timeout(200)
    pg.fill('.step input', '300'); pg.click('.task .check'); pg.wait_for_timeout(100)
    check('3 kg = 300 g → unit explained', '1000' in pg.inner_text('.feedback'), pg.inner_text('.feedback'))
    pg.fill('.step input', '3000'); pg.click('.task .check'); pg.wait_for_timeout(100)
    pg.locator('.step').nth(1).locator('input').fill('750'); pg.click('.task .check'); pg.wait_for_timeout(100)
    pg.locator('.step').nth(2).locator('.nbox-n').fill('3'); pg.locator('.step').nth(2).locator('.nbox-d').fill('4'); pg.click('.task .check'); pg.wait_for_timeout(120)
    check('3000 g : 4 = 750 g = 3/4 kg, step by step', pg.locator('.fb-box.ok').count() == 1 and pg.locator('.step-ok').count() == 2, pg.inner_text('.task')[:300])
    pg.screenshot(path=OUT + '/b12-units.png', full_page=True)

    # ---------------- Streifentafel
    pg.goto(URL + '?child=lukas#/streifen'); pg.wait_for_timeout(300)
    bar = pg.locator('.st-row').nth(0).locator('svg').bounding_box()
    pg.mouse.click(bar['x'] + bar['width'] * 0.5, bar['y'] + bar['height'] * 0.4); pg.wait_for_timeout(120)
    info = pg.inner_text('.st-info')
    check('Streifentafel: 1/2 = 2/4 = 3/6 = 4/8 …', pg.locator('.st-line:visible').count() == 1 and pg.locator('.st-row.match').count() == 6 and 'gleich viel' in info, info)
    pg.screenshot(path=OUT + '/b13-strips.png', full_page=True)

    # ---------------- Prüfungstraining: no help, results, Fehler verbessern
    pg.goto(URL + '?child=lukas#/'); pg.wait_for_timeout(200)
    pg.click('[data-menu=pruefung]'); pg.wait_for_timeout(300)
    check('exam: no help buttons', pg.locator('.task .help').count() == 0 and pg.locator('text=Streifentafel').count() == 0)
    cnt = 0
    for i in range(40):
        c = cur(pg)
        if not c: break
        cnt += 1 if c['step'] == 0 else 0
        if cnt <= 2: fill_wrong(pg)
        else: fill_right(pg)
        pg.click('.task .check'); pg.wait_for_timeout(120)
        check('exam: no feedback during the test', pg.locator('.fb-box').count() == 0)
    ee = pg.inner_text('.exam-end')
    check('exam: 12 tasks, result list, 10 right', cnt == 12 and '10 von 12' in ee, ee[:200])
    pg.screenshot(path=OUT + '/b14-exam.png', full_page=True)
    pg.click('text=Fehler verbessern'); pg.wait_for_timeout(250)
    fixed = 0
    for i in range(4):
        if not cur(pg): break
        solve(pg); nxt(pg); fixed += 1
    check('Fehler verbessern: the 2 wrong exam tasks again', fixed == 2, fixed)

    # ---------------- Fehlertraining: from earlier mistakes, exact task first
    pg.goto(URL + '?child=lukas#/'); pg.wait_for_timeout(200)
    first_wrong = pg.evaluate("BB.app.progress.doc.wrong.slice(-1)[0].gen")
    pg.click('[data-menu=fehler]'); pg.wait_for_timeout(250)
    c = cur(pg)
    check('Fehlertraining starts with the most recent mistake', c and c['gen'] == first_wrong, (c, first_wrong))

    # ---------------- Schnelltraining with optional stopwatch
    pg.goto(URL + '?child=lukas#/schnell'); pg.wait_for_timeout(200)
    pg.click('[data-menu=schnell-mit]'); pg.wait_for_timeout(700)
    check('Schnelltraining: stopwatch on request', pg.locator('.run-clock:visible').count() == 1 and '0:0' in pg.inner_text('.run-clock'))
    k = 0
    while cur(pg) and k < 12:
        check('Schnelltraining: short tasks only', cur(pg)['type'] not in ('share', 'jug') and cur(pg)['steps'] == 1, cur(pg)); solve(pg); nxt(pg); k += 1
    check('Schnelltraining: 8 tasks + time on the end screen', k == 8 and '⏱️' in pg.inner_text('.end'), (k, pg.inner_text('.end')[:200]))

    # ---------------- Üben by topic, Bild, Sach
    pg.goto(URL + '?child=lukas#/ueben'); pg.wait_for_timeout(200)
    check('Üben: every skill listed with its state', pg.locator('.list-item.skill').count() == 16)
    pg.click('[data-skill=g2u]'); pg.wait_for_timeout(200)
    check('skill round: g2u tasks', cur(pg)['skill'] == 'g2u')
    for mode, tag in [('bild', 'visual'), ('sach', 'world')]:
        pg.goto(URL + '?child=lukas#/start/' + mode); pg.wait_for_timeout(250)
        ok_all, j = True, 0
        while cur(pg) and j < 10:
            g = cur(pg)['gen']; tags = pg.evaluate("g => BB.gens.byId[g].tags", g)
            if tag not in tags and g != 'warum': ok_all = False
            solve(pg); nxt(pg); j += 1
        check(mode + ': only ' + tag + ' tasks, round completes', ok_all and pg.locator('.end').count() == 1, j)

    # ---------------- parent page
    pg.goto(URL + '?child=lukas#/eltern'); pg.wait_for_timeout(300)
    if pg.locator('.pin-screen').count():
        check('parent area behind the family PIN', True)
    else:
        txt = pg.inner_text('main')
        check('parent: overview numbers', 'Übungszeit' in txt and 'gleich richtig' in txt and 'selbst verbessert' in txt and 'Tage in Folge' in txt, txt[:300])
        check('parent: mastery per topic', pg.locator('.mrow').count() == 16 and ('braucht Übung' in txt or 'weitgehend' in txt or 'noch wenig' in txt))
        check('parent: countdown setting (date + label)', pg.locator('input[type=date]').input_value() == '2026-10-19')
        pg.screenshot(path=OUT + '/b15-parent.png', full_page=True)

    # ---------------- Robin's Bobins: card for Lukas, coins and activity in the family
    if platform:
        def unhide(route):
            body = route.fetch().text()
            route.fulfill(body=body.replace("hidden: true                 // until chrismdooley.github.io/bruch-bobins/", "hidden: false                // until"), content_type='application/javascript')
        pg.route('**/robins-bobins/apps/registry.js', unhide)
        pg.goto('http://127.0.0.1:%d/robins-bobins/index.html#/c/lukas' % PORT); pg.wait_for_timeout(500)
        card = pg.locator('.app-card[data-app=bruch]')
        check("Robin's Bobins shows the Bruch-Bobins card for Lukas", card.count() == 1)
        check('card line from rb-card.js', 'Tage' in card.inner_text() or 'Aufgaben' in card.inner_text(), card.inner_text())
        pg.screenshot(path=OUT + '/b00-rb-home.png')
        card.click(); pg.wait_for_timeout(600)
        check('card opens Bruch-Bobins for Lukas', '/bruch-bobins/' in pg.url and 'child=lukas' in pg.url and 'Hallo Lukas' in pg.inner_text('body'), pg.url)
        coins = pg.evaluate("RB.coins.list('lukas').filter(c => c.app === 'bruch').map(c => [c.amount, c.reason])")
        check('Robin-Münzen on the family balance (app "bruch")', len(coins) >= 5 and all(a > 0 for a, _ in coins), coins)
        check('Heute bonus and module bonus recorded', any(r == 'Heute geübt' for _, r in coins) and any('Modul A' in r for _, r in coins), coins)
        acts = pg.evaluate("RB.activity.list('lukas').filter(a => a.app === 'bruch').length")
        check('finished rounds count for the family streak', acts >= 5, acts)
        bk = pg.evaluate("Object.keys(RB.backup.exportAll().data)")
        check('family backup includes Bruch-Bobins progress', 'bruch-bobins:lukas' in bk, bk)

        # ---- guest (Nuka): start page with both apps, no family PIN
        cg = b.new_context(viewport={'width': 1100, 'height': 900}); cg.add_init_script(MOCK_SPEECH)
        gp = cg.new_page(); gp.on('pageerror', lambda e: errors.append('guest pageerror: ' + str(e)))
        def unhide_guest(route):
            body = route.fetch().text()
            route.fulfill(body=body.replace("hidden: true }   // hidden until", "hidden: false }   // hidden until"), content_type='application/javascript')
        gp.route('**/robins-bobins/shared/guest.js', unhide_guest)
        gp.goto('http://127.0.0.1:%d/robins-bobins/gast/?name=Nuka' % PORT); gp.wait_for_timeout(500)
        check('guest start: Nuka, no family PIN', gp.locator('#rb-gate').count() == 0 and 'Hallo Nuka!' in gp.inner_text('h1'))
        check('guest start: Europa-Trainer and Bruch-Bobins', gp.locator('.app-card[data-app=europa]').count() == 1 and gp.locator('.app-card[data-app=bruch]').count() == 1)
        gp.screenshot(path=OUT + '/b16-guest-start.png')
        gp.click('.app-card[data-app=bruch]'); gp.wait_for_timeout(600)
        check('guest: Bruch-Bobins as Nuka with "‹ Start"', 'Hallo Nuka!' in gp.inner_text('h1') and gp.inner_text('#apps-link').strip() == '‹ Start' and gp.evaluate("!(window.RB && RB.child)"))
        gp.click('[data-menu=heute]'); gp.wait_for_timeout(300)
        j = 0
        while cur(gp) and j < 14: solve(gp); nxt(gp); j += 1
        coins = int(gp.inner_text('#coins'))
        check('guest: coins in the guest total', coins >= 10 and gp.evaluate("RBGuest.coins.balance()") == coins, coins)
        check('guest: progress stored under the guest', gp.evaluate("!!localStorage.getItem('bruch-bobins:gast-nuka') && !localStorage.getItem('bruch-bobins:lukas')"))
        gp.click('#apps-link'); gp.wait_for_timeout(500)
        check('guest: back on the start page, coins shown', '/robins-bobins/gast/' in gp.url and gp.inner_text('#coins').strip() == str(coins), gp.url)
        gp.goto(URL + '#/eltern'); gp.wait_for_timeout(300)
        check('guest: own parent PIN asked', gp.locator('.pin-screen').count() == 1 and 'Robin' not in gp.inner_text('.pin-screen'))
        if os.environ.get('BB_GUEST_PIN'):
            gp.fill('.pin-screen input', os.environ['BB_GUEST_PIN']); gp.keyboard.press('Enter'); gp.wait_for_timeout(300)
            check('guest: parent page opens with the guest PIN', 'Nuka' in gp.inner_text('main'))
        cg.close()

    # ---------------- phone + tablet
    for name, vp in [('phone', {'width': 390, 'height': 844}), ('tablet', {'width': 820, 'height': 1180})]:
        c2 = b.new_context(viewport=vp, has_touch=True, is_mobile=name == 'phone')
        c2.add_init_script(MOCK_SPEECH); c2.add_init_script(UNLOCK)
        ph = c2.new_page(); ph.on('pageerror', lambda e: errors.append(name + ' pageerror: ' + str(e)))
        for route in ['', 'streifen', 'werkstatt', 'lernen/D', 'ueben']:
            ph.goto(URL + '?child=lukas#/' + route); ph.wait_for_timeout(300)
            check('%s: no sideways scrolling (%s)' % (name, route or 'home'), ph.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'))
        ph.screenshot(path=OUT + '/b17-%s-lesson.png' % name, full_page=True)
        for g in ['werkstatt', 'jug_read', 'gemischt_bild', 'einkauf', 'erkennen_wahl']:
            ph.evaluate("""g => { const s = BB.session.create(BB.app.progress, {mode:'lernen', tasks:[{gen:g, level:2}]}); BB.practice.run(BB.app, s, {title:'T'}); }""", g)
            ph.wait_for_timeout(200)
            check('%s: no sideways scrolling (%s)' % (name, g), ph.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'))
            if g == 'werkstatt': ph.screenshot(path=OUT + '/b18-%s-workshop.png' % name, full_page=True)
            check('%s: %s solvable' % (name, g), solve(ph) == 'ok')
        c2.close()

    b.close()
for e in errors: print('  ERROR', e)
failed += len(errors)
print('\n%d passed, %d failed' % (passed, failed))
sys.exit(1 if failed else 0)
